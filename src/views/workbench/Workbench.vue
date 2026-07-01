<template>
  <DashboardShell dashboard-id="workbench" :role="dashboardRole" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashboardShell from '@/components/dashboard/DashboardShell.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

/** 系统角色用户用 systemRole，普通用户用岗位 key */
const dashboardRole = computed(() => userStore.systemRole || userStore.currentPositionKey)
</script>
