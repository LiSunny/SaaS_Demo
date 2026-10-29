/**
 * terrain.js — 地形场地模块
 *
 * 覆盖要素：地面 / 道路（带状路面 + 路缘 + 斑马线）/ 广场（含台阶边界）/
 *          运动场地（田径场环道 + 内场足球 / 篮球场 / 网球场）/
 *          水体（湖面 + 浅滩护岸 + 湖底 + 湖心拱桥）/ 绿地底板（含农学基地田垄）/
 *          停车场（铺装 + 车位线）
 *
 * 契约要点（见 CONTRACT.md）：
 *  - 只使用 ctx.mat(name)，不新建材质；随机一律走 ctx.rng，不使用 Math.random()。
 *  - 只读 ctx.layout，不修改 layout.js / core/*。
 *  - 三角形面数、里程、面积均为真实计算值。
 *  - POI id 必须与 layout 中的 id 完全一致。
 *
 * 绘制批次：同材质 + 同贴地层 + 同高度的几何合并为一个网格
 *（几何汇流器 sink），30,000 人规模场地下本模块共 60 个网格。
 * 需要被 app.js 按 POI 绑定（高亮 / 区域剖切）的要素保持独立网格。
 *
 * 坐标：+X 东 / +Z 北 / +Y 上，单位米，地平面 Y = 0。
 */

const TAU = Math.PI * 2;

/** 主轴大道：需要保留独立网格的道路（POI 高亮依赖单条道路的包围盒）。 */
const AXIS_ROAD_ID = 'RD_AXIS_MAIN';

/**
 * 贴地要素分层高度（米）。
 *
 * 地面为 0，其余要素自下而上依次抬高，层间高差 6~8mm。
 * 高差只用于避免几何互穿，不承担"谁盖住谁"的排序职责——排序由
 * LAYER 的 renderOrder 决定。
 */
const Y = {
  ground: 0.000,
  green: 0.016,
  agri: 0.022,
  agriRidge: 0.028,
  parking: 0.034,
  parkingLine: 0.040,
  path: 0.046,
  plaza: 0.058,
  plazaStep: 0.030,
  road: 0.064,
  court: 0.076,
  line: 0.082,
  curbH: 0.030,      // 路缘高出路面部分
  curbW: 0.35,       // 路缘宽度
  crosswalkGap: 0.006,
};

/**
 * 贴地装饰层（decal）的绘制顺序，数值大者后画、盖在上层。
 *
 * 所有贴地面片关闭 depthWrite，彼此之间不做深度竞争，任何视角与
 * 距离下都不会互相闪烁；层间先后完全由本表指定，与相机无关。
 *
 * 顺序：绿地 → 农田 → 停车场 → 车位线 → 步道 → 广场 → 车行道 →
 *       斑马线 → 运动场地 → 场地标线
 */
const LAYER = {
  green: 10,
  agri: 12,
  agriRidge: 13,
  parking: 20,
  parkingAisle: 21,
  parkingLine: 22,
  path: 30,
  plaza: 40,
  road: 50,
  crosswalk: 60,
  court: 70,
  courtLine: 71,
  lampPool: 80,
};

/* ══ 材质 ═══════════════════════════════════════════════════════════════ */

/**
 * 材质获取器。
 *
 * get(name)  —— 取统一材质库中的共享实例（参与深度写入的实体面）。
 * decal(name, layer) —— 贴地装饰层材质：depthWrite = false，
 *               由 renderOrder 决定层间先后，任意距离不闪烁。
 */
function createMatCache(THREE, mat, decal) {
  const cache = new Map();
  return {
    get(name) {
      return mat(name);
    },
    decal(name, layer) {
      if (typeof decal === 'function') return decal(name, layer);
      const key = `${name}#${layer}`;
      let m = cache.get(key);
      if (!m) {
        m = mat(name).clone();
        m.depthWrite = false;
        m.polygonOffset = true;
        m.polygonOffsetFactor = 0;
        m.polygonOffsetUnits = -1;
        cache.set(key, m);
      }
      return m;
    },
  };
}

/* ══ 几何工具 ═══════════════════════════════════════════════════════════ */

/** 把顶点数组打包成 BufferGeometry。 */
function buildGeometry(THREE, P, N, U, I) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(U), 2));
  g.setIndex(I);
  return g;
}

/**
 * 几何汇流器（sink）：把多段几何写进同一组缓冲区，最终合成一个 Mesh。
 *
 * 合并只发生在「同材质 + 同贴地层 + 同高度」的几何之间：
 *  - 贴地面片 depthWrite=false，重叠处不写深度 → 同材质互相覆盖不产生色差；
 *  - 同层几何共用同一 Y（Y.road / Y.path / ...），符合 CONTRACT 附录 B §12.3；
 *  - 实体面（路缘 / 台阶 / 桥面）depthWrite=true，但同材质共面重叠不改变像素。
 */
function createSink() {
  return { P: [], N: [], U: [], I: [] };
}

/** 把一个已建好的 BufferGeometry 并入汇流器（索引自动偏移）。 */
function sinkAdd(sink, geo) {
  const pos = geo.attributes.position.array;
  const nor = geo.attributes.normal.array;
  const uv = geo.attributes.uv.array;
  const base = sink.P.length / 3;
  for (let i = 0; i < pos.length; i++) sink.P.push(pos[i]);
  for (let i = 0; i < nor.length; i++) sink.N.push(nor[i]);
  for (let i = 0; i < uv.length; i++) sink.U.push(uv[i]);
  const idx = geo.index.array;
  for (let i = 0; i < idx.length; i++) sink.I.push(idx[i] + base);
}

/** 汇流器 → BufferGeometry；空汇流器返回 null。 */
function sinkGeometry(THREE, sink) {
  if (!sink.I.length) return null;
  return buildGeometry(THREE, sink.P, sink.N, sink.U, sink.I);
}

/**
 * 压入一个四边形。corners 顺序为环序；desired 为期望外法线，
 * 若计算出的几何法线与之相反则自动翻转绕序（并同步翻转法线）。
 */
function pushQuad(P, N, U, I, corners, uvs, desired) {
  const e1 = [corners[1][0] - corners[0][0], corners[1][1] - corners[0][1], corners[1][2] - corners[0][2]];
  const e2 = [corners[2][0] - corners[0][0], corners[2][1] - corners[0][1], corners[2][2] - corners[0][2]];
  let g = [
    e1[1] * e2[2] - e1[2] * e2[1],
    e1[2] * e2[0] - e1[0] * e2[2],
    e1[0] * e2[1] - e1[1] * e2[0],
  ];
  const gl = Math.hypot(g[0], g[1], g[2]) || 1;
  g = [g[0] / gl, g[1] / gl, g[2] / gl];
  let order = [0, 1, 2, 3];
  if (g[0] * desired[0] + g[1] * desired[1] + g[2] * desired[2] < 0) {
    order = [0, 3, 2, 1];
    g = [-g[0], -g[1], -g[2]];
  }
  const base = P.length / 3;
  for (let k = 0; k < 4; k++) {
    const vi = order[k];
    P.push(corners[vi][0], corners[vi][1], corners[vi][2]);
    N.push(g[0], g[1], g[2]);
    U.push(uvs[vi][0], uvs[vi][1]);
  }
  I.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

/** 世界 XZ 平面上的矩形（2 三角形），法线 +Y。 */
function quadXZ(sink, x0, z0, x1, z1, y, tile = 8) {
  const corners = [
    [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1],
  ];
  const uvs = [
    [x0 / tile, z0 / tile], [x1 / tile, z0 / tile], [x1 / tile, z1 / tile], [x0 / tile, z1 / tile],
  ];
  pushQuad(sink.P, sink.N, sink.U, sink.I, corners, uvs, [0, 1, 0]);
}

/** 沿一条直线段生成带宽度的条带（用于车位线、球场线、斑马线条）。 */
function stripXZ(sink, ax, az, bx, bz, width, y, tile = 8) {
  const dx = bx - ax, dz = bz - az;
  const len = Math.hypot(dx, dz) || 1;
  const px = (-dz / len) * (width / 2), pz = (dx / len) * (width / 2);
  const corners = [
    [ax + px, y, az + pz], [bx + px, y, bz + pz],
    [bx - px, y, bz - pz], [ax - px, y, az - pz],
  ];
  const uvs = [
    [0, 0], [len / tile, 0], [len / tile, width / tile], [0, width / tile],
  ];
  pushQuad(sink.P, sink.N, sink.U, sink.I, corners, uvs, [0, 1, 0]);
}

/** 轴对齐盒体（12 三角形）。 */
function boxGeometry(sink, cx, cy, cz, w, h, d) {
  const x0 = cx - w / 2, x1 = cx + w / 2;
  const y0 = cy - h / 2, y1 = cy + h / 2;
  const z0 = cz - d / 2, z1 = cz + d / 2;
  const quad = (a, b, c2, d2, n) => pushQuad(sink.P, sink.N, sink.U, sink.I, [a, b, c2, d2], [[0, 0], [1, 0], [1, 1], [0, 1]], n);
  quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
  quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
  quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);
  quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
  quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]);
  quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
}

/** 椭圆扇面（朝上），用于湖面 / 湖底。 */
function ellipseFan(sink, cx, cz, rx, rz, y, seg) {
  sink.P.push(cx, y, cz); sink.N.push(0, 1, 0); sink.U.push(cx / 8, cz / 8);
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * TAU;
    const x = cx + rx * Math.cos(a), z = cz + rz * Math.sin(a);
    sink.P.push(x, y, z); sink.N.push(0, 1, 0); sink.U.push(x / 8, z / 8);
  }
  const base = (sink.P.length / 3) - seg - 1;
  for (let i = 0; i < seg; i++) {
    // 环顶点索引为 1..seg（顶点 0 是圆心），故三角形应为 (0, 1+i, 1+((i+1)%seg))
    sink.I.push(base, base + 1 + i, base + 1 + ((i + 1) % seg));
  }
}

