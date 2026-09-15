<template>
  <div class="flow-records">
    <h4 class="section-title">流转记录</h4>

    <div v-if="records.length === 0" class="records-empty">暂无流转记录</div>

    <div v-else class="records-list">
      <div
        v-for="(item, idx) in recordItems"
        :key="item.record.id"
        class="record-item"
      >
        <!-- ===== 左侧时间轴：圆点 + 垂直连接线 ===== -->
        <div class="record-axis">
          <span
            :class="['record-dot', item.dotClass]"
            :title="item.dotTitle"
          >
            <svg v-if="item.showCheck" class="record-dot-svg" aria-hidden="true">
              <use href="/sprite.svg#icon-check" />
            </svg>
          </span>
          <span v-if="idx !== recordItems.length - 1" class="record-axis-line" />
        </div>

        <!-- ===== 右侧节点卡片：标题行 + 嵌套时间卡 + 嵌套内容卡 ===== -->
        <div class="record-body">
          <!-- 标题行：节点名 + 操作人 + 右侧 tag -->
          <div class="record-header">
            <div class="record-header-left">
              <span class="record-action">{{ item.record.action }}</span>
              <span class="record-operator-name">（{{ item.record.operatorName }}）</span>
            </div>
            <span
              v-if="item.tagLabel"
              :class="['record-tag', item.tagClass]"
            >{{ item.tagLabel }}</span>
          </div>

          <!-- 嵌套时间卡（bg-card 圆角 8px p-6） -->
          <div class="record-time-card">
            <!-- 布局 1：普通 开始时间 / 完成时间 -->
            <div v-if="item.timeLayout === 'normal'" class="record-time-row">
              <div class="record-time-cell">
                <span class="record-time-label">开始时间</span>
                <span class="record-time-value">{{ item.startTimeText }}</span>
              </div>
              <div class="record-time-cell">
                <span class="record-time-label">完成时间</span>
                <span class="record-time-value">{{ item.record.createdAt || '—' }}</span>
              </div>
            </div>

            <!-- 布局 2：超时未完成 开始时间 / 超时提醒 + 判定超时 -->
            <template v-else-if="item.timeLayout === 'overtime-incomplete'">
              <div class="record-time-row">
                <div class="record-time-cell">
                  <span class="record-time-label">开始时间</span>
                  <span class="record-time-value">{{ item.startTimeText }}</span>
                </div>
                <div class="record-time-cell">
                  <span class="record-time-label">超时提醒</span>
                  <span class="record-time-value">{{ item.record.overtimeAlertAt || '—' }}</span>
                </div>
              </div>
              <div class="record-time-row">
                <div class="record-time-cell">
                  <span class="record-time-label">判定超时</span>
                  <span class="record-time-value">{{ item.record.judgedAt || '—' }}</span>
                </div>
              </div>
            </template>

            <!-- 布局 3：发起节点 单行"发起时间" -->
            <div v-else-if="item.timeLayout === 'create-only'" class="record-time-row record-time-row-single">
              <div class="record-time-cell">
                <span class="record-time-label">发起时间</span>
                <span class="record-time-value">{{ item.record.createdAt || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- 嵌套内容卡（白 圆角 6px p-6） -->
          <div class="record-content-card">
            <p :class="['record-content-text', { 'record-content-placeholder': item.isPlaceholder }]">
              {{ item.contentText }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { WorkOrderRecord } from '@/types/work-order'

interface Props {
  records: WorkOrderRecord[]
}
const props = defineProps<Props>()

// ===== 单条记录渲染模型（按 action 字符串 + 可选字段推断样式变体） =====
interface RecordItem {
  record: WorkOrderRecord
  // 圆点
  dotClass: string
  showCheck: boolean
  dotTitle: string
  // 右侧 tag
  tagLabel: string
  tagClass: string
  // 时间行布局
  timeLayout: 'normal' | 'overtime-incomplete' | 'create-only'
  startTimeText: string
  // 内容卡
  contentText: string
  isPlaceholder: boolean
}

// ===== 工具：action 字符串包含某关键词 =====
function has(s: string, kw: string) { return s.includes(kw) }

// ===== 工具：从 createdAt 推算开始时间（默认 -1h） =====
function defaultStartTime(createdAt: string): string {
  if (!createdAt) return '—'
  const d = new Date(createdAt.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '—'
  d.setHours(d.getHours() - 1)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

// ===== 推算每条 record 的渲染变体 =====
function buildItem(rec: WorkOrderRecord): RecordItem {
  const act = rec.action || ''
  // 默认值
  const base: RecordItem = {
    record: rec,
    dotClass: 'record-dot-success',
    showCheck: true,
    dotTitle: '已完成',
    tagLabel: '',
    tagClass: '',
    timeLayout: 'normal',
    startTimeText: rec.startedAt || defaultStartTime(rec.createdAt),
    contentText: rec.content || '',
    isPlaceholder: !!rec.isEmptyForm,
  }

  // ── 1. 发起节点（"创建工单" / "发起隐患整改" / "create"）──
  if (has(act, '发起') || has(act, '创建') || /^create$/i.test(act)) {
    return {
      ...base,
      tagLabel: '',
      timeLayout: 'create-only',
      startTimeText: '—',
    }
  }

  // ── 2. 超时未完成（多时间行：开始/超时提醒 + 判定超时）──
  if (has(act, '超时未完成')) {
    return {
      ...base,
      tagLabel: '超时未完成',
      tagClass: 'record-tag-danger',
      timeLayout: 'overtime-incomplete',
    }
  }

  // ── 3. 超时跟进（持续时长红字加粗 tag）──
  if (has(act, '超时跟进') || rec.durationText) {
    return {
      ...base,
      tagLabel: rec.durationText || '—',
      tagClass: 'record-tag-overtime',
    }
  }

  // ── 4. 转派 ──
  if (has(act, '转派') || /^reassign$/i.test(act)) {
    return {
      ...base,
      tagLabel: '转派',
      tagClass: 'record-tag-info',
    }
  }

  // ── 5. 驳回 ──
  if (has(act, '驳回') || /^reject$/i.test(act)) {
    return {
      ...base,
      tagLabel: '驳回',
      tagClass: 'record-tag-danger',
    }
  }

  // ── 6. 通过 / 验收 / 完成 ──
  if (has(act, '通过') || has(act, '验收') || has(act, '完成') || /^approve$/i.test(act) || has(act, '关闭')) {
    return {
      ...base,
      tagLabel: '通过',
      tagClass: 'record-tag-success',
    }
  }

  // ── 7. 取消（用驳回样式）──
  if (has(act, '取消') || /^cancel$/i.test(act)) {
    return {
      ...base,
      tagLabel: '驳回',
      tagClass: 'record-tag-danger',
    }
  }

  // ── 8. 进行中节点：8px 蓝点带阴影，无对号 ──
  // (指派 / 接单 / 开始验收 等无明确 action 关键字的中间节点)
  if (has(act, '指派') || has(act, '接单') || has(act, '开始验收') || has(act, '跟进')) {
    return {
      ...base,
      tagLabel: '通过',
      tagClass: 'record-tag-success',
      dotClass: 'record-dot-in-progress',
      showCheck: false,
      dotTitle: '进行中',
    }
  }

  // ── 默认：通过样式 ──
  return {
    ...base,
    tagLabel: '已完成',
    tagClass: 'record-tag-default',
  }
}

const recordItems = computed<RecordItem[]>(() => props.records.map(buildItem))
</script>

<style scoped>
.flow-records {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  font-size: var(--font-h4, 16px);
  font-weight: 500;
  color: var(--text-primary, #101010);
  margin: 0 0 var(--spacing-md, 12px);
  line-height: 1;
  flex-shrink: 0;
}
/* 4px 圆角竖线（与 WorkOrderDetail 指标分析小标题统一） */
.section-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  border-radius: var(--radius-sm, 6px);
  background: var(--accent-primary, #3678e3);
  flex-shrink: 0;
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
  /* 容器内边距：设计稿 pl-2 pr-8 pt-8（让连接线从最左边开始） */
  padding: 8px 8px 0 2px;
}

/* ===== 单个节点行 ===== */
.record-item {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 6px;            /* 设计稿 gap-6 */
  padding-bottom: 12px; /* 设计稿单条间距 */
  flex: 0 0 auto;
}

/* ===== 左侧时间轴：22px 宽 + 8/12 圆点 + 2px 连接线 ===== */
.record-axis {
  position: relative;
  width: 22px;
  flex-shrink: 0;
  /* 圆点垂直居中于"标题行"中部 */
  min-height: 28px;
}

/* 连接线：从本 item 圆点中心 → 穿到下个 item 圆点中心（被下个圆点完全覆盖） */
.record-axis-line {
  position: absolute;
  top: 13px;           /* 圆点中心（top:7 + height:12/2） */
  /* padding-bottom 12 + 下个 axis 圆点 top 7 + 圆点 height 6 = 25px
     跨过这段距离后，line 终点正好在下个圆点中心，被圆点完全覆盖（无断点） */
  bottom: -25px;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: var(--text-placeholder, #d9d9d9);
  z-index: 0;
}

/* ===== 圆点 ===== */
.record-dot {
  position: absolute;
  top: 7px;            /* 圆点顶部位置（与连接线起点对齐） */
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  background: var(--accent-primary, #3678e3);
  border: none;
  box-shadow: none;
}

/* 进行中：8px 圆点，蓝色 + 4px 阴影环 */
.record-dot-in-progress {
  width: 8px;
  height: 8px;
  box-shadow: 0 0 0 4px rgba(54, 120, 227, 0.25);
}

/* 已完成：12px 圆点，绿色 + 2px 阴影环 + 内部白色对号 */
.record-dot-success {
  width: 12px;
  height: 12px;
  background: var(--success, #059669);
  box-shadow: 0 0 0 2px rgba(5, 150, 105, 0.4);
}

.record-dot-svg {
  width: 9px;
  height: 9px;
  color: #fff;
  fill: none;
  stroke: currentColor;
  display: block;
}

/* ===== 右侧节点卡片容器 ===== */
.record-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;            /* 设计稿 record-header + 时间卡 + 内容卡 之间间距 */
}

/* ===== 标题行 ===== */
.record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 2px 0;
}

.record-header-left {
  display: flex;
  align-items: center;
  gap: 12px;           /* 设计稿 gap-12 */
  min-width: 0;
  flex: 1;
  font-size: var(--font-small, 14px);
  font-weight: 500;
  line-height: 22.4px;
}

.record-action {
  color: var(--text-primary, #101010);
  white-space: nowrap;
}

.record-operator-name {
  color: var(--text-primary, #101010);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 状态 tag（设计稿 4px 圆角 + 内边距 6/2） ===== */
.record-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: var(--font-xs, 12px);
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  flex-shrink: 0;
}
.record-tag-success { background: var(--success-bg, rgba(5,150,105,0.1)); color: var(--success, #059669); }
.record-tag-danger  { background: var(--danger-bg, rgba(220,38,38,0.1));  color: var(--danger, #dc2626); }
.record-tag-info    { background: var(--info-bg, rgba(54,120,227,0.1));   color: var(--info, #3678e3); }
/* 持续时长（超时跟进）：红色加粗 */
.record-tag-overtime {
  color: var(--danger, #dc2626);
  font-weight: 700;
  background: transparent;
  padding: 2px 0;
}
.record-tag-default { background: var(--bg-card, #fff); color: var(--text-tertiary, #454545); border: 1px solid var(--border-default, #e9e9e9); }

/* ===== 嵌套时间卡（bg-card #fbfbfb 圆角 8px p-6 gap-6） ===== */
.record-time-card {
  background: var(--bg-card, #fbfbfb);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.record-time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  font-size: var(--font-xs, 12px);
  line-height: 19.2px;
  padding: 2px 0;
  color: var(--text-muted, #5e5e5e);
}
.record-time-row-single {
  justify-content: flex-start;
}

.record-time-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1 1 0;
  min-width: 0;
  white-space: nowrap;
}

.record-time-label {
  color: var(--text-muted, #5e5e5e);
  font-weight: 400;
  flex-shrink: 0;
}

.record-time-value {
  color: var(--text-primary, #101010);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* ===== 嵌套内容卡（白 圆角 6px p-6） ===== */
.record-content-card {
  background: var(--bg-sub-card, #fff);
  border-radius: var(--radius-sm, 6px);
  padding: 6px;
  min-height: 56px;     /* 设计稿固定高 */
}

.record-content-text {
  margin: 0;
  font-size: 13px;
  line-height: 19.5px;
  color: var(--text-secondary, #2e2e2e);
  word-break: break-all;
  letter-spacing: -0.0762px;
}

/* 占位灰字（"表单内容"） */
.record-content-placeholder {
  color: var(--text-placeholder, #a9b8cc);
}
</style>
