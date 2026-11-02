<template>
  <EbikeV2Card title="消防用水监控">
    <div class="wm">
      <EbikeV2SceneCanvas
        :scene="sceneWithState"
        :view-box="viewBox"
        :show-zoom="false"
        empty-text="暂无消防用水组态画面"
      />
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 消防总览 · 消防用水监控
 *
 * 版式按 Figma 70:313 左上卡（设计稿 node 70:599）：标题栏 + 一张消防给水系统流程图，
 * 画面内容取自平台已有的组态配置「消防给水系统总貌」，不另画一份。
 *
 * 为什么走组态链路而不是贴一张位图：
 *   图元（消防水箱 / 消防泵组 / 阀门 / 室内消火栓 / 消火栓箱 / 消防水池 /
 *   报警阀组 / 末端试水装置 / 喷淋喷头 / 控制柜）都出自平台图元库，
 *   管道连线与图元位置出自组态配置 —— 页面里再手绘一份，
 *   画面与「设备设施管理 › 规则管理 › 组态配置」里的配置就会各走各的。
 *
 * 卡片只做四件事：取画面、按卡片比例裁视口、铺田字格底纹、把节点状态接上实时点位。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { fetchSceneList } from '@/api/scene-config'
import { FIREWATER_SCENE } from '@/config/firewater-scene'
import { useSubsystemStore } from '@/stores/subsystem'
import type { SceneConfig } from '@/types/scene-config'
import EbikeV2Card from '../EbikeV2Card.vue'
import EbikeV2SceneCanvas from '../pages/EbikeV2SceneCanvas.vue'
import { pickOverviewScene } from '../scene-picker'
import { applyNodeStates } from '../scene-state'

const scene = ref<SceneConfig | null>(null)

/**
 * 设备档案与实时点位
 *
 * 角标要标「哪台设备异常」，状态只能来自平台档案的实时点位：
 * 绑定表与状态汇总都在 config/firewater-scene.ts 一套里，
 * 与「设备设施管理 › 运行监控 › 消防水系统」页判定一致。
 */
const subsystem = useSubsystemStore()
const { points } = storeToRefs(subsystem)

/** 带状态的画面（节点 state → 图元 is-* 类 → 角标） */
const sceneWithState = computed(() =>
  applyNodeStates(scene.value, FIREWATER_SCENE, points.value, subsystem.getRuntime),
)

/**
 * 视口裁到图元内容外接框
 *
 * 画面原始比例（1200×700 ≈ 1.71）与卡片内容区比例（约 1.24）差得远，
 * 直接铺满会在上下各留一条空白带。图元实际只占画面中间一块，
 * 裁到内容外接框后图形密度才和设计稿一致。
 *
 * 四周留 45px：设计稿 node 74:3072 的原图（496×400）对应场景画布
 * 900×726 的取景 —— 即内容外接框（814×626）四周留 86~100px。
 * 取 45px 后缩放比 0.551，与原图一致。
 */
const viewBox = computed(() => {
  const nodes = scene.value?.nodes ?? []
  if (!nodes.length) return ''
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const n of nodes) {
    const s = n.size || 60
    minX = Math.min(minX, n.x - s / 2)
    maxX = Math.max(maxX, n.x + s / 2)
    minY = Math.min(minY, n.y - s / 2)
    // 设备名称画在图元下方（基线 y + size/2 + 18，字号 13）
    maxY = Math.max(maxY, n.y + s / 2 + 22)
  }
  const m = 45
  return `${minX - m} ${minY - m} ${maxX - minX + m * 2} ${maxY - minY + m * 2}`
})

onMounted(async () => {
  // 先起实时点位，角标才有状态可标
  subsystem.loadSubsystem('pipeline')
  try {
    const res = await fetchSceneList({ page: 1, size: 100 })
    scene.value = pickOverviewScene(res.data ?? [], 'pipeline')
  } catch {
    // 取不到画面时留空态，卡片其余部分照常渲染
  }
})

onBeforeUnmount(() => {
  // 与消防水系统监测页同一套生命周期：页面离开即停刷新
  subsystem.stopTimer()
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/*
 * 卡体：内距 10px 12px（设计稿 node 70:614），底纹用大屏组态画布同一套田字格。
 * 底纹铺在卡体自身，不铺满卡片 —— 标题栏下方那条分隔线在设计稿里是断的。
 *
 * 格子周期取 73px：设计稿 node 74:3072 的原图（496×400）实测网格线
 * 间隔 73px（73/73/73/74），比系统监测页那块画布的 80px 更密；
 * 格子是同一张田字格 SVG，只是平铺尺寸不同。
 */
.wm {
  height: 100%;
  min-height: 0;
  padding: vh(10) vw(12);
  overflow: hidden;
  background-image:
    url('@/assets/bigscreen/ebike-v2/canvas-grid-bg.svg'),
    linear-gradient(180deg, rgba(1, 35, 73, 0.72), rgba(0, 30, 68, 0.72));
  background-size: vw(73) vw(73), auto;
  background-repeat: repeat, no-repeat;
  background-color: #03254f;
}
</style>
