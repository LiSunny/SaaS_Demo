<template>
  <!-- GIS 标注弹窗 -->
  <el-dialog
    :model-value="visible"
    title="标注位置"
    width="720px"
    :close-on-click-modal="false"
    append-to-body
    @update:model-value="$emit('update:visible', $event)"
    @opened="handleOpened"
    @closed="handleClosed"
  >
    <!-- 搜索栏 -->
    <div class="gis-search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索地点（如：北京市朝阳区）"
        class="gis-search-input"
        clearable
        @input="handleSearchInput"
        @clear="handleSearchClear"
      >
        <template #suffix>
          <el-icon :size="16" class="gis-search-icon"><Search /></el-icon>
        </template>
      </el-input>
      <!-- 搜索建议下拉 -->
      <ul v-if="searchTips.length > 0" class="gis-search-tips">
        <li
          v-for="(tip, idx) in searchTips"
          :key="idx"
          class="gis-search-tip-item"
          @mousedown.prevent="handleSelectTip(tip)"
        >
          <span class="tip-name">{{ tip.name }}</span>
          <span class="tip-district">{{ tip.district || '' }}</span>
        </li>
      </ul>
    </div>

    <!-- 地图容器 -->
    <div ref="mapContainer" class="gis-map-container gis-dialog-map">
      <!-- 中心大头针（CSS 固定居中） -->
      <div class="gis-center-pin">
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 24 16 24s16-12 16-24C32 7.164 24.836 0 16 0z" fill="#DC2626"/>
          <circle cx="16" cy="15" r="6" fill="white"/>
        </svg>
      </div>
      <!-- 操作提示 -->
      <div class="gis-tip-hint">点击地图任意位置可快速标点，或拖动地图移动中心</div>
    </div>

    <!-- 底部坐标信息 -->
    <div v-if="position.lng && position.lat" class="gis-position-info">
      <span class="gis-pos-text">{{ position.lng.toFixed(6) }}, {{ position.lat.toFixed(6) }}</span>
      <span class="gis-pos-coords" :title="address">{{ address || '正在获取地址...' }}</span>
    </div>
    <div v-else class="gis-position-info gis-position-loading">
      <span class="gis-pos-text">正在定位...</span>
    </div>

    <template #footer>
      <div class="gis-dialog-footer">
        <button type="button" class="gis-btn-cancel" @click="$emit('update:visible', false)">
          取消
        </button>
        <button type="button" class="gis-btn-confirm" @click="handleConfirm">
          确认标注
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onBeforeUnmount } from 'vue'
import { Search } from '@element-plus/icons-vue'

/**
 * GisMapPicker - 地图标点组件
 *
 * 功能：点击地图标点 / 拖动地图 / 搜索地点 / 逆地理编码
 * 参考文档：https://lbs.amap.com/api/javascript-api-v2/guide/services/geocoder
 *
 * 用法：
 *   <GisMapPicker
 *     v-model:visible="visible"
 *     v-model:location="form.mapLocation"
 *     v-model:address="address"
 *   />
 *
 * location 格式："lng,lat"（如 "116.397428,39.90923"）
 */

interface Props {
  visible: boolean
  /** 坐标字符串 "lng,lat" */
  location?: string
}

const props = withDefaults(defineProps<Props>(), {
  location: '',
})

export interface AddressComponent {
  province: string
  city: string
  district: string
  township: string
  street: string
  streetNumber: string
}

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:location': [value: string]
  'update:address': [value: string]
  'confirm': [payload: { location: string; address: string; lng: number; lat: number; addressComponent?: AddressComponent }]
}>()

// ===== 状态 =====
const mapContainer = ref<HTMLDivElement>()
const searchKeyword = ref('')
const searchTips = ref<{ name: string; district: string; location: { lng: number; lat: number } }[]>([])
const address = ref('')
const position = reactive({ lng: 0, lat: 0 })
/** 结构化地址组件，供外部自动填充行政区划和详细地址 */
const currentAddressComponent = ref<AddressComponent | null>(null)

let mapInstance: any = null
let placeSearch: any = null
let geocoder: any = null
let searchTimer: ReturnType<typeof setTimeout> | null = null

// ===== 弹窗事件 =====
function handleOpened() {
  nextTick(() => initMap())
}

function handleClosed() {
  destroyMap()
  searchKeyword.value = ''
  searchTips.value = []
}

function handleConfirm() {
  if (position.lng && position.lat) {
    const locationStr = `${position.lng.toFixed(6)},${position.lat.toFixed(6)}`
    emit('update:location', locationStr)
    emit('update:address', address.value)
    emit('confirm', {
      location: locationStr,
      address: address.value,
      lng: position.lng,
      lat: position.lat,
      addressComponent: currentAddressComponent.value || undefined,
    })
  }
  emit('update:visible', false)
}

