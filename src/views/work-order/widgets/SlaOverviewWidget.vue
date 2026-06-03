<template>
  <div class="sla-overview-widget">
    <div v-if="loading" class="widget-state">
      <el-skeleton :rows="3" animated />
    </div>
    <div v-else-if="error" class="widget-state widget-error-state">
      <span>加载失败</span>
      <button class="retry-link" @click="fetch">重试</button>
    </div>
    <div v-else-if="!stats" class="widget-state">
      <span class="empty-text">暂无数据</span>
    </div>
    <template v-else>
      <div class="sla-gauges">
        <div class="sla-gauge timeout">
          <span class="gauge-num">{{ stats.timeoutCount }}</span>
          <span class="gauge-label">超时</span>
        </div>
        <div class="sla-gauge warning">
          <span class="gauge-num">{{ stats.warningCount }}</span>
          <span class="gauge-label">预警</span>
        </div>
        <div class="sla-gauge normal">
          <span class="gauge-num">{{ stats.normalCount }}</span>
          <span class="gauge-label">正常</span>
        </div>
      </div>
      <div v-if="stats.timeoutCount > 0" class="timeout-list">
        <p class="timeout-list-title">超时工单</p>
        <div v-for="item in timeoutOrders" :key="item.id" class="timeout-item" @click="goDetail(item.id)">
          <span class="timeout-no">{{ item.orderNo }}</span>
          <span class="timeout-tpl">{{ item.templateName }}</span>
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
import type { WorkOrderItem } from '@/types/work-order'

defineProps<{
  widgetId: string
  config?: Record<string, any>
}>()

const router = useRouter()
const loading = ref(true)
const error = ref(false)
const stats = ref<{ timeoutCount: number; warningCount: number; normalCount: number } | null>(null)
const timeoutOrders = ref<WorkOrderItem[]>([])

async function fetch() {
  loading.value = true
  error.value = false
  try {
    // 获取全量工单
    const all = await getWorkOrderList({ page: 1, size: 1000 })
    const list = all.list
    stats.value = {
      timeoutCount: list.filter(w => w.sla.slaStatus === 'timeout').length,
      warningCount: list.filter(w => w.sla.slaStatus === 'warning').length,
      normalCount: list.filter(w => w.sla.slaStatus === 'normal').length,
    }
    timeoutOrders.value = list
      .filter(w => w.sla.slaStatus === 'timeout')
      .slice(0, 3)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
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
.sla-overview-widget {
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

/* SLA 仪表 */
.sla-gauges {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.sla-gauge {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  border-radius: 8px;
}
.sla-gauge.timeout {
  background: rgba(229, 72, 72, 0.08);
}
.sla-gauge.warning {
  background: rgba(243, 156, 18, 0.08);
}
.sla-gauge.normal {
  background: rgba(76, 175, 80, 0.08);
}
.gauge-num {
  display: block;
  font-size: 24px;
  font-weight: 700;
}
.sla-gauge.timeout .gauge-num { color: #e54848; }
.sla-gauge.warning .gauge-num { color: #f39c12; }
.sla-gauge.normal .gauge-num { color: #4caf50; }
.gauge-label {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 超时列表 */
.timeout-list {
  margin-bottom: 8px;
}
.timeout-list-title {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 6px;
}
.timeout-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}
.timeout-item:hover {
  background: var(--accent-primary10);
}
.timeout-no {
  font-size: 13px;
  color: #e54848;
  font-weight: 500;
}
.timeout-tpl {
  font-size: 12px;
  color: var(--text-secondary);
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
