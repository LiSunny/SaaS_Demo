<template>
  <div class="page-shell">
    <!-- ===== 左列：主区（上）+ 底部三模块（下） ===== -->
    <div class="page-shell__col">
      <div class="page-shell__main">
        <slot name="main" />
      </div>

      <div class="page-shell__row">
        <slot name="row">
          <EbikeV2PlaceholderCard
            v-for="t in rowModules"
            :key="t"
            :title="t"
            :sub="sub"
          />
        </slot>
      </div>
    </div>

    <!-- ===== 右列：三个模块 ===== -->
    <div class="page-shell__side">
      <slot name="side">
        <EbikeV2PlaceholderCard
          v-for="t in sideModules"
          :key="t"
          :title="t"
          :sub="sub"
        />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 导航页共用版式外壳
 *
 * 版式取自 Figma「设备监测大屏/总 · 内容区」(node 1:906)：
 *   左列（主区 + 底部三模块，高 303）+ 右列（三模块，宽 456），列间距 16。
 * 四个导航页（实时警情 / 系统监测 / 消防档案 / 运行报告）共用这一套骨架，
 * 页面之间只换主区内容与模块标题，不改几何。
 */
import EbikeV2PlaceholderCard from '../EbikeV2PlaceholderCard.vue'

withDefaults(
  defineProps<{
    /** 底部一行三模块的标题 */
    rowModules?: string[]
    /** 右列三模块的标题 */
    sideModules?: string[]
    /** 占位模块副标题（当前系统 / 画面等上下文） */
    sub?: string
  }>(),
  { rowModules: () => [], sideModules: () => [], sub: '' },
)
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 页面容器：顶栏以下铺满；底色与总览页一致（由外层 .ebike-v2 提供） */
.page-shell {
  position: absolute;
  top: vh(68);
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: vw(16);
  padding: vh(18) vw(16) vh(16);
}

/* 左列：主区 + 底部三模块 */
.page-shell__col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(16);
}

/* 主区：内容由页面自行填充 */
.page-shell__main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
/* 主区插槽内容撑满（插槽内容属页面作用域，用 :deep 放行） */
.page-shell__main > :deep(*) {
  flex: 1;
  min-height: 0;
}

/* 底部三模块 */
.page-shell__row {
  flex-shrink: 0;
  height: vh(303);
  display: flex;
  gap: vw(16);
}

/* 插槽内容属页面作用域，用 :deep 放行 */
.page-shell__row > :deep(*) {
  flex: 1;
  min-width: 0;
}

/* 右列三模块。宽 520（Figma 原为 456，健康度分析改上下布局后需要更宽的横向空间） */
.page-shell__side {
  flex-shrink: 0;
  width: vw(520);
  display: flex;
  flex-direction: column;
  gap: vh(16);
}

.page-shell__side > :deep(*) {
  flex: 1;
  min-height: 0;
}
</style>