// ===== 逆地理编码 =====
function reverseGeocode(lng: number, lat: number) {
  const AMap = (window as any).AMap
  AMap?.plugin('AMap.Geocoder', () => {
    if (!geocoder) {
      geocoder = new AMap.Geocoder({ city: '全国' })
    }
    geocoder.getAddress([lng, lat], (status: string, result: any) => {
      if (status === 'complete' && result?.info === 'OK' && result?.regeocode?.formattedAddress) {
        address.value = result.regeocode.formattedAddress
        // 保存结构化地址组件
        const ac = result.regeocode.addressComponent || {}
        currentAddressComponent.value = {
          province: ac.province || '',
          city: ac.city || '',
          district: ac.district || '',
          township: ac.township || '',
          street: ac.street || '',
          streetNumber: ac.streetNumber || '',
        }
        emit('update:address', address.value)
      } else {
        console.warn('[GisMapPicker] 逆地理编码失败', { status, info: result?.info })
        address.value = `经度 ${lng.toFixed(6)}, 纬度 ${lat.toFixed(6)}`
        emit('update:address', address.value)
      }
    })
  })
}

// ===== 地图事件 =====
function handleMapMoveEnd() {
  if (!mapInstance) return
  const center = mapInstance.getCenter()
  position.lng = center.lng
  position.lat = center.lat
  reverseGeocode(center.lng, center.lat)
}

function handleMapClick(e: any) {
  if (!mapInstance || !e?.lnglat) return
  mapInstance.setCenter([e.lnglat.lng, e.lnglat.lat])
}

// ===== 搜索 =====
function handleSearchInput(keyword: string) {
  if (searchTimer) clearTimeout(searchTimer)
  if (!keyword.trim()) {
    searchTips.value = []
    return
  }
  searchTimer = setTimeout(() => {
    if (placeSearch) {
      placeSearch.search(keyword, (status: string, result: any) => {
        if (status === 'complete' && result?.poiList?.pois) {
          searchTips.value = result.poiList.pois
            .filter((p: any) => p.location && p.location.lng && p.location.lat)
            .slice(0, 6)
            .map((p: any) => ({
              name: p.name,
              district: p.address || p.district || '',
              location: { lng: p.location.lng, lat: p.location.lat },
            }))
        } else {
          searchTips.value = []
        }
      })
    }
  }, 400)
}

function handleSearchClear() {
  searchKeyword.value = ''
  searchTips.value = []
}

function handleSelectTip(tip: { name: string; location: { lng: number; lat: number } }) {
  searchKeyword.value = tip.name
  searchTips.value = []
  if (mapInstance && tip.location.lng && tip.location.lat) {
    mapInstance.setCenter([tip.location.lng, tip.location.lat])
    mapInstance.setZoom(16)
    position.lng = tip.location.lng
    position.lat = tip.location.lat
    reverseGeocode(tip.location.lng, tip.location.lat)
  }
}

// ===== 初始化地图 =====
function initMap() {
  if (!mapContainer.value || !(window as any).AMap) return

  const AMap = (window as any).AMap
  const DEFAULT_CENTER: [number, number] = [116.397428, 39.90923]

  const syncPosition = (lng: number, lat: number) => {
    position.lng = lng
    position.lat = lat
    reverseGeocode(lng, lat)
  }

  AMap.plugin(
    ['AMap.Geolocation', 'AMap.PlaceSearch'],
    () => {
      mapInstance = new AMap.Map(mapContainer.value, {
        zoom: 12,
        center: DEFAULT_CENTER,
        mapStyle: 'amap://styles/light',
        viewMode: '2D',
        resizeEnable: true,
      })

      placeSearch = new AMap.PlaceSearch({ citylimit: false })

      mapInstance.on('moveend', handleMapMoveEnd)
      mapInstance.on('click', handleMapClick)

      // 立即同步默认中心坐标
      syncPosition(...DEFAULT_CENTER)

      // 编辑回填坐标优先
      const initLngLat = parseLocation(props.location)
      if (initLngLat) {
        mapInstance.setCenter(initLngLat)
        syncPosition(initLngLat[0], initLngLat[1])
      }

      // IP 定位（仅在无回填坐标时启用）
      const geolocation = new AMap.Geolocation({
        enableHighAccuracy: false,
        timeout: 10000,
        needAddress: true,
      })

      geolocation.getCurrentPosition((status: string, result: any) => {
        if (status === 'complete' && result?.position) {
          const { lng, lat } = result.position
          if (!initLngLat) {
            mapInstance.setCenter([lng, lat])
            syncPosition(lng, lat)
          }
          if (result.formattedAddress && !initLngLat) {
            address.value = result.formattedAddress
            emit('update:address', address.value)
          }
        }
      })
    },
  )
}

