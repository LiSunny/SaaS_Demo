<template>
  <GongmaoSectionCard class="approval-root" title="动火作业流程管控">
    <div class="approval-wrap">
      <!-- 数据表格 -->
      <div class="data-table">
        <!-- 表头 -->
        <div class="table-header">
          <div class="col-status">审批状态</div>
          <div class="col-location">作业地点</div>
          <div class="col-applicant">申请人</div>
          <div class="col-time">开始时间</div>
          <div class="col-action">操作</div>
        </div>

        <!-- 数据行列表 -->
        <div class="table-body">
          <div
            v-for="(row, i) in tableData"
            :key="i"
            class="table-row"
          >
            <div class="col-status">
              <span :class="['status-text', statusClass(row.status)]">
                {{ row.status }}
              </span>
            </div>
            <div class="col-location">{{ row.location }}</div>
            <div class="col-applicant">{{ row.applicant }}</div>
            <div class="col-time">{{ row.startTime }}</div>
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
import GongmaoSectionCard from './GongmaoSectionCard.vue'

interface ApprovalRow {
  status: string
  location: string
  applicant: string
  startTime: string
}

// Mock 数据 — 对应 Figma 设计稿中的示例数据
const tableData: ApprovalRow[] = [
  { status: '待审核', location: '原料仓库', applicant: '胡东', startTime: '2023-08-10' },
  { status: '已审核', location: '第一车间器械区', applicant: '李子奇', startTime: '2025-10-03' },
  { status: '已驳回', location: '第二车间', applicant: '高家宜', startTime: '2025-09-08' },
  { status: '待审核', location: '油漆仓库', applicant: '张明华', startTime: '2025-09-15' },
  { status: '已审核', location: '三号厂房焊接区', applicant: '王建国', startTime: '2025-10-01' },
]

function statusClass(status: string) {
  switch (status) {
    case '待审核':
      return 'status-pending'
    case '已审核':
      return 'status-approved'
    case '已驳回':
      return 'status-rejected'
    default:
      return ''
  }
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ===== 组件根：填充右侧列剩余高度 ===== */
.approval-root {
  flex: 1;
  min-height: 0;
}

.approval-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: vh(6) vw(8) 0 vw(8);
  overflow: hidden;
}

/* ===== 数据表格 ===== */
.data-table {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: vh(6);
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
  padding-bottom: vh(6);

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

  /* 隔行渐变背景 — 奇数行（1, 3, 5...）添加背景，对应 Figma 设计稿 */
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

/* ===== 列宽 ===== */
.col-status {
  flex: 1;
  min-width: 0;
}

.col-location {
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

.col-applicant {
  flex: 1;
  min-width: 0;
  color: #d8d8d8;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
}

.col-time {
  flex: 1;
  min-width: 0;
  color: #d8d8d8;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
}

.col-action {
  width: vw(58);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== 审批状态文字 ===== */
.status-text {
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
}

/* 待审核 — 警示黄 */
.status-pending {
  color: #e6a23c;
}

/* 已审核 — 通过绿 */
.status-approved {
  color: #2ba86d;
}

/* 已驳回 — 危险红 */
.status-rejected {
  color: #e65c4b;
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
