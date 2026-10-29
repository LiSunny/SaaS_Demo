/**
 * rng.js — 可复现随机数工具
 *
 * ★ 团队只读基线。所有模块必须使用 seeded RNG，禁止 Math.random()。
 */

/** mulberry32 伪随机数发生器，返回 [0,1) */
export function makeRNG(seed = 1) {
  let s = (seed >>> 0) || 1;
  return function rng() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 从数组中随机取一个元素 */
export function pick(rng, array) {
  if (!Array.isArray(array) || array.length === 0) return undefined;
  return array[Math.min(array.length - 1, Math.floor(rng() * array.length))];
}

/** 闭区间随机整数 */
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** 左闭右开随机浮点 */
export function randRange(rng, min, max) {
  return min + rng() * (max - min);
}

/** 按权重挑选：items = [[value, weight], ...] */
export function pickWeighted(rng, items) {
  const total = items.reduce((sum, it) => sum + it[1], 0);
  if (total <= 0) return undefined;
  let r = rng() * total;
  for (const [value, weight] of items) {
    r -= weight;
    if (r <= 0) return value;
  }
  return items[items.length - 1][0];
}

/** 由字符串生成稳定数值种子 */
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export default makeRNG;
