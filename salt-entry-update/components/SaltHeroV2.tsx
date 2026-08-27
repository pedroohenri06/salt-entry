'use client';

import { useEffect, useRef, useState } from 'react';
import { VERT_SRC, FRAG_SRC } from '@/lib/heroShaders';
import { LINKS, track } from '@/config/links';
import styles from './SaltHeroV2.module.css';

/* Salt hero v3 — WebGL domain-warped background (data traces + tech grid +
   far plane added on top of the v2 motion), silver-sweep + mouse-reactive
   glint headline, and a mobile track that gets its own gyro/touch-driven
   parallax instead of a scaled-down copy of the desktop interaction. */

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

export default function SaltHeroV2() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const [glOk, setGlOk] = useState(true);

  useEffect(() => { track('entry_view'); }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (!gl) {
      setGlOk(false);
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uOct = gl.getUniformLocation(prog, 'u_octaves');
    const uTouch = gl.getUniformLocation(prog, 'u_touch');
    const uScroll = gl.getUniformLocation(prog, 'u_scroll');

    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    let isSmall = false;

    // ---- parallax source: pointer on desktop, gyro (+ idle drift fallback
    // while no gyro data has arrived yet) on touch devices ----
    const mouse = { x: 0, y: 0 };
    const mouseTarget = { x: 0, y: 0 };
    let gyroActive = false;

    // ---- touch light bloom: decays after each touch, never follows the
    // finger continuously (that would read as a cursor, not a reaction) ----
    const touch = { x: 0, y: 0, strength: 0 };

    // ---- scroll dolly ----
    let scroll = 0;
    let scrollTarget = 0;

    function resize() {
      isSmall = window.innerWidth < 720;
      const scale = isSmall ? 0.62 : 0.85;
      const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.3 : 1.7) * scale;
      const w = Math.max(1, Math.floor(window.innerWidth * dpr));
      const h = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        gl!.viewport(0, 0, w, h);
      }
    }
    resize();
    window.addEventListener('resize', resize);

    function onPointerMove(e: PointerEvent) {
      mouseTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseTarget.y = (e.clientY / window.innerHeight - 0.5) * -2;
    }
    if (!isTouch && !reduceMotion) window.addEventListener('pointermove', onPointerMove);

    // ---- gyroscope (mobile only): tiny, heavily smoothed tilt ----
    function onOrientation(e: DeviceOrientationEvent) {
      if (e.beta === null || e.gamma === null) return;
      gyroActive = true;
      const gamma = Math.max(-24, Math.min(24, e.gamma)) / 24; // left/right
      const beta = Math.max(-14, Math.min(28, e.beta - 6)) / 24; // front/back, biased for hand-held tilt
      mouseTarget.x = gamma;
      mouseTarget.y = -beta;
    }

    let removeOrientation: (() => void) | null = null;
    if (isTouch && !reduceMotion && typeof DeviceOrientationEvent !== 'undefined') {
      const DOE = DeviceOrientationEvent as DeviceOrientationEventWithPermission;
      if (typeof DOE.requestPermission === 'function') {
        // iOS: permission needs a user gesture. Piggyback on the first tap
        // anywhere, no extra UI/button added for it.
        const grant = () => {
          DOE.requestPermission!()
            .then((state) => {
              if (state === 'granted') {
                window.addEventListener('deviceorientation', onOrientation);
                removeOrientation = () => window.removeEventListener('deviceorientation', onOrientation);
              }
            })
            .catch(() => {});
          window.removeEventListener('touchend', grant);
        };
        window.addEventListener('touchend', grant, { once: true });
      } else {
        window.addEventListener('deviceorientation', onOrientation);
        removeOrientation = () => window.removeEventListener('deviceorientation', onOrientation);
      }
    }

    // ---- touch response: a soft bloom that fades on its own ----
    function onTouch(e: TouchEvent) {
      const p = e.touches[0];
      if (!p) return;
      touch.x = (p.clientX / window.innerWidth - 0.5) * 2;
      touch.y = (p.clientY / window.innerHeight - 0.5) * -2;
      touch.strength = 1.0;
    }
    if (isTouch && !reduceMotion) {
      window.addEventListener('touchstart', onTouch, { passive: true });
      window.addEventListener('touchmove', onTouch, { passive: true });
    }

    // ---- scroll: normalized against a short range, so even the small
    // rubber-band bounce on mobile reads as a gentle camera push-in ----
    function onScroll() {
      scrollTarget = Math.max(0, Math.min(1, window.scrollY / 320));
    }
    if (!reduceMotion) window.addEventListener('scroll', onScroll, { passive: true });

    const headline = headlineRef.current;
    const glow = glowRef.current;
    const heroContent = heroContentRef.current;

    let start: number | null = null;
    let frozen = 0;
    let raf = 0;
    let idleSeed = Math.random() * 100;

    function frame(ts: number) {
      if (start === null) start = ts;
      const elapsed = reduceMotion ? 0 : (ts - start) / 1000;

      // idle autonomous drift for touch devices with no gyro signal yet —
      // keeps mobile alive instead of a static frozen background
      if (isTouch && !gyroActive && !reduceMotion) {
        mouseTarget.x = Math.sin(elapsed * 0.13 + idleSeed) * 0.32;
        mouseTarget.y = Math.cos(elapsed * 0.1 + idleSeed) * 0.22;
      }

      mouse.x += (mouseTarget.x - mouse.x) * (isTouch ? 0.03 : 0.045);
      mouse.y += (mouseTarget.y - mouse.y) * (isTouch ? 0.03 : 0.045);
      scroll += (scrollTarget - scroll) * 0.06;
      touch.strength *= 0.93;

      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uTime, elapsed);
      gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.uniform1f(uOct, isSmall ? 3.0 : 5.0);
      gl!.uniform3f(uTouch, touch.x, touch.y, touch.strength);
      gl!.uniform1f(uScroll, scroll);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);

      // cursor glow (desktop) — one shared loop instead of a second RAF
      if (glow && !isTouch && !reduceMotion) {
        glow.style.transform = `translate(${(mouse.x * 0.5 + 0.5) * window.innerWidth}px, ${(0.5 - mouse.y * 0.5) * window.innerHeight}px)`;
      }

      // headline: subtle physical tilt + a mouse/gyro-reactive glint
      // position, layered on top of the automatic silver sweep so the
      // reflection answers both time (ambient) and viewer position (real).
      if (headline && !reduceMotion) {
        headline.style.setProperty('--tiltx', (mouse.x * 3).toFixed(2) + 'deg');
        headline.style.setProperty('--tilty', (mouse.y * -2.4).toFixed(2) + 'deg');
        headline.style.setProperty('--gx', (50 + mouse.x * 38).toFixed(1) + '%');
        headline.style.setProperty('--gy', (46 - mouse.y * 30).toFixed(1) + '%');
      }

      if (heroContent && !reduceMotion) {
        heroContent.style.transform = `translateY(${(-scroll * 14).toFixed(2)}px)`;
      }

      if (!reduceMotion || frozen < 2) {
        if (reduceMotion) frozen++;
        raf = requestAnimationFrame(frame);
      }
    }
    raf = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('scroll', onScroll);
      if (removeOrientation) removeOrientation();
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const glow = glowRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (!glow || isTouch || reduceMotion) return;
    function onPointerMove() { glow!.classList.add(styles.active); }
    window.addEventListener('pointermove', onPointerMove, { once: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, []);

  function handleCtaClick(href: string, event: 'commercial_click' | 'website_click') {
    track(event);
  }

  return (
    <div className={styles.heroRoot}>
      {glOk ? (
        <canvas ref={canvasRef} className={styles.canvas} />
      ) : (
        <div className={styles.bgFallback} />
      )}
      <div className={styles.grain} />
      <div className={styles.vignette} />
      <div ref={glowRef} className={styles.cursorGlow} />

      <nav className={`${styles.nav} ${styles.reveal} ${styles.r1}`}>
        <span className={styles.brandLabel}>Technology Company</span>
        <a
          className={styles.navCta}
          href={LINKS.commercialUrl}
          target="_blank"
          rel="noopener"
          onClick={() => handleCtaClick(LINKS.commercialUrl, 'commercial_click')}
        >
          Iniciar projeto
        </a>
      </nav>

      <main className={styles.heroMain}>
        <div className={styles.heroContent} ref={heroContentRef}>
          <p className={`${styles.eyebrow} ${styles.reveal} ${styles.r2}`}>
            Tecnologia. Branding. Performance.
          </p>
          <div
            className={`${styles.headlineWrap} ${styles.reveal} ${styles.r3}`}
            ref={headlineRef}
          >
            <h1 className={styles.h1}>
              Construímos experiências que <em>movem</em> negócios.
            </h1>
            <h1 className={styles.headlineSweep} aria-hidden="true">
              Construímos experiências que <em>movem</em> negócios.
            </h1>
            <h1 className={styles.headlineGlint} aria-hidden="true">
              Construímos experiências que <em>movem</em> negócios.
            </h1>
          </div>
          <p className={`${styles.subhead} ${styles.reveal} ${styles.r4}`}>
            Websites, e-commerce e produtos digitais desenvolvidos para marcas
            que querem liderar seus mercados.
          </p>
          <a
            className={`${styles.cta} ${styles.reveal} ${styles.r5}`}
            href={LINKS.websiteUrl}
            target="_blank"
            rel="noopener"
            onClick={() => handleCtaClick(LINKS.websiteUrl, 'website_click')}
          >
            Conheça nosso trabalho
            <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 8H13M13 8L9 4M13 8L9 12"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>
      </main>

      <div className={`${styles.signature} ${styles.reveal} ${styles.r5}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/made-by-salt.png" alt="Made by Salt" />
      </div>
    </div>
  );
}
