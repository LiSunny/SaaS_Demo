<template>
  <div class="sm-lt">
    <!-- ===== 筛选行 ===== -->
    <div class="sm-lt__filters">
      <el-input
        v-model="draft.keyword"
        class="sm-lt__search"
        placeholder="安装位置/设备编码"
        clearable
      >
        <template #prefix><AppIcon name="search" /></template>
      </el-input>

      <el-select v-model="draft.typeKey" class="sm-lt__select" placeholder="设备类型" clearable>
        <el-option v-for="t in types" :key="t.key" :label="t.label" :value="t.key" />
      </el-select>

      <el-date-picker
        v-model="draft.range"
        class="sm-lt__date"
        style="width: 280px"
        type="daterange"
        range-separator="至"
        start-placeholder="添加日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
      />

      <button type="button" class="sm-lt__btn sm-lt__btn--primary" @click="query">查询</button>

      <button type="button" class="sm-lt__btn sm-lt__btn--ghost" @click="exportCsv">
        <AppIcon name="download" />
        批量导出
      </button>

      <span class="sm-lt__count">共 <b>{{ filtered.length }}</b> 台设备</span>
    </div>

    <!-- ===== 表格 ===== -->
    <div class="sm-lt__wrap">
      <table class="fi-table">
        <thead>
          <tr class="fi-thead-tr">
            <th class="fi-th col-status"><span>运行状态</span></th>
            <th class="fi-th col-name"><span>设备名称</span></th>
            <th class="fi-th col-type"><span>设备类型</span></th>
            <th class="fi-th col-code"><span>设备编码</span></th>
            <th class="fi-th col-loc"><span>安装位置</span></th>
            <th class="fi-th col-time">
              <span title="演示数据：由设备编码推导的确定性时间，非真实建档时间">添加时间</span>
            </th>
            <th class="fi-th col-actions"><span>操作</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in pageRows" :key="r.point.id" class="fi-tbody-tr">
            <td class="fi-td col-status">
              <span class="sm-tag" :class="`sm-tag--${statusOf(r.point).cls}`">
                <i class="sm-tag__dot" />
                {{ statusOf(r.point).label }}
              </span>
            </td>
            <td class="fi-td col-name" :title="r.name">{{ r.name }}</td>
            <td class="fi-td col-type">{{ r.typeLabel }}</td>
            <td class="fi-td col-code">{{ r.code }}</td>
            <td class="fi-td col-loc" :title="r.location">{{ r.location }}</td>
            <td class="fi-td col-time">{{ r.addedAt }}</td>
            <td class="fi-td col-actions">
              <span class="sm-lt__actions">
                <button type="button" class="act-btn act-btn--icon" title="查看设备详情" @click="emit('preview', r.point)">
                  <AppIcon name="browse" />
                </button>
                <button type="button" class="act-btn act-btn--icon" title="查看实时趋势" @click="emit('preview', r.point)">
                  <AppIcon name="chart" />
                </button>
                <button type="button" class="act-btn act-btn--icon" title="查看所属图元分组" @click="emit('group', r.point)">
                  <AppIcon name="link" />
                </button>
                <button type="button" class="act-btn act-btn--icon" title="设备配置" @click="emit('config', r.point)">
                  <AppIcon name="setting" />
                </button>
                <el-dropdown trigger="click" @command="onMore($event, r)">
                  <button type="button" class="act-btn act-btn--icon" title="更多">
                    <AppIcon name="more" />
                  </button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="copy-code">复制设备编码</el-dropdown-item>
                      <el-dropdown-item command="copy-loc">复制安装位置</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </span>
            </td>
          </tr>
          <tr v-if="!pageRows.length">
            <td class="fi-td" colspan="7">
              <el-empty description="暂无设备" :image-size="60" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ===== 分页 ===== -->
    <div class="pagination-wrap">
      <span class="pagi-total">
        共 {{ filtered.length }} 条记录 第 {{ pageCount ? page : 1 }}/{{ pageCount }} 页
      </span>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filtered.length"
        layout="sizes, prev, pager, next, jumper"
        background
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 设备台帐（设计稿「设备台帐」页）
 *
 * 列：运行状态 / 设备名称 / 设备类型 / 设备编码 / 安装位置 / 添加时间 / 操作
 *
 * 台帐行 = 一个采集设备（一个点位即一台设备），运行状态取实时状态。
 * 「添加时间」在演示数据里没有真实来源，按设备编码推导一个确定性时间，
 * 列头已注明是演示数据。
 */
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import AppIcon from '@/components/base/AppIcon.vue'
import type { PointDef } from '@/types/subsystem'

/** 台帐一行 */
export interface SubsystemLedgerRow {
  point: PointDef
  name: string
  typeLabel: string
  code: string
  location: string
  addedAt: string
}

const props = withDefaults(
  defineProps<{
    /** 全部设备（点位） */
    points: PointDef[]
    /** 设备档案类型 key → 名称 */
    typeNameOf: (typeKey: string) => string
    /** 实时状态查询 */
    statusOf: (point: PointDef) => { label: string; cls: string }
    /** 导出文件名（不含日期后缀） */
    exportName?: string
  }>(),
  { exportName: '设备台帐' },
)

const emit = defineEmits<{
  /** 查看设备详情 */
  preview: [point: PointDef]
  /** 查看所属图元分组 */
  group: [point: PointDef]
  /** 设备配置 */
  config: [point: PointDef]
}>()

/** 字符串哈希 → 确定性时间（同一台设备每次刷新都是同一个时间） */
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 台帐基准日 */
const BASE_DAY = Date.UTC(2025, 0, 1)

