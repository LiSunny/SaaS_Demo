<template>
  <div class="center-map" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- 高德地图容器 -->
    <div ref="mapContainer" class="map-container" />

    <!-- 地图控件区 -->
    <div class="map-controls">
      <!-- 放大全屏 -->
      <button
        v-if="!isFullscreen"
        class="control-btn"
        title="放大全屏"
        @click="enterFullscreen"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      </button>
      <!-- 还原 -->
      <button
        v-else
        class="control-btn"
        title="还原"
        @click="exitFullscreen"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="4 8 4 4 8 4" />
          <polyline points="20 16 20 20 16 20" />
          <line x1="14" y1="10" x2="4" y2="4" />
          <line x1="10" y1="14" x2="20" y2="20" />
        </svg>
      </button>
    </div>

    <!-- 图例 -->
    <div class="map-legend">
      <div
        v-for="item in legendItems"
        :key="item.name"
        class="legend-item"
      >
        <img class="legend-icon" :src="item.icon" alt="" />
        <span class="legend-text">{{ item.name }}</span>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import iconGongmao from '@/assets/bigscreen/industry/gongmao.svg'
import iconJiaoyu from '@/assets/bigscreen/industry/jiaoyu.svg'
import iconShequ from '@/assets/bigscreen/industry/shequ.svg'
import iconQita from '@/assets/bigscreen/industry/qita.svg'

const mapContainer = ref<HTMLDivElement>()
let mapInstance: any = null
let infoWindow: any = null
let closeTimeout: ReturnType<typeof setTimeout> | null = null
const isFullscreen = ref(false)

// 港南区中心坐标
const CENTER = [109.605, 23.075]

// 类型配置：颜色 + 图标
const typeConfig: Record<string, { color: string; icon: string }> = {
  '工贸企业': { color: '#f59e0b', icon: iconGongmao },
  '教育行业': { color: '#3b82f6', icon: iconJiaoyu },
  '社区物业': { color: '#10b981', icon: iconShequ },
  '其他': { color: '#8b5cf6', icon: iconQita },
}

// 图例数据
const legendItems = [
  { name: '工贸企业', icon: iconGongmao },
  { name: '教育行业', icon: iconJiaoyu },
  { name: '社区物业', icon: iconShequ },
  { name: '其他', icon: iconQita },
]

// 散布点位数据（集中在贵港市港南区行政区划内）
const scatterPoints = [
  { lng: 109.596, lat: 23.081, type: '工贸企业', name: '鑫源金属制品厂', person: '张建国', phone: '138-7721-3301' },
  { lng: 109.608, lat: 23.076, type: '工贸企业', name: '华泰机械加工中心', person: '李志强', phone: '139-7852-4412' },
  { lng: 109.602, lat: 23.084, type: '工贸企业', name: '恒达建材有限公司', person: '王明辉', phone: '137-6833-5523' },
  { lng: 109.600, lat: 23.079, type: '教育行业', name: '港南区第一中学', person: '陈文博', phone: '136-7744-6634' },
  { lng: 109.610, lat: 23.082, type: '教育行业', name: '贵港市港南小学', person: '刘雅琴', phone: '135-6655-7745' },
  { lng: 109.597, lat: 23.076, type: '教育行业', name: '阳光幼儿园', person: '赵晓燕', phone: '158-7866-8856' },
  { lng: 109.604, lat: 23.077, type: '社区物业', name: '江南社区服务中心', person: '黄志远', phone: '188-7777-9967' },
  { lng: 109.598, lat: 23.083, type: '社区物业', name: '桥圩镇物业管理站', person: '周丽华', phone: '177-8888-1178' },
  { lng: 109.607, lat: 23.080, type: '社区物业', name: '新塘乡社区管委会', person: '吴国平', phone: '159-9999-2289' },
  { lng: 109.603, lat: 23.076, type: '其他', name: '港南物流中转站', person: '孙伟东', phone: '182-6611-3390' },
  { lng: 109.609, lat: 23.078, type: '其他', name: '瑞丰农资经营部', person: '郑海燕', phone: '133-7722-4401' },
  { lng: 109.595, lat: 23.080, type: '其他', name: '港南综合市场', person: '马德才', phone: '186-8833-5512' },
]

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
  }
})

