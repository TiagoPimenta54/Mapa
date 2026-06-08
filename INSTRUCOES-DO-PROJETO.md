# INSTRUÇÕES DO PROJETO — "História num Mapa" (motor Remotion 2.5D)

Este é o manual de operação do projeto. Quem produz um vídeo (eu, o Claude, escrevendo o spec; ou o
Claude Code, renderizando) segue daqui. Os detalhes técnicos estão na pasta `docs/` — este arquivo é o
mapa-mestre que aponta pra eles e fixa as regras que **não** podem ser quebradas.

---

## Como usar (início de sessão)

O projeto vive em **dois lugares**, e cada um liga um "modo":

**1. Roteirista** — fica **avulso na memória do projeto** (`1-roteirista.md`), fora do repo, porque é a
etapa criativa anterior ao Remotion. **Ative quando o assunto é escrever a história:** chega um tema/título
("novo vídeo sobre…", "roteiriza isso", "tenho um tema"). Ele escreve a narração documentário e entrega
**um `Roteiro.txt`** por título — prosa crua, pronta pra locução, densa em nomes/datas/números/parentescos,
tudo "animável no mapa". Terminado o roteiro, a bola passa pra produção (este repo).

**2. Produção (este repo, GitHub `TiagoPimenta54/Mapa`)** — todo o resto: locução → word-json → `spec.json`
→ render. **Ative quando o assunto é transformar o roteiro em vídeo:** "vamos montar o spec", "ajusta a
câmera", "renderiza", "o mapa tá cortando". Aqui valem o pipeline (§2), as regras (§5) e os docs (`docs/`).

Regra prática: **história/texto → roteirista** · **mapa/motor/spec/render → repo**. O roteirista entrega o
`Roteiro.txt`; o repo cuida de tudo dali pra frente.

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
2. **Locução + word-json** — no Darkvi. A **locução (mp3)** posso gerar por aqui (tenho as ferramentas
   de TTS do Darkvi); o **word-json** (régua de tempo, cada palavra com `start`/`end`) vem do app Darkvi.
   `meta.duracao` = fim da última palavra.
3. **spec.json** — o vídeo inteiro como dado. **Eu escrevo**, casando cada beat no `t` real do word-json,
   seguindo `docs/01-SPEC.md` (contrato) + `docs/03-ESTILO.md` (visual).
4. **Render** — **você**, no Claude Code: `npm install` → `npx remotion studio` (preview) →
   `npx remotion render`.

## 3. Divisão de trabalho

- **Eu (Claude)**: roteiro, spec.json, e ajustes de motor (novas primitivas, estilo, câmera).
- **Você (Claude Code / PC)**: rodar, renderizar, colocar assets (`public/portraits/`, `public/flags/`,
  `public/narracao.mp3`) e **versionar** (`git add/commit/push`).
- **Iteração**: você manda print → eu ajusto (`cam`, `ll`/`size` de nomes, `TILT`, paleta, etc.).

### Fonte da verdade: GitHub (`TiagoPimenta54/Mapa`)
O repositório é o lar do projeto e está linkado à memória do projeto (vejo o código como contexto).
Ciclo: **eu entrego arquivos novos/alterados aqui → você dá `git add/commit/push` → o repo atualiza**.
Eu **não** faço commits/push direto no GitHub; quem versiona é você. O `.gitignore` já ignora
`node_modules` e `out/`.

## 4. Para um vídeo NOVO (passo a passo) — detalhe em `docs/05-PLAYBOOK.md`

**Tudo de um vídeo vive no `spec.json`. O motor (`engine.ts`/`MapScene.tsx`) NÃO se edita por vídeo.**

1. **Projeção/teatro** — no `spec.mapa`: `center`/`scale` (centrar a região), `tilt`
   (regional ~28–32; **mundial/marcas ~10–15 ou 0** — tilt forte distorce o globo todo). Mapa-base = mundo.
2. **Pele** (paleta + fonte + HUD) — **DIFERENTE de cada vídeo**: `spec.pele` (`accent`, `fontDisplay`,
   `neutral`, `felt` por facção, `flags`).
3. **Rótulos** — no `spec.mapa`: `terrNames` (nomes de país, `ll`/`size`/`rot`/`hollow`), `water` (mares),
   `nomes` (cidades). `regioes` com nomes EXATOS do geojson.
4. **Bandeiras/retratos**: `docs/06-ASSETS.md` (retratos em `public/portraits/`, campo `foto`).
5. **timeline**: casando os `t` reais (primitivas em `docs/01-SPEC.md`). Personagem que se move → `leaderMarch`.
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
| `00-VISAO-GERAL.md` | mapa de arquivos e tunáveis (onde mexer) |
| `01-SPEC.md` | contrato do `spec.json` (todas as primitivas e campos) |
| `02-ENGINE.md` | motor: projeção, mapa global, câmera, 2.5D, camadas |
| `03-ESTILO.md` | sistema visual (oceano, feltro, estandartes, HUD, genealogia) |
| `04-RENDER-E-FOTOS.md` | comandos de render + retratos |
| `05-PLAYBOOK.md` | receita de um vídeo novo + gate de qualidade |
| `06-ASSETS.md` | bandeiras, retratos, ícones (como guardar e referenciar) |
| `07-LICOES.md` | armadilhas já resolvidas |
| `08-REFERENCIA-RAPIDA.md` | narração→primitiva, correções de transcrição, atlas de coords |

## 7. Rodar (resumo)

```bash
git clone https://github.com/TiagoPimenta54/Mapa.git   # 1ª vez (ou: git pull p/ atualizar)
cd Mapa
npm install
npx remotion studio                      # preview ao vivo (comp "Napoleao", 1920x1080, 30fps)
npx remotion render Napoleao out/video.mp4
```
Áudio: `public/narracao.mp3` + `HAS_AUDIO = true` no topo de `src/MapScene.tsx`.

## 8. Backlog (próximas melhorias)

- HUD: **timeline em linha** (de ponta a ponta) + **2 indicadores no topo** (gráficos/números por tipo de conteúdo).
- **Sistema de temas** (paletas + fontes + estilo de HUD) pra variar o design entre vídeos.
- Legendas sincronizadas (a partir do word-json). Ken Burns sutil. Retratos/bandeiras históricas reais.
