<template>
  <SectionCard title="自查隐患报备监管" subtitle="Hidden" height="100%">
    <div class="hidden-danger">
      <BigscreenListTable :columns="columns" :rows="rows" row-key="id">
        <template #cell-status="{ row }">
          <span :class="['hd-status', row.statusClass]">{{ row.status }}</span>
        </template>
        <template #cell-time="{ value }">
          <span class="hd-time">{{ value }}</span>
        </template>
      </BigscreenListTable>
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import SectionCard from './SectionCard.vue'
import BigscreenListTable from './BigscreenListTable.vue'
import type { BsColumn } from './BigscreenListTable.vue'

const columns: BsColumn[] = [
  { key: 'status', label: '整改状态', width: 'calc(82 * var(--w))' },
  { key: 'content', label: '隐患内容' },
  { key: 'company', label: '上报企业', width: 'calc(82 * var(--w))' },
  { key: 'time', label: '上报时间', width: 'calc(100 * var(--w))' },
]

const rows = [
  { id: 1, status: '整改中', statusClass: 'status-ongoing', content: '消防通道堵塞', company: '胜邦木业', time: '2025-09-10' },
  { id: 2, status: '整改中', statusClass: 'status-ongoing', content: '灭火器过期', company: '胜邦木业', time: '2025-09-10' },
  { id: 3, status: '整改中', statusClass: 'status-ongoing', content: '电线私拉乱接', company: '胜邦木业', time: '2025-09-10' },
  { id: 4, status: '整改中', statusClass: 'status-ongoing', content: '安全出口标识缺失', company: '胜邦木业', time: '2025-09-10' },
  { id: 5, status: '整改中', statusClass: 'status-ongoing', content: '应急灯故障', company: '胜邦木业', time: '2025-09-10' },
  { id: 6, status: '整改中', statusClass: 'status-ongoing', content: '消防栓遮挡', company: '胜邦木业', time: '2025-09-10' },
  { id: 7, status: '已整改', statusClass: 'status-done', content: '疏散通道清理', company: '胜邦木业', time: '2025-09-10' },
  { id: 8, status: '整改中', statusClass: 'status-ongoing', content: '化学品存放不当', company: '华泰建材', time: '2025-09-11' },
  { id: 9, status: '整改中', statusClass: 'status-ongoing', content: '电焊作业无防护', company: '中联重科', time: '2025-09-12' },
  { id: 10, status: '已整改', statusClass: 'status-done', content: '配电箱接地修复', company: '远大化工', time: '2025-09-13' },
]
</script>

<style scoped>
.hidden-danger {
  height: 100%;
  overflow: hidden;
  padding: calc(8 * var(--h)) calc(8 * var(--w));
}

/* ===== 状态标签 ===== */
.hd-status {
  display: inline-block;
  padding: calc(2 * var(--h)) calc(8 * var(--w));
  border-radius: 2px;
  font-size: clamp(7px, calc(11 * var(--min-scale)), 14px);
  font-weight: 600;
}
.status-ongoing {
  color: #ff6b6e;
  background: rgba(255, 78, 81, 0.22);
  border: 1px solid rgba(255, 78, 81, 0.55);
  box-shadow: 0 0 6px rgba(255, 78, 81, 0.18);
}
.status-done {
  color: #56f0f4;
  background: rgba(60, 211, 215, 0.22);
  border: 1px solid rgba(60, 211, 215, 0.55);
  box-shadow: 0 0 6px rgba(60, 211, 215, 0.18);
}

/* ===== 时间列（Figma: #d8d8d8 次要色） ===== */
.hd-time {
  color: #d8d8d8;
}
</style>
