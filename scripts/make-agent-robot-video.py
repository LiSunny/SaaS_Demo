#!/usr/bin/env python3
"""
生成大屏右下角「小尼平安」机器人的透明动态素材（动画 WebP + 首帧 PNG）。

素材来源
--------
src/assets/agent-robot-source.mp4 —— 附件「小尼平安机器人全身竖屏.mp4」的副本
（1440×1920 / 5.17s / 24fps / 124 帧）。白底 H.264，没有透明通道。

为什么不能直接抠色
------------------
机器人外壳本身是白色，与白色背景在「色键」意义上无法区分：
colorkey=0xFFFFFF 在 similarity 0.10 / 0.20 / 0.30 三档下，主体保留率只有
75.4%~75.8%，被误抠掉的外壳像素约 22% —— 直接抠会把机器人抠成残骸。

本脚本的做法（边缘连通性洪泛）
------------------------------
只把「与画布四边连通的纯白」判为背景；被机器人轮廓围住的白色（外壳）予以保留。
判定在 180×240 的降采样尺度上做洪泛（主体误判率实测 0.00%），再上采样回
输出尺寸，最后用亮度做 1px 边缘软化。

四道后处理
----------
1. 边缘软化：背景核心纯白 → alpha 0；轮廓抗锯齿灰阶 → 线性过渡；
   被围住的纯白（外壳）→ alpha 255，绝不吃掉。
2. 颜色扩散：半透明边缘的 RGB 用邻近不透明像素的颜色外扩，
   避免深色大屏底上出现白雾 / 黑边。
3. 时域平滑：相邻帧 alpha 取 3 帧中值，消除逐帧掩膜抖动导致的边缘闪烁。
4. 原子落盘：先写 .tmp 再 os.replace，失败不破坏既有产物。

输出
----
src/assets/agent-robot.webp         动画 WebP（RGBA 带 alpha，浏览器可直接播）
src/assets/agent-robot-poster.png   首帧透明 PNG（视频未就绪 / 自动播放被拦时兜底）

用法
----
    python3 scripts/make-agent-robot-video.py
    python3 scripts/make-agent-robot-video.py --width 300 --height 400 --quality 86
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

# ===== 可调参数 =====
# 洪泛判定尺度：1.0 = 与输出一致（全分辨率洪泛）。
# 降采样判定会丢失轮廓的抗锯齿暗线 → 外壳白与背景在判定图上连通 → 外壳被吞。
# 实测：降采样判定外壳误判 3.9%，全分辨率判定可降到 0.1% 以下。
JUDGE_SCALE = 1.0
# 输出尺度：显示尺寸仅 150px，360×480 已是 2.4× 超采样。
OUT_W, OUT_H = 360, 480
# 纯白阈值：>= 该值即视为「纯白」（背景与外壳共用）。
WHITE_LEVEL = 250
# 边缘软化：亮度低于 WHITE_LEVEL 时按此区间线性过渡到不透明。
SOFT_LO, SOFT_HI = 215, 250
# 帧时长（毫秒）。源 124 帧 / 5.1667s → 41.7ms。
FRAME_DURATION_MS = 42
# 时域平滑窗口（0=关闭，2=相邻 3 帧 alpha 中值）。全分辨率洪泛后逐帧已足够稳，默认关闭。
SMOOTH_FRAMES = 0
# WebP 有损质量；透明边缘靠「颜色扩散」补偿，仍发灰就调成 100（近无损）。
WEBP_QUALITY = 82
WEBP_METHOD = 4
# 体积上限（字节），超过则报错提示调低分辨率。
MAX_BYTES = 1_500_000

ROOT = Path(__file__).resolve().parent.parent
SRC_CANDIDATES = [
    ROOT / "src/assets/agent-robot-source.mp4",
    ROOT / "videos/小尼平安机器人全身竖屏.mp4",
]
OUT_WEBP = ROOT / "src/assets/agent-robot.webp"
OUT_POSTER = ROOT / "src/assets/agent-robot-poster.png"
PREVIEW_DIR = ROOT / ".tmp/robot-preview"


# ===== 解码 =====
def decode_frames(src: Path, w: int, h: int) -> np.ndarray:
    """用 ffmpeg 解码成 (N, H, W, 4) 的 RGBA 数组。"""
    cmd = [
        "ffmpeg", "-v", "error", "-i", str(src),
        "-vf", f"scale={w}:{h}",
        "-f", "rawvideo", "-pix_fmt", "rgba", "-",
    ]
    res = subprocess.run(cmd, capture_output=True)
    if res.returncode != 0:
        raise RuntimeError(f"ffmpeg 解码失败：{res.stderr.decode('utf-8', 'ignore')[:400]}")
    data = res.stdout
    fs = w * h * 4
    n = len(data) // fs
    if n == 0:
        raise RuntimeError("ffmpeg 未解出任何帧")
    return np.frombuffer(data[: n * fs], dtype=np.uint8).reshape(n, h, w, 4)


# ===== 背景洪泛 =====
def flood_background(white: np.ndarray) -> np.ndarray:
    """
    从画布四边界洪泛，找出「与画外连通的纯白」。

    白色像素之间若有机器人轮廓阻隔，外壳白就连通不到画外 —— 这正是我们要的。
    """
    h, w = white.shape
    mask = np.zeros((h, w), dtype=bool)
    mask[0, :] = white[0, :]
    mask[-1, :] = white[-1, :]
    mask[:, 0] = white[:, 0]
    mask[:, -1] = white[:, -1]

    while True:
        nxt = mask.copy()
        nxt[1:, :] |= mask[:-1, :]
        nxt[:-1, :] |= mask[1:, :]
        nxt[:, 1:] |= mask[:, :-1]
        nxt[:, :-1] |= mask[:, 1:]
        nxt &= white
        if np.array_equal(nxt, mask):
            break
        mask = nxt
    return mask


def upsample_nearest(mask: np.ndarray, w: int, h: int) -> np.ndarray:
    """布尔掩膜最近邻上采样（只需要区域归属，不需要平滑）。"""
    ys = (np.arange(h) * mask.shape[0] / h).astype(int)
    xs = (np.arange(w) * mask.shape[1] / w).astype(int)
    return mask[ys][:, xs]


def dilate1(mask: np.ndarray) -> np.ndarray:
    """4 邻域膨胀一圈。"""
    out = mask.copy()
    out[1:, :] |= mask[:-1, :]
    out[:-1, :] |= mask[1:, :]
    out[:, 1:] |= mask[:, :-1]
    out[:, :-1] |= mask[:, 1:]
    return out


def judge_mask(white: np.ndarray) -> np.ndarray:
    """
    在判定尺度上洪泛出背景区。

    JUDGE_SCALE < 1 时先降采样再洪泛；降采样会丢掉轮廓的抗锯齿暗线，
    外壳白会与背景白连通而被吞，所以默认保持全分辨率。
    """
    if JUDGE_SCALE >= 1.0:
        return flood_background(white)
    h = max(8, int(white.shape[0] * JUDGE_SCALE))
    w = max(8, int(white.shape[1] * JUDGE_SCALE))
    ys = (np.arange(h) * white.shape[0] // h)
    xs = (np.arange(w) * white.shape[1] // w)
    small_white = white[ys][:, xs]
    bg_small = flood_background(small_white)
    return upsample_nearest(bg_small, white.shape[1], white.shape[0])


# ===== 单帧抠像 =====
def key_frame(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    返回 (alpha_u8, bg_mask)。

    alpha 规则：
      · 背景核心（与画外连通的纯白）→ 0
      · 背景核心 1px 邻域内的灰阶 → 按亮度线性过渡（抗锯齿软边）
      · 其余（含被围住的纯白 = 机器人外壳）→ 255
    """
    lum = rgb.min(axis=2)
    white = lum >= WHITE_LEVEL

    bg = judge_mask(white)

    alpha = np.full(lum.shape, 255, dtype=np.uint8)
    # 背景核心：全透明
    alpha[bg] = 0
    # 背景核心外一圈：只对「非纯白」的灰阶做软过渡；
    # 纯白且在核心外 → 是被轮廓围住的外壳白，必须保留不透明。
    ring = dilate1(bg) & ~bg
    soft = ring & (lum < WHITE_LEVEL)
    alpha[soft] = np.clip(
        (WHITE_LEVEL - lum[soft]).astype(np.float32) * 255.0 / (WHITE_LEVEL - SOFT_LO),
        0, 255,
    ).astype(np.uint8)
    return alpha, bg


