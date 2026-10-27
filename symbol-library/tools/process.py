#!/usr/bin/env python3
"""原始生成图 → 透明 PNG 图元（512×512，统一光学尺寸）。

分割思路：泛洪 + 铺平 + 硬切。

1. 背景阈值自适应：取四周边缘环 90 分位作为影棚背景参考亮度，阈值 = 参考 - BG_DROP。
   固定阈值 247 对非纯白背景会失效（实测某张原图背景最亮仅 246，整块白底残留）。
2. 泛洪找出与边缘连通的背景：要求亮度高于阈值且局部平坦，避免渗进金属高光。
3. 把背景铺平成纯白，再按 247 硬切，得到干净轮廓。
4. 反预乘还原边缘颜色，消除白边。
5. 剔除脱离主体、明显偏暗的卫星块（影棚地面投影残留）。

个别图元物体本身接近白色（浅灰管道），固定阈值会吃掉物体，用 THRESHOLD 单独指定。
"""
import os, sys, json
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'assets', 'raw')
OUT = os.path.join(ROOT, 'dist', 'img')
SIZE = 512
MARGIN = 8
BG_DROP = 20.0          # 背景阈值 = 背景参考亮度 - BG_DROP
FLAT_GRAD = 7.0         # 背景像素允许的最大局部梯度
WHITE = 247.0           # 铺平后的纯白切阈值
EDGE_FEATHER = 0.6
SAT_RATIO = 0.80        # 卫星块相对主体的亮度上限
SAT_AREA = 0.40         # 卫星块相对主体的面积上限

# 物体本身接近白色时，背景阈值必须高于物体亮度，否则泛洪会吃掉物体
THRESHOLD = {
    'PIP-TEE-01': 247.0,
}


def _flood(cand, seed):
    """在 cand 允许的像素上从 seed 向内泛洪"""
    bg = seed.copy()
    h, w = cand.shape
    for _ in range(h + w):
        prev = bg.sum()
        p = np.pad(bg, 1)
        bg = bg | (cand & (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:] |
                           p[:-2, :-2] | p[:-2, 2:] | p[2:, :-2] | p[2:, 2:]))
        if bg.sum() == prev:
            break
    return bg


def _border_seed(cand):
    seed = np.zeros_like(cand)
    seed[0, :] = cand[0, :]
    seed[-1, :] = cand[-1, :]
    seed[:, 0] = cand[:, 0]
    seed[:, -1] = cand[:, -1]
    return seed


def background_level(lum):
    """从四周边缘环估计影棚背景亮度"""
    border = np.concatenate([lum[0, :], lum[-1, :], lum[:, 0], lum[:, -1]])
    return float(np.percentile(border, 90))