function buildInfoWindowContent(point: typeof scatterPoints[number], cfg: { color: string; icon: string }) {
  return `<div class="map-tooltip">
    <div class="map-tooltip__header">
      <span class="map-tooltip__dot" style="background:${cfg.color}"></span>
      <span class="map-tooltip__name">${point.name}</span>
    </div>
    <div class="map-tooltip__body">
      <div class="map-tooltip__row">
        <span class="map-tooltip__label">责任人</span>
        <span class="map-tooltip__value">${point.person}</span>
      </div>
      <div class="map-tooltip__row">
        <span class="map-tooltip__label">联系方式</span>
        <span class="map-tooltip__value">${point.phone}</span>
      </div>
      <div class="map-tooltip__row">
        <span class="map-tooltip__label">企业归类</span>
        <span class="map-tooltip__tag" style="color:${cfg.color};border-color:${cfg.color}44;background:${cfg.color}18">${point.type}</span>
      </div>
    </div>
    <div class="map-tooltip__footer">
      <a class="map-tooltip__btn" href="javascript:void(0)">查看详情 ›</a>
    </div>
    <div class="map-tooltip__arrow"></div>
  </div>`
}



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

  // 添加比例尺控件（v2.0 需要通过 plugin 加载）
  AMap.plugin(['AMap.Scale'], () => {
    mapInstance.addControl(new AMap.Scale({
      position: 'LB',
      offset: new AMap.Pixel(10, 10),
    }))
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

  // 创建 InfoWindow
  infoWindow = new AMap.InfoWindow({
    isCustom: true,
    offset: new AMap.Pixel(0, -20),
    autoMove: true,
  })

  // 添加散布标记点
  const scatterMarkers: any[] = []
  scatterPoints.forEach((point) => {
    const cfg = typeConfig[point.type] || typeConfig['工贸企业']
    const marker = new AMap.Marker({
      position: [point.lng, point.lat],
      content: `<div style="
        width:24px;height:24px;
        background:${cfg.color}22;
        border:1.5px solid ${cfg.color};
        border-radius:50%;
        box-shadow:0 0 10px ${cfg.color}66;
        display:flex;align-items:center;justify-content:center;
        position:relative;top:-12px;left:-12px;
        cursor:pointer;
      "><img src="${cfg.icon}" style="width:14px;height:14px;object-fit:contain;"></div>`,
      offset: new AMap.Pixel(0, 0),
    })

    // 鼠标悬浮显示信息弹窗
    marker.on('mouseover', () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout)
        closeTimeout = null
      }
      const content = buildInfoWindowContent(point, cfg)
      infoWindow.setOffset(new AMap.Pixel(0, -20))
      infoWindow.setContent(content)
      infoWindow.open(mapInstance, marker.getPosition())
      // 弹窗挂载后绑定鼠标事件，保持弹窗不消失
      nextTick(() => {
        const tipEl = document.querySelector('.map-tooltip')
        if (tipEl) {
          tipEl.addEventListener('mouseenter', () => {
            if (closeTimeout) {
              clearTimeout(closeTimeout)
              closeTimeout = null
            }
          })
          tipEl.addEventListener('mouseleave', () => {
            scheduleCloseInfoWindow()
          })
        }
      })
    })
    marker.on('mouseout', () => {
      scheduleCloseInfoWindow()
    })

    mapInstance.add(marker)
    scatterMarkers.push(marker)
  })

  // 添加面图层
  // addPolygonLayer(AMap)

  // 自动调整视野，完整显示全部散点标记
  mapInstance.setFitView(scatterMarkers)
}

function scheduleCloseInfoWindow() {
  closeTimeout = setTimeout(() => {
    infoWindow.close()
    closeTimeout = null
  }, 300)
}



// 放大全屏
function enterFullscreen() {
  isFullscreen.value = true
  nextTick(() => {
    setTimeout(() => {
      mapInstance?.resize()
    }, 100)
  })
}

