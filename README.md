# Salt Entry — v3

The digital front door of Salt. Projeto isolado.

---

## ⚠️ ANTES DE PUBLICAR

`config/links.ts` → troque `commercialUrl`. Única pendência bloqueante.

---

# RELATÓRIO

## 1 · ERROS CORRIGIDOS

**"PORTO ALEGRE" e "EST. 2024" foram removidos.** Eu inventei os dois — nenhum
veio de você. Erro grave e reconhecido.

Auditoria automatizada no HTML renderizado confirma: `porto: false`, `ano: false`.
Nenhum dado institucional que você não forneceu existe na página. O rodapé agora
carrega só identidade: `Salt · Technology Company`.

## 2 · LOGO — causa raiz encontrada e corrigida

**Dois defeitos, um no asset e um no CSS.**

*No asset:* o WebP foi gerado com o bbox coincidindo com a borda — o wordmark
encostava nos quatro cantos, sem margem. Qualquer antialiasing cortava o traço.
Regerei da logo oficial com 5% de padding.

*No CSS:* `.brand` renderizava em **346×34** — proporção 10,2 contra 1,98 do
arquivo. Duas causas: `width:auto` não vence os atributos `width`/`height` do
`<img>`, e o container `flex-column` esticava o item no cross-axis.
Corrigido com `aspect-ratio: 620/313`, `object-fit: contain` e
`align-items: flex-start` no container.

**Verificado no navegador, não no CSS** — nos 5 viewports, proporção correta:

| Viewport | Render | Proporção OK |
|---|---|---|
| 390 | 67×34 | ✓ |
| 430 | 73×37 | ✓ |
| 1366 | 92×46 | ✓ |
| 1440 | 97×49 | ✓ |
| 1920 | 115×58 | ✓ |

## 3 · TECHNOLOGY COMPANY

Voltou, em dois pontos com pesos diferentes:
- **Sob o wordmark** — `TECHNOLOGY COMPANY` em mono, tracking .32em, o lockup real
- **No rodapé** — repetição discreta que fecha a leitura

Confirmado no render: `techCompany: true`.

## 4 · OS CARDS VIRARAM ZONAS

Os dois `border-radius: 13px` com fundo próprio foram eliminados. As decisões
agora são **zonas** separadas por hairline, sem raio e sem superfície própria.

**A interação memorável (uma só):** ao focar uma zona, um campo de luz preenche
a partir da borda de leitura, o texto desloca 7px, a seta avança — e **a outra
zona recua para 44%**. A composição responde fisicamente à intenção.

No desktop, a **luz direcional do fundo se inclina** para a zona em foco
(validado: `--lx: 70%` ao focar a zona 02). Sem JS de animação — só uma variável
CSS trocada.

## 5 · HEADLINE

`vem depois` recebe um **sweep de luz que atravessa o texto uma vez** e assenta
em off-white — `background-clip: text` com posição animada. Não é gradiente
estático nem efeito genérico: acontece uma vez, aos 900ms, e para.

## 6 · PERFORMANCE — melhor que antes, como exigido

| Métrica | v1 | v2 | **v3** |
|---|---|---|---|
| LCP | 2172ms | 1568ms | **1496ms** |
| Load | 2139ms | 1427ms | **1331ms** |
| CLS | 0 | 0 | **0** |
| Long tasks | 0 | 0 | **0** |

Medido em 390×844, CPU 4×, Fast 3G. **Zero dependência adicionada.**

## 7 · SKILLS / MCPs — o que existia

| Pedido | Status |
|---|---|
| `frontend-design` | ✅ Aplicada |
| `web-design-guidelines` (Vercel) | ❌ Não existe no ambiente |
| shadcn MCP | ❌ Não conectado |
| 21st.dev / Magic MCP | ❌ Não conectado |
| Chrome DevTools MCP | ❌ Não conectado |
| skills de animação | ❌ Nenhuma existe |

**Substituto do DevTools MCP:** Playwright com CDP — mesmo protocolo. Todos os
traces, throttling e inspeção visual foram reais.

**shadcn não foi usado** — nem como primitive. Dois links e uma imagem não
justificam dependência.

## 8 · THREE.JS — avaliado e rejeitado de novo

~150 KB gzipped dobrariam o bundle e competiriam com o LCP de 1496ms na única
página que precisa ser instantânea. A profundidade veio de dois `radial-gradient`
com posição variável e um `feTurbulence` — custo zero de JS, e a luz ainda
responde ao ponteiro, que era o objetivo do 3D.

## 9 · QA VISUAL — 5 viewports

| | overflow | 1ª dobra | logo | alvo <44px |
|---|---|---|---|---|
| 390×844 | 0 | ✓ | ✓ | 0 |
| 430×932 | 0 | ✓ | ✓ | 0 |
| 1366×768 | 0 | ✓ | ✓ | 0 |
| 1440×900 | 0 | ✓ | ✓ | 0 |
| 1920×1080 | 0 | ✓ | ✓ | 0 |

**Mobile projetado, não adaptado:** grid de 3 faixas onde o discurso fica no topo
e as zonas ancoram no rodapé — `vazioAtéRodapé: 0px`. O espaço entre os dois vira
separação editorial entre discurso e decisão.

**Desktop assimétrico 55/45**, composição própria.

**Reduced motion validado:** marca em `opacity: 1`, `lit` em off-white sólido,
zonas visíveis. Nada espera animação.

## 10 · PENDÊNCIAS REAIS

1. **`commercialUrl` é placeholder** — bloqueante.
2. **Sem OG image** (1200×630).
3. **`metadataBase`** aponta para `salt-entry.vercel.app`.
4. **Analytics não instalado**, hooks prontos em `config/links.ts`.
5. **Não testei em iOS Safari real.**
