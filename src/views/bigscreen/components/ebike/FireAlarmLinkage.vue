<template>
  <div class="module-card" :style="{ height: vh(530) }">
    <EbikeSectionTitle title="火灾预警点位联动" />
    <div class="tab-row">
      <button :class="['tab-btn', { active: activeTab === 'smoke' }]" @click="activeTab = 'smoke'">
        <img src="@/assets/bigscreen/icon-smoke.svg" alt="" class="tab-icon" />
        <span>烟感报警</span>
      </button>
      <button :class="['tab-btn', { active: activeTab === 'leave' }]" @click="activeTab = 'leave'">
        <img src="@/assets/bigscreen/icon-leave.svg" alt="" class="tab-icon" />
        <span>离岗报警</span>
      </button>
      <button :class="['tab-btn', { active: activeTab === 'electric' }]" @click="activeTab = 'electric'">
        <img src="@/assets/bigscreen/icon-electric.svg" alt="" class="tab-icon" />
        <span>电气报警</span>
      </button>
    </div>
    <div class="card-body">
      <div class="table-header">
        <span class="col-type">类型</span>
        <span class="col-enterprise">企业</span>
        <span class="col-time">最新告警时间</span>
        <span class="col-person">负责人</span>
      </div>
      <div v-for="row in alarmData" :key="row.time" class="table-row">
        <span class="col-type type--fire">火警</span>
        <span class="col-enterprise">{{ row.enterprise }}</span>
        <span class="col-time">{{ row.time }}</span>
        <span class="col-person">{{ row.person }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EbikeSectionTitle from './EbikeSectionTitle.vue'

const activeTab = ref('smoke')
const vh = (px: number) => `calc(${px} / 1080 * 100vh)`

const alarmData = [
  { enterprise: '盛邦木业', time: '2025-12-22 13:00:00', person: '李建' },
  { enterprise: '中粮首府', time: '2025-12-22 12:35:46', person: '王国宇' },
  { enterprise: '昌贵财富港', time: '2025-12-22 12:35:46', person: '蔡达龙' },
  { enterprise: '港龙湾', time: '2025-12-22 12:35:46', person: '刘子芮' },
  { enterprise: '昌贵财富港', time: '2025-12-22 12:35:46', person: '冯晖' },
  { enterprise: '昌贵财富港', time: '2025-12-22 12:35:46', person: '冯晖' },
  { enterprise: '昌贵财富港', time: '2025-12-22 12:35:46', person: '冯晖' },
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
    font-family: 'Alibaba PuHuiTi', sans-serif;
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

.card-body { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: vh(5); overflow-y: auto; }

.table-header, .table-row { display: flex; gap: vw(6); padding: vh(12) vw(8); border-radius: 6px; }
.table-header { color: #a8d8f0; font-size: clamp(14px, calc(18 * var(--min-scale)), 18px); flex-shrink: 0; }
.table-row {
  background: rgba(138,179,245,0.05); color: #ffffff; font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  border: 1px solid rgba(0,153,209,0.57); border-top: none;
}

.col-type { width: vw(68); text-align: center; flex-shrink: 0; }
.type--fire { color: #fd5036; font-family: 'Heiti TC', sans-serif; font-weight: 500; }
.col-enterprise { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-time { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-person { flex: 1; text-align: center; }
</style>
