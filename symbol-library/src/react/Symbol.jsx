import { useEffect, useRef } from 'react';
import { runtime } from '../../dist/runtime.js';

/**
 * 图元组件。state 按绑定名给值，data 按点名给值。
 *   <Symbol id="PMP-FIRE-01" style="image" label="1# 消防泵" data={{ PMP_FIRE_01_RUN: 1 }} size={48} />
 *
 * 注意：本文件是示例，未随构建脚本编译，也未在本机运行验证。
 */
export function Symbol({
  id,
  label,
  state,
  data,
  style = 'image',
  imageBase,
  size = 48,
  showPorts = false,
  className = ''
}) {
  const host = useRef(null);

  useEffect(() => {
    const svg = runtime.renderSymbol(id, { label, style, imageBase, size, showPorts });
    runtime.resetState(svg);
    if (state) runtime.applyState(svg, state);
    if (data) runtime.applyData(svg, data);
    host.current.replaceChildren(svg);
  }, [id, label, style, imageBase, size, showPorts, JSON.stringify(state), JSON.stringify(data)]);

  return <span ref={host} className={className} />;
}

export default Symbol;
