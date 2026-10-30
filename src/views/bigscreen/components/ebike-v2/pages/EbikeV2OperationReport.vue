<template>
  <EbikeV2PageShell :row-modules="ROW_MODULES" :side-modules="SIDE_MODULES">
    <template #main>
      <EbikeV2Card title="报告预览" class="report">
        <!-- 报告参数条：只出维度框架，生成行为待接入 -->
        <div class="report__toolbar">
          <span class="report__filter">
            报告周期
            <i class="report__caret" />
          </span>
          <span class="report__filter">
            报告类型
            <i class="report__caret" />
          </span>
          <span class="report__filter">
            统计范围
            <i class="report__caret" />
          </span>
          <span class="report__action">生成报告</span>
        </div>

        <!-- 报告正文区 -->
        <div class="report__page">
          <span class="report__page-empty">报告内容待生成</span>
        </div>
      </EbikeV2Card>
    </template>
  </EbikeV2PageShell>
</template>

<script setup lang="ts">
/**
 * 运行报告页
 *
 * 周期报告的生成与留档：主区放报告预览（参数 + 正文），
 * 底部看模板 / 生成记录 / 定时任务，右列看关键指标汇总、分发与导出。
 * 本轮只出模块框架与标题。
 */
import EbikeV2Card from '../EbikeV2Card.vue'
import EbikeV2PageShell from './EbikeV2PageShell.vue'

/** 底部三模块 */
const ROW_MODULES = ['报告模板', '生成记录', '定时任务']

/** 右列三模块 */
const SIDE_MODULES = ['关键指标汇总', '报告分发', '导出记录']
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.report {
  height: 100%;
}

/* 卡片内容区改为纵向排列：参数条在上，报告正文占满剩余高度 */
.report :deep(.v2-card__body) {
  display: flex;
  flex-direction: column;
}

/* 参数条 */
.report__toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(10);
  padding: vh(10) vw(14) vh(6);
}

.report__filter {
  display: inline-flex;
  align-items: center;
  gap: vw(6);
  height: vh(30);
  padding: 0 vw(10);
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: vw(2);
  background: rgba(0, 68, 130, 0.42);
  color: var(--fire-text-label);
  font-size: 14px;
  letter-spacing: 1px;
  white-space: nowrap;
}

/* 下拉箭头（静态：筛选项未接入） */
.report__caret {
  width: 0;
  height: 0;
  border-left: vw(4) solid transparent;
  border-right: vw(4) solid transparent;
  border-top: vh(5) solid rgba(169, 201, 234, 0.75);
}

/* 主操作位（静态：生成逻辑未接入） */
.report__action {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  height: vh(30);
  padding: 0 vw(16);
  border: 1px solid rgba(96, 200, 255, 0.5);
  border-radius: vw(2);
  background: linear-gradient(180deg, rgba(0, 134, 228, 0.9) 0%, rgba(0, 86, 168, 0.9) 100%);
  color: #fff;
  font-size: 14px;
  letter-spacing: 1px;
  white-space: nowrap;
}

/* 报告正文区 */
.report__page {
  flex: 1;
  min-height: 0;
  margin: vh(6) vw(14) vh(14);
  border: 1px dashed rgba(120, 190, 255, 0.24);
  border-radius: vw(2);
  background: rgba(0, 30, 68, 0.34);
  display: flex;
  align-items: center;
  justify-content: center;
}

.report__page-empty {
  font-size: 14px;
  color: var(--fire-text-dim);
  letter-spacing: 1px;
}
</style>
