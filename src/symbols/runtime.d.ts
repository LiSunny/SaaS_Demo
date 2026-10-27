/**
 * 图元库产物类型声明
 *
 * 图元库是仓库内自洽子工程（symbol-library/），产物为纯 JS，TypeScript 无法直接推断。
 * 这里用环境模块声明描述其导出形状，让 vue-tsc 能对图元渲染做类型检查。
 *
 * 对应产物：
 *   symbol-library/dist/symbols.js   → MANIFEST / GEOMETRY / GEOMETRY_IMAGE
 *   symbol-library/dist/runtime.js   → createRuntime
 */

declare module '@symbols/symbols.js' {
  /** 连接点（图元四周的接线位置） */
  export interface SymbolPort {
    x: number
    y: number
    /** 出线方向：left / right / up / down */
    dir: string
  }

  /** 动态绑定 —— 把现场点位接到图元的状态或数值上 */
  export interface SymbolBinding {
    /** 绑定名（中文），如「运行」「液位」 */
    name: string
    /** bool 状态量 / level 液位 / angle 表盘指针 / text 数值显示 */
    kind: 'bool' | 'level' | 'angle' | 'text'
    /** 点名 */
    point: string
    unit?: string
    min?: number
    max?: number
    bottom?: number
    maxH?: number
    minAngle?: number
    maxAngle?: number
    textIndex?: number
    onClass?: string[]
    offClass?: string[]
    spin?: boolean
    spinTarget?: string
    needleTarget?: string
  }

  /** 一个图元的完整定义 */
  export interface SymbolDef {
    id: string
    name: string
    category: string
    /** 所属系统（一级分类），默认取分类的 system，可由图元自身覆盖 */
    system: string
    /** 建议画面编号，默认取分类的 screen */
    screen?: string | null
    desc: string
    size: { w: number; h: number }
    anchor: [number, number]
    ports: SymbolPort[]
    pivots?: Record<string, [number, number]>
    /** 图片版位图文件名（相对 dist/img） */
    image?: string
    styles: string[]
    bindings: SymbolBinding[]
  }

  /** 一级分类：系统归属 */
  export interface SymbolSystemMeta {
    key: string
    name: string
    desc?: string
    /** 该系统下的二级分类键 */
    categories: string[]
    /** 该系统下的图元 ID */
    symbols: string[]
  }

  /** 二级分类：部件类别 */
  export interface SymbolCategoryMeta {
    key: string
    name: string
    system: string
    screen: string
    count: number
  }

  export interface SymbolManifest {
    name: string
    version: string
    spec: {
      canvas: { w: number; h: number }
      anchor: [number, number]
      grid: number
      stateColors: Record<string, string>
    }
    /** 分类 → 建议画面编号 */
    screens: Record<string, string>
    /** 分类树：一级系统 → 二级分类 */
    systems: SymbolSystemMeta[]
    categories: SymbolCategoryMeta[]
    symbols: SymbolDef[]
  }

  export const MANIFEST: SymbolManifest
  /** 线框版几何：图元 ID → SVG 片段 */
  export const GEOMETRY: Record<string, string>
  /** 图片版几何：图元 ID → SVG 片段（含 <image>） */
  export const GEOMETRY_IMAGE: Record<string, string>
}

declare module '@symbols/runtime.js' {
  export interface RenderOptions {
    /** image 图片版 / line 线框版 */
    style?: 'image' | 'line'
    /** 渲染边长 */
    size?: number
    /** 图元下方标签 */
    label?: string
    /** 图片版位图目录前缀 */
    imageBase?: string
    /** 是否画出连接点 */
    showPorts?: boolean
  }

  export interface SymbolRuntime {
    renderSymbol(id: string, opts?: RenderOptions): SVGSVGElement
    /** 按绑定名赋值：{ 运行: true } */
    applyState(svg: SVGSVGElement, state?: Record<string, unknown>): SVGSVGElement
    /** 按点名赋值：{ PMP_FIRE_01_RUN: 1 } */
    applyData(svg: SVGSVGElement, points?: Record<string, unknown>): SVGSVGElement
    resetState(svg: SVGSVGElement): SVGSVGElement
    showPorts(svg: SVGSVGElement): void
    defs: Map<string, unknown>
  }

  export function createRuntime(
    manifest: unknown,
    geometry: Record<string, string>,
    geometryImage?: Record<string, string>,
  ): SymbolRuntime

  export function formatValue(v: unknown, unit?: string): string
}
