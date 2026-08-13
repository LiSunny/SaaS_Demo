<template>
  <div class="shop-list">
    <!-- 搜索/筛选栏 -->
    <div class="shop-list__toolbar">
      <div class="shop-list__filters">
        <el-input
          v-model="searchText"
          placeholder="搜索商户名称..."
          class="shop-list__search"
        >
          <template #prefix>
            <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="7" cy="7" r="5" />
              <line x1="11" y1="11" x2="14" y2="14" />
            </svg>
          </template>
        </el-input>
        <el-select
          v-model="filterValue"
          placeholder="全部业态"
          class="shop-list__select"
          popper-class="bigscreen-el-select-dropdown"
        >
          <el-option
            v-for="opt in filterOpts"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-button type="primary" class="shop-list__query-btn" @click="handleQuery">
          查询
        </el-button>
      </div>
      <span class="shop-list__total-label">共 {{ shopTableData.length }} 家商户</span>
    </div>

    <!-- 商户表格 -->
    <div class="shop-list__table-wrap">
      <el-table
        :data="paginatedShopRows"
        stripe
      >
        <el-table-column type="index" label="序号" width="60" :index="tableIndex" />
        <el-table-column prop="name" label="商户名称" min-width="120" />
        <el-table-column prop="category" label="商户业态" min-width="100" />
        <el-table-column prop="scope" label="设备数量" min-width="100" />
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="shop-list__pagination-bar">
      <el-pagination
        v-model:current-page="currentShopPage"
        v-model:page-size="shopPageSize"
        :page-sizes="[10, 20, 50]"
        :total="shopTableData.length"
        layout="total, sizes, prev, pager, next"
        :pager-count="5"
        background
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface ShopRow {
  name: string
  category: string
  scope: number
}

const searchText = ref('')
const filterValue = ref('')

const filterOpts = [
  { label: '全部业态', value: '' },
  { label: '餐饮服务', value: '餐饮服务' },
  { label: '零售贸易', value: '零售贸易' },
  { label: '生活服务', value: '生活服务' },
  { label: '加工制造', value: '加工制造' },
  { label: '商业综合体', value: '商业综合体' },
  { label: '医疗卫生', value: '医疗卫生' },
]

function handleQuery() {
  // TODO: 接入真实筛选
}

const shopTableData: ShopRow[] = [
  { name: '沙县小吃', category: '餐饮服务', scope: 5 },
  { name: '爱玛电动车', category: '零售贸易', scope: 2 },
  { name: 'Tony美发店', category: '生活服务', scope: 3 },
  { name: '东北饭庄', category: '餐饮服务', scope: 4 },
  { name: '柳州螺蛳粉', category: '餐饮服务', scope: 1 },
  { name: '盛邦木业', category: '加工制造', scope: 2 },
  { name: '江南商贸城', category: '商业综合体', scope: 3 },
  { name: '沸腾鱼庄', category: '餐饮服务', scope: 5 },
  { name: '湘味土菜馆', category: '餐饮服务', scope: 4 },
  { name: '李记烧烤', category: '餐饮服务', scope: 1 },
  { name: '好又多超市', category: '零售贸易', scope: 2 },
  { name: '康民药房', category: '医疗卫生', scope: 3 },
]

const shopPageSize = ref(10)
const currentShopPage = ref(1)

const paginatedShopRows = computed(() => {
  const start = (currentShopPage.value - 1) * shopPageSize.value
  return shopTableData.slice(start, start + shopPageSize.value)
})

function tableIndex(index: number) {
  return (currentShopPage.value - 1) * shopPageSize.value + index + 1
}
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
  width: vw(220);
  flex-shrink: 0;
}

.shop-list__select {
  width: vw(130);
  flex-shrink: 0;
}

.shop-list__query-btn {
  flex-shrink: 0;
  height: vh(36);
}

.shop-list__total-label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 18px);
  font-weight: 400;
  color: #a9b0c5;
  white-space: nowrap;
}

/* ---- 表格 ---- */
.shop-list__table-wrap {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;

  :deep(.el-table) {
    flex: 1;
  }

  :deep(.el-table__body-wrapper) {
    overflow-y: auto;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.3); border-radius: 2px; }
  }
}

/* ---- 分页 ---- */
.shop-list__pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  margin-top: vh(12);
}
</style>
