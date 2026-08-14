/* Atmosfera: queda de luz radial que respira + grão em SVG.
   Uma abordagem só, como o briefing pede. Sem imagem repetida,
   sem canvas, sem JS — o navegador compõe e esquece. */
export default function AmbientBackground() {
  return (
    <div className="atmos" aria-hidden="true">
      <div className="glow" />
      <svg className="grain">
        <filter id="entryGrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#entryGrain)" />
      </svg>
      <div className="vig" />
    </div>
  );
}
