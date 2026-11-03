/**
 * materials.js — 消防水泵房统一材质库（程序化生成，零外部贴图依赖）
 *
 * ★ 归属：通用消防水泵房三维建模团队 · 泵房材质师（唯一可写文件）
 * ★ 接口：export function createMaterials(THREE) → { get(name), dispose() }（CONTRACT 4.3）
 * ★ 材质名：CONTRACT 4.3 表中全部 31 个，一个都不能少；各模块一律 ctx.mat(name) 取用。
 * ★ 贴图：全部 Canvas 程序化绘制并缓存，尺寸 256×256 以内；零外部图片 / 字体 / CDN。
 * ★ three.js 由调用方以参数传入，本文件不做裸导入（禁止 `import * as THREE from 'three'`）。
 * ★ 同一材质实例全场景复用：get() 内部缓存，同名材质只创建一次，避免 draw call 膨胀。
 *
 * 色调：室内工业场景，冷灰基调 + 消防红点缀。
 *   地坪深灰防滑 / 墙体浅灰 / 管道镀锌灰 / 控制柜浅灰 RAL7035 /
 *   泵蜗壳铸铁蓝 / 电机深灰绿 / 联轴器护罩安全黄 / 标识环与手轮消防红。
 *
 * 自发光材质：indicatorOn / indicatorFault / lampGlow。
 * 半透明材质：water（opacity 0.55）、windowGlass（浅青）。
 */

const TEX_SIZE = 256;

/**
 * CONTRACT 4.3 材质名清单（顺序与契约表一致）。
 * 引擎集成师可据此校验 ctx.mat() 是否全部命中。
 */
export const MATERIAL_NAMES = [
  'floor', 'wall', 'ceiling', 'beam', 'door', 'windowGlass',
  'steelTank', 'steelPipe', 'pipeMarkRed', 'valveBody', 'valveHandle',
  'pumpCasing', 'motorBody', 'skid', 'guard',
  'cabinet', 'cabinetDoor', 'cabinetBase',
  'indicatorOn', 'indicatorOff', 'indicatorFault',
  'grating', 'sumpWall', 'trench',
  'cableTray', 'cable', 'lampShell', 'lampGlow',
  'signPlate', 'signText', 'water',
];

/* ── Canvas 绘图工具 ─────────────────────────────────────────────────── */

/**
 * 无 DOM 环境（Node 自检 / Worker）下的 2D 上下文兜底：
 * 任何方法调用都是空操作，任何属性读写都安全 —— 保证材质库在无 Canvas 时
 * 仍能构建出合法材质（只是贴图为空），不抛异常打断场景装配。
 */
