<template>
  <div class="notification-widget">
    <div class="notif-list">
      <div v-for="item in notifications" :key="item.id" class="notif-item" @click="goDetail(item)">
        <span :class="['notif-dot', item.type]"></span>
        <div class="notif-body">
          <span class="notif-text">{{ item.text }}</span>
          <span class="notif-time">{{ item.time }}</span>
        </div>
      </div>
    </div>
    <div v-if="notifications.length === 0" class="notif-empty">暂无消息</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

defineProps<{
  widgetId: string
  config?: Record<string, any>
}>()

const router = useRouter()

interface NotificationItem {
  id: number
  type: 'sla' | 'assign' | 'verify' | 'system'
  text: string
  time: string
  link?: string
}

// 阶段 1 Mock 数据
const notifications = ref<NotificationItem[]>([
  { id: 1, type: 'sla',    text: 'WO20260520-004 工单已超时 2 小时',                    time: '2 小时前', link: '/system/order/4' },
  { id: 2, type: 'assign', text: '您有一个新的设备维修工单待接单',                        time: '3 小时前', link: '/system/monitor' },
  { id: 3, type: 'verify', text: 'WO20260510-007 安全生产督办工单等待您验收',             time: '昨天 14:30', link: '/system/order/7' },
  { id: 4, type: 'system', text: '系统将于 6 月 5 日 02:00-04:00 进行维护升级',           time: '昨天 10:00', link: '' },
])

function goDetail(item: NotificationItem) {
  if (item.link) router.push(item.link)
}
</script>

<style scoped>
.notification-widget {
  min-height: 120px;
}
.notif-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background .15s;
}
.notif-item:hover {
  background: var(--accent-primary10);
}
.notif-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}
.notif-dot.sla { background: #e54848; }
.notif-dot.assign { background: #f39c12; }
.notif-dot.verify { background: #2e95e2; }
.notif-dot.system { background: var(--text-placeholder); }
.notif-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.notif-text {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.4;
}
.notif-time {
  font-size: 12px;
  color: var(--text-placeholder);
}
.notif-empty {
  text-align: center;
  color: var(--text-placeholder);
  font-size: 13px;
  padding: 24px 0;
}
</style>
