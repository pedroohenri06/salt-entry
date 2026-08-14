# Salt Entry

The digital front door of Salt. Projeto isolado — não compartilha código,
banco ou deploy com o Sales OS nem com o site institucional.

---

## ⚠️ ANTES DE PUBLICAR

Abra **`config/links.ts`** e troque `commercialUrl`:

```ts
export const LINKS = {
  commercialUrl: 'https://wa.me/5551999999999?text=...',   // ← TROQUE
  websiteUrl: 'https://salt-mauve.vercel.app/',
};
```

Enquanto o placeholder existir, aparece na tela um selo discreto
*"Canal comercial pendente"*. Ele desaparece sozinho quando a URL real entrar.

**Nenhum componente do projeto tem URL.** Todas vivem nesse arquivo.

---

## DESIGN CONCEPT — A PORTA

Uma linha de luz de 1px existe desde o primeiro frame. Ela abre do centro para
as bordas, revela a marca, e permanece como o divisor entre as duas decisões.
Um gesto do começo ao fim.

A escolha foi rejeitar tudo que o briefing proíbe e apostar em **um efeito só**:
não há partícula, glow, mesh, glassmorphism, bento ou 3D. A profundidade vem de
três camadas — queda de luz radial que respira em 14s, grão em SVG e vinheta.
Sem imagem, sem canvas, sem JS de animação.

**O verde da marca aparece em exatamente um lugar** no projeto inteiro: o índice
da opção sob o cursor. A interface funciona em monocromático — o accent é o
prêmio de uma interação, não o tema.

---

## UX — HIERARQUIA E DECISÃO

Três níveis, nesta ordem de peso: marca → afirmação → decisão.

A headline **"Construímos o que vem depois"** foi escolhida porque afirma
capacidade sem adjetivo. As proibidas do briefing ("transformamos ideias em
realidade") descrevem qualquer empresa; essa descreve postura.

As duas ações não são botões. São linhas editoriais com índice, label,
microcopy e seta — separadas por hairline, não por card arredondado. A primária
tem peso 700, a secundária 600. A diferença é de peso, não de cor.

**Não existe terceira opção.** Nada de redes sociais, portfólio ou contato
alternativo competindo.

---

## MOTION SYSTEM

`lib/motion.ts` — vocabulário fechado, nenhum componente inventa timing.

| Token | Valor | Uso |
|---|---|---|
| `fast` | 160ms | resposta ao toque |
| `base` | 320ms | entrada de elemento |
| `slow` | 640ms | revelação |
| `door` | 1100ms | abertura da porta |

Curvas: `primary` (entrada decisiva, assenta longo), `exit` (saída rápida),
`transform` (mudança de estado), `spring` (overshoot mínimo).

**Sequência de abertura**, total ~1,4s e **contínua**:

```
 80ms  atmosfera
220ms  a porta abre         ← gesto assinatura
520ms  marca sobe por máscara
760ms  headline, linha a linha
940ms  lede
1080ms as duas decisões
1320ms metadados
```

Não é splash. A página é interativa desde o primeiro frame — tocar em 200ms
funciona.

**Transição de saída** (~380ms): a escolhida mantém 100% de opacidade e a seta
avança, a outra recua para 22%, headline e marca caem para 30%, um véu fecha —
e só então navega. Validado por render: `chosen 1.0 · outra 0.22 · headline 0.44`.

---

## PERFORMANCE

- **104 kB** de First Load JS, página **estática** (prerender)
- **Zero dependência** além de React e Next — CSS e Web Animations dão conta
- Animações só em `transform` e `opacity`
- `will-change` não é usado em lugar nenhum (não era necessário)
- Fonte: um `@font-face` com `font-display: swap`, subset latino, preconnect
- Grão em SVG `feTurbulence`, não PNG repetido
- Conexão lenta (Fast 3G simulado, 1,6 Mbps / 150ms): **ações no DOM em 1354ms**

---

## RESPONSIVENESS

Mobile-first de verdade: os breakpoints do briefing foram a base, desktop veio
depois com composição própria em duas colunas — não é o mobile esticado.

Testado em **375, 390, 393, 430, 768, 1366, 1440 e 1920**:

| Critério | Resultado |
|---|---|
| Overflow horizontal | 0 em todos |
| Ações na primeira dobra | sim em todos |
| Alvos de toque < 44px | 0 |
| Headline | 2 linhas limpas em todos |

---

## ACCESSIBILITY

- `<main>`, um único `<h1>`, `<nav aria-label>`, `lang="pt-BR"`
- Tab navega na ordem correta (validado: opção 1 → opção 2)
- `:focus-visible` com outline de 1px e offset — nunca removido
- Hover isolado em `@media (hover:hover)`: nada depende dele para funcionar
- `prefers-reduced-motion`: sem movimento, **composição completa** — a porta
  nasce aberta, nada fica invisível esperando animação. Validado por render.

---

## CONFIG

| O que | Onde |
|---|---|
| URL do comercial | `config/links.ts` → `commercialUrl` |
| URL do site | `config/links.ts` → `websiteUrl` |
| Durações e curvas | `lib/motion.ts` |
| Cores e tipografia | `app/globals.css` → `:root` |

---

## DEPLOY

```bash
npm install
npm run build      # valida antes de subir
npm run dev        # http://localhost:3000
```

Na Vercel: importe o repositório. **Root Directory vazio.** Sem variável de
ambiente, sem banco, sem autenticação.

---

## VALIDATION

```
npm run build      ✓ Compiled successfully · 104 kB · estático
npm run typecheck  ✓ sem erros
```

---

## PENDÊNCIAS REAIS

1. **`commercialUrl` é placeholder.** É a única coisa que impede publicar.
2. **Sem OG image.** O `metadata` está pronto, falta o arquivo 1200×630 —
   compartilhamentos no WhatsApp mostram só título e descrição.
3. **`metadataBase` aponta para `salt-entry.vercel.app`.** Se o domínio final
   for outro, ajuste em `app/layout.tsx`.
4. **Analytics não instalado**, por decisão do briefing. `config/links.ts`
   expõe `track()` com `entry_view`, `commercial_click` e `website_click`
   prontos — ao plugar uma ferramenta, preencha o corpo da função.
5. **Não testei em iOS Safari real.** `svh`, safe areas e `viewportFit: cover`
   estão implementados, mas headless não substitui aparelho.
