import React from "react";
import {
  AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing, spring,
  Audio, staticFile,
} from "remotion";
import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadLabel } from "@remotion/google-fonts/Oswald";
import * as E from "./engine";

const { fontFamily: FDISP } = loadDisplay();
const { fontFamily: FLAB } = loadLabel();

const HAS_AUDIO = false; // ligue após pôr public/narracao.mp3

// ==== PELE E RÓTULOS — vêm do spec.json (cada vídeo traz os seus). ====
// O motor não fixa cores/nomes de nenhum vídeo. Fallbacks são neutros/vazios.

// paleta feltro por facção: spec.pele.felt = { faccaoKey: "#hex", ... }
const FELT: Record<string, string> = (E.spec.pele && E.spec.pele.felt) || {};
Object.keys(FELT).forEach((k) => { if (E.spec.faccoes[k]) E.spec.faccoes[k].cor = FELT[k]; });

const NEUTRAL = (E.spec.pele && E.spec.pele.neutral) || "#CBB78B";
const ACCENT = (E.spec.pele && E.spec.pele.accent) || "#E6A92B";

// facção -> arquivo de bandeira em public/flags/: spec.pele.flags = { faccaoKey: "xx.svg" }
const FLAGS: Record<string, string> = (E.spec.pele && E.spec.pele.flags) || {};

// territórios já coloridos no início (mapa "vivo"): spec.mapa.baseTerr = [[regiaoKey, faccaoKey], ...]
const BASE_TERR: [string, string][] = (E.spec.mapa && E.spec.mapa.baseTerr) || [];

// nomes de território na terra: spec.mapa.terrNames = [{ t, reg, ll?, size?, rot?, hollow? }, ...]
const TERR_NAMES: { t: string; reg: string; rot?: number; hollow?: boolean; ll?: [number, number]; size?: number }[] =
  (E.spec.mapa && E.spec.mapa.terrNames) || [];

// rótulos de mar: spec.mapa.water = [{ t, ll }, ...]
const WATER: { t: string; ll: [number, number] }[] = (E.spec.mapa && E.spec.mapa.water) || [];

// nomes amigáveis de cidades/pontos: spec.mapa.nomes = { chave: "Nome" }
const NAMES: Record<string, string> = (E.spec.mapa && E.spec.mapa.nomes) || {};
const nice = (k: string) => NAMES[k] || k.charAt(0).toUpperCase() + k.slice(1);

const PLACE = new Set(["pino", "castelo", "palacio", "estrela", "ancora", "torre", "cidade", "mesquita", "igreja", "templo", "rio", "muralha", "tesouro"]);

type P = [number, number];
const polyPath = (pts: P[]) => pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
function lenAlong(pts: P[]) { let t = 0; for (let i = 1; i < pts.length; i++) t += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return t; }
function pointAlong(pts: P[], p: number): P {
  const total = lenAlong(pts); if (total === 0) return pts[0];
  let target = p * total, acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) || 1;
    if (acc + l >= target) { const r = (target - acc) / l; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * r, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * r]; }
    acc += l;
  } return pts[pts.length - 1];
}
function partialPath(pts: P[], p: number): string {
  const total = lenAlong(pts), target = p * total; let acc = 0; const out: P[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + l >= target) { out.push(pointAlong(pts, p)); break; } out.push(pts[i]); acc += l;
  } return polyPath(out);
}

