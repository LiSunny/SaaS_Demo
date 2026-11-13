#!/usr/bin/env python3
"""
优化 src/assets/agent-robot.svg —— 消除 Figma scatter 描边导出的重复几何。

背景：
  该 SVG 由 Figma「毛笔描边 / scatter」导出。每个描边样式导出为
    <g id="strokeN_310_8400" data-figma-scatter-ref="...">
      <path d="...(185KB 复合路径)" fill="url(#paintN_linear_310_8400)"/>
    </g>
  页面再用 234 个 <use href="#strokeN" transform="translate() scale() rotate()">
  把这个「笔刷形状」散布到各位置，形成手绘描边质感。

  14 个 strokeN 的 path **d 完全相同**（md5 一致），只有渐变 fill 不同，
  却各自存了一份 185KB 的坐标 → 占全文 98% 的路径数据、2.6MB。

方案：
  几何只留一份具名 path（不带 fill，让 fill 从 <use> 继承），
  14 个 g 内各改为一行 <use href="#agent-brush-shape" fill="url(#paintN)"/>。

  等价性：
    原：<use href="#strokeN" T> → <g><path d fill=paintN/></g>
    新：<use href="#strokeN" T> → <g><use href="#agent-brush-shape" fill=paintN/></g>
  变换链、渐变坐标、objectBoundingBox 的 bbox（d 相同故 bbox 相同）均不变。

用法：python3 scripts/opt-agent-robot-svg.py <src.svg> <out.svg>
"""
import re
import sys
import hashlib

BRUSH_ID = "agent-brush-shape"

# <g id="strokeN_310_8400" ...><path d="..." fill="url(#paintN...)"/></g>
GROUP_RE = re.compile(
    r'<g id="(stroke\d+_310_8400)"([^>]*)>\s*'
    r'<path\s+d="([^"]+)"([^>]*?)/>\s*'
    r'</g>',
    re.S,
)
FILL_RE = re.compile(r'\sfill="([^"]*)"')


def main(src_path: str, out_path: str) -> None:
    src = open(src_path, encoding="utf-8").read()

    matches = list(GROUP_RE.finditer(src))
    if not matches:
        sys.exit("未匹配到 scatter 描边分组，终止")

    # 校验：所有 d 必须一致，且确实存在重复
    digests = {hashlib.md5(m.group(3).encode()).hexdigest() for m in matches}
    if len(digests) != 1:
        sys.exit(f"d 数据不一致（{len(digests)} 种），终止")

    brush_d = matches[0].group(3)
    print(f"匹配 {len(matches)} 组，共享几何 {len(brush_d)/1024:.0f}KB")

    # 逐组替换：<path d fill> → <use href="#brush" fill>
    out_parts = []
    last = 0
    for m in matches:
        gid, gattrs, d, pattrs = m.groups()
        fm = FILL_RE.search(pattrs)
        fill = fm.group(1) if fm else "none"
        # 其它属性（如 transform/opacity）若存在，保留在 use 上
        others = FILL_RE.sub("", pattrs).strip()
        others = (" " + others) if others else ""
        out_parts.append(src[last:m.start()])
        out_parts.append(
            f'<g id="{gid}"{gattrs}>'
            f'<use href="#{BRUSH_ID}" xlink:href="#{BRUSH_ID}" fill="{fill}"{others}/>'
            f'</g>'
        )
        last = m.end()
    out_parts.append(src[last:])
    out = "".join(out_parts)

    # 把共享几何插入 defs 末尾（defs 里的内容不直接渲染，仅作资源）
    brush = f'<path id="{BRUSH_ID}" d="{brush_d}"/>'
    if "</defs>" not in out:
        sys.exit("未找到 </defs>，终止")
    out = out.replace("</defs>", brush + "</defs>", 1)

    open(out_path, "w", encoding="utf-8").write(out)

    import os
    a, b = os.path.getsize(src_path), os.path.getsize(out_path)
    print(f"原始 {a/1024:.0f}KB → 优化后 {b/1024:.0f}KB（降 {(1-b/a)*100:.1f}%）")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
