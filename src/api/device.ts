import type { DeviceItem, DeviceQuery, PaginatedData } from '@/types/device'

const MOCK: DeviceItem[] = [
  { id: '1', name: '消防水泵 A', type: '消防设备', location: 'B1 消防泵房', status: 1, createdAt: '2026-06-15T08:00:00Z' },
  { id: '2', name: '烟感探测器 3F-01', type: '探测设备', location: '3F 东走廊', status: 1, createdAt: '2026-06-10T10:30:00Z' },
  { id: '3', name: '应急照明 B2-02', type: '照明设备', location: 'B2 停车场', status: 2, createdAt: '2026-06-20T14:00:00Z' },
  { id: '4', name: '手动报警按钮 1F-03', type: '报警设备', location: '1F 大厅', status: 0, createdAt: '2026-05-28T09:00:00Z' },
  { id: '5', name: '喷淋头 5F-07', type: '消防设备', location: '5F 办公区', status: 1, createdAt: '2026-06-25T16:00:00Z' },
]

export async function getDeviceList(query: DeviceQuery): Promise<PaginatedData<DeviceItem>> {
  let data = MOCK
  if (query.keyword) data = data.filter(d => d.name.includes(query.keyword!))
  if (query.status) data = data.filter(d => d.status === Number(query.status))
  return { data: data.slice((query.page - 1) * query.size, query.page * query.size), total: data.length }
}