// 还原
function exitFullscreen() {
  isFullscreen.value = false
  nextTick(() => {
    setTimeout(() => {
      mapInstance?.resize()
    }, 100)
  })
}
</script>

<style scoped>
.center-map {
  height: 100%;
  position: relative;
  border: 1px solid rgba(71, 132, 232, 0.3);
  border-radius: 4px;
  background: #0a1a2e;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* ===== 全屏态 ===== */
.center-map.is-fullscreen {
  position: fixed;
  top: calc(97 * var(--h));
  left: 0;
  right: 0;
  bottom: calc(16 * var(--h));
  z-index: 200;
  border-radius: 0;
  border: none;
}

.map-container {
  width: 100%;
  height: 100%;
}

/* ===== 地图控件区 ===== */
.map-controls {
  position: absolute;
  top: calc(8 * var(--h));
  right: calc(8 * var(--w));
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: calc(4 * var(--h));
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(71,132,232,0.3);
  border-radius: 4px;
  background: rgba(10,26,46,0.85);
  color: #89b5ff;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.control-btn:hover {
  background: rgba(71,132,232,0.25);
  border-color: rgba(71,132,232,0.6);
  color: #3cd3d7;
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
  font-size: clamp(7px, calc(11 * var(--min-scale)), 16px);
  color: rgba(137,181,255,0.5);
}

/* ===== 图例 ===== */
.map-legend {
  position: absolute;
  top: calc(8 * var(--h));
  left: calc(8 * var(--w));
  height: 28px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: calc(8 * var(--w));
  padding: 0 calc(8 * var(--w));
  background: rgba(10,26,46,0.92);
  border: 1px solid rgba(71,132,232,0.4);
  border-radius: 4px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: calc(4 * var(--w));
}

.legend-icon {
  width: calc(18 * var(--min-scale));
  height: calc(18 * var(--min-scale));
  flex-shrink: 0;
  object-fit: contain;
}

.legend-text {
  font-size: clamp(14px, calc(16 * var(--min-scale)), 18px);
  color: rgba(255,255,255,0.95);
  font-weight: 500;
  white-space: nowrap;
}


</style>

<!-- InfoWindow 挂载在 body 下，scoped 样式无法命中，故使用全局样式 -->
<style>
.map-tooltip {
  min-width: 200px;
  background: linear-gradient(135deg, rgba(13,33,55,0.98) 0%, rgba(8,22,42,0.98) 100%);
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

.map-tooltip::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(60, 211, 215, 0.4), transparent);
}

.map-tooltip__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px 9px;
  border-bottom: 1px solid rgba(60, 211, 215, 0.18);
  background: linear-gradient(180deg, rgba(60, 211, 215, 0.08) 0%, transparent 100%);
}

.map-tooltip__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 10px currentColor;
}

.map-tooltip__name {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.4px;
  text-shadow: 0 1px 4px rgba(0,0,0,0.35);
}

.map-tooltip__body {
  padding: 11px 14px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.map-tooltip__row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.map-tooltip__label {
  flex-shrink: 0;
  width: 56px;
  font-size: 12px;
  color: #89b5ff;
  font-weight: 500;
}

.map-tooltip__value {
  font-size: 13px;
  color: #f0f4fa;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(0,0,0,0.25);
}

.map-tooltip__tag {
  display: inline-block;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  border: 1px solid;
  line-height: 1.55;
  font-weight: 600;
}

.map-tooltip__footer {
  padding: 8px 14px 11px;
  border-top: 1px solid rgba(60, 211, 215, 0.15);
  text-align: right;
  background: linear-gradient(0deg, rgba(60, 211, 215, 0.05) 0%, transparent 100%);
}

.map-tooltip__btn {
  font-size: 13px;
  color: #3cd3d7 !important;
  text-decoration: none !important;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.25s ease;
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  text-shadow: 0 0 12px rgba(60,211,215,0.4) !important;
}

.map-tooltip__btn:hover {
  color: #6ef0f4 !important;
  text-shadow: 0 0 16px rgba(110,240,244,0.6), 0 0 30px rgba(60,211,215,0.3) !important;
  transform: translateX(2px);
}

.map-tooltip__arrow {
  position: absolute;
  bottom: -7px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, rgba(13,33,55,0.98) 0%, rgba(8,22,42,0.98) 100%);
  border-right: 1px solid rgba(60, 211, 215, 0.5);
  border-bottom: 1px solid rgba(60, 211, 215, 0.5);
  box-shadow: 4px 4px 8px rgba(0,0,0,0.15);
}

