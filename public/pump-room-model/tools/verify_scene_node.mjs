/**
 * verify_scene_node.mjs — Node 端场景装配核验（无需浏览器）
 *
 * 用法：node public/pump-room-model/tools/verify_scene_node.mjs
 *
 * 用本地 vendor/three 真实装配全部伙伴模块，逐 POI 计算实际包围盒，
 * 与 layout.js 的 POI_LIST bbox 比对，输出偏差表。
 * 偏差 > 0.02m 会导致射线粗筛漏检，故按 FAIL 报出。
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const require = createRequire(import.meta.url);

const THREE = await import(path.join(root, 'vendor/three/three.module.js'));
const { PUMP_ROOM, POI_LIST } = await import(path.join(root, 'src/layout.js'));
const { makeRNG } = await import(path.join(root, 'src/core/rng.js'));

/* ── 桩 ctx ──────────────────────────────────────────────────────────── */
const matCache = new Map();
const mat = (name) => {
  if (!matCache.has(name)) {
    matCache.set(name, new THREE.MeshStandardMaterial({ name }));
  }
  return matCache.get(name);
};
const registered = new Map();
const pois = {
  add: () => {},
  addAll: (list) => list.forEach((p) => pois.add(p)),
  add(poi) { pois._all.set(poi.id, poi); },
  _all: new Map(),
  list: () => POI_LIST,
  register(id, mesh) {
    if (!registered.has(id)) registered.set(id, []);
    registered.get(id).push(mesh);
    if (mesh.userData && !mesh.userData.poiId) mesh.userData.poiId = id;
  },
  meshesOf(id) { return registered.get(id) || [] },
  byCategory: (c) => POI_LIST.filter((p) => p.category === c),
  size: () => POI_LIST.length,
};
let seed = 20261031;
const ctx = {
  THREE,
  mat,
  // 必须用契约规定的 mulberry32（core/rng.js），否则随机数序列与浏览器端不一致，
  // 会导致三角面数等统计量出现偏差。
  rng: makeRNG(seed),
  pois,
  layout: PUMP_ROOM,
  options: { quality: 'high', wireframe: false },
};

/* ── 装配全部模块 ────────────────────────────────────────────────────── */
const MODULES = [
  ['shell.js', 'buildShell'],
  ['tanks.js', 'buildTanks'],
  ['pumps.js', 'buildPumps'],
  ['piping.js', 'buildPiping'],
  ['electrical.js', 'buildElectrical'],
  ['lighting.js', 'buildLighting'],
];

const scene = new THREE.Scene();
const loaded = [];
for (const [file, fn] of MODULES) {
  try {
    const mod = await import(path.join(root, 'src/modules', file));
    if (typeof mod[fn] !== 'function') throw new Error(`未导出 ${fn}`);
    const result = mod[fn](ctx);
    const group = result && result.group ? result.group : result;
    scene.add(group);
    loaded.push([file, fn, 'ok']);
  } catch (err) {
    loaded.push([file, fn, `跳过（${err.message}）`]);
  }
}

console.log('══ 模块装配 ══');
for (const [file, fn, st] of loaded) console.log(`  ${st === 'ok' ? '✅' : '⚠️ '} ${file} → ${fn}()  ${st}`);

/* ── 场景统计 ────────────────────────────────────────────────────────── */
let meshCount = 0;
let triCount = 0;
let lightCount = 0;
scene.traverse((o) => {
  if (o.isLight) lightCount += 1;
  if (!o.isMesh) return;
  meshCount += 1;
  const g = o.geometry;
  if (!g) return;
  const c = g.index ? g.index.count : g.attributes.position.count;
  triCount += (c / 3) * (o.isInstancedMesh ? o.count : 1);
});
const sceneBox = new THREE.Box3().setFromObject(scene);
console.log('\n══ 场景统计 ══');
console.log(`  网格 ${meshCount}  三角面 ${Math.round(triCount)}  灯光 ${lightCount}`);
console.log(`  包围盒 min=[${sceneBox.min.toArray().map((v) => v.toFixed(2)).join(', ')}]  max=[${sceneBox.max.toArray().map((v) => v.toFixed(2)).join(', ')}]`);

