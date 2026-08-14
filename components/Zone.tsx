'use client';

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);

export default function Zone({
  n, label, hint, href, chosen, onSelect, onFocusLight,
}: {
  n: string; label: string; hint: string; href: string;
  chosen?: boolean;
  onSelect: (href: string) => void;
  onFocusLight: (v: number | null) => void;
}) {
  return (
    <a
      className={`zone${chosen ? ' chosen' : ''}`}
      href={href} target="_blank" rel="noopener noreferrer"
      onClick={(e) => { e.preventDefault(); onSelect(href); }}
      onMouseEnter={() => onFocusLight(n === '01' ? 30 : 70)}
      onMouseLeave={() => onFocusLight(null)}
      onFocus={() => onFocusLight(n === '01' ? 30 : 70)}
      onBlur={() => onFocusLight(null)}
    >
      <span className="n" aria-hidden="true">{n}</span>
      <span className="tx">
        <span className="lb">{label}</span>
        <span className="ht">{hint}</span>
      </span>
      <span className="ar" aria-hidden="true"><Arrow /></span>
    </a>
  );
}
