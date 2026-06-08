# 02 — Motor (engine.ts + MapScene.tsx)

## Projeção
`d3.geoMercator().center([18,50]).scale(900).translate([960,540])`. `project([lng,lat]) → [x,y]` base.
Os polígonos do país viram `path` (com centroide). Tudo determinístico (renderiza igual no still e no vídeo).

**Mapa GLOBAL**: desenha o mundo inteiro (todas as features). Saneamento automático das geometrias do
dataset: normaliza longitudes p/ [-180,180] (corta o antimeridiano — Rússia/Fiji deixam de "vazar"),
reverte anéis de quem ficou com path gigante por winding errado (ex: Bermuda) e descarta o que ainda
sobrar degenerado (ex: Antártida). Pra focar num teatro, é a **câmera** (`cam`) que enquadra a região —
o mapa-base é sempre o globo.

## Câmera (keyframes)
`buildKeyframes()` lê todo evento com `cam`, cria um keyframe em `t0×fps` com alvo (`cam.alvo`→`em`→anterior) e
zoom por `move` (`ZOOM`). `cameraAt(frame)` interpola lng/lat/zoom (suavizado). `mapTransform(cam)` é o
`<g>` do mapa; `makeToScreen(cam)` projeta um geo pra tela 2D (pré-tilt).

**Contraste de zoom**: `ZOOM` (engine) define o quão perto cada `move` chega (panorama `wide`/`space` baixo,
detalhe `push-in`/`close` alto). **Escala dos ícones**: medalhões/estandartes/emojis crescem com o zoom
(`k` em `MapScene.tsx`), então no close eles aparecem grandes e legíveis; no panorama, menores.

## 2.5D (plano inclinado)
`TILT_ANGLE_DEG` (≈32) + `TILT.P` (perspectiva). A **terra** é uma `<div>` com
`transform: perspective(P) rotateX(deg)` (= `tiltCSS`/`tiltOrigin`). Os **overlays em pé**
(medalhões, estandartes) são posicionados por `tilt(toScreen(geo))` num SVG **não** inclinado — então
ficam plantados no chão mas verticais. Mudar o ângulo: só `TILT_ANGLE_DEG` em `engine.ts` (0 = plano).

**Plano estendido (sem bordas)**: a `<div>` da terra é maior que o quadro (`PADX`=1200 nos lados,
`PADT`=900 no topo, em `MapScene.tsx`) pra o trapézoide cobrir os 4 cantos da tela — senão aparecem
arestas/orelhas diagonais. Não estende pra baixo (não cobre o HUD inferior).

**Cuidado — o tilt comprime o extremo sul**: pontos muito ao sul do centro (lat bem negativa) "sobem" e
ficam visualmente colados na costa. Pra cenas que vão longe ao sul ou globais, use `TILT_ANGLE_DEG` menor
(~10–15) ou reposicione o ponto (licença visual). Ex.: Santa Helena ficou melhor empurrada p/ oeste.

## Camadas de render (MapScene)
1. `AbsoluteFill` = oceano azul (gradiente, sem preto).
2. **Terra** (div inclinada): oceano (rect enorme) + **brilho costeiro** (filtro `coast`, água mais clara
   na borda) + países (feltro) + fills/realces de evento + nomes de território + rótulos de água +
   rotas/setas. Tudo em coords base dentro do `<g>` (a câmera move; o CSS inclina).
3. **Overlay em pé** (SVG não inclinado): medalhões, estandartes, espadas, callouts em `tilt(toScreen(geo))`.
4. **HUD** (html): título, contador de força, legenda do evento, caixas de ano, genealogia, statFinal,
   conceito, fade, vinheta.

## Adicionar/ajustar uma primitiva
No `switch (e.prim)` do `MapScene.tsx`: empurre em `ground` (na terra, coords base) ou em `upright`
(em pé, `ov(geo)` = `tilt(toScreen)`), ou em `hud` (html). Use `win(t0,t1,fica)` pra opacidade de
entrada/saída e `interpolate`/`Easing`/`spring` do Remotion (nunca CSS animation).

## Fotos (retratos)
`leaderReveal.foto` e `genealogia.pessoas[].foto` apontam para `public/portraits/<arquivo>` (via
`staticFile`). Sem foto, cai na silhueta. Recorte circular automático.
