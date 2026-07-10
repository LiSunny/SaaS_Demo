<template>
  <div class="bigscreen">
    <!-- 顶部导航条 -->
    <BigscreenHeader :bigscreens="bigscreens" :current-bigscreen-id="currentBigscreenId" />

    <!-- 内容区 -->
    <div class="page-body">
      <!-- 标题行：标题 + 商业街下拉选 + 返回按钮 -->
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-title">示范街专题</h1>
          <!-- 商业街下拉选 → el-select filterable -->
          <el-select
            v-model="selectedStreetName"
            class="street-select-el"
            popper-class="bigscreen-el-select-dropdown"
            filterable
            @change="onStreetChange"
          >
            <el-option
              v-for="street in streets"
              :key="street.name"
              :label="street.name"
              :value="street.name"
            >
              <div class="street-option">
                <span class="street-option__name">{{ street.name }}</span>
                <span class="street-option__stats">{{ street.shops }}家商铺 · {{ street.devices }}台设备</span>
              </div>
            </el-option>
          </el-select>
        </div>
        <el-button class="back-btn-el" :icon="Close" @click="goBack" />
      </div>

      <!-- 统计指标行 -->
      <div class="stats-row">
        <BigscreenMetricItem
          v-for="stat in statsData"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :unit="stat.unit"
          :hex-src="stat.icon"
        />
      </div>

      <!-- 分类数据展示区 -->
      <div class="page-content">
        <!-- Seg 分段控制器 → el-tabs -->
        <el-tabs
          v-model="activeTab"
          class="page-seg-el"
          @tab-change="onTabChange"
        >
          <el-tab-pane
            v-for="tab in tabs"
            :key="tab.key"
            :label="tab.label"
            :name="tab.key"
          />
        </el-tabs>

        <!-- Seg 下方内容面板 -->
        <div class="page-content__panel">
          <!-- 安全一张图：3D 地图 -->
          <div v-show="activeTab === 'safety-map'" class="page-content__area page-content__area--map">
            <div ref="safetyMapContainer" class="safety-map-container" />

            <!-- 右上角统计悬浮窗口 -->
            <div class="safety-stats-panel">
              <div class="safety-stats-panel__title">商铺状态统计</div>
              <div
                v-for="stat in shopCategoryStats"
                :key="stat.label"
                class="safety-stats-panel__item"
              >
                <span class="safety-stats-panel__dot" :style="{ background: stat.color }"></span>
                <span class="safety-stats-panel__label">{{ stat.label }}</span>
                <span class="safety-stats-panel__value" :style="{ color: stat.color }">{{ stat.count }}</span>
                <span class="safety-stats-panel__unit">家</span>
              </div>
            </div>

            <!-- 底部图例 -->
            <div class="safety-legend">
              <div
                v-for="item in categoryLegend"
                :key="item.label"
                class="safety-legend__item"
              >
                <span class="safety-legend__dot" :style="{ background: item.color }"></span>
                <span class="safety-legend__text">{{ item.label }}</span>
              </div>
            </div>
          </div>

          <!-- 商户履责监管 -->
          <StreetBusinessCompliance v-show="activeTab === 'duty-supervision'" class="page-content__area page-content__area--compliance" />

          <!-- 隐患整改跟踪 -->
          <StreetHiddenDangerTrack v-show="activeTab === 'hazard-track'" class="page-content__area page-content__area--track" />

          <!-- 告警处置中心 -->
          <StreetAlertCenter v-show="activeTab === 'alarm-center'" class="page-content__area page-content__area--track" />

          <!-- 商户列表 -->
          <StreetShopList v-show="activeTab === 'stat-analysis'" class="page-content__area page-content__area--stat" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Close } from '@element-plus/icons-vue'
import BigscreenHeader from './components/BigscreenHeader.vue'
import { getUserBigscreens } from '@/api/bigscreen'
import type { UserBigscreenItem } from '@/types/bigscreen'
import BigscreenMetricItem from './components/BigscreenMetricItem.vue'
import StreetBusinessCompliance from './components/street/StreetBusinessCompliance.vue'
import StreetHiddenDangerTrack from './components/street/StreetHiddenDangerTrack.vue'
import StreetAlertCenter from './components/street/StreetAlertCenter.vue'
import StreetShopList from './components/street/StreetShopList.vue'

const router = useRouter()
const route = useRoute()
const bigscreens = ref<UserBigscreenItem[]>([])
const currentBigscreenId = ref(Number(route.query.bigscreenId) || 0)

