<template>
  <div class="v2-time">
    <!-- 场景光线开关：样式沿用后台主题切换（药丸轨道 + 滑动圆钮 + 钮内图标） -->
    <button
      type="button"
      class="v2-time__switch"
      :class="{ 'is-dusk': isDusk }"
      role="switch"
      :aria-checked="isDusk"
      :aria-label="isDusk ? '场景光线：黄昏' : '场景光线：白天'"
      :title="isDusk ? '切换为白天场景' : '切换为黄昏场景'"
      @click="toggle"
    >
      <span class="v2-time__track">
        <span class="v2-time__thumb">
          <!-- 黄昏：半轮落日 + 地平线 -->
          <svg v-if="isDusk" class="v2-time__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 16.2h16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
            <path d="M7.4 13.2a4.6 4.6 0 0 1 9.2 0z" fill="currentColor" />
            <g stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
              <path d="M12 3.4v2.3M4.9 8.1l1.6 1.6M19.1 8.1l-1.6 1.6" />
            </g>
          </svg>
          <!-- 白天：实心日轮 + 八道光芒 -->
          <svg v-else class="v2-time__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="4.6" fill="currentColor" />
            <g stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
              <path d="M12 2.6v2.3M12 19.1v2.3M2.6 12h2.3M19.1 12h2.3" />
              <path d="M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" />
            </g>
          </svg>
        </span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCampusModel } from './useCampusModel'
import type { CampusTimePreset } from './campusTheme'

const campus = useCampusModel()

/** 当前预设：默认跟随模型的初始预设（黄昏） */
const active = ref<CampusTimePreset>('dusk')

watch(
  () => campus?.value?.timePreset,
  (v) => {
    if (v) active.value = v
  },
  { immediate: true },
)

/** 两态：白天 / 黄昏。模型若被外部置为夜晚，归到黄昏一侧（开关只有两个位置） */
const isDusk = computed(() => active.value !== 'day')

function toggle() {
  const next: CampusTimePreset = isDusk.value ? 'day' : 'dusk'
  active.value = next
  campus?.value?.setTimePreset(next)
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.v2-time {
  display: flex;
  align-items: center;
  /* 与「建筑导航」按钮同高，保证下方按钮位置不变、弹窗吸附间距不变 */
  height: vh(34);
}

/* ===== 开关本体：结构与后台 ThemeToggle 一致 ===== */
.v2-time__switch {
  background: none; border: none; padding: 0; margin: 0;
  cursor: pointer; flex-shrink: 0;
  display: inline-flex; align-items: center;
  line-height: 0;
}

.v2-time__switch:focus-visible {
  outline: 2px solid rgba(96, 200, 255, 0.8);
  outline-offset: 2px;
  border-radius: 999px;
}

.v2-time__track {
  position: relative;
  /* 后台 ThemeToggle 为 40×22（管理端近看用），大屏远看要放大到 72×34 */
  width: calc(72 * var(--min-scale));
  height: calc(34 * var(--min-scale));
  border-radius: 999px;
  background: rgba(0, 68, 130, 0.55);
  border: 1px solid rgba(0, 152, 230, 0.35);
  transition: background .25s ease, border-color .25s ease;
  display: inline-flex; align-items: center;
}

/* 黄昏态：轨道点亮成大屏主色 */
.v2-time__switch.is-dusk .v2-time__track {
  background: linear-gradient(180deg, rgba(0, 134, 228, 0.9) 0%, rgba(0, 86, 168, 0.9) 100%);
  border-color: rgba(96, 200, 255, 0.6);
}

.v2-time__thumb {
  position: absolute;
  /* 圆钮与胶囊保持 5 设计像素边距，不贴边 */
  top: calc(5 * var(--min-scale));
  left: calc(5 * var(--min-scale));
  width: calc(24 * var(--min-scale));
  height: calc(24 * var(--min-scale));
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .28);
  transition: transform .25s ease, color .25s ease;
  display: inline-flex; align-items: center; justify-content: center;
  color: #0b4a86;
}

/* 滑到右侧 = 黄昏 */
.v2-time__switch.is-dusk .v2-time__thumb {
  transform: translateX(calc(38 * var(--min-scale)));
  color: #0072c8;
}

.v2-time__icon {
  display: block;
  width: calc(18 * var(--min-scale));
  height: calc(18 * var(--min-scale));
}
</style>
