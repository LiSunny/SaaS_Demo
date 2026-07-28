<template>
  <div v-if="show" class="mobile-tip-overlay" @click.self="$emit('close')">
    <div class="mobile-tip-card">
      <div class="mobile-tip-icon">💻</div>
      <h3 class="mobile-tip-title">目前仅支持电脑端体验</h3>
      <p class="mobile-tip-sub">请复制链接在电脑浏览器中打开</p>
      <button class="mobile-tip-btn" @click="copyExpUrl">
        {{ copied ? '复制成功，去体验吧' : '复制体验地址' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ show: boolean; copied: boolean }>()
defineEmits<{ close: [] }>()
const copyExpUrl = () => navigator.clipboard.writeText(window.location.origin + '/login')
</script>

<style scoped>
.mobile-tip-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.35); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.mobile-tip-card { background: #fff; border-radius: 16px; padding: 40px 32px; text-align: center; max-width: 320px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.mobile-tip-icon { font-size: 48px; margin-bottom: 16px; }
.mobile-tip-title { font-size: 18px; font-weight: 700; color: #101010; margin: 0 0 8px; }
.mobile-tip-sub { font-size: 14px; color: #5E5E5E; margin: 0 0 24px; line-height: 1.6; }
.mobile-tip-btn { width: 100%; padding: 12px 24px; border-radius: 8px; border: none; font-size: 15px; font-weight: 600; background: #3678E3; color: #fff; cursor: pointer; transition: background 0.2s; }
.mobile-tip-btn:hover { background: rgba(54,120,227,0.9); }
</style>
