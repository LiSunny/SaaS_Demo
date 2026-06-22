<template>
  <div class="bigscreen">
    <!-- 顶部导航条 -->
    <BigscreenHeader />

    <!-- 内容区 -->
    <div class="page-body">
      <!-- 标题行：标题 + 返回按钮 -->
      <div class="page-header">
        <h1 class="page-title">示范街专题</h1>
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

          <!-- 统计分析 -->
          <div v-show="activeTab === 'stat-analysis'" class="page-content__area page-content__area--stat">
            <div class="stat-analysis">
              <!-- 左面板：统计概览 -->
              <div class="stat-analysis__left">
                <!-- 数据概览 -->
                <div class="stat-section">
                  <div class="stat-section__title">
                    <span class="stat-section__title-bar" />
                    <span class="stat-section__title-text">数据概览</span>
                  </div>
                  <div class="stat-section__metrics">
                    <div class="stat-overview-item">
                      <span class="stat-overview-item__label">今日应完成任务</span>
                      <span class="stat-overview-item__value">68<span class="stat-overview-item__unit">项</span></span>
                    </div>
                    <div class="stat-divider" />
                    <div class="stat-overview-row">
                      <div class="stat-overview-item">
                        <span class="stat-overview-item__label">已完成</span>
                        <span class="stat-overview-item__value">60<span class="stat-overview-item__unit">项</span></span>
                      </div>
                      <div class="stat-overview-item">
                        <span class="stat-overview-item__label">未完成</span>
                        <span class="stat-overview-item__value">8<span class="stat-overview-item__unit">项</span></span>
                      </div>
                      <div class="stat-overview-item">
                        <span class="stat-overview-item__label">累计逾期</span>
                        <span class="stat-overview-item__value">8<span class="stat-overview-item__unit">项</span></span>
                      </div>
                    </div>
                  </div>
                  <!-- 履职率环形图 -->
                  <div class="stat-ring-wrapper">
                    <svg class="stat-ring" viewBox="0 0 142 142">
                      <circle cx="71" cy="71" r="60" fill="none" stroke="#003063" stroke-width="12" />
                      <circle
                        cx="71" cy="71" r="60"
                        fill="none"
                        stroke="url(#statRingGrad)"
                        stroke-width="12"
                        stroke-linecap="round"
                        stroke-dasharray="377"
                        stroke-dashoffset="38"
                        transform="rotate(-90 71 71)"
                      />
                      <defs>
                        <linearGradient id="statRingGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stop-color="#205CA9" />
                          <stop offset="100%" stop-color="#0072FF" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div class="stat-ring__center">
                      <span class="stat-ring__label">今日履职率</span>
                      <span class="stat-ring__value">90%</span>
                    </div>
                  </div>
                </div>

                <!-- 履职完成率Top5 -->
                <div class="stat-section">
                  <div class="stat-section__title">
                    <span class="stat-section__title-bar" />
                    <span class="stat-section__title-text">履职完成率Top5</span>
                  </div>
                  <div class="stat-rank-list">
                    <div v-for="(item, idx) in top5List" :key="item.name" class="stat-rank-item">
                      <div class="stat-rank-item__info">
                        <div class="stat-rank-item__header">
                          <span class="stat-rank-item__index">{{ String(idx + 1).padStart(2, '0') }}</span>
                          <span class="stat-rank-item__name">{{ item.name }}</span>
                        </div>
                        <div class="stat-rank-item__bar">
                          <div class="stat-rank-item__bar-bg" />
                          <div class="stat-rank-item__bar-fill" :style="{ width: item.rate + '%' }" />
                        </div>
                      </div>
                      <span class="stat-rank-item__rate">{{ item.rate }}%</span>
                    </div>
                  </div>
                </div>

                <!-- 实时动态 -->
                <div class="stat-section stat-section--grow">
                  <div class="stat-section__title">
                    <span class="stat-section__title-bar" />
                    <span class="stat-section__title-text">实时动态</span>
                  </div>
                  <div class="stat-feed">
                    <div v-for="(item, idx) in feedList" :key="idx" class="stat-feed__item">
                      <span class="stat-feed__shop">{{ item.shop }}</span>
                      <span class="stat-feed__action">{{ item.action }}</span>
                      <span class="stat-feed__time">{{ item.time }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 右面板：表格 -->
              <div class="stat-analysis__right">
                <!-- 搜索栏 -->
                <div class="stat-toolbar">
                  <div class="stat-toolbar__left">
                    <div class="stat-search-input">
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="7" cy="7" r="5" />
                        <line x1="11" y1="11" x2="14" y2="14" />
                      </svg>
                      <span class="stat-search-input__placeholder">搜索任务名称...</span>
                    </div>
                    <div class="stat-select">
                      <span class="stat-select__text">全部状态</span>
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <polyline points="4 6 8 10 12 6" />
                      </svg>
                    </div>
                  </div>
                  <button class="stat-query-btn">查询</button>
                </div>

                <!-- 表格 -->
                <div class="stat-table-wrapper">
                  <div class="stat-table">
                    <div class="stat-table__header">
                      <div class="stat-table__cell stat-table__cell--status">履职状态</div>
                      <div class="stat-table__cell stat-table__cell--name">商户名称</div>
                      <div class="stat-table__cell stat-table__cell--type">商户业态</div>
                      <div class="stat-table__cell stat-table__cell--time">上报时间</div>
                      <div class="stat-table__cell stat-table__cell--action">操作</div>
                    </div>
                    <div v-for="(row, idx) in statTableData" :key="idx" class="stat-table__row">
                      <div class="stat-table__cell stat-table__cell--status">
                        <span class="stat-tag" :class="{ 'stat-tag--danger': row.status === '预警', 'stat-tag--normal': row.status === '正常' }">{{ row.status }}</span>
                      </div>
                      <div class="stat-table__cell stat-table__cell--name">{{ row.name }}</div>
                      <div class="stat-table__cell stat-table__cell--type">{{ row.type }}</div>
                      <div class="stat-table__cell stat-table__cell--time">{{ row.time }}</div>
                      <div class="stat-table__cell stat-table__cell--action">
                        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" class="stat-action-icon">
                          <path d="M6 3h8M6 8h8M6 13h4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 分页 -->
                <div class="stat-pagination">
                  <div class="stat-pagination__left">
                    <span class="stat-pagination__label">每页显示</span>
                    <div class="stat-pagination__selector">
                      <span>10 条</span>
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <polyline points="4 6 8 10 12 6" />
                      </svg>
                    </div>
                    <span class="stat-pagination__total">共 {{ statTableData.length }} 条数据</span>
                  </div>
                  <div class="stat-pagination__right">
                    <button class="stat-pagination__btn" disabled>上一页</button>
                    <button class="stat-pagination__num is-active">1</button>
                    <button class="stat-pagination__num">2</button>
                    <button class="stat-pagination__btn" disabled>下一页</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import BigscreenHeader from './components/BigscreenHeader.vue'
import BigscreenMetricItem from './components/BigscreenMetricItem.vue'
import StreetBusinessCompliance from './components/street/StreetBusinessCompliance.vue'
import StreetHiddenDangerTrack from './components/street/StreetHiddenDangerTrack.vue'
import StreetAlertCenter from './components/street/StreetAlertCenter.vue'

const router = useRouter()

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
}

