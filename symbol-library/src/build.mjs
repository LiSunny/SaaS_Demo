#!/usr/bin/env node
// 构建：src/symbols.source.js → dist/(symbols.js / symbols.svg / manifest.json / points.sample.csv / preview.html)
// 同时跑入库校验，校验失败退出码非 0。

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SYMBOLS, SPEC, SYSTEMS, CATEGORIES } from './symbols.source.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dist = join(root, 'dist');
mkdirSync(dist, { recursive: true });

const VERSION = '1.1.0';
const ID_RE = /^[A-Z]{2,4}-[A-Z]{2,5}-\d{2}$/;

// 分类 → 建议画面编号，由分类表声明
const SCREENS = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.screen]));
const CAT_MAP = new Map(CATEGORIES.map((c) => [c.key, c]));
const SYS_MAP = new Map(SYSTEMS.map((s) => [s.key, s]));

/** 图元所属系统：图元自身 system 优先，否则取其分类的 system */
function systemOf(def) {
  const cat = CAT_MAP.get(def.category);
  return def.system || cat?.system || null;
}

const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

/* ── 1. 标注：给旋转/指针元素分配唯一类名与轴心 ───────────── */
function annotate(def) {
  const cnt = { rotor: 0, needle: 0 };
  const pivots = {};
  const walk = (shapes) => {
    for (const s of shapes) {
      if (s.role === 'rotor') { s.uid = `sym-rot${cnt.rotor++}`; pivots['.' + s.uid] = s.pivot || [32, 32]; }
      if (s.role === 'needle') { s.uid = `sym-needle${cnt.needle++}`; pivots['.' + s.uid] = s.pivot || [32, 32]; }
      if (s.children) walk(s.children);
    }
  };
  walk(def.shapes);
  def._pivots = pivots;
  def._rotors = Object.keys(pivots).filter((k) => k.includes('sym-rot'));
  def._needles = Object.keys(pivots).filter((k) => k.includes('sym-needle'));
}

/* ── 2. 几何生成 ──────────────────────────────────────────── */
const GEO_KEYS = new Set(['t', 'role', 'extra', 'children', 'pivot', 'uid']);
function geoAttrs(s) {
  return Object.entries(s)
    .filter(([k]) => !GEO_KEYS.has(k))
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
}
function shapeMarkup(s, mode) {
  const geo = geoAttrs(s);
  if (!s.role) {
    if (s.t === 'g') return `<g ${geo}>${(s.children || []).map((c) => shapeMarkup(c, mode)).join('')}</g>`;
    return `<${s.t} ${geo}/>`;
  }
  const role = SPEC.roles[s.role];
  const cls = [role.cls, ...(s.extra || []), ...(s.uid ? [s.uid] : [])].join(' ');
  const pa = mode === 'sprite' ? Object.entries(role.sprite).map(([k, v]) => `${k}="${v}"`).join(' ') : '';
  const attrs = `class="${cls}" ${geo} ${pa}`.replace(/\s+/g, ' ').trim();
  if (s.t === 'g') return `<g ${attrs}>${(s.children || []).map((c) => shapeMarkup(c, mode)).join('')}</g>`;
  return `<${s.t === 'poly' ? 'polygon' : s.t} ${attrs}/>`;
}
const inlineMarkup = (def) => def.shapes.map((s) => shapeMarkup(s, 'inline')).join('');
const spriteMarkup = (def) => def.shapes.map((s) => shapeMarkup(s, 'sprite')).join('');

/* ── 3. manifest ──────────────────────────────────────────── */
const IMG_DIR = join(dist, 'img');
const imgIndex = existsSync(join(IMG_DIR, 'index.json'))
  ? JSON.parse(readFileSync(join(IMG_DIR, 'index.json'), 'utf8'))
  : {};

