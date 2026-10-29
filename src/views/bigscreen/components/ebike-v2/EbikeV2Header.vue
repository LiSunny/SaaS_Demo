<template>
  <BigscreenTitleBar title="智能安全管控平台" :user-right="50" :title-size="28" :title-top="16">
    <template #background>
      <!-- Figma 44:891 大标题背景（1932×68 通栏）：底板 + 斜纹装饰，
           底部装饰线与流动辉光拆为独立图层，由代码按 bottom:0 定位 -->
      <!-- 底衬：大屏底色 #00437A。设计稿的标题底板是半透明图层，
           叠在页面底色上才成立；此处三维模型在最底层，必须补一层同色底衬，
           否则标题条会透出模型的深色天空，与设计稿不符。 -->
      <div class="v2-header-backdrop" />
      <img class="v2-header-bg" src="@/assets/bigscreen/ebike-v2/header-bg.svg" alt="" />
      <!-- 底部装饰线：独立图层，由代码贴底定位 -->
      <img class="v2-header-line" src="@/assets/bigscreen/ebike-v2/header-line.svg" alt="" />
      <!-- 底部装饰线上的流动高光：设计稿自带的辉光块，沿线循环滑动 -->
      <img class="v2-header-glow" src="@/assets/bigscreen/ebike-v2/header-line-glow.svg" alt="" />
    </template>

    <template #nav>
      <EbikeV2Nav :items="navItems" @select="handleSelect" />
    </template>
  </BigscreenTitleBar>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BigscreenTitleBar from '../common/BigscreenTitleBar.vue'
import EbikeV2Nav from './EbikeV2Nav.vue'

/** 导航：消防安全管理口径（校园总览 → 应急处置）
 *  总览页只放"现在要动手的"，其余页面承接明细 */
const navItems = ref([
  { label: '消防总览', key: 'overview' },
  { label: '实时警情', key: 'nav-1' },
  { label: '系统监测', key: 'nav-2' },
  { label: '设备档案', key: 'nav-3' },
  { label: '值班记录', key: 'nav-4' },
  { label: '应急处置', key: 'nav-5' },
])

function handleSelect(item: { key?: string }) {
  // 后续模块接入时在此按 key 切换内容
  void item
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.v2-header-bg {
  position: absolute; left: 50%; top: 0;
  transform: translateX(-50%);
  width: vw(1932); height: vh(68);
  display: block; pointer-events: none;
}

/* 底衬：拟态玻璃层。与 Figma 底图同尺寸，盖住三维模型的深色天空；
   半透明 + 背景模糊，让下层三维模型隐隐透出而不影响标题可读性。 */
.v2-header-backdrop {
  position: absolute; left: 50%; top: 0;
  transform: translateX(-50%);
  width: vw(1932); height: vh(68);
  background: rgba(0, 52, 106, 0.55);
  backdrop-filter: blur(10px) saturate(135%);
  -webkit-backdrop-filter: blur(10px) saturate(135%);
  pointer-events: none;
}

/* 底部装饰线：独立图层，代码定位贴住标题条底边。
   与 `.v2-header-glow` 共用同一基准带（bottom:0 + height vh(4)），
   两者必然严格重合，不受 SVG 自身比例与盒子比例不一致造成的留白影响。 */
.v2-header-line {
  position: absolute; left: 50%; bottom: 0;
  transform: translateX(-50%);
  width: vw(1932); height: vh(4);
  display: block; pointer-events: none;
}

/* 底部装饰线上的流动高光。
   用设计稿自己的辉光块（header-line-glow.svg）沿线滑动，而不是另加一条色块：
   装饰线上同时只存在一处高亮，静态蓝块保持不动，两者不会打架。
   两端透明 → 滑出画面后回位无缝；8s 一轮，速度约 258px/s，不抢标题重心。 */
.v2-header-glow {
  position: absolute; left: 0; bottom: 0;
  width: vw(144); height: vh(4);
  display: block; pointer-events: none;
  animation: v2-header-glow 8s linear infinite;
  will-change: transform;
}

@keyframes v2-header-glow {
  /* -100% → 100vw + 100%：辉光块从左侧完全移出，滑到右侧完全移出，无缝循环 */
  from { transform: translateX(-100%); }
  to { transform: translateX(calc(100vw + 100%)); }
}
</style>
