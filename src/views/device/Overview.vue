<template>
  <div class="domain-overview">
    <h1>设备管理</h1>
    <p class="domain-desc">消防设备资产台账、全生命周期管理。18 个功能模块，后续通过 Tab 或左侧二级导航承载。</p>
    <div class="module-list">
      <span v-for="m in modules" :key="m" class="module-tag">{{ m }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const modules = ['首页', '设备设施台账', '运行监控', '保养管理', '应急物资', '报表与报告', '日志', '配置', '消息推送']
</script>

<style scoped>
.domain-overview { padding: 24px; }
.domain-overview h1 { font-size: 24px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px; }
.domain-desc { font-size: 14px; color: var(--text-secondary); margin-bottom: 24px; line-height: 1.6; }
.module-list { display: flex; flex-wrap: wrap; gap: 8px; }
.module-tag {
  padding: 6px 14px; border-radius: 6px;
  background: var(--accent-primary10); color: var(--accent-primary);
  font-size: 14px; border: 1px solid var(--accent-primary);
}
</style>