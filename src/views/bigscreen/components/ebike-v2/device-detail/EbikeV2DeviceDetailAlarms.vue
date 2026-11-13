<template>
  <div class="log">
    <!-- ===== 标题行（设计稿 #165:26283） ===== -->
    <header class="dd-head">
      <span class="dd-head__bar" />
      <h3 class="dd-head__title">告警日志</h3>
    </header>

    <!-- ===== 工具条（设计稿 #165:26289：日期区间 + 查询 … 批量导出） ===== -->
    <div class="log__toolbar">
      <div class="log__toolbar-left">
        <!-- 日期区间：样式与消防档案页同一套（见 device-detail-common.scss） -->
        <div class="dd-date">
          <el-date-picker
            v-model="draftRange"
            type="daterange"
            unlink-panels
            editable
            clearable
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :popper-class="`bigscreen-el-date-panel ${DD_POPPER_CLASS}`"
          />
        </div>

        <button type="button" class="log__query" @click="applyRange">查询</button>
      </div>

      <!-- 批量导出：设计稿 #200:2098（线框蓝 + 导出图标） -->
      <button type="button" class="log__export" @click="exportCsv">
        <span class="log__export-icon" />
        <span class="log__export-text">批量导出</span>
      </button>
    </div>

    <!-- ===== 表格（设计稿 #200:2118） ===== -->
    <div class="log__table-wrap">
      <table class="log__table">
        <colgroup>
          <col />
          <col :style="{ width: vw(86) }" />
          <col :style="{ width: vw(156) }" />
          <col :style="{ width: vw(156) }" />
          <col :style="{ width: vw(98) }" />
          <col :style="{ width: vw(76) }" />
        </colgroup>
        <thead>
          <tr>
            <th class="log__th">发生时间</th>
            <th class="log__th">事件</th>
            <th class="log__th">事件内容</th>
            <th class="log__th">事件描述</th>
            <th class="log__th">告警值</th>
            <th class="log__th log__th--act">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in pageRows"
            :key="row.id"
            class="log__tr"
            :class="{ 'is-active': activeId === row.id }"
          >
            <td class="log__td">{{ row.time }}</td>
            <td class="log__td">
              <span v-if="row.badge" class="dd-badge">{{ row.badge }}</span>
              <span v-else class="dd-badge dd-badge--plain">{{ row.category }}</span>
            </td>
            <td class="log__td" :title="row.content">{{ row.content }}</td>
            <td class="log__td" :title="row.desc">{{ row.desc }}</td>
            <td class="log__td">{{ row.value }}</td>
            <td class="log__td log__td--act">
              <button
                type="button"
                class="log__act"
                :title="`查看「${row.category}」详情`"
                :aria-label="`查看「${row.category}」详情`"
                @click="showRow(row)"
              >
                <span class="log__act-icon" />
              </button>
            </td>
          </tr>

          <tr v-if="!pageRows.length">
            <td class="log__td log__td--empty" colspan="6">该区间内没有告警记录</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===== 分页条（设计稿 #200:2192） ===== -->
    <div class="dd-pager">
      <div class="dd-pager-left">
        <span class="dd-pager-label">每页显示</span>
        <el-select
          v-model="pageSize"
          class="dd-pagesize"
          :popper-class="`bigscreen-el-select-dropdown ${DD_POPPER_CLASS}`"
        >
          <el-option v-for="s in PAGE_SIZES" :key="s" :label="`${s} 条`" :value="s" />
        </el-select>
        <span class="dd-pager-label">共 {{ filtered.length }} 条数据</span>
      </div>

      <div class="dd-pager-right">
        <button
          type="button"
          class="dd-pagebtn"
          :disabled="page <= 1"
          title="上一页"
          @click="page = Math.max(1, page - 1)"
        >
          上一页
        </button>
        <button
          v-for="p in pageNumbers"
          :key="p"
          type="button"
          class="dd-pagenum"
          :class="{ 'is-active': p === page }"
          @click="page = p"
        >
          {{ p }}
        </button>
        <button
          type="button"
          class="dd-pagebtn"
          :disabled="page >= pageCount"
          title="下一页"
          @click="page = Math.min(pageCount, page + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- ===== 操作反馈 ===== -->
    <Transition name="log-toast">
      <span v-if="toast" class="log__toast">{{ toast }}</span>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * 设备详情 · 告警日志分区
 *
 * 版式按 Figma「设备详情」节点 165:26182 的告警日志卡：
 *
 *   工具条  #165:26289：日期区间（380×36，描边 #1A4573）+ 查询 …… 批量导出
 *           （线框蓝：底 rgba(54,120,227,.1)、描边 #3678E3、圆角 8）
 *   表头    #200:2118：底 #013E79、下边线 rgba(120,190,255,.18)、
 *           文字 #D4E3FF 16px Medium
 *   列宽    发生时间（自适应） | 事件 86 | 事件内容 156 | 事件描述 156 |
 *           告警值 98 | 操作 76
 *   数据行  #200:2124：分隔线 1px #0C3464、文字 #A9C9EA 14px
 *   分页条  #200:2192：左侧「每页显示 + 共 N 条数据」，右侧上一页 / 页码 / 下一页
 *
 * 数据口径见 device-detail-data.ts：首行是该设备的真实警情，
 * 其余为按设备身份 key 确定性派生的历史告警（平台暂无告警工单查询接口）。
 */
