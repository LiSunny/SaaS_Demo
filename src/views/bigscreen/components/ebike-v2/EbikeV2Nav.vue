<template>
  <nav class="v2-nav">
    <button
      v-for="(item, idx) in items"
      :key="idx"
      type="button"
      class="v2-nav__item"
      :class="{ 'v2-nav__item--active': idx === current }"
      @click="handleSelect(item, idx)"
    >
      <!-- 选中态：斜切平行四边形底（线性填充 + 径向辉光与描边），Figma 51:1802 / 51:1808 -->
      <template v-if="idx === current">
        <img class="v2-nav__glow" src="@/assets/bigscreen/ebike-v2/nav-v2-active-glow.svg" alt="" />
        <img class="v2-nav__fill" src="@/assets/bigscreen/ebike-v2/nav-v2-active-base.svg" alt="" />
      </template>
      <span class="v2-nav__text">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface NavItem {
  label: string
  /** 预留：后续可挂路由 key */
  key?: string
}

const props = withDefaults(
  defineProps<{
    items: NavItem[]
    /** 当前选中项下标；不传时由组件内部跟随点击 */
    activeIndex?: number
  }>(),
  { activeIndex: undefined },
)

const emit = defineEmits<{ (e: 'select', item: NavItem, index: number): void }>()

/** 外部未指定时，组件自行记录点击项，保证按钮有选中反馈 */
const current = ref(props.activeIndex ?? 0)
watch(
  () => props.activeIndex,
  (v) => {
    if (v !== undefined) current.value = v
  },
)

function handleSelect(item: NavItem, idx: number) {
  if (props.activeIndex === undefined) current.value = idx
  emit('select', item, idx)
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* Figma: FRAME 44:914 at x=434 y=14, row, 无间距 */
.v2-nav {
  position: absolute; left: vw(434); top: vh(11);
  display: flex; align-items: center;
}

/* 按钮 150×46：比设计稿放大，撑得住 68px 高的标题条 */
.v2-nav__item {
  position: relative;
  width: vw(150); height: vh(46);
  flex-shrink: 0;
  display: block;
  padding: 0; border: none; background: transparent;
  cursor: pointer;
  font-family: inherit;
}

.v2-nav__glow,
.v2-nav__fill {
  position: absolute; left: 0; top: 0;
  width: 100%; height: 100%;
  display: block; pointer-events: none;
}

/* Figma 51:1811：选中项文字，x=41 y=13 w=68 h=20，行高 20px */
.v2-nav__text {
  position: absolute; left: 0; top: 50%;
  transform: translateY(-50%);
  width: 100%;
  font-size: clamp(12px, calc(17 * var(--min-scale)), 17px);
  line-height: vh(20);
  text-align: center;
  white-space: nowrap;
  pointer-events: none;
}

/* 选中态文字：纯白 + 辉光，从深蓝底上"点亮"。
   不用 background-clip 垂直渐变 —— 17px 小字上渐变几乎看不出，
   且渐变裁剪会把 text-shadow 一起裁掉、显示异常。 */
.v2-nav__item--active .v2-nav__text {
  font-family: 'NavKeynote', 'PingFang SC', sans-serif;
  font-weight: 400;
  color: #ffffff;
  text-shadow: 0 0 10px rgba(120, 200, 255, 0.5);
}

/* 未选中态文字：压暗 + 降字重，退到背景里，让选中项跳出来。
   原来用设计稿的 Bold + #A8C8FF，实测未选中项比选中项还亮、层级是反的。 */
.v2-nav__item:not(.v2-nav__item--active) .v2-nav__text {
  font-family: 'NavPuHuiTiMedium', 'PingFang SC', sans-serif;
  font-weight: 400;
  color: #6e93c4;
}
</style>
