<template>
  <div class="kpi">
    <!-- ===== KPI 卡：图标 + 指标名 + 数值 + 单位 ===== -->
    <EbikeV2Card v-for="c in cards" :key="c.key" plain class="kpi__card">
      <div class="kpi__inner">
        <span class="kpi__icon">
          <img :src="c.icon" alt="" />
        </span>
        <span class="kpi__label">{{ c.label }}</span>
        <span class="kpi__value" :class="{ 'is-abnormal': c.tone === 'abnormal' }">{{ c.value }}</span>
        <span v-if="c.unit" class="kpi__unit">{{ c.unit }}</span>
      </div>
    </EbikeV2Card>
  </div>
</template>

<script setup lang="ts">
/**
 * 值守工作台 · 顶部 KPI 行
 *
 * 三项：今日已核实事件 / 待核实事件 / 火警。
 *
 * 设备异常率、设备在线率、交接班三项已按评审意见去掉：
 *   - 两个设备率卡在本平台没有可信口径（画面节点的状态未落库，
 *     在线率恒为 100%、异常率与队列口径还得强行对齐），展示价值低于噪声；
 *   - 交接班是后台台账动作，大屏是只读看板，不该在上面对话框。
 *
 * 卡内布局：图标在左、指标名居中、数值与单位靠右 —— 三张卡等分整行宽度，
 * 数值右对齐读起来像一条指标带，不会出现大片空白。
 */
import { computed } from 'vue'
import EbikeV2Card from '../EbikeV2Card.vue'
import type { DutyKpi } from './duty-data'
import kpiFire from '@/assets/bigscreen/ebike-v2/fire/kpi-fire.png'
import kpiShield from '@/assets/bigscreen/ebike-v2/fire/kpi-shield.png'
import sumTask from '@/assets/bigscreen/ebike-v2/fire/sum-task.png'

const props = defineProps<{
  kpi: DutyKpi
}>()

const cards = computed(() => [
  {
    key: 'confirmed',
    label: '今日已核实事件',
    value: String(props.kpi.confirmedToday),
    unit: '个',
    icon: sumTask,
    tone: 'normal' as const,
  },
  {
    key: 'unconfirmed',
    label: '待核实事件',
    value: String(props.kpi.unconfirmed),
    unit: '个',
    icon: kpiShield,
    tone: 'abnormal' as const,
  },
  {
    key: 'fire',
    label: '火警',
    value: String(props.kpi.fire),
    unit: '个',
    icon: kpiFire,
    tone: 'abnormal' as const,
  },
])
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../fire/fire-common.scss" as *;

.kpi {
  flex-shrink: 0;
  display: flex;
  align-items: stretch;
  gap: vw(12);
}

/* KPI 卡：与其它卡片同一套玻璃卡体 */
.kpi__card {
  flex: 1;
  min-width: 0;
  height: vh(92);
}

/* 卡片内容区：无标题栏，卡体本身留内距 */
.kpi__card :deep(.v2-card__body) {
  display: flex;
  align-items: center;
  padding: vh(10) vw(14);
}

.kpi__inner {
  display: flex;
  align-items: center;
  gap: vw(12);
  min-width: 0;
  width: 100%;
}

/* 图标：设计稿 46×46 成品素材，不自绘 */
.kpi__icon {
  flex-shrink: 0;
  width: vw(46);
  height: vh(46);
  display: block;
}

.kpi__icon img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

/* 指标名：L2 标签级。占据中间空档，数值右对齐 */
.kpi__label {
  @include fire-label(15);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 核心数值：L0 */
.kpi__value {
  @include fire-value(32);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.kpi__value.is-abnormal {
  color: var(--fire-anomaly);
}

/* 单位 */
.kpi__unit {
  @include fire-sub(14);
  flex-shrink: 0;
  white-space: nowrap;
}
</style>
