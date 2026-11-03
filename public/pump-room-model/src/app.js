/**
 * app.js — 通用消防水泵房示例模型 · 应用主程序
 *
 * 职责：渲染器 / 相机 / 控制器 / 场景装配 / POI 拾取与面板 /
 *       灯光开关 / 画质切换 / 性能 HUD / manifest 导出。
 *
 * 只读依赖（基线，不得修改）：
 *   ./layout.js         几何真值表（PUMP_ROOM + POI_LIST）
 *   ./core/poi.js       POI 注册表
 *   ./core/materials.js 统一材质库
 *   ./core/rng.js       可复现随机数
 *
 * 伙伴模块（并行编写，可能尚未落盘或自身抛错）：
 *   ./modules/shell.js  ./modules/tanks.js  ./modules/pumps.js
 *   ./modules/piping.js ./modules/electrical.js ./modules/lighting.js
 *
 * 说明：伙伴模块采用**动态 import** 载入。导入路径与导出名与既定契约完全一致
 * （buildShell / buildTanks / buildPumps / buildPiping / buildElectrical /
 * buildLighting），但用动态 import 才能在伙伴模块缺失或抛错时被 try/catch 捕获，
 * 从而「跳过该模块 + 明确报错」，保证场景其余部分继续渲染，不出现整页白屏。
 */

import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/examples/jsm/controls/OrbitControls.js';
import { PUMP_ROOM, POI_LIST } from './layout.js';
import { createPOIStore } from './core/poi.js';
import { createMaterials } from './core/materials.js';
import { makeRNG } from './core/rng.js';

/* ══════════════════════════════════════════════════════════════════════
 * 场地尺度推导
 *
 * 所有与「房间多大」有关的量（相机远近裁剪面、控制器行程、雾密度、
 * 初始机位、剖切标高）都从 layout.room.bounds 推出，不写死绝对值。
 * ══════════════════════════════════════════════════════════════════════ */

const SITE = (() => {
  const b = PUMP_ROOM.room.bounds;
  const w = b.maxX - b.minX;
  const d = b.maxZ - b.minZ;
  const cx = (b.minX + b.maxX) / 2;
  const cz = (b.minZ + b.maxZ) / 2;
  const span = Math.max(w, d);
  const diag = Math.hypot(w, d);
  const clearHeight = PUMP_ROOM.room.clearHeight || 4;
  return { w, d, cx, cz, span, diag, clearHeight, halfW: w / 2, halfD: d / 2, center: new THREE.Vector3(cx, 0, cz) };
})();

/** 尺度系数（无量纲）：一律乘到 SITE 的尺度上 */
const VIEW = {
  minDistanceFactor: 0.06,
  maxDistanceFactor: 1.35,
  nearFactor: 0.004,
  farFactor: 6,
};

const CAMERA_NEAR = Math.max(0.05, SITE.span * VIEW.nearFactor);
const CAMERA_FAR = SITE.span * VIEW.farFactor;
const CAMERA_MIN_DISTANCE = Math.max(1.2, SITE.span * VIEW.minDistanceFactor);
const CAMERA_MAX_DISTANCE = SITE.span * VIEW.maxDistanceFactor;

/**
 * 机位预设（全部由房间尺度推导，不写死绝对值）
 * - exterior：室外西南角 3/4 斜视，配合剖视看内部结构
 * - interior：室内人视点，站在西南角看向泵组与水罐
 * - section：剖切俯视，配合水平剖切面看整体布置
 */
const CAMERA_PRESETS = {
  exterior: () => ({
    position: new THREE.Vector3(
      SITE.halfW * -1 - SITE.w * 0.30,
      SITE.span * 0.42,
      SITE.halfD * -1 - SITE.d * 0.34,
    ),
    target: new THREE.Vector3(SITE.cx, SITE.clearHeight * 0.32, SITE.cz),
  }),
  interior: () => ({
    position: new THREE.Vector3(
      SITE.halfW * -1 + SITE.w * 0.075,
      Math.min(2.9, SITE.clearHeight * 0.72),
      SITE.halfD * -1 + SITE.d * 0.17,
    ),
    target: new THREE.Vector3(SITE.cx + SITE.w * 0.0625, 1.15, SITE.cz + SITE.d * 0.1),
  }),
  section: () => ({
    position: new THREE.Vector3(
      SITE.cx + SITE.span * 0.16,
      SITE.span * 0.78,
      SITE.cz - SITE.diag * 0.46,
    ),
    target: new THREE.Vector3(SITE.cx, 0.4, SITE.cz),
  }),
};