/** 圆环带（用于中圈、三分线等），朝上。 */
function circleBand(sink, cx, cz, r, width, y, seg) {
  const ro = r + width / 2, ri = r - width / 2;
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * TAU, a1 = ((i + 1) / seg) * TAU;
    const c = Math.cos(a0), s = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    const corners = [
      [cx + ro * c, y, cz + ro * s], [cx + ro * c1, y, cz + ro * s1],
      [cx + ri * c1, y, cz + ri * s1], [cx + ri * c, y, cz + ri * s],
    ];
    const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
    pushQuad(sink.P, sink.N, sink.U, sink.I, corners, uvs, [0, 1, 0]);
  }
}

/** 圆角矩形轮廓点（shape 空间，sy = -worldZ）。 */
function roundedRectPoints(THREE, cx, cz, w, d, r, seg) {
  const hw = w / 2, hd = d / 2;
  const rr = Math.max(0.01, Math.min(r, hw - 0.01, hd - 0.01));
  const pts = [];
  const corners = [
    [hw - rr, hd - rr, 0],
    [-(hw - rr), hd - rr, Math.PI / 2],
    [-(hw - rr), -(hd - rr), Math.PI],
    [hw - rr, -(hd - rr), Math.PI * 1.5],
  ];
  for (const [ox, oz, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = a0 + (i / seg) * (Math.PI / 2);
      const x = cx + ox + rr * Math.cos(a);
      const z = cz + oz + rr * Math.sin(a);
      pts.push(new THREE.Vector2(x, -z));
    }
  }
  return pts;
}

/** 椭圆轮廓点（shape 空间）。 */
function ellipsePoints(THREE, cx, cz, rx, rz, seg) {
  const pts = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * TAU;
    pts.push(new THREE.Vector2(cx + rx * Math.cos(a), -(cz + rz * Math.sin(a))));
  }
  return pts;
}

/**
 * 体育场形（stadium）轮廓点：两段直道 + 两段真半圆。
 *
 * 坐标约定：直道沿 X 轴（切点间距 = straight），弯道为半径 r 的半圆，
 * 圆心位于 (cx ± straight/2, cz)。因此：
 *   外廓 X = straight + 2r，Z = 2r；内沿同理（r 取内沿半径）。
 * shape 空间 sy = -worldZ（与既有轮廓点一致）。
 */
function stadiumPoints(THREE, cx, cz, straight, r, seg) {
  const hs = straight / 2;
  const pts = [];
  const push = (x, z) => pts.push(new THREE.Vector2(x, -z));
  push(cx - hs, cz - r);                                    // 南直段西端切点
  push(cx + hs, cz - r);                                    // 南直段东端切点
  for (let i = 1; i <= seg; i++) {                          // 东半圆 −90° → +90°
    const a = -Math.PI / 2 + (i / seg) * Math.PI;
    push(cx + hs + r * Math.cos(a), cz + r * Math.sin(a));
  }
  push(cx - hs, cz + r);                                    // 北直段西端切点
  for (let i = 1; i < seg; i++) {                           // 西半圆 +90° → +270°
    const a = Math.PI / 2 + (i / seg) * Math.PI;
    push(cx - hs + r * Math.cos(a), cz + r * Math.sin(a));
  }
  return pts;
}

/**
 * shape 平面几何 → 世界 XZ 平面几何，并按世界坐标重算 UV。
 * y 为该面片在世界中的高度（shape 平面本身是 y=0）。
 */
function shapeToWorld(C, shape, tile, y = 0) {
  const geo = new C.THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  if (y) geo.translate(0, y, 0);
  const pos = geo.attributes.position.array;
  const uv = new Float32Array((pos.length / 3) * 2);
  for (let i = 0, j = 0; i < pos.length; i += 3, j += 2) {
    uv[j] = pos[i] / tile;
    uv[j + 1] = pos[i + 2] / tile;
  }
  geo.setAttribute('uv', new C.THREE.BufferAttribute(uv, 2));
  return geo;
}

/** shape 平面几何 → 并入汇流器（合并用）。 */
function shapeInto(sink, C, shape, tile, y = 0) {
  const geo = shapeToWorld(C, shape, tile, y);
  sinkAdd(sink, geo);
  geo.dispose();
}

/** 统计对象树中的真实三角面数。 */
function countTriangles(object) {
  let tris = 0;
  object.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    if (g.index) tris += g.index.count / 3;
    else if (g.attributes && g.attributes.position) tris += g.attributes.position.count / 3;
  });
  return Math.round(tris);
}

/** 创建并挂载一个网格。order 为绘制顺序（renderOrder）。 */
function addMesh(C, geometry, material, name, { castShadow = false, receiveShadow = true, order = 0 } = {}) {
  const mesh = new C.THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  mesh.renderOrder = order;
  C.group.add(mesh);
  return mesh;
}

/* ══ 地面 ═══════════════════════════════════════════════════════════════ */

/**
 * 地面：整场一张平面（贴地要素之下的一层）。
 *
 * 尺寸 = max(场地包围盒, site.groundSize) + 2 × site.groundPadding：
 * 现场地 1240×1030 m、groundSize 1240、groundPadding 120 → 地面 1480×1480 m，
 * 完整覆盖用地并外扩一圈。UV 按世界坐标 1/14 m 一次平铺（贴图 RepeatWrapping），
 * 面积变大只增加平铺次数，不会产生拉伸或接缝。
 * 水体处开洞，水面（低于地平面）才不会被地面挡住。
 */
function buildGround(C) {
  const { THREE, layout, mats } = C;
  const site = layout.site || {};
  const b = site.bounds || { minX: -280, maxX: 280, minZ: -280, maxZ: 280 };
  const pad = site.groundPadding != null ? site.groundPadding : 0;
  const size = site.groundSize != null ? site.groundSize : 560;
  const w = Math.max(b.maxX - b.minX, size) + pad * 2;
  const d = Math.max(b.maxZ - b.minZ, size) + pad * 2;
  const cx = (b.minX + b.maxX) / 2;
  const cz = (b.minZ + b.maxZ) / 2;

  const shape = new THREE.Shape([
    new THREE.Vector2(cx - w / 2, -(cz - d / 2)),
    new THREE.Vector2(cx + w / 2, -(cz - d / 2)),
    new THREE.Vector2(cx + w / 2, -(cz + d / 2)),
    new THREE.Vector2(cx - w / 2, -(cz + d / 2)),
  ]);

  // 水体处开洞，水面（低于地平面）才不会被地面挡住。
  for (const w2 of layout.water || []) {
    shape.holes.push(new THREE.Path(ellipsePoints(THREE, w2.center[0], w2.center[1], w2.rx, w2.rz, C.seg)));
  }

  const geo = shapeToWorld(C, shape, 14);
  addMesh(C, geo, mats.get('grass'), 'CAMPUS_SITE_GROUND_01_surface', { castShadow: false, order: 0 });
}

/* ══ 道路 ═══════════════════════════════════════════════════════════════ */

/**
 * 计算折线的斜接（miter）偏移：转角处两侧边线相交，不留裂缝、不重叠。
 * 返回每段的单位方向/长度，以及每个点的单位斜接方向与偏移量。
 */
function computeMiter(pts, halfWidth) {
  const n = pts.length;
  const dirs = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dz = pts[i + 1][1] - pts[i][1];
    const len = Math.hypot(dx, dz) || 1;
    dirs.push({ x: dx / len, z: dz / len, len });
  }
  const normals = dirs.map((d) => ({ x: -d.z, z: d.x }));
  const miter = [];
  const offsets = [];
  for (let i = 0; i < n; i++) {
    let mx, mz, scale = 1;
    if (i === 0) {
      mx = normals[0].x; mz = normals[0].z;
    } else if (i === n - 1) {
      const last = normals[normals.length - 1];
      mx = last.x; mz = last.z;
    } else {
      const a = normals[i - 1], b = normals[i];
      let sx = a.x + b.x, sz = a.z + b.z;
      const sl = Math.hypot(sx, sz);
      if (sl < 1e-6) { sx = b.x; sz = b.z; }
      else { sx /= sl; sz /= sl; }
      const dot = Math.max(0.25, sx * b.x + sz * b.z);
      scale = Math.min(4, 1 / dot);
      mx = sx; mz = sz;
    }
    miter.push({ x: mx, z: mz });
    offsets.push({ x: mx * halfWidth * scale, z: mz * halfWidth * scale });
  }
  return { dirs, miter, offsets };
}

/** 带状路面：每个站点一对左右边线顶点，逐段三角化。 */
function ribbonGeometry(sink, pts, offsets, dirs, y, tile = 8) {
  let acc = 0;
  for (let i = 0; i < pts.length; i++) {
    const L = [pts[i][0] + offsets[i].x, y, pts[i][1] + offsets[i].z];
    const R = [pts[i][0] - offsets[i].x, y, pts[i][1] - offsets[i].z];
    sink.P.push(L[0], L[1], L[2], R[0], R[1], R[2]);
    sink.N.push(0, 1, 0, 0, 1, 0);
    sink.U.push(acc / tile, 0, acc / tile, 1);
    if (i < pts.length - 1) acc += dirs[i].len;
  }
  const base = sink.P.length / 3 - pts.length * 2;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = base + 2 * i;
    sink.I.push(a, a + 2, a + 3, a, a + 3, a + 1);
  }
}

/**
 * 路缘：沿道路两侧的抬升断面（贴路缘立面 → 顶面 → 外侧立面落地）。
 * 左右两侧合并为一个网格，减少 draw call。
 */
