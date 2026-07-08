<template>
  <SectionCard title="自律履职每日清单" subtitle="Daily List">
    <div class="daily-checklist">
      <!-- 履职概览（环形饼图） -->
      <div class="dc-summary">
        <div class="dc-summary-item">
          <span class="dc-sum-dot done" />
          <span class="dc-sum-label">已履职</span>
          <span class="dc-sum-num">99 家</span>
        </div>
        <div class="dc-ring-wrap">
          <v-chart :option="ringOption" autoresize class="dc-ring-chart" />
          <div class="dc-ring-inner">
            <span class="dc-ring-num">75<small>%</small></span>
            <span class="dc-ring-sub">履职率</span>
          </div>
        </div>
        <div class="dc-summary-item right">
          <span class="dc-sum-dot undone" />
          <span class="dc-sum-label">未履职</span>
          <span class="dc-sum-num">99 家</span>
        </div>
      </div>

      <!-- 表格区（统一大屏列表样式） -->
      <BigscreenListTable :columns="columns" :rows="records" row-key="id" style="flex: 1; min-height: 0;">
        <template #cell-status="{ row }">
          <span :class="['dc-duty-badge', row.statusClass]">{{ row.status }}</span>
        </template>
      </BigscreenListTable>
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import SectionCard from './SectionCard.vue'
import BigscreenListTable from './BigscreenListTable.vue'
import type { BsColumn } from './BigscreenListTable.vue'

use([PieChart, CanvasRenderer])

const ringOption = {
  series: [{
    type: 'pie',
    radius: ['60%', '80%'],
    center: ['50%', '50%'],
    silent: true,
    label: { show: false },
    data: [
      { value: 75, itemStyle: { color: '#4784e8' } },
      { value: 25, itemStyle: { color: '#eaad6c' } },
    ],
    itemStyle: { borderWidth: 2, borderColor: 'transparent' },
  }],
}

const columns: BsColumn[] = [
  { key: 'status', label: '履职打卡', width: 'vw(90)' },
  { key: 'company', label: '企业名称' },
  { key: 'person', label: '负责人', width: 'vw(90)' },
]

const records = [
  { id: 1, status: '未履职', statusClass: 'undone', company: '盛邦木业', person: '傅梦梁' },
  { id: 2, status: '未履职', statusClass: 'undone', company: '盛邦木业', person: '萧春燕' },
  { id: 3, status: '未履职', statusClass: 'undone', company: '盛邦木业', person: '谭伟' },
  { id: 4, status: '未履职', statusClass: 'undone', company: '华泰建材', person: '李国强' },
  { id: 5, status: '未履职', statusClass: 'undone', company: '华泰建材', person: '王芳' },
  { id: 6, status: '未履职', statusClass: 'undone', company: '中联重科', person: '张建国' },
  { id: 7, status: '未履职', statusClass: 'undone', company: '中联重科', person: '周明华' },
  { id: 8, status: '未履职', statusClass: 'undone', company: '远大化工', person: '赵文博' },
  { id: 9, status: '未履职', statusClass: 'undone', company: '远大化工', person: '陈志强' },
  { id: 10, status: '未履职', statusClass: 'undone', company: '盛邦木业', person: '林晓峰' },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.daily-checklist {
  height: 100%;
  overflow: hidden;
  padding: vh(8) vw(8);
  display: flex;
  flex-direction: column;
  gap: vh(16);
}

/* ===== 履职概览 ===== */
.dc-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 vw(8);
  height: vh(80);
}
.dc-summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: vh(4);
  width: vw(80);
}
.dc-summary-item.right {
  align-items: center;
}
.dc-sum-label {
  font-size: clamp(14px, calc(15 * var(--min-scale)), 16px);
  color: rgba(137, 181, 255, 0.5);
}
.dc-sum-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(20 * var(--min-scale)), 24px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: normal;
}
.dc-sum-dot {
  width: calc(14 * var(--min-scale));
  height: calc(14 * var(--min-scale));
  border-radius: 3px;
}
.dc-sum-dot.done { background: #3cd3d7; }
.dc-sum-dot.undone { background: #eaad6c; }

/* ===== 环形饼图 ===== */
.dc-ring-wrap {
  position: relative;
  width: calc(90 * var(--min-scale));
  height: calc(90 * var(--min-scale));
}
.dc-ring-chart {
  width: 100%;
  height: 100%;
}
.dc-ring-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.dc-ring-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(20 * var(--min-scale)), 24px);
  font-weight: 700;
  color: #89b5ff;
  line-height: 1;
}
.dc-ring-num small {
  font-size: clamp(8px, calc(12 * var(--min-scale)), 16px);
}
.dc-ring-sub {
  font-size: clamp(6px, calc(10 * var(--min-scale)), 14px);
  color: rgba(137, 181, 255, 0.5);
  margin-top: vh(2);
}

/* ===== 履职状态标签 ===== */
.dc-duty-badge {
  display: inline-block;
  padding: vh(2) vw(6);
  border-radius: 2px;
  font-size: clamp(7px, calc(11 * var(--min-scale)), 14px);
  font-weight: 600;
}
.dc-duty-badge.undone {
  color: #ffc46b;
  background: rgba(234, 173, 108, 0.22);
  border: 1px solid rgba(234, 173, 108, 0.55);
  box-shadow: 0 0 6px rgba(234, 173, 108, 0.18);
}
</style>
