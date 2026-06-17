<template>
  <Teleport to="body">
    <Transition name="street-modal">
      <div v-if="modelValue" class="street-overlay" @click.self="close">
        <div class="street-modal">
          <!-- 标题栏 -->
          <div class="street-modal__header">
            <BigscreenModuleTitle title="示范街专题" subtitle="Demonstration Street" />
            <button class="street-modal__close" @click="close">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <!-- 内容区 -->
          <div class="street-modal__body">
            <!-- 统计指标行 -->
            <div class="street-stats-row">
              <div
                v-for="stat in statsData"
                :key="stat.label"
                class="street-stat-card"
              >
                <div class="street-stat-card__icon">
                  <div class="stat-icon-circle"></div>
                </div>
                <div class="street-stat-card__info">
                  <div class="street-stat-card__label">{{ stat.label }}</div>
                  <div class="street-stat-card__value">
                    <span class="stat-value-num">{{ stat.value }}</span>
                    <span class="stat-value-unit">{{ stat.unit }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分类数据展示区 -->
            <div class="street-content">
              <!-- Seg 切换 -->
              <div class="street-seg">
                <div
                  v-for="tab in demoStreetTabs"
                  :key="tab.key"
                  class="street-seg__item"
                  :class="{ 'is-active': activeTab === tab.key }"
                  @click="switchTab(tab.key)"
                >
                  {{ tab.label }}
                </div>
              </div>

              <!-- 安全一张图：3D 地图 -->
              <div v-show="activeTab === 'safety-map'" class="street-content__area street-content__area--map">
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

              <!-- 其他 Tab 占位 -->
              <div v-show="activeTab !== 'safety-map'" class="street-content__area">
                <div class="street-content__placeholder">
                  <span class="placeholder-icon">📋</span>
                  <span>{{ currentTabLabel }} — 内容开发中</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import BigscreenModuleTitle from './BigscreenModuleTitle.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function close() {
  emit('update:modelValue', false)
}

// 统计指标
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

// Seg 切换标签
interface TabItem {
  key: string
  label: string
}

const demoStreetTabs: TabItem[] = [
  { key: 'safety-map', label: '安全一张图' },
  { key: 'duty-supervision', label: '商户履责监管' },
  { key: 'hazard-track', label: '隐患整改跟踪' },
  { key: 'alarm-center', label: '告警处置中心' },
  { key: 'stats-analysis', label: '统计分析' },
]

const activeTab = ref('safety-map')

const currentTabLabel = computed(() => {
  const tab = demoStreetTabs.find(t => t.key === activeTab.value)
  return tab ? tab.label : ''
})

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
  // ---- 正常商铺 (绿色) ----
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

  // ---- 异常设备 (黄色) ----
  { id: 13, name: '李记烧烤', lng: 109.601, lat: 23.082, category: 'device-abnormal', person: '李建国', phone: '138-9944-5523', businessType: '餐饮' },
  { id: 14, name: '老味道面馆', lng: 109.608, lat: 23.083, category: 'device-abnormal', person: '何强', phone: '139-8812-6634', businessType: '餐饮' },
  { id: 15, name: '永辉电器维修', lng: 109.606, lat: 23.074, category: 'device-abnormal', person: '郑刚', phone: '137-6678-7745', businessType: '维修' },
  { id: 16, name: '好邻居超市', lng: 109.595, lat: 23.078, category: 'device-abnormal', person: '马超', phone: '136-5534-8856', businessType: '超市' },

  // ---- 履职逾期 (橙色) ----
  { id: 17, name: 'XX餐饮店', lng: 109.610, lat: 23.081, category: 'duty-overdue', person: '陈志强', phone: '158-9923-9967', businessType: '餐饮' },
  { id: 18, name: '顺风货运站', lng: 109.597, lat: 23.079, category: 'duty-overdue', person: '吴伟', phone: '188-4455-1178', businessType: '物流' },
  { id: 19, name: '金冠蛋糕坊', lng: 109.604, lat: 23.084, category: 'duty-overdue', person: '邓丽', phone: '186-7789-2289', businessType: '食品' },

  // ---- 烟感报警 (红色) ----
  { id: 20, name: '沸腾鱼庄', lng: 109.603, lat: 23.083, category: 'smoke-alarm', person: '郭海', phone: '177-3366-3390', businessType: '餐饮' },
  { id: 21, name: '湘味土菜馆', lng: 109.600, lat: 23.080, category: 'smoke-alarm', person: '彭涛', phone: '159-2244-4401', businessType: '餐饮' },
  { id: 22, name: '老四川火锅城', lng: 109.609, lat: 23.077, category: 'smoke-alarm', person: '唐亮', phone: '182-1122-5512', businessType: '餐饮' },

  // ---- 设备离线 (灰色) ----
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

// 港南区中心坐标
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

