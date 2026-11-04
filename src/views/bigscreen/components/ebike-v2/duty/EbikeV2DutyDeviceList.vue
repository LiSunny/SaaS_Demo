<template>
  <section class="dl" :class="{ 'is-collapsed': collapsed }">
    <!-- ===== 标题条（设计稿 #160:25872） ===== -->
    <header class="dl__bar">
      <span class="dl__title">设备列表</span>
      <!-- 设计稿标题下的青色辉光条（#160:25874） -->
      <span class="dl__underline" />

      <!-- 折叠态才显示摘要：展开时数量由平面图标题条承担，这里不重复占位 -->
      <span v-if="collapsed" class="dl__summary">{{ summary }}</span>

      <button
        type="button"
        class="dl__toggle"
        :aria-expanded="!collapsed"
        :title="collapsed ? '展开设备列表' : '折叠设备列表'"
        @click="collapsed = !collapsed"
      >
        <span class="dl__toggle-text">{{ collapsed ? '展开' : '折叠' }}</span>
        <span class="dl__toggle-icon" :class="{ 'is-up': collapsed }" />
      </button>
    </header>

    <!-- ===== 主体（设计稿 #160:25884） ===== -->
    <div class="dl__body">
      <!-- 筛选条 #160:25885：搜索 + 事件筛选 + 查询 -->
      <div class="dl__filter">
        <label class="dl__search">
          <span class="dl__search-icon" />
          <input
            v-model="keyword"
            type="search"
            class="dl__search-input"
            placeholder="设备编码/安装位置"
            aria-label="设备编码/安装位置"
            @keyup.enter="onQuery"
          />
        </label>

        <el-select v-model="eventFilter" class="dl__select" popper-class="bigscreen-el-select-dropdown">
          <el-option
            v-for="o in EVENT_FILTERS"
            :key="o.value"
            :label="o.label"
            :value="o.value"
          />
        </el-select>

        <button type="button" class="dl__query" @click="onQuery">查询</button>

        <!-- 查询回执：条件是实时的（输入即过滤），这里回执命中条数 -->
        <span v-if="hint" class="dl__hint">{{ hint }}</span>
      </div>

      <!-- 表格 #160:25921 -->
      <div class="dl__table">
        <div class="dl__head">
          <span>事件</span>
          <span>设备类型</span>
          <span>安装位置</span>
          <span>设备编码</span>
          <span>操作</span>
        </div>

        <div class="dl__rows">
          <button
            v-for="row in pageRows"
            :key="row.key"
            type="button"
            class="dl__row"
            :class="{ 'is-located': row.key === locateKey }"
            :title="row.tip"
            @click="locate(row)"
          >
            <!-- 事件角标：异常一律同一个红，档位由文案承担 -->
            <span class="dl__cell dl__cell--event">
              <span class="dl__badge" :class="row.hasEvent ? 'is-abnormal' : 'is-normal'">
                {{ row.eventText }}
              </span>
            </span>

            <span class="dl__cell dl__cell--type">{{ row.type }}</span>
            <span class="dl__cell dl__cell--place">{{ row.location }}</span>
            <span class="dl__cell dl__cell--code">{{ row.code }}</span>

            <span class="dl__cell dl__cell--act">
              <span class="dl__act" title="在平面图上定位" />
            </span>
          </button>

          <span v-if="!pageRows.length" class="dl__empty">
            {{ keyword || eventFilter !== 'all' ? '没有符合条件的设备' : '该管理单元下暂无设备' }}
          </span>
        </div>
      </div>

      <!-- 分页条 #160:26017 -->
      <div class="dl__foot">
        <div class="dl__foot-left">
          <span class="dl__foot-label">每页显示</span>
          <el-select v-model="pageSize" class="dl__size" popper-class="bigscreen-el-select-dropdown">
            <el-option v-for="s in PAGE_SIZES" :key="s" :label="`${s} 条`" :value="s" />
          </el-select>
          <span class="dl__foot-label">共 {{ filtered.length }} 条数据</span>
        </div>

        <el-pagination
          v-model:current-page="page"
          class="dl__pager"
          :page-size="pageSize"
          :total="filtered.length"
          :pager-count="5"
          layout="prev, pager, next"
          prev-text="上一页"
          next-text="下一页"
          background
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 实时警情页 · 平面图上的设备列表
 *
 * 版式按 Figma「智能安全管控平台/实时警情」节点 134:530 里的「设备列表」层 #160:25871：
 *
 *   标题条  #160:25872：高 40、横向渐变 rgba(6,64,110,1)→透明、底边 rgba(128,209,253,.15)、
 *           标题「设备列表」Alibaba PuHuiTi Medium 20px #A2CAFF + 标题下青色辉光条
 *   筛选条  #160:25885：内距 18/14、搜索框（宽 283，描边 #1A4573）+ 事件筛选下拉（宽 177）+ 查询按钮
 *   表格    #160:25921：表头底 #013E79、上下 1px rgba(120,190,255,.18)；
 *           数据行 1px #0C3464 分隔线；列：事件 / 设备类型 / 安装位置 / 设备编码 / 操作
 *   分页条  #160:26017：左侧「每页显示 + 共 N 条数据」，右侧上一页 / 页码 / 下一页
 *
 * 这层是**浮在平面图之上**的一层（设计稿里它是平面图内容框内的绝对定位区块）：
 * 平面图留在上半部分当上下文，设备清单在下半部分当正文。
 *
 * 三条与「平板看图」不同的产品口径：
 *   1. 列表内容是**平面图上的全部设备**（含未报警的），不是只有报警的那几台 ——
 *      与平面图描点的口径一致（图上摆的是全部点位，报警的标红）。
 *   2. **默认有事件的设备置顶**：值班员打开这一层先看有事件的，
 *      其余设备按名称排。事件设备内部再按 火警 > 故障 > 预警 > 其他、
 *      同档按最新报警时间倒序排。
 *   3. 搜索 / 筛选是**真能用**的：输入即过滤，多个条件之间是 AND 关系；
 *      「查询」按钮负责回到第一页并回执命中条数。
 *
 * 与设计稿的有意偏离：
 *   1. 事件角标**全页只留一个红**（#ff8080）：设计稿给火警 #E5523F、故障 #FFA600 分档，
 *      但颜色一档档分下去，值班员会先看颜色不看文案；档位由角标文案承担。
 *      这一条与本页平面图上的告警角标、与大屏其它列表页都保持一致。
 *   2. 角标字号取 14px（设计稿 10px）：大屏正文有 14px 字号下限，
 *      10px 的角标在 1920×1080 下远看不清。
 *   3. 设计稿的「操作」列图标是十字准星，本层做成**在平面图上定位**：
 *      点一下，平面图上对应的点高亮出来（列表与图上的点位是同一批设备，
 *      两层不联动的话点开这一层也只是多一张表）。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { symbolDef } from '@/symbols'
