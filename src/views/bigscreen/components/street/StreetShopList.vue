<template>
  <div class="shop-list">
    <!-- 搜索/筛选栏 -->
    <div class="shop-list__toolbar">
      <div class="shop-list__filters">
        <div class="shop-list__search">
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="7" cy="7" r="5" />
            <line x1="11" y1="11" x2="14" y2="14" />
          </svg>
          <span class="shop-list__search-placeholder">搜索商户名称...</span>
        </div>
        <div class="shop-list__select">
          <span class="shop-list__select-text">全部业态</span>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="4 6 8 10 12 6" />
          </svg>
        </div>
        <button class="shop-list__query-btn">查询</button>
      </div>
      <span class="shop-list__total-label">共 {{ shopTableData.length }} 家商户</span>
    </div>

    <!-- 商户表格 -->
    <div class="shop-list__table-wrapper">
      <!-- 表头 -->
      <div class="shop-list__table-header">
        <div class="shop-list__th shop-list__th--index">序号</div>
        <div class="shop-list__th shop-list__th--name">商户名称</div>
        <div class="shop-list__th shop-list__th--category">商户业态</div>
        <div class="shop-list__th shop-list__th--scope">设备数量</div>
      </div>
      <!-- 表体 -->
      <div class="shop-list__table-body">
        <div v-for="(row, idx) in paginatedShopRows" :key="idx" class="shop-list__table-row">
          <div class="shop-list__td shop-list__td--index">{{ (currentShopPage - 1) * shopPageSize + idx + 1 }}</div>
          <div class="shop-list__td shop-list__td--name">{{ row.name }}</div>
          <div class="shop-list__td shop-list__td--category">{{ row.category }}</div>
          <div class="shop-list__td shop-list__td--scope">{{ row.scope }}</div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="shop-list__pagination">
      <div class="shop-list__page-info">
        <span class="shop-list__page-label">每页显示</span>
        <div class="shop-list__page-size">
          <span>10 条</span>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="#f2fbff" stroke-width="1.5">
            <polyline points="4 6 8 10 12 6" />
          </svg>
        </div>
        <span class="shop-list__page-label">共 {{ shopTableData.length }} 条数据</span>
      </div>
      <div class="shop-list__page-controls">
        <button class="shop-list__page-btn shop-list__page-btn--nav" :disabled="currentShopPage <= 1" @click="currentShopPage--">上一页</button>
        <button
          v-for="p in totalShopPages"
          :key="p"
          class="shop-list__page-btn shop-list__page-btn--num"
          :class="{ 'shop-list__page-btn--active': p === currentShopPage }"
          @click="currentShopPage = p"
        >{{ p }}</button>
        <button class="shop-list__page-btn shop-list__page-btn--nav" :disabled="currentShopPage >= totalShopPages" @click="currentShopPage++">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface ShopRow {
  name: string
  category: string
  scope: string
  status?: string
}

const shopTableData: ShopRow[] = [
  { name: '沙县小吃', category: '餐饮服务', scope: '5' },
  { name: '爱玛电动车', category: '零售贸易', scope: '2'},
  { name: 'Tony美发店', category: '生活服务', scope: '3'},
  { name: '东北饭庄', category: '餐饮服务', scope: '4' },
  { name: '柳州螺蛳粉', category: '餐饮服务', scope: '1' },
  { name: '盛邦木业', category: '加工制造', scope: '2' },
  { name: '江南商贸城', category: '商业综合体', scope: '3' },
  { name: '沸腾鱼庄', category: '餐饮服务', scope: '5' },
  { name: '湘味土菜馆', category: '餐饮服务', scope: '4' },
  { name: '李记烧烤', category: '餐饮服务', scope: '1' },
  { name: '好又多超市', category: '零售贸易', scope: '2' },
  { name: '康民药房', category: '医疗卫生', scope: '3' },
]

const shopPageSize = 10
const currentShopPage = ref(1)

const totalShopPages = computed(() => Math.max(1, Math.ceil(shopTableData.length / shopPageSize)))

const paginatedShopRows = computed(() => {
  const start = (currentShopPage.value - 1) * shopPageSize
  return shopTableData.slice(start, start + shopPageSize)
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.shop-list {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: vh(12) 0;
}

/* ---- 搜索/筛选栏 ---- */
.shop-list__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  margin-bottom: vh(12);
}

.shop-list__filters {
  display: flex;
  align-items: center;
  gap: vw(18);
}

.shop-list__search {
  display: flex;
  align-items: center;
  gap: vw(12);
  height: vh(36);
  padding: vh(4) vw(12);
  background: rgba(3, 74, 173, 0);
  border: 1px solid rgba(0, 84, 201, 0.67);
  border-radius: 8px;
  overflow: hidden;
  width: vw(220);
  flex-shrink: 0;
  cursor: text;
}

.shop-list__search svg {
  flex-shrink: 0;
  color: #c1c1c1;
}

.shop-list__search-placeholder {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #c1c1c1;
  white-space: nowrap;
}

.shop-list__select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: vh(36);
  width: vw(130);
  padding: 1px vw(13);
  background: rgba(3, 74, 173, 0);
  border: 1px solid rgba(0, 84, 201, 0.67);
  border-radius: 8px;
  flex-shrink: 0;
  cursor: pointer;
}

