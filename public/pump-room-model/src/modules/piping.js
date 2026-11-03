/**
 * piping.js — 消防管道系统、管件与阀门
 *
 * ★ 归属：通用消防水泵房三维建模团队 · 管路阀门师（唯一可写文件）
 * ★ 几何真值表：ctx.layout.pipes / ctx.layout.valves / ctx.layout.pumps / ctx.layout.tanks
 *   所有位置与标高一律从 layout 读取，本文件内不出现世界坐标字面量。
 * ★ 材质：一律 ctx.mat(name) 取用（CONTRACT 4.3 材质清单），不私自 new MeshStandardMaterial。
 * ★ 随机：ctx.rng()，禁止 Math.random()（仅用于压力表指针角度）。
 * ★ 贴图：本模块不生成贴图，全部材质来自材质库（Canvas 程序化生成，零外部素材、零 CDN）。
 * ★ POI：ctx.pois.register(poiId, mesh)，仅挂接 layout.POI_LIST 已有的 id，不新增 id。
 *
 * 坐标：+X 东 / +Z 北 / +Y 上，单位米，原点 = 房间地平面几何中心。
 *
 * 【坐标口径】
 *   · layout.valves[].position = [x, z, y]（对象级）→ 用 layout.js 的 objPos() 转换
 *   · layout.pipes.* 的 x / y / z 为独立具名字段，不受 [x,z,y] 口径影响
 *   · layout.pumps[].position = [x, z]（平面）/ layout.tanks[].center = [x, z]（平面）
 *
 * 【管路拓扑】
 *   吸水母管 DN200：沿 X，z = suctionHeader.z，y = suctionHeader.y，x ∈ [xMin, xMax]
 *     ├─ 2 条水罐出水短管 DN200：罐壁 (tankX, fromZ) → 母管 (tankX, toZ)
 *     └─ 3 条泵吸水支管 DN150：母管 (pumpX, fromZ) → 泵吸入口法兰 (pumpX, toZ)
 *   出水母管 DN200：沿 X，z = dischargeHeader.z，y = dischargeHeader.y，东端穿墙（wallSleeve）
 *     └─ 3 条泵出水支管 DN150：蜗壳顶 (pumpX, riserZ, dischargeBaseY)
 *          → 立管 → 90° 弯头 → 横支管 (pumpX, headerZ, topY) 接母管
 *
 * 【管件口径】
 *   三通（异径三通）：母管中心线处设管节（collar）+ 支管节（stub，取母管管径）
 *     + 大小头（reducer）缩到支管管径。母管 DN200 + 支管 DN150 → 支管节 DN200 出、
 *     大小头 DN200→DN150；水罐出水支管 DN200 与母管同径，为等径三通。
 *   弯头：长半径弯头 R = 1.5 DN，中心线为 90° 圆弧（用四分之一 TorusGeometry 实现）。
 *     出水支管立管顶 90° 转向处各 1 只，共 3 只。
 *     吸水支管与母管正交，其 90° 转向由三通本体实现（若拆出独立弯头，支管须偏置
 *     0.126 m，与真值表 suctionBranch.fromZ = 1.5 冲突，故不采用）。
 *   大小头：6 处（3 条吸水支管 + 3 条出水支管的母管接出）+ 2 处压力表取压口。
 *
 * 【支架口径】layout.pipes.support = { spacing, width, depth }
 *   spacing = 沿母管 X 向的支架间距；width = 支架沿管轴方向的宽度（底板/立柱/托块/抱箍同宽）；
 *   depth = 托块高度（自管身外皮底面至立柱顶面）；支架自地坪落地支承管身。
 * 【标识环口径】layout.pipes.markRing = { spacing, width }
 *   spacing = 沿母管 X 向的标识环间距；width = 标识环沿管轴的宽度。
 *
 * 【穿墙套管口径】layout.pipes.dischargeHeader.wallSleeve = { x, radius, length }
 *   x 视为套管沿 X 的中心，radius 为套管外半径，length 为套管长度。
 *   墙体自 room.bounds.maxX 向外生长 wallThickness，故套管跨过东墙内表面。
 *
 * 【阀门朝向口径】
 *   阀体轴线 = layout.valves[].orientation（x / z / y 为管道轴向）。
 *   手轮平面：开启 = 与管道轴线平行；关闭 = 与管道轴线垂直。
 *   本期 10 只阀门 state 全为「开启」，手轮轴向取 +Y（垂直于水平管轴），
 *   手轮平面为水平面，平行于 X / Z 向的管轴。
 *
 * 【网格命名】
 *   PIPE_<id>_SEG_<NN> 管段；PIPE_<id>_<部件> 管件与附件；
 *   VALVE_<id>_BODY | _WHEEL | _STEM | _NAMEPLATE | _NAMEPLATE_TEXT
 */

import { objPos } from '../layout.js';

/* ── 局部几何常量（不来自 layout.js 的尺寸；按 CONTRACT 三、声明于文件头）──────── */

/** 管道圆周分段（质量档） */
const SEG = { high: 48, medium: 32, low: 20 };
/** 阀件、附件圆周分段（质量档） */
const SEG_S = { high: 24, medium: 16, low: 12 };