import { deviceCodeOfKey, type DutyEvent, type SceneDevice } from './duty-data'

const props = defineProps<{
  /** 当前管理单元内的全部设备（含未报警的），带警情 */
  devices: Array<SceneDevice & { event?: DutyEvent }>
  /** 当前平面图上被定位的设备 key（高亮由平面图层负责） */
  locateKey?: string
}>()

const emit = defineEmits<{ (e: 'locate', deviceKey: string): void }>()

/* ============================================================
 * 设计稿素材
 * ============================================================ */

/*
 * 图标一律用 CSS mask 上色：形状取 Figma 导出件，颜色跟大屏令牌走。
 * （Figma 里这几个图标是暗色描边（#4E627A / 0.5 透明度），
 *  直接贴在深蓝底上对比度只有 2.2~2.4:1，看不清。）
 *
 * mask 的 url 写在样式里而不是内联 style：Vite 会把几 KB 的 svg 内联成
 * data URI，而 data URI 里带引号，放进内联 style 的 url() 会变成非法 token，
 * 自定义属性直接被浏览器丢弃（图标渲染成一个实心方块）。
 */

/* ============================================================
 * 状态
 * ============================================================ */

/** 折叠态：只留标题条，平面图整块露出来 */
const collapsed = ref(false)

/** 搜索词（输入即过滤） */
const keyword = ref('')

