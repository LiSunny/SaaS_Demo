/**
 * 组态配置 — 类型定义
 *
 * 画面布局的 nodes/edges 结构与图元库 `symbol-library/src/layouts/demo-firewater.json`
 * 保持一致，导出 JSON 可被外部系统直接消费。
 */

/** 图形风格：图片版（扁平拟物实物图）/ 线框版（工程符号） */
export type SceneStyle = 'image' | 'line'

/** 画面状态 */
export type SceneStatus = 'draft' | 'published' | 'disabled'

/** 画布节点 —— 一个图元在画面上的实例 */
export interface SceneNode {
  id: string
  /** 图元 ID，取自图元库 manifest.symbols[].id */
  symbol: string
  /** 画布坐标（图元中心） */
  x: number
  y: number
  /** 图元边长档位：40 / 48 / 60 / 72 / 96 */
  size: number
  /** 显示标签 */
  label?: string
  /** 绑定点名，来源图元库点表 */
  point?: string
  /** 显示值文本 */
  value?: string
  /** 状态标志：run / fault / alarm / discharge / manual / open / closed / off */
  state?: Record<string, boolean>
}

/** 连线 —— 两个节点端口之间的连接 */
export interface SceneEdge {
  id: string
  /** kind=control 的电气连线不经过端口，port 可省略 */
  from: { node: string; port?: number }
  to: { node: string; port?: number }
  /** 折点坐标数组（正交路径拐点） */
  via?: [number, number][]
  /** pipe 管道连线 / control 电气虚线 */
  kind?: 'pipe' | 'control'
}

/** 组态画面 */
export interface SceneConfig {
  id: string
  /** 画面名称 */
  name: string
  /** 归属系统：pipeline / gas / smoke / custom */
  systemKey: string
  /** 归属对象（区域、楼栋等） */
  scope: string
  /** 画布宽高 */
  width: number
  height: number
  /** 图形风格 */
  style: SceneStyle
  /** 画面状态 */
  status: SceneStatus
  nodes: SceneNode[]
  edges: SceneEdge[]
  remark?: string
  createdAt: number
  updatedAt: number
}

/** 列表查询条件 */
export interface SceneQuery {
  /** 画面名称关键词 */
  name?: string
  /** 画面状态 */
  status?: SceneStatus | ''
  /** 归属系统 */
  systemKey?: string
  page: number
  size: number
}

/** 编辑器选中项 */
export type SceneSelection =
  | { type: 'node'; id: string }
  | { type: 'edge'; id: string }
  | null

/** 导出 JSON 的信封格式（与图元库一致） */
export interface SceneLayoutFile {
  version: number
  name: string
  nodes: SceneNode[]
  edges: SceneEdge[]
}
