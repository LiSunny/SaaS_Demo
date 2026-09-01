<template>
  <div class="linking-bigscreen">
    <!-- Layer 0: 背景大图（Figma: iShot 截图 1920×1080 object-cover） -->
    <img class="bg-image" src="@/assets/bigscreen/linking/linking-bg.png" alt="" />

    <!-- Layer 1: 顶部标题栏 -->
    <LinkingHeader />

    <!-- Layer 1.5: 通用大屏切换菜单（概览 + 10 系统，与系统壳一致） -->
    <BigscreenNavDrawer
      :items="navItems"
      :active-id="activeId"
      header="大屏切换"
      @select="go"
    />

    <!-- Layer 2: 三列系统区（Figma: top 155px，1679px 宽居中，gap 52px，高 802px） -->
    <div class="linking-content">
      <SysColumn v-for="(col, i) in SYS_COLUMNS" :key="i" :column="col" />
    </div>

    <!-- Layer 3: 左侧装饰线（Figma: 80.89×1065 @ (13,3)） -->
    <img class="deco-side-line" src="@/assets/bigscreen/linking/linking-side-line.svg" alt="" />

    <!-- Layer 4: 左侧箭头装饰（Figma: 27.6×696 @ (13.99,192)） -->
    <img class="deco-side-arrow-l" src="@/assets/bigscreen/linking/linking-side-deco-left.svg" alt="" />

    <!-- Layer 5: 右侧大装饰（Figma: 947×1066.5 @ (960,3)，水平镜像） -->
    <div class="deco-side-right">
      <img src="@/assets/bigscreen/linking/linking-side-deco-right.svg" alt="" />
    </div>

    <!-- Layer 6: 右侧箭头装饰（Figma: 27.6×696 @ (1878.39,192)，水平镜像） -->
    <div class="deco-side-arrow-r">
      <img src="@/assets/bigscreen/linking/linking-side-deco-right-small.svg" alt="" />
    </div>

    <!-- Layer 7: 底部装饰线（Figma: Vector9 922×19.5 @ (24.84,1050) / Vector10 721×7.5 @ (108.19,1050.5) / Rectangle201 57.2×5 @ (902.79,1046)） -->
    <img class="deco-bottom-1" src="@/assets/bigscreen/linking/linking-bottom-line-1.svg" alt="" />
    <img class="deco-bottom-2" src="@/assets/bigscreen/linking/linking-bottom-line-2.svg" alt="" />
    <img class="deco-bottom-3" src="@/assets/bigscreen/linking/linking-bottom-deco.svg" alt="" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import './components/linking/linking-fonts.css'
import LinkingHeader from './components/linking/LinkingHeader.vue'
import SysColumn from './components/linking/SysColumn.vue'
import BigscreenNavDrawer from '@/components/base/BigscreenNavDrawer.vue'
import { SYS_COLUMNS } from './components/linking/linking-systems'
import { LINKING_NAV_ITEMS, linkingRouteFor, modByTitle } from './linking-subsystem/data/nav'
import { getBigscreenDetail } from '@/api/bigscreen'

const router = useRouter()
const route = useRoute()

/* 概览页当前屏 = 平台概览（id=0），通用菜单在此高亮概览项 */
const activeId: number = 0
const navItems = LINKING_NAV_ITEMS

function go(id: number | string) {
  router.push(linkingRouteFor(Number(id)))
}

/* bigscreenId → 具体系统大屏解析（管理端/顶部大屏切换深链进入时定位到对应系统屏） */
onMounted(async () => {
  const bid = Number(route.query.bigscreenId) || 0
  if (!bid) return
  try {
    const detail: any = await getBigscreenDetail(bid)
    const mod = modByTitle(detail?.name || '')
    if (mod && mod !== 0) {
      router.replace(`/landing/linking/sub/${mod}`)
    }
  } catch {
    // 非运营/管理角色无权限按 id 查大屏，保留概览即可
  }
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.linking-bigscreen {
  position: relative;
  width: 100vw; height: 100vh;
  overflow: hidden;
  /* Figma: 径向渐变 #0842A2 → #05337D → #012458（椭圆 rx960 ry540，中心 (960,540)） */
  background: radial-gradient(960px 540px at 50% 50%, #0842a2 0%, #05337d 50%, #012458 100%);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* Layer 0: 背景大图（Figma: 1920×1080 object-cover 铺满） */
.bg-image {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  pointer-events: none;
}

/* Layer 2: 三列系统区（Figma: top 155px，1679px 宽，gap 52px，高 802px） */
.linking-content {
  position: absolute;
  top: vh(155);
  left: 50%;
  transform: translateX(-50%);
  width: vw(1679); height: vh(802);
  display: flex; align-items: flex-start;
  gap: vw(52);
}

/* Layer 3: 左侧装饰线（Figma: 80.89×1065 @ (13,3)） */
.deco-side-line {
  position: absolute;
  left: vw(13); top: vh(3);
  width: vw(80.89); height: vh(1065);
  display: block; pointer-events: none;
}

/* Layer 4: 左侧箭头装饰（Figma: 27.6×696 @ (13.99,192)） */
.deco-side-arrow-l {
  position: absolute;
  left: vw(13.99); top: vh(192);
  width: vw(27.621); height: vh(696);
  display: block; pointer-events: none;
}

/* Layer 5: 右侧大装饰（Figma: 947×1066.5 @ (960,3)，水平镜像） */
.deco-side-right {
  position: absolute;
  left: vw(960); top: vh(3);
  width: vw(947); height: vh(1066.5);
  /* Figma: -scale-y-100 rotate-180 = 水平镜像 */
  transform: rotate(180deg) scaleY(-1);
  pointer-events: none;
}

.deco-side-right img {
  width: 100%; height: 100%;
  display: block;
}

/* Layer 6: 右侧箭头装饰（Figma: 27.6×696 @ (1878.39,192)，水平镜像） */
.deco-side-arrow-r {
  position: absolute;
  left: vw(1878.39); top: vh(192);
  width: vw(27.621); height: vh(696);
  transform: rotate(180deg) scaleY(-1);
  pointer-events: none;
}

.deco-side-arrow-r img {
  width: 100%; height: 100%;
  display: block;
}

/* Layer 7: 底部装饰线 */
.deco-bottom-1 {
  position: absolute;
  left: vw(24.84); top: vh(1050);
  width: vw(922.339); height: vh(19.5);
  display: block; pointer-events: none;
}

.deco-bottom-2 {
  position: absolute;
  left: vw(108.19); top: vh(1050.5);
  width: vw(721.101); height: vh(7.5);
  display: block; pointer-events: none;
}

.deco-bottom-3 {
  position: absolute;
  left: vw(902.79); top: vh(1046);
  width: vw(57.215); height: vh(5);
  display: block; pointer-events: none;
}
</style>
