# 04 — Render (Claude Code / PC) e fotos

## Rodar
```bash
git clone https://github.com/TiagoPimenta54/Mapa.git   # 1ª vez (depois: git pull)
cd Mapa
npm install
npx remotion studio          # preview ao vivo (comp "Napoleao", 1920x1080, 30fps)
```

## Renderizar o vídeo
```bash
npx remotion render Napoleao out/napoleao.mp4
# 1 frame para conferir um instante (ex.: t=20s -> frame 600):
npx remotion still Napoleao out/t20.png --frame=600
```
A duração vem de `meta.duracao × 30` (definida em `src/Root.tsx`).

## Locução (áudio)
Coloque o mp3 em `public/narracao.mp3` e troque `HAS_AUDIO = true` no topo de `src/MapScene.tsx`.
O spec já está casado nos tempos reais do word-json (duração 941.72s).

## Tunáveis rápidos
- Inclinação 2.5D: `TILT_ANGLE_DEG` (e `TILT.P`) em `src/engine.ts` (0 = mapa plano).
- Cores de território: `FELT` em `src/MapScene.tsx`.
- Nomes de território / rótulos de água: `TERR_NAMES` e `WATER` em `src/MapScene.tsx`.

## Fotos / retratos (estandartes e genealogia)
1. Crie `public/portraits/` e jogue os arquivos, ex.: `napoleao.png`, `josephine.png`, `alexandre.png`
   (quadrados, ~400×400, fundo qualquer — o recorte é circular).
2. No `spec.json`, referencie pelo nome do arquivo:
   ```jsonc
   { "prim":"leaderReveal", "t0":319.2, "em":"paris", "facao":"franca",
     "rotulo":"Napoleão I", "fica":true, "foto":"napoleao.png" }
   ```
   ```jsonc
   { "prim":"genealogia", "t0":..., "pessoas":[
       { "id":"nap","nome":"Napoleão","papel":"Imperador","geracao":0,"foto":"napoleao.png" },
       { "id":"jos","nome":"Joséphine","papel":"Imperatriz","geracao":0,"foto":"josephine.png" }
     ], "ligacoes":[["nap","jos"]] }
   ```
3. Sem `foto`, aparece a silhueta (fallback). Nada quebra se o arquivo faltar.

## Divisão de trabalho
- **Eu (Claude)**: escrevo/ajusto `spec.json` e o motor (novas primitivas/estilo).
- **Você (Claude Code/PC)**: `npm install`, `studio`, `render`, e coloca `portraits/` + `narracao.mp3`.
- Iteração: você manda print → eu ajusto. Para um vídeo novo, sigo `01-SPEC.md`+`03-ESTILO.md`.
