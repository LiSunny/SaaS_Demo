/**
 * pumps.js — 卧式单吸离心消防泵机组（3 台，2 用 1 备）
 *
 * ★ 归属：通用消防水泵房三维建模团队 · 泵组师（唯一可写文件）
 * ★ 几何真值表：ctx.layout.pumps（3 台机组）+ ctx.layout.pumpGeometry（通用尺寸）。
 *   位置、标高、接口面全部从 layout 读取；本文件不含任何世界坐标字面量。
 * ★ 材质：一律 ctx.mat(name)（CONTRACT 4.3），不私自 new MeshStandardMaterial。
 * ★ 随机：ctx.rng()，禁止 Math.random()。
 * ★ 贴图：本模块不生成贴图，全部材质来自材质库（Canvas 程序化生成，零外部素材）。
 * ★ POI：ctx.pois.register('PR_' + pump.id, group)，不新增 POI id。
 *
 * 坐标：+X 东 / +Z 北 / +Y 上，单位米。
 *
 * 【局部坐标系】
 *   每台机组建在独立 Group 内，Group 原点 = 蜗壳中心在地面上的投影 (pump.x, 0, pump.z)；
 *   局部 +Y 与世界 +Y 一致。泵轴线沿 Z：电机在 -Z 侧，联轴器护罩居中，
 *   蜗壳在 +Z 侧，吸入口朝 +Z，出水口朝 +Y。
 *
 * 【Z 向站位（局部，逐一由 pumpGeometry 推导）】
 *   蜗壳中心        0.000
 *   蜗壳后端面     -0.310              = -volute.length / 2
 *   联轴器护罩      -0.570 … -0.310     长 couplingGuard.length，紧贴蜗壳
 *   电机本体        -1.520 … -0.570     长 motor.length，紧贴护罩
 *   风扇罩          -1.600 … -1.470     长 motorFanCover.length，套入电机端盖 FAN_SPIGOT
 *   吸入口法兰面   +0.440              = suctionFlangeOffset
 *                                     （世界 = position[1] + 0.44 = 0.39，与吸水支管对位）
 *
 * 【Y 向站位】
 *   轴心标高        axisY = 0.85
 *   蜗壳垂直半径    dischargeBaseY - axisY = 0.36（蜗壳顶必须让位给 +Y 出水口）
 *   蜗壳水平半径    volute.radius = 0.42
 *   机组最高点      1.25 = 电机接线盒顶 = 出水口法兰顶
 *
 * 【底座定位】
 *   底座 1.5 × 3.25 × 0.28：先按机组 Z 向居中，再整体向 -Z 平移，
 *   使底座 +Z 端距水罐检修爬梯（layout.tanks[].ladder）不小于 room.minAisle = 1.0 m。
 *
 * 【网格命名】PUMP_<id>_<部件>，id 取 layout 的 pump.id（如 PUMP_01_VOLUTE）
 */

/* ── 局部几何常量（不来自 layout.js 的尺寸；按 CONTRACT 三、声明于文件头）──────── */

