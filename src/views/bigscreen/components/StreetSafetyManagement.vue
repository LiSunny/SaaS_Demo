<template>
  <SectionCard
    title="商业街安全管理"
    subtitle="进入专题"
    :subtitle-clickable="true"
    :show-zoom="false"
    @zoom-click="toggleZoom"
  >
    <div class="street-safety">
      <!-- 顶部概览统计 -->
      <div class="safety-overview">
        <BigscreenMetricItem
          v-for="stat in overviewStats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :unit="stat.unit"
          :hex-src="stat.hexSrc"
        />
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
                  <img class="street-card__icon" :src="gongmaoIcon" alt="" />
                  <span class="street-card__name">{{ street.name }}</span>
                </div>
                <span class="street-card__detail" @click.stop="viewDetail(street.name)">详情</span>
              </div>

              <!-- 指标网格 2 行 × 3 列 -->
              <div class="street-card__metrics">
                <div class="metric-cell">
                  <span class="metric-cell__label">纳管商铺</span>
                  <span class="metric-cell__value">{{ street.shops }}<span class="metric-cell__unit">家</span></span>
                </div>
                <div class="metric-cell">
                  <span class="metric-cell__label">纳管设备</span>
                  <span class="metric-cell__value">{{ street.devices }}<span class="metric-cell__unit">台</span></span>
                </div>
                <div class="metric-cell">
                  <span class="metric-cell__label">设备在线率</span>
                  <span class="metric-cell__value">{{ street.onlineRate }}<span class="metric-cell__unit">%</span></span>
                </div>
                <div class="metric-cell">
                  <span class="metric-cell__label">今日履职率</span>
                  <span class="metric-cell__value">{{ street.dutyRate }}<span class="metric-cell__unit">%</span></span>
                </div>
                <div class="metric-cell">
                  <span class="metric-cell__label">今日告警</span>
                  <span class="metric-cell__value">{{ street.alerts }}<span class="metric-cell__unit">次</span></span>
                </div>
                <div class="metric-cell">
                  <span class="metric-cell__label">未闭环隐患</span>
                  <span class="metric-cell__value">{{ street.hazards }}<span class="metric-cell__unit">项</span></span>
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


</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import SectionCard from './SectionCard.vue'
import BigscreenMetricItem from './BigscreenMetricItem.vue'
import bikeSrc from '@/assets/bigscreen/bike.svg'
import chargeSrc from '@/assets/bigscreen/charge.svg'
import gongmaoIcon from '@/assets/bigscreen/industry/gongmao.svg'

interface StreetData {
  name: string
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
    shops: 286,
    devices: 1536,
    onlineRate: 98.6,
    dutyRate: 92,
    alerts: 6,
    hazards: 12,
  },
  {
    name: '江南商业街',
    shops: 198,
    devices: 1120,
    onlineRate: 96.3,
    dutyRate: 88,
    alerts: 3,
    hazards: 5,
  },
  {
    name: '桥圩商业街',
    shops: 152,
    devices: 896,
    onlineRate: 97.1,
    dutyRate: 85,
    alerts: 8,
    hazards: 9,
  },
  {
    name: '新塘商业街',
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

const overviewStats = computed(() => [
  { label: '纳管商业街', value: totalStreets.value, unit: '条', hexSrc: bikeSrc },
  { label: '纳管商铺', value: totalShops.value, unit: '家', hexSrc: chargeSrc },
])

const router = useRouter()

// 放大态 - 导航到专题页面
function toggleZoom() {
  router.push({ name: 'StreetDetail' })
}

// 点击指定商业街的“详情”，导航并带入商业街
function viewDetail(streetName: string) {
  router.push({ name: 'StreetDetail', query: { street: streetName } })
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

/* ===== 顶部概览统计 ===== */
.safety-overview {
  display: flex;
  justify-content: space-between;
  padding: calc(12 * var(--h)) calc(16 * var(--w));
  flex-shrink: 0;
  gap: calc(16 * var(--w));
}

/* ===== 商业街滚动区 ===== */
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

/* ===== 街道卡片 ===== */
.street-card {
  flex: 1;
  background: rgba(0, 57, 114, 0.68);
  border-radius: calc(6 * var(--min-scale));
  padding: calc(12 * var(--h)) calc(12 * var(--w));
  display: flex;
  flex-direction: column;
  gap: calc(10 * var(--h));
  transition: border-color 0.2s ease;
  min-height: 0;
}

/* 街道头部 */
.street-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.street-card__title-row {
  display: flex;
  align-items: center;
  gap: calc(8 * var(--w));
}

.street-card__icon {
  width: calc(22 * var(--min-scale));
  height: calc(22 * var(--min-scale));
  flex-shrink: 0;
  display: block;
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

.street-card__detail {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(10px, calc(12 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #00b8db;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.street-card__detail:hover {
  opacity: 0.8;
}

/* ===== 指标网格：3 列自动流 ===== */
.street-card__metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: calc(6 * var(--h)) calc(6 * var(--w));
}

.metric-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(4 * var(--h));
  padding: calc(4 * var(--h)) calc(4 * var(--w));
  min-width: 0;
}

.metric-cell__label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(10px, calc(12 * var(--min-scale)), 14px);
  font-weight: 400;
  color: #f2fbff;
  white-space: nowrap;
  line-height: 1.4;
}

.metric-cell__value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(17 * var(--min-scale)), 20px);
  font-weight: 700;
  color: #f1f1f1;
  line-height: 1.2;
  white-space: nowrap;
}

.metric-cell__unit {
  font-family: 'Heiti TC', 'PingFang SC', sans-serif;
  font-size: clamp(10px, calc(14 * var(--min-scale)), 16px);
  font-weight: 500;
  color: rgba(241, 241, 241, 0.7);
  margin-left: calc(2 * var(--w));
}

/* ===== 分页指示器 ===== */
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
