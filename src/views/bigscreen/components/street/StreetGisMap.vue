<template>
  <div class="street-gis-map">
    <!-- 标题栏 -->
    <BigscreenModuleTitle title="商业街安全一张图" subtitle="GIS Overview" />

    <div class="gis-body">
      <!-- 地图区域 -->
      <div class="gis-canvas">
        <!-- 街区网格背景 -->
        <div class="gis-grid">
          <div
            v-for="block in streetBlocks"
            :key="block.id"
            class="gis-block"
            :style="block.style"
          />
        </div>

        <!-- 商铺点位 -->
        <div
          v-for="shop in shops"
          :key="shop.id"
          class="gis-shop"
          :style="shop.posStyle"
          :class="`gis-shop--${shop.status}`"
          @click="selectedShop = shop"
        >
          <div class="shop-dot" />
          <span class="shop-name">{{ shop.name }}</span>
        </div>

        <!-- 中心道路 -->
        <div class="gis-road" />
        <div class="gis-road gis-road--cross" />

        <!-- 底部图例 -->
        <div class="gis-legend">
          <div v-for="item in legendItems" :key="item.label" class="legend-item">
            <span class="legend-dot" :style="{ background: item.color }" />
            <span class="legend-label">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧统计面板 -->
      <div class="gis-stats-panel">
        <div class="gis-stats-title">商铺状态统计</div>
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="gis-stat-item"
        >
          <span class="stat-dot" :style="{ background: stat.color }" />
          <span class="stat-label">{{ stat.label }}</span>
          <span class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</span>
          <span class="stat-unit">家</span>
        </div>
      </div>

      <!-- 选中商铺弹窗 -->
      <div v-if="selectedShop" class="gis-shop-popup" :style="popupStyle">
        <div class="popup-header">
          <div class="popup-title">
            <span class="popup-dot" :class="`popup-dot--${selectedShop.status}`" />
            {{ selectedShop.name }}
          </div>
          <span class="popup-tag">重点关注</span>
          <button class="popup-close" @click="selectedShop = null">×</button>
        </div>
        <div class="popup-body">
          <div class="popup-row">
            <span class="popup-label">经营类型</span>
            <span class="popup-text">{{ selectedShop.businessType }}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">负责人</span>
            <span class="popup-text">{{ selectedShop.person }}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">设备状态</span>
            <span class="popup-text" :class="`text--${selectedShop.status}`">{{ selectedShop.deviceStatus }}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">今日履职</span>
            <span class="popup-text">{{ selectedShop.duty }}</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">隐患</span>
            <span class="popup-text text--warning">{{ selectedShop.hazards }}项</span>
          </div>
          <div class="popup-row">
            <span class="popup-label">告警</span>
            <span class="popup-text text--danger">{{ selectedShop.alarms }}起</span>
          </div>
        </div>
        <div class="popup-footer">
          <button class="popup-btn">查看详情</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BigscreenModuleTitle from '../BigscreenModuleTitle.vue'

interface Shop {
  id: number
  name: string
  status: 'normal' | 'device-abnormal' | 'duty-overdue' | 'alarm' | 'hazard' | 'offline'
  businessType: string
  person: string
  deviceStatus: string
  duty: string
  hazards: number
  alarms: number
  posStyle: Record<string, string>
}

const selectedShop = ref<Shop | null>(null)

const popupStyle = computed(() => {
  if (!selectedShop.value) return {}
  const left = parseFloat(selectedShop.value.posStyle.left) || 50
  const top = parseFloat(selectedShop.value.posStyle.top) || 50
  return {
    left: `calc(${left}% + 20px)`,
    top: `calc(${top}% - 60px)`,
  }
})

