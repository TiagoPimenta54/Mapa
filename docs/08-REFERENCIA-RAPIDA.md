# 08 — Referência rápida (decisão, transcrição, atlas)

Mapa de decisão pra escrever a `timeline` rápido + bibliotecas que crescem a cada vídeo.
(Migrado do antigo "arquiteto-remotion", já alinhado ao motor atual: mapa global, `FELT`, `FLAGS`,
`TERR_NAMES`, sem wrapper/`bbox`. As primitivas reais estão em `01-SPEC.md`.)

## Situação → primitiva

| A narração diz… | Primitiva | Câmera (`cam.move`) |
| --- | --- | --- |
| domina/ocupa um território | `territoryAdvance` (`para:[regiao]`, `fica`) | regional/push-in no território |
| território muda de dono | `territoryAdvance` reaplicado + `estandarte`/`regionLabel` | regional |
| marcha / desembarca / avança | `marchRoute` (`modo:"advance"`) | track na coluna |
| exército mingua / retirada | `marchRoute` (`modo:"retreat"`) + `forca` derretendo | track + pull-back |
| cerca uma cidade | `convergencia` (`de:[cidades]`) + `siegeFall` | close na cidade |
| dois exércitos se chocam | `siegeFall` (+ `convergencia` se há cerco) | close |
| nomeia um lugar ("repara aqui") | `marcador` + `callout` (ou `regionLabel`) | **push-in** |
| novo líder / reino | `leaderReveal` (+ `datedSeal`) | push-in |
| número / estatística | `statFinal`, ou `forca`+`hud`, ou `datedSeal` | mid/close |
| linhagem / sucessão | `genealogia` | mid |
| aliança / guerra entre dois lados | `diplomacia` (`icone:"paz"|"guerra"`) | mid |
| revolta / reação do povo | `reacao` (cluster de emoji) | close/mid |
| explicar um conceito | `conceito` (painel lateral) | — |
| abre capítulo / vira / frase | `kicker` / `legenda` | — |
| fim | `fade` | — |

**Magnitude** (não há campo "N ícones"): vive nos valores de `forca` (raide baixo, grande exército alto),
no nº de cidades em `convergencia` e na densidade de `marcador`. "Varreu tudo" → força alta + território
amplo + várias setas convergindo.

## Método ao receber o word-json
1. **Âncoras** — marque o `t` real (s) de cada substantivo concreto (lugar, pessoa, número, data, virada).
   `meta.duracao` = fim da última palavra.
2. **Correções de transcrição** (tabela abaixo) **antes** de virar chave/rótulo.
3. **Classifique** cada âncora numa primitiva (tabela acima).
4. **Posicione** via Atlas (abaixo). País = nome admin-0 EXATO do geojson.
5. Monte os blocos (`meta`/`pele`/`mapa`/`faccoes`/`regioes`/`lideres`/`forca`/`hud`) e a `timeline`.
6. **Gate de qualidade** (`05-PLAYBOOK.md`) antes de fechar. Travou/faltou asset → **para e reporta**,
   não inventa nome de campo, asset nem rosto.

## Correções de transcrição (o Darkvi mastiga nome próprio)
O sync casa com o termo errado do áudio; o **texto na tela**, a **chave** (`cidades`/`regioes`) e o
**iso2** da bandeira usam sempre o nome **correto**.

Padrões recorrentes: numeral romano vira palavra ("Henrique V" → "hinto"); título vira nome comum
("o Czar" → "Kizar"); nomes franceses/eslavos/antigos chegam fonéticos; cidade pequena de batalha é a
mais errada. **Cuidado de fato**: erro de segmentação troca o **sujeito** da frase (quem abdica é
Napoleão, não a Prússia) — confira o evento, não só a grafia.

| No áudio (errado) | Correto |
| --- | --- |
| Sinto / hinto | (Henrique) V |
| Kizar | (o) Czar |
| Cresci | Crécy |
| Trois | Troyes |
| Juan | Rouen |
| Tolley | Barclay de Tolly |
| armê / grande armê | Grande Armée |

(cresce a cada vídeo)

## Atlas — coords e teatros (cresce a cada vídeo)
> No spec, coordenadas entram como **`[lng, lat]`**. A lista abaixo está em `[lat, lng]` (inverter ao usar).
> Mapa-base é sempre o globo; o que muda é a projeção (`center`/`scale`) e o `TILT`.

| Teatro | center (lat,lng) | tilt sugerido |
| --- | --- | --- |
| Europa (geral) | ~50, 18 | ~32 |
| Europa Ocidental / França | ~47, 2 | ~32 |
| Europa Oriental / Rússia | ~52, 30 | ~25 |
| Península Ibérica | ~40, -4 | ~32 |
| Mediterrâneo / Roma | ~41, 14 | ~28 |
| Mundial (marcas/impérios) | conforme | ~10–15 ou 0 |

**Cidades `[lat,lng]`:**
- **França**: Paris 48.85,2.35 · Bordeaux 44.84,-0.58 · Reims 49.26,4.03 · Rouen 49.44,1.10 · Troyes 48.30,4.07 · Toulon 43.12,5.93 · Brienne 48.39,4.52.
- **Campanha russa**: Niemen/Kaunas 54.90,23.90 · Vilnius 54.69,25.28 · Smolensk 54.78,32.05 · Borodino 55.51,35.82 · Moscou 55.75,37.62 · Berezina/Borisov 54.32,28.50 · Leipzig 51.34,12.37.
- **Itália/Egito (Napoleão)**: Rivoli 45.57,10.81 · Lodi 45.31,9.50 · Marengo 44.85,8.77 · Alexandria(EG) 31.20,29.92.
- **Marcos finais**: Elba 42.78,10.30 · Waterloo 50.68,4.41 · Santa Helena 38.72,-9.14 *(real -15.96,-5.7; ver `07-LICOES` — o tilt comprime o sul, usar licença visual)*.
- **Ibéria (stub)**: Covadonga 43.31,-5.00 · Toledo 39.86,-4.02 · Las Navas 38.28,-3.58 · Córdoba 37.89,-4.78 · Granada 37.18,-3.60 · Lisboa 38.72,-9.14.
- **Roma/Aníbal (stub)**: Cartago 36.85,10.32 · Canas 41.30,16.13 · Zama 36.30,9.40 · Roma 41.90,12.50 · Alpes ~45.0,7.0.
- **Alexandre (stub)**: Pella 40.76,22.52 · Isso 36.90,36.20 · Gaugamela 36.36,43.25 · Babilônia 32.54,44.42.
