// engine.ts — núcleo puro (sem Remotion). Projeção, câmera e resolução de alvos.
import { geoMercator, geoPath } from "d3-geo";
import countriesJson from "./data/countries.geo.json";
import specJson from "./data/spec.json";

export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const spec: any = specJson as any;

const REF: [number, number] = [18, 50];
const BASE = 900;
export const projection = geoMercator().center(REF).scale(BASE).translate([W / 2, H / 2]);
const pathGen = geoPath(projection as any);

export type Feat = { name: string; d: string; cx: number; cy: number };

// Mapa GLOBAL: desenha o mundo todo. Saneamento das geometrias do dataset:
// 1) normaliza longitudes p/ [-180,180] (corta o antimeridiano: Rússia/Fiji deixam de "vazar");
// 2) reverte anéis de quem ficou com path gigante por winding errado (ex: Bermuda);
// 3) descarta o que AINDA ficar degenerado (ex: Antártida no polo) p/ não cobrir o oceano.
function pathBigBBox(d: string): boolean {
  const n = d.match(/-?\d+\.?\d*/g); if (!n) return false;
  let a = 1e9, b = 1e9, c = -1e9, e = -1e9;
  for (let i = 0; i + 1 < n.length; i += 2) { const x = +n[i], y = +n[i + 1]; a = Math.min(a, x); c = Math.max(c, x); b = Math.min(b, y); e = Math.max(e, y); }
  return (c - a) > 4500 && (e - b) > 4500; // só "quadrado-mundo" (cobre tudo) — não país largo real
}
function mapCoords(geom: any, fn: (p: number[]) => number[]): any {
  const walk = (co: any): any => (typeof co[0] === "number" ? fn(co) : co.map(walk));
  return { ...geom, coordinates: geom.coordinates.map(walk) };
}
const normLng = (g: any) => mapCoords(g, ([x, y]) => [((x + 180) % 360 + 360) % 360 - 180, y]);
function reverseRings(geom: any): any {
  const rev = (poly: any[]) => poly.map((ring: any[]) => ring.slice().reverse());
  if (geom.type === "Polygon") return { ...geom, coordinates: rev(geom.coordinates) };
  if (geom.type === "MultiPolygon") return { ...geom, coordinates: geom.coordinates.map(rev) };
  return geom;
}
export const features: Feat[] = (countriesJson as any).features
  .map((f0: any) => {
    let f = { ...f0, geometry: normLng(f0.geometry) };
    let d = pathGen(f) || "";
    if (pathBigBBox(d)) {
      const fixed = { ...f, geometry: reverseRings(f.geometry) };
      const d2 = pathGen(fixed) || "";
      if (!pathBigBBox(d2)) { f = fixed; d = d2; }
    }
    const c = pathGen.centroid(f);
    return { name: f.properties.name, d, cx: c[0] || 0, cy: c[1] || 0, _big: pathBigBBox(d) };
  })
  .filter((f: any) => !f._big)
  .map(({ name, d, cx, cy }: any) => ({ name, d, cx, cy }));
const featByName: Record<string, Feat> = {};
features.forEach((f) => (featByName[f.name] = f));

export function project(lnglat: [number, number]): [number, number] {
  const p = projection(lnglat as any);
  return p ? [p[0], p[1]] : [W / 2, H / 2];
}

const cidades = spec.mapa.cidades;
const rotulos = spec.mapa.rotulos || {};
export function resolveLngLat(key?: string): [number, number] | null {
  if (!key) return null;
  if (key === "foco") return spec.mapa.foco;
  if (cidades[key]) return cidades[key];
  if (rotulos[key]) return rotulos[key];
  return null;
}
export function regionFeatures(key: string): Feat[] {
  const names: string[] = spec.regioes[key] || [];
  return names.map((n) => featByName[n]).filter(Boolean) as Feat[];
}

// ---------------- Câmera ----------------
export const ZOOM: Record<string, number> = {
  space: 0.5, wide: 0.78, "pull-back": 0.9, regional: 1.35, drift: 1.2,
  mid: 1.7, track: 1.95, "push-in": 2.35, close: 2.8,
};
export type Cam = { lng: number; lat: number; zoom: number; orbita: boolean };
type KF = { frame: number; lng: number; lat: number; zoom: number; orbita: boolean };

function buildKeyframes(): KF[] {
  const foco = spec.mapa.foco;
  const kfs: KF[] = [{ frame: 0, lng: foco[0], lat: foco[1], zoom: ZOOM.wide, orbita: false }];
  let prev: [number, number] = foco;
  const evs = [...spec.timeline].sort((a: any, b: any) => a.t0 - b.t0);
  for (const e of evs) {
    if (!e.cam) continue;
    const tgt = resolveLngLat(e.cam.alvo) || resolveLngLat(e.em) || prev;
    prev = tgt as [number, number];
    kfs.push({
      frame: Math.round(e.t0 * FPS),
      lng: tgt[0], lat: tgt[1],
      zoom: ZOOM[e.cam.move] ?? ZOOM.regional,
      orbita: !!e.cam.orbita,
    });
  }
  return kfs.sort((a, b) => a.frame - b.frame);
}
const KFS = buildKeyframes();
const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

