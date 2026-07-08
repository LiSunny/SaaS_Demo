<template>
  <SectionCard
    title="重点单位风险管控"
    subtitle="进入专题"
    :subtitle-clickable="true"
    @zoom-click="goToFireControl"
  >
    <div class="risk-control">
      <!-- 顶部统计指标 -->
      <div class="risk-stats">
        <BigscreenMetricItem
          v-for="stat in topStats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :unit="stat.unit"
          :hex-src="stat.hexSrc"
        />
      </div>
      <!-- 监控画面滚动区 -->
      <div class="monitor-scroll-wrapper">
        <div class="monitor-track" :style="{ transform: `translateX(-${scrollOffset * 100}%)` }">
          <div v-for="(page, pi) in monitorPages" :key="pi" class="monitor-page">
            <div v-for="(item, ii) in page" :key="ii" class="monitor-item">
              <div class="monitor-thumb">
                <div class="surveillance-camera">
                  <img :src="item.img" :alt="item.label" />
                  <!-- 镜头暗角 -->
                  <div class="lens-vignette"></div>
                  <!-- 扫描线 -->
                  <div class="scan-lines"></div>
                  <!-- 监控信息叠加层 -->
                  <div class="camera-osd">
                    <div class="osd-top">
                      <span class="rec-indicator">
                        <span class="rec-dot"></span>REC
                      </span>
                      <span class="camera-id">{{ item.cameraId || 'CAM-' + String(ii + 1).padStart(2, '0') }}</span>
                    </div>
                    <div class="osd-bottom">
                      <span class="osd-timestamp">{{ formatTimestamp() }}</span>
                    </div>
                  </div>
                  <div class="monitor-title-bar">{{ item.label }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="monitor-dots">
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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import SectionCard from './SectionCard.vue'
import BigscreenMetricItem from './BigscreenMetricItem.vue'
import riskPeopleSrc from '@/assets/bigscreen/renyuanligang.svg'
import riskPointSrc from '@/assets/bigscreen/fengxiandianwei.svg'

const router = useRouter()

function goToFireControl() {
  router.push({ name: 'FireControlDetail' })
}

const topStats = [
  { label: '人员离岗', value: '10', unit: '次', hexSrc: riskPeopleSrc },
  { label: '风险点位', value: '102', unit: '个', hexSrc: riskPointSrc },
]

// 监控画面列表 - 写实风格监控场景
// 使用 Vite 的 new URL 动态引用本地图片
const monitorList = [
  { label: '1#消防控制室', cameraId: 'CAM-01', img: new URL('@/assets/bigscreen/rsouce/them_1.png', import.meta.url).href },
  { label: '1#消防控制室', cameraId: 'CAM-02', img: new URL('@/assets/bigscreen/rsouce/them_2.png', import.meta.url).href },
  { label: '2#变配电室',    cameraId: 'CAM-03', img: new URL('@/assets/bigscreen/rsouce/them_3.png', import.meta.url).href },
  { label: '3#水泵房',      cameraId: 'CAM-04', img: new URL('@/assets/bigscreen/rsouce/them_4.png', import.meta.url).href },
  { label: '4#锅炉房',      cameraId: 'CAM-05', img: new URL('@/assets/bigscreen/rsouce/them_5.png', import.meta.url).href },
  { label: '5#监控中心',    cameraId: 'CAM-06', img: new URL('@/assets/bigscreen/rsouce/them_6.png', import.meta.url).href },
  { label: '6#危化品库',    cameraId: 'CAM-07', img: new URL('@/assets/bigscreen/rsouce/them_7.png', import.meta.url).href },
  { label: '7#配电室',      cameraId: 'CAM-08', img: new URL('@/assets/bigscreen/rsouce/them_8.png', import.meta.url).href },
]

const ITEMS_PER_PAGE = 2
const currentPage = ref(0)
const scrollOffset = computed(() => currentPage.value)
const totalPages = computed(() => Math.ceil(monitorList.length / ITEMS_PER_PAGE))

// 将监控列表按每页 ITEMS_PER_PAGE 分组
const monitorPages = computed(() => {
  const pages: typeof monitorList[] = []
  for (let i = 0; i < monitorList.length; i += ITEMS_PER_PAGE) {
    pages.push(monitorList.slice(i, i + ITEMS_PER_PAGE))
  }
  return pages
})

let timer: ReturnType<typeof setInterval> | null = null

const startAutoScroll = () => {
  timer = setInterval(() => {
    currentPage.value = (currentPage.value + 1) % totalPages.value
  }, 3000)
}

// 格式化当前时间为监控时间戳样式
const formatTimestamp = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

onMounted(() => startAutoScroll())
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.risk-control {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
}

.risk-stats {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
}

/* 监控画面滚动区 */
.monitor-scroll-wrapper {
  position: relative;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.monitor-track {
  display: flex;
  transition: transform 0.6s ease-in-out;
  flex: 1;
  min-height: 0;
}

/* 每一页 = 一屏宽度，包含 2 个监控项 */
.monitor-page {
  flex: 0 0 100%;
  display: flex;
  gap: 8px;
  min-height: 0;
}

.monitor-item {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 缩略图容器 — 标题叠加在底部 */
.monitor-thumb {
  position: relative;
  flex: 1;
  border-radius: 4px;
  overflow: hidden;
  min-height: 0;
}

/* ========== 写实监控摄像头样式 ========== */
.surveillance-camera {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}

.surveillance-camera img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  /* 监控画面色调：略微偏绿偏冷 */
  filter: saturate(0.85) brightness(0.95) hue-rotate(15deg);
}

/* 镜头暗角效果 */
.lens-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.45) 100%);
  pointer-events: none;
}

