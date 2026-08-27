/* ══════════════════════════════════════════════════════════
   DESTINOS — único lugar do projeto onde URL existe.
   ══════════════════════════════════════════════════════════ */
export const LINKS = {
  /** Canal comercial. */
  commercialUrl:
    'https://wa.me/5512936290045?text=Ol%C3%A1%21%20Vim%20pelo%20site%20da%20Salt%20e%20gostaria%20de%20falar%20com%20o%20time%20comercial.',
  /** Site institucional da Salt. */
  websiteUrl: 'https://salt-mauve.vercel.app/',
} as const;

/** true enquanto o canal comercial não foi definido. */
export const COMMERCIAL_PENDING = LINKS.commercialUrl.includes('PLACEHOLDER');

/* ── ANALYTICS ────────────────────────────────────────────
   Pontos de integração prontos, sem ferramenta instalada.
   Ao plugar uma, preencha o corpo da função — só aqui.     */
export type EntryEvent = 'entry_view' | 'commercial_click' | 'website_click';

export function track(event: EntryEvent) {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV === 'development') console.debug('[salt-entry]', event);
}
