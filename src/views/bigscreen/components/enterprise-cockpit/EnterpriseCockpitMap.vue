<template>
  <div class="ec-map">
    <!-- 高德地图容器 -->
    <div ref="mapContainer" class="ec-map-canvas" />

    <!-- 全屏切换按钮 -->
    <div class="ec-map-controls">
      <button class="ec-control-btn" title="放大全屏" @click="toggleFullscreen">
        <svg v-if="!isFullscreen" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="4 8 4 4 8 4" />
          <polyline points="20 16 20 20 16 20" />
          <line x1="14" y1="10" x2="4" y2="4" />
          <line x1="10" y1="14" x2="20" y2="20" />
        </svg>
      </button>
    </div>

    <!-- 图例 -->
    <div class="ec-map-legend">
      <div v-for="item in legendItems" :key="item.label" class="ec-legend-item">
        <span class="ec-legend-dot" :style="{ background: item.color }"></span>
        <span class="ec-legend-text">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

/* ===== 类型定义 ===== */
interface EnterprisePoint {
  lng: number
  lat: number
  name: string
  person: string
  type: string
  riskLevel: 'high' | 'medium' | 'low' | 'normal'
}

interface RiskConfig {
  color: string
  label: string
}

/* ===== 高德地图实例 ===== */
const mapContainer = ref<HTMLDivElement | null>(null)
const isFullscreen = ref(false)
let mapInstance: any = null
let infoWindow: any = null
let closeTimeout: ReturnType<typeof setTimeout> | null = null
let scatterMarkers: any[] = []

// 泉州市中心坐标
const CENTER: [number, number] = [118.589, 24.908]

// 风险等级配置（匹配 Figma 设计稿颜色）
const riskConfig: Record<string, RiskConfig> = {
  high:    { color: '#ff0000', label: '重大风险' },
  medium:  { color: '#fe9100', label: '中等风险' },
  low:     { color: '#feeb00', label: '低风险' },
  normal:  { color: '#00a5fe', label: '正常' },
}

const legendItems = [
  { color: '#00a5fe', label: '正常' },
  { color: '#feeb00', label: '低风险' },
  { color: '#fe9100', label: '中等风险' },
  { color: '#ff0000', label: '重大风险' },
]

// 泉州市辖区企业点位
const enterprises: EnterprisePoint[] = [
  { lng: 118.612, lat: 24.918, name: '泉州热电', person: '陈志强', type: '规上企业', riskLevel: 'normal' },
  { lng: 118.575, lat: 24.895, name: '匹克集团', person: '许景南', type: '规上企业', riskLevel: 'normal' },
  { lng: 118.630, lat: 24.880, name: '安踏体育', person: '丁世忠', type: '规上企业', riskLevel: 'normal' },
  { lng: 118.550, lat: 24.930, name: '泉州石化', person: '李明辉', type: '规上企业', riskLevel: 'high' },
  { lng: 118.595, lat: 24.860, name: '恒安集团', person: '许连捷', type: '规上企业', riskLevel: 'low' },
  { lng: 118.650, lat: 24.910, name: '南益纺织', person: '黄少波', type: '规下企业', riskLevel: 'medium' },
  { lng: 118.530, lat: 24.950, name: '达利食品', person: '许世辉', type: '规上企业', riskLevel: 'normal' },
  { lng: 118.615, lat: 24.850, name: '福炼化工厂', person: '王建国', type: '规上企业', riskLevel: 'high' },
  { lng: 118.560, lat: 24.885, name: '泉州燃气', person: '张志伟', type: '规上企业', riskLevel: 'medium' },
  { lng: 118.640, lat: 24.940, name: '利郎集团', person: '王冬星', type: '规下企业', riskLevel: 'low' },
  { lng: 118.580, lat: 24.870, name: '特步集团', person: '丁水波', type: '规上企业', riskLevel: 'normal' },
  { lng: 118.510, lat: 24.920, name: '九牧厨卫', person: '林孝发', type: '规上企业', riskLevel: 'low' },
]

