<template>
  <div class="bigscreen">
    <!-- 顶部导航条 -->
    <BigscreenHeader />

    <!-- 内容区 -->
    <div class="page-body">
      <!-- 标题行：标题 + 商业街下拉选 + 返回按钮 -->
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-title">示范街专题</h1>
          <!-- 商业街下拉选 -->
          <div class="street-select" v-click-outside="closeStreetDropdown">
            <button ref="streetTriggerRef" class="street-select__trigger" @click="toggleStreetDropdown">
              <span class="street-select__text">{{ selectedStreet.name }}</span>
              <svg
                class="street-select__chevron"
                :class="{ rotated: streetDropdownOpen }"
                width="12" height="12" viewBox="0 0 24 24" fill="none"
              >
                <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
            <Teleport to="body">
              <div v-if="streetDropdownOpen" class="street-select__overlay" @click="streetDropdownOpen = false" />
              <div v-if="streetDropdownOpen" class="street-select__dropdown" :style="streetDropdownStyle" @click.stop>
                <div class="street-select__search">
                  <svg class="street-select__search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
                    <path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <input
                    ref="streetSearchInputRef"
                    v-model="streetSearch"
                    class="street-select__search-input"
                    placeholder="搜索商业街..."
                    @keydown.stop
                  />
                </div>
                <div class="street-select__list">
                  <button
                    v-for="street in filteredStreets"
                    :key="street.name"
                    class="street-select__option"
                    :class="{ active: selectedStreet.name === street.name }"
                    @click="selectStreet(street)"
                  >
                    <span class="street-select__option-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M9 22V12h6v10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </span>
                    <div class="street-select__option-info">
                      <span class="street-select__option-name">{{ street.name }}</span>
                      <span class="street-select__option-stats">{{ street.shops }}家商铺 · {{ street.devices }}台设备</span>
                    </div>
                    <span v-if="selectedStreet.name === street.name" class="street-select__check">✓</span>
                  </button>
                  <div v-if="filteredStreets.length === 0" class="street-select__empty">无匹配结果</div>
                </div>
              </div>
            </Teleport>
          </div>
        </div>
        <button class="back-btn" title="返回大屏首页" @click="goBack">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- 统计指标行 -->
      <div class="stats-row">
        <BigscreenMetricItem
          v-for="stat in statsData"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :unit="stat.unit"
        />
      </div>

      <!-- 分类数据展示区 -->
      <div class="page-content">
        <!-- Seg 分段控制器 -->
        <div class="page-seg">
          <div
            v-for="tab in tabs"
            :key="tab.key"
            class="page-seg__item"
            :class="{ 'is-active': activeTab === tab.key }"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}
          </div>
        </div>

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
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BigscreenHeader from './components/BigscreenHeader.vue'
import BigscreenMetricItem from './components/BigscreenMetricItem.vue'
import StreetBusinessCompliance from './components/street/StreetBusinessCompliance.vue'
import StreetHiddenDangerTrack from './components/street/StreetHiddenDangerTrack.vue'
import StreetAlertCenter from './components/street/StreetAlertCenter.vue'
import StreetShopList from './components/street/StreetShopList.vue'

const router = useRouter()
const route = useRoute()

// 根据路由 query 自动选中商业街
function syncStreetFromQuery() {
  const targetName = route.query.street
  if (targetName && typeof targetName === 'string') {
    const found = streets.find((s) => s.name === targetName)
    if (found) {
      selectedStreet.value = found
    }
  }
}

function goBack() {
  router.push({ name: 'BigscreenLanding' })
}

// ============================================================
// 商业街数据 & 下拉选
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
  {
    name: '示范街',
    shops: 286,
    devices: 1536,
    onlineRate: 98.6,
    dutyRate: 92,
    alerts: 6,
    hazards: 12,
  },
  {
    name: '江南商业街',
    shops: 198,
    devices: 1120,
    onlineRate: 96.3,
    dutyRate: 88,
    alerts: 3,
    hazards: 5,
  },
  {
    name: '桥圩商业街',
    shops: 152,
    devices: 896,
    onlineRate: 97.1,
    dutyRate: 85,
    alerts: 8,
    hazards: 9,
  },
  {
    name: '新塘商业街',
    shops: 95,
    devices: 560,
    onlineRate: 99.2,
    dutyRate: 94,
    alerts: 1,
    hazards: 2,
  },
]