// 解析坐标字符串
function parseLocation(loc: string): [number, number] | null {
  if (!loc) return null
  const parts = loc.split(',')
  if (parts.length !== 2) return null
  const lng = parseFloat(parts[0])
  const lat = parseFloat(parts[1])
  if (isNaN(lng) || isNaN(lat)) return null
  return [lng, lat]
}

// ===== 销毁 =====
function destroyMap() {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  if (mapInstance) {
    // 先取下自定义 DOM 元素，避免被 AMap destroy() 清空
    const pin = mapContainer.value?.querySelector('.gis-center-pin') as HTMLElement | null
    const hint = mapContainer.value?.querySelector('.gis-tip-hint') as HTMLElement | null
    if (pin) pin.remove()
    if (hint) hint.remove()

    mapInstance.destroy()
    mapInstance = null

    // 恢复自定义 DOM 元素，供下次 initMap 使用
    if (pin && mapContainer.value) mapContainer.value.appendChild(pin)
    if (hint && mapContainer.value) mapContainer.value.appendChild(hint)
  }
  placeSearch = null
  geocoder = null
}

onBeforeUnmount(() => {
  destroyMap()
})
</script>

<style scoped>
/* ===== GIS 弹窗内地图 ===== */
.gis-search-bar { position: relative; margin-bottom: 10px; }
.gis-search-input { width: 100% !important; }
.gis-search-input :deep(.el-input__wrapper) { border-radius: 8px; box-shadow: none; border: 1px solid #DEDEDE; }
.gis-search-input :deep(.el-input__wrapper:hover) { border-color: var(--accent-primary, #3678E3); }
.gis-search-icon { color: var(--text-muted, #5E5E5E); }

.gis-search-tips {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 999;
  margin: 4px 0 0 0; padding: 0; list-style: none;
  background: #fff; border: 1px solid #E5E5E5; border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden; max-height: 240px; overflow-y: auto;
}
.gis-search-tip-item {
  display: flex; align-items: center; gap: 8px; padding: 10px 14px;
  cursor: pointer; font-size: 14px; color: var(--text-primary, #101010);
  transition: background 0.15s;
}
.gis-search-tip-item:hover { background: #F5F8FF; }
.gis-search-tip-item:not(:last-child) { border-bottom: 1px solid #F0F0F0; }
.tip-name { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tip-district { color: var(--text-placeholder, #999); font-size: 12px; flex-shrink: 0; margin-left: auto; }

.gis-map-container {
  position: relative; width: 100%; height: 300px;
  border: 1px solid #DEDEDE; border-radius: 8px; overflow: hidden; background: #F5F5F5;
}
.gis-center-pin {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -100%);
  z-index: 9999; pointer-events: none;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: transform 0.1s ease-out;
}
.gis-dialog-map { height: 420px; }
.gis-tip-hint {
  position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
  z-index: 9999; background: rgba(0, 0, 0, 0.6); color: #fff;
  font-size: 12px; padding: 4px 12px; border-radius: 12px;
  pointer-events: none; white-space: nowrap;
}
.gis-dialog-footer { display: flex; justify-content: flex-end; gap: 10px; }
.gis-position-info {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 8px; padding: 8px 12px; background: #F7F8FA;
  border-radius: 8px; font-size: 13px; gap: 12px;
}
.gis-position-loading { justify-content: center; color: var(--text-placeholder, #999); }
.gis-pos-text {
  color: var(--text-secondary, #2E2E2E); flex: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.gis-pos-coords {
  color: var(--accent-primary, #3678E3); font-weight: 500;
  white-space: nowrap; flex-shrink: 0;
}

/* 弹窗底部按钮 */
.gis-btn-cancel {
  display: inline-flex; align-items: center; gap: 10px; padding: 8px 12px; height: 37px;
  border: 1px solid rgba(220, 38, 38, 0.2); border-radius: 8px; background: rgba(220, 38, 38, 0.1);
  color: var(--semantic-danger, #DC2626); font-size: var(--font-small, 14px); font-weight: 500;
  font-family: inherit; cursor: pointer; white-space: nowrap; transition: opacity 0.15s;
}
.gis-btn-cancel:hover { opacity: 0.8; }

.gis-btn-confirm {
  display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px;
  width: 107px; height: 37px; border: none; border-radius: 8px;
  background: var(--semantic-info, #3678E3); color: #fff;
  font-size: var(--font-small, 14px); font-weight: 500; font-family: inherit;
  cursor: pointer; white-space: nowrap; transition: opacity 0.15s;
}
.gis-btn-confirm:hover { opacity: 0.85; }
</style>
