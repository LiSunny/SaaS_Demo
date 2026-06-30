import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import type { DeviceItem, DeviceQuery } from '@/types/device'
import { getDeviceList } from '@/api/device'

export const useDeviceStore = defineStore('device', () => {
  const list = ref<DeviceItem[]>([])
  const loading = ref(false)
  const query = reactive<DeviceQuery>({ page: 1, size: 20 })
  const total = ref(0)

  async function fetchList() {
    loading.value = true
    try { const r = await getDeviceList({ ...query }); list.value = r.data; total.value = r.total }
    finally { loading.value = false }
  }
  function search() { query.page = 1; fetchList() }

  return { list, loading, query, total, fetchList, search }
})