const statsData: StatItem[] = [
  { label: '纳管商铺', value: 286, unit: '家' },
  { label: '纳管设备', value: 1536, unit: '台' },
  { label: '设备在线率', value: '98.6', unit: '%' },
  { label: '今日履职率', value: 92, unit: '%' },
  { label: '今日告警', value: 6, unit: '次' },
  { label: '未闭环隐患', value: 12, unit: '项' },
]

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
  { key: 'stat-analysis', label: '统计分析' },
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
  if (activeTab.value === 'safety-map') {
    nextTick(() => initSafetyMap())
  }
})

onBeforeUnmount(() => {
  destroyMap()
})

// ============================================================
// 统计分析 Tab — Mock 数据
// ============================================================

const top5List = [
  { name: '沙县小吃', rate: 96 },
  { name: '爱玛电动车', rate: 89 },
  { name: 'Tony美发店', rate: 80 },
  { name: '东北饭庄', rate: 74 },
  { name: '柳州螺蛳粉', rate: 50 },
]

const feedList = [
  { shop: '沙县小吃', action: '完成每日履职打卡', time: '2025-09-10 13:24' },
  { shop: '爱玛电动车', action: '完成每日履职打卡', time: '2025-09-10 13:18' },
  { shop: 'Tony美发店', action: '完成每日履职打卡', time: '2025-09-10 12:55' },
  { shop: '东北饭庄', action: '完成每日履职打卡', time: '2025-09-10 12:30' },
]

