#!/usr/bin/env python3
"""
压缩 Figma 导出 SVG 里的内嵌位图（<image> + base64 PNG）。

背景：
  Figma 导出 SVG 时，位图图层会按**原始分辨率**内嵌成 base64 PNG。
  实测一个 199×277 的机器人 SVG，内嵌的是 4096×4096 RGBA PNG（8.8MB），
  实际却只铺在 198×198 的区域内 —— 白白多传 11MB。

方案：
  把内嵌 PNG 降采样到「实际渲染尺寸 × 2」，重新编码后写回 SVG。
  位图外的矢量部分（品牌牌字样、脸部高光等）完全不动。

用法：
  python3 scripts/opt-svg-embedded-bitmap.py <src.svg> <out.svg> [--size 512] [--webp]

  --size  降采样边长（默认 512）。按「显示尺寸 × 2」取即可：
          右下角 112px 显示 → 512 足够；1080p 大屏按 2x 取更高。
  --webp  用 WebP 代替 PNG（体积再降 ~80%，现代浏览器均支持 <image> 内嵌）。

注意：
  SVG 以 <img> 加载时禁止引用外部资源，所以位图必须保持 base64 内嵌，
  不能改成 <image href="xxx.png"> 外链。
"""
import base64
import io
import os
import re
import sys

DEFAULT_SIZE = 512


def find_embedded_bitmaps(svg: str):
    """返回 [(m, data_b64_str), ...]：所有 <image ... href="data:image/png;base64,...">"""
    pat = re.compile(
        r'(<image\b[^>]*?href="data:image/(?:png|jpe?g|webp);base64,)([A-Za-z0-9+/=]+)(")',
        re.S,
    )
    return list(pat.finditer(svg))


def main(src_path: str, out_path: str, size: int = DEFAULT_SIZE, use_webp: bool = False):
    from PIL import Image

    src = open(src_path, encoding="utf-8").read()
    matches = find_embedded_bitmaps(src)
    if not matches:
        sys.exit("未找到内嵌位图（<image> + base64），终止")

    out = src
    total_before = total_after = 0

    for m in matches:
        raw = base64.b64decode(m.group(2))
        total_before += len(raw)
        im = Image.open(io.BytesIO(raw)).convert("RGBA")
        if im.width > size or im.height > size:
            im = im.resize((size, size), Image.LANCZOS)
        buf = io.BytesIO()
        if use_webp:
            im.save(buf, "WEBP", quality=90, method=6)
            mime = "image/webp"
        else:
            im.save(buf, "PNG", optimize=True)
            mime = "image/png"
        new_b64 = base64.b64encode(buf.getvalue()).decode()
        total_after += buf.tell()
        out = out.replace(m.group(2), new_b64, 1)
        out = out.replace(f"data:image/png;base64,{m.group(2)}", f"data:{mime};base64,{new_b64}", 1)
        out = out.replace(f"data:image/jpeg;base64,{m.group(2)}", f"data:{mime};base64,{new_b64}", 1)
        out = out.replace(f"data:image/webp;base64,{m.group(2)}", f"data:{mime};base64,{new_b64}", 1)

    open(out_path, "w", encoding="utf-8").write(out)

    print(f"内嵌位图 {len(matches)} 张")
    print(f"位图字节 {total_before/1024:.0f}KB → {total_after/1024:.0f}KB")
    print(f"SVG 总体 {len(src)/1024:.0f}KB → {len(out)/1024:.0f}KB")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    size = DEFAULT_SIZE
    for a in sys.argv[1:]:
        if a.startswith("--size"):
            size = int(a.split("=", 1)[1]) if "=" in a else DEFAULT_SIZE
    if len(args) != 2:
        print(__doc__)
        sys.exit(1)
    main(args[0], args[1], size, "--webp" in sys.argv)