function curbGeometry(sink, pts, offsets, miter, y) {
  const w = Y.curbW, h = Y.curbH;
  const profile = [
    { off: 0, y },            // 内侧贴路缘底部
    { off: 0, y: y + h },     // 内侧立面顶部
    { off: w, y: y + h },     // 顶面外沿
    { off: w, y: 0 },         // 外侧落地
  ];
  for (const side of [1, -1]) {
    const edge = [];
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const s = side;
      edge.push({
        x: pts[i][0] + s * offsets[i].x,
        z: pts[i][1] + s * offsets[i].z,
      });
      out.push({ x: s * miter[i].x, z: s * miter[i].z });
    }
    for (let i = 0; i < pts.length - 1; i++) {
      for (let k = 0; k < profile.length - 1; k++) {
        const p0 = profile[k], p1 = profile[k + 1];
        const A = [edge[i].x + out[i].x * p0.off, p0.y, edge[i].z + out[i].z * p0.off];
        const B = [edge[i + 1].x + out[i + 1].x * p0.off, p0.y, edge[i + 1].z + out[i + 1].z * p0.off];
        const Cc = [edge[i + 1].x + out[i + 1].x * p1.off, p1.y, edge[i + 1].z + out[i + 1].z * p1.off];
        const D = [edge[i].x + out[i].x * p1.off, p1.y, edge[i].z + out[i].z * p1.off];
        let desired;
        if (k === 0) desired = [-out[i].x, 0, -out[i].z];   // 面向路面
        else if (k === 1) desired = [0, 1, 0];               // 顶面
        else desired = [out[i].x, 0, out[i].z];               // 背向路面
        pushQuad(sink.P, sink.N, sink.U, sink.I, [A, B, Cc, D], [[0, 0], [1, 0], [1, 1], [0, 1]], desired);
      }
    }
  }
}

/** 线段求交（世界 XZ 平面）；平行/共线返回 null。 */
function segmentIntersect(a0, a1, b0, b1) {
  const rx = a1[0] - a0[0], rz = a1[1] - a0[1];
  const sx = b1[0] - b0[0], sz = b1[1] - b0[1];
  const denom = rx * sz - rz * sx;
  if (Math.abs(denom) < 1e-9) return null;
  const qpx = b0[0] - a0[0], qpz = b0[1] - a0[1];
  const t = (qpx * sz - qpz * sx) / denom;
  const u = (qpx * rz - qpz * rx) / denom;
  if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) return null;
  return [a0[0] + rx * t, a0[1] + rz * t];
}

/** 找出不同道路之间的路口（用于布置斑马线）。 */
function findIntersections(roads) {
  const out = [];
  for (let i = 0; i < roads.length; i++) {
    const pa = roads[i].points;
    for (let j = i + 1; j < roads.length; j++) {
      const pb = roads[j].points;
      for (let a = 0; a < pa.length - 1; a++) {
        for (let b = 0; b < pb.length - 1; b++) {
          const p = segmentIntersect(pa[a], pa[a + 1], pb[b], pb[b + 1]);
          if (!p) continue;
          const dup = out.find((o) => Math.hypot(o.point[0] - p[0], o.point[1] - p[1]) < 2);
          if (dup) continue;
          out.push({ point: p, a: i, b: j });
        }
      }
    }
  }
  return out;
}

/** 找到折线上离给定点最近的那一段（返回该段方向）。 */
function nearestSegmentDir(pts, p) {
  let best = null, bestD = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i][0], az = pts[i][1];
    const bx = pts[i + 1][0], bz = pts[i + 1][1];
    const dx = bx - ax, dz = bz - az;
    const l2 = dx * dx + dz * dz || 1;
    let t = ((p[0] - ax) * dx + (p[1] - az) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + dx * t, qz = az + dz * t;
    const d = Math.hypot(qx - p[0], qz - p[1]);
    if (d < bestD) {
      bestD = d;
      const len = Math.hypot(dx, dz) || 1;
      best = { x: dx / len, z: dz / len };
    }
  }
  return best;
}

/**
 * 道路：按材质合并成极少数几个大网格（102 条路 → 7 个网格）。
 *
 * 合并口径为「同材质 + 同贴地层 + 同高度」，与 CONTRACT 附录 B §12.3 一致：
 *   · 车行道面 asphalt → 1 个网格，renderOrder = LAYER.road，Y = Y.road
 *   · 步道面   paving → 1 个网格，renderOrder = LAYER.path，Y = Y.path
 *   · 路缘     curb  → 1 个网格（实体面，depthWrite = true）
 *   · 斑马线 lineWhite → 1 个网格，renderOrder = LAYER.crosswalk
 *
 * 合并后同材质面片互相重叠处不会产生色差，也不产生深度闪烁：
 * 贴地面片 depthWrite = false，彼此不写深度；实体路缘同材质共面重叠像素相同。
 *
 * RD_AXIS_MAIN（主轴大道）保留独立网格（surface / curb / crosswalk）：
 * app.js 靠「网格包围盒中心落在 POI 包围盒内」把 POI 绑定到网格，
 * 合并后的大网格包围盒横跨全场（> 80 m），会被 app.js 的
 * 「地面/大平面」过滤规则剔除，主轴 POI 将失去高亮目标，故单独成网格。
 */
function buildRoads(C) {
  const { layout, mats, stats } = C;
  const roads = layout.roads || [];

  // 同类道路共用同一高度：步道 Y.path，车行道 Y.road。
  // 交叠处不再靠毫米级高差区分先后，改由 renderOrder 决定，
  // 因此任意距离下都不会出现路与路之间的深度竞争。
  const isPath = (road) => road.type === 'path';
  const yOf = (road) => (isPath(road) ? Y.path : Y.road);
  const isAxis = (road) => road.id === AXIS_ROAD_ID;

  const intersections = findIntersections(roads);

  const sinkAsphalt = createSink();
  const sinkPaving = createSink();
  const sinkCurb = createSink();
  const sinkCrosswalk = createSink();
  const axisSurface = createSink();
  const axisCurb = createSink();
  const axisCrosswalk = createSink();

  for (const it of intersections) {
    const ia = it.a, ib = it.b;
    const primary = roads[ia].width >= roads[ib].width ? ia : ib;
    const secondary = primary === ia ? ib : ia;
    const dir = nearestSegmentDir(roads[primary].points, it.point);
    if (!dir) continue;
    const half = roads[primary].width / 2;
    const otherHalf = roads[secondary].width / 2;
    const dist = otherHalf + 2.2;
    const cx = it.point[0] + dir.x * dist;
    const cz = it.point[1] + dir.z * dist;
    const inset = Math.min(1.0, half * 0.2);
    const barW = 0.55;
    const gap = 1.05;
    const count = Math.max(3, Math.min(6, Math.floor(4 / gap)));
    const px = -dir.z, pz = dir.x;
    const start = -((count - 1) * gap) / 2;
    const cwY = yOf(roads[primary]) + Y.crosswalkGap;
    const target = isAxis(roads[primary]) ? axisCrosswalk : sinkCrosswalk;
    for (let k = 0; k < count; k++) {
      const t = start + k * gap;
      const bx = cx + dir.x * t, bz = cz + dir.z * t;
      stripXZ(target,
        bx + px * (half - inset), bz + pz * (half - inset),
        bx - px * (half - inset), bz - pz * (half - inset),
        barW, cwY, 4);
    }
  }

  for (let i = 0; i < roads.length; i++) {
    const road = roads[i];
    const pts = road.points;
    if (!pts || pts.length < 2) continue;
    const y = yOf(road);
    const half = road.width / 2;
    const { dirs, miter, offsets } = computeMiter(pts, half);

    // 路面：主轴单独成网格，其余按材质合并
    const surfSink = isAxis(road) ? axisSurface : (isPath(road) ? sinkPaving : sinkAsphalt);
    ribbonGeometry(surfSink, pts, offsets, dirs, y, isPath(road) ? 6 : 9);

    // 路缘（左右两侧合并；实体面，参与深度写入）
    curbGeometry(isAxis(road) ? axisCurb : sinkCurb, pts, offsets, miter, y);

    // 里程与面积（真实计算，按布局折线逐条累加，与是否合并不影响）
    let len = 0;
    for (let k = 0; k < pts.length - 1; k++) {
      const l = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]);
      len += l;
      stats.roadArea += l * road.width;
    }
    stats.roadLength += len;
  }

  const emit = (sink, material, name, order) => {
    const geo = sinkGeometry(C.THREE, sink);
    if (!geo) return null;
    return addMesh(C, geo, material, name, { order });
  };

  emit(sinkAsphalt, mats.decal('asphalt', LAYER.road), 'RD_NET_asphalt', LAYER.road);
  emit(sinkPaving, mats.decal('paving', LAYER.path), 'RD_NET_paving', LAYER.path);
  emit(sinkCrosswalk, mats.decal('lineWhite', LAYER.crosswalk), 'RD_NET_crosswalk', LAYER.crosswalk);
  emit(sinkCurb, mats.get('curb'), 'RD_NET_curb', 0);
  emit(axisSurface, mats.decal('asphalt', LAYER.road), 'RD_AXIS_MAIN_surface', LAYER.road);
  emit(axisCurb, mats.get('curb'), 'RD_AXIS_MAIN_curb', 0);
  emit(axisCrosswalk, mats.decal('lineWhite', LAYER.crosswalk), 'RD_AXIS_MAIN_crosswalk', LAYER.crosswalk);
}

/* ══ 广场 ═══════════════════════════════════════════════════════════════ */

/**
 * 广场：广场面按广场单独成网格（POI 高亮目标），台阶边界按材质合并为 1 个网格。
 */