/* ===== 示范街文字标注 ===== */
.street-label-text {
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 6px;
  white-space: nowrap;
  text-shadow: 0 1px 4px rgba(0,0,0,0.6), 0 0 10px rgba(60,211,215,0.3);
  cursor: pointer;
  pointer-events: none;
  transform: translate(-50%,-50%) rotate(-32deg) translateY(-12px);
  transition: text-shadow 0.3s ease;
}
.street-label-text:hover {
  text-shadow: 0 0 16px rgba(60,211,215,0.7), 0 0 30px rgba(60,211,215,0.4), 0 1px 4px rgba(0,0,0,0.6);
}

/* ===== 示范街悬浮弹窗 ===== */
.street-hover-tooltip {
  min-width: 280px;
  background: linear-gradient(135deg, rgba(13,33,55,0.98) 0%, rgba(8,22,42,0.98) 100%);
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

.street-hover-tooltip::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(60, 211, 215, 0.4), transparent);
}

.street-hover-tooltip__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px 9px;
  border-bottom: 1px solid rgba(60, 211, 215, 0.18);
  background: linear-gradient(180deg, rgba(60, 211, 215, 0.1) 0%, transparent 100%);
}

.street-hover-tooltip__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.street-hover-tooltip__name {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 2px;
  text-shadow: 0 1px 4px rgba(0,0,0,0.35);
}

.street-hover-tooltip__body {
  padding: 12px 14px;
}

.street-hover-tooltip__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.street-hover-tooltip__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  background: rgba(60, 211, 215, 0.06);
  border: 1px solid rgba(60, 211, 215, 0.12);
  border-radius: 6px;
  gap: 4px;
}

.street-hover-tooltip__stat--danger {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.3);
}

.street-hover-tooltip__stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #3cd3d7;
  line-height: 1.2;
  text-shadow: 0 0 8px rgba(60, 211, 215, 0.4);
}

.street-hover-tooltip__stat--danger .street-hover-tooltip__stat-value {
  color: #f59e0b;
  text-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}

.street-hover-tooltip__stat-label {
  font-size: 11px;
  color: #89b5ff;
  font-weight: 400;
  text-align: center;
  line-height: 1.3;
}

.street-hover-tooltip__stat--danger .street-hover-tooltip__stat-label {
  color: #f59e0b;
}

.street-hover-tooltip__footer {
  padding: 8px 14px 11px;
  border-top: 1px solid rgba(60, 211, 215, 0.15);
  text-align: right;
  background: linear-gradient(0deg, rgba(60, 211, 215, 0.05) 0%, transparent 100%);
}

.street-hover-tooltip__btn {
  font-size: 13px;
  color: #3cd3d7 !important;
  text-decoration: none !important;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.25s ease;
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  text-shadow: 0 0 12px rgba(60,211,215,0.4) !important;
}

.street-hover-tooltip__btn:hover {
  color: #6ef0f4 !important;
  text-shadow: 0 0 16px rgba(110,240,244,0.6), 0 0 30px rgba(60,211,215,0.3) !important;
  transform: translateX(2px);
}

.street-hover-tooltip__arrow {
  position: absolute;
  bottom: -7px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, rgba(13,33,55,0.98) 0%, rgba(8,22,42,0.98) 100%);
  border-right: 1px solid rgba(60, 211, 215, 0.5);
  border-bottom: 1px solid rgba(60, 211, 215, 0.5);
  box-shadow: 4px 4px 8px rgba(0,0,0,0.15);
}
</style>