const BADGES = [
  '<g class="sym-badge sym-badge-run"><rect class="sym-badge-bg" x="45" y="1" width="18" height="18" rx="5"/><path class="sym-badge-fg" d="M51.5 5.5 L58.5 10 L51.5 14.5 Z"/></g>',
  '<g class="sym-badge sym-badge-fault"><rect class="sym-badge-bg" x="45" y="1" width="18" height="18" rx="5"/><path class="sym-badge-stroke" d="M54 5.5 V11"/><path class="sym-badge-stroke" d="M54 14 V14.8"/></g>',
  '<g class="sym-badge sym-badge-manual"><rect class="sym-badge-bg" x="45" y="1" width="18" height="18" rx="5"/><path class="sym-badge-stroke" d="M50 14.5 V5.5 L54 11 L58 5.5 V14.5"/></g>',
  '<g class="sym-badge sym-badge-alarm"><rect class="sym-badge-bg" x="45" y="1" width="18" height="18" rx="5"/><path class="sym-badge-fg" d="M54 4 L62 15.5 H46 Z"/><path class="sym-badge-mark" d="M54 8.6 V11.4"/><path class="sym-badge-mark" d="M54 13.4 V14"/></g>',
  '<g class="sym-badge sym-badge-discharge"><rect class="sym-badge-bg" x="45" y="1" width="18" height="18" rx="5"/><path class="sym-badge-stroke" d="M49 5.5 L53.5 9.5"/><path class="sym-badge-stroke" d="M52.5 5.5 L57 9.5"/><path class="sym-badge-stroke" d="M49 12 L53.5 16"/><path class="sym-badge-stroke" d="M52.5 12 L57 16"/></g>'
].join('');

const r2 = (n) => Number(n.toFixed(2));

// 图片版：位图本体 + 状态光晕 + 状态角标 + 可选动态叠加（液位、指针）
// mode=inline 用类名（由 CSS 驱动状态）；mode=sprite 用静态属性（光晕与角标不显示）
function imageMarkup(def, mode = 'inline') {
  const S = 64 / 512;
  const sprite = mode === 'sprite';
  const bbox = imgIndex[def.id]?.bbox;
  let halo = { cx: 32, cy: 32, rx: 27, ry: 27 };
  if (bbox) {
    const [x0, y0, x1, y1] = bbox;
    halo = { cx: ((x0 + x1) / 2) * S, cy: ((y0 + y1) / 2) * S, rx: ((x1 - x0) / 2) * S * 0.82, ry: ((y1 - y0) / 2) * S * 0.82 };
  }
  const parts = [];
  parts.push(sprite
    ? `<ellipse fill="none" stroke="none" cx="${r2(halo.cx)}" cy="${r2(halo.cy)}" rx="${r2(halo.rx)}" ry="${r2(halo.ry)}"/>`
    : `<ellipse class="sym-halo" cx="${r2(halo.cx)}" cy="${r2(halo.cy)}" rx="${r2(halo.rx)}" ry="${r2(halo.ry)}"/>`);
  parts.push(`<image class="sym-img" data-file="${def.id}.png" href="img/${def.id}.png" x="0" y="0" width="64" height="64" preserveAspectRatio="xMidYMid meet"/>`);

  const lv = def.bindings.find((b) => b.kind === 'level');
  if (lv && lv.img) {
    // 图片版液位条：左侧半透明小条，压在位图之上
    const { x, w, bottom, maxH } = lv.img;
    const h = maxH * 0.5;
    parts.push(sprite
      ? `<rect fill="#ffffff" fill-opacity=".82" x="${r2(x - 1)}" y="12" width="${r2(w + 2)}" height="40" rx="2"/>`
      : `<rect class="sym-levelbar-bg" x="${r2(x - 1)}" y="12" width="${r2(w + 2)}" height="40" rx="2"/>`);
    parts.push(`<rect ${sprite ? 'fill="#38bdf8"' : 'class="sym-liquid"'} x="${r2(x)}" y="${r2(bottom - h)}" width="${w}" height="${r2(h)}"/>`);
    parts.push(sprite
      ? `<rect fill="none" stroke="#94a3b8" stroke-width="1" x="${r2(x - 1)}" y="12" width="${r2(w + 2)}" height="40" rx="2"/>`
      : `<rect class="sym-levelbar-fg" x="${r2(x - 1)}" y="12" width="${r2(w + 2)}" height="40" rx="2"/>`);
  }
  if (def.img?.needle) {
    const n = def.img.needle;
    parts.push(`<line class="sym-needle" x1="${n.x1}" y1="${n.y1}" x2="${n.x2}" y2="${n.y2}" transform="rotate(${n.angle ?? 0} ${n.pivot[0]} ${n.pivot[1]})"/>`);
  }
  parts.push(sprite ? '' : BADGES);
  return parts.join('');
}

