<template>
  <button
    type="button"
    class="v2-poi-toggle"
    :class="{ 'v2-poi-toggle--active': open }"
    @click="handleToggle"
  >
    <span class="v2-poi-toggle__icon" aria-hidden="true">
      <img src="@/assets/bigscreen/icon-city.svg" alt="" />
    </span>
    建筑导航
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCampusModel } from './useCampusModel'

const campus = useCampusModel()

/** 面板在 iframe 内，这里只记状态用于按钮反馈 */
const open = ref(false)

function handleToggle() {
  const next = campus?.value?.togglePoiPanel()
  open.value = next === undefined ? !open.value : next
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.v2-poi-toggle {
  height: vh(34);
  padding: 0 vw(12) 0 vw(8);
  display: flex; align-items: center; gap: vw(6);
  border: 1px solid rgba(0, 152, 230, 0.35);
  background: rgba(0, 68, 130, 0.55);
  color: rgba(200, 228, 255, 0.9);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.v2-poi-toggle:hover {
  background: rgba(0, 92, 168, 0.72);
  color: #eaf6ff;
}

.v2-poi-toggle--active {
  background: linear-gradient(180deg, rgba(0, 134, 228, 0.9) 0%, rgba(0, 86, 168, 0.9) 100%);
  border-color: rgba(96, 200, 255, 0.6);
  color: #fff;
}

.v2-poi-toggle__icon {
  display: flex; align-items: center;
  img { width: vw(16); height: vw(16); display: block; }
}
</style>
