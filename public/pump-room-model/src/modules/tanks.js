/**
 * tanks.js — 立式钢制消防水罐模块
 *
 * ★ 归属：通用消防水泵房三维建模团队 · 水罐师（唯一可写文件）
 * ★ 几何真值表：ctx.layout.tanks（2 座）。位置与尺寸一律从 layout 读取，
 *   本文件内不出现任何世界坐标字面量。
 * ★ 材质：一律 ctx.mat(name) 取用（CONTRACT 4.3 材质清单），不私自 new MeshStandardMaterial。
 * ★ 随机：ctx.rng()，禁止 Math.random()。
 * ★ 贴图：本模块不生成贴图，全部材质来自材质库（Canvas 程序化生成，零外部素材）。
 * ★ POI：ctx.pois.register('PR_' + tank.id, group)，不新增 POI id。
 *
 * 坐标：+X 东 / +Z 北 / +Y 上，单位米。
 *
 * 【layout.tanks 的坐标口径】※ 与 layout.js 其余章节不同，务必注意
 *   - tank.center            = [x, z]（平面中心）
 *   - tank.outlet.position   = [x, z, y]  ← 出水口轴线点：z=2.0 即罐壁南侧，y=0.85 与
 *                                layout.pipes.tankOutletPipe.y 一致
 *   - tank.manhole.position  = [x, z, y]  ← z=4.6 为罐中心 z，y=3.92 为锥盖顶点标高
 *   - tank.vent.position     = [x, z, y]
 *   - tank.levelGauge.position = [x, z, y] ← z=1.94 为罐壁外侧（壁厚 0.06 外皮）
 *   - tank.ladder.position   = [x, z, y]  ← y=0 为地面
 *   - tank.drain.position    = [x, z, y]
 *   判据：若把 [x, z, y] 误读为 [x, y, z]，人孔会出现 y=4.6（高于锥盖）、
 *   爬梯会落在罐中心，均与常识矛盾，故口径确定为 [x, z, y]。
 *
 * 【局部坐标系】
 *   每座罐建在独立 Group 内：Group 原点 = 基座顶面中心 = (center.x, baseY, center.z)，
 *   局部 +Y 与世界 +Y 一致；layout 给出的世界坐标在装配时统一减去 Group 原点。
 *
 * 【罐体构造】（自下而上）
 *   1 混凝土基座      skid 材质，高 = baseY
 *   2 筒体            steelTank 材质，钢板外径 PLATE_R，内径 PLATE_R - wallThickness，
 *                     含 3 道环向加强箍（外缘 = layout 的 radius，构成罐体外廓）
 *   3 锥形顶盖        steelTank，锥盖高 = roofHeight，顶点标高 = baseY + height + roofHeight
 *   4 检修人孔        盖板顶面与锥盖顶点齐平
 *   5 呼吸阀          顶帽顶面标高 = layout 的 vent.position.y
 *   6 液位计          立管（中心标高 = layout 的 levelGauge.position.y，高 = height）
 *                     + 上下取压管（穿入筒壁）
 *   7 检修爬梯        立柱 ×2 + 横档
 *   8 出水口          短管（加强接管）+ 法兰 + 螺栓，朝向严格按 outlet.direction
 *   9 罐底泄水管      DN80，罐内集污口 → 弯头 → 下穿罐底与基座落地（整体位于罐体外廓之内）
 *  10 罐内水面        water 材质，置于筒体内部
 *
 * 【网格命名】TANK_<id>_<部件>，id 取 layout 的 tank.id（如 TANK_01_SHELL）
 */

/* ── 局部几何常量（不来自 layout.js 的尺寸；按 CONTRACT 三、声明于文件头）───────── */

/** 环向加强箍相对筒体钢板外径的外凸量（使加强箍外缘恰为 layout 的 radius） */
const BAND_PROUD = 0.05;
/** 环向加强箍道数 */
const BAND_COUNT = 3;
/** 加强箍直段高度 */
const BAND_FLAT = 0.12;
/** 加强箍上下斜坡高度 */
const BAND_RAMP = 0.035;
/** 罐内水面标高占筒体高的比例 */
const WATER_RATIO = 0.8;
/** 水面标高的随机浮动范围（米） */
const WATER_JITTER = 0.06;