function buildPlazas(C) {
  const { layout, mats, stats } = C;
  const stepSink = createSink();

  for (const plaza of layout.plazas || []) {
    const cx = plaza.center[0], cz = plaza.center[1];
    const w = plaza.w, d = plaza.d;
    stats.plazaArea += w * d;

    const surfSink = createSink();
    quadXZ(surfSink, cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, Y.plaza, 9);
    addMesh(C, sinkGeometry(C.THREE, surfSink), mats.decal('plazaStone', LAYER.plaza),
      `${plaza.id}_surface`, { order: LAYER.plaza });

    // 四周台阶边界：外扩一圈的台阶面 + 外侧落地裙边（按材质合并为一个网格）
    const m = 1.2;
    const ring = new C.THREE.Shape([
      new C.THREE.Vector2(cx - w / 2 - m, -(cz - d / 2 - m)),
      new C.THREE.Vector2(cx + w / 2 + m, -(cz - d / 2 - m)),
      new C.THREE.Vector2(cx + w / 2 + m, -(cz + d / 2 + m)),
      new C.THREE.Vector2(cx - w / 2 - m, -(cz + d / 2 + m)),
    ]);
    ring.holes.push(new C.THREE.Path([
      new C.THREE.Vector2(cx - w / 2, -(cz - d / 2)),
      new C.THREE.Vector2(cx + w / 2, -(cz - d / 2)),
      new C.THREE.Vector2(cx + w / 2, -(cz + d / 2)),
      new C.THREE.Vector2(cx - w / 2, -(cz + d / 2)),
    ]));
    shapeInto(stepSink, C, ring, 6, Y.plazaStep);

    const corners = [
      [cx - w / 2 - m, cz - d / 2 - m, 1, 0], [cx + w / 2 + m, cz - d / 2 - m, 0, -1],
      [cx + w / 2 + m, cz + d / 2 + m, -1, 0], [cx - w / 2 - m, cz + d / 2 + m, 0, 1],
    ];
    for (let k = 0; k < 4; k++) {
      const [x, z, nx, nz] = corners[k];
      const nx2 = corners[(k + 1) % 4];
      pushQuad(stepSink.P, stepSink.N, stepSink.U, stepSink.I,
        [[x, 0, z], [nx2[0], 0, nx2[1]], [nx2[0], Y.plazaStep, nx2[1]], [x, Y.plazaStep, z]],
        [[0, 0], [1, 0], [1, 1], [0, 1]], [nx, 0, nz]);
    }
    // 台阶带与广场面之间的高差立面（否则该处留有 28mm 的通缝）
    const inner = [
      [cx - w / 2, cz - d / 2, 1, 0], [cx + w / 2, cz - d / 2, 0, -1],
      [cx + w / 2, cz + d / 2, -1, 0], [cx - w / 2, cz + d / 2, 0, 1],
    ];
    for (let k = 0; k < 4; k++) {
      const [x, z, nx, nz] = inner[k];
      const nx2 = inner[(k + 1) % 4];
      pushQuad(stepSink.P, stepSink.N, stepSink.U, stepSink.I,
        [[x, Y.plazaStep, z], [nx2[0], Y.plazaStep, nx2[1]], [nx2[0], Y.plaza, nx2[1]], [x, Y.plaza, z]],
        [[0, 0], [1, 0], [1, 1], [0, 1]], [nx, 0, nz]);
    }
  }

  const stepGeo = sinkGeometry(C.THREE, stepSink);
  if (stepGeo) addMesh(C, stepGeo, mats.get('stone'), 'PLAZA_steps_merged');
}

/* ══ 运动场地 ═══════════════════════════════════════════════════════════ */

/**
 * 田径场：按标准 400m 跑道建模。
 *
 * 口径（与 tools/audit_site.mjs 一致）：
 *   · 8 道 × 1.22m = 9.76m 跑道总宽
 *   · 内弯道半径 rIn = 36.5m，外弯道半径 rOut = rIn + 9.76 = 46.26m
 *   · 内场为「跑道内沿」围合的体育场形（直段 + 两端半圆），
 *     其中再标出标准 105×68m 足球场
 *   · 外轮廓 = 176.91 × 92.52m（直段 84.39m）
 *
 * 合并：跑道环 / 分道带 / 内场草坪 / 足球场标线按材质并入全局汇流器；
 * 中圈与起跑线保留为每片场地一个网格（田径场 POI 的高亮目标）。
 */
function buildTrack(C, court, shared) {
  const { mats, stats } = C;
  const cx = court.center[0], cz = court.center[1];
  const w = court.w, d = court.d;
  const LANES = court.lanes || 8;
  const LANE_W = court.laneWidth || 1.22;
  const rIn = court.radius || 36.5;
  const rOut = rIn + LANES * LANE_W;          // 外弯道半径
  const ringW = LANES * LANE_W;               // 跑道总宽
  const straightLen = Math.max(10, w - 2 * rOut);
  const innerW = straightLen + 2 * rIn;       // 内沿围合的长边
  const innerD = 2 * rIn;                     // 内沿围合的短边
  const field = court.inner || [105, 68];     // 标准足球场
  const fw = field[0], fd = field[1];
  const seg = Math.max(6, Math.round(C.seg / 8));

  // 跑道环：真正的环形（外轮廓 + 内沿洞），不是实心矩形叠色
  const shape = new C.THREE.Shape(roundedRectPoints(C.THREE, cx, cz, w, d, rOut, seg));
  shape.holes.push(new C.THREE.Path(roundedRectPoints(C.THREE, cx, cz, innerW, innerD, rIn, seg)));
  shapeInto(shared.trackRing, C, shape, 12, Y.court);

  // 分道线：每道边界一条，共 LANES 条（含最外道边线）
  for (let k = 1; k <= LANES; k++) {
    const off = k * LANE_W;
    const band = new C.THREE.Shape(
      roundedRectPoints(C.THREE, cx, cz, innerW + 2 * off, innerD + 2 * off, rIn + off, seg)
    );
    band.holes.push(new C.THREE.Path(
      roundedRectPoints(C.THREE, cx, cz, innerW + 2 * (off - 0.16), innerD + 2 * (off - 0.16), Math.max(0.4, rIn + off - 0.16), seg)
    ));
    shapeInto(shared.trackLanes, C, band, 6, Y.line);
  }

  // 内场草坪：跑道内沿围合的体育场形
  const fieldShape = new C.THREE.Shape(roundedRectPoints(C.THREE, cx, cz, innerW, innerD, rIn, seg));
  shapeInto(shared.trackField, C, fieldShape, 14, Y.court);

  // 足球场标线（标准 105×68）
  const hw = fw / 2, hd = fd / 2;
  const m = 0.06;                                           // 线宽半值：标线中心线压在边线上
  const line = (ax, az, bx, bz) => {
    stripXZ(shared.trackPitch, ax, az, bx, bz, 0.12, Y.line, 4);
  };
  line(cx - hw + m, cz - hd + m, cx + hw - m, cz - hd + m);   // 底线
  line(cx - hw + m, cz + hd - m, cx + hw - m, cz + hd - m);   // 底线
  line(cx - hw + m, cz - hd + m, cx - hw + m, cz + hd - m);   // 边线
  line(cx + hw - m, cz - hd + m, cx + hw - m, cz + hd - m);   // 边线
  line(cx, cz - hd + m, cx, cz + hd - m);                     // 中线
  line(cx - 0.12, cz, cx + 0.12, cz);                         // 中点
  line(cx, cz - 0.12, cx, cz + 0.12);
  for (const s of [-1, 1]) {
    const bx = cx + s * hw;
    line(bx, cz - 20.16, bx - s * 16.5, cz - 20.16);         // 禁区 40.32×16.5
    line(bx - s * 16.5, cz - 20.16, bx - s * 16.5, cz + 20.16);
    line(bx - s * 16.5, cz + 20.16, bx, cz + 20.16);
    line(bx, cz - 9.16, bx - s * 5.5, cz - 9.16);            // 球门区 18.32×5.5
    line(bx - s * 5.5, cz - 9.16, bx - s * 5.5, cz + 9.16);
    line(bx - s * 5.5, cz + 9.16, bx, cz + 9.16);
    const px = bx - s * 11;                                  // 点球点：距球门线 11m
    line(px - 0.12, cz, px + 0.12, cz);
    line(px, cz - 0.12, px, cz + 0.12);
  }
  // 角球弧 R=1m（四角）
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const ox = cx + sx * hw, oz = cz + sz * hd;
      const dir = (sx * sz > 0) ? 1 : -1;                    // 弧线朝向场内
      let prev = null;
      for (let i = 0; i <= 8; i++) {
        const a = Math.atan2(-sz, -sx) + dir * (i / 8) * (Math.PI / 2);
        const px = ox + Math.cos(a) * 1.0, pz = oz + Math.sin(a) * 1.0;
        if (prev) line(prev[0], prev[1], px, pz);
        prev = [px, pz];
      }
    }
  }

  // 中圈 + 终点线 + 8 条分道起跑线：每片田径场一个网格（POI 高亮目标）
  const markSink = createSink();
  circleBand(markSink, cx, cz, 9.15, 0.12, Y.line, C.seg);
  // 跑向：南直道自西向东；终点线在 X=cx，第 k 道起跑线后移 0.30×(k−1)m。
  const sline = (ax, az, bx, bz) => {
    stripXZ(markSink, ax, az, bx, bz, 0.12, Y.line, 4);
  };
  sline(cx, cz - rOut, cx, cz - rIn);                        // 终点线（贯穿全部 8 道）
  const stagger = court.stagger != null ? court.stagger : 0.30;
  for (let k = 1; k <= LANES; k++) {
    const rA = rIn + (k - 1) * LANE_W;
    const rB = rIn + k * LANE_W;
    sline(cx + stagger * (k - 1), cz - rB, cx + stagger * (k - 1), cz - rA);
  }
  addMesh(C, sinkGeometry(C.THREE, markSink), mats.decal('lineWhite', LAYER.courtLine),
    `${court.id}_mark_lines`, { order: LAYER.courtLine });

  stats.courtArea += w * d;
  stats.trackLanes = LANES;
  stats.trackInnerRadius = rIn;
  stats.trackRingWidth = ringW;
}

