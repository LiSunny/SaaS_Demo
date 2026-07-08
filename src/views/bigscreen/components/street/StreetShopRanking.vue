<template>
  <SectionCard title="重点商铺画像" subtitle="Key Shops" more-label="更多">
    <div class="shop-ranking">
      <BigscreenListTable :columns="columns" :rows="shopRows" row-key="name">
        <template #cell-rank="{ index }">
          <span class="cell-rank" :class="`rank-${index + 1}`">{{ index + 1 }}</span>
        </template>
        <template #cell-name="{ row }">
          <span class="cell-name">{{ row.name }}</span>
        </template>
        <template #cell-alarms="{ row }">
          <span class="cell-value" :class="row.alarms > 3 ? 'text-red' : row.alarms > 1 ? 'text-orange' : 'text-green'">
            {{ row.alarms }}
          </span>
        </template>
        <template #cell-hazards="{ row }">
          <span class="cell-value" :class="row.hazards > 2 ? 'text-red' : row.hazards > 0 ? 'text-orange' : 'text-green'">
            {{ row.hazards }}
          </span>
        </template>
        <template #cell-dutyRate="{ row }">
          <div class="duty-rate-cell">
            <div class="duty-bar-bg">
              <div class="duty-bar" :style="{ width: row.dutyRate + '%', background: row.dutyRate >= 90 ? '#22c55e' : row.dutyRate >= 80 ? '#f59e0b' : '#ef4444' }" />
            </div>
            <span class="duty-rate-text" :class="row.dutyRate >= 90 ? 'text-green' : row.dutyRate >= 80 ? 'text-orange' : 'text-red'">
              {{ row.dutyRate }}%
            </span>
          </div>
        </template>
        <template #cell-score="{ row }">
          <span class="cell-score" :class="row.score >= 80 ? 'text-green' : row.score >= 70 ? 'text-orange' : 'text-red'">
            {{ row.score }}分
          </span>
        </template>
      </BigscreenListTable>
    </div>
  </SectionCard>
</template>

<script setup lang="ts">
import SectionCard from '../SectionCard.vue'
import BigscreenListTable, { type BsColumn } from '../BigscreenListTable.vue'

const columns: BsColumn[] = [
  { key: 'rank', label: '排名', width: 'vw(40)' },
  { key: 'name', label: '商铺名称', width: 'vw(100)' },
  { key: 'alarms', label: '告警(近30天)', width: 'vw(70)' },
  { key: 'hazards', label: '隐患(未整改)', width: 'vw(70)' },
  { key: 'dutyRate', label: '履职完成率', width: 'vw(90)' },
  { key: 'score', label: '安全评分', width: 'vw(60)' },
]

const shopRows = [
  { name: 'XX烧烤店', alarms: 5, hazards: 3, dutyRate: 80, score: 68 },
  { name: 'XX餐饮店', alarms: 4, hazards: 2, dutyRate: 85, score: 72 },
  { name: 'XX超市', alarms: 4, hazards: 1, dutyRate: 86, score: 76 },
  { name: 'XX饭店', alarms: 3, hazards: 4, dutyRate: 78, score: 66 },
  { name: 'XX网吧', alarms: 3, hazards: 2, dutyRate: 82, score: 70 },
  { name: 'XX奶茶店', alarms: 2, hazards: 2, dutyRate: 88, score: 78 },
  { name: 'XX便利店', alarms: 2, hazards: 1, dutyRate: 90, score: 80 },
  { name: 'XX五金店', alarms: 2, hazards: 2, dutyRate: 84, score: 75 },
  { name: 'XX水果店', alarms: 1, hazards: 1, dutyRate: 92, score: 82 },
  { name: 'XX服装店', alarms: 1, hazards: 1, dutyRate: 93, score: 83 },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.shop-ranking {
  padding: vh(8) vw(12);
  height: 100%;
  overflow: hidden;
}

.cell-rank {
  width: calc(18 * var(--min-scale));
  height: calc(18 * var(--min-scale));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(8px, calc(10 * var(--min-scale)), 12px);
  font-weight: 700;
  color: #fff;
  background: rgba(71, 132, 232, 0.3);
  border-radius: 4px;
}

.rank-1 { background: #f59e0b; }
.rank-2 { background: #6b7280; }
.rank-3 { background: #92400e; }

.cell-name {
  color: #e0eafa;
  text-align: left;
}

.cell-value {
  font-family: 'Douyin Sans', sans-serif;
  font-weight: 700;
}

.cell-score {
  font-family: 'Douyin Sans', sans-serif;
  font-weight: 700;
}

.text-green { color: #22c55e !important; }
.text-orange { color: #f59e0b !important; }
.text-red { color: #ef4444 !important; }

.duty-rate-cell {
  display: flex;
  align-items: center;
  gap: vw(6);
}

.duty-bar-bg {
  flex: 1;
  height: 4px;
  background: rgba(71, 132, 232, 0.12);
  border-radius: 2px;
  overflow: hidden;
  min-width: 0;
}

.duty-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

.duty-rate-text {
  font-family: 'Douyin Sans', sans-serif;
  font-size: clamp(7px, calc(10 * var(--min-scale)), 12px);
  font-weight: 700;
  white-space: nowrap;
}
</style>
