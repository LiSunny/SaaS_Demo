<template>
  <div class="metrics-bar">
    <div
      v-for="item in metrics"
      :key="item.label"
      class="metric-item"
      :class="`metric-item--${item.type}`"
    >
      <div class="metric-icon" :class="`icon-bg--${item.type}`">
        <svg v-if="item.icon === 'shop'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <svg v-else-if="item.icon === 'device'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="16" x2="12.01" y2="16"/><line x1="8" y1="12" x2="8.01" y2="12"/><line x1="16" y1="12" x2="16.01" y2="12"/></svg>
        <svg v-else-if="item.icon === 'online'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>
        <svg v-else-if="item.icon === 'rate'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <svg v-else-if="item.icon === 'alert'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <svg v-else-if="item.icon === 'hazard'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
        <svg v-else-if="item.icon === 'danger'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <div class="metric-content">
        <span class="metric-label">{{ item.label }}</span>
        <div class="metric-value-row">
          <span class="metric-value" :class="`metric-value--${item.type}`">{{ item.value }}</span>
          <span class="metric-unit">{{ item.sub }}</span>
        </div>
        <div class="metric-delta">
          <span class="delta-label">较昨日</span>
          <span class="delta-num" :class="item.delta > 0 ? 'delta-up' : 'delta-down'">
            {{ item.delta > 0 ? '+' : '' }}{{ item.delta }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface MetricItem {
  label: string
  value: string | number
  sub: string
  type: 'normal' | 'warning' | 'danger'
  icon: string
  delta: number
}

const metrics: MetricItem[] = [
  { label: '纳管商铺', value: '286', sub: '家', type: 'normal', icon: 'shop', delta: 12 },
  { label: '纳管设备', value: '528', sub: '台', type: 'normal', icon: 'device', delta: 8 },
  { label: '设备在线率', value: '98.6', sub: '%', type: 'normal', icon: 'online', delta: 0.8 },
  { label: '今日履职率', value: '92.0', sub: '%', type: 'normal', icon: 'rate', delta: 2.3 },
  { label: '今日告警', value: '6', sub: '起', type: 'warning', icon: 'alert', delta: 2 },
  { label: '未闭环隐患', value: '12', sub: '项', type: 'warning', icon: 'hazard', delta: 3 },
  { label: '高风险商铺', value: '3', sub: '家', type: 'danger', icon: 'danger', delta: 1 },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.metrics-bar {
  display: flex;
  gap: vw(10);
  padding: vh(10) vw(14);
  height: 100%;
  align-items: center;
}

.metric-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: vw(8);
  padding: vh(8) vw(10);
  background: rgba(2, 30, 80, 0.45);
  border: 1px solid rgba(71, 132, 232, 0.25);
  border-radius: 6px;
  transition: border-color 0.3s ease;
}

.metric-item--warning {
  border-color: rgba(245, 158, 11, 0.35);
  background: rgba(245, 158, 11, 0.08);
}

.metric-item--danger {
  border-color: rgba(239, 68, 68, 0.45);
  background: rgba(239, 68, 68, 0.1);
}

.metric-icon {
  width: calc(36 * var(--min-scale));
  height: calc(36 * var(--min-scale));
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
}

.metric-icon svg {
  width: 60%;
  height: 60%;
}

.icon-bg--normal { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.icon-bg--warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.icon-bg--danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

.metric-content {
  display: flex;
  flex-direction: column;
  gap: vh(2);
  min-width: 0;
}

.metric-label {
  font-size: clamp(9px, calc(12 * var(--min-scale)), 14px);
  color: rgba(224, 234, 250, 0.85);
  line-height: 1.3;
}

.metric-value-row {
  display: flex;
  align-items: baseline;
  gap: vw(4);
}

.metric-value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(18px, calc(28 * var(--min-scale)), 36px);
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(to bottom, #ffffff, #89b5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.metric-value--warning {
  background: linear-gradient(to bottom, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  background-clip: text;
}

.metric-value--danger {
  background: linear-gradient(to bottom, #fca5a5, #ef4444);
  -webkit-background-clip: text;
  background-clip: text;
}

.metric-unit {
  font-size: clamp(9px, calc(12 * var(--min-scale)), 14px);
  color: rgba(137, 181, 255, 0.7);
}

.metric-delta {
  display: flex;
  align-items: center;
  gap: vw(4);
  font-size: clamp(8px, calc(10 * var(--min-scale)), 12px);
}

.delta-label {
  color: rgba(224, 234, 250, 0.5);
}

.delta-num {
  font-weight: 700;
}

.delta-up { color: #fca5a5; }
.delta-down { color: #86efac; }
</style>
