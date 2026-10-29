/**
 * materials.js — 统一材质库（程序化生成，零外部贴图依赖）
 *
 * ★ 团队只读基线。新增材质必须登记在本文件，模块不得私自 new 材质。
 * 所有贴图由 Canvas 绘制并缓存，尺寸 256×256 以内。
 */

const TEX_SIZE = 256;

/* ── 绘图工具 ─────────────────────────────────────────────────────────── */

function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function canvasTex(THREE, size, draw, opts = {}) {
  const { srgb = true, repeat = 1, aniso = 16 } = opts;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = aniso;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** 确定性伪随机，保证每次刷新贴图一致 */
function prng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

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

/** 柔和大块色斑，模拟不均匀的表面 */
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

/* ── 各表面的程序化贴图 ─────────────────────────────────────────────── */

const PAINT = {
  asphalt(ctx, size) {
    ctx.fillStyle = '#3c3c3e';
    ctx.fillRect(0, 0, size, size);
    blotches(ctx, size, 22, ['#444446', '#333335', '#4a4a4c'], 18, 48, 11, 0.5);
    speckle(ctx, size, 5200, ['#555557', '#2c2c2e', '#6a6a6c', '#222224'], 0.5, 1.6, 21);
  },
  paving(ctx, size) {
    ctx.fillStyle = '#b8b5ac';
    ctx.fillRect(0, 0, size, size);
    const cell = 32;
    for (let y = 0; y < size; y += cell) {
      for (let x = 0; x < size; x += cell) {
        const tint = 178 + Math.floor(prng(y * 131 + x * 17)() * 22);
        ctx.fillStyle = `rgb(${tint},${tint - 3},${tint - 11})`;
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      }
    }
    ctx.strokeStyle = 'rgba(120,117,110,0.85)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= size; i += cell) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }
    speckle(ctx, size, 2600, ['rgba(255,255,255,0.10)', 'rgba(60,58,54,0.14)'], 0.4, 1.3, 7);
  },
  grass(ctx, size) {
    ctx.fillStyle = '#4d7734';
    ctx.fillRect(0, 0, size, size);
    blotches(ctx, size, 26, ['#5c8a3c', '#43692c', '#639347'], 16, 46, 33, 0.55);
    const rnd = prng(91);
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * size;
      const y = rnd() * size;
      const h = 2 + rnd() * 4;
      ctx.strokeStyle = rnd() > 0.5 ? 'rgba(116,166,74,0.55)' : 'rgba(58,92,38,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (rnd() - 0.5) * 2.5, y - h);
      ctx.stroke();
    }
  },
  concrete(ctx, size) {
    ctx.fillStyle = '#b4b1a9';
    ctx.fillRect(0, 0, size, size);
    blotches(ctx, size, 30, ['#c0bdb5', '#a8a59d', '#c6c3ba'], 22, 60, 5, 0.45);
    speckle(ctx, size, 3400, ['rgba(255,255,255,0.12)', 'rgba(90,88,84,0.16)'], 0.4, 1.4, 41);
  },
  brick(ctx, size) {
    ctx.fillStyle = '#a8a49b';
    ctx.fillRect(0, 0, size, size);
    const bh = 16, bw = 32;
    const rnd = prng(3);
    for (let row = 0; row * bh < size; row++) {
      const offset = row % 2 ? bw / 2 : 0;
      for (let col = -1; col * bw < size + bw; col++) {
        const x = col * bw + offset + 1.5;
        const y = row * bh + 1.5;
        const v = rnd();
        const r = 150 + v * 26;
        const g = 78 + v * 22;
        const b = 64 + v * 20;
        ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
        ctx.fillRect(x, y, bw - 3, bh - 3);
      }
    }
    speckle(ctx, size, 1800, ['rgba(255,255,255,0.09)', 'rgba(40,20,14,0.16)'], 0.4, 1.2, 61);
  },
  roofTile(ctx, size) {
    ctx.fillStyle = '#5e3730';
    ctx.fillRect(0, 0, size, size);
    const th = 18;
    const rnd = prng(17);
    for (let row = 0; row * th < size; row++) {
      for (let col = 0; col * 22 < size + 22; col++) {
        const x = col * 22 + (row % 2 ? 11 : 0);
        const y = row * th;
        const v = rnd() * 18;
        ctx.fillStyle = `rgb(${104 + v | 0},${62 + v * 0.6 | 0},${54 + v * 0.5 | 0})`;
        ctx.fillRect(x + 1, y + 1, 20, th - 3);
      }
    }
    ctx.fillStyle = 'rgba(35,18,15,0.5)';
    for (let row = 0; row * th < size; row++) ctx.fillRect(0, row * th, size, 2);
  },
  track(ctx, size) {
    ctx.fillStyle = '#a94a38';
    ctx.fillRect(0, 0, size, size);
    speckle(ctx, size, 3000, ['rgba(255,255,255,0.05)', 'rgba(70,20,14,0.14)'], 0.4, 1.3, 29);
    ctx.strokeStyle = 'rgba(245,242,235,0.9)';
    ctx.lineWidth = 2;
    for (let i = 8; i < size; i += 14) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke();
    }
  },
  field(ctx, size) {
    ctx.fillStyle = '#3d7633';
    ctx.fillRect(0, 0, size, size);
    const bands = 8;
    const bh = size / bands;
    for (let i = 0; i < bands; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, i * bh, size, bh);
    }
    speckle(ctx, size, 2800, ['rgba(120,170,80,0.35)', 'rgba(38,64,28,0.35)'], 0.4, 1.4, 53);
  },
  water(ctx, size) {
    ctx.fillStyle = '#2f5f70';
    ctx.fillRect(0, 0, size, size);
    const rnd = prng(77);
    ctx.strokeStyle = 'rgba(190,225,235,0.30)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 90; i++) {
      const y = rnd() * size;
      const x = rnd() * size;
      const len = 8 + rnd() * 26;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + len / 2, y - 2.5, x + len, y);
      ctx.stroke();
    }
  },
  bark(ctx, size) {
    ctx.fillStyle = '#574433';
    ctx.fillRect(0, 0, size, size);
    const rnd = prng(101);
    for (let i = 0; i < 180; i++) {
      const x = rnd() * size;
      ctx.strokeStyle = rnd() > 0.5 ? 'rgba(36,26,18,0.55)' : 'rgba(122,96,70,0.35)';
      ctx.lineWidth = 1 + rnd() * 2.4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      let cx = x;
      for (let y = 0; y <= size; y += 16) {
        cx += (rnd() - 0.5) * 5;
        ctx.lineTo(cx, y);
      }
      ctx.stroke();
    }
  },
  stone(ctx, size) {
    ctx.fillStyle = '#a6a094';
    ctx.fillRect(0, 0, size, size);
    blotches(ctx, size, 20, ['#b5afa3', '#969084', '#bcb6aa'], 20, 54, 13, 0.4);
    speckle(ctx, size, 2800, ['rgba(255,255,255,0.10)', 'rgba(80,76,68,0.16)'], 0.4, 1.4, 67);
  },
  leafCard(ctx, size) {
    ctx.clearRect(0, 0, size, size);
    const rnd = prng(151);
    for (let i = 0; i < 150; i++) {
      const x = rnd() * size;
      const y = rnd() * size;
      const r = 5 + rnd() * 12;
      const g = 90 + rnd() * 80;
      ctx.fillStyle = `rgba(${40 + rnd() * 40 | 0},${g | 0},${40 + rnd() * 30 | 0},${0.75 + rnd() * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.62, rnd() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  },
  /** 径向渐变光斑：中心不透、边缘全透，用于路灯地面光池与灯头辉光 */
  lampGlow(ctx, size) {
    ctx.clearRect(0, 0, size, size);
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.62)');
    g.addColorStop(0.22, 'rgba(255,255,255,0.42)');
    g.addColorStop(0.52, 'rgba(255,255,255,0.13)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  },

  wood(ctx, size) {
    ctx.fillStyle = '#8a6a48';
    ctx.fillRect(0, 0, size, size);
    const rnd = prng(181);
    for (let i = 0; i < 70; i++) {
      const y = rnd() * size;
      ctx.strokeStyle = rnd() > 0.5 ? 'rgba(60,42,26,0.4)' : 'rgba(168,136,98,0.35)';
      ctx.lineWidth = 0.8 + rnd() * 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.3, y + (rnd() - 0.5) * 8, size * 0.7, y + (rnd() - 0.5) * 8, size, y);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(50,34,20,0.45)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= size; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke();
    }
  },
};

/* ── 楼顶铭牌图集 ─────────────────────────────────────────────────────── */

/**
 * 铭牌字体。图集绘制与字面高换算共用同一份定义，
 * 字号改变时必须同步 SIGN_FONT 与 SIGN.fontPx（见 buildings.js 的 SIGN）。
 */
const SIGN_FONT = 'bold 48px "PingFang SC", "Hiragino Sans GB", "Heiti SC", "Microsoft YaHei", sans-serif';
const SIGN_CELL_H = 64;      // 单元高（含上下留白）
const SIGN_PAD_X = 10;       // 单元左右留白
const SIGN_ATLAS_W = 2048;   // 图集宽
const SIGN_BG = '#1f4e8c';   // 牌面底色
const SIGN_FG = '#ffffff';
const SIGN_SOLID = 32;       // 牌面侧边 / 底面取色块边长

/**
 * 生成楼顶铭牌图集：一个名称一个单元，行式装箱。
 * 单元高与字号固定，宽度按文字长度自适应 → 牌面比例与文字比例一致。
 *
 * @param {object} THREE
 * @param {string[]} names 建筑名清单
 * @returns {null|{texture:object, cells:Map<string,object>, width:number, height:number,
 *                 solid:object, fontPx:number, cellH:number}}
 */
function buildSignageAtlas(THREE, names) {
  const list = [];
  const seen = new Set();
  for (const n of names) {
    if (typeof n !== 'string' || !n.length) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    list.push(n);
  }
  if (!list.length) return null;

  const probe = document.createElement('canvas').getContext('2d');
  probe.font = SIGN_FONT;
  const metrics = list.map((name) => ({ name, textW: Math.ceil(probe.measureText(name).width) }));

  // 行式装箱
  const cells = new Map();
  let x = 0;
  let y = 0;
  let used = 0;
  for (const m of metrics) {
    const cw = m.textW + SIGN_PAD_X * 2;
    if (x + cw > SIGN_ATLAS_W) {
      x = 0;
      y += SIGN_CELL_H;
    }
    cells.set(m.name, { x, y, w: cw, h: SIGN_CELL_H, textW: m.textW });
    x += cw;
    used = y + SIGN_CELL_H;
  }

  // 高度向上取 2 的幂，底部留一块纯色取样区
  let H = 256;
  while (H < used + SIGN_SOLID) H *= 2;
  const W = SIGN_ATLAS_W;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = SIGN_BG;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#17395f';
  ctx.fillRect(0, used, SIGN_SOLID, SIGN_SOLID);

  ctx.font = SIGN_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = SIGN_FG;
  ctx.strokeStyle = SIGN_FG;
  ctx.lineWidth = 2;
  for (const m of metrics) {
    const c = cells.get(m.name);
    ctx.strokeRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
    ctx.fillText(m.name, c.x + c.w / 2, c.y + c.h / 2 + 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.needsUpdate = true;

  // UV 换算（贴图 v 轴与画布 y 轴相反）
  for (const c of cells.values()) {
    c.u0 = c.x / W;
    c.u1 = (c.x + c.w) / W;
    c.v0 = 1 - (c.y + c.h) / H;
    c.v1 = 1 - c.y / H;
  }
  const solid = {
    u: (SIGN_SOLID / 2) / W,
    v: 1 - (used + SIGN_SOLID / 2) / H,
  };

  return { texture: tex, cells, width: W, height: H, solid, fontPx: 48, cellH: SIGN_CELL_H };
}

/* ── 材质定义表 ───────────────────────────────────────────────────────── */

export const MATERIAL_NAMES = [
  'concrete', 'plaster', 'brick', 'glass', 'metal', 'metalDark', 'gold', 'stone', 'woodDeck',
  'roofTile', 'roofMetal', 'asphalt', 'paving', 'curb', 'grass', 'lawnDark', 'soil',
  'water', 'bark', 'leafPine', 'leafBroad', 'leafAutumn', 'leafFlower', 'shrub',
  'trackRed', 'fieldGreen', 'lineWhite', 'signBlue', 'glassRoof', 'trackLine',
  // 扩展
  'leafCard', 'plazaStone', 'tennisCourt', 'fence', 'solarPanel',
  // 夜间路灯
  'lampLens', 'lampGlow',
  // 楼顶铭牌
  'signage',
];

export function createMaterials(THREE) {
  const cache = new Map();

  const std = (params) => new THREE.MeshStandardMaterial(params);

  /**
   * 需要环境反射的材质。
   * 玻璃 / 金属只有直接光时，近处因缺少反射而发黑发灰（roughness 越低越明显）。
   * 这类材质挂上程序化 PMREM 环境贴图后才有玻璃/金属的质感。
   */
  const REFLECTIVE = new Set([
    'glass', 'glassRoof', 'metal', 'metalDark', 'gold', 'roofMetal', 'solarPanel', 'water', 'fence',
  ]);

  /** 当前环境贴图（PMREM cube-UV 纹理），null = 未启用 */
  let envTexture = null;

  /** 把环境贴图挂到需要反射的材质上；材质名带 `#layer` 后缀时取基础名判断 */
  function applyEnv(mat) {
    if (!mat || !envTexture) return;
    const base = String(mat.name || '').split('#')[0];
    if (!REFLECTIVE.has(base)) return;
    if (mat.envMap === envTexture) return;
    mat.envMap = envTexture;
    mat.needsUpdate = true;
  }

  /** @type {Record<string, () => THREE.Material>} */
  const defs = {
    concrete: () => std({ color: 0xffffff, map: canvasTex(THREE, TEX_SIZE, PAINT.concrete), roughness: 0.88, metalness: 0.0 }),
    plaster: () => std({ color: 0xffffff, map: canvasTex(THREE, TEX_SIZE, (c, s) => {
      c.fillStyle = '#d9d3c7'; c.fillRect(0, 0, s, s);
      blotches(c, s, 18, ['#e2ddd2', '#cec8bc'], 22, 56, 9, 0.35);
      speckle(c, s, 2200, ['rgba(255,255,255,0.10)', 'rgba(120,112,100,0.10)'], 0.4, 1.3, 23);
    }), roughness: 0.92, metalness: 0.0 }),
    brick: () => std({ color: 0xffffff, map: canvasTex(THREE, TEX_SIZE, PAINT.brick), roughness: 0.95, metalness: 0.0 }),
    stone: () => std({ color: 0xffffff, map: canvasTex(THREE, TEX_SIZE, PAINT.stone), roughness: 0.86, metalness: 0.0 }),
    woodDeck: () => std({ color: 0xffffff, map: canvasTex(THREE, TEX_SIZE, PAINT.wood), roughness: 0.82, metalness: 0.0 }),

    glass: () => std({ color: 0x9fc6da, roughness: 0.06, metalness: 0.25, transparent: true, opacity: 0.42, envMapIntensity: 1.3 }),
    glassRoof: () => std({ color: 0xcfe6e2, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.36, side: THREE.DoubleSide }),

    metal: () => std({ color: 0xb4bac0, roughness: 0.34, metalness: 0.88 }),
    metalDark: () => std({ color: 0x3f444c, roughness: 0.46, metalness: 0.82 }),
    gold: () => std({ color: 0xc9a227, roughness: 0.26, metalness: 1.0 }),
    solarPanel: () => std({ color: 0x1b2a44, roughness: 0.22, metalness: 0.4 }),

    roofTile: () => std({ color: 0xffffff, map: canvasTex(THREE, TEX_SIZE, PAINT.roofTile), roughness: 0.9, metalness: 0.0 }),
    roofMetal: () => std({ color: 0x6b7076, roughness: 0.4, metalness: 0.72 }),

    asphalt: () => std({ color: 0xffffff, map: canvasTex(THREE, TEX_SIZE, PAINT.asphalt), roughness: 0.95, metalness: 0.0 }),
    paving: () => std({ color: 0xffffff, map: canvasTex(THREE, TEX_SIZE, PAINT.paving), roughness: 0.9, metalness: 0.0 }),
    plazaStone: () => std({ color: 0xc3bfb4, roughness: 0.78, metalness: 0.0 }),
    curb: () => std({ color: 0xc9c5ba, roughness: 0.85, metalness: 0.0 }),
    tennisCourt: () => std({ color: 0x2f6b7d, roughness: 0.88, metalness: 0.0 }),

    grass: () => std({ color: 0xffffff, map: canvasTex(THREE, TEX_SIZE, PAINT.grass), roughness: 0.98, metalness: 0.0 }),
    lawnDark: () => std({ color: 0x3f6a2c, roughness: 0.98, metalness: 0.0 }),
    soil: () => std({ color: 0x6b5843, roughness: 1.0, metalness: 0.0 }),
    fieldGreen: () => std({ color: 0xffffff, map: canvasTex(THREE, TEX_SIZE, PAINT.field), roughness: 0.97, metalness: 0.0 }),

    water: () => std({ color: 0xffffff, map: canvasTex(THREE, TEX_SIZE, PAINT.water), roughness: 0.06, metalness: 0.12, transparent: true, opacity: 0.86 }),

    trackRed: () => std({ color: 0xffffff, map: canvasTex(THREE, TEX_SIZE, PAINT.track), roughness: 0.92, metalness: 0.0 }),
    trackLine: () => std({ color: 0xf2f0e6, roughness: 0.85, metalness: 0.0 }),
    lineWhite: () => std({ color: 0xf0f0ea, roughness: 0.85, metalness: 0.0 }),

    signBlue: () => std({ color: 0x1f4e8c, roughness: 0.5, metalness: 0.1 }),

    bark: () => std({ color: 0xffffff, map: canvasTex(THREE, TEX_SIZE, PAINT.bark), roughness: 0.96, metalness: 0.0 }),
    leafPine: () => std({ color: 0x2f5a34, roughness: 0.95, metalness: 0.0, side: THREE.DoubleSide }),
    leafBroad: () => std({ color: 0x4a7c3a, roughness: 0.93, metalness: 0.0, side: THREE.DoubleSide }),
    leafAutumn: () => std({ color: 0xb5762a, roughness: 0.93, metalness: 0.0, side: THREE.DoubleSide }),
    leafFlower: () => std({ color: 0xd07ba0, roughness: 0.9, metalness: 0.0, side: THREE.DoubleSide }),
    shrub: () => std({ color: 0x3f6b32, roughness: 0.96, metalness: 0.0 }),
    leafCard: () => std({
      color: 0xffffff,
      map: canvasTex(THREE, TEX_SIZE, PAINT.leafCard),
      alphaTest: 0.42,
      side: THREE.DoubleSide,
      roughness: 0.95,
      metalness: 0.0,
    }),

    fence: () => std({ color: 0x8d9096, roughness: 0.5, metalness: 0.7 }),

    /**
     * 楼顶铭牌：深蓝底 + 白框白字，贴图为全楼名图集。
     * emissiveMap 与 map 同源 → 夜间只有高亮的文字发亮，等同「发光字」。
     */
    signage: () => std({
      color: 0xffffff,
      map: null,
      emissiveMap: null,
      emissive: 0x000000,
      roughness: 0.74,
      metalness: 0.05,
    }),

    /** 路灯灯罩：白天为浅色实体灯面，夜间靠 emissive 点亮 */
    lampLens: () => std({ color: 0xf3ead6, roughness: 0.42, metalness: 0.0, emissive: 0x000000 }),
    /**
     * 路灯光晕 / 地面光池：加法混合、关闭深度写入。
     * 基色为纯黑，白天叠加 0 不可见；夜间由 emissive 提供暖色辉光。
     */
    lampGlow: () => std({
      color: 0x000000,
      map: canvasTex(THREE, TEX_SIZE, PAINT.lampGlow),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      roughness: 1.0,
      metalness: 0.0,
      emissive: 0x000000,
    }),
  };

  function get(name) {
    if (cache.has(name)) return cache.get(name);
    const def = defs[name];
    if (!def) {
      console.warn(`[materials] 未登记的材质：${name}，返回占位材质`);
      const fallback = new THREE.MeshStandardMaterial({ color: 0xff00ff });
      fallback.name = `__missing_${name}`;
      cache.set(name, fallback);
      return fallback;
    }
    const mat = def();
    mat.name = name;
    applyEnv(mat);
    cache.set(name, mat);
    return mat;
  }

  /** 贴地装饰层材质缓存：key = `${name}#${layer}` */
  const decalCache = new Map();

  /**
   * 贴地装饰层（路面 / 绿地 / 广场 / 场地 / 标线）专用材质。
   *
   * 贴地面片彼此重叠是常态（路网交叠、绿地压路、标线压场地）。
   * 若让它们参与深度写入，重叠处会因深度缓冲分辨率不足而在远景
   * 互相闪烁。此类材质统一关闭 depthWrite：后画者直接覆盖先画者，
   * 层间先后完全由 renderOrder 指定，与相机位置和距离无关。
   *
   * polygonOffsetUnits = -1 让贴地面片始终比地面本体略近一个深度单位，
   * 避免与地面共面时出现整片闪烁；factor 固定为 0，使偏移量与多边形
   * 深度斜率无关，掠射角下不产生不可控差异。
   */
  function decal(name, layer) {
    const key = `${name}#${layer}`;
    if (decalCache.has(key)) return decalCache.get(key);
    const m = get(name).clone();
    m.name = key;
    applyEnv(m);
    m.depthWrite = false;
    m.polygonOffset = true;
    m.polygonOffsetFactor = 0;
    m.polygonOffsetUnits = -1;
    decalCache.set(key, m);
    return m;
  }

  return {
    get,
    decal,
    /**
     * 楼顶铭牌图集：按名称清单生成图集并挂到 'signage' 材质。
     * 材质只有一份，牌面网格按分区合并 → 60 栋楼共 7 次 DrawCall。
     * @param {string[]} names 建筑名清单
     */
    signageAtlas(names) {
      const atlas = buildSignageAtlas(THREE, names);
      if (!atlas) return null;
      const mat = get('signage');
      mat.map = atlas.texture;
      mat.emissiveMap = atlas.texture;
      mat.needsUpdate = true;
      return atlas;
    },
    /**
     * 设置环境贴图（PMREM cube-UV 纹理）。
     * 立即同步到所有已创建材质；后续新建材质在 get() 内自动挂载。
     */
    setEnvironment(texture) {
      envTexture = texture || null;
      for (const mat of cache.values()) applyEnv(mat);
      for (const mat of decalCache.values()) applyEnv(mat);
    },
    has: (name) => Object.prototype.hasOwnProperty.call(defs, name),
    names: () => Object.keys(defs),
    all: () => {
      const merged = new Map(cache);
      for (const [k, v] of decalCache) merged.set(k, v);
      return merged;
    },
    /** 释放所有 GPU 资源（dispose 时调用） */
    dispose() {
      for (const mat of decalCache.values()) mat.dispose();
      decalCache.clear();
      for (const mat of cache.values()) {
        if (mat.map) mat.map.dispose();
        if (mat.normalMap) mat.normalMap.dispose();
        mat.dispose();
      }
      cache.clear();
    },
  };
}

export default createMaterials;