const statTableData = [
  { status: '预警', name: '盛邦木业', type: '木材加工', time: '2025-10-14 09:00' },
  { status: '预警', name: '南湖校区', type: '物业', time: '2025-10-14 09:00' },
  { status: '预警', name: '江南商贸城', type: '商业', time: '2025-10-14 09:00' },
  { status: '正常', name: '生产计划执行与分配', type: '2025-10-14 09:00', time: '2025-10-14 09:00' },
  { status: '正常', name: '生产计划执行与分配', type: '2025-10-14 09:00', time: '2025-10-14 09:00' },
  { status: '正常', name: '生产计划执行与分配', type: '2025-10-14 09:00', time: '2025-10-14 09:00' },
]
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
  padding: calc(8 * var(--h)) calc(12 * var(--w));
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(13px, calc(16 * var(--min-scale)), 18px);
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
  font-size: clamp(10px, calc(13 * var(--min-scale)), 16px);
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
  font-size: clamp(8px, calc(11 * var(--min-scale)), 13px);
  color: rgba(224, 234, 250, 0.8);
  white-space: nowrap;
}

.safety-stats-panel__value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(14 * var(--min-scale)), 17px);
  font-weight: 700;
}

.safety-stats-panel__unit {
  font-size: clamp(8px, calc(11 * var(--min-scale)), 13px);
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
  font-size: clamp(7px, calc(10 * var(--min-scale)), 13px);
  color: rgba(224, 234, 250, 0.85);
  white-space: nowrap;
}

/* ============================================================
   统计分析 Tab 样式
   ============================================================ */
.stat-analysis {
  display: flex;
  gap: calc(24 * var(--w));
  width: 100%;
  height: 100%;
}

.stat-analysis__left {
  flex-shrink: 0;
  width: calc(423 * var(--w));
  display: flex;
  flex-direction: column;
  gap: calc(18 * var(--h));
  overflow-y: auto;
}

.stat-analysis__left::-webkit-scrollbar { width: 4px; }
.stat-analysis__left::-webkit-scrollbar-track { background: transparent; }
.stat-analysis__left::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.3); border-radius: 2px; }

.stat-analysis__right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: calc(12 * var(--h));
  padding: calc(12 * var(--h)) 0;
}

/* ---- 统计区块 ---- */
.stat-section {
  display: flex;
  flex-direction: column;
  gap: calc(18 * var(--h));
  flex-shrink: 0;
}

.stat-section--grow {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.stat-section__title {
  display: flex;
  align-items: center;
  gap: calc(12 * var(--w));
}

.stat-section__title-bar {
  width: 4px;
  height: 18px;
  background: #2584ab;
  border-radius: 2px;
  box-shadow: 0 0 6px rgba(37, 132, 171, 0.36);
  flex-shrink: 0;
}

.stat-section__title-text {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(13px, calc(16 * var(--min-scale)), 18px);
  font-weight: 500;
  color: #ffffff;
  white-space: nowrap;
}

/* 数据概览指标 */
.stat-section__metrics {
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
}

.stat-overview-item {
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
  line-height: 0;
}

.stat-overview-item__label {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #f2fbff;
  line-height: normal;
}

.stat-overview-item__value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(18px, calc(22 * var(--min-scale)), 26px);
  font-weight: 700;
  color: #ffffff;
  line-height: normal;
}

.stat-overview-item__unit {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #ffffff;
  margin-left: calc(8 * var(--w));
}

