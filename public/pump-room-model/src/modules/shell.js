/**
 * shell.js — 通用消防水泵房 · 土建外壳与地面排水系统
 *
 * 负责人：土建与给排水师（bot_48a039c02948）
 *
 * 交付内容（CONTRACT 六、shell.js 行）：
 *   地坪（环氧防滑）/ 四周墙体 + 墙裙 / 顶棚 / 屋面梁 / 甲级防火门（框·扇·闭门器·标牌）/
 *   观察窗（框 + 玻璃）/ 地面排水沟 + 沟盖板 / 2 座排污井（井壁 + 铸铁格栅盖板 +
 *   潜水排污泵 + 排污立管）/ 墙面防撞与地面禁停标识。
 *
 * ── 契约遵守 ────────────────────────────────────────────────────────────────
 *   · 全部世界坐标取自 ctx.layout（layout.js 为唯一几何真值表）；
 *     本文件仅在下方常量区写「局部构件尺寸」，并逐条注明用途。
 *   · 材质一律 ctx.mat(name)（CONTRACT 4.3 清单），本模块不 new 任何材质。
 *   · 随机数一律 ctx.rng()，不使用 Math.random。
 *   · 无 CDN、无外部素材；贴图由材质贴图师程序化生成，本模块不生成贴图。
 *   · 网格命名 SHELL_<对象>_<序号>。
 *   · POI 挂接：registerPoi('PR_SUMP_01' | 'PR_SUMP_02' | 'PR_ROOM_01', mesh)，
 *     其中排污井 id 由 layout 的 sump.id 派生（`PR_${sump.id}`）；
 *     优先用基线 ctx.pois.register，缺失时回退引擎别名 ctx.poiIndex.register。
 *
 * ── 坐标口径（依据 layout.js 与 CONTRACT §一）─────────────────────────────
 *   room.bounds 为墙体「内表面」：净空 24.0 m(X) × 15.0 m(Z)，
 *   墙体自内表面向外生长 room.wallThickness；地坪完成面 = room.floorY，
 *   结构顶（梁顶 / 顶棚面）= room.totalHeight，梁底净高 = room.clearHeight。
 *   layout 中 position 字段在本模块涉及的对象上均为 [x, z, y]。
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * 局部构件尺寸常量（单位 m；均为构件自身尺寸，不含世界坐标）
 * ═══════════════════════════════════════════════════════════════════════════ */
const K = {
  FLOOR_T: 0.2,          // 地坪结构层厚（完成面 = room.floorY）
  ROOF_T: 0.2,           // 屋面板厚（顶棚面 = room.totalHeight）
  SKIRT_H: 1.1,          // 墙裙高
  SKIRT_T: 0.022,        // 墙裙厚
  TRENCH_WALL_T: 0.06,   // 排水沟侧壁厚（沟净宽 = layout width − 2×此值）
  TRENCH_BASE_T: 0.06,   // 排水沟底板厚
  COVER_T: 0.03,         // 沟盖板厚（= drainage.trench.cover.thickness）
  COVER_GAP: 0.03,       // 沟盖板之间净缝
  SUMP_WALL_T: 0.12,     // 排污井井壁厚
  SUMP_BASE_T: 0.15,     // 排污井底板厚
  SUMP_FRAME_W: 0.06,    // 排污井盖板角钢框宽
  DOOR_FRAME_W: 0.05,    // 门框料宽
  WIN_FRAME_W: 0.05,     // 窗框料宽
  WIN_FRAME_D: 0.12,     // 窗框料深（居中于墙厚）
  EMBED: 0.002,          // 搭接量：面层/构件嵌入基体，避免共面 z-fighting
  PUMP_MOTOR_R: 0.15,    // 潜水泵电机半径
  PUMP_MOTOR_H: 0.3,     // 潜水泵电机高
  PUMP_BODY_R: 0.18,     // 潜水泵泵壳半径
  PUMP_BODY_H: 0.22,     // 潜水泵泵壳高
  PUMP_NOZZLE_R: 0.05,   // 潜水泵出水口半径
  PUMP_NOZZLE_H: 0.12,   // 潜水泵出水口高
  RISER_OFFSET: 0.2,     // 排污立管距墙内表面距离
  RISER_OUT: 0.3,        // 排污立管出墙长度
  ELBOW_R: 0.045,        // 弯头近似半径
  CLOSER_L: 0.24,        // 闭门器主体长
  HAZARD_PANEL: 0.6,     // 墙面防撞标识块边长
  HAZARD_STRIPE_W: 0.06, // 防撞标识斜条纹宽
  HAZARD_STRIPE_L: 0.5,  // 防撞标识斜条纹长
  HAZARD_STRIPE_PITCH: 0.14, // 防撞标识斜条纹间距
  BAND_W: 0.15,          // 地面禁停标识带宽
  BAND_T: 0.002,         // 地面禁停标识厚度
  BAND_STROKE_W: 0.07,   // 地面禁停斜条纹宽
  BAND_STROKE_L: 0.13,   // 地面禁停斜条纹长
  FLOAT_R: 0.05,         // 液位浮球半径
  CABLE_R: 0.008,        // 电缆半径
};

