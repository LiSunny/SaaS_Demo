<template>
  <div class="hazard-report">
    <div class="stat-row">
      <div class="stat-card stat-card--main">
        <img class="stat-circle" src="/campus-icons/m1-icon-04.svg" alt="" />
        <img class="stat-check" src="/campus-icons/m1-icon-01.svg" alt="" />
        <img class="stat-bg-wide" src="/campus-icons/m2-icon-06.svg" alt="" />
        <div class="stat-text"><span class="stat-label">待认领</span><span class="stat-value">10<span class="stat-unit">个</span></span></div>
      </div>
      <div class="stat-card">
        <img class="stat-bg-narrow" src="/campus-icons/m2-icon-03.svg" alt="" />
        <div class="stat-text stat-text--offset"><span class="stat-label">待确认</span><span class="stat-value">10<span class="stat-unit">个</span></span></div>
      </div>
      <div class="stat-card">
        <img class="stat-bg-narrow" src="/campus-icons/m2-icon-03.svg" alt="" />
        <div class="stat-text stat-text--offset"><span class="stat-label">已确认</span><span class="stat-value">10<span class="stat-unit">个</span></span></div>
      </div>
    </div>

    <div class="table-wrap">
      <table class="hazard-table">
        <thead>
          <tr><th>隐患名称</th><th>上报时间</th><th>整改状态</th><th>上报人员</th><th class="col-action">操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in tableData" :key="i">
            <td>{{ row.name }}</td><td>{{ row.time }}</td>
            <td><span class="status-badge" :class="'status--' + row.statusType">{{ row.status }}</span></td>
            <td>{{ row.reporter }}</td>
            <td class="col-action"><img class="btn-view" src="/campus-icons/m2-icon-02.svg" alt="查看" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
const tableData = [
  { name: '隐患名称', time: '上报时间', status: '待认领', statusType: 'pending', reporter: '上报人' },
  { name: '隐患名称', time: '上报时间', status: '已整改', statusType: 'done', reporter: '处置人' },
  { name: '隐患名称', time: '上报时间', status: '已确认', statusType: 'done', reporter: '处置人' },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./campus-common.scss" as *;

.hazard-report { display: flex; flex-direction: column; gap: vh(16); height: 100%; }
.stat-row { display: flex; gap: vw(12); flex-shrink: 0; }
.stat-card { position: relative; flex: 1; min-height: vh(78); &--main { flex: 1.3; } }
.stat-circle { position: absolute; left: 0; top: 0; width: calc(78 * var(--min-scale)); height: calc(78 * var(--min-scale)); }
.stat-check { position: absolute; left: calc(19 * var(--min-scale)); top: calc(21 * var(--min-scale)); width: calc(40.6 * var(--min-scale)); height: calc(36 * var(--min-scale)); }
.stat-bg-wide { position: absolute; right: 0; bottom: 0; width: calc(202.5 * var(--min-scale)); height: calc(47.5 * var(--min-scale)); }
.stat-bg-narrow { position: absolute; right: 0; bottom: 0; width: calc(156.5 * var(--min-scale)); height: calc(47.5 * var(--min-scale)); }
.stat-text { position: absolute; left: calc(88 * var(--min-scale)); bottom: vh(13); display: flex; flex-direction: column; gap: vh(4); z-index: 1; &--offset { left: calc(45 * var(--min-scale)); } }
.stat-label { font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif; font-size: clamp(13px, calc(18 * var(--min-scale)), 18px); font-weight: 500; color: #ffffff; }
.stat-value { font-family: 'DingTalk JinBuTi', 'Alibaba PuHuiTi', sans-serif; font-size: clamp(18px, calc(28 * var(--min-scale)), 28px); color: #ffffff; }
.stat-unit { font-size: clamp(12px, calc(18 * var(--min-scale)), 18px); margin-left: vw(4); }

.table-wrap { @include table-wrap; }
.hazard-table { @include campus-table; }
.btn-view { @include btn-view; }
.status-badge { @include status-badge; }
</style>
