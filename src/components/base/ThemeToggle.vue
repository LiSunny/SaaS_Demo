<template>
  <button
    class="theme-switch"
    :class="{ 'is-dark': theme.isDark }"
    role="switch"
    :aria-checked="theme.isDark"
    :title="theme.isDark ? '切换浅色模式' : '切换深色模式'"
    @click="theme.toggle()"
  >
    <span class="ts-track">
      <span class="ts-thumb">
        <svg v-if="theme.isDark" class="ts-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else class="ts-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </span>
    </span>
  </button>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
const theme = useThemeStore()
</script>

<style scoped>
.theme-switch {
  /* reset button */
  background: none; border: none; padding: 0; margin: 0;
  cursor: pointer; flex-shrink: 0;
  display: inline-flex; align-items: center;
  line-height: 0;
}
.theme-switch:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 2px; border-radius: 999px; }

.ts-track {
  position: relative;
  width: 40px; height: 22px;
  border-radius: 999px;
  background: var(--border-default);
  transition: background .25s ease;
  display: inline-flex; align-items: center;
}
.theme-switch.is-dark .ts-track {
  background: var(--accent-primary);
}

.ts-thumb {
  position: absolute;
  top: 2px; left: 2px;
  width: 18px; height: 18px;
  border-radius: 50%;
  background: var(--bg-card);
  box-shadow: 0 1px 3px rgba(0, 0, 0, .18);
  transition: transform .25s ease, background .25s ease;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--text-secondary);
}
.theme-switch.is-dark .ts-thumb {
  transform: translateX(18px);
  color: var(--accent-primary);
}
.ts-icon { display: block; }
</style>
