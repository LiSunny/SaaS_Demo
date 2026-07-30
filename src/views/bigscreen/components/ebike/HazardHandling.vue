<template>
  <div class="module-card" :style="{ height: vh(260) }">
    <EbikeSectionTitle title="自查隐患运维处置" />
    <div class="tab-row">
      <button :class="['tab-btn', { active: activeTab === 'hazard' }]" @click="activeTab = 'hazard'">
        <img src="@/assets/bigscreen/icon-school.svg" alt="" class="tab-icon" />
        <span>隐患整改</span>
      </button>
      <button :class="['tab-btn', { active: activeTab === 'maintenance' }]" @click="activeTab = 'maintenance'">
        <img src="@/assets/bigscreen/icon-city.svg" alt="" class="tab-icon" />
        <span>运营保养</span>
      </button>
    </div>
    <div class="card-body">
      <div class="table-header">
        <span class="col-enterprise">企业</span>
        <span class="col-count">未整改隐患</span>
        <span class="col-person">负责人</span>
      </div>
      <div v-for="row in data" :key="row.name" class="table-row">
        <span class="col-enterprise">{{ row.name }}</span>
        <span class="col-count">{{ row.count }}</span>
        <span class="col-person">{{ row.person }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EbikeSectionTitle from './EbikeSectionTitle.vue'

const activeTab = ref('hazard')
const vh = (px: number) => `calc(${px} / 1080 * 100vh)`

const data = [
  { name: '盛邦木业', count: 10, person: '李建（17700000000）' },
  { name: '中粮首府', count: 8, person: '王国宇（13234879023）' },
  { name: '昌贵财富港', count: 6, person: '蔡达龙（15689730678）' },
  { name: '港龙湾', count: 4, person: '刘子芮（15600789241）' },
  { name: '昌贵财富港', count: 2, person: '冯晖（13600789073）' },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.module-card {
  display: flex; flex-direction: column; gap: vh(16);
  overflow: hidden;
  background: rgba(0, 80, 140, 0.45);
  border: 1px solid rgba(0, 152, 230, 0.2);
  border-radius: 4px;
  padding: vh(10) vw(10);
}

.tab-row { display: flex; gap: vw(16); padding: 0 vw(10); flex-shrink: 0; }

.tab-btn {
  display: flex; flex: 1; align-items: center; justify-content: center; gap: vw(10);
  padding: vh(8) 0; border-radius: 4px; cursor: pointer;
  background: transparent;
  border: 1px solid rgba(128, 209, 253, 0.3);
  transition: background 0.2s, border-color 0.2s;

  > span {
    font-family: 'STHeiti', 'Alibaba PuHuiTi', sans-serif;
    font-size: clamp(14px, calc(20 * var(--min-scale)), 20px); font-weight: 400;
    background: linear-gradient(to bottom, #ffffff, #c8e4ff);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
}

.tab-btn:not(.active) > span {
  opacity: 0.45;
}

.tab-btn.active {
  background: linear-gradient(to top, rgba(128,209,253,0.15) 0%, rgba(77,125,151,0.15) 100%);
  border-color: transparent;
}
.tab-icon { width: vw(24); height: vw(24); opacity: 0.8; }

.card-body { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: vh(5); overflow-y: auto; padding: 0 vw(10); }

.table-header, .table-row { display: flex; gap: vw(6); padding: vh(12) vw(8); border-radius: 6px; }
.table-header { color: #a8d8f0; font-size: clamp(14px, calc(18 * var(--min-scale)), 18px); flex-shrink: 0; }
.table-row {
  background: rgba(138,179,245,0.05); color: #ffffff; font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  border: 1px solid rgba(0,153,209,0.57); border-top: none;
  :nth-child(2) { overflow: hidden; text-overflow: ellipsis; }
}

.col-enterprise { width: vw(148); flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-count { width: vw(108); flex-shrink: 0; }
.col-person { flex: 1; }
</style>
