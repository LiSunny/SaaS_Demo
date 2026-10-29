/**
 * app.js — 通用大学校园示例模型 · 应用主程序
 *
 * 职责：渲染器 / 相机 / 控制器 / 天空与昼夜 / POI 拾取与面板 / 区域剖切 /
 *       季节与画质切换 / 性能 HUD / manifest 导出。
 *
 * 只读依赖（团队基线，不得修改）：
 *   ./layout.js        布局真值表
 *   ./core/poi.js      POI 注册表
 *   ./core/materials.js 统一材质库
 *   ./core/rng.js      可复现随机数
 *
 * 伙伴模块（并行编写，可能尚未落盘或自身抛错）：
 *   ./buildings.js  ./terrain.js  ./vegetation.js
 *
 * 说明：伙伴模块采用**动态 import** 载入。导入路径与导出名与既定契约完全一致
 * （buildBuildings / buildTerrain / buildVegetation），但用动态 import 才能在
 * 伙伴模块缺失或抛错时被 try/catch 捕获，从而「跳过该模块 + 明确报错」，
 * 保证场景其余部分继续渲染，不出现整页白屏。
 */

import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/examples/jsm/controls/OrbitControls.js';
import { CAMPUS, POI_CATEGORIES } from './layout.js';
import { createPOIStore } from './core/poi.js';
import { createMaterials } from './core/materials.js';
import { makeRNG } from './core/rng.js';

/* ══════════════════════════════════════════════════════════════════════
 * 场地尺度推导
 *
 * 所有与「场地多大」有关的量（相机远近裁剪面、控制器行程、阴影范围、
 * 雾密度、夜间点光源位置）都从 layout.site.bounds 推出，不写死绝对值。
 * 换回小场地时这些量会同比缩放，无需再改代码。
 * ══════════════════════════════════════════════════════════════════════ */

const SITE = (() => {
  const b = (CAMPUS.site && CAMPUS.site.bounds) || {
    minX: -280, maxX: 280, minZ: -232.5, maxZ: 232.5,
  };
  const w = b.maxX - b.minX;
  const d = b.maxZ - b.minZ;
  const cx = (b.minX + b.maxX) / 2;
  const cz = (b.minZ + b.maxZ) / 2;
  const span = Math.max(w, d); // 场地长边
  const diag = Math.hypot(w, d); // 场地对角线
  const padding = (CAMPUS.site && CAMPUS.site.groundPadding) || 0;

  let maxHeight = 0;
  for (const bd of CAMPUS.buildings || []) {
    const h = (bd.floors || 0) * (bd.floorHeight || 0);
    if (h > maxHeight) maxHeight = h;
  }

  // 主轴 RD_AXIS_MAIN：雾密度标定的参考距离 + 初始视点目标点
  const axis = (CAMPUS.roads || []).find((r) => r.id === 'RD_AXIS_MAIN');
  let axisLength = d;
  let axisMidZ = cz;
  if (axis && Array.isArray(axis.points) && axis.points.length > 1) {
    axisLength = 0;
    for (let i = 1; i < axis.points.length; i += 1) {
      axisLength += Math.hypot(
        axis.points[i][0] - axis.points[i - 1][0],
        axis.points[i][1] - axis.points[i - 1][1],
      );
    }
    axisMidZ = (axis.points[0][1] + axis.points[axis.points.length - 1][1]) / 2;
  }

  return {
    w, d, cx, cz, span, diag, padding, maxHeight,
    halfW: w / 2, halfD: d / 2,
    axisLength, axisMidZ,
    center: new THREE.Vector3(cx, 0, cz),
  };
})();

/* 尺度系数（无量纲）：一律乘到 SITE 的尺度上 */
const VIEW = {
  azimuth: deg2rad(33), // 初始机位相对正南向东偏 33°
  elevation: deg2rad(24), // 初始机位俯角 24°
  distanceFactor: 1.16, // 初始距离 = SITE.span × 1.16
  minDistanceFactor: 0.04, // 最小距离 = SITE.span × 0.04
  maxDistanceFactor: 1.6, // 最大距离 = SITE.diag × 1.6
  skyFactor: 1.22, // 天穹半径 = 最大距离 × 1.22
  nearFactor: 0.002, // 近裁剪面 = SITE.span × 0.002
};

const VIEW_DISTANCE = SITE.span * VIEW.distanceFactor;
const CAMERA_MIN_DISTANCE = Math.max(20, SITE.span * VIEW.minDistanceFactor);
const CAMERA_MAX_DISTANCE = SITE.diag * VIEW.maxDistanceFactor;
const SKY_RADIUS = CAMERA_MAX_DISTANCE * VIEW.skyFactor;
const CAMERA_NEAR = Math.max(1, SITE.span * VIEW.nearFactor);
/* 远裁剪面须同时容下最远场景点与天穹：maxDistance + skyRadius + 余量 */
const CAMERA_FAR = CAMERA_MAX_DISTANCE + SKY_RADIUS + SITE.span * 0.2;

/**
 * 阴影参数。
 * half  = 全园半幅：场地外接圆半径 + 地面外扩 + 最高建筑投影余量
 * near/far = 沿太阳方向的深度区间，围绕 lightDistance 对称
 * 分级阈值：视距 < nearRange 时阴影收窄跟随 target；> farRange 时固定覆盖全园
 */
const SHADOW = {
  half: SITE.diag * 0.5 + SITE.padding + SITE.maxHeight * 1.2,
  lightDistance: SITE.diag * 1.2,
  near: SITE.diag * 0.65,
  far: SITE.diag * 1.75,
  nearRange: SITE.span * 0.22,
  farRange: SITE.span * 0.5,
  worldBias: 1.08, // m：与旧参数（-0.0006 × 1799 m）等效的世界空间偏移
};
const SHADOW_BIAS = -SHADOW.worldBias / (SHADOW.far - SHADOW.near);

/** 雾密度标定的参考距离：中轴南端看北端的距离 */
const FOG_REF_DISTANCE = Math.max(1, SITE.axisLength);

/**
 * FogExp2 密度标定。
 * three.js FogExp2：fogFactor(z) = 1 - exp(-(density × z)²)
 * 反解：density = sqrt(-ln(1 - fogFactor)) / z
 * @param {number} z 参考可视距离（m）
 * @param {number} f 该距离上的目标雾浓度（0~1）
 */
function fogDensityFor(z, f) {
  return Math.sqrt(-Math.log(1 - f)) / z;
}

/* ══════════════════════════════════════════════════════════════════════
 * 常量与预设
 * ══════════════════════════════════════════════════════════════════════ */

const DEFAULT_OPTIONS = {
  seed: 20240601,
  quality: 'high',
  season: 'summer',
  showTrees: true,
  wireframe: false,
};

const QUALITY_PRESETS = {
  high: { pixelRatio: 2, shadowMap: 2048, shadows: true, label: '高' },
  medium: { pixelRatio: 1.5, shadowMap: 1024, shadows: true, label: '中' },
  low: { pixelRatio: 1, shadowMap: 512, shadows: false, label: '低' },
};

const SEASONS = [
  { id: 'spring', label: '春' },
  { id: 'summer', label: '夏' },
  { id: 'autumn', label: '秋' },
  { id: 'winter', label: '冬' },
];

/**
 * 昼夜三档预设。
 * 方位角 azimuth 自北(+Z)起顺时针，0°=正北，90°=正东；
 * 高度角 elevation 自地平面起算，>0 表示太阳位于地平线之上。
 *
 * fogDensity 由 fogDensityFor(FOG_REF_DISTANCE, f) 标定：
 * f = 在「中轴长度」（SITE.axisLength）处的雾浓度。
 * day 18% / dusk 28% / night 40% → 站在地面能看清中轴北端，远景保留层次。
 */
