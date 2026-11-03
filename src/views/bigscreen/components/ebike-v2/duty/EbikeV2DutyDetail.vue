<template>
  <EbikeV2Card title="告警详情" class="detail">
    <div class="detail__inner">
      <!-- ===== 字段网格 ===== -->
      <div class="detail__grid">
        <div v-for="f in fields" :key="f.label" class="detail__field">
          <span class="detail__label">{{ f.label }}</span>
          <span class="detail__value" :class="{ 'is-abnormal': f.abnormal }">{{ f.value }}</span>
        </div>
      </div>

      <!-- ===== 报警位置：平面图 / 点位档案 ===== -->
      <div class="detail__loc">
        <div class="detail__tabs" role="tablist" aria-label="报警位置视图">
          <button
            v-for="t in TABS"
            :key="t.key"
            type="button"
            role="tab"
            class="detail__tab"
            :class="{ 'is-active': tab === t.key }"
            :aria-selected="tab === t.key"
            @click="tab = t.key"
          >
            {{ t.label }}
          </button>
          <span class="detail__scene">{{ event?.sceneName ?? '—' }}</span>
        </div>

        <!-- 平面图：设备所在系统的组态画面，高亮报警设备 -->
        <div v-show="tab === 'plan'" class="detail__plan">
          <EbikeV2SceneCanvas
            :scene="scene"
            :highlight-node-id="event?.nodeId ?? ''"
            empty-text="该设备暂无组态画面"
          />
        </div>

        <!-- 点位档案：该设备在图元库里的绑定点位（真值） -->
        <div v-show="tab === 'points'" class="detail__points">
          <table v-if="points.length" class="detail__table">
            <thead>
              <tr>
                <th>点位名称</th>
                <th>数据类型</th>
                <th>量程</th>
                <th>单位</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in points" :key="p.name">
                <td>{{ p.name }}</td>
                <td>{{ p.kind }}</td>
                <td>{{ p.range }}</td>
                <td>{{ p.unit }}</td>
              </tr>
            </tbody>
          </table>
          <span v-else class="detail__empty">该设备暂无绑定点位</span>
        </div>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 值守工作台 · 告警详情（字段 + 报警位置合成一个区域）
 *
 * 评审意见：原来的「告警详情」横条与「报警位置」卡拆成两块，同一件事被两个标题
 * 隔开，读的时候要来回找。现在合成一张「告警详情」卡 —— 上半是 8 个字段，
 * 下半是这张事件对应的组态画面（平面图）与该设备的绑定点位（点位档案）。
 *
 * 字段区沿用云端的 8 个字段，但改成 4 列 × 2 行网格（云端是逐行竖排的方块）。
 * 画面内容走平台既有组态配置链路，不另画地图：
 *   平面图   = 该设备所在系统的组态画面，高亮报警的那台设备
 *   点位档案 = 该设备在图元库里的绑定点位（点表真值）
 */
import { computed, ref } from 'vue'
import { symbolDef } from '@/symbols'
import type { SceneConfig } from '@/types/scene-config'
import EbikeV2Card from '../EbikeV2Card.vue'
import EbikeV2SceneCanvas from '../pages/EbikeV2SceneCanvas.vue'
import { formatTime, type DutyEvent } from './duty-data'

const props = defineProps<{
  event: DutyEvent | null
  /** 设备所在画面 */
  scene: SceneConfig | null
}>()

const TABS = [
  { key: 'plan', label: '平面图' },
  { key: 'points', label: '点位档案' },
] as const

type TabKey = (typeof TABS)[number]['key']
const tab = ref<TabKey>('plan')

/** 事件字段（云端口径 8 项） */
const fields = computed(() => {
  const e = props.event
  if (!e) return []
  return [
    { label: '告警位置', value: e.location, abnormal: false },
    { label: '告警内容', value: e.point, abnormal: true },
    { label: '告警设备', value: e.deviceType, abnormal: false },
    { label: '设备编码', value: e.deviceCode, abnormal: false },
    { label: '事件源', value: e.source, abnormal: false },
    { label: '告警值', value: e.alarmValue, abnormal: false },
    { label: '最新报警时间', value: formatTime(e.latestAt), abnormal: false },
    { label: '联系人', value: e.contact, abnormal: false },
  ]
})

