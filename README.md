# Salt Entry — v4

The digital front door of Salt.

## ⚠️ ANTES DE PUBLICAR
`config/links.ts` → troque `commercialUrl`. Única pendência bloqueante.

---

# RELATÓRIO

## COPY
Substituída exatamente, sem alteração de palavra:

> Estratégia, tecnologia e performance para empresas que querem liderar seus mercados.

Aplicada na página e no `metadata`. Verificado no HTML renderizado: `copyFinal: true`.

Tratamento visual preservado — posição, peso, tipografia, contraste e animação
intactos. Ajustei apenas `max-width` (34ch → 30ch mobile, 37ch → 34ch desktop)
e `text-wrap: pretty`, porque a frase nova deixava **"mercados." órfão** na
terceira linha. Agora quebra equilibrada em todos os viewports.

## ALIGNMENT — 01 / 02 (v6, definitivo)

**A causa não era layout — era massa visual.** As versões anteriores centraram
o índice corretamente na CAIXA. Medição no navegador (390×844):

```
centro do título ........ 651,1
centro do subtítulo ..... 674,5
centro GEOMÉTRICO ....... 662,0   ← onde o glifo estava
centro ÓPTICO ........... 655,8   ← onde o olho espera
```

Massa visual do título: **25,7** (20px · peso 600 · opaco).
Massa visual do subtítulo: **6,5** (12,5px · peso 400 · 52% de opacidade).

O título pesa **~4×**. O olho lê massa, não caixa — por isso o índice parecia
baixo mesmo estando matematicamente centrado. A diferença medida foi de 6px,
aplicada como deslocamento único e compartilhado pelos dois índices.

Mantida a estrutura de grid da rodada anterior (`auto minmax(0,1fr) auto`,
`align-items:center`, wrapper do índice com `align-self:stretch` e
`line-height:1`). O deslocamento é a compensação de centro de massa,
documentada no CSS — não é magic number nem ajuste individual.

**Validado nos 8 viewports** (375, 390, 393, 430, 768, 1366, 1440, 1920):
desvio entre −0,4px e +0,1px do centro óptico. Seta em 0,0px do centro do bloco.
Confirmado visualmente com ampliação 3× e guia no centro de massa.

## ALIGNMENT — histórico (v5, correção definitiva)

**Diagnóstico:** matematicamente a caixa do numeral já estava centrada (+0,5px),
mas visualmente aparecia baixa. A causa não era o layout — era o **meio-leading
da fonte mono**: a caixa tinha 11px de altura e o glifo ocupava só a metade
superior, deixando espaço vazio abaixo. Centrar a caixa não centra o glifo.

**Correção estrutural**, exatamente como especificado:
```css
.zone{ display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center }
.zone .n{ display:flex; align-items:center; justify-content:center; align-self:stretch;
          line-height:1 }   /* remove o meio-leading */
.zone .tx{ display:flex; flex-direction:column; justify-content:center }
.zone .ar{ display:flex; align-items:center; align-self:center }
```

O `translateY(1px)` anterior foi **removido** — não há mais deslocamento
arbitrário. O `line-height:1` resolve na origem.

**Medido pelo bounding box do GLIFO** (via `Range`), não da caixa:

| Viewport | 01 | 02 |
|---|---|---|
| 375 · 390 · 393 · 430 · 768 · 1366 · 1440 · 1920 | −0,5px | −0,5px |

Mesma regra para os dois, sem ajuste individual. Confirmado visualmente com
ampliação 3× e linha-guia no centro exato de cada bloco.

## ALIGNMENT — histórico

**Medido antes:** índice **−15px** no mobile e **−19px** no desktop, fora do
centro do conteúdo. Causa: `align-self: flex-start` + `padding-top: 3px`.

**Correção estrutural**, sem magic number:
```css
.zone{ display:grid; grid-template-columns:auto 1fr auto; align-items:center }
```
O `flex` com `align-self` foi eliminado. O grid centra o índice em relação ao
bloco inteiro (label + hint), por definição.

**Correção óptica:** +1px de `translateY` no numeral. O mono tem altura-x menor
que o texto ao lado — matematicamente centrado ficava opticamente alto. É
compensação de peso visual, documentada no CSS.

**Verificado no navegador**, ampliado 2×, nos 6 viewports:

| Viewport | Desvio 01 | Desvio 02 |
|---|---|---|
| 390 · 430 · 768 · 1366 · 1440 · 1920 | +1,0px | +1,0px |

Idêntico em todos — o mesmo valor intencional, não variação.

## DESIGN — refinamentos, não redesign

- **Escala de spacing** implantada (`--s1` a `--s9`: 4/8/12/16/24/32/48/64/96).
  Os `clamp()` improvisados saíram; todo espaçamento deriva da escala.
- **Grid real** nas zonas: `auto 1fr auto`, não posicionamento manual.
- Hierarquia do header, tracking e opacidades ajustados.
- **Nada foi adicionado à tela.** Mesmo número de elementos.

## MOTION — preservado

**O efeito de "vem depois" está intacto.** Verificado: `background-clip: text`
ativo, sweep de luz rodando, texto correto. Não toquei nele.

Preservados também: coreografia de entrada, tempos, curvas, transição de saída.

**Corrigido um bug real:** o `animation-fill-mode: both` da entrada congelava
`opacity: 1` e vencia o `:hover` — a outra zona **não recuava**. Resolvido
liberando o controle de opacidade após a coreografia. Agora:
hover → outra zona em **0.44** · saída → escolhida **1.0**, outra **0.17**.

## RESPONSIVE

Verificados **390, 430, 768, 1366, 1440, 1920**: zero overflow, ações na
primeira dobra, logo com proporção correta, zero alvo abaixo de 44px, índices
alinhados, copy sem órfã.

## PERFORMANCE

| Métrica | v3 | **v4** |
|---|---|---|
| LCP | 1496ms | **892ms** |
| Load | 1331ms | **1218ms** |
| CLS | 0 | **0** |
| Long tasks | 0 | **0** |

390×844, CPU 4×, Fast 3G. Nenhuma dependência adicionada.

## CHROME DEVTOOLS

O MCP não está conectado neste ambiente. Usei **Playwright com CDP** — mesmo
protocolo: performance trace, throttling de rede e CPU, inspeção visual e
recorte ampliado das zonas para conferência óptica do 01/02.

## CONTEÚDO

Auditado no HTML renderizado: `porto: false`, `ano: false`, `est: false`.
Nada inventado.

## BUILD / TYPECHECK
```
npm run build      ✓
npm run typecheck  ✓
```

## PENDÊNCIAS
1. `commercialUrl` é placeholder — bloqueante.
2. Sem OG image (1200×630).
3. `metadataBase` aponta para `salt-entry.vercel.app`.
4. Analytics com hooks prontos, sem ferramenta instalada.
5. Não testado em iOS Safari real.