const selectedStreet = ref<StreetData>(streets[0])
const streetDropdownOpen = ref(false)
const streetSearch = ref('')
const streetSearchInputRef = ref<HTMLInputElement | null>(null)
const streetTriggerRef = ref<HTMLButtonElement | null>(null)
const streetDropdownStyle = ref<Record<string, string>>({})

const filteredStreets = computed(() => {
  const keyword = streetSearch.value.trim().toLowerCase()
  if (!keyword) return streets
  return streets.filter((s) => s.name.toLowerCase().includes(keyword))
})

function selectStreet(street: StreetData) {
  selectedStreet.value = street
  streetDropdownOpen.value = false
  streetSearch.value = ''
}

function closeStreetDropdown() {
  streetDropdownOpen.value = false
}

function toggleStreetDropdown() {
  streetDropdownOpen.value = !streetDropdownOpen.value
  if (streetDropdownOpen.value && streetTriggerRef.value) {
    const rect = streetTriggerRef.value.getBoundingClientRect()
    streetDropdownStyle.value = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
    }
  }
}

// 打开下拉时自动聚焦搜索框
watch(streetDropdownOpen, (open) => {
  if (open) {
    streetSearch.value = ''
    nextTick(() => {
      streetSearchInputRef.value?.focus()
    })
  }
})

// v-click-outside 自定义指令
const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    const handler = (event: MouseEvent) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    ;(el as any).__clickOutsideHandler = handler
    document.addEventListener('click', handler)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', (el as any).__clickOutsideHandler)
  },
}

// ============================================================
// 统计指标
// ============================================================
interface StatItem {
  label: string
  value: string | number
  unit: string
}

const statsData = computed<StatItem[]>(() => {
  const s = selectedStreet.value
  return [
    { label: '纳管商铺', value: s.shops, unit: '家' },
    { label: '纳管设备', value: s.devices, unit: '台' },
    { label: '设备在线率', value: s.onlineRate, unit: '%' },
    { label: '今日履职率', value: s.dutyRate, unit: '%' },
    { label: '今日告警', value: s.alerts, unit: '次' },
    { label: '未闭环隐患', value: s.hazards, unit: '项' },
  ]
})

// ============================================================
// Seg 切换标签
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

function switchTab(key: string) {
  if (activeTab.value === 'safety-map' && key !== 'safety-map') {
    destroyMap()
  }
  activeTab.value = key
  if (key === 'safety-map') {
    nextTick(() => initSafetyMap())
  }
}

// ============================================================
// 安全一张图：高德 3D 地图
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
onMounted(() => {
  syncStreetFromQuery()
  if (activeTab.value === 'safety-map') {
    nextTick(() => initSafetyMap())
  }
})

onBeforeUnmount(() => {
  destroyMap()
})

</script>

<style scoped>
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
  top: calc(89 * var(--h));
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  padding: calc(18 * var(--h)) calc(18 * var(--w));
  display: flex;
  flex-direction: column;
  gap: calc(18 * var(--h));
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
  gap: calc(12 * var(--w));
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

/* ===== 商业街下拉选 ===== */
.street-select {
  position: relative;
  flex-shrink: 0;
}

.street-select__trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid rgba(71, 132, 232, 0.35);
  border-radius: 4px;
  background: rgba(2, 20, 50, 0.55);
  color: #89b5ff;
  cursor: pointer;
  font-family: inherit;
  font-size: clamp(11px, calc(13 * var(--min-scale)), 15px);
  transition: all 0.2s;
  white-space: nowrap;
}
.street-select__trigger:hover {
  border-color: rgba(71, 132, 232, 0.65);
  background: rgba(71, 132, 232, 0.15);
  color: #b3d4ff;
}

.street-select__text {
  font-weight: 500;
}

.street-select__chevron {
  transition: transform 0.2s;
  flex-shrink: 0;
}
.street-select__chevron.rotated {
  transform: rotate(180deg);
}

/* 遮罩层 */
.street-select__overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
}

