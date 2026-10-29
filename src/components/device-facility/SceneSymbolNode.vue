<template>
  <svg ref="host" class="sym-node" />
</template>

<script setup lang="ts">
/**
 * 画布上的单个图元
 *
 * 宿主是 <svg> 而不是 <div>：画布里节点是 SVG 的 <g>，里面只能放 SVG 元素。
 * 图元几何来自图元库产物（runtime.renderSymbol），不重画；
 * 状态用 is-* 类名驱动（运行 / 故障 / 手动 / 阀开 / 阀关）。
 */
 
import { onMounted, ref, watch } from 'vue'
import { IMAGE_BASE, SYMBOL_REGISTRY_VERSION, renderSymbolSafe, stateClasses } from '@/symbols'
import type { SceneStyle } from '@/types/scene-config'

const props = withDefaults(
  defineProps<{
    /** 图元 ID */
    symbol: string
    /** 图元边长 */
    size?: number
    /** image 图片版 / line 线框版 */
    variant?: SceneStyle
    /** 显示值文本 */
    value?: string
    /** 状态标志 */
    state?: Record<string, boolean>
  }>(),
  { size: 60, variant: 'image' },
)

const host = ref<SVGSVGElement | null>(null)

/** 已构建的符号几何（符号/尺寸/样式），只有它变了才重建 innerHTML */
let builtKey = ''
/** 上一次施加的状态类，用于换状态时清掉旧类 */
let lastStateClasses: string[] = []

function draw() {
  const el = host.value
  if (!el) return

  // 图元尚未注册（自定义图元异步拉取中）时留空，注册完成后重绘
  const src = renderSymbolSafe(props.symbol, {
    style: props.variant,
    size: props.size,
    imageBase: IMAGE_BASE,
  })
  if (!src) return

  /**
   * 几何与状态分开重建：
   * 位图版图元的几何里含 <image>（512×512 PNG），
   * 重建 innerHTML 会把位图节点整个换掉，浏览器必须重新栅格化；
   * 状态类只改 class，不动几何。
   */
  const key = `${props.symbol}|${props.size}|${props.variant}`
  if (key !== builtKey) {
    el.setAttribute('viewBox', src.getAttribute('viewBox') || '0 0 64 64')
    el.setAttribute('width', src.getAttribute('width') || '')
    el.setAttribute('height', src.getAttribute('height') || '')
    el.setAttribute('data-sym-id', props.symbol)
    el.setAttribute('data-style', src.getAttribute('data-style') || props.variant)
    el.setAttribute('class', 'sym-root')
    el.innerHTML = src.innerHTML
    builtKey = key
    lastStateClasses = []
  }

  // 状态类：先摘掉上一轮的，再挂当前的
  for (const c of lastStateClasses) el.classList.remove(c)
  lastStateClasses = stateClasses(props.state)
  for (const c of lastStateClasses) el.classList.add(c)

  if (props.value) {
    const v = el.querySelector('.sym-val')
    if (v) v.textContent = props.value
  }
}

onMounted(draw)

/**
 * 多源 watch：逐项按值比较，任一项真的变了才重画。
 *
 * 不能写成 `watch(() => [props.symbol, ...], draw)`——getter 每次返回新数组，
 * 引用永远不同，watch 判定为"变化"，于是每轮刷新都会重建 SVG 与其中的位图，
 * 12 张 512×512 PNG 被反复重新栅格化，刷新因此周期性卡顿。
 */
watch(
  [
    () => props.symbol,
    () => props.size,
    () => props.variant,
    () => props.value,
    () => JSON.stringify(props.state),
  ],
  draw,
)

// 自定义图元注册完成后重绘（几何需要重建）
watch(SYMBOL_REGISTRY_VERSION, () => {
  builtKey = ''
  draw()
})
</script>

<style scoped>
.sym-node {
  display: block;
  overflow: visible;
}
</style>