/** 事件筛选 */
type EventFilter = 'all' | 'event' | '火警' | '故障' | '预警'
const EVENT_FILTERS: Array<{ label: string; value: EventFilter }> = [
  { label: '全部设备', value: 'all' },
  { label: '仅事件设备', value: 'event' },
  { label: '火警', value: '火警' },
  { label: '故障', value: '故障' },
  { label: '预警', value: '预警' },
]
const eventFilter = ref<EventFilter>('all')

/** 分页 */
const PAGE_SIZES = [10, 20, 50]
const pageSize = ref(10)
const page = ref(1)

/** 查询回执 */
const hint = ref('')
let hintTimer: ReturnType<typeof setTimeout> | null = null

/* ============================================================
 * 行数据
 * ============================================================ */

interface DeviceRow {
  key: string
  label: string
  type: string
  location: string
  code: string
  event?: DutyEvent
  hasEvent: boolean
  eventText: string
  tip: string
}

/** 事件档位序：火警 > 故障 > 预警 > 其他 */
const CATEGORY_ORDER: Record<string, number> = { 火警: 0, 故障: 1, 预警: 2, 其他: 3 }

/** 设备类型名（图元库真名，取不到退到符号） */
function typeOf(symbol: string): string {
  return symbolDef(symbol)?.name || symbol
}

/** 安装位置（园区空间归属；没有归属时退到系统名） */
function placeOf(d: SceneDevice & { event?: DutyEvent }): string {
  if (d.space) return `${d.space.buildingName} ${d.space.part}`
  return d.event?.location || '—'
}

/** 设备清单 → 行（带警情状态） */
const rows = computed<DeviceRow[]>(() =>
  props.devices.map((d) => {
    const event = d.event
    const location = placeOf(d)
    const code = event?.deviceCode || deviceCodeOfKey(d.key)
    return {
      key: d.key,
      label: d.label,
      type: typeOf(d.symbol),
      location,
      code,
      event,
      hasEvent: !!event,
      eventText: event ? event.category : '正常',
      tip: event
        ? `${d.label} · ${event.point}（${event.category}）\n${location} · ${event.deviceCode}`
        : `${d.label} · 当前无警情\n${location} · ${code}`,
    }
  }),
)

/**
 * 排序：有事件的设备置顶
 *
 * 事件设备之间按档位（火警 > 故障 > 预警 > 其他）、同档按最新报警时间倒序；
 * 无事件的设备按名称排。
 */
const sorted = computed<DeviceRow[]>(() =>
  [...rows.value].sort((a, b) => {
    if (a.hasEvent !== b.hasEvent) return a.hasEvent ? -1 : 1
    if (a.hasEvent && b.hasEvent) {
      const ca = CATEGORY_ORDER[a.event?.category ?? '其他'] ?? 9
      const cb = CATEGORY_ORDER[b.event?.category ?? '其他'] ?? 9
      if (ca !== cb) return ca - cb
      const ta = a.event?.latestAt ?? 0
      const tb = b.event?.latestAt ?? 0
      if (ta !== tb) return tb - ta
    }
    return a.label.localeCompare(b.label, 'zh-Hans-CN')
  }),
)

/* ============================================================
 * 过滤与分页
 * ============================================================ */