// 街区背景块
const streetBlocks = [
  { id: 1, style: { top: '8%', left: '6%', width: '14%', height: '18%' } },
  { id: 2, style: { top: '8%', left: '26%', width: '14%', height: '18%' } },
  { id: 3, style: { top: '8%', left: '60%', width: '14%', height: '18%' } },
  { id: 4, style: { top: '8%', left: '80%', width: '14%', height: '18%' } },
  { id: 5, style: { top: '32%', left: '6%', width: '14%', height: '18%' } },
  { id: 6, style: { top: '32%', left: '26%', width: '14%', height: '18%' } },
  { id: 7, style: { top: '32%', left: '60%', width: '14%', height: '18%' } },
  { id: 8, style: { top: '32%', left: '80%', width: '14%', height: '18%' } },
  { id: 9, style: { top: '56%', left: '6%', width: '14%', height: '18%' } },
  { id: 10, style: { top: '56%', left: '26%', width: '14%', height: '18%' } },
  { id: 11, style: { top: '56%', left: '60%', width: '14%', height: '18%' } },
  { id: 12, style: { top: '56%', left: '80%', width: '14%', height: '18%' } },
]

const shops: Shop[] = [
  { id: 1, name: '好旺角餐厅', status: 'normal', businessType: '餐饮', person: '张三', deviceStatus: '在线', duty: '已完成', hazards: 0, alarms: 0, posStyle: { top: '12%', left: '12%' } },
  { id: 2, name: '鑫源便利店', status: 'normal', businessType: '零售', person: '李四', deviceStatus: '在线', duty: '已完成', hazards: 1, alarms: 0, posStyle: { top: '12%', left: '32%' } },
  { id: 3, name: '阳光服饰', status: 'normal', businessType: '服装', person: '王五', deviceStatus: '在线', duty: '已完成', hazards: 0, alarms: 0, posStyle: { top: '12%', left: '66%' } },
  { id: 4, name: '恒达五金', status: 'normal', businessType: '五金', person: '赵六', deviceStatus: '在线', duty: '已完成', hazards: 0, alarms: 1, posStyle: { top: '12%', left: '86%' } },
  { id: 5, name: '李记烧烤', status: 'duty-overdue', businessType: '餐饮', person: '李建国', deviceStatus: '在线', duty: '连续3天逾期', hazards: 2, alarms: 3, posStyle: { top: '34%', left: '12%' } },
  { id: 6, name: 'XX餐饮', status: 'alarm', businessType: '餐饮', person: '陈志强', deviceStatus: '部分异常', duty: '连续2次未打卡', hazards: 4, alarms: 5, posStyle: { top: '34%', left: '32%' } },
  { id: 7, name: '年华超市', status: 'device-abnormal', businessType: '超市', person: '周明', deviceStatus: '设备异常', duty: '已完成', hazards: 3, alarms: 2, posStyle: { top: '34%', left: '66%' } },
  { id: 8, name: '飞越网吧', status: 'offline', businessType: '网吧', person: '吴伟', deviceStatus: '设备离线', duty: '已逾期', hazards: 5, alarms: 4, posStyle: { top: '34%', left: '86%' } },
  { id: 9, name: '小辣椒火锅', status: 'normal', businessType: '餐饮', person: '刘芳', deviceStatus: '在线', duty: '已完成', hazards: 0, alarms: 0, posStyle: { top: '58%', left: '12%' } },
  { id: 10, name: '美佳化妆品', status: 'duty-overdue', businessType: '美妆', person: '黄丽', deviceStatus: '在线', duty: '逾期1天', hazards: 2, alarms: 0, posStyle: { top: '58%', left: '32%' } },
  { id: 11, name: '大华药店', status: 'normal', businessType: '医药', person: '孙磊', deviceStatus: '在线', duty: '已完成', hazards: 0, alarms: 0, posStyle: { top: '58%', left: '66%' } },
  { id: 12, name: '瑞丰水果', status: 'hazard', businessType: '水果', person: '钱进', deviceStatus: '低电量', duty: '已完成', hazards: 1, alarms: 1, posStyle: { top: '58%', left: '86%' } },
]

