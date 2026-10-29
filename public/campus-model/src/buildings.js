/**
 * buildings.js — 建筑生成模块
 *
 * 依据 CONTRACT.md §5.1 实现：
 *   · 为 layout.buildings 的 60 栋建筑生成几何，按 (type, form) 联合差异化造型
 *   · type 决定功能（教学/学院/实验/报告厅/图书/办公/宿舍/食堂/超市/校医院/体育馆/温室/门卫）
 *     form 决定体量造型（塔式/板式/庭院/退台/盒式/行列式/雨篷/门厅/筒壳/马鞍/折板/拱壳/扇形）
 *   · 窗户统一使用 InstancedMesh（深色窗框 + 玻璃各一个），不逐窗建 Mesh
 *   · 每栋建筑注册一个 POI（id 与 layout 完全一致），meta 中带 form 字段
 *   · 三角面数真实统计（geometry index count / 3，非索引按 position count / 3）
 *   · 全部随机走 ctx.rng（每栋建筑由 ctx.rng 派生独立子种子，保证与调用顺序无关）
 *   · 材质全部取自 ctx.mat(name)，不私自 new 材质
 *
 * 两层分派：
 *   1) FORM_BUILDERS[form]  → 决定基座体量组合（块体、屋盖、退台、塔身裙房等）
 *   2) TYPE_BUILDERS[type]  → 在体量之上补充功能构件（雨篷、柱廊、女儿墙、窗带、入口体量等）
 *
 * 体量以「块（block）」为基本单元：每个块是一个轴对齐长方体（或仅登记立面而不建实体），
 * 窗格阵列按块逐面生成，因此任意体量组合都能得到正确贴墙的窗户。
 *
 * 坐标：+X 东 / +Z 北 / +Y 上，单位米；建筑底面贴 Y = 0，长边沿 X，rotation 绕 Y 轴。
 * 本文件内所有几何均在「建筑局部坐标系」下构建（原点位于建筑中心地面），
 * 最后统一挂到带 position / rotation 的 Group 上。
 */

import { mergeGeometries } from '../vendor/three/examples/jsm/utils/BufferGeometryUtils.js';

/* ── 常量 ─────────────────────────────────────────────────────────────── */

const FRAME_MAT = 'metalDark';   // 窗框（深色）
const GLASS_MAT = 'glass';       // 窗玻璃
const FRAME_PAD = 0.3;           // 窗框相对玻璃四周的外扩量（米）

/**
 * 透明外墙材质 → 不透明实心背板。
 *
 * 幕墙建筑的墙体不能整片用半透明材质：`glass` 的 opacity 只有 0.42，
 * 外墙在近景聚焦时会整片"透没"，看上去像没有外墙。
 * 改为幕墙通行做法：不透明背板（墙身 / 窗间墙）+ 面层玻璃窗片。
 * 玻璃只保留在窗格（`*_windowGlass`）与刻意的通高中庭 / 门厅上。
 */
const FACADE_BACKING = { glass: 'plaster', glassRoof: 'concrete' };

/** 质量档 → 窗格步距放大系数（越大窗越少，用于收敛面数） */
const QUALITY_BAY_SCALE = { high: 1, medium: 1.35, low: 1.8 };

/* ── 楼顶铭牌 ─────────────────────────────────────────────────────────── */

/**
 * 铭牌常量。
 *
 * 字面高（世界米）随建筑高度缩放；牌面固定相对水平面南倾 30°，
 * 文字走向为 -X（自东向西读），字高方向沿牌面向上。
 * 牌面法线朝南偏上，正对默认机位（东南上空）→ 三维视图里文字正向可读；
 * 从正北方向俯视时文字旋转 180°（不镜像）。
 *
 * fontPx / cellH 必须与 core/materials.js 的 SIGN_FONT / SIGN_CELL_H 一致：
 * 牌面世界尺寸 = 图集单元像素 × (字面高 / fontPx)。
 */
const SIGN = {
  fontPx: 48,
  cellH: 64,
  charHMax: 2.8,                 // 字面高上限（米）
  charHMin: 1.3,                 // 字面高下限（米）
  thickness: 0.26,               // 牌面板厚（米）
  tilt: Math.PI / 6,             // 牌面相对水平的倾角（30°）
  gap: 0.06,                     // 牌面下缘离屋面高度（米）
  margin: 1.8,                   // 牌面外接框与屋面边缘的最小间距（米）
  minScale: 0.55,                // 屋面装不下时的最小字高比例
};

/** 铭牌局部坐标系：R 文字走向 / U 字高方向 / N 牌面法线 */
function signAxis(vertical) {
  if (vertical) return { R: [-1, 0, 0], U: [0, 1, 0], N: [0, 0, -1] };
  const t = SIGN.tilt;
  return {
    R: [-1, 0, 0],
    U: [0, Math.sin(t), Math.cos(t)],
    N: [0, Math.cos(t), -Math.sin(t)],
  };
}

/** 铭牌 8 个角点（局部坐标），v0~v7 与面定义对应 */
function signCorners(center, axis, hw, hh, ht) {
  const { R, U, N } = axis;
  const at = (sr, su, sn) => [
    center[0] + R[0] * sr * hw + U[0] * su * hh + N[0] * sn * ht,
    center[1] + R[1] * sr * hw + U[1] * su * hh + N[1] * sn * ht,
    center[2] + R[2] * sr * hw + U[2] * su * hh + N[2] * sn * ht,
  ];
  return [
    at(-1, -1, -1), at(1, -1, -1), at(1, 1, -1), at(-1, 1, -1),
    at(-1, -1, 1), at(1, -1, 1), at(1, 1, 1), at(-1, 1, 1),
  ];
}

/**
 * 为单栋建筑定位铭牌。
 *
 * 平屋顶形式按 form 给出的屋面候选依次试位（优先宽大的屋面）；
 * 坡屋顶 / 曲面屋顶无平屋面，改用立在屋脊上的立式牌面。
 * 屋面放不下时按 minScale 逐级缩小字面高；仍放不下则不出铭牌。
 *
 * @param {object} B 建筑构建器
 * @param {object} cell 图集单元
 * @param {object} roof 屋面信息 { apexY, cx, cz }（形态层面的屋面最高点与中心）
 * @returns {null|{center:number[], axis:object, hw:number, hh:number, ht:number}}
 */
function placeSign(B, cell, roof) {
  if (!cell) return null;
  const vertical = !(B.roofAreas && B.roofAreas.length);
  const axis = signAxis(vertical);
  const cands = vertical
    ? [{ y: roof.apexY, cx: roof.cx, cz: roof.cz, w: B.w, d: B.d }]
    : B.roofAreas;

  let charH = Math.min(SIGN.charHMax, Math.max(SIGN.charHMin, B.H * 0.09));
  let lastFail = '';
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const m = charH / SIGN.fontPx;            // 米 / 像素
    const hw = (cell.w * m) / 2;              // 沿 R（文字走向）
    const hh = (SIGN.cellH * m) / 2;          // 沿 U（字高方向）
    const ht = SIGN.thickness / 2;            // 沿 N（板厚）

    for (const c of cands) {
      const center = vertical
        ? [c.cx, c.y + hh + 0.1, c.cz]
        : [
          c.cx + hh * axis.U[0] + ht * axis.N[0],
          c.y + hh * axis.U[1] + ht * axis.N[1] + SIGN.gap,
          c.cz + hh * axis.U[2] + ht * axis.N[2],
        ];
      const corners = signCorners(center, axis, hw, hh, ht);
      let minX = Infinity; let maxX = -Infinity;
      let minZ = Infinity; let maxZ = -Infinity;
      for (const p of corners) {
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[2] < minZ) minZ = p[2];
        if (p[2] > maxZ) maxZ = p[2];
      }
      // 屋面候选块是建筑局部坐标下的矩形（cx/cz 为中心）
      const inX = minX >= c.cx - c.w / 2 + SIGN.margin && maxX <= c.cx + c.w / 2 - SIGN.margin;
      const inZ = minZ >= c.cz - c.d / 2 + SIGN.margin && maxZ <= c.cz + c.d / 2 - SIGN.margin;
      if (!inX || !inZ) {
        lastFail = `候选 ${JSON.stringify(c)} 需 X[${minX.toFixed(1)},${maxX.toFixed(1)}] `
          + `Z[${minZ.toFixed(1)},${maxZ.toFixed(1)}] 字高 ${charH.toFixed(2)}`;
        continue;
      }
      return { center, axis, hw, hh, ht };
    }

    charH *= 0.85;
    if (charH < SIGN.charHMin * SIGN.minScale) break;
  }
  if (lastFail) console.warn(`[buildings] 铭牌未放置 ${B.b.id}：${lastFail}`);
  return null;
}

/**
 * 把铭牌几何写入合并缓冲。
 * 顶面用图集单元 UV（承载文字），其余 5 面用纯色取样点。
 */
