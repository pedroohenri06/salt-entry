'use client';

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <line x1="4" y1="12" x2="19" y2="12" />
    <polyline points="13 6 19 12 13 18" />
  </svg>
);

export type OptionProps = {
  index: string;
  label: string;
  sub: string;
  href: string;
  primary?: boolean;
  chosen?: boolean;
  onChoose: (href: string) => void;
};

export default function EntryOption({
  index, label, sub, href, primary, chosen, onChoose,
}: OptionProps) {
  return (
    <a
      className={`opt${primary ? ' primary' : ''}${chosen ? ' chosen' : ''}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => { e.preventDefault(); onChoose(href); }}
    >
      <span className="idx" aria-hidden="true">{index}</span>
      <span className="body">
        <span className="lb">{label}</span>
        <span className="sub">{sub}</span>
      </span>
      <span className="arw" aria-hidden="true"><Arrow /></span>
    </a>
  );
}
