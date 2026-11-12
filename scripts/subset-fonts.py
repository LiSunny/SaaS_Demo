#!/usr/bin/env python3
"""
批量子集化项目本地字体，并生成带 unicode-range 的 @font-face。

背景：public/fonts 下有 10MB 级字体（Source-KeynoteartHans.otf 10MB、
YouSheBiaoTiHei-2.ttf 1.4MB…），首屏会整包下载，是线上"打开巨慢"的主因之一。

策略：
  1. 用全项目实际用到的字符集对字体做子集化，输出 woff2
  2. @font-face 声明两条：
       - 带 unicode-range 的子集版（覆盖常用字，体积小，首屏走这条）
       - 不带 range 的完整原字体（罕见字兜底，浏览器按需才下载）
  3. 字体栈名保持不变，调用方无需改动

用法：
  /tmp/fontenv/bin/python scripts/subset-fonts.py
"""
import os
import re
import hashlib
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / 'public' / 'fonts'
OUT_DIR = FONT_DIR / 'subset'
CHARSET_FILE = Path('/tmp/project-charset.txt')
CSS_OUT = ROOT / 'src' / 'styles' / 'local-fonts.css'
FALLBACK_OUT = ROOT / 'src' / 'styles' / 'local-fonts-fallback.css'

# 项目里声明过 @font-face 的字体（family -> 源文件）
# 注：DouyinSansBold.ttf 的 GSUB 表损坏，fontTools 无法解析，无法子集化；
#     它只在 CaseDetail / campus-monitor 两个懒加载页用到，不影响首屏，故保留原文件。
FONTS = {
    'Source-KeynoteartHans': 'Source-KeynoteartHans.otf',
    'YouSheBiaoTiHei': 'YouSheBiaoTiHei-2.ttf',
    'DingTalk JinBuTi': 'DingTalkJinBuTi.ttf',
    'NavKeynote': 'Source-KeynoteartHans.otf',
    'NavPuHuiTiMedium': 'Alibaba-PuHuiTi-Medium.ttf',
    'SectionTitleHans': 'Source-KeynoteartHans.otf',
    'LoadingPuHuiTi': 'Alibaba-PuHuiTi-Regular.ttf',
}

# 同一源文件只子集化一次，多个 family 复用同一产物
SHARED_SUBSET = {
    'Source-KeynoteartHans': 'Source-KeynoteartHans',
    'NavKeynote': 'Source-KeynoteartHans',
    'SectionTitleHans': 'Source-KeynoteartHans',
    'NavPuHuiTiMedium': 'NavPuHuiTiMedium',
    'LoadingPuHuiTi': 'LoadingPuHuiTi',
}

PYFTSUBSET = '/tmp/fontenv/bin/pyftsubset'


def is_cff(path: Path) -> bool:
    with open(path, 'rb') as f:
        head = f.read(4)
    return head in (b'OTTO', b'ttcf')


def to_ranges(codepoints):
    """把 code point 列表压缩成 unicode-range 列表"""
    ranges = []
    for cp in sorted(codepoints):
        if ranges and cp == ranges[-1][1] + 1:
            ranges[-1][1] = cp
        else:
            ranges.append([cp, cp])
    out = []
    for a, b in ranges:
        if a == b:
            out.append(f'U+{a:X}')
        else:
            out.append(f'U+{a:X}-{b:X}')
    return out


def font_format(path: Path) -> str:
    return 'opentype' if path.suffix.lower() == '.otf' else 'truetype'


