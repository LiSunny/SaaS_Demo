<template>
  <img
    v-if="direction !== 'none'"
    :src="direction === 'asc' ? sortAscSvg : sortDescSvg"
    :class="['sort-icon', 'sort-active']"
  />
</template>

<script setup lang="ts">
import sortAscSvg from '@/assets/table/table-header-sort-asc.svg'
import sortDescSvg from '@/assets/table/table-header-sort-desc.svg'

defineProps<{
  direction: 'none' | 'asc' | 'desc'
}>()
</script>

<style scoped>
.sort-icon {
  width: 20px;
  height: 20px;
  vertical-align: middle;
}
.sort-icon.sort-active {
  opacity: 1;
}
</style>
