# A vida de Napoleão em um Mapa — Remotion

Animação de mapa dirigida pelos timestamps do **word-json do Darkvi** (via `src/data/spec.json`,
171 eventos, 941,72 s). Roda 100% offline no Remotion Studio — o mapa é desenhado em SVG com d3-geo,
sem tiles nem internet.

## Rodar (3 passos)

```bash
npm install
npx remotion studio
```

Abre o Studio em `http://localhost:3000`, composição **Napoleao** (1920×1080, 30fps, ~15min42s).

> Requisitos: Node.js 18+.

## Áudio (locução do Valentino)

A animação já está sincronizada ao tempo da narração. Para tocar o áudio junto:
1. Coloque o `narracao.mp3` (exportado do Darkvi) em `public/narracao.mp3`.
2. Em `src/MapScene.tsx`, troque `const HAS_AUDIO = false;` para `true`.

## Renderizar o vídeo

```bash
npx remotion render Napoleao out/napoleao.mp4
# checagem rápida de 1 frame:
npx remotion still Napoleao out/frame.png --frame=1200
```

## Como editar

- **Conteúdo / timing**: `src/data/spec.json` — cada evento tem `t0/t1`, `prim`, e campos
  (`em`, `rota`, `para`, `cam`, etc.). Mexer aqui muda a animação, sem tocar em código.
- **Motor**: `src/MapScene.tsx` (render por primitiva) + `src/engine.ts` (projeção, câmera, helpers).
- **Mapa base**: `src/data/countries.geo.json` (admin-0, property `name`).
- **Pele/cores**: bloco `pele` e `faccoes` no `spec.json`.

## Primitivas implementadas

`marcador` (com ícone que fica), `marchRoute` (rota animada + estandarte/águia + tropas que afinam,
`advance`/`retreat`), `siegeFall`, `convergencia`, `territoryAdvance` (pinta região, `pulso`),
`realce` (região piscando ao ser citada), `regionLabel`, `estandarte` (segue Napoleão),
`leaderReveal` (escudo + nome), `conexao` (arco Lisboa→Moscou), `diplomacia` (paz/guerra),
`reacao` (cluster de emoji), `callout`, `conceito`, `kicker`, `legenda`, `statFinal` (tipografia
centrada), `genealogia` (árvore por gerações com conectores), `datedSeal` (ano + evento),
`fade`. HUD: título, ano corrente, contador da Grande Armée derretendo, eixo do tempo com playhead
(só o ano ativo, sem amontoar).

## Estilo 2.5D (referência "History Mapped Out")

O mapa é um plano inclinado por perspectiva, com terra texturizada e sombra, nomes de território
em letra grande na terra, medalhões escuros (borda branca) para emojis, estandartes com laurel +
bandeira + retrato + nome, espadas/setas brancas e caixas de ano embaixo.

**Ajustes rápidos** (em `src/engine.ts`):
- `TILT_ANGLE_DEG` — inclinação 2.5D (0 = plano; ~32 = inclinado). Mexa e veja ao vivo no Studio.
- `TILT.P` — força da perspectiva.

**Cores dos territórios** (estilo feltro): mapa `FELT` no topo de `src/MapScene.tsx`.
**Nomes de território / rótulos de água**: `TERR_NAMES` e `WATER` em `MapScene.tsx`.

## Nota de engenharia

A best-practice oficial do Remotion sugere MapLibre para mapas com flyover. Optei por **SVG + d3-geo**
de propósito: roda offline dentro do ZIP, sem tiles/WebGL/chaves de API. As demais regras estão
seguidas: animação só por `useCurrentFrame()`/`interpolate()`/`Easing` (zero CSS animation), câmera por
keyframes interpolados, fontes via `@remotion/google-fonts`, duração derivada do spec.

Ícones são emoji do sistema (offline). Para trocar por seus assets de `public/markers`,`flags-square`,
`emoji`, basta ajustar os componentes em `MapScene.tsx`.

## Documentação (base reutilizável) — pasta `docs/`
- `00-VISAO-GERAL.md` — pipeline e mapa de arquivos
- `01-SPEC.md` — contrato do `spec.json` (primitivas/campos)
- `02-ENGINE.md` — motor (projeção, mapa global, câmera, tilt, camadas)
- `03-ESTILO.md` — sistema visual
- `04-RENDER-E-FOTOS.md` — render no Claude Code + retratos
- `05-PLAYBOOK.md` — receita p/ um vídeo novo + gate de qualidade
- `06-ASSETS.md` — bandeiras, retratos, ícones
- `07-LICOES.md` — armadilhas já resolvidas