/** 吸入口法兰厚度 */
const FLANGE_T = 0.05;
/** 出水口法兰厚度 */
const DISCHARGE_FLANGE_T = 0.028;
/** 出水口法兰半径 / 管半径 的比值（DN150 法兰级） */
const DISCHARGE_FLANGE_RATIO = 1.75;
/** 蜗壳顶出水口过渡凸台外半径 */
const NOZZLE_BOSS_R = 0.13;
/** 出水凸台自法兰面下探深度（保证凸台与蜗壳体相交无缝） */
const NOZZLE_BOSS_DEPTH = 0.21;
/** 吸入口短管伸入蜗壳的长度（避免出现缝隙） */
const SUCTION_NECK_IN = 0.06;
/** 吸入口螺栓数 / 螺栓中心圆半径比 / 螺栓头半径 / 螺栓头厚度 */
const SUCTION_BOLT_N = 8;
const SUCTION_BOLT_CIRCLE_RATIO = 0.85;
const BOLT_HEAD_R = 0.024;
const BOLT_HEAD_T = 0.02;
/** 蜗壳前盖螺栓数 / 螺栓中心圆半径比 */
const VOLUTE_BOLT_N = 12;
const VOLUTE_BOLT_CIRCLE_RATIO = 0.55;
/** 蜗壳前后倒角（占蜗壳半长的比例） */
const VOLUTE_CHAMFER_A = 0.13;
const VOLUTE_CHAMFER_B = 0.39;
const VOLUTE_CHAMFER_C = 0.68;
/** 联轴器护罩板厚 / 通风孔半径 / 通风孔排布（列 × 行） */
const GUARD_T = 0.012;
const GUARD_VENT_R = 0.032;
const GUARD_VENT_COLS = 3;
const GUARD_VENT_ROWS = 2;
/** 风扇罩套入电机端盖（喇叭口）的长度 */
const FAN_SPIGOT = 0.05;
/** 电机机座框（宽 × 高 × 长） */
const MOTOR_FRAME_W = 0.44;
const MOTOR_FRAME_H = 0.15;
const MOTOR_FRAME_L = 0.7;
/** 电机接线盒：凸台 / 箱体 / 盖 尺寸 */
const TB_BOSS_W = 0.2;
const TB_BOSS_H = 0.06;
const TB_BOSS_D = 0.18;
const TB_W = 0.24;
const TB_H = 0.06;
const TB_D = 0.22;
const TB_LID_H = 0.03;
/** 电缆格兰头外半径 / 长度，电缆引入段半径 / 长度 */
const GLAND_R = 0.024;
const GLAND_L = 0.05;
const CABLE_R = 0.016;
const CABLE_L = 0.07;
/** 电机铭牌（厚 × 高 × 宽） */
const PLATE_T = 0.012;
const PLATE_H = 0.1;
const PLATE_D = 0.16;
/** 就地压力表：表体半径 / 厚度 / 表盘半径 / 取压管半径 */
const GAUGE_R = 0.055;
const GAUGE_T = 0.035;
const GAUGE_DIAL_R = 0.048;
const GAUGE_TAP_R = 0.016;
/** 泵体支腿：底板 / 立腿 / 鞍座 */
const FOOT_PLATE_W = 0.5;
const FOOT_PLATE_D = 0.34;
const FOOT_PLATE_T = 0.03;
const LEG_W = 0.1;
const LEG_D = 0.2;
const LEG_H = 0.16;
const LEG_SPAN = 0.14;
const SADDLE_W = 0.3;
const SADDLE_D = 0.24;
const SADDLE_T = 0.04;
/** 底座锚栓：数量 / 半径 / 高 / 安装位置随机抖动 */
const ANCHOR_N = 4;
const ANCHOR_R = 0.016;
const ANCHOR_H = 0.03;
const ANCHOR_JITTER = 0.004;
/** 水罐检修爬梯立柱外半径（与 tanks.js 一致，仅用于底座通道校核） */
const LADDER_RAIL_R = 0.025;
/** 质量档 → 圆周分段 */
const SEG = { high: 48, medium: 32, low: 20 };
const SEG_S = { high: 32, medium: 20, low: 12 };

/* ── 通用几何工具 ──────────────────────────────────────────────────────────── */

/**
 * 以 from→to 为轴摆放一根沿 +Y 的单位长度圆柱（写入 InstancedMesh 的实例矩阵）。
 * @param {THREE} THREE
 * @param {THREE.InstancedMesh} mesh
 * @param {number} i 实例序号
 * @param {THREE.Vector3} from
 * @param {THREE.Vector3} to
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
 * 计算底座（混凝土惯性基础）的 Z 向中心（局部坐标）。
 * 规则：先让底座在机组 Z 向居中；若某一侧因此侵入水罐检修爬梯前的操作通道，
 * 则整体向 -Z 平移，直到通道净宽 ≥ layout.room.minAisle。
 * @param {object} layout 真值表
 * @param {number[]} pumpPos layout.pumps[].position（[x, z]）
 * @param {number} skidLen 底座 Z 向长度
 * @param {number} unitBackZ 机组 -Z 端（局部）
 * @param {number} unitFrontZ 机组 +Z 端（局部）
 * @returns {number} 底座中心局部 Z
 */
function computeSkidCenterZ(layout, pumpPos, skidLen, unitBackZ, unitFrontZ) {
  let center = (unitBackZ + unitFrontZ) / 2;
  const aisle = (layout.room && layout.room.minAisle) || 1.0;
  const tanks = layout.tanks && Array.isArray(layout.tanks) ? layout.tanks : [];
  for (const t of tanks) {
    const ld = t.ladder;
    if (!ld || !Array.isArray(ld.position) || ld.position.length < 2) continue;
    const ladderFaceZ = ld.position[1] - LADDER_RAIL_R;   // 爬梯外缘（世界 Z）
    const limit = ladderFaceZ - aisle - pumpPos[1];        // 换算到本泵局部坐标
    if (center + skidLen / 2 > limit) center = limit - skidLen / 2;
  }
  return center;
}

/* ── 单台机组 ──────────────────────────────────────────────────────────────── */

/**
 * @param {object} ctx 见 CONTRACT 4.2
 * @param {object} p   layout.pumps 中的一条
 * @param {object} geo layout.pumpGeometry
 * @param {number} seg 圆周分段（大件）
 * @param {number} segS 圆周分段（小件）
 * @returns {THREE.Group}
 */
