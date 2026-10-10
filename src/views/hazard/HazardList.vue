<template>
  <div class="hazard-list-page">
    <div class="content-card">

      <!-- ===== 顶部统计卡（设计文档 §3.1） ===== -->
      <div class="metric-row">
        <button
          class="metric-card metric-total"
          :class="{ active: statFilter === null }"
          @click="onStatClick(null)"
          type="button"
        >
          <span class="metric-value">{{ store.stats.total }}</span>
          <span class="metric-label">总隐患数</span>
        </button>
        <button
          class="metric-card metric-pending"
          :class="{ active: statFilter === 'pending' }"
          @click="onStatClick('pending')"
          type="button"
        >
          <span class="metric-value">{{ store.stats.pending }}</span>
          <span class="metric-label">待处理</span>
        </button>
        <button
          class="metric-card metric-processing"
          :class="{ active: statFilter === 'processing' }"
          @click="onStatClick('processing')"
          type="button"
        >
          <span class="metric-value">{{ store.stats.processing }}</span>
          <span class="metric-label">整改中</span>
        </button>
        <button
          class="metric-card metric-overdue"
          :class="{ active: statFilter === 'overdue' }"
          @click="onStatClick('overdue')"
          type="button"
        >
          <span class="metric-value">{{ store.stats.overdue }}</span>
          <span class="metric-label">超期未整改</span>
        </button>
      </div>

      <!-- ===== 筛选 + 搜索栏 ===== -->
      <div class="filter-bar">
        <div class="filter-left">
          <!-- 搜索 -->
          <div class="search-input-wrap">
            <input
              v-model="store.query.keyword"
              class="fi-input"
              placeholder="编号 / 位置 / 描述"
              @keyup.enter="handleSearch"
            />
            <button v-if="store.query.keyword" class="fi-clear" @click="store.query.keyword = ''; handleSearch()">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <!-- 等级 -->
          <div class="fi-select-wrap">
            <el-select
              v-model="store.query.level"
              placeholder="等级"
              clearable
              :teleported="false"
              popper-class="fi-popper"
              @change="handleSearch"
            >
              <el-option label="全部" value="all" />
              <el-option label="一般" value="general" />
              <el-option label="重大" value="major" />
            </el-select>
          </div>

          <!-- 状态 -->
          <div class="fi-select-wrap">
            <el-select
              v-model="store.query.status"
              placeholder="状态"
              clearable
              :teleported="false"
              popper-class="fi-popper"
              @change="handleSearch"
            >
              <el-option label="全部" value="all" />
              <el-option
                v-for="s in statusOptions"
                :key="s.key"
                :label="s.label"
                :value="s.key"
              />
            </el-select>
          </div>

          <!-- 期限 -->
          <div class="fi-select-wrap">
            <el-select
              v-model="store.query.due"
              placeholder="期限"
              clearable
              :teleported="false"
              popper-class="fi-popper"
              @change="handleSearch"
            >
              <el-option label="全部" value="all" />
              <el-option label="7 天内到期" value="within7" />
              <el-option label="已逾期" value="overdue" />
              <el-option label="本月到期" value="thisMonth" />
              <el-option label="自定义" value="custom" />
            </el-select>
          </div>

          <!-- 自定义日期范围（仅 due === 'custom' 显示） -->
          <div v-if="store.query.due === 'custom'" class="fi-date-range-wrap">
            <el-date-picker
              v-model="dueRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              :teleported="false"
              popper-class="fi-popper"
              @change="handleDateRangeChange"
            />
          </div>

          <!-- 流程模板 -->
          <div class="fi-select-wrap">
            <el-select
              v-model="store.query.template"
              placeholder="流程模板"
              clearable
              :teleported="false"
              popper-class="fi-popper"
              @change="handleSearch"
            >
              <el-option label="全部" value="all" />
              <el-option label="火灾隐患排查上报" value="fire_hazard_report" />
              <el-option label="火灾隐患整改处置" value="fire_hazard_rectify" />
            </el-select>
          </div>

          <button class="btn-primary" @click="handleSearch">查询</button>
          <button v-if="hasFilter" class="btn-default" @click="handleReset">重置</button>
        </div>

        <div class="filter-right">
          <button v-if="isRegulator && store.hasSelection" class="btn-default" @click="onBatchFlag(true)">
            挂牌督办（{{ store.selectedIds.length }}）
          </button>
          <button v-if="isRegulator && store.hasSelection" class="btn-default" @click="onBatchFlag(false)">
            解除挂牌
          </button>
          <button class="btn-default" @click="onExport">
            <AppIcon name="download" class="btn-add-icon" />批量导出
          </button>
          <button class="btn-primary" @click="onReport">
            <AppIcon name="plus" class="btn-add-icon" />上报隐患
          </button>
        </div>
      </div>

      <!-- ===== 列表（设计文档 §3.4） ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-check">
                <el-checkbox
                  :model-value="isAllSelected"
                  :indeterminate="isIndeterminate"
                  @change="(v: boolean) => store.toggleSelectAll(v, store.list)"
                />
              </th>
              <th class="fi-th col-code"><span>编号</span></th>
              <th class="fi-th col-level">
                <span class="sortable" @click="toggleSort('level')">
                  等级
                  <TableSortIcon :direction="sortIconDir('level')" />
                </span>
              </th>
              <th class="fi-th col-type"><span>类型</span></th>
              <th class="fi-th col-loc"><span>位置</span></th>
              <th class="fi-th col-reporter"><span>发现人</span></th>
              <th class="fi-th col-foundat">
                <span class="sortable" @click="toggleSort('foundAt')">
                  发现时间
                  <TableSortIcon :direction="sortIconDir('foundAt')" />
                </span>
              </th>
              <th class="fi-th col-status"><span>状态</span></th>
              <th class="fi-th col-due">
                <span class="sortable" @click="toggleSort('dueAt')">
                  期限
                  <TableSortIcon :direction="sortIconDir('dueAt')" />
                </span>
              </th>
              <th class="fi-th col-owner"><span>责任人</span></th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="store.loading">
            <tr v-for="row in store.list" :key="row.id" class="fi-tbody-tr">
              <td class="fi-td col-check">
                <el-checkbox
                  :model-value="store.selectedIds.includes(row.id)"
                  @change="() => store.toggleSelect(row.id)"
                />
              </td>
              <td class="fi-td col-code">
                <a class="code-link" @click.prevent="onViewDetail(row)">{{ row.code }}</a>
              </td>
              <td class="fi-td col-level">
                <span :class="['hl-tag', `hl-${row.level}`]">
                  {{ levelLabel(row.level) }}
                </span>
              </td>
              <td class="fi-td col-type">
                <div class="type-cell">
                  <span
                    v-for="(t, i) in visibleTypes(row.types)"
                    :key="i"
                    class="type-chip"
                  >{{ t }}</span>
                  <el-popover
                    v-if="row.types.length > MAX_VISIBLE_TYPES"
                    placement="top"
                    trigger="hover"
                    :teleported="false"
                    popper-class="fi-popper"
                    :width="200"
                  >
                    <template #reference>
                      <span class="type-more">+{{ row.types.length - MAX_VISIBLE_TYPES }}</span>
                    </template>
                    <div class="type-popover">
                      <span v-for="t in row.types.slice(MAX_VISIBLE_TYPES)" :key="t" class="type-chip">{{ t }}</span>
                    </div>
                  </el-popover>
                </div>
              </td>
              <td class="fi-td col-loc" :title="row.location">{{ row.location }}</td>
              <td class="fi-td col-reporter">
                <div class="user-cell">
                  <span class="user-avatar">{{ avatarOf(row.reporter) }}</span>
                  <span class="user-name">{{ row.reporter }}</span>
                </div>
              </td>
              <td class="fi-td col-foundat">{{ formatTime(row.foundAt) }}</td>
              <td class="fi-td col-status">
                <div class="status-cell">
                  <span :class="['hs-tag', `hs-tone-${row.isFlagged ? 'red' : hazardStatusTone(row.status)}`]">
                    {{ hazardStatusLabel(row.status) }}
                  </span>
                  <span v-if="row.isFlagged" class="hs-flag">已挂牌</span>
                </div>
              </td>
              <td class="fi-td col-due">
                <span :class="dueClass(row)">{{ row.dueAt }}</span>
              </td>
              <td class="fi-td col-owner">
                <div class="user-cell">
                  <span class="user-avatar">{{ avatarOf(row.owner) }}</span>
                  <span class="user-name" :class="{ placeholder: !row.ownerId }">{{ row.owner }}</span>
                </div>
              </td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-preview" title="详情" @click="onViewDetail(row)">
                    <AppIcon name="preview" class="act-icon" />
                  </button>
                  <button
                    v-if="canReview(row)"
                    class="act-btn act-edit"
                    title="审核"
                    @click="onReview(row)"
                  >
                    <AppIcon name="edit" class="act-icon" />
                  </button>
                  <button
                    v-if="canAccept(row)"
                    class="act-btn act-preview"
                    title="验收"
                    @click="onAccept(row)"
                  >
                    <AppIcon name="check" class="act-icon" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!store.loading && store.list.length === 0">
              <td colspan="11" class="empty-cell">
                <div class="empty">
                  <div class="empty-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                  </div>
                  <div class="empty-text">{{ emptyText }}</div>
                  <button v-if="!hasFilter" class="btn-primary empty-action" @click="onReport">
                    <AppIcon name="plus" class="btn-add-icon" />上报第一条隐患
                  </button>
                  <button v-else class="btn-default empty-action" @click="handleReset">清空筛选条件</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 分页 ===== -->
      <div v-if="store.total > 0" class="pagination-wrap">
        <span class="pagi-total">共 {{ store.total }} 条记录 第 {{ store.query.page }} / {{ Math.ceil(store.total / store.query.size) || 1 }} 页</span>
        <el-pagination
          v-model:current-page="store.query.page"
          v-model:page-size="store.query.size"
          :page-sizes="[10, 20, 50]"
          :total="store.total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="store.fetchList(currentUserId, currentEnterpriseId)"
          @current-change="store.fetchList(currentUserId, currentEnterpriseId)"
        />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useHazardStore } from '@/stores/hazard'
