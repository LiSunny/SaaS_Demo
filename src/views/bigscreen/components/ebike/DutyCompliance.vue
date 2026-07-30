<template>
  <div class="module-card" :style="{ height: vh(536) }">
    <EbikeSectionTitle title="经营主体日常履责" />
    <!-- 三 Tab 切换 -->
    <div class="tab-row">
      <button :class="['tab-btn', { active: activeTab === 'property' }]" @click="activeTab = 'property'">
        <img src="@/assets/bigscreen/icon-city.svg" alt="" class="tab-icon" />
        <span>物业主体</span>
      </button>
      <button :class="['tab-btn', { active: activeTab === 'operation' }]" @click="activeTab = 'operation'">
        <img src="@/assets/bigscreen/icon-operation.svg" alt="" class="tab-icon" />
        <span>运营主体</span>
      </button>
      <button :class="['tab-btn', { active: activeTab === 'business' }]" @click="activeTab = 'business'">
        <img src="@/assets/bigscreen/icon-school.svg" alt="" class="tab-icon" />
        <span>企事业</span>
      </button>
    </div>

    <div class="card-body">
      <!-- 履责统计：双指标卡片 -->
      <div class="compliance-stats">
        <!-- 已履责 -->
        <div class="compliance-item">
          <img src="@/assets/bigscreen/compliance-bg-done.svg" alt="" class="compliance-bg" />
          <div class="compliance-text">
            <span class="compliance-num">18<span class="compliance-unit">家</span></span>
            <span class="compliance-label">已履责企业</span>
          </div>
        </div>

        <!-- 未履责 -->
        <div class="compliance-item">
          <img src="@/assets/bigscreen/compliance-bg-undone.svg" alt="" class="compliance-bg" />
          <div class="compliance-text">
            <span class="compliance-num compliance-num--bad">3<span class="compliance-unit">家</span></span>
            <span class="compliance-label">未履责企业</span>
          </div>
        </div>
      </div>

      <!-- 实地巡检打卡排名表 -->
      <div class="rank-section">
        <div class="rank-section-title">实地巡检打卡</div>
        <div class="table-wrap">
          <div class="table-header">
            <span class="col-rank">排名</span>
            <span class="col-name">名称</span>
            <span class="col-status">履责情况</span>
          </div>
          <div v-for="(row, i) in rankData" :key="row.name" class="table-row" :class="{ 'row--done': row.status === '已履责' }">
            <span class="col-rank">{{ String(i + 1).padStart(2, '0') }}</span>
            <span class="col-name">{{ row.name }}</span>
            <span class="col-status" :class="{ 'status--bad': row.status === '未履责' }">{{ row.status }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EbikeSectionTitle from './EbikeSectionTitle.vue'

const activeTab = ref('property')
const vh = (px: number) => `calc(${px} / 1080 * 100vh)`

const rankData = [
  { name: '碧桂园城央府小区', status: '未履责' },
  { name: '港龙湾小区', status: '未履责' },
  { name: '南湖商业广场小区', status: '未履责' },
  { name: '江南郡都小区', status: '已履责' },
  { name: '中粮首府小区', status: '已履责' },
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

.tab-row {
  display: flex; gap: vw(16); padding: 0 vw(10); flex-shrink: 0;
}

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

.card-body { flex: 1; min-height: 0; padding: vw(10); display: flex; flex-direction: column; gap: vh(12); }

/* 履责双指标 */
.compliance-stats { display: flex; gap: vw(18); flex-shrink: 0; }

.compliance-item {
  flex: 1; position: relative;
}

.compliance-bg {
  width: 100%; display: block;
}

.compliance-text {
  position: absolute;
  right: vw(12); top: 50%; transform: translateY(-50%);
  display: flex; flex-direction: column; gap: vh(6);
}

.compliance-num {
  display: flex; align-items: baseline; gap: vw(9);
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(18px, calc(28 * var(--min-scale)), 28px); font-weight: 700;
  background: linear-gradient(to bottom, #ffffff, #c8e4ff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

.compliance-num--bad {
  background: linear-gradient(to bottom, #ffffff, #ff0004);
  -webkit-background-clip: text; background-clip: text;
}

.compliance-unit {
  font-size: clamp(10px, calc(16 * var(--min-scale)), 16px); font-weight: 400;
}

.compliance-label {
  font-family: 'STHeiti', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(18 * var(--min-scale)), 18px);
  background: linear-gradient(to bottom, #ffffff, #c8e4ff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

/* 排名表 */
.rank-section { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: vh(5); }
.rank-section-title {
  font-family: 'Heiti TC', sans-serif;
  font-size: clamp(14px, calc(20 * var(--min-scale)), 20px);
  color: #c2e8ff; padding: vh(10); flex-shrink: 0;
}

.table-wrap { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: vh(5); }

.table-header, .table-row {
  display: flex; gap: vw(30); padding: vh(12) vw(8);
  font-size: clamp(14px, calc(18 * var(--min-scale)), 18px);
  border-radius: 6px;
}

.table-header { color: #a8d8f0; flex-shrink: 0; }

.table-row {
  background: rgba(138,179,245,0.05); color: #ffffff;
  border: 1px solid rgba(0,153,209,0.57);
  border-top: none;
}

.col-rank { width: vw(98); text-align: center; font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif; font-weight: 700; }
.col-name { flex: 1; font-family: 'Heiti TC', sans-serif; }
.col-status { width: vw(86); text-align: center; font-family: 'Heiti TC', sans-serif; }
.status--bad { color: #fd5036; }
</style>
