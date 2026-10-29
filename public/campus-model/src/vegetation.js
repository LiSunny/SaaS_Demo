/**
 * vegetation.js — 通用大学校园示例模型 · 植被模块
 *
 * ★ 依赖 ctx = { THREE, mat, rng, pois, layout, options }，不 import 任何外部模块
 *   （不 import core/*，也不 import layout.js，一切几何真值来自 ctx.layout）。
 *
 * ── 树种（4 种，造型可区分）────────────────────────────────────────────
 *   CAMPUS_TREE_PINUS_TABULAEFORMIS  针叶常绿 · 油松   细高干 + 4 层锥形树冠，H≈13.4m
 *   CAMPUS_TREE_ROBINIA_PSEUDACACIA  阔叶乔木 · 国槐   粗干 + 3 团不规则球冠，H≈12.1m
 *   CAMPUS_TREE_BETULA_PLATYPHYLLA   落叶乔木 · 白桦   浅色干 + 略扁球冠，H≈10.9m（随季换色）
 *   CAMPUS_TREE_VIBURNUM_OPULUS      小乔木 · 灌木     低矮球状，H≈4.3m
 *   CAMPUS_SHRUB_HEDGE                绿篱（绿地边缘灌木丛）
 *   CAMPUS_SHRUB_BLOOM                花色灌木（春季开花）
 *
 * ── 实现要点 ──────────────────────────────────────────────────────────
 *   1. 每个树种 2 个 InstancedMesh（树干 / 树冠），灌木 2 个 —— 全模块 10 个 draw call，
 *      绝不逐棵建 Mesh。
 *   2. 落点：行道树（main/secondary 道路两侧列植）+ 绿地散植 + 建筑周边组团；
 *      统一经 isBlocked(x, z, canopyRadius) 排除道路路面 / 广场 / 水面 / 球场 / 建筑占地。
 *      道路段与建筑走均匀网格索引，isBlocked 只查邻近格（102 路 / 60 栋下仍为微秒级）。
 *   3. 树干与建筑包围盒间距 ≥ 6m（树冠半径 ≤4.2m，故树冠不会穿模）。
 *   4. 四季：setSeason(ctx, group, season) 与返回值上的 setSeason(season) 均可调用，
 *      通过切换树冠材质 + 落叶树种冬季隐藏树冠实现（不修改共享材质实例）。
 *   5. 画质：返回值上的 setQuality(quality, ctx) 可按新画质重建（复用同一批落点，
 *      不会重排布局），供 app.js 的画质预设调用。
 *   6. 落点预算按用地规模折算（见 computeBudget）：用地面积比 × v2.0.1 基准，
 *      再用三角面红线收敛；绿地分配受「几何容量」约束，窄条绿地不会被塞满。
 *
 * ── stats 口径 ────────────────────────────────────────────────────────
 *   treeCount     = 树木棵数（每棵树 = 1 棵，树干与树冠是同一棵树的两个部件网格）
 *   shrubCount    = 灌木实例数（绿篱 + 花色灌木）
 *   instanceCount = 参与渲染的植被对象数 = treeCount + shrubCount
 *                   （stats.rawInstanceSlots 为各 InstancedMesh 实例槽总数，含树干/树冠两部件）
 *   triangles     = Σ(geometry.index.count / 3) × mesh.count，逐网格真实累加；
 *                   取满配置（树冠全显）值，冬季隐藏落叶树冠后实际渲染面更少
 *
 * @author 植被模块
 */

