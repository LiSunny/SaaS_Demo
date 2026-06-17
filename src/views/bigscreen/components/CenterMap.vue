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

    <!-- 示范街专题弹窗（独立弹窗，Teleport 到 body） -->
    <Teleport to="body">
      <Transition name="street-modal">
        <div v-if="showStreetPanel" class="street-overlay" @click.self="showStreetPanel = false">
          <div class="street-modal">
            <!-- 标题栏 -->
            <div class="street-modal__header">
              <BigscreenModuleTitle title="示范街专题" subtitle="Demonstration Street" />
              <button class="street-modal__close" @click="showStreetPanel = false">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <!-- 内容区 -->
            <div class="street-modal__body">
              <div
                v-for="merchant in merchantList"
                :key="merchant.name"
                class="merchant-card"
              >
                <div class="merchant-card__name">{{ merchant.name }}</div>
                <div class="merchant-card__grid">
                  <div class="category-block" data-cat="monitor">
                    <div class="category-block__title">设备监测</div>
                    <div class="category-block__items">
                      <span class="category-block__item">{{ merchant.monitor.smokeStatus }}</span>
                      <span class="category-block__item">{{ merchant.monitor.deviceLedger }}</span>
                      <span class="category-block__item">{{ merchant.monitor.deviceMgmt }}</span>
                    </div>
                  </div>
                  <div class="category-block" data-cat="duty">
                    <div class="category-block__title">履责管理</div>
                    <div class="category-block__items">
                      <span class="category-block__item">{{ merchant.duty.cardDef }}</span>
                      <span class="category-block__item">{{ merchant.duty.clockIn }}</span>
                      <span class="category-block__item">{{ merchant.duty.hazardReport }}</span>
                    </div>
                  </div>
                  <div class="category-block" data-cat="alarm">
                    <div class="category-block__title">告警处置</div>
                    <div class="category-block__items">
                      <span class="category-block__item">{{ merchant.alarm.alarmGen }}</span>
                      <span class="category-block__item">{{ merchant.alarm.alarmPush }}</span>
                      <span class="category-block__item">{{ merchant.alarm.disposeTrack }}</span>
                    </div>
                  </div>
                  <div class="category-block" data-cat="stats">
                    <div class="category-block__title">统计评估</div>
                    <div class="category-block__items">
                      <span class="category-block__item">{{ merchant.stats.dutyAnalysis }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import BigscreenModuleTitle from './BigscreenModuleTitle.vue'
import geoData from '@/assets/geojson/gannanstree.geojson'
import iconGongmao from '@/assets/bigscreen/industry/gongmao.svg'
import iconJiaoyu from '@/assets/bigscreen/industry/jiaoyu.svg'
import iconShequ from '@/assets/bigscreen/industry/shequ.svg'
import iconQita from '@/assets/bigscreen/industry/qita.svg'

const mapContainer = ref<HTMLDivElement>()
let mapInstance: any = null
let infoWindow: any = null
let closeTimeout: ReturnType<typeof setTimeout> | null = null
const isFullscreen = ref(false)
const showStreetPanel = ref(false)

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

// 示范街商户数据
interface MerchantData {
  name: string
  monitor: { smokeStatus: string; deviceLedger: string; deviceMgmt: string }
  duty: { cardDef: string; clockIn: string; hazardReport: string }
  alarm: { alarmGen: string; alarmPush: string; disposeTrack: string }
  stats: { dutyAnalysis: string }
}

const merchantList: MerchantData[] = [
  {
    name: '鑫源金属制品厂',
    monitor: { smokeStatus: '正常(8/8)', deviceLedger: '设备 12 台', deviceMgmt: '在线率 100%' },
    duty: { cardDef: '已定义 5 项', clockIn: '本月 28/30', hazardReport: '待处理 1 项' },
    alarm: { alarmGen: '本月 3 次', alarmPush: '推送率 100%', disposeTrack: '已处置 3/3' },
    stats: { dutyAnalysis: '履职率 93%' },
  },
  {
    name: '华泰机械加工中心',
    monitor: { smokeStatus: '正常(6/6)', deviceLedger: '设备 9 台', deviceMgmt: '在线率 89%' },
    duty: { cardDef: '已定义 4 项', clockIn: '本月 26/30', hazardReport: '待处理 2 项' },
    alarm: { alarmGen: '本月 5 次', alarmPush: '推送率 80%', disposeTrack: '已处置 4/5' },
    stats: { dutyAnalysis: '履职率 87%' },
  },
  {
    name: '港南区第一中学',
    monitor: { smokeStatus: '正常(14/14)', deviceLedger: '设备 22 台', deviceMgmt: '在线率 95%' },
    duty: { cardDef: '已定义 6 项', clockIn: '本月 30/30', hazardReport: '无待处理' },
    alarm: { alarmGen: '本月 1 次', alarmPush: '推送率 100%', disposeTrack: '已处置 1/1' },
    stats: { dutyAnalysis: '履职率 100%' },
  },
  {
    name: '江南社区服务中心',
    monitor: { smokeStatus: '正常(10/10)', deviceLedger: '设备 16 台', deviceMgmt: '在线率 94%' },
    duty: { cardDef: '已定义 5 项', clockIn: '本月 29/30', hazardReport: '待处理 0 项' },
    alarm: { alarmGen: '本月 2 次', alarmPush: '推送率 100%', disposeTrack: '已处置 2/2' },
    stats: { dutyAnalysis: '履职率 97%' },
  },
  {
    name: '港南综合市场',
    monitor: { smokeStatus: '异常(9/11)', deviceLedger: '设备 18 台', deviceMgmt: '在线率 78%' },
    duty: { cardDef: '已定义 5 项', clockIn: '本月 22/30', hazardReport: '待处理 4 项' },
    alarm: { alarmGen: '本月 8 次', alarmPush: '推送率 75%', disposeTrack: '已处置 5/8' },
    stats: { dutyAnalysis: '履职率 73%' },
  },
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
  addPolygonLayer(AMap)

  // 自动调整视野，完整显示全部散点标记
  mapInstance.setFitView(scatterMarkers)
}

function scheduleCloseInfoWindow() {
  closeTimeout = setTimeout(() => {
    infoWindow.close()
    closeTimeout = null
  }, 300)
}

function addPolygonLayer(AMap: any) {
  const features = (geoData as any).features
  if (!features || !features.length) return

  features.forEach((feature: any) => {
    const { geometry } = feature
    if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      const coords = geometry.type === 'Polygon'
        ? [geometry.coordinates]
        : geometry.coordinates

      coords.forEach((polygonCoords: any[]) => {
        polygonCoords.forEach((ring: any[]) => {
          const path = ring.map((c: number[]) => new AMap.LngLat(c[0], c[1]))
          const polygon = new AMap.Polygon({
            path,
            strokeColor: '#30C8D3',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            strokeStyle: 'dashed',
            strokeDasharray: [6, 4],
            fillColor: '#30C8D3',
            fillOpacity: 0.35,
          })
          mapInstance.add(polygon)

          // 在面中心添加文字标注（用 Marker + HTML 替代 AMap.Text，无需额外加载插件）
          if (path.length > 0) {
            const totalLng = path.reduce((s: number, p: any) => s + p.lng, 0)
            const totalLat = path.reduce((s: number, p: any) => s + p.lat, 0)
            const centerLng = totalLng / path.length
            const centerLat = totalLat / path.length
            const textMarker = new AMap.Marker({
              position: [centerLng, centerLat],
              content: `<div class="street-label-text">示范街</div>`,
              offset: new AMap.Pixel(0, 0),
            })
            textMarker.on('click', () => {
              showStreetPanel.value = true
            })
            mapInstance.add(textMarker)
          }
        })
      })
    }
  })
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
  border: 1px solid rgba(71,132,232,0.2);
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
  font-size: clamp(7px, calc(11 * var(--min-scale)), 14px);
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
  background: rgba(10,26,46,0.85);
  border: 1px solid rgba(71,132,232,0.3);
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
  width: calc(14 * var(--min-scale));
  height: calc(14 * var(--min-scale));
  flex-shrink: 0;
  object-fit: contain;
}

