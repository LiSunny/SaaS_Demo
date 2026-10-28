<template>
  <div class="sym-thumb" :style="{ width: `${size}px`, height: `${size}px` }">
    <div ref="host" class="sym-thumb__host" />
  </div>
</template>

<script setup lang="ts">
/**
 * 图元缩略图 —— 图元库面板与图元管理页共用
 *
 * 图片版读位图（public/symbols/img），线框版用库内 SVG 几何；
 * 两种风格共用同一份几何与绑定定义，只是载体不同。
 */
import { onMounted, ref, watch } from 'vue'
import { IMAGE_BASE, SYMBOL_REGISTRY_VERSION, renderSymbolSafe, stateClasses } from '@/symbols'
import type { SceneStyle } from '@/types/scene-config'

const props = withDefaults(
  defineProps<{
    /** 图元 ID */
    symbol: string
    /** 缩略图边长 */
    size?: number
    /** image 图片版 / line 线框版 */
    variant?: SceneStyle
    /** 状态标志 */
    state?: Record<string, boolean>
  }>(),
  { size: 38, variant: 'image' },
)

const host = ref<HTMLElement | null>(null)

function draw() {
  const el = host.value
  if (!el) return
  el.innerHTML = ''
  // 图元尚未注册（自定义图元异步拉取中）时留空，注册完成后重绘
  const svg = renderSymbolSafe(props.symbol, {
    style: props.variant,
    size: props.size,
    imageBase: IMAGE_BASE,
  })
  if (!svg) return
  stateClasses(props.state).forEach((c) => svg.classList.add(c))
  el.appendChild(svg)
}

onMounted(draw)
watch(() => [props.symbol, props.size, props.variant, JSON.stringify(props.state)], draw)
// 自定义图元注册完成后重绘
watch(SYMBOL_REGISTRY_VERSION, draw)
</script>

<style scoped>
.sym-thumb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sym-thumb__host {
  display: inline-flex;
  line-height: 0;
}
.sym-thumb__host :deep(svg) {
  display: block;
}
</style>
