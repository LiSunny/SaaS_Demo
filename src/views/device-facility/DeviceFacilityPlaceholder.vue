<template>
  <div class="fp-page">
    <div class="fp-card">
      <header class="fp-head">
        <span class="fp-tag">{{ cfg.code }}</span>
        <h1 class="fp-title">{{ cfg.title }}</h1>
        <p class="fp-desc">{{ cfg.desc }}</p>
      </header>

      <section v-if="cfg.caps?.length" class="fp-section">
        <h2 class="fp-section-title">核心能力</h2>
        <ul class="fp-cap-list">
          <li v-for="c in cfg.caps" :key="c" class="fp-cap-item">
            <span class="fp-cap-dot"></span>
            <span>{{ c }}</span>
          </li>
        </ul>
      </section>

      <section class="fp-section">
        <h2 class="fp-section-title">Demo 状态</h2>
        <div :class="['fp-status', `fp-status-${cfg.statusTone || 'info'}`]">
          {{ cfg.status || '页面占位中 · 功能概述' }}
        </div>
      </section>

      <footer class="fp-foot">
        <span class="fp-foot-label">子功能编号</span>
        <span class="fp-foot-code">{{ cfg.code }}</span>
        <span class="fp-foot-divider">·</span>
        <span class="fp-foot-label">所属模块</span>
        <span class="fp-foot-code">{{ cfg.module }}</span>
        <span class="fp-foot-divider">·</span>
        <span class="fp-foot-label">所属路由</span>
        <span class="fp-foot-code">{{ route.path }}</span>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FACILITY_PAGE_CONFIG, type FacilityPageConfig } from './facility-pages'

const route = useRoute()

const cfg = computed<FacilityPageConfig>(() => {
  // 优先按路由 name 查；查不到给一个通用兜底
  const fromName = FACILITY_PAGE_CONFIG[String(route.name)]
  if (fromName) return fromName
  return {
    code: 'F-?',
    title: String(route.name || '占位'),
    module: '设备设施管理',
    desc: '页面占位中，功能概述待补充。',
    caps: [],
    status: '页面占位中',
    statusTone: 'info',
  }
})
</script>

<style scoped>
.fp-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl, 16px);
}
.fp-card {
  width: 100%;
  max-width: 880px;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 10px);
  padding: 32px 36px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ===== Head ===== */
.fp-head { display: flex; flex-direction: column; gap: 12px; }
.fp-tag {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 4px;
  background: var(--accent-primary10);
  color: var(--accent-primary);
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
  letter-spacing: 0.5px;
}
.fp-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}
.fp-desc {
  margin: 0;
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.7;
}

/* ===== Section ===== */
.fp-section { display: flex; flex-direction: column; gap: 12px; }
.fp-section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.fp-cap-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 24px;
}
.fp-cap-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
}
.fp-cap-dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-primary);
  margin-top: 9px;
}

/* ===== Status ===== */
.fp-status {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
.fp-status-info    { background: var(--info-bg);    color: var(--accent-primary); }
.fp-status-success { background: var(--success-bg); color: var(--success); }
.fp-status-warning { background: var(--warning-bg); color: var(--warning); }

/* ===== Foot ===== */
.fp-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
  padding-top: 18px;
  border-top: 1px solid var(--border-low);
  font-size: 12px;
  color: var(--text-muted);
}
.fp-foot-label { color: var(--text-muted); }
.fp-foot-code {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
  color: var(--text-secondary);
  background: var(--bg-sub-card);
  padding: 2px 8px;
  border-radius: 4px;
}
.fp-foot-divider { color: var(--text-placeholder); }

/* ===== 响应式 ===== */
@media (max-width: 720px) {
  .fp-card { padding: 24px 20px; }
  .fp-title { font-size: 20px; }
  .fp-cap-list { grid-template-columns: 1fr; }
}
</style>
