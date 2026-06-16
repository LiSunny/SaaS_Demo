<template>
  <div class="center-map">
    <!-- 高德地图容器 -->
    <div ref="mapContainer" class="map-container" />


    <!-- 顶部数据标签 -->
    <div class="map-label map-label-tl">
      <span class="ml-num">18</span>
      <span class="ml-text">工贸企业</span>
    </div>
    <div class="map-label map-label-tr">
      <span class="ml-num">12</span>
      <span class="ml-text">教育行业</span>
    </div>
    <div class="map-label map-label-bl">
      <span class="ml-num">8</span>
      <span class="ml-text">社区物业</span>
    </div>
    <div class="map-label map-label-br">
      <span class="ml-num">6</span>
      <span class="ml-text">其他</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const mapContainer = ref<HTMLDivElement>()
let mapInstance: any = null

// 港南区中心坐标
const CENTER = [109.605, 23.075]

// 散布点位数据（工贸企业、教育行业等点位）
const scatterPoints = [
  { lng: 109.58, lat: 23.09, type: '工贸企业' },
  { lng: 109.62, lat: 23.06, type: '工贸企业' },
  { lng: 109.57, lat: 23.05, type: '教育行业' },
  { lng: 109.63, lat: 23.08, type: '教育行业' },
  { lng: 109.59, lat: 23.04, type: '社区物业' },
  { lng: 109.61, lat: 23.10, type: '工贸企业' },
  { lng: 109.56, lat: 23.07, type: '其他' },
  { lng: 109.64, lat: 23.05, type: '教育行业' },
  { lng: 109.60, lat: 23.03, type: '社区物业' },
  { lng: 109.58, lat: 23.11, type: '工贸企业' },
  { lng: 109.63, lat: 23.09, type: '社区物业' },
  { lng: 109.55, lat: 23.06, type: '其他' },
]

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
  }
})

function initMap() {
  if (!mapContainer.value || !(window as any).AMap) return

  const AMap = (window as any).AMap

  mapInstance = new AMap.Map(mapContainer.value, {
    zoom: 13,
    center: CENTER,
    mapStyle: 'amap://styles/d09c32c3f8fe92f329d2631a674d4441',
    viewMode: '2D',
    resizeEnable: true,
    features: ['bg', 'road', 'building'],
  })

  // 添加中心标记点
  const centerMarker = new AMap.Marker({
    position: CENTER,
    content: `<div style="
      width:16px;height:16px;
      background:#3cd3d7;
      border-radius:50%;
      box-shadow:0 0 12px rgba(60,211,215,0.6);
      position:relative;top:-8px;left:-8px;
    "></div>`,
    offset: new AMap.Pixel(0, 0),
  })
  mapInstance.add(centerMarker)

  // 添加散布标记点
  scatterPoints.forEach((point) => {
    const colorMap: Record<string, string> = {
      '工贸企业': '#f59e0b',
      '教育行业': '#3b82f6',
      '社区物业': '#10b981',
      '其他': '#8b5cf6',
    }
    const color = colorMap[point.type] || '#f59e0b'

    const marker = new AMap.Marker({
      position: [point.lng, point.lat],
      content: `<div style="
        width:10px;height:10px;
        background:${color};
        border-radius:50%;
        box-shadow:0 0 8px ${color}88;
        position:relative;top:-5px;left:-5px;
      "></div>`,
      offset: new AMap.Pixel(0, 0),
    })
    mapInstance.add(marker)
  })
}
</script>

<style scoped>
.center-map {
  height: 100%;
  position: relative;
  border: 1px solid rgba(71,132,232,0.2);
  border-radius: 4px;
  background: #0a1a2e;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
}

/* ===== 数据标签 ===== */
.map-label {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(2 * var(--h));
  z-index: 10;
  pointer-events: none;
}
.map-label-tl { left: calc(20 * var(--w)); top: calc(20 * var(--h)); }
.map-label-tr { right: calc(20 * var(--w)); top: calc(20 * var(--h)); }
.map-label-bl { left: calc(20 * var(--w)); bottom: calc(20 * var(--h)); }
.map-label-br { right: calc(20 * var(--w)); bottom: calc(20 * var(--h)); }
.ml-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(20 * var(--min-scale)), 24px);
  font-weight: 700;
  color: #89b5ff;
}
.ml-text {
  font-size: clamp(7px, calc(11 * var(--min-scale)), 14px);
  color: rgba(137,181,255,0.5);
}
</style>
