<template>
  <div class="bullying-prevention">
    <div class="tab-row">
      <button class="tab-btn" :class="{ active: activeZone === 'dorm' }" @click="activeZone = 'dorm'">
        <img src="/campus-icons/m1-icon-02.svg" alt="" />
        <span>宿舍区</span>
      </button>
      <button class="tab-btn" :class="{ active: activeZone === 'teach' }" @click="activeZone = 'teach'">
        <img src="/campus-icons/m1-icon-12.svg" alt="" />
        <span>教学区</span>
      </button>
    </div>

    <div class="table-wrap">
      <table class="patrol-table">
        <thead>
          <tr><th>点位名称</th><th>巡检时间</th><th>平安打卡</th><th class="col-action">操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in tableData" :key="i">
            <td>{{ row.name }}</td>
            <td>{{ row.time }}</td>
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
const activeZone = ref<'dorm' | 'teach'>('dorm')
const tableData = [
  { name: '公共区域', time: '2025-07-08' },
  { name: '1#教学楼', time: '2025-07-08' },
  { name: 'A区宿舍楼', time: '2025-07-08' },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./campus-common.scss" as *;

.bullying-prevention { display: flex; flex-direction: column; gap: vh(6); height: 100%; }

.tab-row { @include tab-row; height: vh(47); }
.tab-btn { @include tab-btn-base; }

.table-wrap { @include table-wrap; }
.patrol-table { @include campus-table; }
.btn-view { @include btn-view; }
.tag-done { @include tag-done; }
</style>