// ============================================================
// 商业街数据 & el-select
// ============================================================
interface StreetData {
  name: string
  shops: number
  devices: number
  onlineRate: number
  dutyRate: number
  alerts: number
  hazards: number
}

const streets: StreetData[] = [
  { name: '示范街', shops: 286, devices: 1536, onlineRate: 98.6, dutyRate: 92, alerts: 6, hazards: 12 },
  { name: '江南商业街', shops: 198, devices: 1120, onlineRate: 96.3, dutyRate: 88, alerts: 3, hazards: 5 },
  { name: '桥圩商业街', shops: 152, devices: 896, onlineRate: 97.1, dutyRate: 85, alerts: 8, hazards: 9 },
  { name: '新塘商业街', shops: 95, devices: 560, onlineRate: 99.2, dutyRate: 94, alerts: 1, hazards: 2 },
]

const selectedStreetName = ref(streets[0].name)
const selectedStreet = computed(() => streets.find(s => s.name === selectedStreetName.value) ?? streets[0])

// 根据路由 query 自动选中商业街
function syncStreetFromQuery() {
  const targetName = route.query.street
  if (targetName && typeof targetName === 'string') {
    const found = streets.find((s) => s.name === targetName)
    if (found) selectedStreetName.value = found.name
  }
}

function onStreetChange() {
  // el-select 已更新 selectedStreetName，selectedStreet 自动响应
}

function goBack() {
  router.push({ name: 'BigscreenLanding' })
}

// ============================================================
// 统计指标
// ============================================================
interface StatItem {
  label: string
  value: string | number
  unit: string
  icon?: string
}

const metricIcons = [
  new URL('@/assets/bigscreen/metric-icon-shops.svg', import.meta.url).href,
  new URL('@/assets/bigscreen/metric-icon-devices.svg', import.meta.url).href,
  new URL('@/assets/bigscreen/metric-icon-online.svg', import.meta.url).href,
  new URL('@/assets/bigscreen/metric-icon-duty.svg', import.meta.url).href,
  new URL('@/assets/bigscreen/metric-icon-alert.svg', import.meta.url).href,
  new URL('@/assets/bigscreen/metric-icon-hazard.svg', import.meta.url).href,
]

const statsData = computed<StatItem[]>(() => {
  const s = selectedStreet.value
  return [
    { label: '纳管商铺', value: s.shops, unit: '家', icon: metricIcons[0] },
    { label: '纳管设备', value: s.devices, unit: '台', icon: metricIcons[1] },
    { label: '设备在线率', value: s.onlineRate, unit: '%', icon: metricIcons[2] },
    { label: '今日履职率', value: s.dutyRate, unit: '%', icon: metricIcons[3] },
    { label: '今日告警', value: s.alerts, unit: '次', icon: metricIcons[4] },
    { label: '未闭环隐患', value: s.hazards, unit: '项', icon: metricIcons[5] },
  ]
})

// ============================================================
// Seg → el-tabs 切换
// ============================================================
interface TabItem {
  key: string
  label: string
}

const tabs: TabItem[] = [
  { key: 'safety-map', label: '安全一张图' },
  { key: 'duty-supervision', label: '商户履责监管' },
  { key: 'hazard-track', label: '隐患整改跟踪' },
  { key: 'alarm-center', label: '告警处置中心' },
  { key: 'stat-analysis', label: '商户列表' },
]

const activeTab = ref('safety-map')

function onTabChange(key: string | number) {
  const k = String(key)
  if (activeTab.value === 'safety-map' && k !== 'safety-map') {
    destroyMap()
  }
  if (k === 'safety-map') {
    nextTick(() => initSafetyMap())
  }
}

// ============================================================
// 安全一张图：高德 3D 地图（保持不变）
// ============================================================

type ShopCategory = 'normal' | 'device-abnormal' | 'duty-overdue' | 'smoke-alarm' | 'device-offline'

const categoryConfig: Record<ShopCategory, { color: string; label: string }> = {
  'normal': { color: '#22c55e', label: '正常商铺' },
  'device-abnormal': { color: '#eab308', label: '异常设备' },
  'duty-overdue': { color: '#f59e0b', label: '履职逾期' },
  'smoke-alarm': { color: '#ef4444', label: '烟感报警' },
  'device-offline': { color: '#6b7280', label: '设备离线' },
}

const categoryLegend = Object.entries(categoryConfig).map(([_, val]) => ({
  label: val.label,
  color: val.color,
}))

