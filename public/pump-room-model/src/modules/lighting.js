/**
 * lighting.js — 通用消防水泵房 · 室内照明（灯具几何 + 光源布置 + 运行时开关）
 *
 * ★ 归属：通用消防水泵房三维建模团队 · 泵房灯光师（唯一可写文件）
 * ★ 几何真值表：ctx.layout.lights
 *     mountingY  3.9    灯具安装标高（灯体顶面所在标高）
 *     xPositions [-8.5, -3.0, 3.0, 8.5]
 *     zPositions [1.2, -5.2]     二者笛卡尔积 = 8 盏
 *     fixture    { length 1.2, width 0.3, height 0.12 }
 *     source     { color '#FFF4E0', intensity 1.0, distance 14, decay 1.6 }
 *     emergency  { x 8.0, y 2.6, z -7.2, intensity 0.6 }（甲级防火门上方）
 *   所有世界坐标一律从 ctx.layout 读取，本文件不含任何世界坐标字面量。
 * ★ 材质：一律 ctx.mat(name)（CONTRACT 4.3：lampShell / lampGlow），不 new 任何材质。
 * ★ 随机：ctx.rng()，禁止 Math.random()。
 * ★ 贴图：本模块不生成贴图，全部材质来自材质库（Canvas 程序化生成，零外部素材 / 零 CDN）。
 * ★ POI：ctx.pois.register('PR_ROOM_01', group)，不新增 POI id。
 *
 * 坐标：+X 东 / +Z 北 / +Y 上，单位米，原点 = 房间地平面几何中心。
 *
 * 【坐标口径】
 *   · lights.mountingY 为灯体「顶面」标高；灯体向下生长 height，发光面再向下伸出。
 *   · lights.emergency 采用具名字段 x / y / z（不依赖 position 数组顺序）。
 *     layout 的 position 字段在对象级为 [x, z, y]，本模块只用具名字段，避免顺序误读。
 *
 * 【局部坐标系】
 *   每盏工矿灯建在独立 Group 内：Group 原点 = 灯具安装点 (x, mountingY, z)，
 *   局部 +Y 与世界 +Y 一致；吊杆由局部 y = 0 向上伸到顶棚面，灯体在局部 y ≤ 0 一侧。
 *
 * 【单盏工矿灯构造】
 *   1 灯体      lampShell。上宽下窄的矩形棱台（梯形收口），长轴沿 X。
 *   2 两端灯头  lampShell。位于长轴两端，各占 END_CAP_LEN，外形略大于灯体形成灯头轮廓。
 *   3 发光面    lampGlow（自发光）。位于灯体正下方，伸出灯体底面 GLOW_PROUD。
 *   4 吊杆      lampShell。半径 ROD_R 的圆杆，自灯体顶面升至顶棚面（吸顶工矿灯的吊装形式）。
 *   5 调节套    lampShell。吊杆下部套筒，表现可调吊装件。
 *   6 吸顶座    lampShell。贴顶棚面的安装底板（吊杆与顶棚的交接件）。
 *   7 点光源    THREE.PointLight。位于发光面下方 LIGHT_DROP 处，
 *               color / intensity / distance / decay 取自 layout.lights.source。
 *
 * 【应急照明】
 *   门上方小型应急灯具：灯体（lampShell）+ 下方发光面（lampGlow）+ 墙面支臂（lampShell）
 *   + 点光源（intensity 取自 layout.lights.emergency.intensity；
 *     真值表未给 distance / decay，沿用同一照明系统 source 的值）。
 *   支臂长度 = 灯具背面到所在墙面内表面（layout.room.bounds.minZ / maxZ）的实测距离，
 *   保证灯具实际贴附在门头墙面上而非悬空。
 *
 * 【网格命名】LIGHT_<序号>_<部件>，序号自 01 起；应急照明 LIGHT_EMERGENCY_<部件>
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * 局部构件尺寸常量（单位 m；均为构件自身尺寸，不含世界坐标）
 * 按 CONTRACT 三、声明于文件头
 * ═══════════════════════════════════════════════════════════════════════════ */