function pushSignBox(buf, center, axis, hw, hh, ht, cell, solid) {
  const { R, U, N } = axis;
  const v = signCorners(center, axis, hw, hh, ht);
  const nrm = (a) => {
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  const push = (p, n, uv) => {
    buf.pos.push(p[0], p[1], p[2]);
    buf.nrm.push(n[0], n[1], n[2]);
    buf.uv.push(uv[0], uv[1]);
  };
  const uR = nrm(R);
  const uU = nrm(U);
  const uN = nrm(N);
  const uRU = nrm([
    R[1] * U[2] - R[2] * U[1],
    R[2] * U[0] - R[0] * U[2],
    R[0] * U[1] - R[1] * U[0],
  ]);
  const uvSolid = [solid.u, solid.v];
  const face = (idx, n, uvs) => {
    const base = buf.pos.length / 3;
    for (let i = 0; i < 4; i += 1) push(v[idx[i]], n, uvs[i]);
    buf.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  // 顶面（法线 N）：文字
  face([4, 5, 6, 7], uN, [
    [cell.u0, cell.v0], [cell.u1, cell.v0], [cell.u1, cell.v1], [cell.u0, cell.v1],
  ]);
  // 底面（法线 -N）
  face([0, 3, 2, 1], [-uN[0], -uN[1], -uN[2]], [uvSolid, uvSolid, uvSolid, uvSolid]);
  // 四个侧面
  face([0, 1, 5, 4], [-uU[0], -uU[1], -uU[2]], [uvSolid, uvSolid, uvSolid, uvSolid]);
  face([3, 7, 6, 2], uU, [uvSolid, uvSolid, uvSolid, uvSolid]);
  face([0, 4, 7, 3], [-uRU[0], -uRU[1], -uRU[2]], [uvSolid, uvSolid, uvSolid, uvSolid]);
  face([1, 2, 6, 5], uRU, [uvSolid, uvSolid, uvSolid, uvSolid]);
}

/** 四个立面 */
const SIDES = ['south', 'north', 'west', 'east'];

/**
 * 立面样式 → 窗格参数。
 * band    横向窗带（宽而矮的连续窗）
 * grid    规则方格窗
 * curtain 通高幕墙
 */
const STYLE_CFG = {
  band: { bay: 3.2, ratio: 0.93, hFrac: 0.5, margin: 1.1 },
  grid: { bay: 3.6, ratio: 0.46, hFrac: 0.46, margin: 1.8 },
  curtain: { bay: 5.2, ratio: 0.88, hFrac: 0.76, margin: 1.0 },
};

/* ── 通用工具 ─────────────────────────────────────────────────────────── */

/** 真实三角面数：优先用索引，否则按顶点数 */
function triCount(geo) {
  if (!geo) return 0;
  if (geo.index) return geo.index.count / 3;
  const p = geo.attributes && geo.attributes.position;
  return p ? p.count / 3 : 0;
}

/** 统一转为非索引几何，保证 mergeGeometries 可混合合并 */
function flat(geo) {
  return geo.index ? geo.toNonIndexed() : geo;
}

/** 合并一组几何；失败时告警并回退为首个几何 */
function mergeAll(geos) {
  if (!geos || geos.length === 0) return null;
  if (geos.length === 1) return geos[0];
  const list = geos.map(flat);
  let merged = null;
  try {
    merged = mergeGeometries(list, false);
  } catch (err) {
    merged = null;
    console.warn('[buildings] 几何合并失败，回退为单几何：', err);
  }
  return merged || list[0];
}

/** 由 ctx.rng 派生一个子发生器：种子取自 ctx.rng，算法与 core/rng.js 一致 */
function subRng(rng, id) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = ((Math.floor(rng() * 0xffffffff) ^ h) >>> 0) || 1;
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function round2(v) {
  return Math.round(v * 100) / 100;
}

/**
 * 由矩形中心与尺寸生成一个立面坐标系。
 * n = 外法线，t = 沿墙方向单位向量，base = 立面中点，ry = 立面绕 Y 的转角，len = 墙长。
 */
function makeFrame(cx, cz, w, d, side) {
  switch (side) {
    case 'south': return { n: [0, 0, -1], t: [1, 0, 0], base: [cx, 0, cz - d / 2], ry: Math.PI, len: w };
    case 'north': return { n: [0, 0, 1], t: [1, 0, 0], base: [cx, 0, cz + d / 2], ry: 0, len: w };
    case 'west': return { n: [-1, 0, 0], t: [0, 0, 1], base: [cx - w / 2, 0, cz], ry: -Math.PI / 2, len: d };
    default: return { n: [1, 0, 0], t: [0, 0, 1], base: [cx + w / 2, 0, cz], ry: Math.PI / 2, len: d };
  }
}

/* ── 构件收集器（按 role + material 合并，输出规范命名的 Mesh） ──────── */

class Parts {
  constructor(id) {
    this.id = id;
    this.groups = new Map();
    this.bmin = { x: Infinity, y: Infinity, z: Infinity };
    this.bmax = { x: -Infinity, y: -Infinity, z: -Infinity };
  }

  /** 登记一个构件几何（几何坐标须已处于建筑局部坐标系） */
  add(role, material, geo) {
    const key = `${role}|${material}`;
    let g = this.groups.get(key);
    if (!g) {
      g = { role, material, geos: [] };
      this.groups.set(key, g);
    }
    g.geos.push(geo);
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    if (bb) {
      this.bmin.x = Math.min(this.bmin.x, bb.min.x);
      this.bmin.y = Math.min(this.bmin.y, bb.min.y);
      this.bmin.z = Math.min(this.bmin.z, bb.min.z);
      this.bmax.x = Math.max(this.bmax.x, bb.max.x);
      this.bmax.y = Math.max(this.bmax.y, bb.max.y);
      this.bmax.z = Math.max(this.bmax.z, bb.max.z);
    }
    return geo;
  }

  /** 某 role 下有多少种材质（用于决定命名是否追加材质后缀） */
  roleMaterialCount(role) {
    let n = 0;
    for (const g of this.groups.values()) if (g.role === role) n += 1;
    return n;
  }

  /** 生成 Mesh：name = CAMPUS_XXX_01_role[_material] */
  flush(THREE, mat, parent, poiId, out) {
    for (const g of this.groups.values()) {
      const merged = mergeAll(g.geos);
      if (!merged) continue;
      const suffix = this.roleMaterialCount(g.role) > 1 ? `_${g.material}` : '';
      const mesh = new THREE.Mesh(merged, mat(g.material));
      mesh.name = `${this.id}_${g.role}${suffix}`;
      mesh.userData.poiId = poiId;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      out.meshes.push(mesh);
      out.triangles += triCount(merged);
    }
  }
}

/* ── 单体建筑构建器 ───────────────────────────────────────────────────── */

function makeBuilder(THREE, mat, rng, b, qualityScale) {
  const w = b.footprint.w;
  const d = b.footprint.d;
  const floors = b.floors;
  const fh = b.floorHeight;
  const H = floors * fh;

  // 入口朝向：朝向校园核心 (0, 70)；门卫岗亭朝向校门（南）
  const front = b.type === 'gatehouse' ? -1 : (b.position[2] > 70 ? -1 : 1);
  const frontSide = front < 0 ? 'south' : 'north';

  const B = {
    THREE, mat, rng, b,
    w, d, H, floors, fh,
    facade: FACADE_BACKING[b.facade] || b.facade || 'concrete',
    facadeRaw: b.facade || 'concrete',
    roof: b.roof || 'flat',
    frontSide,
    frontDir: front,
    form: b.form || 'box',
    style: b.facadeStyle || 'grid',
    traits: {},
    blocks: [],
    q: qualityScale,
    parts: new Parts(b.id),
    win: { frames: [], glass: [] },
    extras: Array.isArray(b.extras) ? b.extras : [],
  };

  /** layout 的 windowRatio 派生出实际窗洞占比 */
  B.ratio = clamp(b.windowRatio || 0.4, 0.12, 0.92);

  B.has = (key) => B.extras.indexOf(key) >= 0;
  B.trait = (key) => { B.traits[key] = true; };
  B.isTrait = (key) => !!B.traits[key];

  /* ── 立面坐标系 ── */

  /** 整体外墙坐标系（与历史行为一致） */
  B.frameOf = (side) => makeFrame(0, 0, B.w, B.d, side);
  /** 某个体量块的立面坐标系 */
  B.frameOfBlock = (blk, side) => makeFrame(blk.cx, blk.cz, blk.w, blk.d, side);

  /* ── 体量块 ── */

  /**
   * 登记一个体量块。solid 为 false 时只登记立面（用于玻璃底层等以窗代墙的做法）。
   */
  B.addBlock = (role, material, o) => {
    const blk = {
      cx: o.cx || 0,
      cz: o.cz || 0,
      w: o.w,
      d: o.d,
      y0: o.y0 || 0,
      y1: o.y1,
      floors: o.floors === undefined ? 0 : o.floors,
      fh: o.fh === undefined ? B.fh : o.fh,
      noWin: o.noWin || null,
      win: o.win === undefined ? null : o.win,
      role,
      material,
    };
    if (o.solid !== false) {
      B.box(role, material, blk.w, blk.y1 - blk.y0, blk.d, blk.cx, (blk.y0 + blk.y1) / 2, blk.cz);
    }
    B.blocks.push(blk);
    return blk;
  };

  /**
   * 透明体量块的底板。
   * 通高中庭 / 门厅的墙体是玻璃，若底下没有实体楼板，透视时会直接看到地面。
   */
  B.glassFloor = (blk, material) => {
    if (!blk) return;
    B.box('body', material || 'concrete', blk.w - 0.4, 0.18, blk.d - 0.4,
      blk.cx, blk.y0 + 0.09, blk.cz);
  };

  /** 承载入口的块（体量策略指定；缺省取最低的一块） */
  B.frontBlock = () => {
    if (B.front) return B.front;
    let best = null;
    for (const blk of B.blocks) if (!best || blk.y0 < best.y0) best = blk;
    return best || null;
  };

  /** 顶面最高的一块（屋顶设备放置依据） */
  B.topBlock = () => {
    let best = null;
    for (const blk of B.blocks) if (!best || blk.y1 > best.y1) best = blk;
    return best || null;
  };

  /** 遍历所有块 */
  B.eachBlock = (cb) => { for (const blk of B.blocks) cb(blk); };

  /* ── 基础构件 ── */

  /** 轴对齐盒体 */
  B.box = (role, material, bw, bh, bd, x, y, z, ry = 0) => {
    const geo = new THREE.BoxGeometry(bw, bh, bd);
    if (ry) geo.rotateY(ry);
    geo.translate(x, y, z);
    return B.parts.add(role, material, geo);
  };

  /** 贴附在某个立面上的盒体（width 沿墙面、depth 沿外法线） */
  B.boxOnFrame = (role, material, f, width, height, depth, offset, tOffset, y) => {
    const cx = f.base[0] + f.n[0] * (offset + depth / 2) + f.t[0] * tOffset;
    const cz = f.base[2] + f.n[2] * (offset + depth / 2) + f.t[2] * tOffset;
    const alongX = f.n[0] === 0;   // 法线沿 Z → 宽度沿 X
    const bw = alongX ? width : depth;
    const bd = alongX ? depth : width;
    return B.box(role, material, bw, height, bd, cx, y, cz);
  };

  /** 贴附在某立面上的盒体（兼容旧接口：传立面名） */
  B.boxOnFacade = (role, material, side, width, height, depth, offset, tOffset, y) =>
    B.boxOnFrame(role, material, B.frameOf(side), width, height, depth, offset, tOffset, y);

  /** 圆柱（底面贴 Y=0 起算 height） */
  B.column = (role, material, radius, height, x, z, y = 0, seg = 12) => {
    const geo = new THREE.CylinderGeometry(radius, radius * 1.06, height, seg, 1, false);
    geo.translate(x, y + height / 2, z);
    return B.parts.add(role, material, geo);
  };

  /* ── 窗户（InstancedMesh 数据） ── */

  /**
   * 放置一扇窗：t 为沿墙面的坐标，y 为窗台中心高度。
   * 生成「深色窗框 + 玻璃」两个实例，窗框略大于玻璃形成外框。
   * 窗底统一抬到地面以上，避免窗框穿到 Y=0 以下。
   */
  B.windowOn = (f, t, y, ww, wh) => {
    const px = f.base[0] + f.t[0] * t;
    const pz = f.base[2] + f.t[2] * t;
    const nx = f.n[0];
    const nz = f.n[2];
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), f.ry);
    const pad = FRAME_PAD / 2;
    const cy = Math.max(y, wh / 2 + pad + 0.05);

    const fm = new THREE.Matrix4().compose(
      new THREE.Vector3(px + nx * 0.06, cy, pz + nz * 0.06),
      q,
      new THREE.Vector3(ww + FRAME_PAD, wh + FRAME_PAD, 1),
    );
    const gm = new THREE.Matrix4().compose(
      new THREE.Vector3(px + nx * 0.11, cy, pz + nz * 0.11),
      q,
      new THREE.Vector3(ww, wh, 1),
    );
    B.win.frames.push(fm);
    B.win.glass.push(gm);
  };

  /** 放置一扇窗（兼容旧接口：传立面名） */
  B.window = (side, t, y, ww, wh) => B.windowOn(B.frameOf(side), t, y, ww, wh);

  /**
   * 规整窗格阵列。
   * cfg: { length, floors, fh, bay, ratio, hFrac, margin, y0 }
   */
  B.gridOn = (f, cfg) => {
    const {
      length, floors, fh, bay, ratio, hFrac = 0.45, margin = 1.5, y0 = 0,
    } = cfg;
    const usable = length - margin * 2;
    if (usable <= 2 || floors <= 0) return 0;
    const n = Math.max(1, Math.round(usable / bay));
    const step = usable / n;
    const ww = Math.max(0.5, Math.min(step * ratio, step - 0.45));
    const wh = fh * hFrac;
    for (let f2 = 0; f2 < floors; f2 += 1) {
      const y = y0 + f2 * fh + (fh - wh) / 2;
      for (let i = 0; i < n; i += 1) {
        const t = -length / 2 + margin + step * (i + 0.5);
        B.windowOn(f, t, y, ww, wh);
      }
    }
    return n;
  };

  /** 窗格阵列（兼容旧接口：传立面名） */
  B.grid = (side, cfg) => B.gridOn(B.frameOf(side), cfg);

  /** 某个块某一面的窗格阵列 */
  B.blockGrid = (blk, side, cfg) => {
    const f = B.frameOfBlock(blk, side);
    return B.gridOn(f, Object.assign({}, cfg, {
      length: f.len, floors: blk.floors, fh: blk.fh, y0: blk.y0,
    }));
  };

  /** 按当前立面样式，对所有体量块逐面生成窗格 */
  B.gridBlocks = (cfg) => {
    for (const blk of B.blocks) {
      if (blk.win === false) continue;
      const c = Object.assign({}, cfg, blk.win || {});
      for (const side of SIDES) {
        if (blk.noWin && blk.noWin[side]) continue;
        B.blockGrid(blk, side, c);
      }
    }
  };

  /** 竖向装饰线 / 幕墙竖挺（合并为 trim 构件） */
  B.finsOn = (f, count, y, height, out, thick, material, lengthOverride) => {
    const len = lengthOverride || f.len;
    for (let i = 0; i < count; i += 1) {
      const t = -len / 2 + (len / (count - 1 || 1)) * i;
      B.boxOnFrame('trim', material, f, thick, height, out, 0, t, y);
    }
  };

  /** 竖向装饰线（兼容旧接口：传立面名） */
  B.fins = (side, count, length, y, height, out, thick, material) =>
    B.finsOn(B.frameOf(side), count, y, height, out, thick, material, length);

  /** 环绕某个块的水平线脚 / 挑檐带 */
  B.bandBlock = (blk, y, height, out, material, role = 'trim') => {
    for (const side of SIDES) {
      const f = B.frameOfBlock(blk, side);
      B.boxOnFrame(role, material, f, f.len, height, out, 0, 0, y);
    }
  };

  /* ── 屋顶 ── */

  /** 平屋顶：屋面板 + 四面女儿墙（整体外墙口径） */
  B.flatRoof = (role, material, y, opts = {}) => {
    const { overhang = 0.35, parapet = 0.85, pt = 0.28, pmat = 'concrete' } = opts;
    const ow = w + overhang * 2;
    const od = d + overhang * 2;
    B.box(role, material, ow, 0.26, od, 0, y + 0.13, 0);
    if (parapet > 0) {
      const top = y + 0.26;
      const hh = parapet / 2;
      B.box(role, pmat, ow, parapet, pt, 0, top + hh, (od - pt) / 2);
      B.box(role, pmat, ow, parapet, pt, 0, top + hh, -(od - pt) / 2);
      B.box(role, pmat, pt, parapet, od - pt * 2, (ow - pt) / 2, top + hh, 0);
      B.box(role, pmat, pt, parapet, od - pt * 2, -(ow - pt) / 2, top + hh, 0);
    }
  };

  /** 某个块顶部的屋面板 + 女儿墙 */
  B.deck = (role, material, blk, y, opts = {}) => {
    const { overhang = 0.35, parapet = 0.85, pt = 0.28, pmat = 'concrete' } = opts;
    const ow = blk.w + overhang * 2;
    const od = blk.d + overhang * 2;
    B.box(role, material, ow, 0.26, od, blk.cx, y + 0.13, blk.cz);
    if (parapet > 0) {
      const top = y + 0.26;
      const hh = parapet / 2;
      B.box(role, pmat, ow, parapet, pt, blk.cx, top + hh, blk.cz + (od - pt) / 2);
      B.box(role, pmat, ow, parapet, pt, blk.cx, top + hh, blk.cz - (od - pt) / 2);
      B.box(role, pmat, pt, parapet, od - pt * 2, blk.cx + (ow - pt) / 2, top + hh, blk.cz);
      B.box(role, pmat, pt, parapet, od - pt * 2, blk.cx - (ow - pt) / 2, top + hh, blk.cz);
    }
  };

  /** 挑檐线脚环（4 段盒体围成，横向分层用） */
  B.corniceRing = (y, out, thick, material, role = 'trim') => {
    const ow = w + out * 2;
    const od = d + out * 2;
    B.box(role, material, ow, thick, thick, 0, y, (od - thick) / 2);
    B.box(role, material, ow, thick, thick, 0, y, -(od - thick) / 2);
    B.box(role, material, thick, thick, od - thick * 2, (ow - thick) / 2, y, 0);
    B.box(role, material, thick, thick, od - thick * 2, -(ow - thick) / 2, y, 0);
  };

  /** 双坡（人字）屋顶：屋脊沿 X 轴，ExtrudeGeometry 生成带厚度的折板 */
  B.gableRoof = (role, material, y, rise, overhang = 0.7) => {
    const hd = d / 2 + overhang;
    const depth = w + overhang * 2;
    const shape = new THREE.Shape();
    shape.moveTo(-hd, 0);
    shape.lineTo(0, rise);
    shape.lineTo(hd, 0);
    shape.lineTo(hd, -0.34);
    shape.lineTo(0, rise - 0.8);
    shape.lineTo(-hd, -0.34);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
    geo.rotateY(Math.PI / 2);           // 形状 X → 世界 Z，挤出方向 → 世界 X
    geo.translate(-depth / 2, y, 0);
    return B.parts.add(role, material, geo);
  };

  /**
   * 弧形（筒拱）屋顶：半圆柱裁切 + 竖向压扁成椭圆拱。
   * CylinderGeometry(thetaLength = π) 得到上半壳体，两端自动生成半圆端墙。
   */
  B.barrelRoof = (role, material, y, rise, length, radius, seg = 24) => {
    const geo = new THREE.CylinderGeometry(radius, radius, length, seg, 1, false, 0, Math.PI);
    geo.rotateZ(Math.PI / 2);           // 轴向 → X，高度方向 → +Y
    geo.scale(1, rise / radius, 1);     // 压扁为椭圆拱
    geo.translate(0, y, 0);
    return B.parts.add(role, material, geo);
  };

  /** 拱肋（温室 / 车间用）：半圆环面 */
  B.archRibs = (role, material, y, rise, length, radius, count, seg = 20) => {
    for (let i = 0; i < count; i += 1) {
      const x = -length / 2 + (length / (count - 1 || 1)) * i;
      const geo = new THREE.TorusGeometry(radius, 0.11, 6, seg, Math.PI);
      geo.rotateY(Math.PI / 2);         // 环面平面 → ZY 平面
      geo.scale(1, rise / radius, 1);
      geo.translate(x, y, 0);
      B.parts.add(role, material, geo);
    }
  };

  /**
   * 参数曲面实体屋盖（马鞍形 / 折板形）。
   * fn(x,z) 返回上表面高度；thick 为板厚；wallTop 为檐口收边高度（= 墙顶）。
   * 侧边自动生成竖向收边面，保证屋盖与墙体之间没有缝隙。
   */
  B.gridSolid = (role, material, o) => {
    const { w: gw, d: gd, nx, nz, thick, fn, wallTop } = o;
    const hx = gw / 2;
    const hz = gd / 2;
    const rowLen = nx + 1;
    const layer = rowLen * (nz + 1);
    const pos = [];
    const uv = [];
    for (let lay = 0; lay < 3; lay += 1) {
      for (let j = 0; j <= nz; j += 1) {
        const tz = j / nz;
        const z = -hz + gd * tz;
        for (let i = 0; i <= nx; i += 1) {
          const tx = i / nx;
          const x = -hx + gw * tx;
          let y = fn(x, z);
          if (lay === 1) y -= thick;
          if (lay === 2) y = wallTop;
          pos.push(x, y, z);
          uv.push(tx, tz);
        }
      }
    }
    const T = (i, j) => j * rowLen + i;
    const Bm = (i, j) => layer + T(i, j);
    const S = (i, j) => 2 * layer + T(i, j);
    const idx = [];
    for (let j = 0; j < nz; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        const a = T(i, j); const b = T(i + 1, j); const c = T(i, j + 1); const e = T(i + 1, j + 1);
        idx.push(a, c, b, b, c, e);
        const a2 = Bm(i, j); const b2 = Bm(i + 1, j); const c2 = Bm(i, j + 1); const e2 = Bm(i + 1, j + 1);
        idx.push(a2, b2, c2, b2, e2, c2);
      }
    }
    // 竖向收边（板厚侧面 + 檐口面）
    for (let i = 0; i < nx; i += 1) {
      // z = -hz（外法线 -Z）
      idx.push(T(i, 0), T(i + 1, 0), Bm(i, 0), T(i + 1, 0), Bm(i + 1, 0), Bm(i, 0));
      idx.push(Bm(i, 0), S(i, 0), Bm(i + 1, 0), Bm(i + 1, 0), S(i, 0), S(i + 1, 0));
      // z = +hz（外法线 +Z）
      idx.push(T(i, nz), S(i, nz), T(i + 1, nz), T(i + 1, nz), S(i, nz), S(i + 1, nz));
      idx.push(Bm(i, nz), Bm(i + 1, nz), S(i, nz), Bm(i + 1, nz), S(i + 1, nz), S(i, nz));
    }
    for (let j = 0; j < nz; j += 1) {
      // x = -hx（外法线 -X）
      idx.push(T(0, j), S(0, j), T(0, j + 1), T(0, j + 1), S(0, j), S(0, j + 1));
      idx.push(Bm(0, j), Bm(0, j + 1), S(0, j), Bm(0, j + 1), S(0, j + 1), S(0, j));
      // x = +hx（外法线 +X）
      idx.push(T(nx, j), T(nx, j + 1), S(nx, j), T(nx, j + 1), S(nx, j + 1), S(nx, j));
      idx.push(Bm(nx, j), S(nx, j), Bm(nx, j + 1), Bm(nx, j + 1), S(nx, j + 1), S(nx, j));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    const solid = geo.toNonIndexed();
    solid.computeVertexNormals();
    return B.parts.add(role, material, solid);
  };

  /* ── 入口构件 ── */

  /** 入口雨棚 + 门（门为玻璃窗实例） */
  B.entrance = (side, opts = {}) => {
    const {
      width = 10, depth = 3.6, y = 3.5, canopyMat = 'concrete', postMat = 'metalDark',
      doorW = 3.2, doorH = 2.9, posts = true, frame = null,
    } = opts;
    const f = frame || B.frameOf(side);
    B.boxOnFrame('trim', canopyMat, f, width, 0.32, depth, 0.05, 0, y);
    if (posts) {
      const t = width / 2 - 0.9;
      B.boxOnFrame('trim', postMat, f, 0.3, y, 0.3, depth - 0.55, t, y / 2);
      B.boxOnFrame('trim', postMat, f, 0.3, y, 0.3, depth - 0.55, -t, y / 2);
    }
    B.windowOn(f, 0, doorH / 2 + 0.05, doorW, doorH);
  };

  /** 入口柱廊：N 根柱 + 上部檐板 */
  B.colonnade = (side, opts = {}) => {
    const {
      count = 6, radius = 0.72, height = 6, slabW = 12, slabD = 3.6, matName = 'stone',
      frame = null,
    } = opts;
    const f = frame || B.frameOf(side);
    for (let i = 0; i < count; i += 1) {
      const t = -slabW / 2 + (slabW / (count - 1 || 1)) * i;
      const x = f.base[0] + f.t[0] * t + f.n[0] * 2.3;
      const z = f.base[2] + f.t[2] * t + f.n[2] * 2.3;
      B.column('trim', matName, radius, height, x, z);
    }
    B.boxOnFrame('trim', matName, f, slabW + 1.4, 0.62, slabD, 0.9, 0, height + 0.31);
  };

  /** 入口台阶（3 级） */
  B.steps = (side, opts = {}) => {
    const { width = 9, depth = 1.1, rise = 0.17, matName = 'stone', frame = null } = opts;
    const f = frame || B.frameOf(side);
    for (let i = 0; i < 3; i += 1) {
      B.boxOnFrame('trim', matName, f, width, rise * (i + 1), depth * (i + 1), -depth * i, 0, rise * (i + 1) / 2);
    }
  };

  /** 屋顶设备房 + 太阳能板 */
  B.roofPlant = (y, opts = {}) => {
    const {
      bw = w * 0.16, bd = d * 0.5, x = -w * 0.26, z = 0, panels = 3, houseMat = 'concrete',
    } = opts;
    const base = y + 0.26;
    B.box('roof', houseMat, bw, 3.0, bd, x, base + 1.5, z);
    B.box('roof', houseMat, bw + 0.34, 0.26, bd + 0.34, x, base + 3.12, z);
    for (let i = 0; i < panels; i += 1) {
      const px = x + bw / 2 + 1.8 + (i - (panels - 1) / 2) * 4.0;
      const geo = new THREE.BoxGeometry(3.4, 0.1, 2.0);
      geo.rotateX(-0.34);
      geo.translate(px, base + 0.62, z);
      B.parts.add('roof', 'solarPanel', geo);
    }
  };

  /** 屋顶通风设备（实验楼用）：金属箱体 + 风机筒 */
  B.roofVent = (y, count) => {
    const base = y + 0.26;
    for (let i = 0; i < count; i += 1) {
      const x = -w / 2 + (w / (count + 1)) * (i + 1);
      const bw = 2.2 + rng() * 1.8;
      const bh = 1.1 + rng() * 1.1;
      const bd = 2.0 + rng() * 1.6;
      const z = (rng() - 0.5) * d * 0.4;
      B.box('roof', 'metalDark', bw, bh, bd, x, base + bh / 2, z);
      B.column('roof', 'metalDark', Math.min(bw, bd) * 0.26, 1.3, x, z, base + bh);
    }
  };

  /** 顶部招牌 */
  B.sign = (side, opts = {}) => {
    const { width = 12, height = 1.7, y = H + 1.0, barW = 8, bar = true, frame = null } = opts;
    const f = frame || B.frameOf(side);
    B.boxOnFrame('trim', 'signBlue', f, width, height, 0.34, 0.08, 0, y);
    if (bar) B.boxOnFrame('trim', 'lineWhite', f, barW, 0.34, 0.16, 0.26, 0, y);
  };

  /**
   * 沿矩形周边布置细柱（雨篷 / 门厅的底层架空柱列）。
   * skipFront 为真时跳过入口所在的那条边。
   */
  B.perimeterColumns = (blk, y, height, radius, spacing, material, skipFront) => {
    const edges = [
      { side: 'south', len: blk.w, at: (t) => [blk.cx + t, blk.cz - blk.d / 2] },
      { side: 'north', len: blk.w, at: (t) => [blk.cx + t, blk.cz + blk.d / 2] },
      { side: 'west', len: blk.d, at: (t) => [blk.cx - blk.w / 2, blk.cz + t] },
      { side: 'east', len: blk.d, at: (t) => [blk.cx + blk.w / 2, blk.cz + t] },
    ];
    for (const e of edges) {
      if (skipFront && e.side === B.frontSide) continue;
      const n = Math.max(2, Math.round(e.len / spacing));
      for (let i = 0; i < n; i += 1) {
        const t = -e.len / 2 + (e.len / (n - 1)) * i;
        const p = e.at(t);
        B.column('trim', material, radius, height, p[0], p[1], y, 8);
      }
    }
  };

  /* ── 输出 ── */

  B.flushWindows = (parent, out) => {
    const n = B.win.frames.length;
    if (!n) return;
    const mk = (mats, material, name) => {
      const geo = new THREE.PlaneGeometry(1, 1);
      const im = new THREE.InstancedMesh(geo, mat(material), mats.length);
      for (let i = 0; i < mats.length; i += 1) im.setMatrixAt(i, mats[i]);
      im.instanceMatrix.needsUpdate = true;
      im.name = name;
      im.userData.poiId = b.id;
      im.castShadow = false;
      im.receiveShadow = false;
      im.frustumCulled = false;
      if (typeof im.computeBoundingSphere === 'function') im.computeBoundingSphere();
      parent.add(im);
      out.meshes.push(im);
      out.triangles += triCount(geo) * mats.length;
    };
    mk(B.win.frames, FRAME_MAT, `${b.id}_windowFrame`);
    mk(B.win.glass, GLASS_MAT, `${b.id}_windowGlass`);
    out.windows += n;
  };

  return B;
}

