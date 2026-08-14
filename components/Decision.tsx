'use client';
import { useState, useEffect, useCallback } from 'react';
import Zone from './Zone';
import { LINKS, track } from '@/config/links';
import { MOTION } from '@/lib/motion';

/* Único client component. A luz direcional se inclina para a
   zona em foco — a composição responde fisicamente à intenção. */
export default function Decision() {
  const [chosen, setChosen] = useState<string | null>(null);
  const [veil, setVeil] = useState(false);

  useEffect(() => { track('entry_view'); }, []);

  useEffect(() => {
    document.querySelector('.stage')?.classList.toggle('leaving', !!chosen);
  }, [chosen]);

  const light = useCallback((v: number | null) => {
    const f = document.querySelector<HTMLElement>('.field');
    if (!f) return;
    f.style.setProperty('--lx', v === null ? '50%' : `${v}%`);
    f.style.setProperty('--ly', v === null ? '-6%' : '18%');
  }, []);

  const select = useCallback((href: string) => {
    if (chosen) return;
    setChosen(href);
    track(href === LINKS.commercialUrl ? 'commercial_click' : 'website_click');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.open(href, '_blank', 'noopener'); setChosen(null); return;
    }
    window.setTimeout(() => setVeil(true), MOTION.base * 0.6);
    window.setTimeout(() => {
      window.open(href, '_blank', 'noopener');
      setVeil(false); setChosen(null); light(null);
    }, MOTION.base + 70);
  }, [chosen, light]);

  return (
    <>
      <nav className="zones" aria-label="Escolha um destino">
        <Zone n="01" label="Falar com o time comercial"
              hint="Conte seu projeto e receba uma direção"
              href={LINKS.commercialUrl}
              chosen={chosen === LINKS.commercialUrl}
              onSelect={select} onFocusLight={light} />
        <Zone n="02" label="Conhecer a Salt"
              hint="Nossa operação, método e projetos"
              href={LINKS.websiteUrl}
              chosen={chosen === LINKS.websiteUrl}
              onSelect={select} onFocusLight={light} />
      </nav>
      <div className={`veil${veil ? ' on' : ''}`} aria-hidden="true" />
    </>
  );
}
