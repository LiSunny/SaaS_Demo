/**
 * verify_scene.js — 场景几何自动校验（浏览器端注入执行）
 *
 * 用法：在页面控制台执行本文件导出的 verifyScene()，或由自动化脚本注入。
 * 依赖 app.js 暴露的 window.__pumpRoom（THREE / scene / camera / renderer / pois / layout）。
 *
 * 校验内容：
 *   1. POI 覆盖率：POI_LIST 每条是否都有已挂接网格
 *   2. POI 包围盒偏差：实际网格包围盒 vs 真值表 bbox
 *   3. 设备最高点是否低于梁底净高
 *   4. 场景统计：网格数 / 三角面 / 材质数 / 灯光数
 *   5. 剖视状态：屋顶/吊装件是否隐藏、四面墙显隐是否与相机位置一致
 */

export function verifyScene() {
  const ctx = window.__pumpRoom;
  if (!ctx) return { error: 'window.__pumpRoom 未就绪，页面未完成装配' };

  const { THREE, scene, pois, layout, renderer } = ctx;
  // POI_LIST 是 layout.js 的独立导出，不在 PUMP_ROOM 里
  const POI_LIST = layout.POI_LIST || (window.__pumpRoom.POI_LIST || []);

  /* ── 1. POI 覆盖率 ─────────────────────────────────────────────── */
  const coverage = POI_LIST.map((p) => {
    const meshes = pois.meshesOf(p.id) || [];
    return { id: p.id, name: p.name, category: p.category, meshCount: meshes.length };
  });
  const uncovered = coverage.filter((c) => c.meshCount === 0);

  /* ── 2. 包围盒偏差 ─────────────────────────────────────────────── */
  const boxErrors = [];
  for (const p of POI_LIST) {
    const meshes = pois.meshesOf(p.id) || [];
    if (!meshes.length) continue;
    const box = new THREE.Box3();
    for (const m of meshes) {
      m.updateWorldMatrix(true, false);
      box.expandByObject(m);
    }
    if (p.bbox) {
      const dx = Math.max(Math.abs(box.min.x - p.bbox.min[0]), Math.abs(box.max.x - p.bbox.max[0]));
      const dy = Math.max(Math.abs(box.min.y - p.bbox.min[1]), Math.abs(box.max.y - p.bbox.max[1]));
      const dz = Math.max(Math.abs(box.min.z - p.bbox.min[2]), Math.abs(box.max.z - p.bbox.max[2]));
      boxErrors.push({
        id: p.id,
        maxDelta: +Math.max(dx, dy, dz).toFixed(3),
        actual: {
          min: box.min.toArray().map((v) => +v.toFixed(2)),
          max: box.max.toArray().map((v) => +v.toFixed(2)),
        },
        expect: p.bbox,
      });
    }
  }

  /* ── 3. 设备最高点 ─────────────────────────────────────────────── */
  const deviceIds = POI_LIST.filter((p) => p.category !== '房间').map((p) => p.id);
  let maxY = -Infinity;
  let maxYId = null;
  for (const id of deviceIds) {
    for (const m of pois.meshesOf(id) || []) {
      m.updateWorldMatrix(true, false);
      const b = new THREE.Box3().setFromObject(m);
      if (b.max.y > maxY) {
        maxY = b.max.y;
        maxYId = id;
      }
    }
  }
  const clearHeight = layout.room.clearHeight;

  /* ── 4. 场景统计 ───────────────────────────────────────────────── */
  let meshCount = 0;
  let lightCount = 0;
  const materialSet = new Set();
  let triangleCount = 0;
  scene.traverse((obj) => {
    if (obj.isLight) lightCount += 1;
    if (!obj.isMesh) return;
    meshCount += 1;
    if (obj.material) materialSet.add(obj.material.uuid);
    const geo = obj.geometry;
    if (!geo) return;
    const idx = geo.index;
    const count = idx ? idx.count : geo.attributes.position ? geo.attributes.position.count : 0;
    const instances = obj.isInstancedMesh ? obj.count : 1;
    triangleCount += (count / 3) * instances;
  });

  const info = renderer && renderer.info ? renderer.info : {};

  /* ── 5. 剖视状态 ───────────────────────────────────────────────── */
  // 规则与 src/app.js 的 CUTAWAY_RULES 一致；此处独立重算一遍作为交叉校验
  const CUTAWAY = {
    roof: [/^SHELL_CEILING_/, /^SHELL_BEAM_/],
    hanger: [/_ROD$/, /_HANGER$/, /^LIGHT_\d+_BASE$/, /^LIGHT_\d+_SLEEVE$/],
    wall: {
      south: [/^SHELL_WALL_SOUTH_/, /^SHELL_SKIRT_SOUTH_/, /^SHELL_DOOR_/, /^SHELL_HAZARD_DOOR_/,
        /^SIGN_\d+_ROOM_PLATE/, /^LIGHT_EMERGENCY_(BODY|GLOW|BRACKET)$/, /^TRAY_\d+_BRACKET_WALL$/],
      north: [/^SHELL_WALL_NORTH_/, /^SHELL_SKIRT_NORTH_/],
      west: [/^SHELL_WALL_WEST_/, /^SHELL_SKIRT_WEST_/, /^SHELL_SUMP_RISER_WALL_WEST_/],
      east: [/^SHELL_WALL_EAST_/, /^SHELL_SKIRT_EAST_/, /^SHELL_WINDOW_/, /^SHELL_SUMP_RISER_WALL_EAST_/,
        /^PIPE_DISCHARGE_SLEEVE_/],
    },
  };
  const SIDES = ['south', 'north', 'west', 'east'];
  const b = layout.room.bounds;
  const PLAN = {
    south: { axis: 'z', at: b.minZ, sign: -1 },
    north: { axis: 'z', at: b.maxZ, sign: +1 },
    west: { axis: 'x', at: b.minX, sign: -1 },
    east: { axis: 'x', at: b.maxX, sign: +1 },
  };
  const cam = ctx.camera ? ctx.camera.position : null;
  const groups = { roof: [], hanger: [], wall: { south: [], north: [], west: [], east: [] } };
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const n = typeof o.name === 'string' ? o.name : '';
    if (!n) return;
    if (CUTAWAY.roof.some((re) => re.test(n))) { groups.roof.push(o); return; }
    if (CUTAWAY.hanger.some((re) => re.test(n))) { groups.hanger.push(o); return; }
    for (const s of SIDES) {
      if (CUTAWAY.wall[s].some((re) => re.test(n))) { groups.wall[s].push(o); return; }
    }
  });
  const countVisible = (arr) => arr.filter((o) => o.visible).length;
  const cutawayOn = ctx.cutaway ? ctx.cutaway.on : null;
  const wallState = {};
  const wallExpect = {};
  for (const s of SIDES) {
    wallState[s] = `${countVisible(groups.wall[s])}/${groups.wall[s].length}`;
    if (cam) {
      const pl = PLAN[s];
      const shouldHide = cutawayOn ? (cam[pl.axis] - pl.at) * pl.sign > 0.12 : false;
      wallExpect[s] = shouldHide ? 'hidden' : 'visible';
    }
  }
  const roofVisible = countVisible(groups.roof);
  const hangerVisible = countVisible(groups.hanger);
  // 屋顶在「剖视开启」或「剖切俯视」两种状态下都应移除
  const roofGone = !!(cutawayOn || ctx.sectionOn);
  const roofOk = roofGone
    ? roofVisible === 0 && hangerVisible === 0
    : roofVisible === groups.roof.length && hangerVisible === groups.hanger.length;
  const wallOk = SIDES.every((s) => {
    if (!cam) return true;
    const visible = countVisible(groups.wall[s]);
    const all = groups.wall[s].length;
    const expectHidden = wallExpect[s] === 'hidden';
    return expectHidden ? visible === 0 : visible === all;
  });

  return {
    poiTotal: POI_LIST.length,
    poiCovered: coverage.filter((c) => c.meshCount > 0).length,
    uncovered: uncovered.map((c) => `${c.id} ${c.name}`),
    byCategory: coverage.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {}),
    boxErrorMax: boxErrors.length ? Math.max(...boxErrors.map((b) => b.maxDelta)) : 0,
    boxErrorsOver10cm: boxErrors.filter((b) => b.maxDelta > 0.1),
    deviceMaxY: +maxY.toFixed(3),
    deviceMaxYId: maxYId,
    clearHeight,
    heightOk: maxY < clearHeight,
    meshCount,
    lightCount,
    materialCount: materialSet.size,
    triangleCount: Math.round(triangleCount),
    drawCalls: info.render ? info.render.calls : null,
    frameTris: info.render ? info.render.triangles : null,
    cutaway: {
      on: cutawayOn,
      sectionOn: !!ctx.sectionOn,
      camera: cam ? cam.toArray().map((v) => +v.toFixed(2)) : null,
      roofVisible: `${roofVisible}/${groups.roof.length}`,
      hangerVisible: `${hangerVisible}/${groups.hanger.length}`,
      wallVisible: wallState,
      wallExpect,
      roofOk,
      wallOk,
    },
  };
}

if (typeof window !== 'undefined') window.verifyScene = verifyScene;
export default verifyScene;