/* ── 体量策略（form）：决定基座体量组合 ───────────────────────────────── */

/**
 * 体量策略输出约定：
 *   · 通过 B.addBlock 登记体量块（窗格按块逐面生成）
 *   · 通过 B.front 指定承载入口的块
 *   · 通过 B.trait 标记体量特征，供功能层避免重复表达
 */

/** 盒式：简洁长方体 + 强竖向分格 */
function formBox(B) {
  const { w, d, H, floors } = B;
  const blk = B.addBlock('body', B.facade, { w, d, y0: 0, y1: H, floors });
  B.front = blk;
  B.deck('roof', 'concrete', blk, H, { overhang: 0.4, parapet: 0.9 });
  B.roofAreas = [{ y: H + 0.26, cx: 0, cz: 0, w, d }];
  // 强竖向分格：沿四个立面布置深色竖挺
  const step = 6.0;
  for (const side of SIDES) {
    const len = (side === 'south' || side === 'north') ? w : d;
    const n = Math.max(3, Math.round(len / step));
    B.finsOn(B.frameOfBlock(blk, side), n + 1, H / 2, H, 0.5, 0.42, 'metalDark');
  }
  B.trait('verticalGrid');
}

/** 板式：长矩形单一板体 + 连续横向窗带 */
function formSlab(B) {
  const { w, d, H, floors, fh } = B;
  const blk = B.addBlock('body', B.facade, { w, d, y0: 0, y1: H, floors });
  B.front = blk;
  B.deck('roof', 'concrete', blk, H, { overhang: 0.5, parapet: 0.95 });
  B.roofAreas = [{ y: H + 0.26, cx: 0, cz: 0, w, d }];
  // 逐层水平楼板线（宿舍由阳台带表达，避免重复）
  if (B.b.type !== 'dorm') {
    for (let f = 1; f < floors; f += 1) B.bandBlock(blk, f * fh, 0.3, 0.65, B.facade);
  }
  B.style = 'band';
  B.trait('horizontalBand');
}

