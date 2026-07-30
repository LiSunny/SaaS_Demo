<template>
  <div class="map-area">
    <div ref="mapContainer" class="map-container" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import markerYellow from '@/assets/bigscreen/marker-yellow.svg'
import markerBlue from '@/assets/bigscreen/marker-blue.svg'
import markerRed from '@/assets/bigscreen/marker-red.svg'
import markerOrange from '@/assets/bigscreen/marker-orange.svg'

const mapContainer = ref<HTMLDivElement>()
let mapInstance: any = null

const CENTER: [number, number] = [109.605, 23.075]

interface MarkerDef {
  lng: number; lat: number; name: string
  bg: string; border: string; accent: string; dotSrc: string
}

const markers: MarkerDef[] = [
  { lng: 109.598, lat: 23.082, name: '昌贵财富港', bg: 'rgba(198,152,0,0.76)', border: '#ffcf91', accent: '#fede00', dotSrc: markerOrange },
  { lng: 109.594, lat: 23.072, name: '港龙湾', bg: 'rgba(214,37,10,0.76)', border: '#ffb6b7', accent: '#ff0000', dotSrc: markerRed },
  { lng: 109.608, lat: 23.070, name: '中粮首府', bg: 'rgba(59,139,6,0.76)', border: '#daffbf', accent: '#50fe00', dotSrc: markerYellow },
  { lng: 109.615, lat: 23.078, name: '南湖小区', bg: 'rgba(0,65,171,0.76)', border: '#86d1ff', accent: '#00a5fe', dotSrc: markerBlue },
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
    zoom: 14,
    center: CENTER,
    mapStyle: 'amap://styles/d09c32c3f8fe92f329d2631a674d4441',
    viewMode: '2D',
    resizeEnable: true,
  })

  // 添加标记点
  markers.forEach((m) => {
    const marker = new AMap.Marker({
      position: [m.lng, m.lat],
      // 自定义内容：标签 + 圆点（对齐 Figma 定位标题 + 定位点/黄）
      content: `
        <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
          <div style="
            position:relative;
            background:${m.bg};
            border:1px solid ${m.border};
            height:26px;width:126px;
            display:flex;align-items:center;justify-content:center;
            margin-bottom:4px;
          ">
            <div style="position:absolute;left:0;top:7px;width:2.65px;height:12px;background:${m.accent};"></div>
            <div style="position:absolute;right:0;top:7px;width:2.65px;height:12px;background:${m.accent};"></div>
            <span style="font-family:'Source-KeynoteartHans',sans-serif;font-size:12px;color:#fff;letter-spacing:2.24px;">${m.name}</span>
          </div>
          <img src="${m.dotSrc}" style="width:30px;height:30px;display:block;" />
        </div>
      `,
      offset: new AMap.Pixel(0, 0),
    })
    mapInstance.add(marker)
  })
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.map-area {
  flex: 1; min-height: 0;
  background: rgba(0, 80, 140, 0.45);
  border: 1px solid rgba(0, 152, 230, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.map-container {
  width: 100%; height: 100%;
}
</style>
