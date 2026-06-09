<template>
  <DashboardShell dashboard-id="workbench" :role="userStore.currentPositionKey" />
</template>

<script setup lang="ts">
import DashboardShell from '@/components/dashboard/DashboardShell.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>
