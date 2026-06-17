<template>
  <SectionCard title="重点单位风险管控" subtitle="Risk Control">
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
                <img :src="item.img" :alt="item.label" />
                <div class="monitor-title-bar">{{ item.label }}</div>
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
import SectionCard from './SectionCard.vue'
import BigscreenMetricItem from './BigscreenMetricItem.vue'
import riskPeopleSrc from '@/assets/bigscreen/renyuanligang.svg'
import riskPointSrc from '@/assets/bigscreen/fengxiandianwei.svg'

const topStats = [
  { label: '人员离岗', value: '10', unit: '次', hexSrc: riskPeopleSrc },
  { label: '风险点位', value: '102', unit: '个', hexSrc: riskPointSrc },
]

// 监控画面列表
const monitorList = [
  { label: '1#消防控制室', img: 'https://picsum.photos/seed/mon1/400/225' },
  { label: '1#消防控制室', img: 'https://picsum.photos/seed/mon2/400/225' },
  { label: '2#变配电室', img: 'https://picsum.photos/seed/mon3/400/225' },
  { label: '3#水泵房', img: 'https://picsum.photos/seed/mon4/400/225' },
  { label: '4#锅炉房', img: 'https://picsum.photos/seed/mon5/400/225' },
  { label: '5#监控中心', img: 'https://picsum.photos/seed/mon6/400/225' },
  { label: '6#危化品库', img: 'https://picsum.photos/seed/mon7/400/225' },
  { label: '7#配电室', img: 'https://picsum.photos/seed/mon8/400/225' },
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

onMounted(() => startAutoScroll())
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
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

.monitor-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* 标题栏 — 叠加在缩略图底部，半透明深色背景 */
.monitor-title-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(18, 18, 18, 0.58);
  color: #ffffff;
  padding: 4px 10px;
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