function createNullContext() {
  const noop = () => {};
  const target = {
    canvas: null,
    measureText: () => ({ width: 0 }),
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

function makeCanvas(size) {
  const doc = typeof document !== 'undefined' ? document : null;
  if (doc && typeof doc.createElement === 'function') {
    const canvas = doc.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
  }
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(size, size);
  return { width: size, height: size, getContext: () => createNullContext() };
}

/**
 * 生成一张 CanvasTexture。贴图与材质 1:1，材质只创建一次 → 贴图自然复用。
 * @param {object} THREE
 * @param {number} size 贴图边长（≤ 256）
 * @param {(ctx: CanvasRenderingContext2D, size: number) => void} draw 绘制回调
 * @param {{srgb?: boolean, repeat?: number|number[], aniso?: number}} opts
 */
function canvasTex(THREE, size, draw, opts = {}) {
  const { srgb = true, repeat = 1, aniso = 16 } = opts;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  const [rx, ry] = Array.isArray(repeat) ? repeat : [repeat, repeat];
  tex.repeat.set(rx, ry);
  tex.anisotropy = aniso;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** 确定性伪随机：同一 seed 每次刷新贴图完全一致 */
function prng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** 细颗粒噪点（骨料 / 防滑颗粒 / 漆面桔皮） */
function speckle(ctx, size, count, colors, minR, maxR, seed) {
  const rnd = prng(seed);
  for (let i = 0; i < count; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = minR + rnd() * (maxR - minR);
    ctx.fillStyle = colors[Math.floor(rnd() * colors.length)];
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 柔和大块色斑（表面不均匀 / 施工痕迹） */
function blotches(ctx, size, count, colors, minR, maxR, seed, alpha = 0.25) {
  const rnd = prng(seed);
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = minR + rnd() * (maxR - minR);
    ctx.fillStyle = colors[Math.floor(rnd() * colors.length)];
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + rnd() * 0.6), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** 平行细线（拉丝 / 肋条 / 缝） */
function lines(ctx, size, count, color, width, horizontal, seed, alpha = 1) {
  const rnd = prng(seed);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  for (let i = 0; i < count; i++) {
    const t = rnd() * size;
    ctx.beginPath();
    if (horizontal) {
      ctx.moveTo(0, t);
      ctx.lineTo(size, t);
    } else {
      ctx.moveTo(t, 0);
      ctx.lineTo(t, size);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/* ── 各表面的程序化贴图 ──────────────────────────────────────────────── */

const PAINT = {
  /** 环氧防滑地坪：深灰底 + 细颗粒 + 施工分格缝 */
  floorEpoxy(ctx, s) {
    ctx.fillStyle = '#4a4d52';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 16, ['#53565b', '#424549', '#585b60'], 30, 74, 101, 0.3);
    speckle(ctx, s, 6500, ['#5e6268', '#3b3e43', '#6d7177', '#34363a'], 0.35, 1.7, 211);
    ctx.strokeStyle = 'rgba(28,30,33,0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, s / 2); ctx.lineTo(s, s / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s / 2, 0); ctx.lineTo(s / 2, s); ctx.stroke();
    ctx.strokeStyle = 'rgba(128,132,138,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, s / 2 + 2); ctx.lineTo(s, s / 2 + 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s / 2 + 2, 0); ctx.lineTo(s / 2 + 2, s); ctx.stroke();
  },

  /** 水泥抹灰墙面：浅灰底 + 抹痕色斑 */
  plaster(ctx, s) {
    ctx.fillStyle = '#b9b5ab';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 22, ['#c4c0b6', '#afaba2', '#c9c5bb'], 24, 68, 9, 0.35);
    speckle(ctx, s, 2400, ['rgba(255,255,255,0.10)', 'rgba(110,104,94,0.14)'], 0.4, 1.4, 23);
  },

  /** 顶棚：浅灰白 + 板缝 */
  ceilingPanel(ctx, s) {
    ctx.fillStyle = '#c8c5bd';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 14, ['#d2cfc7', '#bfbcb4'], 30, 70, 57, 0.3);
    speckle(ctx, s, 1800, ['rgba(255,255,255,0.10)', 'rgba(120,116,108,0.10)'], 0.4, 1.2, 71);
    ctx.strokeStyle = 'rgba(122,118,110,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, s - 2, s - 2);
  },

  /** 混凝土面（梁 / 底座 / 井壁 / 沟体），基色由参数给出 */
  concrete(ctx, s, base, seed = 5) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 26, ['rgba(255,255,255,0.10)', 'rgba(0,0,0,0.10)'], 26, 66, seed, 0.4);
    speckle(ctx, s, 3200, ['rgba(255,255,255,0.12)', 'rgba(70,68,64,0.16)'], 0.4, 1.5, seed + 11);
    // 模板拼缝
    ctx.strokeStyle = 'rgba(80,78,74,0.28)';
    ctx.lineWidth = 1.4;
    for (let i = 1; i < 4; i++) {
      const t = (s / 4) * i;
      ctx.beginPath(); ctx.moveTo(t, 0); ctx.lineTo(t, s); ctx.stroke();
    }
  },

  /** 消防红烤漆（门 / 标识环 / 手轮） */
  redPaint(ctx, s, base = '#C0392B', seed = 31) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 16, ['rgba(255,255,255,0.10)', 'rgba(0,0,0,0.14)'], 20, 56, seed, 0.35);
    speckle(ctx, s, 1400, ['rgba(255,255,255,0.10)', 'rgba(60,16,10,0.18)'], 0.4, 1.3, seed + 7);
  },

  /** 甲级防火门：红漆 + 门框分格线 + 踢脚板 */
  redDoor(ctx, s) {
    PAINT.redPaint(ctx, s, '#B23A2E', 31);
    ctx.strokeStyle = 'rgba(70,18,12,0.45)';
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, s - 12, s - 12);
    ctx.strokeStyle = 'rgba(70,18,12,0.32)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(6, s * 0.42); ctx.lineTo(s - 6, s * 0.42); ctx.stroke();
    ctx.fillStyle = 'rgba(60,58,55,0.35)';
    ctx.fillRect(6, s * 0.72, s - 12, s * 0.28);
    speckle(ctx, s, 900, ['rgba(255,255,255,0.08)', 'rgba(50,14,9,0.16)'], 0.4, 1.2, 133);
  },

  /** 不锈钢拉丝（罐体）：竖向细纹 + 焊缝色差 */
  brushedSteel(ctx, s) {
    ctx.fillStyle = '#c3c8cc';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 12, ['#cdd2d6', '#b8bdc2'], 30, 80, 17, 0.3);
    lines(ctx, s, 300, 'rgba(255,255,255,0.14)', 1, false, 19, 1);
    lines(ctx, s, 260, 'rgba(126,132,139,0.13)', 1, false, 23, 1);
    speckle(ctx, s, 900, ['rgba(255,255,255,0.08)', 'rgba(110,116,123,0.10)'], 0.4, 1.1, 29);
    // 环向焊缝
    ctx.strokeStyle = 'rgba(140,146,152,0.30)';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, s * 0.5); ctx.lineTo(s, s * 0.5); ctx.stroke();
  },

  /** 镀锌钢（管道 / 桥架）：锌花斑驳 */
  galvanized(ctx, s, base = '#9aa0a6', seed = 41) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 46, ['#a5abb1', '#8f959b', '#b0b6bc'], 6, 22, seed, 0.55);
    blotches(ctx, s, 12, ['rgba(255,255,255,0.12)', 'rgba(0,0,0,0.12)'], 24, 60, seed + 3, 0.3);
    speckle(ctx, s, 2000, ['rgba(255,255,255,0.12)', 'rgba(70,74,78,0.14)'], 0.4, 1.4, seed + 9);
  },

  /** 镀锌桥架：镀锌底 + 冲孔侧板 */
  galvanizedTray(ctx, s) {
    PAINT.galvanized(ctx, s, '#a8adb2', 61);
    ctx.fillStyle = 'rgba(60,64,68,0.55)';
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        ctx.fillRect(12 + col * 30, 14 + row * 76, 16, 8);
      }
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, s - 8, s - 8);
  },

  /** 铸铁 / 铁件（阀体 / 格栅）：粗糙深灰 */
  castIron(ctx, s, base = '#6e7378', seed = 83) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 30, ['rgba(255,255,255,0.10)', 'rgba(0,0,0,0.16)'], 16, 52, seed, 0.4);
    speckle(ctx, s, 4200, ['rgba(255,255,255,0.10)', 'rgba(20,22,24,0.22)'], 0.4, 1.8, seed + 5);
    // 铸造麻面（单一随机流，避免逐点重置 seed 形成规律斜纹）
    const rnd = prng(seed + 5);
    for (let i = 0; i < 180; i++) {
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.beginPath();
      ctx.arc(rnd() * s, rnd() * s, 1 + rnd() * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  /** 泵蜗壳铸铁蓝漆 */
  pumpBlue(ctx, s) {
    ctx.fillStyle = '#2f5d8c';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 18, ['#356694', '#2a5480', '#3a6c9c'], 22, 60, 97, 0.4);
    speckle(ctx, s, 2600, ['rgba(255,255,255,0.10)', 'rgba(12,32,56,0.20)'], 0.4, 1.6, 103);
  },

  /** 电机深灰绿漆 */
  motorGreen(ctx, s) {
    ctx.fillStyle = '#4a5a52';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 16, ['#526259', '#43534b'], 24, 62, 113, 0.4);
    speckle(ctx, s, 2200, ['rgba(255,255,255,0.09)', 'rgba(20,30,26,0.18)'], 0.4, 1.5, 127);
  },

  /** 安全黄漆（联轴器护罩） */
  safetyYellow(ctx, s) {
    ctx.fillStyle = '#d8a21a';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 16, ['#e2ad24', '#cf9a16'], 22, 58, 137, 0.4);
    speckle(ctx, s, 2000, ['rgba(255,255,255,0.12)', 'rgba(96,64,6,0.18)'], 0.4, 1.5, 149);
    // 刮擦露底
    const rnd = prng(151);
    for (let i = 0; i < 26; i++) {
      ctx.strokeStyle = 'rgba(120,124,126,0.35)';
      ctx.lineWidth = 0.8 + rnd() * 1.4;
      const x = rnd() * s, y = rnd() * s, a = rnd() * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * (6 + rnd() * 18), y + Math.sin(a) * (6 + rnd() * 18));
      ctx.stroke();
    }
  },

  /** 粉末涂层（控制柜柜体 / 柜门）：桔皮感 */
  powderCoat(ctx, s, base = '#c9cbc8', seed = 163) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 14, ['rgba(255,255,255,0.10)', 'rgba(0,0,0,0.07)'], 26, 70, seed, 0.3);
    speckle(ctx, s, 3200, ['rgba(255,255,255,0.10)', 'rgba(90,92,90,0.10)'], 0.35, 1.1, seed + 5);
  },

  /** 深灰漆（柜底座 / 沟体） */
  darkPaint(ctx, s, base = '#7c7f82', seed = 173) {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 18, ['rgba(255,255,255,0.09)', 'rgba(0,0,0,0.14)'], 22, 62, seed, 0.35);
    speckle(ctx, s, 2600, ['rgba(255,255,255,0.09)', 'rgba(20,22,24,0.16)'], 0.4, 1.5, seed + 3);
  },

  /** 黑色 PVC 电缆外皮：沿轴向的肋纹（竖线 = 沿圆柱轴线延伸） */
  pvcCable(ctx, s) {
    ctx.fillStyle = '#2a2c2f';
    ctx.fillRect(0, 0, s, s);
    lines(ctx, s, 110, 'rgba(255,255,255,0.06)', 1.4, false, 181, 1);
    lines(ctx, s, 80, 'rgba(0,0,0,0.32)', 1.2, false, 191, 1);
    speckle(ctx, s, 1200, ['rgba(255,255,255,0.06)', 'rgba(0,0,0,0.20)'], 0.4, 1.2, 197);
  },

  /** 灯具外壳浅灰烤漆 */
  lampShell(ctx, s) {
    ctx.fillStyle = '#cfd2d5';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 10, ['#d7dade', '#c5c8cb'], 26, 66, 211, 0.3);
    speckle(ctx, s, 1400, ['rgba(255,255,255,0.12)', 'rgba(110,114,118,0.12)'], 0.4, 1.2, 223);
  },

  /** 灯管发光面：暖白扩散板 */
  diffuser(ctx, s) {
    ctx.fillStyle = '#FFF4E0';
    ctx.fillRect(0, 0, s, s);
    const g = ctx.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(255,255,255,0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(196,186,166,0.45)';
    ctx.lineWidth = 3;
    for (let i = 1; i < 4; i++) {
      const t = (s / 4) * i;
      ctx.beginPath(); ctx.moveTo(0, t); ctx.lineTo(s, t); ctx.stroke();
    }
  },

  /** 指示灯透镜：中心亮点 + 菲涅尔环 */
  indicatorLens(ctx, s, base = '#2ecc71') {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, s, s);
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  },

  /** 标牌底板：白底 + 轻微脏污 */
  signWhite(ctx, s) {
    ctx.fillStyle = '#efefef';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 10, ['rgba(255,255,255,0.6)', 'rgba(120,120,120,0.12)'], 20, 54, 227, 0.25);
    speckle(ctx, s, 900, ['rgba(0,0,0,0.05)', 'rgba(255,255,255,0.2)'], 0.4, 1.1, 229);
  },

  /** 观察窗玻璃：极淡竖向反光纹 */
  glassStreak(ctx, s) {
    ctx.fillStyle = '#eef7f8';
    ctx.fillRect(0, 0, s, s);
    lines(ctx, s, 40, 'rgba(255,255,255,0.55)', 2, false, 233, 1);
    lines(ctx, s, 14, 'rgba(150,180,190,0.18)', 6, false, 239, 1);
  },

  /** 水面：青蓝底 + 波纹高光 */
  waterSurface(ctx, s) {
    ctx.fillStyle = '#2d7f9e';
    ctx.fillRect(0, 0, s, s);
    blotches(ctx, s, 18, ['#3590af', '#276f8c'], 24, 62, 241, 0.4);
    const rnd = prng(251);
    ctx.strokeStyle = 'rgba(200,235,245,0.28)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 80; i++) {
      const x = rnd() * s;
      const y = rnd() * s;
      const len = 10 + rnd() * 28;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + len / 2, y - 3, x + len, y);
      ctx.stroke();
    }
  },
};

