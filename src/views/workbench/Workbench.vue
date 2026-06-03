<template>
  <DashboardShell dashboard-id="workbench" :role="currentRole" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashboardShell from '@/components/dashboard/DashboardShell.vue'

/**
 * 当前角色临时硬编码为 'property'（物业管理员）。
 * 后续接入真实登录后从用户 Store 读取。
 */
const currentRole = computed(() => 'property')
</script>