/** 搜索 + 事件筛选（AND 关系） */
const filtered = computed<DeviceRow[]>(() => {
  const kw = keyword.value.trim().toLowerCase()
  return sorted.value.filter((r) => {
    if (kw) {
      const hit =
        r.code.toLowerCase().includes(kw) ||
        r.location.toLowerCase().includes(kw) ||
        r.label.toLowerCase().includes(kw) ||
        r.type.toLowerCase().includes(kw)
      if (!hit) return false
    }
    if (eventFilter.value === 'event') return r.hasEvent
    if (eventFilter.value !== 'all') return r.event?.category === eventFilter.value
    return true
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))

/** 越界收敛（换筛选条件后旧页码可能超出范围） */
const safePage = computed(() => Math.min(Math.max(1, page.value), totalPages.value))

const pageRows = computed(() => {
  const start = (safePage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

/** 条件变化 → 回到第一页 */
watch([keyword, eventFilter, pageSize], () => {
  page.value = 1
})

/* ============================================================
 * 操作
 * ============================================================ */

/** 查询：条件是实时的（输入即过滤），此按钮负责回到第一页并回执条数 */
function onQuery() {
  page.value = 1
  hint.value = `命中 ${filtered.value.length} 条`
  if (hintTimer) clearTimeout(hintTimer)
  hintTimer = setTimeout(() => {
    hint.value = ''
    hintTimer = null
  }, 2600)
}

/** 在平面图上定位这台设备 */
function locate(row: DeviceRow) {
  emit('locate', row.key)
}

/** 折叠态标题条上的摘要 */
const summary = computed(
  () => `${props.devices.length} 台设备 · ${rows.value.filter((r) => r.hasEvent).length} 条警情`,
)

/* ============================================================
 * 生命周期
 * ============================================================ */

onBeforeUnmount(() => {
  if (hintTimer) clearTimeout(hintTimer)
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../fire/fire-common.scss" as fire;

/* 卡片：设计稿 #160:25871 */
.dl {
  display: flex;
  flex-direction: column;
  /* 展开时占平面图内容框高度的 56%（设计稿 450 / 796），
     折叠时只剩 40 高的标题条 —— 由组件自己控高度，
     父层只负责把它浮在平面图之上。 */
  height: 56%;
  min-height: 0;
  border: 1px solid rgba(0, 152, 230, 0.16);
  border-radius: vw(3);
  background: #002c5e;
  backdrop-filter: blur(9px);
  -webkit-backdrop-filter: blur(9px);
  overflow: hidden;
  transition: height 0.24s ease;
}

/* 折叠态：只留标题条，平面图整块露出来 */
.dl.is-collapsed {
  height: vh(40);
}

/* ===== 标题条：设计稿 #160:25872 ===== */
.dl__bar {
  flex-shrink: 0;
  position: relative;
  height: vh(40);
  display: flex;
  align-items: center;
  gap: vw(10);
  padding: 0 vw(13);
  background: linear-gradient(90deg, rgba(6, 64, 110, 1) 0%, rgba(6, 64, 110, 0) 100%);
  border-bottom: 1px solid rgba(128, 209, 253, 0.15);
}

.dl__title {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-weight: 500;
  font-size: clamp(14px, calc(20px * var(--min-scale)), 20px);
  line-height: 1;
  color: #a2caff;
  white-space: nowrap;
}

/* 标题下的青色辉光条（设计稿 #160:25874） */
.dl__underline {
  position: absolute;
  left: vw(26);
  bottom: 0;
  width: vw(191);
  height: vw(5);
  background: url('@/assets/bigscreen/ebike-v2/duty/device-list-title-underline.svg')
    left bottom / 100% 100% no-repeat;
  pointer-events: none;
}

/* 折叠态摘要 */
.dl__summary {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16px * var(--min-scale)), 16px);
  color: var(--fire-text-label);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 折叠 / 展开按钮 */
.dl__toggle {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: vw(6);
  height: vh(24);
  padding: 0 vw(8);
  border: 1px solid rgba(120, 190, 255, 0.18);
  border-radius: vw(4);
  background: transparent;
  color: var(--fire-text-label);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14px * var(--min-scale)), 14px);
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.dl__toggle:hover {
  border-color: rgba(96, 200, 255, 0.5);
  background: rgba(37, 135, 255, 0.12);
  color: var(--fire-text-hero);
}

/* 折叠箭头：设计稿的下拉箭头（朝上表示可展开） */
.dl__toggle-icon {
  width: vw(16);
  height: vw(16);
  background-color: var(--fire-text-hero);
  -webkit-mask: url('@/assets/bigscreen/ebike-v2/duty/device-list-chevron.svg') center / contain no-repeat;
  mask: url('@/assets/bigscreen/ebike-v2/duty/device-list-chevron.svg') center / contain no-repeat;
  transition: transform 0.2s;
}

.dl__toggle-icon.is-up {
  transform: rotate(180deg);
}

/* ===== 主体：设计稿 #160:25884 ===== */
.dl__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== 筛选条：设计稿 #160:25885 ===== */
.dl__filter {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(18);
  padding: vh(18) vw(14);
}

/* 搜索框 */
.dl__search {
  display: inline-flex;
  align-items: center;
  gap: vw(12);
  width: vw(283);
  min-width: 200px;
  height: vh(36);
  padding: 0 vw(12);
  border: 1px solid var(--fire-input-line);
  border-radius: vw(8);
  background: transparent;
  flex-shrink: 0;
}

.dl__search-icon {
  flex-shrink: 0;
  width: vw(16);
  height: vw(16);
  background-color: var(--fire-text-label);
  -webkit-mask: url('@/assets/bigscreen/ebike-v2/duty/device-list-search.svg') center / contain no-repeat;
  mask: url('@/assets/bigscreen/ebike-v2/duty/device-list-search.svg') center / contain no-repeat;
}

.dl__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--fire-text-bright);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16px * var(--min-scale)), 16px);
  letter-spacing: -0.0094em;

  &::placeholder {
    color: var(--fire-text-label);
  }

  &::-webkit-search-decoration,
  &::-webkit-search-cancel-button {
    display: none;
  }
}

/* 事件筛选下拉 */
.dl__select {
  width: vw(177);
  min-width: 150px;
  flex-shrink: 0;
}

.dl__select :deep(.el-select__wrapper) {
  height: vh(36);
  padding: 0 vw(12);
  background: transparent;
  border: 1px solid var(--fire-input-line);
  border-radius: vw(8);
  box-shadow: none;
}

.dl__select :deep(.el-select__selected-item) {
  color: var(--fire-text-label);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16px * var(--min-scale)), 16px);
}

