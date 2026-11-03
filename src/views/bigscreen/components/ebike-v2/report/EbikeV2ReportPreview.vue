<template>
  <!-- 页内浮层：不跳路由、不开新标签页（值守场景不能打断大屏上下文） -->
  <div class="rpv" role="dialog" aria-modal="true" :aria-label="`${report.title} ${report.period}`">
    <!-- 遮罩：点击关闭 -->
    <div class="rpv__scrim" @click="emit('close')" />

    <section class="rpv__panel">
      <!-- 头部：报告名 + 周期 + 关闭 -->
      <header class="rpv__head">
        <span class="rpv__head-bar" />
        <h2 class="rpv__title">{{ report.title }}</h2>
        <span class="rpv__period">{{ report.period }}</span>
        <button type="button" class="rpv__close" title="关闭" @click="emit('close')">
          <X :size="18" />
        </button>
      </header>

      <div class="rpv__body">
        <!-- 一句话结论 -->
        <p class="rpv__summary">{{ report.summary }}</p>

        <!-- 关键指标 -->
        <div class="rpv__metrics">
          <div v-for="m in report.metrics" :key="m.label" class="rpv__metric">
            <span class="rpv__metric-label">{{ m.label }}</span>
            <span class="rpv__metric-value" :class="{ 'is-abnormal': m.tone === 'abnormal' }">
              {{ m.value }}
            </span>
          </div>
        </div>

        <!-- TOP 榜 -->
        <div class="rpv__rank">
          <span class="rpv__rank-title">TOP 榜</span>
          <ul class="rpv__rank-list">
            <li v-for="(h, i) in report.highlights" :key="h.label" class="rpv__rank-item">
              <span class="rpv__rank-no">{{ i + 1 }}</span>
              <span class="rpv__rank-label">{{ h.label }}</span>
              <span class="rpv__rank-value">{{ h.value }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 底部：生成信息 -->
      <footer class="rpv__foot">
        <span>生成时间 {{ report.generatedAt }}</span>
        <span v-if="report.agentBadge" class="rpv__foot-agent">
          <img class="rpv__foot-agent-icon" :src="badgeSrc" alt="" aria-hidden="true" />
          小安助手生成
        </span>
        <span v-else class="rpv__foot-system">设备侧统计报表</span>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 报告预览浮层
 *
 * 卡片上的「点击查看」打开：页内浮层展示这份报告的关键指标与 TOP 榜。
 * 关闭方式两种：右上角关闭按钮 + Esc（值守大屏上不能让人"找不到出口"）。
 */
import { onBeforeUnmount, onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import badgeSrc from '@/assets/bigscreen/ebike-v2/report/report-agent-badge.png'
import type { ReportItem } from './report-data'

defineProps<{ report: ReportItem }>()

const emit = defineEmits<{ (e: 'close'): void }>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../fire/fire-common.scss" as fire;

.rpv {
  position: absolute;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 遮罩 */
.rpv__scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 12, 32, 0.62);
}

/* 面板：深蓝玻璃，与大屏其它面板同一套底 */
.rpv__panel {
  position: relative;
  z-index: 1;
  width: calc(720 * var(--min-scale));
  max-height: calc(760 * var(--min-scale));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(0, 152, 230, 0.28);
  border-radius: calc(4 * var(--min-scale));
  background: rgba(0, 44, 94, 0.94);
  backdrop-filter: blur(9px);
  -webkit-backdrop-filter: blur(9px);
  box-shadow: 0 calc(12 * var(--min-scale)) calc(40 * var(--min-scale)) rgba(0, 8, 24, 0.55);
}

/* 头部 */
.rpv__head {
  position: relative;
  display: flex;
  align-items: center;
  gap: vw(12);
  height: vh(56);
  padding: 0 vw(16);
  border-bottom: 1px solid rgba(120, 190, 255, 0.16);
  background: linear-gradient(90deg, rgba(6, 64, 110, 0.9) 0%, rgba(12, 123, 212, 0) 100%);
}

.rpv__head-bar {
  width: vw(3);
  height: vh(18);
  border-radius: 1px;
  background: rgba(0, 152, 230, 0.8);
}

.rpv__title {
  margin: 0;
  font-family: 'SectionTitleHans', 'PingFang SC', sans-serif;
  font-weight: 900;
  font-size: clamp(16px, calc(22 * var(--min-scale)), 22px);
  line-height: 1;
  color: var(--fire-text-title);
}

.rpv__period {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;
  color: var(--fire-text-sub);
}

.rpv__close {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: vw(28);
  height: vh(28);
  padding: 0;
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: vw(2);
  background: transparent;
  color: var(--fire-text-label);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.rpv__close:hover {
  background: rgba(0, 134, 228, 0.55);
  color: #ffffff;
}

/* 内容区 */
.rpv__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: vh(14);
  padding: vh(14) vw(16);
}

/* 一句话结论 */
.rpv__summary {
  margin: 0;
  padding: vh(10) vw(12);
  border-left: vw(3) solid rgba(0, 152, 230, 0.8);
  border-radius: 0 vw(2) vw(2) 0;
  background: rgba(0, 84, 160, 0.28);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  line-height: 1.6;
  color: var(--fire-text-title);
}

/* 关键指标 */
.rpv__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: vw(10);
}