const manifestSymbols = [];
for (const def of SYMBOLS) {
  annotate(def);
  let ti = 0;
  const bindings = def.bindings.map((b) => {
    const o = { ...b };
    if (b.kind === 'text') { o.textIndex = ti++; }
    if (b.spin) {
      if (!def._rotors.length) err(`${def.id} 绑定「${b.name}」声明 spin 但图元内无 rotor 元素`);
      else o.spinTarget = def._rotors[0];
    }
    if (b.kind === 'angle') {
      if (!def._needles.length) err(`${def.id} 绑定「${b.name}」声明 angle 但图元内无 needle 元素`);
      else o.needleTarget = def._needles[0];
    }
    return o;
  });

  manifestSymbols.push({
    id: def.id, name: def.name, category: def.category, system: systemOf(def),
    screen: def.screen || SCREENS[def.category] || null,
    desc: def.desc || '',
    size: { w: SPEC.canvas.w, h: SPEC.canvas.h },
    anchor: SPEC.anchor,
    ports: def.ports || [],
    pivots: def._pivots,
    image: existsSync(join(IMG_DIR, `${def.id}.png`)) ? `img/${def.id}.png` : null,
    styles: existsSync(join(IMG_DIR, `${def.id}.png`)) ? ['line', 'image'] : ['line'],
    bindings
  });
}

// 分类树：一级为系统归属，二级为部件类别
const systemMeta = SYSTEMS.map((sys) => ({
  key: sys.key,
  name: sys.name,
  desc: sys.desc || '',
  categories: CATEGORIES.filter((c) => c.system === sys.key).map((c) => c.key),
  symbols: manifestSymbols.filter((s) => s.system === sys.key).map((s) => s.id),
}));

const categoryMeta = CATEGORIES.map((c) => ({
  key: c.key,
  name: c.key,
  system: c.system,
  screen: c.screen,
  count: manifestSymbols.filter((s) => s.category === c.key).length,
}));

const manifest = {
  name: '消防系统图元库',
  version: VERSION,
  spec: {
    canvas: SPEC.canvas, anchor: SPEC.anchor, grid: SPEC.grid,
    roles: Object.fromEntries(Object.entries(SPEC.roles).map(([k, v]) => [k, { cls: v.cls, css: v.inline }])),
    stateColors: {
      'is-run': '运行', 'is-off': '停机/备用', 'is-fault': '故障', 'is-manual': '手动',
      'is-open': '阀开', 'is-closed': '阀关', 'is-over': '溢流/超高', 'is-flow': '过流',
      'is-alarm': '报警', 'is-discharge': '喷放'
    }
  },
  screens: SCREENS,
  systems: systemMeta,
  categories: categoryMeta,
  symbols: manifestSymbols
};

/* ── 4. 点表 ──────────────────────────────────────────────── */
const rows = [];
const seenPoints = new Map();
let aiAddr = 0, diAddr = 0;
for (const s of manifestSymbols) {
  for (const b of s.bindings) {
    if (seenPoints.has(b.point)) err(`点名重复：${b.point}（${seenPoints.get(b.point)} 与 ${s.id}）`);
    else seenPoints.set(b.point, s.id);
    const isAI = b.kind !== 'bool';
    const addr = isAI ? `3x${String(++aiAddr).padStart(4, '0')}` : `1x${String(++diAddr).padStart(4, '0')}`;
    rows.push({
      点名: b.point,
      图元ID: s.id,
      图元名称: s.name,
      系统: SYS_MAP.get(s.system)?.name || s.system,
      分类: s.category,
      绑定: b.name,
      数据类型: isAI ? 'AI' : 'DI',
      寄存器: addr,
      读写: '只读',
      量程下限: b.min !== undefined ? b.min : (isAI ? '' : 0),
      量程上限: b.max !== undefined ? b.max : (isAI ? '' : 1),
      单位: b.unit || '',
      报警下限: b.alarmLo !== undefined ? b.alarmLo : '',
      报警上限: b.alarmHi !== undefined ? b.alarmHi : '',
      死区: isAI ? 0.5 : 0,
      延时s: isAI ? 2 : 0,
      画面: s.screen || SCREENS[s.category] || 'G01 系统总貌',
      说明: `${b.name}（示例限值，须按现场整定）`
    });
  }
}
const CSV_COLS = ['点名', '图元ID', '图元名称', '系统', '分类', '绑定', '数据类型', '寄存器', '读写', '量程下限', '量程上限', '单位', '报警下限', '报警上限', '死区', '延时s', '画面', '说明'];
const csv = [CSV_COLS.join(',')].concat(
  rows.map((r) => CSV_COLS.map((c) => {
    const v = r[c];
    return /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
  }).join(','))
).join('\n');