/* ===== 信息弹窗 HTML（全局样式命中） ===== */
function buildInfoContent(p: EnterprisePoint, cfg: RiskConfig): string {
  return `<div class="ec-tooltip">
    <div class="ec-tooltip__header">
      <span class="ec-tooltip__dot" style="background:${cfg.color}"></span>
      <span class="ec-tooltip__name">${p.name}</span>
    </div>
    <div class="ec-tooltip__body">
      <div class="ec-tooltip__row">
        <span class="ec-tooltip__label">企业类型</span>
        <span class="ec-tooltip__value">${p.type}</span>
      </div>
      <div class="ec-tooltip__row">
        <span class="ec-tooltip__label">负责人</span>
        <span class="ec-tooltip__value">${p.person}</span>
      </div>
      <div class="ec-tooltip__row">
        <span class="ec-tooltip__label">风险等级</span>
        <span class="ec-tooltip__tag" style="color:${cfg.color};border-color:${cfg.color}44;background:${cfg.color}18">${cfg.label}</span>
      </div>
    </div>
    <div class="ec-tooltip__footer">
      <a class="ec-tooltip__btn" href="javascript:void(0)">查看详情 ›</a>
    </div>
    <div class="ec-tooltip__arrow"></div>
  </div>`
}

/* ===== 地图初始化 ===== */
function initMap() {
  if (!mapContainer.value || !(window as any).AMap) return

  const AMap = (window as any).AMap

  mapInstance = new AMap.Map(mapContainer.value, {
    zoom: 12,
    center: CENTER,
    mapStyle: 'amap://styles/d09c32c3f8fe92f329d2631a674d4441',
    viewMode: '2D',
    resizeEnable: true,
    features: ['bg', 'road', 'building'],
  })

  // 比例尺控件
  AMap.plugin(['AMap.Scale'], () => {
    mapInstance.addControl(new AMap.Scale({ position: 'LB', offset: new AMap.Pixel(10, 10) }))
  })

  // 中心标记点
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

  // InfoWindow
  infoWindow = new AMap.InfoWindow({
    isCustom: true,
    offset: new AMap.Pixel(0, -20),
    autoMove: true,
  })

  // 企业标注点
  scatterMarkers = []
  enterprises.forEach((p) => {
    const cfg = riskConfig[p.riskLevel] || riskConfig.normal
    const marker = new AMap.Marker({
      position: [p.lng, p.lat],
      content: `<div style="
        width:24px;height:24px;
        background:${cfg.color}22;
        border:1.5px solid ${cfg.color};
        border-radius:50%;
        box-shadow:0 0 10px ${cfg.color}66;
        display:flex;align-items:center;justify-content:center;
        position:relative;top:-12px;left:-12px;
        cursor:pointer;
      "><div style="width:10px;height:10px;border-radius:50%;background:${cfg.color};"></div></div>`,
      offset: new AMap.Pixel(0, 0),
    })

    marker.on('mouseover', () => {
      if (closeTimeout) { clearTimeout(closeTimeout); closeTimeout = null }
      infoWindow.setOffset(new AMap.Pixel(0, -20))
      infoWindow.setContent(buildInfoContent(p, cfg))
      infoWindow.open(mapInstance, marker.getPosition())
      nextTick(() => {
        const el = document.querySelector('.ec-tooltip')
        if (el) {
          el.addEventListener('mouseenter', () => {
            if (closeTimeout) { clearTimeout(closeTimeout); closeTimeout = null }
          })
          el.addEventListener('mouseleave', () => scheduleClose())
        }
      })
    })
    marker.on('mouseout', () => scheduleClose())

    mapInstance.add(marker)
    scatterMarkers.push(marker)
  })

  mapInstance.setFitView(scatterMarkers)
}

function scheduleClose() {
  closeTimeout = setTimeout(() => {
    infoWindow.close()
    closeTimeout = null
  }, 300)
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  nextTick(() => {
    setTimeout(() => mapInstance?.resize(), 100)
  })
}

onMounted(() => initMap())

