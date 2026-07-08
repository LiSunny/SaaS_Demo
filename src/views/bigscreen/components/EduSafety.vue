<template>
  <SectionCard title="教育系统应急安全" subtitle="Education">
    <div class="edu-safety">
      <!-- 分段 Tab -->
      <div class="edu-segments">
        <button
          v-for="seg in segments"
          :key="seg.key"
          :class="['edu-seg', { active: activeTab === seg.key }]"
          @click="activeTab = seg.key"
        >
          <svg class="edu-seg-bg" viewBox="0 0 160 36" preserveAspectRatio="none">
            <path d="M160 26L150 36H0V10L10 0H160V26Z" />
          </svg>
          <span class="edu-seg-label">{{ seg.label }}</span>
        </button>
      </div>

      <!-- 预警列表 -->
      <div class="edu-warnings">
        <div v-for="item in warningItems" :key="item.key" class="edu-warning-row">
          <!-- 左侧：六边形图标 + 名称 + 总数 -->
          <BigscreenMetricItem
            :hex-src="item.hexSrc"
            :label="item.name"
            :value="item.total"
            unit="个"
          />

          <!-- 右侧：寄宿制 / 非寄宿制分解 -->
          <div class="edu-breakdown">
            <div class="edu-bd-item">
              <p class="edu-bd-label">寄宿制学校</p>
              <p class="edu-bd-value">
                <span class="edu-bd-num">{{ item.boarding }}</span>
                <span class="edu-bd-unit"> 个</span>
              </p>
            </div>
            <div class="edu-bd-item">
              <p class="edu-bd-label">非寄宿制学校</p>
              <p class="edu-bd-value">
                <span class="edu-bd-num">{{ item.nonBoarding }}</span>
                <span class="edu-bd-unit"> 个</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SectionCard from './SectionCard.vue'
import BigscreenMetricItem from './BigscreenMetricItem.vue'
import warningFireIcon from '@/assets/bigscreen/warning-fire.svg'
import warningBullyIcon from '@/assets/bigscreen/warning-bully.svg'
import warningElectricIcon from '@/assets/bigscreen/warning-electric.svg'

const activeTab = ref<'warning' | 'checkin'>('warning')

const segments = [
  { key: 'warning' as const, label: '预警监测' },
  { key: 'checkin' as const, label: '校长履职打卡' },
]

const warningItems = [
  { key: 'fire', name: '火灾预警', hexSrc: warningFireIcon, total: 10, boarding: 1, nonBoarding: 9 },
  { key: 'bully', name: '霸凌预警', hexSrc: warningBullyIcon, total: 10, boarding: 1, nonBoarding: 9 },
  { key: 'electric', name: '电气预警', hexSrc: warningElectricIcon, total: 10, boarding: 1, nonBoarding: 9 },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.edu-safety {
  padding: vh(8) vw(8);
  display: flex;
  flex-direction: column;
  gap: vh(8);
}

/* ===== 分段 Tab ===== */
.edu-segments {
  display: flex;
  gap: vw(16);
  padding: vh(2) vw(8);
}
.edu-seg {
  flex: 1;
  position: relative;
  height: vh(32);
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.edu-seg-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.edu-seg-bg path {
  fill: transparent;
  stroke: #0094E6;
  stroke-width: 1;
  transition: fill 0.2s ease, stroke 0.2s ease;
  vector-effect: non-scaling-stroke;
}
.edu-seg-label {
  position: relative;
  z-index: 1;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(18 * var(--min-scale)), 18px);
  font-weight: 700;
  color: #0094E6;
  transition: color 0.2s ease;
}
.edu-seg.active .edu-seg-bg path {
  fill: #0060A5;
  stroke: #3CD3D7;
}
.edu-seg.active .edu-seg-label {
  background: linear-gradient(to bottom, #ffffff, #94bbff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.edu-seg:hover:not(.active) .edu-seg-bg path {
  stroke: rgba(0, 148, 230, 0.7);
}
.edu-seg:hover:not(.active) .edu-seg-label {
  color: rgba(0, 148, 230, 0.85);
}

/* ===== 预警列表 ===== */
.edu-warnings {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: vh(12);
  padding: 0 vw(8);
}

.edu-warning-row {
  display: flex;
  align-items: center;
  gap: vw(16);
  flex: 1;
}

/* 左侧 BigscreenMetricItem 加宽，与右侧分解信息平分空间 */
.edu-warning-row > :first-child {
  flex: 1;
}

/* ===== 右侧：寄宿制/非寄宿制分解 ===== */
.edu-breakdown {
  display: flex;
  gap: vw(8);
  flex: 1;
}

.edu-bd-item {
  display: flex;
  flex-direction: column;
  gap: vh(12);
  flex: 1;
}

.edu-bd-label {
  margin: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(10px, calc(14 * var(--min-scale)), 16px);
  font-weight: 400;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: normal;
}

.edu-bd-value {
  margin: 0;
  white-space: nowrap;
  line-height: 0;
}

.edu-bd-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(18 * var(--min-scale)), 22px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: normal;
}

.edu-bd-unit {
  font-family: 'Heiti TC', 'PingFang SC', sans-serif;
  font-size: clamp(10px, calc(14 * var(--min-scale)), 16px);
  font-weight: 500;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: normal;
}
</style>