/* ── 5. 校验 ──────────────────────────────────────────────── */
const PORT_DIRS = ['left', 'right', 'up', 'down'];
const stateClassSet = new Set(Object.keys(manifest.spec.stateColors));
const ids = new Set();
for (const s of manifestSymbols) {
  if (ids.has(s.id)) err(`图元 ID 重复：${s.id}`);
  ids.add(s.id);
  if (!ID_RE.test(s.id)) err(`图元 ID 不符合命名规范：${s.id}`);
  if (!CAT_MAP.has(s.category)) err(`${s.id} 引用了未声明的分类：${s.category}`);
  if (!s.system) err(`${s.id} 未解析到所属系统`);
  else if (!SYS_MAP.has(s.system)) err(`${s.id} 引用了未声明的系统：${s.system}`);
  if (!s.bindings.length) err(`${s.id} 未定义任何动态绑定`);
  for (const p of s.ports) {
    if (p.x < 0 || p.x > 64 || p.y < 0 || p.y > 64) err(`${s.id} 连接点越界：${p.x},${p.y}`);
    if (!PORT_DIRS.includes(p.dir)) err(`${s.id} 连接点方向非法：${p.dir}（应为 ${PORT_DIRS.join('/')}）`);
  }
  for (const b of s.bindings) {
    for (const c of [...(b.onClass || []), ...(b.offClass || [])]) {
      if (!stateClassSet.has(c)) err(`${s.id} 绑定「${b.name}」使用了未声明的状态类 ${c}`);
    }
  }
  if (s.pivots) {
    for (const [sel, pv] of Object.entries(s.pivots)) {
      if (!pv) err(`${s.id} ${sel} 缺少轴心`);
    }
  }
  // 几何中不得含颜色属性
  const walk = (shapes) => {
    for (const sh of shapes) {
      if ('fill' in sh || 'stroke' in sh) err(`${s.id} 几何中含颜色属性，颜色应由 CSS 变量驱动`);
      if (sh.children) walk(sh.children);
    }
  };
  walk(s.shapes || []);
}
for (const s of manifestSymbols) {
  const ok = s.bindings.every((b) => rows.some((r) => r.点名 === b.point));
  if (!ok) err(`${s.id} 存在未进入点表的绑定`);
}

// 分类表自身
{
  const seen = new Set();
  for (const c of CATEGORIES) {
    if (seen.has(c.key)) err(`分类重复：${c.key}`);
    seen.add(c.key);
    if (!SYS_MAP.has(c.system)) err(`分类 ${c.key} 归属了未声明的系统：${c.system}`);
    if (!c.screen) err(`分类 ${c.key} 未声明建议画面编号`);
    const n = manifestSymbols.filter((s) => s.category === c.key).length;
    if (!n) warn(`分类 ${c.key} 下没有任何图元`);
  }
  for (const s of SYSTEMS) {
    const n = manifestSymbols.filter((x) => x.system === s.key).length;
    if (!n) warn(`系统 ${s.key} 下没有任何图元`);
  }
}

/* ── 6. 产物 ──────────────────────────────────────────────── */
const GEOMETRY = Object.fromEntries(SYMBOLS.map((d) => [d.id, inlineMarkup(d)]));
const withImage = manifestSymbols.filter((s) => s.image);
const GEOMETRY_IMAGE = Object.fromEntries(
  SYMBOLS.filter((d) => withImage.some((s) => s.id === d.id)).map((d) => [d.id, imageMarkup(d)])
);

writeFileSync(join(dist, 'symbols.js'),
  `// 自动生成，勿手改。改 src/symbols.source.js 后运行 npm run build\nexport const MANIFEST = ${JSON.stringify(manifest, null, 2)};\nexport const GEOMETRY = ${JSON.stringify(GEOMETRY, null, 2)};\nexport const GEOMETRY_IMAGE = ${JSON.stringify(GEOMETRY_IMAGE, null, 2)};\n`);