import {
  HAZARD_STATUS_DEFS,
  hazardStatusLabel,
  hazardStatusTone,
  type HazardItem,
} from '@/types/hazard'
import AppIcon from '@/components/base/AppIcon.vue'
import TableSortIcon from '@/components/base/TableSortIcon.vue'

const userStore = useUserStore()
const store = useHazardStore()

// ===== 当前用户与数据范围 =====
// 演示期：以登录用户 ID/企业为范围；具体登录态由 useUserStore 提供
const currentUserId = computed(() => userStore.currentUser?.id || userStore.currentUser?.phone || 'u-101')
const currentEnterpriseId = computed(() => userStore.currentUser?.enterprises?.[0]?.enterpriseId || 1)

/** 监管方视角（演示：以 systemRole + groups 含 regulator 判定） */
const isRegulator = computed(() => {
  const groups = userStore.currentGroups
  return groups.includes('regulator') || userStore.systemRole === 'platform-ops'
})

// ===== 顶部统计卡筛选状态（设计文档 §3.1 联动） =====
type StatFilter = 'pending' | 'processing' | 'overdue' | null
const statFilter = ref<StatFilter>(null)

function onStatClick(s: StatFilter) {
  statFilter.value = statFilter.value === s ? null : s
  if (s === 'pending') {
    store.query.status = 'pending_audit'
    // 注：UI 联动见下方 watch；当 status 被外部清除时，statFilter 重置
  } else if (s === 'processing') {
    store.query.status = 'assigned'
  } else if (s === 'overdue') {
    store.query.status = 'overdue'
  } else {
    store.query.status = 'all'
  }
  handleSearch()
}

