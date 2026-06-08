# 01 — Contrato do `spec.json` (este motor)

Coordenadas de cidade/foco são **`[lng, lat]`**. Tempo em **segundos**. `.json` não aceita comentário.

## Blocos de topo

```jsonc
{
  "meta":   { "titulo": "...", "slug": "...", "duracao": 941.72 },   // duracao = fim da última palavra
  "pele":   { "bg","accent","text","muted","frost","fontDisplay" },  // HUD; mapa usa paleta feltro (03-ESTILO)
  "mapa":   { "foco": [lng,lat], "cidades": { "chave": [lng,lat] }, "rotulos": { "chave": [lng,lat] } },
  "faccoes":{ "franca": { "nome","cor","corFundo" }, ... },          // cor é sobrescrita pela paleta FELT
  "regioes":{ "franca": ["France"], "italia": ["Italy"], ... },       // CHAVE -> nomes EXATOS do geojson (admin-0)
  "lideres":{ "franca": { "facao","rotulo","sub" } },
  "forca":  [[t, valor], ...],   "forcaMax": 600000,                  // contador derretendo no HUD
  "hud":    { "timeline":true, "temperatura":true, "baixas":true },
  "timeline": [ /* eventos */ ]
}
```

## Eventos — campos comuns

`t0` (início, s) · `t1` (fim, s) · `fica` (true = persiste até o fim) · `prim` (primitiva) ·
`cam` `{ "move", "alvo", "orbita" }` · posição por `em` (chave de cidade) **ou** `regiao` (chave) ·
`pulso` (região pisca) · `facao`/`bandeira` (cor) · `texto` · `icone`.

`cam.move` ∈ `space · wide · pull-back · regional · drift · mid · track · push-in · close`.
`cam.alvo` = chave de `cidades`/`rotulos`/`foco`. A câmera interpola entre keyframes (cada `cam` é um).

## Primitivas (todas implementadas no motor)

| prim | campos | o que desenha |
| --- | --- | --- |
| `leaderReveal` | `em, facao, rotulo, emblema?, foto?, fica?` | **ESTANDARTE** (ícone/coroa no topo + retrato com borda da facção + nome). É o elemento central; `fica:true` pra ficar no mapa. `emblema` troca o ícone do topo (padrão 👑). |
| `estandarte` | `em, facao` | bandeira no mastro (usa SVG real de `public/flags/` via `FLAGS`; fallback colorido) |
| `marcador` | `em, icone` | medalhão escuro (borda branca) com ícone; ícone de lugar ganha rótulo |
| `territoryAdvance` | `para:[regiaoKey], facao, fica?, pulso?` | pinta região(ões) na cor da facção (persiste com `fica`) |
| `realce` | `regiao, pulso?` | destaca região citada (contorno que pulsa) sem pintar |
| `regionLabel` | `regiao, bandeira, texto?` | tinge região leve na cor da bandeira |
| `marchRoute` | `rota:[cidadeKey], modo:"advance"|"retreat", facao` | seta branca animada + estandarte/águia na cabeça |
| `convergencia` | `de:[cidadeKey], alvo` | setas brancas convergindo no alvo |
| `conexao` | `de:[cidadeA, cidadeB]` | arco branco ponto-a-ponto + pinos |
| `siegeFall` | `em, facao` | espadas brancas com "pop" + rótulo da cidade |
| `reacao` | `em, icone(emoji)` | cluster de medalhões emoji (raiva/medo/fogo/reza...) |
| `diplomacia` | `em, icone:"paz"|"guerra", entre:[facao,facao]` | 🕊️/⚔️ no ponto |
| `datedSeal` | `ano, evento` | alimenta as **caixas de ano** (rodapé) e a **legenda do evento** |
| `genealogia` | `pessoas:[{id,nome,papel,geracao,foto?,casa?}], ligacoes:[[id,id]]` | **árvore** em tela cheia (gerações + conectores), pronta pra fotos |
| `statFinal` | `texto, centro?` | tipografia grande **centralizada** (com scrim) |
| `conceito` | `texto` | painel lateral |
| `kicker` | `texto` | título em caps no topo |
| `legenda` | `texto` | frase grande no terço inferior |
| `callout` | `em, texto` | pílula legível perto de um ponto |
| `fade` | — | corte para preto |

## Regras

- `regioes` usa o **nome EXATO** da feature do `countries.geo.json` (property `name`: `France`, `Belgium`,
  `Germany`, `Spain`, `Russia`, `United Kingdom`, `Egypt`...). Conferir contra o arquivo, nunca de memória.
- `meta.duracao` = duração do mp3 (a comp em frames = `duracao × fps`, fps 30).
- Estandartes de personagens importantes: `leaderReveal` com `fica:true` pra **ficarem no mapa**.
- Câmera viva: dê `cam` aos beats; o tilt 2.5D é fixo, a câmera só faz pan/zoom de um lado a outro.
