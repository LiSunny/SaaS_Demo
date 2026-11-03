/**
 * electrical.js — 通用消防水泵房 · 控制柜 / 电缆桥架 / 标识牌
 *
 * ★ 归属：通用消防水泵房三维建模团队 · 控制柜电气师（唯一可写文件）
 * ★ 几何真值表：ctx.layout.cabinets（2 面控制柜）
 *              + ctx.layout.architecture.cableTray（主干 + 3 条支干）
 *              + ctx.layout.architecture.signage（房号牌 + 3 块泵标牌）
 *   所有世界坐标一律从 ctx.layout 读取，本文件不含任何世界坐标字面量。
 * ★ 材质：一律 ctx.mat(name)（CONTRACT 4.3 清单），本模块不 new 任何 MeshStandardMaterial。
 *   唯一例外说明：标牌 / 铭牌 / 按钮标签需要「每个文字内容一张贴图」，
 *   故文字层使用 ctx.mat('signText').clone() 后注入 Canvas 贴图（保留材质库的颜色、
 *   粗糙度、金属度，仅替换 map）；底板 / 柜体 / 指示灯等实体件全部直接取用库材质。
 * ★ 随机：ctx.rng()，禁止 Math.random()（用于表针角度等外观抖动）。
 * ★ 贴图：本模块自带的文字贴图全部用 Canvas 程序化绘制（零外部素材 / 零 CDN）。
 * ★ POI：ctx.pois.register('PR_' + cabinet.id, group)，不新增 POI id。
 *   兼容引擎别名 ctx.poiIndex.register（CONTRACT 4.5）。
 *
 * 坐标：+X 东 / +Z 北 / +Y 上，单位米，原点 = 房间地平面几何中心。
 *
 * 【坐标口径】
 *   · cabinets[].position 是二维 [x, z]（无高度）；柜底落在地坪面 room.floorY。
 *   · cabinets[].facing = 'north' → 柜门朝 +Z（朝房间内），柜门面 Z = z + depth/2。
 *   · cableTray / signage 的坐标字段全部是具名的世界坐标（x / y / z 或 xMin / xMax / z / y），
 *     直接取用，不做数组顺序换算。
 *
 * 【柜体局部坐标系】
 *   每面柜建在独立 Group 内，Group 原点 = 柜体底面中心在地面上的投影 (cab.x, 0, cab.z)；
 *   局部 +Z = 柜门朝向（north 时与世界 +Z 同向），局部 +Y = 世界 +Y。
 *   柜体后缘 Z = -depth/2 = -0.31（世界 -7.16），门框前沿 Z = +depth/2 = +0.31（世界 -6.54）。
 *
 * 【柜门构造：几何逐位等于 layout 声明的 PR_CABINET_* 包围盒】
 *   柜体前沿 Z = +0.265；门框为四周边框（宽 DOOR_BORDER = 0.05），前沿 Z = +0.31；
 *   中间仪表区为下沉面板，板面 Z = +0.28；仪表 / 按钮 / 指示灯 / 铭牌 / 文字装在 0.28 面板上（最前 0.323）；
 *   右侧边框装弓形拉手：握杆轴心 Z = 0.359，握杆前缘 Z = 0.370 → 世界 z = -6.48；
 *   左侧 3 只外露铰链：轴心 X = -(W/2 + HINGE_OUT - HINGE_R) = -0.499，铰链筒外缘 X = -0.510 → 世界 x = 柜x - 0.51；
 *   → 整柜世界包围盒 = [柜x-0.51, 0, 柜z-0.31] … [柜x+0.50, 2.10, 柜z+0.37]，
 *     与 layout.POI_LIST 的 PR_CABINET_01 / PR_CABINET_02 声明值逐位相等（偏差 0）。
 *
 * 【面板布局（局部 y 为离地绝对标高）】
 *   1.95  铭牌（文字 = layout.cabinets[].name）
 *   1.56  电流表 A / 电压表 V（表盘 + 指针）
 *   1.44  表计标签 A / V
 *   1.24  指示灯：运行（绿）/ 故障（本期「正常」→ 暗态）/ 停止（灰）
 *   1.16  指示灯标签
 *   0.98  控件：启动按钮（绿）/ 停止按钮（红）/ 转换开关 ×2（暗态）
 *   0.88  控件标签（文字 = layout.cabinets[].controls[]）
 *   1.05  右侧边框弓形拉手（y = 0.89 处为锁芯），左侧 3 只外露铰链。
 *
 * 【电缆桥架】
 *   主干沿南墙（Z = main.z），梯式型材：两侧边梁 + 横档。
 *   支干在分叉处对主干北侧边梁开「三通口」并让开横档，保证支干与主干真正连通。
 *   主干标高 = main.y（2.55 m，为桥架底面）；支干同高。
 *   主干范围取 layout.xMin/xMax 与各支干「支干宽」覆盖区的并集，
 *   确保最西侧支干（x = -6.0）也有主干托到，不出现悬空支干。
 *   托架：主干用南墙壁挂托架，支干用屋面梁吊杆（梁底 = beams.bottomY）。
 *   电缆：主干 3 根（2 根下引入控制柜顶、1 根沿主干东行）+ 每条支干 2 根，
 *   CatmullRom 曲线 + TubeGeometry；支干电缆下引至对应电机的接线盒格兰头处
 *   （电机几何按 layout.pumpGeometry + layout.pumps 推导，不引用其它模块内部常量）。
 *
 * 【网格命名】
 *   CAB_<id>_<部件>（id 取 layout.cabinets[].id，如 CAB_CABINET_01_DOOR）
 *   TRAY_<序号>（01 主干 / 02 主干西延段 / 03~05 支干 / 06+ 电缆与托架）
 *   SIGN_<序号>（01 房号牌 / 02~04 泵标牌）
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * 局部构件尺寸常量（单位 m；均为构件自身尺寸，不含世界坐标）
 * 按 CONTRACT 三、声明于文件头
 * ═══════════════════════════════════════════════════════════════════════════ */
