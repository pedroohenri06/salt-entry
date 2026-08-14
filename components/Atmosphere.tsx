/* Server component — zero JS no cliente.
   Uma abordagem de fundo: campo de luz + grão SVG. */
export default function Atmosphere() {
  return (
    <div className="atm" aria-hidden="true">
      <svg className="grain" preserveAspectRatio="none">
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </div>
  );
}