/* 下拉面板 */
.street-select__dropdown {
  position: fixed;
  z-index: 2001;
  width: 240px;
  max-height: 300px;
  background: rgba(2, 21, 56, 0.98);
  border: 1px solid rgba(71, 132, 232, 0.45);
  border-radius: 6px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(71, 132, 232, 0.15);
  overflow: hidden;
}

/* 搜索框 */
.street-select__search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(71, 132, 232, 0.18);
}

.street-select__search-icon {
  color: rgba(137, 181, 255, 0.5);
  flex-shrink: 0;
}

.street-select__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: #89b5ff;
  font-family: inherit;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
  padding: 0;
}
.street-select__search-input::placeholder {
  color: rgba(137, 181, 255, 0.35);
}

/* 选项列表 */
.street-select__list {
  max-height: 220px;
  overflow-y: auto;
  padding: 4px;
}
.street-select__list::-webkit-scrollbar { width: 3px; }
.street-select__list::-webkit-scrollbar-track { background: transparent; }
.street-select__list::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.25); border-radius: 2px; }

.street-select__option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  font-family: inherit;
  text-align: left;
  transition: background 0.15s;
}
.street-select__option:hover {
  background: rgba(71, 132, 232, 0.15);
}
.street-select__option.active {
  background: rgba(71, 132, 232, 0.2);
}

.street-select__option-icon {
  color: #4784e8;
  opacity: 0.7;
  flex-shrink: 0;
}

.street-select__option-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.street-select__option-name {
  font-size: clamp(12px, calc(13 * var(--min-scale)), 15px);
  font-weight: 500;
  color: #f2fbff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.street-select__option-stats {
  font-size: clamp(10px, calc(11 * var(--min-scale)), 12px);
  color: rgba(137, 181, 255, 0.55);
  white-space: nowrap;
}

.street-select__check {
  color: #3cd3d7;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
  margin-left: auto;
}

.street-select__empty {
  padding: 20px 10px;
  text-align: center;
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
  color: rgba(137, 181, 255, 0.4);
}

.back-btn {
  flex-shrink: 0;
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
.back-btn:hover {
  background: rgba(71, 132, 232, 0.25);
  border-color: rgba(71, 132, 232, 0.7);
  color: #3cd3d7;
}

/* ===== 统计指标行 ===== */
.stats-row {
  display: flex;
  gap: calc(16 * var(--w));
  padding: calc(16 * var(--h)) calc(16 * var(--w));
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

/* ===== Seg 分段控制器 ===== */
.page-seg {
  display: flex;
  gap: calc(18 * var(--w));
  flex-shrink: 0;
}

.page-seg__item {
  flex-shrink: 0;
  padding: calc(12 * var(--h)) calc(18 * var(--w));
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(15px, calc(18 * var(--min-scale)), 18px);
  font-weight: 700;
  text-align: center;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  cursor: pointer;
  transition: background 0.25s ease;
  position: relative;
}

.page-seg__item.is-active {
  background: rgba(22, 70, 145, 0.51);
  -webkit-text-fill-color: #ffffff;
  color: #ffffff;
  border-radius: 8px 8px 0 0;
}

/* ===== Seg 下方内容面板 ===== */
.page-content__panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: rgba(22, 70, 145, 0.51);
  border-radius: 6px;
  padding: calc(12 * var(--h)) calc(12 * var(--w));
}

/* ===== 内容区 ===== */
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
  top: calc(10 * var(--h));
  right: calc(10 * var(--w));
  z-index: 10;
  width: calc(160 * var(--w));
  max-width: 180px;
  padding: calc(10 * var(--h)) calc(10 * var(--w));
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
  margin-bottom: calc(8 * var(--h));
  padding-bottom: calc(6 * var(--h));
  border-bottom: 1px solid rgba(71, 132, 232, 0.2);
}

.safety-stats-panel__item {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--w));
  padding: calc(3 * var(--h)) 0;
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
  bottom: calc(8 * var(--h));
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: calc(10 * var(--w));
  padding: calc(4 * var(--h)) calc(10 * var(--w));
  background: rgba(2, 20, 55, 0.85);
  border: 1px solid rgba(71, 132, 232, 0.3);
  border-radius: 6px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.safety-legend__item {
  display: flex;
  align-items: center;
  gap: calc(4 * var(--w));
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
<style>
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