export function buildVegetation(ctx) {
  if (!ctx || !ctx.THREE) throw new Error('[vegetation] ctx 缺少 THREE');
  const { THREE, mat, rng, pois, layout, options } = ctx;
  if (!layout) throw new Error('[vegetation] ctx 缺少 layout');

  const opts = options || {};
  const quality = opts.quality || 'high';
  const factor = QUALITY_FACTOR[quality] !== undefined ? QUALITY_FACTOR[quality] : 1;
  const seg = QUALITY_SEG[quality] !== undefined ? QUALITY_SEG[quality] : 6;
  const season0 = SEASONS.indexOf(opts.season) >= 0 ? opts.season : 'summer';

  /* ── 1. 布局索引（道路 / 矩形禁区 / 水体 / 建筑 / 绿地）────────────── */

  const roads = (layout.roads || []).map((r) => {
    const pts = (r.points || []).map((p) => [p[0], p[1]]);
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) segs.push([pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]]);
    return { id: r.id, type: r.type, width: r.width, half: (r.width || 8) / 2, pts, segs };
  });

  const rectZones = [];
  for (const p of layout.plazas || []) {
    rectZones.push({
      id: p.id, kind: 'plaza',
      x0: p.center[0] - p.w / 2, x1: p.center[0] + p.w / 2,
      z0: p.center[1] - p.d / 2, z1: p.center[1] + p.d / 2,
      margin: 1.5,
    });
  }
  for (const c of layout.courts || []) {
    rectZones.push({
      id: c.id, kind: c.type,
      x0: c.center[0] - c.w / 2, x1: c.center[0] + c.w / 2,
      z0: c.center[1] - c.d / 2, z1: c.center[1] + c.d / 2,
      margin: 1.5,
    });
  }
  for (const p of layout.parking || []) {
    rectZones.push({
      id: p.id, kind: 'parking',
      x0: p.center[0] - p.w / 2, x1: p.center[0] + p.w / 2,
      z0: p.center[1] - p.d / 2, z1: p.center[1] + p.d / 2,
      margin: 1.5,
    });
  }

  const waterZones = (layout.water || []).map((w) => ({
    id: w.id, cx: w.center[0], cz: w.center[1], rx: w.rx, rz: w.rz, margin: 2,
  }));

  const buildingZones = (layout.buildings || []).map((b) => ({
    id: b.id,
    cx: b.position[0], cz: b.position[2],
    hw: (b.footprint ? b.footprint.w : 20) / 2,
    hd: (b.footprint ? b.footprint.d : 20) / 2,
    rot: b.rotation || 0,
  }));

  const greens = (layout.greenAreas || []).map((g) => {
    const r = normRect(g.rect);
    const w = r.x1 - r.x0;
    const d = r.z1 - r.z0;
    const area = Math.max(1, w * d);
    return {
      id: g.id, name: g.name, density: g.density === undefined ? 0.5 : g.density,
      zone: g.zone || null,
      area, cx: (r.x0 + r.x1) / 2, cz: (r.z0 + r.z1) / 2,
      x0: r.x0, z0: r.z0, x1: r.x1, z1: r.z1,
      perim: 2 * (w + d),
      long: Math.max(w, d), short: Math.min(w, d),
      alongX: w >= d,                       // 长轴方向（窄条绿地沿长轴线性布点）
      capacity: 0,                          // 几何容量：最小间距下可容纳的树数
      trees: 0,
    };
  });

  /* ── 2. 空间索引（道路段 / 建筑）───────────────────────────────────── */

  /* isBlocked 的最远判定距离：道路半宽上限 13 + 树冠半径上限 4.2 */
  const ROAD_LOOKAHEAD = 20;
  /* 建筑判定：退距 6 + 树冠半径上限 4.2 */
  const BLD_LOOKAHEAD = 12;
  const GRID_CELL = 40;

  const roadIndex = new GridIndex(GRID_CELL);
  for (const r of roads) {
    for (const sg of r.segs) {
      roadIndex.insertBox(
        Math.min(sg[0], sg[2]) - ROAD_LOOKAHEAD, Math.min(sg[1], sg[3]) - ROAD_LOOKAHEAD,
        Math.max(sg[0], sg[2]) + ROAD_LOOKAHEAD, Math.max(sg[1], sg[3]) + ROAD_LOOKAHEAD,
        { half: r.half, width: r.width, seg: sg },
      );
    }
  }
  const bldIndex = new GridIndex(GRID_CELL);
  for (const b of buildingZones) {
    const ext = Math.hypot(b.hw, b.hd) + BLD_LOOKAHEAD;
    bldIndex.insertBox(b.cx - ext, b.cz - ext, b.cx + ext, b.cz + ext, b);
  }
  const roadScratch = [];
  const bldScratch = [];

  /* ── 3. 通用碰撞排除 ──────────────────────────────────────────────── */

  /**
   * 落点排除判定：道路路面 / 广场 / 球场 / 停车场 / 水面 / 建筑占地。
   * 道路段与建筑走均匀网格索引，只查落点所在格及相邻格（3×3）。
   * 道路净距：车行道 = 道路半宽 + 树冠半径（树冠不压车行面）；
   *          前庭步道（宽 ≤ PATH_WIDTH_MAX）= 道路半宽 + PATH_TRUNK_CLEARANCE（树干离铺装边 ≥ 1m，树冠可遮荫）。
   * @param {number} x 世界坐标 X
   * @param {number} z 世界坐标 Z
   * @param {number} canopyRadius 树冠半径（m）
   */
  function isBlocked(x, z, canopyRadius) {
    // 道路：点到线段距离 < 道路半宽 + 净距余量
    const rs = roadIndex.query(x, z, roadScratch);
    for (let i = 0; i < rs.length; i++) {
      const e = rs[i];
      const sg = e.seg;
      // 车行道：树冠不得压车行面；前庭步道（≤ PATH_WIDTH_MAX）：只要求树干离铺装边 ≥ PATH_TRUNK_CLEARANCE
      const clear = e.width <= PATH_WIDTH_MAX ? Math.min(canopyRadius, PATH_TRUNK_CLEARANCE) : canopyRadius;
      if (distToSegment(x, z, sg[0], sg[1], sg[2], sg[3]) < e.half + clear) return true;
    }
    // 广场 / 球场 / 停车场（矩形）
    for (let i = 0; i < rectZones.length; i++) {
      const r = rectZones[i];
      if (x > r.x0 - r.margin && x < r.x1 + r.margin && z > r.z0 - r.margin && z < r.z1 + r.margin) return true;
    }
    // 水面（椭圆）
    for (let i = 0; i < waterZones.length; i++) {
      const w = waterZones[i];
      const nx = (x - w.cx) / (w.rx + w.margin);
      const nz = (z - w.cz) / (w.rz + w.margin);
      if (nx * nx + nz * nz <= 1) return true;
    }
    // 建筑占地：树干与包围盒保持 ≥ BUILDING_CLEARANCE(6m)
    const bs = bldIndex.query(x, z, bldScratch);
    for (let i = 0; i < bs.length; i++) {
      if (distToBuildingRect(x, z, bs[i]) < BUILDING_CLEARANCE) return true;
    }
    return false;
  }

  /* ── 4. 空间占用（避免树木互相重叠）──────────────────────────────── */

  const treeGrid = new PointGrid(12);
  const shrubGrid = new PointGrid(6);

  /* ── 5. 落点预算（按用地规模折算 + 三角面红线收敛）────────────────── */

  const speciesRef = speciesTable(THREE, QUALITY_SEG.high);
  const shrubTri = triCount(buildShrubGeometry(THREE));
  const budget = computeBudget(layout, greens, speciesRef, shrubTri);
  const picker = createPicker(rng, budget.quotas, SOURCE_WEIGHTS);

  const plantings = [];   // { x, z, species, scale, yaw }
  const shrubs = [];      // { x, z, scale, yaw, bloom }

  /* ── 6. 建筑周边组团（先放，位置最受限）──────────────────────────── */

  placeBuildingClusters(rng, layout, picker, isBlocked, treeGrid, plantings);

  /* ── 7. 行道树：沿 main / secondary 道路两侧列植 ──────────────────── */

  placeStreetTrees(rng, roads, budget.streetTarget, picker, isBlocked, treeGrid, plantings);

  /* ── 8. 绿地散植：吃掉「总预算 - 前两类已落点」的余额 ─────────────── */

  const greenTarget = Math.max(0, Math.min(
    budget.treeTarget - plantings.length,
    picker.remainingTotal(),
  ));
  placeGreenTrees(rng, greens, greenTarget, picker, isBlocked, treeGrid, plantings);

  /* ── 9. 灌木与绿篱 ────────────────────────────────────────────────── */

  placeShrubs(rng, greens, budget.shrubTarget, isBlocked, treeGrid, shrubGrid, shrubs);

  /* ── 10. 生成 InstancedMesh ──────────────────────────────────────── */

  // 完整落点表按画质抽样（中/低画质是同一批落点的子集，不重排布局）
  const full = { plantings, shrubs };
  const speciesCur = quality === 'high' ? speciesRef : speciesTable(THREE, seg);
  const built = assembleVegetation(
    THREE, mat,
    subsampleBySpecies(full.plantings, factor),
    strideSample(full.shrubs, factor),
    quality, seg, speciesCur,
  );
  const group = built.group;
  const stats = built.stats;
  const state = built.state;

  /* ── 11. 四季状态 ─────────────────────────────────────────────────── */

  group.userData.vegetation = state;
  applySeason(ctx, state, season0);

  if (opts.showTrees === false) group.visible = false;

  /* ── 12. POI 注册（绿地景观）──────────────────────────────────────── */

  registerGreenPOIs(pois, greens);

  // 完整落点表，供画质重建（setQuality）复用，避免切换画质时树木重排
  return makeResult(ctx, built, full);
}

/**
 * 由落点表装配 InstancedMesh 并计算统计。
 * @returns {{group: THREE.Group, stats: object, state: object}}
 */
function assembleVegetation(THREE, mat, plantings, shrubs, quality, seg, speciesOverride) {
  const group = new THREE.Group();
  group.name = 'CAMPUS_VEGETATION';

  const species = speciesOverride || speciesTable(THREE, seg);
  const bySpecies = {};
  for (const key in species) bySpecies[key] = 0;

  const state = {
    meshes: {},       // key -> { trunk: Mesh, crown: Mesh }
    materials: {},    // key -> { trunk, crown }
    crownGroup: {},   // key -> 树冠 mesh（冬季隐藏）
    shrubs: {},
    season: 'summer',
  };

  const meshes = [];

  for (const key in species) {
    const spec = species[key];
    const list = plantings.filter((p) => p.species === key);
    bySpecies[key] = list.length;
    if (list.length === 0) continue;

    const trunkMat = mat(spec.trunkMaterial);
    const crownMat = mat(spec.crownMaterial);
    state.materials[key] = { trunk: trunkMat, crown: crownMat };

    const trunkMesh = new THREE.InstancedMesh(spec.trunk, trunkMat, list.length);
    const crownMesh = new THREE.InstancedMesh(spec.crown, crownMat, list.length);
    trunkMesh.name = spec.trunkName;
    crownMesh.name = spec.id;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      dummy.position.set(p.x, 0, p.z);
      dummy.rotation.set(0, p.yaw, 0);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(i, dummy.matrix);
      crownMesh.setMatrixAt(i, dummy.matrix);
    }
    trunkMesh.instanceMatrix.needsUpdate = true;
    crownMesh.instanceMatrix.needsUpdate = true;

    const shadow = quality !== 'low';
    trunkMesh.castShadow = shadow;
    trunkMesh.receiveShadow = shadow;
    crownMesh.castShadow = shadow;
    crownMesh.receiveShadow = shadow;

    group.add(trunkMesh);
    group.add(crownMesh);
    meshes.push(trunkMesh, crownMesh);
    state.meshes[key] = { trunk: trunkMesh, crown: crownMesh };
    state.crownGroup[key] = crownMesh;
  }

  // 灌木：绿篱 + 花色灌木（两种材质，便于四季切换）
  const hedgeList = shrubs.filter((s) => !s.bloom);
  const bloomList = shrubs.filter((s) => s.bloom);
  const shrubGeo = buildShrubGeometry(THREE);
  const shrubMesh = makeShrubMesh(THREE, shrubGeo, mat('shrub'), hedgeList, 'CAMPUS_SHRUB_HEDGE', quality);
  const bloomMesh = makeShrubMesh(THREE, shrubGeo, mat('leafFlower'), bloomList, 'CAMPUS_SHRUB_BLOOM', quality);
  if (shrubMesh) { group.add(shrubMesh); meshes.push(shrubMesh); }
  if (bloomMesh) { group.add(bloomMesh); meshes.push(bloomMesh); }
  state.shrubs = { hedge: shrubMesh, bloom: bloomMesh };

  /* 统计：逐网格真实累加（geometry.index.count / 3 × 实例数） */
  let triangles = 0;
  let instanceCount = 0;
  for (const m of meshes) {
    const idx = m.geometry.index;
    const tris = idx ? idx.count / 3 : m.geometry.attributes.position.count / 3;
    triangles += tris * m.count;
    instanceCount += m.count;
  }

  const treeCount = plantings.length;
  const shrubCount = shrubs.length;

  const stats = {
    treeCount,
    shrubCount,
    instanceCount: treeCount + shrubCount,   // 植被对象数（每棵树的干/冠属同一对象）
    triangles: Math.round(triangles),
    bySpecies,
    meshes: meshes.length,
    rawInstanceSlots: instanceCount,         // 各 InstancedMesh 实例槽总数（树干+树冠+灌木）
  };

  return { group, stats, state };
}