const runtimeSrc = readFileSync(join(here, 'runtime.js'), 'utf8');
writeFileSync(join(dist, 'runtime.js'),
  `// 自动生成，勿手改。\nimport { MANIFEST, GEOMETRY, GEOMETRY_IMAGE } from './symbols.js';\n${runtimeSrc}\nexport const runtime = createRuntime(MANIFEST, GEOMETRY, GEOMETRY_IMAGE);\n`);

writeFileSync(join(dist, 'symbols.css'), readFileSync(join(here, 'symbols.css'), 'utf8'));

const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
${SYMBOLS.map((d) => `  <symbol id="${d.id}" viewBox="0 0 ${SPEC.canvas.w} ${SPEC.canvas.h}">${spriteMarkup(d)}</symbol>`).join('\n')}
</svg>
`;
writeFileSync(join(dist, 'symbols.svg'), sprite);

// 图片版精灵图：位图 + 光晕 + 角标
const spriteImg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none">
${Object.keys(GEOMETRY_IMAGE).map((id) => {
  const d = SYMBOLS.find((x) => x.id === id);
  return `  <symbol id="${id}" viewBox="0 0 ${SPEC.canvas.w} ${SPEC.canvas.h}">${imageMarkup(d, 'sprite')}</symbol>`;
}).join('\n')}
</svg>
`;
writeFileSync(join(dist, 'symbols-img.svg'), spriteImg);

writeFileSync(join(dist, 'manifest.json'), JSON.stringify(manifest, null, 2));
writeFileSync(join(dist, 'points.sample.csv'), '﻿' + csv);