/** 长半径弯头：弯曲半径 R = 1.5 DN */
const ELBOW_R_DN = 1.5;
/** 三通管节（母管处）外凸量 */
const TEE_COLLAR_PAD = 0.035;
/** 三通管节沿母管长度 */
const TEE_COLLAR_LEN = 0.22;
/** 三通支管节长度（自母管中心线起算） */
const TEE_STUB_LEN = 0.18;
/** 大小头长度 */
const REDUCER_LEN = 0.1;
/** 泵出水法兰组堆叠高度（与 pumps.js 的 dischargeBaseY 之上的凸台/短管/法兰对齐） */
const PUMP_DISCHARGE_STACK = 0.0406;

/** 支架底板厚度 */
const SUPPORT_BASE_T = 0.02;
/** 支架抱箍外扩量 */
const SUPPORT_CLAMP_PAD = 0.014;
/** 标识环外凸量 */
const MARK_RING_PAD = 0.012;

/** 蝶阀阀体长度 */
const BUTTERFLY_BODY_LEN = 0.14;
/** 闸阀阀体长度 */
const GATE_BODY_LEN = 0.22;
/** 闸阀端法兰厚度 / 外扩量 */
const GATE_FLANGE_T = 0.025;
const GATE_FLANGE_PAD = 0.04;
/** 蝶阀阀颈半径 / 高度、减速箱尺寸 */
const BUTTERFLY_NECK_R = 0.05;
const BUTTERFLY_NECK_H = 0.055;
const BUTTERFLY_GEAR_W = 0.085;
const BUTTERFLY_GEAR_H = 0.055;
const BUTTERFLY_GEAR_D = 0.07;
/** 闸阀阀盖半径 / 高度 */
const GATE_BONNET_R = 0.07;
const GATE_BONNET_H = 0.05;

/** 阀杆半径 */
const VALVE_STEM_R = 0.018;
/** 手轮半径 / 轮缘管半径 / 轮毂半径 */
const VALVE_WHEEL_R = 0.075;
const VALVE_WHEEL_T = 0.018;
const VALVE_WHEEL_HUB_R = 0.022;
/** 手轮中心相对阀体顶面的抬升量 */
const VALVE_WHEEL_LIFT = 0.07;

/** 铭牌尺寸（切向 × 高 × 厚） */
const NAMEPLATE_W = 0.11;
const NAMEPLATE_H = 0.055;
const NAMEPLATE_T = 0.008;
/** 铭牌文字条尺寸 */
const NAMEPLATE_TEXT_W = 0.08;
const NAMEPLATE_TEXT_H = 0.016;
const NAMEPLATE_TEXT_T = 0.004;

/** 压力表：表盘半径 / 表壳厚度 / 取压管半径 / 取压凸台半径 / 表盘离管顶高度 */
const GAUGE_R = 0.045;
const GAUGE_T = 0.03;
const GAUGE_STUB_R = 0.012;
const GAUGE_BOSS_R = 0.04;
const GAUGE_TOP_OFFSET = 0.19;

/* ── 通用几何工具 ────────────────────────────────────────────────────────── */

/**
 * 合并若干部件（几何 + 变换矩阵）为单个 BufferGeometry。
 * 仅依赖 position / normal / uv 三属性，不引入 BufferGeometryUtils（避免与引擎 import map 冲突）。
 * @param {THREE} THREE
 * @param {Array<{geo: THREE.BufferGeometry, matrix: THREE.Matrix4}>} parts
 * @returns {THREE.BufferGeometry}
 */
function mergeGeoms(THREE, parts) {
  const geos = parts.map(({ geo, matrix }) => {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (matrix) g.applyMatrix4(matrix);
    return g;
  });
  let total = 0;
  for (const g of geos) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  let o3 = 0;
  let o2 = 0;
  for (const g of geos) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, o3);
    nor.set(g.attributes.normal.array, o3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, o2);
    o3 += n * 3;
    o2 += n * 2;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  for (const g of geos) g.dispose();
  return out;
}

/**
 * 两点之间的圆柱段（世界坐标）。
 * @param {THREE} THREE
 * @param {THREE.Vector3} from
 * @param {THREE.Vector3} to
 * @param {number} r0 起点半径
 * @param {number} r1 终点半径
 * @param {number} seg 圆周分段
 */
function betweenPart(THREE, from, to, r0, r1, seg) {
  const dir = to.clone().sub(from);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(r1, r0, len, seg, 1, false);
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize(),
  );
  const m = new THREE.Matrix4().compose(
    from.clone().add(to).multiplyScalar(0.5),
    q,
    new THREE.Vector3(1, 1, 1),
  );
  return { geo, matrix: m };
}

/**
 * 沿 dir 方向的圆柱段（局部坐标，s 为沿 dir 的距离）。
 * @param {THREE} THREE
 * @param {THREE.Vector3} dir 单位方向
 * @param {number} s0 起点距离
 * @param {number} s1 终点距离（s1 > s0）
 * @param {number} r0 起点半径
 * @param {number} r1 终点半径
 * @param {number} seg 圆周分段
 */
function segPart(THREE, dir, s0, s1, r0, r1, seg) {
  const geo = new THREE.CylinderGeometry(r1, r0, s1 - s0, seg, 1, false);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const m = new THREE.Matrix4().compose(
    dir.clone().multiplyScalar((s0 + s1) / 2),
    q,
    new THREE.Vector3(1, 1, 1),
  );
  return { geo, matrix: m };
}

/**
 * 轴对齐盒体（世界坐标）。
 */