/**
 * 组装对外结果对象。
 * setSeason：四季切换；setQuality：按新画质重建（复用同一批落点，不重排布局）。
 */
function makeResult(ctx, built, full) {
  const result = {
    group: built.group,
    stats: built.stats,
    /** 四季切换：setSeason('spring' | 'summer' | 'autumn' | 'winter') */
    setSeason: (season) => setSeason(ctx, built.group, season),
    /** 画质重建：setQuality('high' | 'medium' | 'low') → 返回新的 { group, stats, ... } */
    setQuality: (quality, newCtx) => {
      const cc = newCtx || ctx;
      cc.options = cc.options || {};
      cc.options.quality = quality;
      const f = QUALITY_FACTOR[quality] !== undefined ? QUALITY_FACTOR[quality] : 1;
      const s = QUALITY_SEG[quality] !== undefined ? QUALITY_SEG[quality] : 6;
      const trees = subsampleBySpecies(full.plantings, f);
      const shrubSet = strideSample(full.shrubs, f);
      const rebuilt = assembleVegetation(cc.THREE, cc.mat, trees, shrubSet, quality, s);
      rebuilt.group.userData.vegetation = rebuilt.state;
      const season = cc.options.season || built.state.season || 'summer';
      applySeason(cc, rebuilt.state, season);
      if (cc.options.showTrees === false) rebuilt.group.visible = false;
      return makeResult(cc, rebuilt, full);
    },
  };
  return result;
}

/** 按树种等比抽稀（步长抽样，保持空间分布均匀） */
function subsampleBySpecies(list, factor) {
  if (factor >= 1) return list.slice();
  const groups = {};
  for (const p of list) {
    if (!groups[p.species]) groups[p.species] = [];
    groups[p.species].push(p);
  }
  const out = [];
  const stride = 1 / factor;
  for (const key in groups) {
    const g = groups[key];
    for (let i = 0; i < g.length; i += stride) out.push(g[i]);
  }
  return out;
}

/** 等距抽样（保留首尾的空间分布） */
function strideSample(list, factor) {
  if (factor >= 1) return list.slice();
  const stride = 1 / factor;
  const out = [];
  for (let i = 0; i < list.length; i += stride) out.push(list[i]);
  return out;
}

/* ══════════════════════════════════════════════════════════════════════
 * 四季切换
 * ════════════════════════════════════════════════════════════════════ */

/**
 * 切换四季。app.js 可调用 `vegetation.setSeason('autumn')`，
 * 也可调用本导出的 `setSeason(ctx, group, 'autumn')`。
 * @param {object} ctx
 * @param {THREE.Group} group buildVegetation 返回的 group
 * @param {string} season spring | summer | autumn | winter
 * @returns {boolean} 是否切换成功
 */
export function setSeason(ctx, group, season) {
  const state = group && group.userData ? group.userData.vegetation : null;
  if (!state) return false;
  return applySeason(ctx, state, season);
}

function applySeason(ctx, state, season) {
  const mat = ctx.mat;
  const s = SEASONS.indexOf(season) >= 0 ? season : 'summer';
  state.season = s;

  for (const key in state.meshes) {
    const spec = SEASON_PLAN[key];
    const crownName = s === 'winter' ? spec.winter : (s === 'autumn' ? spec.autumn : spec.normal);
    const crownMat = mat(crownName);
    const crownMesh = state.crownGroup[key];
    if (crownMesh) {
      crownMesh.material = crownMat;
      // 冬季：落叶树种隐藏树冠，露出枝干（常绿树种保留）
      crownMesh.visible = !(s === 'winter' && spec.deciduous);
      // 春季：落叶树树冠略小（嫩叶初发）；材质库无浅绿变体，故以体量+花色灌木体现
      crownMesh.scale.setScalar(s === 'spring' && spec.deciduous ? 0.9 : 1);
    }
    state.materials[key].crown = crownMat;
  }

  // 灌木材质：春季花色灌木开花，其他季节回归普通灌木
  if (state.shrubs.bloom) {
    state.shrubs.bloom.material = mat(s === 'spring' ? 'leafFlower' : (s === 'autumn' ? 'leafAutumn' : 'shrub'));
  }
  if (state.shrubs.hedge) {
    state.shrubs.hedge.material = mat('shrub');
  }

  if (ctx.options) ctx.options.season = s;
  return true;
}

/* ══════════════════════════════════════════════════════════════════════
 * 常量
 * ════════════════════════════════════════════════════════════════════ */

const QUALITY_FACTOR = { high: 1, medium: 0.5, low: 0.25 };
const QUALITY_SEG = { high: 6, medium: 5, low: 4 };
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

const BUILDING_CLEARANCE = 6;     // 树干与建筑包围盒最小间距（m）
const TREE_MIN_DIST = 7;          // 树干间最小间距（m）
const SHRUB_MIN_DIST = 2.2;       // 灌木间最小间距（m）
const TREE_SHRUB_MIN_DIST = 3.0;  // 树与灌木最小间距（m）

const STREET_SPACING_MAIN = 16;              // 主轴行道树间距（m，单侧）
const STREET_SPACING_SECONDARY = 32;         // 次干路行道树间距（m，单侧）
const STREET_OFFSET_MIN = 3;                 // 偏离路缘最小距离（m）
const STREET_OFFSET_MAX = 5;                 // 偏离路缘最大距离（m）
const STREET_BACKOFF = [0, 2.5, 5];          // 被步道 / 相邻路占用时的后退档位（m）
const PATH_WIDTH_MAX = 4;                    // 宽度 ≤ 该值视为前庭 / 接入步道（m）
const PATH_TRUNK_CLEARANCE = 1.0;            // 步道侧：树干离铺装边的最小距离（m）

