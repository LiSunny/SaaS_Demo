<template>
  <div class="device-maintenance">
    <GongmaoSectionCard title="设备智慧运维管理">
      <div class="maintenance-wrap">
        <!-- ===== KPI 指标行 ===== -->
        <div class="kpi-row">
          <!-- 超期保养任务 -->
          <div class="kpi-item kpi-item--left">
            <div class="kpi-icon-wrap">
              <img
                class="kpi-icon"
                src="@/assets/bigscreen/gongmao-icon-overdue-task.svg"
                alt=""
              />
            </div>
            <div class="kpi-text">
              <div class="kpi-label kpi-label--left">
                <span class="kpi-label-text">超期保养任务</span>
              </div>
              <div class="kpi-value">
                <span class="kpi-number kpi-number--danger">10</span>
                <span class="kpi-unit">台</span>
              </div>
            </div>
          </div>

          <!-- 待执行保养任务 -->
          <div class="kpi-item kpi-item--right">
            <div class="kpi-icon-wrap">
              <img
                class="kpi-icon"
                src="@/assets/bigscreen/gongmao-icon-pending-task.svg"
                alt=""
              />
            </div>
            <div class="kpi-text">
              <div class="kpi-label kpi-label--right">
                <span class="kpi-label-text">待执行保养任务</span>
              </div>
              <div class="kpi-value">
                <span class="kpi-number">10</span>
                <span class="kpi-unit">台</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== 数据表格 ===== -->
        <div class="data-table">
          <!-- 表头 -->
          <div class="table-header">
            <div class="col-name">设备名称</div>
            <div class="col-last-date">上次保养日期</div>
            <div class="col-plan-date">计划保养日期</div>
            <div class="col-action">操作</div>
          </div>

          <!-- 数据行列表 -->
          <div class="table-body">
            <div
              v-for="(row, i) in tableData"
              :key="i"
              class="table-row"
            >
              <div class="col-name">{{ row.name }}</div>
              <div class="col-last-date">{{ row.lastDate }}</div>
              <div class="col-plan-date">{{ row.planDate }}</div>
              <div class="col-action">
                <img
                  class="action-icon"
                  src="@/assets/bigscreen/gongmao-icon-preview.svg"
                  alt="查看"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </GongmaoSectionCard>
  </div>
</template>

<script setup lang="ts">
import GongmaoSectionCard from './GongmaoSectionCard.vue'

interface MaintenanceRow {
  name: string
  lastDate: string
  planDate: string
}

// Mock 数据 — 对应 Figma 设计稿中的示例数据
const tableData: MaintenanceRow[] = [
  { name: '一车间数控机床', lastDate: '2025-10-02', planDate: '2025-11-07' },
  { name: '二车间数控机床', lastDate: '2025-09-22', planDate: '2025-11-07' },
  { name: '三车间数控机床', lastDate: '2025-08-12', planDate: '2025-11-07' },
  { name: '四车间数控机床', lastDate: '2025-08-12', planDate: '2025-11-07' },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ===== 外层容器：填充父级 flex 列的剩余空间 ===== */
.device-maintenance {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.maintenance-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  /* KPI 行允许图标溢出，表格区域单独设 overflow */
}

/* ===== KPI 指标行 — 允许图标溢出 ===== */
.kpi-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: vh(12) vw(36);
  overflow: visible;
}

.kpi-item {
  display: flex;
  align-items: center;
  gap: vw(26);
}

/* ===== 图标 — Figma: 容器 60.6×68.6，图标溢出至约 91×84（六边形边缘） ===== */
.kpi-icon-wrap {
  width: vw(91);
  height: vh(84);
  flex-shrink: 0;
  /* 补偿图标比容器大的部分：上 15px，左右各 15px */
  margin: vh(-15) vw(-15) 0 vw(-15);
}

.kpi-icon {
  display: block;
  width: 100%;
  height: 100%;
}

/* 文字区域 — Figma: 136px 宽 */
.kpi-text {
  display: flex;
  flex-direction: column;
  gap: vh(12);
  width: vw(136);
}

/* 标签 — DingTalk_JinBuTi 18px, 白色→#89b5ff 渐变, 带蓝色底线 */
.kpi-label {
  position: relative;
  display: inline-grid;
  grid-template-columns: max-content;
  grid-template-rows: max-content;
  place-items: start;
  width: 100%;

  /* 蓝色底线 (Figma: 13px 高，渐变背景) */
  &::before {
    content: '';
    grid-column: 1;
    grid-row: 1;
    height: vh(13);
    margin-top: vh(11);
    background: linear-gradient(
      86.1deg,
      rgba(1, 57, 160, 0.46) 0.15%,
      rgba(3, 72, 199, 0.53) 12.1%,
      rgb(7, 72, 181) 37.12%,
      rgba(3, 72, 199, 0.533) 87.72%,
      rgba(1, 57, 160, 0.46) 99.68%
    );
  }

  /* 左侧: 底线宽 96.45%，文字左偏移 3.29% */
  &--left::before {
    width: 96.45%;
  }
  &--left .kpi-label-text {
    margin-left: 3.29%;
  }

  /* 右侧: 底线宽 96.84%，文字左偏移 2.9% */
  &--right::before {
    width: 96.84%;
  }
  &--right .kpi-label-text {
    margin-left: 2.9%;
  }
}

.kpi-label-text {
  grid-column: 1;
  grid-row: 1;
  font-family: 'DingTalk_JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(13px, calc(18 * var(--min-scale)), 18px);
  font-weight: 400;
  line-height: 1;
  white-space: nowrap;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 数值行 */
.kpi-value {
  display: flex;
  align-items: flex-end;
  gap: vw(6);
  white-space: nowrap;
}

/* 数字 — Douyin_Sans Bold 24px, 渐变 */
.kpi-number {
  font-family: 'Douyin Sans', 'DIN Alternate', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(16px, calc(24 * var(--min-scale)), 24px);
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  /* 超期保养任务 — 红色数字 (Figma: white→#f9373a) */
  &--danger {
    background: linear-gradient(to bottom, #ffffff 0%, #f9373a 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

/* 单位 "台" — Alibaba_PuHuiTi Regular 16px */
.kpi-unit {
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 400;
  line-height: 1;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== 数据表格 ===== */
.data-table {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: vh(6);
  padding: 0 vw(8) vh(6) vw(8);
  overflow: hidden;
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

/* 数据行容器 */
.table-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: vh(4);
  overflow-y: auto;
  overflow-x: hidden;

  /* 隐藏滚动条 */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

/* 数据行 */
.table-row {
  display: flex;
  align-items: center;
  gap: vw(10);
  height: vh(38);
  padding: 0 vw(18);
  flex-shrink: 0;

  /* 隔行渐变背景 */
  &:nth-child(even) {
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

/* ===== 列宽 ===== */
.col-name {
  flex: 1;
  min-width: 0;
  color: #d8d8d8;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-last-date {
  flex: 1;
  min-width: 0;
  color: #d8d8d8;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
  text-align: center;
}

.col-plan-date {
  flex: 1;
  min-width: 0;
  color: #d8d8d8;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
  text-align: center;
}

.col-action {
  width: vw(58);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== 操作图标 ===== */
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