/** 庭院式：双翼 + 后侧连廊 + 前侧门厅块，围合出内庭院 */
function formCourtyard(B) {
  const { w, d, H, floors, fh } = B;
  const dir = B.frontDir;                       // +1 入口朝北 / -1 入口朝南
  const wingW = Math.min(14, Math.max(10, d * 0.26));
  const linkD = Math.min(12, Math.max(8, d * 0.24));
  const podD = Math.min(12, Math.max(8, d * 0.26));
  const podFloors = floors > 4 ? 2 : 1;

  const left = B.addBlock('body', B.facade, { cx: -w / 2 + wingW / 2, cz: 0, w: wingW, d, y0: 0, y1: H, floors });
  const right = B.addBlock('body', B.facade, { cx: w / 2 - wingW / 2, cz: 0, w: wingW, d, y0: 0, y1: H, floors });
  const back = B.addBlock('body', B.facade, {
    cx: 0, cz: -dir * (d / 2 - linkD / 2), w: w - wingW * 2, d: linkD, y0: 0, y1: H, floors,
    noWin: { east: true, west: true },
  });
  const pod = B.addBlock('body', B.facade, {
    cx: 0, cz: dir * (d / 2 - podD / 2), w: w - wingW * 2, d: podD, y0: 0, y1: podFloors * fh,
    floors: podFloors, noWin: { east: true, west: true },
  });
  B.front = pod;
  B.deck('roof', 'concrete', left, H, { overhang: 0.35, parapet: 0.85 });
  B.deck('roof', 'concrete', right, H, { overhang: 0.35, parapet: 0.85 });
  B.deck('roof', 'concrete', back, H, { overhang: 0.35, parapet: 0.85 });
  B.deck('roof', 'concrete', pod, podFloors * fh, { overhang: 0.9, parapet: 0.6, pmat: 'metalDark' });
  // 楼顶铭牌可用屋面：后侧连廊（最宽）优先，其次两翼
  B.roofAreas = [
    { y: H + 0.26, cx: 0, cz: -dir * (d / 2 - linkD / 2), w: w - wingW * 2, d: linkD },
    { y: H + 0.26, cx: -w / 2 + wingW / 2, cz: 0, w: wingW, d },
    { y: H + 0.26, cx: w / 2 - wingW / 2, cz: 0, w: wingW, d },
  ];
  // 庭院内院铺装（浅色地面板）
  B.box('trim', 'paving', w - wingW * 2, 0.12, d - linkD - podD, 0, 0.06, dir * (podD - linkD) / 2);
  B.trait('courtyard');
}