/* ══════════════════════════════════════════════════════════════════════
 * 落点预算：按用地规模成比例折算 + 三角面红线收敛
 *
 *   公式（全部可从 layout.js 复算，无写死总数）：
 *     siteArea    = (site.bounds.maxX-minX) × (site.bounds.maxZ-minZ)   用地面积
 *     scale       = siteArea / REF_SITE_AREA                          相对 v2.0.1 基准的倍数
 *     treeTarget  = REF_TREE_TOTAL  × scale                            树木目标数
 *     shrubTarget = REF_SHRUB_BUDGET × scale                           灌木目标数
 *     worstTri    = Σ_species 配额[species] × 单棵三角面 + 灌木数 × 单丛三角面
 *     k           = min(1, TRI_BUDGET × TRI_SAFETY / worstTri)         三角面收敛系数
 *     最终树木配额 = 按 SPECIES_MIX 配比拆分 treeTarget × k
 *     最终灌木预算 = shrubTarget × k
 *
 *   v2.0.1 基准：用地 560×465 m = 260,400 ㎡，树木 520 棵、灌木 320 丛。
 *   v3.0   用地：1240×1030 m = 1,277,200 ㎡ → scale = 4.906
 *     → 折算树木 2,551 棵 / 灌木 1,570 丛
 *     → 三角面最坏值 2,551×68.98 + 1,570×20 = 207,367 tris > 180,000 红线
 *     → k = 0.97×180,000 / 207,367 = 0.842 → 树木 2,148 棵 / 灌木 1,322 丛
 *   实际落点 ≤ 预算（部分落点被道路/建筑/间距排除），故三角面恒 ≤ 红线。
 * ════════════════════════════════════════════════════════════════════ */
const REF_SITE_AREA = 260400;      // v2.0.1 基准用地面积（㎡）
const REF_TREE_TOTAL = 520;        // v2.0.1 基准树木数
const REF_SHRUB_BUDGET = 320;      // v2.0.1 基准灌木数
const TRI_BUDGET = 180000;         // 植被模块三角面红线
const TRI_SAFETY = 0.97;           // 三角面安全余量
const TREE_INSTANCE_CAP = 9000;    // 树木实例数红线
const SHRUB_INSTANCE_CAP = 24000;  // 灌木实例数红线

/** 树种配比（沿用 v2.0.1 高画质配额配比） */
const SPECIES_MIX = { pinus: 90, robinia: 190, betula: 160, viburnum: 80 };

/** 绿地树木名义间距（m）：格心间距，抖动后仍满足 TREE_MIN_DIST */
const GREEN_TREE_SPACING = 8.5;
/** 绿地边缘内缩（m）：树木不贴绿地边界 */
const GREEN_EDGE_INSET = 1.5;
/** 建筑组团判定「周边密集」的半径（m）与阈值（栋） */
const CLUSTER_NEIGHBOR_RADIUS = 100;
const CLUSTER_NEIGHBOR_COUNT = 2;

/** 各来源的树种权重（key 为来源） */
const SOURCE_WEIGHTS = {
  cluster: { robinia: 0.4, viburnum: 0.3, betula: 0.2, pinus: 0.1 },
  street: { robinia: 0.55, pinus: 0.25, betula: 0.2 },
  green: { betula: 0.35, robinia: 0.3, pinus: 0.2, viburnum: 0.15 },
};
/** 配额耗尽时的回退顺序 */
const SOURCE_FALLBACK = {
  cluster: ['robinia', 'viburnum', 'betula', 'pinus'],
  street: ['robinia', 'betula', 'pinus', 'viburnum'],
  green: ['betula', 'robinia', 'pinus', 'viburnum'],
};

/** 四季材质方案：normal = 春/夏，autumn = 秋，winter = 冬 */
const SEASON_PLAN = {
  pinus: { normal: 'leafPine', autumn: 'leafPine', winter: 'leafPine', deciduous: false },
  robinia: { normal: 'leafBroad', autumn: 'leafAutumn', winter: 'leafBroad', deciduous: true },
  betula: { normal: 'leafBroad', autumn: 'leafAutumn', winter: 'leafBroad', deciduous: true },
  viburnum: { normal: 'leafBroad', autumn: 'leafAutumn', winter: 'leafBroad', deciduous: true },
};

/* ══════════════════════════════════════════════════════════════════════
 * 落点预算计算
 * ════════════════════════════════════════════════════════════════════ */

/**
 * 按用地规模折算落点预算，并用三角面红线收敛。
 * @param {object} layout 布局真值表
 * @param {Array} greens  绿地列表（已含 area / density / capacity）
 * @param {object} speciesRef 高画质树种几何表（用于单棵三角面）
 * @param {number} shrubTri 单丛灌木三角面
 */
function computeBudget(layout, greens, speciesRef, shrubTri) {
  const bounds = (layout.site && layout.site.bounds) || null;
  const siteArea = bounds
    ? Math.max(1, (bounds.maxX - bounds.minX) * (bounds.maxZ - bounds.minZ))
    : greens.reduce((s, g) => s + g.area, 0);
  const greenArea = greens.reduce((s, g) => s + g.area, 0);
  const scale = siteArea / REF_SITE_AREA;

  let treeTarget = Math.min(TREE_INSTANCE_CAP, Math.round(REF_TREE_TOTAL * scale));
  let shrubTarget = Math.min(SHRUB_INSTANCE_CAP, Math.round(REF_SHRUB_BUDGET * scale));

  // 单棵三角面（高画质分段 = 三角面上界）
  const tri = {};
  for (const key in speciesRef) {
    tri[key] = triCount(speciesRef[key].trunk) + triCount(speciesRef[key].crown);
  }
  const worst = (q, s) => {
    let sum = 0;
    for (const key in SPECIES_MIX) sum += q[key] * tri[key];
    return sum + s * shrubTri;
  };

  let quotas = allocateQuota(treeTarget, SPECIES_MIX);
  const cap = TRI_BUDGET * TRI_SAFETY;
  let k = 1;
  const worstTri = worst(quotas, shrubTarget);
  if (worstTri > cap) {
    k = cap / worstTri;
    treeTarget = Math.max(0, Math.floor(treeTarget * k));
    shrubTarget = Math.max(0, Math.floor(shrubTarget * k));
    quotas = allocateQuota(treeTarget, SPECIES_MIX);
  }

  // 来源拆分：建筑组团（建筑数驱动）+ 行道树（主次干路长度驱动）
  const clusterTarget = clusterBudget(layout);
  const streetTarget = streetBudget(layout);

  return {
    siteArea, greenArea, scale, k,
    treeTarget, shrubTarget, quotas, tri, shrubTri,
    clusterTarget, streetTarget,
    worstTri,
  };
}

/** 按配比把总数拆到各树种（余数按配比从大到小补齐） */
function allocateQuota(total, mix) {
  const keys = Object.keys(mix);
  const sum = keys.reduce((s, k) => s + mix[k], 0) || 1;
  const out = {};
  let used = 0;
  for (const k of keys) {
    out[k] = Math.floor(total * mix[k] / sum);
    used += out[k];
  }
  const order = keys.slice().sort((a, b) => mix[b] - mix[a]);
  let rem = total - used;
  let i = 0;
  while (rem > 0) {
    out[order[i % order.length]]++;
    rem--;
    i++;
  }
  return out;
}

/**
 * 加权水位分配：按权重把 budget 分配到各条目，单条受容量上限约束，
 * 容量吃紧时余量流向仍有空间的条目。总数恒 ≤ budget。
 * @param {Array<{w:number, cap:number}>} items
 */
function allocateByCapacity(items, budget) {
  const n = items.length;
  const alloc = new Array(n).fill(0);
  let rem = budget;
  let active = [];
  for (let i = 0; i < n; i++) if (items[i].cap > 0 && items[i].w > 0) active.push(i);
  let guard = 0;
  while (rem > 0 && active.length && guard++ < 64) {
    let wsum = 0;
    for (const i of active) wsum += items[i].w;
    if (wsum <= 0) break;
    let consumed = 0;
    const next = [];
    for (const i of active) {
      const room = items[i].cap - alloc[i];
      if (room <= 0) continue;
      const fair = rem * items[i].w / wsum;
      const give = Math.min(room, Math.floor(fair));
      if (give > 0) {
        alloc[i] += give;
        consumed += give;
      }
      if (alloc[i] < items[i].cap) next.push(i);
    }
    rem -= consumed;
    if (consumed === 0) break;
    active = next;
  }
  // 余数补齐：仍为 0 且有余量的条目各补 1（避免小块绿地一棵没有）
  if (rem > 0) {
    for (let i = 0; i < n && rem > 0; i++) {
      if (alloc[i] === 0 && items[i].cap > 0) {
        alloc[i] = 1;
        rem--;
      }
    }
  }
  // 仍为 0 的条目：从分配最多的条目匀 1 棵过来（总数不变）
  for (let i = 0; i < n; i++) {
    if (alloc[i] > 0 || items[i].cap <= 0) continue;
    let donor = -1;
    for (let j = 0; j < n; j++) {
      if (alloc[j] > 1 && alloc[j] < items[j].cap && (donor < 0 || alloc[j] > alloc[donor])) donor = j;
    }
    if (donor < 0) break;
    alloc[donor]--;
    alloc[i]++;
  }
  return alloc;
}

