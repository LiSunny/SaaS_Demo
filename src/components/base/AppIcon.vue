<template>
  <component
    :is="tdIcon"
    v-if="tdIcon"
    :class="className"
    :size="computedSize"
  />
  <svg v-else :class="className" width="1em" height="1em">
    <use :href="`/sprite.svg#${name}`" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import * as TDesignIconsVue from 'tdesign-icons-vue-next'

const props = defineProps<{
  name: string
  className?: string
  size?: string | number
}>()

const tdIcon = computed(() => {
  const key = props.name.charAt(0).toUpperCase() + props.name.slice(1)
  return TDesignIconsVue[key] ?? null
})

const computedSize = computed(() => props.size ?? '1em')
</script>