.stat-divider {
  height: 1px;
  background: linear-gradient(
    79.92deg,
    rgba(15, 43, 91, 0) 0%,
    rgb(25, 82, 170) 0%,
    rgba(22, 70, 145, 0.688) 75%,
    rgba(15, 43, 91, 0) 100%
  );
}

.stat-overview-row {
  display: flex;
  gap: calc(36 * var(--w));
}

/* 环形图 */
.stat-ring-wrapper {
  position: relative;
  display: grid;
  grid-template-columns: max-content;
  grid-template-rows: max-content;
  place-items: center;
  align-self: center;
}

.stat-ring {
  grid-column: 1;
  grid-row: 1;
  width: calc(142 * var(--min-scale));
  height: calc(142 * var(--min-scale));
}

.stat-ring__center {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(8 * var(--h));
  margin-top: calc(6 * var(--h));
}

.stat-ring__label {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(13 * var(--min-scale)), 15px);
  font-weight: 400;
  color: #f2fbff;
  white-space: nowrap;
}

.stat-ring__value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(18px, calc(22 * var(--min-scale)), 26px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Top5 排名 */
.stat-rank-list {
  display: flex;
  flex-direction: column;
  gap: calc(4 * var(--h));
}

.stat-rank-item {
  display: flex;
  align-items: center;
  gap: calc(18 * var(--w));
  height: calc(38 * var(--h));
}

.stat-rank-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: calc(4 * var(--h));
}

.stat-rank-item__header {
  display: flex;
  align-items: center;
  gap: calc(19 * var(--w));
}

.stat-rank-item__index {
  width: calc(30 * var(--w));
  height: calc(16 * var(--h));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(12 * var(--min-scale)), 14px);
  font-weight: 700;
  color: #ffffff;
  background: url('@/assets/bigscreen/industry/gongmao.svg') center / contain no-repeat;
}

.stat-rank-item__name {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #ffffff;
  white-space: nowrap;
}

.stat-rank-item__bar {
  display: grid;
  grid-template-rows: max-content;
  width: 100%;
}

.stat-rank-item__bar-bg {
  grid-column: 1;
  grid-row: 1;
  height: 6px;
  border-radius: 3px;
  background: #003063;
}

.stat-rank-item__bar-fill {
  grid-column: 1;
  grid-row: 1;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(175.85deg, rgb(32, 92, 169) 9.4%, rgb(0, 114, 255) 90.5%);
}

.stat-rank-item__rate {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(18 * var(--min-scale)), 22px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

/* 实时动态 */
.stat-feed {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
  overflow-y: auto;
  padding: calc(6 * var(--h)) 0;
}

.stat-feed::-webkit-scrollbar { width: 4px; }
.stat-feed::-webkit-scrollbar-track { background: transparent; }
.stat-feed::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.3); border-radius: 2px; }

.stat-feed__item {
  display: flex;
  align-items: center;
  padding: calc(6 * var(--h)) 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  line-height: normal;
}

.stat-feed__shop {
  flex: 1;
  min-width: 0;
  color: #f1f1f1;
}

.stat-feed__action {
  flex: 1;
  min-width: 0;
  color: #f1f1f1;
  text-align: center;
}

.stat-feed__time {
  flex: 1;
  min-width: 0;
  color: #d8d8d8;
  text-align: center;
}

/* ---- 搜索工具栏 ---- */
.stat-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.stat-toolbar__left {
  display: flex;
  align-items: center;
  gap: calc(18 * var(--w));
}

.stat-search-input {
  display: flex;
  align-items: center;
  gap: calc(12 * var(--w));
  height: calc(36 * var(--h));
  padding: 0 calc(12 * var(--w));
  background: rgba(3, 74, 173, 0);
  border: 1px solid rgba(0, 84, 201, 0.67);
  border-radius: 8px;
  color: #c1c1c1;
  cursor: text;
}

.stat-search-input__placeholder {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  color: #c1c1c1;
  white-space: nowrap;
}