const K = {
  /* ── 工矿灯本体 ── */
  END_CAP_LEN: 0.05,      // 单端灯头长度（X 向）
  END_CAP_W_PROUD: 0.02,  // 灯头相对灯体单侧宽出量（Z 向）
  END_CAP_H_PROUD: 0.005, // 灯头相对灯体单侧高出量（Y 向）
  BODY_TAPER: 0.92,       // 灯体底面 / 顶面 尺寸比（上宽下窄的收口）
  GLOW_PROUD: 0.02,       // 发光面伸出灯体底面的高度
  GLOW_THICK: 0.025,      // 发光面板厚
  GLOW_INSET: 0.02,       // 发光面相对灯体底面单侧内缩

  /* ── 吊装件 ── */
  ROD_R: 0.022,           // 吊杆半径
  SLEEVE_R: 0.032,        // 吊杆调节套半径
  SLEEVE_LEN: 0.12,       // 调节套长
  SLEEVE_BASE: 0.10,      // 调节套底端距灯体顶面的高度
  BASE_PLATE_X: 0.22,     // 吸顶座长（X）
  BASE_PLATE_Z: 0.16,     // 吸顶座宽（Z）
  BASE_PLATE_T: 0.025,    // 吸顶座厚

  /* ── 点光源 ── */
  LIGHT_DROP: 0.03,       // 点光源位于发光面下方的距离

  /* ── 应急照明 ── */
  EMG_W: 0.36,            // 应急灯体长（X）
  EMG_H: 0.16,            // 应急灯体高（Y）
  EMG_D: 0.12,            // 应急灯体进深（Z）
  EMG_GLOW_W: 0.30,       // 应急发光面长（X）
  EMG_GLOW_D: 0.09,       // 应急发光面宽（Z）
  EMG_GLOW_T: 0.025,      // 应急发光面厚
  EMG_GLOW_PROUD: 0.01,   // 应急发光面伸出灯体底面的高度
  EMG_BRACKET: 0.06,      // 墙面支臂截面
  EMG_LIGHT_DROP: 0.04,   // 应急点光源低于发光面底面的距离
  EMG_LIGHT_OUT: 0.08,    // 应急点光源朝向房间内侧的偏移
};

/** 圆周分段（按画质档位），仅用于圆柱件（吊杆 / 调节套） */
const SEG_ROD = { high: 16, medium: 12, low: 8 };

/** 最近一次构建的照明控制器，供模块级 setLightingOn() 使用 */
let activeLighting = null;

/* ── 内部工具 ──────────────────────────────────────────────────────────── */

/**
 * 生成「上宽下窄」的矩形棱台几何体（灯体）。
 * 用 4 段圆柱 + thetaStart=π/4 构造轴对齐方形截面，再沿 Z 压扁成矩形，
 * 从而在保持 three.js 标准 UV / 法线的前提下得到矩形收口外形。
 *
 * @param {object} THREE three.js 模块
 * @param {number} topHx 顶面 X 向半长
 * @param {number} topHz 顶面 Z 向半宽
 * @param {number} botHx 底面 X 向半长
 * @param {number} botHz 底面 Z 向半宽
 * @param {number} height 高（局部 y 从 -height 到 0，顶面落在 y = 0）
 * @returns {THREE.BufferGeometry}
 */
function taperedPrism(THREE, topHx, topHz, botHx, botHz, height) {
  // 正方形截面半边长 = r / √2  →  r = 半边长 × √2
  const geo = new THREE.CylinderGeometry(
    Math.SQRT2 * topHx,
    Math.SQRT2 * botHx,
    height,
    4,
    1,
    false,
    Math.PI / 4,
  );
  geo.scale(1, 1, topHz / topHx);   // Z 向压扁为矩形截面（同时把底面收口比带下去）
  geo.translate(0, -height / 2, 0); // 顶面落在局部 y = 0，灯体向下生长
  geo.computeBoundingBox();
  return geo;
}

/**
 * 取一个具名坐标对象的三维坐标，优先用具名字段。
 * @param {object} obj
 * @param {number} fallbackY
 * @returns {{x:number,y:number,z:number}}
 */
function namedPos(obj, fallbackY) {
  if (!obj) return { x: 0, y: fallbackY, z: 0 };
  const hasNamed = typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.z === 'number';
  if (hasNamed) return { x: obj.x, y: obj.y, z: obj.z };
  // 兜底：position 数组按对象级 [x, z, y] 解读
  const p = Array.isArray(obj.position) ? obj.position : [];
  return {
    x: typeof p[0] === 'number' ? p[0] : 0,
    y: typeof p[2] === 'number' ? p[2] : fallbackY,
    z: typeof p[1] === 'number' ? p[1] : 0,
  };
}