function buildPump(ctx, p, geo, seg, segS) {
  const { THREE, mat, layout } = ctx;
  const rnd = typeof ctx.rng === 'function' ? ctx.rng : () => 0.5;

  /* ── 读取真值表 ─────────────────────────────────────────────────────── */
  const px = p.position[0];               // 机组 X
  const pz = p.position[1];               // 机组 Z（= 蜗壳中心 Z）
  const axisY = p.axisY;                  // 轴心标高
  const VOL_R = geo.volute.radius;        // 0.42 蜗壳水平半径
  const VOL_L = geo.volute.length;        // 0.62 蜗壳轴向长
  const SFO = geo.suctionFlangeOffset;    // 0.44 吸入口法兰面相对蜗壳中心的 +Z 偏移
  const SFR = geo.suctionFlangeRadius;    // 0.20 吸入口法兰半径
  const DR = geo.dischargeRadius;         // 0.084 出水口管半径
  const DBY = geo.dischargeBaseY;         // 1.21 出水口起点标高
  const CG = geo.couplingGuard;           // { length, size }
  const MO = geo.motor;                   // { length, radius }
  const FC = geo.motorFanCover;           // { length, radius }
  const SK = geo.skid;                    // { width, length, height }

  const group = new THREE.Group();
  group.name = p.id;                      // PUMP_01
  group.position.set(px, 0, pz);          // 局部原点 = 蜗壳中心的地面投影

  const add = (mesh, name) => {
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  /* ── Z 向站位（局部）────────────────────────────────────────────────── */
  const voluteBackZ = -VOL_L / 2;                    // -0.310 蜗壳后端面
  const voluteFrontZ = VOL_L / 2;                    // +0.310 蜗壳前端面
  const guardFrontZ = voluteBackZ;                   // 护罩前端紧贴蜗壳
  const guardBackZ = guardFrontZ - CG.length;        // -0.570
  const motorFrontZ = guardBackZ;                    // 电机前端紧贴护罩
  const motorBackZ = motorFrontZ - MO.length;        // -1.520
  const fanBackZ = motorBackZ - FAN_SPIGOT;          // -1.600 风扇罩外端
  const fanFrontZ = fanBackZ + FC.length;            // -1.470
  const flangeFaceZ = SFO;                           // +0.440 吸入口法兰面
  const motorCenterZ = (motorFrontZ + motorBackZ) / 2;
  const guardCenterZ = (guardFrontZ + guardBackZ) / 2;

  /* ── 底座定位 ─────────────────────────────────────────────────────── */
  const skidCenterZ = computeSkidCenterZ(layout, p.position, SK.length, fanBackZ, flangeFaceZ);

  /* ══ 1 混凝土惯性底座（skid）══════════════════════════════════════════ */
  const skid = new THREE.Mesh(
    new THREE.BoxGeometry(SK.width, SK.height, SK.length),
    mat('skid'),
  );
  skid.position.set(0, SK.height / 2, skidCenterZ);
  add(skid, `${p.id}_SKID`);

  /* ══ 2 泵蜗壳（pumpCasing）═══════════════════════════════════════════ */
  // 蜗壳为绕 Z 轴的回转体：水平半径取 layout 的 volute.radius，
  // 垂直半径受 +Y 出水口起点约束（蜗壳顶必须正好让出 dischargeBaseY）。
  const voluteYRadius = Math.max(0.2, DBY - axisY);          // 0.36
  const voluteYScale = Math.max(0.2, voluteYRadius / VOL_R); // 0.857
  const halfVol = VOL_L / 2;
  const voluteProfile = [
    [0, -halfVol],
    [VOL_R * 0.62, -halfVol],
    [VOL_R * 0.9, -halfVol + VOL_L * VOLUTE_CHAMFER_A],
    [VOL_R * 0.985, -halfVol + VOL_L * VOLUTE_CHAMFER_B],
    [VOL_R, -halfVol + VOL_L * VOLUTE_CHAMFER_C],
    [VOL_R, halfVol - VOL_L * VOLUTE_CHAMFER_C],
    [VOL_R * 0.985, halfVol - VOL_L * VOLUTE_CHAMFER_B],
    [VOL_R * 0.9, halfVol - VOL_L * VOLUTE_CHAMFER_A],
    [VOL_R * 0.62, halfVol],
    [0, halfVol],
  ];
  const voluteGeo = new THREE.LatheGeometry(
    voluteProfile.map(([r, h]) => new THREE.Vector2(r, h)),
    seg,
  );
  voluteGeo.rotateX(Math.PI / 2);          // 回转轴 +Y → +Z
  voluteGeo.scale(1, voluteYScale, 1);     // 垂直向压扁至 voluteYRadius
  const volute = new THREE.Mesh(voluteGeo, mat('pumpCasing'));
  volute.position.set(0, axisY, 0);
  add(volute, `${p.id}_VOLUTE`);

  // 前盖螺栓圈（避开中心吸入口）
  const vBoltCircle = VOL_R * VOLUTE_BOLT_CIRCLE_RATIO;
  const vBolts = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(BOLT_HEAD_R * 0.8, BOLT_HEAD_R * 0.8, 0.026, segS),
    mat('pumpCasing'),
    VOLUTE_BOLT_N,
  );
  vBolts.name = `${p.id}_VOLUTE_BOLTS`;
  vBolts.castShadow = true;
  for (let i = 0; i < VOLUTE_BOLT_N; i++) {
    const a = (i / VOLUTE_BOLT_N) * Math.PI * 2;
    const x = Math.cos(a) * vBoltCircle;
    const y = axisY + Math.sin(a) * vBoltCircle;
    placeInstance(
      THREE, vBolts, i,
      new THREE.Vector3(x, y, voluteFrontZ - 0.006),
      new THREE.Vector3(x, y, voluteFrontZ + 0.02),
    );
  }
  vBolts.instanceMatrix.needsUpdate = true;
  vBolts.computeBoundingSphere();
  group.add(vBolts);

  /* ── 2a 轴向吸入口短管 + 法兰（法兰面 Z = suctionFlangeOffset）───────── */
  const suctionR = (layout.pipes && layout.pipes.suctionBranch && layout.pipes.suctionBranch.radius)
    || DR;
  const neckStartZ = voluteFrontZ - SUCTION_NECK_IN;     // 伸入蜗壳体内，避免缝隙
  const neckEndZ = flangeFaceZ - FLANGE_T;               // 法兰后端面
  const suctionNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(suctionR, suctionR, neckEndZ - neckStartZ, segS),
    mat('pumpCasing'),
  );
  suctionNeck.rotation.x = Math.PI / 2;                  // 轴向 +Y → +Z
  suctionNeck.position.set(0, axisY, (neckStartZ + neckEndZ) / 2);
  add(suctionNeck, `${p.id}_SUCTION_NECK`);

  const suctionFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(SFR, SFR, FLANGE_T, segS),
    mat('steelPipe'),
  );
  suctionFlange.rotation.x = Math.PI / 2;
  suctionFlange.position.set(0, axisY, flangeFaceZ - FLANGE_T / 2);
  add(suctionFlange, `${p.id}_SUCTION_FLANGE`);

  // 螺栓头坐在法兰背面（-Z 侧），保证对接面 Z = flangeFaceZ 干净无凸出
  const sBoltCircle = SFR * SUCTION_BOLT_CIRCLE_RATIO;
  const sBoltHeads = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(BOLT_HEAD_R, BOLT_HEAD_R, BOLT_HEAD_T, segS),
    mat('steelPipe'),
    SUCTION_BOLT_N,
  );
  sBoltHeads.name = `${p.id}_SUCTION_BOLTS`;
  sBoltHeads.castShadow = true;
  for (let i = 0; i < SUCTION_BOLT_N; i++) {
    const a = (i / SUCTION_BOLT_N) * Math.PI * 2;
    const x = Math.cos(a) * sBoltCircle;
    const y = axisY + Math.sin(a) * sBoltCircle;
    placeInstance(
      THREE, sBoltHeads, i,
      new THREE.Vector3(x, y, flangeFaceZ - FLANGE_T - BOLT_HEAD_T),
      new THREE.Vector3(x, y, flangeFaceZ - FLANGE_T),
    );
  }
  sBoltHeads.instanceMatrix.needsUpdate = true;
  sBoltHeads.computeBoundingSphere();
  group.add(sBoltHeads);

  /* ── 2b 顶部出水口：过渡凸台 + 出水短管 + 法兰（起点 Y = dischargeBaseY）── */
  const bossBottomY = DBY - NOZZLE_BOSS_DEPTH;
  const dischargeBoss = new THREE.Mesh(
    new THREE.CylinderGeometry(NOZZLE_BOSS_R, NOZZLE_BOSS_R, NOZZLE_BOSS_DEPTH, segS),
    mat('pumpCasing'),
  );
  dischargeBoss.position.set(0, (bossBottomY + DBY) / 2, 0);
  add(dischargeBoss, `${p.id}_DISCHARGE_BOSS`);

  const disNeckLen = DISCHARGE_FLANGE_T * 0.45;         // 短管露头
  const dischargeNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(DR, DR, disNeckLen, segS),
    mat('pumpCasing'),
  );
  dischargeNeck.position.set(0, DBY + disNeckLen / 2, 0);
  add(dischargeNeck, `${p.id}_DISCHARGE_NECK`);

  const dischargeFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(DR * DISCHARGE_FLANGE_RATIO, DR * DISCHARGE_FLANGE_RATIO, DISCHARGE_FLANGE_T, segS),
    mat('steelPipe'),
  );
  dischargeFlange.position.set(0, DBY + disNeckLen + DISCHARGE_FLANGE_T / 2, 0);
  add(dischargeFlange, `${p.id}_DISCHARGE_FLANGE`);

  /* ══ 3 泵体支腿（底板 + 立腿 + 鞍座，pumpCasing）══════════════════════ */
  const footBaseY = SK.height;                           // 0.28 底座顶
  const footPlate = new THREE.Mesh(
    new THREE.BoxGeometry(FOOT_PLATE_W, FOOT_PLATE_T, FOOT_PLATE_D),
    mat('pumpCasing'),
  );
  footPlate.position.set(0, footBaseY + FOOT_PLATE_T / 2, 0);
  add(footPlate, `${p.id}_CASING_FOOT_PLATE`);

  const legBottomY = footBaseY + FOOT_PLATE_T;           // 0.31
  for (const sgn of [-1, 1]) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(LEG_W, LEG_H, LEG_D),
      mat('pumpCasing'),
    );
    leg.position.set(sgn * LEG_SPAN, legBottomY + LEG_H / 2, 0);
    add(leg, `${p.id}_CASING_LEG_${sgn < 0 ? 'L' : 'R'}`);
  }

  const saddleBottomY = legBottomY + LEG_H;              // 0.47
  const saddle = new THREE.Mesh(
    new THREE.BoxGeometry(SADDLE_W, SADDLE_T, SADDLE_D),
    mat('pumpCasing'),
  );
  saddle.position.set(0, saddleBottomY + SADDLE_T / 2, 0);
  add(saddle, `${p.id}_CASING_SADDLE`);

  /* ══ 4 联轴器护罩（guard 材质，安全黄，带通风孔）══════════════════════ */
  const gSize = CG.size;                                 // 0.42 外廓
  const gLen = CG.length;                               // 0.26 轴向长
  const guardTop = new THREE.Mesh(
    new THREE.BoxGeometry(gSize, GUARD_T, gLen),
    mat('guard'),
  );
  guardTop.position.set(0, axisY + gSize / 2 - GUARD_T / 2, guardCenterZ);
  add(guardTop, `${p.id}_GUARD_TOP`);

  const guardBottom = new THREE.Mesh(
    new THREE.BoxGeometry(gSize, GUARD_T, gLen),
    mat('guard'),
  );
  guardBottom.position.set(0, axisY - gSize / 2 + GUARD_T / 2, guardCenterZ);
  add(guardBottom, `${p.id}_GUARD_BOTTOM`);

  const guardEndF = new THREE.Mesh(
    new THREE.BoxGeometry(gSize, gSize, GUARD_T),
    mat('guard'),
  );
  guardEndF.position.set(0, axisY, guardFrontZ - GUARD_T / 2);
  add(guardEndF, `${p.id}_GUARD_END_FRONT`);

  const guardEndB = new THREE.Mesh(
    new THREE.BoxGeometry(gSize, gSize, GUARD_T),
    mat('guard'),
  );
  guardEndB.position.set(0, axisY, guardBackZ + GUARD_T / 2);
  add(guardEndB, `${p.id}_GUARD_END_BACK`);

  // 两侧通风孔板：真实开孔（Shape + holes + ExtrudeGeometry），非贴图假孔
  const ventShape = new THREE.Shape();
  ventShape.moveTo(-gLen / 2, -gSize / 2);
  ventShape.lineTo(gLen / 2, -gSize / 2);
  ventShape.lineTo(gLen / 2, gSize / 2);
  ventShape.lineTo(-gLen / 2, gSize / 2);
  ventShape.closePath();
  const ventStepX = gLen / (GUARD_VENT_COLS + 1);
  const ventStepY = (gSize * 0.45) / GUARD_VENT_ROWS;
  for (let cx = 0; cx < GUARD_VENT_COLS; cx++) {
    for (let cy = 0; cy < GUARD_VENT_ROWS; cy++) {
      const hx = (cx - (GUARD_VENT_COLS - 1) / 2) * ventStepX;
      const hy = (cy - (GUARD_VENT_ROWS - 1) / 2) * ventStepY;
      const hole = new THREE.Path();
      hole.absarc(hx, hy, GUARD_VENT_R, 0, Math.PI * 2, true);
      ventShape.holes.push(hole);
    }
  }
  const ventGeo = new THREE.ExtrudeGeometry(ventShape, { depth: GUARD_T, bevelEnabled: false });
  ventGeo.translate(0, 0, -GUARD_T / 2);
  ventGeo.rotateY(-Math.PI / 2);          // 板面法线 → -X，板宽轴 → +Z
  const ventL = new THREE.Mesh(ventGeo, mat('guard'));
  ventL.position.set(-(gSize / 2 - GUARD_T / 2), axisY, guardCenterZ);
  add(ventL, `${p.id}_GUARD_VENT_LEFT`);
  const ventR = new THREE.Mesh(ventGeo, mat('guard'));
  ventR.rotation.y = Math.PI;             // 法线 → +X
  ventR.position.set(gSize / 2 - GUARD_T / 2, axisY, guardCenterZ);
  add(ventR, `${p.id}_GUARD_VENT_RIGHT`);

  /* ══ 5 电机（motorBody）+ 风扇罩 + 电机支座 ═══════════════════════════ */
  const motorGeo = new THREE.CylinderGeometry(MO.radius, MO.radius, MO.length, seg);
  motorGeo.rotateX(Math.PI / 2);
  const motor = new THREE.Mesh(motorGeo, mat('motorBody'));
  motor.position.set(0, axisY, motorCenterZ);
  add(motor, `${p.id}_MOTOR_BODY`);

  // 散热筋
  const finCount = 8;
  const finGeo = new THREE.CylinderGeometry(MO.radius + 0.006, MO.radius + 0.006, 0.014, seg);
  finGeo.rotateX(Math.PI / 2);
  const fins = new THREE.InstancedMesh(finGeo, mat('motorBody'), finCount);
  fins.name = `${p.id}_MOTOR_FINS`;
  fins.castShadow = true;
  for (let i = 0; i < finCount; i++) {
    const z = motorBackZ + 0.09 + (i * (MO.length - 0.18)) / (finCount - 1);
    fins.setMatrixAt(i, new THREE.Matrix4().makeTranslation(0, axisY, z));
  }
  fins.instanceMatrix.needsUpdate = true;
  fins.computeBoundingSphere();
  group.add(fins);

  // 电机机座框（铸件，兼作电机脚）
  const frameTopY = axisY - MO.radius + 0.01;            // 0.54 + 0.01，压入机体
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(MOTOR_FRAME_W, MOTOR_FRAME_H, MOTOR_FRAME_L),
    mat('motorBody'),
  );
  frame.position.set(0, frameTopY - MOTOR_FRAME_H / 2, motorCenterZ);
  add(frame, `${p.id}_MOTOR_FRAME`);

  // 电机支座：座板 / 托板 / 底板，三级由底座顶 0.28 托到机座框底
  const frameBottomY = frameTopY - MOTOR_FRAME_H;         // 0.40
  const motorBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.03, 0.8),
    mat('motorBody'),
  );
  motorBase.position.set(0, footBaseY + 0.015, motorCenterZ);
  add(motorBase, `${p.id}_MOTOR_BASE`);

  const motorPedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.06, 0.62),
    mat('motorBody'),
  );
  motorPedestal.position.set(0, footBaseY + 0.03 + 0.03, motorCenterZ);
  add(motorPedestal, `${p.id}_MOTOR_PEDESTAL`);

  const motorSeat = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, frameBottomY - (footBaseY + 0.06), 0.76),
    mat('motorBody'),
  );
  motorSeat.position.set(0, (footBaseY + 0.06 + frameBottomY) / 2, motorCenterZ);
  add(motorSeat, `${p.id}_MOTOR_SEAT`);

  // 风扇罩（喇叭口套入电机端盖）
  const fanGeo = new THREE.CylinderGeometry(FC.radius, FC.radius * 0.88, FC.length, seg);
  fanGeo.rotateX(Math.PI / 2);
  const fanCover = new THREE.Mesh(fanGeo, mat('motorBody'));
  fanCover.position.set(0, axisY, (fanBackZ + fanFrontZ) / 2);
  add(fanCover, `${p.id}_MOTOR_FAN_COVER`);

  /* ══ 6 电气接线盒（电机侧）════════════════════════════════════════════ */
  const motorTopY = axisY + MO.radius;                   // 1.16
  const tbBoss = new THREE.Mesh(
    new THREE.BoxGeometry(TB_BOSS_W, TB_BOSS_H, TB_BOSS_D),
    mat('motorBody'),
  );
  tbBoss.position.set(0, motorTopY - TB_BOSS_H / 2 + 0.01, motorCenterZ);
  add(tbBoss, `${p.id}_TERMINAL_BOSS`);

  const tbBox = new THREE.Mesh(
    new THREE.BoxGeometry(TB_W, TB_H, TB_D),
    mat('cabinet'),
  );
  tbBox.position.set(0, motorTopY + TB_H / 2, motorCenterZ);
  add(tbBox, `${p.id}_TERMINAL_BOX`);

  const tbLid = new THREE.Mesh(
    new THREE.BoxGeometry(TB_W + 0.01, TB_LID_H, TB_D + 0.01),
    mat('cabinetDoor'),
  );
  tbLid.position.set(0, motorTopY + TB_H + TB_LID_H / 2, motorCenterZ);
  add(tbLid, `${p.id}_TERMINAL_LID`);

  // 电缆格兰头 + 引入段（+X 侧）
  const gland = new THREE.Mesh(
    new THREE.CylinderGeometry(GLAND_R, GLAND_R, GLAND_L, segS),
    mat('steelPipe'),
  );
  gland.rotation.z = Math.PI / 2;                        // 轴向 +Y → +X
  gland.position.set(TB_W / 2 + GLAND_L / 2, motorTopY + TB_H / 2, motorCenterZ);
  add(gland, `${p.id}_CABLE_GLAND`);

  const cableStub = new THREE.Mesh(
    new THREE.CylinderGeometry(CABLE_R, CABLE_R, CABLE_L, segS),
    mat('cable'),
  );
  cableStub.rotation.z = Math.PI / 2;
  cableStub.position.set(TB_W / 2 + GLAND_L + CABLE_L / 2, motorTopY + TB_H / 2, motorCenterZ);
  add(cableStub, `${p.id}_CABLE_STUB`);

  /* ══ 7 电机铭牌 ═══════════════════════════════════════════════════════ */
  const plateY = axisY - 0.13;                           // 0.72
  const plateX = Math.sqrt(Math.max(0, MO.radius * MO.radius - (axisY - plateY) * (axisY - plateY)));
  const nameplate = new THREE.Mesh(
    new THREE.BoxGeometry(PLATE_T, PLATE_H, PLATE_D),
    mat('signPlate'),
  );
  nameplate.position.set(plateX + PLATE_T / 2, plateY, motorCenterZ);
  add(nameplate, `${p.id}_NAMEPLATE`);

  for (let i = 0; i < 2; i++) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.012, PLATE_D * 0.72),
      mat('signText'),
    );
    stripe.position.set(plateX + PLATE_T + 0.002, plateY + (i === 0 ? 0.018 : -0.018), motorCenterZ);
    add(stripe, `${p.id}_NAMEPLATE_STRIPE_${i + 1}`);
  }

  /* ══ 8 就地压力表（表体 + 表盘 + 指针 + 接管）══════════════════════════ */
  const gaugeY = axisY + 0.18;                           // 1.03
  const gaugeBodyX = MO.radius + 0.12;                   // 表体距轴线
  const tapStartX = VOL_R - 0.12;                       // 取压管伸入蜗壳体内
  const tapEndX = gaugeBodyX - GAUGE_T - 0.03;
  const gaugeTap = new THREE.Mesh(
    new THREE.CylinderGeometry(GAUGE_TAP_R, GAUGE_TAP_R, tapEndX - tapStartX, segS),
    mat('steelPipe'),
  );
  gaugeTap.rotation.z = Math.PI / 2;
  gaugeTap.position.set((tapStartX + tapEndX) / 2, gaugeY, 0);
  add(gaugeTap, `${p.id}_GAUGE_TAP`);

  const gaugeBody = new THREE.Mesh(
    new THREE.CylinderGeometry(GAUGE_R, GAUGE_R, GAUGE_T, segS),
    mat('steelPipe'),
  );
  gaugeBody.rotation.z = Math.PI / 2;
  gaugeBody.position.set(gaugeBodyX - GAUGE_T / 2, gaugeY, 0);
  add(gaugeBody, `${p.id}_GAUGE_BODY`);

  const gaugeDial = new THREE.Mesh(
    new THREE.CircleGeometry(GAUGE_DIAL_R, segS),
    mat('signPlate'),
  );
  gaugeDial.rotation.y = Math.PI / 2;                    // 表盘法线 → +X
  gaugeDial.position.set(gaugeBodyX + 0.001, gaugeY, 0);
  add(gaugeDial, `${p.id}_GAUGE_DIAL`);

  const needleAngle = (rnd() - 0.5) * 2.2;               // 读数随机（ctx.rng，可复现）
  const needle = new THREE.Mesh(
    new THREE.BoxGeometry(0.003, GAUGE_DIAL_R * 0.72, 0.006),
    mat('signText'),
  );
  needle.rotation.set(needleAngle, 0, 0);
  needle.position.set(
    gaugeBodyX + 0.003,
    gaugeY + Math.cos(needleAngle) * GAUGE_DIAL_R * 0.3,
    Math.sin(needleAngle) * GAUGE_DIAL_R * 0.3,
  );
  add(needle, `${p.id}_GAUGE_NEEDLE`);

  /* ══ 9 底座锚栓（位置带随机微偏，安装偏差）═══════════════════════════ */
  const anchorGeo = new THREE.CylinderGeometry(ANCHOR_R, ANCHOR_R, ANCHOR_H, segS);
  const anchors = new THREE.InstancedMesh(anchorGeo, mat('steelPipe'), ANCHOR_N * 2);
  anchors.name = `${p.id}_ANCHOR_BOLTS`;
  anchors.castShadow = true;
  let anchorIdx = 0;
  // 泵体支腿底板 4 只
  for (let i = 0; i < ANCHOR_N; i++) {
    const sx = i % 2 === 0 ? -1 : 1;
    const sz = i < 2 ? -1 : 1;
    const x = sx * (FOOT_PLATE_W / 2 - 0.045) + (rnd() - 0.5) * ANCHOR_JITTER;
    const z = sz * (FOOT_PLATE_D / 2 - 0.045) + (rnd() - 0.5) * ANCHOR_JITTER;
    placeInstance(
      THREE, anchors, anchorIdx++,
      new THREE.Vector3(x, footBaseY + FOOT_PLATE_T, z),
      new THREE.Vector3(x, footBaseY + FOOT_PLATE_T + ANCHOR_H, z),
    );
  }
  // 电机支座底板 4 只
  for (let i = 0; i < ANCHOR_N; i++) {
    const sx = i % 2 === 0 ? -1 : 1;
    const sz = i < 2 ? -1 : 1;
    const x = sx * 0.29 + (rnd() - 0.5) * ANCHOR_JITTER;
    const z = motorCenterZ + sz * 0.37 + (rnd() - 0.5) * ANCHOR_JITTER;
    placeInstance(
      THREE, anchors, anchorIdx++,
      new THREE.Vector3(x, footBaseY + 0.03, z),
      new THREE.Vector3(x, footBaseY + 0.03 + ANCHOR_H, z),
    );
  }
  anchors.instanceMatrix.needsUpdate = true;
  anchors.computeBoundingSphere();
  group.add(anchors);

  /* ── 交付前自检（仅在偏差时告警）─────────────────────────────────────── */
  const flangeWorldZ = pz + flangeFaceZ;
  const expectedFlangeZ = layout.pipes && layout.pipes.suctionBranch
    ? layout.pipes.suctionBranch.toZ
    : null;
  if (expectedFlangeZ !== null && Math.abs(flangeWorldZ - expectedFlangeZ) > 1e-6) {
    console.warn(
      `[pumps] ${p.id} 吸入口法兰面 Z=${flangeWorldZ} 与 layout.pipes.suctionBranch.toZ=${expectedFlangeZ} 不一致`,
    );
  }
  const unitTopY = motorTopY + TB_H + TB_LID_H;           // 1.25
  const clearHeight = layout.room ? layout.room.clearHeight : null;
  if (clearHeight !== null && unitTopY >= clearHeight) {
    console.warn(`[pumps] ${p.id} 机组最高点 ${unitTopY} 未低于梁底净高 ${clearHeight}`);
  }

  return group;
}

