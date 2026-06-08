# 00 — Visão geral (base "História num Mapa" / Remotion 2.5D)

Esta pasta `docs/` é a **base**: documenta tudo que é preciso pra produzir uma animação. O fluxo é:

```
roteiro (.txt)  →  locução + word-json (Darkvi)  →  spec.json  →  render (Claude Code / Studio)
```

- **Roteiro**: narração crua (vide o roteirista). Vira locução no Darkvi.
- **Word-json**: cada palavra com `start`/`end`. É a régua de tempo dos eventos.
- **spec.json**: o vídeo inteiro como dado (este projeto lê `src/data/spec.json`). Quem escreve isto sou eu (Claude), casando cada beat no `t` real do word-json. **Contrato completo → `01-SPEC.md`.**
- **Render**: você roda no Claude Code/PC (`npm install` + `npx remotion studio`). Eu não renderizo; eu escrevo o spec e ajusto o motor.

## Mapa de arquivos

| Arquivo | Papel |
| --- | --- |
| `src/data/spec.json` | o vídeo como dado (editar aqui muda a animação) |
| `src/data/countries.geo.json` | mapa base admin-0 (property `name`) |
| `src/engine.ts` | projeção, câmera por keyframes, tilt 2.5D, emoji, helpers |
| `src/MapScene.tsx` | render por primitiva (terra inclinada + medalhões/estandartes em pé + HUD) |
| `src/Root.tsx` | Composition (duração = `meta.duracao × fps`) |
| `public/portraits/` | retratos `NN-nome.png` usados em `leaderReveal.foto` e `genealogia` |
| `public/narracao.mp3` | locução (opcional; ligar `HAS_AUDIO`) |
| `docs/*` | esta base |

## Para um vídeo novo

1. Escrevo o `Roteiro.txt`. 2. Você gera locução + word-json no Darkvi. 3. Eu escrevo o `spec.json`
casando os `t` reais (seguindo `01-SPEC.md` + `03-ESTILO.md`). 4. (Opcional) você joga retratos em
`public/portraits/`. 5. Você renderiza no Claude Code. 6. Iteramos com prints.
