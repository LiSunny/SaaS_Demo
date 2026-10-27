// 运行时：渲染图元 + 应用状态。无 import，供 dist/runtime.js 与预览页内联复用。
// 三层结构：静态几何(GEOMETRY) → 动态属性(bindings) → 文本层(label/value)

export const STATE_CLASSES = ['is-run', 'is-off', 'is-fault', 'is-manual', 'is-open', 'is-closed', 'is-over', 'is-flow', 'is-alarm', 'is-discharge'];

const NS = 'http://www.w3.org/2000/svg';

const isOn = (v) => v === true || v === 1 || v === '1' || v === 'ON' || v === 'on' || v === 'true';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function formatValue(v, unit) {
  let s;
  if (typeof v === 'number') s = String(Number(v.toFixed(2)));
  else if (v === undefined || v === null || v === '') s = '--';
  else s = String(v);
  return unit ? `${s} ${unit}` : s;
}

export function createRuntime(MANIFEST, GEOMETRY, GEOMETRY_IMAGE = {}) {
  const defs = new Map(MANIFEST.symbols.map((s) => [s.id, s]));
  const imageGeom = GEOMETRY_IMAGE;

  function textEl(y, cls) {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', '32');
    t.setAttribute('y', String(y));
    t.setAttribute('class', cls);
    return t;
  }

  function renderSymbol(id, opts = {}) {
    const def = defs.get(id);
    if (!def) throw new Error(`未知图元：${id}`);

    const style = opts.style === 'image' ? 'image' : 'line';
    const isImage = style === 'image' && imageGeom[id];
    const vals = def.bindings.filter((b) => b.kind === 'text');
    const hasLabel = !!opts.label;
    const valStart = hasLabel ? 90 : 76;
    let vbH = 64;
    if (hasLabel) vbH = vals.length ? valStart + (vals.length - 1) * 14 + 8 : 82;
    else if (vals.length) vbH = valStart + (vals.length - 1) * 14 + 8;

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 64 ${vbH}`);
    svg.setAttribute('class', 'sym-root');
    svg.dataset.symId = id;
    svg.dataset.style = isImage ? 'image' : 'line';
    if (opts.size) {
      svg.setAttribute('width', String(opts.size));
      svg.setAttribute('height', String((opts.size * vbH) / 64));
    }
    svg.innerHTML = isImage ? imageGeom[id] : GEOMETRY[id];

    if (isImage) {
      const base = (opts.imageBase ?? 'img').replace(/\/$/, '');
      svg.querySelectorAll('image').forEach((im) => {
        const file = im.dataset.file;
        if (file) im.setAttribute('href', `${base}/${file}`);
      });
    }

    if (hasLabel) {
      const t = textEl(74, 'sym-label');
      t.textContent = opts.label;
      svg.appendChild(t);
    }
    vals.forEach((b) => {
      const t = textEl(valStart + b.textIndex * 14, `sym-val sym-val-${b.textIndex}`);
      t.textContent = '';
      svg.appendChild(t);
    });

    for (const [sel, pivot] of Object.entries(def.pivots || {})) {
      svg.querySelectorAll(sel).forEach((el) => {
        el.style.transformBox = 'view-box';
        el.style.transformOrigin = `${pivot[0]}px ${pivot[1]}px`;
      });
    }

    if (opts.showPorts) showPorts(svg);
    return svg;
  }

  function showPorts(svg) {
    const def = defs.get(svg.dataset.symId);
    (def.ports || []).forEach((p) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', String(p.x));
      c.setAttribute('cy', String(p.y));
      c.setAttribute('r', '2.5');
      c.setAttribute('class', 'sym-port');
      svg.appendChild(c);
    });
  }

  function applyBinding(svg, def, b, v) {
    const root = svg;
    switch (b.kind) {
      case 'bool': {
        const on = isOn(v);
        (b.onClass || []).forEach((c) => root.classList.toggle(c, on));
        (b.offClass || []).forEach((c) => root.classList.toggle(c, !on));
        if (b.spinTarget) {
          root.querySelectorAll(b.spinTarget).forEach((el) => {
            el.style.animation = on ? 'sym-spin 1s linear infinite' : '';
          });
        }
        break;
      }
      case 'level': {
        const el = root.querySelector('.sym-liquid');
        if (!el || typeof v !== 'number') break;
        const geo = (svg.dataset.style === 'image' && b.img) ? b.img : b;
        const t = clamp((v - geo.min) / (geo.max - geo.min), 0, 1);
        const h = t * geo.maxH;
        el.setAttribute('height', h.toFixed(2));
        el.setAttribute('y', (geo.bottom - h).toFixed(2));
        break;
      }
      case 'angle': {
        const sel = b.needleTarget;
        const el = root.querySelector(sel);
        const pivot = (def.pivots || {})[sel];
        if (!el || !pivot || typeof v !== 'number') break;
        const t = clamp((v - b.min) / (b.max - b.min), 0, 1);
        const a = b.minAngle + t * (b.maxAngle - b.minAngle);
        el.setAttribute('transform', `rotate(${a.toFixed(1)} ${pivot[0]} ${pivot[1]})`);
        break;
      }
      case 'text': {
        const el = root.querySelector(`.sym-val-${b.textIndex}`);
        if (el) el.textContent = b.fmt ? b.fmt(v) : formatValue(v, b.unit);
        break;
      }
    }
  }

  // 按绑定名赋值：applyState(svg, { 运行: true, 液位: 62 })
  function applyState(svg, state = {}) {
    const def = defs.get(svg.dataset.symId);
    if (!def) return svg;
    for (const b of def.bindings) {
      if (state[b.name] === undefined) continue;
      applyBinding(svg, def, b, state[b.name]);
    }
    return svg;
  }

  // 按点名赋值：applyData(svg, { PMP_FIRE_01_RUN: 1 })
  function applyData(svg, points = {}) {
    const def = defs.get(svg.dataset.symId);
    if (!def) return svg;
    for (const b of def.bindings) {
      const v = points[b.point];
      if (v === undefined) continue;
      applyBinding(svg, def, b, v);
    }
    return svg;
  }

  function resetState(svg) {
    STATE_CLASSES.forEach((c) => svg.classList.remove(c));
    svg.querySelectorAll('.sym-val').forEach((el) => (el.textContent = ''));
    return svg;
  }

  return { renderSymbol, applyState, applyData, resetState, showPorts, defs };
}