.rpv__metric {
  display: flex;
  flex-direction: column;
  gap: vh(6);
  padding: vh(10) vw(12);
  border: 1px solid rgba(120, 190, 255, 0.18);
  border-radius: vw(2);
  background: rgba(0, 30, 68, 0.5);
}

.rpv__metric-label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  line-height: 1.2;
  color: var(--fire-text-label);
}

/* 数值：核心层级；异常走全页唯一的那一个红 */
.rpv__metric-value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-weight: 700;
  font-size: clamp(16px, calc(24 * var(--min-scale)), 24px);
  line-height: 1.1;
  color: var(--fire-text-hero);
}

.rpv__metric-value.is-abnormal {
  color: var(--fire-anomaly);
}

/* TOP 榜 */
.rpv__rank-title {
  display: inline-flex;
  align-items: center;
  gap: vw(6);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-title);
}

.rpv__rank-title::before {
  content: '';
  width: vw(3);
  height: vh(11);
  border-radius: 1px;
  background: rgba(0, 152, 230, 0.65);
}

.rpv__rank-list {
  margin: vh(8) 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: vh(6);
}

.rpv__rank-item {
  display: flex;
  align-items: center;
  gap: vw(10);
  padding: vh(8) vw(12);
  border: 1px solid rgba(120, 190, 255, 0.12);
  border-radius: vw(2);
  background: rgba(0, 44, 94, 0.5);
}

.rpv__rank-no {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: vw(20);
  height: vh(20);
  border-radius: vw(2);
  background: rgba(0, 134, 228, 0.55);
  font-family: 'Douyin Sans', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: #ffffff;
}

.rpv__rank-label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-label);
}

.rpv__rank-value {
  margin-left: auto;
  font-family: 'Douyin Sans', sans-serif;
  font-weight: 700;
  font-size: 16px;
  color: var(--fire-text-hero);
}

/* 底部 */
.rpv__foot {
  display: flex;
  align-items: center;
  gap: vw(16);
  padding: vh(10) vw(16);
  border-top: 1px solid rgba(120, 190, 255, 0.16);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-dim);
}

.rpv__foot-agent {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: vw(6);
  color: var(--fire-text-sub);
}

/* 角标素材是 Figma 徽标的整体导出（340×104），缩到 62 宽时「小安助手」
   四个字只剩 11px 高、糊成一团；这里给 104×32（0.3×），文字仍可读。 */
.rpv__foot-agent-icon {
  width: calc(104 * var(--min-scale));
  height: calc(32 * var(--min-scale));
  object-fit: contain;
  object-position: left center;
}

.rpv__foot-system {
  margin-left: auto;
  color: var(--fire-text-dim);
}
</style>