function boxPart(THREE, x0, x1, y0, y1, z0, z1) {
  const geo = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  const m = new THREE.Matrix4().makeTranslation(
    (x0 + x1) / 2,
    (y0 + y1) / 2,
    (z0 + z1) / 2,
  );
  return { geo, matrix: m };
}

/**
 * 合并部件为单个网格。
 */
function meshOf(THREE, parts, material, name) {
  const mesh = new THREE.Mesh(mergeGeoms(THREE, parts), material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * 90° 弯头（圆弧过渡）：位于 YZ 平面，由 +Y 转向 -Z。
 * @param {THREE} THREE
 * @param {THREE.Vector3} center 圆弧中心
 * @param {number} R 弯曲半径
 * @param {number} r 管半径
 * @param {number} seg 圆周分段
 */
function elbowYZ(THREE, center, R, r, seg) {
  const geo = new THREE.TorusGeometry(R, r, Math.max(8, Math.round(seg / 2)), Math.max(12, seg), Math.PI / 2);
  // 局部 X → 世界 +Z（切于立管）；局部 Y → 世界 +Y（切于横支管）；局部 Z → 世界 -X（右手系）
  const m = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(-1, 0, 0),
  );
  m.setPosition(center.x, center.y, center.z);
  return { geo, matrix: m };
}

/* ── 管件 ────────────────────────────────────────────────────────────────── */

/**
 * 母管接出三通（管节 + 支管节 + 大小头）。
 * @param {object} ctx
 * @param {number} x 母管上的接出点 X
 * @param {number} headerY 母管标高
 * @param {number} headerZ 母管 Z
 * @param {number} headerR 母管半径
 * @param {number} dirZ 支管离开母管的方向（+1 向 +Z，-1 向 -Z）
 * @param {number} branchR 支管半径（等于母管半径时为等径三通，无大小头）
 * @param {string} namePrefix 网格名前缀
 * @param {number} seg 圆周分段
 * @returns {{tee: THREE.Mesh, reducer: THREE.Mesh|null, stubEndZ: number}}
 */
function buildTee(ctx, { x, headerY, headerZ, headerR, dirZ, branchR, namePrefix, seg }) {
  const { THREE, mat } = ctx;

  // 三通管节（套在母管上）
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(headerR + TEE_COLLAR_PAD, headerR + TEE_COLLAR_PAD, TEE_COLLAR_LEN, seg, 1, false),
    mat('steelPipe'),
  );
  collar.rotation.z = Math.PI / 2; // 轴向 +Y → +X
  collar.position.set(x, headerY, headerZ);
  collar.name = `${namePrefix}_TEE_01`;
  collar.castShadow = true;
  collar.receiveShadow = true;

  // 支管节（自母管中心线起，取母管管径）
  const stubEndZ = headerZ + dirZ * TEE_STUB_LEN;
  const stub = betweenPart(
    THREE,
    new THREE.Vector3(x, headerY, headerZ),
    new THREE.Vector3(x, headerY, stubEndZ),
    headerR, headerR, seg,
  );
  const stubMesh = meshOf(THREE, [stub], mat('steelPipe'), `${namePrefix}_TEE_STUB_01`);

  if (Math.abs(branchR - headerR) < 1e-9) {
    return { tee: collar, stub: stubMesh, reducer: null, stubEndZ };
  }

  // 大小头：母管管径 → 支管管径
  const reducerEndZ = stubEndZ + dirZ * REDUCER_LEN;
  const reducer = betweenPart(
    THREE,
    new THREE.Vector3(x, headerY, stubEndZ),
    new THREE.Vector3(x, headerY, reducerEndZ),
    headerR, branchR, seg,
  );
  const reducerMesh = meshOf(THREE, [reducer], mat('steelPipe'), `${namePrefix}_REDUCER_01`);
  return { tee: collar, stub: stubMesh, reducer: reducerMesh, stubEndZ: reducerEndZ };
}

/**
 * 管道支架：底板 + 立柱 + 托块 + 抱箍（管轴沿 X）。
 */
function buildSupport(ctx, { x, pipeY, pipeZ, pipeR, spec, name }) {
  const { THREE, mat } = ctx;
  const w = spec.width;          // 沿管轴宽度
  const d = spec.depth;          // 托块高度
  const floorY = (ctx.layout.room && ctx.layout.room.floorY) || 0;
  const cradleTop = pipeY - pipeR;
  const cradleBottom = cradleTop - d;
  const parts = [];
  parts.push(boxPart(THREE, x - w / 2, x + w / 2, floorY, floorY + SUPPORT_BASE_T, pipeZ - d / 2, pipeZ + d / 2));
  parts.push(boxPart(THREE, x - w / 2, x + w / 2, floorY + SUPPORT_BASE_T, cradleBottom, pipeZ - d / 2, pipeZ + d / 2));
  parts.push(boxPart(THREE, x - w / 2, x + w / 2, cradleBottom, cradleTop, pipeZ - d / 2, pipeZ + d / 2));
  // 抱箍：包住管身下半的半圆壳
  const shell = new THREE.CylinderGeometry(
    pipeR + SUPPORT_CLAMP_PAD, pipeR + SUPPORT_CLAMP_PAD, w, SEG_S.high, 1, true, Math.PI, Math.PI,
  );
  const m = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, -1),
  );
  m.setPosition(x, pipeY, pipeZ);
  parts.push({ geo: shell, matrix: m });
  return meshOf(THREE, parts, mat('steelPipe'), name);
}