.legend-text {
  font-size: clamp(7px, calc(11 * var(--min-scale)), 14px);
  color: rgba(137,181,255,0.8);
  white-space: nowrap;
}

/* ===== 示范街专题弹窗（独立弹窗） ===== */
.street-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 10, 30, 0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.street-modal {
  width: 680px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(50% 50% at 50% 50%, #015EAF 0%, #02397C 100%);
  border: 1px solid rgba(71, 132, 232, 0.4);
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(60, 211, 215, 0.1);
  overflow: hidden;
}

.street-modal__header {
  position: relative;
  flex-shrink: 0;
}

.street-modal__close {
  position: absolute;
  top: calc(10 * var(--h));
  right: calc(14 * var(--w));
  z-index: 2;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(71, 132, 232, 0.4);
  border-radius: 4px;
  background: rgba(2, 20, 50, 0.6);
  color: #89b5ff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.street-modal__close:hover {
  background: rgba(71, 132, 232, 0.25);
  border-color: rgba(71, 132, 232, 0.7);
  color: #3cd3d7;
}

.street-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: calc(16 * var(--h)) calc(20 * var(--w));
  display: flex;
  flex-direction: column;
  gap: calc(14 * var(--h));
  background: linear-gradient(
    180deg,
    rgba(1, 70, 146, 0.4) 0%,
    rgba(4, 87, 167, 0.2) 100%
  );
}
.street-modal__body::-webkit-scrollbar { width: 4px; }
.street-modal__body::-webkit-scrollbar-track { background: transparent; }
.street-modal__body::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.3); border-radius: 2px; }

