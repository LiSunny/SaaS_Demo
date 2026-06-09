<template>
  <div class="my-tasks-widget">
    <div v-if="loading" class="widget-state">
      <el-skeleton :rows="3" animated />
    </div>
    <div v-else-if="error" class="widget-state widget-error-state">
      <span>加载失败</span>
      <button class="retry-link" @click="fetch">重试</button>
    </div>
    <template v-else>
      <!-- 双 Tab -->
      <div class="tab-row">
        <button
          :class="['tab-btn', { active: activeTab === 'created' }]"
          @click="activeTab = 'created'"
        >
          我发起的
          <span v-if="createdCount > 0" class="tab-badge">{{ createdCount }}</span>
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'assigned' }]"
          @click="activeTab = 'assigned'"
        >
          待我处理
          <span v-if="assignedCount > 0" class="tab-badge pending">{{ assignedCount }}</span>
        </button>
      </div>

      <!-- 列表 -->
      <div v-if="displayList.length > 0" class="task-list">
        <div
          v-for="task in displayList"
          :key="task.id"
          class="task-item"
          @click="goDetail(task.id)"
        >
          <div class="task-left">
            <span class="task-order-no">{{ task.orderNo }}</span>
            <span class="task-title">{{ task.title || task.templateName }}</span>
          </div>
          <div class="task-right">
            <StatusTag :status="task.status" :label="task.statusLabel" />
            <span class="task-time">{{ task.timeStr }}</span>
          </div>
        </div>
      </div>
      <div v-else class="task-empty">
        {{ activeTab === 'created' ? '暂无发起的工单' : '暂无待处理工单' }}
      </div>

      <!-- 查看全部 -->
      <button class="view-all" @click="goList">
        查看全部 →
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getWorkOrderList } from '@/api/work-order'
import { useUserStore } from '@/stores/user'
import type { WorkOrderItem } from '@/types/work-order'
import StatusTag from '@/components/business/StatusTag.vue'

defineProps<{
  widgetId: string
  config?: Record<string, any>
}>()

const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const error = ref(false)
const activeTab = ref<'created' | 'assigned'>('created')

interface TaskDisplay {
  id: number
  orderNo: string
  title: string
  templateName: string
  status: string
  statusLabel: string
  timeStr: string
}

const createdOrders = ref<TaskDisplay[]>([])
const assignedOrders = ref<TaskDisplay[]>([])

const STATUS_MAP: Record<string, string> = {
  draft: '草稿', active: '进行中', closed: '已关闭',
}

function formatList(list: WorkOrderItem[]): TaskDisplay[] {
  return list.map(w => ({
    id: w.id,
    orderNo: w.orderNo,
    title: w.title || w.templateName,
    templateName: w.templateName,
    status: w.status,
    statusLabel: STATUS_MAP[w.status] || w.status,
    timeStr: w.createdAt?.slice(5, 16)?.replace(' ', ' ') || '',
  }))
}

async function fetch() {
  loading.value = true
  error.value = false
  try {
    const res = await getWorkOrderList({ page: 1, size: 100 })
    const all = res.list
    const userName = userStore.currentUser.name

    // 我发起的
    createdOrders.value = formatList(
      all.filter(w => w.creatorName === userName),
    )
    // 待我处理（分配给我且未关闭）
    assignedOrders.value = formatList(
      all.filter(w => w.currentAssigneeName === userName && w.status !== 'closed'),
    )
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

const displayList = computed(() =>
  activeTab.value === 'created' ? createdOrders.value : assignedOrders.value,
)
const createdCount = computed(() => createdOrders.value.length)
const assignedCount = computed(() => assignedOrders.value.length)

function goDetail(id: number) {
  router.push(`/system/order/${id}`)
}
function goList() {
  router.push('/system/monitor')
}

onMounted(fetch)
</script>

<style scoped>
.my-tasks-widget {
  min-height: 160px;
}

/* 状态占位 */
.widget-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 120px; padding: 16px;
}
.widget-error-state {
  gap: 8px; color: var(--text-secondary); font-size: 14px;
}
.retry-link {
  background: none; border: none; color: var(--accent-primary);
  cursor: pointer; font-size: 13px;
}

/* 双 Tab */
.tab-row {
  display: flex; gap: 4px; margin-bottom: 10px;
  border-bottom: 1px solid var(--border-low); padding-bottom: 6px;
}
.tab-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 12px; border: none; background: none;
  font-size: 13px; color: var(--text-secondary); cursor: pointer;
  border-radius: var(--radius-sm, 6px); font-family: inherit;
  transition: color .15s, background .15s;
}
.tab-btn:hover { color: var(--accent-primary); }
.tab-btn.active {
  color: var(--accent-primary); font-weight: 600;
  background: var(--accent-primary10);
}
.tab-badge {
  font-size: 11px; padding: 1px 6px; border-radius: 10px;
  background: var(--border-default); color: var(--text-muted);
}
.tab-badge.pending {
  background: rgba(243, 156, 18, 0.12); color: #f39c12;
}

/* 列表 */
.task-list {
  display: flex; flex-direction: column; gap: 2px;
}
.task-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px; border-radius: 6px; cursor: pointer;
  transition: background .15s;
}
.task-item:hover { background: var(--accent-primary10); }
.task-left {
  display: flex; flex-direction: column; gap: 2px; min-width: 0;
}
.task-order-no {
  font-size: 13px; font-weight: 500; color: var(--text-primary);
}
.task-title {
  font-size: 12px; color: var(--text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.task-right {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}
.task-time {
  font-size: 12px; color: var(--text-placeholder);
}

/* 空态 */
.task-empty {
  text-align: center; color: var(--text-placeholder);
  font-size: 13px; padding: 16px 0;
}

/* 查看全部 */
.view-all {
  display: block; width: 100%; text-align: center;
  background: none; border: none; color: var(--accent-primary);
  font-size: 13px; cursor: pointer; padding: 6px 0 0;
}
.view-all:hover { text-decoration: underline; }
</style>