/* ═══════════════════════════════════════════════════════════════════════════
 * 几何工具（不依赖 ctx，可单独复用）
 * ═══════════════════════════════════════════════════════════════════════════ */

/** 轴对齐长方体图元（世界坐标直接给出） */
function boxPart(THREE, x0, x1, y0, y1, z0, z1) {
  return {
    geo: new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0),
    pos: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2],
  };
}

/** 带旋转的长方体图元（size 为未旋转前的局部尺寸，rot 为 XYZ 欧拉角） */
function boxPartRot(THREE, sx, sy, sz, cx, cy, cz, rx, ry, rz) {
  return {
    geo: new THREE.BoxGeometry(sx, sy, sz),
    pos: [cx, cy, cz],
    rot: [rx || 0, ry || 0, rz || 0],
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

/** 球图元 */
function spherePart(THREE, r, cx, cy, cz, seg) {
  const s = seg || 12;
  return {
    geo: new THREE.SphereGeometry(r, s, Math.max(6, s >> 1), 0, Math.PI * 2, 0, Math.PI * 2),
    pos: [cx, cy, cz],
  };
}

/**
 * 合并若干图元为单个 BufferGeometry（控制 draw call）。
 * 所有图元均无索引化后按 position / normal / uv 顺序拼接。
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
    m.compose(
      new THREE.Vector3(p.pos[0], p.pos[1], p.pos[2]),
      q,
      one,
    );
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

/* ═══════════════════════════════════════════════════════════════════════════
 * 主构建函数
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * @param {object} ctx 见 CONTRACT 4.2：{ THREE, mat, rng, pois, layout, options }
 * @returns {THREE.Group}
 */
export function buildShell(ctx) {
  const THREE = ctx.THREE;
  const mat = ctx.mat;
  const layout = ctx.layout;
  const rng = ctx.rng;
  const quality = (ctx.options && ctx.options.quality) || 'medium';
  const SEG = quality === 'low' ? 8 : 16;

  const group = new THREE.Group();
  group.name = 'SHELL';

  /* ── 真值表读取 ─────────────────────────────────────────────────────────── */
  const room = layout.room;
  const B = room.bounds;
  const WT = room.wallThickness;
  const FLOOR_Y = room.floorY;
  const TOP_Y = room.totalHeight;                 // 结构顶 = 顶棚面 = 梁顶
  const BEAM_BOTTOM_Y = room.clearHeight;         // 梁底净高

  const OUT_X0 = B.minX - WT;
  const OUT_X1 = B.maxX + WT;
  const OUT_Z0 = B.minZ - WT;
  const OUT_Z1 = B.maxZ + WT;

  const arch = layout.architecture;
  const door = arch.door;
  const win = arch.window;
  const drain = layout.drainage;
  const trench = drain.trench;

  const sumps = drain.sumps.slice().sort((a, b) => a.position[0] - b.position[0]);
  const sumpW = sumps[0];
  const sumpE = sumps[1];
  const SUMP_HALF = sumps[0].size / 2;

  const add = (geo, materialName, name) => {
    const mesh = new THREE.Mesh(geo, mat(materialName));
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  /** POI 挂接：基线 store 与引擎别名二选一（CONTRACT 4.5） */
  const registerPoi = (poiId, mesh) => {
    if (ctx.pois && typeof ctx.pois.register === 'function') ctx.pois.register(poiId, mesh);
    else if (ctx.poiIndex && typeof ctx.poiIndex.register === 'function') ctx.poiIndex.register(poiId, mesh);
  };

  /* ═════════════════════════════════════════════════════════════════════════
   * 1. 地坪（环氧防滑）：结构层厚 K.FLOOR_T，顶面 = room.floorY
   *    开洞：排水沟槽 + 两座排污井井口，取二者并集。
   * ═════════════════════════════════════════════════════════════════════════ */
  const TZ = trench.z;
  const TW = trench.width;
  const TD = trench.depth;
  const TZ0 = TZ - TW / 2;
  const TZ1 = TZ + TW / 2;
  const SX0 = sumpW.position[0] - SUMP_HALF;
  const SX1 = sumpW.position[0] + SUMP_HALF;
  const EX0 = sumpE.position[0] - SUMP_HALF;
  const EX1 = sumpE.position[0] + SUMP_HALF;
  const SZ0 = TZ - SUMP_HALF;
  const SZ1 = TZ + SUMP_HALF;

  // 沟槽与井口相交段由井口覆盖，沟槽边界取井内侧壁
  const BAND_FROM = Math.max(SX1, trench.xMin);
  const BAND_TO = Math.min(EX0, trench.xMax);
  if (BAND_FROM > SX1 + 1e-6 || BAND_TO < EX0 - 1e-6) {
    console.warn('[shell] 排水沟端点未落入排污井口范围，沟槽边界改按真值表取值');
  }

  // 开洞轮廓（世界 XZ，逆时针）：两座井口 + 沟槽的并集边界
  const holePoly = [
    [SX0, SZ0], [SX1, SZ0], [SX1, TZ0], [BAND_TO, TZ0],
    [BAND_TO, SZ0], [EX1, SZ0], [EX1, SZ1], [EX0, SZ1],
    [EX0, TZ1], [BAND_FROM, TZ1], [BAND_FROM, SZ1], [SX0, SZ1],
  ];

  {
    const shape = new THREE.Shape();
    // 外轮廓：shape 平面 = 世界 XZ，shape.y = −world.z
    shape.moveTo(OUT_X0, -OUT_Z0);
    shape.lineTo(OUT_X1, -OUT_Z0);
    shape.lineTo(OUT_X1, -OUT_Z1);
    shape.lineTo(OUT_X0, -OUT_Z1);
    shape.closePath();

    const hole = new THREE.Path();
    holePoly.forEach((p, i) => {
      const sx = p[0];
      const sy = -p[1];
      if (i === 0) hole.moveTo(sx, sy);
      else hole.lineTo(sx, sy);
    });
    hole.closePath();
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: K.FLOOR_T,
      bevelEnabled: false,
      steps: 1,
    });
    geo.rotateX(-Math.PI / 2);            // shape 平面 → 世界 XZ；挤出方向 +Z → +Y
    geo.translate(0, -K.FLOOR_T, 0);     // 完成面落到 room.floorY

    // UV 按房间净尺寸归一化（顶面铺装连续，侧面贴边忽略）
    const pa = geo.attributes.position;
    const ua = geo.attributes.uv;
    for (let i = 0; i < pa.count; i++) {
      ua.setXY(
        i,
        (pa.getX(i) - B.minX) / (B.maxX - B.minX),
        (pa.getZ(i) - B.minZ) / (B.maxZ - B.minZ),
      );
    }
    ua.needsUpdate = true;

    const floorMesh = add(geo, 'floor', 'SHELL_FLOOR_01');
    registerPoi('PR_ROOM_01', floorMesh);
  }

  /* ═════════════════════════════════════════════════════════════════════════
   * 2. 四周墙体（内表面 = room.bounds，厚 room.wallThickness，顶 = TOP_Y）
   * ═════════════════════════════════════════════════════════════════════════ */
  const doorX = door.position[0];
  const doorW = door.width;
  const doorH = door.height;
  const DX0 = doorX - doorW / 2;
  const DX1 = doorX + doorW / 2;

  const winX = win.position[0];
  const winZ = win.position[1];
  const winW = win.width;
  const winH = win.height;
  const WZ0 = winZ - winW / 2;
  const WZ1 = winZ + winW / 2;
  const WIN_SILL = win.sillY;
  const WIN_TOP = win.sillY + win.height;

  /** 某一面墙的墙身（不含门/窗洞口），返回图元数组 */
  function wallBody(side) {
    const parts = [];
    const push = (x0, x1, y0, y1, z0, z1) => parts.push(boxPart(THREE, x0, x1, y0, y1, z0, z1));
    if (side === 'south' || side === 'north') {
      const z0 = side === 'south' ? B.minZ - WT : B.maxZ;
      const z1 = side === 'south' ? B.minZ : B.maxZ + WT;
      if (side === 'south') {
        push(OUT_X0, DX0, FLOOR_Y, TOP_Y, z0, z1);            // 门左墙身
        push(DX1, OUT_X1, FLOOR_Y, TOP_Y, z0, z1);            // 门右墙身
        push(DX0, DX1, FLOOR_Y + doorH, TOP_Y, z0, z1);       // 门楣
      } else {
        push(OUT_X0, OUT_X1, FLOOR_Y, TOP_Y, z0, z1);
      }
    } else {
      const x0 = side === 'west' ? B.minX - WT : B.maxX;
      const x1 = side === 'west' ? B.minX : B.maxX + WT;
      if (side === 'east') {
        push(x0, x1, FLOOR_Y, TOP_Y, B.minZ, WZ0);            // 窗南墙身
        push(x0, x1, FLOOR_Y, TOP_Y, WZ1, B.maxZ);            // 窗北墙身
        push(x0, x1, FLOOR_Y, WIN_SILL, WZ0, WZ1);            // 窗下墙
        push(x0, x1, WIN_TOP, TOP_Y, WZ0, WZ1);               // 窗上墙
      } else {
        push(x0, x1, FLOOR_Y, TOP_Y, B.minZ, B.maxZ);
      }
    }
    return parts;
  }

  const walls = [
    { side: 'south', name: 'SHELL_WALL_SOUTH_01' },
    { side: 'north', name: 'SHELL_WALL_NORTH_01' },
    { side: 'west', name: 'SHELL_WALL_WEST_01' },
    { side: 'east', name: 'SHELL_WALL_EAST_01' },
  ];
  for (const w of walls) {
    add(mergeParts(THREE, wallBody(w.side)), 'wall', w.name);
  }

  /* ── 墙裙（深灰防撞墙裙，借用 cabinetBase 材质）──────────────────────────── */
  const SK = K.SKIRT_T;
  const E = K.EMBED;
  function skirtBody(side) {
    const parts = [];
    const push = (x0, x1, z0, z1) =>
      parts.push(boxPart(THREE, x0, x1, FLOOR_Y, FLOOR_Y + K.SKIRT_H, z0, z1));
    if (side === 'south') {
      const z0 = B.minZ - E;
      const z1 = B.minZ + SK - E;
      push(B.minX + SK - E - 2 * E, DX0 - E, z0, z1);
      push(DX1 + E, B.maxX - SK + E + 2 * E, z0, z1);
    } else if (side === 'north') {
      push(B.minX + SK - E - 2 * E, B.maxX - SK + E + 2 * E, B.maxZ - SK + E, B.maxZ + E);
    } else if (side === 'west') {
      push(B.minX - E, B.minX + SK - E, B.minZ + SK - E - 2 * E, B.maxZ - SK + E + 2 * E);
    } else {
      push(B.maxX - SK + E, B.maxX + E, B.minZ + SK - E - 2 * E, B.maxZ - SK + E + 2 * E);
    }
    return parts;
  }
  for (const w of walls) {
    add(mergeParts(THREE, skirtBody(w.side)), 'cabinetBase', w.name.replace('WALL_', 'SKIRT_'));
  }

  /* ═════════════════════════════════════════════════════════════════════════
   * 3. 顶棚（屋面板下表面 = TOP_Y）与屋面梁（底 = room.clearHeight）
   * ═════════════════════════════════════════════════════════════════════════ */
  add(
    mergeParts(THREE, [
      boxPart(THREE, OUT_X0, OUT_X1, TOP_Y, TOP_Y + K.ROOF_T, OUT_Z0, OUT_Z1),
    ]),
    'ceiling',
    'SHELL_CEILING_01',
  );

  const beams = layout.beams;
  for (let i = 0; i < beams.zPositions.length; i++) {
    const bz = beams.zPositions[i];
    add(
      mergeParts(THREE, [
        boxPart(
          THREE,
          OUT_X0, OUT_X1,
          beams.bottomY, beams.topY,
          bz - beams.width / 2, bz + beams.width / 2,
        ),
      ]),
      'beam',
      `SHELL_BEAM_${String(i + 1).padStart(2, '0')}`,
    );
  }

  /* ═════════════════════════════════════════════════════════════════════════
   * 4. 甲级防火门（框 + 扇 + 闭门器 + 五金 + 标牌）
   * ═════════════════════════════════════════════════════════════════════════ */
  {
    const DW = K.DOOR_FRAME_W;
    const zBack = B.minZ - WT;          // 门框外沿（墙体外皮）
    const zFront = B.minZ;              // 门框内沿（墙体内皮）
    const leafZ = (zBack + zFront) / 2; // 门扇居中于墙厚
    const leafT = door.thickness;
    const leafZ0 = leafZ - leafT / 2;
    const leafZ1 = leafZ + leafT / 2;

    // 门框（嵌入门洞边缘 E，避免共面）
    add(
      mergeParts(THREE, [
        boxPart(THREE, DX0 - E, DX0 + DW, FLOOR_Y, FLOOR_Y + doorH, zBack, zFront),
        boxPart(THREE, DX1 - DW, DX1 + E, FLOOR_Y, FLOOR_Y + doorH, zBack, zFront),
        boxPart(THREE, DX0 - E, DX1 + E, FLOOR_Y + doorH - DW, FLOOR_Y + doorH, zBack, zFront),
      ]),
      'door',
      'SHELL_DOOR_FRAME_01',
    );

    // 门扇（甲级防火门，红色）
    add(
      mergeParts(THREE, [
        boxPart(THREE, DX0 + DW, DX1 - DW, FLOOR_Y, FLOOR_Y + doorH - DW, leafZ0, leafZ1),
        // 门芯板压线（嵌入 4 mm、外露 1 mm，不与门扇共面）
        boxPart(THREE, DX0 + DW + 0.08, DX1 - DW - 0.08, FLOOR_Y + 0.12, FLOOR_Y + doorH - DW - 0.12, leafZ1 - 0.004, leafZ1 + 0.001),
      ]),
      'door',
      'SHELL_DOOR_LEAF_01',
    );

    // 五金：合页（西侧铰链，向北开启）+ 内外执手
    const hw = [];
    for (const hy of [0.25, 1.05, 1.85]) {
      hw.push(cylPart(THREE, 0.022, 0.13, DX0 + DW + 0.018, hy, leafZ1 - 0.02, 'y', SEG));
    }
    for (const hz of [leafZ1 + 0.012, leafZ0 - 0.012]) {
      hw.push(cylPart(THREE, 0.03, 0.026, DX1 - DW - 0.12, 1.05, hz, 'z', SEG));
      hw.push(boxPartRot(THREE, 0.12, 0.028, 0.028, DX1 - DW - 0.18, 1.05, hz + (hz > leafZ ? 0.03 : -0.03), 0, 0, 0));
    }
    add(mergeParts(THREE, hw), 'steelPipe', 'SHELL_DOOR_HARDWARE_01');

    // 闭门器：主体 + 连杆（房间侧门扇上沿）
    add(
      mergeParts(THREE, [
        boxPart(THREE, DX0 + DW + 0.12, DX0 + DW + 0.12 + K.CLOSER_L, FLOOR_Y + doorH - DW - 0.14, FLOOR_Y + doorH - DW - 0.06, leafZ1 - 0.002, leafZ1 + 0.07),
        boxPartRot(THREE, 0.3, 0.022, 0.022, DX0 + DW - 0.06, FLOOR_Y + doorH - DW - 0.02, leafZ1 + 0.035, 0, 0, 0.18),
      ]),
      'steelPipe',
      'SHELL_DOOR_CLOSER_01',
    );

    // 门扇标牌（甲级防火门标识，避开电气专业房号牌）
    const signX0 = DX1 - DW - 0.5;
    add(
      mergeParts(THREE, [
        boxPart(THREE, signX0, signX0 + 0.27, 1.55, 1.7, leafZ1 - 0.002, leafZ1 + 0.004),
      ]),
      'signPlate',
      'SHELL_DOOR_SIGN_01',
    );
    const txt = [];
    for (let i = 0; i < 4; i++) {
      txt.push(boxPart(THREE, signX0 + 0.03 + i * 0.055, signX0 + 0.03 + i * 0.055 + 0.04, 1.575, 1.635, leafZ1 + 0.003, leafZ1 + 0.005));
    }
    txt.push(boxPart(THREE, signX0 + 0.03, signX0 + 0.24, 1.545, 1.56, leafZ1 + 0.003, leafZ1 + 0.005));
    add(mergeParts(THREE, txt), 'signText', 'SHELL_DOOR_SIGN_TEXT_01');
  }

  /* ═════════════════════════════════════════════════════════════════════════
   * 5. 观察窗（窗框 + 玻璃 + 中梃）
   * ═════════════════════════════════════════════════════════════════════════ */
  {
    const FW = K.WIN_FRAME_W;
    const FD = K.WIN_FRAME_D;
    const fx0 = B.maxX + (WT - FD) / 2;
    const fx1 = fx0 + FD;
    const frame = [
      boxPart(THREE, fx0, fx1, WIN_SILL, WIN_TOP, WZ0 - E, WZ0 + FW),
      boxPart(THREE, fx0, fx1, WIN_SILL, WIN_TOP, WZ1 - FW, WZ1 + E),
      boxPart(THREE, fx0, fx1, WIN_TOP - FW, WIN_TOP, WZ0 - E, WZ1 + E),
      boxPart(THREE, fx0, fx1, WIN_SILL, WIN_SILL + FW, WZ0 - E, WZ1 + E),
      boxPart(THREE, fx0, fx1, WIN_SILL + FW, WIN_TOP - FW, winZ - 0.015, winZ + 0.015), // 中梃
    ];
    add(mergeParts(THREE, frame), 'steelPipe', 'SHELL_WINDOW_FRAME_01');

    const gt = win.thickness;
    const gx0 = B.maxX + (WT - gt) / 2;
    add(
      mergeParts(THREE, [
        // 玻璃嵌入框料槽口（各边多压 2 mm，避免与框料共面）
        boxPart(THREE, gx0, gx0 + gt, WIN_SILL + FW - 0.002, WIN_TOP - FW + 0.002, WZ0 + FW - 0.002, WZ1 - FW + 0.002),
      ]),
      'windowGlass',
      'SHELL_WINDOW_GLASS_01',
    );
  }

  /* ═════════════════════════════════════════════════════════════════════════
   * 6. 地面排水沟：沟体（侧壁 + 底板）+ 沟盖板
   *    沟底板贯通 trench.xMin → trench.xMax（两端伸入排污井口），
   *    侧壁与盖板止于两井内侧壁之间。
   * ═════════════════════════════════════════════════════════════════════════ */
  {
    const wallT = K.TRENCH_WALL_T;
    const body = [
      // 底板：贯通全沟长
      boxPart(THREE, trench.xMin, trench.xMax, FLOOR_Y - TD - K.TRENCH_BASE_T, FLOOR_Y - TD, TZ0 - wallT - E, TZ1 + wallT + E),
      // 南侧壁
      boxPart(THREE, BAND_FROM, BAND_TO, FLOOR_Y - TD, FLOOR_Y - K.COVER_T, TZ0 - E, TZ0 + wallT),
      // 北侧壁
      boxPart(THREE, BAND_FROM, BAND_TO, FLOOR_Y - TD, FLOOR_Y - K.COVER_T, TZ1 - wallT, TZ1 + E),
    ];
    add(mergeParts(THREE, body), 'trench', 'SHELL_TRENCH_BODY_01');

    // 沟盖板：节距 = trench.cover.gap，板间净缝 K.COVER_GAP，顶面与地坪齐平
    const pitch = trench.cover.gap;
    const t = trench.cover.thickness;
    const span = BAND_TO - BAND_FROM;
    const n = Math.max(1, Math.floor(span / pitch));
    const panelL = pitch - K.COVER_GAP;
    const used = n * panelL + (n - 1) * K.COVER_GAP;
    const startX = BAND_FROM + (span - used) / 2;
    const covers = [];
    for (let i = 0; i < n; i++) {
      const x0 = startX + i * (panelL + K.COVER_GAP);
      covers.push(boxPart(THREE, x0, x0 + panelL, FLOOR_Y - t, FLOOR_Y, TZ0, TZ1));
    }
    add(mergeParts(THREE, covers), 'grating', 'SHELL_TRENCH_COVER_01');
  }

  /* ═════════════════════════════════════════════════════════════════════════
   * 7. 排污井 ×2：井壁 + 铸铁格栅盖板 + 潜水排污泵 + 排污立管 + 液位浮球
   * ═════════════════════════════════════════════════════════════════════════ */
  const sumpCovers = [];
  sumps.forEach((sump, idx) => {
    const tag = String(idx + 1).padStart(2, '0');
    const sx = sump.position[0];
    const sz = sump.position[1];
    const size = sump.size;
    const half = size / 2;
    const depth = sump.depth;
    const pitY1 = FLOOR_Y - depth;          // 井底
    const inX0 = sx - half + E;             // 井壁内表面（比井口内收 E，避免与地坪切面共面）
    const inX1 = sx + half - E;
    const inZ0 = sz - half + E;
    const inZ1 = sz + half - E;
    const wallOut = half + K.SUMP_WALL_T;   // 井壁外表面（埋入地坪之下）
    const isWest = idx === 0;
    const chanSide = isWest ? 'east' : 'west'; // 朝向排水沟的一侧

    /* ── 井壁（四面）+ 井底板 ─────────────────────────────────────────────── */
    const liner = [];
    const wallY0 = FLOOR_Y - K.FLOOR_T;     // 井壁自地坪结构层底面起算
    const pitBottomY = pitY1 - K.SUMP_BASE_T;

    // 南壁 / 北壁（贯通全宽）
    liner.push(boxPart(THREE, sx - wallOut, sx + wallOut, pitBottomY, wallY0, sz - wallOut, sz - half + E));
    liner.push(boxPart(THREE, sx - wallOut, sx + wallOut, pitBottomY, wallY0, sz + half - E, sz + wallOut));

    // 西壁 / 东壁（朝沟一侧在沟位留出进水缺口，沟位以下仍封闭）
    const gapTop = FLOOR_Y - TD - K.TRENCH_BASE_T;  // 沟底板底面
    function sideWall(xInner, xOuter) {
      const segs = [];
      // 靠南北两侧的全深墙段
      segs.push(boxPart(THREE, xInner, xOuter, pitBottomY, wallY0, sz - half + E, TZ0));
      segs.push(boxPart(THREE, xInner, xOuter, pitBottomY, wallY0, TZ1, sz + half - E));
      // 沟位下方封闭段（承托伸入井内的沟底板）
      segs.push(boxPart(THREE, xInner, xOuter, pitBottomY, gapTop, TZ0, TZ1));
      return segs;
    }
    if (chanSide === 'east') {
      liner.push(...sideWall(sx + half - E, sx + wallOut));
    } else {
      liner.push(...sideWall(sx - wallOut, sx - half + E));
    }
    // 井底板
    liner.push(boxPart(THREE, sx - wallOut, sx + wallOut, pitBottomY, pitY1, sz - wallOut, sz + wallOut));

    const linerMesh = add(mergeParts(THREE, liner), 'sumpWall', `SHELL_SUMP_LINER_${tag}`);

    /* ── 铸铁格栅盖板：角钢框 + 格栅条 + 加强筋，顶面与地坪齐平 ──────────── */
    const fw = K.SUMP_FRAME_W;
    const ct = sump.cover.thickness;
    const ringOuter = half - E;
    const ringInner = ringOuter - fw;
    const coverParts = [
      boxPart(THREE, sx - ringOuter, sx + ringOuter, FLOOR_Y - ct, FLOOR_Y, sz - ringOuter, sz - ringInner),
      boxPart(THREE, sx - ringOuter, sx + ringOuter, FLOOR_Y - ct, FLOOR_Y, sz + ringInner, sz + ringOuter),
      boxPart(THREE, sx - ringOuter, sx - ringInner, FLOOR_Y - ct, FLOOR_Y, sz - ringInner, sz + ringInner),
      boxPart(THREE, sx + ringInner, sx + ringOuter, FLOOR_Y - ct, FLOOR_Y, sz - ringInner, sz + ringInner),
    ];
    const bw = sump.cover.barWidth;
    const bg = sump.cover.barGap;
    const clearSpan = 2 * ringInner;
    const nb = Math.max(1, Math.floor((clearSpan + bg) / (bw + bg)));
    const barsLen = nb * bw + (nb - 1) * bg;
    const bStart = sz - barsLen / 2;
    for (let i = 0; i < nb; i++) {
      const z0 = bStart + i * (bw + bg);
      coverParts.push(boxPart(THREE, sx - ringInner, sx + ringInner, FLOOR_Y - ct, FLOOR_Y, z0, z0 + bw));
    }
    // 加强筋（低于格栅条顶面，避免共面）
    for (const dx of [-0.25, 0.25]) {
      coverParts.push(boxPart(THREE, sx + dx - 0.015, sx + dx + 0.015, FLOOR_Y - ct, FLOOR_Y - 0.012, sz - ringInner, sz + ringInner));
    }
    const coverMesh = add(mergeParts(THREE, coverParts), 'grating', `SHELL_SUMP_COVER_${tag}`);
    sumpCovers.push(coverMesh);

    /* ── 井内潜水排污泵 ───────────────────────────────────────────────────── */
    const pumpPos = sump.pump.position;      // [x, z, y]：y = 泵底距井底高度
    const baseY = pitY1 + pumpPos[2];
    const motorTop = baseY + K.PUMP_MOTOR_H;
    const bodyTop = motorTop + K.PUMP_BODY_H;
    const nozzleTop = bodyTop + K.PUMP_NOZZLE_H;

    add(
      mergeParts(THREE, [
        boxPart(THREE, sx - 0.17, sx + 0.17, pitY1, baseY, sz - 0.17, sz + 0.17),
      ]),
      'skid',
      `SHELL_SUMP_PUMP_${tag}_BASE`,
    );
    const motorMesh = add(
      mergeParts(THREE, [
        cylPart(THREE, K.PUMP_MOTOR_R, K.PUMP_MOTOR_H, sx, baseY + K.PUMP_MOTOR_H / 2, sz, 'y', SEG),
      ]),
      'motorBody',
      `SHELL_SUMP_PUMP_${tag}_MOTOR`,
    );
    const bodyMesh = add(
      mergeParts(THREE, [
        cylPart(THREE, K.PUMP_BODY_R, K.PUMP_BODY_H, sx, motorTop + K.PUMP_BODY_H / 2, sz, 'y', SEG),
      ]),
      'pumpCasing',
      `SHELL_SUMP_PUMP_${tag}_BODY`,
    );
    add(
      mergeParts(THREE, [
        cylPart(THREE, K.PUMP_NOZZLE_R, K.PUMP_NOZZLE_H, sx, bodyTop + K.PUMP_NOZZLE_H / 2, sz, 'y', SEG),
      ]),
      'steelPipe',
      `SHELL_SUMP_PUMP_${tag}_NOZZLE`,
    );

    /* ── 排污立管 DN50：沿墙上升至 dischargePipe.topY，再穿墙排出 ────────── */
    const dp = sump.dischargePipe;
    const riserX = dp.wall === 'west' ? B.minX + K.RISER_OFFSET : B.maxX - K.RISER_OFFSET;
    const outX = dp.wall === 'west' ? B.minX - K.RISER_OUT : B.maxX + K.RISER_OUT;
    const riserParts = [];
    // 立管
    riserParts.push(cylPart(THREE, dp.radius, dp.topY - nozzleTop, riserX, (nozzleTop + dp.topY) / 2, sz, 'y', SEG));
    // 泵出口 → 立管 水平段
    riserParts.push(cylPart(THREE, dp.radius, Math.abs(riserX - sx), (riserX + sx) / 2, nozzleTop, sz, 'x', SEG));
    riserParts.push(spherePart(THREE, K.ELBOW_R, sx, nozzleTop, sz, SEG));
    riserParts.push(spherePart(THREE, K.ELBOW_R, riserX, nozzleTop, sz, SEG));
    riserParts.push(spherePart(THREE, K.ELBOW_R, riserX, dp.topY, sz, SEG));
    const riserMesh = add(mergeParts(THREE, riserParts), 'steelPipe', `SHELL_SUMP_RISER_${tag}`);

    /* 穿墙段 + 墙面抱箍：依附于墙面，剖视隐墙时随墙一同移除，避免悬空构件 */
    const riserWallParts = [];
    // 顶部水平段穿墙
    riserWallParts.push(cylPart(THREE, dp.radius, Math.abs(outX - riserX), (riserX + outX) / 2, dp.topY, sz, 'x', SEG));
    // 墙面抱箍
    for (const by of [0.8, 1.9]) {
      const bx0 = dp.wall === 'west' ? B.minX : riserX;
      const bx1 = dp.wall === 'west' ? riserX : B.maxX;
      riserWallParts.push(boxPart(THREE, bx0, bx1, by - 0.03, by + 0.03, sz - 0.03, sz + 0.03));
    }
    const riserWallMesh = add(mergeParts(THREE, riserWallParts), 'steelPipe', `SHELL_SUMP_RISER_WALL_${dp.wall.toUpperCase()}_${tag}`);

    /* ── 液位浮球开关 ─────────────────────────────────────────────────────── */
    const fx = sx + 0.4;
    const fz = sz + 0.4;
    add(
      mergeParts(THREE, [spherePart(THREE, K.FLOAT_R, fx, FLOOR_Y - 0.45, fz, SEG)]),
      'steelPipe',
      `SHELL_SUMP_FLOAT_${tag}`,
    );
    add(
      mergeParts(THREE, [
        cylPart(THREE, K.CABLE_R, 0.24, fx, FLOOR_Y - 0.33, fz, 'y', 6),
      ]),
      'cable',
      `SHELL_SUMP_FLOAT_CABLE_${tag}`,
    );

    /* ── POI 挂接：井盖 + 潜水泵 + 井壁 + 立管（id 由 layout 的 sump.id 派生）── */
    const poiId = `PR_${sump.id}`;
    registerPoi(poiId, coverMesh);
    registerPoi(poiId, motorMesh);
    registerPoi(poiId, bodyMesh);
    registerPoi(poiId, linerMesh);
    registerPoi(poiId, riserMesh);
    registerPoi(poiId, riserWallMesh);
  });

  /* ═════════════════════════════════════════════════════════════════════════
   * 8. 防撞 / 禁停标识
   * ═════════════════════════════════════════════════════════════════════════ */
  {
    // 门侧墙面防撞标识（黄底 + 深灰斜条纹）
    const panelZ0 = B.minZ - 0.004;
    const panelZ1 = B.minZ;
    const stripeZ0 = B.minZ + 0.0;
    const stripeZ1 = B.minZ + 0.002;
    const base = [];
    const stripes = [];
    for (const px of [DX0 - 0.4 - K.HAZARD_PANEL / 2, DX1 + 0.4 + K.HAZARD_PANEL / 2]) {
      base.push(boxPart(THREE, px - K.HAZARD_PANEL / 2, px + K.HAZARD_PANEL / 2, 1.3, 1.3 + K.HAZARD_PANEL, panelZ0, panelZ1));
      const n = 5;
      for (let i = 0; i < n; i++) {
        const off = (i - (n - 1) / 2) * K.HAZARD_STRIPE_PITCH;
        stripes.push(
          boxPartRot(
            THREE,
            K.HAZARD_STRIPE_W, K.HAZARD_STRIPE_L, 0.002,
            px + off, 1.3 + K.HAZARD_PANEL / 2, (stripeZ0 + stripeZ1) / 2,
            0, 0, Math.PI / 4,
          ),
        );
      }
    }
    add(mergeParts(THREE, base), 'guard', 'SHELL_HAZARD_DOOR_01');
    add(mergeParts(THREE, stripes), 'cabinetBase', 'SHELL_HAZARD_DOOR_DARK_01');

    // 地面禁停标识（排水沟两侧各一条，沿沟全长）
    const bandBase = [];
    const bandStripe = [];
    const bandX0 = BAND_FROM;
    const bandX1 = BAND_TO;
    for (const bz of [TZ - 0.35, TZ + 0.35]) {
      bandBase.push(boxPart(THREE, bandX0, bandX1, FLOOR_Y + 0.001, FLOOR_Y + 0.001 + K.BAND_T, bz - K.BAND_W / 2, bz + K.BAND_W / 2));
      let x = bandX0 + 0.2;
      while (x < bandX1 - 0.1) {
        bandStripe.push(
          boxPartRot(
            THREE,
            K.BAND_STROKE_W, K.BAND_T, K.BAND_STROKE_L,
            x, FLOOR_Y + 0.001 + K.BAND_T, bz,
            0, Math.PI / 4, 0,
          ),
        );
        x += 0.6 + (rng() - 0.5) * 0.08;
      }
    }
    add(mergeParts(THREE, bandBase), 'guard', 'SHELL_HAZARD_FLOOR_01');
    add(mergeParts(THREE, bandStripe), 'cabinetBase', 'SHELL_HAZARD_FLOOR_DARK_01');
  }

  return group;
}

export default buildShell;
