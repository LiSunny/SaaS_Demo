<template>
  <SectionCard title="充电桩应急安全" subtitle="Charging">
    <div class="charging-safety">
      <!-- 顶部统计指标 -->
      <div class="charging-stats">
        <BigscreenMetricItem
          v-for="stat in topStats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :unit="stat.unit"
          :hex-src="stat.hexSrc"
        />
      </div>

      <!-- 底部行业分布（2×2 分类统计卡片） -->
      <CategoryStatGrid :items="industryData" />
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import SectionCard from './SectionCard.vue'
import BigscreenMetricItem from './BigscreenMetricItem.vue'
import CategoryStatGrid from './CategoryStatGrid.vue'
import type { CategoryStatItem } from './CategoryStatGrid.vue'
import bikeHexSrc from '@/assets/bigscreen/bike.svg'
import portHexSrc from '@/assets/bigscreen/charge.svg'
import iconGongmao from '@/assets/bigscreen/industry/gongmao.svg'
import iconJiaoyu from '@/assets/bigscreen/industry/jiaoyu.svg'
import iconShequ from '@/assets/bigscreen/industry/shequ.svg'
import iconQita from '@/assets/bigscreen/industry/qita.svg'

const topStats = [
  { label: '电动自行车', value: '102487', unit: '个', hexSrc: bikeHexSrc },
  { label: '充电端口', value: '102487', unit: '个', hexSrc: portHexSrc },
]

const industryData: CategoryStatItem[] = [
  { name: '工贸企业', done: 96, undone: 16, icon: iconGongmao },
  { name: '教育行业', done: 9, undone: 1, icon: iconJiaoyu },
  { name: '社区物业', done: 6, undone: 16, icon: iconShequ },
  { name: '其他', done: 8, undone: 6, icon: iconQita },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.charging-safety {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.charging-stats {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
}

</style>
