<template>
  <div class="food-safety">
    <div class="meal-row">
      <div v-for="meal in meals" :key="meal.label" class="meal-item">
        <div class="meal-icon-wrap">
          <img :src="meal.icon" alt="" /><span>{{ meal.label }}</span>
        </div>
        <img class="meal-rating" :src="meal.rating" alt="" />
      </div>
    </div>

    <div class="table-wrap">
      <table class="food-table">
        <thead>
          <tr><th>点位名称</th><th>巡检时间</th><th>履职打卡</th><th class="col-action">操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in tableData" :key="i">
            <td>{{ row.name }}</td><td>{{ row.time }}</td>
            <td><span class="tag-done">已完成</span></td>
            <td class="col-action"><img class="btn-view" src="/campus-icons/m2-icon-02.svg" alt="查看" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const meals = [
  { label: '早餐', icon: '/campus-icons/m8-noodles.svg', rating: '/campus-icons/m8-bad.svg' },
  { label: '中餐', icon: '/campus-icons/m8-lunch.svg', rating: '/campus-icons/m8-bad.svg' },
  { label: '晚餐', icon: '/campus-icons/m8-dinner.svg', rating: '/campus-icons/m8-good.svg' },
]
const tableData = [
  { name: '备菜区', time: '2025-07-08' },
  { name: '烹调区', time: '2025-07-08' },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./campus-common.scss" as *;

.food-safety { display: flex; flex-direction: column; gap: vh(16); height: 100%; }
.meal-row { display: flex; justify-content: space-between; padding: 0 vw(26); flex-shrink: 0; }
.meal-item { display: flex; align-items: center; gap: vw(14); }
.meal-icon-wrap { display: flex; flex-direction: column; align-items: center; gap: vh(4);
  img { width: calc(36 * var(--min-scale)); height: calc(36 * var(--min-scale)); }
  span { font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif; font-size: clamp(11px, calc(16 * var(--min-scale)), 16px); color: #ffffff; }
}
.meal-rating { width: calc(52 * var(--min-scale)); height: calc(52 * var(--min-scale)); }
.table-wrap { @include table-wrap; }
.food-table { @include campus-table; }
.btn-view { @include btn-view; }
.tag-done { @include tag-done; }
</style>