const K = {
  /* ── 控制柜 ── */
  DOOR_T: 0.02,            // 柜门门框进深（门框前沿 − 柜体前沿）
  DOOR_GAP: 0.008,         // 门缝（门板四周与柜体之间的可见缝隙）
  DOOR_BORDER: 0.05,       // 门框边框宽（仪表区下沉面板四周的边框）
  RECESS: 0.045,           // 仪表区下沉深度（门框前沿 − 柜体前沿 − 门板厚）
  FIELD_T: 0.015,          // 下沉面板板厚
  BASE_INSET: 0.03,        // 底座相对柜体的收进量
  HINGE_R: 0.011,          // 铰链半径
  HINGE_H: 0.075,          // 铰链高
  HINGE_N: 3,              // 铰链数
  HINGE_OUT: 0.01,         // 铰链筒相对柜体侧面的外凸量（外露铰链）
  HANDLE_R: 0.011,         // 拉手握杆半径
  HANDLE_LEN: 0.15,        // 拉手握杆长度
  HANDLE_PROJ: 0.06,       // 拉手自门框前沿的外伸量（弓形拉手）
  HANDLE_ARM_R: 0.008,     // 拉手支臂半径
  LOCK_R: 0.016,           // 锁芯半径
  LOCK_H: 0.012,           // 锁芯厚
  METER_RIM_R: 0.092,      // 表计外圈半径
  METER_RIM_T: 0.012,      // 表计外圈厚
  METER_FACE_R: 0.08,      // 表盘半径
  NEEDLE_LEN: 0.062,       // 指针长度
  NEEDLE_W: 0.006,         // 指针宽
  NEEDLE_T: 0.003,         // 指针厚
  LAMP_R: 0.019,           // 指示灯灯芯半径
  LAMP_BEZEL_R: 0.026,     // 指示灯座圈半径
  LAMP_H: 0.012,           // 指示灯座圈高
  LAMP_LENS_H: 0.016,      // 指示灯灯芯高
  BTN_R: 0.019,            // 按钮帽半径
  BTN_BEZEL_R: 0.026,      // 按钮座圈半径
  BTN_H: 0.016,            // 按钮座圈高
  BTN_CAP_H: 0.021,        // 按钮帽高
  SEL_R: 0.021,            // 转换开关旋钮半径
  SEL_BEZEL_R: 0.03,       // 转换开关底座半径
  SEL_BASE_H: 0.018,       // 转换开关底座高
  SEL_KNOB_H: 0.02,        // 转换开关旋钮高
  NAMEPLATE_W: 0.4,        // 柜体铭牌宽
  NAMEPLATE_H: 0.09,       // 柜体铭牌高
  NAMEPLATE_T: 0.006,      // 柜体铭牌厚
  LABEL_T: 0.004,          // 小标签板厚
  LABEL_H: 0.026,          // 小标签板高
  LABEL_WIDE: 0.11,        // 4 字标签板宽
  LABEL_NARROW: 0.08,      // 2 字标签板宽
  /* ── 电缆桥架 ── */
  RAIL_H: 0.1,             // 边梁高
  RAIL_T: 0.008,           // 边梁厚
  RUNG_W: 0.03,            // 横档宽（沿走向）
  RUNG_T: 0.01,            // 横档厚
  RUNG_PITCH: 0.3,         // 横档间距
  CABLE_R: 0.013,          // 电缆半径
  CABLE_RADIAL_SEG: 6,     // 电缆管道环向分段
  HANGER_R: 0.006,         // 吊杆半径
  HANGER_CLAMP: 0.035,     // 吊杆夹具边长
  BRACKET_ARM: 0.045,      // 壁挂托架方管截面
  BRACKET_PLATE: 0.07,     // 壁挂托架底板宽
  BRACKET_PITCH: 1.8,      // 壁挂托架间距
  BRACE_H: 0.3,            // 托架斜撑高度
  /* ── 标识牌 ── */
  SIGN_T: 0.014,           // 标牌板厚
  SIGN_POST_R: 0.014,      // 标牌立柱半径
  SIGN_STANDOFF_R: 0.008,  // 房号牌墙面支座半径
  /* ── 文字贴图 ── */
  TEX_MAX: 256,            // 文字贴图长边上限
  FONT_STACK: '"PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif',
  SIGN_TEXT_COLOR: '#1b3a5c', // 与材质库 signText 同色
};

/** 质量档 → 圆周分段 */
const SEG = { high: 24, medium: 16, low: 10 };

/* ═══════════════════════════════════════════════════════════════════════════
 * Canvas 工具（无 DOM 环境下的空上下文兜底，与 core/materials.js 同一思路）
 * ═══════════════════════════════════════════════════════════════════════════ */

function createNullContext() {
  const noop = () => {};
  /** 无 DOM 环境下记录实际绘制的文字，供 Node 端自检断言文案 */
  const calls = [];
  const target = {
    canvas: null,
    calls,
    measureText: () => ({ width: 0 }),
    fillText: (t) => { calls.push(String(t)); },
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createPattern: () => null,
    getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
    setLineDash: noop,
  };
  return new Proxy(target, {
    get(t, k) {
      if (k in t) return t[k];
      if (typeof k === 'symbol') return undefined;
      return noop;
    },
    set(t, k, v) {
      t[k] = v;
      return true;
    },
  });
}

function makeCanvas(w, h) {
  const doc = typeof document !== 'undefined' ? document : null;
  if (doc && typeof doc.createElement === 'function') {
    const canvas = doc.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c2d = createNullContext();
  return { width: w, height: h, getContext: () => c2d, calls: c2d.calls };
}

/**
 * 在 Canvas 上绘制一行文字（水平居中），自动按画布宽高缩放字号。
 * @param {object} c 2D 上下文
 * @param {string} text 文字内容
 * @param {number} W 画布宽
 * @param {number} H 画布高
 * @param {string} color 文字颜色
 */
function drawCanvasText(c, text, W, H, color) {
  const pad = Math.max(2, Math.round(H * 0.1));
  let size = Math.max(6, H - pad * 2);
  const setFont = (s) => {
    size = Math.max(6, s);
    c.font = `${Math.round(size)}px ${K.FONT_STACK}`;
  };
  setFont(size);
  const measured = c.measureText(text);
  let w = measured && measured.width ? measured.width : text.length * size * 0.92;
  const maxW = W - pad * 2;
  if (w > maxW && w > 0) {
    setFont(size * (maxW / w));
    w = maxW;
  }
  c.clearRect(0, 0, W, H);
  c.fillStyle = color;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, W / 2, H / 2 + size * 0.04);
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 几何工具（与 ctx 无关的纯几何函数，可单独复用）
 * ═══════════════════════════════════════════════════════════════════════════ */

/** 轴对齐长方体图元（坐标直接给出） */
function boxPart(THREE, x0, x1, y0, y1, z0, z1) {
  return {
    geo: new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0),
    pos: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
  };
}

