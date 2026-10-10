<template>
  <div class="hp-page">
    <div class="hp-card">
      <header class="hp-head">
        <span class="hp-tag">{{ cfg.code }}</span>
        <h1 class="hp-title">{{ cfg.title }}</h1>
        <p class="hp-desc">{{ cfg.desc }}</p>
      </header>

      <section v-if="cfg.caps?.length" class="hp-section">
        <h2 class="hp-section-title">核心能力</h2>
        <ul class="hp-cap-list">
          <li v-for="c in cfg.caps" :key="c" class="hp-cap-item">
            <span class="hp-cap-dot"></span>
            <span>{{ c }}</span>
          </li>
        </ul>
      </section>

      <section class="hp-section">
        <h2 class="hp-section-title">Demo 状态</h2>
        <div :class="['hp-status', `hp-status-${cfg.statusTone || 'info'}`]">
          {{ cfg.status || '页面占位中 · 功能概述' }}
        </div>
      </section>

      <footer class="hp-foot">
        <span class="hp-foot-label">子功能编号</span>
        <span class="hp-foot-code">{{ cfg.code }}</span>
        <span class="hp-foot-divider">·</span>
        <span class="hp-foot-label">所属模块</span>
        <span class="hp-foot-code">{{ cfg.module }}</span>
        <span class="hp-foot-divider">·</span>
        <span class="hp-foot-label">所属路由</span>
        <span class="hp-foot-code">{{ route.path }}</span>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { HAZARD_PAGE_CONFIG, type HazardPageConfig } from './hazard-pages'

const route = useRoute()

const cfg = computed<HazardPageConfig>(() => {
  // 优先按路由 name 查；查不到给一个通用兜底
  const fromName = HAZARD_PAGE_CONFIG[String(route.name)]
  if (fromName) return fromName
  return {
    code: 'M-?',
    title: String(route.name || '占位'),
    module: '隐患排查治理',
    desc: '页面占位中，功能概述待补充。',
    caps: [],
    status: '页面占位中',
    statusTone: 'info',
  }
})
</script>

<style scoped>
.hp-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl, 16px);
}
.hp-card {
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
.hp-head { display: flex; flex-direction: column; gap: 12px; }
.hp-tag {
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
.hp-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}
.hp-desc {
  margin: 0;
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.7;
}

/* ===== Section ===== */
.hp-section { display: flex; flex-direction: column; gap: 12px; }
.hp-section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.hp-cap-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 24px;
}
.hp-cap-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
}
.hp-cap-dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-primary);
  margin-top: 9px;
}

/* ===== Status ===== */
.hp-status {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
.hp-status-info    { background: var(--info-bg);    color: var(--accent-primary); }
.hp-status-success { background: var(--success-bg); color: var(--success); }
.hp-status-warning { background: var(--warning-bg); color: var(--warning); }

/* ===== Foot ===== */
.hp-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
  padding-top: 18px;
  border-top: 1px solid var(--border-low);
  font-size: 12px;
  color: var(--text-muted);
}
.hp-foot-label { color: var(--text-muted); }
.hp-foot-code {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
  color: var(--text-secondary);
  background: var(--bg-sub-card);
  padding: 2px 8px;
  border-radius: 4px;
}
.hp-foot-divider { color: var(--text-placeholder); }

/* ===== 响应式 ===== */
@media (max-width: 720px) {
  .hp-card { padding: 24px 20px; }
  .hp-title { font-size: 20px; }
  .hp-cap-list { grid-template-columns: 1fr; }
}
</style>