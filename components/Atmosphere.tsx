/* Server component — zero JS.
   Uma direção só: luz direcional + grão. A posição da luz é
   variável CSS, inclinada pelas zonas quando recebem foco. */
export default function Atmosphere() {
  return (
    <div className="field" aria-hidden="true">
      <svg className="gr" preserveAspectRatio="none">
        <filter id="n">
          <feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#n)" />
      </svg>
    </div>
  );
}
