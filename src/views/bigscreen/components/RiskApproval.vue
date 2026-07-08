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
      <BigscreenListTable :columns="columns" :rows="records" row-key="id" style="flex: 1; min-height: 0;">
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
  { key: 'status', label: '审批状态', width: 'vw(100)', minWidth: '80px' },
  { key: 'type', label: '作业类型', width: 'vw(100)', minWidth: '80px' },
  { key: 'company', label: '上报企业', minWidth: '80px' },
  { key: 'time', label: '上报时间', minWidth: '90px' },
]

const records = [
  { id: 1, status: '待审批', statusClass: 'pending', type: '动火作业', company: '胜邦木业', time: '2025-09-10' },
  { id: 2, status: '待审批', statusClass: 'pending', type: '高空作业', company: '胜邦木业', time: '2025-09-10' },
  { id: 3, status: '已驳回', statusClass: 'rejected', type: '受限空间', company: '胜邦木业', time: '2025-09-10' },
  { id: 4, status: '已通过', statusClass: 'approved', type: '动火作业', company: '胜邦木业', time: '2025-09-10' },
  { id: 5, status: '待审批', statusClass: 'pending', type: '临时用电', company: '华泰建材', time: '2025-09-11' },
  { id: 6, status: '已通过', statusClass: 'approved', type: '动火作业', company: '华泰建材', time: '2025-09-11' },
  { id: 7, status: '待审批', statusClass: 'pending', type: '吊装作业', company: '中联重科', time: '2025-09-12' },
  { id: 8, status: '已驳回', statusClass: 'rejected', type: '动火作业', company: '中联重科', time: '2025-09-12' },
  { id: 9, status: '已通过', statusClass: 'approved', type: '高空作业', company: '远大化工', time: '2025-09-13' },
  { id: 10, status: '待审批', statusClass: 'pending', type: '受限空间', company: '远大化工', time: '2025-09-13' },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.risk-approval {
  height: 100%;
  overflow: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== 统计区 ===== */
.ra-stats {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
}

/* ===== 状态标签 ===== */
.ra-status {
  display: inline-block;
  padding: vh(2) vw(6);
  border-radius: 2px;
  font-size: clamp(7px, calc(10 * var(--min-scale)), 14px);
  font-weight: 600;
}
.ra-status.pending {
  color: #ffbe0a;
  background: rgba(255, 190, 10, 0.22);
  border: 1px solid rgba(255, 190, 10, 0.55);
  box-shadow: 0 0 6px rgba(255, 190, 10, 0.18);
}
.ra-status.rejected {
  color: #ff6b6e;
  background: rgba(255, 78, 81, 0.22);
  border: 1px solid rgba(255, 78, 81, 0.55);
  box-shadow: 0 0 6px rgba(255, 78, 81, 0.18);
}
.ra-status.approved {
  color: #56f0f4;
  background: rgba(60, 211, 215, 0.22);
  border: 1px solid rgba(60, 211, 215, 0.55);
  box-shadow: 0 0 6px rgba(60, 211, 215, 0.18);
}

/* ===== 时间列（Figma: #d8d8d8 次要色） ===== */
.ra-time {
  color: #d8d8d8;
}
</style>
