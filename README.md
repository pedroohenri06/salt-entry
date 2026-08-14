# Salt Entry — v2

The digital front door of Salt. Projeto isolado: não compartilha código,
banco ou deploy com o Sales OS nem com o site institucional.

---

## ⚠️ ANTES DE PUBLICAR

`config/links.ts` → troque `commercialUrl`. É a única pendência bloqueante.

O selo *"Canal comercial pendente"* **foi removido da interface** — nunca chega
ao visitante. Enquanto a URL for placeholder, o link abre o WhatsApp genérico;
a arquitetura está pronta, só falta o número.

---

# RELATÓRIO

## AUDIT BEFORE — medido com CDP, mobile 390, CPU 4×, Fast 3G

| Problema | Causa técnica |
|---|---|
| LCP 2172ms | LCP = FCP idênticos. O `@font-face` estava **dentro** do `globals.css`: CSS baixa → parseia → fonte baixa, em série. Nada pintava antes disso. |
| Sensação de travado | 5 arquivos JS. `EntryHero` era `'use client'` inteiro só pelo clique. |
| 362px de espaço morto | 185px vazios no topo + 177px na base. **43% do viewport sem função.** |
| Wordmark 44 KB | PNG raster competindo com a fonte pelo LCP. |
| Selo de dev público | "Canal comercial pendente" visível ao visitante. |
| Marcadores 01/02 | A skill `frontend-design` alerta: numeração só se for sequência. Duas escolhas paralelas não são. |
| Motion disperso | Cada elemento com fade-up isolado — exatamente o padrão que a skill classifica como gerado por IA. |

## DESIGN DIRECTION

**Refined minimalism · editorial technology.**

A skill me deu um aviso que mudou a direção: *"fundo quase-preto com um único
accent verde-ácido"* é um dos três clusters de design gerado por IA — e o v1
caía exatamente nele. O briefing fixa preto, então a paleta ficou; a distinção
teve que vir de outro lugar.

**ELEMENTO MEMORÁVEL — um só:** a marca chega **desfocada e resolve para foco**,
como uma lente estabilizando (`blur(11px) → blur(0)` em 900ms). Nenhum outro
elemento tem efeito próprio. Tudo ao redor fica quieto, que é a instrução de
restrição da skill: gastar a ousadia em um lugar.

Outras decisões derivadas da skill:
- **Numeração removida** (não é sequência)
- **Verde em zero lugares na interface** — o token existe, não é usado. A página
  é monocromática de verdade.

## SKILLS / MCPs — o que existia de fato

| Pedido | Status |
|---|---|
| `frontend-design` | ✅ **Lida e aplicada** — direção, restrição, numeração, alerta de cluster |
| `web-design-guidelines` (Vercel) | ❌ Não existe no ambiente |
| shadcn MCP | ❌ Não conectado |
| 21st.dev / Magic MCP | ❌ Não conectado |
| Chrome DevTools MCP | ❌ Não conectado |
| `ui-animation`, `css-animations`, `motion-design`, HyperFrames | ❌ Nenhuma existe |

**Substituto real do Chrome DevTools MCP:** Playwright com CDP — mesmo protocolo.
Performance trace, LCP, CLS, long tasks, throttling de rede e CPU, inspeção
visual. Todas as fases de medição foram executadas de verdade com isso.

## PERFORMANCE

| Métrica | Antes | Depois |
|---|---|---|
| LCP | 2172ms | **1568ms** (−28%) |
| FCP | 2172ms | **1568ms** |
| Load | 2139ms | **1427ms** |
| Bytes | 151 KB | **119 KB** |
| CLS | 0 | **0** |
| Long tasks | 0 | **0** |
| Long tasks @ CPU 6× | — | **0** |

**Decisões:**
- Fonte movida do CSS para `<link>` no `<head>`: baixa **em paralelo** com o CSS
- Só 2 pesos (400, 600) em vez do range variável inteiro
- Wordmark PNG 44 KB → **WebP 13,2 KB** com `preload` e `fetchPriority="high"`
- `page.tsx` virou **server component**; só o `Decision` é client, e só pela
  transição de saída
- Zero JS para animação — tudo CSS
- `contain: strict` na atmosfera isola o repaint

## MOTION