/**
 * 消防管道红色标识环。
 */
function buildMarkRing(ctx, { x, pipeY, pipeZ, pipeR, width, name }) {
  const { THREE, mat } = ctx;
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(pipeR + MARK_RING_PAD, pipeR + MARK_RING_PAD, width, SEG_S.high, 1, false),
    mat('pipeMarkRed'),
  );
  ring.rotation.z = Math.PI / 2;
  ring.position.set(x, pipeY, pipeZ);
  ring.name = name;
  ring.castShadow = true;
  ring.receiveShadow = true;
  return ring;
}

/**
 * 母管压力表：取压凸台 + 大小头 + 取压管 + 根阀 + 表壳 + 表盘 + 指针。
 * @param {object} ctx
 * @param {number} x 取压点 X
 * @param {number} pipeY 母管标高
 * @param {number} pipeZ 母管 Z
 * @param {number} pipeR 母管半径
 * @param {THREE.Vector3} facing 表盘朝向（水平单位向量）
 */
function buildGauge(ctx, { x, pipeY, pipeZ, pipeR, facing, name }) {
  const { THREE, mat, rng } = ctx;
  const g = new THREE.Group();
  g.name = name;

  const topY = pipeY + pipeR;
  const bossBottom = topY - 0.03;
  const bossTop = topY + 0.04;
  const stubTop = topY + 0.12;
  const valveTop = topY + 0.17;
  const dialY = topY + GAUGE_TOP_OFFSET;

  const parts = [];
  // 取压凸台 + 大小头（母管管径 → 取压管口径）
  parts.push(betweenPart(
    THREE,
    new THREE.Vector3(x, bossBottom, pipeZ),
    new THREE.Vector3(x, bossTop, pipeZ),
    GAUGE_BOSS_R, GAUGE_STUB_R, SEG_S.high,
  ));
  // 取压管
  parts.push(betweenPart(
    THREE,
    new THREE.Vector3(x, bossTop, pipeZ),
    new THREE.Vector3(x, stubTop, pipeZ),
    GAUGE_STUB_R, GAUGE_STUB_R, SEG_S.high,
  ));
  // 根阀
  parts.push(betweenPart(
    THREE,
    new THREE.Vector3(x, stubTop, pipeZ),
    new THREE.Vector3(x, valveTop, pipeZ),
    0.026, 0.026, SEG_S.high,
  ));
  // 根阀手柄
  parts.push(boxPart(THREE, x - 0.032, x + 0.032, valveTop - 0.01, valveTop + 0.012, pipeZ - 0.012, pipeZ + 0.012));
  const stemMesh = meshOf(THREE, parts, mat('steelPipe'), `${name}_TAKEOFF_01`);
  g.add(stemMesh);

  // 表体（表盘法向 = facing）
  const dial = new THREE.Group();
  dial.name = `${name}_DIAL_01`;
  dial.position.set(x, dialY, pipeZ);
  dial.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), facing.clone().normalize());

  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(GAUGE_R, GAUGE_R, GAUGE_T, SEG_S.high),
    mat('steelPipe'),
  );
  shell.rotation.x = Math.PI / 2; // 轴向 +Y → +Z（表盘法向）
  shell.name = `${name}_CASE_01`;
  shell.castShadow = true;
  dial.add(shell);

  const face = new THREE.Mesh(
    new THREE.CircleGeometry(GAUGE_R - 0.006, SEG_S.high),
    mat('signPlate'),
  );
  face.position.z = GAUGE_T / 2 + 0.001;
  face.name = `${name}_FACE_01`;
  dial.add(face);

  // 指针（角度取自 ctx.rng()，可复现）
  const theta = rng() * Math.PI * 2;
  const needleLen = GAUGE_R - 0.012;
  const needle = new THREE.Mesh(
    new THREE.BoxGeometry(0.004, needleLen, 0.003),
    mat('valveHandle'),
  );
  const nm = new THREE.Matrix4().makeTranslation(0, 0, GAUGE_T / 2 + 0.004);
  nm.multiply(new THREE.Matrix4().makeRotationZ(theta));
  nm.multiply(new THREE.Matrix4().makeTranslation(0, needleLen / 2, 0));
  needle.applyMatrix4(nm);
  needle.name = `${name}_NEEDLE_01`;
  dial.add(needle);

  g.add(dial);
  return g;
}

/* ── 阀门 ────────────────────────────────────────────────────────────────── */

/** 管道轴向 → 单位向量分量（THREE 由 ctx 提供，故此处用字面量） */
const AXIS_VEC = {
  x: [1, 0, 0],
  z: [0, 0, 1],
  y: [0, 1, 0],
};

/**
 * 铭牌法向：垂直于管道轴线的水平方向，指向操作侧。
 */
function nameplateNormal(THREE, v, p, pumpRowZ) {
  const axis = String(v.orientation || 'z').toLowerCase();
  if (axis === 'x') {
    // 轴向沿 X → 法向取 ±Z，指向泵列所在侧
    return p.z > pumpRowZ ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 0, 1);
  }
  // 轴向沿 Z（或 Y）→ 法向取 ±X，指向房间中心侧
  return p.x > 0 ? new THREE.Vector3(-1, 0, 0) : new THREE.Vector3(1, 0, 0);
}