/** 篮球场：铺装地面 + 白色边线与中线（支持多片场地）。 */
function buildBasketball(C, court) {
  const { mats, stats } = C;
  const cx = court.center[0], cz = court.center[1];
  const w = court.w, d = court.d;
  const n = Math.max(1, court.courts || 1);

  const surfSink = createSink();
  quadXZ(surfSink, cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, Y.court, 9);
  addMesh(C, sinkGeometry(C.THREE, surfSink), mats.decal('asphalt', LAYER.court),
    `${court.id}_surface`, { order: LAYER.court });

  const lineSink = createSink();
  const line = (ax, az, bx, bz) => {
    stripXZ(lineSink, ax, az, bx, bz, 0.12, Y.line, 4);
  };
  const cellW = w / n;
  const cw = 28, cd = 15;   // 标准场地尺寸
  for (let k = 0; k < n; k++) {
    const c0 = cx - w / 2 + cellW * k + cellW / 2;
    const x0 = c0 - cw / 2, x1 = c0 + cw / 2;
    const z0 = cz - cd / 2, z1 = cz + cd / 2;
    line(x0, z0, x1, z0);
    line(x1, z0, x1, z1);
    line(x1, z1, x0, z1);
    line(x0, z1, x0, z0);
    line(c0, z0, c0, z1);                                     // 中线
    for (const s of [-1, 1]) {
      const bx = c0 + s * cw / 2;
      line(bx, cz - 4.9, bx - s * 5.8, cz - 4.9);              // 限制区
      line(bx - s * 5.8, cz - 4.9, bx - s * 5.8, cz + 4.9);
      line(bx - s * 5.8, cz + 4.9, bx, cz + 4.9);
      line(bx, cz - 4.575, bx - s * 1.8, cz - 4.575);          // 罚球区（3分线内）
      line(bx - s * 1.8, cz - 4.575, bx - s * 1.8, cz + 4.575);
      line(bx - s * 1.8, cz + 4.575, bx, cz + 4.575);
    }
    circleBand(lineSink, c0, cz, 1.8, 0.12, Y.line, Math.max(12, Math.round(C.seg / 3)));
  }
  addMesh(C, sinkGeometry(C.THREE, lineSink), mats.decal('lineWhite', LAYER.courtLine),
    `${court.id}_lines`, { order: LAYER.courtLine });
  stats.courtArea += w * d;
}

/** 网球场：硬地铺装 + 白色边线、发球线、网线。 */
function buildTennis(C, court) {
  const { mats, stats } = C;
  const cx = court.center[0], cz = court.center[1];
  const w = court.w, d = court.d;

  const surfSink = createSink();
  quadXZ(surfSink, cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, Y.court, 9);
  addMesh(C, sinkGeometry(C.THREE, surfSink), mats.decal('tennisCourt', LAYER.court),
    `${court.id}_surface`, { order: LAYER.court });

  const lineSink = createSink();
  const line = (ax, az, bx, bz) => {
    stripXZ(lineSink, ax, az, bx, bz, 0.1, Y.line, 4);
  };
  const hl = 23.77 / 2, hw = 10.97 / 2, hs = 4.115;   // 双打 / 单打半场尺寸
  line(cx - hl, cz - hw, cx + hl, cz - hw);
  line(cx - hl, cz + hw, cx + hl, cz + hw);
  line(cx - hl, cz - hw, cx - hl, cz + hw);
  line(cx + hl, cz - hw, cx + hl, cz + hw);
  line(cx - hl, cz - hs, cx + hl, cz - hs);
  line(cx - hl, cz + hs, cx + hl, cz + hs);
  line(cx - 5.985, cz - hw, cx - 5.985, cz + hw);
  line(cx + 5.985, cz - hw, cx + 5.985, cz + hw);
  line(cx, cz - hw, cx, cz + hw);
  addMesh(C, sinkGeometry(C.THREE, lineSink), mats.decal('lineWhite', LAYER.courtLine),
    `${court.id}_lines`, { order: LAYER.courtLine });
  stats.courtArea += w * d;
}

function buildCourts(C) {
  const { mats } = C;
  // 田径场共享汇流器：跑道环 / 分道带 / 内场草坪 / 足球场标线
  const shared = {
    trackRing: createSink(),
    trackLanes: createSink(),
    trackField: createSink(),
    trackPitch: createSink(),
  };

  for (const court of C.layout.courts || []) {
    if (court.type === 'track') buildTrack(C, court, shared);
    else if (court.type === 'tennis') buildTennis(C, court);
    else buildBasketball(C, court);
  }

  const emit = (sink, material, name, order) => {
    const geo = sinkGeometry(C.THREE, sink);
    if (!geo) return null;
    return addMesh(C, geo, material, name, { order });
  };
  emit(shared.trackRing, mats.decal('trackRed', LAYER.court), 'COURT_track_rings', LAYER.court);
  emit(shared.trackField, mats.decal('fieldGreen', LAYER.court), 'COURT_track_fields', LAYER.court);
  emit(shared.trackLanes, mats.decal('trackLine', LAYER.courtLine), 'COURT_track_lanes', LAYER.courtLine);
  emit(shared.trackPitch, mats.decal('lineWhite', LAYER.courtLine), 'COURT_track_pitch_lines', LAYER.courtLine);
}

/* ══ 水体 ═══════════════════════════════════════════════════════════════ */

/**
 * 水体：每处水体保留「护岸 + 水面」两个网格（POI 高亮目标），
 * 湖底按材质合并为 1 个网格（水底位于地平面以下，不参与 POI 绑定）。
 */
function buildWater(C) {
  const { layout, mats, stats } = C;
  const bedSink = createSink();

  for (const w of layout.water || []) {
    const cx = w.center[0], cz = w.center[1];
    const rx = w.rx, rz = w.rz;
    const level = w.level != null ? w.level : -0.4;
    const depth = w.depth != null ? w.depth : 1.5;
    const inset = 2.5;
    stats.waterArea += Math.PI * rx * rz;

    // 浅滩 / 护岸：由地面边缘（y=0）斜向下伸到水线（y=level）
    const bankSink = createSink();
    for (let i = 0; i < C.seg; i++) {
      const a0 = (i / C.seg) * TAU, a1 = ((i + 1) / C.seg) * TAU;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const corners = [
        [cx + rx * c0, 0, cz + rz * s0],
        [cx + rx * c1, 0, cz + rz * s1],
        [cx + (rx - inset) * c1, level, cz + (rz - inset) * s1],
        [cx + (rx - inset) * c0, level, cz + (rz - inset) * s0],
      ];
      pushQuad(bankSink.P, bankSink.N, bankSink.U, bankSink.I, corners, [[0, 0], [1, 0], [1, 1], [0, 1]], [0, 1, 0]);
    }
    addMesh(C, sinkGeometry(C.THREE, bankSink), mats.get('soil'), `${w.id}_bank`);

    // 湖底（按材质合并）
    ellipseFan(bedSink, cx, cz, rx - inset, rz - inset, level - depth, C.seg);

    // 水面（低于地平面，半透明）
    const surfSink = createSink();
    ellipseFan(surfSink, cx, cz, rx - inset + 0.15, rz - inset + 0.15, level, C.seg);
    const mesh = addMesh(C, sinkGeometry(C.THREE, surfSink), mats.get('water'), `${w.id}_surface`);
    mesh.renderOrder = 2;
  }

  const bedGeo = sinkGeometry(C.THREE, bedSink);
  if (bedGeo) addMesh(C, bedGeo, mats.get('soil'), 'WATER_beds_merged');
}

/* ══ 绿地底板 ═══════════════════════════════════════════════════════════ */

/**
 * 解析 layout.greenAreas 的 rect 字段。
 *
 * CONTRACT.md 规定顺序为 [x0, z0, x1, z1]（x 东西向、z 南北向）。
 * 本真值表的 9 条 rect 已全部按该顺序整理，因此**默认按契约解读**；
 * 仅当某条数据明显反向（x0 > x1 或 z0 > z1）时，才回退到自动判读，
 * 避免历史遗留数据把整块绿地拉伸到错误位置。
 */
export function resolveGreenRects(greenAreas = []) {
  const list = Array.isArray(greenAreas) ? greenAreas : [];

  // 统计反向数据量，判断是否需要回退到自动判读
  let inverted = 0;
  for (const g of list) {
    const r = (g && g.rect) || [];
    if (r.length < 4) continue;
    if (r[0] > r[2] || r[1] > r[3]) inverted++;
  }
  const needAutoDetect = inverted > 0 && inverted >= list.length / 2;

  let invXY = 0, invXZ = 0;
  if (needAutoDetect) {
    for (const g of list) {
      const r = (g && g.rect) || [];
      if (r.length < 4) continue;
      if (r[0] > r[1]) invXY++;
      if (r[2] > r[3]) invXY++;
      if (r[0] > r[2]) invXZ++;
      if (r[1] > r[3]) invXZ++;
    }
  }
  const useXY = needAutoDetect && invXZ >= invXY;   // true → [x0,x1,z0,z1]

  return list.map((g) => {
    const r = (g && g.rect) || [0, 0, 0, 0];
    const x0 = r[0];
    const x1 = useXY ? r[1] : r[2];
    const z0 = useXY ? r[2] : r[1];
    const z1 = r[3];
    return {
      id: g.id,
      name: g.name,
      density: g.density,
      rect: [Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)],
    };
  });
}

/** 椭圆是否完全落在矩形内（可安全挖洞）。 */
function ellipseInsideRect(w, rect) {
  const [x0, z0, x1, z1] = rect;
  return (w.center[0] - w.rx) >= x0 && (w.center[0] + w.rx) <= x1
    && (w.center[1] - w.rz) >= z0 && (w.center[1] + w.rz) <= z1;
}

/**
 * 绿地底板：106 块按材质合并为 2 个网格（grass / lawnDark）。
 *
 * 随机材质分配仍走 seeded rng，且调用顺序与合并前完全一致（逐块调用一次），
 * 因此每次生成的材质分配结果可复现。
 */