const legendItems = [
  { label: '正常', color: '#22c55e' },
  { label: '设备异常', color: '#eab308' },
  { label: '履职逾期', color: '#f59e0b' },
  { label: '隐患整改中', color: '#ef4444' },
  { label: '烟感报警', color: '#ff0000' },
  { label: '设备离线', color: '#6b7280' },
]

const stats = [
  { label: '正常商铺', value: '265', color: '#22c55e' },
  { label: '设备异常', value: '12', color: '#eab308' },
  { label: '履职逾期', value: '6', color: '#f59e0b' },
  { label: '隐患整改中', value: '3', color: '#ef4444' },
  { label: '烟感报警', value: '2', color: '#ff0000' },
  { label: '设备离线', value: '3', color: '#6b7280' },
]
</script>

<style scoped>
.street-gis-map {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.gis-body {
  flex: 1;
  display: flex;
  background: linear-gradient(180deg, rgba(1, 70, 146, 0.4) 0%, rgba(4, 87, 167, 0.2) 100%);
  border: 1px solid rgba(71, 132, 232, 0.3);
  border-top: none;
  border-radius: 0 0 4px 4px;
  overflow: hidden;
  min-height: 0;
  position: relative;
}

/* ===== 地图画布 ===== */
.gis-canvas {
  flex: 1;
  position: relative;
  background: rgba(2, 20, 55, 0.6);
  min-width: 0;
}

/* 街区网格 */
.gis-grid {
  position: absolute;
  inset: 0;
}

.gis-block {
  position: absolute;
  background: rgba(30, 80, 160, 0.12);
  border: 1px solid rgba(71, 132, 232, 0.15);
  border-radius: 2px;
}

/* 中心道路 */
.gis-road {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(71, 132, 232, 0.4), rgba(71, 132, 232, 0.4), transparent);
  transform: translateY(-50%);
}
.gis-road--cross {
  top: 18%;
  left: 45%;
  width: 2px;
  height: 64%;
  right: auto;
  background: linear-gradient(180deg, transparent, rgba(71, 132, 232, 0.4), rgba(71, 132, 232, 0.4), transparent);
  transform: none;
}

/* 商铺点位 */
.gis-shop {
  position: absolute;
  display: flex;
  align-items: center;
  gap: calc(4 * var(--w));
  cursor: pointer;
  z-index: 2;
  transition: transform 0.2s ease;
}

.gis-shop:hover {
  transform: scale(1.15);
  z-index: 3;
}

.shop-dot {
  width: calc(8 * var(--min-scale));
  height: calc(8 * var(--min-scale));
  border-radius: 50%;
  flex-shrink: 0;
}

.shop-name {
  font-size: clamp(7px, calc(10 * var(--min-scale)), 13px);
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
}

/* 状态颜色 */
.gis-shop--normal .shop-dot {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
}
.gis-shop--device-abnormal .shop-dot {
  background: #eab308;
  box-shadow: 0 0 8px rgba(234, 179, 8, 0.6);
}
.gis-shop--duty-overdue .shop-dot {
  background: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
}
.gis-shop--alarm .shop-dot {
  background: #ef4444;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.7);
  animation: alarm-pulse 1.5s ease-in-out infinite;
}
.gis-shop--hazard .shop-dot {
  background: #ff0000;
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.7);
  animation: alarm-pulse 1.5s ease-in-out infinite;
}
.gis-shop--offline .shop-dot {
  background: #6b7280;
  box-shadow: none;
}

@keyframes alarm-pulse {
  0%, 100% { box-shadow: 0 0 6px rgba(239, 68, 68, 0.5); }
  50% { box-shadow: 0 0 14px rgba(239, 68, 68, 0.9); }
}