import { computed, ref, watch } from 'vue'
import { buildAlarms } from './device-detail-data'
import type { DetailAlarmRow } from './device-detail-data'
import { DD_POPPER_CLASS } from './device-detail-popper'
import type { DutyEvent, SceneDevice } from '../duty/duty-data'

const props = defineProps<{
  device?: SceneDevice | null
  event?: DutyEvent | null
}>()

/* ============================================================
 * 状态
 * ============================================================ */

/**
 * 设计稿像素 → vw
 *
 * 模板里用不了 SCSS 的 vw() 函数（那是编译期的），列宽要在这里算。
 * 基准 1920 与 styles/function.scss 一致。
 */
function vw(px: number): string {
  return `${(px / 1920) * 100}vw`
}

/** 每页条数 */
const PAGE_SIZES = [10, 20, 50]
const pageSize = ref(10)
const page = ref(1)

/** 当前高亮的行 */
const activeId = ref('')

/** 操作反馈 */
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

/** 日期区间：默认最近七天 */
function defaultRange(): [string, string] {
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  const y = now.getFullYear()
  const m = p(now.getMonth() + 1)
  const d = p(now.getDate())
  return [`${y}-${m}-${p(now.getDate() - 6)}`, `${y}-${m}-${d}`]
}

/** 'YYYY-MM-DD' → 当天 00:00:00 的时间戳 */
function startOfDay(s: string): number {
  return new Date(s.replace(/-/g, '/')).getTime()
}

/** 'YYYY-MM-DD' → 当天 23:59:59 的时间戳 */
function endOfDay(s: string): number {
  return startOfDay(s) + 86_399_999
}

const draftRange = ref<[string, string]>(defaultRange())
const appliedRange = ref<[string, string]>([...draftRange.value])

/* ============================================================
 * 派生
 * ============================================================ */

/** 全部告警行 */
const all = computed<DetailAlarmRow[]>(() =>
  props.device ? buildAlarms(props.device, props.event ?? undefined) : [],
)