/* ── 7. 预览页（自包含，双击可打开） ───────────────────────── */
const catList = CATEGORIES.map((c) => c.key);
const pointCount = rows.length;
const previewHTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>消防给水图元库 · ${manifestSymbols.length} 图元预览</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
__CSS__
:root{
  --bg:#fafafa; --card:#fff; --line:#e4e4e7; --line-soft:#f1f1f4;
  --ink:#18181b; --muted:#71717a; --accent:#10b981; --accent-soft:rgba(16,185,129,.10);
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:'Outfit',system-ui,sans-serif;font-size:15px;line-height:1.55}
.wrap{max-width:1180px;margin:0 auto;padding:48px 24px 72px}
h1{font-size:32px;line-height:1.2;font-weight:600;letter-spacing:-.02em;margin:0 0 6px}
h2{font-size:22px;font-weight:600;letter-spacing:-.01em;margin:0 0 4px}
.sub{color:var(--muted);font-size:14px;margin:0}
.stats{display:flex;gap:28px;flex-wrap:wrap;margin:24px 0 0;padding:16px 20px;background:var(--card);border:1px solid var(--line);border-radius:16px}
.stat b{display:block;font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:500;line-height:1.3}
.stat span{color:var(--muted);font-size:12px}
.toolbar{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:28px 0 20px;position:sticky;top:0;background:var(--bg);padding:12px 0;z-index:5}
input[type=search]{flex:1;min-width:200px;padding:10px 14px;border:1px solid var(--line);border-radius:10px;font:inherit;font-size:14px;background:var(--card)}
input[type=search]:focus{outline:2px solid var(--accent);outline-offset:-1px;border-color:transparent}
.chip{font-size:13px;padding:7px 14px;border-radius:999px;border:1px solid var(--line);background:var(--card);cursor:pointer;font-family:inherit;transition:all .18s}
.chip:hover{border-color:var(--accent);color:var(--accent)}
.chip.on{background:var(--accent);border-color:var(--accent);color:#fff}
.chips{display:flex;gap:8px;flex-wrap:wrap}
label.toggle{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);cursor:pointer;user-select:none}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;transition:transform .2s,box-shadow .2s;display:flex;gap:16px}
.card:hover{transform:translateY(-2px);box-shadow:0 4px 16px -2px rgba(0,0,0,.06)}
.glyph{flex:0 0 88px;height:88px;display:grid;place-items:center;background:var(--line-soft);border-radius:12px}
.glyph svg{width:76px;height:auto;max-height:76px}
.meta{min-width:0;flex:1}
.meta .top{display:flex;align-items:center;gap:8px;justify-content:space-between}
.id{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--accent);background:var(--accent-soft);padding:2px 7px;border-radius:6px;white-space:nowrap}
.cat{font-size:11px;color:var(--muted);white-space:nowrap}
.meta h3{font-size:16px;font-weight:600;margin:8px 0 2px}
.meta p{font-size:12.5px;color:var(--muted);margin:0 0 8px}
.bind{list-style:none;margin:0;padding:0;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted);display:flex;flex-direction:column;gap:3px}
.bind li{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bind b{color:var(--ink);font-weight:500}
.legend{display:flex;gap:18px;flex-wrap:wrap;margin-top:12px;font-size:13px}
.legend i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-1px}
.panel{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px;margin-top:44px}
.kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px 28px;margin:16px 0 0}
.kv div b{display:block;font-size:13px;color:var(--muted);font-weight:400;margin-bottom:2px}
.kv div code{font-family:'JetBrains Mono',monospace;font-size:13px}
table{width:100%;border-collapse:collapse;font-size:13.5px;margin-top:14px}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line-soft)}
th{color:var(--muted);font-weight:500;font-size:12px}
td code{font-family:'JetBooks Mono',monospace;font-size:12.5px}
td code,.mono{font-family:'JetBrains Mono',monospace;font-size:12.5px}
footer{margin-top:28px;color:var(--muted);font-size:12.5px}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>消防系统图元库</h1>
    <p class="sub">Web 端 SVG 精灵图 · ${manifestSymbols.length} 个图元 / ${pointCount} 个动态绑定点 · 规范 v${VERSION}</p>
    <div class="stats">
      <div class="stat"><b>${manifestSymbols.length}</b><span>图元</span></div>
      <div class="stat"><b>${SYSTEMS.length}</b><span>系统</span></div>
      <div class="stat"><b>${catList.length}</b><span>分类</span></div>
      <div class="stat"><b>${pointCount}</b><span>绑定点</span></div>
      <div class="stat"><b>64×64</b><span>画布 / 锚点 32,32</span></div>
      <div class="stat"><b>${withImage.length}</b><span>图片版</span></div>
      <div class="stat"><b>${errors.length}</b><span>校验错误</span></div>
    </div>
  </header>

  <div class="toolbar">
    <input type="search" id="q" placeholder="搜索 图元名 / ID / 绑定点名" autocomplete="off">
    <div class="chips" id="styles"></div>
    <div class="chips" id="syschips"></div>
    <div class="chips" id="cats"></div>
    <div class="chips" id="states"></div>
    <label class="toggle"><input type="checkbox" id="ports"> 显示连接点</label>
  </div>

  <main class="grid" id="grid"></main>

  <section class="panel">
    <h2>状态配色</h2>
    <p class="sub">线框版颜色由 CSS 变量驱动，几何本身不含 fill/stroke；图片版位图不可变色，状态改由光晕与角标表达。</p>
    <div class="legend" id="legend"></div>
  </section>

  <section class="panel">
    <h2>图元规范</h2>
    <div class="kv">
      <div><b>画布 / 锚点</b><code>64×64 / (32,32)</code></div>
      <div><b>网格</b><code>8 px</code></div>
      <div><b>线宽</b><code>轮廓 2 / 管道 8</code></div>
      <div><b>命名</b><code>类别-对象-序号</code></div>
      <div><b>绑定类型</b><code>bool / level / angle / text</code></div>
      <div><b>点表来源</b><code>points.sample.csv</code></div>
    </div>
  </section>

  <section class="panel">
    <h2>画面分配</h2>
    <table>
      <thead><tr><th>画面</th><th>对应分类</th><th>图元数</th></tr></thead>
      <tbody id="screens"></tbody>
    </table>
  </section>

  <footer>由 <span class="mono">npm run build</span> 自动生成 · 源文件 <span class="mono">src/symbols.source.js</span></footer>
</div>

<script type="module">
const MANIFEST = __MANIFEST__;
const GEOMETRY = __GEOMETRY__;
const GEOMETRY_IMAGE = __GEOMETRY_IMAGE__;
__RUNTIME__

const rt = createRuntime(MANIFEST, GEOMETRY, GEOMETRY_IMAGE);
const grid = document.getElementById('grid');
const cats = document.getElementById('cats');
const states = document.getElementById('states');
const styles = document.getElementById('styles');
const syschips = document.getElementById('syschips');
let activeCat = 'ALL';
let activeSys = 'ALL';
let activeState = 'none';
let activeStyle = 'image';

