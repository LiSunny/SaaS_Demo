<template>
  <GongmaoSectionCard title="电气设备预警保养">
    <div class="maintenance-wrap">
      <!-- 表格 -->
      <div class="maintenance-table">
        <!-- 表头 -->
        <div class="table-header">
          <div class="col-name">设备名称</div>
          <div class="col-date">上次保养日期</div>
          <div class="col-date">计划保养日期</div>
          <div class="col-actions">操作</div>
        </div>

        <!-- 数据行 -->
        <div
          v-for="(row, i) in tableRows"
          :key="i"
          class="table-row"
        >
          <div class="col-name">{{ row.name }}</div>
          <div class="col-date">{{ row.lastMaintenance }}</div>
          <div class="col-date">{{ row.plannedMaintenance }}</div>
          <div class="col-actions">
            <img
              class="action-icon"
              src="@/assets/bigscreen/gongmao-icon-preview.svg"
              alt="预览"
            />
          </div>
        </div>
      </div>
    </div>
  </GongmaoSectionCard>
</template>

<script setup lang="ts">
import GongmaoSectionCard from './GongmaoSectionCard.vue'

interface MaintenanceRow {
  name: string
  lastMaintenance: string
  plannedMaintenance: string
}

const tableRows: MaintenanceRow[] = [
  { name: '一车间配电柜', lastMaintenance: '2025-10-02', plannedMaintenance: '2025-11-07' },
  { name: '二车间开关柜', lastMaintenance: '2025-09-22', plannedMaintenance: '2025-11-07' },
  { name: '三车间分选机', lastMaintenance: '2025-08-12', plannedMaintenance: '2025-11-07' },
  { name: '除尘系统与通风点气', lastMaintenance: '2025-08-12', plannedMaintenance: '2025-11-07' },
  { name: '一车间变压器', lastMaintenance: '2025-07-28', plannedMaintenance: '2025-10-28' },
  { name: '空压机房设备', lastMaintenance: '2025-09-15', plannedMaintenance: '2025-11-15' },
  { name: '消防水泵系统', lastMaintenance: '2025-06-20', plannedMaintenance: '2025-09-20' },
  { name: '冷却塔循环系统', lastMaintenance: '2025-10-10', plannedMaintenance: '2025-12-10' },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.maintenance-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: vh(6) vw(16) 0 vw(16);
  overflow: hidden;
}

/* ===== 表格 ===== */
.maintenance-table {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: vh(4);
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: vh(6);
  /* 隐藏滚动条 */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

/* 表头 — Figma: 渐变背景 + 顶部蓝色边框 */
.table-header {
  display: flex;
  align-items: center;
  gap: vw(16);
  height: vh(38);
  padding: 0 vw(18);
  background:
    linear-gradient(
      90deg,
      rgba(2, 48, 133, 0) 0%,
      rgba(24, 82, 167, 0.58) 19.712%,
      rgba(10, 89, 207, 0.68) 48.558%,
      rgba(24, 82, 167, 0.58) 80%,
      rgba(2, 51, 141, 0) 100%
    ),
    #01438e;
  border-top: 1px solid #023085;
  color: #d8d8d8;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 2;
}

/* 数据行 */
.table-row {
  display: flex;
  align-items: center;
  gap: vw(16);
  height: vh(38);
  padding: 0 vw(18);
  flex-shrink: 0;

  /* 隔行渐变背景：表头是父容器第1个子元素，数据行从第2个开始 */
  &:nth-child(odd) {
    background: linear-gradient(
      90deg,
      rgba(2, 48, 133, 0) 0%,
      rgba(24, 82, 167, 0.28) 19.712%,
      rgba(10, 89, 207, 0.36) 48.558%,
      rgba(24, 82, 167, 0.28) 80%,
      rgba(2, 51, 141, 0) 100%
    );
  }
}

/* 列宽 */
.col-name {
  flex: 1;
  min-width: 0;
  color: #d8d8d8;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
}

.col-date {
  flex: 1;
  min-width: 0;
  color: #d8d8d8;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
  text-align: center;
}

.col-actions {
  width: vw(58);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 操作图标 */
.action-icon {
  display: block;
  flex-shrink: 0;
  width: vh(26);
  height: vh(26);
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
}
</style>