.stat-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: calc(36 * var(--h));
  padding: 0 calc(13 * var(--w));
  background: rgba(3, 74, 173, 0);
  border: 1px solid rgba(0, 84, 201, 0.67);
  border-radius: 8px;
  color: #c1c1c1;
  gap: calc(8 * var(--w));
  cursor: pointer;
}

.stat-select__text {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  color: #c1c1c1;
  white-space: nowrap;
}

.stat-query-btn {
  height: calc(36 * var(--h));
  padding: 0 calc(18 * var(--w));
  background: #0095ff;
  border: none;
  border-radius: 8px;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 500;
  color: #ffffff;
  cursor: pointer;
  line-height: 20px;
}

/* ---- 表格 ---- */
.stat-table-wrapper {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-radius: 8px;
}

.stat-table-wrapper::-webkit-scrollbar { width: 4px; }
.stat-table-wrapper::-webkit-scrollbar-track { background: transparent; }
.stat-table-wrapper::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.3); border-radius: 2px; }

.stat-table__header {
  display: flex;
  gap: calc(6 * var(--w));
  align-items: center;
  height: 44px;
  padding: calc(6 * var(--h)) calc(6 * var(--w));
  background: #0457a7;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.stat-table__header .stat-table__cell {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 500;
  color: #cecece;
  line-height: 21px;
}

.stat-table__row {
  display: flex;
  gap: calc(6 * var(--w));
  align-items: center;
  padding: 0 calc(6 * var(--w));
  border-top: 1px solid rgba(223, 251, 255, 0.16);
}

.stat-table__cell {
  display: flex;
  align-items: center;
  padding: calc(10 * var(--h)) 0;
}

.stat-table__cell--status {
  width: calc(118 * var(--w));
  justify-content: center;
  flex-shrink: 0;
}

.stat-table__cell--name {
  flex: 1;
  min-width: 0;
}

.stat-table__cell--type {
  flex: 1;
  justify-content: center;
  min-width: 0;
}

.stat-table__cell--time {
  flex: 1;
  justify-content: center;
  min-width: 0;
}

.stat-table__cell--action {
  width: calc(48 * var(--w));
  justify-content: center;
  flex-shrink: 0;
}

.stat-table__row .stat-table__cell {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  color: #f2fbff;
  line-height: 21px;
}

.stat-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: calc(2 * var(--h)) calc(6 * var(--w));
  border-radius: 4px;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 18px;
}

.stat-tag--danger {
  background: rgba(255, 106, 106, 0.2);
  color: #ff3a3a;
}

.stat-tag--normal {
  background: rgba(0, 84, 219, 0.2);
  color: #0072ff;
}

.stat-action-icon {
  color: #89b5ff;
  cursor: pointer;
  opacity: 0.6;
}

.stat-action-icon:hover {
  opacity: 1;
}

/* ---- 分页 ---- */
.stat-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 calc(12 * var(--w));
  flex-shrink: 0;
}

.stat-pagination__left {
  display: flex;
  align-items: center;
  gap: calc(12 * var(--w));
}

.stat-pagination__label,
.stat-pagination__total {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  color: #f2fbff;
  white-space: nowrap;
  line-height: 21px;
}

.stat-pagination__selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(8 * var(--w));
  height: calc(36 * var(--h));
  padding: 0 calc(13 * var(--w));
  background: rgba(3, 74, 173, 0);
  border: 1px solid rgba(0, 84, 201, 0.67);
  border-radius: 8px;
  color: #f2fbff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
}

.stat-pagination__right {
  display: flex;
  align-items: center;
  gap: calc(8 * var(--w));
}

.stat-pagination__btn {
  height: 32px;
  padding: calc(6 * var(--h)) calc(10 * var(--w));
  background: rgba(1, 101, 178, 0.3);
  border: none;
  border-radius: 8px;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 500;
  color: #ffffff;
  cursor: pointer;
  line-height: 20px;
}

.stat-pagination__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.stat-pagination__num {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 500;
  color: #bebebe;
  cursor: pointer;
  line-height: 20px;
}

.stat-pagination__num.is-active {
  background: rgba(32, 92, 194, 0.56);
  border: 1px solid rgba(0, 84, 201, 0.67);
  color: #f2fbff;
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
