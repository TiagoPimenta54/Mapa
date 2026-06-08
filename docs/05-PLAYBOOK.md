# 05 — Playbook (reproduzir um vídeo novo com a mesma qualidade)

Receita fechada. Cada etapa aponta pro doc detalhado. O objetivo é: trocar roteiro + dados e ter o
mesmo padrão visual sem retrabalho de motor.

## 0. Decidir o teatro (uma vez por vídeo)
- O mapa-base é o **globo inteiro** (sempre). O que muda é o enquadramento via câmera.
- **Projeção** (`engine.ts`): `center` e `scale` da `geoMercator` pra centrar a região principal
  (Europa usa `center:[18,50]`, `scale:900`). Vídeo de outro continente/mundial → ajuste aqui.
- **Inclinação**: `TILT_ANGLE_DEG` (regional ~32; mundial ~10–15 ou 0).
- **Bandeiras/retratos**: ver `06-ASSETS.md`.

## 1. Roteiro → locução → word-json
O roteiro vem do **roteirista** (agente avulso; ver `INSTRUCOES-DO-PROJETO.md` §"Como usar"): narração
documentário, presente, cadeia causal. Locução + word-json no Darkvi. `meta.duracao` = fim da última palavra.

## 2. Pele e identidade (não repetir entre vídeos)
- `pele` no spec (HUD) + paleta **FELT** (`MapScene.tsx`): cor por facção. Cores distintas, nada de
  azul no mar azul. Fontes: Fraunces (display) + Oswald (rótulos).
- `BASE_TERR`: quais territórios já nascem coloridos (mapa "vivo").

## 3. Rótulos de mapa (`MapScene.tsx`)
- `TERR_NAMES`: nomes dos territórios. Use `ll:[lng,lat]` pra posicionar dentro do país, `size`, `rot`,
  `hollow`. Some sozinho se sai do quadro; encolhe no wide.
- `WATER`: rótulos de mar (itálico). `regioes` no spec: nomes EXATOS do geojson (conferir, ver `01-SPEC`).

## 4. Escrever a `timeline` (eu faço, casando os `t` reais)
Para cada beat, escolho a primitiva (tabela em `01-SPEC.md`). Padrões fixos do canal:
- **Personagem importante** → `leaderReveal` (estandarte) com `fica:true` pra permanecer no mapa.
- **Conquista** → `territoryAdvance` (`fica`) + `estandarte`.
- **Marcha/batalha** → `marchRoute`/`convergencia` + `siegeFall`.
- **Marco/data** → `datedSeal` (alimenta caixas de ano + legenda do evento).
- **Linhagem** → `genealogia` (tela cheia, fotos).
- **Número** → `statFinal` ou `forca`.
- **Câmera**: dê `cam` (`move`/`alvo`) aos beats; pan/zoom 2.5D de um lado a outro.

## 5. (Opcional) Retratos
`public/portraits/<arquivo>.png` + `leaderReveal.foto` / `genealogia.pessoas[].foto` (ver `04-RENDER`).

## 6. Gate de qualidade (conferir antes de fechar)
- [ ] Oceano azul com brilho costeiro; **sem corte preto** no topo (plano estende pra cima).
- [ ] Nomes de território dentro do país, sem encavalar no wide.
- [ ] Câmera sempre enquadra a ação (nada saindo pra fora; zoom não fecha demais).
- [ ] Estandartes dos personagens-chave presentes e persistentes quando preciso.
- [ ] Conquincas fincam cor/estandarte da facção certa; mapa cheio no fim (nada vazio).
- [ ] Marcos viram `datedSeal`; linhagem vira `genealogia`.
- [ ] Pele diferente do vídeo anterior (cor + fonte).
- [ ] Correções de transcrição aplicadas em rótulo/chave/iso.

## 7. Render (você, no Claude Code)
Comandos em `04-RENDER-E-FOTOS.md`. Iteração por print: você manda, eu ajusto `ll`/`size`/`cam`/`TILT`/paleta.

## Tunáveis (resumo)
`engine.ts`: projeção (`center`/`scale`), `TILT_ANGLE_DEG`, `ZOOM` (níveis de câmera).
`MapScene.tsx`: `FELT`, `FLAGS`, `BASE_TERR`, `TERR_NAMES`, `WATER`, `NEUTRAL`, `ACCENT`.
