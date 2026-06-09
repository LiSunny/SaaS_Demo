<template>
  <div class="domain-overview">
    <h1>IOT 物联网</h1>
    <p class="domain-desc">设备接入、协议驱动、产品注册、OTA 升级等物联网管理功能。14 个功能模块。</p>
    <div class="module-list">
      <span v-for="m in modules" :key="m" class="module-tag">{{ m }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const modules = ['协议驱动管理', '网络组件', '产品管理', '设备管理', '固件管理', '升级任务', '子设备', '网关管理', '分组管理', '模拟器', '泛协议服务', '场景联动', '设备调试', 'OTA 升级包']
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