/** 退台式：逐层退台，形成屋顶露台 */
function formTerrace(B) {
  const { w, d, H, floors, fh } = B;
  const steps = floors <= 4 ? 2 : 3;
  const perStep = Math.ceil(floors / steps);
  let y = 0;
  let inset = 0;
  let first = null;
  const roofCands = [];
  for (let s = 0; s < steps; s += 1) {
    const nf = Math.min(perStep, floors - s * perStep);
    if (nf <= 0) break;
    const y1 = y + nf * fh;
    const blk = B.addBlock('body', B.facade, {
      cx: 0, cz: 0, w: w - inset * 2, d: d - inset * 2, y0: y, y1, floors: nf,
    });
    if (!first) { first = blk; B.front = blk; }
    // 退台露台：每级顶部铺屋面板 + 女儿墙
    B.deck('roof', 'concrete', blk, y1, { overhang: 0.3, parapet: 0.8 });
    roofCands.push({ y: y1 + 0.26, cx: 0, cz: 0, w: w - inset * 2, d: d - inset * 2 });
    y = y1;
    inset += 5;
  }
  // 楼顶铭牌可用屋面：最高一级退台优先
  B.roofAreas = roofCands.reverse();
  B.trait('terraceRoof');
}

/** 塔式：裙房 + 标准层塔身 + 顶部机房层 */
function formTower(B) {
  const { w, d, H, floors, fh } = B;
  const podFloors = 2;
  const shaftFloors = Math.max(1, floors - podFloors - 1);
  const podH = podFloors * fh;
  const shaftTop = podH + shaftFloors * fh;
  const inset = 3;

  // 裙房：与外轮廓齐平，塔身内收 3 m，形成明确的「塔身 + 裙房」关系
  const pod = B.addBlock('body', B.facade, {
    cx: 0, cz: 0, w, d, y0: 0, y1: podH, floors: podFloors,
  });
  const shaft = B.addBlock('body', B.facade, {
    cx: 0, cz: 0, w: w - inset * 2, d: d - inset * 2, y0: podH, y1: shaftTop, floors: shaftFloors,
  });
  // 机房层
  B.addBlock('roof', 'metalDark', {
    cx: 0, cz: 0, w: (w - inset * 2) * 0.6, d: (d - inset * 2) * 0.6,
    y0: shaftTop, y1: H, floors: 0, win: false,
  });
  B.front = pod;
  B.deck('roof', 'roofMetal', shaft, shaftTop, { overhang: 0.5, parapet: 1.0, pmat: 'metalDark' });
  // 楼顶铭牌可用屋面：机房层顶面优先，其次塔身屋面（机房四周露台）
  B.roofAreas = [
    { y: H, cx: 0, cz: 0, w: (w - inset * 2) * 0.6, d: (d - inset * 2) * 0.6 },
    { y: shaftTop + 0.26, cx: 0, cz: 0, w: w - inset * 2, d: d - inset * 2 },
  ];
  // 裙房腰线（强调基座）
  B.bandBlock(pod, podH - 0.35, 0.5, 0.28, 'metalDark');
  // 塔身竖挺（强调竖向感）
  const step = 4.6;
  for (const side of SIDES) {
    const len = (side === 'south' || side === 'north') ? shaft.w : shaft.d;
    const n = Math.max(3, Math.round(len / step));
    B.finsOn(B.frameOfBlock(shaft, side), n + 1, (podH + shaftTop) / 2, shaftTop - podH, 0.3, 0.26, 'metalDark');
  }
  B.trait('mechanical');
}

/** 行列式：6 层板式 + 坡屋顶 + 单元分隔墙 */
function formWalkup(B) {
  const { w, d, H, floors } = B;
  const blk = B.addBlock('body', B.facade, { w, d, y0: 0, y1: H, floors });
  B.front = blk;
  B.gableRoof('roof', 'roofMetal', H, d * 0.34, 0.8);
  // 单元分隔墙（行列式特征）
  const units = Math.max(4, Math.round(w / 9));
  for (let i = 1; i < units; i += 1) {
    const x = -w / 2 + (w / units) * i;
    B.box('trim', 'concrete', 0.34, H, d + 0.2, x, H / 2, 0);
  }
  B.trait('pitched');
}

/** 雨篷式：玻璃底层 + 退台上体量 + 薄挑檐屋面 + 檐下细柱 */
function formPavilion(B) {
  const { w, d, H, floors, fh } = B;
  const ins = Math.min(4.0, Math.max(2.4, w * 0.055));
  const ov = 2.0;
  const groundFloors = floors > 1 ? 1 : floors;
  const gh = groundFloors * fh;

  const glass = B.addBlock('body', 'glass', {
    w, d, y0: 0, y1: gh, floors: groundFloors,
    win: { bay: 2.9, ratio: 0.92, hFrac: 0.8, margin: 0.5 },
  });
  B.glassFloor(glass);
  B.front = glass;
  let top = glass;
  if (floors > groundFloors) {
    top = B.addBlock('body', B.facade, {
      w: w - ins * 2, d: d - ins * 2, y0: gh, y1: gh + (floors - groundFloors) * fh,
      floors: floors - groundFloors,
    });
  }
  // 薄挑檐屋面（双层叠板形成阴影缝）
  const ry = top.y1;
  B.box('roof', 'concrete', w + ov * 2, 0.3, d + ov * 2, 0, ry + 0.15, 0);
  B.box('roof', 'metalDark', w + ov * 2 - 1.4, 0.22, d + ov * 2 - 1.4, 0, ry + 0.41, 0);
  // 楼顶铭牌可用屋面：内层金属屋面板顶面
  B.roofAreas = [{ y: ry + 0.52, cx: 0, cz: 0, w: w + ov * 2 - 1.4, d: d + ov * 2 - 1.4 }];
  // 底层玻璃与上体量之间的深色横带
  B.bandBlock(glass, gh - 0.1, 0.42, 0.12, 'metalDark');
  // 檐下细柱
  B.perimeterColumns(glass, 0, gh, 0.24, 13, 'metalDark', true);
  B.trait('cantilever');
}

/** 门厅式：大空间体量 + 通透底层 + 采光天窗带 + 大挑檐屋面 */
function formHall(B) {
  const { w, d, H, floors, fh } = B;
  const groundFloors = floors > 1 ? 1 : floors;
  const gh = groundFloors * fh;
  const glass = B.addBlock('body', 'glass', {
    w, d, y0: 0, y1: gh, floors: groundFloors,
    win: { bay: 3.4, ratio: 0.9, hFrac: 0.8, margin: 0.7 },
  });
  B.glassFloor(glass);
  B.front = glass;
  let top = glass;
  if (floors > groundFloors) {
    top = B.addBlock('body', B.facade, {
      w, d, y0: gh, y1: H, floors: floors - groundFloors,
    });
  }
  // 屋面：薄板 + 大挑檐
  const ry = top.y1;
  B.box('roof', 'roofMetal', w + 6, 0.3, d + 6, 0, ry + 0.15, 0);
  // 采光天窗带（高侧采光）
  B.box('roof', 'glassRoof', w * 0.42, 1.9, d * 0.34, 0, ry + 1.25, 0);
  B.box('roof', 'metalDark', w * 0.42 + 0.8, 0.24, d * 0.34 + 0.8, 0, ry + 2.32, 0);
  // 楼顶铭牌可用屋面：天窗带两侧的南北向屋面（避开天窗）
  const skyD = d * 0.34;
  const stripD = (d + 6) / 2 - skyD / 2 - 0.4;
  B.roofAreas = [
    { y: ry + 0.30, cx: 0, cz: -(skyD / 2 + 0.4 + stripD / 2), w: w + 6, d: stripD },
    { y: ry + 0.30, cx: 0, cz: (skyD / 2 + 0.4 + stripD / 2), w: w + 6, d: stripD },
  ];
  B.trait('hall');
}