def color_bleed(rgb: np.ndarray, alpha: np.ndarray, iterations: int = 2) -> np.ndarray:
    """
    把不透明像素的颜色外扩到半透明边缘。

    有损 WebP 会对透明边缘的 RGB 做量化，若那里留着背景白，深色底上就会起白边；
    先用邻近主体色填满边缘，再交给编码器，可显著减轻色边。
    """
    known = alpha >= 250
    out = rgb.astype(np.float32).copy()
    k = known.astype(np.float32)
    for _ in range(iterations):
        pad_rgb = np.pad(out, ((1, 1), (1, 1), (0, 0)))
        pad_k = np.pad(k, ((1, 1), (1, 1)))
        acc = np.zeros_like(out)
        wsum = np.zeros(out.shape[:2], dtype=np.float32)
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            s_rgb = pad_rgb[1 + dy : 1 + dy + out.shape[0], 1 + dx : 1 + dx + out.shape[1]]
            s_k = pad_k[1 + dy : 1 + dy + out.shape[0], 1 + dx : 1 + dx + out.shape[1]]
            acc += s_rgb * s_k[..., None]
            wsum += s_k
        fillable = (~known) & (wsum > 0)
        if not fillable.any():
            break
        out[fillable] = acc[fillable] / wsum[fillable][..., None]
        k = np.where(fillable, 1.0, k)
        known = k > 0
    return np.clip(out, 0, 255).astype(np.uint8)


