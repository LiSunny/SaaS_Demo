<!--
  CampusMonitorMap
  中央地图区（高德 2D + 暗色主题 + 3 个学校点位）
  设计稿节点：666:3551（地图容器）、666:3553（点位）、678:2998（区域下拉）
-->
<template>
  <div class="cm-map">
    <!-- 高德地图容器 -->
    <div ref="mapContainer" class="cm-map__container" />

    <!-- 区域下拉（仅 UI，不做真实地址切换） -->
    <div class="cm-map__region">
      <span class="cm-map__region-text">{{ currentRegion }}</span>
      <img class="cm-map__region-arrow" src="/campus-monitor/icons/dropdown-down.svg" alt="" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const mapContainer = ref<HTMLDivElement>()
let mapInstance: any = null

// 海港区中心（秦皇岛市）
const CENTER: [number, number] = [119.610, 39.940]

// 3 个学校点位（demo 经纬度）
const SCHOOLS = [
  { lng: 119.602, lat: 39.945, name: '小学', key: 'primary' },
  { lng: 119.610, lat: 39.928, name: '初中', key: 'middle' },
  { lng: 119.628, lat: 39.940, name: '高中', key: 'high' },
]

const currentRegion = ref<string>('河北省/秦皇岛市/海港区')

onMounted(() => {
  // AMap 由 index.html 全局加载（CDN + securityJsCode）
  initMap()
})

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
  }
})

function buildSchoolMarker(name: string) {
  // 双圆 + 中心文字（对齐 Figma marker）
  return `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);cursor:pointer;">
      <div style="
        width:32px;height:32px;border-radius:50%;
        background:#ffffff;
        border:2px solid #4dabff;
        box-shadow:0 0 10px rgba(77,171,255,0.4);
        display:flex;align-items:center;justify-content:center;
      ">
        <div style="
          width:26px;height:26px;border-radius:50%;
          background:radial-gradient(circle, #ffffff 0%, #d6ecff 100%);
          display:flex;align-items:center;justify-content:center;
          font-family:'Milibus','Source-KeynoteartHans',sans-serif;
          font-size:16px;font-style:italic;font-weight:600;
          color:#0f399a;
        ">${name}</div>
      </div>
      <div style="
        width:0;height:0;
        border-left:10px solid transparent;
        border-right:10px solid transparent;
        border-top:13px solid #ffffff;
        margin-top:-2px;
        filter:drop-shadow(0 2px 2px rgba(0,60,140,0.3));
      "></div>
    </div>
  `
}

function initMap() {
  if (!mapContainer.value || !(window as any).AMap) return

  const AMap = (window as any).AMap

  mapInstance = new AMap.Map(mapContainer.value, {
    zoom: 13,
    center: CENTER,
    mapStyle: 'amap://styles/349dd62f0c95fd4de6fae2e8e043966b',
    viewMode: '2D',
    resizeEnable: true,
    features: ['bg', 'road', 'building'],
  })

  // 添加 3 个学校点位
  SCHOOLS.forEach((s) => {
    const marker = new AMap.Marker({
      position: [s.lng, s.lat],
      content: buildSchoolMarker(s.name),
      offset: new AMap.Pixel(0, 0),
    })
    mapInstance.add(marker)
  })

  // 自适应视野
  // mapInstance.setFitView()  // 学校点位较近，可不用
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./campus-monitor-common.scss" as *;

.cm-map {
  position: relative;
  width: 100%; height: 100%;
  /* 地图满屏铺底，无需圆角 */
  overflow: hidden;
}

.cm-map__container {
  width: 100%; height: 100%;
  background: #002a45;
}

/* ===== 区域下拉 ===== */
.cm-map__region {
  position: absolute;
  left: vw(1199);  // 设计稿绝对坐标：地图满屏后无需再减中列偏移
  top: vh(15);
  width: vw(291); height: vh(36);
  display: flex; align-items: center; justify-content: center;
  padding: 0 vw(8);
  background: $cm-bg-primary;
  border: 1px solid $cm-border-primary;
  border-radius: 4px;
  z-index: 10;

  &-text {
    flex: 1;
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 16px;
    color: $cm-text-primary;
    line-height: normal;
  }

  &-arrow {
    width: vh(20); height: vh(20);
    transform: rotate(-90deg);
    flex-shrink: 0;
  }
}
</style>