<template>
  <div class="list-page">
    <div class="content-card" style="display:flex;align-items:center;justify-content:center;height:100%">
      <div style="text-align:center;color:var(--text-secondary)">
        <p style="font-size:var(--font-h2);margin-bottom:8px">✅ 复工验收/签发</p>
        <p style="font-size:var(--font-small)">正在开发中</p>
        <button class="btn-link" @click="$router.push('/resumption')" style="margin-top:12px">← 返回计划列表</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.list-page { height: 100%; }
.content-card {
  background: var(--bg-card); border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px);
}
</style>