/** 法兰厚度 */
const FLANGE_T = 0.045;
/** 法兰螺栓数 / 螺栓杆半径 / 螺栓头半径 / 螺栓头厚度 */
const BOLT_N = 8;
const BOLT_R = 0.016;
const BOLT_HEAD_R = 0.026;
const BOLT_HEAD_T = 0.018;
/** 螺栓中心圆半径（相对法兰半径的比例） */
const BOLT_CIRCLE_RATIO = 0.85;

/** 出水口加强短管外半径 / 伸出长度 */
const NOZZLE_R = 0.125;
const NOZZLE_LEN = 0.16;

/** 液位计取压管半径 / 伸入筒壁长度 */
const GAUGE_TAP_R = 0.035;
const GAUGE_TAP_IN = 0.06;
/** 液位计刻度板厚度 / 宽 / 离立管距离 */
const GAUGE_PLATE_T = 0.012;
const GAUGE_PLATE_W = 0.1;
const GAUGE_PLATE_GAP = 0.075;

/** 爬梯立柱半径 / 横档半径 / 横档间距 */
const RAIL_R = 0.025;
const RUNG_R = 0.018;
const RUNG_SPACING = 0.3;
/** 横档距梯顶、梯底的留空 */
const RUNG_MARGIN_TOP = 0.08;
const RUNG_MARGIN_BOTTOM = 0.12;

/** 罐底泄水管 DN80 外半径 */
const DN80_R = 0.0445;
/** 泄水管水平段长度（以真值表位置为中心对称布置） */
const DRAIN_LEN = 0.6;
/** 泄水管集污口（喇叭口）外半径 / 长度 */
const DRAIN_BELL_R = 0.09;
const DRAIN_BELL_L = 0.09;

/** 呼吸阀顶帽半径（相对阀体半径的比例）/ 顶帽厚度 */
const VENT_CAP_RATIO = 1.5;
const VENT_CAP_T = 0.03;
/** 呼吸阀根部法兰厚度 / 半径比例 */
const VENT_FLANGE_T = 0.02;
const VENT_FLANGE_RATIO = 1.6;

/** 锥盖顶部检修口半径 / 顶盖外檐相对钢板外径的外伸 */
const ROOF_TOP_R = 0.12;
const ROOF_EAVE_EXT = 0.02;

/** 检修人孔盖板厚度（盖板顶面 = layout 的 manhole.position.y） */
const MANHOLE_COVER_T = 0.06;

/** 质量档 → 圆周分段 */
const SEG = { high: 64, medium: 40, low: 24 };
const SEG_SMALL = { high: 32, medium: 20, low: 14 };

/** 方位 → 水平单位向量（layout 的 outlet.direction 使用） */
const DIR_VECTORS = {
  north: [0, 1],
  south: [0, -1],
  east: [1, 0],
  west: [-1, 0],
};

/* ── 通用几何工具 ──────────────────────────────────────────────────────────── */

/**
 * 以 from→to 为轴摆放一根沿 +Y 的单位长度圆柱（写入 InstancedMesh 的实例矩阵）。
 * @param {THREE} THREE
 * @param {THREE.InstancedMesh} mesh
 * @param {number} i 实例序号
 */
function placeInstance(THREE, mesh, i, from, to) {
  const dir = to.clone().sub(from);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize(),
  );
  const m = new THREE.Matrix4().compose(
    from.clone().add(to).multiplyScalar(0.5),
    q,
    new THREE.Vector3(1, len, 1),
  );
  mesh.setMatrixAt(i, m);
}

/**
 * 将物体按给定正交基摆放（用于刻度板等非轴对齐薄板）。
 * x = 厚度方向，y = 高度方向，z = 宽度方向
 */
function placeByBasis(THREE, obj, xAxis, yAxis, zAxis, position) {
  const m = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  obj.quaternion.setFromRotationMatrix(m);
  obj.position.copy(position);
}

