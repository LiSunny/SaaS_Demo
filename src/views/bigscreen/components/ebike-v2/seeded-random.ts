/**
 * 确定性伪随机数
 *
 * 大屏上的演示数据不能每次刷新都变 —— 曲线会跳、警情会闪，值班员看着像故障。
 * 这里给一份「同一把种子永远同一串数」的工具：种子取自系统名 / 设备名，
 * 换系统换曲线、换设备换警情，刷新页面则完全一致。
 *
 * mulberry32：32 位状态、实现短、分布够均匀。
 */

/** 字符串 → 32 位散列（FNV-1a 变体） */
export function seedOf(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32：返回一个 [0, 1) 的随机数发生器 */
export function rngOf(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 从数组里取一项 */
export function pickOf<T>(rnd: () => number, list: readonly T[]): T {
  return list[Math.floor(rnd() * list.length)]
}
