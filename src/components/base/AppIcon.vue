<template>
  <svg :class="className" width="1em" height="1em">
    <use :href="`/sprite.svg#${name}`" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ name: string; className?: string }>()
</script>
