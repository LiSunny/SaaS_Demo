<template>
  <div class="alarm-daily">
    <div class="tab-row">
      <button v-for="tab in tabs" :key="tab.key" class="tab-btn" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
        <img :src="tab.icon" alt="" /><span>{{ tab.label }}</span>
      </button>
    </div>

    <div class="alert-list">
      <div v-for="(item, i) in alerts" :key="i" class="alert-item">
        <div class="alert-row">
          <span class="status-badge" :class="'status--' + item.statusType">{{ item.status }}</span>
          <span class="alert-type">预警（{{ item.type }}）</span>
          <span class="alert-time">{{ item.time }}</span>
        </div>
        <p class="alert-location">{{ item.location }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const activeTab = ref('elec')
const tabs = [
  { key: 'smoke', label: '烟感告警', icon: '/campus-icons/m7-smoke.svg' },
  { key: 'elec', label: '电气告警', icon: '/campus-icons/m7-elec.svg' },
  { key: 'manual', label: '手报告警', icon: '/campus-icons/m7-manual.svg' },
  { key: 'voice', label: '语音告警', icon: '/campus-icons/m7-voice.svg' },
]
const alerts = [
  { status: '已接警', statusType: 'pending', type: '过流预警', time: '2025-06-12 18:20:34', location: '教学区/302' },
  { status: '已处置', statusType: 'done', type: '过压预警', time: '2025-06-12 18:20:34', location: '教学区/302' },
  { status: '已处置', statusType: 'done', type: '过压预警', time: '2025-06-12 18:20:34', location: '教学区/302' },
  { status: '已处置', statusType: 'done', type: '过压预警', time: '2025-06-12 18:20:34', location: '教学区/302' },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./campus-common.scss" as *;

.alarm-daily { display: flex; flex-direction: column; gap: vh(16); height: 100%; }
.tab-row { @include tab-row; }
.tab-btn { @include tab-btn-base; }
.alert-list { flex: 1; display: flex; flex-direction: column; gap: vh(16); overflow-y: auto; min-height: 0; @include hide-scrollbar; }
.alert-item { display: flex; flex-direction: column; gap: vh(10); }
.alert-row { display: flex; align-items: center; gap: vw(14); }
.status-badge { @include status-badge; }
.alert-type { font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif; font-size: clamp(11px, calc(16 * var(--min-scale)), 16px); font-weight: 500; color: #ffffff; }
.alert-time { font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif; font-size: clamp(11px, calc(16 * var(--min-scale)), 16px); font-weight: 500; color: #ffffff; margin-left: auto; }
.alert-location { margin: 0; font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif; font-size: clamp(11px, calc(16 * var(--min-scale)), 16px); font-weight: 500; color: #ffffff; }
</style>
