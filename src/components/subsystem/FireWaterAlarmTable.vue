<template>
  <div class="fwat">
    <!-- ===== 筛选行 ===== -->
    <div class="fwat__filters">
      <el-input
        v-model="draft.keyword"
        class="fwat__search"
        placeholder="安装位置/设备编码"
        clearable
      >
        <template #prefix><AppIcon name="search" /></template>
      </el-input>

      <el-select v-model="draft.unit" class="fwat__select" placeholder="管理单元" clearable>
        <el-option v-for="u in units" :key="u.id" :label="u.label" :value="u.id" />
      </el-select>

      <el-date-picker
        v-model="draft.range"
        class="fwat__date"
        style="width: 280px"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
      />

      <button type="button" class="fwat__btn fwat__btn--primary" @click="query">查询</button>

      <button type="button" class="fwat__btn fwat__btn--ghost" @click="exportCsv">
        <AppIcon name="download" />
        批量导出
      </button>

      <span class="fwat__count">
        共 <b>{{ filtered.length }}</b> 条
        <template v-if="unhandledCount > 0">
          · <b class="fwat__count--bad">{{ unhandledCount }}</b> 条未处理
        </template>
      </span>
    </div>

    <!-- ===== 表格 ===== -->
    <div class="fwat__wrap">
      <table class="fi-table">
        <thead>
          <tr class="fi-thead-tr">
            <th class="fi-th col-type"><span>事件类型</span></th>
            <th class="fi-th col-content"><span>事件内容</span></th>
            <th class="fi-th col-devtype"><span>设备类型</span></th>
            <th class="fi-th col-code"><span>设备编码</span></th>
            <th class="fi-th col-loc"><span>安装位置</span></th>
            <th class="fi-th col-time"><span>上报时间</span></th>
            <th class="fi-th col-actions"><span>操作</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in pageRows" :key="r.id" class="fi-tbody-tr">
            <td class="fi-td col-type">
              <span class="fw-tag" :class="`fw-tag--${eventType(r).cls}`">
                <i class="fw-tag__dot" />
                {{ eventType(r).label }}
              </span>
            </td>
            <td class="fi-td col-content" :title="r.reason">{{ r.reason }}</td>
            <td class="fi-td col-devtype">{{ typeNameOf(r.typeKey) }}</td>
            <td class="fi-td col-code">{{ r.code }}</td>
            <td class="fi-td col-loc" :title="r.location">{{ r.location }}</td>
            <td class="fi-td col-time">{{ timeText(r.occurredAt) }}</td>
            <td class="fi-td col-actions">
              <span class="fwat__actions">
                <button
                  type="button"
                  class="act-btn act-btn--icon"
                  title="查看点位详情"
                  @click="emit('preview', r)"
                >
                  <AppIcon name="browse" />
                </button>
                <button
                  v-if="r.status === 'unhandled'"
                  type="button"
                  class="act-btn fwat__handle"
                  title="标记为已处理"
                  @click="emit('handle', r.id)"
                >
                  处理
                </button>
                <span v-else class="fwat__done">已处理</span>
              </span>
            </td>
          </tr>
          <tr v-if="!pageRows.length">
            <td class="fi-td" colspan="7">
              <el-empty description="暂无报警记录" :image-size="60" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===== 分页 ===== -->
    <div class="fwat__pager">
      <span class="fwat__pager-text">
        共 {{ filtered.length }} 条记录 第 {{ pageCount ? page : 1 }}/{{ pageCount }} 页
      </span>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="filtered.length"
        layout="sizes, prev, pager, next"
        background
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 报警记录表（设计稿「报警记录」页）
 *
 * 列：事件类型 / 事件内容 / 设备类型 / 设备编码 / 安装位置 / 上报时间 / 操作
 * 记录来源见 stores/firewater-alarm.ts：当前异常点位实时累积 + 首次加载补的历史。
 *
 * 表格用项目标准 fi-table（表头 sticky，仅表体滚动），分页常驻底部。
 */
import { computed, reactive, ref, watch } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import type { FireAlarmRecord } from '@/types/firewater'

const props = defineProps<{
  records: FireAlarmRecord[]
  unhandledCount: number
  /** 设备档案类型 key → 名称 */
  typeNameOf: (typeKey: string) => string
  /** 管理单元（分机）下拉项 */
  units: Array<{ id: string; label: string }>
}>()

const emit = defineEmits<{
  /** 标记已处理 */
  handle: [id: string]
  /** 查看点位详情 */
  preview: [record: FireAlarmRecord]
}>()

/** 筛选草稿（点「查询」才生效） */
const draft = reactive<{ keyword: string; unit: string; range: [string, string] | null }>({
  keyword: '',
  unit: '',
  range: null,
})