/** 剖切标高：略高于水罐顶（3.92 m），用于移除顶棚与屋面梁，保留罐体完整 */
const SECTION_Y = 3.95;

/* ══════════════════════════════════════════════════════════════════════
 * 剖视（cutaway）规则
 *
 * 目标：用户不进入建筑也能看清内部结构。
 *   ① 去屋顶 —— 隐藏屋面板、屋面梁，以及因此失去附着点的吊装杆（灯具吊杆、桥架吊杆）；
 *   ② 隐墙   —— 实时判断四面墙里哪些位于相机与房间之间，只隐藏这些墙及其附属构件
 *                （墙裙、门、窗、防撞标识）。相机在室内时四面墙全保留；
 *                相机在室外某角时，恰好隐去朝向用户的四面墙中的两面。
 *
 * 归类按网格名前缀/后缀进行，不改动各建模模块。
 * ══════════════════════════════════════════════════════════════════════ */
const CUTAWAY_RULES = {
  // 屋顶：屋面板 + 屋面梁
  roof: [/^SHELL_CEILING_/, /^SHELL_BEAM_/],
  // 吊装件：顶棚没了就没有附着点，随屋顶一并隐去
  hanger: [/_ROD$/, /_HANGER$/, /^LIGHT_\d+_BASE$/, /^LIGHT_\d+_SLEEVE$/],
  wall: {
    south: [
      /^SHELL_WALL_SOUTH_/, /^SHELL_SKIRT_SOUTH_/,
      /^SHELL_DOOR_/, /^SHELL_HAZARD_DOOR_/,
      /^SIGN_\d+_ROOM_PLATE/,          // 南墙房号牌
      /^LIGHT_EMERGENCY_(BODY|GLOW|BRACKET)$/,  // 南墙应急灯支架
      /^TRAY_\d+_BRACKET_WALL$/,      // 南墙壁挂桥架托架
    ],
    north: [/^SHELL_WALL_NORTH_/, /^SHELL_SKIRT_NORTH_/],
    west: [/^SHELL_WALL_WEST_/, /^SHELL_SKIRT_WEST_/, /^SHELL_SUMP_RISER_WALL_WEST_/],
    east: [
      /^SHELL_WALL_EAST_/, /^SHELL_SKIRT_EAST_/, /^SHELL_WINDOW_/,
      /^SHELL_SUMP_RISER_WALL_EAST_/,
      /^PIPE_DISCHARGE_SLEEVE_/,      // 东墙穿墙套管
    ],
  },
};
const WALL_SIDES = ['south', 'north', 'west', 'east'];

/** 相机越过墙面多少才判定为「在墙外侧」（米）：留出缓冲，避免贴着墙面时墙忽隐忽现 */
const WALL_FACE_EPS = 0.12;

/** 视图预设的提示文案 */
const VIEW_HINTS = {
  exterior: '已切换到外观：室外 3/4 斜视，配合剖视看内部结构',
  interior: '已切换到室内视角',
  section: '已切换到剖切俯视',
};

/** 四面墙的平面外法线与所在坐标（由 layout.room.bounds 推出，不写死绝对值） */
const WALL_PLAN = (() => {
  const b = PUMP_ROOM.room.bounds;
  return {
    south: { axis: 'z', at: b.minZ, sign: -1 },
    north: { axis: 'z', at: b.maxZ, sign: +1 },
    west: { axis: 'x', at: b.minX, sign: -1 },
    east: { axis: 'x', at: b.maxX, sign: +1 },
  };
})();

const QUALITY_PRESETS = {
  high: { pixelRatio: 2, shadows: true, shadowMap: 2048 },
  medium: { pixelRatio: 1.5, shadows: true, shadowMap: 1024 },
  low: { pixelRatio: 1, shadows: false, shadowMap: 512 },
};

const DEFAULT_OPTIONS = { seed: 20261031, quality: 'high', wireframe: false, cutaway: true };

/* ══════════════════════════════════════════════════════════════════════
 * 小工具
 * ══════════════════════════════════════════════════════════════════════ */

const $ = (id) => document.getElementById(id);

/* ══════════════════════════════════════════════════════════════════════
 * 伙伴模块动态载入（容错）
 * ══════════════════════════════════════════════════════════════════════ */

/**
 * 载入伙伴模块的构建函数。文件缺失 / 导出缺失 / 语法错误都只记录错误，不抛出。
 * @returns {Promise<{ok:boolean, fn?:Function, error?:Error}>}
 */
