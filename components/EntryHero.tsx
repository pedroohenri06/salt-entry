'use client';
import { useEffect, useState, useCallback } from 'react';
import SaltMark from './SaltMark';
import EntryOption from './EntryOption';
import TransitionLayer from './TransitionLayer';
import { LINKS, COMMERCIAL_PENDING, track } from '@/config/links';
import { MOTION } from '@/lib/motion';

export default function EntryHero() {
  const [chosen, setChosen] = useState<string | null>(null);
  const [veil, setVeil] = useState(false);

  useEffect(() => { track('entry_view'); }, []);

  /* Transição de saída: a opção escolhida ganha foco, o resto
     recua, a seta avança, o véu fecha — e só então navega.
     ~380ms no total. Rápido o bastante para não custar clique. */
  const choose = useCallback((href: string) => {
    if (chosen) return;
    setChosen(href);
    track(href === LINKS.commercialUrl ? 'commercial_click' : 'website_click');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { window.open(href, '_blank', 'noopener'); setChosen(null); return; }

    window.setTimeout(() => setVeil(true), MOTION.base * 0.55);
    window.setTimeout(() => {
      window.open(href, '_blank', 'noopener');
      setVeil(false); setChosen(null);
    }, MOTION.base + 60);
  }, [chosen]);

  return (
    <>
      <div className={`stage${chosen ? ' leaving' : ''}`}>
        <header className="meta">
          <span className="id">Salt / Entry</span>
          <span className="sep" />
          <span className="st"><i />Entry point 01</span>
        </header>

        <div className="core">
          <div>
            <div className="door" aria-hidden="true"><i /></div>
            <SaltMark />
            <h1 className="headline">
              <span className="ln"><span>Construímos</span></span>
              <span className="ln"><span>o que <em>vem depois</em>.</span></span>
            </h1>
            <p className="lede">
              Produtos digitais para empresas que pretendem liderar o próprio mercado.
            </p>
          </div>

          <nav className="options" aria-label="Para onde você quer ir">
            <EntryOption
              index="01"
              label="Falar com o comercial"
              sub="Conte seu projeto e receba uma direção"
              href={LINKS.commercialUrl}
              primary
              chosen={chosen === LINKS.commercialUrl}
              onChoose={choose}
            />
            <EntryOption
              index="02"
              label="Conhecer a Salt"
              sub="Nossa operação, método e projetos"
              href={LINKS.websiteUrl}
              chosen={chosen === LINKS.websiteUrl}
              onChoose={choose}
            />
            {COMMERCIAL_PENDING && (
              <span className="pending">
                Canal comercial pendente
              </span>
            )}
          </nav>
        </div>

        <footer className="foot">
          <span>Salt</span>
          <span className="r">Entry / 01</span>
        </footer>
      </div>

      <TransitionLayer active={veil} />
    </>
  );
}