const TIME_PRESETS = {
  day: {
    label: '白天',
    sunAzimuth: deg2rad(135),
    sunElevation: deg2rad(50),
    sunColor: 0xfff2dc,
    sunIntensity: 2.5,
    hemiSky: 0xbcd6f2,
    hemiGround: 0x8c8272,
    hemiIntensity: 0.85,
    skyTop: 0x3d7cc9,
    skyBottom: 0xc3dcf0,
    fogColor: 0xcadcec,
    fogDensity: fogDensityFor(FOG_REF_DISTANCE, 0.18),
    ambientColor: 0x9fb4c9,
    ambientIntensity: 0.32,
    exposure: 1.0,
    nightFactor: 0.0,
  },
  dusk: {
    label: '黄昏',
    sunAzimuth: deg2rad(281),
    sunElevation: deg2rad(6),
    sunColor: 0xff9a52,
    sunIntensity: 1.55,
    hemiSky: 0xf7a768,
    hemiGround: 0x4b3d33,
    hemiIntensity: 0.5,
    skyTop: 0x2c3f74,
    skyBottom: 0xef9d58,
    fogColor: 0xcf8a5d,
    fogDensity: fogDensityFor(FOG_REF_DISTANCE, 0.28),
    ambientColor: 0x6d5c52,
    ambientIntensity: 0.26,
    exposure: 1.02,
    nightFactor: 0.35,
  },
  night: {
    label: '夜晚',
    sunAzimuth: deg2rad(305),
    sunElevation: deg2rad(34),
    sunColor: 0x9fb6e0,
    sunIntensity: 0.34,
    hemiSky: 0x223354,
    hemiGround: 0x0d121b,
    hemiIntensity: 0.36,
    skyTop: 0x03060e,
    skyBottom: 0x17223a,
    fogColor: 0x0d1423,
    fogDensity: fogDensityFor(FOG_REF_DISTANCE, 0.4),
    ambientColor: 0x243352,
    ambientIntensity: 0.3,
    exposure: 1.12,
    nightFactor: 1.0,
  },
};

/**
 * 夜间点光源布置（数量克制，≤ 12）。
 * 位置由 layout 推导：5 盏沿主轴均布 + 1 盏压明理湖 + 2 盏分别压生活区高层与运动区。
 */
const NIGHT_LIGHT_SITES = (() => {
  const z0 = SITE.axisMidZ - SITE.axisLength / 2;
  const step = SITE.axisLength / 5;
  const lake = (CAMPUS.water || []).find((w) => w.id === 'CAMPUS_LAKE_01') || (CAMPUS.water || [])[0];
  const lc = lake && lake.center ? lake.center : [SITE.cx + SITE.span * 0.08, 0, SITE.cz];
  const sites = [];
  for (let i = 0; i < 5; i += 1) {
    sites.push({
      pos: [SITE.cx, 14 + i * 1.5, z0 + step * (i + 0.5)],
      intensity: 1400 + i * 80,
    });
  }
  sites.push({ pos: [lc[0], 18, lc[1]], intensity: 1500 });
  sites.push({ pos: [SITE.cx - SITE.halfW * 0.48, 16, SITE.cz - SITE.halfD * 0.4], intensity: 1200 });
  sites.push({ pos: [SITE.cx + SITE.halfW * 0.45, 16, SITE.cz + SITE.halfD * 0.2], intensity: 1300 });
  return sites;
})();

/**
 * 夜间需要发光的材质（来自统一材质库，不新建材质）→ 自发光强度。
 * 玻璃 0.85（窗户微亮）、灯罩 3.2（灯泡高亮）、光晕 1.15（地面光池）。
 */
const NIGHT_EMISSIVE_MATERIALS = {
  glass: 0.85,
  glassRoof: 0.85,
  lampLens: 2.2,
  lampGlow: 0.85,
  // 楼顶铭牌：emissiveMap 与底图同源 → 只有高亮的文字发亮，等同发光字
  signage: 0.5,
};

/** 区域剖切模式：可见 / 隐藏的 category 集合 */
const CLIP_MODES = {
  all: { label: '全显示', only: null, hide: [] },
  'only-teaching': { label: '仅教学区', only: ['教学'], hide: [] },
  'only-sport': { label: '仅运动区', only: ['运动'], hide: [] },
  'only-life': { label: '仅生活区', only: ['生活'], hide: [] },
  'hide-life': { label: '隐藏生活区', only: null, hide: ['生活'] },
  'hide-sport': { label: '隐藏运动区', only: null, hide: ['运动'] },
};

/**
 * 相机初始机位。
 * 场地东南上空俯视 24°，朝向主轴中点：
 *   正北方向 = 中轴大道纵深；东岸 = 明理湖；西侧 = 教学区高低错落群；东侧 = 运动区；
 *   画面右下 = 生活区高层公寓（最高 54 m）。
 * 位置由 SITE 尺度 × VIEW 系数推出，不写死坐标。
 */
const INITIAL_TARGET = new THREE.Vector3(SITE.cx, 0, SITE.axisMidZ);
const INITIAL_CAMERA_POS = (() => {
  const horiz = VIEW_DISTANCE * Math.cos(VIEW.elevation);
  return new THREE.Vector3(
    INITIAL_TARGET.x + horiz * Math.sin(VIEW.azimuth),
    VIEW_DISTANCE * Math.sin(VIEW.elevation),
    INITIAL_TARGET.z - horiz * Math.cos(VIEW.azimuth),
  );
})();

const TRANSITION_MS = 1200;
const FLIGHT_MS = 1500;

/* ══════════════════════════════════════════════════════════════════════
 * 小工具
 * ══════════════════════════════════════════════════════════════════════ */

function deg2rad(d) {
  return (d * Math.PI) / 180;
}

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function $(id) {
  return document.getElementById(id);
}

function formatNumber(n) {
  if (!Number.isFinite(n)) return '–';
  return n.toLocaleString('en-US');
}

function stringifyMeta(value) {
  if (value === null || value === undefined) return '–';
  if (Array.isArray(value)) return value.map((v) => stringifyMeta(v)).join('、');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  return String(value);
}

