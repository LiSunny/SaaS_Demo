<!--
  NotificationList.vue — 消息通知列表页（/notifications）

  表格主体复用 NotificationTable（与抽屉「全部列表」态同一份组件、同一份数据），
  本文件只负责页面外壳：卡片 + 标题 + 分割线，以及点行打开详情抽屉。

  视觉基准：Figma 节点 6591:6743
    标题「消息通知列表」+ 分割线 → 筛选行 / 表格 / 分页（见 NotificationTable）
-->

<template>
  <div class="list-page">
    <div class="content-card nf-card">
      <!-- ===== 标题 ===== -->
      <div class="nf-head">
        <h2 class="nf-title">消息通知列表</h2>
      </div>
      <div class="nf-divider" />

      <!-- ===== 筛选行 + 表格 + 分页 ===== -->
      <NotificationTable @open-detail="handleOpen" />
    </div>

    <!-- ===== 详情抽屉（点表格行打开） ===== -->
    <MessageNotificationDrawer v-model="detailOpen" :detail-id="detailId" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NotificationTable from '@/components/business/NotificationTable.vue'
import MessageNotificationDrawer from '@/components/base/MessageNotificationDrawer.vue'

/** 详情抽屉：点表格行 → 打开抽屉查看详情（不再跳独立详情页） */
const detailOpen = ref(false)
const detailId = ref<number | null>(null)

/** 点行 → 打开抽屉详情（进入详情即标记已读，抽屉内完成） */
function handleOpen(id: number) {
  detailId.value = id
  detailOpen.value = true
}
</script>

<style scoped>
.nf-card {
  padding: 28px 28px 12px;
}

/* ===== 标题 ===== */
.nf-head {
  display: flex;
  align-items: center;
  padding: 8px 0;
}
.nf-title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 27px;
}
.nf-divider {
  height: 1px;
  background: var(--border-high);
  margin-bottom: 16px;
}
</style>