/**
 * 单只阀门：阀体 + 阀杆 + 手轮 + 铭牌。
 * @param {object} ctx
 * @param {object} v layout.valves 中的一条
 * @param {number} pumpRowZ 泵列 Z（用于铭牌朝向）
 */
function buildValve(ctx, v, pumpRowZ) {
  const { THREE, mat } = ctx;
  const p = objPos(v.position);
  const g = new THREE.Group();
  g.name = `VALVE_${v.id}`;
  g.position.set(p.x, p.y, p.z);

  const axisVec = AXIS_VEC[String(v.orientation || 'z').toLowerCase()] || AXIS_VEC.z;
  const axis = new THREE.Vector3(axisVec[0], axisVec[1], axisVec[2]);
  const up = new THREE.Vector3(0, 1, 0);
  const r = v.radius;
  const isGate = String(v.type) === '闸阀';
  const closed = String(v.state) === '关闭';

  /* ── 阀体 ─────────────────────────────────────────────────────────── */
  const bodyParts = [];
  const bodyLen = isGate ? GATE_BODY_LEN : BUTTERFLY_BODY_LEN;
  bodyParts.push(segPart(THREE, axis, -bodyLen / 2, bodyLen / 2, r, r, SEG_S.high));
  if (isGate) {
    // 闸阀：两端法兰 + 阀盖
    bodyParts.push(segPart(THREE, axis, -bodyLen / 2 - GATE_FLANGE_T, -bodyLen / 2, r + GATE_FLANGE_PAD, r + GATE_FLANGE_PAD, SEG_S.high));
    bodyParts.push(segPart(THREE, axis, bodyLen / 2, bodyLen / 2 + GATE_FLANGE_T, r + GATE_FLANGE_PAD, r + GATE_FLANGE_PAD, SEG_S.high));
    bodyParts.push(segPart(THREE, up, r - 0.02, r - 0.02 + GATE_BONNET_H, GATE_BONNET_R, GATE_BONNET_R * 0.8, SEG_S.high));
  } else {
    // 蝶阀：两侧密封边 + 阀颈 + 减速箱
    bodyParts.push(segPart(THREE, axis, -bodyLen / 2 - 0.015, -bodyLen / 2, r, r, SEG_S.high));
    bodyParts.push(segPart(THREE, axis, bodyLen / 2, bodyLen / 2 + 0.015, r, r, SEG_S.high));
    bodyParts.push(segPart(THREE, up, r - 0.01, r - 0.01 + BUTTERFLY_NECK_H, BUTTERFLY_NECK_R, BUTTERFLY_NECK_R, SEG_S.high));
    const gear = new THREE.BoxGeometry(BUTTERFLY_GEAR_W, BUTTERFLY_GEAR_H, BUTTERFLY_GEAR_D);
    const gm = new THREE.Matrix4().makeTranslation(0, r + BUTTERFLY_NECK_H * 0.4, 0);
    bodyParts.push({ geo: gear, matrix: gm });
  }
  const body = meshOf(THREE, bodyParts, mat('valveBody'), `VALVE_${v.id}_BODY`);
  g.add(body);

  /* ── 手轮轴向：开启 = 手轮平面与管轴平行；关闭 = 与管轴垂直 ───────── */
  let axle;
  if (closed) {
    axle = axis.clone();                       // 手轮平面 ⊥ 管轴
  } else if (Math.abs(axis.y) < 1e-6) {
    axle = up.clone();                         // 水平管：手轮水平，平面含管轴
  } else {
    axle = new THREE.Vector3(1, 0, 0);         // 立管：手轮竖直，平面含管轴
  }

  const wheelCenter = axle.clone().multiplyScalar(r + VALVE_WHEEL_LIFT);

  /* ── 阀杆 ─────────────────────────────────────────────────────────── */
  const stem = segPart(
    THREE, axle, r - 0.02, r + VALVE_WHEEL_LIFT, VALVE_STEM_R, VALVE_STEM_R, SEG_S.high,
  );
  g.add(meshOf(THREE, [stem], mat('steelPipe'), `VALVE_${v.id}_STEM`));

  /* ── 手轮（轮缘 + 4 辐条 + 轮毂）──────────────────────────────────── */
  const wheelParts = [];
  wheelParts.push({ geo: new THREE.TorusGeometry(VALVE_WHEEL_R, VALVE_WHEEL_T, 8, 20), matrix: new THREE.Matrix4() });
  const spokeGeo = new THREE.BoxGeometry(VALVE_WHEEL_R, 0.012, 0.014);
  for (let i = 0; i < 4; i += 1) {
    const m = new THREE.Matrix4().makeRotationZ((i * Math.PI) / 2);
    m.multiply(new THREE.Matrix4().makeTranslation(VALVE_WHEEL_R / 2, 0, 0));
    wheelParts.push({ geo: spokeGeo, matrix: m });
  }
  const hub = new THREE.CylinderGeometry(VALVE_WHEEL_HUB_R, VALVE_WHEEL_HUB_R, 0.05, SEG_S.high);
  const hubM = new THREE.Matrix4().makeRotationX(Math.PI / 2);
  wheelParts.push({ geo: hub, matrix: hubM });
  const wheel = meshOf(THREE, wheelParts, mat('valveHandle'), `VALVE_${v.id}_WHEEL`);
  wheel.position.copy(wheelCenter);
  wheel.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), axle);
  g.add(wheel);

  /* ── 铭牌 ─────────────────────────────────────────────────────────── */
  const n = nameplateNormal(THREE, v, p, pumpRowZ);
  const tangent = new THREE.Vector3().crossVectors(up, n).normalize();
  const plateCenter = n.clone().multiplyScalar(r + NAMEPLATE_T / 2 + 0.002);
  const plateM = new THREE.Matrix4().makeBasis(tangent, up, n);
  plateM.setPosition(plateCenter.x, plateCenter.y, plateCenter.z);
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(NAMEPLATE_W, NAMEPLATE_H, NAMEPLATE_T),
    mat('signPlate'),
  );
  plate.applyMatrix4(plateM);
  plate.name = `VALVE_${v.id}_NAMEPLATE`;
  plate.castShadow = true;
  g.add(plate);

  const textM = new THREE.Matrix4().makeBasis(tangent, up, n);
  const textCenter = plateCenter.clone().addScaledVector(n, NAMEPLATE_T / 2 + NAMEPLATE_TEXT_T / 2 + 0.001);
  textM.setPosition(textCenter.x, textCenter.y, textCenter.z);
  const text = new THREE.Mesh(
    new THREE.BoxGeometry(NAMEPLATE_TEXT_W, NAMEPLATE_TEXT_H, NAMEPLATE_TEXT_T),
    mat('signText'),
  );
  text.applyMatrix4(textM);
  text.name = `VALVE_${v.id}_NAMEPLATE_TEXT`;
  g.add(text);

  return g;
}

