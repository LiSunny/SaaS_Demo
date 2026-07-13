<template>
  <GongmaoSectionCard title="隐患治理动态看板">
    <div class="risk-inspection-wrap">
      <!-- ===== KPI 指标行 ===== -->
      <div class="kpi-row">
        <!-- 待整改隐患 -->
        <div class="kpi-item kpi-item--left">
          <div class="kpi-icon-wrap">
            <img
              class="kpi-icon"
              src="@/assets/bigscreen/gongmao-icon-pending-hazard.svg"
              alt=""
            />
          </div>
          <div class="kpi-text">
            <div class="kpi-label kpi-label--left">
              <span class="kpi-label-text">待整改隐患</span>
            </div>
            <div class="kpi-value">
              <span class="kpi-number kpi-number--danger">10</span>
              <span class="kpi-unit">件</span>
            </div>
          </div>
        </div>

        <!-- 今日已整改 -->
        <div class="kpi-item kpi-item--right">
          <div class="kpi-icon-wrap">
            <img
              class="kpi-icon"
              src="@/assets/bigscreen/gongmao-icon-rectified.svg"
              alt=""
            />
          </div>
          <div class="kpi-text">
            <div class="kpi-label kpi-label--right">
              <span class="kpi-label-text">今日已整改</span>
            </div>
            <div class="kpi-value">
              <span class="kpi-number">10</span>
              <span class="kpi-unit">件</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== Tab 栏 ===== -->
      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="data-table">
        <!-- 表头 -->
        <div class="table-header">
          <div class="col-point">排查点位</div>
          <div class="col-time">排查时间</div>
          <div class="col-hazard">是否存在隐患</div>
          <div class="col-status">隐患整改状态</div>
          <div class="col-action">操作</div>
        </div>

        <!-- 数据行列表 -->
        <div class="table-body">
          <div
            v-for="(row, i) in tableData"
            :key="i"
            class="table-row"
          >
            <div class="col-point">{{ row.point }}</div>
            <div class="col-time">{{ row.time }}</div>
            <div
              class="col-hazard"
              :class="{ 'text-danger': row.hasHazard === '隐患' || row.hasHazard === '异常' }"
            >
              {{ row.hasHazard }}
            </div>
            <div
              class="col-status"
              :class="{
                'text-danger': row.rectifyStatus === '未完成',
                'text-muted': row.rectifyStatus === '--' || row.rectifyStatus === '-',
              }"
            >
              {{ row.rectifyStatus }}
            </div>
            <div class="col-action">
              <img
                class="action-icon"
                src="@/assets/bigscreen/gongmao-icon-preview.svg"
                alt="预览"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </GongmaoSectionCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GongmaoSectionCard from './GongmaoSectionCard.vue'

interface InspectionRow {
  point: string
  time: string
  hasHazard: string
  rectifyStatus: string
}

const tabs = [
  { key: 'workshop', label: '生产车间' },
  { key: 'key-area', label: '重点部位' },
  { key: 'other', label: '其他' },
]

const activeTab = ref('workshop')

// Mock 数据 — 对应 Figma 设计稿中的示例数据
const tableData: InspectionRow[] = [
  { point: '一车间数控机床', time: '2025-10-02', hasHazard: '正常', rectifyStatus: '--' },
  { point: '原料仓库', time: '2025-09-22', hasHazard: '隐患', rectifyStatus: '未完成' },
  { point: '油漆仓库', time: '2025-08-12', hasHazard: '正常', rectifyStatus: '--' },
  { point: '员工宿舍1#', time: '2025-08-25', hasHazard: '正常', rectifyStatus: '--' },
  { point: '油漆仓库', time: '2025-08-12', hasHazard: '正常', rectifyStatus: '--' },
  { point: '员工宿舍1#', time: '2025-08-25', hasHazard: '异常', rectifyStatus: '-' },
  { point: '油漆仓库', time: '2025-08-12', hasHazard: '异常', rectifyStatus: '-' },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.risk-inspection-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  /* KPI 行和 Tab 栏允许溢出（图标超出容器），表格区域单独设 overflow */
}

/* KPI 行 — 允许图标溢出 */
.kpi-row {
  overflow: visible;
}

/* ===== KPI 指标行 ===== */
.kpi-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: vh(12) vw(36);
}

.kpi-item {
  display: flex;
  align-items: center;
  gap: vw(26);
}

/* ===== 图标 — Figma: 容器 60.6×68.6，但图标实际约 91×84（六边形边缘溢出） ===== */
/* 用负 margin 吸收溢出尺寸，避免依赖父级 overflow:visible */
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

/* 文字区域 — Figma: 123px 宽 */
.kpi-text {
  display: flex;
  flex-direction: column;
  gap: vh(12);
  width: vw(123);
}

/* 标签 — Figma: DingTalk_JinBuTi 18px, 白色→#89b5ff 渐变, 带蓝色底线 */
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

/* 数字 — Figma: Douyin_Sans Bold 24px, 渐变 */
.kpi-number {
  font-family: 'Douyin Sans', 'DIN Alternate', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(16px, calc(24 * var(--min-scale)), 24px);
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  /* 待整改隐患 — 红色数字 (Figma: white→#f9373a) */
  &--danger {
    background: linear-gradient(to bottom, #ffffff 0%, #f9373a 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

/* 单位 "件" — Figma: Alibaba_PuHuiTi Regular 16px */
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

/* ===== Tab 栏 ===== */
.tab-bar {
  display: flex;
  align-items: center;
  gap: vw(16);
  padding: vh(6) vw(16);
}

/* Tab 按钮 — Figma: 126×34px */
.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: vw(126);
  height: vh(34);
  padding: 0;
  border: none;
  cursor: pointer;
  flex-shrink: 0;

  /* 默认（非激活）背景 — Figma: Rectangle129 */
  background: rgba(2, 55, 130, 0.6);
  border-radius: vw(4);

  /* 默认文字颜色 */
  color: #5e9dc4;
  font-family: 'DingTalk_JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(13px, calc(18 * var(--min-scale)), 18px);
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  transition: background 0.2s ease, color 0.2s ease, border 0.2s ease;

  /* 激活态 — Figma: Rectangle128 蓝色渐变背景 */
  &--active {
    background: linear-gradient(
      180deg,
      rgba(10, 89, 207, 0.8) 0%,
      rgba(7, 72, 181, 0.7) 50%,
      rgba(24, 82, 167, 0.5) 100%
    );
    border: 1px solid rgba(71, 132, 232, 0.3);
    color: #c8dfff;
  }

  &:hover:not(&--active) {
    color: #89b5ff;
  }
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

  /* 隔行渐变背景 — 偶数行（:nth-child(even)）添加背景 */
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
.col-point {
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

.col-time {
  flex: 1;
  min-width: 0;
  color: #d8d8d8;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
  text-align: center;
}

.col-hazard {
  flex: 1;
  min-width: 0;
  color: #d8d8d8;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
  text-align: center;
}

.col-status {
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

/* ===== 状态文字颜色 ===== */
.text-danger {
  color: #da372e;
}

.text-muted {
  color: #5e9dc4;
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