/* 扫描线 — 模拟CRT/监控逐行扫描 */
.scan-lines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 1px,
    rgba(0, 0, 0, 0.06) 1px,
    rgba(0, 0, 0, 0.06) 2px
  );
  pointer-events: none;
  animation: scan-roll 8s linear infinite;
}

@keyframes scan-roll {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

/* 监控 OSD 信息叠加层 */
.camera-osd {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 6px 8px;
  pointer-events: none;
  z-index: 2;
}

.osd-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.osd-bottom {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}

/* REC 录制指示器 */
.rec-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Courier New', 'Consolas', monospace;
  font-size: clamp(9px, calc(11 * var(--min-scale)), 14px);
  font-weight: 700;
  color: #ff3333;
  background: rgba(0, 0, 0, 0.55);
  padding: 2px 8px;
  border-radius: 2px;
  letter-spacing: 0.5px;
}

.rec-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff3333;
  box-shadow: 0 0 4px #ff0000;
  animation: rec-blink 1.2s ease-in-out infinite;
}

@keyframes rec-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

/* 摄像头编号 */
.camera-id {
  font-family: 'Courier New', 'Consolas', monospace;
  font-size: clamp(9px, calc(11 * var(--min-scale)), 14px);
  font-weight: 700;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.55);
  padding: 2px 8px;
  border-radius: 2px;
  letter-spacing: 0.5px;
}

/* 时间戳 */
.osd-timestamp {
  font-family: 'Courier New', 'Consolas', monospace;
  font-size: clamp(9px, calc(11 * var(--min-scale)), 14px);
  color: #ffffff;
  background: rgba(0, 0, 0, 0.55);
  padding: 2px 8px;
  border-radius: 2px;
  letter-spacing: 0.5px;
}

/* 标题栏 — 叠加在缩略图底部，半透明深色背景 */
.monitor-title-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 3;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.58));
  color: #ffffff;
  padding: 14px 10px 4px;
  font-family: 'YouSheBiaoTiHei', 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(14 * var(--min-scale)), 18px);
  line-height: normal;
  white-space: nowrap;
}

/* 分页指示器 */
.monitor-dots {
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