/** 圆柱图元：axis ∈ 'x' | 'y' | 'z' */
function cylPart(THREE, r, h, cx, cy, cz, axis, seg) {
  const rot = axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  return {
    geo: new THREE.CylinderGeometry(r, r, h, seg || 16, 1, false),
    pos: [cx, cy, cz],
    rot,
  };
}

/**
 * 两点之间的方管图元（托架斜撑用）。
 * @param {THREE} THREE
 * @param {number[]} p0 起点 [x,y,z]
 * @param {number[]} p1 终点 [x,y,z]
 * @param {number} w 截面宽
 * @param {number} h 截面高
 */
function strutPart(THREE, p0, p1, w, h) {
  const from = new THREE.Vector3(p0[0], p0[1], p0[2]);
  const to = new THREE.Vector3(p1[0], p1[1], p1[2]);
  const dir = to.clone().sub(from);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize(),
  );
  const e = new THREE.Euler().setFromQuaternion(q);
  return {
    geo: new THREE.BoxGeometry(w, len, h),
    pos: [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2],
    rot: [e.x, e.y, e.z],
  };
}

/**
 * 合并若干图元为单个 BufferGeometry（控制 draw call）。
 * @param {THREE} THREE
 * @param {Array} parts 图元数组（{geo, pos, rot?}）
 * @returns {THREE.BufferGeometry}
 */
function mergeParts(THREE, parts) {
  const list = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const one = new THREE.Vector3(1, 1, 1);

  for (const p of parts) {
    const src = p.geo;
    const g = src.index ? src.toNonIndexed() : src.clone();
    e.set(p.rot ? p.rot[0] : 0, p.rot ? p.rot[1] : 0, p.rot ? p.rot[2] : 0);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(p.pos[0], p.pos[1], p.pos[2]), q, one);
    g.applyMatrix4(m);
    src.dispose();
    list.push(g);
  }

  let count = 0;
  for (const g of list) count += g.attributes.position.count;

  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);

  let o = 0;
  for (const g of list) {
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
    o += g.attributes.position.count;
    g.dispose();
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.computeBoundingBox();
  out.computeBoundingSphere();
  return out;
}

/**
 * 电缆（CatmullRom 曲线 + TubeGeometry）。
 * @param {THREE} THREE
 * @param {Array} points 折点数组 [[x,y,z],...]
 * @param {number} r 半径
 * @returns {THREE.TubeGeometry}
 */
