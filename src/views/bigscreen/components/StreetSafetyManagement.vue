<template>
  <SectionCard
    title="商业街安全管理"
    subtitle="Street Safety"
    :show-zoom="true"
    :is-zoomed="isZoomed"
    @zoom-click="toggleZoom"
  >
    <div class="street-safety">
      <!-- 顶部概览统计 -->
      <div class="safety-overview">
        <div class="overview-item">
          <span class="overview-num">{{ totalStreets }}</span>
          <span class="overview-label">纳管商业街</span>
        </div>
        <div class="overview-divider" />
        <div class="overview-item">
          <span class="overview-num">{{ totalShops }}</span>
          <span class="overview-label">纳管商铺</span>
        </div>
        <div class="overview-divider" />
        <div class="overview-item">
          <span class="overview-num">{{ avgOnlineRate }}%</span>
          <span class="overview-label">平均设备在线率</span>
        </div>
      </div>

      <!-- 商业街滚动区 -->
      <div class="street-scroll-wrapper">
        <div class="street-track" :style="{ transform: `translateX(-${scrollOffset * 100}%)` }">
          <div
            v-for="street in streets"
            :key="street.name"
            class="street-page"
          >
            <div class="street-card">
              <!-- 街道头部 -->
              <div class="street-card__header">
                <div class="street-card__title-row">
                  <svg class="street-card__icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  <span class="street-card__name">{{ street.name }}</span>
                </div>
                <span
                  class="street-card__badge"
                  :class="`street-card__badge--${street.level}`"
                >
                  {{ street.level === 'demo' ? '示范' : street.level === 'key' ? '重点' : '一般' }}
                </span>
              </div>

              <!-- 指标网格 -->
              <div class="street-card__metrics">
                <div class="metric-cell">
                  <span class="metric-cell__value">{{ street.shops }}</span>
                  <span class="metric-cell__label">纳管商铺</span>
                </div>
                <div class="metric-cell">
                  <span class="metric-cell__value">{{ street.onlineRate }}%</span>
                  <span class="metric-cell__label">设备在线率</span>
                </div>
                <div class="metric-cell">
                  <span class="metric-cell__value">{{ street.dutyRate }}%</span>
                  <span class="metric-cell__label">今日履职率</span>
                </div>
                <div class="metric-cell metric-cell--alert">
                  <span class="metric-cell__value metric-cell__value--warn">{{ street.alerts }}</span>
                  <span class="metric-cell__label">今日告警</span>
                </div>
                <div class="metric-cell metric-cell--danger">
                  <span class="metric-cell__value metric-cell__value--danger">{{ street.hazards }}</span>
                  <span class="metric-cell__label">未闭环隐患</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页指示器 -->
        <div class="street-dots">
          <span
            v-for="i in totalPages"
            :key="i"
            class="dot"
            :class="{ active: currentPage === i - 1 }"
          />
        </div>
      </div>
    </div>
  </SectionCard>

  <!-- 放大后复用已有的示范街专题弹窗 -->
  <StreetDetailModal v-model="isZoomed" />
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import SectionCard from './SectionCard.vue'
import StreetDetailModal from './StreetDetailModal.vue'

interface StreetData {
  name: string
  level: 'demo' | 'key' | 'normal'
  shops: number
  devices: number
  onlineRate: number
  dutyRate: number
  alerts: number
  hazards: number
}

const streets: StreetData[] = [
  {
    name: '示范街',
    level: 'demo',
    shops: 286,
    devices: 1536,
    onlineRate: 98.6,
    dutyRate: 92,
    alerts: 6,
    hazards: 12,
  },
  {
    name: '江南商业街',
    level: 'key',
    shops: 198,
    devices: 1120,
    onlineRate: 96.3,
    dutyRate: 88,
    alerts: 3,
    hazards: 5,
  },
  {
    name: '桥圩商业街',
    level: 'key',
    shops: 152,
    devices: 896,
    onlineRate: 97.1,
    dutyRate: 85,
    alerts: 8,
    hazards: 9,
  },
  {
    name: '新塘商业街',
    level: 'normal',
    shops: 95,
    devices: 560,
    onlineRate: 99.2,
    dutyRate: 94,
    alerts: 1,
    hazards: 2,
  },
]

// 正常态滚动
const currentPage = ref(0)
const totalPages = computed(() => streets.length)
const scrollOffset = computed(() => currentPage.value)

let timer: ReturnType<typeof setInterval> | null = null

const startAutoScroll = () => {
  timer = setInterval(() => {
    currentPage.value = (currentPage.value + 1) % totalPages.value
  }, 3000)
}

onMounted(() => startAutoScroll())
onUnmounted(() => { if (timer) clearInterval(timer) })

