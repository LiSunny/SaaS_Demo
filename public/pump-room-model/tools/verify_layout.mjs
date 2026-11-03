/**
 * verify_layout.mjs — 几何真值表自洽性校验
 *
 * 用法：node public/pump-room-model/tools/verify_layout.mjs
 * 校验 layout.js 内部的几何自洽性：设备是否在房间内、是否超净高、间距是否达标、
 * 阀门是否落在对应管路上、井与排水沟是否连通、灯具是否在室内。
 */

import { PUMP_ROOM as L, POI_LIST } from '../src/layout.js';

const b = L.room.bounds;
const r = L.room;
const checks = [];
const ok = (name, cond, detail = '') => checks.push({ name, pass: cond === true, detail });

const inRoom = (x, z, pad = 0) =>
  x >= b.minX - pad && x <= b.maxX + pad && z >= b.minZ - pad && z <= b.maxZ + pad;

/* 水罐 */
for (const t of L.tanks) {
  ok(`${t.id} 罐体在房间内`, inRoom(t.center[0], t.center[1], t.radius));
  ok(`${t.id} 顶标高 ${(t.baseY + t.height + t.roofHeight).toFixed(2)}m < 梁底 ${r.clearHeight}m`,
    t.baseY + t.height + t.roofHeight < r.clearHeight);
  ok(`${t.id} 到北墙净距 ${(b.maxZ - (t.center[1] + t.radius)).toFixed(2)}m`,
    b.maxZ - (t.center[1] + t.radius) >= 0.3);
}

/* 泵组 */
for (const p of L.pumps) {
  const hw = L.pumpGeometry.skid.width / 2;
  ok(`${p.id} 吸入口法兰面 Z = ${(p.position[1] + L.pumpGeometry.suctionFlangeOffset).toFixed(3)} 与 suctionBranch.toZ 一致`,
    Math.abs(p.position[1] + L.pumpGeometry.suctionFlangeOffset - L.pipes.suctionBranch.toZ) < 1e-9);
  ok(`${p.id} 出水口起点 Y = ${L.pumpGeometry.dischargeBaseY} 与真值一致`,
    L.pumpGeometry.dischargeBaseY === 1.21);
  ok(`${p.id} 机组在房间内`, inRoom(p.position[0], p.position[1], hw));
}

/* 泵间距 */
const px = L.pumps.map((p) => p.position[0]);
for (let i = 1; i < px.length; i += 1) {
  const gap = px[i] - px[i - 1] - L.pumpGeometry.skid.width;
  ok(`泵${i} 与泵${i + 1} 净距 ${gap.toFixed(2)}m ≥ ${r.minAisle}m`, gap >= r.minAisle);
}

/* 母管 */
const s = L.pipes.suctionHeader;
const d = L.pipes.dischargeHeader;
ok('吸水母管两端在房间内', s.xMin >= b.minX && s.xMax <= b.maxX);
ok('出水母管东端穿墙至 x = 12', d.xMax === b.maxX);
ok(`吸水/出水母管 Z 间距 ${(s.z - d.z).toFixed(2)}m`, s.z - d.z > 1.0);
ok('出水母管标高高于蜗壳顶 1.21m', d.y > L.pumpGeometry.dischargeBaseY);

/* 阀门落在管路上 */
const branchXs = L.pumps.map((p) => p.position[0]);
const tankXs = L.tanks.map((t) => t.center[0]);
const sb = L.pipes.suctionBranch;
const db = L.pipes.dischargeBranch;
const tb = L.pipes.tankOutletPipe;
for (const v of L.valves) {
  const [vx, vy, vz] = v.position;
  let placed = false;
  let why = '';
  if (v.orientation === 'x' && Math.abs(vy - s.z) < 1e-9 && Math.abs(vz - s.y) < 1e-9) {
    placed = vx >= s.xMin && vx <= s.xMax;
    why = '吸水母管';
  }
  if (v.orientation === 'x' && Math.abs(vy - d.z) < 1e-9 && Math.abs(vz - d.y) < 1e-9) {
    placed = vx >= d.xMin && vx <= d.xMax;
    why = '出水母管';
  }
  if (v.orientation === 'z' && Math.abs(vz - sb.y) < 1e-9) {
    const onBranch = branchXs.includes(vx) && vy >= sb.toZ && vy <= sb.fromZ;
    const onTankPipe = tankXs.includes(vx) && vy >= tb.toZ && vy <= tb.fromZ;
    placed = onBranch || onTankPipe;
    why = onBranch ? '泵吸水支管' : '水罐出水短管';
  }
  if (v.orientation === 'z' && Math.abs(vz - d.y) < 1e-9) {
    placed = branchXs.includes(vx) && vy >= db.headerZ && vy <= db.riserZ;
    why = '泵出水横支管';
  }
  if (v.orientation === 'y') {
    placed = branchXs.includes(vx)
      && Math.abs(vy - db.riserZ) < 1e-9
      && vz >= L.pumpGeometry.dischargeBaseY && vz <= db.topY;
    why = '泵出水立管';
  }
  ok(`${v.id} ${v.name} 落在${why || '未知'}上`, placed);
}