/* ── 工矿灯构建 ────────────────────────────────────────────────────────── */

/**
 * 构建单盏 LED 工矿灯（灯体 + 两端灯头 + 发光面 + 吊杆 + 吸顶座 + 点光源）。
 *
 * @param {object} ctx 见 CONTRACT 4.2
 * @param {object} fx  灯具参数 { x, z, mountingY, fixture, source, soffitY, seg }
 * @param {number} seq 序号（用于网格命名）
 * @returns {{group: THREE.Group, light: THREE.PointLight, glow: THREE.Mesh}}
 */
function buildFixture(ctx, fx, seq) {
  const { THREE, mat } = ctx;
  const { x, z, mountingY, fixture, source, soffitY, seg } = fx;

  const group = new THREE.Group();
  group.name = `LIGHT_${String(seq).padStart(2, '0')}`;

  const bodyLen = fixture.length - 2 * K.END_CAP_LEN;
  const bodyWid = fixture.width;
  const bodyH = fixture.height;
  const topHx = bodyLen / 2;
  const topHz = bodyWid / 2;
  const botHx = topHx * K.BODY_TAPER;
  const botHz = topHz * K.BODY_TAPER;

  const tag = `LIGHT_${String(seq).padStart(2, '0')}`;
  const add = (geo, materialName, name, local) => {
    const mesh = new THREE.Mesh(geo, mat(materialName));
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (local) mesh.position.set(local[0], local[1], local[2]);
    group.add(mesh);
    return mesh;
  };

  /* 1 灯体：上宽下窄矩形棱台，长轴沿 X */
  add(
    taperedPrism(THREE, topHx, topHz, botHx, botHz, bodyH),
    'lampShell',
    `${tag}_BODY`,
    [0, 0, 0],
  );

  /* 2 两端灯头：位于长轴两端，外形略大于灯体 */
  const capH = bodyH + 2 * K.END_CAP_H_PROUD;
  const capW = bodyWid + 2 * K.END_CAP_W_PROUD;
  const capX = bodyLen / 2 + K.END_CAP_LEN / 2;
  add(
    new THREE.BoxGeometry(K.END_CAP_LEN, capH, capW),
    'lampShell',
    `${tag}_CAP_W`,
    [-capX, -bodyH / 2, 0],
  );
  add(
    new THREE.BoxGeometry(K.END_CAP_LEN, capH, capW),
    'lampShell',
    `${tag}_CAP_E`,
    [capX, -bodyH / 2, 0],
  );

  /* 3 发光面：灯体正下方。
     底面低于灯体底面 GLOW_PROUD（可见的自发光面），顶面嵌入灯体 5 mm
     （GLOW_THICK 0.025 > GLOW_PROUD 0.02），既不与灯体底面共面也不留缝。 */
  const glow = add(
    new THREE.BoxGeometry(
      Math.max(0.05, botHx * 2 - 2 * K.GLOW_INSET),
      K.GLOW_THICK,
      Math.max(0.05, botHz * 2 - 2 * K.GLOW_INSET),
    ),
    'lampGlow',
    `${tag}_GLOW`,
    [0, -(bodyH + K.GLOW_PROUD) + K.GLOW_THICK / 2, 0],
  );

  /* 4 吊杆：自灯体顶面（局部 y=0）升至顶棚面 */
  const rodLen = Math.max(0.01, soffitY - mountingY);
  add(
    new THREE.CylinderGeometry(K.ROD_R, K.ROD_R, rodLen, seg),
    'lampShell',
    `${tag}_ROD`,
    [0, rodLen / 2, 0],
  );

  /* 5 调节套：吊杆下部套筒 */
  add(
    new THREE.CylinderGeometry(K.SLEEVE_R, K.SLEEVE_R, K.SLEEVE_LEN, seg),
    'lampShell',
    `${tag}_SLEEVE`,
    [0, K.SLEEVE_BASE + K.SLEEVE_LEN / 2, 0],
  );

  /* 6 吸顶座：贴顶棚面的安装底板 */
  add(
    new THREE.BoxGeometry(K.BASE_PLATE_X, K.BASE_PLATE_T, K.BASE_PLATE_Z),
    'lampShell',
    `${tag}_BASE`,
    [0, rodLen - K.BASE_PLATE_T / 2, 0],
  );

  /* 7 点光源：位于发光面底面下方 LIGHT_DROP（发光面底面标高 = -(bodyH + GLOW_PROUD)） */
  const light = new THREE.PointLight(
    source.color,
    source.intensity,
    source.distance,
    source.decay,
  );
  light.name = `${tag}_LIGHT`;
  light.position.set(0, -(bodyH + K.GLOW_PROUD) - K.LIGHT_DROP, 0);
  light.castShadow = false;   // 9 盏点光全部投影会放大阴影贴图开销，形体表现依赖主光与补光
  group.add(light);

  /* 组装到世界坐标：Group 原点 = 灯具安装点 */
  group.position.set(x, mountingY, z);
  return { group, light, glow };
}

