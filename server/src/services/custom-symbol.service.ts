import db from '../config/db.js'
import { deleteFile } from './upload.service.js'

// ============================================================
// 自定义图元 Service
//
// 平台内新增的图元：元数据入 Prisma，产品图入 OSS。
// 校验规则与图元库构建期一致（symbol-library/src/build.mjs 第 5 节），
// 保证自定义图元与内置图元在渲染层可互换。
// ============================================================

/** 图元 ID 命名规范：类别-对象-序号 */
const ID_RE = /^[A-Z]{2,4}-[A-Z]{2,5}-\d{2}$/

/** 连接点方向 */
const PORT_DIRS = ['left', 'right', 'up', 'down']

/** 图元库已声明的状态类（与 manifest.spec.stateColors 同源） */
const STATE_CLASSES = [
  'is-run', 'is-off', 'is-fault', 'is-manual', 'is-open',
  'is-closed', 'is-over', 'is-flow', 'is-alarm', 'is-discharge',
]

/** 绑定点类型 */
const BINDING_KINDS = ['bool', 'level', 'angle', 'text']

/** 连接点 */
export interface SymbolPort {
  x: number
  y: number
  dir: 'left' | 'right' | 'up' | 'down'
}

/** 绑定点 */
export interface SymbolBinding {
  /** 绑定名，如「运行」「液位」 */
  name: string
  /** 绑定类型 */
  kind: 'bool' | 'level' | 'angle' | 'text'
  /** 点名，全局唯一 */
  point: string
  /** 置位时启用的状态类 */
  onClass?: string[]
  /** 复位时启用的状态类 */
  offClass?: string[]
  /** 单位 */
  unit?: string
  /** 量程下限 */
  min?: number
  /** 量程上限 */
  max?: number
  /** 报警下限 */
  alarmLo?: number
  /** 报警上限 */
  alarmHi?: number
}

/** 新增/更新表单 */
export interface CustomSymbolForm {
  symbolId: string
  name: string
  system: string
  category: string
  desc?: string
  imageUrl: string
  imageKey?: string
  /** [x0,y0,x1,y1]，512 空间 */
  bbox?: number[]
  ports?: SymbolPort[]
  bindings?: SymbolBinding[]
  enterpriseId?: number | null
}

function bad(message: string): never {
  throw Object.assign(new Error(message), { statusCode: 400 })
}

function parseJSON<T>(raw: string, fallback: T): T {
  try {
    const v = JSON.parse(raw)
    return (v ?? fallback) as T
  } catch {
    return fallback
  }
}