/* ── 模块入口 ──────────────────────────────────────────────────────────────── */

/**
 * 构建消防管道系统、管件与阀门。
 * @param {object} ctx 见 CONTRACT 4.2：{ THREE, mat, rng, pois, layout, options }
 * @returns {THREE.Group} 全部管路、附件与阀门的独立分组
 */
export function buildPiping(ctx) {
  const { THREE, mat, pois, layout } = ctx;
  const group = new THREE.Group();
  group.name = 'PIPING_GROUP';

  const pipes = layout && layout.pipes;
  if (!pipes || !pipes.suctionHeader || !pipes.dischargeHeader) {
    console.warn('[piping] layout.pipes 缺失，未生成管道');
    return group;
  }

  const quality = (ctx.options && ctx.options.quality) || 'high';
  const seg = SEG[quality] || SEG.high;
  const segS = SEG_S[quality] || SEG_S.high;

  const S = pipes.suctionHeader;            // 吸水母管
  const D = pipes.dischargeHeader;          // 出水母管
  const SB = pipes.suctionBranch;           // 泵吸水支管
  const DB = pipes.dischargeBranch;         // 泵出水立管 + 横支管
  const TO = pipes.tankOutletPipe;          // 水罐出水短管
  const supSpec = pipes.support;            // 支架
  const markSpec = pipes.markRing;          // 标识环

  const pumps = Array.isArray(layout.pumps) ? layout.pumps : [];
  const tanks = Array.isArray(layout.tanks) ? layout.tanks : [];
  const valves = Array.isArray(layout.valves) ? layout.valves : [];
  const pumpXs = pumps.map((p) => p.position[0]);
  const tankXs = tanks.map((t) => t.center[0]);
  const pumpRowZ = pumps.length ? pumps[0].position[1] : 0;
  const pumpGeo = layout.pumpGeometry || {};

  /* ══ 吸水母管系统 ══════════════════════════════════════════════════════ */
  const suction = new THREE.Group();
  suction.name = 'PIPE_SUCTION';

  const suctionPipe = betweenPart(
    THREE,
    new THREE.Vector3(S.xMin, S.y, S.z),
    new THREE.Vector3(S.xMax, S.y, S.z),
    S.radius, S.radius, seg,
  );
  const suctionSeg = meshOf(THREE, [suctionPipe], mat('steelPipe'), 'PIPE_SUCTION_SEG_01');
  suction.add(suctionSeg);

  /* ── 3 条泵吸水支管（母管 → 泵吸入口）───────────────────────────── */
  const suctionBranchGroups = [];
  pumps.forEach((pump, i) => {
    const px = pump.position[0];
    const bg = new THREE.Group();
    bg.name = `PIPE_SUCTION_BRANCH_${String(i + 1).padStart(2, '0')}`;
    const prefix = `PIPE_SUCTION_BRANCH_${String(i + 1).padStart(2, '0')}`;

    // 母管接出三通（向 -Z）+ 大小头
    const tee = buildTee(ctx, {
      x: px,
      headerY: S.y,
      headerZ: S.z,
      headerR: S.radius,
      dirZ: -1,
      branchR: SB.radius,
      namePrefix: prefix,
      seg,
    });
    bg.add(tee.tee, tee.stub);
    if (tee.reducer) bg.add(tee.reducer);

    // DN150 支管：自大小头末端至泵吸入口法兰面
    const branch = betweenPart(
      THREE,
      new THREE.Vector3(px, SB.y, tee.stubEndZ),
      new THREE.Vector3(px, SB.y, SB.toZ),
      SB.radius, SB.radius, seg,
    );
    bg.add(meshOf(THREE, [branch], mat('steelPipe'), `${prefix}_SEG_01`));

    suction.add(bg);
    suctionBranchGroups.push(bg);
  });

  /* ── 2 条水罐出水短管（罐壁 → 吸水母管）────────────────────────── */
  tanks.forEach((tank, i) => {
    const tx = tank.center[0];
    const tg = new THREE.Group();
    tg.name = `PIPE_TANK_OUTLET_${String(i + 1).padStart(2, '0')}`;
    const prefix = `PIPE_TANK_OUTLET_${String(i + 1).padStart(2, '0')}`;

    // 母管等径三通（向 +Z）
    const tee = buildTee(ctx, {
      x: tx,
      headerY: TO.y,
      headerZ: TO.toZ,
      headerR: S.radius,
      dirZ: 1,
      branchR: TO.radius,
      namePrefix: prefix,
      seg,
    });
    tg.add(tee.tee, tee.stub);

    // DN200 短管：自三通支管节末端至罐壁
    const pipe = betweenPart(
      THREE,
      new THREE.Vector3(tx, TO.y, tee.stubEndZ),
      new THREE.Vector3(tx, TO.y, TO.fromZ),
      TO.radius, TO.radius, seg,
    );
    tg.add(meshOf(THREE, [pipe], mat('steelPipe'), `${prefix}_SEG_01`));

    suction.add(tg);
  });

  /* ── 支架 / 标识环 / 压力表（吸水母管）───────────────────────────── */
  const suctionTakeoffXs = [...pumpXs, ...tankXs];
  addSupports(ctx, suction, {
    xMin: S.xMin, xMax: S.xMax, pipeY: S.y, pipeZ: S.z, pipeR: S.radius,
    spec: supSpec, forbidXs: suctionTakeoffXs, tag: 'SUCTION',
  });
  addMarkRings(ctx, suction, {
    xMin: S.xMin, xMax: S.xMax, pipeY: S.y, pipeZ: S.z, pipeR: S.radius,
    spec: markSpec, forbidXs: suctionTakeoffXs, tag: 'SUCTION',
  });
  suction.add(buildGauge(ctx, {
    x: S.xMin + 0.1,
    pipeY: S.y,
    pipeZ: S.z,
    pipeR: S.radius,
    facing: new THREE.Vector3(0, 0, -1),
    name: 'PIPE_SUCTION_GAUGE_01',
  }));

  group.add(suction);

  /* ══ 出水母管系统 ══════════════════════════════════════════════════════ */
  const discharge = new THREE.Group();
  discharge.name = 'PIPE_DISCHARGE';

  const dischargePipe = betweenPart(
    THREE,
    new THREE.Vector3(D.xMin, D.y, D.z),
    new THREE.Vector3(D.xMax, D.y, D.z),
    D.radius, D.radius, seg,
  );
  const dischargeSeg = meshOf(THREE, [dischargePipe], mat('steelPipe'), 'PIPE_DISCHARGE_SEG_01');
  discharge.add(dischargeSeg);

  /* ── 穿墙套管（东端）────────────────────────────────────────────── */
  if (D.wallSleeve) {
    const sl = D.wallSleeve;
    const sleeve = betweenPart(
      THREE,
      new THREE.Vector3(sl.x - sl.length / 2, D.y, D.z),
      new THREE.Vector3(sl.x + sl.length / 2, D.y, D.z),
      sl.radius, sl.radius, seg,
    );
    discharge.add(meshOf(THREE, [sleeve], mat('steelPipe'), 'PIPE_DISCHARGE_SLEEVE_01'));
  }

  /* ── 3 条泵出水支管（蜗壳顶 → 立管 → 弯头 → 横支管 → 母管）───────── */
  // 长半径弯头 R = 1.5 DN（DN 取自 layout.pipes.dischargeBranch.dn）
  const elbowR = ELBOW_R_DN * ((DB.dn || 150) / 1000);
  const riserBottomY = (pumpGeo.dischargeBaseY !== undefined ? pumpGeo.dischargeBaseY : DB.topY) + PUMP_DISCHARGE_STACK;
  pumps.forEach((pump, i) => {
    const px = pump.position[0];
    const bg = new THREE.Group();
    bg.name = `PIPE_DISCHARGE_BRANCH_${String(i + 1).padStart(2, '0')}`;
    const prefix = `PIPE_DISCHARGE_BRANCH_${String(i + 1).padStart(2, '0')}`;

    // 母管接出三通（向 +Z）+ 大小头
    const tee = buildTee(ctx, {
      x: px,
      headerY: DB.topY,
      headerZ: DB.headerZ,
      headerR: D.radius,
      dirZ: 1,
      branchR: DB.radius,
      namePrefix: prefix,
      seg,
    });
    bg.add(tee.tee, tee.stub);
    if (tee.reducer) bg.add(tee.reducer);

    // 横支管：自母管三通末端至弯头切点
    const elbowStartZ = DB.riserZ - elbowR;
    const horiz = betweenPart(
      THREE,
      new THREE.Vector3(px, DB.topY, tee.stubEndZ),
      new THREE.Vector3(px, DB.topY, elbowStartZ),
      DB.radius, DB.radius, seg,
    );
    bg.add(meshOf(THREE, [horiz], mat('steelPipe'), `${prefix}_SEG_03`));

    // 90° 弯头（圆弧过渡，YZ 平面，+Y → -Z）
    const arc = elbowYZ(
      THREE,
      new THREE.Vector3(px, DB.topY - elbowR, DB.riserZ - elbowR),
      elbowR, DB.radius, seg,
    );
    bg.add(meshOf(THREE, [arc], mat('steelPipe'), `${prefix}_SEG_02`));

    // 立管：自泵出水法兰顶面至弯头切点
    const riser = betweenPart(
      THREE,
      new THREE.Vector3(px, riserBottomY, DB.riserZ),
      new THREE.Vector3(px, DB.topY - elbowR, DB.riserZ),
      DB.radius, DB.radius, seg,
    );
    bg.add(meshOf(THREE, [riser], mat('steelPipe'), `${prefix}_SEG_01`));

    // 与泵出水法兰对接的活接法兰
    const matingFlange = betweenPart(
      THREE,
      new THREE.Vector3(px, riserBottomY, DB.riserZ),
      new THREE.Vector3(px, riserBottomY + 0.028, DB.riserZ),
      DB.radius * 1.75, DB.radius * 1.75, seg,
    );
    bg.add(meshOf(THREE, [matingFlange], mat('steelPipe'), `${prefix}_FLANGE_01`));

    discharge.add(bg);
  });

  /* ── 支架 / 标识环 / 压力表（出水母管）───────────────────────────── */
  const dischargeForbidXs = [...pumpXs];
  const sleeve = D.wallSleeve;
  addSupports(ctx, discharge, {
    xMin: D.xMin, xMax: D.xMax, pipeY: D.y, pipeZ: D.z, pipeR: D.radius,
    spec: supSpec, forbidXs: dischargeForbidXs, tag: 'DISCHARGE',
    forbidRanges: sleeve ? [[sleeve.x - sleeve.length / 2 - 0.2, sleeve.x + sleeve.length / 2 + 0.2]] : [],
  });
  addMarkRings(ctx, discharge, {
    xMin: D.xMin, xMax: D.xMax, pipeY: D.y, pipeZ: D.z, pipeR: D.radius,
    spec: markSpec, forbidXs: dischargeForbidXs, tag: 'DISCHARGE',
    forbidRanges: sleeve ? [[sleeve.x - sleeve.length / 2 - 0.2, sleeve.x + sleeve.length / 2 + 0.2]] : [],
  });
  discharge.add(buildGauge(ctx, {
    x: D.xMin + 0.1,
    pipeY: D.y,
    pipeZ: D.z,
    pipeR: D.radius,
    facing: new THREE.Vector3(0, 0, 1),
    name: 'PIPE_DISCHARGE_GAUGE_01',
  }));

  group.add(discharge);

  /* ══ 阀门 ═════════════════════════════════════════════════════════════ */
  for (const v of valves) {
    const vg = buildValve(ctx, v, pumpRowZ);
    group.add(vg);
    if (pois && typeof pois.register === 'function') {
      pois.register(`PR_${v.id}`, vg);
    }
  }

  /* ══ POI 挂接（母管本体）═════════════════════════════════════════════ */
  if (pois && typeof pois.register === 'function') {
    pois.register('PR_PIPE_SUCTION', suctionSeg);
    pois.register('PR_PIPE_DISCHARGE', dischargeSeg);
  }

  return group;
}