/* ── 应急照明构建 ──────────────────────────────────────────────────────── */

/**
 * 构建甲级防火门上方的应急照明灯具 + 点光源。
 *
 * @param {object} ctx 见 CONTRACT 4.2
 * @param {object} em 应急参数 { x, y, z, intensity, color, distance, decay, wallZ, seg }
 * @returns {{group: THREE.Group, light: THREE.PointLight, glow: THREE.Mesh}}
 */
function buildEmergency(ctx, em) {
  const { THREE, mat } = ctx;
  const { x, y, z, intensity, color, distance, decay, wallZ, seg } = em;

  const group = new THREE.Group();
  group.name = 'LIGHT_EMERGENCY';

  const add = (geo, materialName, name, local) => {
    const mesh = new THREE.Mesh(geo, mat(materialName));
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (local) mesh.position.set(local[0], local[1], local[2]);
    group.add(mesh);
    return mesh;
  };

  /* 灯体 */
  add(
    new THREE.BoxGeometry(K.EMG_W, K.EMG_H, K.EMG_D),
    'lampShell',
    'LIGHT_EMERGENCY_BODY',
    [0, 0, 0],
  );

  /* 下方发光面：底面低于灯体底面 EMG_GLOW_PROUD，顶面嵌入灯体（不共面、不留缝） */
  const glow = add(
    new THREE.BoxGeometry(K.EMG_GLOW_W, K.EMG_GLOW_T, K.EMG_GLOW_D),
    'lampGlow',
    'LIGHT_EMERGENCY_GLOW',
    [0, -(K.EMG_H / 2 + K.EMG_GLOW_PROUD) + K.EMG_GLOW_T / 2, 0],
  );

  /* 墙面支臂：由灯具背面连到所在墙面内表面，保证灯具贴墙不悬空 */
  const backZ = z - K.EMG_D / 2;
  const bracketLen = backZ - wallZ;
  if (bracketLen > 0.005) {
    add(
      new THREE.BoxGeometry(K.EMG_BRACKET, K.EMG_BRACKET, bracketLen),
      'lampShell',
      'LIGHT_EMERGENCY_BRACKET',
      [0, 0, wallZ + bracketLen / 2 - z],
    );
  }

  /* 点光源：低于发光面、朝房间内侧。
     真值表未给应急灯的 distance / decay，取同一照明系统 source 的值（与 8 盏主灯衰减一致）。 */
  const inward = z < 0 ? 1 : -1;   // 朝房间几何中心方向
  const light = new THREE.PointLight(color, intensity, distance, decay);
  light.name = 'LIGHT_EMERGENCY_LIGHT';
  light.position.set(0, -(K.EMG_H / 2 + K.EMG_GLOW_PROUD) - K.EMG_LIGHT_DROP, inward * K.EMG_LIGHT_OUT);
  light.castShadow = false;
  group.add(light);

  group.position.set(x, y, z);
  return { group, light, glow };
}

/* ── 模块入口 ──────────────────────────────────────────────────────────── */

/**
 * 构建泵房全部室内照明（8 盏工矿灯 + 应急照明）。
 *
 * @param {object} ctx 见 CONTRACT 4.2：{ THREE, mat, rng, pois, layout, options }
 * @returns {{group: THREE.Group, setOn: (enabled: boolean) => boolean, lights: THREE.PointLight[], fixtures: THREE.Group[]}}
 */
