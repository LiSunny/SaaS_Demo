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
  }
];
