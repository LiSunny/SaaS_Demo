import request from '@/utils/request'
import type { UserItem, UserQuery, CreateUserForm, UpdateUserForm, UserEnterpriseItem, PaginatedData } from '@/types/user-admin'

const BASE = '/admin/users'

export async function getUserList(query: UserQuery): Promise<PaginatedData<UserItem>> {
  const res = await request.get(`${BASE}/list`, { params: query })
  return (res as any).data
}

export async function getUserDetail(id: number): Promise<UserItem> {
  const res = await request.get(`${BASE}/${id}`)
  return (res as any).data
}

export async function createUser(form: CreateUserForm): Promise<UserItem> {
  const res = await request.post(BASE, form)
  return (res as any).data
}

export async function updateUser(id: number, form: UpdateUserForm): Promise<UserItem> {
  const res = await request.put(`${BASE}/${id}`, form)
  return (res as any).data
}

export async function toggleUserStatus(id: number): Promise<UserItem> {
  const res = await request.post(`${BASE}/${id}/toggle-status`)
  return (res as any).data
}

export async function resetUserPassword(id: number): Promise<{ password: string }> {
  const res = await request.post(`${BASE}/${id}/reset-password`)
  return (res as any).data
}

export async function getUserEnterprises(id: number): Promise<UserEnterpriseItem[]> {
  const res = await request.get(`${BASE}/${id}/enterprises`)
  return (res as any).data
}
