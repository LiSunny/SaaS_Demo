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
      <!-- 三指标 -->
      <div class="task-stats">
        <div class="task-stat pending">
          <span class="stat-num">{{ pendingCount }}</span>
          <span class="stat-label">待办</span>
        </div>
        <div class="task-stat done">
          <span class="stat-num">{{ doneCount }}</span>
          <span class="stat-label">已完成</span>
        </div>
        <div class="task-stat remaining">
          <span class="stat-num">{{ pendingCount }}</span>
          <span class="stat-label">剩余</span>
        </div>
      </div>

      <!-- 待办列表 -->
      <div v-if="tasks.length > 0" class="task-list">
        <div v-for="task in tasks" :key="task.id" class="task-item" @click="goTask(task)">
          <span class="task-module">{{ task.module }}</span>
          <span class="task-type">{{ task.type }}</span>
          <span class="task-title">{{ task.title }}</span>
          <span v-if="task.priority === 'urgent'" class="task-badge urgent">紧急</span>
        </div>
      </div>
      <div v-else class="task-empty">暂无待办</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getWorkOrderList } from '@/api/work-order'

defineProps<{
  widgetId: string
  config?: Record<string, any>
}>()

const router = useRouter()
const loading = ref(true)
const error = ref(false)
const pendingCount = ref(0)
const doneCount = ref(0)

interface TaskItem {
  id: string
  module: string
  type: string
  title: string
  priority: 'urgent' | 'normal' | 'low'
  link: string
}

const tasks = ref<TaskItem[]>([])

// 临时角色（后续从用户 Store 取）
const role = 'property'

async function fetch() {
  loading.value = true
  error.value = false
  try {
    const res = await getWorkOrderList({ page: 1, size: 100 })
    const list = res.list

    if (role === 'property') {
      // 物业管理员：待验收 + 草稿（creator = 张三，简化处理）
      const mine = list.filter(w => w.creatorName === '张三')
      const verifying = mine.filter(w => w.status === 'verifying')
      const drafts = mine.filter(w => w.status === 'draft')
      pendingCount.value = verifying.length + drafts.length
      doneCount.value = mine.filter(w => w.status === 'closed').length

      tasks.value = [
        ...verifying.map(w => ({
          id: `v-${w.id}`, module: '工单', type: '待验收',
          title: w.orderNo + ' ' + w.templateName,
          priority: w.priority, link: `/system/order/${w.id}`,
        })),
        ...drafts.map(w => ({
          id: `d-${w.id}`, module: '工单', type: '草稿',
          title: w.orderNo + ' ' + w.templateName,
          priority: w.priority, link: `/system/order/${w.id}`,
        })),
      ]
    } else if (role === 'supervisor') {
      // 监管员：超时工单
      const timeout = list.filter(w => w.sla.slaStatus === 'timeout')
      pendingCount.value = timeout.length
      doneCount.value = list.filter(w => w.status === 'closed').length
      tasks.value = timeout.slice(0, 10).map(w => ({
        id: `t-${w.id}`, module: '工单', type: '超时',
        title: w.orderNo + ' ' + w.templateName,
        priority: 'urgent', link: `/system/order/${w.id}`,
      }))
    } else {
      // 工程师：待接单 + 处置中（assignee = 王五/陈七）
      const mine = list.filter(w => w.currentAssigneeName === '王五' || w.currentAssigneeName === '陈七')
      const pending = mine.filter(w => w.status === 'pending_accept' || w.status === 'processing')
      pendingCount.value = pending.length
      doneCount.value = mine.filter(w => w.status === 'closed').length
      tasks.value = pending.map(w => ({
        id: `p-${w.id}`, module: '工单',
        type: w.status === 'pending_accept' ? '待接单' : '处置中',
        title: w.orderNo + ' ' + w.templateName,
        priority: w.priority, link: `/system/order/${w.id}`,
      }))
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function goTask(task: TaskItem) {
  if (task.link) router.push(task.link)
}

onMounted(fetch)
</script>

<style scoped>
.my-tasks-widget {
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

/* 三指标 */
.task-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}
.task-stat {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  border-radius: 8px;
}
.task-stat.pending { background: rgba(243, 156, 18, 0.08); }
.task-stat.done { background: rgba(76, 175, 80, 0.08); }
.task-stat.remaining { background: rgba(46, 149, 226, 0.08); }
.stat-num {
  display: block;
  font-size: 22px;
  font-weight: 700;
}
.task-stat.pending .stat-num { color: #f39c12; }
.task-stat.done .stat-num { color: #4caf50; }
.task-stat.remaining .stat-num { color: #2e95e2; }
.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 待办列表 */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.task-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.task-item:hover {
  background: var(--accent-primary10);
}
.task-module {
  font-size: 11px;
  background: var(--border-default);
  padding: 1px 6px;
  border-radius: 4px;
  color: var(--text-secondary);
  flex-shrink: 0;
}
.task-type {
  color: var(--text-secondary);
  flex-shrink: 0;
}
.task-title {
  flex: 1;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.task-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}
.task-badge.urgent {
  background: rgba(229, 72, 72, 0.1);
  color: #e54848;
}
.task-empty {
  text-align: center;
  color: var(--text-placeholder);
  font-size: 13px;
  padding: 16px 0;
}
</style>
