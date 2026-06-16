<template>
  <SectionCard title="风险源作业报审批" subtitle="Approval">
    <div class="risk-approval">
      <!-- 顶部统计指标 -->
      <div class="ra-stats">
        <BigscreenMetricItem
          v-for="stat in topStats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :unit="stat.unit"
          :hex-src="stat.hexSrc"
        />
      </div>

      <!-- 表格区（统一大屏列表样式） -->
      <BigscreenListTable :columns="columns" :rows="records" row-key="id">
        <template #cell-status="{ row }">
          <span :class="['ra-status', row.statusClass]">{{ row.status }}</span>
        </template>
        <template #cell-time="{ value }">
          <span class="ra-time">{{ value }}</span>
        </template>
      </BigscreenListTable>
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import SectionCard from './SectionCard.vue'
import BigscreenMetricItem from './BigscreenMetricItem.vue'
import BigscreenListTable from './BigscreenListTable.vue'
import type { BsColumn } from './BigscreenListTable.vue'
import daishenpiHexSrc from '@/assets/bigscreen/daishenpi.svg'
import yishenpiHexSrc from '@/assets/bigscreen/yishenpi.svg'

const topStats = [
  { label: '待审批', value: '102487', unit: '个', hexSrc: daishenpiHexSrc },
  { label: '已审批', value: '102487', unit: '个', hexSrc: yishenpiHexSrc },
]

const columns: BsColumn[] = [
  { key: 'status', label: '审批状态', width: 'calc(76 * var(--w))' },
  { key: 'type', label: '作业类型', width: 'calc(76 * var(--w))' },
  { key: 'company', label: '上报企业', width: 'calc(76 * var(--w))' },
  { key: 'time', label: '上报时间' },
]

const records = [
  { id: 1, status: '待审批', statusClass: 'pending', type: '动火作业', company: '胜邦木业', time: '2025-09-10' },
  { id: 2, status: '待审批', statusClass: 'pending', type: '高空作业', company: '胜邦木业', time: '2025-09-10' },
  { id: 3, status: '已驳回', statusClass: 'rejected', type: '受限空间', company: '胜邦木业', time: '2025-09-10' },
  { id: 4, status: '已通过', statusClass: 'approved', type: '动火作业', company: '胜邦木业', time: '2025-09-10' },
]
</script>

<style scoped>
.risk-approval {
  padding: calc(8 * var(--h)) calc(8 * var(--w));
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
}

/* ===== 统计区 ===== */
.ra-stats {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}

/* ===== 状态标签 ===== */
.ra-status {
  display: inline-block;
  padding: calc(2 * var(--h)) calc(6 * var(--w));
  border-radius: 2px;
  font-size: clamp(7px, calc(10 * var(--min-scale)), 14px);
}
.ra-status.pending {
  color: #ff4e51;
  background: rgba(255, 78, 81, 0.1);
  border: 1px solid rgba(255, 78, 81, 0.2);
}
.ra-status.rejected {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.ra-status.approved {
  color: #3cd3d7;
  background: rgba(60, 211, 215, 0.1);
  border: 1px solid rgba(60, 211, 215, 0.2);
}

/* ===== 时间列（Figma: #d8d8d8 次要色） ===== */
.ra-time {
  color: #d8d8d8;
}
</style>