/* ── 材质定义表 ──────────────────────────────────────────────────────── */

export function createMaterials(THREE) {
  /** @type {Map<string, THREE.Material>} 材质缓存：同名材质全场景只建一次 */
  const cache = new Map();
  /** @type {Set<THREE.Texture>} 已创建的贴图，dispose() 时统一释放 */
  const textures = new Set();

  const std = (params) => new THREE.MeshStandardMaterial(params);

  /**
   * 需要环境反射的材质：室内金属 / 玻璃 / 水只有直接光时会发黑发灰。
   * 引擎集成师可通过 setEnvironment(pmremTexture) 挂载程序化环境贴图。
   */
  const REFLECTIVE = new Set([
    'windowGlass', 'steelTank', 'steelPipe', 'pipeMarkRed', 'valveBody',
    'valveHandle', 'pumpCasing', 'motorBody', 'guard', 'cableTray', 'water',
  ]);

  /** 当前环境贴图（PMREM cube-UV 纹理），null = 未启用 */
  let envTexture = null;

  /** 贴图登记 + 包装，保证 dispose() 不漏 */
  const tex = (size, draw, opts) => {
    const t = canvasTex(THREE, size, draw, opts);
    textures.add(t);
    return t;
  };

  function applyEnv(mat) {
    if (!mat || !envTexture) return;
    if (!REFLECTIVE.has(mat.name)) return;
    if (mat.envMap === envTexture) return;
    mat.envMap = envTexture;
    mat.needsUpdate = true;
  }

  /** @type {Record<string, () => THREE.Material>} */
  const defs = {
    /* ── 土建外壳 ───────────────────────────────────────────────────── */
    /** 环氧防滑地坪（深灰 #4a4d52） */
    floor: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, PAINT.floorEpoxy, { repeat: [0.5, 0.5] }),
      roughness: 0.78,
      metalness: 0.04,
    }),

    /** 墙体（水泥抹灰 / 涂料，浅灰 #b9b5ab） */
    wall: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, PAINT.plaster, { repeat: [6, 3] }),
      roughness: 0.93,
      metalness: 0.0,
    }),

    /** 顶棚（浅灰白 #c8c5bd） */
    ceiling: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, PAINT.ceilingPanel, { repeat: [6, 4] }),
      roughness: 0.9,
      metalness: 0.0,
    }),

    /** 屋面梁（混凝土灰 #a5a29a） */
    beam: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, (c, s) => PAINT.concrete(c, s, '#a5a29a', 5), { repeat: [3, 2] }),
      roughness: 0.9,
      metalness: 0.0,
    }),

    /** 甲级防火门（消防红 #B23A2E） */
    door: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, PAINT.redDoor, { repeat: 1 }),
      roughness: 0.45,
      metalness: 0.22,
    }),

    /** 观察窗玻璃（半透明浅青） */
    windowGlass: () => std({
      color: 0xbcd9e0,
      map: tex(TEX_SIZE, PAINT.glassStreak, { repeat: [2, 2] }),
      roughness: 0.07,
      metalness: 0.08,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      envMapIntensity: 1.2,
      depthWrite: false,
    }),

    /* ── 水罐 / 管道 / 阀门 ─────────────────────────────────────────── */
    /** 水罐筒体（不锈钢拉丝 #c3c8cc） */
    steelTank: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, PAINT.brushedSteel, { repeat: [8, 2] }),
      roughness: 0.28,
      metalness: 0.92,
      envMapIntensity: 1.1,
    }),

    /** 管道本体（镀锌灰 #9aa0a6） */
    steelPipe: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, PAINT.galvanized, { repeat: [2, 1] }),
      roughness: 0.42,
      metalness: 0.85,
    }),

    /** 消防管道红色标识环 #C0392B */
    pipeMarkRed: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, (c, s) => PAINT.redPaint(c, s, '#C0392B', 31), { repeat: [2, 1] }),
      roughness: 0.5,
      metalness: 0.25,
    }),

    /** 阀门阀体（深灰 #6e7378） */
    valveBody: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, (c, s) => PAINT.castIron(c, s, '#6e7378', 83), { repeat: [2, 2] }),
      roughness: 0.72,
      metalness: 0.6,
    }),

    /** 阀门手轮（消防红 #C0392B） */
    valveHandle: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, (c, s) => PAINT.redPaint(c, s, '#C0392B', 37), { repeat: [2, 2] }),
      roughness: 0.48,
      metalness: 0.35,
    }),

    /* ── 泵机组 ─────────────────────────────────────────────────────── */
    /** 泵蜗壳（铸铁蓝 #2f5d8c） */
    pumpCasing: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, PAINT.pumpBlue, { repeat: [2, 2] }),
      roughness: 0.62,
      metalness: 0.45,
    }),

    /** 电机（深灰绿 #4a5a52） */
    motorBody: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, PAINT.motorGreen, { repeat: [2, 2] }),
      roughness: 0.55,
      metalness: 0.4,
    }),

    /** 混凝土惯性底座（混凝土灰 #9d9a92） */
    skid: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, (c, s) => PAINT.concrete(c, s, '#9d9a92', 15), { repeat: [2, 2] }),
      roughness: 0.92,
      metalness: 0.0,
    }),

    /** 联轴器护罩（安全黄 #d8a21a） */
    guard: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, PAINT.safetyYellow, { repeat: [2, 2] }),
      roughness: 0.5,
      metalness: 0.35,
    }),

    /* ── 控制柜 ─────────────────────────────────────────────────────── */
    /** 控制柜柜体（浅灰 RAL7035 #c9cbc8） */
    cabinet: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, (c, s) => PAINT.powderCoat(c, s, '#c9cbc8', 163), { repeat: [2, 2] }),
      roughness: 0.55,
      metalness: 0.25,
    }),

    /** 控制柜柜门（稍深 #b6b8b5） */
    cabinetDoor: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, (c, s) => PAINT.powderCoat(c, s, '#b6b8b5', 167), { repeat: 1 }),
      roughness: 0.52,
      metalness: 0.25,
    }),

    /** 控制柜底座（深灰 #7c7f82） */
    cabinetBase: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, (c, s) => PAINT.darkPaint(c, s, '#7c7f82', 173), { repeat: [2, 1] }),
      roughness: 0.7,
      metalness: 0.3,
    }),

    /* ── 指示灯（自发光） ───────────────────────────────────────────── */
    /** 指示灯（运行 / 绿 #2ecc71） */
    indicatorOn: () => std({
      color: 0x2ecc71,
      map: tex(TEX_SIZE, (c, s) => PAINT.indicatorLens(c, s, '#2ecc71'), { repeat: 1 }),
      emissive: 0x2ecc71,
      emissiveIntensity: 2.4,
      roughness: 0.3,
      metalness: 0.0,
    }),

    /** 指示灯（停 / 灰 #4a4d50，不发光） */
    indicatorOff: () => std({
      color: 0x4a4d50,
      map: tex(TEX_SIZE, (c, s) => PAINT.indicatorLens(c, s, '#4a4d50'), { repeat: 1 }),
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      roughness: 0.45,
      metalness: 0.0,
    }),

    /** 故障指示（红 #e74c3c，自发光） */
    indicatorFault: () => std({
      color: 0xe74c3c,
      map: tex(TEX_SIZE, (c, s) => PAINT.indicatorLens(c, s, '#e74c3c'), { repeat: 1 }),
      emissive: 0xe74c3c,
      emissiveIntensity: 2.8,
      roughness: 0.3,
      metalness: 0.0,
    }),

    /* ── 给排水 ─────────────────────────────────────────────────────── */
    /** 格栅盖板（铸铁黑 #3a3d40） */
    grating: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, (c, s) => PAINT.castIron(c, s, '#3a3d40', 89), { repeat: 1 }),
      roughness: 0.75,
      metalness: 0.55,
    }),

    /** 排污井井壁（混凝土灰 #8e8b84） */
    sumpWall: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, (c, s) => PAINT.concrete(c, s, '#8e8b84', 25), { repeat: [2, 2] }),
      roughness: 0.93,
      metalness: 0.0,
    }),

    /** 排水沟沟体（深灰 #55585c） */
    trench: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, (c, s) => PAINT.darkPaint(c, s, '#55585c', 179), { repeat: [3, 2] }),
      roughness: 0.88,
      metalness: 0.1,
    }),

    /* ── 电气 ───────────────────────────────────────────────────────── */
    /** 电缆桥架（镀锌灰 #a8adb2） */
    cableTray: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, PAINT.galvanizedTray, { repeat: [3, 1] }),
      roughness: 0.45,
      metalness: 0.8,
    }),

    /** 电缆（黑 #2a2c2f） */
    cable: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, PAINT.pvcCable, { repeat: [8, 1] }),
      roughness: 0.62,
      metalness: 0.05,
    }),

    /* ── 照明 ───────────────────────────────────────────────────────── */
    /** 灯具外壳（浅灰 #cfd2d5） */
    lampShell: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, PAINT.lampShell, { repeat: 1 }),
      roughness: 0.42,
      metalness: 0.55,
    }),

    /** 灯管发光面（暖白 #FFF4E0，自发光） */
    lampGlow: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, PAINT.diffuser, { repeat: 1 }),
      emissive: 0xfff4e0,
      emissiveIntensity: 2.2,
      roughness: 0.6,
      metalness: 0.0,
    }),

    /* ── 标识 ───────────────────────────────────────────────────────── */
    /** 标牌底板（白 #efefef） */
    signPlate: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, PAINT.signWhite, { repeat: 1 }),
      roughness: 0.45,
      metalness: 0.1,
    }),

    /** 标牌文字（深蓝 #1b3a5c） */
    signText: () => std({
      color: 0x1b3a5c,
      roughness: 0.4,
      metalness: 0.15,
    }),

    /* ── 水 ─────────────────────────────────────────────────────────── */
    /** 水罐内水面（青蓝 #2d7f9e，半透明 opacity 0.55） */
    water: () => std({
      color: 0xffffff,
      map: tex(TEX_SIZE, PAINT.waterSurface, { repeat: [3, 3] }),
      roughness: 0.07,
      metalness: 0.1,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      envMapIntensity: 1.2,
      depthWrite: false,
    }),
  };

  /**
   * 取用材质。命中缓存直接返回同一实例（全场景复用）。
   * 未登记的名字 → console.warn 并返回洋红兜底材质，绝不抛异常打断场景构建。
   * @param {string} name CONTRACT 4.3 材质名
   * @returns {THREE.Material}
   */
  function get(name) {
    if (cache.has(name)) return cache.get(name);
    const def = defs[name];
    if (!def) {
      console.warn(`[materials] 未登记的材质名：${name}，返回兜底材质（洋红）`);
      const fallback = new THREE.MeshStandardMaterial({ color: 0xff00ff });
      fallback.name = `__missing_${name}`;
      cache.set(name, fallback);
      return fallback;
    }
    let mat;
    try {
      mat = def();
    } catch (err) {
      console.warn(`[materials] 材质 ${name} 构建失败，回退兜底材质：${err && err.message}`);
      const fallback = new THREE.MeshStandardMaterial({ color: 0xff00ff });
      fallback.name = `__error_${name}`;
      cache.set(name, fallback);
      return fallback;
    }
    mat.name = name;
    applyEnv(mat);
    cache.set(name, mat);
    return mat;
  }

  return {
    get,

    /** 是否登记了该材质名 */
    has: (name) => Object.prototype.hasOwnProperty.call(defs, name),

    /** 全部已登记的材质名 */
    names: () => Object.keys(defs),

    /** 已创建材质快照（引擎集成师调试用） */
    all: () => new Map(cache),

    /**
     * 设置环境贴图（PMREM cube-UV 纹理），立即同步到所有已创建材质；
     * 后续新建材质在 get() 内自动挂载。
     */
    setEnvironment(texture) {
      envTexture = texture || null;
      for (const mat of cache.values()) applyEnv(mat);
    },

    /** 释放全部材质与贴图（场景卸载时调用） */
    dispose() {
      for (const mat of cache.values()) {
        mat.dispose();
      }
      cache.clear();
      for (const t of textures) {
        t.dispose();
      }
      textures.clear();
      envTexture = null;
    },
  };
}

export default createMaterials;
