'use client';

import { useEffect, useRef, useState } from 'react';
import { VERT_SRC, FRAG_SRC } from '@/lib/heroShaders';
import { LINKS, track } from '@/config/links';
import styles from './SaltHeroV2.module.css';

/* Salt hero v2 — WebGL domain-warped background + silver-sweep headline.
   Client component: the shader loop and pointer tracking need the DOM,
   but the copy itself is plain server-renderable markup underneath. */

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

export default function SaltHeroV2() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
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

    const mouse = { x: 0, y: 0 };
    const mouseTarget = { x: 0, y: 0 };
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    let isSmall = false;

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
    if (!isTouch) window.addEventListener('pointermove', onPointerMove);

    let start: number | null = null;
    let frozen = 0;
    let raf = 0;

    function frame(ts: number) {
      if (start === null) start = ts;
      const elapsed = reduceMotion ? 0 : (ts - start) / 1000;

      mouse.x += (mouseTarget.x - mouse.x) * 0.04;
      mouse.y += (mouseTarget.y - mouse.y) * 0.04;

      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uTime, elapsed);
      gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.uniform1f(uOct, isSmall ? 3.0 : 5.0);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);

      if (!reduceMotion || frozen < 2) {
        if (reduceMotion) frozen++;
        raf = requestAnimationFrame(frame);
      }
    }
    raf = requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const glow = glowRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (!glow || isTouch || reduceMotion) return;

    let gx = 0, gy = 0, tx = 0, ty = 0;
    let raf = 0;

    function onPointerMove(e: PointerEvent) {
      tx = e.clientX; ty = e.clientY;
      glow!.classList.add(styles.active);
    }
    window.addEventListener('pointermove', onPointerMove);

    function loop() {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow!.style.transform = `translate(${gx}px, ${gy}px)`;
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(raf);
    };
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
        <div className={styles.heroContent}>
          <p className={`${styles.eyebrow} ${styles.reveal} ${styles.r2}`}>
            Tecnologia. Branding. Performance.
          </p>
          <div className={`${styles.headlineWrap} ${styles.reveal} ${styles.r3}`}>
            <h1 className={styles.h1}>
              Construímos experiências que <em>movem</em> negócios.
            </h1>
            <h1 className={styles.headlineSweep} aria-hidden="true">
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
