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

// Piecewise-linear interpolation between [t, value] control points, t in
// [0,1]. The whole materialization sequence is driven this way, off the
// SAME rAF clock as the shader/tilt/glint, rather than native CSS/SMIL
// animation timelines -- deliberate, not incidental: it's what let this
// choreography actually be verified frame-by-frame while building it.
function interp(t: number, stops: Array<[number, number]>): number {
  if (t <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, v0] = stops[i - 1];
      const [t1, v1] = stops[i];
      const f = (t - t0) / (t1 - t0 || 1);
      return v0 + (v1 - v0) * f;
    }
  }
  return stops[stops.length - 1][1];
}

const MATERIALIZE_DUR = 1.3;
const MATERIALIZE_DELAY = 0.05;
const RADIUS_STOPS: Array<[number, number]> = [[0, 0], [0.22, 2], [0.55, 36], [0.8, 88], [1, 148]];
const BLUR_STOPS: Array<[number, number]> = [[0, 16], [0.22, 15], [0.55, 6], [0.8, 1.5], [1, 0]];
const SCALE_STOPS: Array<[number, number]> = [[0, 60], [0.3, 56], [0.8, 3], [1, 0.55]];
const FREQ_STOPS: Array<[number, number]> = [[0, 0.9], [0.3, 0.88], [0.8, 0.05], [1, 0.014]];
const DRAW_DUR = 0.9;
const LINE_OPACITY_STOPS: Array<[number, number]> = [[0, 0], [0.2, 1], [0.55, 0.62], [1, 0]];
const LINE_OFFSET_STOPS: Array<[number, number]> = [[0, 1], [0.55, 0], [1, 0]];
const DOT_OPACITY_STOPS: Array<[number, number]> = [[0, 0], [0.3, 1], [0.55, 0.63], [1, 0]];
const DOT_SCALE_STOPS: Array<[number, number]> = [[0, 0], [0.3, 1.4], [0.55, 1], [1, 1]];
const LINE_PEAK: Record<string, number> = { line: 0.32, tick: 0.3, diag: 0.24 };
const LINE_LEN: Record<string, number> = { line: 100, tick: 48, diag: 60 };

type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