.dl__select :deep(.el-select__caret) {
  color: var(--fire-text-label);
}

/* 查询按钮 */
.dl__query {
  flex-shrink: 0;
  height: vh(36);
  padding: 0 vw(18);
  border: none;
  border-radius: vw(8);
  background: var(--fire-btn-primary);
  color: var(--fire-text-hero);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16px * var(--min-scale)), 16px);
  font-weight: 500;
  letter-spacing: -0.0094em;
  white-space: nowrap;
  cursor: pointer;
}

.dl__query:hover {
  background: var(--fire-hover-blue);
}

/* 查询回执 */
.dl__hint {
  flex-shrink: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14px * var(--min-scale)), 14px);
  color: var(--fire-text-label);
  white-space: nowrap;
}

/* ===== 表格：设计稿 #160:25921 ===== */
.dl__table {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 vw(14);
  overflow: hidden;
}

/* 表头 */
.dl__head {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 86px repeat(3, minmax(0, 1fr)) 76px;
  align-items: center;
  gap: vw(6);
  padding: vh(10) vw(12);
  background: #013e79;
  border-top: 1px solid var(--fire-line-soft);
  border-bottom: 1px solid var(--fire-line-soft);
}

.dl__head span {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16px * var(--min-scale)), 16px);
  font-weight: 500;
  color: var(--fire-table-head-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 数据行 */
.dl__rows {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.dl__row {
  display: grid;
  grid-template-columns: 86px repeat(3, minmax(0, 1fr)) 76px;
  align-items: center;
  gap: vw(6);
  width: 100%;
  padding: vh(10) vw(12);
  border: none;
  border-bottom: 1px solid var(--fire-table-line);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}

.dl__row:hover {
  background: var(--fire-row-hover);
}

/* 被定位的行 */
.dl__row.is-located {
  background: var(--fire-hover-blue);
}

.dl__cell {
  min-width: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14px * var(--min-scale)), 14px);
  color: var(--fire-text-label);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 事件角标：全页只留一个红，档位由文案承担 */
.dl__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: vh(2) vw(6);
  border-radius: vw(4);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14px * var(--min-scale)), 14px);
  line-height: 1.2;
  white-space: nowrap;
}