.shop-list__select-text {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #c1c1c1;
  line-height: 20px;
  white-space: nowrap;
}

.shop-list__select svg {
  color: #c1c1c1;
}

.shop-list__query-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: vh(36);
  padding: vh(8) vw(18);
  background: #0095ff;
  border: none;
  border-radius: 8px;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 500;
  color: #ffffff;
  text-align: center;
  line-height: 20px;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
}

.shop-list__total-label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #a9b0c5;
  white-space: nowrap;
}

/* ---- 表格 ---- */
.shop-list__table-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;
}

.shop-list__table-header {
  display: flex;
  align-items: center;
  gap: vw(6);
  padding: vh(8) vw(6);
  background: #0457a7;
  flex-shrink: 0;
}

.shop-list__table-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-height: 0;
}

.shop-list__table-body::-webkit-scrollbar { width: 4px; }
.shop-list__table-body::-webkit-scrollbar-track { background: transparent; }
.shop-list__table-body::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.3); border-radius: 2px; }

.shop-list__table-row {
  display: flex;
  align-items: center;
  gap: vw(6);
  padding: 0 vw(6);
  border-top: 1px solid rgba(168, 178, 255, 0.08);
  flex-shrink: 0;
}

.shop-list__th {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 21px;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 500;
  color: #bcd9ff;
  line-height: 21px;
  white-space: nowrap;
}

.shop-list__td {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: vh(10) 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #f2fbff;
  line-height: 21px;
}

.shop-list__th--index,
.shop-list__td--index {
  width: vw(60);
  flex-shrink: 0;
}

.shop-list__th--name,
.shop-list__td--name {
  flex: 1;
  min-width: 0;
  justify-content: flex-start;
}

.shop-list__th--category,
.shop-list__td--category {
  flex: 1;
  min-width: 0;
}

.shop-list__th--scope,
.shop-list__td--scope {
  flex: 1.2;
  min-width: 0;
}

.shop-list__th--status,
.shop-list__td--status {
  width: vw(120);
  flex-shrink: 0;
}

.shop-list__th--action,
.shop-list__td--action {
  width: vw(48);
  flex-shrink: 0;
}

/* 经营状态标签 */
.shop-list__tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: vh(2) vw(6);
  border-radius: 4px;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 18px;
  text-align: center;
  white-space: nowrap;
}

.shop-list__tag--active {
  background: rgba(0, 84, 219, 0.2);
  color: #0072ff;
}

.shop-list__tag--inactive {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.shop-list__action-icon {
  color: rgba(137, 181, 255, 0.6);
  cursor: pointer;
  flex-shrink: 0;
}

.shop-list__action-icon:hover {
  color: #3cd3d7;
}

/* ---- 分页 ---- */
.shop-list__pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 vw(12);
  flex-shrink: 0;
  margin-top: vh(12);
}

.shop-list__page-info {
  display: flex;
  align-items: center;
  gap: vw(12);
  height: vh(36);
}

.shop-list__page-label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #f2fbff;
  line-height: 21px;
  white-space: nowrap;
}

.shop-list__page-size {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: vh(36);
  width: vw(82);
  padding: 1px vw(13);
  background: rgba(3, 74, 173, 0);
  border: 1px solid rgba(0, 84, 201, 0.67);
  border-radius: 8px;
  cursor: pointer;
}

.shop-list__page-size span {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #f2fbff;
  line-height: 20px;
  white-space: nowrap;
}

.shop-list__page-controls {
  display: flex;
  align-items: center;
  gap: vw(8);
  height: 32px;
}

.shop-list__page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: vh(6) vw(10);
  background: none;
  border: none;
  border-radius: 8px;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 16px);
  font-weight: 500;
  color: #ffffff;
  line-height: 20px;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}

.shop-list__page-btn--nav {
  background: rgba(1, 101, 178, 0.3);
}

.shop-list__page-btn--nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.shop-list__page-btn--num {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  color: #bebebe;
}

.shop-list__page-btn--active {
  background: rgba(32, 92, 194, 0.56);
  border: 1px solid rgba(0, 84, 201, 0.67);
  color: #f2fbff;
}
</style>