function buildGreens(C) {
  const { layout, mats, rng } = C;
  const greens = resolveGreenRects(layout.greenAreas || []);
  const waters = layout.water || [];

  const sinks = { grass: createSink(), lawnDark: createSink() };

  for (const g of greens) {
    const [x0, z0, x1, z1] = g.rect;
    if (x1 <= x0 || z1 <= z0) continue;
    const shape = new C.THREE.Shape([
      new C.THREE.Vector2(x0, -z0),
      new C.THREE.Vector2(x1, -z0),
      new C.THREE.Vector2(x1, -z1),
      new C.THREE.Vector2(x0, -z1),
    ]);
    for (const w of waters) {
      const overlap = !(w.center[0] + w.rx < x0 || w.center[0] - w.rx > x1
        || w.center[1] + w.rz < z0 || w.center[1] - w.rz > z1);
      if (!overlap) continue;
      if (ellipseInsideRect(w, g.rect)) {
        shape.holes.push(new C.THREE.Path(ellipsePoints(C.THREE, w.center[0], w.center[1], w.rx, w.rz, C.seg)));
      } else {
        console.warn(`[terrain] 绿地 ${g.id} 与水体 ${w.id} 部分相交，未挖洞`);
      }
    }
    // 绿地底板材质在 lawnDark / grass 之间随机（走 seeded rng）
    const matName = rng() > 0.45 ? 'lawnDark' : 'grass';
    shapeInto(sinks[matName], C, shape, 12, Y.green);
  }

  const grassGeo = sinkGeometry(C.THREE, sinks.grass);
  if (grassGeo) {
    addMesh(C, grassGeo, mats.decal('grass', LAYER.green), 'CAMPUS_GREENS_grass', { order: LAYER.green });
  }
  const darkGeo = sinkGeometry(C.THREE, sinks.lawnDark);
  if (darkGeo) {
    addMesh(C, darkGeo, mats.decal('lawnDark', LAYER.green), 'CAMPUS_GREENS_lawnDark', { order: LAYER.green });
  }
}

/**
 * 农学实训基地：田垄（soil）+ 作物色条（shrub），遇水体自动截断。
 *
 * 本块绿地（id = GREEN_AGRI）的底板已并入绿地合并网格，
 * 田垄与作物仍按 layout 中的矩形独立生成，识别不依赖底板网格。
 */
function buildAgriField(C) {
  const { layout, mats } = C;
  const greens = resolveGreenRects(layout.greenAreas || []);
  const agri = greens.find((g) => g.id === 'GREEN_AGRI');
  if (!agri) return;
  const [x0, z0, x1, z1] = agri.rect;
  const waters = (layout.water || []).filter((w) =>
    !(w.center[0] + w.rx < x0 || w.center[0] - w.rx > x1
      || w.center[1] + w.rz < z0 || w.center[1] - w.rz > z1));

  const bands = Math.max(4, Math.round((z1 - z0) / 4.2));
  const ridgeW = 1.4, cropW = 2.8;
  const soilSink = createSink();
  const cropSink = createSink();

  /** 把一段 X 区间按水体椭圆裁开 */
  const clip = (ax, bx, zc) => {
    let spans = [[ax, bx]];
    for (const w of waters) {
      const dz = (zc - w.center[1]) / w.rz;
      if (Math.abs(dz) >= 1) continue;
      const half = w.rx * Math.sqrt(1 - dz * dz);
      const cx0 = w.center[0] - half, cx1 = w.center[0] + half;
      const next = [];
      for (const [sa, sb] of spans) {
        if (cx1 <= sa || cx0 >= sb) { next.push([sa, sb]); continue; }
        if (cx0 > sa) next.push([sa, cx0]);
        if (cx1 < sb) next.push([cx1, sb]);
      }
      spans = next;
    }
    return spans.filter(([a, b]) => b - a > 0.6);
  };

  for (let i = 0; i < bands; i++) {
    const bz = z0 + (i + 0.5) * ((z1 - z0) / bands);
    const isRidge = i % 2 === 0;
    const half = isRidge ? ridgeW / 2 : cropW / 2;
    const y = isRidge ? Y.agriRidge : Y.agri;
    for (const [sa, sb] of clip(x0, x1, bz)) {
      const sink = isRidge ? soilSink : cropSink;
      const corners = [
        [sa, y, bz - half], [sb, y, bz - half], [sb, y, bz + half], [sa, y, bz + half],
      ];
      const uvs = [[sa / 4, (bz - half) / 4], [sb / 4, (bz - half) / 4], [sb / 4, (bz + half) / 4], [sa / 4, (bz + half) / 4]];
      pushQuad(sink.P, sink.N, sink.U, sink.I, corners, uvs, [0, 1, 0]);
    }
  }
  const soilGeo = sinkGeometry(C.THREE, soilSink);
  if (soilGeo) {
    addMesh(C, soilGeo, mats.decal('soil', LAYER.agriRidge),
      'GREEN_AGRI_furrows', { order: LAYER.agriRidge });
  }
  const cropGeo = sinkGeometry(C.THREE, cropSink);
  if (cropGeo) {
    addMesh(C, cropGeo, mats.decal('shrub', LAYER.agri),
      'GREEN_AGRI_crops', { order: LAYER.agri });
  }
}

/* ══ 停车场 ═══════════════════════════════════════════════════════════════ */

/**
 * 停车场：铺装地面 + 6m 循环车道 + 车位线。
 *
 * 规范 v2.0 §1.3：每个停车场须有 6m 宽循环车道，且**车位线不得与车道重叠**。
 * 车道带由 layout.parking[].access.aisleBand = [x0,z0,x1,z1] 给出；
 * 落在车道带内的车位线按 X 方向裁掉，车位后沿线相应断开。
 *
 * 合并：每处停车场铺装与车位线各自单独成网格（POI 高亮目标，且区域剖切
 * 「隐藏/仅显示某类」依赖 POI→网格绑定，合并后车位线会残留）；
 * 循环车道带按材质合并为 1 个网格。
 */
function buildParking(C) {
  const { layout, mats } = C;
  const aisleSink = createSink();

  for (const p of layout.parking || []) {
    const cx = p.center[0], cz = p.center[1];
    const w = p.w, d = p.d;
    const rows = Math.max(1, p.rows || 1);
    const cols = Math.max(1, p.cols || 1);
    const acc = p.access || null;
    const band = acc && acc.aisleBand ? acc.aisleBand : null;

    const surfSink = createSink();
    quadXZ(surfSink, cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, Y.parking, 9);
    addMesh(C, sinkGeometry(C.THREE, surfSink), mats.decal('asphalt', LAYER.parking),
      `${p.id}_surface`, { order: LAYER.parking });

    // 6m 循环车道（与场地铺装同材质同高，靠绘制顺序区分，不做共面抬高）
    if (band) {
      quadXZ(aisleSink, band[0], band[1], band[2], band[3], Y.parking, 9);
    }

    const lineSink = createSink();
    const line = (ax, az, bx, bz) => {
      stripXZ(lineSink, ax, az, bx, bz, 0.12, Y.parkingLine, 4);
    };
    const stallW = w / cols;
    const bandD = d / rows;
    const stallD = Math.min(5.2, bandD * 0.46);
    // 车道带是否覆盖该行的车位列
    const inBandX = (x) => !!band && x > band[0] && x < band[2];
    for (let r = 0; r < rows; r++) {
      const bandC = cz - d / 2 + (r + 0.5) * bandD;
      const dir = r % 2 === 0 ? 1 : -1;
      const zBack = bandC + (dir * stallD) / 2;
      const zFront = bandC - (dir * stallD) / 2;
      const zLo = Math.min(zBack, zFront), zHi = Math.max(zBack, zFront);
      const rowHit = !!band && !(zHi <= band[1] || zLo >= band[3]);
      for (let c = 0; c <= cols; c++) {
        const x = cx - w / 2 + c * stallW;
        if (rowHit && inBandX(x)) continue;                  // 该列让位给循环车道
        line(x, zBack, x, zFront);
      }
      // 车位后沿线：遇车道带按 X 断开
      if (!rowHit) {
        line(cx - w / 2, zBack, cx + w / 2, zBack);
      } else {
        const segs = [[cx - w / 2, band[0]], [band[2], cx + w / 2]];
        for (const [x0, x1] of segs) if (x1 - x0 > 0.05) line(x0, zBack, x1, zBack);
      }
    }
    // 场地外框
    line(cx - w / 2, cz - d / 2, cx + w / 2, cz - d / 2);
    line(cx + w / 2, cz - d / 2, cx + w / 2, cz + d / 2);
    line(cx + w / 2, cz + d / 2, cx - w / 2, cz + d / 2);
    line(cx - w / 2, cz + d / 2, cx - w / 2, cz - d / 2);
    addMesh(C, sinkGeometry(C.THREE, lineSink), mats.decal('lineWhite', LAYER.parkingLine),
      `${p.id}_lines`, { order: LAYER.parkingLine });
  }

  const aisleGeo = sinkGeometry(C.THREE, aisleSink);
  if (aisleGeo) {
    addMesh(C, aisleGeo, mats.decal('asphalt', LAYER.parkingAisle), 'PARKING_aisles', { order: LAYER.parkingAisle });
  }
}

/* ══ 桥 ═════════════════════════════════════════════════════════════════ */

/**
 * 拱形桥：桥面沿本地 Z 向跨越（rotation=0 时为南北向），两端落到地面。
 * 明理湖短轴（Z 向）范围为 z ∈ [-65, 15]，桥长 96 m 时两端分别在
 * z = -73 与 z = 23，均在岸上。
 *
 * 合并：桥面 / 栏杆立板与立柱 / 桥台分别按材质合并为 3 个网格。
 */
