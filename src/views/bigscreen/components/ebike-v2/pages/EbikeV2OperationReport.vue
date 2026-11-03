<template>
  <div class="op-report bigscreen">
    <div class="op-report__scroll">
      <!-- 页面信息条：数据新鲜度 + 报告总数 -->
      <div class="op-report__meta">
        <span>小安助手自动汇总 · 数据截至 2026-11-03 24:00</span>
        <span class="op-report__meta-total">共 {{ REPORT_TOTAL }} 份报告</span>
      </div>

      <!-- 三类报告分区 -->
      <section v-for="group in REPORT_GROUPS" :key="group.key" class="op-report__group">
        <div class="op-report__group-head">
          <BigscreenSectionTitle :title="group.label" heavy />
          <span class="op-report__group-meta">{{ group.desc }} · 共 {{ group.items.length }} 份</span>
        </div>

        <div class="op-report__cards">
          <EbikeV2ReportCard
            v-for="item in group.items"
            :key="item.id"
            :report="item"
            @open="openReport"
          />
        </div>
      </section>
    </div>

    <!-- 报告预览：页内浮层，不跳路由 -->
    <EbikeV2ReportPreview v-if="activeReport" :report="activeReport" @close="closeReport" />
  </div>
</template>

<script setup lang="ts">
/**
 * 运行报告页
 *
 * 三类报告各一个分区，每类挂若干份报告卡：
 *   告警分析报告 / 设备运行报告 / 值守报告。
 *
 * 版式来自 Figma「人工智能+公共安全管理平台（后台）」的报告卡组件（1:1 还原，
 * 见 EbikeV2ReportCard.vue 的换算说明）；页面自身沿用大屏深蓝玻璃的页面语言：
 * 底色随大屏根节点（与总览页同源），分区标题复用 BigscreenSectionTitle。
 *
 * 为什么不做成「tab 切换 + 单列表」：大屏是值守场景，三类报告要一眼同时可见，
 * 切 tab 会把另外两类藏起来。因此按分区纵向铺开，每类一行卡片。
 *
 * 数据：report/report-data.ts 的演示数据（基准日 2026-11-03）。
 * 接口接入时只换该文件，组件不动。
 */
import { ref } from 'vue'
import BigscreenSectionTitle from '../../common/BigscreenSectionTitle.vue'
import EbikeV2ReportCard from '../report/EbikeV2ReportCard.vue'
import EbikeV2ReportPreview from '../report/EbikeV2ReportPreview.vue'
import { REPORT_GROUPS, REPORT_TOTAL } from '../report/report-data'
import type { ReportItem } from '../report/report-data'

/** 当前打开的报告；null 表示预览浮层关闭 */
const activeReport = ref<ReportItem | null>(null)

function openReport(report: ReportItem) {
  activeReport.value = report
}

function closeReport() {
  activeReport.value = null
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 页面容器：顶栏以下铺满；底色随大屏根节点（与总览页同源） */
.op-report {
  position: absolute;
  top: vh(68);
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  padding: vh(14) vw(16) vh(12);
}

/* 内容区：视口不够高时纵向滚动 */
.op-report__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: vh(14);
}

/* 页面信息条 */
.op-report__meta {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(16);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;
  color: var(--fire-text-dim);
}

.op-report__meta-total {
  margin-left: auto;
  color: var(--fire-text-sub);
}

/* 报告分区 */
.op-report__group {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: vh(10);
}

/* 分区标题行 */
.op-report__group-head {
  position: relative;
}

/* 分区说明：绝对定位到标题行右侧，让开标题右端的小装饰
   （BigscreenSectionTitle 的右侧装饰占 right 18.53~62.74） */
.op-report__group-meta {
  position: absolute;
  right: vw(72);
  top: 50%;
  transform: translateY(-50%);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;
  color: var(--fire-text-dim);
  white-space: nowrap;
}

/* 卡片网格：一行 4 张（4×458 + 3×16 = 1880，设计稿内容宽 1888）。
   视口变窄时按 auto-fit 自动换行，不压扁卡片（卡片是固定比例的对象）。 */
.op-report__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, calc(458 * var(--min-scale)));
  justify-content: center;
  gap: calc(16 * var(--min-scale));
}
</style>