/** 建筑周边组团的总目标数（每栋 1~3 棵，密集区 1 棵） */
function clusterBudget(layout) {
  const buildings = layout.buildings || [];
  const dense = denseBuildingFlags(buildings, CLUSTER_NEIGHBOR_RADIUS, CLUSTER_NEIGHBOR_COUNT);
  let sum = 0;
  for (let i = 0; i < buildings.length; i++) sum += clusterTargetFor(buildings[i], dense[i]);
  return sum;
}

/** 行道树目标数：主 / 次干路长度 ÷ 单侧间距 × 2 */
function streetBudget(layout) {
  const roads = layout.roads || [];
  let sum = 0;
  for (const r of roads) {
    if (r.type !== 'main' && r.type !== 'secondary') continue;
    const pts = r.points || [];
    if (pts.length < 2) continue;
    const len = polylineLength(pts.map((p) => [p[0], p[1]]));
    if (len < 30) continue;
    sum += 2 * Math.floor(len / streetSpacing(r.type));
  }
  return sum;
}

/** 行道树单侧间距（m） */
function streetSpacing(type) {
  return type === 'main' ? STREET_SPACING_MAIN : STREET_SPACING_SECONDARY;
}

/** 每栋建筑的组团目标树数：密集区 1 棵，否则 2~3 棵 */
function clusterTargetFor(b, isDense) {
  if (isDense) return 1;
  const w = b.footprint ? b.footprint.w : 20;
  const d = b.footprint ? b.footprint.d : 20;
  return 2 * (w + d) >= 150 ? 3 : 2;
}

/** 判定每栋建筑周边是否密集（半径内其它建筑数 ≥ 阈值） */
function denseBuildingFlags(buildings, radius, threshold) {
  const flags = new Array(buildings.length).fill(false);
  const r2 = radius * radius;
  for (let i = 0; i < buildings.length; i++) {
    let n = 0;
    for (let j = 0; j < buildings.length; j++) {
      if (i === j) continue;
      const dx = buildings[j].position[0] - buildings[i].position[0];
      const dz = buildings[j].position[2] - buildings[i].position[2];
      if (dx * dx + dz * dz <= r2) n++;
    }
    flags[i] = n >= threshold;
  }
  return flags;
}

/** 几何体三角面数 */
function triCount(geo) {
  return geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3;
}

/** 原地 Fisher-Yates 洗牌（使用 seeded rng，保证确定性） */
function shuffleInPlace(rng, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
}

/* ══════════════════════════════════════════════════════════════════════
 * 几何构建
 * ════════════════════════════════════════════════════════════════════ */

/**
 * 四个树种的造型定义。
 * 树干 CylinderGeometry，树冠 Cone / Icosahedron 组合，合并后按 materialIndex 分组。
 */
function speciesTable(THREE, seg) {
  const table = {};

  /* 针叶常绿 · 油松：细高干 + 4 层锥形冠 */
  {
    const trunk = new THREE.CylinderGeometry(0.15, 0.34, 9.0, seg);
    trunk.translate(0, 4.5, 0);
    const layers = [
      [3.9, 4.0, 3.4],
      [3.2, 3.6, 6.2],
      [2.4, 3.2, 8.6],
      [1.6, 2.6, 10.8],
    ];
    const cones = layers.map((L) => {
      const g = new THREE.ConeGeometry(L[0], L[1], seg, 1, true);
      g.translate(0, L[2] + L[1] / 2, 0);
      return g;
    });
    table.pinus = {
      id: 'CAMPUS_TREE_PINUS_TABULAEFORMIS',
      trunkName: 'CAMPUS_TREE_PINUS_TABULAEFORMIS_TRUNK',
      label: '针叶常绿（油松）',
      canopyRadius: 3.9,
      height: 13.4,
      trunkMaterial: 'bark',
      crownMaterial: 'leafPine',
      trunk,
      crown: mergeGeometries(THREE, cones),
    };
  }

  /* 阔叶乔木 · 国槐：粗干 + 3 团不规则球冠 */
  {
    const trunk = new THREE.CylinderGeometry(0.28, 0.55, 6.2, seg);
    trunk.translate(0, 3.1, 0);
    const blobs = [
      [3.7, 8.4, 0.0, 0.0, 0.0],
      [2.5, 7.2, 1.7, 0.0, 0.9],
      [2.2, 9.0, -1.5, 0.0, -1.0],
    ];
    const crowns = blobs.map((b) => {
      const g = new THREE.IcosahedronGeometry(b[0], 0);
      g.translate(b[1] * 0 + b[3], b[1], b[4]);
      return g;
    });
    table.robinia = {
      id: 'CAMPUS_TREE_ROBINIA_PSEUDACACIA',
      trunkName: 'CAMPUS_TREE_ROBINIA_PSEUDACACIA_TRUNK',
      label: '阔叶乔木（国槐）',
      canopyRadius: 4.2,
      height: 12.1,
      trunkMaterial: 'bark',
      crownMaterial: 'leafBroad',
      trunk,
      crown: mergeGeometries(THREE, crowns),
    };
  }

  /* 落叶乔木 · 白桦：浅色干 + 略扁球冠 */
  {
    const trunk = new THREE.CylinderGeometry(0.13, 0.25, 7.8, seg);
    trunk.translate(0, 3.9, 0);
    const g1 = new THREE.IcosahedronGeometry(3.4, 0);
    g1.scale(1, 0.78, 1);
    g1.translate(0, 8.2, 0);
    const g2 = new THREE.IcosahedronGeometry(2.1, 0);
    g2.scale(1, 0.85, 1);
    g2.translate(1.2, 7.0, -0.8);
    table.betula = {
      id: 'CAMPUS_TREE_BETULA_PLATYPHYLLA',
      trunkName: 'CAMPUS_TREE_BETULA_PLATYPHYLLA_TRUNK',
      label: '落叶乔木（白桦）',
      canopyRadius: 3.4,
      height: 10.9,
      trunkMaterial: 'plaster',   // 材质库无浅色 bark 变体，用浅色 plaster 充当白桦树干
      crownMaterial: 'leafBroad',
      trunk,
      crown: mergeGeometries(THREE, [g1, g2]),
    };
  }

  /* 小乔木 / 灌木 · 低矮球状 */
  {
    const trunk = new THREE.CylinderGeometry(0.07, 0.13, 1.7, Math.max(4, seg - 1));
    trunk.translate(0, 0.85, 0);
    const crown = new THREE.IcosahedronGeometry(1.75, 0);
    crown.translate(0, 2.6, 0);
    table.viburnum = {
      id: 'CAMPUS_TREE_VIBURNUM_OPULUS',
      trunkName: 'CAMPUS_TREE_VIBURNUM_OPULUS_TRUNK',
      label: '小乔木/灌木（低矮球状）',
      canopyRadius: 1.7,
      height: 4.35,
      trunkMaterial: 'bark',
      crownMaterial: 'leafBroad',
      trunk,
      crown,
    };
  }

  return table;
}

