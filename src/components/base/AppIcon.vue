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

/** 将 kebab-case / lowercase 名转为 PascalCaseIcon 后缀，匹配 TDesign 导出名 */
function toPascalCase(name: string): string {
  return name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

const tdIcon = computed(() => {
  // Try original capitalization first (backward compat)
  const simpleKey = props.name.charAt(0).toUpperCase() + props.name.slice(1)
  const lib = TDesignIconsVue as Record<string, any>
  if (lib[simpleKey]) return lib[simpleKey]
  // Try PascalCase + Icon suffix (TDesign convention: ArrowLeftIcon, EditIcon)
  const pascalKey = toPascalCase(props.name) + 'Icon'
  if (lib[pascalKey]) return lib[pascalKey]
  return null
})

const computedSize = computed(() => props.size ?? '1em')
</script>