function addedTimeOf(p: PointDef): string {
  const day = hash(p.id) % 300
  const d = new Date(BASE_DAY + day * 86400000)
  const p2 = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`
}

const rows = computed<SubsystemLedgerRow[]>(() => {
  const seq = new Map<string, number>()
  return props.points.map(p => {
    const n = (seq.get(p.typeKey) ?? 0) + 1
    seq.set(p.typeKey, n)
    const typeLabel = props.typeNameOf(p.typeKey)
    return {
      point: p,
      name: `${typeLabel}#${n}`,
      typeLabel,
      code: p.code,
      location: p.location,
      addedAt: addedTimeOf(p),
    }
  })
})

const types = computed(() => {
  const seen = new Map<string, string>()
  for (const r of rows.value) seen.set(r.point.typeKey, r.typeLabel)
  return [...seen].map(([key, label]) => ({ key, label }))
})

/** 筛选草稿（点「查询」才生效） */
const draft = reactive<{ keyword: string; typeKey: string; range: [string, string] | null }>({
  keyword: '',
  typeKey: '',
  range: null,
})

const applied = ref({ keyword: '', typeKey: '', range: null as [string, string] | null })

function query(): void {
  applied.value = {
    keyword: draft.keyword.trim(),
    typeKey: draft.typeKey,
    range: draft.range ? ([...draft.range] as [string, string]) : null,
  }
}

const filtered = computed(() => {
  const { keyword, typeKey, range } = applied.value
  const from = range ? new Date(`${range[0]}T00:00:00`).getTime() : null
  const to = range ? new Date(`${range[1]}T23:59:59.999`).getTime() : null
  return rows.value.filter(r => {
    if (keyword && !r.location.includes(keyword) && !r.code.includes(keyword)) return false
    if (typeKey && r.point.typeKey !== typeKey) return false
    if (from != null || to != null) {
      const t = new Date(`${r.addedAt}T00:00:00`).getTime()
      if (from != null && t < from) return false
      if (to != null && t > to) return false
    }
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

watch([filtered, pageSize], () => {
  if (page.value > pageCount.value) page.value = 1
})

function onMore(cmd: string, r: SubsystemLedgerRow): void {
  if (cmd === 'copy-code') {
    void navigator.clipboard?.writeText(r.code)
    ElMessage.success(`已复制设备编码：${r.code}`)
  } else if (cmd === 'copy-loc') {
    void navigator.clipboard?.writeText(r.location)
    ElMessage.success(`已复制安装位置：${r.location}`)
  }
}

function exportCsv(): void {
  const head = ['运行状态', '设备名称', '设备类型', '设备编码', '安装位置', '添加时间']
  const body = filtered.value.map(r => [
    props.statusOf(r.point).label,
    r.name,
    r.typeLabel,
    r.code,
    r.location,
    r.addedAt,
  ])
  const csv = [head, ...body]
    .map(cols => cols.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.exportName}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.sm-lt {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

/* ===== 筛选行 ===== */
.sm-lt__filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}
.sm-lt__search { width: 193px; }
.sm-lt__select { width: 212px; }
.sm-lt__btn {
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
.sm-lt__btn--primary {
  color: #fff;
  background: var(--accent-primary);
  border: 1px solid var(--accent-primary);
}
.sm-lt__btn--primary:hover { background: #2c66c7; }
.sm-lt__btn--ghost {
  color: var(--accent-primary);
  background: rgba(54, 120, 227, .1);
  border: 1px solid var(--accent-primary);
}
.sm-lt__btn--ghost:hover { background: rgba(54, 120, 227, .18); }
.sm-lt__count {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
.sm-lt__count b { color: var(--text-primary); }

/* ===== 表格 ===== */
.sm-lt__wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--border-default);
  border-radius: 8px;
}
.sm-lt__wrap .fi-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}
/* 表头与正文统一 16px（全局 fi-table 默认表头 14px） */
.sm-lt__wrap .fi-th,
.sm-lt__wrap .fi-td {
  font-size: 16px;
}

.col-status { width: 120px; }
.col-name { width: 190px; }
.col-type { width: 150px; }
.col-code { width: 140px; }
.col-loc { min-width: 180px; text-align: left; }
.col-time { width: 130px; }
.col-actions { width: 200px; }

/* 操作列：图标按钮横排（.act-btn 本身是 flex 块级，需要外层横排容器） */
.sm-lt__actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

/* 状态标签：圆点 + 文字 */
.sm-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 20px;
  white-space: nowrap;
}
.sm-tag__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.sm-tag--success { color: var(--success); background: var(--success-bg); }
.sm-tag--danger { color: var(--danger); background: rgba(220, 38, 38, .1); }
.sm-tag--warning { color: var(--warning); background: rgba(217, 119, 6, .1); }
.sm-tag--normal { color: var(--text-tertiary); background: var(--normal-bg); }

/* ===== 分页 ===== */
/* 分页容器与文案用全局 .pagination-wrap / .pagi-total，
   el-pagination 的主题覆盖在 src/style.css 里统一给（各业务页不再各抄一份）。 */
</style>

<style>
/*
 * el-date-picker 的根元素不吃 scoped 作用域标记，也不转发 style 属性，
 * 组件内 .sm-lt__date 规则匹配不上，只能用全局选择器压住 Element Plus 的
 * .el-date-editor--daterange 宽度。
 */
.sm-lt__date {
  flex: 0 0 280px !important;
  width: 280px !important;
}
</style>
