// 图元库唯一真源。改这里 → 跑 `node build.mjs` → dist/ 全部产物更新。
// 约定：几何只写形状与角色(role)，不写 fill/stroke/颜色，颜色一律由 CSS 变量驱动。

export const SPEC = {
  canvas: { w: 64, h: 64 },
  anchor: [32, 32],
  grid: 8,
  roles: {
    body:   { cls: 'sym-body',   inline: 'fill:var(--sym-fill);stroke:var(--sym-stroke);stroke-width:2;stroke-linejoin:round', sprite: { fill: '#e2e8f0', stroke: '#334155', 'stroke-width': 2, 'stroke-linejoin': 'round' } },
    outline:{ cls: 'sym-outline',inline: 'fill:none;stroke:var(--sym-stroke);stroke-width:2;stroke-linejoin:round', sprite: { fill: 'none', stroke: '#334155', 'stroke-width': 2, 'stroke-linejoin': 'round' } },
    pipe:   { cls: 'sym-pipe',   inline: 'fill:none;stroke:var(--sym-stroke);stroke-width:8;stroke-linecap:butt', sprite: { fill: 'none', stroke: '#334155', 'stroke-width': 8, 'stroke-linecap': 'butt' } },
    line:   { cls: 'sym-line',   inline: 'fill:none;stroke:var(--sym-stroke);stroke-width:2;stroke-linecap:round', sprite: { fill: 'none', stroke: '#334155', 'stroke-width': 2, 'stroke-linecap': 'round' } },
    band:   { cls: 'sym-band',   inline: 'fill:var(--sym-fill);stroke:var(--sym-stroke);stroke-width:2;stroke-linejoin:round', sprite: { fill: '#e2e8f0', stroke: '#334155', 'stroke-width': 2, 'stroke-linejoin': 'round' } },
    accent: { cls: 'sym-accent', inline: 'fill:var(--sym-accent);stroke:none', sprite: { fill: '#2563eb', stroke: 'none' } },
    liquid: { cls: 'sym-liquid', inline: 'fill:var(--sym-liquid);stroke:none', sprite: { fill: '#38bdf8', stroke: 'none' } },
    rotor:  { cls: 'sym-rotor',  inline: 'fill:none;stroke:var(--sym-on);stroke-width:2;stroke-linecap:round', sprite: { fill: 'none', stroke: '#ffffff', 'stroke-width': 2, 'stroke-linecap': 'round' } },
    needle: { cls: 'sym-needle', inline: 'fill:none;stroke:var(--sym-alarm);stroke-width:2;stroke-linecap:round', sprite: { fill: 'none', stroke: '#dc2626', 'stroke-width': 2, 'stroke-linecap': 'round' } }
  }
};

// 泵叶轮（3 片），center 为泵圆心
const blades = (cx, cy, r1, r2) => {
  const p = (a, r) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const f = (n) => n.toFixed(2);
  return [30, 150, 270].map((a) => {
    const [x1, y1] = p(a, r1), [x2, y2] = p(a, r2);
    return { t: 'line', x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2) };
  });
};

const bowtie = (y = 32) => ([
  { t: 'poly', role: 'body', points: `20,${y - 12} 20,${y + 12} 32,${y}` },
  { t: 'poly', role: 'body', points: `44,${y - 12} 44,${y + 12} 32,${y}` }
]);

const stubs = () => ([
  { t: 'line', role: 'line', x1: 4, y1: 32, x2: 20, y2: 32 },
  { t: 'line', role: 'line', x1: 44, y1: 32, x2: 60, y2: 32 }
]);

// ── 分类体系 ────────────────────────────────────────────────
// 一级：系统归属（与平台 systemKey 同源 pipeline/gas/smoke/common）
// 二级：部件类别
//
// 分类表是分类的唯一真源。图元只引用分类键；系统归属默认取分类的 system，
// 个别图元可用自身 system 字段覆盖（如钢瓶压力表属气体灭火，但归在通用「仪表」类）。
// 新增分类只改这里，构建时校验图元引用的分类与系统必须已声明。

export const SYSTEMS = [
  { key: 'pipeline', name: '消防给水', desc: '水源、泵组、末端设施与接合器' },
  { key: 'gas', name: '气体灭火', desc: '储存装置、驱动装置、灭火剂管网、探测报警、控制与辅助设施' },
  { key: 'smoke', name: '消防防排烟', desc: '风机与风阀（预留）' },
  { key: 'common', name: '通用件', desc: '跨系统共用的管道管件、阀门、仪表与电气件' },
];

export const CATEGORIES = [
  // ── 消防给水 ──
  { key: '水源', system: 'pipeline', screen: 'G02 水源监控' },
  { key: '泵组', system: 'pipeline', screen: 'G03 水泵房' },
  { key: '末端设施', system: 'pipeline', screen: 'G05 末端设施' },
  { key: '接合器', system: 'pipeline', screen: 'G05 末端设施' },
  // ── 气体灭火 ──
  { key: '储存装置', system: 'gas', screen: 'G07 气体灭火总貌' },
  { key: '驱动装置', system: 'gas', screen: 'G07 气体灭火总貌' },
  { key: '灭火剂管网', system: 'gas', screen: 'G07 气体灭火总貌' },
  { key: '探测报警', system: 'gas', screen: 'G07 气体灭火总貌' },
  { key: '控制', system: 'gas', screen: 'G07 气体灭火总貌' },
  { key: '辅助设施', system: 'gas', screen: 'G07 气体灭火总貌' },
  // ── 通用件 ──
  { key: '管道管件', system: 'common', screen: 'G04 管网压力' },
  { key: '阀门', system: 'common', screen: 'G04 管网压力' },
  { key: '仪表', system: 'common', screen: 'G06 仪表趋势' },
  { key: '电气', system: 'common', screen: 'G03 水泵房' },
];