const totalStreets = computed(() => streets.length)
const totalShops = computed(() => streets.reduce((sum, s) => sum + s.shops, 0))
const avgOnlineRate = computed(() => {
  const avg = streets.reduce((sum, s) => sum + s.onlineRate, 0) / streets.length
  return avg.toFixed(1)
})

// 放大态 - 控制 StreetDetailModal 显示
const isZoomed = ref(false)

function toggleZoom() {
  isZoomed.value = !isZoomed.value
}
</script>

<style scoped>
.street-safety {
  padding: calc(10 * var(--h)) calc(12 * var(--w));
  display: flex;
  flex-direction: column;
  gap: calc(10 * var(--h));
  height: 100%;
  box-sizing: border-box;
}

/* 顶部概览统计 */
.safety-overview {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: calc(8 * var(--h)) calc(8 * var(--w));
  background: rgba(22, 70, 145, 0.25);
  border: 1px solid rgba(71, 132, 232, 0.2);
  border-radius: calc(6 * var(--min-scale));
  flex-shrink: 0;
}

.overview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(2 * var(--h));
  flex: 1;
  min-width: 0;
}

.overview-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(18 * var(--min-scale)), 22px);
  font-weight: 700;
  background: linear-gradient(to bottom, #3cd3d7 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.overview-label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(8px, calc(11 * var(--min-scale)), 14px);
  font-weight: 400;
  color: rgba(137, 181, 255, 0.6);
  white-space: nowrap;
}

.overview-divider {
  width: 1px;
  height: calc(28 * var(--h));
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(71, 132, 232, 0.4),
    transparent
  );
  flex-shrink: 0;
}

/* 商业街滚动区 */
.street-scroll-wrapper {
  position: relative;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: calc(6 * var(--h));
}

.street-track {
  display: flex;
  transition: transform 0.6s ease-in-out;
  flex: 1;
  min-height: 0;
}

.street-page {
  flex: 0 0 100%;
  display: flex;
  min-height: 0;
}

.street-card {
  flex: 1;
  background: rgba(138, 179, 245, 0.04);
  border: 1px solid rgba(71, 132, 232, 0.15);
  border-radius: calc(6 * var(--min-scale));
  padding: calc(6 * var(--h)) calc(10 * var(--w));
  display: flex;
  flex-direction: column;
  gap: calc(6 * var(--h));
  transition: border-color 0.2s ease;
  min-height: 0;
}

.street-card:hover {
  border-color: rgba(71, 132, 232, 0.35);
}

.street-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.street-card__title-row {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--w));
}

.street-card__icon {
  color: #3cd3d7;
  flex-shrink: 0;
}

.street-card__name {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 17px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

.street-card__badge {
  font-size: clamp(8px, calc(10 * var(--min-scale)), 12px);
  font-weight: 600;
  padding: calc(1 * var(--h)) calc(6 * var(--w));
  border-radius: calc(3 * var(--min-scale));
  line-height: 1.4;
  white-space: nowrap;
  flex-shrink: 0;
}

.street-card__badge--demo {
  background: rgba(60, 211, 215, 0.15);
  color: #3cd3d7;
  border: 1px solid rgba(60, 211, 215, 0.3);
}

.street-card__badge--key {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.street-card__badge--normal {
  background: rgba(137, 181, 255, 0.08);
  color: rgba(137, 181, 255, 0.7);
  border: 1px solid rgba(137, 181, 255, 0.15);
}

.street-card__metrics {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: calc(4 * var(--w));
  align-content: center;
}

.metric-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(2 * var(--h));
  padding: calc(4 * var(--h)) calc(2 * var(--w));
  background: rgba(60, 211, 215, 0.04);
  border: 1px solid rgba(60, 211, 215, 0.08);
  border-radius: calc(4 * var(--min-scale));
  min-width: 0;
}

.metric-cell--alert {
  background: rgba(245, 158, 11, 0.06);
  border-color: rgba(245, 158, 11, 0.15);
}

.metric-cell--danger {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.15);
}

.metric-cell__value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(13 * var(--min-scale)), 16px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
  white-space: nowrap;
}

.metric-cell__value--warn {
  background: none;
  -webkit-background-clip: unset;
  -webkit-text-fill-color: #f59e0b;
  background-clip: unset;
  color: #f59e0b;
}

.metric-cell__value--danger {
  background: none;
  -webkit-background-clip: unset;
  -webkit-text-fill-color: #ff4e51;
  background-clip: unset;
  color: #ff4e51;
}

.metric-cell__label {
  font-size: clamp(7px, calc(9 * var(--min-scale)), 11px);
  font-weight: 400;
  color: rgba(137, 181, 255, 0.55);
  white-space: nowrap;
  text-align: center;
}

.street-dots {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.dot {
  width: 16px;
  height: 4px;
  border-radius: 2px;
  background: rgba(32, 92, 194, 0.56);
  transition: all 0.3s ease;
}

.dot.active {
  width: 32px;
  background: #aeccff;
}
</style>
