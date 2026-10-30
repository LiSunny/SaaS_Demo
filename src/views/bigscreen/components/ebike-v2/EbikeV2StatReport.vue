<template>
  <EbikeV2Card title="统计分析报表">
    <div class="sr">
      <!-- ===== 报告清单 ===== -->
      <ul class="sr__list">
        <li v-for="r in reports" :key="r.key" class="sr__item">
          <!-- 一级：报告名称 + 状态 -->
          <div class="sr__row">
            <span class="sr__name">{{ r.name }}</span>
            <span class="sr__state" :class="{ 'is-pending': !r.ready }">{{ r.ready ? '已生成' : '待生成' }}</span>
          </div>
          <!-- 一级：统计时间范围 -->
          <div class="sr__range">{{ r.rangeText }}</div>
        </li>

        <span v-if="!reports.length" class="sr__empty">该系统暂无定时报告</span>
      </ul>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 统计分析报表
 *
 * 系统监测页右列第三模块：**系统定时生成的报告入口**。
 * 每条报告的一级信息就是「报告名称 + 统计时间范围」—— 值班员在这里确认
 * 有哪些定时报表、每份覆盖哪段时间，再去取对应的报表文件。
 *
 * 报告按周期定时生成：
 *   日报 统计 昨天 00:00 ~ 今天 00:00，今天 02:00 生成
 *   周报 统计 上周一 00:00 ~ 本周一 00:00，本周一 02:00 生成
 *   月报 统计 上月 1 日 00:00 ~ 本月 1 日 00:00，本月 1 日 02:00 生成
 * 统计范围取已闭合的完整周期，生成时刻晚于周期结束 —— 与"定时汇总"一致。
 *
 * 报告清单为演示数据（后端暂无报表接口）；时间范围由当前时刻按周期回推，
 * 随时间推移自然滚动。接真接口时只替换 reports 的数据来源，版式不动。
 */
import { computed } from 'vue'
import EbikeV2Card from './EbikeV2Card.vue'

const props = withDefaults(
  defineProps<{
    /** 当前系统键（决定报告清单） */
    systemKey?: string
  }>(),
  { systemKey: '' },
)

/* ============================================================
 * 报告清单
 * ============================================================ */

/** 报告周期 */
type Cycle = '日' | '周' | '月'

interface ReportDef {
  name: string
  cycle: Cycle
}

/** 各系统的定时报告清单 */
const REPORT_SETS: Record<string, ReportDef[]> = {
  pipeline: [
    { name: '消防设备完好率日报', cycle: '日' },
    { name: '设备巡检情况日报', cycle: '日' },
    { name: '管网压力趋势周报', cycle: '周' },
    { name: '消防水系统运行月报', cycle: '月' },
  ],
  smoke: [
    { name: '防排烟设备运行日报', cycle: '日' },
    { name: '排烟系统巡检日报', cycle: '日' },
    { name: '风机故障统计周报', cycle: '周' },
    { name: '风阀动作统计月报', cycle: '月' },
  ],
  gas: [
    { name: '气体灭火设备状态日报', cycle: '日' },
    { name: '灭火系统巡检日报', cycle: '日' },
    { name: '钢瓶压力监测周报', cycle: '周' },
    { name: '驱动装置动作统计月报', cycle: '月' },
  ],
}

/** 兜底清单：系统键不在表内时用通用消防报告 */
const FALLBACK: ReportDef[] = [
  { name: '消防设备运行日报', cycle: '日' },
  { name: '设备巡检情况日报', cycle: '日' },
  { name: '消防设备故障统计周报', cycle: '周' },
  { name: '消防系统运行月报', cycle: '月' },
]

/* ============================================================
 * 时间口径
 * ============================================================ */

/** 周期结束后的生成延迟：2 小时 */
const GENERATE_DELAY = 2 * 3600_000

/**
 * 统计时间范围：已闭合的完整周期
 *
 * 日 = 前一天 00:00 ~ 今天 00:00
 * 周 = 上周一 00:00 ~ 本周一 00:00
 * 月 = 上月 1 日 00:00 ~ 本月 1 日 00:00
 */
function periodRange(cycle: Cycle, now: Date): { from: number; to: number } {
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  if (cycle === '日') {
    const to = new Date(y, m, d).getTime()
    return { from: to - 86_400_000, to }
  }
  if (cycle === '周') {
    // getDay() 里周日是 0，转成「周一 = 0」
    const dow = (now.getDay() + 6) % 7
    const to = new Date(y, m, d - dow).getTime()
    return { from: to - 7 * 86_400_000, to }
  }
  const to = new Date(y, m, 1).getTime()
  return { from: new Date(y, m - 1, 1).getTime(), to }
}

const pad = (n: number): string => String(n).padStart(2, '0')

/** 时刻文本：2026-10-30 00:00 */
function fmt(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 报告清单（含时间口径） */
const reports = computed(() => {
  const defs = REPORT_SETS[props.systemKey] ?? FALLBACK
  const now = new Date()
  return defs.map((d, i) => {
    const { from, to } = periodRange(d.cycle, now)
    const generatedAt = to + GENERATE_DELAY
    return {
      key: `${d.cycle}-${d.name}-${i}`,
      name: d.name,
      rangeText: `${fmt(from)} ~ ${fmt(to)}`,
      ready: generatedAt <= now.getTime(),
    }
  })
})</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.sr {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: vh(10) vw(16);
  overflow: hidden;
}

/* ===== 报告清单 ===== */
.sr__list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: vh(6);
  overflow: hidden;
}

/* 每份报告一张卡：等分铺满卡片高度 */
.sr__item {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: vh(3) vw(10);
  border: 1px solid rgba(120, 190, 255, 0.16);
  border-radius: vw(3);
  background: rgba(0, 84, 160, 0.18);
}

/* 报告名称 + 状态
   状态紧跟报告名，不靠右对齐：本卡是右列最后一张，底部右侧被悬浮机器人
   压住，靠右的文字会被挡住。 */
.sr__row {
  display: flex;
  align-items: baseline;
  gap: vw(8);
}

.sr__name {
  flex: 0 1 auto;
  min-width: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  line-height: 18px;
  color: var(--fire-text-title);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sr__state {
  flex-shrink: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  line-height: 18px;
  color: var(--fire-text-dim);
  white-space: nowrap;
}

/* 统计时间范围 */
.sr__range {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: 14px;
  line-height: 16px;
  color: var(--fire-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 空态 */
.sr__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-dim);
}
</style>
