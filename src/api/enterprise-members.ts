import request from '@/utils/request'
import type { MemberItem, MemberQuery, AddMemberForm, UpdateMemberForm, PaginatedData } from '@/types/enterprise'

export async function getMembers(enterpriseId: number, query: MemberQuery): Promise<PaginatedData<MemberItem>> {
  const res = await request.get(`/enterprise/${enterpriseId}/users`, { params: query })
  return (res as any).data
}

export async function addMember(enterpriseId: number, form: AddMemberForm): Promise<MemberItem> {
  const res = await request.post(`/enterprise/${enterpriseId}/users`, form)
  return (res as any).data
}

export async function updateMember(enterpriseId: number, userId: number, form: UpdateMemberForm): Promise<MemberItem> {
  const res = await request.put(`/enterprise/${enterpriseId}/users/${userId}`, form)
  return (res as any).data
}

export async function removeMember(enterpriseId: number, userId: number): Promise<void> {
  await request.delete(`/enterprise/${enterpriseId}/users/${userId}`)
}