function cableTube(THREE, points, r) {
  const pts = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  const len = curve.getLength();
  const tubular = Math.max(8, Math.min(140, Math.round(len / 0.09)));
  return new THREE.TubeGeometry(curve, tubular, r, K.CABLE_RADIAL_SEG, false);
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 文字层（贴图 + 材质 + 平面），全部按「文字内容」缓存
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 取文字贴图（同一文字内容只生成一次）。
 * @param {THREE} THREE
 * @param {string} text 文字内容
 * @param {number} aspect 宽高比（宽 / 高）
 * @param {Map} cache 缓存
 */
function getTextTexture(THREE, text, aspect, cache) {
  const key = `${text}|${aspect.toFixed(3)}`;
  if (cache.has(key)) return cache.get(key);
  const W = K.TEX_MAX;
  const H = Math.max(8, Math.min(K.TEX_MAX, Math.round(K.TEX_MAX / Math.max(0.05, aspect))));
  const canvas = makeCanvas(W, H);
  const c = canvas.getContext('2d');
  drawCanvasText(c, text, W, H, K.SIGN_TEXT_COLOR);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  const entry = { texture, w: W, h: H };
  cache.set(key, entry);
  return entry;
}

/**
 * 取文字层材质：ctx.mat('signText') 的克隆 + Canvas 文字贴图。
 * 不 new 任何 MeshStandardMaterial —— 颜色 / 粗糙度 / 金属度全部继承材质库。
 * @param {object} ctx 见 CONTRACT 4.2
 * @param {object} local 本次构建的局部缓存 { texCache, matCache, disposables }
 * @param {string} text 文字内容
 * @param {number} aspect 宽高比（宽 / 高）
 * @returns {THREE.Material}
 */
function getTextMaterial(ctx, local, text, aspect) {
  const key = `${text}|${aspect.toFixed(3)}`;
  if (local.matCache.has(key)) return local.matCache.get(key);
  const base = ctx.mat('signText');
  const mat = base.clone();
  const tex = getTextTexture(ctx.THREE, text, aspect, local.texCache);
  mat.map = tex.texture;
  mat.color.set(0xffffff);          // 贴图自带颜色（#1b3a5c），材质色置白避免二次相乘
  mat.transparent = true;
  mat.alphaTest = 0.08;
  mat.depthWrite = false;
  mat.needsUpdate = true;
  local.matCache.set(key, mat);
  local.disposables.materials.push(mat);
  local.disposables.textures.push(tex.texture);
  return mat;
}

/**
 * 文字层平面（文字朝 +Z）。
 * @param {object} ctx
 * @param {object} local 本次构建的局部缓存
 * @param {string} text
 * @param {number} w 宽
 * @param {number} h 高
 * @returns {THREE.Mesh}
 */
function makeTextPlane(ctx, local, text, w, h) {
  const THREE = ctx.THREE;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    getTextMaterial(ctx, local, text, w / h),
  );
  mesh.name = `TEXT_${text}`;
  return mesh;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 1. 控制柜
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 构建单面控制柜（局部坐标：原点在柜底中心，+Z 为柜门朝向）。
 * @param {object} ctx 见 CONTRACT 4.2
 * @param {object} local 本次构建的局部缓存
 * @param {object} cab layout.cabinets 中的一条
 * @param {number} seg 圆周分段
 * @returns {THREE.Group}
 */
function buildCabinet(ctx, local, cab, seg) {
  const { THREE, mat } = ctx;
  const rnd = typeof ctx.rng === 'function' ? ctx.rng : () => 0.5;

  const W = cab.width;          // 1.00
  const D = cab.depth;          // 0.62
  const H = cab.height;         // 2.00
  const BH = cab.baseHeight;    // 0.10
  const dir = cab.facing === 'south' ? -1 : 1;   // facing='north' → 柜门朝 +Z

  const group = new THREE.Group();
  group.name = `CAB_${cab.id}`;

  const add = (geo, materialName, name) => {
    const mesh = new THREE.Mesh(geo, mat(materialName));
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  /* ── 柜体与底座（局部：X ±W/2，Y 0..BH+H，Z ±D/2，+Z 为门面）──────────── */
  const doorFace = dir * (D / 2);                    // 0.31 门框前沿
  const bodyFront = doorFace - dir * (K.RECESS);      // 0.265 柜体前沿
  const fieldFront = bodyFront + dir * K.FIELD_T;    // 0.28  仪表区下沉面板面
  const hw = W / 2;

  add(
    mergeParts(THREE, [
      boxPart(THREE, -hw, hw, BH, BH + H, -D / 2, bodyFront),
    ]),
    'cabinet',
    `CAB_${cab.id}_BODY`,
  );

  add(
    mergeParts(THREE, [
      boxPart(
        THREE,
        -hw + K.BASE_INSET, hw - K.BASE_INSET,
        0, BH,
        -D / 2 + K.BASE_INSET, D / 2 - K.BASE_INSET,
      ),
    ]),
    'cabinetBase',
    `CAB_${cab.id}_BASE`,
  );

  /* ── 柜门：门框（四周边框）+ 下沉仪表面板；门缝由 DOOR_GAP 留出 ────────── */
  const doorY0 = BH + K.DOOR_GAP;
  const doorY1 = BH + H - K.DOOR_GAP;
  const dx0 = -hw + K.DOOR_GAP;
  const dx1 = hw - K.DOOR_GAP;
  const fx0 = dx0 + K.DOOR_BORDER;
  const fx1 = dx1 - K.DOOR_BORDER;
  const fy0 = doorY0 + K.DOOR_BORDER;
  const fy1 = doorY1 - K.DOOR_BORDER;
  {
    const zA = Math.min(bodyFront, doorFace);
    const zB = Math.max(bodyFront, doorFace);
    const frame = [
      // 上边框
      boxPart(THREE, dx0, dx1, fy1, doorY1, zA, zB),
      // 下边框
      boxPart(THREE, dx0, dx1, doorY0, fy0, zA, zB),
      // 左边框
      boxPart(THREE, dx0, fx0, fy0, fy1, zA, zB),
      // 右边框
      boxPart(THREE, fx1, dx1, fy0, fy1, zA, zB),
      // 下沉仪表面板
      boxPart(THREE, dx0, dx1, doorY0, doorY1, zA, Math.min(bodyFront + dir * K.FIELD_T, zB)),
    ];
    add(mergeParts(THREE, frame), 'cabinetDoor', `CAB_${cab.id}_DOOR`);
  }

  /* ── 铰链（左侧 3 只外露铰链，铰链筒外凸于柜体侧面）───────────────────── */
  {
    const parts = [];
    // 轴心置于柜体侧面外侧 HINGE_OUT 处：铰链筒外缘 = -hw - HINGE_OUT = -0.51
    const hx = -(hw + K.HINGE_OUT - K.HINGE_R);
    const hz = bodyFront + dir * (K.DOOR_T / 2);
    for (let i = 0; i < K.HINGE_N; i++) {
      const hy = doorY0 + (doorY1 - doorY0) * ((i + 0.5) / K.HINGE_N);
      parts.push(cylPart(THREE, K.HINGE_R, K.HINGE_H, hx, hy, hz, 'y', seg));
    }
    add(mergeParts(THREE, parts), 'steelPipe', `CAB_${cab.id}_HINGE`);
  }

  /* ── 拉手（右侧边框弓形拉手）+ 锁芯 ─────────────────────────────────── */
  {
    const hx = hw - 0.035;                                   // 装于门框右侧边框带
    const hy = 1.05;
    const gripZ = doorFace + dir * (K.HANDLE_PROJ - K.HANDLE_R);   // 0.359
    const armLen = Math.abs(gripZ - doorFace);
    const parts = [];
    for (const dy of [-(K.HANDLE_LEN / 2 - 0.022), K.HANDLE_LEN / 2 - 0.022]) {
      parts.push(cylPart(THREE, K.HANDLE_ARM_R, armLen, hx, hy + dy, (doorFace + gripZ) / 2, 'z', seg));
    }
    parts.push(cylPart(THREE, K.HANDLE_R, K.HANDLE_LEN, hx, hy, gripZ, 'y', seg));
    parts.push(cylPart(THREE, K.LOCK_R, K.LOCK_H, hx, hy - 0.16, doorFace + dir * (K.LOCK_H / 2), 'z', seg));
    add(mergeParts(THREE, parts), 'steelPipe', `CAB_${cab.id}_HANDLE`);
  }

  /* ── 铭牌（柜体顶部，文字 = layout.cabinets[].name）──────────────────── */
  {
    const plateY = 1.95;
    const zPlate = fieldFront + dir * (K.NAMEPLATE_T / 2);
    add(
      mergeParts(THREE, [
        boxPart(
          THREE,
          -K.NAMEPLATE_W / 2, K.NAMEPLATE_W / 2,
          plateY - K.NAMEPLATE_H / 2, plateY + K.NAMEPLATE_H / 2,
          fieldFront, fieldFront + dir * K.NAMEPLATE_T,
        ),
      ]),
      'signPlate',
      `CAB_${cab.id}_NAMEPLATE`,
    );
    const txt = makeTextPlane(ctx, local, cab.name, K.NAMEPLATE_W - 0.02, K.NAMEPLATE_H - 0.016);
    txt.name = `CAB_${cab.id}_NAMEPLATE_TEXT`;
    txt.position.set(0, plateY, zPlate + dir * 0.0015);
    if (dir < 0) txt.rotation.y = Math.PI;
    group.add(txt);
  }

  /* ── 面板仪表：电流表 / 电压表（表盘 + 指针）─────────────────────────── */
  const meters = [
    { tag: 'A', x: -0.21, label: 'A' },
    { tag: 'V', x: 0.21, label: 'V' },
  ];
  const meterY = 1.56;
  {
    const rims = [];
    for (const m of meters) {
      rims.push(cylPart(
        THREE, K.METER_RIM_R, K.METER_RIM_T,
        m.x, meterY, fieldFront + dir * (K.METER_RIM_T / 2), 'z', seg,
      ));
    }
    add(mergeParts(THREE, rims), 'cabinetBase', `CAB_${cab.id}_METER_RIM`);
  }
  for (const m of meters) {
    const faceZ = fieldFront + dir * (K.METER_RIM_T + 0.001);
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(K.METER_FACE_R, seg),
      mat('signPlate'),
    );
    face.name = `CAB_${cab.id}_METER_${m.tag}_FACE`;
    face.position.set(m.x, meterY, faceZ);
    if (dir < 0) face.rotation.y = Math.PI;
    group.add(face);

    // 指针：角度取自 ctx.rng()（可复现）
    const angle = (-135 + rnd() * 90) * Math.PI / 180;
    const needle = new THREE.Mesh(
      new THREE.BoxGeometry(K.NEEDLE_W, K.NEEDLE_LEN, K.NEEDLE_T),
      mat('signText'),
    );
    needle.name = `CAB_${cab.id}_METER_${m.tag}_NEEDLE`;
    needle.position.set(
      m.x + Math.sin(angle) * (K.NEEDLE_LEN / 2),
      meterY + Math.cos(angle) * (K.NEEDLE_LEN / 2),
      faceZ + dir * (K.NEEDLE_T / 2 + 0.001),
    );
    needle.rotation.z = -angle;
    group.add(needle);
  }

  /* ── 表计标签 A / V ─────────────────────────────────────────────────── */
  for (const m of meters) {
    const t = makeTextPlane(ctx, local, m.label, K.LABEL_NARROW - 0.02, K.LABEL_H - 0.008);
    t.name = `CAB_${cab.id}_METER_${m.tag}_LABEL`;
    t.position.set(m.x, 1.44, fieldFront + dir * 0.002);
    if (dir < 0) t.rotation.y = Math.PI;
    group.add(t);
  }

  /* ── 指示灯：运行（绿）/ 故障（本期「正常」→ 暗态）/ 停止（灰）────────── */
  const ind = cab.indicator || {};
  const lamps = [
    {
      tag: 'RUN', label: ind.power || '运行', x: -0.27,
      lit: ind.power === '运行', onMat: 'indicatorOn',
    },
    {
      tag: 'FAULT', label: '故障', x: 0,
      lit: ind.fault === '故障' || ind.fault === '报警', onMat: 'indicatorFault',
    },
    { tag: 'STOP', label: '停止', x: 0.27, lit: false, onMat: 'indicatorOn' },
  ];
  {
    const bezels = [];
    for (const l of lamps) {
      bezels.push(cylPart(
        THREE, K.LAMP_BEZEL_R, K.LAMP_H,
        l.x, 1.24, fieldFront + dir * (K.LAMP_H / 2), 'z', seg,
      ));
    }
    add(mergeParts(THREE, bezels), 'cabinetBase', `CAB_${cab.id}_LAMP_BEZEL`);
  }
  for (const l of lamps) {
    const materialName = l.lit ? l.onMat : 'indicatorOff';
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(K.LAMP_R, K.LAMP_R, K.LAMP_LENS_H, seg),
      mat(materialName),
    );
    lens.name = `CAB_${cab.id}_LAMP_${l.tag}`;
    lens.rotation.x = Math.PI / 2;
    lens.position.set(l.x, 1.24, fieldFront + dir * (K.LAMP_LENS_H / 2 + 0.001));
    group.add(lens);

    const t = makeTextPlane(ctx, local, l.label, K.LABEL_NARROW - 0.02, K.LABEL_H - 0.008);
    t.name = `CAB_${cab.id}_LAMP_${l.tag}_LABEL`;
    t.position.set(l.x, 1.16, fieldFront + dir * 0.002);
    if (dir < 0) t.rotation.y = Math.PI;
    group.add(t);
  }

  /* ── 控件：启动（绿）/ 停止（红）/ 转换开关 ×2（暗态）─────────────────── */
  const controls = Array.isArray(cab.controls) ? cab.controls : [];
  const ctrl = [
    { idx: 0, kind: 'btn', mat: 'indicatorOn', x: -0.3 },
    { idx: 1, kind: 'btn', mat: 'indicatorFault', x: -0.12 },
    { idx: 2, kind: 'sel', mat: 'indicatorOff', x: 0.06 },
    { idx: 3, kind: 'sel', mat: 'indicatorOff', x: 0.24 },
  ];
  const ctrlY = 0.98;
  {
    const bezels = [];
    for (const c of ctrl) {
      const r = c.kind === 'btn' ? K.BTN_BEZEL_R : K.SEL_BEZEL_R;
      const h = c.kind === 'btn' ? K.BTN_H : K.SEL_BASE_H;
      bezels.push(cylPart(THREE, r, h, c.x, ctrlY, fieldFront + dir * (h / 2), 'z', seg));
    }
    add(mergeParts(THREE, bezels), 'cabinetBase', `CAB_${cab.id}_CTRL_BEZEL`);
  }
  for (const c of ctrl) {
    const text = controls[c.idx] || '';
    const baseH = c.kind === 'btn' ? K.BTN_H : K.SEL_BASE_H;
    const capH = c.kind === 'btn' ? K.BTN_CAP_H : K.SEL_KNOB_H;
    const capR = c.kind === 'btn' ? K.BTN_R : K.SEL_R;
    const zCap = fieldFront + dir * (baseH + capH / 2 + 0.001);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(capR, capR, capH, seg),
      mat(c.mat),
    );
    cap.name = `CAB_${cab.id}_CTRL_${c.idx + 1}`;
    cap.rotation.x = Math.PI / 2;
    cap.position.set(c.x, ctrlY, zCap);
    group.add(cap);

    if (c.kind === 'sel') {
      // 转换开关指针（深蓝），指示当前档位
      const ptr = new THREE.Mesh(
        new THREE.BoxGeometry(0.005, capR * 1.05, 0.004),
        mat('signText'),
      );
      ptr.name = `CAB_${cab.id}_CTRL_${c.idx + 1}_PTR`;
      ptr.position.set(c.x, ctrlY + capR * 0.42, zCap + dir * (capH / 2 + 0.002));
      group.add(ptr);
    }

    if (text) {
      const wide = text.length > 3;
      const lw = wide ? K.LABEL_WIDE : K.LABEL_NARROW;
      const t = makeTextPlane(ctx, local, text, lw - 0.018, K.LABEL_H - 0.008);
      t.name = `CAB_${cab.id}_CTRL_${c.idx + 1}_LABEL`;
      t.position.set(c.x, 0.88, fieldFront + dir * 0.002);
      if (dir < 0) t.rotation.y = Math.PI;
      group.add(t);
    }
  }

  return group;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 2.电缆桥架（梯式型材）
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 梯式桥架的一段（沿 X 走向）：南侧边梁（整段）+ 北侧边梁（按三通口断开）+ 横档。
 * @param {THREE} THREE
 * @param {number} x0 走向起点
 * @param {number} x1 走向终点
 * @param {number} z 横向中心
 * @param {number} y 桥架底面标高
 * @param {number} width 桥架宽
 * @param {Array} tees 三通口区间 [起点,终点]
 * @returns {Array} 图元数组
 */