def _local_grad(lum):
    ls = np.asarray(Image.fromarray(lum.astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)
    grad = np.zeros_like(ls)
    grad[:-1, :] = np.maximum(grad[:-1, :], np.abs(ls[:-1, :] - ls[1:, :]))
    grad[1:, :] = np.maximum(grad[1:, :], np.abs(ls[:-1, :] - ls[1:, :]))
    grad[:, :-1] = np.maximum(grad[:, :-1], np.abs(ls[:, :-1] - ls[:, 1:]))
    grad[:, 1:] = np.maximum(grad[:, 1:], np.abs(ls[:, :-1] - ls[:, 1:]))
    return grad


def _drop_dark_satellites(rgb, alpha):
    """剔除脱离主体、明显偏暗的连通块（影棚地面投影残留）"""
    fg = alpha > 128
    if not fg.any():
        return alpha
    lab = np.zeros(fg.shape, dtype=np.int32)
    cur = 0
    stack = []
    h, w = fg.shape
    for sy in range(h):
        for sx in range(w):
            if fg[sy, sx] and lab[sy, sx] == 0:
                cur += 1
                stack = [(sy, sx)]
                lab[sy, sx] = cur
                while stack:
                    y, x = stack.pop()
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w and fg[ny, nx] and lab[ny, nx] == 0:
                            lab[ny, nx] = cur
                            stack.append((ny, nx))
    if cur <= 1:
        return alpha
    stats = []
    for i in range(1, cur + 1):
        m = lab == i
        area = int(m.sum())
        lum = float(rgb[m].mean())
        stats.append((i, area, lum))
    main = max(stats, key=lambda s: s[1])
    out = alpha.copy()
    for i, area, lum in stats:
        if i == main[0]:
            continue
        if area < SAT_AREA * main[1] and lum < SAT_RATIO * main[2]:
            out[lab == i] = 0.0
    return out


def remove_background(im, thr=None):
    if max(im.size) > SIZE:
        im = im.convert('RGB').resize((SIZE, SIZE), Image.LANCZOS)
    rgb = np.asarray(im.convert('RGB')).astype(np.float32)
    lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]

    if thr is None:
        ref = background_level(lum)
        thr = max(ref - BG_DROP, ref * 0.78)

    grad = _local_grad(lum)
    if thr < WHITE:
        # 阈值低于纯白时需要梯度门限，避免泛洪渗进金属高光
        cand = (lum >= thr) & (grad <= FLAT_GRAD)
    else:
        cand = lum >= thr
    bg = _flood(cand, _border_seed(cand))

    flat = rgb.copy()
    flat[bg] = 255.0
    lum2 = 0.299 * flat[:, :, 0] + 0.587 * flat[:, :, 1] + 0.114 * flat[:, :, 2]
    cand2 = lum2 >= WHITE
    bg2 = _flood(cand2, _border_seed(cand2))

    alpha = np.where(bg2, 0.0, 255.0)
    alpha = _drop_dark_satellites(flat, alpha)

    a = alpha / 255.0
    edge = (a > 0.05) & (a < 0.98)
    if edge.any():
        rec = (flat[edge] - (1.0 - a[edge]) * 255.0) / a[edge]
        flat[edge] = np.clip(rec, 0.0, 255.0)

    out = Image.fromarray(np.dstack([flat.astype(np.uint8), alpha.astype(np.uint8)]), 'RGBA')
    return out.filter(ImageFilter.GaussianBlur(EDGE_FEATHER))


def fit_canvas(im):
    bbox = im.getbbox()
    if not bbox:
        return None, None
    im = im.crop(bbox)
    target = SIZE - 2 * MARGIN
    scale = target / max(im.size)
    w, h = (max(1, round(im.width * scale)), max(1, round(im.height * scale)))
    im = im.resize((w, h), Image.LANCZOS)
    canvas = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(im, ((SIZE - w) // 2, (SIZE - h) // 2))
    return canvas, im.size


def process(path, dest, index, sid):
    src = Image.open(path)
    cut = remove_background(src, THRESHOLD.get(sid))
    canvas, obj = fit_canvas(cut)
    if canvas is None:
        print(f'  ! {os.path.basename(path)} 抠图后为空')
        return False
    canvas.save(dest, 'PNG', optimize=True)
    alpha = np.asarray(canvas.getchannel('A'))
    cover = (alpha > 8).sum() / (SIZE * SIZE)
    ys, xs = np.where(alpha > 8)
    index[sid] = {
        'size': [canvas.width, canvas.height],
        'bbox': [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1],
    }
    print(f'  {sid:<14} 对象尺寸 {obj[0]}x{obj[1]}  画布占比 {cover:.0%}  内容框 {index[sid]["bbox"]}')
    return True


def main(ids):
    os.makedirs(OUT, exist_ok=True)
    ok = 0
    # 增量处理：保留已有内容框，只更新本次处理的图元，避免单张重跑抹掉其他图元的数据
    idx_path = os.path.join(OUT, 'index.json')
    index = {}
    if os.path.exists(idx_path):
        with open(idx_path) as f:
            index = json.load(f)
    for sid in ids:
        src = os.path.join(RAW, sid + '.png')
        if not os.path.exists(src):
            print(f'  ! 缺少原始图 {sid}')
            continue
        if process(src, os.path.join(OUT, sid + '.png'), index, sid):
            ok += 1
    if index:
        with open(idx_path, 'w') as f:
            json.dump(index, f, indent=2)
    print(f'处理完成 {ok}/{len(ids)}')


if __name__ == '__main__':
    args = sys.argv[1:]
    if args:
        main(args)
    else:
        files = sorted(f[:-4] for f in os.listdir(RAW) if f.endswith('.png') and not f.startswith('ref-'))
        main(files)