.dl__badge.is-abnormal {
  @include fire.fire-badge(255, 128, 128);
}

/* 非异常：中性小片，不占用语义色 */
.dl__badge.is-normal {
  border: 1px solid var(--fire-chip-border);
  background: var(--fire-tab-idle);
  color: var(--fire-text-label);
}

/* 操作列：设计稿是一枚 22 见方的十字准星（= 在平面图上定位） */
.dl__cell--act {
  display: flex;
  justify-content: flex-start;
}

.dl__act {
  display: inline-block;
  width: vw(22);
  height: vh(22);
  background-color: var(--fire-text-label);
  -webkit-mask: url('@/assets/bigscreen/ebike-v2/duty/device-list-locate.svg') center / contain no-repeat;
  mask: url('@/assets/bigscreen/ebike-v2/duty/device-list-locate.svg') center / contain no-repeat;
  transition: background-color 0.15s;
}

.dl__row:hover .dl__act {
  background-color: var(--fire-text-hero);
}

/* 空态 */
.dl__empty {
  display: block;
  padding: vh(40) 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14px * var(--min-scale)), 14px);
  color: var(--fire-text-dim);
  text-align: center;
}

/* ===== 分页条：设计稿 #160:26017 ===== */
.dl__foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(12);
  padding: vh(12);
  border-top: 1px solid var(--fire-line-soft);
}

.dl__foot-left {
  display: flex;
  align-items: center;
  gap: vw(12);
}

.dl__foot-label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14px * var(--min-scale)), 14px);
  color: var(--fire-text-bright);
  white-space: nowrap;
}

/* 每页条数选择框 */
.dl__size {
  width: vw(82);
  min-width: 86px;
  flex-shrink: 0;
}

.dl__size :deep(.el-select__wrapper) {
  height: vh(36);
  padding: 0 vw(8);
  background: transparent;
  border: 1px solid var(--fire-btn-outline);
  border-radius: vw(8);
  box-shadow: none;
}

.dl__size :deep(.el-select__selected-item) {
  color: var(--fire-text-bright);
  font-size: clamp(14px, calc(14px * var(--min-scale)), 14px);
}

.dl__size :deep(.el-select__caret) {
  color: var(--fire-text-label);
  opacity: 0.5;
}

/* 页码按钮（与档案页同一套压法：全局 style.css 的分页底色是大屏外的浅色值） */
.dl__pager {
  justify-content: flex-end;
  padding: 0;
}

.dl__pager :deep(.el-pager li) {
  min-width: vw(32);
  height: vh(32);
  border: none !important;
  background: transparent !important;
  color: var(--fire-pager-text) !important;
  font-size: clamp(14px, calc(14px * var(--min-scale)), 14px);
  font-weight: 500;
}

.dl__pager :deep(.el-pager li.is-active) {
  background: var(--fire-btn-ghost) !important;
  color: var(--fire-text-bright) !important;
}

.dl__pager :deep(.btn-prev),
.dl__pager :deep(.btn-next) {
  height: vh(32);
  padding: 0 vw(10);
  border: none !important;
  border-radius: vw(8);
  background: var(--fire-btn-ghost) !important;
  color: var(--fire-text-hero) !important;
  font-size: clamp(14px, calc(14px * var(--min-scale)), 14px);
  font-weight: 500;
}

.dl__pager :deep(.btn-prev.is-disabled),
.dl__pager :deep(.btn-next.is-disabled) {
  opacity: 0.35;
}
</style>