/** 方位角/高度角 → 指向太阳的单位向量（+X 东，+Z 北，+Y 上） */
function sunVector(azimuth, elevation, out = new THREE.Vector3()) {
  const ce = Math.cos(elevation);
  return out.set(ce * Math.sin(azimuth), Math.sin(elevation), ce * Math.cos(azimuth));
}

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
 * @param {object} [options] { seed, quality, season, showTrees, wireframe }
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
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = QUALITY_PRESETS[opts.quality].shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.classList.add('campus-canvas');
  dom.appendChild(renderer.domElement);

  /* ── 2. 场景 / 相机 / 控制器 ───────────────────────────────────── */
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(TIME_PRESETS.day.skyBottom);

  const camera = new THREE.PerspectiveCamera(
    50,
    (dom.clientWidth || window.innerWidth) / (dom.clientHeight || window.innerHeight),
    CAMERA_NEAR,
    CAMERA_FAR,
  );
  camera.position.copy(INITIAL_CAMERA_POS);
  camera.lookAt(INITIAL_TARGET);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(INITIAL_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = 1.48;
  controls.minDistance = CAMERA_MIN_DISTANCE;
  controls.maxDistance = CAMERA_MAX_DISTANCE;
  controls.update();

  /* ── 3. 共享上下文 ctx ─────────────────────────────────────────── */
  const pois = createPOIStore();
  const materials = createMaterials(THREE);
  const ctx = {
    THREE,
    mat: materials.get,
    decal: materials.decal,
    /** 楼顶铭牌图集（建筑模块调用，生成贴图并挂到 'signage' 材质） */
    signageAtlas: materials.signageAtlas,
    rng: makeRNG(opts.seed),
    pois,
    layout: CAMPUS,
    options: {
      quality: opts.quality,
      season: opts.season,
      showTrees: opts.showTrees,
      wireframe: !!opts.wireframe,
    },
  };

  /* ── 4. 天空 / 雾 / 灯光 ───────────────────────────────────────── */
  const skyUniforms = {
    topColor: { value: new THREE.Color(TIME_PRESETS.day.skyTop) },
    bottomColor: { value: new THREE.Color(TIME_PRESETS.day.skyBottom) },
    offset: { value: 20 },
    exponent: { value: 0.72 },
  };
  const skyGeo = new THREE.SphereGeometry(SKY_RADIUS, 32, 20);
  const skyMat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        float t = pow(max(h, 0.0), exponent);
        gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
      }
    `,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyMesh.frustumCulled = false;
  skyMesh.renderOrder = -1000;
  scene.add(skyMesh);

  /* ── 4b. 环境贴图（PMREM）────────────────────────────────────────
   * 玻璃（roughness 0.06）与金属（metalness 0.88）没有环境反射时只受
   * 直接光，近景聚焦会整片发黑发灰。本项目零外部素材，故用天空渐变
   * 程序化生成 PMREM cube-UV 环境贴图，只挂在需要反射的材质上。
   *
   * 环境球半径 50 m（远小于天穹半径），渐变形状由方向向量决定，
   * 与天穹的 offset 无交互；下半球取地面色（hemiGround），
   * 使玻璃/金属向下的反射不发蓝。
   */
  const envUniforms = {
    topColor: skyUniforms.topColor,
    bottomColor: skyUniforms.bottomColor,
    exponent: skyUniforms.exponent,
    groundColor: { value: new THREE.Color(TIME_PRESETS.day.hemiGround) },
  };
  const envScene = new THREE.Scene();
  const envDome = new THREE.Mesh(
    new THREE.SphereGeometry(50, 24, 16),
    new THREE.ShaderMaterial({
      uniforms: envUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: /* glsl */ `
        varying vec3 vWorldPosition;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPosition = wp.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 groundColor;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          vec3 dir = normalize(vWorldPosition);
          vec3 sky = mix(bottomColor, topColor, pow(max(dir.y, 0.0), exponent));
          vec3 col = mix(groundColor, sky, smoothstep(-0.12, 0.04, dir.y));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    }),
  );
  envDome.frustumCulled = false;
  envScene.add(envDome);

  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT = null;

  /**
   * 按当前天空状态重新生成环境贴图。
   *
   * 优先走材质库的 setEnvironment（只挂反射材质）。浏览器可能缓存了旧版
   * core/materials.js（ES module 子资源缓存不受普通刷新影响），此时退回到
   * scene.environment：所有 PBR 材质都用同一张环境贴图，玻璃 / 金属仍有反射，
   * 只是非反射材质也会吃到一份环境光，不会因缺 API 而整页初始化失败。
   */
  function refreshEnvironment() {
    const rt = pmrem.fromScene(envScene, 0, 0.1, 200);
    if (envRT) envRT.dispose();
    envRT = rt;
    if (typeof materials.setEnvironment === 'function') {
      materials.setEnvironment(rt.texture);
    } else {
      scene.environment = rt.texture;
    }
  }

  scene.fog = new THREE.FogExp2(TIME_PRESETS.day.fogColor, TIME_PRESETS.day.fogDensity);

  const sunLight = new THREE.DirectionalLight(TIME_PRESETS.day.sunColor, TIME_PRESETS.day.sunIntensity);
  sunLight.castShadow = QUALITY_PRESETS[opts.quality].shadows;
  sunLight.shadow.mapSize.set(QUALITY_PRESETS[opts.quality].shadowMap, QUALITY_PRESETS[opts.quality].shadowMap);
  // 正交阴影相机：半幅覆盖整园（含地面外扩与最高建筑投影余量）
  sunLight.shadow.camera.left = -SHADOW.half;
  sunLight.shadow.camera.right = SHADOW.half;
  sunLight.shadow.camera.top = SHADOW.half;
  sunLight.shadow.camera.bottom = -SHADOW.half;
  sunLight.shadow.camera.near = SHADOW.near;
  sunLight.shadow.camera.far = SHADOW.far;
  sunLight.shadow.bias = SHADOW_BIAS;
  sunLight.shadow.normalBias = 0.8;
  sunLight.target.position.copy(SITE.center);
  scene.add(sunLight, sunLight.target);

  /** 阴影焦点：远景锁场地中心，近景跟随 controls.target */
  const shadowFocus = new THREE.Vector3(SITE.cx, 0, SITE.cz);
  /** 当前太阳方向（单位向量），随昼夜预设插值 */
  const sunDir = new THREE.Vector3();

  /** 太阳灯始终沿 sunDir 指向 shadowFocus，焦点移动不改变光照方向 */
  function placeSun() {
    sunLight.target.position.copy(shadowFocus);
    sunLight.position.copy(shadowFocus).addScaledVector(sunDir, SHADOW.lightDistance);
  }

  const hemiLight = new THREE.HemisphereLight(
    TIME_PRESETS.day.hemiSky,
    TIME_PRESETS.day.hemiGround,
    TIME_PRESETS.day.hemiIntensity,
  );
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(
    TIME_PRESETS.day.ambientColor,
    TIME_PRESETS.day.ambientIntensity,
  );
  scene.add(ambientLight);

  const nightLights = NIGHT_LIGHT_SITES.map((site) => {
    const light = new THREE.PointLight(0xffd7a0, 0, 90, 2);
    light.position.set(site.pos[0], site.pos[1], site.pos[2]);
    light.visible = false;
    light.userData.baseIntensity = site.intensity;
    scene.add(light);
    return light;
  });

  /**
   * 把夜间点光源移到实际路灯的灯头位置，
   * 使地面上的暖色光池与可见路灯一一对应。
   */
  function alignNightLights(positions) {
    if (!positions || !positions.length) return;
    const n = Math.min(nightLights.length, positions.length);
    for (let i = 0; i < n; i += 1) {
      const p = positions[i];
      nightLights[i].position.set(p[0], p[1], p[2]);
    }
  }

  /* ── 5. 昼夜状态与平滑插值 ─────────────────────────────────────── */
  const skyState = {
    sunAzimuth: TIME_PRESETS.day.sunAzimuth,
    sunElevation: TIME_PRESETS.day.sunElevation,
    sunColor: new THREE.Color(TIME_PRESETS.day.sunColor),
    sunIntensity: TIME_PRESETS.day.sunIntensity,
    hemiSky: new THREE.Color(TIME_PRESETS.day.hemiSky),
    hemiGround: new THREE.Color(TIME_PRESETS.day.hemiGround),
    hemiIntensity: TIME_PRESETS.day.hemiIntensity,
    skyTop: new THREE.Color(TIME_PRESETS.day.skyTop),
    skyBottom: new THREE.Color(TIME_PRESETS.day.skyBottom),
    fogColor: new THREE.Color(TIME_PRESETS.day.fogColor),
    fogDensity: TIME_PRESETS.day.fogDensity,
    ambientColor: new THREE.Color(TIME_PRESETS.day.ambientColor),
    ambientIntensity: TIME_PRESETS.day.ambientIntensity,
    exposure: TIME_PRESETS.day.exposure,
    nightFactor: TIME_PRESETS.day.nightFactor,
  };

  let transition = null; // { from, to, start }

  function applySkyState(s) {
    sunVector(s.sunAzimuth, s.sunElevation, sunDir);
    placeSun();
    sunLight.color.copy(s.sunColor);
    sunLight.intensity = s.sunIntensity;

    hemiLight.color.copy(s.hemiSky);
    hemiLight.groundColor.copy(s.hemiGround);
    hemiLight.intensity = s.hemiIntensity;

    ambientLight.color.copy(s.ambientColor);
    ambientLight.intensity = s.ambientIntensity;

    skyUniforms.topColor.value.copy(s.skyTop);
    skyUniforms.bottomColor.value.copy(s.skyBottom);
    scene.background.copy(s.skyBottom);
    envUniforms.groundColor.value.copy(s.hemiGround);

    scene.fog.color.copy(s.fogColor);
    scene.fog.density = s.fogDensity;

    renderer.toneMappingExposure = s.exposure;

    applyNightGlow(s.nightFactor);
  }

  /** 夜间窗户自发光 + 点光源 */
  function applyNightGlow(factor) {
    const warm = new THREE.Color(0xffd39a);
    // 遍历全部材质（含贴地变体），按材质名取自发光强度
    for (const [key, m] of materials.all()) {
      const base = key.split('#')[0];
      const gain = NIGHT_EMISSIVE_MATERIALS[base];
      if (gain === undefined) continue;
      if (!m || !('emissive' in m)) continue;
      m.emissive.copy(warm);
      m.emissiveIntensity = gain * factor;
    }
    for (const light of nightLights) {
      light.visible = factor > 0.02;
      light.intensity = light.userData.baseIntensity * factor;
    }
  }

  function snapshotState(s) {
    return {
      sunAzimuth: s.sunAzimuth,
      sunElevation: s.sunElevation,
      sunColor: s.sunColor.clone(),
      sunIntensity: s.sunIntensity,
      hemiSky: s.hemiSky.clone(),
      hemiGround: s.hemiGround.clone(),
      hemiIntensity: s.hemiIntensity,
      skyTop: s.skyTop.clone(),
      skyBottom: s.skyBottom.clone(),
      fogColor: s.fogColor.clone(),
      fogDensity: s.fogDensity,
      ambientColor: s.ambientColor.clone(),
      ambientIntensity: s.ambientIntensity,
      exposure: s.exposure,
      nightFactor: s.nightFactor,
    };
  }

  function lerpState(from, to, t) {
    skyState.sunAzimuth = lerp(from.sunAzimuth, to.sunAzimuth, t);
    skyState.sunElevation = lerp(from.sunElevation, to.sunElevation, t);
    skyState.sunColor.lerpColors(from.sunColor, to.sunColor, t);
    skyState.sunIntensity = lerp(from.sunIntensity, to.sunIntensity, t);
    skyState.hemiSky.lerpColors(from.hemiSky, to.hemiSky, t);
    skyState.hemiGround.lerpColors(from.hemiGround, to.hemiGround, t);
    skyState.hemiIntensity = lerp(from.hemiIntensity, to.hemiIntensity, t);
    skyState.skyTop.lerpColors(from.skyTop, to.skyTop, t);
    skyState.skyBottom.lerpColors(from.skyBottom, to.skyBottom, t);
    skyState.fogColor.lerpColors(from.fogColor, to.fogColor, t);
    skyState.fogDensity = lerp(from.fogDensity, to.fogDensity, t);
    skyState.ambientColor.lerpColors(from.ambientColor, to.ambientColor, t);
    skyState.ambientIntensity = lerp(from.ambientIntensity, to.ambientIntensity, t);
    skyState.exposure = lerp(from.exposure, to.exposure, t);
    skyState.nightFactor = lerp(from.nightFactor, to.nightFactor, t);
  }

  /** 切换昼夜预设，1.2 秒平滑插值 */
  function setTimePreset(name, immediate = false) {
    const preset = TIME_PRESETS[name];
    if (!preset) return;
    const to = {
      sunAzimuth: preset.sunAzimuth,
      sunElevation: preset.sunElevation,
      sunColor: new THREE.Color(preset.sunColor),
      sunIntensity: preset.sunIntensity,
      hemiSky: new THREE.Color(preset.hemiSky),
      hemiGround: new THREE.Color(preset.hemiGround),
      hemiIntensity: preset.hemiIntensity,
      skyTop: new THREE.Color(preset.skyTop),
      skyBottom: new THREE.Color(preset.skyBottom),
      fogColor: new THREE.Color(preset.fogColor),
      fogDensity: preset.fogDensity,
      ambientColor: new THREE.Color(preset.ambientColor),
      ambientIntensity: preset.ambientIntensity,
      exposure: preset.exposure,
      nightFactor: preset.nightFactor,
    };
    state.timePreset = name;
    syncTimeButtons();
    if (immediate) {
      lerpState(skyState, to, 1);
      applySkyState(skyState);
      refreshEnvironment();
      transition = null;
      return;
    }
    transition = { from: snapshotState(skyState), to, start: performance.now(), duration: TRANSITION_MS };
  }

  function updateTransition(now) {
    if (!transition) return;
    const raw = clamp((now - transition.start) / transition.duration, 0, 1);
    const t = easeInOutQuad(raw);
    lerpState(transition.from, transition.to, t);
    applySkyState(skyState);
    if (raw >= 1) {
      transition = null;
      refreshEnvironment();
    }
  }

  applySkyState(skyState);
  refreshEnvironment();

  /* ── 6. 拾取索引（POI ↔ 场景对象） ────────────────────────────── */
  /** @type {Map<string, {poi:Object, meshes:Set<THREE.Object>}>} */
  const pickIndex = new Map();
  /** @type {Map<string, Set<THREE.Object>>} category → objects */
  const categoryIndex = new Map();
  /** @type {Array<{category:string, mesh:THREE.Object}>} 楼顶铭牌（按 POI 分类合并） */
  let signageMeshes = [];

  const _box = new THREE.Box3();
  const _size = new THREE.Vector3();
  const _center = new THREE.Vector3();

  function poiBox(poi, target = new THREE.Box3()) {
    if (poi.bbox && Array.isArray(poi.bbox.min) && Array.isArray(poi.bbox.max)) {
      return target.set(
        new THREE.Vector3(poi.bbox.min[0], poi.bbox.min[1], poi.bbox.min[2]),
        new THREE.Vector3(poi.bbox.max[0], poi.bbox.max[1], poi.bbox.max[2]),
      );
    }
    // 无 bbox 时用锚点构造一个小包围盒，保证仍可拾取
    const p = poi.position || [0, 0, 0];
    const r = poi.type === 'building' ? 18 : 8;
    return target.set(
      new THREE.Vector3(p[0] - r, p[1] - 1, p[2] - r),
      new THREE.Vector3(p[0] + r, p[1] + (poi.type === 'building' ? 24 : 14), p[2] + r),
    );
  }

  /**
   * 重建「POI → 场景对象」索引。
   * 优先使用对象上的 userData.poiId 显式绑定；否则用包围盒包含关系推断；
   * InstancedMesh 按实例落点归属比例推断（避免整片树冠误判到某栋楼）。
   */
  function rebuildPickIndex() {
    pickIndex.clear();
    categoryIndex.clear();

    const list = pois.list();
    if (!list.length) return;

    const meshes = [];
    scene.updateMatrixWorld(true);
    scene.traverse((obj) => {
      if (obj.isMesh || obj.isInstancedMesh) meshes.push(obj);
    });

    for (const poi of list) {
      pickIndex.set(poi.id, { poi, meshes: new Set() });
    }

    // 显式绑定优先
    for (const obj of meshes) {
      const explicit = obj.userData && (obj.userData.poiId || obj.userData.__poiId);
      if (!explicit) continue;
      const entry = pickIndex.get(explicit);
      if (entry) entry.meshes.add(obj);
    }

    // 包围盒推断
    const boxes = new Map();
    const instancePoints = new Map();
    for (const obj of meshes) {
      if (obj.userData && (obj.userData.poiId || obj.userData.__poiId)) continue;
      if (obj.isInstancedMesh) {
        instancePoints.set(obj, instanceTranslations(obj));
        continue;
      }
      const box = new THREE.Box3().setFromObject(obj);
      if (box.isEmpty()) continue;
      boxes.set(obj, box);
    }

    for (const poi of list) {
      const entry = pickIndex.get(poi.id);
      if (!entry) continue;
      const pbox = poiBox(poi);
      pbox.getSize(_size);
      const pvol = Math.max(1e-3, _size.x * _size.y * _size.z);

      for (const [obj, box] of boxes) {
        box.getCenter(_center);
        box.getSize(_size);
        if (_size.y < 1.0 && _size.x > 80) continue; // 地面/大平面
        if (_size.x * _size.y * _size.z > 3e5) continue; // 超大块
        if (!pbox.containsPoint(_center)) continue;
        const ratio = (_size.x * _size.y * _size.z) / pvol;
        if (ratio > 4) continue;
        entry.meshes.add(obj);
      }

      const points = [];
      for (const [obj, pts] of instancePoints) {
        if (!pts.length) continue;
        let inside = 0;
        for (const p of pts) {
          if (pbox.containsPoint(p)) inside += 1;
        }
        if (inside / pts.length >= 0.5 && inside > 0) entry.meshes.add(obj);
      }
    }

    // 分类索引
    for (const [id, entry] of pickIndex) {
      const cat = entry.poi.category || '其他';
      if (!categoryIndex.has(cat)) categoryIndex.set(cat, new Set());
      const set = categoryIndex.get(cat);
      for (const obj of entry.meshes) set.add(obj);
    }
  }

  function instanceTranslations(inst) {
    const out = [];
    const m = new THREE.Matrix4();
    const v = new THREE.Vector3();
    for (let i = 0; i < inst.count; i += 1) {
      inst.getMatrixAt(i, m);
      v.setFromMatrixPosition(m);
      out.push(v.clone());
    }
    return out;
  }

  function meshesOf(poiId) {
    const entry = pickIndex.get(poiId);
    return entry ? Array.from(entry.meshes) : [];
  }

  /* ── 7. 选中与高亮 ────────────────────────────────────────────── */
  const highlightBox = new THREE.Box3Helper(new THREE.Box3(), 0x4fd1ff);
  highlightBox.visible = false;
  highlightBox.material.depthTest = false;
  highlightBox.material.transparent = true;
  highlightBox.renderOrder = 999;
  scene.add(highlightBox);

  const markerMat = new THREE.MeshBasicMaterial({
    color: 0x4fd1ff,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const marker = new THREE.Mesh(new THREE.RingGeometry(4.2, 6.2, 48), markerMat);
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  marker.renderOrder = 998;
  scene.add(marker);

  let selectedId = null;

  function setEmissiveHighlight(targets, on) {
    for (const obj of targets) {
      const state = obj.userData && obj.userData.__hl;
      if (on) {
        if (state) continue;
        const src = obj.material;
        if (!src || !('emissive' in src)) continue;
        const clone = src.clone();
        clone.emissive.setHex(0x1f6fff);
        clone.emissiveIntensity = 0.5;
        obj.material = clone;
        obj.userData.__hl = { original: src, clone };
      } else if (state) {
        obj.material = state.original;
        state.clone.dispose();
        delete obj.userData.__hl;
      }
    }
  }

  function selectPOI(poi, { fly = true } = {}) {
    if (selectedId && selectedId !== poi.id) {
      setEmissiveHighlight(meshesOf(selectedId), false);
    }
    selectedId = poi.id;
    const box = poiBox(poi);
    highlightBox.box.copy(box);
    highlightBox.box.getCenter(_center);
    highlightBox.position.copy(_center);
    highlightBox.updateMatrixWorld(true);
    highlightBox.visible = true;

    const pos = poi.position || [box.min.x, 0, box.min.z];
    marker.position.set(pos[0], (poi.bbox ? box.min.y : 0) + 0.35, pos[2]);
    marker.visible = true;

    setEmissiveHighlight(meshesOf(poi.id), true);

    renderInfo(poi);
    highlightListItem(poi.id);
    if (fly) flyToPOI(poi);
  }

  function clearSelection() {
    if (selectedId) setEmissiveHighlight(meshesOf(selectedId), false);
    selectedId = null;
    highlightBox.visible = false;
    marker.visible = false;
    renderInfo(null);
    highlightListItem(null);
  }

  /* ── 8. 相机飞行 ──────────────────────────────────────────────── */
  let flight = null;

  function flyToPOI(poi) {
    const pos = poi.position || [0, 0, 0];
    const anchor = new THREE.Vector3(pos[0], pos[1] || 0, pos[2]);
    const box = poiBox(poi);
    box.getSize(_size);
    const radius = Math.max(12, Math.max(_size.x, _size.z, _size.y) * 0.6);

    const dir = new THREE.Vector3().subVectors(camera.position, anchor);
    dir.y = 0;
    if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);
    dir.normalize();

    const dist = clamp(radius * 2.8, 60, 210);
    const endPos = anchor
      .clone()
      .add(new THREE.Vector3(dir.x * dist, radius * 1.05 + 18, dir.z * dist));
    const endTarget = anchor.clone();

    flight = {
      startPos: camera.position.clone(),
      startTarget: controls.target.clone(),
      endPos,
      endTarget,
      start: performance.now(),
      duration: FLIGHT_MS,
      arc: Math.max(35, dist * 0.42),
    };
    controls.enabled = false;
  }

  function updateFlight(now) {
    if (!flight) return;
    const raw = clamp((now - flight.start) / flight.duration, 0, 1);
    const t = easeInOutCubic(raw);
    camera.position.lerpVectors(flight.startPos, flight.endPos, t);
    camera.position.y += Math.sin(Math.PI * raw) * flight.arc;
    controls.target.lerpVectors(flight.startTarget, flight.endTarget, t);
    if (raw >= 1) {
      flight = null;
      controls.enabled = true;
    }
  }

  /**
   * 回到默认机位。与 INITIAL_CAMERA_POS / INITIAL_TARGET 严格一致，
   * 键盘 R 或外部调用 window.campusApp.resetView() 均可。
   */
  function resetView() {
    flight = null;
    controls.enabled = true;
    camera.position.copy(INITIAL_CAMERA_POS);
    controls.target.copy(INITIAL_TARGET);
    camera.lookAt(INITIAL_TARGET);
    controls.update();
    toast('已回到默认视角');
  }

  /* ── 9. 拾取 ──────────────────────────────────────────────────── */
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const _hitPoint = new THREE.Vector3();

  function pickPOI(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    // 粗筛：POI 包围盒
    const candidates = [];
    for (const poi of pois.list()) {
      const box = poiBox(poi);
      if (raycaster.ray.intersectBox(box, _hitPoint)) candidates.push(poi);
    }
    if (!candidates.length) return null;

    // 精确求交
    const targets = [];
    for (const poi of candidates) {
      for (const m of meshesOf(poi.id)) targets.push(m);
    }
    if (targets.length) {
      const hits = raycaster.intersectObjects(targets, false);
      if (hits.length) {
        const obj = hits[0].object;
        const explicit = obj.userData && (obj.userData.poiId || obj.userData.__poiId);
        if (explicit && pois.get(explicit)) return pois.get(explicit);
        for (const poi of candidates) {
          if (meshesOf(poi.id).includes(obj)) return poi;
        }
      }
    }

    // 兜底：取命中点最近的候选
    let best = null;
    let bestDist = Infinity;
    for (const poi of candidates) {
      const box = poiBox(poi);
      if (!raycaster.ray.intersectBox(box, _hitPoint)) continue;
      const d = _hitPoint.distanceToSquared(camera.position);
      if (d < bestDist) {
        bestDist = d;
        best = poi;
      }
    }
    return best;
  }

  /* ── 10. 区域剖切 ─────────────────────────────────────────────── */
  let clipMode = 'all';

  function applyClip(mode) {
    clipMode = mode;
    const cfg = CLIP_MODES[mode] || CLIP_MODES.all;
    for (const [cat, objects] of categoryIndex) {
      let visible = true;
      if (cfg.only) visible = cfg.only.includes(cat);
      else if (cfg.hide.length) visible = !cfg.hide.includes(cat);
      for (const obj of objects) obj.visible = visible;
    }
    // 植被整体可见性由 showTrees 控制，不受剖切影响
    if (vegetationGroup) vegetationGroup.visible = ctx.options.showTrees;
    // 楼顶铭牌按所属建筑的 POI 分类随剖切显隐（不注册 POI，故单独处理）
    for (const { category, mesh } of signageMeshes) {
      let visible = true;
      if (cfg.only) visible = cfg.only.includes(category);
      else if (cfg.hide.length) visible = !cfg.hide.includes(category);
      mesh.visible = visible;
    }
    syncClipButtons();
    refreshPoiList();
  }

  /* ── 11. 季节 / 画质 / 线框 ───────────────────────────────────── */
  let vegetationGroup = null;
  let vegetationResult = null;

  function setSeason(season) {
    ctx.options.season = season;
    if (vegetationResult && typeof vegetationResult.setSeason === 'function') {
      try {
        vegetationResult.setSeason(season);
      } catch (err) {
        console.error('[app] 植被季节切换失败：', err);
        toast('植被季节切换失败，详见控制台');
      }
    }
    syncSeasonButtons();
    toast(`季节：${(SEASONS.find((s) => s.id === season) || {}).label || season}`);
  }

  function setQuality(quality) {
    const cfg = QUALITY_PRESETS[quality];
    if (!cfg) return;
    ctx.options.quality = quality;
    renderer.shadowMap.enabled = cfg.shadows;
    sunLight.castShadow = cfg.shadows;
    sunLight.shadow.mapSize.set(cfg.shadowMap, cfg.shadowMap);
    if (sunLight.shadow.map) {
      sunLight.shadow.map.dispose();
      sunLight.shadow.map = null;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cfg.pixelRatio, 2));
    resize();

    // 植被重建（若模块提供重建接口）
    const rebuild =
      vegetationResult &&
      (typeof vegetationResult.rebuild === 'function'
        ? vegetationResult.rebuild
        : typeof vegetationResult.setQuality === 'function'
        ? vegetationResult.setQuality
        : null);
    if (rebuild) {
      try {
        const res = rebuild.call(vegetationResult, quality, ctx);
        if (res && res.group) {
          if (vegetationGroup) {
            scene.remove(vegetationGroup);
            disposeGroupGeometry(vegetationGroup, res.group);
          }
          vegetationGroup = res.group;
          scene.add(vegetationGroup);
          vegetationGroup.visible = ctx.options.showTrees;
        }
        rebuildPickIndex();
        toast(`画质：${cfg.label}（植被已重建）`);
      } catch (err) {
        console.error('[app] 植被重建失败：', err);
        toast('植被重建失败，详见控制台');
      }
    } else {
      toast(`画质：${cfg.label}（仅影响阴影与像素比）`);
    }
    syncQualityButtons();
  }

  /**
   * 释放被替换掉的分组所占用的几何体。
   * 材质不释放：植被材质来自统一材质库，跨分组共享。
   * keep 中的几何体不释放，避免误伤新分组仍在使用的实例。
   */
  function disposeGroupGeometry(group, keep) {
    if (!group) return;
    const keepSet = new Set();
    if (keep) keep.traverse((o) => { if (o.geometry) keepSet.add(o.geometry); });
    group.traverse((o) => {
      if (o.geometry && !keepSet.has(o.geometry)) o.geometry.dispose();
    });
  }

  function setWireframe(on) {
    ctx.options.wireframe = on;
    for (const mat of materials.all().values()) {
      if (mat && 'wireframe' in mat) mat.wireframe = on;
    }
    const chk = $('chk-wireframe');
    if (chk) chk.checked = on;
  }

  /* ── 12. 导出清单 ─────────────────────────────────────────────── */
  function exportManifest() {
    const data = pois.toJSON();
    const manifest = {
      version: (CAMPUS.meta && CAMPUS.meta.version) || data.version || '1.0',
      generatedAt: new Date().toISOString(),
      items: Array.isArray(data.items) ? data.items : [],
    };
    return manifest;
  }

  function downloadManifest() {
    const manifest = exportManifest();
    const json = JSON.stringify(manifest, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifest.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    const hint = $('export-hint');
    if (hint) {
      hint.textContent = `已导出 ${manifest.items.length} 条 POI，生成时间 ${manifest.generatedAt}`;
    }
    toast(`清单已导出：${manifest.items.length} 条 POI`);
    return manifest;
  }

  /* ── 13. 左侧 POI 面板 ────────────────────────────────────────── */
  const state = {
    timePreset: 'day',
    search: '',
    category: 'all',
    collapsed: new Set(),
  };

  function matchesFilter(poi) {
    if (state.category !== 'all' && poi.category !== state.category) return false;
    const q = state.search.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      poi.name || '',
      poi.id || '',
      poi.summary || '',
      (poi.tags || []).join(' '),
      poi.category || '',
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  }

  function categoryOrder(cat) {
    const i = Array.isArray(POI_CATEGORIES) ? POI_CATEGORIES.indexOf(cat) : -1;
    return i < 0 ? 999 : i;
  }

  function renderCategoryChips() {
    const box = $('poi-categories');
    if (!box) return;
    const cats = Array.from(new Set(pois.list().map((p) => p.category).filter(Boolean)));
    cats.sort((a, b) => categoryOrder(a) - categoryOrder(b));
    box.textContent = '';
    const all = document.createElement('button');
    all.type = 'button';
    all.className = 'chip' + (state.category === 'all' ? ' is-active' : '');
    all.textContent = '全部';
    all.addEventListener('click', () => {
      state.category = 'all';
      renderCategoryChips();
      refreshPoiList();
    });
    box.appendChild(all);
    for (const cat of cats) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (state.category === cat ? ' is-active' : '');
      chip.textContent = cat;
      chip.addEventListener('click', () => {
        state.category = state.category === cat ? 'all' : cat;
        renderCategoryChips();
        refreshPoiList();
      });
      box.appendChild(chip);
    }
  }

  function refreshPoiList() {
    const list = $('poi-list');
    if (!list) return;
    const all = pois.list();
    const countEl = $('poi-count');
    if (countEl) countEl.textContent = String(all.length);

    const groups = new Map();
    for (const poi of all) {
      if (!matchesFilter(poi)) continue;
      const cat = poi.category || '其他';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(poi);
    }
    const cats = Array.from(groups.keys()).sort((a, b) => categoryOrder(a) - categoryOrder(b));

    list.textContent = '';
    if (!cats.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-hint';
      empty.textContent = all.length ? '没有匹配的 POI' : '暂无 POI 数据';
      list.appendChild(empty);
      return;
    }

    for (const cat of cats) {
      const details = document.createElement('details');
      details.className = 'poi-group';
      details.open = !state.collapsed.has(cat);
      details.addEventListener('toggle', () => {
        if (details.open) state.collapsed.delete(cat);
        else state.collapsed.add(cat);
      });

      const summary = document.createElement('summary');
      summary.className = 'poi-group-head';
      summary.textContent = `${cat}（${groups.get(cat).length}）`;
      details.appendChild(summary);

      for (const poi of groups.get(cat)) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'poi-item';
        item.dataset.poiId = poi.id;
        if (poi.id === selectedId) item.classList.add('is-selected');

        const name = document.createElement('span');
        name.className = 'poi-item-name';
        name.textContent = poi.name || poi.id;

        const tag = document.createElement('span');
        tag.className = 'poi-item-type';
        tag.textContent = poi.type || '';

        const desc = document.createElement('span');
        desc.className = 'poi-item-desc';
        desc.textContent = poi.summary || '';

        item.appendChild(name);
        item.appendChild(tag);
        item.appendChild(desc);
        item.addEventListener('click', () => {
          const target = pois.get(poi.id);
          if (target) selectPOI(target);
        });
        details.appendChild(item);
      }
      list.appendChild(details);
    }
  }

  function highlightListItem(id) {
    const list = $('poi-list');
    if (!list) return;
    for (const node of list.querySelectorAll('.poi-item')) {
      node.classList.toggle('is-selected', node.dataset.poiId === id);
    }
  }

  /* ── 14. 右侧信息面板 ─────────────────────────────────────────── */
  function renderInfo(poi) {
    const box = $('poi-info');
    if (!box) return;
    box.textContent = '';
    if (!poi) {
      const p = document.createElement('p');
      p.className = 'empty-hint';
      p.textContent = '在场景中点击建筑或地标，或从左侧列表选择。';
      box.appendChild(p);
      return;
    }

    const h = document.createElement('h3');
    h.className = 'info-name';
    h.textContent = poi.name || poi.id;
    box.appendChild(h);

    const badges = document.createElement('div');
    badges.className = 'info-badges';
    const b1 = document.createElement('span');
    b1.className = 'badge badge-cat';
    b1.textContent = poi.category || '未分类';
    badges.appendChild(b1);
    const b2 = document.createElement('span');
    b2.className = 'badge';
    b2.textContent = poi.type || '-';
    badges.appendChild(b2);
    box.appendChild(badges);

    if (poi.summary) {
      const s = document.createElement('p');
      s.className = 'info-summary';
      s.textContent = poi.summary;
      box.appendChild(s);
    }

    if (Array.isArray(poi.tags) && poi.tags.length) {
      const tagRow = document.createElement('div');
      tagRow.className = 'info-tags';
      for (const t of poi.tags) {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = t;
        tagRow.appendChild(tag);
      }
      box.appendChild(tagRow);
    }

    const meta = poi.meta && typeof poi.meta === 'object' ? poi.meta : null;
    if (meta && Object.keys(meta).length) {
      const table = document.createElement('dl');
      table.className = 'info-meta';
      for (const key of Object.keys(meta)) {
        const dt = document.createElement('dt');
        dt.textContent = key;
        const dd = document.createElement('dd');
        dd.textContent = stringifyMeta(meta[key]);
        table.appendChild(dt);
        table.appendChild(dd);
      }
      box.appendChild(table);
    }

    const pos = document.createElement('p');
    pos.className = 'info-pos';
    const p = poi.position || [0, 0, 0];
    pos.textContent = `坐标 (${Number(p[0]).toFixed(1)}, ${Number(p[1] || 0).toFixed(1)}, ${Number(p[2]).toFixed(1)})`;
    box.appendChild(pos);

    const actions = document.createElement('div');
    actions.className = 'info-actions';
    const focusBtn = document.createElement('button');
    focusBtn.type = 'button';
    focusBtn.className = 'ghost-btn small';
    focusBtn.textContent = '聚焦 (F)';
    focusBtn.addEventListener('click', () => flyToPOI(poi));
    actions.appendChild(focusBtn);
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'ghost-btn small';
    clearBtn.textContent = '取消选中 (Esc)';
    clearBtn.addEventListener('click', () => clearSelection());
    actions.appendChild(clearBtn);
    box.appendChild(actions);
  }

  /* ── 15. 提示条 ───────────────────────────────────────────────── */
  let toastTimer = 0;
  function toast(message) {
    const el = $('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2600);
  }

  /* ── 16. 按钮同步 ─────────────────────────────────────────────── */
  function syncTimeButtons() {
    const box = $('time-presets');
    if (!box) return;
    for (const btn of box.querySelectorAll('[data-time]')) {
      btn.classList.toggle('is-active', btn.dataset.time === state.timePreset);
    }
  }
  function syncSeasonButtons() {
    const box = $('season-presets');
    if (!box) return;
    for (const btn of box.querySelectorAll('[data-season]')) {
      btn.classList.toggle('is-active', btn.dataset.season === ctx.options.season);
    }
  }
  function syncQualityButtons() {
    const box = $('quality-presets');
    if (!box) return;
    for (const btn of box.querySelectorAll('[data-quality]')) {
      btn.classList.toggle('is-active', btn.dataset.quality === ctx.options.quality);
    }
  }
  function syncClipButtons() {
    const box = $('clip-presets');
    if (!box) return;
    for (const btn of box.querySelectorAll('[data-clip]')) {
      btn.classList.toggle('is-active', btn.dataset.clip === clipMode);
    }
  }

  /* ── 17. HUD ──────────────────────────────────────────────────── */
  const hud = {
    fps: $('hud-fps'),
    draw: $('hud-draw'),
    tris: $('hud-tris'),
    objects: $('hud-objects'),
    poi: $('hud-poi'),
  };
  let frameTimes = [];
  let lastHudUpdate = 0;
  let sceneObjectCount = 0;

  function updateHud(now) {
    if (now - lastHudUpdate < 220) return;
    lastHudUpdate = now;

    const nowSec = now / 1000;
    frameTimes = frameTimes.filter((t) => nowSec - t < 1.0);
    const fps = frameTimes.length;
    frameTimes.push(nowSec);

    if (hud.fps) hud.fps.textContent = String(fps);
    if (hud.draw) hud.draw.textContent = formatNumber(renderer.info.render.calls);
    if (hud.tris) hud.tris.textContent = formatNumber(renderer.info.render.triangles);
    if (hud.objects) hud.objects.textContent = formatNumber(sceneObjectCount);
    if (hud.poi) hud.poi.textContent = formatNumber(pois.size());
  }

  function countSceneObjects() {
    let n = 0;
    scene.traverse(() => {
      n += 1;
    });
    sceneObjectCount = n;
  }

  /* ── 18. 事件绑定 ─────────────────────────────────────────────── */
  let pointerDown = null;

  renderer.domElement.addEventListener('pointerdown', (e) => {
    pointerDown = { x: e.clientX, y: e.clientY, t: performance.now() };
  });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!pointerDown) return;
    const moved = Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y);
    const dt = performance.now() - pointerDown.t;
    pointerDown = null;
    if (moved > 5 || dt > 600) return; // 拖拽/长按不触发拾取
    const poi = pickPOI(e.clientX, e.clientY);
    if (poi) selectPOI(poi, { fly: false });
    else clearSelection();
  });

  window.addEventListener('resize', resize);

  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      if (e.key === 'Escape') e.target.blur();
      return;
    }
    switch (e.key) {
      case '1':
        setTimePreset('day');
        break;
      case '2':
        setTimePreset('dusk');
        break;
      case '3':
        setTimePreset('night');
        break;
      case 'w':
      case 'W':
        setWireframe(!ctx.options.wireframe);
        toast(`线框：${ctx.options.wireframe ? '开' : '关'}`);
        break;
      case 'f':
      case 'F': {
        const poi = selectedId ? pois.get(selectedId) : null;
        if (poi) flyToPOI(poi);
        else toast('尚未选中 POI');
        break;
      }
      case 'r':
      case 'R':
        resetView();
        break;
      case 'Escape':
        clearSelection();
        break;
      default:
        break;
    }
  });

  // 控制面板按钮
  const bindGroup = (containerId, attr, handler) => {
    const box = $(containerId);
    if (!box) return;
    box.addEventListener('click', (e) => {
      const btn = e.target.closest(`[data-${attr}]`);
      if (!btn) return;
      handler(btn.dataset[attr]);
    });
  };
  bindGroup('time-presets', 'time', (v) => setTimePreset(v));
  bindGroup('season-presets', 'season', (v) => setSeason(v));
  bindGroup('quality-presets', 'quality', (v) => setQuality(v));
  bindGroup('clip-presets', 'clip', (v) => applyClip(v));

  const searchInput = $('poi-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.search = e.target.value || '';
      refreshPoiList();
    });
  }

  const treeToggle = $('chk-trees');
  if (treeToggle) {
    treeToggle.checked = ctx.options.showTrees;
    treeToggle.addEventListener('change', (e) => {
      ctx.options.showTrees = e.target.checked;
      if (vegetationGroup) vegetationGroup.visible = ctx.options.showTrees;
    });
  }

  const wireToggle = $('chk-wireframe');
  if (wireToggle) {
    wireToggle.checked = ctx.options.wireframe;
    wireToggle.addEventListener('change', (e) => setWireframe(e.target.checked));
  }

  const exportBtn = $('btn-export');
  if (exportBtn) exportBtn.addEventListener('click', () => downloadManifest());

  // 窄屏面板开合
  const togglePoi = $('btn-toggle-poi');
  if (togglePoi) {
    togglePoi.addEventListener('click', () => {
      const panel = $('poi-panel');
      if (panel) panel.classList.toggle('is-open');
    });
  }
  const toggleSide = $('btn-toggle-side');
  if (toggleSide) {
    toggleSide.addEventListener('click', () => {
      const panel = $('side-panel');
      if (panel) panel.classList.toggle('is-open');
    });
  }

  function resize() {
    const w = dom.clientWidth || window.innerWidth;
    const h = dom.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // updateStyle 必须为 true：只改缓冲区尺寸会让画布保留旧的 CSS 尺寸，
    // 窗口缩放后画面被压缩在左上角。
    renderer.setSize(w, h);
  }

  /* ── 19. 渲染循环 ─────────────────────────────────────────────── */
  let frameId = 0;
  let running = false;

  /**
   * 阴影相机分级（每帧）。
   * 远景（视距 > farRange）：正交相机固定覆盖整园，半幅 SHADOW.half —— 不漏边、不跳变。
   * 近景（视距 < nearRange）：半幅收到视距的 0.85 倍并跟随 controls.target，
   *   阴影贴图单位面积精度提升约 10 倍，贴脸看楼不糊。
   * 中间区间线性插值，避免远近切换时阴影跳变。
   */
  function updateShadowFrustum() {
    const dist = camera.position.distanceTo(controls.target);
    const k = 1 - clamp((dist - SHADOW.nearRange) / (SHADOW.farRange - SHADOW.nearRange), 0, 1);
    const nearHalf = clamp(dist * 0.85, SITE.span * 0.05, SHADOW.half);
    const half = lerp(SHADOW.half, nearHalf, k);
    shadowFocus.lerpVectors(SITE.center, controls.target, k);
    const cam = sunLight.shadow.camera;
    cam.left = -half;
    cam.right = half;
    cam.top = half;
    cam.bottom = -half;
    cam.updateProjectionMatrix();
    placeSun();
  }

  function tick() {
    frameId = requestAnimationFrame(tick);
    const now = performance.now();
    updateTransition(now);
    updateFlight(now);
    if (marker.visible) {
      const s = 1 + Math.sin(now / 420) * 0.12;
      marker.scale.set(s, s, 1);
      markerMat.opacity = 0.65 + Math.sin(now / 420) * 0.22;
    }
    controls.update();
    updateShadowFrustum();
    renderer.render(scene, camera);
    countSceneObjects();
    updateHud(now);
  }

  function start() {
    if (running) return;
    running = true;
    frameId = requestAnimationFrame(tick);
  }

  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(frameId);
  }

  /** 释放渲染相关资源（环境贴图 / 材质 / 渲染器） */
  function dispose() {
    stop();
    if (envRT) { envRT.dispose(); envRT = null; }
    pmrem.dispose();
    envDome.geometry.dispose();
    envDome.material.dispose();
    materials.dispose();
    renderer.dispose();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (running) start();
  });

  /* ── 20. 场景装配（容错） ─────────────────────────────────────── */
  const loadingEl = $('loading');
  const loadingSub = $('loading-sub');
  const setLoadingText = (t) => {
    if (loadingSub) loadingSub.textContent = t;
  };

  function hideLoading() {
    if (loadingEl) {
      loadingEl.classList.add('is-hidden');
      setTimeout(() => {
        if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);
      }, 600);
    }
  }

  /** 地形模块缺失时的兜底地面，保证场景不空 */
  function addFallbackGround() {
    const size = (CAMPUS.site && CAMPUS.site.groundSize) || 560;
    const geo = new THREE.PlaneGeometry(size, size);
    const mesh = new THREE.Mesh(geo, materials.get('grass'));
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0;
    mesh.receiveShadow = true;
    mesh.name = '__fallback_ground';
    scene.add(mesh);
    console.warn('[app] 地形模块不可用，已启用兜底地面。');
  }

  async function buildScene() {
    setLoadingText('载入建筑 / 地形 / 植被模块…');

    const [bRes, tRes, vRes] = await Promise.all([
      loadBuilder('./buildings.js', 'buildBuildings', '建筑模块'),
      loadBuilder('./terrain.js', 'buildTerrain', '地形模块'),
      loadBuilder('./vegetation.js', 'buildVegetation', '植被模块'),
    ]);

    const failures = [];

    // 建筑
    if (bRes.ok) {
      try {
        const out = bRes.fn(ctx);
        if (out && out.group) {
          scene.add(out.group);
          console.info('[app] 建筑模块就绪：', out.stats || {});
          // 楼顶铭牌：独立分组，按 POI 分类合并
          if (out.signage && out.signage.group) {
            scene.add(out.signage.group);
            signageMeshes = out.signage.meshes || [];
            console.info('[app] 楼顶铭牌就绪：', {
              count: out.signage.count,
              meshes: signageMeshes.length,
              missing: out.signage.missing || [],
            });
          }
        } else {
          console.error('[app] 建筑模块未返回 group，已跳过。');
          failures.push('建筑模块');
        }
      } catch (err) {
        console.error('[app] 建筑模块构建失败：', err);
        failures.push('建筑模块');
      }
    } else {
      failures.push('建筑模块');
    }

    // 地形
    let terrainAdded = false;
    if (tRes.ok) {
      try {
        const out = tRes.fn(ctx);
        if (out && out.group) {
          scene.add(out.group);
          terrainAdded = true;
          if (out.lamps && out.lamps.lights && out.lamps.lights.length) {
            alignNightLights(out.lamps.lights);
          }
          console.info('[app] 地形模块就绪：', out.stats || {});
        } else {
          console.error('[app] 地形模块未返回 group，已跳过。');
          failures.push('地形模块');
        }
      } catch (err) {
        console.error('[app] 地形模块构建失败：', err);
        failures.push('地形模块');
      }
    } else {
      failures.push('地形模块');
    }
    if (!terrainAdded) addFallbackGround();

    // 植被
    if (vRes.ok) {
      try {
        const out = vRes.fn(ctx);
        if (out && out.group) {
          vegetationResult = out;
          vegetationGroup = out.group;
          vegetationGroup.visible = ctx.options.showTrees;
          scene.add(vegetationGroup);
          console.info('[app] 植被模块就绪：', out.stats || {});
        } else {
          console.error('[app] 植被模块未返回 group，已跳过。');
          failures.push('植被模块');
        }
      } catch (err) {
        console.error('[app] 植被模块构建失败：', err);
        failures.push('植被模块');
      }
    } else {
      failures.push('植被模块');
    }

    // 后处理：索引重建、UI 刷新
    rebuildPickIndex();
    renderCategoryChips();
    refreshPoiList();
    updateSubtitle();
    applyClip(clipMode);
    if (ctx.options.wireframe) setWireframe(true);

    // 装配期新建的材质（路灯灯罩 / 光晕）补刷当前昼夜状态
    applyNightGlow(skyState.nightFactor);

    if (failures.length) {
      toast(`部分模块未就绪：${failures.join('、')}（详见控制台）`);
      setLoadingText(`已跳过：${failures.join('、')}`);
    } else {
      setLoadingText('完成');
    }
    hideLoading();
  }

  /* ── 21. 初始 UI 同步 & 启动 ─────────────────────────────────── */
  function updateSubtitle() {
    const sub = $('app-subtitle');
    if (!sub || !CAMPUS.meta) return;
    sub.textContent = `${CAMPUS.meta.id} · v${CAMPUS.meta.version} · 单位：米 · POI ${pois.size()}`;
  }
  updateSubtitle();
  syncTimeButtons();
  syncSeasonButtons();
  syncQualityButtons();
  syncClipButtons();
  renderInfo(null);
  renderCategoryChips();
  refreshPoiList();

  buildScene().catch((err) => {
    console.error('[app] 场景装配异常：', err);
    hideLoading();
  });

  return {
    start,
    stop,
    dispose,
    scene,
    camera,
    renderer,
    controls,
    ctx,
    exportManifest,
    /* 楼顶铭牌（按 POI 分类合并的 Mesh 列表） */
    signage: () => signageMeshes,
    /* 便于外部驱动（测试 / 业务集成） */
    setTimePreset,
    setSeason,
    setQuality,
    applyClip,
    selectPOI,
    clearSelection,
    pickPOI,
    rebuildPickIndex,
    refreshPoiList,
    resetView,
  };
}

/* ══════════════════════════════════════════════════════════════════════
 * 页面引导
 * ══════════════════════════════════════════════════════════════════════ */

function bootstrap() {
  const container = $('viewport');
  if (!container) {
    console.error('[app] 未找到 #viewport 容器，无法启动。');
    return;
  }
  try {
    const app = createApp(container, DEFAULT_OPTIONS);
    app.start();
    if (typeof window !== 'undefined') window.campusApp = app;
  } catch (err) {
    console.error('[app] 初始化失败：', err);
    const box = document.querySelector('#loading .loading-text');
    if (box) box.textContent = '初始化失败，请查看控制台日志';
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

export default createApp;