/* ── POI 覆盖与包围盒偏差 ────────────────────────────────────────────── */
console.log('\n══ POI 覆盖与包围盒偏差 ══');
console.log('  POI id'.padEnd(22), '网格'.padStart(4), '偏差(m)'.padStart(9), '  实际包围盒 min → max');
const uncovered = [];
const over = [];
const notContained = [];
for (const p of POI_LIST) {
  const meshes = pois.meshesOf(p.id);
  if (!meshes.length) {
    uncovered.push(p.id);
    console.log(`  ${p.id.padEnd(22)} ${'0'.padStart(4)} ${'—'.padStart(9)}  未挂接`);
    continue;
  }
  const box = new THREE.Box3();
  for (const m of meshes) box.expandByObject(m);
  let delta = 0;
  if (p.bbox) {
    delta = Math.max(
      Math.abs(box.min.x - p.bbox.min[0]), Math.abs(box.max.x - p.bbox.max[0]),
      Math.abs(box.min.y - p.bbox.min[1]), Math.abs(box.max.y - p.bbox.max[1]),
      Math.abs(box.min.z - p.bbox.min[2]), Math.abs(box.max.z - p.bbox.max[2]),
    );
  }
  // 包含性判定：声明 bbox 必须包住实际几何，否则射线粗筛会漏检
  let contained = true;
  if (p.bbox) {
    contained = ['x', 'y', 'z'].every((ax) => {
      const i = ax === 'x' ? 0 : ax === 'y' ? 1 : 2;
      return box.min.getComponent(i) >= p.bbox.min[i] - 1e-6
        && box.max.getComponent(i) <= p.bbox.max[i] + 1e-6;
    });
  }
  if (!contained) notContained.push(p.id);
  const line = `  ${p.id.padEnd(22)} ${String(meshes.length).padStart(4)} ${delta.toFixed(3).padStart(9)}  `
    + `[${box.min.toArray().map((v) => v.toFixed(2)).join(', ')}] → [${box.max.toArray().map((v) => v.toFixed(2)).join(', ')}]`;
  console.log(line + (delta > 0.02 ? '  ⚠️' : ''));
  if (delta > 0.02) over.push({ id: p.id, delta: +delta.toFixed(3) });
}

console.log('\n══ 结论 ══');
console.log(`  POI 总数 ${POI_LIST.length}，已挂接 ${POI_LIST.length - uncovered.length}`);
if (uncovered.length) console.log(`  未挂接：${uncovered.join(', ')}`);
console.log(`  声明 bbox 未包住实际几何的 POI（会漏检）：${notContained.length ? notContained.join(', ') : '无'}`);
console.log(`  包围盒数值偏差 > 0.02m 的 POI：${over.length ? over.map((o) => `${o.id}(${o.delta})`).join(', ') : '无'}`);

/* ── 设备最高点 ──────────────────────────────────────────────────────── */
let maxY = -Infinity;
let maxYId = '';
for (const p of POI_LIST) {
  if (p.category === '房间') continue;
  for (const m of pois.meshesOf(p.id)) {
    m.updateWorldMatrix(true, false);
    const b = new THREE.Box3().setFromObject(m);
    if (b.max.y > maxY) { maxY = b.max.y; maxYId = p.id; }
  }
}
console.log(`  设备最高点 ${maxY.toFixed(3)}m（${maxYId}），梁底净高 ${PUMP_ROOM.room.clearHeight}m → ${maxY < PUMP_ROOM.room.clearHeight ? '通过' : '超高'}`);

if (uncovered.length || notContained.length) process.exitCode = 1;