/* 商户卡片 */
.merchant-card {
  background: rgba(2, 20, 50, 0.5);
  border: 1px solid rgba(71, 132, 232, 0.3);
  border-radius: 6px;
  overflow: hidden;
}
.merchant-card__name {
  padding: calc(10 * var(--h)) calc(16 * var(--w));
  font-size: clamp(12px, calc(14 * var(--min-scale)), 18px);
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(71, 132, 232, 0.2);
  background: linear-gradient(90deg, rgba(1, 70, 146, 0.5) 0%, transparent 100%);
}

.merchant-card__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: rgba(71, 132, 232, 0.1);
}

.category-block {
  padding: calc(10 * var(--h)) calc(14 * var(--w));
  background: rgba(2, 20, 50, 0.8);
}

.category-block__title {
  font-size: clamp(11px, calc(13 * var(--min-scale)), 16px);
  font-weight: 700;
  margin-bottom: calc(6 * var(--h));
  letter-spacing: 1px;
}
.category-block[data-cat="monitor"] .category-block__title { color: #3b82f6; }
.category-block[data-cat="duty"] .category-block__title { color: #10b981; }
.category-block[data-cat="alarm"] .category-block__title { color: #f59e0b; }
.category-block[data-cat="stats"] .category-block__title { color: #8b5cf6; }

.category-block__items {
  display: flex;
  flex-direction: column;
  gap: calc(3 * var(--h));
}

.category-block__item {
  font-size: clamp(10px, calc(12 * var(--min-scale)), 14px);
  color: rgba(224,234,250,0.85);
  line-height: 1.5;
  padding-left: calc(10 * var(--w));
  position: relative;
}
.category-block__item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 7px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(60, 211, 215, 0.5);
}

/* 弹窗过渡动画 */
.street-modal-enter-active,
.street-modal-leave-active {
  transition: opacity 0.3s ease;
}
.street-modal-enter-active .street-modal,
.street-modal-leave-active .street-modal {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}
.street-modal-enter-from,
.street-modal-leave-to {
  opacity: 0;
}
.street-modal-enter-from .street-modal,
.street-modal-leave-to .street-modal {
  transform: scale(0.92);
  opacity: 0;
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
  transform: translate(-50%,-50%) rotate(-32deg) translateY(-12px);
  transition: text-shadow 0.3s ease;
}
.street-label-text:hover {
  text-shadow: 0 0 16px rgba(60,211,215,0.7), 0 0 30px rgba(60,211,215,0.4), 0 1px 4px rgba(0,0,0,0.6);
}
</style>
