<template>
  <div class="v2-time">
    <!-- 场景光线切换：设计稿 70:313 模型区左缘第一枚控件
         —— 胶囊（左侧场景名 + 右侧白色圆钮），非后台主题切换那种"无文字药丸"。 -->
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
      <span class="v2-time__label">{{ isDusk ? '黄昏' : '白天' }}</span>
      <span class="v2-time__thumb">
        <!-- 黄昏：半轮落日 + 地平线 + 一道竖芒（设计稿 70:313 圆钮内实测） -->
        <svg v-if="isDusk" class="v2-time__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 18h18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
          <path d="M8 14a4 4 0 0 1 8 0z" fill="currentColor" />
          <path d="M12 4v3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
        </svg>
        <!-- 白天：实心日轮 + 四道光芒 -->
        <svg v-else class="v2-time__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" fill="currentColor" />
          <g stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
          </g>
        </svg>
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
/* 场景光线开关 —— 形制取自设计稿 70:313 模型区左缘第一枚控件（1920 实测）：
     外框 99×34、胶囊圆角、亮蓝描边 rgba(0,152,230,.45) + 深蓝底 rgba(0,68,130,.55)、
     左侧场景名 14px（#a9c9ea）、右侧白色圆钮 28×28（钮内图标 #0072c8）。

   尺寸不用 vw()/vh()：控件内有 14px 文字，大屏字号下限锁 14 不再缩小，
   若盒子随视口缩小，文字就放不下。固定设计尺寸后各视口几何完全一致，
   1920 下与设计稿逐像素对齐。 */
.v2-time {
  display: flex;
  align-items: center;
}

.v2-time__switch {
  position: relative;
  box-sizing: border-box;
  width: 99px;
  height: 34px;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(0, 152, 230, 0.45);
  border-radius: 999px;
  background: rgba(0, 68, 130, 0.55);
  color: var(--fire-text-label, #a9c9ea);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  transition: background 0.25s ease, border-color 0.25s ease;
}

.v2-time__switch:hover {
  background: rgba(0, 92, 168, 0.72);
  border-color: rgba(96, 200, 255, 0.6);
}

.v2-time__switch:focus-visible {
  outline: 2px solid rgba(96, 200, 255, 0.8);
  outline-offset: 2px;
}

/* 场景名：左缘距胶囊 21px；白天态圆钮滑到左侧，场景名跟着让位 */
.v2-time__label {
  position: absolute;
  top: 50%;
  left: 21px;
  transform: translateY(-50%);
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  transition: left 0.25s ease;
}

/* 圆钮：黄昏在右（left 68 = 99 − 28 − 3），白天在左（left 3） */
.v2-time__thumb {
  position: absolute;
  top: 50%;
  left: 68px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.28);
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #0072c8;
  transition: left 0.25s ease, color 0.25s ease;
}

.v2-time__switch:not(.is-dusk) .v2-time__thumb {
  left: 3px;
}

.v2-time__switch:not(.is-dusk) .v2-time__label {
  left: 35px;
}

/* 钮内图标 18px：绘制区占视窗 18/24 ≈ 13.5px，与设计稿实测的 13×11 一致 */
.v2-time__icon {
  display: block;
  width: 18px;
  height: 18px;
}
</style>