/** 筒壳：体育馆大跨筒拱屋盖 */
function formBarrel(B) {
  const { w, d, H } = B;
  const wallH = H * 0.43;
  const rise = H - wallH;
  const blk = B.addBlock('body', B.facade || 'metal', { w, d, y0: 0, y1: wallH, floors: 1, fh: wallH });
  B.front = blk;
  B.barrelRoof('roof', 'roofMetal', wallH, rise, w, d / 2, 26);
  B.archRibs('trim', 'metalDark', wallH, rise, w, d / 2, 5, 18);
  B.trait('vault');
}

/** 马鞍：双曲抛物面屋盖（两对角高、两对角低） */
function formSaddle(B) {
  const { w, d, H } = B;
  const base = H * 0.9;
  const amp = H * 0.5;
  const thick = 0.4;
  const wallTop = base - amp - thick;
  const blk = B.addBlock('body', B.facade || 'metal', { w, d, y0: 0, y1: wallTop, floors: 1, fh: wallTop });
  B.front = blk;
  B.gridSolid('roof', 'roofMetal', {
    w, d, nx: 14, nz: 10, thick, wallTop,
    fn: (x, z) => base + amp * (x / (w / 2)) * (z / (d / 2)),
  });
  B.trait('vault');
}

/** 折板：折板屋盖（风雨操场） */
function formFold(B) {
  const { w, d, H } = B;
  const folds = 4;
  const wallH = H * 0.55;
  const rise = H - wallH;
  const thick = 0.3;
  const wallTop = wallH - thick;
  const hw = w / (folds * 2);
  const blk = B.addBlock('body', B.facade || 'concrete', { w, d, y0: 0, y1: wallTop, floors: 1, fh: wallTop });
  B.front = blk;
  const wave = (x) => {
    let t = ((x + w / 2) / hw) % 2;
    if (t < 0) t += 2;
    return 1 - Math.abs(t - 1);
  };
  B.gridSolid('roof', 'roofMetal', {
    w, d, nx: folds * 4, nz: 4, thick, wallTop,
    fn: (x) => wallH + rise * wave(x),
  });
  B.trait('vault');
}

/** 拱壳：车间 / 温室的拱形屋盖 */
function formArch(B) {
  const { w, d, H } = B;
  if (B.b.type === 'greenhouse') {
    const knee = 4.0;
    const rise = Math.max(4, H - knee);
    const radius = d / 2;
    B.box('trim', 'concrete', w + 0.6, 0.45, d + 0.6, 0, 0.225, 0);
    const blk = B.addBlock('body', 'glass', {
      w, d, y0: 0.45, y1: 0.45 + knee, floors: 1, fh: knee, solid: false,
      win: { bay: 5, ratio: 0.96, hFrac: 0.96, margin: 0.5 },
    });
    B.glassFloor(blk, 'concrete');
    B.front = blk;
    B.barrelRoof('roof', 'glassRoof', knee, rise, w, radius, 22);
    B.archRibs('trim', 'metalDark', knee, rise, w, radius, 5, 18);
    B.trait('vault');
    return;
  }
  const knee = Math.min(4.2, H * 0.32);
  const rise = Math.max(4, H - knee);
  const radius = d / 2;
  const blk = B.addBlock('body', B.facade, { w, d, y0: 0, y1: knee, floors: 1, fh: knee });
  B.front = blk;
  B.barrelRoof('roof', 'roofMetal', knee, rise, w, radius, 24);
  B.archRibs('trim', 'metalDark', knee, rise, w, radius, 7, 18);
  B.trait('vault');
}

/** 扇形：前部门厅块 + 扇形主体（弧形外墙 + 放射分格） */
function formFan(B) {
  const { w, d, H, floors, fh } = B;
  const dir = B.frontDir;
  const foyerD = Math.min(14, Math.max(9, d * 0.28));
  const foyer = B.addBlock('body', 'glass', {
    w, d: foyerD, cz: dir * (d / 2 - foyerD / 2), y0: 0, y1: H, floors,
    win: { bay: 4.2, ratio: 0.9, hFrac: 0.72, margin: 0.8 },
  });
  B.glassFloor(foyer);
  B.front = foyer;
  // 扇形主体：圆心在门厅后侧，扇面朝后张开
  const pivotZ = dir * (d / 2 - foyerD);
  const radius = d - foyerD - 0.5;
  const half = Math.min(Math.PI / 2 - 0.08, Math.asin(Math.min(0.99, (w / 2) / radius)));
  const axis = dir > 0 ? Math.PI : 0;
  const seg = 26;
  const geo = new B.THREE.CylinderGeometry(radius, radius, H, seg, 1, false, axis - half, half * 2);
  geo.translate(0, H / 2, pivotZ);
  B.parts.add('body', B.facade, geo);
  // 弧形幕墙带
  const band = new B.THREE.CylinderGeometry(radius + 0.1, radius + 0.1, 2.6, seg, 1, true, axis - half, half * 2);
  band.translate(0, H * 0.62, pivotZ);
  B.parts.add('body', 'glass', band);
  // 放射状竖向肋（扇形分格）
  const ribs = 7;
  for (let i = 0; i < ribs; i += 1) {
    const a = axis - half + (half * 2) * (i / (ribs - 1));
    const x = Math.sin(a) * (radius - 0.35);
    const z = pivotZ + Math.cos(a) * (radius - 0.35);
    const geo2 = new B.THREE.BoxGeometry(0.5, H, 0.9);
    geo2.rotateY(a);
    geo2.translate(x, H / 2, z);
    B.parts.add('trim', 'metalDark', geo2);
  }
  B.trait('fan');
}

/* ── form 分派表 ─────────────────────────────────────────────────────── */

const FORM_BUILDERS = {
  box: formBox,
  slab: formSlab,
  courtyard: formCourtyard,
  terrace: formTerrace,
  tower: formTower,
  walkup: formWalkup,
  pavilion: formPavilion,
  hall: formHall,
  barrel: formBarrel,
  saddle: formSaddle,
  fold: formFold,
  arch: formArch,
  fan: formFan,
};

/* ── 功能层（type）：在体量之上补充功能构件 ───────────────────────────── */

/** 取当前立面样式的窗格参数（bay 随画质缩放） */
function styleCfg(B, overrides) {
  const base = STYLE_CFG[B.style] || STYLE_CFG.grid;
  const cfg = Object.assign({}, base, overrides || {});
  cfg.bay = cfg.bay * B.q;
  return cfg;
}

/** 教学楼：规整窗格 + 入口雨棚 + 屋顶设备房 */
function buildTeaching(B) {
  B.gridBlocks(styleCfg(B, { ratio: clamp(B.ratio * 1.15, 0.15, 0.8) }));
  const fb = B.frontBlock();
  const fr = B.frameOfBlock(fb, B.frontSide);
  B.entrance(B.frontSide, {
    width: Math.min(16, fb.w * 0.3), depth: 4.0, y: 3.8, postMat: 'concrete', frame: fr,
  });
  if (B.has('rooftop')) {
    const tb = B.topBlock();
    B.roofPlant(tb.y1, { bw: tb.w * 0.16, bd: tb.d * 0.5, x: tb.cx - tb.w * 0.26, z: tb.cz });
  }
}

/** 学院楼：规整窗格 + 二层深色横带 + 宽入口雨棚 */
function buildCollege(B) {
  B.gridBlocks(styleCfg(B, { ratio: clamp(B.ratio * 1.1, 0.15, 0.75) }));
  const fb = B.frontBlock();
  const fr = B.frameOfBlock(fb, B.frontSide);
  // 二层横向深色带（学院楼特征）
  const by = fb.y0 + fb.fh * 1.5;
  if (by < fb.y1) B.bandBlock(fb, by, 0.5, 0.3, 'metalDark');
  B.entrance(B.frontSide, {
    width: Math.min(18, fb.w * 0.34), depth: 4.0, y: 4.0, postMat: 'concrete', frame: fr,
  });
  if (B.has('rooftop')) {
    const tb = B.topBlock();
    B.roofPlant(tb.y1, { bw: tb.w * 0.14, bd: tb.d * 0.4, x: tb.cx - tb.w * 0.24, z: tb.cz });
  }
}

/** 实验楼 / 实训中心：大跨度 + 通高幕墙 + 屋顶通风设备 */
function buildLab(B) {
  B.gridBlocks(styleCfg(B, {
    bay: 6.4, ratio: clamp(B.ratio * 1.7, 0.3, 0.92), hFrac: 0.72, margin: 1.4,
  }));
  const fb = B.frontBlock();
  const fr = B.frameOfBlock(fb, B.frontSide);
  B.entrance(B.frontSide, {
    width: 12, depth: 4.6, y: 4.6, doorW: 5, doorH: 3.7, postMat: 'concrete', frame: fr,
  });
  if (B.has('rooftop')) B.roofVent(B.topBlock().y1, 4);
}

/** 报告厅：入口雨棚 + 可选巨柱柱廊 */
function buildAuditorium(B) {
  const { H } = B;
  B.gridBlocks(styleCfg(B, {
    bay: 6.0, ratio: clamp(B.ratio, 0.18, 0.6), hFrac: 0.42, margin: 2.6,
  }));
  const fb = B.frontBlock();
  const fr = B.frameOfBlock(fb, B.frontSide);
  B.entrance(B.frontSide, {
    width: 14, depth: 4.2, y: 4.4, canopyMat: 'stone', postMat: 'stone', frame: fr,
  });
  if (B.has('columns')) {
    B.colonnade(B.frontSide, {
      count: 7, radius: 0.78, height: H * 0.86, slabW: fb.w * 0.72, slabD: 4.4, frame: fr,
    });
  }
}