function ladderAlongX(THREE, x0, x1, z, y, width, tees) {
  const parts = [];
  const half = width / 2;
  const t = K.RAIL_T;
  const zSouth = z - half + t / 2;
  const zNorth = z + half - t / 2;

  parts.push(boxPart(THREE, x0, x1, y, y + K.RAIL_H, zSouth - t / 2, zSouth + t / 2));

  // 北侧边梁：三通口处断开
  const sorted = tees.slice().sort((a, b) => a[0] - b[0]);
  let cursor = x0;
  for (const [s0, s1] of sorted) {
    if (s0 > cursor) {
      parts.push(boxPart(THREE, cursor, s0, y, y + K.RAIL_H, zNorth - t / 2, zNorth + t / 2));
    }
    cursor = Math.max(cursor, s1);
  }
  if (cursor < x1) {
    parts.push(boxPart(THREE, cursor, x1, y, y + K.RAIL_H, zNorth - t / 2, zNorth + t / 2));
  }

  // 横档：三通口让位
  const len = x1 - x0;
  const n = Math.max(1, Math.round(len / K.RUNG_PITCH));
  for (let i = 0; i <= n; i++) {
    const x = x0 + (len * i) / n;
    if (sorted.some(([s0, s1]) => x > s0 - 0.001 && x < s1 + 0.001)) continue;
    parts.push(boxPart(
      THREE, x - K.RUNG_W / 2, x + K.RUNG_W / 2,
      y, y + K.RUNG_T,
      z - half + t, z + half - t,
    ));
  }
  return parts;
}

