<template>
  <EbikeV2Card title="实时警情">
    <div class="evt">
      <!-- ===== 设备上报事件流水 ===== -->
      <div class="evt__rows">
        <div
          v-for="e in rows"
          :key="e.id"
          class="evt__row"
          :class="{ 'is-abnormal': e.abnormal }"
        >
          <span class="evt__time">{{ e.time }}</span>
          <span class="evt__device">{{ e.device }}</span>
          <span class="evt__event">
            <!-- 开关量的状态词与点位名相同（「故障」点报「故障」）时只显示一次 -->
            <span
              class="evt__point"
              :class="{ 'evt__point--merged': e.merged }"
              :style="e.merged ? { color: valueColor(e.abnormal) } : undefined"
            >{{ e.point }}</span>
            <span v-if="!e.merged" class="evt__value" :style="{ color: valueColor(e.abnormal) }">{{ e.value }}</span>
          </span>
        </div>

        <span v-if="!events.length" class="evt__empty">该系统暂无设备上报事件</span>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 实时警情
 *
 * 系统监测页底部一行的第三个模块：**设备上报事件的流水**，不做处置统计。
 * 每条记录是设备自己报上来的一条点位数据（点位名 + 值），
 * 不是工单、不带待处置 / 处置中那套处置口径。
 *
 * 口径与同页「故障设备数量曲线」一致 —— 都跟随画布上的系统切换，
 * 值班员在同一屏里看到的是同一个系统。
 *
 * 数据来源分层：
 *   设备名 = 画面图元标签（真值）
 *   点位名 / 单位 / 量程 = 图元库符号绑定（真值，`symbolDef(...).bindings`）
 *   上报值 = 按绑定声明的量程生成的演示值（后端暂无实时点位接口）
 *
 * 同一系统刷新页面得到同一条流水（按系统名做确定性随机），换系统则换一批。
 * 接真接口时只替换 valueOf 的取值来源，图形部分不动。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSymbolStore } from '@/stores/symbols'
import type { SceneConfig } from '@/types/scene-config'
import { pickOf, rngOf, seedOf } from './seeded-random'
import { isAbnormalPoint, pointSourcesOf, type PointSource } from './scene-points'
import EbikeV2Card from './EbikeV2Card.vue'

const props = withDefaults(
  defineProps<{
    /** 当前画面 */
    scene?: SceneConfig | null
    /** 当前系统名 */
    systemName?: string
  }>(),
  { scene: null, systemName: '本系统' },
)

/* ============================================================
 * 口径
 * ============================================================ */

/** 流水可见条数 */
const VISIBLE = 6

/** 演示节奏：推一条新事件的间隔（秒） */
const FEED_INTERVAL = 10

/**
 * 事件源池
 *
 * 画面里的设备 × 其符号的绑定点位 —— 与「统计分析报表」同一份口径（scene-points.ts）。
 */
const sources = computed<PointSource[]>(() => pointSourcesOf(props.scene))

/* ============================================================
 * 上报值
 * ============================================================ */

/**
 * 数值点位取值范围
 *
 * 绑定上声明了量程的用声明值（min/max），没声明的按单位给经验区间 ——
 * 管网压力 0.10~0.90 MPa、末端流量 0~3.5 L/s 这类。
 */
const UNIT_RANGE: Record<string, { min: number; max: number; digits: number }> = {
  MPa: { min: 0.1, max: 0.9, digits: 2 },
  '%': { min: 20, max: 90, digits: 0 },
  '%RH': { min: 30, max: 70, digits: 0 },
  '℃': { min: 5, max: 32, digits: 1 },
  'L/s': { min: 0, max: 3.5, digits: 1 },
  'm³/h': { min: 0, max: 90, digits: 0 },
  'm³': { min: 0, max: 400, digits: 0 },
  s: { min: 1, max: 9, digits: 0 },
  mA: { min: 0, max: 60, digits: 0 },
}

/** 未写单位的点位，按点位名给区间（自定义图元里有几处没补单位） */
const NAME_RANGE: Record<string, { min: number; max: number; digits: number; unit: string }> = {
  压差: { min: 0, max: 260, digits: 0, unit: 'Pa' },
  压力: { min: 0.1, max: 0.9, digits: 2, unit: 'MPa' },
}

/** 开关量点位上报的状态词：按点位名推导 */
function boolStateOf(name: string, rnd: () => number): string {
  if (name.includes('故障')) return '故障'
  if (name.includes('报警')) return '报警'
  if (name.includes('失重')) return '失重'
  if (name.includes('溢流')) return '溢流'
  if (name.includes('反馈')) return '反馈'
  if (name.includes('阀位')) return rnd() < 0.5 ? '开启' : '关闭'
  if (name.includes('手自动')) return rnd() < 0.5 ? '手动' : '自动'
  if (name.includes('延时')) return '延时中'
  if (name.includes('喷放')) return '喷放'
  if (name.includes('启动')) return '启动'
  if (name.includes('动作')) return '动作'
  if (name.includes('状态')) return rnd() < 0.5 ? '动作' : '复位'
  if (name.includes('充压')) return '充压'
  if (name.includes('运行')) return '运行'
  if (name.includes('正常')) return '正常'
  return '动作'
}

/** 与数值紧贴的单位（百分号、摄氏度）：写成「86%」「32℃」 */
const TIGHT_UNITS = new Set(['%', '℃', '%RH'])