// ===== 掩模层：非商业街区域淡化 =====
function addMaskLayer(AMap: any) {
  if (!safetyMapInstance) return

  // 商业街区域轮廓（根据商铺分布勾勒）
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

  // 外框：远超当前视野范围的大矩形
  const outerMask: [number, number][] = [
    [109.3, 22.8],
    [109.9, 22.8],
    [109.9, 23.4],
    [109.3, 23.4],
  ]

  // AMap 多边形带镂空：path 为 [外环, 内环(洞)]
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
  // 已存在则复用
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

  // InfoWindow
  safetyInfoWindow = new AMap.InfoWindow({
    isCustom: true,
    offset: new AMap.Pixel(0, -24),
    autoMove: true,
  })

  // 添加商铺散布标记
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

  // 添加掩模：非商业街区域淡化
  addMaskLayer(AMap)

  // 自动适应视野（等待地图瓦片加载完成后执行，添加 padding 避让悬浮面板）
  const doFitView = () => {
    if (!safetyMapInstance || safetyMarkers.length === 0) return
    safetyMapInstance.setFitView(safetyMarkers, false, [50, 50, 50, 50], 300)
  }

  // 监听 tilesloaded 事件，确保瓦片加载完成后再 fitView
  safetyMapInstance.on('complete', () => {
    // 稍微延迟，等待 DOM 中的自定义 Marker 内容也渲染完成
    setTimeout(doFitView, 150)
  })

  // 兜底：如果 complete 事件迟迟不触发，500ms 后执行
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

// 弹窗打开时初始化地图
watch(() => props.modelValue, (val) => {
  if (val && activeTab.value === 'safety-map') {
    nextTick(() => initSafetyMap())
  } else if (!val) {
    destroyMap()
  }
})

onBeforeUnmount(() => {
  destroyMap()
})
</script>

<style scoped>
/* ===== 示范街专题弹窗 ===== */
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
  width: 95vw;
  max-width: 1280px;
  height: 78vh;
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

/* ===== 统计指标行 ===== */
.street-stats-row {
  display: flex;
  gap: calc(12 * var(--w));
  padding: calc(4 * var(--h)) 0;
}

.street-stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: calc(12 * var(--w));
  padding: calc(12 * var(--h)) calc(14 * var(--w));
  background: rgba(2, 20, 50, 0.55);
  border: 1px solid rgba(71, 132, 232, 0.18);
  border-radius: 6px;
}

.street-stat-card__icon {
  flex-shrink: 0;
  width: calc(56 * var(--min-scale));
  height: calc(56 * var(--min-scale));
}

.stat-icon-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    from 180deg,
    rgba(60, 211, 215, 0.6) 0deg,
    rgba(37, 132, 171, 0.4) 120deg,
    rgba(234, 173, 108, 0.5) 240deg,
    rgba(60, 211, 215, 0.6) 360deg
  );
  box-shadow:
    0 0 12px rgba(37, 132, 171, 0.35),
    inset 0 0 6px rgba(255, 255, 255, 0.08);
}

.street-stat-card__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: calc(8 * var(--h));
}

.street-stat-card__label {
  position: relative;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(11px, calc(15 * var(--min-scale)), 18px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

.street-stat-card__label::after {
  content: '';
  display: block;
  width: 100%;
  height: 1px;
  margin-top: calc(4 * var(--h));
  background: linear-gradient(
    to right,
    rgba(15, 43, 91, 0) 0%,
    rgba(25, 82, 170, 1) 15%,
    rgba(22, 70, 145, 0.688) 75%,
    rgba(15, 43, 91, 0) 100%
  );
}

.street-stat-card__value {
  display: flex;
  align-items: baseline;
  gap: calc(2 * var(--w));
  white-space: nowrap;
}

.stat-value-num {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(22 * var(--min-scale)), 26px);
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.stat-value-unit {
  font-family: 'Heiti TC', 'PingFang SC', sans-serif;
  font-size: clamp(10px, calc(14 * var(--min-scale)), 16px);
  font-weight: 500;
  color: rgba(137, 181, 255, 0.7);
}

/* ===== Seg 切换 ===== */
.street-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: calc(14 * var(--h));
  min-height: 0;
}

.street-seg {
  display: flex;
  gap: 0;
  flex-shrink: 0;
}

.street-seg__item {
  flex: 1;
  padding: calc(8 * var(--h)) 0;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
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

.street-seg__item.is-active {
  background: rgba(0, 184, 219, 0.3);
  -webkit-text-fill-color: #ffffff;
  color: #ffffff;
  border-radius: 4px;
}

.street-seg__item:not(.is-active):hover {
  background: rgba(0, 184, 219, 0.12);
  -webkit-text-fill-color: #89b5ff;
  color: #89b5ff;
  border-radius: 4px;
}

/* ===== 内容区（预留） ===== */
.street-content__area {
  flex: 1;
  min-height: 200px;
  background: rgba(2, 20, 50, 0.4);
  border: 1px dashed rgba(71, 132, 232, 0.25);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 地图区域去除占位样式 */
.street-content__area--map {
  display: block;
  border-style: solid;
  position: relative;
  overflow: hidden;
  min-height: 400px;
}

.street-content__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(8 * var(--h));
  color: rgba(137, 181, 255, 0.4);
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
}

.placeholder-icon {
  font-size: clamp(24px, calc(40 * var(--min-scale)), 48px);
  opacity: 0.5;
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