def main():
    if not CHARSET_FILE.exists():
        sys.exit(f'缺少字符集文件 {CHARSET_FILE}，请先运行 scripts/collect-charset.mjs')
    charset = CHARSET_FILE.read_text(encoding='utf-8')
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    css_parts = [
        '/* 自动生成 —— 请勿手改 */',
        '/* 由 scripts/subset-fonts.py 生成：本地字体子集化 */',
        '/* 子集版覆盖项目实际用到的字符（体积小，首屏加载它）。 */',
        '/* 子集外的罕见字兜底声明在 local-fonts-fallback.css，',
        '   仅由真正使用艺术字的大屏页按需引入，避免主 CSS 膨胀。 */',
        '',
    ]
    fallback_parts = [
        '/* 自动生成 —— 请勿手改 */',
        '/* 由 scripts/subset-fonts.py 生成：本地字体子集化 + 完整字体兜底 */',
        '/* 兜底 face 的 unicode-range = 完整字体码点 - 子集码点，',
        '   只有真正出现子集外的罕见字时，浏览器才会下载原始大文件。 */',
        '',
    ]
    report = []

    for family, src_name in FONTS.items():
        src = FONT_DIR / src_name
        if not src.exists():
            print(f'⚠️  跳过 {family}: 源文件不存在 {src_name}')
            continue

        out_name = re.sub(r'[^A-Za-z0-9]+', '-', family).strip('-') + '-subset.woff2'
        out = OUT_DIR / out_name
        cmd = [
            PYFTSUBSET, str(src),
            '--text-file=' + str(CHARSET_FILE),
            '--output-file=' + str(out),
            '--flavor=woff2',
            '--layout-features=*',
            '--no-hinting',
            '--name-IDs=*',
        ]
        if is_cff(src):
            cmd.append('--desubroutinize')

        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(f'❌ {family} 子集化失败:\n{res.stderr[:500]}')
            continue

        size = out.stat().st_size
        orig = src.stat().st_size

        # 加内容 hash 到文件名：字体子集会被重新生成，文件名固定会让浏览器
        # 一直命中旧缓存（内容已变 → 缺字）。带 hash 才能安全地长期 immutable 缓存。
        h = hashlib.md5(out.read_bytes()).hexdigest()[:8]
        hashed_name = f'{out.stem}.{h}.woff2'
        hashed_path = OUT_DIR / hashed_name
        if hashed_path != out:
            if hashed_path.exists():
                out.unlink()  # 内容一致，丢弃刚生成的临时文件
            else:
                out.rename(hashed_path)
            out = hashed_path
            out_name = hashed_name
            size = out.stat().st_size

        # 读取子集实际包含的 code point，生成精确 unicode-range
        from fontTools.ttLib import TTFont
        subset_font = TTFont(str(out))
        cps = list(subset_font.getBestCmap().keys())
        subset_font.close()
        range_spec = ', '.join(to_ranges(cps))

        # 兜底声明的 unicode-range = 完整字体码点 - 子集码点
        # ⚠️ 必须给兜底 face 也声明 range：同 family/weight/style 的多条 @font-face
        #    在 Chrome 里会合并成一个 src 列表。若兜底 face 不带 range，
        #    浏览器在子集 face 因 range 不匹配而跳过时，会直接回落到兜底 src，
        #    于是 9.8MB 的原始字体被整包下载（实测 33.9 秒）。
        full_font = TTFont(str(src))
        full_cps = set(full_font.getBestCmap().keys())
        full_font.close()
        diff_cps = sorted(full_cps - set(cps))
        diff_spec = ', '.join(to_ranges(diff_cps)) if diff_cps else None

        subset_block = (
            f'/* {family} —— 子集版（{len(cps)} 字，{size // 1024}KB） */\n'
            f'@font-face {{\n'
            f"  font-family: '{family}';\n"
            f"  src: url('/fonts/subset/{out_name}') format('woff2');\n"
            f'  font-weight: normal;\n'
            f'  font-style: normal;\n'
            f'  font-display: swap;\n'
            f'  unicode-range: {range_spec};\n'
            f'}}\n'
        )

        fallback_block = ''
        if diff_spec:
            fallback_block = (
                f'/* {family} —— 完整字体兜底（仅当出现子集外的罕见字时才下载） */\n'
                f'@font-face {{\n'
                f"  font-family: '{family}';\n"
                f"  src: url('/fonts/{src_name}') format('{font_format(src)}');\n"
                f'  font-weight: normal;\n'
                f'  font-style: normal;\n'
                f'  font-display: swap;\n'
                f'  unicode-range: {diff_spec};\n'
                f'}}\n'
            )

        # 全局版只含子集声明（CSS 极小，常驻主包）
        css_parts.append(subset_block)
        # 含兜底的完整版单独输出（只在真正使用艺术字的大屏页按需加载）
        fallback_parts.append(subset_block + fallback_block)
        report.append((family, src_name, orig, size, len(cps)))

    CSS_OUT.write_text('\n'.join(css_parts), encoding='utf-8')
    FALLBACK_OUT.write_text('\n'.join(fallback_parts), encoding='utf-8')
    print()
    print(f'{"字体":26} {"源文件":28} {"原始":>10} {"子集":>10} {"压缩":>8}  字数')
    for family, src_name, orig, size, n in report:
        print(f'{family:26} {src_name:28} {orig/1024:8.0f}KB {size/1024:8.0f}KB {orig/size:7.1f}x  {n}')
    print(f'\nCSS 已写入 {CSS_OUT}')
    print(f'CSS 已写入 {FALLBACK_OUT}')


if __name__ == '__main__':
    main()