/** 该设备图元上的绑定点位 */
const points = computed(() => {
  const e = props.event
  if (!e) return []
  const node = props.scene?.nodes?.find((n) => n.id === e.nodeId)
  const def = node ? symbolDef(node.symbol) : undefined
  const bindings = (def?.bindings ?? []) as Array<{
    name?: string
    kind?: string
    unit?: string
    min?: number
    max?: number
  }>
  return bindings.map((b) => ({
    name: b.name ?? '—',
    kind: b.kind ?? '—',
    range: b.min !== undefined && b.max !== undefined ? `${b.min} ~ ${b.max}` : '—',
    unit: b.unit ?? '—',
  }))
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../fire/fire-common.scss" as *;

.detail {
  height: 100%;
}

.detail__inner {
  @include fire-panel;
  gap: vh(10);
  padding: vh(10) vw(12);
}

/* ===== 字段网格 =====
   4 列 × 2 行。列宽 = (卡宽 - 网格内距 - 列间距) / 4，
   15 位设备编码与完整时间戳都要放得下，所以内距与列间距都收到最小。 */
.detail__grid {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-content: center;
  gap: vh(10) vw(8);
  padding: vh(10) vw(8);
  border: 1px solid rgba(120, 190, 255, 0.12);
  border-radius: vw(3);
  background: rgba(0, 24, 56, 0.28);
}

/* 单个字段：上标签下值 */
.detail__field {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(3);
}

/* 标签 */
.detail__label {
  @include fire-dim(14);
  white-space: nowrap;
}

/* 值
   允许换行而不是截断：窄视口下（1440）4 列放不下完整的
   15 位设备编码与时间戳，截断等于丢数据，折行还能看全。 */
.detail__value {
  @include fire-label(14);
  color: var(--fire-text-title);
  line-height: 1.25;
  white-space: normal;
  overflow-wrap: anywhere;
}

.detail__value.is-abnormal {
  color: var(--fire-anomaly);
}

/* ===== 报警位置 ===== */
.detail__loc {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: vh(8);
}

/* ===== Tab 行 ===== */
.detail__tabs {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(6);
}

.detail__tab {
  flex-shrink: 0;
  height: vh(26);
  padding: 0 vw(12);
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: vw(2);
  background: rgba(0, 68, 130, 0.42);
  color: var(--fire-text-label);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.detail__tab:hover {
  background: rgba(0, 92, 168, 0.6);
}

.detail__tab.is-active {
  background: linear-gradient(180deg, rgba(0, 134, 228, 0.9) 0%, rgba(0, 86, 168, 0.9) 100%);
  border-color: rgba(96, 200, 255, 0.6);
  color: #ffffff;
}

/* 画面名 */
.detail__scene {
  margin-left: auto;
  @include fire-dim(14);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 平面图 ===== */
.detail__plan {
  flex: 1;
  min-height: 0;
  border: 1px solid rgba(0, 152, 230, 0.16);
  border-radius: vw(3);
  background-image:
    url('@/assets/bigscreen/ebike-v2/canvas-grid-bg.svg'),
    linear-gradient(180deg, rgba(1, 35, 73, 0.72), rgba(0, 30, 68, 0.72));
  background-size: vw(80) vw(80), auto;
  background-repeat: repeat, no-repeat;
  overflow: hidden;
}

/* ===== 点位档案 ===== */
.detail__points {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.detail__table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
}

.detail__table th {
  @include fire-dim(14);
  text-align: left;
  font-weight: 400;
  padding: vh(5) vw(6);
  border-bottom: 1px solid rgba(120, 190, 255, 0.18);
  white-space: nowrap;
}

.detail__table td {
  @include fire-label(14);
  color: var(--fire-text-title);
  padding: vh(5) vw(6);
  border-bottom: 1px solid rgba(120, 190, 255, 0.1);
  white-space: nowrap;
}

.detail__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  @include fire-dim(14);
}
</style>