/** 图书馆：通高玻璃幕墙 + 竖挺 + 横向分层线脚 + 屋顶平台 + 巨柱柱廊 */
function buildLibrary(B) {
  const ratio = clamp(B.ratio * 1.3, 0.3, 0.92);
  const bay = 6.2 * B.q;
  B.eachBlock((blk) => {
    if (blk.win === false) return;
    const c = Object.assign({}, blk.win || {});
    for (const side of SIDES) {
      if (blk.noWin && blk.noWin[side]) continue;
      const fr = B.frameOfBlock(blk, side);
      const usable = fr.len - 2.0;
      const n = Math.max(1, Math.round(usable / bay));
      B.gridOn(fr, Object.assign({}, c, {
        length: fr.len, floors: blk.floors, fh: blk.fh, y0: blk.y0,
        bay, ratio, hFrac: 0.8, margin: 1.0,
      }));
      const bh = blk.fh * blk.floors;
      if (bh > 0) B.finsOn(fr, n + 1, blk.y0 + bh / 2, bh, 0.34, 0.3, 'metalDark');
      // 横向分层线脚
      for (let f = 1; f < blk.floors; f += 1) {
        B.boxOnFrame('trim', 'metalDark', fr, fr.len, 0.42, 0.55, 0, 0, blk.y0 + f * blk.fh);
      }
    }
  });
  const fb = B.frontBlock();
  const fr = B.frameOfBlock(fb, B.frontSide);
  // 屋顶平台
  const tb = B.topBlock();
  B.deck('roof', 'stone', tb, tb.y1, { overhang: 1.3, parapet: 1.1, pmat: 'stone' });
  B.box('roof', 'stone', tb.w * 0.34, 0.45, tb.d * 0.4, tb.cx, tb.y1 + 0.48, tb.cz);
  B.box('roof', 'metalDark', tb.w * 0.14, 4.2, tb.d * 0.18, tb.cx, tb.y1 + 2.7, tb.cz);
  if (B.has('rooftop')) {
    B.roofPlant(tb.y1, { bw: tb.w * 0.12, bd: tb.d * 0.3, x: tb.cx + tb.w * 0.3, z: tb.cz, panels: 2, houseMat: 'stone' });
  }
  B.entrance(B.frontSide, {
    width: 18, depth: 5.5, y: 5, doorW: 6, doorH: 4.3, posts: false, canopyMat: 'stone', frame: fr,
  });
  if (B.has('columns')) {
    B.colonnade(B.frontSide, {
      count: 8, radius: 0.88, height: 9.2, slabW: fb.w * 0.62, slabD: 4.6, frame: fr,
    });
  }
}

/** 办公楼：规整方体 + 入口台阶 + 竖向装饰线 */
function buildOffice(B) {
  B.gridBlocks(styleCfg(B, { bay: 4.0, ratio: clamp(B.ratio * 1.25, 0.18, 0.75) }));
  const fb = B.frontBlock();
  const fr = B.frameOfBlock(fb, B.frontSide);
  if (!B.isTrait('verticalGrid')) {
    const nLong = Math.max(4, Math.round(fb.w / 6));
    const bh = fb.fh * fb.floors;
    for (const side of ['south', 'north']) {
      B.finsOn(B.frameOfBlock(fb, side), nLong, fb.y0 + bh / 2, bh, 0.28, 0.34, 'stone');
    }
  }
  B.steps(B.frontSide, { width: Math.min(10, fb.w * 0.28), frame: fr });
  B.entrance(B.frontSide, {
    width: Math.min(12, fb.w * 0.3), depth: 3.8, y: 4, canopyMat: 'stone', postMat: 'stone', frame: fr,
  });
  if (B.has('columns')) {
    B.colonnade(B.frontSide, {
      count: 4, radius: 0.7, height: 5.4, slabW: fb.w * 0.4, slabD: 3.2, frame: fr,
    });
  }
}

/** 宿舍楼：连续阳台带 + 入口门厅体量 + 基座 + 庭院侧矮墙 */
function buildDorm(B) {
  B.gridBlocks(styleCfg(B, { bay: 3.1, ratio: clamp(B.ratio * 1.2, 0.2, 0.78) }));
  // 连续阳台带
  B.eachBlock((blk) => {
    if (!blk.floors) return;
    for (let f = 1; f <= blk.floors; f += 1) {
      const y = blk.y0 + f * blk.fh;
      for (const side of ['south', 'north']) {
        if (blk.noWin && blk.noWin[side]) continue;
        const fr = B.frameOfBlock(blk, side);
        B.boxOnFrame('trim', 'concrete', fr, fr.len - 1.0, 0.22, 1.7, 0.02, 0, y);
        B.boxOnFrame('trim', 'metalDark', fr, fr.len - 1.0, 1.05, 0.09, 1.72, 0, y + 0.62);
      }
    }
  });
  const fb = B.frontBlock();
  const fr = B.frameOfBlock(fb, B.frontSide);
  // 入口门厅（体量外凸 + 玻璃门厅）
  B.boxOnFrame('body', B.facade, fr, 11, fb.fh - 0.2, 3.2, 0, 0, (fb.fh - 0.2) / 2);
  B.windowOn(fr, 0, fb.fh * 0.55, 7.5, fb.fh * 0.6);
  B.entrance(B.frontSide, {
    width: 11, depth: 3.6, y: fb.fh - 0.1, doorW: 3.6, doorH: 2.8, posts: false, frame: fr,
  });
  // 基座 + 庭院侧矮墙
  B.box('trim', 'concrete', fb.w + 1.2, 0.45, fb.d + 1.2, fb.cx, 0.225, fb.cz);
  const courtSide = B.b.position[2] < -130 ? 'north' : 'south';
  // 矮墙贴在最靠近外轮廓的那一块上（塔式取塔身，避免裙房把矮墙顶出路网）
  let wallBlk = fb;
  let bestFace = Infinity;
  for (const blk of B.blocks) {
    if (!blk.floors) continue;
    const face = Math.abs(B.frameOfBlock(blk, courtSide).base[2]);
    if (face < bestFace) { bestFace = face; wallBlk = blk; }
  }
  B.boxOnFrame('trim', 'stone', B.frameOfBlock(wallBlk, courtSide), wallBlk.w + 3, 0.85, 0.45, 3.2, 0, 0.425);
}

/** 食堂：底层通透 + 出挑雨棚 + 屋顶通风设备 */
function buildCanteen(B) {
  const { fh } = B;
  B.gridBlocks(styleCfg(B, { bay: 5.6, ratio: 0.5, hFrac: 0.42, margin: 1.8 }));
  const fb = B.frontBlock();
  const fr = B.frameOfBlock(fb, B.frontSide);
  // 出挑雨棚
  B.boxOnFrame('trim', 'metal', fr, fb.w * 0.62, 0.28, 4.4, 0.2, 0, fh * 0.6);
  B.boxOnFrame('trim', 'metalDark', fr, 0.24, fh * 0.6, 0.24, 4.3, fb.w * 0.24, fh * 0.3);
  B.boxOnFrame('trim', 'metalDark', fr, 0.24, fh * 0.6, 0.24, 4.3, -fb.w * 0.24, fh * 0.3);
  B.entrance(B.frontSide, {
    width: Math.min(12, fb.w * 0.3), depth: 3.2, y: 3.9, doorW: 4, doorH: 3.0, posts: false, frame: fr,
  });
  B.roofVent(B.topBlock().y1, 3);
}

/** 超市：小体量 + 顶部招牌 */
function buildStore(B) {
  B.gridBlocks(styleCfg(B, { bay: 5.0, ratio: 0.9, hFrac: 0.82, margin: 0.9 }));
  const fb = B.frontBlock();
  const fr = B.frameOfBlock(fb, B.frontSide);
  B.entrance(B.frontSide, {
    width: 7, depth: 2.8, y: 3.4, doorW: 3.6, doorH: 2.7, postMat: 'concrete', frame: fr,
  });
  if (B.has('sign')) {
    B.sign(B.frontSide, {
      width: fb.w * 0.66, height: 1.7, y: fb.y1 + 0.95, barW: fb.w * 0.5, frame: fr,
    });
  }
}

/** 校医院：规整小体量 + 十字标识 */
function buildClinic(B) {
  B.gridBlocks(styleCfg(B, { bay: 3.8, ratio: clamp(B.ratio * 1.1, 0.18, 0.7) }));
  const fb = B.frontBlock();
  const fr = B.frameOfBlock(fb, B.frontSide);
  // 十字标识
  const sy = fb.y1 - 2.6;
  B.boxOnFrame('trim', 'signBlue', fr, 0.85, 3.0, 0.22, 0.1, 0, sy);
  B.boxOnFrame('trim', 'signBlue', fr, 3.0, 0.85, 0.22, 0.1, 0, sy);
  B.entrance(B.frontSide, {
    width: 8, depth: 3.0, y: 3.5, doorW: 3.4, doorH: 2.8, postMat: 'concrete', frame: fr,
  });
}

/** 体育馆：高侧窗 + 入口雨棚 + 可选巨柱柱廊 */
function buildGym(B) {
  B.gridBlocks(styleCfg(B, { bay: 7, ratio: 0.86, hFrac: 0.6, margin: 2.4 }));
  const fb = B.frontBlock();
  const fr = B.frameOfBlock(fb, B.frontSide);
  B.entrance(B.frontSide, {
    width: 14, depth: 4.6, y: 5.2, doorW: 5.5, doorH: 4.2,
    canopyMat: 'metalDark', postMat: 'metalDark', frame: fr,
  });
  if (B.has('columns')) {
    B.colonnade(B.frontSide, {
      count: 6, radius: 0.8, height: 6.4, slabW: fb.w * 0.44, slabD: 4.0, matName: 'metalDark', frame: fr,
    });
  }
}

