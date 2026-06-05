<template>
  <div class="flow-records">
    <div class="records-header">
      <p class="records-title">流转记录</p>
    </div>

    <div v-if="records.length === 0" class="records-empty">
      暂无流转记录
    </div>

    <div v-else class="records-list">
      <div
        v-for="record in records"
        :key="record.id"
        class="record-item"
      >
        <!-- 标题行：操作名称 + 时间 -->
        <div class="record-top">
          <span class="record-action">{{ record.action }}</span>
          <span class="record-time">{{ record.createdAt }}</span>
        </div>

        <!-- 操作人 -->
        <div class="record-operator">
          <span class="record-avatar">👤</span>
          <span class="record-operator-name">{{ record.operatorName }}</span>
          <span v-if="record.operatorOrgName" class="record-operator-org">{{ record.operatorOrgName }}</span>
        </div>

        <!-- 描述文本（如果有） -->
        <div v-if="record.content" class="record-content">
          {{ record.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WorkOrderRecord } from '@/types/work-order'

defineProps<{
  records: WorkOrderRecord[]
}>()
</script>

<style scoped>
.flow-records {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.records-header {
  flex-shrink: 0;
  padding-bottom: var(--spacing-lg, 12px);
  border-bottom: 1px solid var(--border-default, #e9e9e9);
  margin-bottom: var(--spacing-lg, 12px);
}

.records-title {
  font-size: var(--font-h4, 16px);
  font-weight: 500;
  color: var(--text-secondary, #2e2e2e);
  margin: 0;
}

.records-empty {
  text-align: center;
  color: var(--text-muted, #5e5e5e);
  font-size: var(--font-small, 14px);
  padding: var(--spacing-xl, 24px) 0;
}

.records-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md, 12px);
}

.record-item {
  background: var(--bg-card, #fff);
  border-radius: var(--radius-sm, 6px);
  padding: var(--spacing-xs, 6px) var(--spacing-sm, 6px);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 标题行 */
.record-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs, 6px) 0;
}

.record-action {
  font-size: var(--font-h3, 18px);
  color: var(--text-primary, #101010);
  flex: 1;
}

.record-time {
  font-size: var(--font-h4, 16px);
  color: var(--text-tertiary, #454545);
  text-align: right;
  flex: 1;
}

/* 操作人 */
.record-operator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 8px);
}

.record-avatar {
  width: 18px;
  height: 18px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.record-operator-name {
  font-size: var(--font-small, 14px);
  color: var(--text-tertiary, #454545);
}

.record-operator-org {
  font-size: var(--font-xs, 12px);
  color: var(--text-muted, #5e5e5e);
}

/* 描述 */
.record-content {
  font-size: var(--font-small, 14px);
  color: var(--text-tertiary, #454545);
  padding: 0 var(--spacing-sm, 8px);
  line-height: 27px;
}
</style>