const STYLE_BTNS = [['image','图片版'],['line','线框版']];
const hasImage = MANIFEST.symbols.filter(s=>s.image).length;
styles.innerHTML = STYLE_BTNS.map(([c,l])=>'<button class="chip'+(c===activeStyle?' on':'')+'" data-style="'+c+'">'+l+'</button>').join('')
  + '<span class="mono" style="font-size:12px;color:var(--muted);align-self:center">图片 '+hasImage+'/'+MANIFEST.symbols.length+'</span>';
styles.addEventListener('click', e=>{
  const b = e.target.closest('.chip'); if(!b) return;
  activeStyle = b.dataset.style;
  styles.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on', x===b));
  draw();
});

const STATE_BTNS = [
  ['none','正常'],['is-run','运行'],['is-off','停机'],['is-fault','故障'],['is-manual','手动'],['is-open','阀开'],['is-closed','阀关'],
  ['is-alarm','报警'],['is-discharge','喷放']
];

syschips.innerHTML = ['ALL'].concat(MANIFEST.systems.map(s=>s.key))
  .map(k=>'<button class="chip'+(k==='ALL'?' on':'')+'" data-sys="'+k+'">'
    +(k==='ALL'?'全部系统':(MANIFEST.systems.find(s=>s.key===k)||{}).name)+'</button>').join('');
syschips.addEventListener('click', e=>{
  const b = e.target.closest('.chip'); if(!b) return;
  activeSys = b.dataset.sys;
  syschips.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on', x===b));
  buildCatChips();
  draw();
});

function buildCatChips(){
  const list = MANIFEST.categories
    .filter(c => activeSys==='ALL' || c.system===activeSys || c.system==='common')
    .map(c=>c.key);
  cats.innerHTML = ['ALL'].concat(list)
    .map(c=>'<button class="chip'+(c==='ALL'?' on':'')+'" data-cat="'+c+'">'+(c==='ALL'?'全部分类':c)+'</button>').join('');
}
buildCatChips();
cats.addEventListener('click', e=>{
  const b = e.target.closest('.chip'); if(!b) return;
  activeCat = b.dataset.cat;
  cats.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on', x===b));
  draw();
});

states.innerHTML = STATE_BTNS.map(([c,l])=>'<button class="chip'+(c==='none'?' on':'')+'" data-state="'+c+'">'+l+'</button>').join('');
states.addEventListener('click', e=>{
  const b = e.target.closest('.chip'); if(!b) return;
  activeState = b.dataset.state;
  states.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on', x===b));
  draw();
});

document.getElementById('ports').addEventListener('change', draw);
document.getElementById('q').addEventListener('input', draw);

const swatch = { 'is-run':'#22c55e','is-off':'#cbd5e1','is-fault':'#ef4444','is-manual':'#eab308','is-open':'#22c55e','is-closed':'#cbd5e1','is-over':'#ef4444','is-flow':'#38bdf8','is-alarm':'#f97316','is-discharge':'#b91c1c' };
document.getElementById('legend').innerHTML = Object.entries(MANIFEST.spec.stateColors)
  .map(([k,v])=>'<span><i style="background:'+(swatch[k]||'#94a3b8')+'"></i>'+v+' <span class="mono">'+k+'</span></span>').join('');

const scrMap = {};
MANIFEST.symbols.forEach(s=>{ const k=s.screen||'G01 系统总貌'; scrMap[k]=(scrMap[k]||0)+1; });
document.getElementById('screens').innerHTML = Object.entries(scrMap)
  .map(([k,v])=>'<tr><td class="mono">'+k.split(' ')[0]+'</td><td>'+k.split(' ')[1]+'</td><td>'+v+'</td></tr>').join('');

