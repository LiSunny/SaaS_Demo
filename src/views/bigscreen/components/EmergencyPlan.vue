<template>
  <SectionCard title="全区应急预案管理" subtitle="Preplan" height="100%">
    <div class="emergency-plan">
      <!-- 分段选择器 -->
      <div class="ep-segments">
        <button
          v-for="seg in segments"
          :key="seg.key"
          :class="['ep-seg', { active: activeSeg === seg.key }]"
          @click="activeSeg = seg.key"
        >
          <svg class="ep-seg-bg" viewBox="0 0 160 36" preserveAspectRatio="none">
            <path d="M160 26L150 36H0V10L10 0H160V26Z" />
          </svg>
          <span class="ep-seg-label">{{ seg.label }}</span>
        </button>
      </div>

      <!-- 统计内容 -->
      <div class="ep-content">
        <!-- 环形图 + 总数 -->
        <div class="ep-donut-area">
          <svg class="ep-donut" viewBox="0 0 119 119">
            <circle cx="59.5" cy="59.5" r="55" fill="none" stroke="rgba(71,132,232,0.15)" stroke-width="8"/>
            <circle
              cx="59.5" cy="59.5" r="55" fill="none" stroke="#4784e8" stroke-width="8"
              stroke-dasharray="276" stroke-dashoffset="69" stroke-linecap="round"
              transform="rotate(-90 59.5 59.5)"
            />
            <circle cx="59.5" cy="59.5" r="39" fill="none" stroke="rgba(71,132,232,0.1)" stroke-width="8"/>
            <circle
              cx="59.5" cy="59.5" r="39" fill="none" stroke="#3cd3d7" stroke-width="8"
              stroke-dasharray="196" stroke-dashoffset="49" stroke-linecap="round"
              transform="rotate(-90 59.5 59.5)"
            />
          </svg>
          <div class="ep-donut-center">
            <span class="ep-donut-num">234</span>
            <span class="ep-donut-unit">家</span>
          </div>
        </div>

        <!-- 右侧分类统计 -->
        <div class="ep-types">
          <div
            v-for="(item, i) in planTypes"
            :key="i"
            class="ep-type-row"
          >
            <span class="ep-type-dot" :style="{ background: item.color }" />
            <span class="ep-type-name">{{ item.name }}</span>
            <span class="ep-type-num">{{ item.value }}</span>
            <span class="ep-type-unit">家</span>
          </div>
        </div>
      </div>
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SectionCard from './SectionCard.vue'

const activeSeg = ref('all')

const segments = [
  { key: 'all', label: '全部' },
  { key: 'fire', label: '消防' },
  { key: 'earthquake', label: '地震' },
  { key: 'flood', label: '防汛' },
]

const planTypes = [
  { name: '应急预案类型1', value: 36, color: '#4784e8' },
  { name: '应急预案类型2', value: 36, color: '#3cd3d7' },
  { name: '应急预案类型3', value: 36, color: '#f59e0b' },
  { name: '应急预案类型4', value: 36, color: '#eaad6c' },
]
</script>

<style scoped>
.emergency-plan {
  padding: calc(8 * var(--h)) calc(8 * var(--w));
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
}

.ep-segments {
  display: flex;
  gap: calc(16 * var(--w));
  padding: calc(6 * var(--h)) calc(16 * var(--w));
}
.ep-seg {
  flex: 1;
  position: relative;
  height: calc(36 * var(--h));
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.ep-seg-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.ep-seg-bg path {
  fill: transparent;
  stroke: #0094E6;
  stroke-width: 1;
  transition: fill 0.2s ease, stroke 0.2s ease;
  vector-effect: non-scaling-stroke;
}
.ep-seg-label {
  position: relative;
  z-index: 1;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(10px, calc(18 * var(--min-scale)), 18px);
  font-weight: 700;
  color: #0094E6;
  transition: color 0.2s ease;
}
.ep-seg.active .ep-seg-bg path {
  fill: #0060A5;
  stroke: #3CD3D7;
}
.ep-seg.active .ep-seg-label {
  background: linear-gradient(to bottom, #ffffff, #94bbff);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.ep-seg:hover:not(.active) .ep-seg-bg path {
  stroke: rgba(0, 148, 230, 0.7);
}
.ep-seg:hover:not(.active) .ep-seg-label {
  color: rgba(0, 148, 230, 0.85);
}

.ep-content {
  display: flex;
  gap: calc(16 * var(--w));
  padding: 0 calc(8 * var(--w));
  flex: 1;
}

/* 等比元素：环形图 */
.ep-donut-area {
  position: relative;
  width: calc(119 * var(--min-scale));
  height: calc(119 * var(--min-scale));
  flex-shrink: 0;
}
.ep-donut { width: 100%; height: 100%; }
.ep-donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.ep-donut-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(17px, calc(28 * var(--min-scale)), 34px);
  font-weight: 700;
  color: #fff;
}
.ep-donut-unit {
  font-size: clamp(8px, calc(12 * var(--min-scale)), 16px);
  color: rgba(255,255,255,0.5);
}

.ep-types {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: calc(8 * var(--h));
}
.ep-type-row {
  display: flex;
  align-items: center;
  gap: calc(8 * var(--w));
}
/* 等比元素 */
.ep-type-dot {
  width: calc(10 * var(--min-scale));
  height: calc(10 * var(--min-scale));
  border-radius: 2px;
  flex-shrink: 0;
}
.ep-type-name {
  flex: 1;
  font-size: clamp(8px, calc(12 * var(--min-scale)), 16px);
  color: rgba(255,255,255,0.6);
}
.ep-type-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(16 * var(--min-scale)), 20px);
  font-weight: 700;
  color: #89b5ff;
}
.ep-type-unit {
  font-size: clamp(7px, calc(11 * var(--min-scale)), 14px);
  color: rgba(255,255,255,0.4);
}
</style>