interface SafetyShop {
  id: number
  name: string
  lng: number
  lat: number
  category: ShopCategory
  person: string
  phone: string
  businessType: string
}

const safetyShops: SafetyShop[] = [
  { id: 1, name: '好旺角餐厅', lng: 109.602, lat: 23.079, category: 'normal', person: '张三', phone: '138-7711-2201', businessType: '餐饮' },
  { id: 2, name: '鑫源便利店', lng: 109.604, lat: 23.081, category: 'normal', person: '李四', phone: '139-7852-3312', businessType: '零售' },
  { id: 3, name: '阳光服饰', lng: 109.607, lat: 23.079, category: 'normal', person: '王五', phone: '137-6833-4423', businessType: '服装' },
  { id: 4, name: '恒达五金店', lng: 109.609, lat: 23.076, category: 'normal', person: '赵六', phone: '136-7744-5534', businessType: '五金' },
  { id: 5, name: '小辣椒火锅', lng: 109.605, lat: 23.077, category: 'normal', person: '刘芳', phone: '135-6655-6645', businessType: '餐饮' },
  { id: 6, name: '美佳化妆品', lng: 109.603, lat: 23.075, category: 'normal', person: '黄丽', phone: '158-7866-7756', businessType: '美妆' },
  { id: 7, name: '大华药店', lng: 109.600, lat: 23.078, category: 'normal', person: '孙磊', phone: '188-7777-8867', businessType: '医药' },
  { id: 8, name: '年华超市', lng: 109.596, lat: 23.081, category: 'normal', person: '周明', phone: '177-8888-9978', businessType: '超市' },
  { id: 9, name: '瑞丰水果店', lng: 109.598, lat: 23.076, category: 'normal', person: '钱进', phone: '159-9999-1189', businessType: '水果' },
  { id: 10, name: '书香文具', lng: 109.611, lat: 23.078, category: 'normal', person: '杨帆', phone: '182-6611-2290', businessType: '文具' },
  { id: 11, name: '丽人美发', lng: 109.599, lat: 23.083, category: 'normal', person: '陈琳', phone: '133-7722-3301', businessType: '美发' },
  { id: 12, name: '天天便利店', lng: 109.612, lat: 23.080, category: 'normal', person: '林涛', phone: '186-8833-4412', businessType: '零售' },
  { id: 13, name: '李记烧烤', lng: 109.601, lat: 23.082, category: 'device-abnormal', person: '李建国', phone: '138-9944-5523', businessType: '餐饮' },
  { id: 14, name: '老味道面馆', lng: 109.608, lat: 23.083, category: 'device-abnormal', person: '何强', phone: '139-8812-6634', businessType: '餐饮' },
  { id: 15, name: '永辉电器维修', lng: 109.606, lat: 23.074, category: 'device-abnormal', person: '郑刚', phone: '137-6678-7745', businessType: '维修' },
  { id: 16, name: '好邻居超市', lng: 109.595, lat: 23.078, category: 'device-abnormal', person: '马超', phone: '136-5534-8856', businessType: '超市' },
  { id: 17, name: 'XX餐饮店', lng: 109.610, lat: 23.081, category: 'duty-overdue', person: '陈志强', phone: '158-9923-9967', businessType: '餐饮' },
  { id: 18, name: '顺风货运站', lng: 109.597, lat: 23.079, category: 'duty-overdue', person: '吴伟', phone: '188-4455-1178', businessType: '物流' },
  { id: 19, name: '金冠蛋糕坊', lng: 109.604, lat: 23.084, category: 'duty-overdue', person: '邓丽', phone: '186-7789-2289', businessType: '食品' },
  { id: 20, name: '沸腾鱼庄', lng: 109.603, lat: 23.083, category: 'smoke-alarm', person: '郭海', phone: '177-3366-3390', businessType: '餐饮' },
  { id: 21, name: '湘味土菜馆', lng: 109.600, lat: 23.080, category: 'smoke-alarm', person: '彭涛', phone: '159-2244-4401', businessType: '餐饮' },
  { id: 22, name: '老四川火锅城', lng: 109.609, lat: 23.077, category: 'smoke-alarm', person: '唐亮', phone: '182-1122-5512', businessType: '餐饮' },
  { id: 23, name: '飞越网吧', lng: 109.606, lat: 23.080, category: 'device-offline', person: '吴伟', phone: '133-9988-6623', businessType: '网吧' },
  { id: 24, name: '星光台球室', lng: 109.598, lat: 23.082, category: 'device-offline', person: '谢飞', phone: '138-6677-7734', businessType: '娱乐' },
]

