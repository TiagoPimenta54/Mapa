# 00 — Visão geral e mapa de arquivos

Esta pasta `docs/` é a **base técnica** do motor. O processo (pipeline, divisão de trabalho, regras) está
no manual-mestre **`INSTRUCOES-DO-PROJETO.md`** — não repetimos aqui. Este doc é a referência de **onde
está cada coisa** no projeto.

## Mapa de arquivos

| Arquivo | Papel |
| --- | --- |
| `INSTRUCOES-DO-PROJETO.md` | manual-mestre (processo + regras + índice dos docs) |
| `src/data/spec.json` | o vídeo como dado — editar aqui muda a animação, sem tocar no motor |
| `src/data/countries.geo.json` | mapa-base admin-0 do mundo (property `name`) |
| `src/engine.ts` | núcleo puro: projeção, câmera por keyframes, tilt 2.5D, emoji/marks, helpers |
| `src/MapScene.tsx` | render por primitiva (terra inclinada + medalhões/estandartes em pé + HUD) + as peles (`FELT`, `TERR_NAMES`, `WATER`…) |
| `src/Root.tsx` | a Composition (duração = `meta.duracao × fps`) |
| `public/flags/` | bandeiras `iso2.svg` (modernas — aproximação; trocar por históricas quando der) |
| `public/portraits/` | retratos `NN-nome.png` p/ `leaderReveal.foto` e `genealogia` |
| `public/narracao.mp3` | locução (opcional; ligar `HAS_AUDIO`) |
| `docs/01–08` | esta base técnica |

## Os tunáveis (onde mexer pra ajustar)
- **Projeção/teatro** (`engine.ts`): `center`/`scale` da `geoMercator`, `TILT_ANGLE_DEG`, níveis de `ZOOM`.
- **Pele/rótulos** (`MapScene.tsx`): `FELT`, `FLAGS`, `BASE_TERR`, `TERR_NAMES`, `WATER`, `NEUTRAL`, `ACCENT`.
- **Conteúdo** (`spec.json`): blocos `meta`/`pele`/`mapa`/`faccoes`/`regioes`/`lideres`/`forca`/`hud`/`timeline`.

Pipeline e receita de um vídeo novo: `INSTRUCOES-DO-PROJETO.md` (§2 e §4) + `05-PLAYBOOK.md`.