watch(() => store.query.status, (v) => {
  if (v === 'pending_audit' && statFilter.value !== 'pending') statFilter.value = 'pending'
  else if (v === 'assigned' && statFilter.value !== 'processing') statFilter.value = 'processing'
  else if (v === 'overdue' && statFilter.value !== 'overdue') statFilter.value = 'overdue'
  else if (v === 'all' && statFilter.value !== null) statFilter.value = null
})

// ===== 状态选项（设计文档 §3.4.1） =====
const statusOptions = HAZARD_STATUS_DEFS

// ===== 自定义日期范围 =====
const dueRange = ref<[string, string] | null>(null)
function handleDateRangeChange(v: [string, string] | null) {
  if (!v) {
    store.query.startDate = undefined
    store.query.endDate = undefined
  } else {
    store.query.startDate = v[0]
    store.query.endDate = v[1]
  }
  handleSearch()
}

// ===== 操作 =====
function handleSearch() {
  store.search(currentUserId.value, currentEnterpriseId.value)
}
function handleReset() {
  dueRange.value = null
  store.resetFilter()
  statFilter.value = null
  store.fetchList(currentUserId.value, currentEnterpriseId.value)
}
const hasFilter = computed(() => {
  const q = store.query
  return !!q.keyword || q.level !== 'all' || q.status !== 'all'
    || q.due !== 'all' || q.template !== 'all'
    || q.onlyMine || q.onlyFlagged
})

// 排序
function toggleSort(field: 'foundAt' | 'level' | 'dueAt') {
  const cur = store.query.sortBy
  const dir = store.query.sortDir
  if (cur !== field) {
    store.query.sortBy = field
    store.query.sortDir = 'desc'
  } else if (dir === 'desc') {
    store.query.sortDir = 'asc'
  } else {
    store.query.sortDir = 'desc'
  }
  store.fetchList(currentUserId.value, currentEnterpriseId.value)
}
function sortIconDir(field: string): 'none' | 'asc' | 'desc' {
  if (store.query.sortBy !== field) return 'none'
  return store.query.sortDir ?? 'desc'
}