interface CategoryStat {
  label: string
  color: string
  count: number
}

const shopCategoryStats = computed<CategoryStat[]>(() => {
  const map: Record<string, number> = {}
  safetyShops.forEach(s => {
    map[s.category] = (map[s.category] || 0) + 1
  })
  return Object.entries(categoryConfig).map(([key, val]) => ({
    label: val.label,
    color: val.color,
    count: map[key] || 0,
  }))
})

const CENTER: [number, number] = [109.605, 23.075]

const safetyMapContainer = ref<HTMLDivElement>()
let safetyMapInstance: any = null
let safetyInfoWindow: any = null
let safetyCloseTimeout: ReturnType<typeof setTimeout> | null = null
let safetyMarkers: any[] = []
let safetyMaskPolygon: any = null

function buildSafetyInfoWindow(shop: SafetyShop, cfg: { color: string; label: string }) {
  return `<div class="safety-tooltip">
    <div class="safety-tooltip__header">
      <span class="safety-tooltip__dot" style="background:${cfg.color}"></span>
      <span class="safety-tooltip__name">${shop.name}</span>
    </div>
    <div class="safety-tooltip__body">
      <div class="safety-tooltip__row">
        <span class="safety-tooltip__label">经营类型</span>
        <span class="safety-tooltip__value">${shop.businessType}</span>
      </div>
      <div class="safety-tooltip__row">
        <span class="safety-tooltip__label">负责人</span>
        <span class="safety-tooltip__value">${shop.person}</span>
      </div>
      <div class="safety-tooltip__row">
        <span class="safety-tooltip__label">联系电话</span>
        <span class="safety-tooltip__value">${shop.phone}</span>
      </div>
      <div class="safety-tooltip__row">
        <span class="safety-tooltip__label">状态</span>
        <span class="safety-tooltip__tag" style="color:${cfg.color};border-color:${cfg.color}44;background:${cfg.color}18">${cfg.label}</span>
      </div>
    </div>
    <div class="safety-tooltip__arrow"></div>
  </div>`
}

function scheduleCloseSafetyInfoWindow() {
  safetyCloseTimeout = setTimeout(() => {
    if (safetyInfoWindow) safetyInfoWindow.close()
    safetyCloseTimeout = null
  }, 300)
}

function addMaskLayer(AMap: any) {
  if (!safetyMapInstance) return

  const streetHole: [number, number][] = [
    [109.593, 23.073],
    [109.614, 23.073],
    [109.614, 23.078],
    [109.609, 23.078],
    [109.609, 23.086],
    [109.598, 23.086],
    [109.598, 23.078],
    [109.593, 23.078],
  ]

  const outerMask: [number, number][] = [
    [109.3, 22.8],
    [109.9, 22.8],
    [109.9, 23.4],
    [109.3, 23.4],
  ]

  safetyMaskPolygon = new AMap.Polygon({
    path: [outerMask, streetHole],
    fillColor: '#020a1e',
    fillOpacity: 0.55,
    strokeColor: '#30C8D3',
    strokeOpacity: 0.6,
    strokeWeight: 2,
    strokeStyle: 'dashed',
    strokeDasharray: [6, 4],
    zIndex: 10,
  })

  safetyMapInstance.add(safetyMaskPolygon)
}