function toItem(r: any) {
  return {
    id: r.id,
    symbolId: r.symbolId,
    name: r.name,
    system: r.system,
    category: r.category,
    desc: r.desc || '',
    imageUrl: r.imageUrl,
    imageKey: r.imageKey || '',
    bbox: parseJSON<number[]>(r.bboxJson, []),
    ports: parseJSON<SymbolPort[]>(r.portsJson, []),
    bindings: parseJSON<SymbolBinding[]>(r.bindingsJson, []),
    enterpriseId: r.enterpriseId,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

// ===== 校验 =====

/**
 * 校验图元表单
 * @param form 表单
 * @param excludeId 更新时排除自身（点名唯一性检查）
 */
async function validate(form: CustomSymbolForm, excludeId?: number) {
  const symbolId = (form.symbolId || '').trim().toUpperCase()
  if (!ID_RE.test(symbolId)) {
    bad('图元 ID 不符合命名规范（类别-对象-序号，如 CUS-PUMP-01）')
  }

  const name = (form.name || '').trim()
  if (!name) bad('请填写图元名称')

  if (!form.imageUrl) bad('请先上传产品图')

  const ports = form.ports ?? []
  for (const p of ports) {
    if (typeof p.x !== 'number' || typeof p.y !== 'number') bad('连接点坐标非法')
    if (p.x < 0 || p.x > 64 || p.y < 0 || p.y > 64) bad(`连接点越界：${p.x},${p.y}`)
    if (!PORT_DIRS.includes(p.dir)) bad(`连接点方向非法：${p.dir}`)
  }

  const bindings = form.bindings ?? []
  if (!bindings.length) bad('请至少定义一个绑定点')

  const pointSet = new Set<string>()
  for (const b of bindings) {
    if (!b.name || !String(b.name).trim()) bad('绑定点名称不能为空')
    if (!BINDING_KINDS.includes(b.kind)) bad(`绑定点类型非法：${b.kind}`)
    const point = (b.point || '').trim()
    if (!point) bad(`绑定点「${b.name}」缺少点名`)
    if (pointSet.has(point)) bad(`点名重复：${point}`)
    pointSet.add(point)
    for (const c of [...(b.onClass ?? []), ...(b.offClass ?? [])]) {
      if (!STATE_CLASSES.includes(c)) bad(`绑定点「${b.name}」使用了未声明的状态类 ${c}`)
    }
  }

  // 图元 ID 唯一（自定义表内 + 不与内置图元冲突）
  const dup = await db.customSymbol.findFirst({
    where: { symbolId, ...(excludeId ? { id: { not: excludeId } } : {}) },
  })
  if (dup) bad(`图元 ID 已存在：${symbolId}`)

  // 点名全局唯一：自定义图元之间
  const others = await db.customSymbol.findMany({
    where: excludeId ? { id: { not: excludeId } } : {},
    select: { bindingsJson: true },
  })
  for (const o of others) {
    const list = parseJSON<SymbolBinding[]>(o.bindingsJson, [])
    for (const b of list) {
      if (pointSet.has(b.point)) bad(`点名已被其他图元占用：${b.point}`)
    }
  }
}

// ===== 列表 =====

/**
 * 自定义图元列表
 * 平台级（enterpriseId=null）始终可见；企业私有图元仅所属企业可见
 */
export async function getList(userId: number) {
  const relations = await db.userEnterprise.findMany({
    where: { userId, status: 1 },
    select: { enterpriseId: true },
  })
  const enterpriseIds = relations.map((r) => r.enterpriseId)

  const rows = await db.customSymbol.findMany({
    where: { OR: [{ enterpriseId: null }, { enterpriseId: { in: enterpriseIds } }] },
    orderBy: [{ createdAt: 'desc' }],
  })
  return rows.map(toItem)
}

/** 单个自定义图元 */
export async function getDetail(id: number) {
  const row = await db.customSymbol.findUnique({ where: { id } })
  if (!row) throw Object.assign(new Error('图元不存在'), { statusCode: 404 })
  return toItem(row)
}

// ===== 新增 =====

export async function create(form: CustomSymbolForm, createdBy: number) {
  await validate(form)

  const row = await db.customSymbol.create({
    data: {
      symbolId: form.symbolId.trim().toUpperCase(),
      name: form.name.trim(),
      system: form.system,
      category: form.category,
      desc: form.desc ?? '',
      imageUrl: form.imageUrl,
      imageKey: form.imageKey ?? '',
      bboxJson: JSON.stringify(form.bbox ?? []),
      portsJson: JSON.stringify(form.ports ?? []),
      bindingsJson: JSON.stringify(form.bindings ?? []),
      enterpriseId: form.enterpriseId ?? null,
      createdBy,
    },
  })

  return toItem(row)
}

// ===== 更新 =====

export async function update(id: number, form: Partial<CustomSymbolForm>) {
  const cur = await db.customSymbol.findUnique({ where: { id } })
  if (!cur) throw Object.assign(new Error('图元不存在'), { statusCode: 404 })

  const merged: CustomSymbolForm = {
    symbolId: form.symbolId ?? cur.symbolId,
    name: form.name ?? cur.name,
    system: form.system ?? cur.system,
    category: form.category ?? cur.category,
    desc: form.desc ?? cur.desc,
    imageUrl: form.imageUrl ?? cur.imageUrl,
    imageKey: form.imageKey ?? cur.imageKey,
    bbox: form.bbox ?? parseJSON<number[]>(cur.bboxJson, []),
    ports: form.ports ?? parseJSON<SymbolPort[]>(cur.portsJson, []),
    bindings: form.bindings ?? parseJSON<SymbolBinding[]>(cur.bindingsJson, []),
    enterpriseId: form.enterpriseId ?? cur.enterpriseId,
  }
  await validate(merged, id)

  const row = await db.customSymbol.update({
    where: { id },
    data: {
      symbolId: merged.symbolId.trim().toUpperCase(),
      name: merged.name.trim(),
      system: merged.system,
      category: merged.category,
      desc: merged.desc ?? '',
      imageUrl: merged.imageUrl,
      imageKey: merged.imageKey ?? '',
      bboxJson: JSON.stringify(merged.bbox ?? []),
      portsJson: JSON.stringify(merged.ports ?? []),
      bindingsJson: JSON.stringify(merged.bindings ?? []),
      enterpriseId: merged.enterpriseId ?? null,
    },
  })

  // 换了产品图 → 清理旧图对象
  if (cur.imageKey && cur.imageKey !== merged.imageKey) {
    await deleteFile(cur.imageKey)
  }

  return toItem(row)
}

// ===== 删除（连带清理 OSS 产品图） =====

export async function remove(id: number) {
  const cur = await db.customSymbol.findUnique({ where: { id } })
  if (!cur) throw Object.assign(new Error('图元不存在'), { statusCode: 404 })

  await db.customSymbol.delete({ where: { id } })

  if (cur.imageKey) {
    try {
      await deleteFile(cur.imageKey)
    } catch {
      // OSS 清理失败不阻断删除：记录已删，残留对象由运维清理
    }
  }
}