export function buildLighting(ctx) {
  const { THREE, mat, layout } = ctx;
  const group = new THREE.Group();
  group.name = 'LIGHTING_GROUP';

  const lights = layout && layout.lights ? layout.lights : null;
  if (!lights) {
    console.warn('[lighting] layout.lights 缺失，未生成照明');
    return { group, setOn: () => false, lights: [], fixtures: [] };
  }

  const quality = (ctx.options && ctx.options.quality) || 'high';
  const seg = SEG_ROD[quality] || SEG_ROD.high;

  const room = (layout && layout.room) || {};
  const bounds = room.bounds || { minZ: -7.5, maxZ: 7.5, minX: -12, maxX: 12 };
  /** 顶棚面（屋面板下表面）标高 = 吊杆顶端 */
  const soffitY = typeof room.totalHeight === 'number' ? room.totalHeight : 4.0;
  const mountingY = typeof lights.mountingY === 'number' ? lights.mountingY : soffitY;
  const fixture = lights.fixture || { length: 1.2, width: 0.3, height: 0.12 };
  const source = lights.source || { color: '#FFF4E0', intensity: 1.0, distance: 14, decay: 1.6 };

  const xPositions = Array.isArray(lights.xPositions) ? lights.xPositions : [];
  const zPositions = Array.isArray(lights.zPositions) ? lights.zPositions : [];

  /** 点光源登记表：{ light, base } —— base 为启用时的目标强度 */
  const lightItems = [];
  const fixtures = [];

  /* ── 1. 8 盏 LED 工矿灯（xPositions × zPositions 笛卡尔积）─────────── */
  let seq = 0;
  for (const z of zPositions) {
    for (const x of xPositions) {
      seq += 1;
      const fx = buildFixture(ctx, { x, z, mountingY, fixture, source, soffitY, seg }, seq);
      group.add(fx.group);
      fixtures.push(fx.group);
      lightItems.push({ light: fx.light, base: source.intensity });
    }
  }

  /* ── 2. 应急照明（甲级防火门上方）──────────────────────────────────── */
  const emergency = lights.emergency ? lights.emergency : null;
  if (emergency) {
    const ep = namedPos(emergency, mountingY);
    // 应急灯所在墙面：取 z 方向更近的一侧内表面
    const wallZ = ep.z < (bounds.minZ + bounds.maxZ) / 2 ? bounds.minZ : bounds.maxZ;
    const em = {
      x: ep.x,
      y: ep.y,
      z: ep.z,
      intensity: typeof emergency.intensity === 'number' ? emergency.intensity : 0.6,
      color: source.color,
      distance: source.distance,
      decay: source.decay,
      wallZ,
      seg,
    };
    const emf = buildEmergency(ctx, em);
    group.add(emf.group);
    fixtures.push(emf.group);
    lightItems.push({ light: emf.light, base: em.intensity });
  }

  /* ── 3. 开关接口 ───────────────────────────────────────────────────── */
  /** 发光面材质（材质库中 lampGlow 为全场景共享实例，改动即作用于全部灯具） */
  const glowMaterial = mat('lampGlow');
  const baseEmissive = glowMaterial && typeof glowMaterial.emissiveIntensity === 'number'
    ? glowMaterial.emissiveIntensity
    : 0;

  /**
   * 运行时开 / 关灯。
   * @param {boolean} enabled true = 开启（恢复 source / emergency 的强度与自发光）；false = 关闭
   * @returns {boolean} 当前是否处于开启状态
   */
  function setOn(enabled) {
    const on = enabled === undefined ? true : Boolean(enabled);
    for (const item of lightItems) {
      item.light.intensity = on ? item.base : 0;
    }
    if (glowMaterial) {
      glowMaterial.emissiveIntensity = on ? baseEmissive : 0;
    }
    return on;
  }

  /* POI 挂接：灯具属于房间本体，挂到已有的 PR_ROOM_01，不新增 POI id */
  if (ctx.pois && typeof ctx.pois.register === 'function') ctx.pois.register('PR_ROOM_01', group);
  else if (ctx.poiIndex && typeof ctx.poiIndex.register === 'function') ctx.poiIndex.register('PR_ROOM_01', group);

  activeLighting = { group, setOn, lights: lightItems.map((i) => i.light), fixtures };

  return {
    group,
    setOn,
    lights: lightItems.map((i) => i.light),
    fixtures,
  };
}

/**
 * 模块级全局开关（CONTRACT 6.1 可选导出）：作用于最近一次 buildLighting 的结果。
 * @param {boolean} state true = 开灯
 * @returns {boolean} 当前是否处于开启状态
 */
export function setLightingOn(state) {
  if (!activeLighting) return false;
  return activeLighting.setOn(state);
}

export default buildLighting;
