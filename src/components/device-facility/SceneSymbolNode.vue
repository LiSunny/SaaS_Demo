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

  el.setAttribute('viewBox', src.getAttribute('viewBox') || '0 0 64 64')
  el.setAttribute('width', src.getAttribute('width') || '')
  el.setAttribute('height', src.getAttribute('height') || '')
  el.setAttribute('data-sym-id', props.symbol)
  el.setAttribute('data-style', src.getAttribute('data-style') || props.variant)
  el.setAttribute('class', 'sym-root')
  el.innerHTML = src.innerHTML

  stateClasses(props.state).forEach((c) => el.classList.add(c))
  if (props.value) {
    const v = el.querySelector('.sym-val')
    if (v) v.textContent = props.value
  }
}

onMounted(draw)
watch(() => [props.symbol, props.size, props.variant, props.value, JSON.stringify(props.state)], draw)
// 自定义图元注册完成后重绘
watch(SYMBOL_REGISTRY_VERSION, draw)
</script>

<style scoped>
.sym-node {
  display: block;
  overflow: visible;
}
</style>
