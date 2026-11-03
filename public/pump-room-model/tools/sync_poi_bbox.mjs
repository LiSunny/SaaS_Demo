/**
 * sync_poi_bbox.mjs — 依据实测几何生成 POI 包围盒校正表
 *
 * 用法：node public/pump-room-model/tools/sync_poi_bbox.mjs
 *
 * 装配全部伙伴模块 → 逐 POI 计算实际包围盒 → 输出可直接回填 layout.js 的
 * POI_BBOX 常量块，以及需要修正的条目清单。
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const THREE = await import(path.join(root, 'vendor/three/three.module.js'));
const { PUMP_ROOM, POI_LIST } = await import(path.join(root, 'src/layout.js'));

const matCache = new Map();
const mat = (name) => {
  if (!matCache.has(name)) matCache.set(name, new THREE.MeshStandardMaterial({ name }));
  return matCache.get(name);
};
const registered = new Map();
const pois = {
  add: () => {}, addAll: () => {}, list: () => POI_LIST,
  register(id, mesh) {
    if (!registered.has(id)) registered.set(id, []);
    registered.get(id).push(mesh);
  },
  meshesOf(id) { return registered.get(id) || [] },
};
let seed = 20261031;
const ctx = {
  THREE, mat,
  rng: () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; },
  pois, layout: PUMP_ROOM, options: { quality: 'high', wireframe: false },
};

const MODULES = [
  ['shell.js', 'buildShell'], ['tanks.js', 'buildTanks'], ['pumps.js', 'buildPumps'],
  ['piping.js', 'buildPiping'], ['electrical.js', 'buildElectrical'], ['lighting.js', 'buildLighting'],
];
for (const [file, fn] of MODULES) {
  try {
    const mod = await import(path.join(root, 'src/modules', file));
    const r = mod[fn](ctx);
    (r && r.group ? r.group : r).updateMatrixWorld(true);
  } catch { /* 未落盘则跳过 */ }
}

const pad = (v) => Number(v.toFixed(3));
const out = {};
const changed = [];

for (const p of POI_LIST) {
  const meshes = pois.meshesOf(p.id);
  if (!meshes.length) continue;
  const box = new THREE.Box3();
  for (const m of meshes) box.expandByObject(m);
  const min = box.min.toArray().map(pad);
  const max = box.max.toArray().map(pad);
  out[p.id] = { min, max };
  if (!p.bbox) continue;
  const d = Math.max(
    Math.abs(min[0] - p.bbox.min[0]), Math.abs(max[0] - p.bbox.max[0]),
    Math.abs(min[1] - p.bbox.min[1]), Math.abs(max[1] - p.bbox.max[1]),
    Math.abs(min[2] - p.bbox.min[2]), Math.abs(max[2] - p.bbox.max[2]),
  );
  if (d > 0.02) changed.push({ id: p.id, d: +d.toFixed(3), min, max });
}

console.log('/* 实测包围盒 —— 回填 layout.js 的 POI_LIST[].bbox */');
console.log('export const POI_BBOX = {');
for (const [id, v] of Object.entries(out)) {
  console.log(`  ${id}: { min: [${v.min.join(', ')}], max: [${v.max.join(', ')}] },`);
}
console.log('};');
console.log(`\n需修正 ${changed.length} 条：`);
for (const c of changed) console.log(`  ${c.id.padEnd(20)} 偏差 ${c.d}m  → min=[${c.min.join(', ')}] max=[${c.max.join(', ')}]`);
const missing = POI_LIST.filter((p) => !out[p.id]).map((p) => p.id);
if (missing.length) console.log(`\n未挂接（无实测值）：${missing.join(', ')}`);
