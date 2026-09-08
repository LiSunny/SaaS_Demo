<template>
  <!-- 模块壳：小标题（ModuleTitle）+ 内容区。
       样式按设计稿（Figma 节点 128:19600「商业街或店铺信息」）：半透明深蓝底、直角、右/下/左 2px #015C8A 边框 -->
  <div class="ov-module">
    <ModuleTitle :title="title" />
    <div class="ov-module-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import ModuleTitle from './ModuleTitle.vue'

defineProps<{ title: string }>()
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.ov-module {
  min-height: 0;
  flex: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(0, 56, 100, 0.68);
  // border-right: 2px solid #015C8A;
  // border-bottom: 2px solid #015C8A;
  // border-left: 2px solid #015C8A;
  // border-radius: 0;
  color: #F2F8FC;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  box-shadow: 0 10px 32px rgba(0, 10, 30, 0.35);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.ov-module-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: vh(10) vw(16);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  border-right: 2px solid #015C8A;
  border-bottom: 2px solid #015C8A;
  border-left: 2px solid #015C8A;
  border-radius: 0;
}
</style>
