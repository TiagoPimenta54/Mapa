# 07 — Lições aprendidas (armadilhas já resolvidas)

Registro do que quebrou e como foi resolvido, pra não repetir nos próximos vídeos.

## Mapa-base (geojson)
- **Bermuda cobrindo o oceano de bege.** Algumas features do dataset têm o anel exterior no sentido
  errado (winding) e o d3 as interpreta como "mundo inteiro menos a ilha", preenchendo tudo. → O motor
  detecta path com bbox "quadrado-mundo" e **reverte os anéis** dessa feature.
- **Rússia/Fiji "vazando" pelo antimeridiano.** Coordenadas desenroladas (>180) confundem o corte do
  antimeridiano. → O motor **normaliza longitudes p/ [-180,180]** antes de projetar.
- **Não cortar país grande achando que é degenerado.** A Rússia é genuinamente larga em Mercator; o
  critério de "degenerado" exige bbox grande em **largura E altura** (quadrado-mundo), senão derruba a Rússia.
- **Antártida/polos.** Em Mercator o polo vai a infinito; o que sobra degenerado após o saneamento é
  **descartado** (não atrapalha porque ninguém anima o polo).

## Câmera
- **Zoom fechado demais corta tudo e some o mar.** Já tivemos `close` em 3.2 → elementos saíam do quadro
  e só aparecia terra. Equilíbrio atual: panorama `wide`~0.8, detalhe `close`~2.8, com a **câmera centrando
  no `cam.alvo`** do beat. Todo beat de detalhe precisa de `cam.alvo` no elemento certo.
- **Afastado demais = sem movimento.** Devolver o **contraste** de `ZOOM` (panorama ↔ close) deu a
  sensação de aproximação. Ícones que **escalam com o zoom** (fator `k`) completam: perto = grandes.

## 2.5D / bordas
- **Borda preta no topo e arestas nas laterais.** O plano inclinado é um trapézoide; a perspectiva
  encolhe o topo (e em largura). → Estender a `<div>` da terra além do quadro (`PADX`/`PADT`) cobre os 4
  cantos. **Não** ligar `overflow:visible` com rect gigante (o plano 3D passa a cobrir o HUD).
- **O sul comprime.** Pontos muito ao sul "sobem" e colam na costa. Reduzir o tilt ou reposicionar.

## Render / Remotion
- **Sem animação por CSS.** Usar `useCurrentFrame`+`interpolate`/`spring`/`Easing` (determinístico).
- **Tudo offline.** Assets em `public/` via `staticFile` — nada de URL externa no render.
- **Validar antes de entregar.** `esbuild` (sintaxe) + render de still pra amostrar cor (foi assim que
  achamos a Bermuda). Conferir oceano azul, nomes dentro do país, bordas cobertas, elementos no quadro.

## Estilo
- **Variar a pele a cada vídeo** (paleta + fonte + HUD), senão tudo vira igual.
- **Emoji com sombrinha** (sem círculo) lê melhor. **Estandarte**: coroa/ícone no topo, retrato com
  borda da facção, nome abaixo — sem empilhar troféu+bandeira+retrato.