Tokens em `:root` e `lib/motion.ts`:

```
--m-fast   150ms   resposta ao toque
--m-base   280ms   estado
--m-slow   520ms   revelação
--m-brand  900ms   o brand moment
```

Curvas: `primary cubic-bezier(.16,1,.3,1)` · `exit (.65,0,.85,0)` · `state (.4,0,.2,1)`

**Coreografia única** (não fades independentes):
```
120ms  identificador
180ms  régua cresce
260ms  MARCA RESOLVE DE BLUR PARA FOCO   ← assinatura
620ms  headline linha 1
700ms  headline linha 2
820ms  suporte
940ms  ação 1
1010ms ação 2
1140ms rodapé
```

Sem loader. O HTML já contém tudo; a animação acontece **sobre** conteúdo presente.

**Transição de saída** (~350ms), validada por render:
`chosen 1.0 · outra 0.2 · headline 0.35`

**Reduced motion**: validado — marca nítida (`filter: none`), todos os elementos
em `opacity: 1`, régua completa. Nada fica invisível esperando animação.

## RESPONSIVE

Testado em **375, 390, 393, 430, 768, 1366, 1440, 1920**:
zero overflow, ações na primeira dobra em todos, zero alvo abaixo de 44px
(os CTAs têm 76px no mobile e 92px no desktop).

**Mobile redesenhado**: a composição agora **ancora embaixo** — o vazio virou
respiro acima da marca (ritmo editorial), não sobra simétrica sem função.
Base caiu de 177px para ~20px.

## CHROME DEVTOOLS QA — problemas encontrados e corrigidos

1. **`animation-fill-mode: forwards` travava a saída.** A opção não escolhida
   não recuava. Corrigido trocando para `both` e anulando a animação em `.leaving`.
2. **Especificidade CSS**: `.acts:hover .act:not(:hover)` vencia
   `.leaving .act:not(.chosen)` — a outra ficava em `0.62` em vez de `0.2`.
   Corrigido qualificando o seletor de saída.
3. **Espaço morto simétrico** de 157px topo/base no primeiro passe do v2.
   Corrigido ancorando a composição.

## GUIDELINES

A skill oficial da Vercel não existe no ambiente. Apliquei os itens do briefing
manualmente e validei: `color-scheme: dark`, `theme-color`, foco visível 2px,
alvos ≥44px, hover isolado em `@media (hover:hover)`, `text-rendering`,
antialiasing, contraste (secundário subiu de 62% para 74%), CLS zero,
`prefers-reduced-motion`, safe areas, `svh`.

## DEPENDENCIES

**Adicionadas: nenhuma.** **Removidas: nenhuma.**
Continua React + Next apenas. CSS e Web Animations resolveram tudo — não houve
caso que justificasse Motion ou qualquer biblioteca.

## THREE.JS — avaliado e REJEITADO

Motivo técnico: o LCP no mobile throttled é 1568ms e o bundle atual é 104 KB.
Three.js custa ~150 KB gzipped mais tempo de main thread para inicializar WebGL.
Isso **dobraria o bundle** e competiria com o LCP na única página que precisa
ser instantânea — ela é o primeiro clique de um lead vindo do Instagram.

O ganho visual pretendido (profundidade sutil) foi obtido com dois
`radial-gradient` e um `feTurbulence`, custo zero de JS. O briefing diz: *"se o
custo de performance for maior que o ganho, não use."* É o caso.

## BUILD / TYPECHECK

```
npm run build      ✓ 104 kB First Load · página estática
npm run typecheck  ✓ zero erros
```

## PENDÊNCIAS REAIS

1. **`commercialUrl` é placeholder** — única coisa bloqueante para publicar.
2. **Sem OG image.** O `metadata` está pronto; falta o arquivo 1200×630.
   Compartilhamento no WhatsApp mostra só título e descrição.
3. **`metadataBase` aponta para `salt-entry.vercel.app`** — ajuste em
   `app/layout.tsx` se o domínio final for outro.
4. **Analytics não instalado**, por decisão do briefing. `config/links.ts`
   expõe `track()` com os três eventos prontos.
5. **Não testei em iOS Safari real.** `svh`, safe areas e `viewportFit: cover`
   estão implementados, mas headless não substitui aparelho.
