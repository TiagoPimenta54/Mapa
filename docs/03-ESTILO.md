# 03 — Estilo (sistema visual)

Referência: canais "História num Mapa" (ex.: History Mapped Out). Plano 2.5D, terra de feltro,
estandartes como protagonista, emojis/ícones em medalhões.

## Oceano
- Fundo da tela e do plano: **azul** em gradiente (claro no topo = horizonte, escuro embaixo). Sem preto.
- **Brilho costeiro**: faixa de água mais clara (`#8FCBF0`, filtro `coast`) abraçando a terra.

## Terra
- País neutro: feltro bege `#CBB78B`, com leve textura (ruído) e **sombra projetada** (relevo 2.5D).
- Paleta feltro (sobrescreve `faccoes.cor`) — `FELT` em `MapScene.tsx`:
  França `#B23A2E` · Áustria `#7E5AA6` · Rússia `#4F8C46` · Prússia `#566E86` ·
  Reino Unido `#3C6E86` · Espanha `#D38A36` · Coligação `#8C8676`.
- **Territórios sempre coloridos** (mapa "vivo"): `BASE_TERR`. O império de França cresce por cima via eventos.

## Tipografia na terra
- **Nomes de território**: `TERR_NAMES` — caixa alta condensada (Oswald), creme `#F3ECD8`, alguns **vazados**
  (só contorno). Cada nome aceita `ll:[lng,lat]` (posição custom dentro do país), `size` (multiplicador),
  `rot` (rotação) e `hollow`. Tamanho é constante na tela e o nome some se o ponto sai do quadro.
- **Rótulos de água**: `WATER` — itálico azul-claro (Fraunces).

## Elementos em pé (overlay, sempre verticais) — crescem quando a câmera aproxima
- **Estandarte** (`leaderReveal`) — o protagonista: **coroa (ou ícone) no topo** + **retrato** (medalhão
  com borda na cor da facção) + **pílula de nome**. `fica:true` p/ permanecer. `emblema` troca o ícone do
  topo; `foto` põe o retrato real.
- **Estandarte simples** (`estandarte`) / cabeça de marcha — bandeira no mastro: usa o **SVG real** de
  `public/flags/` (`FLAGS`), com retângulo colorido como fallback.
- **Medalhão emoji** (`marcador`/`reacao`) — **emoji nativo com sombrinha** (sem círculo); `reacao` faz
  cluster (raiva 😠, medo 😨, fogo 🔥, reza 🙏...).
- **Batalha** (`siegeFall`) — ⚔️ branca com "pop". **Setas brancas** (`marchRoute`/`convergencia`) e
  **arco** (`conexao`) — deitadas na terra.
- **Escala por zoom**: todos crescem no close e encolhem no panorama (fator `k`).

## HUD
- Título (canto sup. esq.), **contador da Grande Armée** (derrete via `forca`), **legenda do evento**
  (faixa escura, caixa alta — vem do `datedSeal.evento`), **caixas de ano** (janela ±3 do ano ativo,
  ativo destacado), **vinheta** suave. Fontes: Fraunces (display) + Oswald (rótulos).

## Genealogia
- Tela cheia, título "Linhagem dos Bonaparte", retratos grandes (r≈60, aceitam foto), conectores em
  âmbar, nomes Fraunces + papel em caps âmbar. Pensada pra ficar legível com fotos reais.

## Câmera
Tilt 2.5D **fixo**; a câmera faz **pan/zoom de um lado a outro** enquanto narra e os ícones entram.
Dê `cam` (`move`/`alvo`) aos beats. Ajuste a inclinação em `TILT_ANGLE_DEG` (`engine.ts`).
