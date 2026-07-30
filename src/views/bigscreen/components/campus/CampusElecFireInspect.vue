<template>
  <div class="elec-fire">
    <div class="tab-row">
      <button class="tab-btn" :class="{ active: activeTab === 'elec' }" @click="activeTab = 'elec'">
        <img src="/campus-icons/m5-elec-exact.svg" alt="" /><span>电气电路巡查</span>
      </button>
      <button class="tab-btn" :class="{ active: activeTab === 'fire' }" @click="activeTab = 'fire'">
        <img src="/campus-icons/m5-fire-exact.svg" alt="" /><span>消防设施巡查</span>
      </button>
    </div>

    <div class="table-wrap">
      <table class="inspect-table">
        <thead>
          <tr><th>点位名称</th><th>平安打卡</th><th class="col-action">操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in tableData" :key="i">
            <td>{{ row.name }}</td>
            <td><span class="tag-done">已完成</span></td>
            <td class="col-action"><img class="btn-view" src="/campus-icons/m2-icon-02.svg" alt="查看" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const activeTab = ref<'elec' | 'fire'>('elec')
const tableData = [{ name: '公共区域' }, { name: '1#教学楼' }, { name: 'A区宿舍楼' }]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./campus-common.scss" as *;

.elec-fire { display: flex; flex-direction: column; gap: vh(16); height: 100%; }
.tab-row { @include tab-row; height: vh(47); }
.tab-btn { @include tab-btn-base; }
.table-wrap { @include table-wrap; }
.inspect-table { @include campus-table; }
.btn-view { @include btn-view; }
.tag-done { @include tag-done; }
</style>