export default function SaltHeroV2() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const feDispRef = useRef<SVGFEDisplacementMapElement>(null);
  const feTurbRef = useRef<SVGFETurbulenceElement>(null);
  const materializeRef = useRef<HTMLDivElement>(null);
  const blueprintRef = useRef<SVGSVGElement>(null);
  const [glOk, setGlOk] = useState(true);
  // Read once on mount only, to decide whether the materialization filter
  // gets its SMIL intro at all -- the CSS media query below is the real,
  // always-correct guard; this just keeps the SVG markup itself honest for
  // reduced-motion users from the very first paint.
  const [reduceMotionUI, setReduceMotionUI] = useState(false);

  useEffect(() => { track('entry_view'); }, []);
  useEffect(() => {
    setReduceMotionUI(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

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

    // ---- headline proximity: the material reacts to the observer being
    // near, not to being clicked or hovered as a "button" -- no movement,
    // scale or rotation of the text itself, only its optical distortion ----
    let proximityTarget = 0;

    function onPointerMove(e: PointerEvent) {
      mouseTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseTarget.y = (e.clientY / window.innerHeight - 0.5) * -2;
      if (headlineRef.current) {
        const rect = headlineRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const maxDist = Math.max(rect.width, rect.height) * 0.85;
        const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
        proximityTarget = Math.max(0, 1 - dist / maxDist);
      }
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
    const materializeEl = materializeRef.current;
    const blueprintNodes = blueprintRef.current
      ? Array.from(blueprintRef.current.querySelectorAll<SVGGraphicsElement>('[data-kind]')).map((el) => ({
          el,
          kind: el.getAttribute('data-kind') || 'line',
          delay: parseFloat(el.getAttribute('data-delay') || '0'),
        }))
      : [];

    let start: number | null = null;
    let frozen = 0;
    let raf = 0;
    let frameCount = 0;
    let proximity = 0;
    const idleSeed = Math.random() * 100;

    function frame(ts: number) {
      if (start === null) start = ts;
      const elapsed = reduceMotion ? 0 : (ts - start) / 1000;
      frameCount++;

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
      proximity += (proximityTarget - proximity) * 0.08;

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

      // ---- digital materialization: the headline is compiled, not faded
      // in. Driven here, off this same rAF clock, rather than via native
      // CSS @keyframes/SMIL (both were tried; under this project's testing
      // conditions a running native animation's *computed* style kept
      // advancing correctly while the *painted* frame did not -- a manual
      // per-frame style write doesn't have that failure mode). ----
      const introT = reduceMotion ? 1 : Math.max(0, Math.min(1, (elapsed - MATERIALIZE_DELAY) / MATERIALIZE_DUR));
      if (materializeEl) {
        materializeEl.style.clipPath = `circle(${interp(introT, RADIUS_STOPS).toFixed(2)}% at 50% 46%)`;
        materializeEl.style.filter = `blur(${interp(introT, BLUR_STOPS).toFixed(2)}px)`;
      }
      if (!reduceMotion && feDispRef.current && feTurbRef.current) {
        if (introT < 1) {
          feDispRef.current.setAttribute('scale', interp(introT, SCALE_STOPS).toFixed(2));
          feTurbRef.current.setAttribute('baseFrequency', interp(introT, FREQ_STOPS).toFixed(4));
        } else if (frameCount % 3 === 0) {
          // permanent micro-shimmer + proximity reaction -- "o texto sabe
          // que existe um observador" without ever moving/scaling/rotating
          // the text itself. Throttled: this is texture, not motion.
          const gyroBoost = isTouch ? Math.min(1, Math.hypot(mouse.x, mouse.y)) * 0.6 : 0;
          const idle = Math.sin(elapsed * 0.5) * 0.28;
          const scaleVal = Math.max(0.15, 0.55 + idle * 0.4 + proximity * 2.4 + gyroBoost * 1.1);
          feDispRef.current.setAttribute('scale', scaleVal.toFixed(2));
          const freqVal = 0.014 + Math.sin(elapsed * 0.09) * 0.004 + proximity * 0.01;
          feTurbRef.current.setAttribute('baseFrequency', freqVal.toFixed(4));
        }
      }
      if (!reduceMotion && blueprintNodes.length && elapsed < 1.3) {
        for (const node of blueprintNodes) {
          const nodeT = Math.max(0, Math.min(1, (elapsed - node.delay) / DRAW_DUR));
          const style = node.el.style as CSSStyleDeclaration & { strokeDashoffset: string };
          if (node.kind === 'dot') {
            style.opacity = interp(nodeT, DOT_OPACITY_STOPS).toFixed(3);
            style.transform = `scale(${interp(nodeT, DOT_SCALE_STOPS).toFixed(3)})`;
          } else {
            const peak = LINE_PEAK[node.kind] ?? 0.3;
            const len = LINE_LEN[node.kind] ?? 60;
            style.opacity = (interp(nodeT, LINE_OPACITY_STOPS) * peak).toFixed(3);
            style.strokeDashoffset = String(interp(nodeT, LINE_OFFSET_STOPS) * len);
          }
        }
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
          <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
            <defs>
              <filter id="saltMaterializeFilter" x="-30%" y="-60%" width="160%" height="220%">
                <feTurbulence
                  ref={feTurbRef}
                  type="fractalNoise"
                  numOctaves={2}
                  seed={7}
                  result="noise"
                  baseFrequency={reduceMotionUI ? '0.014' : '0.9'}
                />
                <feDisplacementMap
                  ref={feDispRef}
                  in="SourceGraphic"
                  in2="noise"
                  xChannelSelector="R"
                  yChannelSelector="G"
                  scale={reduceMotionUI ? 0 : 60}
                />
              </filter>
            </defs>
          </svg>

          <div
            className={`${styles.headlineWrap} ${styles.reveal} ${styles.r3}`}
            ref={headlineRef}
          >
            {!reduceMotionUI && (
              <svg
                ref={blueprintRef}
                className={styles.blueprint}
                viewBox="0 0 100 40"
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
              >
                <line x1="0" y1="4" x2="100" y2="4" className={styles.blueprintLine} data-kind="line" data-delay="0" />
                <line x1="0" y1="36" x2="100" y2="36" className={styles.blueprintLine} data-kind="line" data-delay="0.05" />
                <line x1="2" y1="-4" x2="2" y2="44" className={styles.blueprintTick} data-kind="tick" data-delay="0.1" />
                <line x1="98" y1="-4" x2="98" y2="44" className={styles.blueprintTick} data-kind="tick" data-delay="0.15" />
                <line x1="8" y1="2" x2="46" y2="38" className={styles.blueprintDiag} data-kind="diag" data-delay="0.05" />
                <line x1="92" y1="2" x2="54" y2="38" className={styles.blueprintDiag} data-kind="diag" data-delay="0.1" />
                <circle cx="50" cy="20" r="1.1" className={styles.blueprintDot} data-kind="dot" data-delay="0.25" />
                <circle cx="2" cy="4" r="0.9" className={styles.blueprintDot} data-kind="dot" data-delay="0.02" />
                <circle cx="98" cy="4" r="0.9" className={styles.blueprintDot} data-kind="dot" data-delay="0.06" />
                <circle cx="2" cy="36" r="0.9" className={styles.blueprintDot} data-kind="dot" data-delay="0.1" />
                <circle cx="98" cy="36" r="0.9" className={styles.blueprintDot} data-kind="dot" data-delay="0.14" />
              </svg>
            )}

            <div className={styles.materialize} ref={materializeRef}>
              <div className={styles.materializeInner}>
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
            </div>
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
