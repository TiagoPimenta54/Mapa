# 06 — Assets (bandeiras, retratos, ícones)

Tudo fica em `public/` e é referenciado por `staticFile(...)`, então roda offline (tudo versionado no repo).

## Bandeiras — `public/flags/<iso2>.svg`
O motor mapeia facção → arquivo em `FLAGS` (no topo de `MapScene.tsx`). Sem o arquivo, cai no
retângulo colorido da facção (fallback), então nunca quebra.

| Facção (chave) | Arquivo | iso2 |
| --- | --- | --- |
| franca | `fr.svg` | fr |
| austria | `at.svg` | at |
| russia | `ru.svg` | ru |
| prussia | `de.svg` | de (proxy) |
| gra_bretanha | `gb.svg` | gb |
| espanha | `es.svg` | es |

Já incluí SVGs **modernos** (pack `flag-icons`, MIT — github.com/lipis/flag-icons, pasta `flags/4x3`).
Eles são uma **aproximação**: pra época napoleônica o ideal é trocar pelos **históricos**
(Primeiro Império Francês, Áustria Habsburgo, Rússia Imperial, Reino da Prússia…). Fontes de SVG
histórico/heráldico de domínio público: **Wikimedia Commons** (busque "Flag of the First French Empire"
etc.) e **Flagpedia/flagcdn** (`flagcdn.com`) p/ modernos. Baixe o SVG e salve com o mesmo nome
(`fr.svg`, `at.svg`…) que já está ligado.

Adicionar uma facção nova: salve `public/flags/<iso2>.svg` e acrescente a linha em `FLAGS`.

## Retratos — `public/portraits/<arquivo>.png`
Usados em `leaderReveal.foto` e `genealogia.pessoas[].foto`. Quadrados (~400×400); recorte circular
automático; sem foto, mostra a silhueta. Ex.: `napoleao.png`, `josephine.png`, `alexandre.png`.

## Ícones / emojis
Os marcadores usam **emoji nativo com sombrinha** (sem círculo). Não precisa de arquivo. Se quiser
ícones custom (SVG/PNG bonitos animados), o caminho é o mesmo: salvar em `public/icons/` e referenciar
por `staticFile`. SVG é o melhor formato (escala sem perder qualidade). Animado: prefira SVG com
`<animate>` simples ou Lottie via lib — use com parcimônia pra não pesar o render.

## Como o asset entra no código
`staticFile("flags/fr.svg")`, `staticFile("portraits/napoleao.png")`, `staticFile("icons/x.svg")`.
Nunca use URL externa no render final (pra rodar offline). Tudo que está em `public/` é empacotado.