// ===== 行操作（演示期：弹消息 / 路由到占位详情页） =====
function onViewDetail(row: HazardItem) {
  ElMessage.info(`查看「${row.code}」详情（M1-5 待实现）`)
  // 真实链路：router.push(`/unit/hazards/${row.id}`)
}
function onReport() {
  ElMessage.info('上报隐患（M1-1 待实现）')
  // 真实链路：router.push('/unit/hazards/report')
}
function onReview(row: HazardItem) {
  ElMessage.info(`审核「${row.code}」（M1-3 待实现）`)
}
function onAccept(row: HazardItem) {
  ElMessage.success(`验收「${row.code}」（M2-3 待实现）`)
}
function onExport() {
  ElMessageBox.alert(
    `将按当前筛选条件导出 ${store.total} 条隐患（按设计文档 §3.3，走 M4-12 数据导出）`,
    '批量导出',
    { confirmButtonText: '确定' },
  )
}
async function onBatchFlag(flag: boolean) {
  const n = store.selectedIds.length
  await store.batchSetFlag(flag)
  ElMessage.success(`${flag ? '已挂牌' : '已解除挂牌'} ${n} 项`)
}

// ===== 行内可见性（设计文档 §3.4.2） =====
function canReview(row: HazardItem): boolean {
  return row.status === 'pending_audit'
}
function canAccept(row: HazardItem): boolean {
  return row.status === 'pending_accept'
}

// ===== 选择状态 =====
const isAllSelected = computed(() =>
  store.list.length > 0 && store.list.every(r => store.selectedIds.includes(r.id)),
)
const isIndeterminate = computed(() =>
  store.list.some(r => store.selectedIds.includes(r.id)) && !isAllSelected.value,
)

// ===== 渲染辅助 =====
function levelLabel(l: 'general' | 'major'): string {
  return l === 'major' ? '重大' : '一般'
}

/** 类型列最多显示 3 个，其余折叠 */
const MAX_VISIBLE_TYPES = 3
function visibleTypes(types: string[]): string[] {
  return types.slice(0, MAX_VISIBLE_TYPES)
}

function avatarOf(name: string): string {
  if (!name) return '?'
  // 中文姓名取末字，英文取首字母
  return name.charAt(name.length - 1)
}

function formatTime(t: string): string {
  if (!t) return '—'
  return t.slice(0, 16)
}

/** 期限列样式：超期红、7 天内橙 */
function dueClass(row: HazardItem): string {
  const due = new Date(row.dueAt)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((due.getTime() - today.getTime()) / 86400000)
  if (row.status === 'closed') return 'due-normal'
  if (diff < 0) return 'due-overdue'
  if (diff <= 7) return 'due-soon'
  return 'due-normal'
}

const emptyText = computed(() => {
  return hasFilter.value ? '没有符合条件的隐患' : '暂无隐患，扫码上报第一条吧'
})

// ===== 初次加载 =====
onMounted(async () => {
  await store.fetchList(currentUserId.value, currentEnterpriseId.value)
  await store.fetchStats(currentUserId.value, currentEnterpriseId.value)
})
</script>

<style scoped>
.hazard-list-page { height: 100%; }
.content-card {
  background: var(--bg-card);
  border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 12px);
  height: 100%;
  overflow: hidden;
}

/* ===== 统计卡 ===== */
.metric-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  flex-shrink: 0;
}
.metric-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  text-align: left;
  font: inherit;
  color: inherit;
  transition: border-color .15s, background .15s;
}
.metric-card:hover { border-color: var(--accent-primary); }
.metric-card.active {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
}
.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.metric-label {
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
}
.metric-pending .metric-value { color: var(--danger); }
.metric-processing .metric-value { color: var(--accent-primary); }
.metric-overdue .metric-value { color: var(--danger); font-weight: 800; }

/* ===== 筛选栏 ===== */
.fi-select-wrap { width: 150px; flex-shrink: 0; }

.due-row-popper { display: flex; gap: 8px; align-items: center; padding: 8px; }

/* ===== 列表列宽 ===== */
.col-check { width: 36px; min-width: 36px; text-align: center; }
.col-code { width: 168px; min-width: 168px; }
.col-level { width: 70px; min-width: 70px; }
.col-type { width: 200px; min-width: 160px; }
.col-loc { min-width: 180px; }
.col-reporter { width: 110px; min-width: 110px; }
.col-foundat { width: 130px; min-width: 130px; }
.col-status { width: 130px; min-width: 110px; }
.col-due { width: 110px; min-width: 110px; }
.col-owner { width: 110px; min-width: 110px; }
.col-actions { width: 100px; min-width: 100px; text-align: right; }
.fi-th.col-actions span { text-align: right; }

