<template>
  <EbikeV2Card title="设备状态监控">
    <div class="dstat">
      <!-- ===== 设备总数 ===== -->
      <div class="dstat__total">
        <span class="dstat__total-num">{{ total }}</span>
        <span class="dstat__total-unit">台</span>
        <span class="dstat__total-label">设备总数</span>
      </div>

      <div class="dstat__divider" />

      <!-- ===== 各类台分布 ===== -->
      <ul v-if="distribution.length" class="dstat__list">
        <li v-for="r in distribution" :key="r.key" class="dstat__row">
          <span class="dstat__name">{{ r.name }}</span>
          <span class="dstat__bar">
            <i :style="{ width: (r.ratio * 100).toFixed(1) + '%' }" />
          </span>
          <span class="dstat__count">{{ r.count }}</span>
          <span class="dstat__ratio">{{ (r.ratio * 100).toFixed(1) }}%</span>
        </li>
      </ul>

      <div v-else class="dstat__empty">该系统暂无设备</div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 设备状态监控
 *
 * 两段：设备总数 + 各类台分布。
 * 分布按图元的部件类别（@/symbols 的二级分类）聚合 —— 画布上已逐台标注了设备名，
 * 这里补的是"这些设备由哪几类构成、每类几台"的汇总口径。
 * 数据取当前画面的图元，随画布切换实时变。
 */
import { computed } from 'vue'
import { symbolCategory, symbolDef, SYMBOL_CATEGORIES } from '@/symbols'
import type { SceneConfig } from '@/types/scene-config'
import EbikeV2Card from './EbikeV2Card.vue'

const props = withDefaults(
  defineProps<{
    /** 当前画面 */
    scene?: SceneConfig | null
  }>(),
  { scene: null },
)

const nodes = computed(() => props.scene?.nodes ?? [])

/** 设备总数：画面内的图元数量 */
const total = computed(() => nodes.value.length)

/** 分类在图元库里的次序，用于并列时排序 */
const CATEGORY_ORDER = new Map(SYMBOL_CATEGORIES.map((c, i) => [c.key, i]))

/** 各类台数与占比 */
const distribution = computed(() => {
  const counter = new Map<string, number>()
  for (const n of nodes.value) {
    // 自定义图元注册后才有 category，取不到时归入「其他」
    const key = symbolDef(n.symbol)?.category || '其他'
    counter.set(key, (counter.get(key) ?? 0) + 1)
  }
  const sum = total.value || 1
  return [...counter.entries()]
    .map(([key, count]) => ({
      key,
      name: symbolCategory(key)?.name ?? key,
      count,
      ratio: count / sum,
    }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        (CATEGORY_ORDER.get(a.key) ?? 99) - (CATEGORY_ORDER.get(b.key) ?? 99),
    )
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.dstat {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: vh(12);
  padding: vh(14) vw(16) vh(12);
  overflow: hidden;
}

/* ===== 设备总数 ===== */
.dstat__total {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: vw(8);
}

.dstat__total-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-weight: 700;
  font-size: clamp(24px, calc(34 * var(--min-scale)), 34px);
  line-height: 1.1;
  color: var(--fire-text-hero);
}

.dstat__total-unit {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-sub);
}

.dstat__total-label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-label);
}

/* 细分隔线 */
.dstat__divider {
  flex-shrink: 0;
  height: 1px;
  background: rgba(120, 190, 255, 0.16);
}

/* ===== 各类台分布 ===== */
.dstat__list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.dstat__row {
  display: flex;
  align-items: center;
  gap: vw(10);
  min-width: 0;
}

/* 类别名 */
.dstat__name {
  flex-shrink: 0;
  width: vw(72);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-label);
  white-space: nowrap;
}

/* 占比条：与本页「消防设备完好率」的系统行同一套 */
.dstat__bar {
  flex: 1;
  min-width: 0;
  height: vh(6);
  border-radius: vh(3);
  background: rgba(0, 84, 160, 0.4);
  overflow: hidden;
}

.dstat__bar i {
  display: block;
  height: 100%;
  border-radius: vh(3);
  background: var(--fire-neutral);
}

/* 台数 */
.dstat__count {
  flex-shrink: 0;
  width: vw(26);
  text-align: right;
  font-family: 'Douyin Sans', sans-serif;
  font-weight: 700;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  color: var(--fire-text-hero);
}

/* 占比 */
.dstat__ratio {
  flex-shrink: 0;
  width: vw(50);
  text-align: right;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-dim);
  white-space: nowrap;
}

/* 空态 */
.dstat__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-dim);
}
</style>
