<template>
  <div class="domain-overview">
    <h1>平台配置</h1>
    <p class="domain-desc">系统参数、字典、路由、文件管理、缓存监控等平台级技术配置。22 个功能模块。</p>
    <div class="module-list">
      <span v-for="m in modules" :key="m" class="module-tag">{{ m }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const modules = ['消防系统管理', '应用管理', 'APP 升级', '数据卡片', '首页模版', '缓存监控', '文档扩展', '路由管理', '登录方式', '文件管理', '审计日志', '操作日志', '字典管理', '行政区划', '三方鉴权', '参数管理', '国际化', '终端管理', '密钥管理', '令牌管理', '服务监控']
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