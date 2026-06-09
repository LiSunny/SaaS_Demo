<template>
  <div class="domain-overview">
    <h1>系统管理</h1>
    <p class="domain-desc">租户管理、人员权限、组织架构、日志审计等后台管理功能。17 个功能模块。</p>
    <div class="module-list">
      <span v-for="m in modules" :key="m" class="module-tag">{{ m }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const modules = ['管理单元', '建筑管理', '重点部位', '租户管理', '人员管理', '权限管理', '部门管理', '岗位管理', '通知公告', '制度管理', '企业配置-基础信息', '企业配置-个性化', '日志管理', '动态表单', '责任状', '使用手册']
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