/**
 * 沿母管 X 向按间距布置支架。
 * @param {object} ctx
 * @param {THREE.Group} parent
 */
function addSupports(ctx, parent, { xMin, xMax, pipeY, pipeZ, pipeR, spec, forbidXs, forbidRanges, tag }) {
  if (!spec || !spec.spacing) return;
  const spacing = spec.spacing;
  const half = spec.width / 2 + TEE_COLLAR_LEN / 2 + 0.005;
  let n = 0;
  for (let x = xMin + spacing / 2; x <= xMax - 0.15; x += spacing) {
    let ok = true;
    for (const fx of forbidXs || []) {
      if (Math.abs(x - fx) < half) { ok = false; break; }
    }
    if (ok) {
      for (const r of forbidRanges || []) {
        if (x >= r[0] && x <= r[1]) { ok = false; break; }
      }
    }
    if (!ok) continue;
    n += 1;
    parent.add(buildSupport(ctx, {
      x, pipeY, pipeZ, pipeR, spec,
      name: `PIPE_${tag}_SUPPORT_${String(n).padStart(2, '0')}`,
    }));
  }
}

/**
 * 沿母管 X 向按间距布置消防管道红色标识环。
 */
function addMarkRings(ctx, parent, { xMin, xMax, pipeY, pipeZ, pipeR, spec, forbidXs, forbidRanges, tag }) {
  if (!spec || !spec.spacing) return;
  const spacing = spec.spacing;
  const half = TEE_COLLAR_LEN / 2 + spec.width / 2 + 0.02;
  let n = 0;
  for (let x = xMin + spacing / 2; x <= xMax - 0.15; x += spacing) {
    let ok = true;
    for (const fx of forbidXs || []) {
      if (Math.abs(x - fx) < half) { ok = false; break; }
    }
    if (ok) {
      for (const r of forbidRanges || []) {
        if (x >= r[0] && x <= r[1]) { ok = false; break; }
      }
    }
    if (!ok) continue;
    n += 1;
    parent.add(buildMarkRing(ctx, {
      x, pipeY, pipeZ, pipeR,
      width: spec.width,
      name: `PIPE_${tag}_MARK_${String(n).padStart(2, '0')}`,
    }));
  }
}

export default buildPiping;
