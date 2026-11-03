<template>
  <EbikeV2Card title="待核实事件" class="queue">
    <div class="queue__inner">
      <!-- ===== 标题行：分类标签 + 批量核实 ===== -->
      <div class="queue__head">
        <span class="queue__title">
          待核实事件<span class="queue__total">({{ filtered.length }})</span>
        </span>

        <div class="queue__tabs" role="tablist" aria-label="事件分类">
          <button
            v-for="t in tabs"
            :key="t.key"
            type="button"
            role="tab"
            class="queue__tab"
            :class="{ 'is-active': activeCategory === t.key }"
            :aria-selected="activeCategory === t.key"
            @click="setCategory(t.key)"
          >
            {{ t.label }}
            <span class="queue__tab-count">{{ t.count }}</span>
          </button>
        </div>

        <button
          type="button"
          class="queue__batch"
          :disabled="!checked.size"
          @click="emit('batch', [...checked])"
        >
          批量核实<span v-if="checked.size"> ({{ checked.size }})</span>
        </button>
      </div>

      <!-- ===== 事件列表 ===== -->
      <div class="queue__list">
        <button
          v-for="e in pageItems"
          :key="e.id"
          type="button"
          class="queue__item"
          :class="{ 'is-active': e.id === modelValue }"
          @click="emit('update:modelValue', e.id)"
        >
          <!-- 行1：勾选 + 类别 + 持续时长 + 上报次数 -->
          <span class="queue__line1">
            <span
              class="queue__check"
              :class="{ 'is-checked': checked.has(e.id) }"
              role="checkbox"
              :aria-checked="checked.has(e.id)"
              tabindex="0"
              @click.stop="toggleCheck(e.id)"
              @keydown.enter.stop="toggleCheck(e.id)"
            />
            <span class="queue__badge" :class="`is-${e.category}`">{{ e.category }}</span>
            <span class="queue__dur">{{ e.duration }}</span>
            <span class="queue__times">上报 {{ e.reportTimes }} 次</span>
          </span>

          <!-- 行2：最新 / 首次报警时间 -->
          <span class="queue__line2">
            最新 {{ shortTime(e.latestAt) }} · 首次 {{ shortTime(e.firstAt) }}
          </span>

          <!-- 行3：事件源 · 位置 -->
          <span class="queue__line3">
            <span class="queue__src">{{ e.source }}</span>
            <span class="queue__dot">·</span>
            <span class="queue__loc">{{ e.location }}</span>
          </span>
        </button>

        <span v-if="!pageItems.length" class="queue__empty">该范围内暂无待核实事件</span>
      </div>

      <!-- ===== 分页 ===== -->
      <div v-if="totalPages > 1" class="queue__pager">
        <button type="button" class="queue__pg" :disabled="page === 1" @click="page--">‹</button>
        <button
          v-for="p in pageNumbers"
          :key="p"
          type="button"
          class="queue__pg"
          :class="{ 'is-active': p === page }"
          @click="page = p"
        >
          {{ p }}
        </button>
        <button type="button" class="queue__pg" :disabled="page === totalPages" @click="page++">›</button>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 值守工作台 · 待核实事件队列
 *
 * 版式按云端值守工作台的队列改密：
 *   云端每条卡 216px 高、5 行 label:value 竖排，队列可视区只放得下 2~3 条；
 *   这里改成 3 行（类别/时长/次数 → 时间 meta → 事件源/位置），一条 80px，
 *   同样的高度能看 6 条。
 *
 * 行内数值全部来自事件本身（上报次数、首次/最新报警时间、持续时长），
 * 不做二次汇总。
 */
import { computed, ref, watch } from 'vue'
import EbikeV2Card from '../EbikeV2Card.vue'
import { formatShort, type DutyCategory, type DutyEvent } from './duty-data'

const props = defineProps<{
  /** 传入的是"已按管理单元筛过"的事件 */
  events: DutyEvent[]
  /** 当前选中的事件 id */
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'batch', ids: string[]): void
}>()

/** 分类标签 */
type CategoryKey = DutyCategory | '全部'

const activeCategory = ref<CategoryKey>('全部')
/** 每页条数 */
const PAGE_SIZE = 12
const page = ref(1)
/** 勾选集合 */
const checked = ref<Set<string>>(new Set())

/** 各分类计数 */
const tabs = computed(() => {
  const count = (c: DutyCategory) => props.events.filter((e) => e.category === c).length
  return [
    { key: '火警' as CategoryKey, label: '火警', count: count('火警') },
    { key: '故障' as CategoryKey, label: '故障', count: count('故障') },
    { key: '预警' as CategoryKey, label: '预警', count: count('预警') },
    { key: '其他' as CategoryKey, label: '其他', count: count('其他') },
  ]
})

/** 当前分类下的事件 */
const filtered = computed(() =>
  activeCategory.value === '全部'
    ? props.events
    : props.events.filter((e) => e.category === activeCategory.value),
)

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const pageItems = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtered.value.slice(start, start + PAGE_SIZE)
})

/** 页码：首尾 + 当前页附近，最多 7 个 */
const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out = new Set<number>([1, total, cur, cur - 1, cur + 1])
  return [...out].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
})

function setCategory(k: CategoryKey) {
  activeCategory.value = k
  page.value = 1
}

