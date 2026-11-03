<template>
  <div class="monitor">
    <!-- ===== 设备检测指标概览（设计稿 117:22647）===== -->
    <EbikeV2MonitorMetrics
      :systems="systems"
      :system-key="activeSystemKey"
      :scene="currentScene"
      @update:system-key="activeSystemKey = $event"
    />

    <!-- ===== 主区：组态画布 + 右列两模块 ===== -->
    <div class="monitor__body">
      <!-- 组态画布（设计稿 117:22393） -->
      <section class="monitor__canvas">
        <EbikeV2SceneCanvas :scene="currentScene" empty-text="该系统暂无组态画面" />
      </section>

      <!-- 右列：实时警情（上）/ 多发故障排名（下），设计稿 110:16122 -->
      <div class="monitor__side">
        <EbikeV2MonitorAlarm class="monitor__side-item" :scene="currentScene" :system-name="activeSystemName" />
        <EbikeV2FaultRank class="monitor__side-item" :scene="currentScene" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 系统监测页
 *
 * 版式按 Figma「智能安全管控平台/系统监测」节点 110:10889：
 *   上：设备检测指标概览横条（当前系统 + 四项指标）
 *   下：左「组态画布」1352 宽 + 右列 520 宽（实时警情 / 多发故障排名），列间距 16
 *
 * 画面内容走平台既有组态配置链路（/api/scenes → EbikeV2SceneCanvas 渲染），
 * 不在本页另手绘一套画面或点位配置。
 *
 * 三个模块（指标概览 / 实时警情 / 多发故障排名）的数据同源于画面绑定点位
 * （scene-points.ts），对同一画面说法一致。
 */
import { computed, onMounted, ref } from 'vue'
import { fetchSceneList } from '@/api/scene-config'
import { SYMBOL_SYSTEMS } from '@/symbols'
import type { SceneConfig } from '@/types/scene-config'
import EbikeV2SceneCanvas from './EbikeV2SceneCanvas.vue'
import EbikeV2MonitorMetrics from '../EbikeV2MonitorMetrics.vue'
import EbikeV2MonitorAlarm from '../EbikeV2MonitorAlarm.vue'
import EbikeV2FaultRank from '../EbikeV2FaultRank.vue'
import { pickOverviewScene } from '../scene-picker'

const scenes = ref<SceneConfig[]>([])
const loading = ref(false)
const activeSystemKey = ref('')

/** 有画面的系统（按图元库的一级分类命名） */
const systems = computed(() => {
  const keys = [...new Set(scenes.value.map((s) => s.systemKey))]
  return keys.map((key) => ({
    key,
    name: SYMBOL_SYSTEMS.find((s) => s.key === key)?.name ?? key,
  }))
})

/** 取该系统要展示的画面（挑选规则见 scene-picker） */
const currentScene = computed(() =>
  pickOverviewScene(scenes.value, activeSystemKey.value),
)

/** 当前选中的系统名：各模块按系统区分 */
const activeSystemName = computed(
  () => systems.value.find((s) => s.key === activeSystemKey.value)?.name ?? '本系统',
)

onMounted(async () => {
  loading.value = true
  try {
    const res = await fetchSceneList({ page: 1, size: 100 })
    scenes.value = res.data ?? []
    // 默认停在第一个有画面的系统
    const first = systems.value[0]
    if (first) activeSystemKey.value = first.key
  } catch {
    scenes.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 页面容器：顶栏以下铺满；底色随大屏根节点（与总览页同源） */
.monitor {
  position: absolute;
  top: vh(68);
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: vh(16);
  padding: vh(16) vw(16);
}

/* ===== 主区：画布 + 右列 ===== */
.monitor__body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: vw(16);
}

/* 组态画布（设计稿 #117:22393）：
   底纹用项目既有的田字格素材（40px 见方 / 80px 平铺），
   玻璃底与描边与大屏其它卡片同一套。 */
.monitor__canvas {
  flex: 1;
  min-width: 0;
  min-height: 0;
  border: 1px solid rgba(0, 152, 230, 0.16);
  border-radius: 3px;
  background-color: rgba(0, 44, 94, 0.72);
  background-image: url('@/assets/bigscreen/ebike-v2/canvas-grid-bg.svg');
  background-size: vw(80) vw(80);
  background-repeat: repeat;
  backdrop-filter: blur(9px) saturate(125%);
  -webkit-backdrop-filter: blur(9px) saturate(125%);
  overflow: hidden;
}

/* 右列（设计稿 #110:16122，宽 520） */
.monitor__side {
  flex-shrink: 0;
  width: vw(520);
  display: flex;
  flex-direction: column;
  gap: vh(16);
}

/* 两个模块高度等分父容器（flex-basis: 0，各占一半，与内容多少无关） */
.monitor__side > :deep(*) {
  flex: 1 1 0;
  min-height: 0;
}
</style>
