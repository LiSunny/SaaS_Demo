/**
 * symbol-http.ts — 自定义图元 HTTP Adapter
 *
 * 自定义图元 = 平台内新增的图元（内置图元是图元库构建产物，只读不可删）。
 */
import request from '@/utils/request'
import type { CustomSymbolForm, CustomSymbolItem } from '@/types/symbol'

/** 自定义图元列表 */
export async function fetchCustomSymbols(): Promise<CustomSymbolItem[]> {
  const res = await request.get('/symbols/custom')
  return (res as any).data as CustomSymbolItem[]
}

/** 新增自定义图元 */
export async function createCustomSymbol(form: CustomSymbolForm): Promise<CustomSymbolItem> {
  const res = await request.post('/symbols/custom', form)
  return (res as any).data as CustomSymbolItem
}

/** 更新自定义图元 */
export async function updateCustomSymbol(
  id: number,
  form: Partial<CustomSymbolForm>,
): Promise<CustomSymbolItem> {
  const res = await request.put(`/symbols/custom/${id}`, form)
  return (res as any).data as CustomSymbolItem
}

/** 删除自定义图元（服务端连带清理 OSS 产品图） */
export async function removeCustomSymbol(id: number): Promise<void> {
  await request.delete(`/symbols/custom/${id}`)
}