export function cameraAt(frame: number): Cam {
  if (frame <= KFS[0].frame) return { ...KFS[0] };
  const last = KFS[KFS.length - 1];
  if (frame >= last.frame) return { ...last };
  let i = 0;
  while (i < KFS.length - 1 && KFS[i + 1].frame <= frame) i++;
  const a = KFS[i], b = KFS[i + 1];
  const tt = smooth((frame - a.frame) / Math.max(1, b.frame - a.frame));
  return {
    lng: a.lng + (b.lng - a.lng) * tt,
    lat: a.lat + (b.lat - a.lat) * tt,
    zoom: a.zoom + (b.zoom - a.zoom) * tt,
    orbita: b.orbita,
  };
}

export function mapTransform(cam: Cam): string {
  const c = project([cam.lng, cam.lat]);
  return `translate(${W / 2} ${H / 2}) scale(${cam.zoom}) translate(${-c[0]} ${-c[1]})`;
}
export function makeBaseToScreen(cam: Cam) {
  const c = project([cam.lng, cam.lat]);
  return (b: [number, number]): [number, number] => [
    (b[0] - c[0]) * cam.zoom + W / 2,
    (b[1] - c[1]) * cam.zoom + H / 2,
  ];
}
export function makeToScreen(cam: Cam) {
  const b2s = makeBaseToScreen(cam);
  return (lnglat: [number, number]) => b2s(project(lnglat));
}

// ---------------- Assets (emoji offline) ----------------
export const MARK: Record<string, string> = {
  pino: "📍", castelo: "🏰", ponte: "🌉", coroa: "👑", ancora: "⚓", espadas: "⚔️",
  estrela: "⭐", montanha: "⛰️", palacio: "🏛️", mesquita: "🕌", torre: "🗼",
  cidade: "🏙️", escudo: "🛡️", tenda: "⛺", igreja: "⛪",
};
export const EMOJI: Record<string, string> = {
  fire: "🔥", angry: "😠", fear: "😨", cry: "😢", skull: "💀", explosion: "💥",
  eagle: "🦅", crown: "👑", boat: "⛵", horse: "🐎",
};
export function facaoColor(f?: string): string {
  return (f && spec.faccoes[f]?.cor) || spec.pele.accent;
}

// força (Grande Armée) interpolada por tempo (segundos)
export function forcaAt(t: number): number | null {
  const F: [number, number][] = spec.forca;
  if (!F || !F.length) return null;
  if (t < F[0][0] - 1 || t > F[F.length - 1][0] + 40) return null;
  if (t <= F[0][0]) return F[0][1];
  if (t >= F[F.length - 1][0]) return F[F.length - 1][1];
  for (let i = 0; i < F.length - 1; i++) {
    if (t >= F[i][0] && t <= F[i + 1][0]) {
      const r = (t - F[i][0]) / (F[i + 1][0] - F[i][0]);
      return Math.round(F[i][1] + (F[i + 1][1] - F[i][1]) * r);
    }
  }
  return null;
}

// ano corrente (selo mais recente)
export function yearAt(frame: number): number | null {
  let y: number | null = null;
  for (const e of spec.timeline) {
    if (e.prim === "datedSeal" && e.t0 * FPS <= frame) y = e.ano;
  }
  return y;
}
export function years(): number[] {
  const s = new Set<number>();
  spec.timeline.forEach((e: any) => e.prim === "datedSeal" && s.add(e.ano));
  return [...s].sort((a, b) => a - b);
}

// ---------------- 2.5D: plano inclinado (estilo "History Mapped Out") ----------------
export const TILT_ANGLE_DEG = 32;          // 0 = mapa plano | ~32 = 2.5D
export const TILT = { ang: (TILT_ANGLE_DEG * Math.PI) / 180, P: 1700, ox: W / 2, oy: H * 0.5 };
export function tilt(p: [number, number]): [number, number] {
  if (!TILT.ang) return p;
  const dx = p[0] - TILT.ox, dy = p[1] - TILT.oy;
  const Z = dy * Math.sin(TILT.ang);
  const f = TILT.P / (TILT.P - Z);
  return [TILT.ox + dx * f, TILT.oy + dy * Math.cos(TILT.ang) * f];
}
export const tiltCSS = `perspective(${TILT.P}px) rotateX(${TILT_ANGLE_DEG}deg)`;
export const tiltOrigin = `${TILT.ox}px ${TILT.oy}px`;

// centroide (coords base) de uma regiao
export function regionCentroidBase(key: string): [number, number] | null {
  const fs = regionFeatures(key);
  if (!fs.length) return null;
  let x = 0, y = 0; fs.forEach((f) => { x += f.cx; y += f.cy; });
  return [x / fs.length, y / fs.length];
}