/* 控制柜 */
for (const c of L.cabinets) {
  ok(`${c.id} 柜体在房间内`, inRoom(c.position[0], c.position[1], c.width / 2));
  ok(`${c.id} 柜顶 ${(c.baseHeight + c.height).toFixed(2)}m < 梁底 ${r.clearHeight}m`,
    c.baseHeight + c.height < r.clearHeight);
}

/* 门 */
const door = L.architecture.door;
ok(`门中心 x=${door.position[0]} 在房间内`, inRoom(door.position[0], door.position[1], door.width / 2));
ok('门与控制柜不冲突', door.position[0] - door.width / 2 > Math.max(...L.cabinets.map((c) => c.position[0] + c.width / 2)));

/* 排污井与排水沟 */
for (const sp of L.drainage.sumps) {
  ok(`${sp.id} 井在房间内`, inRoom(sp.position[0], sp.position[1], sp.size / 2));
  ok(`${sp.id} 井中心在排水沟端点`, Math.abs(sp.position[0] - L.drainage.trench.xMin) < 1e-9
    || Math.abs(sp.position[0] - L.drainage.trench.xMax) < 1e-9);
  ok(`${sp.id} 井中心在排水沟轴线`, Math.abs(sp.position[1] - L.drainage.trench.z) < 1e-9);
}

/* 灯具 */
let lampBad = 0;
for (const x of L.lights.xPositions) {
  for (const z of L.lights.zPositions) {
    if (!inRoom(x, z, 0.6)) lampBad += 1;
  }
}
ok(`灯具 ${L.lights.xPositions.length * L.lights.zPositions.length} 盏全部在室内`, lampBad === 0);
ok(`灯具安装标高 ${L.lights.mountingY}m < 梁底 ${r.clearHeight}m`, L.lights.mountingY < r.clearHeight);

/* POI 清单 */
ok('POI id 唯一', new Set(POI_LIST.map((p) => p.id)).size === POI_LIST.length);
const cats = new Set(L.poiCategories.map((c) => c.id));
ok('POI category 全部在类别表内', POI_LIST.every((p) => cats.has(p.category)));
ok('阀门 POI 数与阀门定义一致',
  POI_LIST.filter((p) => p.category === '阀门').length === L.valves.length);
ok('每个 POI 均有 bbox', POI_LIST.every((p) => p.bbox && p.bbox.min && p.bbox.max));

/* POI 级 position 必须是 [x, y, z]，且落在自身 bbox 内
 * （对象级 position 是 [x, z, y]，两者顺序不同，混用会让标签锚点落到错误位置） */
const posOutside = [];
for (const p of POI_LIST) {
  const [x, y, z] = p.position;
  const b = p.bbox;
  const inside = b
    && x >= b.min[0] - 0.01 && x <= b.max[0] + 0.01
    && y >= b.min[1] - 0.01 && y <= b.max[1] + 0.01
    && z >= b.min[2] - 0.01 && z <= b.max[2] + 0.01;
  if (!inside) posOutside.push(`${p.id}[${p.position.join(',')}]`);
}
ok('POI position 为 [x,y,z] 且落在自身 bbox 内', posOutside.length === 0, posOutside.join(' '));

/* POI position 必须贴近对应设备在 layout 中的真实位置（抽样锚点） */
const anchorChecks = [
  // 水罐：锚点取基座顶标高 + 罐体南缘外侧 0.1 m（标签不压在罐壁上）
  ['PR_TANK_01', L.tanks[0].center[0], L.tanks[0].baseY, L.tanks[0].center[1] - L.tanks[0].radius - 0.1],
  ['PR_TANK_02', L.tanks[1].center[0], L.tanks[1].baseY, L.tanks[1].center[1] - L.tanks[1].radius - 0.1],
  ['PR_PUMP_01', L.pumps[0].position[0], 0, L.pumps[0].position[1]],
  ['PR_PUMP_02', L.pumps[1].position[0], 0, L.pumps[1].position[1]],
  ['PR_PUMP_03', L.pumps[2].position[0], 0, L.pumps[2].position[1]],
  ['PR_SUMP_01', L.drainage.sumps[0].position[0], 0, L.drainage.sumps[0].position[1]],
  ['PR_SUMP_02', L.drainage.sumps[1].position[0], 0, L.drainage.sumps[1].position[1]],
  ['PR_CABINET_01', L.cabinets[0].position[0], 0, L.cabinets[0].position[1] + L.cabinets[0].depth / 2],
  ['PR_CABINET_02', L.cabinets[1].position[0], 0, L.cabinets[1].position[1] + L.cabinets[1].depth / 2],
  ['PR_PIPE_SUCTION', 0, L.pipes.suctionHeader.y, L.pipes.suctionHeader.z],
  ['PR_PIPE_DISCHARGE', 1.4, L.pipes.dischargeHeader.y, L.pipes.dischargeHeader.z],
];
for (const [id, x, y, z] of anchorChecks) {
  const p = POI_LIST.find((q) => q.id === id);
  ok(`${id} position 与真值表锚点一致`,
    !!p && Math.abs(p.position[0] - x) < 1e-6
    && Math.abs(p.position[1] - y) < 1e-6 && Math.abs(p.position[2] - z) < 1e-6);
}

/* 输出 */
const fails = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? '  OK  ' : ' FAIL '} ${c.name}`);
console.log(`\n结论：${checks.length} 项检查，${fails.length} 项不通过`);
if (fails.length) process.exitCode = 1;
