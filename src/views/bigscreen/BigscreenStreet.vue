<template>
  <div class="bigscreen-street">
    <!-- 顶部导航条 -->
    <BigscreenHeader title="XX商业街安全治理专题驾驶舱" username="港南区应急管理局" />

    <!-- 内容区：自定义网格布局 -->
    <div class="street-content">
      <!-- 顶部核心指标条 -->
      <div class="grid-item grid-item--metrics">
        <StreetMetricsOverview />
      </div>

      <!-- 第一行：商户履职 | GIS地图 | 告警处置 -->
      <div class="grid-item grid-item--compliance">
        <StreetBusinessCompliance />
      </div>
      <div class="grid-item grid-item--map">
        <StreetGisMap />
      </div>
      <div class="grid-item grid-item--risk">
        <StreetRiskFocus />
      </div>

      <!-- 第二行：隐患整改 | 商铺画像 | 趋势分析 -->
      <div class="grid-item grid-item--alert-hazard">
        <StreetAlertHazard />
      </div>
      <div class="grid-item grid-item--ranking">
        <StreetShopRanking />
      </div>
      <div class="grid-item grid-item--trends">
        <StreetTrendAnalysis />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BigscreenHeader from './components/BigscreenHeader.vue'
import StreetMetricsOverview from './components/street/StreetMetricsOverview.vue'
import StreetGisMap from './components/street/StreetGisMap.vue'
import StreetRiskFocus from './components/street/StreetRiskFocus.vue'
import StreetBusinessCompliance from './components/street/StreetBusinessCompliance.vue'
import StreetAlertHazard from './components/street/StreetAlertHazard.vue'
import StreetShopRanking from './components/street/StreetShopRanking.vue'
import StreetTrendAnalysis from './components/street/StreetTrendAnalysis.vue'
</script>

<style scoped>
.bigscreen-street {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(50% 50% at 50% 50%, #015EAF 0%, #02397C 100%);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ===== 网格布局 ===== */
.street-content {
  position: absolute;
  top: calc(97 * var(--h));
  left: 0;
  right: 0;
  bottom: calc(16 * var(--h));
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto 1fr 1fr;
  gap: calc(12 * var(--h)) calc(14 * var(--w));
  padding: 0 calc(16 * var(--w));
}

/* 网格项 */
.grid-item {
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

/* 顶部指标行 */
.grid-item--metrics {
  grid-column: 1 / 4;
  grid-row: 1 / 2;
}

/* 第一行 */
.grid-item--compliance {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
}

.grid-item--map {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
}

.grid-item--risk {
  grid-column: 3 / 4;
  grid-row: 2 / 3;
}

/* 第二行 */
.grid-item--alert-hazard {
  grid-column: 1 / 2;
  grid-row: 3 / 4;
}

.grid-item--ranking {
  grid-column: 2 / 3;
  grid-row: 3 / 4;
}

.grid-item--trends {
  grid-column: 3 / 4;
  grid-row: 3 / 4;
}
</style>
