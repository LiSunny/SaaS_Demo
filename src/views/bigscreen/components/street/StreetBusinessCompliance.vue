<template>
  <SectionCard title="商户履职监管" subtitle="Compliance" more-label="更多">
    <div class="business-compliance">
      <!-- 履职统计 -->
      <div class="duty-summary">
        <div class="duty-summary-item">
          <span class="duty-summary-num">{{ dutySummary.total }}</span>
          <span class="duty-summary-label">今日应完成任务</span>
          <span class="duty-summary-unit">项</span>
        </div>
        <div class="duty-summary-item">
          <span class="duty-summary-num text-green">{{ dutySummary.done }}</span>
          <span class="duty-summary-label">已完成</span>
          <span class="duty-summary-unit">项</span>
        </div>
        <div class="duty-summary-item">
          <span class="duty-summary-num text-orange">{{ dutySummary.pending }}</span>
          <span class="duty-summary-label">未完成</span>
          <span class="duty-summary-unit">项</span>
        </div>
        <div class="duty-summary-item">
          <span class="duty-summary-num text-red">{{ dutySummary.overdue }}</span>
          <span class="duty-summary-label">逾期</span>
          <span class="duty-summary-unit">项</span>
        </div>
      </div>

      <!-- 今日履职率 + 排行 -->
      <div class="duty-main">
        <!-- 左侧：环形图 -->
        <div class="duty-donut">
          <div class="donut-wrapper">
            <svg viewBox="0 0 120 120" class="donut-svg">
              <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(71,132,232,0.12)" stroke-width="10" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="url(#dutyGradDonut)" stroke-width="10"
                stroke-dasharray="301.6" :stroke-dashoffset="301.6 * (1 - 0.92)" stroke-linecap="round"
                transform="rotate(-90 60 60)" />
              <defs>
                <linearGradient id="dutyGradDonut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#22c55e" />
                  <stop offset="100%" stop-color="#3b82f6" />
                </linearGradient>
              </defs>
              <text x="60" y="55" text-anchor="middle" fill="#fff" font-size="22" font-weight="700" font-family="'Douyin Sans'">92%</text>
              <text x="60" y="72" text-anchor="middle" fill="#89b5ff" font-size="10">今日履职率</text>
            </svg>
          </div>
        </div>

        <!-- 右侧：完成率排行 -->
        <div class="duty-rank">
          <div class="col-title">履职完成率排行(TOP5)</div>
          <div class="rank-list">
            <div v-for="(item, i) in rankList" :key="item.name" class="rank-item">
              <span class="rank-index" :class="`rank-${i + 1}`">{{ i + 1 }}</span>
              <span class="rank-name">{{ item.name }}</span>
              <div class="rank-bar-wrap">
                <div class="rank-bar" :style="{ width: item.rate + '%', background: i < 3 ? barColors[i] : '#475569' }" />
              </div>
              <span class="rank-rate">{{ item.rate }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部：履职异常TOP5 -->
      <div class="duty-abnormal">
        <div class="col-title col-title--warn">履职异常TOP5</div>
        <div class="abnormal-list">
          <div v-for="item in abnormalList" :key="item.name" class="abnormal-item">
            <span class="abnormal-name">{{ item.name }}</span>
            <span class="abnormal-tag" :class="`abnormal-tag--${item.level}`">{{ item.reason }}</span>
          </div>
        </div>
      </div>
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import SectionCard from '../SectionCard.vue'

const dutySummary = {
  total: 863,
  done: 792,
  pending: 51,
  overdue: 20,
}

const barColors = ['#22c55e', '#3b82f6', '#8b5cf6']

const rankList = [
  { name: 'XX商业街', rate: 98 },
  { name: 'XX食街', rate: 95 },
  { name: 'XX购物街', rate: 92 },
  { name: 'XX休闲街', rate: 89 },
  { name: 'XX生活街', rate: 87 },
]

const abnormalList = [
  { name: '李记烧烤', reason: '连续3天逾期', level: 'high' },
  { name: 'XX餐饮店', reason: '连续2次未打卡', level: 'high' },
  { name: '老味道店', reason: '逾期2次', level: 'mid' },
  { name: 'XX超市', reason: '异常项5次', level: 'mid' },
  { name: 'XX奶茶店', reason: '异常项3次', level: 'low' },
]
</script>

<style scoped>
.business-compliance {
  padding: calc(10 * var(--h)) calc(12 * var(--w));
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
  overflow: hidden;
}

/* 履职统计 */
.duty-summary {
  display: flex;
  gap: calc(8 * var(--w));
}

.duty-summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(2 * var(--h));
  padding: calc(6 * var(--h)) calc(4 * var(--w));
  background: rgba(2, 30, 80, 0.45);
  border: 1px solid rgba(71, 132, 232, 0.25);
  border-radius: 6px;
}

.duty-summary-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(22 * var(--min-scale)), 28px);
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.text-green {
  background: linear-gradient(to bottom, #86efac, #22c55e);
  -webkit-background-clip: text;
  background-clip: text;
}

.text-orange {
  background: linear-gradient(to bottom, #fde68a, #f59e0b);
  -webkit-background-clip: text;
  background-clip: text;
}

.text-red {
  background: linear-gradient(to bottom, #fca5a5, #ef4444);
  -webkit-background-clip: text;
  background-clip: text;
}

.duty-summary-label {
  font-size: clamp(7px, calc(10 * var(--min-scale)), 13px);
  color: rgba(224, 234, 250, 0.7);
  text-align: center;
}

.duty-summary-unit {
  font-size: clamp(7px, calc(9 * var(--min-scale)), 11px);
  color: rgba(137, 181, 255, 0.5);
}

/* 中间：环形图 + 排行 */
.duty-main {
  display: flex;
  gap: calc(10 * var(--w));
  min-height: 0;
  flex: 1;
}

.duty-donut {
  width: calc(110 * var(--min-scale));
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.donut-wrapper {
  width: 100%;
}

.donut-svg {
  width: 100%;
  height: auto;
}

.duty-rank {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.col-title {
  font-size: clamp(8px, calc(11 * var(--min-scale)), 14px);
  font-weight: 700;
  color: #89b5ff;
  margin-bottom: calc(6 * var(--h));
  padding-left: calc(6 * var(--w));
  border-left: 2px solid #3b82f6;
}

.col-title--warn {
  color: #f59e0b;
  border-left-color: #f59e0b;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: calc(3 * var(--h));
  flex: 1;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--w));
  padding: calc(2 * var(--h)) 0;
}

.rank-index {
  width: calc(16 * var(--min-scale));
  height: calc(16 * var(--min-scale));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(7px, calc(10 * var(--min-scale)), 12px);
  font-weight: 700;
  color: #fff;
  background: rgba(71, 132, 232, 0.3);
  border-radius: 4px;
  flex-shrink: 0;
}

.rank-1 { background: #f59e0b; }
.rank-2 { background: #6b7280; }
.rank-3 { background: #92400e; }

.rank-name {
  width: calc(70 * var(--w));
  font-size: clamp(8px, calc(11 * var(--min-scale)), 14px);
  color: rgba(224, 234, 250, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.rank-bar-wrap {
  flex: 1;
  height: 6px;
  background: rgba(71, 132, 232, 0.12);
  border-radius: 3px;
  overflow: hidden;
  min-width: 0;
}

.rank-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

.rank-rate {
  width: calc(32 * var(--w));
  font-family: 'Douyin Sans', sans-serif;
  font-size: clamp(7px, calc(10 * var(--min-scale)), 13px);
  font-weight: 700;
  color: #89b5ff;
  text-align: right;
  flex-shrink: 0;
}

/* 底部：异常列表 */
.duty-abnormal {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.abnormal-list {
  display: flex;
  flex-direction: column;
  gap: calc(3 * var(--h));
}

.abnormal-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(4 * var(--h)) calc(8 * var(--w));
  background: rgba(2, 20, 50, 0.4);
  border-radius: 4px;
  gap: calc(6 * var(--w));
}

.abnormal-name {
  font-size: clamp(8px, calc(11 * var(--min-scale)), 14px);
  color: rgba(224, 234, 250, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.abnormal-tag {
  font-size: clamp(7px, calc(10 * var(--min-scale)), 12px);
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

.abnormal-tag--high {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.abnormal-tag--mid {
  background: rgba(245, 158, 11, 0.12);
  color: #fde68a;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.abnormal-tag--low {
  background: rgba(59, 130, 246, 0.12);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.25);
}
</style>