/** 上报值文本 */
function valueOf(src: PointSource, rnd: () => number): string {
  if (src.kind === 'bool') return boolStateOf(src.point, rnd)

  const named = NAME_RANGE[src.point]
  const byUnit = src.unit ? UNIT_RANGE[src.unit] : undefined
  const min = src.min ?? named?.min ?? byUnit?.min ?? 0
  const max = src.max ?? named?.max ?? byUnit?.max ?? 100
  const digits = named?.digits ?? byUnit?.digits ?? 0
  const unit = src.unit ?? named?.unit ?? ''

  const v = min + rnd() * (max - min)
  const text = digits > 0 ? v.toFixed(digits) : String(Math.round(v))
  if (!unit) return text
  return TIGHT_UNITS.has(unit) ? `${text}${unit}` : `${text} ${unit}`
}

/** 上报值配色：异常统一红，正常走中性色阶 */
function valueColor(abnormal: boolean): string {
  return abnormal ? 'var(--fire-anomaly)' : 'var(--fire-text-label)'
}

/* ============================================================
 * 数据
 * ============================================================ */

interface EventItem {
  id: string
  /** 发生时刻（epoch ms） */
  occurredAt: number
  device: string
  point: string
  value: string
  /** 是否异常点位（故障 / 报警等） */
  abnormal: boolean
}

const events = ref<EventItem[]>([])
let seq = 0

/** 取一条上报事件 */
function makeEvent(rnd: () => number, occurredAt: number): EventItem | null {
  const pool = sources.value
  if (!pool.length) return null
  const src = pickOf(rnd, pool)
  seq += 1
  return {
    id: `evt-${seq}`,
    occurredAt,
    device: src.device,
    point: src.point,
    value: valueOf(src, rnd),
    abnormal: isAbnormalPoint(src.point),
  }
}

/** 重建流水：同一系统每次进来看到同一批历史事件 */
function rebuild() {
  const rnd = rngOf(seedOf(`${props.systemName}-${props.scene?.id ?? ''}`))
  const base = Date.now()
  const list: EventItem[] = []
  for (let i = 0; i < VISIBLE; i++) {
    // 时间倒序、间隔不等，避免整点齐刷刷
    const ago = (i * 6 + Math.floor(rnd() * 8) + 1) * 60_000
    const e = makeEvent(rnd, base - ago)
    if (e) list.push(e)
  }
  events.value = list.sort((a, b) => b.occurredAt - a.occurredAt)
}

/** 推一条新上报 */
function advance() {
  const rnd = rngOf(seedOf(`${props.systemName}-${Date.now()}`))
  const e = makeEvent(rnd, Date.now())
  if (!e) return
  events.value = [e, ...events.value].slice(0, VISIBLE)
}

/* ============================================================
 * 视图数据
 * ============================================================ */

const hhmm = (t: number): string => {
  const d = new Date(t)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const rows = computed(() =>
  events.value.map((e) => ({
    id: e.id,
    time: hhmm(e.occurredAt),
    device: e.device,
    point: e.point,
    value: e.value,
    abnormal: e.abnormal,
    /** 状态词与点位名相同（「故障」点报「故障」）：只显示一次 */
    merged: e.value === e.point,
  })),
)

/* ============================================================
 * 定时推进
 * ============================================================ */

let feedTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  // 自定义图元是异步注册的，先拉一次，点位池才拿得到绑定
  try {
    await useSymbolStore().load()
  } catch {
    // 未登录或接口不可用：内置图元的绑定仍可用
  }
  rebuild()
  feedTimer = setInterval(advance, FEED_INTERVAL * 1000)
})

onBeforeUnmount(() => {
  if (feedTimer) clearInterval(feedTimer)
  feedTimer = null
})

// 换系统 → 重建该系统的事件流水
watch(
  () => [props.systemName, props.scene?.id] as const,
  () => rebuild(),
)
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.evt {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: vh(8) vw(16) vh(8);
  overflow: hidden;
}

/* ===== 事件流水 ===== */
.evt__rows {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: vh(6);
  overflow: hidden;
}

.evt__row {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(8);
  padding: vh(5) vw(8);
  border-radius: vw(2);
  background: rgba(0, 84, 160, 0.18);
  font-size: 14px;
  line-height: 20px;
}

/* 时间：min-width + nowrap —— vw(36) 在窄视口下小于「14:46」的实际宽度，
   写死 width 会让文字溢出压到设备名上 */
.evt__time {
  flex-shrink: 0;
  min-width: vw(36);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-dim);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* 设备名：行内可伸缩的部分，名字长时省略
   flex 比例 1.1 —— 比 1.4 少给设备列一点空间：点位名（如「主泵运行」56px）
   加上报值（如「0.71 MPa」56px）共需 117px，窄视口下 1.4 的比例会让点位名
   被压成「主泵…」。设备名最长 8 字（气体灭火控制主机），1.1 仍有余量。 */
.evt__device {
  flex: 1.1;
  min-width: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-title);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 事件列：点位名 + 上报值（值右对齐） */
.evt__event {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: vw(6);
}

/* 点位名 */
.evt__point {
  min-width: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 开关量状态词与点位名相同时，点位名单独着色承担"值"的职责 */
.evt__point--merged {
  margin-left: auto;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-weight: 700;
}

/* 上报值 */
.evt__value {
  flex-shrink: 0;
  min-width: vw(70);
  text-align: right;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-weight: 700;
  font-size: 14px;
  white-space: nowrap;
}

/* 空态 */
.evt__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-dim);
}

/* ===== 异常行 =====
   异常点位（故障 / 报警）的行左边线标红，值班员扫一眼就能挑出来。 */
.evt__row.is-abnormal {
  box-shadow: inset 2px 0 0 var(--fire-anomaly);
}
</style>