/** 灌木：压扁的低模球体 */
function buildShrubGeometry(THREE) {
  const g = new THREE.IcosahedronGeometry(1.0, 0);
  g.scale(1, 0.78, 1);
  g.translate(0, 0.78, 0);
  return g;
}

function makeShrubMesh(THREE, geo, material, list, name, quality) {
  if (!list.length) return null;
  const mesh = new THREE.InstancedMesh(geo, material, list.length);
  mesh.name = name;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    dummy.position.set(s.x, 0, s.z);
    dummy.rotation.set(0, s.yaw, 0);
    dummy.scale.set(s.scale, s.scale * 0.9, s.scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  const shadow = quality !== 'low';
  mesh.castShadow = shadow;
  mesh.receiveShadow = shadow;
  return mesh;
}

/**
 * 合并若干 BufferGeometry（带 position/normal/uv；索引或非索引均可）。
 * 不依赖 examples/jsm，避免模块解析差异。
 * 注：IcosahedronGeometry 等 Polyhedron 几何是非索引的，此处为其补齐索引。
 */
function mergeGeometries(THREE, geos) {
  const totalVerts = geos.reduce((s, g) => s + g.attributes.position.count, 0);
  const totalIdx = geos.reduce((s, g) => s + (g.index ? g.index.count : g.attributes.position.count), 0);
  const position = new Float32Array(totalVerts * 3);
  const normal = new Float32Array(totalVerts * 3);
  const uv = new Float32Array(totalVerts * 2);
  const IndexArray = totalVerts > 65535 ? Uint32Array : Uint16Array;
  const index = new IndexArray(totalIdx);

  let vOff = 0;
  let iOff = 0;
  for (const g of geos) {
    const pos = g.attributes.position;
    position.set(pos.array, vOff * 3);
    if (g.attributes.normal) normal.set(g.attributes.normal.array, vOff * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, vOff * 2);
    const n = g.index ? g.index.count : pos.count;
    if (g.index) {
      const idx = g.index.array;
      for (let i = 0; i < n; i++) index[iOff + i] = idx[i] + vOff;
    } else {
      for (let i = 0; i < n; i++) index[iOff + i] = i + vOff;
    }
    vOff += pos.count;
    iOff += n;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(position, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  merged.setIndex(new THREE.BufferAttribute(index, 1));
  merged.computeBoundingSphere();
  return merged;
}

/* ══════════════════════════════════════════════════════════════════════
 * 落点生成
 * ════════════════════════════════════════════════════════════════════ */

/**
 * 建筑周边组团：每栋 1~3 棵。
 * 周边 100 m 内有 ≥2 栋其它建筑的（宿舍区、教学密集区）只种 1 棵，
 * 且贴建筑布置（退距 6.6~8.4 m），不侵占楼间公共空间。
 */
function placeBuildingClusters(rng, layout, picker, isBlocked, grid, out) {
  const buildings = layout.buildings || [];
  const dense = denseBuildingFlags(buildings, CLUSTER_NEIGHBOR_RADIUS, CLUSTER_NEIGHBOR_COUNT);
  for (let bi = 0; bi < buildings.length; bi++) {
    const b = buildings[bi];
    const isDense = dense[bi];
    const want = clusterTargetFor(b, isDense);
    const hw = (b.footprint ? b.footprint.w : 20) / 2;
    const hd = (b.footprint ? b.footprint.d : 20) / 2;
    const cx = b.position[0];
    const cz = b.position[2];
    const rot = b.rotation || 0;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const order = picker.order('cluster');
    let placed = 0;
    for (let attempt = 0; attempt < want * 10 && placed < want; attempt++) {
      const side = randInt(rng, 0, 3);
      // 密集区贴墙布置，稀疏区可外扩到楼间绿地
      const gap = isDense
        ? BUILDING_CLEARANCE + randRange(rng, 0.6, 2.4)
        : BUILDING_CLEARANCE + randRange(rng, 0.6, 4.5);
      const along = randRange(rng, -0.45, 0.45);
      let lx = 0;
      let lz = 0;
      if (side === 0) { lx = along * hw * 2; lz = hd + gap; }
      else if (side === 1) { lx = along * hw * 2; lz = -hd - gap; }
      else if (side === 2) { lx = hw + gap; lz = along * hd * 2; }
      else { lx = -hw - gap; lz = along * hd * 2; }
      const x = cx + lx * cos + lz * sin;
      const z = cz - lx * sin + lz * cos;
      // 依次尝试各树种（配额只在落点成功时消耗）
      for (const species of order) {
        if (picker.exhausted(species)) continue;
        if (isBlocked(x, z, picker.radius(species))) continue;
        if (grid.tooClose(x, z, TREE_MIN_DIST)) continue;
        picker.commit(species);
        grid.add(x, z);
        out.push(makePlanting(rng, x, z, species));
        placed++;
        break;
      }
    }
  }
}

/** 行道树：沿 main / secondary 道路两侧列植 */
function placeStreetTrees(rng, roads, target, picker, isBlocked, grid, out) {
  // 只对 main / secondary 道路列植（path 为 3 m 宽前庭步道，不列植）
  const cand = [];
  for (const road of roads) {
    if (road.type !== 'main' && road.type !== 'secondary') continue;
    if (road.pts.length < 2) continue;
    const total = polylineLength(road.pts);
    if (total < 30) continue;
    cand.push({ road, total });
  }
  if (!cand.length) return;

  // 期望数量（两侧各一列）
  let expect = 0;
  for (const c of cand) expect += 2 * Math.floor(c.total / streetSpacing(c.road.type));
  // 目标不足 → 等比例放宽间距（保证街道之间的疏密关系不变）
  const k = expect > target && target > 0 ? expect / target : 1;

  for (const c of cand) {
    const road = c.road;
    const total = c.total;
    const spacing = streetSpacing(road.type) * k;
    const stations = Math.max(1, Math.floor(total / spacing));
    const step = total / stations;

    for (let i = 0; i < stations; i++) {
      const s = (i + 0.5) * step;
      const p = pointAtDistance(road.pts, s);
      const nx = -p.tz;
      const nz = p.tx;
      const order = picker.order('street');
      for (let side = -1; side <= 1; side += 2) {
        let done = false;
        for (const species of order) {
          if (picker.exhausted(species)) continue;
          const r = picker.radius(species);
          // 偏离路缘 3~5 m，且必须 ≥ 树冠半径（保证不落在路面）
          const base = Math.min(STREET_OFFSET_MAX, Math.max(STREET_OFFSET_MIN, r + 0.6));
          // 基础位置被前庭步道 / 相邻路占用时，逐级后退让位
          for (const back of STREET_BACKOFF) {
            const offset = base + back;
            const jitter = randRange(rng, -0.35, 0.35);
            const along = randRange(rng, -0.5, 0.5);
            const x = p.x + nx * side * (road.half + offset + jitter) + p.tx * along;
            const z = p.z + nz * side * (road.half + offset + jitter) + p.tz * along;
            if (isBlocked(x, z, r)) continue;
            if (grid.tooClose(x, z, TREE_MIN_DIST)) continue;
            picker.commit(species);
            grid.add(x, z);
            out.push(makePlanting(rng, x, z, species));
            done = true;
            break;
          }
          if (done) break;
        }
      }
    }
  }
}

/**
 * 绿地散植：几何容量上限 + 加权水位分配 + 目标格数抖动网格。
 *
 * 三步：
 *   1. greenCapacity：按 GREEN_TREE_SPACING 算出每块绿地最多能放多少棵树
 *      （窄条绿地的短边只能排 1~2 行，天然不会被塞满）。
 *   2. allocateByCapacity：按 面积×密度 加权分配总预算，分配量受几何容量约束；
 *      容量吃紧时余量自动流向还有空间的绿地（水位法），避免高密度绿地吃光预算、
 *      其余绿地一棵没有。
 *   3. placeGreenBlock：按分配量确定行列数，格心加受控抖动布点；
 *      抖动幅度 ≤ (格距-最小间距)/2，落点必然落在绿地矩形内部。
 */
function placeGreenTrees(rng, greens, budget, picker, isBlocked, grid, out) {
  if (!greens.length || budget <= 0) return;
  for (const g of greens) g.capacity = greenCapacity(g);
  const items = greens.map((g) => ({ w: g.area * g.density, cap: g.capacity }));
  const alloc = allocateByCapacity(items, budget);
  for (let i = 0; i < greens.length; i++) {
    if (alloc[i] <= 0) continue;
    placeGreenBlock(rng, greens[i], alloc[i], picker, isBlocked, grid, out);
  }
}

/** 单块绿地的抖动网格布点 */
function placeGreenBlock(rng, g, target, picker, isBlocked, grid, out) {
  const longDim = g.long;
  const shortDim = g.short;
  const maxCols = Math.max(1, Math.floor((longDim - 2 * GREEN_EDGE_INSET) / GREEN_TREE_SPACING));
  const maxRows = Math.max(1, Math.floor((shortDim - 2 * GREEN_EDGE_INSET) / GREEN_TREE_SPACING));
  // 目标格数：先按长宽比估列数，再补行，保证 cols×rows ≥ target
  let cols = Math.max(1, Math.min(maxCols, Math.round(Math.sqrt(target * longDim / shortDim))));
  let rows = Math.max(1, Math.min(maxRows, Math.ceil(target / cols)));
  while (cols * rows < target && cols < maxCols) cols++;
  while (cols * rows < target && rows < maxRows) rows++;

  const cellLong = longDim / cols;
  const cellShort = shortDim / rows;
  // 抖动幅度受最小间距约束：相邻格心最近仍 ≥ TREE_MIN_DIST
  const jLong = Math.max(0, (cellLong - TREE_MIN_DIST) / 2) * 0.9;
  const jShort = Math.max(0, (cellShort - TREE_MIN_DIST) / 2) * 0.9;

  // 单元格访问顺序打散：抽不满时不会只落在绿地一角
  const cells = [];
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) cells.push(i * rows + j);
  shuffleInPlace(rng, cells);

  const order = picker.order('green');
  let placed = 0;
  for (let ci = 0; ci < cells.length && placed < target; ci++) {
    const code = cells[ci];
    const i = Math.floor(code / rows);
    const j = code % rows;
    const u = (i + 0.5) * cellLong + randRange(rng, -jLong, jLong);   // 长轴坐标
    const v = (j + 0.5) * cellShort + randRange(rng, -jShort, jShort); // 短轴坐标
    const x = g.alongX ? g.x0 + u : g.x0 + v;
    const z = g.alongX ? g.z0 + v : g.z0 + u;
    for (const species of order) {
      if (picker.exhausted(species)) continue;
      if (isBlocked(x, z, picker.radius(species))) continue;
      if (grid.tooClose(x, z, TREE_MIN_DIST)) continue;
      picker.commit(species);
      grid.add(x, z);
      out.push(makePlanting(rng, x, z, species));
      g.trees++;
      placed++;
      break;
    }
  }
}

/** 绿地几何容量：名义间距下最多可容纳的树数（短边窄 → 行数少） */
function greenCapacity(g) {
  const cols = Math.max(1, Math.floor((g.long - 2 * GREEN_EDGE_INSET) / GREEN_TREE_SPACING));
  const rows = Math.max(1, Math.floor((g.short - 2 * GREEN_EDGE_INSET) / GREEN_TREE_SPACING));
  return cols * rows;
}

/** 灌木与绿篱：绿地边缘列植 + 绿地内散丛（均受几何容量约束） */
function placeShrubs(rng, greens, budget, isBlocked, treeGrid, shrubGrid, out) {
  if (!greens.length || budget <= 0) return;
  const totalPerim = greens.reduce((s, g) => s + g.perim, 0) || 1;
  const totalArea = greens.reduce((s, g) => s + g.area, 0) || 1;
  const edgeBudget = Math.round(budget * 0.55);
  const clumpBudget = budget - edgeBudget;

  // 绿篱：沿绿地边界内侧（按周长加权，容量 = 周长 / 灌木最小间距）
  const edgeItems = greens.map((g) => ({
    w: g.perim,
    cap: Math.max(0, Math.floor(g.perim / SHRUB_MIN_DIST) - 4),
  }));
  const edgeAlloc = allocateByCapacity(edgeItems, edgeBudget);
  for (let i = 0; i < greens.length; i++) {
    if (edgeAlloc[i] <= 0) continue;
    placeHedge(rng, greens[i], edgeAlloc[i], isBlocked, treeGrid, shrubGrid, out);
  }

  // 灌木丛：绿地内部散丛（按 面积×密度 加权，容量 = 面积 / 10 ㎡）
  const clumpItems = greens.map((g) => ({
    w: g.area * g.density,
    cap: Math.max(0, Math.floor(g.area / 10)),
  }));
  const clumpAlloc = allocateByCapacity(clumpItems, clumpBudget);
  for (let i = 0; i < greens.length; i++) {
    if (clumpAlloc[i] <= 0) continue;
    placeClumps(rng, greens[i], clumpAlloc[i], isBlocked, treeGrid, shrubGrid, out);
  }
}

/** 绿篱：沿绿地四边内侧按周长比例列植 */
function placeHedge(rng, g, target, isBlocked, treeGrid, shrubGrid, out) {
  const edges = [
    { a: [g.x0, g.z0], b: [g.x1, g.z0], nx: 0, nz: 1 },
    { a: [g.x1, g.z0], b: [g.x1, g.z1], nx: -1, nz: 0 },
    { a: [g.x1, g.z1], b: [g.x0, g.z1], nx: 0, nz: -1 },
    { a: [g.x0, g.z1], b: [g.x0, g.z0], nx: 1, nz: 0 },
  ];
  const lens = edges.map((e) => Math.hypot(e.b[0] - e.a[0], e.b[1] - e.a[1]));
  const totalLen = lens.reduce((s, v) => s + v, 0) || 1;
  for (let ei = 0; ei < edges.length; ei++) {
    const e = edges[ei];
    if (lens[ei] < 4) continue;
    const n = Math.round(target * lens[ei] / totalLen);
    if (n <= 0) continue;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const px = e.a[0] + (e.b[0] - e.a[0]) * t;
      const pz = e.a[1] + (e.b[1] - e.a[1]) * t;
      const inset = randRange(rng, 0.5, 1.6);
      const x = px + e.nx * inset;
      const z = pz + e.nz * inset;
      if (isBlocked(x, z, 0.9)) continue;
      if (treeGrid.tooClose(x, z, TREE_SHRUB_MIN_DIST)) continue;
      if (shrubGrid.tooClose(x, z, SHRUB_MIN_DIST)) continue;
      shrubGrid.add(x, z);
      out.push({ x, z, scale: randRange(rng, 0.75, 1.15), yaw: rng() * Math.PI * 2, bloom: false });
    }
  }
}

/** 灌木丛：绿地内部随机散丛 */
function placeClumps(rng, g, target, isBlocked, treeGrid, shrubGrid, out) {
  let placed = 0;
  const tries = target * 20;
  for (let i = 0; i < tries && placed < target; i++) {
    const x = randRange(rng, g.x0, g.x1);
    const z = randRange(rng, g.z0, g.z1);
    if (isBlocked(x, z, 0.9)) continue;
    if (treeGrid.tooClose(x, z, TREE_SHRUB_MIN_DIST)) continue;
    if (shrubGrid.tooClose(x, z, SHRUB_MIN_DIST)) continue;
    shrubGrid.add(x, z);
    out.push({ x, z, scale: randRange(rng, 0.7, 1.1), yaw: rng() * Math.PI * 2, bloom: rng() < 0.25 });
    placed++;
  }
}

/* ══════════════════════════════════════════════════════════════════════
 * 辅助
 * ════════════════════════════════════════════════════════════════════ */

/**
 * 树种配额挑选器：按来源权重给出候选顺序，配额只在落点成功时消耗（commit）。
 * order(source) 返回按权重无放回抽取的树种顺序；调用方逐个尝试，命中即 commit。
 */
function createPicker(rng, quotas, weightsBySource) {
  const remaining = Object.assign({}, quotas);
  const radii = {
    pinus: 3.9, robinia: 4.2, betula: 3.4, viburnum: 1.7,
  };
  return {
    radius(key) { return radii[key] !== undefined ? radii[key] : 2; },
    exhausted(key) { return remaining[key] <= 0; },
    commit(key) { if (remaining[key] > 0) remaining[key]--; },
    /** 剩余配额总数（= 还能落多少棵树） */
    remainingTotal() {
      let sum = 0;
      for (const key in remaining) sum += remaining[key] > 0 ? remaining[key] : 0;
      return sum;
    },
    order(source) {
      const weights = weightsBySource[source];
      let pool = Object.keys(weights).filter((k) => remaining[k] > 0);
      if (!pool.length) pool = (SOURCE_FALLBACK[source] || Object.keys(weights)).filter((k) => remaining[k] > 0);
      if (!pool.length) return [];
      const out = [];
      while (pool.length) {
        let total = 0;
        for (const k of pool) total += weights[k] !== undefined ? weights[k] : 0.1;
        let r = rng() * total;
        let chosen = pool[pool.length - 1];
        for (const k of pool) {
          r -= weights[k] !== undefined ? weights[k] : 0.1;
          if (r <= 0) { chosen = k; break; }
        }
        out.push(chosen);
        pool = pool.filter((k) => k !== chosen);
      }
      return out;
    },
  };
}

function makePlanting(rng, x, z, species) {
  return {
    x,
    z,
    species,
    scale: randRange(rng, 0.88, 1.12),
    yaw: rng() * Math.PI * 2,
  };
}

function registerGreenPOIs(pois, greens) {
  if (!pois || typeof pois.add !== 'function') return;
  const wanted = ['GREEN_AGRI', 'GREEN_LAKE_N', 'GREEN_TEACH_STRIP'];
  for (const id of wanted) {
    const g = greens.find((x) => x.id === id);
    if (!g) continue;
    pois.add({
      id: g.id,
      name: g.name,
      category: '景观',
      zone: g.zone || null,
      type: 'area',
      position: [g.cx, 0, g.cz],
      anchor: 'center',
      bbox: { min: [g.x0, 0, g.z0], max: [g.x1, 0, g.z1] },
      summary: `${g.name}，绿地面积约 ${Math.round(g.area)} ㎡，本模块种植树木 ${g.trees} 棵`,
      tags: ['绿地', '景观', '生态'],
      meta: {
        greenAreaId: g.id,
        area: Math.round(g.area),
        density: g.density,
        treeCount: g.trees,
      },
    });
  }
}

/* ── 数学 / 几何工具 ────────────────────────────────────────────────── */

function randRange(rng, a, b) { return a + rng() * (b - a); }
function randInt(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }

function distToSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  let t = len2 > 0 ? ((px - ax) * dx + (pz - az) * dz) / len2 : 0;
  t = t < 0 ? 0 : (t > 1 ? 1 : t);
  const cx = ax + dx * t;
  const cz = az + dz * t;
  return Math.hypot(px - cx, pz - cz);
}

