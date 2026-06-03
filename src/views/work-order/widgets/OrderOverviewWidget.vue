<template>
  <div class="order-overview-widget">
    <div v-if="loading" class="widget-state">
      <el-skeleton :rows="3" animated />
    </div>
    <div v-else-if="error" class="widget-state widget-error-state">
      <span>加载失败</span>
      <button class="retry-link" @click="fetch">重试</button>
    </div>
    <div v-else-if="!data" class="widget-state">
      <span class="empty-text">暂无工单</span>
    </div>
    <template v-else>
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-num">{{ data.stats.draft + data.stats.pendingAssign }}</span>
          <span class="stat-label">待处理</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">{{ data.stats.processing + data.stats.pendingAccept }}</span>
          <span class="stat-label">进行中</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">{{ data.stats.verifying }}</span>
          <span class="stat-label">待验收</span>
        </div>
        <div class="stat-item">
          <span class="stat-num">{{ data.stats.closed }}</span>
          <span class="stat-label">已关闭</span>
        </div>
      </div>
      <div class="order-list">
        <div v-for="order in data.recentOrders" :key="order.id" class="order-item" @click="goDetail(order.id)">
          <div class="order-item-left">
            <span class="order-no">{{ order.orderNo }}</span>
            <span class="order-tpl">{{ order.templateName }}</span>
          </div>
          <div class="order-item-right">
            <StatusTag :status="order.status" :label="statusLabel(order.status)" />
            <span class="order-time">{{ formatTime(order.createdAt) }}</span>
          </div>
        </div>
      </div>
      <button class="view-all" @click="goList">
        查看全部 →
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getWorkOrderList } from '@/api/work-order'
import type { WorkOrderItem, WorkOrderStats } from '@/types/work-order'
import StatusTag from '@/components/business/StatusTag.vue'

defineProps<{
  widgetId: string
  config?: Record<string, any>
}>()

const router = useRouter()
const loading = ref(true)
const error = ref(false)
const data = ref<{ stats: WorkOrderStats; recentOrders: WorkOrderItem[] } | null>(null)

async function fetch() {
  loading.value = true
  error.value = false
  try {
    const res = await getWorkOrderList({ page: 1, size: 5 })
    data.value = {
      stats: res.stats || { all: 0, draft: 0, pendingAssign: 0, pendingAccept: 0, processing: 0, verifying: 0, closed: 0 },
      recentOrders: res.list,
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: '草稿', pending_assign: '待指派', pending_accept: '待接单',
    processing: '处置中', verifying: '验收中', closed: '已关闭',
  }
  return map[status] || status
}

function formatTime(time: string): string {
  return time?.slice(5, 16)?.replace(' ', ' ') || ''
}

function goDetail(id: number) {
  router.push(`/workflow/order/${id}`)
}

function goList() {
  router.push('/workflow/monitor')
}

onMounted(fetch)
</script>

<style scoped>
.order-overview-widget {
  min-height: 160px;
}
.widget-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: 16px;
}
.widget-error-state {
  gap: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}
.retry-link {
  background: none;
  border: none;
  color: var(--accent-primary);
  cursor: pointer;
  font-size: 13px;
}
.empty-text {
  color: var(--text-placeholder);
  font-size: 14px;
}

/* 统计行 */
.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-num {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 工单列表 */
.order-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}
.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background .15s;
}
.order-item:hover {
  background: var(--accent-primary10);
}
.order-item-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.order-no {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}
.order-tpl {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.order-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.order-time {
  font-size: 12px;
  color: var(--text-placeholder);
}

/* 查看全部 */
.view-all {
  display: block;
  width: 100%;
  text-align: center;
  background: none;
  border: none;
  color: var(--accent-primary);
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;
}
.view-all:hover {
  text-decoration: underline;
}
</style>