/* ── 模块入口 ──────────────────────────────────────────────────────────────── */

/**
 * 构建全部消防水泵机组（3 台，2 用 1 备）。
 * @param {object} ctx 见 CONTRACT 4.2：{ THREE, mat, rng, pois, layout, options }
 * @returns {THREE.Group} 含 3 台机组的独立分组
 */
export function buildPumps(ctx) {
  const { THREE, mat, pois, layout } = ctx;
  const group = new THREE.Group();
  group.name = 'PUMPS_GROUP';

  const pumps = layout && Array.isArray(layout.pumps) ? layout.pumps : [];
  if (!pumps.length) {
    console.warn('[pumps] layout.pumps 为空，未生成泵机组');
    return group;
  }

  const geo = layout.pumpGeometry || {};
  const quality = (ctx.options && ctx.options.quality) || 'high';
  const seg = SEG[quality] || SEG.high;
  const segS = SEG_S[quality] || SEG_S.high;

  for (const p of pumps) {
    const pumpGroup = buildPump(ctx, p, geo, seg, segS);
    group.add(pumpGroup);
    // POI 挂接：id 以 layout 的 pump.id 为准，不新增 POI id
    if (pois && typeof pois.register === 'function') {
      pois.register(`PR_${p.id}`, pumpGroup);
    }
  }

  return group;
}

export default buildPumps;
