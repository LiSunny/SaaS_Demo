<template>
  <button
    type="button"
    class="v2-clean-toggle"
    :class="{ 'v2-clean-toggle--active': active, 'v2-clean-toggle--floating': floating }"
    :aria-pressed="active"
    :aria-label="label"
    :title="label"
    @click="emit('toggle')"
  >
    <svg
      class="v2-clean-toggle__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <!-- 退出全屏：四角向内收 -->
      <template v-if="active">
        <path d="M9 3v3a2 2 0 0 1-2 2H3" />
        <path d="M15 3v3a2 2 0 0 0 2 2h3" />
        <path d="M9 21v-3a2 2 0 0 0-2-2H3" />
        <path d="M15 21v-3a2 2 0 0 1 2-2h3" />
      </template>
      <!-- 进入全屏：四角向外扩（沿用项目既有 fullscreen 图标路径） -->
      <template v-else>
        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
        <path d="M16 3h3a2 2 0 0 1 2 2v3" />
        <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
        <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
      </template>
    </svg>
    <span class="v2-clean-toggle__label">{{ active ? '退出全屏' : '全屏查看' }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 全屏态：true = 已进入全屏（图标切到「退出」形态） */
    active?: boolean
    /** 悬浮形态：脱离控件组，固定在右下角作退出入口 */
    floating?: boolean
  }>(),
  { active: false, floating: false },
)

const emit = defineEmits<{ (e: 'toggle'): void }>()

const label = computed(() =>
  props.active ? '退出全屏（Esc）' : '全屏查看：只显示三维模型',
)
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 全屏查看入口 —— 形制取自设计稿 70:313 模型区左缘第二枚控件（1920 实测）：
   外框 99×34、圆角 6、亮蓝描边 rgba(0,152,230,.45) + 深蓝底 rgba(0,68,130,.55)、
   左侧四角外扩图标 18px（绘制区 ≈13.5px）、右侧「全屏查看」14px（#a9c9ea）。

   尺寸不用 vw()/vh()：控件内有 14px 文字，大屏字号下限锁 14 不再缩小，
   盒子若随视口缩小就放不下文字。固定设计尺寸后各视口几何完全一致。 */
.v2-clean-toggle {
  box-sizing: border-box;
  width: 99px;
  height: 34px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  padding: 0 0 0 7px;
  margin: 0;
  border: 1px solid rgba(0, 152, 230, 0.45);
  border-radius: 6px;
  background: rgba(0, 68, 130, 0.55);
  color: var(--fire-text-label, #a9c9ea);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.v2-clean-toggle:hover {
  background: rgba(0, 92, 168, 0.72);
  border-color: rgba(96, 200, 255, 0.6);
  color: #eaf6ff;
}

.v2-clean-toggle:focus-visible {
  outline: 2px solid rgba(96, 200, 255, 0.8);
  outline-offset: 2px;
}

.v2-clean-toggle__label {
  line-height: 1;
  white-space: nowrap;
}

.v2-clean-toggle__icon {
  display: block;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

/* 已进入全屏：点亮成大屏主色 */
.v2-clean-toggle--active {
  background: linear-gradient(180deg, rgba(0, 134, 228, 0.9) 0%, rgba(0, 86, 168, 0.9) 100%);
  border-color: rgba(96, 200, 255, 0.6);
  color: #fff;
}

/* 全屏态的退出入口：固定右下角，默认压暗不抢模型画面，悬停才点亮 */
.v2-clean-toggle--floating {
  position: fixed;
  right: vw(24);
  bottom: vh(24);
  z-index: 10001;
  opacity: 0.45;
  transition: opacity 0.2s, background 0.2s, color 0.2s;
}

.v2-clean-toggle--floating:hover {
  opacity: 1;
}
</style>