function buildBridges(C) {
  const { layout, mats } = C;
  const deckSink = createSink();
  const fenceSink = createSink();
  const abutSink = createSink();

  for (const b of layout.bridges || []) {
    // layout.bridges.position 为 [x, y, z]
    const cx = b.position[0], cz = b.position[2];
    const L = b.length, W = b.width, H = b.height;
    const rot = b.rotation || 0;
    const sx = Math.sin(rot), cxr = Math.cos(rot);
    const dir = { x: sx, z: cxr };                 // 跨河方向（本地 +Z 旋转后）
    const side = { x: cxr, z: -sx };                // 桥宽方向
    const N = 20;
    const y0 = 0.02;
    const thick = 0.5;

    const stations = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const along = (t - 0.5) * L;
      const y = y0 + H * (1 - (2 * t - 1) * (2 * t - 1));
      stations.push({
        x: cx + dir.x * along,
        z: cz + dir.z * along,
        y,
        ux: side.x, uz: side.z,
      });
    }

    // 桥面（顶面 + 底面 + 两侧）
    for (let i = 0; i < N; i++) {
      const a = stations[i], b = stations[i + 1];
      const hw = W / 2;
      const aL = [a.x - a.ux * hw, a.y, a.z - a.uz * hw];
      const aR = [a.x + a.ux * hw, a.y, a.z + a.uz * hw];
      const bL = [b.x - b.ux * hw, b.y, b.z - b.uz * hw];
      const bR = [b.x + b.ux * hw, b.y, b.z + b.uz * hw];
      pushQuad(deckSink.P, deckSink.N, deckSink.U, deckSink.I, [aL, bL, bR, aR], [[0, 0], [1, 0], [1, 1], [0, 1]], [0, 1, 0]);
      const aLb = [aL[0], aL[1] - thick, aL[2]];
      const aRb = [aR[0], aR[1] - thick, aR[2]];
      const bLb = [bL[0], bL[1] - thick, bL[2]];
      const bRb = [bR[0], bR[1] - thick, bR[2]];
      pushQuad(deckSink.P, deckSink.N, deckSink.U, deckSink.I, [aLb, bLb, bRb, aRb], [[0, 0], [1, 0], [1, 1], [0, 1]], [0, -1, 0]);
      pushQuad(deckSink.P, deckSink.N, deckSink.U, deckSink.I, [aL, bL, bLb, aLb], [[0, 0], [1, 0], [1, 1], [0, 1]], [-a.ux, 0, -a.uz]);
      pushQuad(deckSink.P, deckSink.N, deckSink.U, deckSink.I, [aR, bR, bRb, aRb], [[0, 0], [1, 0], [1, 1], [0, 1]], [a.ux, 0, a.uz]);
    }

    // 栏杆（fence）：两侧立板 + 立柱
    for (const s of [-1, 1]) {
      for (let i = 0; i < N; i++) {
        const a = stations[i], b = stations[i + 1];
        const off = (W / 2 - 0.18) * s;
        const a0 = [a.x + a.ux * off, a.y + 0.12, a.z + a.uz * off];
        const a1 = [a.x + a.ux * off, a.y + 1.05, a.z + a.uz * off];
        const b0 = [b.x + b.ux * off, b.y + 0.12, b.z + b.uz * off];
        const b1 = [b.x + b.ux * off, b.y + 1.05, b.z + b.uz * off];
        pushQuad(fenceSink.P, fenceSink.N, fenceSink.U, fenceSink.I, [a0, b0, b1, a1], [[0, 0], [1, 0], [1, 1], [0, 1]], [a.ux * s, 0, a.uz * s]);
      }

      for (let i = 0; i <= N; i += 3) {
        const st = stations[i];
        const off = (W / 2 - 0.18) * s;
        boxGeometry(fenceSink, st.x + st.ux * off, st.y + 0.55, st.z + st.uz * off, 0.12, 0.95, 0.12);
      }
    }

    // 两端桥台，与地面衔接
    for (const [st, sgn] of [[stations[0], -1], [stations[N], 1]]) {
      boxGeometry(abutSink, st.x + dir.x * sgn * 0.9, 0.25, st.z + dir.z * sgn * 0.9, W + 1.2, 1.0, 2.6);
    }
  }

  const deckGeo = sinkGeometry(C.THREE, deckSink);
  if (deckGeo) addMesh(C, deckGeo, mats.get('paving'), 'BRIDGE_decks');
  const fenceGeo = sinkGeometry(C.THREE, fenceSink);
  if (fenceGeo) addMesh(C, fenceGeo, mats.get('fence'), 'BRIDGE_fences');
  const abutGeo = sinkGeometry(C.THREE, abutSink);
  if (abutGeo) addMesh(C, abutGeo, mats.get('stone'), 'BRIDGE_abutments');
}

/* ══ POI 注册 ═══════════════════════════════════════════════════════════ */

function registerPois(C) {
  const { layout, pois, stats } = C;
  if (!pois || typeof pois.add !== 'function') return;

  const add = (poi) => pois.add(poi);

  // 水体
  for (const w of layout.water || []) {
    add({
      id: w.id,
      name: w.name,
      category: '景观',
      zone: w.zone || null,
      type: 'area',
      position: [w.center[0], 0, w.center[1]],
      anchor: 'center',
      bbox: {
        min: [w.center[0] - w.rx, w.level || -0.5, w.center[1] - w.rz],
        max: [w.center[0] + w.rx, 0, w.center[1] + w.rz],
      },
      summary: w.id === 'CAMPUS_LAKE_01'
        ? '校园主水域，湖岸设浅滩护岸与环湖步道，湖心桥横跨水面'
        : '校园小型水塘，配植荷灌木与亲水矮墙，兼作雨水调蓄景观',
      tags: w.id === 'CAMPUS_LAKE_01' ? ['景观', '水体', '滨水', '主景'] : ['景观', '水体', '荷塘'],
      meta: {
        area: Math.round(Math.PI * w.rx * w.rz),
        rx: w.rx, rz: w.rz, depth: w.depth, level: w.level,
      },
    });
  }

  // 广场
  for (const p of layout.plazas || []) {
    add({
      id: p.id,
      name: p.name,
      category: '景观',
      zone: p.zone || null,
      type: 'area',
      position: [p.center[0], 0, p.center[1]],
      anchor: 'center',
      bbox: {
        min: [p.center[0] - p.w / 2, 0, p.center[1] - p.d / 2],
        max: [p.center[0] + p.w / 2, 0.2, p.center[1] + p.d / 2],
      },
      summary: p.id === 'CAMPUS_PLAZA_MAIN'
        ? '校园核心集散广场，正对图书馆与主轴大道，铺装石材并设台阶边界'
        : (p.id === 'CAMPUS_PLAZA_GATE'
          ? '校门前集散广场，衔接主轴景观大道与门卫值班区'
          : '体育馆前集散广场，连接场馆入口与东侧停车区'),
      tags: p.id === 'CAMPUS_PLAZA_MAIN' ? ['景观', '广场', '核心', '集散'] : ['景观', '广场', '集散'],
      meta: { area: Math.round(p.w * p.d), w: p.w, d: p.d },
    });
  }

  // 运动场地
  for (const c of layout.courts || []) {
    const isTrack = c.type === 'track';
    add({
      id: c.id,
      name: c.name,
      category: '运动',
      zone: c.zone || null,
      type: isTrack ? 'area' : 'facility',
      position: [c.center[0], 0, c.center[1]],
      anchor: 'center',
      bbox: {
        min: [c.center[0] - c.w / 2, 0, c.center[1] - c.d / 2],
        max: [c.center[0] + c.w / 2, 0.2, c.center[1] + c.d / 2],
      },
      summary: isTrack
        ? '标准田径场，含红色环形跑道与内场足球草坪'
        : (c.type === 'tennis' ? '硬地网球场，含边线与发球区标线' : '沥青篮球场，含边线、中线与限制区标线'),
      tags: isTrack ? ['运动', '田径', '足球'] : (c.type === 'tennis' ? ['运动', '网球'] : ['运动', '篮球']),
      meta: {
        area: Math.round(c.w * c.d), w: c.w, d: c.d,
        courtType: c.type, inner: c.inner || null, courts: c.courts || 1,
      },
    });
  }

  // 停车场
  for (const p of layout.parking || []) {
    add({
      id: p.id,
      name: p.name,
      category: '交通',
      zone: p.zone || null,
      type: 'facility',
      position: [p.center[0], 0, p.center[1]],
      anchor: 'ground',
      bbox: {
        min: [p.center[0] - p.w / 2, 0, p.center[1] - p.d / 2],
        max: [p.center[0] + p.w / 2, 0.1, p.center[1] + p.d / 2],
      },
      summary: `地面停车场，共 ${(p.rows || 0) * (p.cols || 0)} 个车位`,
      tags: ['交通', '停车'],
      meta: { area: Math.round(p.w * p.d), rows: p.rows, cols: p.cols, stalls: (p.rows || 0) * (p.cols || 0) },
    });
  }

  // 主轴道路
  const axis = (layout.roads || []).find((r) => r.id === 'RD_AXIS_MAIN');
  if (axis) {
    const pts = axis.points;
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      total += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    }
    let acc = 0;
    let mid = pts[0];
    for (let i = 0; i < pts.length - 1; i++) {
      const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      if (acc + l >= total / 2) {
        const t = (total / 2 - acc) / (l || 1);
        mid = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t];
        break;
      }
      acc += l;
    }
    add({
      id: axis.id,
      name: axis.name,
      category: '交通',
      type: 'facility',
      position: [mid[0], 0, mid[1]],
      anchor: 'ground',
      bbox: {
        min: [Math.min(...pts.map((p) => p[0])) - axis.width / 2, 0, Math.min(...pts.map((p) => p[1])) - axis.width / 2],
        max: [Math.max(...pts.map((p) => p[0])) + axis.width / 2, 0.2, Math.max(...pts.map((p) => p[1])) + axis.width / 2],
      },
      summary: '贯穿南北的校园主轴道路，联系南门、中心广场与教学区',
      tags: ['交通', '主轴', '道路'],
      meta: { length: Math.round(total), width: axis.width, roadType: axis.type },
    });
  }
}


/* ══ 路灯 ═══════════════════════════════════════════════════════════════ */

/**
 * 路灯参数。
 *
 * 布置规则：只沿车行道（main / secondary）双侧列植，步道不设路灯。
 * 间距按道路等级：主轴 32 m、干道 60 m、校门支路 40 m。
 * 灯杆立在路缘外 1.3 m 的绿化带内，不占车行面与步道。
 */