function draw(){
  const q = document.getElementById('q').value.trim().toLowerCase();
  const showPorts = document.getElementById('ports').checked;
  const list = MANIFEST.symbols.filter(s=>{
    if (activeSys!=='ALL' && s.system!==activeSys && s.system!=='common') return false;
    if (activeCat!=='ALL' && s.category!==activeCat) return false;
    if (!q) return true;
    const hay = (s.id+' '+s.name+' '+s.desc+' '+s.bindings.map(b=>b.point+' '+b.name).join(' ')).toLowerCase();
    return hay.includes(q);
  });
  grid.innerHTML='';
  list.forEach(s=>{
    const card = document.createElement('article');
    card.className='card';
    const glyph = document.createElement('div'); glyph.className='glyph';
    const style = (activeStyle==='image' && s.image) ? 'image' : 'line';
    const svg = rt.renderSymbol(s.id, {size:76, showPorts, style});
    if (activeState!=='none') svg.classList.add(activeState);
    glyph.appendChild(svg);
    const meta = document.createElement('div'); meta.className='meta';
    meta.innerHTML =
      '<div class="top"><span class="id">'+s.id+'</span><span class="cat">'
        +(MANIFEST.systems.find(x=>x.key===s.system)||{}).name+' / '+s.category
        +(s.image?'':' · 仅线框')+'</span></div>'+
      '<h3>'+s.name+'</h3><p>'+(s.desc||'')+'</p>'+
      '<ul class="bind">'+s.bindings.map(b=>'<li><b>'+b.name+'</b> · '+b.point+'</li>').join('')+'</ul>';
    card.appendChild(glyph); card.appendChild(meta); grid.appendChild(card);
  });
}
draw();
</script>
</body>
</html>
`;

writeFileSync(join(dist, 'preview.html'),
  previewHTML
    .replace('__CSS__', readFileSync(join(here, 'symbols.css'), 'utf8'))
    .replace('__MANIFEST__', JSON.stringify(manifest))
    .replace('__GEOMETRY__', JSON.stringify(GEOMETRY))
    .replace('__GEOMETRY_IMAGE__', JSON.stringify(GEOMETRY_IMAGE))
    .replace('__RUNTIME__', runtimeSrc));

/* ── 7b. 示例组态画面 / 组态编辑器 ───────────────────────── */
const demoTpl = readFileSync(join(here, 'demo.template.html'), 'utf8');
writeFileSync(join(dist, 'demo.html'),
  demoTpl
    .replace('__CSS__', readFileSync(join(here, 'symbols.css'), 'utf8'))
    .replace('__MANIFEST__', JSON.stringify(manifest))
    .replace('__GEOMETRY__', JSON.stringify(GEOMETRY))
    .replace('__GEOMETRY_IMAGE__', JSON.stringify(GEOMETRY_IMAGE))
    .replace('__RUNTIME__', runtimeSrc));

// 组态编辑器：可放置图元、拉连线、存盘导出
const LAYOUT_DIR = join(here, 'layouts');
mkdirSync(join(dist, 'layouts'), { recursive: true });
const layoutFiles = existsSync(LAYOUT_DIR) ? readdirSync(LAYOUT_DIR).filter((f) => f.endsWith('.json')) : [];
const layouts = {};
for (const f of layoutFiles) {
  const raw = readFileSync(join(LAYOUT_DIR, f), 'utf8');
  layouts[f] = JSON.parse(raw);
  writeFileSync(join(dist, 'layouts', f), raw);
}
// 编辑器「载入示例」可选的示例画面（按文件名排序）
const SAMPLES = layoutFiles
  .slice()
  .sort()
  .map((f) => ({ key: f, name: layouts[f].name || f, layout: layouts[f] }));
const editorTpl = readFileSync(join(here, 'editor.template.html'), 'utf8');
writeFileSync(join(dist, 'editor.html'),
  editorTpl
    .replace('__CSS__', readFileSync(join(here, 'symbols.css'), 'utf8'))
    .replace('__MANIFEST__', JSON.stringify(manifest))
    .replace('__GEOMETRY__', JSON.stringify(GEOMETRY))
    .replace('__GEOMETRY_IMAGE__', JSON.stringify(GEOMETRY_IMAGE))
    .replace('__SAMPLES__', JSON.stringify(SAMPLES))
    .replace('__RUNTIME__', runtimeSrc));

/* ── 8. 结果 ──────────────────────────────────────────────── */
console.log(`图元 ${manifestSymbols.length} · 绑定点 ${rows.length} · 分类 ${catList.length}`);
console.log(`产物：dist/{symbols.js, symbols.svg, symbols.css, runtime.js, manifest.json, points.sample.csv, preview.html}`);
if (warns.length) { console.log('\n警告：'); warns.forEach((w) => console.log('  ! ' + w)); }
if (errors.length) {
  console.error(`\n校验未通过，共 ${errors.length} 项：`);
  errors.forEach((e) => console.error('  ✗ ' + e));
  process.exit(1);
}
console.log('\n校验通过：ID 唯一与命名规范 / 连接点边界 / 绑定点入表 / 几何无颜色属性 / 旋转轴心齐全');