/** 温室大棚：拱形玻璃棚顶 + 内部种植槽 */
function buildGreenhouse(B) {
  const { w, d } = B;
  // 内部种植槽
  const rows = 4;
  for (let r = 0; r < rows; r += 1) {
    const z = -d / 2 + (d / (rows + 1)) * (r + 1);
    B.box('trim', 'soil', w - 8, 0.7, 1.1, 0, 0.8, z);
    const count = Math.floor((w - 10) / 2.4);
    for (let i = 0; i < count; i += 1) {
      const x = -(count - 1) * 1.2 + i * 2.4 + (B.rng() - 0.5) * 0.5;
      const h = 0.9 + B.rng() * 0.9;
      B.box('trim', 'shrub', 1.9, h, 1.0, x, 1.15 + h / 2, z + (B.rng() - 0.5) * 0.3);
    }
  }
  const fb = B.frontBlock();
  const fr = B.frameOfBlock(fb, B.frontSide);
  B.entrance(B.frontSide, {
    width: 5, depth: 2.2, y: 3.0, doorW: 2.8, doorH: 2.6,
    canopyMat: 'metalDark', postMat: 'metalDark', frame: fr,
  });
}

/** 门卫室：小体量 + 雨棚 + 招牌 */
function buildGatehouse(B) {
  const { w, H } = B;
  B.gridBlocks(styleCfg(B, { bay: 3.2, ratio: 0.58, hFrac: 0.55, margin: 1.0 }));
  const fb = B.frontBlock();
  const fr = B.frameOfBlock(fb, B.frontSide);
  B.entrance(B.frontSide, {
    width: 5.4, depth: 2.2, y: 2.7, doorW: 1.6, doorH: 2.4, postMat: 'concrete', frame: fr,
  });
  B.sign(B.frontSide, { width: w * 0.7, height: 0.8, y: H + 0.4, bar: false, frame: fr });
}

/* ── type 分派表 ─────────────────────────────────────────────────────── */

const TYPE_BUILDERS = {
  teaching: buildTeaching,
  college: buildCollege,
  lab: buildLab,
  auditorium: buildAuditorium,
  library: buildLibrary,
  office: buildOffice,
  dorm: buildDorm,
  canteen: buildCanteen,
  store: buildStore,
  clinic: buildClinic,
  gym: buildGym,
  greenhouse: buildGreenhouse,
  gatehouse: buildGatehouse,
};

/* ── 主入口 ───────────────────────────────────────────────────────────── */

/**
 * 生成全部建筑。
 * @param {object} ctx { THREE, mat, rng, pois, layout, options }
 * @returns {{group: THREE.Group, stats: object}}
 */
export function buildBuildings(ctx) {
  if (!ctx || !ctx.THREE) throw new Error('[buildings] ctx.THREE 缺失，无法生成建筑');
  const { THREE, mat, rng, pois, layout, options } = ctx;
  const layoutBuildings = (layout && layout.buildings) || [];
  const quality = (options && options.quality) || 'high';
  const qScale = QUALITY_BAY_SCALE[quality] || 1;

  const group = new THREE.Group();
  group.name = 'CAMPUS_BUILDINGS';

  const stats = {
    buildingCount: 0,
    triangles: 0,
    byType: {},
    trianglesByType: {},
    byForm: {},
    trianglesByForm: {},
    windows: 0,
    meshes: 0,
    buildings: [],
  };

  /* ── 楼顶铭牌 ─────────────────────────────────────────────────────── */
  const atlas = typeof ctx.signageAtlas === 'function'
    ? ctx.signageAtlas((layoutBuildings || []).map((b) => b.name))
    : (ctx.signage || null);
  const signBufs = new Map();
  const signMiss = [];
  let signCount = 0;
  let signTriangles = 0;

  for (const b of layoutBuildings) {
    const localRng = subRng(rng, b.id);
    const B = makeBuilder(THREE, mat, localRng, b, qScale);

    const bGroup = new THREE.Group();
    bGroup.name = b.id;
    bGroup.position.set(b.position[0], 0, b.position[2]);
    bGroup.rotation.y = b.rotation || 0;
    bGroup.userData.poiId = b.id;
    bGroup.userData.buildingType = b.type;
    bGroup.userData.buildingForm = B.form;

    // ① 体量层：按 form 决定基座体量组合
    const formBuilder = FORM_BUILDERS[B.form] || FORM_BUILDERS.box;
    formBuilder(B);
    // 形态层面的屋面最高点与中心（功能层会在其上加设备房，不能混入）
    const roofInfo = {
      apexY: B.parts.bmax.y,
      cx: (B.parts.bmin.x + B.parts.bmax.x) / 2,
      cz: (B.parts.bmin.z + B.parts.bmax.z) / 2,
    };
    // ② 功能层：按 type 补充功能构件
    const builder = TYPE_BUILDERS[b.type] || buildTeaching;
    builder(B);

    const out = { meshes: [], triangles: 0, windows: 0 };
    B.parts.flush(THREE, mat, bGroup, b.id, out);
    B.flushWindows(bGroup, out);

    group.add(bGroup);

    /* ── 楼顶铭牌（世界坐标，按 POI 分类合并） ── */
    if (atlas) {
      const cell = atlas.cells.get(b.name);
      const placed = placeSign(B, cell, roofInfo);
      if (placed) {
        const rc = Math.cos(b.rotation || 0);
        const rs = Math.sin(b.rotation || 0);
        const rot = (v) => [v[0] * rc + v[2] * rs, v[1], -v[0] * rs + v[2] * rc];
        const center = rot(placed.center);
        center[0] += b.position[0];
        center[2] += b.position[2];
        const axis = {
          R: rot(placed.axis.R),
          U: rot(placed.axis.U),
          N: rot(placed.axis.N),
        };
        const cat = b.category || '其他';
        let buf = signBufs.get(cat);
        if (!buf) {
          buf = { pos: [], nrm: [], uv: [], idx: [] };
          signBufs.set(cat, buf);
        }
        pushSignBox(buf, center, axis, placed.hw, placed.hh, placed.ht, cell, atlas.solid);
        signCount += 1;
        signTriangles += 12;
      } else {
        signMiss.push(b.id);
      }
    }

    /* ── 统计（真实计算） ── */
    stats.buildingCount += 1;
    stats.triangles += out.triangles;
    stats.windows += out.windows;
    stats.meshes += out.meshes.length;
    stats.byType[b.type] = (stats.byType[b.type] || 0) + 1;
    stats.trianglesByType[b.type] = (stats.trianglesByType[b.type] || 0) + out.triangles;
    stats.byForm[B.form] = (stats.byForm[B.form] || 0) + 1;
    stats.trianglesByForm[B.form] = (stats.trianglesByForm[B.form] || 0) + out.triangles;
    stats.buildings.push({
      id: b.id,
      type: b.type,
      form: B.form,
      floors: b.floors,
      height: round2(B.H),
      actualHeight: round2(B.parts.bmax.y),
      triangles: out.triangles,
      meshes: out.meshes.length,
      windows: out.windows,
    });

    /* ── POI 注册（id 与 layout 完全一致） ── */
    const c = Math.cos(b.rotation || 0);
    const s = Math.sin(b.rotation || 0);
    const toWorld = (x, y, z) => [b.position[0] + x * c + z * s, y, b.position[2] - x * s + z * c];
    const corners = [];
    for (const x of [B.parts.bmin.x, B.parts.bmax.x]) {
      for (const y of [B.parts.bmin.y, B.parts.bmax.y]) {
        for (const z of [B.parts.bmin.z, B.parts.bmax.z]) corners.push(toWorld(x, y, z));
      }
    }
    const wmin = corners.reduce((acc, p) => [Math.min(acc[0], p[0]), Math.min(acc[1], p[1]), Math.min(acc[2], p[2])], [Infinity, Infinity, Infinity]);
    const wmax = corners.reduce((acc, p) => [Math.max(acc[0], p[0]), Math.max(acc[1], p[1]), Math.max(acc[2], p[2])], [-Infinity, -Infinity, -Infinity]);

    const footprint = B.w * B.d;
    pois.add({
      id: b.id,
      name: b.name,
      category: b.category,
      zone: b.zone || null,
      type: 'building',
      position: [b.position[0], B.H / 2, b.position[2]],
      anchor: 'entrance',
      bbox: {
        min: [round2(wmin[0]), round2(wmin[1]), round2(wmin[2])],
        max: [round2(wmax[0]), round2(wmax[1]), round2(wmax[2])],
      },
      summary: b.summary || `${b.name}（${b.type}）`,
      tags: Array.isArray(b.tags) ? b.tags.slice() : [],
      meta: {
        buildingType: b.type,
        buildingForm: B.form,
        form: B.form,
        floors: b.floors,
        floorHeight: b.floorHeight,
        height: B.H,
        actualHeight: round2(B.parts.bmax.y),
        footprint: Math.round(footprint),
        plotArea: Math.round(footprint + 5 * (B.w + B.d)),
        grossFloorArea: Math.round(footprint * b.floors),
        windowCount: out.windows,
        triangles: out.triangles,
        meshCount: out.meshes.length,
      },
    });
  }

  console.info(
    `[buildings] 完成：${stats.buildingCount} 栋 / ${stats.triangles} tris / ${stats.windows} 扇窗 / ${stats.meshes} 个 Mesh`,
  );

  /* ── 楼顶铭牌：按 POI 分类合并（每类 1 个 Mesh，共用 1 张图集贴图） ── */
  const signGroup = new THREE.Group();
  signGroup.name = 'CAMPUS_SIGNAGE';
  const signMeshes = [];
  for (const [cat, buf] of signBufs) {
    if (!buf.idx.length) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(buf.pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(buf.nrm, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(buf.uv, 2));
    geo.setIndex(buf.idx);
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, mat('signage'));
    mesh.name = `CAMPUS_SIGN_${cat}`;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    // 铭牌不注册 POI：显式占位 id 使其跳过 POI 绑定与拾取（由 app.js 按分类控制可见性）
    mesh.userData.poiId = '__signage__';
    signGroup.add(mesh);
    signMeshes.push({ category: cat, mesh });
  }
  console.info(
    `[buildings] 楼顶铭牌：${signCount} 块 / ${signMeshes.length} 个合并 Mesh / ${signTriangles} tris${signMiss.length ? ` / 未放置 ${signMiss.length} 栋` : ''}`,
  );
  if (signMiss.length) console.warn('[buildings] 楼顶铭牌未放置（屋面放不下）：', signMiss);
  stats.signage = { count: signCount, meshes: signMeshes.length, triangles: signTriangles };

  return { group, stats, signage: { group: signGroup, meshes: signMeshes, count: signCount, missing: signMiss } };
}

export default buildBuildings;