onBeforeUnmount(() => {
  if (closeTimeout) clearTimeout(closeTimeout)
  if (mapInstance) { mapInstance.destroy(); mapInstance = null }
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.ec-map {
  flex: 1;
  min-height: 0;
  position: relative;
  border: 1px solid rgba(71, 132, 232, 0.3);
  border-radius: 4px;
  background: #0a1a2e;
  overflow: hidden;
}

.ec-map-canvas {
  width: 100%;
  height: 100%;
}

/* ===== 全屏按钮 ===== */
.ec-map-controls {
  position: absolute;
  top: vh(8);
  right: vw(8);
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: vh(4);
}

.ec-control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(71, 132, 232, 0.3);
  border-radius: 4px;
  background: rgba(10, 26, 46, 0.85);
  color: #89b5ff;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);

  &:hover {
    background: rgba(71, 132, 232, 0.25);
    border-color: rgba(71, 132, 232, 0.6);
    color: #3cd3d7;
  }
}

/* ===== 图例 ===== */
.ec-map-legend {
  position: absolute;
  top: vh(8);
  left: vw(8);
  height: 28px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: vw(8);
  padding: 0 vw(8);
  background: rgba(10, 26, 46, 0.92);
  border: 1px solid rgba(71, 132, 232, 0.4);
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

.ec-legend-item {
  display: flex;
  align-items: center;
  gap: vw(4);
}

.ec-legend-dot {
  width: calc(10 * var(--min-scale));
  height: calc(10 * var(--min-scale));
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}

.ec-legend-text {
  font-size: clamp(10px, calc(12 * var(--min-scale)), 14px);
  color: rgba(255, 255, 255, 0.85);
  font-weight: 500;
  white-space: nowrap;
}
</style>

<!-- InfoWindow 弹窗全局样式（挂载在 body 下，scoped 无法命中） -->
<style lang="scss">
.ec-tooltip {
  min-width: 180px;
  background: linear-gradient(135deg, rgba(13, 33, 55, 0.98) 0%, rgba(8, 22, 42, 0.98) 100%);
  border: 1px solid rgba(60, 211, 215, 0.5);
  border-radius: 8px;
  padding: 0;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.6),
    0 0 20px rgba(60, 211, 215, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #eef3fa;
  font-size: 13px;
  line-height: 1.6;
  position: relative;
  overflow: hidden;
}

.ec-tooltip::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(60, 211, 215, 0.4), transparent);
}

.ec-tooltip__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px 9px;
  border-bottom: 1px solid rgba(60, 211, 215, 0.18);
  background: linear-gradient(180deg, rgba(60, 211, 215, 0.08) 0%, transparent 100%);
}

.ec-tooltip__dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 10px currentColor;
}

.ec-tooltip__name {
  font-size: 14px; font-weight: 700;
  color: #fff; white-space: nowrap;
  letter-spacing: 0.4px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}

.ec-tooltip__body {
  padding: 11px 14px;
  display: flex; flex-direction: column;
  gap: 9px;
}

.ec-tooltip__row {
  display: flex; align-items: center;
  gap: 10px;
}

.ec-tooltip__label {
  flex-shrink: 0; width: 56px;
  font-size: 12px; color: #89b5ff;
  font-weight: 500;
}

.ec-tooltip__value {
  font-size: 13px; color: #f0f4fa;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

.ec-tooltip__tag {
  display: inline-block;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  border: 1px solid;
  font-weight: 500;
}

.ec-tooltip__footer {
  padding: 9px 14px 11px;
  border-top: 1px solid rgba(60, 211, 215, 0.12);
  display: flex; justify-content: flex-end;
}

.ec-tooltip__btn {
  font-size: 12px; color: #3cd3d7;
  text-decoration: none; font-weight: 500;
  &:hover { color: #5ee8ec; }
}

.ec-tooltip__arrow {
  position: absolute;
  bottom: -6px; left: 50%;
  transform: translateX(-50%);
  width: 10px; height: 10px;
  background: linear-gradient(135deg, rgba(13, 33, 55, 0.98) 0%, rgba(8, 22, 42, 0.98) 100%);
  border-right: 1px solid rgba(60, 211, 215, 0.5);
  border-bottom: 1px solid rgba(60, 211, 215, 0.5);
  transform: translateX(-50%) rotate(45deg);
}
</style>