/* 底部图例 */
.gis-legend {
  position: absolute;
  bottom: calc(8 * var(--h));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: calc(12 * var(--w));
  padding: calc(4 * var(--h)) calc(8 * var(--w));
  background: rgba(2, 20, 55, 0.7);
  border: 1px solid rgba(71, 132, 232, 0.3);
  border-radius: 6px;
  z-index: 5;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: calc(4 * var(--w));
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-size: clamp(7px, calc(10 * var(--min-scale)), 13px);
  color: rgba(224, 234, 250, 0.8);
  white-space: nowrap;
}

/* ===== 右侧统计面板 ===== */
.gis-stats-panel {
  width: calc(160 * var(--w));
  flex-shrink: 0;
  padding: calc(12 * var(--h)) calc(10 * var(--w));
  display: flex;
  flex-direction: column;
  gap: calc(6 * var(--h));
  border-left: 1px solid rgba(71, 132, 232, 0.2);
  overflow-y: auto;
  background: rgba(2, 20, 55, 0.4);
}

.gis-stats-title {
  font-family: 'Source-KeynoteartHans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(14 * var(--min-scale)), 17px);
  font-weight: 700;
  color: #89b5ff;
  margin-bottom: calc(4 * var(--h));
}

.gis-stat-item {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--w));
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.stat-label {
  flex: 1;
  font-size: clamp(8px, calc(11 * var(--min-scale)), 14px);
  color: rgba(224, 234, 250, 0.8);
  white-space: nowrap;
}

.stat-value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(10px, calc(14 * var(--min-scale)), 18px);
  font-weight: 700;
}

.stat-unit {
  font-size: clamp(8px, calc(11 * var(--min-scale)), 14px);
  color: rgba(137, 181, 255, 0.6);
}

/* ===== 选中商铺弹窗 ===== */
.gis-shop-popup {
  position: absolute;
  width: calc(200 * var(--w));
  background: rgba(2, 20, 55, 0.95);
  border: 1px solid rgba(71, 132, 232, 0.4);
  border-radius: 8px;
  z-index: 10;
  padding: calc(10 * var(--h)) calc(12 * var(--w));
  backdrop-filter: blur(8px);
}

.popup-header {
  display: flex;
  align-items: center;
  gap: calc(6 * var(--w));
  margin-bottom: calc(8 * var(--h));
  padding-bottom: calc(6 * var(--h));
  border-bottom: 1px solid rgba(71, 132, 232, 0.2);
}

.popup-title {
  font-size: clamp(10px, calc(13 * var(--min-scale)), 16px);
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: calc(6 * var(--w));
  flex: 1;
}

.popup-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.popup-dot--normal { background: #22c55e; }
.popup-dot--device-abnormal { background: #eab308; }
.popup-dot--duty-overdue { background: #f59e0b; }
.popup-dot--alarm { background: #ef4444; }
.popup-dot--hazard { background: #ff0000; }
.popup-dot--offline { background: #6b7280; }

.popup-tag {
  font-size: clamp(7px, calc(9 * var(--min-scale)), 11px);
  padding: 2px 6px;
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px;
  white-space: nowrap;
}

.popup-close {
  background: none;
  border: none;
  color: rgba(224, 234, 250, 0.5);
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}
.popup-close:hover {
  color: #fff;
}

.popup-body {
  display: flex;
  flex-direction: column;
  gap: calc(4 * var(--h));
}

.popup-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: clamp(8px, calc(11 * var(--min-scale)), 13px);
}

.popup-label {
  color: rgba(137, 181, 255, 0.7);
}

.popup-text {
  color: rgba(224, 234, 250, 0.9);
}

.text--warning { color: #f59e0b !important; }
.text--danger { color: #ef4444 !important; }

.popup-footer {
  margin-top: calc(8 * var(--h));
  display: flex;
  justify-content: flex-end;
}

.popup-btn {
  padding: calc(4 * var(--h)) calc(10 * var(--w));
  font-size: clamp(8px, calc(11 * var(--min-scale)), 13px);
  color: #89b5ff;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 4px;
  cursor: pointer;
}
.popup-btn:hover {
  background: rgba(59, 130, 246, 0.25);
}
</style>
