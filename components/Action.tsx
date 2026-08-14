'use client';

const Go = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h13M12.5 6l6 6-6 6" />
  </svg>
);

export default function Action({
  label, hint, href, primary, chosen, onSelect,
}: {
  label: string; hint: string; href: string;
  primary?: boolean; chosen?: boolean; onSelect: (href: string) => void;
}) {
  return (
    <a
      className={`act${primary ? ' primary' : ''}${chosen ? ' chosen' : ''}`}
      href={href} target="_blank" rel="noopener noreferrer"
      onClick={(e) => { e.preventDefault(); onSelect(href); }}
    >
      <span className="txt">
        <span className="lb">{label}</span>
        <span className="hint">{hint}</span>
      </span>
      <span className="go" aria-hidden="true"><Go /></span>
    </a>
  );
}
