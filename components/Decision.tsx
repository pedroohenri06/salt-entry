'use client';
import { useState, useEffect, useCallback } from 'react';
import Action from './Action';
import { LINKS, track } from '@/config/links';
import { MOTION } from '@/lib/motion';

/* Único client component do projeto. Existe só pela transição
   de saída — nenhuma animação de entrada depende de JS. */
export default function Decision() {
  const [chosen, setChosen] = useState<string | null>(null);
  const [veil, setVeil] = useState(false);

  useEffect(() => { track('entry_view'); }, []);

  useEffect(() => {
    const root = document.querySelector('.stage');
    if (root) root.classList.toggle('leaving', !!chosen);
  }, [chosen]);

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
      setVeil(false); setChosen(null);
    }, MOTION.base + 70);
  }, [chosen]);

  return (
    <>
      <nav className="acts" aria-label="Escolha um destino">
        <Action
          label="Falar com o time comercial"
          hint="Conte seu projeto e receba uma direção"
          href={LINKS.commercialUrl}
          primary
          chosen={chosen === LINKS.commercialUrl}
          onSelect={select}
        />
        <Action
          label="Conhecer a Salt"
          hint="Nossa operação, método e projetos"
          href={LINKS.websiteUrl}
          chosen={chosen === LINKS.websiteUrl}
          onSelect={select}
        />
      </nav>
      <div className={`veil${veil ? ' on' : ''}`} aria-hidden="true" />
    </>
  );
}
