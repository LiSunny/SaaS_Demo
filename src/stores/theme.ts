import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(localStorage.getItem('theme') === 'dark')

  watch(isDark, (val) => {
    document.documentElement.classList.toggle('dark', val)
    localStorage.setItem('theme', val ? 'dark' : 'light')
  }, { immediate: true })

  function toggle() { isDark.value = !isDark.value }

  return { isDark, toggle }
})