/** 按已生效的日期区间过滤 */
const filtered = computed(() => {
  const [from, to] = appliedRange.value
  if (!from || !to) return all.value
  const fromAt = startOfDay(from)
  const toAt = endOfDay(to)
  return all.value.filter((r) => {
    const at = new Date(r.time.replace(/-/g, '/')).getTime()
    return at >= fromAt && at <= toAt
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))

/** 越界收敛 */
const safePage = computed(() => Math.min(Math.max(1, page.value), pageCount.value))

const pageRows = computed(() => {
  const start = (safePage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

/** 页码按钮：首页 / 尾页 + 当前页附近 */
const pageNumbers = computed(() => {
  const n = pageCount.value
  if (n <= 5) return Array.from({ length: n }, (_, i) => i + 1)
  const set = new Set([1, n, safePage.value, safePage.value - 1, safePage.value + 1])
  return [...set].filter((x) => x >= 1 && x <= n).sort((a, b) => a - b)
})

/* ============================================================
 * 操作
 * ============================================================ */

/** 查询：区间生效 */
function applyRange() {
  if (!draftRange.value?.[0] || !draftRange.value?.[1]) return
  appliedRange.value = [...draftRange.value]
  page.value = 1
}

/** 批量导出：导出当前区间内的告警为 CSV */
function exportCsv() {
  const rows = filtered.value
  if (!rows.length) {
    flash('当前区间没有可导出的告警记录')
    return
  }
  const head = ['发生时间', '事件', '事件内容', '事件描述', '告警值']
  const body = rows.map((r) => [r.time, r.category, r.content, r.desc, r.value])
  const csv = [head, ...body]
    .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  // BOM：Excel 打开中文 CSV 需要它，否则中文乱码
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.device?.label ?? '设备'}告警日志.csv`
  a.click()
  URL.revokeObjectURL(url)
  flash(`已导出 ${rows.length} 条告警记录`)
}

/** 查看某条告警 */
function showRow(row: DetailAlarmRow) {
  activeId.value = row.id
  flash(`${row.time} ${row.category} · ${row.content}`)
}

function flash(text: string) {
  toast.value = text
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
    toastTimer = null
  }, 2600)
}

/* ============================================================
 * 生命周期
 * ============================================================ */

watch([pageSize, filtered], () => {
  page.value = 1
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./device-detail-common.scss" as *;

.log {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: vh(12);
}

/* ===== 工具条 ===== */
.log__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(12);
}

.log__toolbar-left {
  display: flex;
  align-items: center;
  gap: vw(12);
}

/* 查询按钮：设计稿 #200:2091 */
.log__query {
  height: vh(36);
  padding: 0 vw(18);
  border: none;
  border-radius: vw(8);
  background: rgba(0, 134, 228, 0.9);
  color: #ffffff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s;
}

.log__query:hover {
  background: rgba(0, 134, 228, 1);
}

/* 批量导出：设计稿 #200:2098 */
.log__export {
  display: flex;
  align-items: center;
  gap: vw(10);
  height: vh(36);
  padding: 0 vw(12);
  border: 1px solid #3678e3;
  border-radius: vw(8);
  background: rgba(54, 120, 227, 0.1);
  color: #ffffff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.log__export:hover {
  background: rgba(54, 120, 227, 0.22);
  border-color: #63a9ff;
}

.log__export-icon {
  width: vw(20);
  height: vw(20);
  flex-shrink: 0;
  background-color: #ffffff;
  -webkit-mask: url('@/assets/bigscreen/ebike-v2/device-detail/dd-icon-export.svg') center / contain
    no-repeat;
  mask: url('@/assets/bigscreen/ebike-v2/device-detail/dd-icon-export.svg') center / contain no-repeat;
}

/* ===== 表格 ===== */
.log__table-wrap {
  overflow-x: auto;
}

.log__table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.log__th {
  padding: vh(10) vw(12);
  background: #013e79;
  border-bottom: 1px solid rgba(120, 190, 255, 0.18);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-weight: 500;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  color: #d4e3ff;
  text-align: left;
  white-space: nowrap;
}

.log__th--act,
.log__td--act {
  text-align: center;
}

.log__tr {
  transition: background 0.15s;
}

.log__tr:hover,
.log__tr.is-active {
  background: rgba(0, 84, 160, 0.18);
}

.log__td {
  padding: vh(12) vw(12);
  border-bottom: 1px solid #0c3464;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  line-height: 1.5;
  color: #a9c9ea;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log__td--empty {
  text-align: center;
  padding: vh(28) vw(12);
}

/* 操作列按钮：设计稿 #200:2136（22×22，圆角 2） */
.log__act {
  width: vw(22);
  height: vw(22);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: vw(2);
  background: transparent;
  cursor: pointer;
  transition: background 0.15s;
}

.log__act:hover {
  background: rgba(54, 120, 227, 0.24);
}

.log__act-icon {
  width: vw(16);
  height: vw(16);
  display: block;
  background-color: #7ea6d6;
  -webkit-mask: url('@/assets/bigscreen/ebike-v2/device-detail/dd-icon-row-action.svg') center / contain
    no-repeat;
  mask: url('@/assets/bigscreen/ebike-v2/device-detail/dd-icon-row-action.svg') center / contain
    no-repeat;
}

/* ===== 操作反馈 ===== */
.log__toast {
  position: absolute;
  right: 0;
  bottom: vh(-46);
  padding: vh(9) vw(18);
  border: 1px solid rgba(96, 200, 255, 0.5);
  border-radius: vw(3);
  background: rgba(0, 44, 94, 0.96);
  color: #cfe4ff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  letter-spacing: 1px;
  white-space: nowrap;
  pointer-events: none;
}

.log-toast-enter-active,
.log-toast-leave-active {
  transition: opacity 0.24s, transform 0.24s;
}

.log-toast-enter-from,
.log-toast-leave-to {
  opacity: 0;
  transform: translateY(vh(6));
}
</style>
