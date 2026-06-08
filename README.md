# História num Mapa — motor Remotion 2.5D

Vídeos no estilo "história num mapa" (ref.: *History Mapped Out*): mapa-múndi 2.5D inclinado, terra de
feltro, oceano azul, estandartes, ícones surgindo com a narração e câmera passeando. O vídeo inteiro é
**dado** (`src/data/spec.json`) dirigido pelos timestamps do word-json do Darkvi. Roda 100% offline em
Remotion (SVG + d3-geo, sem tiles/WebGL/internet). Vídeo de exemplo: *A vida de Napoleão em um Mapa*.

## Rodar
```bash
git clone https://github.com/TiagoPimenta54/Mapa.git   # 1ª vez (depois: git pull)
cd Mapa
npm install
npx remotion studio                      # preview (comp "Napoleao", 1920×1080, 30fps)
npx remotion render Napoleao out/video.mp4
```
Requisitos: Node.js 18+. Áudio: `public/narracao.mp3` + `HAS_AUDIO = true` no topo de `src/MapScene.tsx`.

## Por onde começar
- **`INSTRUCOES-DO-PROJETO.md`** — o manual-mestre: o que é, pipeline, divisão de trabalho, regras e
  como usar. **Leia este primeiro.**
- **`docs/`** — detalhes técnicos (contrato do spec, motor, estilo, render, playbook, assets, lições,
  referência rápida). O índice está no manual-mestre (§6).

## Editar sem mexer no motor
Conteúdo e timing vivem em `src/data/spec.json` (cada evento tem `t0/t1`, `prim` e campos). Pele/cores
em `pele`+`faccoes` (spec) e `FELT`/`TERR_NAMES` (`src/MapScene.tsx`). Detalhe em `docs/01-SPEC.md` e
`docs/03-ESTILO.md`.