const LAMP = {
  height: 8.0,          // 灯杆高
  postRadius: 0.1,
  armLength: 1.7,       // 灯臂伸出长度
  headDrop: 0.24,       // 灯头低于杆顶
  setBack: 1.3,         // 灯杆距路缘外沿
  spacingMain: 32,
  spacingSecondary: 60,
  spacingBranch: 40,
  branchWidth: 6,       // 路宽不超过此值的次干路按支路间距
  poolRadius: 6.0,      // 地面光池半径
  poolY: 0.12,          // 光池离地高度（高于所有贴地面层）
  skipJunction: 7.0,    // 路口该半径内不设灯
  buildingClear: 1.0,   // 灯杆距建筑基底的最小净距
};

/** 沿折线按里程放样：返回 [{ x, z, ang }]，ang 为灯臂朝向（绕 Y 轴弧度）。 */
function layoutRoadLamps(road, spacing, off) {
  const pts = road.points;
  const out = [];
  let pending = spacing / 2; // 首盏灯的里程
  let traveled = 0;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const ax = pts[i][0], az = pts[i][1];
    const bx = pts[i + 1][0], bz = pts[i + 1][1];
    const dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz);
    if (len < 1e-6) continue;
    const ux = dx / len, uz = dz / len;
    const nx = -uz, nz = ux; // 左侧法线
    while (pending < traveled + len) {
      const t = pending - traveled;
      const px = ax + ux * t, pz = az + uz * t;
      for (const side of [1, -1]) {
        const lx = px + nx * off * side;
        const lz = pz + nz * off * side;
        // 灯臂朝路中心：局部 +X 指向 -side × 法线
        const ang = Math.atan2(side * nz, -side * nx);
        out.push({ x: lx, z: lz, ang });
      }
      pending += spacing;
    }
    traveled += len;
  }
  return out;
}

/** 灯杆是否落在建筑基底内（含净距）。 */
function lampBlockedByBuilding(buildings, x, z) {
  for (const b of buildings) {
    const p = b.position;
    const f = b.footprint;
    if (!p || !f) continue;
    const hx = f.w / 2 + LAMP.buildingClear;
    const hz = f.d / 2 + LAMP.buildingClear;
    if (Math.abs(x - p[0]) < hx && Math.abs(z - p[2]) < hz) return true;
  }
  return false;
}

/** 是否离路口过近。 */
function lampNearJunction(junctions, x, z) {
  for (const j of junctions) {
    if (Math.hypot(j[0] - x, j[1] - z) < LAMP.skipJunction) return true;
  }
  return false;
}

/** 最远点采样：在候选点里挑出空间上彼此拉开的一组。 */
function pickSpread(points, k) {
  if (!points.length || k <= 0) return [];
  const picked = [points[0]];
  const best = points.map(() => Infinity);
  while (picked.length < k) {
    let bi = -1, bd = -1;
    for (let i = 0; i < points.length; i += 1) {
      let m = Infinity;
      for (const p of picked) {
        const d = (points[i][0] - p[0]) ** 2 + (points[i][1] - p[1]) ** 2;
        if (d < m) m = d;
      }
      if (m > bd) { bd = m; bi = i; }
    }
    if (bi < 0) break;
    picked.push(points[bi]);
  }
  return picked;
}

/**
 * 路灯：沿车行道双侧列植。
 *
 * 4 个 InstancedMesh 承载全部路灯，共享同一套实例矩阵：
 *   LAMP_POST  灯杆 + 灯臂 + 灯头（metalDark）
 *   LAMP_LENS  灯罩朝下平面（lampLens，夜间自发光）
 *   LAMP_BULB  灯头处朝上辉光片（lampGlow，加法混合）
 *   LAMP_POOL  地面光池圆盘（lampGlow，加法混合，半径 7 m）
 *
 * 灯杆不投阴影（细杆在全场尺度上不足一个阴影贴图像素）。
 */
function buildStreetLamps(C) {
  const { THREE, layout, mats, group } = C;
  const roads = layout.roads || [];
  const buildings = layout.buildings || [];
  const junctions = findIntersections(roads).map((it) => it.point);

  const placed = [];
  for (const road of roads) {
    if (!road || road.type === 'path') continue;
    if (!road.points || road.points.length < 2) continue;
    const spacing = road.type === 'main'
      ? LAMP.spacingMain
      : (road.width <= LAMP.branchWidth ? LAMP.spacingBranch : LAMP.spacingSecondary);
    const off = road.width / 2 + LAMP.setBack;
    for (const p of layoutRoadLamps(road, spacing, off)) {
      if (lampBlockedByBuilding(buildings, p.x, p.z)) continue;
      if (lampNearJunction(junctions, p.x, p.z)) continue;
      placed.push(p);
    }
  }

  const count = placed.length;
  C.stats.lampCount = count;
  if (!count) return;

  /* ── 灯杆 + 灯臂 + 灯头（同一几何体，同一实例矩阵） ── */
  const post = new THREE.CylinderGeometry(LAMP.postRadius, LAMP.postRadius * 1.3, LAMP.height, 6, 1, true);
  post.translate(0, LAMP.height / 2, 0);
  const arm = new THREE.BoxGeometry(LAMP.armLength, 0.1, 0.1);
  arm.translate(LAMP.armLength / 2, LAMP.height - 0.14, 0);
  const head = new THREE.BoxGeometry(0.62, 0.16, 0.3);
  head.translate(LAMP.armLength - 0.22, LAMP.height - LAMP.headDrop, 0);
  const postSink = createSink();
  sinkAdd(postSink, post);
  sinkAdd(postSink, arm);
  const postGeo = sinkGeometry(THREE, postSink);

  /* ── 灯头 + 灯罩（朝下），整块用自发光材质，任意角度都看得见灯亮着 ── */
  const lens = new THREE.PlaneGeometry(0.46, 0.24);
  lens.rotateX(Math.PI / 2);
  lens.translate(LAMP.armLength - 0.22, LAMP.height - LAMP.headDrop - 0.09, 0);
  const headSink = createSink();
  sinkAdd(headSink, head);
  sinkAdd(headSink, lens);
  const headGeo = sinkGeometry(THREE, headSink);

  /* ── 灯头辉光（朝上） ── */
  const bulb = new THREE.CircleGeometry(0.42, 6);
  bulb.rotateX(-Math.PI / 2);
  bulb.translate(LAMP.armLength - 0.22, LAMP.height - LAMP.headDrop + 0.02, 0);

  /* ── 地面光池（朝上，半径 7 m） ── */
  const pool = new THREE.CircleGeometry(LAMP.poolRadius, 12);
  pool.rotateX(-Math.PI / 2);
  pool.translate(LAMP.armLength - 0.22, LAMP.poolY, 0);

  const make = (geo, material, name, order, receive) => {
    const im = new THREE.InstancedMesh(geo, material, count);
    im.name = name;
    im.castShadow = false;
    im.receiveShadow = receive;
    im.frustumCulled = false;
    if (order !== undefined) im.renderOrder = order;
    group.add(im);
    return im;
  };

  const postMesh = make(postGeo, mats.get('metalDark'), 'LAMP_POST', undefined, true);
  const lensMesh = make(headGeo, mats.get('lampLens'), 'LAMP_HEAD', undefined, false);
  const bulbMesh = make(bulb, mats.get('lampGlow'), 'LAMP_BULB', LAYER.lampPool + 1, false);
  const poolMesh = make(pool, mats.get('lampGlow'), 'LAMP_POOL', LAYER.lampPool, false);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i += 1) {
    const p = placed[i];
    pos.set(p.x, 0, p.z);
    q.setFromAxisAngle(up, p.ang);
    m.compose(pos, q, one);
    postMesh.setMatrixAt(i, m);
    lensMesh.setMatrixAt(i, m);
    bulbMesh.setMatrixAt(i, m);
    poolMesh.setMatrixAt(i, m);
  }
  for (const im of [postMesh, lensMesh, bulbMesh, poolMesh]) {
    im.instanceMatrix.needsUpdate = true;
    if (typeof im.computeBoundingSphere === 'function') im.computeBoundingSphere();
  }

  /* ── 供 app.js 摆放夜间点光源的位置（灯头高度） ── */
  const headY = LAMP.height - LAMP.headDrop;
  C.lampPositions = placed.map((p) => [p.x, headY, p.z]);
  C.lampLights = pickSpread(C.lampPositions, 8);
}

/* ══ 主入口 ═════════════════════════════════════════════════════════════ */

/**
 * 生成全部地形场地要素。
 * @param {{THREE:object, mat:Function, rng:Function, pois:object, layout:object, options:object}} ctx
 * @returns {{group:THREE.Group, stats:object}}
 */
export function buildTerrain(ctx) {
  if (!ctx || !ctx.THREE) throw new Error('[terrain] ctx 缺少 THREE');
  const { THREE, layout } = ctx;
  const options = ctx.options || {};
  const quality = options.quality || 'high';
  const seg = quality === 'low' ? 24 : quality === 'medium' ? 40 : 56;

  const group = new THREE.Group();
  group.name = 'CAMPUS_terrain';

  const C = {
    THREE,
    layout: layout || { site: {}, roads: [], buildings: [], water: [], courts: [], plazas: [], greenAreas: [], parking: [], bridges: [] },
    group,
    pois: ctx.pois,
    mats: createMatCache(THREE, ctx.mat, ctx.decal),
    rng: typeof ctx.rng === 'function' ? ctx.rng : () => 0.5,
    options,
    seg,
    stats: { roadLength: 0, roadArea: 0, waterArea: 0, plazaArea: 0, courtArea: 0, triangles: 0 },
  };

  buildGround(C);
  buildRoads(C);
  buildPlazas(C);
  buildCourts(C);
  buildWater(C);
  buildGreens(C);
  buildAgriField(C);
  buildParking(C);
  buildBridges(C);
  buildStreetLamps(C);
  registerPois(C);

  C.stats.triangles = countTriangles(group);
  return {
    group,
    stats: C.stats,
    lamps: {
      count: C.stats.lampCount,
      positions: C.lampPositions || [],
      lights: C.lampLights || [],
    },
  };
}

export default buildTerrain;
