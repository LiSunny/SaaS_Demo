/**
 * 从本地头像池随机取一个头像
 * 替代 api.dicebear.com（大陆被墙）
 */
const AVATAR_POOL = [
  '赵总', '孙安全员', '李明辉', '刘师傅', '王厂长', '刘班长', '陈监管',
  '林局长', '钱主管', '吴站长', '陈校长', '刘老师', '王世豪',
  '张老师', '马老师', '王姐', '李师傅', '赵师傅', '张师傅', '王师傅',
  '小李', '小王', '小陈', '老张', '老刘', '老周', '周总', '刘科长', '李科长', '张工',
]

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return Math.abs(h)
}

export function avatarUrl(name: string) {
  const idx = hashStr(name) % AVATAR_POOL.length
  const avatarName = AVATAR_POOL[idx]
  return `/images/avatars/${encodeURIComponent(avatarName)}.svg`
}

/** 缺文件时的兜底头像 */
export const DEFAULT_AVATAR_URL = '/images/avatars/default-user.svg'

/** 按人名取精确头像（门户页角色卡 / 案例协作层用） */
export function avatarSrc(name: string): string {
  return `/images/avatars/${encodeURIComponent(name)}.svg`
}

/**
 * 头像文件缺失时的回退：换成默认头像，避免留下裂图和 404。
 * 用 dataset 标记只回退一次，防止默认头像自己也 404 时死循环。
 */
export function fallbackAvatar(e: Event): void {
  const el = e.target as HTMLImageElement | null
  if (!el || el.dataset.avatarFallback === '1') return
  el.dataset.avatarFallback = '1'
  el.src = DEFAULT_AVATAR_URL
}
