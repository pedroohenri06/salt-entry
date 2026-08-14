/* ══════════════════════════════════════════════════════════
   MOTION SYSTEM
   Vocabulário fechado. Nenhum componente inventa curva própria.
   ══════════════════════════════════════════════════════════ */
export const MOTION = { fast: 160, base: 320, slow: 640, door: 1100 } as const;

export const EASING = {
  primary:  'cubic-bezier(0.16, 1, 0.3, 1)',   // entrada decisiva, assenta longo
  exit:     'cubic-bezier(0.7, 0, 0.84, 0)',   // saída rápida
  transform:'cubic-bezier(0.65, 0, 0.35, 1)',  // mudança de estado
  spring:   'cubic-bezier(0.34, 1.12, 0.42, 1)', // overshoot mínimo
} as const;

export const STAGGER = { small: 60, medium: 110 } as const;

/** Sequência de abertura, em ms. Interativa desde o primeiro frame. */
export const CUE = {
  atmosphere: 80, door: 220, mark: 520,
  headline: 760, lede: 940, options: 1080, meta: 1320,
} as const;
