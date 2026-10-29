<template>
  <div class="v2-time">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="v2-time__btn"
      :class="{ 'v2-time__btn--active': opt.value === active }"
      @click="handleSelect(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCampusModel } from './useCampusModel'
import type { CampusTimePreset } from './campusTheme'

const options: { label: string; value: CampusTimePreset }[] = [
  { label: '白天', value: 'day' },
  { label: '黄昏', value: 'dusk' },
  { label: '夜晚', value: 'night' },
]

const campus = useCampusModel()

/** 当前预设：默认跟随模型的初始预设 */
const active = ref<CampusTimePreset>('dusk')

watch(
  () => campus?.value?.timePreset,
  (v) => {
    if (v) active.value = v
  },
  { immediate: true },
)

function handleSelect(value: CampusTimePreset) {
  active.value = value
  campus?.value?.setTimePreset(value)
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.v2-time {
  position: absolute;
  /* 建筑导航开关右侧、用户区（1767）左侧的空档 */
  left: vw(1472); top: vh(17);
  display: flex;
  gap: vw(8);
}

.v2-time__btn {
  width: vw(76); height: vh(34);
  padding: 0; border: none;
  clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
  background: rgba(0, 68, 130, 0.55);
  color: rgba(200, 228, 255, 0.82);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(12px, calc(14 * var(--min-scale)), 14px);
  letter-spacing: 1px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.v2-time__btn:hover {
  background: rgba(0, 92, 168, 0.72);
  color: #eaf6ff;
}

.v2-time__btn--active {
  background: linear-gradient(180deg, rgba(0, 134, 228, 0.9) 0%, rgba(0, 86, 168, 0.9) 100%);
  color: #fff;
  box-shadow: 0 0 12px rgba(0, 160, 255, 0.45);
}
</style>
