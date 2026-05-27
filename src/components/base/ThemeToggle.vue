<template>
  <button class="theme-toggle" @click="theme.toggle()" :title="theme.isDark ? '切换浅色模式' : '切换深色模式'">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <template v-if="theme.isDark">
        <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </template>
      <template v-else>
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" stroke-width="2"/>
      </template>
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
const theme = useThemeStore()
</script>

<style scoped>
.theme-toggle {
  background: none; border: none; cursor: pointer;
  width: 28px; height: 28px; display: flex;
  align-items: center; justify-content: center;
  color: var(--text-secondary); border-radius: 6px;
}
.theme-toggle:hover { background: var(--accent-primary10); color: var(--accent-primary); }
</style>
