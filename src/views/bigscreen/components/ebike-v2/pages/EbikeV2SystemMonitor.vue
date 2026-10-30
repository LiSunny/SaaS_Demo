<template>
  <EbikeV2PageShell :row-modules="BOTTOM_MODULES" :side-modules="SIDE_MODULES" :sub="currentSub">
    <template #main>
      <section class="monitor__canvas-panel">
        <!-- 系统切换：浮在画布左上角 -->
        <div class="monitor__switch" role="tablist" aria-label="系统筛选">
          <button
            v-for="s in systems"
            :key="s.key"
            type="button"
            role="tab"
            class="monitor__switch-btn"
            :class="{ 'monitor__switch-btn--active': s.key === activeSystemKey }"
            :aria-selected="s.key === activeSystemKey"
            @click="activeSystemKey = s.key"
          >
            {{ s.name }}
          </button>
        </div>

        <!-- 设备数 -->
        <div class="monitor__canvas-meta">
          <span class="monitor__canvas-count">{{ nodeCount }} 台设备</span>
        </div>

        <EbikeV2SceneCanvas :scene="currentScene" empty-text="该系统暂无组态画面" />
      </section>
    </template>

    <!-- 底部一行：多发故障排名、故障设备数量曲线已实现，实时警情待接入 -->
    <template #row>
      <EbikeV2FaultRank />
      <EbikeV2FaultCurve :scene="currentScene" :system-name="activeSystemName" />
      <EbikeV2PlaceholderCard
        v-for="t in BOTTOM_MODULES"
        :key="t"
        :title="t"
        :sub="currentSub"
      />
    </template>

    <!-- 右列：健康度分析、设备状态监控已实现，统计分析报表待接入 -->
    <template #side>
      <EbikeV2HealthRadar :system-name="activeSystemName" />
      <EbikeV2DeviceStatus :scene="currentScene" />
      <EbikeV2PlaceholderCard
        v-for="t in SIDE_MODULES"
        :key="t"
        :title="t"
        :sub="currentSub"
      />
    </template>
  </EbikeV2PageShell>
</template>

<script setup lang="ts">
/**
 * 系统监测页
 *
 * 版式取自 Figma「设备监测大屏/总 · 内容区」(node 1:906)：
 *   左列（组态画布 + 底部三模块）+ 右列（三模块），列间距 16。
 * 只借版式，视觉沿用本大屏的深蓝玻璃卡片与文字色阶。
 */
import { computed, onMounted, ref } from 'vue'
import { fetchSceneList } from '@/api/scene-config'
import { SYMBOL_SYSTEMS } from '@/symbols'
import type { SceneConfig } from '@/types/scene-config'
import EbikeV2PageShell from './EbikeV2PageShell.vue'
import EbikeV2SceneCanvas from './EbikeV2SceneCanvas.vue'
import EbikeV2FaultRank from '../EbikeV2FaultRank.vue'
import EbikeV2FaultCurve from '../EbikeV2FaultCurve.vue'
import EbikeV2HealthRadar from '../EbikeV2HealthRadar.vue'
import EbikeV2DeviceStatus from '../EbikeV2DeviceStatus.vue'
import EbikeV2PlaceholderCard from '../EbikeV2PlaceholderCard.vue'

/** Figma 内容区里的模块分布（底部一行的「多发故障排名」「故障设备数量曲线」已单独实现，不在此列） */
const BOTTOM_MODULES = ['实时警情']
/** 右列三模块（首位的「健康度分析」「设备状态监控」已单独实现，不在此列） */
const SIDE_MODULES = ['统计分析报表']

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

/**
 * 取该系统要展示的画面
 *
 * 排除验证 / 测试用途的画面（调试遗留），其余取节点最多的一个 —— 节点多的是
 * "总貌"，是系统的整体视图；节点数相同时取最近更新的。
 */
function pickScene(list: SceneConfig[]): SceneConfig | null {
  const usable = list.filter((s) => !/验证|测试/.test(s.name))
  const pool = usable.length ? usable : list
  if (!pool.length) return null
  return [...pool].sort(
    (a, b) => (b.nodes?.length ?? 0) - (a.nodes?.length ?? 0) || b.updatedAt - a.updatedAt,
  )[0]
}

const currentScene = computed(() =>
  pickScene(scenes.value.filter((s) => s.systemKey === activeSystemKey.value)),
)

const nodeCount = computed(() => currentScene.value?.nodes?.length ?? 0)

/** 当前选中的系统名：健康度分析等模块按系统区分 */
const activeSystemName = computed(
  () => systems.value.find((s) => s.key === activeSystemKey.value)?.name ?? '本系统',
)

/** 占位模块的副标题：当前系统 + 当前画面 */
const currentSub = computed(() => {
  const sys = systems.value.find((s) => s.key === activeSystemKey.value)
  const scene = currentScene.value
  return [sys?.name, scene?.name].filter(Boolean).join(' · ')
})

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

/* 组态画布区 */
.monitor__canvas-panel {
  position: relative;
  flex: 1;
  min-height: 0;
  border: 1px solid rgba(0, 152, 230, 0.16);
  border-radius: 3px;
  /* 底纹：淡淡的网格底衬 + 深蓝玻璃渐变 */
  background-image:
    url('@/assets/bigscreen/ebike-v2/canvas-grid-bg.svg'),
    linear-gradient(180deg, rgba(1, 35, 73, 0.72), rgba(0, 30, 68, 0.72));
  background-size: vw(80) vw(80), auto;
  background-repeat: repeat, no-repeat;
  background-color: #03254f;
  overflow: hidden;
}

/* 系统切换：浮在画布左上角 */
.monitor__switch {
  position: absolute;
  top: vh(12);
  left: vw(12);
  z-index: 3;
  display: flex;
  gap: vw(6);
}

.monitor__switch-btn {
  height: vh(34);
  padding: 0 vw(14);
  border: 1px solid rgba(0, 152, 230, 0.35);
  background: rgba(0, 68, 130, 0.55);
  color: rgba(200, 228, 255, 0.9);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.monitor__switch-btn:hover {
  background: rgba(0, 92, 168, 0.72);
  color: #eaf6ff;
}

.monitor__switch-btn--active {
  background: linear-gradient(180deg, rgba(0, 134, 228, 0.9) 0%, rgba(0, 86, 168, 0.9) 100%);
  border-color: rgba(96, 200, 255, 0.6);
  color: #fff;
}

/* 设备数：浮在画布右上角 */
.monitor__canvas-meta {
  position: absolute;
  top: vh(12);
  right: vw(14);
  z-index: 3;
  display: flex;
  align-items: center;
  gap: vw(10);
  font-size: 14px;
  color: var(--fire-text-sub);
}

.monitor__canvas-count {
  color: var(--fire-text-title);
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
}
</style>