/** 已生效的筛选条件 */
const applied = ref({ keyword: '', unit: '', range: null as [string, string] | null })

function query(): void {
  applied.value = {
    keyword: draft.keyword.trim(),
    unit: draft.unit,
    range: draft.range ? ([...draft.range] as [string, string]) : null,
  }
}

const filtered = computed(() => {
  const { keyword, unit, range } = applied.value
  const from = range ? new Date(`${range[0]}T00:00:00`).getTime() : null
  const to = range ? new Date(`${range[1]}T23:59:59.999`).getTime() : null
  return props.records.filter(r => {
    if (keyword && !r.location.includes(keyword) && !r.code.includes(keyword)) return false
    if (unit && r.hostId !== unit) return false
    if (from != null && r.occurredAt < from) return false
    if (to != null && r.occurredAt > to) return false
    return true
  })
})

const page = ref(1)
const pageSize = ref(10)

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const pageRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

// 筛选或数据变化后回到第一页，否则可能停在越界页码上
watch([filtered, pageSize], () => {
  if (page.value > pageCount.value) page.value = 1
})

/** 事件类型：由触发时的点位状态推导（alarm=火警 / fault=故障 / offline=离线） */
function eventType(r: FireAlarmRecord): { label: string; cls: string } {
  if (r.pointStatus === 'alarm') return { label: '火警', cls: 'danger' }
  if (r.pointStatus === 'offline') return { label: '离线', cls: 'normal' }
  return { label: '故障', cls: 'warning' }
}

function timeText(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/** 批量导出：导出当前筛选结果 */
function exportCsv(): void {
  const head = ['事件类型', '事件内容', '设备类型', '设备编码', '安装位置', '上报时间', '处置状态']
  const rows = filtered.value.map(r => [
    eventType(r).label,
    r.reason,
    props.typeNameOf(r.typeKey),
    r.code,
    r.location,
    timeText(r.occurredAt),
    r.status === 'unhandled' ? '未处理' : '已处理',
  ])
  const csv = [head, ...rows]
    .map(cols => cols.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `消防水系统报警记录_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.fwat {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

/* ===== 筛选行 ===== */
.fwat__filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.fwat__search { width: 193px; }
.fwat__select { width: 212px; }
.fwat__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: background .2s ease, border-color .2s ease, color .2s ease;
}
.fwat__btn--primary {
  color: #fff;
  background: var(--accent-primary);
  border: 1px solid var(--accent-primary);
}
.fwat__btn--primary:hover { background: #2c66c7; }
.fwat__btn--ghost {
  color: var(--accent-primary);
  background: rgba(54, 120, 227, .1);
  border: 1px solid var(--accent-primary);
}
.fwat__btn--ghost:hover { background: rgba(54, 120, 227, .18); }
.fwat__count {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
.fwat__count b { color: var(--text-primary); }
.fwat__count--bad { color: var(--danger-text) !important; }

/* ===== 表格 ===== */
.fwat__wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--border-default);
  border-radius: 8px;
}
.fwat__wrap .fi-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}
/* 表头与正文统一 16px（全局 fi-table 默认表头 14px） */
.fwat__wrap .fi-th,
.fwat__wrap .fi-td {
  font-size: 16px;
}

.col-type { width: 120px; }
.col-content { min-width: 220px; text-align: left; white-space: normal; }
.col-devtype { width: 150px; }
.col-code { width: 140px; }
.col-loc { min-width: 180px; text-align: left; }
.col-time { width: 170px; }
.col-actions { width: 140px; }

/* 操作列：图标按钮横排（.act-btn 本身是 flex 块级，需要外层横排容器） */
.fwat__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.fwat__handle {
  width: auto;
  padding: 0 6px;
  font: inherit;
  font-size: 12px;
  color: var(--accent-primary);
}
.fwat__done { color: var(--text-muted); }

/* 事件类型标签：圆点 + 文字 */
.fw-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 20px;
  white-space: nowrap;
}
.fw-tag__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.fw-tag--danger { color: var(--danger); background: rgba(220, 38, 38, .1); }
.fw-tag--warning { color: var(--warning); background: rgba(217, 119, 6, .1); }
.fw-tag--normal { color: var(--text-tertiary); background: var(--normal-bg); }

/* ===== 分页 ===== */
.fwat__pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
}
.fwat__pager-text {
  font-size: 12px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}
</style>

<style>
/*
 * el-date-picker 的根元素不吃 scoped 作用域标记，也不转发 style 属性，
 * 组件内 .fwat__date 规则匹配不上，只能用全局选择器压住 Element Plus 的
 * .el-date-editor--daterange 宽度。
 */
.fwat__date {
  flex: 0 0 280px !important;
  width: 280px !important;
}
</style>