function initSafetyMap() {
  if (!safetyMapContainer.value || !(window as any).AMap) return
  if (safetyMapInstance) {
    safetyMapInstance.resize()
    return
  }

  const AMap = (window as any).AMap

  safetyMapInstance = new AMap.Map(safetyMapContainer.value, {
    zoom: 13,
    center: CENTER,
    mapStyle: 'amap://styles/d09c32c3f8fe92f329d2631a674d4441',
    viewMode: '3D',
    pitch: 50,
    rotation: -10,
    resizeEnable: true,
    features: ['bg', 'road', 'building'],
  })

  safetyInfoWindow = new AMap.InfoWindow({
    isCustom: true,
    offset: new AMap.Pixel(0, -24),
    autoMove: true,
  })

  safetyMarkers = []
  safetyShops.forEach((shop) => {
    const cfg = categoryConfig[shop.category]
    const marker = new AMap.Marker({
      position: [shop.lng, shop.lat],
      content: `<div style="
        width:22px;height:22px;
        background:${cfg.color}22;
        border:2px solid ${cfg.color};
        border-radius:50%;
        box-shadow:0 0 12px ${cfg.color}66;
        position:relative;top:-11px;left:-11px;
        cursor:pointer;
      "><div style="
        width:10px;height:10px;
        background:${cfg.color};
        border-radius:50%;
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
      "></div></div>`,
      offset: new AMap.Pixel(0, 0),
    })

    marker.on('mouseover', () => {
      if (safetyCloseTimeout) {
        clearTimeout(safetyCloseTimeout)
        safetyCloseTimeout = null
      }
      const content = buildSafetyInfoWindow(shop, cfg)
      safetyInfoWindow.setContent(content)
      safetyInfoWindow.open(safetyMapInstance, marker.getPosition())
      nextTick(() => {
        const tipEl = document.querySelector('.safety-tooltip')
        if (tipEl) {
          tipEl.addEventListener('mouseenter', () => {
            if (safetyCloseTimeout) {
              clearTimeout(safetyCloseTimeout)
              safetyCloseTimeout = null
            }
          })
          tipEl.addEventListener('mouseleave', () => {
            scheduleCloseSafetyInfoWindow()
          })
        }
      })
    })

    marker.on('mouseout', () => {
      scheduleCloseSafetyInfoWindow()
    })

    safetyMapInstance.add(marker)
    safetyMarkers.push(marker)
  })

  addMaskLayer(AMap)

  const doFitView = () => {
    if (!safetyMapInstance || safetyMarkers.length === 0) return
    safetyMapInstance.setFitView(safetyMarkers, false, [50, 50, 50, 50], 300)
  }

  safetyMapInstance.on('complete', () => {
    setTimeout(doFitView, 150)
  })

  setTimeout(() => {
    doFitView()
  }, 500)
}

function destroyMap() {
  if (safetyCloseTimeout) {
    clearTimeout(safetyCloseTimeout)
    safetyCloseTimeout = null
  }
  if (safetyMapInstance) {
    safetyMapInstance.destroy()
    safetyMapInstance = null
    safetyInfoWindow = null
    safetyMarkers = []
    safetyMaskPolygon = null
  }
}

// 页面挂载时初始化地图，卸载时销毁
onMounted(async () => {
  syncStreetFromQuery()
  if (activeTab.value === 'safety-map') {
    nextTick(() => initSafetyMap())
  }
  try {
    const screens = await getUserBigscreens()
    bigscreens.value = screens
  } catch { /* 大屏列表加载失败，仍可显示页面 */ }
})

onBeforeUnmount(() => {
  destroyMap()
})

</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ===== 全屏容器 ===== */
.bigscreen {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(50% 50% at 50% 50%, #003F76 0%, #002C62 100%);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* ===== 内容区 ===== */
.page-body {
  position: absolute;
  top: vh(89);
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  padding: vh(18) vw(18);
  display: flex;
  flex-direction: column;
  gap: vh(18);
  background: #002C62;
}

.page-body::-webkit-scrollbar { width: 4px; }
.page-body::-webkit-scrollbar-track { background: transparent; }
.page-body::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.3); border-radius: 2px; }

/* ===== 标题行 ===== */
.page-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.page-header__left {
  display: flex;
  align-items: center;
  gap: vw(12);
  min-width: 0;
}

.page-title {
  font-family: 'Source-KeynoteartHans', 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(18px, calc(22 * var(--min-scale)), 26px);
  font-weight: 400;
  line-height: normal;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  flex-shrink: 0;
}

/* ===== 商业街 el-select ===== */
.street-select-el {
  width: vw(200);
  flex-shrink: 0;
}

.street-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.street-option__name {
  font-size: 13px;
  font-weight: 500;
  color: #f2fbff;
}

.street-option__stats {
  font-size: 11px;
  color: rgba(137, 181, 255, 0.55);
}

/* ===== 返回按钮 ===== */
.back-btn-el {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(71, 132, 232, 0.4) !important;
  border-radius: 4px !important;
  background: rgba(2, 20, 50, 0.6) !important;
  color: #89b5ff !important;
  padding: 0 !important;

  &:hover {
    background: rgba(71, 132, 232, 0.25) !important;
    border-color: rgba(71, 132, 232, 0.7) !important;
    color: #3cd3d7 !important;
  }
}

/* ===== 统计指标行 ===== */
.stats-row {
  display: flex;
  gap: vw(16);
  padding: vh(16) vw(16);
  background: rgba(22, 70, 145, 0.51);
  border-radius: 6px;
  flex-shrink: 0;
}