export const SYMBOLS = [
  // ── 水源 ────────────────────────────────────────────────
  {
    id: 'TNK-FIRE-01', name: '消防水池', category: '水源',
    desc: '正方形敞口水池剖面，内含水；含液位显示与溢流报警',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '液位', kind: 'level', point: 'TNK_FIRE_01_LV', min: 0, max: 100, unit: '%', bottom: 51, maxH: 30, alarmHi: 90, alarmLo: 15 },
      { name: '溢流', kind: 'bool', point: 'TNK_FIRE_01_OVF', onClass: ['is-over'] }
    ],
    shapes: [
      { t: 'rect', role: 'liquid', x: 13, y: 31, width: 38, height: 20 },
      { t: 'line', role: 'line', x1: 13, y1: 31, x2: 51, y2: 31 },
      { t: 'line', role: 'line', x1: 10, y1: 10, x2: 10, y2: 54 },
      { t: 'line', role: 'line', x1: 54, y1: 10, x2: 54, y2: 54 },
      { t: 'line', role: 'line', x1: 10, y1: 54, x2: 54, y2: 54 },
      { t: 'line', role: 'line', x1: 10, y1: 10, x2: 17, y2: 10 },
      { t: 'line', role: 'line', x1: 47, y1: 10, x2: 54, y2: 10 }
    ]
  },
  {
    id: 'RES-TANK-01', name: '消防水箱', category: '水源',
    desc: '矩形平顶水箱剖面，内含水；含液位与溢流',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '液位', kind: 'level', point: 'RES_TANK_01_LV', min: 0, max: 100, unit: '%', bottom: 48, maxH: 26, alarmHi: 90, alarmLo: 15 },
      { name: '溢流', kind: 'bool', point: 'RES_TANK_01_OVF', onClass: ['is-over'] }
    ],
    shapes: [
      { t: 'rect', role: 'liquid', x: 15, y: 30, width: 34, height: 18 },
      { t: 'line', role: 'line', x1: 15, y1: 30, x2: 49, y2: 30 },
      { t: 'rect', role: 'outline', x: 13, y: 14, width: 38, height: 34, rx: 2 },
      { t: 'rect', role: 'body', x: 11, y: 9, width: 42, height: 5, rx: 1 }
    ]
  },

  // ── 泵组 ────────────────────────────────────────────────
  {
    id: 'PMP-FIRE-01', name: '消防泵', category: '泵组',
    desc: '运行旋转、故障红闪、手自动黄标',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '运行', kind: 'bool', point: 'PMP_FIRE_01_RUN', onClass: ['is-run'], offClass: ['is-off'], spin: true },
      { name: '故障', kind: 'bool', point: 'PMP_FIRE_01_FAULT', onClass: ['is-fault'] },
      { name: '手自动', kind: 'bool', point: 'PMP_FIRE_01_MODE', onClass: ['is-manual'] },
      { name: '出口压力', kind: 'text', point: 'PMP_FIRE_01_PRESS', unit: 'MPa' }
    ],
    shapes: [
      { t: 'line', role: 'line', x1: 4, y1: 32, x2: 17, y2: 32 },
      { t: 'circle', role: 'body', cx: 32, cy: 32, r: 15 },
      { t: 'g', role: 'rotor', pivot: [32, 32], children: blades(32, 32, 5, 12) },
      { t: 'poly', role: 'accent', points: '47,25 47,39 56,32' }
    ]
  },
  {
    id: 'PMP-STBY-01', name: '备用泵', category: '泵组',
    desc: '虚线轮廓表示备用，与主泵同一套状态属性',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '运行', kind: 'bool', point: 'PMP_STBY_01_RUN', onClass: ['is-run'], offClass: ['is-off'], spin: true },
      { name: '故障', kind: 'bool', point: 'PMP_STBY_01_FAULT', onClass: ['is-fault'] },
      { name: '手自动', kind: 'bool', point: 'PMP_STBY_01_MODE', onClass: ['is-manual'] },
      { name: '出口压力', kind: 'text', point: 'PMP_STBY_01_PRESS', unit: 'MPa' }
    ],
    shapes: [
      { t: 'line', role: 'line', x1: 4, y1: 32, x2: 17, y2: 32 },
      { t: 'circle', role: 'body', cx: 32, cy: 32, r: 15, extra: ['sym-dashed'] },
      { t: 'g', role: 'rotor', pivot: [32, 32], children: blades(32, 32, 5, 12) },
      { t: 'poly', role: 'accent', points: '47,25 47,39 56,32' }
    ]
  },
  {
    id: 'PMP-STAB-01', name: '稳压泵', category: '泵组',
    desc: '小口径泵，带上部气罐接口',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '运行', kind: 'bool', point: 'PMP_STAB_01_RUN', onClass: ['is-run'], offClass: ['is-off'], spin: true },
      { name: '故障', kind: 'bool', point: 'PMP_STAB_01_FAULT', onClass: ['is-fault'] },
      { name: '手自动', kind: 'bool', point: 'PMP_STAB_01_MODE', onClass: ['is-manual'] },
      { name: '压力', kind: 'text', point: 'PMP_STAB_01_PRESS', unit: 'MPa' }
    ],
    shapes: [
      { t: 'circle', role: 'outline', cx: 32, cy: 32, r: 11 },
      { t: 'g', role: 'rotor', pivot: [32, 32], children: blades(32, 32, 4, 9) },
      { t: 'line', role: 'line', x1: 32, y1: 21, x2: 32, y2: 17 },
      { t: 'circle', role: 'outline', cx: 32, cy: 12, r: 5 }
    ]
  },
  {
    id: 'VES-PRE-01', name: '稳压气压罐', category: '泵组',
    desc: '胶囊形罐体，出口在底部',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '压力', kind: 'text', point: 'VES_PRE_01_PRESS', unit: 'MPa' },
      { name: '故障', kind: 'bool', point: 'VES_PRE_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      { t: 'rect', role: 'outline', x: 22, y: 6, width: 20, height: 46, rx: 10 },
      { t: 'line', role: 'line', x1: 24, y1: 30, x2: 40, y2: 30 },
      { t: 'line', role: 'line', x1: 32, y1: 52, x2: 32, y2: 58 },
      { t: 'line', role: 'line', x1: 24, y1: 58, x2: 40, y2: 58 }
    ]
  },
  {
    id: 'PMP-SET-01', name: '消防泵组', category: '泵组',
    desc: '一用一备：实线为主泵，虚线为备用',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '主泵运行', kind: 'bool', point: 'PMP_SET_01_RUN', onClass: ['is-run'], offClass: ['is-off'], spin: true },
      { name: '故障', kind: 'bool', point: 'PMP_SET_01_FAULT', onClass: ['is-fault'] },
      { name: '手自动', kind: 'bool', point: 'PMP_SET_01_MODE', onClass: ['is-manual'] },
      { name: '出口压力', kind: 'text', point: 'PMP_SET_01_PRESS', unit: 'MPa' }
    ],
    shapes: [
      { t: 'rect', role: 'outline', x: 4, y: 10, width: 56, height: 44, rx: 4, extra: ['sym-dashed'] },
      { t: 'circle', role: 'body', cx: 21, cy: 32, r: 10 },
      { t: 'g', role: 'rotor', pivot: [21, 32], children: blades(21, 32, 3, 7) },
      { t: 'circle', role: 'outline', cx: 43, cy: 32, r: 10, extra: ['sym-dashed'] },
      { t: 'g', role: 'rotor', pivot: [43, 32], children: blades(43, 32, 3, 7), extra: ['sym-rotor-off'] }
    ]
  },

  // ── 管道管件 ────────────────────────────────────────────
  {
    id: 'PIP-SEG-01', name: '管段', category: '管道管件',
    desc: '两端连接点可与其他管件自动拼接',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '渗漏故障', kind: 'bool', point: 'PIP_SEG_01_FAULT', onClass: ['is-fault'] },
      { name: '过流', kind: 'bool', point: 'PIP_SEG_01_FLOW', onClass: ['is-flow'] }
    ],
    shapes: [{ t: 'path', role: 'pipe', d: 'M4,32 H60' }]
  },
  {
    id: 'PIP-ELB-01', name: '弯头', category: '管道管件',
    desc: '左进上出',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '渗漏故障', kind: 'bool', point: 'PIP_ELB_01_FAULT', onClass: ['is-fault'] },
      { name: '过流', kind: 'bool', point: 'PIP_ELB_01_FLOW', onClass: ['is-flow'] }
    ],
    shapes: [{ t: 'path', role: 'pipe', d: 'M4,32 H26 Q32,32 32,26 V4' }]
  },
  {
    id: 'PIP-TEE-01', name: '三通', category: '管道管件',
    desc: '三向连接',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '渗漏故障', kind: 'bool', point: 'PIP_TEE_01_FAULT', onClass: ['is-fault'] },
      { name: '过流', kind: 'bool', point: 'PIP_TEE_01_FLOW', onClass: ['is-flow'] }
    ],
    shapes: [{ t: 'path', role: 'pipe', d: 'M4,32 H60 M32,32 V4' }]
  },
  {
    id: 'PIP-RED-01', name: '渐缩段', category: '管道管件',
    desc: '大小管径过渡',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '渗漏故障', kind: 'bool', point: 'PIP_RED_01_FAULT', onClass: ['is-fault'] },
      { name: '过流', kind: 'bool', point: 'PIP_RED_01_FLOW', onClass: ['is-flow'] }
    ],
    shapes: [{ t: 'poly', role: 'band', points: '8,24 56,28 56,36 8,40' }]
  },

  // ── 阀门 ────────────────────────────────────────────────
  {
    id: 'VLV-GATE-01', name: '闸阀', category: '阀门',
    desc: '蝶形符号 + 手轮',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '阀位', kind: 'bool', point: 'VLV_GATE_01_OPEN', onClass: ['is-open'], offClass: ['is-closed'] },
      { name: '故障', kind: 'bool', point: 'VLV_GATE_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      ...stubs(), ...bowtie(),
      { t: 'line', role: 'line', x1: 32, y1: 20, x2: 32, y2: 8 },
      { t: 'line', role: 'line', x1: 26, y1: 8, x2: 38, y2: 8 }
    ]
  },
  {
    id: 'VLV-BUTT-01', name: '蝶阀', category: '阀门',
    desc: '蝶形符号 + 中心阀板线',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '阀位', kind: 'bool', point: 'VLV_BUTT_01_OPEN', onClass: ['is-open'], offClass: ['is-closed'] },
      { name: '故障', kind: 'bool', point: 'VLV_BUTT_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      ...stubs(), ...bowtie(),
      { t: 'line', role: 'line', x1: 32, y1: 20, x2: 32, y2: 44 }
    ]
  },
  {
    id: 'VLV-CHK-01', name: '止回阀', category: '阀门',
    desc: '蝶形符号 + 流向箭头',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '阀位', kind: 'bool', point: 'VLV_CHK_01_OPEN', onClass: ['is-open'], offClass: ['is-closed'] },
      { name: '故障', kind: 'bool', point: 'VLV_CHK_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      ...stubs(), ...bowtie(),
      { t: 'path', role: 'accent', d: 'M35,25 L44,32 L35,39' }
    ]
  },
  {
    id: 'VLV-RED-01', name: '减压阀', category: '阀门',
    desc: '蝶形符号 + 弹簧调节',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '阀位', kind: 'bool', point: 'VLV_RED_01_OPEN', onClass: ['is-open'], offClass: ['is-closed'] },
      { name: '故障', kind: 'bool', point: 'VLV_RED_01_FAULT', onClass: ['is-fault'] },
      { name: '出口压力', kind: 'text', point: 'VLV_RED_01_PRESS', unit: 'MPa' }
    ],
    shapes: [
      ...stubs(), ...bowtie(),
      { t: 'line', role: 'line', x1: 32, y1: 20, x2: 32, y2: 17 },
      { t: 'path', role: 'line', d: 'M25,17 L28,12 L31,17 L34,12 L37,17 L39,14' }
    ]
  },
  {
    id: 'VLV-SIG-01', name: '信号阀', category: '阀门',
    desc: '蝶形符号 + 信号标志牌',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '阀位', kind: 'bool', point: 'VLV_SIG_01_OPEN', onClass: ['is-open'], offClass: ['is-closed'] },
      { name: '故障', kind: 'bool', point: 'VLV_SIG_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      ...stubs(), ...bowtie(),
      { t: 'line', role: 'line', x1: 32, y1: 20, x2: 32, y2: 14 },
      { t: 'circle', role: 'accent', cx: 32, cy: 9, r: 5 }
    ]
  },

  // ── 末端设施 ────────────────────────────────────────────
  {
    id: 'HYD-HOSE-01', name: '消火栓箱', category: '末端设施',
    desc: '箱体 + 栓口 + 水带盘',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '压力', kind: 'text', point: 'HYD_HOSE_01_PRESS', unit: 'MPa' },
      { name: '故障', kind: 'bool', point: 'HYD_HOSE_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      { t: 'rect', role: 'outline', x: 14, y: 10, width: 36, height: 44, rx: 2 },
      { t: 'circle', role: 'body', cx: 32, cy: 24, r: 8 },
      { t: 'circle', role: 'outline', cx: 32, cy: 42, r: 8 }
    ]
  },
  {
    id: 'HYD-IND-01', name: '室内消火栓', category: '末端设施',
    desc: '栓口 + 两侧出水口 + 立管',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '压力', kind: 'text', point: 'HYD_IND_01_PRESS', unit: 'MPa' },
      { name: '故障', kind: 'bool', point: 'HYD_IND_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      { t: 'circle', role: 'body', cx: 32, cy: 30, r: 11 },
      { t: 'line', role: 'line', x1: 21, y1: 30, x2: 13, y2: 30 },
      { t: 'line', role: 'line', x1: 43, y1: 30, x2: 51, y2: 30 },
      { t: 'line', role: 'line', x1: 32, y1: 41, x2: 32, y2: 58 }
    ]
  },
  {
    id: 'HYD-OUT-01', name: '室外消火栓', category: '末端设施',
    desc: '地上式，含顶盖与两侧出水口',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '压力', kind: 'text', point: 'HYD_OUT_01_PRESS', unit: 'MPa' },
      { name: '故障', kind: 'bool', point: 'HYD_OUT_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      { t: 'rect', role: 'outline', x: 27, y: 10, width: 10, height: 6, rx: 1 },
      { t: 'circle', role: 'body', cx: 32, cy: 26, r: 9 },
      { t: 'line', role: 'line', x1: 23, y1: 26, x2: 13, y2: 26 },
      { t: 'line', role: 'line', x1: 41, y1: 26, x2: 51, y2: 26 },
      { t: 'line', role: 'line', x1: 32, y1: 35, x2: 32, y2: 58 },
      { t: 'line', role: 'line', x1: 24, y1: 58, x2: 40, y2: 58 }
    ]
  },
  {
    id: 'SNO-WP-01', name: '消防水炮', category: '末端设施',
    desc: '炮体 + 炮管 + 底座',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '运行', kind: 'bool', point: 'SNO_WP_01_RUN', onClass: ['is-run'], offClass: ['is-off'] },
      { name: '故障', kind: 'bool', point: 'SNO_WP_01_FAULT', onClass: ['is-fault'] },
      { name: '压力', kind: 'text', point: 'SNO_WP_01_PRESS', unit: 'MPa' }
    ],
    shapes: [
      { t: 'line', role: 'line', x1: 32, y1: 16, x2: 32, y2: 4 },
      { t: 'circle', role: 'body', cx: 32, cy: 26, r: 10 },
      { t: 'line', role: 'line', x1: 32, y1: 36, x2: 32, y2: 56 },
      { t: 'line', role: 'line', x1: 22, y1: 58, x2: 42, y2: 58 }
    ]
  },

  // ── 水泵接合器 ──────────────────────────────────────────
  {
    id: 'CON-IND-01', name: '室内水泵接合器', category: '接合器',
    desc: '墙面接合箱，双向接口',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '压力', kind: 'text', point: 'CON_IND_01_PRESS', unit: 'MPa' },
      { name: '阀位', kind: 'bool', point: 'CON_IND_01_OPEN', onClass: ['is-open'], offClass: ['is-closed'] },
      { name: '故障', kind: 'bool', point: 'CON_IND_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      { t: 'rect', role: 'outline', x: 24, y: 12, width: 20, height: 36, rx: 2 },
      { t: 'line', role: 'line', x1: 14, y1: 22, x2: 24, y2: 22 },
      { t: 'line', role: 'line', x1: 44, y1: 30, x2: 54, y2: 30 },
      { t: 'line', role: 'line', x1: 34, y1: 48, x2: 34, y2: 58 }
    ]
  },
  {
    id: 'CON-OUT-01', name: '室外水泵接合器', category: '接合器',
    desc: '立式双接口',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '压力', kind: 'text', point: 'CON_OUT_01_PRESS', unit: 'MPa' },
      { name: '阀位', kind: 'bool', point: 'CON_OUT_01_OPEN', onClass: ['is-open'], offClass: ['is-closed'] },
      { name: '故障', kind: 'bool', point: 'CON_OUT_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      { t: 'line', role: 'line', x1: 32, y1: 8, x2: 32, y2: 56 },
      { t: 'line', role: 'line', x1: 26, y1: 8, x2: 38, y2: 8 },
      { t: 'line', role: 'line', x1: 22, y1: 22, x2: 32, y2: 22 },
      { t: 'line', role: 'line', x1: 32, y1: 38, x2: 44, y2: 38 },
      { t: 'line', role: 'line', x1: 24, y1: 58, x2: 40, y2: 58 }
    ]
  },

  // ── 仪表 ────────────────────────────────────────────────
  {
    id: 'PAI-SPG-01', name: '压力表', category: '仪表',
    desc: '指针随压力值旋转',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '压力', kind: 'angle', point: 'PAI_SPG_01_P', min: 0, max: 1.6, unit: 'MPa', minAngle: -135, maxAngle: 135, alarmHi: 1.2, alarmLo: 0.2 },
      { name: '超压', kind: 'bool', point: 'PAI_SPG_01_HI', onClass: ['is-fault'] }
    ],
    shapes: [
      { t: 'circle', role: 'body', cx: 32, cy: 28, r: 17 },
      { t: 'line', role: 'line', x1: 22, y1: 20, x2: 24, y2: 22 },
      { t: 'line', role: 'line', x1: 40, y1: 22, x2: 42, y2: 20 },
      { t: 'line', role: 'needle', x1: 32, y1: 28, x2: 32, y2: 14, pivot: [32, 28] },
      { t: 'path', role: 'line', d: 'M32,45 V58' }
    ]
  },
  {
    id: 'LEV-TX-01', name: '液位计', category: '仪表',
    desc: '变送器头 + 量筒，液柱随液位变化',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '液位', kind: 'level', point: 'LEV_TX_01_LV', min: 0, max: 100, unit: '%', bottom: 57, maxH: 28, alarmHi: 90, alarmLo: 15, img: { x: 2.5, w: 4, bottom: 52, maxH: 40 } },
      { name: '故障', kind: 'bool', point: 'LEV_TX_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      { t: 'rect', role: 'liquid', x: 27, y: 42, width: 10, height: 15 },
      { t: 'rect', role: 'outline', x: 25, y: 28, width: 14, height: 30 },
      { t: 'circle', role: 'body', cx: 32, cy: 18, r: 10 }
    ]
  },
  {
    id: 'FTM-TX-01', name: '流量计', category: '仪表',
    desc: '圆内箭头表示流向',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '瞬时流量', kind: 'text', point: 'FTM_TX_01_Q', unit: 'm³/h' },
      { name: '累计流量', kind: 'text', point: 'FTM_TX_01_QT', unit: 'm³' },
      { name: '故障', kind: 'bool', point: 'FTM_TX_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      { t: 'line', role: 'line', x1: 4, y1: 32, x2: 17, y2: 32 },
      { t: 'line', role: 'line', x1: 47, y1: 32, x2: 60, y2: 32 },
      { t: 'circle', role: 'body', cx: 32, cy: 32, r: 15 },
      { t: 'path', role: 'accent', d: 'M24,40 L40,24' },
      { t: 'poly', role: 'accent', points: '40,24 31,25 39,32' }
    ]
  },

  // ── 电气 ────────────────────────────────────────────────
  {
    id: 'CAB-PMP-01', name: '消防泵控制柜', category: '电气',
    desc: '柜体、显示面板、指示灯',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '故障', kind: 'bool', point: 'CAB_PMP_01_FAULT', onClass: ['is-fault'] },
      { name: '手自动', kind: 'bool', point: 'CAB_PMP_01_MODE', onClass: ['is-manual'] },
      { name: '柜内温度', kind: 'text', point: 'CAB_PMP_01_TEMP', unit: '℃' }
    ],
    shapes: [
      { t: 'rect', role: 'body', x: 19, y: 14, width: 26, height: 12, rx: 1 },
      { t: 'circle', role: 'accent', cx: 22, cy: 32, r: 2 },
      { t: 'circle', role: 'accent', cx: 32, cy: 32, r: 2 },
      { t: 'circle', role: 'accent', cx: 42, cy: 32, r: 2 },
      { t: 'line', role: 'line', x1: 12, y1: 36, x2: 52, y2: 36 },
      { t: 'rect', role: 'body', x: 45, y: 40, width: 3, height: 8 },
      { t: 'line', role: 'line', x1: 18, y1: 44, x2: 38, y2: 44 },
      { t: 'line', role: 'line', x1: 18, y1: 47, x2: 38, y2: 47 },
      { t: 'rect', role: 'outline', x: 12, y: 8, width: 40, height: 44, rx: 2 },
      { t: 'rect', role: 'body', x: 8, y: 52, width: 48, height: 4 }
    ]
  },

  // ── 末端设施（补充） ────────────────────────────────────
  {
    id: 'TST-TEST-01', name: '末端试水装置', category: '末端设施',
    desc: '试水阀 + 压力表 + 试水出口',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '压力', kind: 'angle', point: 'TST_TEST_01_P', min: 0, max: 1.0, unit: 'MPa', minAngle: -135, maxAngle: 135, alarmHi: 0.8, alarmLo: 0.15 },
      { name: '流量', kind: 'text', point: 'TST_TEST_01_Q', unit: 'L/s' },
      { name: '阀位', kind: 'bool', point: 'TST_TEST_01_OPEN', onClass: ['is-open'], offClass: ['is-closed'] }
    ],
    shapes: [
      { t: 'path', role: 'pipe', d: 'M32,60 V44' },
      { t: 'rect', role: 'body', x: 24, y: 30, width: 16, height: 14, rx: 1 },
      { t: 'circle', role: 'body', cx: 32, cy: 20, r: 8 },
      { t: 'line', role: 'needle', x1: 32, y1: 20, x2: 32, y2: 14, pivot: [32, 20] },
      { t: 'line', role: 'line', x1: 40, y1: 37, x2: 50, y2: 37 },
      { t: 'circle', role: 'accent', cx: 52, cy: 37, r: 2.5 }
    ]
  },
  {
    id: 'SPK-SPR-01', name: '喷淋喷头', category: '末端设施',
    desc: '下垂型喷头，顶部接支管，底部溅水盘，附末端压力与流量',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '末端压力', kind: 'text', point: 'SPK_SPR_01_PRESS', unit: 'MPa' },
      { name: '流量', kind: 'text', point: 'SPK_SPR_01_Q', unit: 'L/s' },
      { name: '故障', kind: 'bool', point: 'SPK_SPR_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      { t: 'line', role: 'line', x1: 4, y1: 32, x2: 17, y2: 32 },
      { t: 'line', role: 'line', x1: 47, y1: 32, x2: 60, y2: 32 },
      { t: 'path', role: 'pipe', d: 'M32,32 V18' },
      { t: 'rect', role: 'body', x: 24, y: 8, width: 16, height: 10, rx: 1 },
      { t: 'circle', role: 'accent', cx: 32, cy: 40, r: 4 },
      { t: 'path', role: 'line', d: 'M18,50 H46' },
      { t: 'path', role: 'line', d: 'M18,50 L13,58 M46,50 L51,58' }
    ]
  },

  // ── 气体灭火：储存装置 ────────────────────────────────────
  {
    id: 'CYL-GRP-01', name: '灭火剂钢瓶组', category: '储存装置',
    desc: '三瓶并列钢瓶阵，含瓶头阀与瓶组架，左侧进启动管路、右端出管接集流管',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '钢瓶压力', kind: 'text', point: 'CYL_GRP_01_PRESS', unit: 'MPa', min: 0, max: 1.6, alarmLo: 1.2, alarmHi: 1.4 },
      { name: '失重', kind: 'bool', point: 'CYL_GRP_01_LOSS', onClass: ['is-fault'] },
      { name: '瓶头阀阀位', kind: 'bool', point: 'CYL_GRP_01_VALVE', onClass: ['is-open'], offClass: ['is-closed'] }
    ],
    shapes: [
      { t: 'rect', role: 'body', x: 8, y: 20, width: 13, height: 34, rx: 3 },
      { t: 'rect', role: 'body', x: 23, y: 20, width: 13, height: 34, rx: 3 },
      { t: 'rect', role: 'body', x: 38, y: 20, width: 13, height: 34, rx: 3 },
      { t: 'rect', role: 'accent', x: 11, y: 13, width: 7, height: 7, rx: 1 },
      { t: 'rect', role: 'accent', x: 26, y: 13, width: 7, height: 7, rx: 1 },
      { t: 'rect', role: 'accent', x: 41, y: 13, width: 7, height: 7, rx: 1 },
      { t: 'path', role: 'line', d: 'M14,16 H44' },
      { t: 'path', role: 'pipe', d: 'M44,16 V32 H60' },
      { t: 'rect', role: 'band', x: 6, y: 54, width: 48, height: 4 }
    ]
  },
  {
    id: 'CYL-DRV-01', name: '启动气瓶', category: '储存装置',
    desc: '氮气驱动瓶，小口径瓶体带阀头与压力表，右侧出气',
    ports: [{ x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '驱动气瓶压力', kind: 'text', point: 'CYL_DRV_01_PRESS', unit: 'MPa', min: 0, max: 6.3 },
      { name: '启动', kind: 'bool', point: 'CYL_DRV_01_RUN', onClass: ['is-run'] }
    ],
    shapes: [
      { t: 'rect', role: 'body', x: 22, y: 22, width: 20, height: 32, rx: 4 },
      { t: 'rect', role: 'accent', x: 28, y: 14, width: 8, height: 8, rx: 1 },
      { t: 'circle', role: 'body', cx: 32, cy: 9, r: 4 },
      { t: 'path', role: 'pipe', d: 'M42,32 H60' },
      { t: 'rect', role: 'band', x: 18, y: 54, width: 28, height: 4 }
    ]
  },
  {
    id: 'MAN-COL-01', name: '集流管', category: '储存装置',
    desc: '汇流管汇集各瓶组，左端进、右端出主管、下端出支管',
    ports: [
      { x: 4, y: 32, dir: 'left' },
      { x: 60, y: 32, dir: 'right' },
      { x: 32, y: 60, dir: 'down' }
    ],
    bindings: [
      { name: '集流管压力', kind: 'text', point: 'MAN_COL_01_PRESS', unit: 'MPa', min: 0, max: 1.6 }
    ],
    shapes: [
      { t: 'path', role: 'pipe', d: 'M4,32 H60' },
      { t: 'rect', role: 'band', x: 10, y: 26, width: 4, height: 12 },
      { t: 'rect', role: 'band', x: 50, y: 26, width: 4, height: 12 },
      { t: 'path', role: 'pipe', d: 'M32,32 V60' },
      { t: 'rect', role: 'band', x: 27, y: 48, width: 10, height: 4 }
    ]
  },

  // ── 气体灭火：驱动装置 ────────────────────────────────────
  {
    id: 'VLV-SOL-01', name: '启动电磁阀', category: '驱动装置',
    desc: '电磁阀本体带线圈方盒与手动旁通，区别于手动阀',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '阀位', kind: 'bool', point: 'VLV_SOL_01_OPEN', onClass: ['is-open'], offClass: ['is-closed'] },
      { name: '启动指令', kind: 'bool', point: 'VLV_SOL_01_CMD', onClass: ['is-run'] },
      { name: '故障', kind: 'bool', point: 'VLV_SOL_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      ...stubs(), ...bowtie(),
      { t: 'rect', role: 'band', x: 24, y: 13, width: 16, height: 11, rx: 2 },
      { t: 'line', role: 'line', x1: 32, y1: 24, x2: 32, y2: 20 },
      { t: 'circle', role: 'accent', cx: 32, cy: 9, r: 2.5 }
    ]
  },
  {
    id: 'MAN-PUL-01', name: '手动启动拉环', category: '驱动装置',
    desc: '就地手动启动箱，拉环外露带标识牌',
    ports: [],
    bindings: [
      { name: '手动启动', kind: 'bool', point: 'MAN_PUL_01_ACT', onClass: ['is-run'] }
    ],
    shapes: [
      { t: 'rect', role: 'body', x: 14, y: 16, width: 36, height: 36, rx: 2 },
      { t: 'circle', role: 'outline', cx: 32, cy: 29, r: 7 },
      { t: 'rect', role: 'accent', x: 27, y: 37, width: 10, height: 11, rx: 1 },
      { t: 'line', role: 'line', x1: 32, y1: 37, x2: 32, y2: 33 }
    ]
  },
  {
    id: 'PRS-SIG-01', name: '压力信号器', category: '驱动装置',
    desc: '管网压力信号器，喷放后压力上升触发反馈',
    ports: [],
    bindings: [
      { name: '喷放反馈', kind: 'bool', point: 'PRS_SIG_01_FB', onClass: ['is-discharge'] },
      { name: '故障', kind: 'bool', point: 'PRS_SIG_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      { t: 'circle', role: 'body', cx: 32, cy: 27, r: 13 },
      { t: 'circle', role: 'outline', cx: 32, cy: 27, r: 7 },
      { t: 'rect', role: 'band', x: 25, y: 43, width: 14, height: 13, rx: 1 },
      { t: 'line', role: 'line', x1: 28, y1: 48, x2: 36, y2: 48 },
      { t: 'line', role: 'line', x1: 28, y1: 52, x2: 36, y2: 52 }
    ]
  },
  {
    id: 'RLY-DLY-01', name: '延时继电器', category: '驱动装置',
    desc: '导轨式延时继电器，带延时旋钮与指示灯',
    ports: [],
    bindings: [
      { name: '延时中', kind: 'bool', point: 'RLY_DLY_01_RUN', onClass: ['is-manual'] },
      { name: '剩余时间', kind: 'text', point: 'RLY_DLY_01_LEFT', unit: 's', min: 0, max: 10 }
    ],
    shapes: [
      { t: 'rect', role: 'body', x: 14, y: 16, width: 36, height: 32, rx: 2 },
      { t: 'rect', role: 'band', x: 14, y: 23, width: 36, height: 4 },
      { t: 'circle', role: 'outline', cx: 24, cy: 37, r: 5 },
      { t: 'circle', role: 'accent', cx: 40, cy: 37, r: 3 }
    ]
  },

  // ── 气体灭火：灭火剂管网 ──────────────────────────────────
  {
    id: 'PIP-GAS-01', name: '灭火剂管道', category: '灭火剂管网',
    desc: '灭火剂输送管，中段带气介质双环标识',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '充压', kind: 'bool', point: 'PIP_GAS_01_CHARGED', onClass: ['is-run'] }
    ],
    shapes: [
      { t: 'path', role: 'pipe', d: 'M4,32 H60' },
      { t: 'rect', role: 'band', x: 26, y: 26, width: 4, height: 12 },
      { t: 'rect', role: 'band', x: 34, y: 26, width: 4, height: 12 }
    ]
  },
  {
    id: 'NZL-GAS-01', name: '喷嘴', category: '灭火剂管网',
    desc: '孔口喷嘴，仅左侧进管，喷口朝上',
    ports: [{ x: 4, y: 32, dir: 'left' }],
    bindings: [
      { name: '喷放', kind: 'bool', point: 'NZL_GAS_01_FB', onClass: ['is-discharge'] }
    ],
    shapes: [
      { t: 'path', role: 'pipe', d: 'M4,32 H32' },
      { t: 'rect', role: 'body', x: 28, y: 27, width: 9, height: 11, rx: 1 },
      { t: 'poly', role: 'body', points: '27,38 38,38 48,14 17,14' }
    ]
  },

  // ── 气体灭火：探测报警 ────────────────────────────────────
  {
    id: 'DET-SMK-01', name: '感烟探测器', category: '探测报警',
    desc: '顶装圆形感烟探测器底视，中心带指示灯',
    ports: [],
    bindings: [
      { name: '报警', kind: 'bool', point: 'DET_SMK_01_ALM', onClass: ['is-alarm'] },
      { name: '故障', kind: 'bool', point: 'DET_SMK_01_FLT', onClass: ['is-fault'] }
    ],
    shapes: [
      { t: 'circle', role: 'body', cx: 32, cy: 32, r: 18 },
      { t: 'circle', role: 'outline', cx: 32, cy: 32, r: 11 },
      { t: 'circle', role: 'accent', cx: 32, cy: 32, r: 3 }
    ]
  },
  {
    id: 'DET-HST-01', name: '感温探测器', category: '探测报警',
    desc: '差定温探测器底视，圆形底座带栅格',
    ports: [],
    bindings: [
      { name: '报警', kind: 'bool', point: 'DET_HST_01_ALM', onClass: ['is-alarm'] },
      { name: '故障', kind: 'bool', point: 'DET_HST_01_FLT', onClass: ['is-fault'] }
    ],
    shapes: [
      { t: 'circle', role: 'body', cx: 32, cy: 32, r: 18 },
      { t: 'rect', role: 'outline', x: 23, y: 25, width: 18, height: 14, rx: 1 },
      { t: 'line', role: 'line', x1: 26, y1: 29, x2: 38, y2: 29 },
      { t: 'line', role: 'line', x1: 26, y1: 33, x2: 38, y2: 33 },
      { t: 'line', role: 'line', x1: 26, y1: 37, x2: 38, y2: 37 }
    ]
  },
  {
    id: 'ALM-SLR-01', name: '声光警报器', category: '探测报警',
    desc: '声光警报器，罩壳加下方蜂鸣栅格',
    ports: [],
    bindings: [
      { name: '运行', kind: 'bool', point: 'ALM_SLR_01_RUN', onClass: ['is-run'] }
    ],
    shapes: [
      { t: 'rect', role: 'body', x: 18, y: 12, width: 28, height: 28, rx: 3 },
      { t: 'rect', role: 'outline', x: 21, y: 15, width: 22, height: 22, rx: 2 },
      { t: 'rect', role: 'band', x: 22, y: 42, width: 20, height: 14, rx: 1 },
      { t: 'line', role: 'line', x1: 25, y1: 46, x2: 39, y2: 46 },
      { t: 'line', role: 'line', x1: 25, y1: 51, x2: 39, y2: 51 }
    ]
  },
  {
    id: 'MAN-CLB-01', name: '手动报警按钮', category: '探测报警',
    desc: '圆形手动报警按钮，蘑菇头带十字标识',
    ports: [],
    bindings: [
      { name: '动作', kind: 'bool', point: 'MAN_CLB_01_ACT', onClass: ['is-alarm'] }
    ],
    shapes: [
      { t: 'rect', role: 'body', x: 16, y: 16, width: 32, height: 32, rx: 3 },
      { t: 'circle', role: 'accent', cx: 32, cy: 32, r: 10 },
      { t: 'line', role: 'line', x1: 32, y1: 26, x2: 32, y2: 38 },
      { t: 'line', role: 'line', x1: 26, y1: 32, x2: 38, y2: 32 }
    ]
  },

  // ── 气体灭火：控制 ────────────────────────────────────────
  {
    id: 'CTL-GAS-01', name: '气体灭火控制器', category: '控制',
    desc: '柜式气体灭火控制器，面板三灯加显示窗',
    ports: [],
    bindings: [
      { name: '正常', kind: 'bool', point: 'CTL_GAS_01_RUN', onClass: ['is-run'] },
      { name: '故障', kind: 'bool', point: 'CTL_GAS_01_FAULT', onClass: ['is-fault'] },
      { name: '喷放', kind: 'bool', point: 'CTL_GAS_01_DIS', onClass: ['is-discharge'] }
    ],
    shapes: [
      { t: 'rect', role: 'body', x: 12, y: 8, width: 40, height: 48, rx: 2 },
      { t: 'rect', role: 'outline', x: 16, y: 13, width: 32, height: 17, rx: 1 },
      { t: 'circle', role: 'accent', cx: 22, cy: 40, r: 3.5 },
      { t: 'circle', role: 'accent', cx: 32, cy: 40, r: 3.5 },
      { t: 'circle', role: 'accent', cx: 42, cy: 40, r: 3.5 },
      { t: 'line', role: 'line', x1: 19, y1: 50, x2: 45, y2: 50 }
    ]
  },
  {
    id: 'MDL-IOR-01', name: '输入输出模块', category: '控制',
    desc: 'DIN 导轨输入输出模块，正视带端子与指示灯',
    ports: [],
    bindings: [
      { name: '运行', kind: 'bool', point: 'MDL_IOR_01_RUN', onClass: ['is-run'] },
      { name: '故障', kind: 'bool', point: 'MDL_IOR_01_FAULT', onClass: ['is-fault'] }
    ],
    shapes: [
      { t: 'rect', role: 'body', x: 12, y: 18, width: 40, height: 28, rx: 1 },
      { t: 'rect', role: 'band', x: 12, y: 25, width: 40, height: 4 },
      { t: 'circle', role: 'accent', cx: 20, cy: 37, r: 2.5 },
      { t: 'circle', role: 'accent', cx: 32, cy: 37, r: 2.5 },
      { t: 'circle', role: 'accent', cx: 44, cy: 37, r: 2.5 }
    ]
  },

  // ── 气体灭火：辅助设施 ────────────────────────────────────
  {
    id: 'VNT-REL-01', name: '泄压口', category: '辅助设施',
    desc: '墙体泄压口挡板，带向上泄压方向标识',
    ports: [],
    bindings: [
      { name: '开启', kind: 'bool', point: 'VNT_REL_01_OPEN', onClass: ['is-open'], offClass: ['is-closed'] }
    ],
    shapes: [
      { t: 'rect', role: 'body', x: 8, y: 24, width: 48, height: 24, rx: 2 },
      { t: 'rect', role: 'outline', x: 13, y: 29, width: 38, height: 14, rx: 1 },
      { t: 'path', role: 'line', d: 'M32,22 V9' },
      { t: 'path', role: 'line', d: 'M26,15 L32,7 L38,15' }
    ]
  },
  {
    id: 'FAN-EXH-01', name: '排风机', category: '辅助设施',
    desc: '柜式离心排风机，运行叶轮旋转，用于保护区排风',
    ports: [{ x: 4, y: 32, dir: 'left' }, { x: 60, y: 32, dir: 'right' }],
    bindings: [
      { name: '指令', kind: 'bool', point: 'FAN_EXH_01_CMD', onClass: ['is-run'], spin: true },
      { name: '反馈', kind: 'bool', point: 'FAN_EXH_01_FB', onClass: ['is-open'] }
    ],
    shapes: [
      ...stubs(),
      { t: 'rect', role: 'body', x: 16, y: 14, width: 32, height: 36, rx: 2 },
      { t: 'circle', role: 'outline', cx: 32, cy: 32, r: 12 },
      { t: 'g', role: 'rotor', pivot: [32, 32], children: blades(32, 32, 4, 11) }
    ]
  },

  // ── 气体灭火：仪表（分类属通用「仪表」，系统归属覆盖为气体灭火） ──
  {
    id: 'PAI-CYL-01', name: '钢瓶压力表', category: '仪表', system: 'gas', screen: 'G07 气体灭火总貌',
    desc: '小口径表头压力表，指针随压力旋转，区别于管网压力表',
    ports: [],
    bindings: [
      { name: '压力', kind: 'angle', point: 'PAI_CYL_01_P', min: 0, max: 1.6, unit: 'MPa', minAngle: -135, maxAngle: 135, alarmHi: 1.4, alarmLo: 1.2 },
      { name: '欠压', kind: 'bool', point: 'PAI_CYL_01_LOW', onClass: ['is-fault'] }
    ],
    shapes: [
      { t: 'circle', role: 'body', cx: 32, cy: 26, r: 15 },
      { t: 'line', role: 'line', x1: 24, y1: 19, x2: 26, y2: 21 },
      { t: 'line', role: 'line', x1: 40, y1: 21, x2: 38, y2: 19 },
      { t: 'line', role: 'needle', x1: 32, y1: 26, x2: 32, y2: 14, pivot: [32, 26] },
      { t: 'path', role: 'pipe', d: 'M32,41 V56' }
    ]
  }
];
