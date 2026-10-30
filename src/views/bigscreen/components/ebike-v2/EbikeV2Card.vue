<template>
  <section class="v2-card">
    <BigscreenSectionTitle :title="title" />
    <div class="v2-card__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import BigscreenSectionTitle from '../common/BigscreenSectionTitle.vue'

defineProps<{
  title: string
}>()
</script>

<style lang="scss" scoped>
.v2-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex-shrink: 0;
  /* 拟态玻璃：半透明底 + 背景模糊，下层三维模型隐隐透出，
     底色压得住模型细节，模块内容仍然清晰。
     不透明度按"值班员远看要读得清"定：0.28 太透，模型亮部会把文字吃掉，
     实测后提到 0.62 + blur 9px —— 模型只保留轮廓，文字可读性优先。
     再提到 0.72：0.62 时三维模型的明亮建筑区（左列底部的阈值与趋势标签
     所在处）会透上来，实测底色偏到 rgb(20,56,94)，把 L4 弱文字压到
     3.83:1。0.72 后该区底色回到 rgb(14,48,80)，弱文字回到 4.5:1 以上，
     而模型仍保留可辨的轮廓与亮部。 */
  background: rgba(0, 44, 94, 0.72);
  backdrop-filter: blur(9px) saturate(125%);
  -webkit-backdrop-filter: blur(9px) saturate(125%);
  border: 1px solid rgba(0, 152, 230, 0.16);
  border-radius: 3px;
  overflow: hidden;
}

/* Figma 44:935：卡片内容区无独立底板，透出卡片自身的玻璃底 */
.v2-card__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