# ===== 编码 =====
def save_webp(frames: list[Image.Image], path: Path) -> int:
    """原子写盘：先写临时文件再 replace，失败不破坏既有产物。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp.webp")
    os.close(fd)
    try:
        frames[0].save(
            tmp,
            format="WEBP",
            save_all=True,
            append_images=frames[1:],
            duration=FRAME_DURATION_MS,
            loop=0,
            quality=WEBP_QUALITY,
            method=WEBP_METHOD,
        )
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    return path.stat().st_size


def save_png(img: Image.Image, path: Path) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp.png")
    os.close(fd)
    try:
        img.save(tmp, format="PNG")
        os.replace(tmp, path)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    return path.stat().st_size


def save_preview(img: Image.Image, path: Path) -> None:
    """生成「深蓝大屏底 + 棋盘格」预览图，用于肉眼核验透明边缘。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    bg = Image.new("RGBA", img.size, (5, 18, 42, 255))
    checker = Image.new("RGBA", img.size, (255, 255, 255, 26))
    px = checker.load()
    for y in range(img.size[1]):
        for x in range(img.size[0]):
            if ((x // 12) + (y // 12)) % 2 == 0:
                px[x, y] = (255, 255, 255, 26)
    bg.alpha_composite(checker)
    bg.alpha_composite(img)
    bg.convert("RGB").save(path)


# ===== 主流程 =====
def main() -> int:
    global WEBP_QUALITY, JUDGE_SCALE, SMOOTH_FRAMES

    ap = argparse.ArgumentParser(description="生成小尼平安机器人透明动态素材")
    ap.add_argument("--width", type=int, default=OUT_W)
    ap.add_argument("--height", type=int, default=OUT_H)
    ap.add_argument("--quality", type=int, default=WEBP_QUALITY)
    ap.add_argument("--src", type=str, default="")
    ap.add_argument("--judge-scale", type=float, default=JUDGE_SCALE,
                    help="洪泛判定尺度，1.0=全分辨率（推荐）；<1 会因丢失轮廓暗线而吞掉外壳白")
    ap.add_argument("--smooth", type=int, default=SMOOTH_FRAMES,
                    help="相邻帧 alpha 的中值平滑窗口（0=关闭，2=取 3 帧中值）")
    args = ap.parse_args()

    WEBP_QUALITY = args.quality
    JUDGE_SCALE = args.judge_scale
    SMOOTH_FRAMES = args.smooth

    src = Path(args.src) if args.src else next((p for p in SRC_CANDIDATES if p.exists()), None)
    if src is None:
        print("找不到源视频，请用 --src 指定", file=sys.stderr)
        return 1
    print(f"源视频：{src.relative_to(ROOT) if src.is_relative_to(ROOT) else src}")

    frames = decode_frames(src, args.width, args.height)
    n = len(frames)
    print(f"解码 {n} 帧 @ {args.width}×{args.height}")

    rgb_all = frames[:, :, :, :3]
    lum_all = rgb_all.min(axis=3)
    subject = lum_all < 235  # 主体（含外壳阴影等非白像素）

    # ---- 逐帧抠像 ----
    alphas: list[np.ndarray] = []
    bgs: list[np.ndarray] = []
    for i in range(n):
        a, bg = key_frame(rgb_all[i])
        alphas.append(a)
        bgs.append(bg)

    # ---- 时域平滑：3 帧中值，消除逐帧掩膜抖动（默认关闭，全分辨率洪泛已足够稳）----
    smoothed: list[np.ndarray] = []
    for i in range(n):
        if SMOOTH_FRAMES >= 2:
            lo = max(0, i - 1)
            hi = min(n, i + 2)
            stack = np.stack(alphas[lo:hi], axis=0)
            smoothed.append(np.median(stack, axis=0).astype(np.uint8))
        else:
            smoothed.append(alphas[i])

    # ---- 颜色扩散 ----
    out_frames: list[Image.Image] = []
    for i in range(n):
        bled = color_bleed(rgb_all[i], smoothed[i])
        rgba = np.dstack([bled, smoothed[i]])
        out_frames.append(Image.fromarray(rgba, "RGBA"))

    # ---- 自检指标 ----
    # 口径说明：alpha 落在 (10, 250) 的是轮廓抗锯齿软边（正常），
    # 只有 alpha < 10（完全丢失）才算「误判为背景」。
    alpha_stack = np.stack(smoothed, axis=0)
    bg_stack = np.stack(bgs, axis=0)
    subject_lost = (alpha_stack < 10) & subject
    enclosed_white = (lum_all >= 250) & (~bg_stack)  # 被轮廓围住的纯白 = 外壳
    shell_lost = (alpha_stack < 10) & enclosed_white
    transparent_bg = (alpha_stack < 10) & bg_stack
    n_subject = subject.sum()
    n_shell = enclosed_white.sum()
    soft_band = ((alpha_stack >= 10) & (alpha_stack < 250)).sum()
    print("—— 自检 ——")
    print(f"主体像素 {n_subject}，被完全抠掉 {subject_lost.sum()} "
          f"({subject_lost.sum() / max(n_subject, 1) * 100:.3f}%)  目标 <0.5%")
    print(f"外壳白像素 {n_shell}，被完全抠掉 {shell_lost.sum()} "
          f"({shell_lost.sum() / max(n_shell, 1) * 100:.3f}%)  目标 <2%")
    print(f"背景区透明率 {transparent_bg.sum() / max(bg_stack.sum(), 1) * 100:.2f}%  目标 >99%")
    print(f"软边像素（正常过渡）{soft_band}，占画面 {soft_band / alpha_stack.size * 100:.2f}%")

    # ---- 像素级回归：抠像只改 alpha，主体区 RGB 必须逐像素不变 ----
    sample = out_frames[n // 2]
    orig = rgb_all[n // 2]
    sm = smoothed[n // 2]
    keep = sm >= 250
    rgb_diff = np.abs(orig.astype(np.int16) - np.array(sample)[..., :3].astype(np.int16)).max(axis=2)
    rgb_diff = rgb_diff[keep]
    print(f"主体区 RGB 最大偏差 {rgb_diff.max() if rgb_diff.size else 0}（色扩散只作用于半透明边缘）")

    # ---- 落盘 ----
    webp_bytes = save_webp(out_frames, OUT_WEBP)
    poster_bytes = save_png(out_frames[0], OUT_POSTER)
    print(f"→ {OUT_WEBP.relative_to(ROOT)}  {webp_bytes / 1024:.0f}KB")
    print(f"→ {OUT_POSTER.relative_to(ROOT)}  {poster_bytes / 1024:.0f}KB")
    if webp_bytes > MAX_BYTES:
        print(f"⚠️ 体积 {webp_bytes / 1024:.0f}KB 超过上限 {MAX_BYTES / 1024:.0f}KB，"
              f"建议降分辨率（--width/--height）或提高 --quality", file=sys.stderr)

    # ---- 编码往返验证 + 预览图 ----
    check = Image.open(OUT_WEBP)
    n_check = 0
    while True:
        try:
            check.seek(n_check)
        except EOFError:
            break
        n_check += 1
    dec = check.convert("RGBA")
    a_hist = dec.getchannel("A").histogram()
    print(f"WebP 往返：帧数 {n_check}（源 {n}），alpha=0 像素 {a_hist[0]}，"
          f"alpha=255 像素 {a_hist[255]}")
    for idx in (0, n // 2, n - 1):
        check.seek(idx)
        save_preview(check.convert("RGBA"), PREVIEW_DIR / f"frame-{idx:03d}.png")
    print(f"预览图 → {PREVIEW_DIR.relative_to(ROOT)}/frame-000.png 等 3 张（深蓝底 + 棋盘格）")

    ok = (
        subject_lost.sum() / max(n_subject, 1) < 0.005
        and shell_lost.sum() / max(n_shell, 1) < 0.02
        and n_check == n
        and a_hist[0] > 1000
    )
    print("结论：", "通过 ✔" if ok else "未达标 ✘")
    return 0 if ok else 2


if __name__ == "__main__":
    sys.exit(main())