/**
 * 梯式桥架的一段（沿 Z 走向）：两侧边梁 + 横档。
 * @param {THREE} THREE
 * @param {number} z0 走向起点
 * @param {number} z1 走向终点
 * @param {number} x 横向中心
 * @param {number} y 桥架底面标高
 * @param {number} width 桥架宽
 * @returns {Array} 图元数组
 */
function ladderAlongZ(THREE, z0, z1, x, y, width) {
  const parts = [];
  const half = width / 2;
  const t = K.RAIL_T;
  for (const side of [-1, 1]) {
    const cx = x + side * (half - t / 2);
    parts.push(boxPart(THREE, cx - t / 2, cx + t / 2, y, y + K.RAIL_H, z0, z1));
  }
  const len = z1 - z0;
  const n = Math.max(1, Math.round(len / K.RUNG_PITCH));
  for (let i = 0; i <= n; i++) {
    const z = z0 + (len * i) / n;
    parts.push(boxPart(
      THREE, x - half + t, x + half - t,
      y, y + K.RUNG_T,
      z - K.RUNG_W / 2, z + K.RUNG_W / 2,
    ));
  }
  return parts;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * 3. 主构建函数
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 构建控制柜、电缆桥架与标识牌。
 * @param {object} ctx 见 CONTRACT 4.2：{ THREE, mat, rng, pois, layout, options }
 * @returns {THREE.Group}
 */
export function buildElectrical(ctx) {
  const { THREE, mat, layout } = ctx;
  const group = new THREE.Group();
  group.name = 'ELECTRICAL_GROUP';

  const quality = (ctx.options && ctx.options.quality) || 'high';
  const seg = SEG[quality] || SEG.high;

  /** 本次构建的局部缓存（贴图 / 材质按文字内容复用） */
  const local = {
    texCache: new Map(),
    matCache: new Map(),
    disposables: { materials: [], textures: [] },
  };

  const arch = (layout && layout.architecture) || {};
  const room = (layout && layout.room) || {};
  const beams = (layout && layout.beams) || { zPositions: [], bottomY: room.clearHeight || 4 };
  const tray = arch.cableTray || {};
  const signage = arch.signage || {};
  const pumps = Array.isArray(layout && layout.pumps) ? layout.pumps : [];
  const pumpGeo = (layout && layout.pumpGeometry) || {};
  const floorY = room.floorY || 0;

  const add = (geo, materialName, name, parent) => {
    const mesh = new THREE.Mesh(geo, mat(materialName));
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    (parent || group).add(mesh);
    return mesh;
  };

  /* ═══════════════════════════════════════════════════════════════════════
   * 1. 控制柜（2 面）
   * ═══════════════════════════════════════════════════════════════════════ */
  const cabinets = Array.isArray(layout && layout.cabinets) ? layout.cabinets : [];
  for (const cab of cabinets) {
    const g = buildCabinet(ctx, local, cab, seg);
    g.position.set(cab.position[0], floorY, cab.position[1]);
    group.add(g);

    // POI 挂接：id = 'PR_' + layout.cabinets[].id，不新增 POI id
    const poiId = `PR_${cab.id}`;
    if (ctx.pois && typeof ctx.pois.register === 'function') ctx.pois.register(poiId, g);
    else if (ctx.poiIndex && typeof ctx.poiIndex.register === 'function') ctx.poiIndex.register(poiId, g);
  }

  /* ═══════════════════════════════════════════════════════════════════════
   * 2. 电缆桥架
   * ═══════════════════════════════════════════════════════════════════════ */
  const main = tray.main;
  const branches = Array.isArray(tray.branches) ? tray.branches : [];
  let traySeq = 0;
  const nextTrayName = (suffix) => {
    traySeq += 1;
    return `TRAY_${String(traySeq).padStart(2, '0')}${suffix ? `_${suffix}` : ''}`;
  };

  if (main) {
    const mainY = main.y;
    const mainZ = main.z;
    const mainW = main.width;

    // 主干实际范围 = layout.xMin/xMax 与各支干覆盖区的并集：
    // layout 的 main.xMin（-3.9）未覆盖最西侧支干（x = -6.0），
    // 若严格照搬会出现「悬空支干」，故按并集补出西延段
    // （端点仍全部取自 layout：main.xMin/xMax 与 branches[].x ± width/2）。
    const trunkX0 = branches.length
      ? Math.min(main.xMin, ...branches.map((b) => b.x - b.width / 2))
      : main.xMin;
    const trunkX1 = branches.length
      ? Math.max(main.xMax, ...branches.map((b) => b.x + b.width / 2))
      : main.xMax;

    // 落在该段内的支干 → 北侧边梁开三通口 + 横档让位
    const teesIn = (x0, x1) => branches
      .filter((b) => b.x + b.width / 2 > x0 && b.x - b.width / 2 < x1)
      .map((b) => [Math.max(x0, b.x - b.width / 2), Math.min(x1, b.x + b.width / 2)]);

    // ① 主干本体（layout 段）
    add(
      mergeParts(THREE, ladderAlongX(THREE, main.xMin, main.xMax, mainZ, mainY, mainW, teesIn(main.xMin, main.xMax))),
      'cableTray',
      nextTrayName('MAIN'),
    );

    // ② 主干西延段（承托最西侧支干）
    if (trunkX0 < main.xMin - 1e-6) {
      add(
        mergeParts(THREE, ladderAlongX(THREE, trunkX0, main.xMin, mainZ, mainY, mainW, teesIn(trunkX0, main.xMin))),
        'cableTray',
        nextTrayName('MAIN_EXT'),
      );
    }

    // ③ 支干（3 条）
    for (let i = 0; i < branches.length; i++) {
      const b = branches[i];
      add(
        mergeParts(THREE, ladderAlongZ(THREE, b.fromZ, b.toZ, b.x, b.y, b.width)),
        'cableTray',
        nextTrayName(`BRANCH_${String(i + 1).padStart(2, '0')}`),
      );
    }

    /* ── 主干电缆：2 根下引入控制柜顶 + 1 根沿主干东行 ─────────────────── */
    const cableY = mainY + K.RUNG_T + K.CABLE_R;
    {
      const xWest = trunkX0 + 0.06;
      const xEast = trunkX1 - 0.12;
      const tubes = [];

      const feeds = [
        { cab: cabinets[0], dz: -0.08 },
        { cab: cabinets[1], dz: 0.02 },
      ];
      for (const f of feeds) {
        if (!f.cab) continue;
        const z = mainZ + f.dz;
        const topY = f.cab.baseHeight + f.cab.height;
        tubes.push(cableTube(THREE, [
          [xWest, cableY, z],
          [f.cab.position[0] - 0.22, cableY, z],
          [f.cab.position[0], cableY, z],
          [f.cab.position[0], topY - 0.04, z],
        ], K.CABLE_R));
      }
      tubes.push(cableTube(THREE, [
        [xWest, cableY, mainZ + 0.12],
        [xEast, cableY, mainZ + 0.12],
      ], K.CABLE_R));

      add(
        mergeParts(THREE, tubes.map((g) => ({ geo: g, pos: [0, 0, 0] }))),
        'cable',
        nextTrayName('CABLE_TRUNK'),
      );
    }

    /* ── 支干电缆（2 根/支干）+ 下引至对应电机接线盒格兰头 ─────────────── */
    for (let i = 0; i < branches.length; i++) {
      const b = branches[i];
      const pump = pumps.find((p) => Math.abs(p.position[0] - b.x) < 1e-6);
      const bY = b.y + K.RUNG_T + K.CABLE_R;
      const tubes = [];

      // 电机几何：全部由 layout.pumpGeometry + layout.pumps 推导
      let motorCenterZ = null;
      let motorTopY = null;
      if (pump && pumpGeo.motor && pumpGeo.volute && pumpGeo.couplingGuard) {
        const voluteHalf = pumpGeo.volute.length / 2;
        const guardBack = -voluteHalf - pumpGeo.couplingGuard.length;
        const motorBack = guardBack - pumpGeo.motor.length;
        motorCenterZ = pump.position[1] + (motorBack + guardBack) / 2;
        motorTopY = pump.axisY + pumpGeo.motor.radius;
      }

      // 格兰头在电机接线盒 +X 侧；电缆自支干下引至该处
      const glandX = b.x + 0.145;
      const dropZ = motorCenterZ !== null ? motorCenterZ : b.toZ;
      const dropY = motorTopY !== null ? motorTopY + 0.03 : b.toZ;

      for (const off of [-0.05, 0.05]) {
        const x = glandX + off * 0.4;
        const pts = [
          [x, bY + 0.004, b.fromZ + 0.05],
          [x, bY + 0.004, dropZ + 0.15],
          [x, bY + 0.004, dropZ],
          [x, dropY, dropZ],
        ];
        if (motorTopY !== null) {
          pts.push([x, motorTopY + 0.02, dropZ]);
        }
        tubes.push(cableTube(THREE, pts, K.CABLE_R));
      }
      add(
        mergeParts(THREE, tubes.map((g) => ({ geo: g, pos: [0, 0, 0] }))),
        'cable',
        nextTrayName(`CABLE_BRANCH_${String(i + 1).padStart(2, '0')}`),
      );
    }

    /* ── 托架：主干南墙壁挂托架 ────────────────────────────────────────── */
    {
      const wallZ = room.bounds ? room.bounds.minZ : mainZ - 0.45;
      const door = arch.door || {};
      const armY = mainY - 0.03;
      const parts = [];
      const n = Math.max(2, Math.round((trunkX1 - trunkX0) / K.BRACKET_PITCH));
      for (let i = 0; i <= n; i++) {
        const x = trunkX0 + ((trunkX1 - trunkX0) * i) / n;
        // 避开门洞：门扇中心 ± 门宽的一半
        if (door.position && door.width) {
          const dx0 = door.position[0] - door.width / 2 - 0.2;
          const dx1 = door.position[0] + door.width / 2 + 0.2;
          if (x > dx0 && x < dx1) continue;
        }
        // 底板（贴墙）
        parts.push(boxPart(
          THREE, x - K.BRACKET_PLATE / 2, x + K.BRACKET_PLATE / 2,
          armY - 0.04, armY + K.BRACE_H,
          wallZ, wallZ + 0.012,
        ));
        // 水平托臂
        parts.push(boxPart(
          THREE, x - K.BRACKET_ARM / 2, x + K.BRACKET_ARM / 2,
          armY - K.BRACKET_ARM / 2, armY + K.BRACKET_ARM / 2,
          wallZ, mainZ + mainW / 2 - K.RAIL_T,
        ));
        // 斜撑
        parts.push(strutPart(
          THREE,
          [x, armY + K.BRACE_H - 0.02, wallZ + 0.012],
          [x, armY + K.BRACKET_ARM / 2, mainZ - 0.02],
          0.02, 0.02,
        ));
      }
      if (parts.length) add(mergeParts(THREE, parts), 'cableTray', nextTrayName('BRACKET_WALL'));
    }

    /* ── 托架：支干吊杆（吊至屋面梁底）────────────────────────────────── */
    {
      const parts = [];
      const beamZ = Array.isArray(beams.zPositions) ? beams.zPositions : [];
      const beamBottom = beams.bottomY !== undefined ? beams.bottomY : room.clearHeight;
      for (const b of branches) {
        for (const bz of beamZ) {
          if (bz <= b.fromZ + 0.2 || bz >= b.toZ - 0.2) continue;
          const topY = beamBottom;
          const railTop = b.y + K.RAIL_H;
          if (topY <= railTop) continue;
          for (const side of [-1, 1]) {
            const x = b.x + side * (b.width / 2 - K.RAIL_T / 2);
            parts.push(cylPart(THREE, K.HANGER_R, topY - railTop, x, (railTop + topY) / 2, bz, 'y', seg));
            parts.push(boxPart(
              THREE,
              x - K.HANGER_CLAMP / 2, x + K.HANGER_CLAMP / 2,
              railTop - 0.01, railTop + 0.03,
              bz - K.HANGER_CLAMP / 2, bz + K.HANGER_CLAMP / 2,
            ));
          }
        }
      }
      if (parts.length) add(mergeParts(THREE, parts), 'steelPipe', nextTrayName('HANGER'));
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
   * 3. 标识牌：房号牌 + 3 块泵标牌
   * ═══════════════════════════════════════════════════════════════════════ */
  let signSeq = 0;
  const nextSignName = (suffix) => {
    signSeq += 1;
    return `SIGN_${String(signSeq).padStart(2, '0')}${suffix ? `_${suffix}` : ''}`;
  };

  /* ── 房号牌（南墙门旁，朝 +Z 面向房间内）────────────────────────────── */
  const roomPlate = signage.roomPlate;
  if (roomPlate) {
    const g = new THREE.Group();
    g.name = nextSignName('ROOM_PLATE');
    g.position.set(roomPlate.x, roomPlate.y, roomPlate.z);

    const t = K.SIGN_T / 2;
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(roomPlate.width, roomPlate.height, K.SIGN_T),
      mat('signPlate'),
    );
    plate.name = `${g.name}_PLATE`;
    plate.castShadow = true;
    plate.receiveShadow = true;
    g.add(plate);

    const front = makeTextPlane(ctx, local, roomPlate.text, roomPlate.width - 0.03, roomPlate.height - 0.03);
    front.name = `${g.name}_TEXT_FRONT`;
    front.position.set(0, 0, t + 0.0015);
    g.add(front);

    const back = makeTextPlane(ctx, local, roomPlate.text, roomPlate.width - 0.03, roomPlate.height - 0.03);
    back.name = `${g.name}_TEXT_BACK`;
    back.position.set(0, 0, -(t + 0.0015));
    back.rotation.y = Math.PI;
    g.add(back);

    // 墙面支座：把标牌固定到南墙内表面
    const wallZ = room.bounds ? room.bounds.minZ : roomPlate.z - 0.14;
    const z0 = Math.min(wallZ, roomPlate.z - t);
    const z1 = Math.max(wallZ, roomPlate.z - t);
    const supports = [];
    for (const sx of [-roomPlate.width * 0.3, roomPlate.width * 0.3]) {
      supports.push(cylPart(
        THREE, K.SIGN_STANDOFF_R, z1 - z0,
        roomPlate.x + sx, roomPlate.y, (z0 + z1) / 2, 'z', seg,
      ));
    }
    const sup = new THREE.Mesh(mergeParts(THREE, supports), mat('steelPipe'));
    sup.name = `${g.name}_STANDOFF`;
    sup.castShadow = true;
    group.add(sup);

    group.add(g);
  }

  /* ── 泵标牌（3 块，双面可读，立柱支撑至机组底座）────────────────────── */
  const pumpPlates = Array.isArray(signage.pumpPlates) ? signage.pumpPlates : [];
  for (let i = 0; i < pumpPlates.length; i++) {
    const p = pumpPlates[i];
    const g = new THREE.Group();
    g.name = nextSignName(`PUMP_PLATE_${String(i + 1).padStart(2, '0')}`);
    g.position.set(p.x, p.y, p.z);

    const t = K.SIGN_T / 2;
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(p.width, p.height, K.SIGN_T),
      mat('signPlate'),
    );
    plate.name = `${g.name}_PLATE`;
    plate.castShadow = true;
    plate.receiveShadow = true;
    g.add(plate);

    const front = makeTextPlane(ctx, local, p.text, p.width - 0.025, p.height - 0.025);
    front.name = `${g.name}_TEXT_FRONT`;
    front.position.set(0, 0, t + 0.0015);
    g.add(front);

    const back = makeTextPlane(ctx, local, p.text, p.width - 0.025, p.height - 0.025);
    back.name = `${g.name}_TEXT_BACK`;
    back.position.set(0, 0, -(t + 0.0015));
    back.rotation.y = Math.PI;
    g.add(back);

    // 立柱：从机组混凝土底座顶面撑到标牌下沿
    const skidTop = pumpGeo.skid ? pumpGeo.skid.height : 0;
    const postBottom = skidTop;
    const postTop = p.y - p.height / 2;
    if (postTop > postBottom) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(K.SIGN_POST_R, K.SIGN_POST_R, postTop - postBottom, seg),
        mat('steelPipe'),
      );
      post.name = `${g.name}_POST`;
      post.position.set(p.x, (postBottom + postTop) / 2, p.z);
      post.castShadow = true;
      group.add(post);
    }

    group.add(g);
  }

  /* ── 释放句柄：宿主卸载场景时可释放本模块自建的文字材质与贴图 ───────── */
  group.userData.disposables = local.disposables;

  return group;
}

export default buildElectrical;
