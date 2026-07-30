<template>
  <div class="bullying-alarm">
    <div class="map-area">
      <img class="map-img" src="/campus-icons/m4-map.jpg" alt="校园地图" />
      <img class="map-marker" src="/campus-icons/m4-marker-2.svg" style="left:28.8%;top:21%" alt="" />
      <img class="map-marker" src="/campus-icons/m4-marker-1.svg" style="left:40.3%;top:37.5%" alt="" />
      <img class="map-marker" src="/campus-icons/m4-marker-3.svg" style="left:49%;top:43.6%" alt="" />
    </div>

    <div class="tab-row">
      <button v-for="tab in tabs" :key="tab.key" class="tab-btn" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
        <img :src="tab.icon" alt="" /><span>{{ tab.label }}</span>
      </button>
    </div>

    <div class="alert-list">
      <div v-for="(alert, i) in alerts" :key="i" class="alert-card">
        <img class="alert-icon" :src="alert.icon" alt="" />
        <div class="alert-content">
          <div class="alert-header">
            <span class="status-badge" :class="'status--' + alert.statusType">{{ alert.status }}</span>
            <span class="alert-type">欺凌告警</span>
            <span class="alert-time">{{ alert.time }}</span>
          </div>
          <p class="alert-location">{{ alert.location }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const activeTab = ref('male-dorm')
const tabs = [
  { key: 'male-dorm', label: '男生宿舍区', icon: '/campus-icons/m4-tab-male-dorm.svg' },
  { key: 'male-public', label: '男生公共区', icon: '/campus-icons/m4-tab-male-public.svg' },
  { key: 'female-dorm', label: '女生宿舍区', icon: '/campus-icons/m4-tab-female-dorm.svg' },
  { key: 'female-public', label: '女生公共区', icon: '/campus-icons/m4-tab-female-public.svg' },
  { key: 'public', label: '公共区', icon: '/campus-icons/m4-tab-public.svg' },
]
const alerts = [
  { icon: '/campus-icons/m4-alert-fight.svg', status: '未处置', statusType: 'pending', time: '2025-06-12 18:20:34', location: '宿舍区/男生宿舍302' },
  { icon: '/campus-icons/m4-alert-voice.svg', status: '已处置', statusType: 'done', time: '2025-06-12 18:20:34', location: '宿舍区/男生宿舍302' },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./campus-common.scss" as *;

.bullying-alarm { display: flex; flex-direction: column; gap: vh(16); height: 100%; }
.map-area { flex: 1; min-height: 0; border-radius: 4px; overflow: hidden; position: relative; }
.map-img { width: 100%; height: 100%; object-fit: cover; }
.map-marker { position: absolute; width: calc(16 * var(--min-scale)); height: calc(18 * var(--min-scale)); transform: translate(-50%, -50%); pointer-events: none; }
.tab-row { @include tab-row; }
.tab-btn { @include tab-btn-base; }
.alert-list { display: flex; flex-direction: column; gap: vh(16); flex-shrink: 0; }
.alert-card { display: flex; gap: vw(16); align-items: center; }
.alert-icon { width: calc(64 * var(--min-scale)); height: calc(64 * var(--min-scale)); flex-shrink: 0; }
.alert-content { flex: 1; display: flex; flex-direction: column; gap: vh(10); }
.alert-header { display: flex; align-items: center; gap: vw(14); }
.status-badge { @include status-badge; }
.alert-type { font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif; font-size: clamp(11px, calc(16 * var(--min-scale)), 16px); font-weight: 500; color: #ffffff; }
.alert-time { font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif; font-size: clamp(11px, calc(16 * var(--min-scale)), 16px); font-weight: 500; color: #ffffff; margin-left: auto; }
.alert-location { margin: 0; font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif; font-size: clamp(11px, calc(16 * var(--min-scale)), 16px); font-weight: 500; color: #ffffff; }
</style>