export const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps: FPS } = useVideoConfig();
  const t = frame / FPS;
  const cam = E.cameraAt(frame);
  const toS = E.makeToScreen(cam);
  const b2s = E.makeBaseToScreen(cam);
  const ov = (geo: P): P => E.tilt(toS(geo));      // geo -> overlay (com tilt)
  const ovB = (base: P): P => E.tilt(b2s(base));    // base -> overlay (com tilt)

  const win = (t0: number, t1: number, fica?: boolean) => {
    const f0 = t0 * FPS, f1 = t1 * FPS;
    if (frame < f0 - 1) return 0;
    if (!fica && frame > f1 + 1) return 0;
    const ins = interpolate(frame, [f0, f0 + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
    const outs = fica ? 1 : interpolate(frame, [f1 - 8, f1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return Math.max(0, Math.min(1, ins * outs));
  };
  const pulse = 0.55 + 0.45 * Math.sin(frame / 7);
  // ícones/estandartes/emojis crescem quando a câmera aproxima (e encolhem no panorama)
  const k = Math.max(0.72, Math.min(1.9, cam.zoom / 1.3));
  const SA = (p: P) => `translate(${p[0]} ${p[1]}) scale(${k}) translate(${-p[0]} ${-p[1]})`;

  const ground: React.ReactNode[] = [];   // na terra (vai inclinar com o plano)
  const upright: React.ReactNode[] = [];   // medalhões/estandartes (em pé)
  const hud: React.ReactNode[] = [];

  // territórios base sempre coloridos
  BASE_TERR.forEach(([rk, fk], i) =>
    E.regionFeatures(rk).forEach((f, j) =>
      ground.push(<path key={`base${i}-${j}`} d={f.d} fill={E.facaoColor(fk)} fillOpacity={0.86} stroke="#0c1a26" strokeWidth={1.1 / cam.zoom} strokeOpacity={0.5} />)));

  E.spec.timeline.forEach((e: any, idx: number) => {
    const op = win(e.t0, e.t1 ?? e.t0 + 2, e.fica);
    if (op <= 0) return;
    const key = e.prim + idx;
    const geo = (k?: string): P | null => { const ll = E.resolveLngLat(k || e.em); return ll as P | null; };

    switch (e.prim) {
      case "territoryAdvance":
        (e.para || []).forEach((rk: string, j: number) => E.regionFeatures(rk).forEach((f, k2) =>
          ground.push(<path key={`${key}-${j}-${k2}`} d={f.d} fill={E.facaoColor(e.facao)} fillOpacity={op * (e.pulso ? 0.6 + 0.2 * pulse : 0.78)} stroke={ACCENT} strokeOpacity={op * 0.6} strokeWidth={1.4 / cam.zoom} />)));
        break;
      case "realce":
        E.regionFeatures(e.regiao).forEach((f, k2) =>
          ground.push(<path key={`${key}-${k2}`} d={f.d} fill={ACCENT} fillOpacity={op * 0.18 * pulse} stroke={ACCENT} strokeOpacity={op * pulse} strokeWidth={3 / cam.zoom} style={{ filter: "drop-shadow(0 0 6px " + ACCENT + ")" }} />));
        break;
      case "regionLabel": {
        E.regionFeatures(e.regiao).forEach((f, k2) => ground.push(<path key={`${key}-f${k2}`} d={f.d} fill={E.facaoColor(e.bandeira)} fillOpacity={op * 0.6} />));
        break;
      }
      case "conexao": {
        const a = geo(e.de?.[0]), b = geo(e.de?.[1]);
        if (a && b) {
          const A = E.project(a), B = E.project(b);
          const ctrl: P = [(A[0] + B[0]) / 2, Math.min(A[1], B[1]) - 240];
          const dash = interpolate(frame, [e.t0 * FPS, (e.t1 ?? e.t0 + 2) * FPS], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          ground.push(<path key={key} d={`M ${A[0]} ${A[1]} Q ${ctrl[0]} ${ctrl[1]} ${B[0]} ${B[1]}`} fill="none" stroke="#fff" strokeWidth={5 / cam.zoom} strokeOpacity={op} strokeDasharray={2000} strokeDashoffset={2000 * dash} markerEnd="url(#arrow)" />);
          upright.push(<g key={`${key}-a`} transform={SA(ov(a))}><Medal pos={ov(a)} emoji="📍" op={op} /></g>, <g key={`${key}-b`} transform={SA(ov(b))}><Medal pos={ov(b)} emoji="📍" op={op} /></g>);
        }
        break;
      }
      case "marchRoute": {
        const lls = (e.rota || []).map((c: string) => E.resolveLngLat(c)).filter(Boolean) as P[];
        if (lls.length >= 2) {
          const pts = lls.map((ll) => E.project(ll));
          const retreat = e.modo === "retreat";
          const p = interpolate(frame, [e.t0 * FPS, (e.t1 ?? e.t0 + 4) * FPS], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          ground.push(<g key={key} opacity={op}>
            <path d={polyPath(pts)} fill="none" stroke="#fff" strokeOpacity={0.28} strokeWidth={4 / cam.zoom} strokeDasharray={`${8 / cam.zoom} ${8 / cam.zoom}`} />
            <path d={partialPath(pts, p)} fill="none" stroke="#fff" strokeWidth={6 / cam.zoom} strokeLinecap="round" markerEnd="url(#arrow)" />
          </g>);
          const head = ovB(pointAlong(pts, p));
          upright.push(<g key={`${key}-h`} transform={SA(head)}><Flag pos={head} color={retreat ? "#d8d2c4" : E.facaoColor(e.facao)} op={op} emblem={retreat ? "🏳️" : "🦅"} flag={retreat ? undefined : FLAGS[e.facao]} /></g>);
        }
        break;
      }
      case "convergencia": {
        const tg = geo(e.alvo); if (!tg) break;
        const T = E.project(tg);
        (e.de || []).forEach((c: string, j: number) => {
          const a = geo(c); if (!a) return; const A = E.project(a);
          const p = interpolate(frame, [e.t0 * FPS, (e.t1 ?? e.t0 + 3) * FPS], [0, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const cur: P = [A[0] + (T[0] - A[0]) * p, A[1] + (T[1] - A[1]) * p];
          ground.push(<path key={`${key}-${j}`} d={`M ${A[0]} ${A[1]} L ${cur[0]} ${cur[1]}`} stroke="#fff" strokeWidth={5 / cam.zoom} strokeOpacity={op} markerEnd="url(#arrow)" />);
        });
        break;
      }
      case "siegeFall": {
        const g = geo(); if (!g) break; const s = ov(g);
        const pop = spring({ frame: frame - e.t0 * FPS, fps: FPS, config: { damping: 12 } });
        upright.push(<g key={key} opacity={op} transform={SA(s)}>
          <circle cx={s[0]} cy={s[1]} r={18 + 30 * pop} fill="none" stroke="#fff" strokeWidth={3} opacity={1 - pop * 0.5} />
          <text x={s[0]} y={s[1]} fontSize={48} textAnchor="middle" dominantBaseline="central" style={{ filter: "drop-shadow(0 2px 3px #000)" }}>⚔️</text>
          {tag(s, nice(e.em || ""), op)}
        </g>);
        break;
      }
      case "reacao": {
        const g = geo(); if (!g) break; const s = ov(g);
        const em = E.EMOJI[e.icone] || "❗";
        const offs: P[] = [[-46, -8], [46, -4], [0, 40], [-12, -48], [30, 44]];
        upright.push(<g key={key} transform={SA(s)}>{offs.map((o, j) =>
          <Medal key={j} pos={[s[0] + o[0], s[1] + o[1] + Math.sin(frame / 6 + j) * 3]} emoji={em} op={op} size={46} />)}</g>);
        break;
      }
      case "diplomacia": {
        const g = geo(); if (!g) break; const s = ov(g);
        upright.push(<g key={key} transform={SA(s)}><Medal pos={s} emoji={e.icone === "guerra" ? "⚔️" : "🕊️"} op={op} size={60} /></g>);
        break;
      }
      case "estandarte": {
        const g = geo(); if (!g) break; const s = ov(g);
        upright.push(<g key={key} transform={SA(s)}><Flag pos={s} color={E.facaoColor(e.facao)} op={op * 0.95} emblem="🦅" flag={FLAGS[e.facao]} /></g>);
        break;
      }
      case "marcador": {
        const g = geo(); if (!g) break; const s = ov(g);
        upright.push(<g key={key} transform={SA(s)}>
          <Medal pos={s} emoji={E.MARK[e.icone] || "📍"} op={op} />
          {PLACE.has(e.icone) ? tag(s, nice(e.em || ""), op) : null}
        </g>);
        break;
      }
      case "leaderMarch": {
        const lls = (e.rota || []).map((c: string) => E.resolveLngLat(c)).filter(Boolean) as P[];
        if (lls.length >= 2) {
          const pts = lls.map((ll) => E.project(ll));
          const p = interpolate(frame, [e.t0 * FPS, (e.t1 ?? e.t0 + 4) * FPS], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          ground.push(<g key={`${key}-r`} opacity={op}>
            <path d={polyPath(pts)} fill="none" stroke="#fff" strokeOpacity={0.28} strokeWidth={4 / cam.zoom} strokeDasharray={`${8 / cam.zoom} ${8 / cam.zoom}`} />
            <path d={partialPath(pts, p)} fill="none" stroke="#fff" strokeWidth={6 / cam.zoom} strokeLinecap="round" markerEnd="url(#arrow)" />
          </g>);
          const head = ovB(pointAlong(pts, p));
          upright.push(<g key={key} transform={SA(head)}><Standard pos={head} color={E.facaoColor(e.facao)} name={e.rotulo || ""} emblem={e.emblema} op={op} foto={e.foto} /></g>);
        }
        break;
      }
      case "leaderReveal": {
        const g = geo(); if (!g) break; const s = ov(g);
        upright.push(<g key={key} transform={SA(s)}><Standard pos={s} color={E.facaoColor(e.facao)} name={e.rotulo || ""} emblem={e.emblema} op={op} foto={e.foto} /></g>);
        break;
      }
      case "callout": {
        const g = geo(); if (!g) break; const s = ov(g);
        upright.push(<g key={key} transform={SA(s)}>{pill(key, [s[0], s[1] - 54], e.texto || "", op)}</g>);
        break;
      }
      // HUD
      case "statFinal": {
        const scl = interpolate(op, [0, 1], [0.86, 1]);
        hud.push(<div key={key} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: op }}>
          <div style={{ background: "rgba(8,11,17,0.85)", padding: "30px 54px", borderRadius: 18, border: `2px solid ${ACCENT}66`, transform: `scale(${scl})`, maxWidth: 1180, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,.6)" }}>
            <span style={{ fontFamily: FDISP, fontWeight: 600, fontSize: 60, color: "#fff", lineHeight: 1.1 }}>{e.texto}</span>
          </div>
        </div>);
        break;
      }
      case "conceito":
        hud.push(<div key={key} style={{ position: "absolute", left: 64, top: "50%", transform: "translateY(-50%)", width: 470, background: "rgba(8,11,17,0.85)", padding: "26px 30px", borderRadius: 14, borderLeft: `5px solid ${ACCENT}`, opacity: op }}>
          <span style={{ fontFamily: FLAB, fontSize: 31, color: "#fff", lineHeight: 1.35 }}>{e.texto}</span>
        </div>); break;
      case "kicker":
        hud.push(<div key={key} style={{ position: "absolute", top: 132, width: "100%", textAlign: "center", opacity: op }}>
          <span style={{ fontFamily: FLAB, letterSpacing: 7, fontSize: 32, color: ACCENT, textTransform: "uppercase", textShadow: "0 2px 10px #000" }}>{e.texto}</span>
        </div>); break;
      case "legenda":
        hud.push(<div key={key} style={{ position: "absolute", bottom: 170, width: "100%", textAlign: "center", opacity: op }}>
          <span style={{ fontFamily: FDISP, fontSize: 44, color: "#fff", textShadow: "0 2px 12px #000" }}>{e.texto}</span>
        </div>); break;
      case "genealogia": hud.push(<Genealogia key={key} e={e} op={op} />); break;
      case "fade": hud.push(<div key={key} style={{ position: "absolute", inset: 0, background: "#000", opacity: op }} />); break;
    }
  });

  // nomes de território + água (na terra) — tamanho constante na tela, somem se saem do quadro
  TERR_NAMES.forEach((n, i) => {
    const c = n.ll ? E.project(n.ll) : E.regionCentroidBase(n.reg); if (!c) return;
    const s = b2s(c); if (s[0] < -80 || s[0] > E.W + 80 || s[1] < -80 || s[1] > E.H + 80) return;
    const factor = Math.max(0.5, Math.min(1, cam.zoom / 1.4)); // encolhe no wide, some o encavalamento
    const fs = (52 * (n.size ?? 1) * factor) / cam.zoom;
    ground.push(<text key={`tn${i}`} x={c[0]} y={c[1]} fontSize={fs} textAnchor="middle" transform={`rotate(${n.rot || 0} ${c[0]} ${c[1]})`}
      fill={n.hollow ? "none" : "#F3ECD8"} stroke={n.hollow ? "#F3ECD8" : "#0c1a26"} strokeWidth={n.hollow ? 2 / cam.zoom : 1.4 / cam.zoom} fillOpacity={0.92}
      style={{ fontFamily: FLAB, fontWeight: 600, letterSpacing: 2, paintOrder: "stroke" }}>{n.t}</text>);
  });
  WATER.forEach((w, i) => {
    const c = E.project(w.ll); const s = b2s(c); if (s[0] < -80 || s[0] > E.W + 80 || s[1] < -80 || s[1] > E.H + 80) return;
    ground.push(<text key={`w${i}`} x={c[0]} y={c[1]} fontSize={20 / cam.zoom} textAnchor="middle" fill="#9FC3E8" fillOpacity={0.8}
      style={{ fontFamily: FDISP, fontStyle: "italic" }}>{w.t}</text>);
  });

  // ano ativo (p/ destaque na timeline em linha)
  const ya = E.yearAt(frame);
  const forca = E.forcaAt(t);
  const PADX = 2600, PADT = 2200, PADB = 1400; // estende o plano (lados/topo/baixo) p/ cobrir o tilt
  let evento: string | null = null;
  for (const ev of E.spec.timeline) {
    if (ev.prim === "datedSeal" && ev.t0 * FPS <= frame && frame <= (ev.t1 ?? ev.t0 + 6) * FPS) evento = ev.evento;
  }

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #2A6FA8 0%, #1E588C 30%, #143F66 70%, #0E2E4C 100%)" }}>
      {/* TERRENO inclinado 2.5D */}
      <div style={{ position: "absolute", left: -PADX, top: -PADT, width: E.W + 2 * PADX, height: E.H + PADT + PADB, transform: E.tiltCSSyaw(cam.yaw || 0), transformOrigin: `${E.TILT.ox + PADX}px ${E.TILT.oy + PADT}px` }}>
        <svg viewBox={`${-PADX} ${-PADT} ${E.W + 2 * PADX} ${E.H + PADT + PADB}`} width="100%" height="100%">
          <defs>
            <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3F86C0" /><stop offset="45%" stopColor="#235F95" /><stop offset="100%" stopColor="#10314F" />
            </linearGradient>
            <filter id="coast" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" /></filter>
            <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n" /><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0" /></filter>
            <marker id="arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#fff" /></marker>
          </defs>
          <g transform={E.mapTransform(cam)}>
            <rect x={-6000} y={-6000} width={18000} height={18000} fill="url(#ocean)" />
            {/* brilho costeiro: água mais clara hugging a terra */}
            <g filter="url(#coast)" opacity={0.9}>
              {E.features.map((f, i) => <path key={`c${i}`} d={f.d} fill="none" stroke="#8FCBF0" strokeWidth={9 / cam.zoom} />)}
            </g>
            <g style={{ filter: "drop-shadow(0 14px 20px rgba(0,0,0,0.4))" }}>
              {E.features.map((f, i) => <path key={i} d={f.d} fill={NEUTRAL} stroke="#A99765" strokeWidth={0.6 / cam.zoom} />)}
              {ground}
            </g>
            <rect x={-6000} y={-6000} width={18000} height={18000} filter="url(#paper)" opacity={0.4} pointerEvents="none" />
          </g>
        </svg>
      </div>

      {/* OVERLAY em pé (medalhões/estandartes), sem inclinar */}
      <svg viewBox={`0 0 ${E.W} ${E.H}`} width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {upright}
      </svg>

      {/* HUD */}
      <div style={{ position: "absolute", top: 28, left: 44, fontFamily: FDISP, fontSize: 30, color: ACCENT, letterSpacing: 2, textShadow: "0 2px 8px #000" }}>{(E.spec as any).meta.titulo}</div>
      {forca != null && (
        <div style={{ position: "absolute", top: 92, left: 46, fontFamily: FLAB, textShadow: "0 2px 8px #000" }}>
          <div style={{ fontSize: 46, color: ACCENT, lineHeight: 1 }}>{(forca / 1000).toFixed(0)} mil</div>
          <div style={{ fontSize: 18, letterSpacing: 3, color: "#fff", opacity: 0.85 }}>{(E.spec as any).hud?.forcaLabel || "EXÉRCITO"}</div>
        </div>
      )}
      {(E.spec as any).hud?.indicadores && (() => {
        const st = E.statsAt(frame);
        const chip = (label: string, valor: string | number) => (
          <div style={{ minWidth: 96, background: "rgba(8,14,20,0.78)", border: `1.5px solid ${ACCENT}55`, borderRadius: 10, padding: "8px 14px", textAlign: "center", backdropFilter: "blur(2px)" }}>
            <div style={{ fontFamily: FDISP, fontSize: 30, fontWeight: 600, color: ACCENT, lineHeight: 1 }}>{valor}</div>
            <div style={{ fontFamily: FLAB, fontSize: 12, letterSpacing: 2, color: "#F4ECD8", opacity: 0.8, marginTop: 3, textTransform: "uppercase" }}>{label}</div>
          </div>
        );
        return (
          <div style={{ position: "absolute", top: 28, right: 40, display: "flex", gap: 10, textShadow: "0 2px 8px #000" }}>
            {chip("Batalhas", st.batalhas)}
            {chip("Territórios", st.territorios)}
          </div>
        );
      })()}
      {hud}
      {/* legenda do evento (documentário) */}
      {evento && (
        <div style={{ position: "absolute", bottom: 116, width: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{ background: "rgba(8,11,17,0.86)", padding: "10px 26px", borderRadius: 8, maxWidth: 1200 }}>
            <span style={{ fontFamily: FLAB, fontSize: 26, color: "#fff", letterSpacing: 1, textTransform: "uppercase" }}>{evento}</span>
          </div>
        </div>
      )}
      {/* timeline em linha (ponta a ponta) */}
      {(E.spec as any).hud?.timeline && (
        <div style={{ position: "absolute", bottom: 40, left: 80, right: 80, height: 44 }}>
          {/* trilho */}
          <div style={{ position: "absolute", left: 0, right: 0, top: 20, height: 4, borderRadius: 2, background: "rgba(244,236,216,0.18)" }} />
          {/* progresso */}
          <div style={{ position: "absolute", left: 0, top: 20, height: 4, borderRadius: 2, width: `${Math.min(100, (frame / ((E.spec as any).meta.duracao * FPS)) * 100)}%`, background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />
          {/* cabeçote */}
          <div style={{ position: "absolute", top: 14, left: `${Math.min(100, (frame / ((E.spec as any).meta.duracao * FPS)) * 100)}%`, width: 16, height: 16, marginLeft: -8, borderRadius: "50%", background: ACCENT, boxShadow: `0 0 12px ${ACCENT}, 0 2px 6px #000` }} />
          {/* marcos de ano */}
          {E.yearMarks().map((m) => {
            const ativo = m.ano === ya;
            const label = m.ano < 0 ? `${-m.ano} a.C.` : `${m.ano}`;
            return (
              <div key={m.ano} style={{ position: "absolute", left: `${m.pos * 100}%`, top: 0, transform: "translateX(-50%)", textAlign: "center" }}>
                <div style={{ fontFamily: FLAB, fontSize: ativo ? 18 : 13, fontWeight: 600, letterSpacing: 1, color: ativo ? ACCENT : "rgba(244,236,216,0.7)", textShadow: "0 2px 6px #000", whiteSpace: "nowrap", transition: "none" }}>{label}</div>
                <div style={{ width: ativo ? 3 : 2, height: ativo ? 12 : 8, margin: "2px auto 0", background: ativo ? ACCENT : "rgba(244,236,216,0.45)" }} />
              </div>
            );
          })}
        </div>
      )}
      {/* vinheta */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 140px 20px rgba(0,0,0,0.22)" }} />
      {HAS_AUDIO && <Audio src={staticFile("narracao.mp3")} />}
    </AbsoluteFill>
  );
};

// ---------- componentes ----------
const Medal: React.FC<{ pos: P; emoji: string; op: number; size?: number }> = ({ pos, emoji, op, size = 64 }) => (
  <g opacity={op}>
    <text x={pos[0]} y={pos[1]} fontSize={size * 0.95} textAnchor="middle" dominantBaseline="central"
      style={{ filter: "drop-shadow(0 3px 4px rgba(0,0,0,.6)) drop-shadow(0 0 2px rgba(0,0,0,.4))" }}>{emoji}</text>
  </g>
);

const Flag: React.FC<{ pos: P; color: string; op: number; emblem: string; flag?: string }> = ({ pos, color, op, emblem, flag }) => {
  const [x, y] = pos;
  return (
    <g opacity={op}>
      <line x1={x} y1={y} x2={x} y2={y - 56} stroke="#cfc4a6" strokeWidth={3} />
      <rect x={x} y={y - 60} width={44} height={28} fill={color} stroke="#fff" strokeWidth={1.5} style={{ filter: "drop-shadow(0 3px 4px rgba(0,0,0,.5))" }} />
      {flag
        ? <image href={staticFile("flags/" + flag)} x={x} y={y - 60} width={44} height={28} preserveAspectRatio="xMidYMid slice" />
        : <text x={x + 22} y={y - 46} fontSize={18} textAnchor="middle" dominantBaseline="central">{emblem}</text>}
    </g>
  );
};

const Standard: React.FC<{ pos: P; color: string; name: string; emblem?: string; op: number; foto?: string }> = ({ pos, color, name, emblem = "👑", op, foto }) => {
  const [x, y] = pos; const top = y - 150;
  const w = Math.max(78, name.length * 9.5 + 26);
  const cid = `clip${Math.round(x)}_${Math.round(y)}`;
  const pr = 42;
  return (
    <g opacity={op}>
      <defs><clipPath id={cid}><circle cx={x} cy={top + 58} r={pr} /></clipPath></defs>
      <line x1={x} y1={y} x2={x} y2={top + 22} stroke="#cfc4a6" strokeWidth={3} />
      <text x={x} y={top - 4} fontSize={40} textAnchor="middle" dominantBaseline="central" style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,.55))" }}>{emblem}</text>
      <circle cx={x} cy={top + 58} r={pr} fill="#2a3340" stroke={color} strokeWidth={4.5} style={{ filter: "drop-shadow(0 5px 8px rgba(0,0,0,.55))" }} />
      <text x={x} y={top + 58} fontSize={44} textAnchor="middle" dominantBaseline="central">👤</text>
      {foto && <image href={staticFile("portraits/" + foto)} x={x - pr} y={top + 58 - pr} width={pr * 2} height={pr * 2} clipPath={`url(#${cid})`} preserveAspectRatio="xMidYMid slice" />}
      <rect x={x - w / 2} y={top + 104} width={w} height={30} rx={7} fill="#0c1118" stroke="#000" strokeWidth={1} />
      <text x={x} y={top + 119} fontSize={18} fill="#fff" textAnchor="middle" dominantBaseline="central" style={{ fontFamily: FLAB }}>{name}</text>
    </g>
  );
};

function pill(key: string, s: P, texto: string, op: number) {
  const w = Math.max(70, texto.length * 9.5 + 28);
  return (
    <g key={key} opacity={op}>
      <rect x={s[0] - w / 2} y={s[1] - 19} width={w} height={32} rx={9} fill="rgba(8,11,17,0.88)" stroke={`${ACCENT}66`} strokeWidth={1.5} />
      <text x={s[0]} y={s[1] - 2} fontSize={18} fill="#fff" textAnchor="middle" dominantBaseline="central" style={{ fontFamily: FLAB }}>{texto}</text>
    </g>
  );
}
function tag(s: P, txt: string, op: number) {
  const w = Math.max(52, txt.length * 8.5 + 18);
  return (
    <g opacity={op}>
      <rect x={s[0] - w / 2} y={s[1] + 22} width={w} height={24} rx={5} fill="#0c1118" stroke="#000" strokeWidth={1} />
      <text x={s[0]} y={s[1] + 34} fontSize={15} fill="#fff" textAnchor="middle" dominantBaseline="central" style={{ fontFamily: FLAB }}>{txt}</text>
    </g>
  );
}

const Genealogia: React.FC<{ e: any; op: number }> = ({ e, op }) => {
  const pessoas = e.pessoas || []; const ligacoes: [string, string][] = e.ligacoes || [];
  const byGen: Record<number, any[]> = {}; pessoas.forEach((p: any) => { const g = p.geracao ?? 0; (byGen[g] = byGen[g] || []).push(p); });
  const gens = Object.keys(byGen).map(Number).sort();
  const pos: Record<string, P> = {};
  const R = 60;
  gens.forEach((g, gi) => {
    const row = byGen[g]; const y = E.H * (gens.length > 1 ? 0.30 + gi * (0.46 / Math.max(1, gens.length - 1)) : 0.46);
    row.forEach((p: any, i: number) => { pos[p.id || p.nome] = [E.W * (0.5 + (i - (row.length - 1) / 2) * 0.21), y]; });
  });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(8,12,18,0.45) 0%, rgba(6,9,14,0.82) 100%)" }} />
      <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontFamily: FDISP, fontSize: 40, color: ACCENT, letterSpacing: 2, textShadow: "0 2px 10px #000" }}>{e.titulo || "Linhagem"}</div>
      <svg viewBox={`0 0 ${E.W} ${E.H}`} width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {ligacoes.map(([a, b], i) => { const pa = pos[a], pb = pos[b]; if (!pa || !pb) return null; return <line key={i} x1={pa[0]} y1={pa[1] + R} x2={pb[0]} y2={pb[1] - R} stroke={ACCENT} strokeWidth={3} opacity={0.8} />; })}
        {pessoas.map((p: any, i: number) => {
          const s = pos[p.id || p.nome]; if (!s) return null; const cid = `gc${i}`;
          return (<g key={i}>
            <defs><clipPath id={cid}><circle cx={s[0]} cy={s[1]} r={R} /></clipPath></defs>
            <circle cx={s[0]} cy={s[1]} r={R} fill="#2a3340" stroke="#fff" strokeWidth={4} style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,.6))" }} />
            <text x={s[0]} y={s[1]} fontSize={62} textAnchor="middle" dominantBaseline="central">👤</text>
            {p.foto && <image href={staticFile("portraits/" + p.foto)} x={s[0] - R} y={s[1] - R} width={R * 2} height={R * 2} clipPath={`url(#${cid})`} preserveAspectRatio="xMidYMid slice" />}
            <rect x={s[0] - R} y={s[1] + R + 8} width={R * 2} height={1} fill="none" />
            <text x={s[0]} y={s[1] + R + 30} fontSize={26} fill="#fff" textAnchor="middle" style={{ fontFamily: FDISP, fontWeight: 600 }}>{p.nome}</text>
            <text x={s[0]} y={s[1] + R + 56} fontSize={16} fill={ACCENT} textAnchor="middle" style={{ fontFamily: FLAB, letterSpacing: 1 }}>{(p.papel || "").toUpperCase()}</text>
          </g>);
        })}
      </svg>
    </div>
  );
};