/** 点到（可旋转）建筑矩形的最短距离 */
function distToBuildingRect(px, pz, b) {
  const dx = px - b.cx;
  const dz = pz - b.cz;
  let lx = dx;
  let lz = dz;
  if (b.rot) {
    const cos = Math.cos(-b.rot);
    const sin = Math.sin(-b.rot);
    lx = dx * cos + dz * sin;
    lz = -dx * sin + dz * cos;
  }
  const ox = Math.max(Math.abs(lx) - b.hw, 0);
  const oz = Math.max(Math.abs(lz) - b.hd, 0);
  return Math.hypot(ox, oz);
}

function normRect(rect) {
  const r = rect || [0, 0, 0, 0];
  return {
    x0: Math.min(r[0], r[2]),
    x1: Math.max(r[0], r[2]),
    z0: Math.min(r[1], r[3]),
    z1: Math.max(r[1], r[3]),
  };
}

function polylineLength(pts) {
  let len = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    len += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
  }
  return len;
}

/** 沿折线取距起点 s 处的点与单位切向 */
function pointAtDistance(pts, s) {
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const ax = pts[i][0];
    const az = pts[i][1];
    const bx = pts[i + 1][0];
    const bz = pts[i + 1][1];
    const seg = Math.hypot(bx - ax, bz - az);
    if (seg < 1e-6) continue;
    if (acc + seg >= s) {
      const t = (s - acc) / seg;
      return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, tx: (bx - ax) / seg, tz: (bz - az) / seg };
    }
    acc += seg;
  }
  const n = pts.length - 1;
  const ax = pts[n - 1][0];
  const az = pts[n - 1][1];
  const bx = pts[0][0];
  const bz = pts[0][1];
  const seg = Math.hypot(bx - ax, bz - az) || 1;
  return { x: ax, z: az, tx: (bx - ax) / seg, tz: (bz - az) / seg };
}