async function loadBuilder(path, exportName, label) {
  try {
    const mod = await import(/* @vite-ignore */ path);
    const fn = mod[exportName];
    if (typeof fn !== 'function') {
      const err = new Error(`模块 ${path} 未导出 ${exportName}`);
      console.error(`[app] ${label} 导出缺失，已跳过该模块：${err.message}`);
      return { ok: false, error: err };
    }
    return { ok: true, fn };
  } catch (err) {
    console.error(`[app] ${label} (${path}) 加载失败，已跳过该模块：`, err);
    return { ok: false, error: err };
  }
}

/* ══════════════════════════════════════════════════════════════════════
 * createApp
 * ══════════════════════════════════════════════════════════════════════ */

/**
 * @param {HTMLElement} container 渲染容器
 * @param {object} [options] { seed, quality, wireframe }
 */
export function createApp(container, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const dom = container || $('viewport');
  if (!dom) throw new Error('[app] 缺少渲染容器 #viewport');

  /* ── 1. 渲染器 ─────────────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, QUALITY_PRESETS[opts.quality].pixelRatio, 2));
  renderer.setSize(dom.clientWidth || window.innerWidth, dom.clientHeight || window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = QUALITY_PRESETS[opts.quality].shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.classList.add('pump-room-canvas');
  dom.appendChild(renderer.domElement);

  /* ── 2. 场景 / 相机 / 控制器 ───────────────────────────────────── */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0a0d12');
  scene.fog = new THREE.Fog('#0a0d12', SITE.span * 0.9, SITE.span * 3.1);

  const camera = new THREE.PerspectiveCamera(
    52,
    (dom.clientWidth || window.innerWidth) / (dom.clientHeight || window.innerHeight),
    CAMERA_NEAR,
    CAMERA_FAR,
  );
  const preset = CAMERA_PRESETS.exterior();
  camera.position.copy(preset.position);
  camera.lookAt(preset.target);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(preset.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = 1.52;
  controls.minDistance = CAMERA_MIN_DISTANCE;
  controls.maxDistance = CAMERA_MAX_DISTANCE;
  controls.update();

  /* ── 3. 共享上下文 ctx ─────────────────────────────────────────── */
  const pois = createPOIStore();
  pois.addAll(POI_LIST);
  const materials = createMaterials(THREE);
  const ctx = {
    THREE,
    mat: materials.get,
    rng: makeRNG(opts.seed),
    pois,
    layout: PUMP_ROOM,
    options: {
      quality: opts.quality,
      wireframe: !!opts.wireframe,
    },
  };
  /** 与 pois.register 等价的别名（契约 4.5） */
  ctx.poiIndex = { register: (id, mesh) => pois.register(id, mesh) };

  /* ── 4. 伙伴模块装配 ───────────────────────────────────────────── */
  const modelGroup = new THREE.Group();
  modelGroup.name = 'PUMP_ROOM_MODEL';
  scene.add(modelGroup);

  const BUILDERS = [
    ['./modules/shell.js', 'buildShell', '土建外壳模块'],
    ['./modules/tanks.js', 'buildTanks', '水罐模块'],
    ['./modules/pumps.js', 'buildPumps', '泵组模块'],
    ['./modules/piping.js', 'buildPiping', '管道阀门模块'],
    ['./modules/electrical.js', 'buildElectrical', '控制柜电气模块'],
    ['./modules/lighting.js', 'buildLighting', '照明模块'],
  ];

  const buildState = { lighting: null, loaded: [], failed: [] };

  async function buildScene() {
    for (const [path, exportName, label] of BUILDERS) {
      const sub = $('loading-sub');
      if (sub) sub.textContent = `装配${label}`;
      const res = await loadBuilder(path, exportName, label);
      if (!res.ok) {
        buildState.failed.push({ path, label, error: res.error });
        continue;
      }
      try {
        const result = res.fn(ctx);
        const group = result && result.group ? result.group : result;
        if (group && group.isObject3D) modelGroup.add(group);
        if (exportName === 'buildLighting' && result && typeof result.setOn === 'function') {
          buildState.lighting = result;
        }
        buildState.loaded.push({ path, label });
      } catch (err) {
        console.error(`[app] ${label} 构建失败，已跳过该模块：`, err);
        buildState.failed.push({ path, label, error: err });
      }
    }
  }

  /* ── 5. 基础环境光（正式照明由 lighting.js 提供） ───────────────── */
  const ambient = new THREE.HemisphereLight('#b9cfe8', '#1a1d21', 0.42);
  scene.add(ambient);

  const fillLight = new THREE.DirectionalLight('#cfe0ff', 0.32);
  fillLight.position.set(-SITE.halfW * 0.8, SITE.clearHeight * 1.6, SITE.halfD * 0.7);
  scene.add(fillLight);

  /**
   * 程序化室内环境贴图。
   * 必要性：材质库中钢罐 / 管道 / 阀门均为高 metalness（0.9+），金属没有漫反射，
   * 没有环境反射时会渲染成近黑。这里用 Canvas 画一张等距柱状投影渐变
   * （顶棚灯带 + 墙面 + 地面），经 PMREM 卷积后作为 scene.environment。
   */
  function buildEnvironment(rendererRef) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const c2d = canvas.getContext('2d');
      const grad = c2d.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0.0, '#93a9c2');
      grad.addColorStop(0.42, '#6d7883');
      grad.addColorStop(0.52, '#43494f');
      grad.addColorStop(1.0, '#1d2024');
      c2d.fillStyle = grad;
      c2d.fillRect(0, 0, 256, 128);
      // 顶棚灯带在金属表面的反射条
      c2d.fillStyle = 'rgba(255,240,214,0.9)';
      for (let i = 0; i < 4; i += 1) c2d.fillRect(12 + i * 62, 16, 38, 13);
      c2d.fillStyle = 'rgba(255,240,214,0.45)';
      for (let i = 0; i < 4; i += 1) c2d.fillRect(12 + i * 62, 30, 38, 5);

      const tex = new THREE.CanvasTexture(canvas);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      const pmrem = new THREE.PMREMGenerator(rendererRef);
      const env = pmrem.fromEquirectangular(tex).texture;
      pmrem.dispose();
      tex.dispose();
      return env;
    } catch (err) {
      console.error('[app] 环境贴图生成失败，金属材质将缺少反射：', err);
      return null;
    }
  }

  const envTexture = buildEnvironment(renderer);
  if (envTexture) scene.environment = envTexture;

  /* ── 6. POI 拾取 ───────────────────────────────────────────────── */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const _hitPoint = new THREE.Vector3();
  /** POI id → 运行时实际包围盒（粗筛用；声明 bbox 小于实际几何时用声明值会漏检） */
  const pickBoxes = new Map();

  /** obj 是否为 roots 中任一对象的自身或后代 */
  function isDescendantOfAny(roots, obj) {
    for (const root of roots) {
      if (root === obj) return true;
      let node = obj;
      while (node) {
        if (node === root) return true;
        node = node.parent;
      }
    }
    return false;
  }

  function rebuildPickBoxes() {
    pickBoxes.clear();
    for (const poi of pois.list()) {
      const meshes = pois.meshesOf(poi.id);
      if (!meshes.length) continue;
      const box = new THREE.Box3();
      for (const m of meshes) box.expandByObject(m);
      if (!box.isEmpty()) pickBoxes.set(poi.id, box);
    }
  }

  function pickPOI(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const candidates = [];
    for (const [id, box] of pickBoxes) {
      if (raycaster.ray.intersectBox(box, _hitPoint)) candidates.push(id);
    }
    if (!candidates.length) return null;

    const targets = [];
    for (const id of candidates) {
      for (const m of pois.meshesOf(id)) targets.push(m);
    }
    if (targets.length) {
      // recursive = true：部分模块注册的是 Group，非递归求交打不中其子网格
      const hits = raycaster.intersectObjects(targets, true);
      if (hits.length) {
        const obj = hits[0].object;
        const explicit = obj.userData && (obj.userData.poiId || obj.userData.__poiId);
        if (explicit && pois.get(explicit)) return pois.get(explicit);
        for (const id of candidates) {
          if (isDescendantOfAny(pois.meshesOf(id), obj)) return pois.get(id);
        }
      }
    }

    let best = null;
    let bestDist = Infinity;
    for (const id of candidates) {
      const box = pickBoxes.get(id);
      if (!raycaster.ray.intersectBox(box, _hitPoint)) continue;
      const dist = _hitPoint.distanceToSquared(camera.position);
      if (dist < bestDist) {
        bestDist = dist;
        best = pois.get(id);
      }
    }
    return best;
  }

  /* ── 7. UI ────────────────────────────────────────────────────── */
  const ui = {
    poiList: $('poi-list'),
    poiCount: $('poi-count'),
    poiCategories: $('poi-categories'),
    poiSearch: $('poi-search'),
    poiInfo: $('poi-info'),
    overview: $('device-overview'),
    toast: $('toast'),
    loading: $('loading'),
    loadingSub: $('loading-sub'),
    exportHint: $('export-hint'),
    hudFps: $('hud-fps'),
    hudDraw: $('hud-draw'),
    hudTris: $('hud-tris'),
    hudObjects: $('hud-objects'),
    hudPoi: $('hud-poi'),
  };

  let activeCategory = '';
  let searchText = '';
  let selected = null;

  function toast(msg) {
    if (!ui.toast) return;
    ui.toast.textContent = msg;
    ui.toast.classList.add('is-visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => ui.toast.classList.remove('is-visible'), 2200);
  }

  function renderCategories() {
    if (!ui.poiCategories) return;
    const cats = PUMP_ROOM.poiCategories || [];
    const frag = document.createDocumentFragment();
    const all = document.createElement('button');
    all.type = 'button';
    all.className = 'chip is-active';
    all.textContent = '全部';
    all.dataset.category = '';
    frag.appendChild(all);
    for (const c of cats) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = c.name || c.id;
      b.dataset.category = c.id;
      frag.appendChild(b);
    }
    ui.poiCategories.innerHTML = '';
    ui.poiCategories.appendChild(frag);
  }

  function matches(poi) {
    if (activeCategory && poi.category !== activeCategory) return false;
    if (!searchText) return true;
    const hay = `${poi.name} ${poi.category} ${poi.summary || ''} ${(poi.tags || []).join(' ')}`.toLowerCase();
    return hay.includes(searchText);
  }

  function renderPoiList() {
    if (!ui.poiList) return;
    const items = pois.list().filter(matches);
    if (ui.poiCount) ui.poiCount.textContent = String(items.length);
    const frag = document.createDocumentFragment();
    if (!items.length) {
      const p = document.createElement('p');
      p.className = 'empty-hint';
      p.textContent = '没有匹配的 POI。';
      frag.appendChild(p);
    }
    for (const poi of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `poi-item${selected && selected.id === poi.id ? ' is-active' : ''}`;
      const meta = document.createElement('span');
      meta.className = 'poi-item-meta';
      const tag = document.createElement('span');
      tag.className = 'poi-item-tag';
      tag.textContent = poi.category;
      meta.appendChild(tag);
      meta.appendChild(document.createTextNode(
        `${poi.position.map((v) => Number(v).toFixed(1)).join(', ')}`,
      ));
      const name = document.createElement('span');
      name.className = 'poi-item-name';
      name.textContent = poi.name;
      btn.appendChild(name);
      btn.appendChild(meta);
      btn.addEventListener('click', () => selectPOI(poi.id, false));
      frag.appendChild(btn);
    }
    ui.poiList.innerHTML = '';
    ui.poiList.appendChild(frag);
  }

  function renderInfo(poi) {
    if (!ui.poiInfo) return;
    if (!poi) {
      ui.poiInfo.innerHTML = '<p class="empty-hint">在场景中点击设备，或从左侧列表选择。</p>';
      return;
    }
    const rows = Object.entries(poi.meta || {})
      .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(String(v))}</td></tr>`)
      .join('');
    ui.poiInfo.innerHTML = `
      <h3 class="info-title">${escapeHtml(poi.name)}</h3>
      <span class="info-cat">${escapeHtml(poi.category)}</span>
      <p class="info-summary">${escapeHtml(poi.summary || '')}</p>
      ${rows ? `<table class="kv-table">${rows}</table>` : ''}
    `;
  }

  function renderOverview() {
    if (!ui.overview) return;
    const counts = new Map();
    for (const p of pois.list()) counts.set(p.category, (counts.get(p.category) || 0) + 1);
    const rows = [...counts.entries()]
      .map(([k, v]) => `<div class="ov-row"><span>${escapeHtml(k)}</span><span>${v} 台/座</span></div>`)
      .join('');
    const b = PUMP_ROOM.room.bounds;
    ui.overview.innerHTML = `
      <div class="ov-row"><span>房间尺寸</span><span>${(b.maxX - b.minX).toFixed(1)} × ${(b.maxZ - b.minZ).toFixed(1)} m</span></div>
      <div class="ov-row"><span>梁底净高</span><span>${PUMP_ROOM.room.clearHeight.toFixed(1)} m</span></div>
      <div class="ov-row"><span>POI 总数</span><span>${pois.size()}</span></div>
      ${rows}
    `;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  /* ── 8. 选中与聚焦 ─────────────────────────────────────────────── */
  /** 选中高亮的网格（含其子网格） */
  let highlighted = [];

  function collectMeshes(roots) {
    const out = [];
    for (const root of roots) {
      if (!root) continue;
      if (root.isMesh) out.push(root);
      else if (root.traverse) root.traverse((o) => { if (o.isMesh) out.push(o); });
    }
    return out;
  }

  function clearHighlight() {
    for (const m of highlighted) {
      if (m.userData && m.userData.__origMaterial) {
        m.material = m.userData.__origMaterial;
        delete m.userData.__origMaterial;
      }
    }
    highlighted = [];
  }

  /**
   * 高亮选中对象。
   * 注意：材质库中的材质是全场景共享实例，直接改 emissive 会把同材质的其它
   * 物体一起染色。因此这里克隆材质后再改，用完还原。
   */
  function highlightPOI(id) {
    for (const m of collectMeshes(pois.meshesOf(id))) {
      if (!m.material) continue;
      const src = Array.isArray(m.material) ? null : m.material;
      if (!src) continue;
      m.userData.__origMaterial = src;
      const clone = src.clone();
      if (clone.emissive) clone.emissive.setHex(0x2f6f8f);
      if (clone.emissiveIntensity !== undefined) clone.emissiveIntensity = Math.max(clone.emissiveIntensity, 0.9);
      m.material = clone;
      highlighted.push(m);
    }
  }

  function selectPOI(id, focus = false) {
    const poi = pois.get(id);
    if (!poi) return;
    selected = poi;
    clearHighlight();
    highlightPOI(id);
    renderInfo(poi);
    renderPoiList();
    if (focus) focusOn(poi);
  }

  function focusOn(poi) {
    const box = pickBoxes.get(poi.id);
    const target = box ? box.getCenter(new THREE.Vector3()) : new THREE.Vector3(...poi.position);
    const size = box ? box.getSize(new THREE.Vector3()) : new THREE.Vector3(1, 1, 1);
    const radius = Math.max(size.length() * 0.6, 1.2);
    const dir = camera.position.clone().sub(controls.target).normalize();
    const dist = Math.min(CAMERA_MAX_DISTANCE, Math.max(CAMERA_MIN_DISTANCE, radius * 2.6));
    controls.target.copy(target);
    camera.position.copy(target).addScaledVector(dir, dist);
    controls.update();
  }

  /* ── 9. 交互绑定 ───────────────────────────────────────────────── */
  let downPos = null;
  renderer.domElement.addEventListener('pointerdown', (e) => {
    downPos = { x: e.clientX, y: e.clientY };
  });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!downPos) return;
    const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
    downPos = null;
    if (moved > 4) return;
    const poi = pickPOI(e.clientX, e.clientY);
    if (poi) selectPOI(poi.id, false);
    else {
      selected = null;
      clearHighlight();
      renderInfo(null);
      renderPoiList();
    }
  });

  if (ui.poiSearch) {
    ui.poiSearch.addEventListener('input', (e) => {
      searchText = e.target.value.trim().toLowerCase();
      renderPoiList();
    });
  }

  if (ui.poiCategories) {
    ui.poiCategories.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      activeCategory = chip.dataset.category || '';
      for (const c of ui.poiCategories.querySelectorAll('.chip')) c.classList.remove('is-active');
      chip.classList.add('is-active');
      renderPoiList();
    });
  }

  const btnPoi = $('btn-toggle-poi');
  const btnSide = $('btn-toggle-side');
  if (btnPoi) btnPoi.addEventListener('click', () => $('poi-panel').classList.toggle('is-hidden'));
  if (btnSide) btnSide.addEventListener('click', () => $('side-panel').classList.toggle('is-hidden'));

  /* ══ 剖视：去屋顶 + 隐去朝向相机的墙 ══════════════════════════════ */

  /** 构件索引：按网格名归类，供剖视开关使用（模块装配后才建，故惰性构建） */
  function buildCutawayIndex() {
    const idx = { roof: [], hanger: [], wall: { south: [], north: [], west: [], east: [] } };
    scene.traverse((o) => {
      if (!o.isMesh) return;
      const n = typeof o.name === 'string' ? o.name : '';
      if (!n) return;
      if (CUTAWAY_RULES.roof.some((re) => re.test(n))) { idx.roof.push(o); return; }
      if (CUTAWAY_RULES.hanger.some((re) => re.test(n))) { idx.hanger.push(o); return; }
      for (const side of WALL_SIDES) {
        if (CUTAWAY_RULES.wall[side].some((re) => re.test(n))) { idx.wall[side].push(o); return; }
      }
    });
    return idx;
  }
  let cutawayIndex = null;
  function ensureCutawayIndex() {
    if (!cutawayIndex) cutawayIndex = buildCutawayIndex();
    return cutawayIndex;
  }
  let cutawayOn = opts.cutaway !== false;

  /** 某面墙是否横在相机与房间之间（相机在其外侧即隐去） */
  function isWallFacingCamera(side) {
    const s = WALL_PLAN[side];
    return (camera.position[s.axis] - s.at) * s.sign > WALL_FACE_EPS;
  }

  /** 屋顶与吊装杆：剖视开启或剖切俯视时一并移除 */
  function refreshRoof() {
    const idx = ensureCutawayIndex();
    const gone = cutawayOn || sectionOn;
    for (const m of idx.roof) m.visible = !gone;
    for (const m of idx.hanger) m.visible = !gone;
  }

  /** 四面墙：只隐藏位于相机与房间之间的那几面 */
  function refreshWalls() {
    const idx = ensureCutawayIndex();
    for (const side of WALL_SIDES) {
      const hide = cutawayOn && isWallFacingCamera(side);
      for (const m of idx.wall[side]) m.visible = !hide;
    }
  }

  function applyCutaway(on) {
    cutawayOn = !!on;
    if (chkCutaway) chkCutaway.checked = cutawayOn;
    refreshRoof();
    refreshWalls();
  }

  const chkCutaway = $('chk-cutaway');
  if (chkCutaway) {
    chkCutaway.addEventListener('change', (e) => {
      applyCutaway(e.target.checked);
      toast(e.target.checked ? '剖视开启：已去屋顶，隐去朝向相机的墙' : '剖视关闭：恢复完整建筑');
    });
  }
  controls.addEventListener('change', refreshWalls);

  /* 视图预设：外观 / 室内 / 剖切俯视 */
  const viewRow = $('view-presets');
  const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), SECTION_Y);
  let sectionOn = false;

  function applySection(on) {
    sectionOn = !!on;
    renderer.localClippingEnabled = sectionOn;
    const planes = sectionOn ? [clipPlane] : null;
    const touched = new Set();
    scene.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (touched.has(m.uuid)) continue;
        touched.add(m.uuid);
        m.clippingPlanes = planes;
        m.needsUpdate = true;
      }
    });
    // 屋顶在剖切面之上会被裁掉；这里按当前模式显式隐藏，保证首帧无残影
    refreshRoof();
  }

  function applyView(key) {
    const p = CAMERA_PRESETS[key] ? CAMERA_PRESETS[key]() : CAMERA_PRESETS.exterior();
    camera.position.copy(p.position);
    controls.target.copy(p.target);
    camera.lookAt(p.target);
    controls.update();
    applySection(key === 'section');
    refreshWalls();
  }

  if (viewRow) {
    viewRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      for (const b of viewRow.querySelectorAll('.seg-btn')) b.classList.remove('is-active');
      btn.classList.add('is-active');
      applyView(btn.dataset.view);
      toast(VIEW_HINTS[btn.dataset.view] || '视角已切换');
    });
  }

  /* 灯光开关 */
  const lightRow = $('light-presets');
  if (lightRow) {
    lightRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      for (const b of lightRow.querySelectorAll('.seg-btn')) b.classList.remove('is-active');
      btn.classList.add('is-active');
      const on = btn.dataset.light !== 'off';
      if (buildState.lighting && typeof buildState.lighting.setOn === 'function') {
        buildState.lighting.setOn(on);
      }
      ambient.intensity = on ? 0.42 : 0.12;
      fillLight.intensity = on ? 0.32 : 0.08;
      toast(on ? '照明已开启' : '照明已关闭');
    });
  }

  /* 画质 */
  const qualityRow = $('quality-presets');
  function applyQuality(key) {
    const q = QUALITY_PRESETS[key] || QUALITY_PRESETS.high;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.pixelRatio, 2));
    renderer.shadowMap.enabled = q.shadows;
    scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = q.shadows;
        o.receiveShadow = q.shadows;
      }
    });
    ctx.options.quality = key;
    toast(`画质：${{ high: '高', medium: '中', low: '低' }[key]}`);
  }
  if (qualityRow) {
    qualityRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (!btn) return;
      for (const b of qualityRow.querySelectorAll('.seg-btn')) b.classList.remove('is-active');
      btn.classList.add('is-active');
      applyQuality(btn.dataset.quality);
    });
  }

  /* 线框 */
  const chkWire = $('chk-wireframe');
  function applyWireframe(on) {
    ctx.options.wireframe = !!on;
    scene.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (m.userData.__origWireframe === undefined) m.userData.__origWireframe = !!m.wireframe;
        m.wireframe = ctx.options.wireframe;
      }
    });
    if (chkWire) chkWire.checked = !!on;
  }
  if (chkWire) chkWire.addEventListener('change', (e) => applyWireframe(e.target.checked));

  /* 清单导出 */
  function exportManifest() {
    const manifest = {
      version: PUMP_ROOM.meta.version,
      generatedAt: new Date().toISOString(),
      items: pois.list(),
    };
    const json = JSON.stringify(manifest, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'manifest.json';
    a.click();
    URL.revokeObjectURL(a.href);
    if (ui.exportHint) {
      ui.exportHint.textContent = `已导出 ${manifest.items.length} 条 POI，生成时间 ${manifest.generatedAt}`;
    }
    toast(`清单已导出：${manifest.items.length} 条 POI`);
    return manifest;
  }
  const btnExport = $('btn-export');
  if (btnExport) btnExport.addEventListener('click', exportManifest);

  /* 键盘 */
  window.addEventListener('keydown', (e) => {
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === 'f' || e.key === 'F') {
      if (selected) focusOn(selected);
    } else if (e.key === 'Escape') {
      selected = null;
      clearHighlight();
      renderInfo(null);
      renderPoiList();
    } else if (e.key === 'w' || e.key === 'W') {
      applyWireframe(!ctx.options.wireframe);
    } else if (e.key === '1') applyQuality('high');
    else if (e.key === '2') applyQuality('medium');
    else if (e.key === '3') applyQuality('low');
  });

  /* ── 10. HUD 与渲染循环 ───────────────────────────────────────── */
  let frames = 0;
  let lastFpsAt = performance.now();
  function updateHud() {
    const info = renderer.info;
    if (ui.hudDraw) ui.hudDraw.textContent = String(info.render.calls);
    if (ui.hudTris) ui.hudTris.textContent = info.render.triangles.toLocaleString('en-US');
    if (ui.hudObjects) ui.hudObjects.textContent = String(info.memory.geometries);
    if (ui.hudPoi) ui.hudPoi.textContent = String(pois.size());
  }

  function loop() {
    requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
    frames += 1;
    const now = performance.now();
    if (now - lastFpsAt >= 500) {
      if (ui.hudFps) ui.hudFps.textContent = String(Math.round((frames * 1000) / (now - lastFpsAt)));
      frames = 0;
      lastFpsAt = now;
      updateHud();
    }
  }

  window.addEventListener('resize', () => {
    const w = dom.clientWidth || window.innerWidth;
    const h = dom.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  /* ── 11. 启动 ─────────────────────────────────────────────────── */
  async function start() {
    renderCategories();
    renderPoiList();
    renderOverview();
    renderInfo(null);

    await buildScene();

    // 伙伴模块装配后重建拾取包围盒
    rebuildPickBoxes();

    // 剖视索引依赖场景内容，模块装配后重建
    cutawayIndex = null;

    // 阴影与线框初值
    const q = QUALITY_PRESETS[ctx.options.quality] || QUALITY_PRESETS.high;
    scene.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = q.shadows;
      o.receiveShadow = q.shadows;
    });
    if (ctx.options.wireframe) applyWireframe(true);

    // 剖视初值：去屋顶 + 隐去朝向相机的墙
    applyCutaway(cutawayOn);

    if (buildState.failed.length) {
      console.warn('[app] 部分模块未装配：', buildState.failed.map((f) => f.label).join('、'));
    }
    if (ui.loadingSub) {
      ui.loadingSub.textContent = buildState.failed.length
        ? `完成（${buildState.failed.length} 个模块缺失）`
        : '完成';
    }
    if (ui.loading) {
      ui.loading.style.transition = 'opacity 0.35s ease';
      ui.loading.style.opacity = '0';
      setTimeout(() => ui.loading && ui.loading.remove(), 380);
    }

    // 调试句柄：自动化几何实测依赖
    window.__pumpRoom = {
      THREE, scene, camera, renderer, controls,
      pois, layout: PUMP_ROOM, options: ctx.options,
      POI_LIST,
      pickBoxes, buildState,
      cutaway: { get on() { return cutawayOn; }, apply: applyCutaway, refresh: refreshWalls, index: cutawayIndex },
      get sectionOn() { return sectionOn; },
      ready: true,
    };

    loop();
  }

  start();

  return {
    scene, camera, renderer, controls, ctx, pois,
    pickPOI, selectPOI, exportManifest, rebuildPickBoxes,
  };
}

/* 自动启动（作为独立页面打开时） */
if (typeof document !== 'undefined' && document.getElementById('viewport')) {
  window.__pumpRoomApp = createApp();
}

export default createApp;
