# Salt Hero — v2

Hero section evoluído a partir da v1: motion e composição preservados, agora
adaptado ao branding oficial da Salt (paleta grafite/chrome/prata, sem logo
no topo, label "Technology Company", light-sweep prateado na headline).

## Stack

Projeto estático, sem framework de UI — HTML + CSS + JavaScript puro, com
[Vite](https://vitejs.dev) apenas como bundler/dev-server. O motion de fundo
é WebGL puro (shader escrito à mão, sem Three.js/bibliotecas externas).

```
salt-hero/
├── index.html          # markup do hero (nav, headline, CTA, assinatura)
├── src/
│   ├── main.js          # inicialização do WebGL, interações, links de contato
│   ├── shaders.js        # vertex/fragment shader (ruído + domain warp)
│   └── style.css          # design tokens, layout, animações, responsividade
├── public/
│   └── assets/
│       └── made-by-salt.png   # logo oficial "Made by Salt" (não redesenhar)
├── package.json
├── vite.config.js
└── README.md
```

## Rodando localmente

Requer Node.js 18+.

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Alterações em `src/` ou `index.html`
recarregam automaticamente.

## Build de produção

```bash
npm run build
```

Gera os arquivos estáticos finais em `dist/`. Para conferir o build
localmente antes do deploy:

```bash
npm run preview
```

## Deploy

O projeto não precisa de configuração especial — qualquer host estático
funciona (Vercel, Netlify, Cloudflare Pages etc.).

Na Vercel especificamente: importar o repositório e usar o preset "Vite"
(detectado automaticamente) — Build Command `vite build`, Output Directory
`dist`. Nenhuma variável de ambiente é necessária.

## Configuração de contato

O número de WhatsApp oficial e o link do site principal ficam centralizados
no topo de `src/main.js`:

```js
const WHATSAPP_NUMBER = '5512936290045'; // +55 12 93629-0045
const SITE_URL = 'https://salt-mauve.vercel.app/';
```

Qualquer elemento com `data-wa="mensagem opcional"` no HTML abre o WhatsApp
com essa mensagem pré-preenchida; qualquer elemento com `data-site` aponta
para `SITE_URL`. Isso cobre o CTA do menu (`Iniciar projeto`, comercial →
WhatsApp) e o CTA da headline (`Conheça nosso trabalho`, institucional →
site principal).

## Notas de implementação

- **Motion de fundo**: shader único (`src/shaders.js`) com ruído simplex 2D
  (Ashima Arts) + fractal Brownian motion + domain warping (técnica de Inigo
  Quilez) para o efeito de superfície líquida/metálica. A lógica é a mesma
  da v1; apenas a rampa de cor foi puxada para grafite/chrome/prata e um
  uniform `u_octaves` reduz a complexidade em telas pequenas.
- **Mobile não é o desktop encolhido**: o shader detecta orientação retrato
  pela proporção da tela e ajusta escala, deslocamento do foco visual,
  velocidade e número de oitavas de ruído — além de desligar o streak
  especular, que não fazia sentido no enquadramento vertical.
- **Silver sweep na headline**: duas cópias idênticas do `<h1>` sobrepostas
  via CSS Grid. A base fica sólida em off-white; a cópia de cima usa
  `background-clip: text` com um gradiente estreito e suave, animado via
  `background-position`, combinado com `mix-blend-mode: overlay` — o efeito
  é um brilho localizado atravessando o texto, não uma troca de cor.
- **Assinatura "Made by Salt"**: reutiliza exatamente o arquivo de logo
  fornecido (`public/assets/made-by-salt.png`), sem redesenho.