.fi-thead-tr { background: var(--bg-card); position: sticky; top: 0; z-index: 1; }
.fi-tbody-tr { transition: background .12s; }
.fi-tbody-tr:hover { background: var(--accent-primary10); }

/* ===== 表格 sticky ===== */
.fi-table thead { position: sticky; top: 0; z-index: 1; background: var(--bg-card); }

/* ===== 排序列头 ===== */
.sortable {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
}
.sortable:hover { color: var(--accent-primary); }

/* ===== 编号超链 ===== */
.code-link {
  color: var(--accent-primary);
  cursor: pointer;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
  font-size: 12px;
  text-decoration: none;
}
.code-link:hover { text-decoration: underline; }

/* ===== 等级 tag ===== */
.hl-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.hl-tag.hl-general { background: var(--info-bg); color: var(--accent-primary); }
.hl-tag.hl-major { background: var(--danger-bg); color: var(--danger); }

/* ===== 隐患类型列 ===== */
.type-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.type-chip {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 3px;
  background: var(--bg-sub-card);
  color: var(--text-secondary);
  font-size: 12px;
  white-space: nowrap;
}
.type-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--bg-sub-card);
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
}
.type-popover {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 200px;
}

/* ===== 用户单元格 ===== */
.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.user-avatar {
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent-primary10);
  color: var(--accent-primary);
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.user-name {
  font-size: var(--font-small, 14px);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.user-name.placeholder { color: var(--text-muted); font-style: italic; }

/* ===== 状态列 ===== */
.status-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.hs-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.hs-tag.hs-tone-gray   { background: var(--normal-bg);  color: var(--normal); }
.hs-tag.hs-tone-yellow { background: var(--warning-bg); color: var(--warning); }
.hs-tag.hs-tone-orange { background: var(--notice-bg);  color: var(--notice); }
.hs-tag.hs-tone-blue   { background: var(--info-bg);    color: var(--accent-primary); }
.hs-tag.hs-tone-red    { background: var(--danger-bg);  color: var(--danger); }
.hs-tag.hs-tone-purple { background: rgba(139, 92, 246, 0.12); color: #8B5CF6; }
.hs-tag.hs-tone-green  { background: var(--success-bg); color: var(--success); }
.hs-flag {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 3px;
  background: var(--danger);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

/* ===== 期限列 ===== */
.due-normal { color: var(--text-primary); font-variant-numeric: tabular-nums; }
.due-soon {
  color: var(--warning);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.due-overdue {
  color: var(--danger);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* ===== 操作列 ===== */
.action-cell {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}
.act-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-muted);
  transition: background .12s, color .12s;
}
.act-btn:hover { background: var(--accent-primary10); color: var(--accent-primary); }
.act-btn.act-delete { color: var(--danger); }
.act-btn.act-delete:hover { background: var(--danger-bg); }
.act-icon { font-size: 16px; }

/* ===== 空状态 ===== */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  gap: 12px;
}
.empty-icon { color: var(--text-placeholder); }
.empty-text { color: var(--text-muted); font-size: var(--font-body, 16px); }
.empty-action { margin-top: 4px; }
.empty-cell { padding: 0 !important; }

/* ===== 响应式 ===== */
@media (max-width: 1500px) { .col-type { display: none !important; } }
@media (max-width: 1250px) { .col-foundat { display: none !important; } }
@media (max-width: 1050px) { .col-owner { display: none !important; } .col-actions { width: 60px; min-width: 60px; } .action-cell .act-btn:not(:first-child) { display: none; } }
@media (max-width: 800px) {
  .metric-row { grid-template-columns: repeat(2, 1fr); }
  .filter-bar { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: stretch; }
}

/* ===== 分页器暗色 ===== */
:deep(.el-pagination .el-pager li) { background-color: var(--pagi-bg); color: var(--pagi-text); border: 1px solid var(--border-default); }
:deep(.el-pagination .el-pager li.is-active) { background-color: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
:deep(.el-pagination .btn-prev), :deep(.el-pagination .btn-next) { background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important; border: 1px solid var(--border-default); }
:deep(.el-pagination .el-select .el-select__wrapper) { background-color: var(--bg-card) !important; color: var(--text-secondary); border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) { background-color: var(--bg-card) !important; border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__inner) { color: var(--text-primary) !important; }
</style>