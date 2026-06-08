# INSTRUÇÕES DO PROJETO — "História num Mapa" (motor Remotion 2.5D)

Este é o manual de operação do projeto. Quem produz um vídeo (eu, o Claude, escrevendo o spec; ou o
Claude Code, renderizando) segue daqui. Os detalhes técnicos estão na pasta `docs/` — este arquivo é o
mapa-mestre que aponta pra eles e fixa as regras que **não** podem ser quebradas.

---

## 1. O que é

Vídeos no estilo "história num mapa" (referência: History Mapped Out): mapa-múndi 2.5D inclinado, terra
de feltro, oceano azul, estandartes de personagens, ícones/emojis aparecendo conforme a narração, e a
câmera passeando de um lado a outro — panorama quando precisa de escala, close quando precisa de detalhe.

**Três vertentes** (o esqueleto narrativo é o mesmo: gancho → palco → desenvolvimento em cadeia → virada → legado):
- **Expansão e domínio de impérios** — território muda de dono; batalhas, datas, tropas, cidades.
- **Vida num mapa** — uma trajetória (uma pessoa, um rio, uma rota) marco a marco.
- **Expansão de marcas** — uma empresa conquista mercados; cronologia de países, números crescendo.
  (Costuma pegar o **globo inteiro** — o motor já desenha o mundo todo.)

## 2. Pipeline (sempre nesta ordem)

```
roteiro (.txt)  →  locução + word-json (Darkvi)  →  spec.json  →  render (Claude Code)
```

1. **Roteiro** — narração documentário, presente, cadeia de causa e consequência, densa em nomes/datas/
   números/parentescos. Cada coisa dita tem que ser "animável no mapa".
2. **Locução + word-json** — gerados no Darkvi; o word-json é a régua de tempo (cada palavra com `start`/`end`).
   `meta.duracao` = fim da última palavra.
3. **spec.json** — o vídeo inteiro como dado. **Eu escrevo**, casando cada beat no `t` real do word-json,
   seguindo `docs/01-SPEC.md` (contrato) + `docs/03-ESTILO.md` (visual).
4. **Render** — **você**, no Claude Code: `npm install` → `npx remotion studio` (preview) →
   `npx remotion render`.

## 3. Divisão de trabalho

- **Eu (Claude)**: roteiro, spec.json, e ajustes de motor (novas primitivas, estilo, câmera).
- **Você (Claude Code / PC)**: rodar, renderizar, e colocar assets (`public/portraits/`, `public/flags/`,
  `public/narracao.mp3`).
- **Iteração**: você manda print → eu ajusto (`cam`, `ll`/`size` de nomes, `TILT`, paleta, etc.).

## 4. Para um vídeo NOVO (passo a passo) — detalhe em `docs/05-PLAYBOOK.md`

1. **Projeção/teatro** (`engine.ts`): `center`/`scale` da `geoMercator` pra centrar a região; `TILT_ANGLE_DEG`
   (regional ~32; **mundial/marcas ~10–15 ou 0** — o tilt forte distorce o globo todo). O mapa-base é sempre o mundo.
2. **Pele** (paleta + fonte + HUD) — **DIFERENTE de cada vídeo anterior**. `FELT`/`pele`.
3. **Rótulos**: `TERR_NAMES` (nomes de país, com `ll`/`size`/`rot`), `WATER` (mares), `regioes` (nomes EXATOS do geojson).
4. **Bandeiras/retratos**: `docs/06-ASSETS.md`.
5. **timeline**: eu escrevo, casando os `t` reais (primitivas em `docs/01-SPEC.md`).
6. **Gate de qualidade** (checklist em `docs/05-PLAYBOOK.md`) antes de fechar.
7. **Render** no Claude Code.

## 5. Regras que NÃO se quebram

- **Fatos reais** (datas, lugares, números, parentescos). Fonte incerta → "estima-se que…", não inventar.
- **Tudo animável no mapa** — todo trecho da narração vira lugar/rota/número/rosto na tela.
- **Pele diferente a cada vídeo** (cor + fonte). Nada de repetir o visual.
- **Personagens importantes = estandarte** (`leaderReveal`) e ficam no mapa quando preciso (`fica:true`).
- **Câmera viva**: panorama pra escala, close pra detalhe; nunca parada e distante sem motivo; nunca cortando elemento.
- **`regioes` com nome EXATO do geojson** (conferir contra o arquivo, nunca de memória).
- **Sem animação por CSS** no Remotion; só `useCurrentFrame`+`interpolate`/`spring`.
- **Tudo offline**: assets em `public/` via `staticFile` — nada de URL externa no render final.
- **Evitar os erros já mapeados** em `docs/07-LICOES.md` (Bermuda/winding, antimeridiano, zoom que corta,
  bordas do trapézoide, compressão do sul).

## 6. Índice da documentação (`docs/`)

| Doc | Conteúdo |
| --- | --- |
| `00-VISAO-GERAL.md` | pipeline e mapa de arquivos |
| `01-SPEC.md` | contrato do `spec.json` (todas as primitivas e campos) |
| `02-ENGINE.md` | motor: projeção, mapa global, câmera, 2.5D, camadas |
| `03-ESTILO.md` | sistema visual (oceano, feltro, estandartes, HUD, genealogia) |
| `04-RENDER-E-FOTOS.md` | comandos de render + retratos |
| `05-PLAYBOOK.md` | receita de um vídeo novo + gate de qualidade |
| `06-ASSETS.md` | bandeiras, retratos, ícones (como guardar e referenciar) |
| `07-LICOES.md` | armadilhas já resolvidas |

## 7. Rodar (resumo)

```bash
npm install
npx remotion studio                      # preview ao vivo (comp "Napoleao", 1920x1080, 30fps)
npx remotion render Napoleao out/video.mp4
```
Áudio: `public/narracao.mp3` + `HAS_AUDIO = true` no topo de `src/MapScene.tsx`.

## 8. Backlog (próximas melhorias)

- HUD: **timeline em linha** (de ponta a ponta) + **2 indicadores no topo** (gráficos/números por tipo de conteúdo).
- **Sistema de temas** (paletas + fontes + estilo de HUD) pra variar o design entre vídeos.
- Legendas sincronizadas (a partir do word-json). Ken Burns sutil. Retratos/bandeiras históricas reais.
