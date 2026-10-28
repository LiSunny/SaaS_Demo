/**
 * 自定义图元 Store
 *
 * 图元库产物是静态的（内置 47 个图元）；平台内新增的图元存服务端（Prisma + OSS），
 * 拉下来后注册进渲染链路（src/symbols/index.ts 的 registerCustomSymbol），
 * 图元管理页、图元选择器、画布读的都是同一份合并后的 SYMBOLS。
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  createCustomSymbol,
  fetchCustomSymbols,
  removeCustomSymbol,
  updateCustomSymbol,
} from '@/api/symbols'
import { registerCustomSymbol, unregisterCustomSymbol } from '@/symbols'
import type { CustomSymbolForm, CustomSymbolItem } from '@/types/symbol'

export const useSymbolStore = defineStore('symbols', () => {
  /** 平台内新增的图元 */
  const customSymbols = ref<CustomSymbolItem[]>([])
  /** 是否已拉取过 */
  const loaded = ref(false)
  /** 拉取中 */
  const loading = ref(false)

  /** 自定义图元数量 */
  const customCount = computed(() => customSymbols.value.length)

  /** 把服务端记录注册进渲染链路 */
  function registerAll(items: CustomSymbolItem[]) {
    for (const item of items) registerCustomSymbol(item)
    customSymbols.value = items
  }

  /** 拉取自定义图元（已拉取过则跳过，force 可强制刷新） */
  async function load(force = false): Promise<void> {
    if (loading.value) return
    if (loaded.value && !force) return
    loading.value = true
    try {
      const items = await fetchCustomSymbols()
      registerAll(items)
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  /** 新增自定义图元 */
  async function create(form: CustomSymbolForm): Promise<CustomSymbolItem> {
    const item = await createCustomSymbol(form)
    registerCustomSymbol(item)
    customSymbols.value = [item, ...customSymbols.value]
    return item
  }

  /** 更新自定义图元 */
  async function update(id: number, form: Partial<CustomSymbolForm>): Promise<CustomSymbolItem> {
    const item = await updateCustomSymbol(id, form)
    registerCustomSymbol(item)
    customSymbols.value = customSymbols.value.map((s) => (s.id === id ? item : s))
    return item
  }

  /** 删除自定义图元（服务端连带删除 OSS 产品图） */
  async function remove(id: number): Promise<void> {
    const target = customSymbols.value.find((s) => s.id === id)
    await removeCustomSymbol(id)
    if (target) unregisterCustomSymbol(target.symbolId)
    customSymbols.value = customSymbols.value.filter((s) => s.id !== id)
  }

  return {
    customSymbols,
    customCount,
    loaded,
    loading,
    load,
    create,
    update,
    remove,
  }
})