.stats-row > * {
  flex: 1;
  min-width: 0;
}

/* ===== 分类数据展示区 ===== */
.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
}

/* ===== el-tabs (Seg 替代) ===== */
.page-seg-el {
  flex-shrink: 0;
}

/* ===== 内容面板 ===== */
.page-content__panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: rgba(22, 70, 145, 0.51);
  border-radius: 6px;
  padding: vh(12) vw(12);
}

/* ===== 内容区容器 ===== */
.page-content__area {
  flex: 1;
  min-height: 200px;
  background: transparent;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-content__area--map {
  flex: 1;
  display: block;
  position: relative;
  overflow: hidden;
}

.page-content__area--compliance {
  display: block;
  overflow: hidden;
}

.page-content__area--track {
  display: block;
  overflow: hidden;
}

.page-content__area--stat {
  display: block;
  overflow: hidden;
}

/* ===== 安全一张图：3D 地图容器 ===== */
.safety-map-container {
  position: absolute;
  inset: 0;
}

/* ===== 右上角统计悬浮窗口 ===== */
.safety-stats-panel {
  position: absolute;
  top: vh(10);
  right: vw(10);
  z-index: 10;
  width: vw(160);
  max-width: 180px;
  padding: vh(10) vw(10);
  background: linear-gradient(135deg, rgba(2, 20, 55, 0.95) 0%, rgba(8, 22, 42, 0.95) 100%);
  border: 1px solid rgba(71, 132, 232, 0.35);
  border-radius: 6px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.45), 0 0 12px rgba(60, 211, 215, 0.08);
}

.safety-stats-panel__title {
  font-family: 'Source-KeynoteartHans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 18px);
  font-weight: 700;
  color: #89b5ff;
  margin-bottom: vh(8);
  padding-bottom: vh(6);
  border-bottom: 1px solid rgba(71, 132, 232, 0.2);
}

.safety-stats-panel__item {
  display: flex;
  align-items: center;
  gap: vw(6);
  padding: vh(3) 0;
}

.safety-stats-panel__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.safety-stats-panel__label {
  flex: 1;
  font-size: clamp(14px, calc(15 * var(--min-scale)), 16px);
  color: rgba(224, 234, 250, 0.8);
  white-space: nowrap;
}

.safety-stats-panel__value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 18px);
  font-weight: 700;
}

.safety-stats-panel__unit {
  font-size: clamp(14px, calc(15 * var(--min-scale)), 16px);
  color: rgba(137, 181, 255, 0.5);
}

/* ===== 底部图例 ===== */
.safety-legend {
  position: absolute;
  bottom: vh(8);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: vw(10);
  padding: vh(4) vw(10);
  background: rgba(2, 20, 55, 0.85);
  border: 1px solid rgba(71, 132, 232, 0.3);
  border-radius: 6px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.safety-legend__item {
  display: flex;
  align-items: center;
  gap: vw(4);
}

.safety-legend__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.safety-legend__text {
  font-size: clamp(14px, calc(15 * var(--min-scale)), 16px);
  color: rgba(224, 234, 250, 0.85);
  white-space: nowrap;
}

</style>

<!-- InfoWindow 全局样式（非 scoped，InfoWindow 挂载在 body 下） -->
<style lang="scss">
@use "@/styles/function.scss" as *;

.safety-tooltip {
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

.safety-tooltip::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(60, 211, 215, 0.4), transparent);
}

.safety-tooltip__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 14px 9px;
  border-bottom: 1px solid rgba(60, 211, 215, 0.18);
  background: linear-gradient(180deg, rgba(60, 211, 215, 0.08) 0%, transparent 100%);
}

.safety-tooltip__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 10px currentColor;
}

.safety-tooltip__name {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.4px;
  text-shadow: 0 1px 4px rgba(0,0,0,0.35);
}

.safety-tooltip__body {
  padding: 11px 14px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.safety-tooltip__row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.safety-tooltip__label {
  flex-shrink: 0;
  width: 56px;
  font-size: 12px;
  color: #89b5ff;
  font-weight: 500;
}

.safety-tooltip__value {
  font-size: 13px;
  color: #f0f4fa;
  font-weight: 500;
  text-shadow: 0 1px 3px rgba(0,0,0,0.25);
}

.safety-tooltip__tag {
  display: inline-block;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  border: 1px solid;
  line-height: 1.55;
  font-weight: 600;
}

.safety-tooltip__arrow {
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