/**
 * 简易空间哈希：用于最小间距检测
 */
function PointGrid(cell) {
  this.cell = cell;
  this.map = new Map();
}
PointGrid.prototype.key = function (ix, iz) { return ix + ',' + iz; };
PointGrid.prototype.add = function (x, z) {
  const k = this.key(Math.floor(x / this.cell), Math.floor(z / this.cell));
  let arr = this.map.get(k);
  if (!arr) { arr = []; this.map.set(k, arr); }
  arr.push(x, z);
};
PointGrid.prototype.tooClose = function (x, z, r) {
  const c = this.cell;
  const i0 = Math.floor((x - r) / c);
  const i1 = Math.floor((x + r) / c);
  const j0 = Math.floor((z - r) / c);
  const j1 = Math.floor((z + r) / c);
  const r2 = r * r;
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const arr = this.map.get(this.key(i, j));
      if (!arr) continue;
      for (let k = 0; k < arr.length; k += 2) {
        const dx = arr[k] - x;
        const dz = arr[k + 1] - z;
        if (dx * dx + dz * dz < r2) return true;
      }
    }
  }
  return false;
};

/**
 * 均匀网格索引：把道路段 / 建筑按包围盒（含判定外扩）塞进格子，
 * isBlocked 只查落点所在格及相邻格，避免 102 条路 × 268 段的全量遍历。
 */
function GridIndex(cell) {
  this.cell = cell;
  this.map = new Map();
}
GridIndex.prototype.key = function (ix, iz) { return ix + ',' + iz; };
GridIndex.prototype.insertBox = function (x0, z0, x1, z1, item) {
  const c = this.cell;
  const i0 = Math.floor(x0 / c);
  const i1 = Math.floor(x1 / c);
  const j0 = Math.floor(z0 / c);
  const j1 = Math.floor(z1 / c);
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const k = this.key(i, j);
      let arr = this.map.get(k);
      if (!arr) { arr = []; this.map.set(k, arr); }
      arr.push(item);
    }
  }
};
/** 取落点所在格及相邻 8 格内的候选项（允许重复，判定幂等） */
GridIndex.prototype.query = function (x, z, out) {
  const c = this.cell;
  const i = Math.floor(x / c);
  const j = Math.floor(z / c);
  out.length = 0;
  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      const arr = this.map.get(this.key(i + di, j + dj));
      if (!arr) continue;
      for (let k = 0; k < arr.length; k++) out.push(arr[k]);
    }
  }
  return out;
};

export default buildVegetation;