/* ── 单座水罐 ──────────────────────────────────────────────────────────────── */

/**
 * @param {object} ctx 见 CONTRACT 4.2
 * @param {object} t   layout.tanks 中的一条
 * @param {number} seg 圆周分段（大件）
 * @param {number} segS 圆周分段（小件）
 * @returns {THREE.Group}
 */
function buildTank(ctx, t, seg, segS) {
  const { THREE, mat, rng } = ctx;

  /* 读取真值表 */
  const R = t.radius;                       // 2.6  罐体外廓半径（含加强箍外缘）
  const H = t.height;                       // 3.4  筒体高
  const RH = t.roofHeight;                  // 0.32 锥盖高
  const PLATE_R = R - BAND_PROUD;           // 2.55 筒体钢板外半径
  const INNER_R = PLATE_R - t.wallThickness;// 2.49 筒体内半径（壁厚 = wallThickness）
  const [cx, cz] = t.center;                // 罐中心平面坐标

  const group = new THREE.Group();
  group.name = t.id;                        // TANK_01
  group.position.set(cx, t.baseY, cz);      // 局部原点 = 基座顶面中心

  /** layout 位置数组 → 罐体局部坐标（layout 罐体章节口径为 [x, z, y]） */
  const toLocal = (p) => new THREE.Vector3(p[0] - cx, p[2] - t.baseY, p[1] - cz);
  /** 水平径向单位向量（由罐轴指向该点） */
  const radial = (x, z) => new THREE.Vector3(x, 0, z).normalize();
  /** 水平切向单位向量 */
  const tangentOf = (x, z) => new THREE.Vector3(-z, 0, x).normalize();
  /** 锥盖外表面在给定半径处的标高（局部） */
  const roofSurfaceY = (r) => H + RH * (1 - r / (PLATE_R + ROOF_EAVE_EXT));

  const add = (mesh, name) => {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  /* ── 1 混凝土基座（skid）─────────────────────────────────────────────── */
  const skid = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, t.baseY, seg),
    mat('skid'),
  );
  skid.position.y = -t.baseY / 2;           // 局部 -baseY/2 → 世界 0 … baseY
  add(skid, `${t.id}_SKID`);

  /* ── 2 筒体（含环向加强箍，单一 Lathe 成型）──────────────────────────── */
  const profile = [];
  profile.push(new THREE.Vector2(0, 0));              // 罐底外板中心
  profile.push(new THREE.Vector2(PLATE_R, 0));        // 罐底外板边缘
  // 3 道环向加强箍，直段顶到 R（= layout 的 radius），上下以斜坡收口
  const bandBase = H / (BAND_COUNT + 1);
  for (let i = 0; i < BAND_COUNT; i++) {
    const yb = bandBase * (i + 1) + (rng() - 0.5) * 0.04;
    const half = BAND_FLAT / 2;
    profile.push(new THREE.Vector2(PLATE_R, yb - half - BAND_RAMP));
    profile.push(new THREE.Vector2(R, yb - half));
    profile.push(new THREE.Vector2(R, yb + half));
    profile.push(new THREE.Vector2(PLATE_R, yb + half + BAND_RAMP));
  }
  profile.push(new THREE.Vector2(PLATE_R, H));        // 筒体顶外缘
  profile.push(new THREE.Vector2(INNER_R, H));        // 顶板厚度 = wallThickness
  profile.push(new THREE.Vector2(INNER_R, 0));        // 筒体内壁下行
  profile.push(new THREE.Vector2(0, 0));              // 罐底内板中心（闭合）
  const shell = new THREE.Mesh(
    new THREE.LatheGeometry(profile, seg),
    mat('steelTank'),
  );
  add(shell, `${t.id}_SHELL`);

  /* ── 3 锥形顶盖 ──────────────────────────────────────────────────────── */
  const eaveR = PLATE_R + ROOF_EAVE_EXT;
  const roof = new THREE.Mesh(
    new THREE.CylinderGeometry(ROOF_TOP_R, eaveR, RH, seg, 1, true),
    mat('steelTank'),
  );
  roof.position.y = H + RH / 2;
  add(roof, `${t.id}_ROOF`);
  const roofCap = new THREE.Mesh(
    new THREE.CircleGeometry(ROOF_TOP_R, seg),
    mat('steelTank'),
  );
  roofCap.rotation.x = -Math.PI / 2;
  roofCap.position.y = H + RH;
  add(roofCap, `${t.id}_ROOF_TOP`);

  /* ── 4 检修人孔（盖板顶面与锥盖顶点齐平）──────────────────────────────── */
  const mh = toLocal(t.manhole.position);
  const mhCoverH = Math.min(MANHOLE_COVER_T, t.manhole.height * 0.5);
  const mhCollarH = t.manhole.height - mhCoverH;
  const mhCover = new THREE.Mesh(
    new THREE.CylinderGeometry(t.manhole.radius, t.manhole.radius, mhCoverH, segS),
    mat('steelTank'),
  );
  mhCover.position.set(mh.x, mh.y - mhCoverH / 2, mh.z);
  add(mhCover, `${t.id}_MANHOLE_COVER`);
  const mhCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(t.manhole.radius, t.manhole.radius, mhCollarH, segS),
    mat('steelTank'),
  );
  mhCollar.position.set(mh.x, mh.y - t.manhole.height + mhCollarH / 2, mh.z);
  add(mhCollar, `${t.id}_MANHOLE_COLLAR`);

  /* ── 5 呼吸阀 / 排气口 ───────────────────────────────────────────────── */
  const vt = toLocal(t.vent.position);
  const vtBodyH = t.vent.height - VENT_CAP_T;
  const vtBody = new THREE.Mesh(
    new THREE.CylinderGeometry(t.vent.radius, t.vent.radius, vtBodyH, segS),
    mat('steelTank'),
  );
  vtBody.position.set(vt.x, vt.y - t.vent.height + vtBodyH / 2, vt.z);
  add(vtBody, `${t.id}_VENT_BODY`);
  const vtCap = new THREE.Mesh(
    new THREE.CylinderGeometry(
      t.vent.radius * VENT_CAP_RATIO,
      t.vent.radius * VENT_CAP_RATIO,
      VENT_CAP_T,
      segS,
    ),
    mat('steelTank'),
  );
  vtCap.position.set(vt.x, vt.y - VENT_CAP_T / 2, vt.z);
  add(vtCap, `${t.id}_VENT_CAP`);
  // 根部法兰坐在锥盖外表面上
  const vtRad = Math.hypot(vt.x, vt.z);
  const vtFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(
      t.vent.radius * VENT_FLANGE_RATIO,
      t.vent.radius * VENT_FLANGE_RATIO,
      VENT_FLANGE_T,
      segS,
    ),
    mat('steelTank'),
  );
  vtFlange.position.set(vt.x, roofSurfaceY(vtRad) - VENT_FLANGE_T / 2, vt.z);
  add(vtFlange, `${t.id}_VENT_FLANGE`);

  /* ── 6 液位计立管 + 上下取压管 ───────────────────────────────────────── */
  const lg = toLocal(t.levelGauge.position);
  const lgMidY = lg.y;                               // 立管中心标高
  const lgTopY = lgMidY + t.levelGauge.height / 2;
  const lgBotY = lgMidY - t.levelGauge.height / 2;
  const lgPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(
      t.levelGauge.radius,
      t.levelGauge.radius,
      t.levelGauge.height,
      segS,
    ),
    mat('steelPipe'),
  );
  lgPipe.position.set(lg.x, lgMidY, lg.z);
  add(lgPipe, `${t.id}_LEVEL_GAUGE_PIPE`);

  const lgRad = radial(lg.x, lg.z);
  const lgRadLen = Math.hypot(lg.x, lg.z);
  // 取压管：自立管轴线指向罐轴，穿入筒壁
  const wallInner = new THREE.Vector3(lg.x, 0, lg.z).multiplyScalar(
    (INNER_R - GAUGE_TAP_IN) / lgRadLen,
  );
  const lgTaps = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(GAUGE_TAP_R, GAUGE_TAP_R, 1, segS),
    mat('steelPipe'),
    2,
  );
  lgTaps.name = `${t.id}_LEVEL_GAUGE_TAPS`;
  lgTaps.castShadow = true;
  lgTaps.receiveShadow = true;
  for (let i = 0; i < 2; i++) {
    const y = i === 0 ? lgBotY : lgTopY;
    placeInstance(
      THREE,
      lgTaps,
      i,
      new THREE.Vector3(lg.x, y, lg.z),
      new THREE.Vector3(wallInner.x, y, wallInner.z),
    );
  }
  lgTaps.instanceMatrix.needsUpdate = true;
  lgTaps.computeBoundingSphere();
  group.add(lgTaps);

  // 液位计刻度板（贴于立管切向侧）
  const lgTan = tangentOf(lg.x, lg.z);
  const lgPlate = new THREE.Mesh(
    new THREE.BoxGeometry(GAUGE_PLATE_T, t.levelGauge.height * 0.9, GAUGE_PLATE_W),
    mat('signPlate'),
  );
  placeByBasis(
    THREE,
    lgPlate,
    lgRad,
    new THREE.Vector3(0, 1, 0),
    lgTan,
    new THREE.Vector3(lg.x, lgMidY, lg.z).add(lgTan.clone().multiplyScalar(GAUGE_PLATE_GAP)),
  );
  add(lgPlate, `${t.id}_LEVEL_GAUGE_PLATE`);

  /* ── 7 检修爬梯（立柱 + 横档）────────────────────────────────────────── */
  const ld = toLocal(t.ladder.position);
  const ldRad = radial(ld.x, ld.z);
  const ldTan = tangentOf(ld.x, ld.z);
  const ldHalf = t.ladder.width / 2;
  const ldY0 = ld.y;                                  // 梯脚（世界 0）
  const ldY1 = ld.y + t.ladder.height;                // 梯顶
  const railA = new THREE.Vector3(ld.x, 0, ld.z).addScaledVector(ldTan, ldHalf);
  const railB = new THREE.Vector3(ld.x, 0, ld.z).addScaledVector(ldTan, -ldHalf);

  const rails = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(RAIL_R, RAIL_R, 1, segS),
    mat('steelPipe'),
    2,
  );
  rails.name = `${t.id}_LADDER_RAILS`;
  rails.castShadow = true;
  rails.receiveShadow = true;
  placeInstance(
    THREE,
    rails,
    0,
    new THREE.Vector3(railA.x, ldY0, railA.z),
    new THREE.Vector3(railA.x, ldY1, railA.z),
  );
  placeInstance(
    THREE,
    rails,
    1,
    new THREE.Vector3(railB.x, ldY0, railB.z),
    new THREE.Vector3(railB.x, ldY1, railB.z),
  );
  rails.instanceMatrix.needsUpdate = true;
  rails.computeBoundingSphere();
  group.add(rails);

  // 横档：沿切向排布，两端落在立柱上
  const rungSpan = t.ladder.height - RUNG_MARGIN_TOP - RUNG_MARGIN_BOTTOM;
  const rungN = Math.max(2, Math.round(rungSpan / RUNG_SPACING) + 1);
  const rungs = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(RUNG_R, RUNG_R, 1, segS),
    mat('steelPipe'),
    rungN,
  );
  rungs.name = `${t.id}_LADDER_RUNGS`;
  rungs.castShadow = true;
  rungs.receiveShadow = true;
  for (let i = 0; i < rungN; i++) {
    const y = ldY0 + RUNG_MARGIN_BOTTOM + (rungSpan * i) / (rungN - 1);
    placeInstance(
      THREE,
      rungs,
      i,
      new THREE.Vector3(railA.x, y, railA.z),
      new THREE.Vector3(railB.x, y, railB.z),
    );
  }
  rungs.instanceMatrix.needsUpdate = true;
  rungs.computeBoundingSphere();
  group.add(rungs);

  /* ── 8 出水口：短管 + 法兰 + 螺栓（朝向严格按 outlet.direction）───────── */
  const ol = toLocal(t.outlet.position);
  const dirKey = String(t.outlet.direction || '').toLowerCase();
  const dirXZ = DIR_VECTORS[dirKey];
  if (!dirXZ) {
    console.warn(`[tanks] ${t.id} 的 outlet.direction "${t.outlet.direction}" 无法识别，按 south 处理`);
  }
  const dir = new THREE.Vector3(
    dirXZ ? dirXZ[0] : 0,
    0,
    dirXZ ? dirXZ[1] : -1,
  );
  const olRad = radial(ol.x, ol.z);
  const olRadLen = Math.hypot(ol.x, ol.z);
  // 短管自筒体内壁起，沿 dir 向外伸出
  const nozzleStart = new THREE.Vector3(ol.x, 0, ol.z).multiplyScalar(INNER_R / olRadLen);
  nozzleStart.y = ol.y;
  const nozzleEnd = nozzleStart.clone().addScaledVector(dir, NOZZLE_LEN);
  const nozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(NOZZLE_R, NOZZLE_R, NOZZLE_LEN, segS),
    mat('steelTank'),
  );
  nozzle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  nozzle.position.copy(nozzleStart).addScaledVector(dir, NOZZLE_LEN / 2);
  add(nozzle, `${t.id}_OUTLET_NOZZLE`);

  // 法兰：贴于短管外端，法兰面法线 = dir
  const flangeCenter = nozzleEnd.clone().addScaledVector(dir, FLANGE_T / 2);
  const flange = new THREE.Mesh(
    new THREE.CylinderGeometry(t.outlet.flangeRadius, t.outlet.flangeRadius, FLANGE_T, segS),
    mat('steelPipe'),
  );
  flange.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  flange.position.copy(flangeCenter);
  add(flange, `${t.id}_OUTLET_FLANGE`);

  // 螺栓：沿 dir 贯穿法兰，外侧带螺栓头
  const boltCircle = t.outlet.flangeRadius * BOLT_CIRCLE_RATIO;
  const u = new THREE.Vector3(dir.z, 0, -dir.x);       // 法向平面内的水平基
  const w = new THREE.Vector3(0, 1, 0);
  const boltGeo = new THREE.CylinderGeometry(BOLT_R, BOLT_R, 1, segS);
  const bolts = new THREE.InstancedMesh(boltGeo, mat('steelPipe'), BOLT_N);
  bolts.name = `${t.id}_OUTLET_BOLTS`;
  bolts.castShadow = true;
  const heads = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(BOLT_HEAD_R, BOLT_HEAD_R, BOLT_HEAD_T, 6),
    mat('steelPipe'),
    BOLT_N,
  );
  heads.name = `${t.id}_OUTLET_BOLT_HEADS`;
  heads.castShadow = true;
  for (let i = 0; i < BOLT_N; i++) {
    const a = (i / BOLT_N) * Math.PI * 2;
    const p = flangeCenter
      .clone()
      .addScaledVector(u, Math.cos(a) * boltCircle)
      .addScaledVector(w, Math.sin(a) * boltCircle);
    placeInstance(
      THREE,
      bolts,
      i,
      p.clone().addScaledVector(dir, -(FLANGE_T / 2 + 0.03)),
      p.clone().addScaledVector(dir, FLANGE_T / 2 + 0.012),
    );
    placeInstance(
      THREE,
      heads,
      i,
      p.clone().addScaledVector(dir, FLANGE_T / 2),
      p.clone().addScaledVector(dir, FLANGE_T / 2 + BOLT_HEAD_T),
    );
  }
  bolts.instanceMatrix.needsUpdate = true;
  bolts.computeBoundingSphere();
  heads.instanceMatrix.needsUpdate = true;
  heads.computeBoundingSphere();
  group.add(bolts);
  group.add(heads);

  /* ── 9 罐底泄水管（DN80：罐内集污口 → 弯头 → 下穿基座落地）───────────── */
  // 真值表位置落在罐体投影内（距罐轴 1.3 m），整条泄水管保持在罐体外廓之内，
  // 不侵占「罐壁与北墙 0.3 m 净距」通道。
  const dn = toLocal(t.drain.position);
  const dnRad = radial(dn.x, dn.z);
  const dnRadLen = Math.hypot(dn.x, dn.z);
  const dnHalf = DRAIN_LEN / 2;
  const dnIn = dnRad.clone().multiplyScalar(Math.max(0, dnRadLen - dnHalf));
  dnIn.y = dn.y;
  const dnOut = dnRad.clone().multiplyScalar(dnRadLen + dnHalf);
  dnOut.y = dn.y;

  // 水平段：轴线标高取真值表 y，中心落在真值表位置
  const drainPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(DN80_R, DN80_R, DRAIN_LEN, segS),
    mat('steelPipe'),
  );
  drainPipe.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dnRad);
  drainPipe.position.copy(dnIn).add(dnOut).multiplyScalar(0.5);
  add(drainPipe, `${t.id}_DRAIN_PIPE`);

  // 集污口（喇叭口），朝罐内侧张开
  const bell = new THREE.Mesh(
    new THREE.CylinderGeometry(DN80_R, DRAIN_BELL_R, DRAIN_BELL_L, segS),
    mat('steelPipe'),
  );
  bell.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dnRad);
  bell.position.copy(dnIn).addScaledVector(dnRad, -DRAIN_BELL_L / 2);
  add(bell, `${t.id}_DRAIN_INLET`);

  // 弯头 + 法兰
  const elbow = new THREE.Mesh(
    new THREE.SphereGeometry(DN80_R * 1.15, segS, Math.max(6, segS / 2)),
    mat('steelPipe'),
  );
  elbow.position.copy(dnOut);
  add(elbow, `${t.id}_DRAIN_ELBOW`);
  const drainFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(DN80_R * 1.7, DN80_R * 1.7, 0.025, segS),
    mat('steelPipe'),
  );
  drainFlange.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dnRad);
  drainFlange.position.copy(dnOut).addScaledVector(dnRad, -0.04);
  add(drainFlange, `${t.id}_DRAIN_FLANGE`);

  // 竖向落水管：自弯头下穿罐底与混凝土基座，落至地面
  const dropBottom = new THREE.Vector3(dnOut.x, -t.baseY, dnOut.z);
  const drop = new THREE.Mesh(
    new THREE.CylinderGeometry(DN80_R, DN80_R, dnOut.y - dropBottom.y, segS),
    mat('steelPipe'),
  );
  drop.position.copy(dnOut).add(dropBottom).multiplyScalar(0.5);
  add(drop, `${t.id}_DRAIN_DROP`);

  /* ── 10 罐内水面 ─────────────────────────────────────────────────────── */
  const waterY = H * WATER_RATIO + (rng() - 0.5) * WATER_JITTER;
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(INNER_R - 0.02, seg),
    mat('water'),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = waterY;
  add(water, `${t.id}_WATER`);

  return group;
}

/* ── 模块入口 ──────────────────────────────────────────────────────────────── */

/**
 * 构建全部消防水罐。
 * @param {object} ctx 见 CONTRACT 4.2：{ THREE, mat, rng, pois, layout, options }
 * @returns {THREE.Group} 含 2 座水罐的独立分组
 */
export function buildTanks(ctx) {
  const { THREE, mat, rng, pois, layout } = ctx;
  const group = new THREE.Group();
  group.name = 'TANKS_GROUP';

  const tanks = layout && Array.isArray(layout.tanks) ? layout.tanks : [];
  if (!tanks.length) {
    console.warn('[tanks] layout.tanks 为空，未生成水罐');
    return group;
  }

  const quality = (ctx.options && ctx.options.quality) || 'high';
  const seg = SEG[quality] || 48;
  const segS = SEG_SMALL[quality] || 24;

  for (const t of tanks) {
    const tankGroup = buildTank(ctx, t, seg, segS);
    group.add(tankGroup);
    // POI 挂接：id 以 layout 的 tank.id 为准，不新增 POI id
    if (pois && typeof pois.register === 'function') {
      pois.register(`PR_${t.id}`, tankGroup);
    }
  }

  return group;
}

export default buildTanks;
