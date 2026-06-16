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
          <div v-for="(item, idx) in monitorList" :key="idx" class="monitor-item">
            <div class="monitor-img">
              <img :src="item.img" :alt="item.label" />
            </div>
            <div class="monitor-label">{{ item.label }}</div>
            <span class="monitor-tag">{{ item.tag }}</span>
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
  { label: '1#消防控制室', tag: '豆包AI主站', img: 'https://picsum.photos/seed/mon1/400/225' },
  { label: '1#消防控制室', tag: '豆包AI主站', img: 'https://picsum.photos/seed/mon2/400/225' },
  { label: '2#变配电室', tag: '实时监控', img: 'https://picsum.photos/seed/mon3/400/225' },
  { label: '3#水泵房', tag: '实时监控', img: 'https://picsum.photos/seed/mon4/400/225' },
  { label: '4#锅炉房', tag: '实时监控', img: 'https://picsum.photos/seed/mon5/400/225' },
  { label: '5#监控中心', tag: '豆包AI主站', img: 'https://picsum.photos/seed/mon6/400/225' },
]

const ITEMS_PER_PAGE = 2
const currentPage = ref(0)
const scrollOffset = computed(() => currentPage.value)
const totalPages = computed(() => Math.ceil(monitorList.length / ITEMS_PER_PAGE))

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
  padding: calc(10 * var(--h)) calc(12 * var(--w));
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
}

.risk-stats {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}

/* 监控画面滚动区 */
.monitor-scroll-wrapper {
  position: relative;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.monitor-track {
  display: flex;
  transition: transform 0.6s ease-in-out;
  height: 100%;
}

.monitor-item {
  width: 50%;
  flex-shrink: 0;
  padding: calc(4 * var(--w));
  box-sizing: border-box;
  position: relative;
}

.monitor-img {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(100, 160, 255, 0.25);
  background: rgba(10, 30, 70, 0.5);
}

.monitor-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.monitor-label {
  margin-top: calc(4 * var(--h));
  font-size: clamp(9px, calc(13 * var(--min-scale)), 15px);
  font-weight: 600;
  color: #e8f0ff;
  letter-spacing: 0.5px;
}

.monitor-tag {
  position: absolute;
  bottom: calc(4 * var(--h));
  right: calc(8 * var(--w));
  font-size: clamp(7px, calc(9 * var(--min-scale)), 11px);
  color: rgba(140, 175, 235, 0.65);
}

/* 分页指示器 */
.monitor-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: calc(6 * var(--h));
}

.dot {
  width: 14px;
  height: 3px;
  border-radius: 2px;
  background: rgba(100, 160, 255, 0.2);
  transition: all 0.3s ease;
}

.dot.active {
  width: 24px;
  background: linear-gradient(90deg, #60a5fa, #3b82f6);
}
</style>