function toggleCheck(id: string) {
  const next = new Set(checked.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  checked.value = next
}

// 切换分类或事件集合变化时回到第一页
watch(filtered, () => {
  if (page.value > totalPages.value) page.value = 1
})

function shortTime(t: number): string {
  return formatShort(t)
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../fire/fire-common.scss" as *;

.queue {
  height: 100%;
}

.queue__inner {
  @include fire-panel;
  gap: vh(8);
  padding: vh(10) vw(12);
}

/* ===== 标题行 =====
   标题 + 分类标签 + 批量核实 排一行；窄视口（队列 416px）放不下时
   分类标签整体换行，不裁掉最后一个标签。 */
.queue__head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: vw(8);
  row-gap: vh(6);
}

.queue__title {
  @include fire-section-title(15);
  flex-shrink: 0;
}

/* 待核实条数 */
.queue__total {
  font-family: 'Douyin Sans', sans-serif;
  font-weight: 700;
  color: var(--fire-anomaly);
}

/* 分类标签 */
.queue__tabs {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: vw(6);
}

.queue__tab {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: vw(4);
  height: vh(24);
  padding: 0 vw(8);
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: vw(2);
  background: rgba(0, 68, 130, 0.42);
  color: var(--fire-text-label);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.queue__tab:hover {
  background: rgba(0, 92, 168, 0.6);
}

.queue__tab.is-active {
  background: linear-gradient(180deg, rgba(0, 134, 228, 0.9) 0%, rgba(0, 86, 168, 0.9) 100%);
  border-color: rgba(96, 200, 255, 0.6);
  color: #ffffff;
}

.queue__tab-count {
  font-family: 'Douyin Sans', sans-serif;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* 批量核实 */
.queue__batch {
  flex-shrink: 0;
  margin-left: auto;
  height: vh(26);
  padding: 0 vw(10);
  border: 1px solid rgba(96, 200, 255, 0.4);
  border-radius: vw(2);
  background: rgba(0, 92, 168, 0.55);
  color: var(--fire-text-title);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.queue__batch:hover:not(:disabled) {
  background: rgba(0, 134, 228, 0.75);
}

.queue__batch:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ===== 事件列表 ===== */
.queue__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: vh(6);
}

/* 单条事件：三行紧凑卡 */
.queue__item {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: vh(3);
  padding: vh(7) vw(10);
  border: 1px solid rgba(120, 190, 255, 0.16);
  border-radius: vw(3);
  background: rgba(0, 84, 160, 0.18);
  text-align: left;
  cursor: pointer;
  /* button 的 UA 默认字体是 Arial 13.33px，会渗给卡内未单独设字体的子元素，
     必须显式重置为项目字体与 14px 下限 */
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  transition: background 0.15s, border-color 0.15s;
}

.queue__item:hover {
  background: rgba(0, 84, 160, 0.32);
}

/* 选中态：左侧主色竖条 + 底色 */
.queue__item.is-active {
  background: rgba(0, 92, 168, 0.45);
  border-color: rgba(96, 200, 255, 0.5);
  box-shadow: inset 3px 0 0 rgba(96, 200, 255, 0.9);
}

/* 行1 */
.queue__line1 {
  display: flex;
  align-items: center;
  gap: vw(8);
  min-width: 0;
}

/* 勾选框 */
.queue__check {
  flex-shrink: 0;
  width: vw(13);
  height: vw(13);
  border: 1px solid rgba(143, 176, 216, 0.7);
  border-radius: vw(2);
  background: rgba(0, 30, 68, 0.6);
  cursor: pointer;
}

.queue__check.is-checked {
  background: rgba(0, 134, 228, 0.9);
  border-color: rgba(96, 200, 255, 0.9);
}

/* 类别角标：全页只留一个异常红，差异由文案承担 */
.queue__badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: vh(2) vw(6);
  border-radius: vw(4);
  border: 1px solid var(--fire-anomaly);
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 128, 128, 0.16) 0%, rgba(255, 128, 128, 0.2) 68%, rgba(255, 128, 128, 0.16) 100%),
    rgba(0, 20, 46, 0.55);
  color: var(--fire-anomaly);
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
}

/* 持续时长 */
.queue__dur {
  flex-shrink: 0;
  @include fire-sub(14);
  white-space: nowrap;
}

/* 上报次数 */
.queue__times {
  margin-left: auto;
  flex-shrink: 0;
  @include fire-dim(14);
  white-space: nowrap;
}

/* 行2 / 行3：meta */
.queue__line2,
.queue__line3 {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  @include fire-dim(14);
}

.queue__src {
  color: var(--fire-text-label);
}

.queue__dot {
  margin: 0 vw(6);
  opacity: 0.6;
}

.queue__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  @include fire-dim(14);
}

/* ===== 分页 ===== */
.queue__pager {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: vw(4);
}

.queue__pg {
  min-width: vh(22);
  height: vh(22);
  padding: 0 vw(4);
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: vw(2);
  background: rgba(0, 68, 130, 0.42);
  color: var(--fire-text-label);
  font-family: 'Douyin Sans', sans-serif;
  font-size: 14px;
  cursor: pointer;
}

.queue__pg:hover:not(:disabled) {
  background: rgba(0, 92, 168, 0.7);
}

.queue__pg.is-active {
  background: linear-gradient(180deg, rgba(0, 134, 228, 0.9) 0%, rgba(0, 86, 168, 0.9) 100%);
  border-color: rgba(96, 200, 255, 0.6);
  color: #ffffff;
}

.queue__pg:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
