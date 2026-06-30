<template>
  <div class="list-page">
    <div class="content-card">

      <!-- ===== 当前企业标识 ===== -->
      <div class="page-header">
        <h3 class="page-title">企业成员管理</h3>
        <div class="enterprise-badge" v-if="enterpriseName">
          <span class="badge-label">当前企业：</span>
          <span class="badge-name">{{ enterpriseName }}</span>
        </div>
        <div class="enterprise-badge no-enterprise" v-if="!enterpriseName && enterpriseResolved">
          <span>未关联企业</span>
        </div>
      </div>

      <!-- ===== 空状态：无关联企业 ===== -->
      <div v-if="!enterpriseName && enterpriseResolved" class="empty-block">
        <p class="empty-title">暂无关联企业</p>
        <p class="empty-desc">当前账号未关联任何企业，请联系平台管理员分配企业</p>
      </div>

      <!-- ===== 筛选栏（有关联企业时显示） ===== -->
      <template v-if="enterpriseName">
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-input-wrap">
            <input
              v-model="keyword"
              class="fi-input"
              placeholder="手机号 / 姓名"
              @keyup.enter="search()"
            />
            <button v-if="keyword" class="fi-clear" @click="keyword = ''; search()">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>
          <button class="btn-primary" @click="search()">查询</button>
        </div>
        <div class="filter-right">
          <button class="btn-outline-primary" @click="openAddDialog">
            <AppIcon name="plus" class="btn-add-icon" />添加成员
          </button>
        </div>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th class="fi-th col-name"><span>姓名</span></th>
              <th class="fi-th col-phone"><span>手机号</span></th>
              <th class="fi-th col-pos"><span>岗位</span></th>
              <th class="fi-th col-date"><span>加入时间</span></th>
              <th class="fi-th col-actions"><span>操作</span></th>
            </tr>
          </thead>
          <tbody v-loading="loading">
            <tr v-for="row in list" :key="row.id" class="fi-tbody-tr">
              <td class="fi-td col-name">{{ row.realName }}</td>
              <td class="fi-td col-phone">{{ row.phone }}</td>
              <td class="fi-td col-pos">
                <div class="pos-tags">
                  <span v-for="pk in row.positions" :key="pk" class="pos-tag">{{ positionMap[pk] || '未知岗位' }}</span>
                  <span v-if="row.positions.length === 0" class="no-pos">—</span>
                </div>
              </td>
              <td class="fi-td col-date">{{ row.joinedAt?.slice(0, 10) }}</td>
              <td class="fi-td col-actions">
                <div class="action-cell">
                  <button class="act-btn act-edit" title="编辑" @click="openEditDialog(row)">
                    <AppIcon name="edit" class="act-icon" />
                  </button>
                  <button class="act-btn act-delete" title="移除" @click="handleRemove(row)">
                    <AppIcon name="delete" class="act-icon" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && list.length === 0">
              <td colspan="5" class="fi-td" style="text-align:center;color:var(--text-muted);padding:48px 0">暂无成员</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 分页 ===== -->
      <div class="pagination-wrap">
        <span class="pagi-total">共 {{ total }} 条记录 第 {{ page }}/{{ Math.ceil(total / size) || 1 }} 页</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchList()"
          @current-change="fetchList()"
        />
      </div>

      <!-- ===== 添加成员弹窗 ===== -->
      <el-dialog
        v-model="showAddDialog"
        title="添加成员"
        width="480px"
        destroy-on-close
        :close-on-click-modal="false"
        @closed="resetAddForm"
      >
        <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="80px">
          <el-form-item label="手机号" prop="phone">
            <el-input
              v-model="addForm.phone"
              placeholder="请输入手机号"
              maxlength="11"
              @blur="onPhoneBlur"
            />
          </el-form-item>
          <!-- 已匹配用户：只读展示 -->
          <el-form-item v-if="lookupState === 'found'" label="用户信息">
            <span class="phone-match-found">{{ phoneResult!.realName }}（已有账号）</span>
          </el-form-item>
          <!-- 新用户：需要输入姓名 -->
          <el-form-item v-if="lookupState === 'new'" label="真实姓名" prop="realName">
            <el-input
              v-model="addForm.realName"
              placeholder="请输入用户真实姓名"
              maxlength="20"
            />
          </el-form-item>
          <el-form-item label="分配岗位" prop="positions">
            <PositionSelect v-model="addForm.positions" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitAdd">确认添加</el-button>
        </template>
      </el-dialog>

      <!-- ===== 编辑成员弹窗 ===== -->
      <el-dialog
        v-model="showEditDialog"
        title="编辑成员"
        width="480px"
        destroy-on-close
        :close-on-click-modal="false"
      >
        <el-form label-width="80px">
          <el-form-item label="姓名">
            <span class="info-text">{{ editForm.realName }}</span>
          </el-form-item>
          <el-form-item label="手机号">
            <span class="info-text">{{ editForm.phone }}</span>
          </el-form-item>
          <el-form-item label="分配岗位">
            <PositionSelect v-model="editForm.positions" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitEdit">保存</el-button>
        </template>
      </el-dialog>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useConfirm } from '@/composables/useConfirm'
import type { FormInstance, FormRules } from 'element-plus'
import type { MemberItem } from '@/types/enterprise'
import { getMembers, addMember, updateMember, removeMember } from '@/api/enterprise-members'
import { getPositionList } from '@/api/position-admin'
import { ALL_POSITIONS } from '@/config/positions'

import request from '@/utils/request'
import AppIcon from '@/components/base/AppIcon.vue'
import PositionSelect from '@/components/business/PositionSelect.vue'

const { confirm } = useConfirm()

// ===== 企业 ID 与名称获取 =====
const enterpriseId = ref(1)
const enterpriseName = ref('')
const enterpriseResolved = ref(false)

async function resolveEnterprise() {
  // 优先从 URL query 获取
  const q = new URLSearchParams(window.location.search)
  const eid = q.get('enterpriseId')
  if (eid) {
    enterpriseId.value = +eid
  } else {
    // 从用户 profile 获取关联企业
    try {
      const res = await request.get('/auth/profile')
      const data = (res as any).data
      if (data?.enterprises?.length) {
        enterpriseId.value = data.enterprises[0].enterpriseId
      }
    } catch { /* fallback to 1 */ }
  }

  // 加载企业名称
  try {
    const res = await request.get(`/enterprise/${enterpriseId.value}`)
    const data = (res as any).data
    enterpriseName.value = data?.name || ''
  } catch { /* ignore */ }
  enterpriseResolved.value = true
}

// ===== 列表 =====
const list = ref<MemberItem[]>([])
const loading = ref(false)
const keyword = ref('')
const page = ref(1)
const size = ref(20)
const total = ref(0)

// 岗位名称映射
const positionMap = ref<Record<string, string>>({})

async function loadPositions() {
  try {
    const res = await getPositionList({ page: 1, size: 50 })
    for (const p of res.data) {
      positionMap.value[p.key] = p.name
    }
  } catch {
    // API 不可用时 fallback 到静态岗位配置（DAO Mock 模式）
    for (const p of ALL_POSITIONS) {
      // 写入两种 key 格式：原始 + platform: 前缀
      positionMap.value[p.key] = p.name
      if (!p.key.startsWith('platform:')) {
        positionMap.value[`platform:${p.key}`] = p.name
      }
    }
  }
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getMembers(enterpriseId.value, { page: page.value, size: size.value, keyword: keyword.value || undefined })
    list.value = res.data
    total.value = res.total
  } catch { /* error handled by interceptor */ } finally { loading.value = false }
}

function search() {
  page.value = 1
  fetchList()
}

onMounted(async () => {
  await resolveEnterprise()
  await loadPositions()
  fetchList()
})

// ===== 添加成员 =====
const showAddDialog = ref(false)
const addFormRef = ref<FormInstance>()
const addForm = reactive({ phone: '', realName: '', positions: [] as string[] })

// lookupState: 'idle' | 'found' | 'new' | 'looking'
const lookupState = ref<'idle' | 'found' | 'new' | 'looking'>('idle')
const phoneResult = ref<{ realName: string; phone: string } | null>(null)

const addRules = computed<FormRules>(() => ({
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  realName: lookupState.value === 'new' ? [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
  ] : [],
}))

async function onPhoneBlur() {
  const phone = addForm.phone.trim()
  if (!/^1\d{10}$/.test(phone)) return

  lookupState.value = 'looking'
  try {
    // request 已配置 baseURL: '/api'，这里只需 /admin/users/lookup
    const res = await request.get('/admin/users/lookup', { params: { phone } })
    const data = (res as any).data
    if (data) {
      phoneResult.value = { realName: data.realName, phone: data.phone }
      lookupState.value = 'found'
      addForm.realName = ''
    } else {
      phoneResult.value = null
      lookupState.value = 'new'
    }
  } catch {
    phoneResult.value = null
    lookupState.value = 'new'
  }
}

function resetAddForm() {
  addForm.phone = ''
  addForm.realName = ''
  addForm.positions = []
  lookupState.value = 'idle'
  phoneResult.value = null
  addFormRef.value?.resetFields()
}

function openAddDialog() {
  resetAddForm()
  showAddDialog.value = true
}

const submitting = ref(false)

async function submitAdd() {
  const valid = await addFormRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    await addMember(enterpriseId.value, {
      phone: addForm.phone,
      realName: lookupState.value === 'new' ? addForm.realName : undefined,
      positions: addForm.positions,
    })
    ElMessage.success('成员已添加')
    showAddDialog.value = false
    fetchList()
  } catch { /* error handled by interceptor */ } finally { submitting.value = false }
}

// ===== 编辑成员 =====
const showEditDialog = ref(false)
const editForm = reactive({ userId: 0, phone: '', realName: '', positions: [] as string[] })

function openEditDialog(row: MemberItem) {
  editForm.userId = row.userId
  editForm.phone = row.phone
  editForm.realName = row.realName
  editForm.positions = [...row.positions]
  showEditDialog.value = true
}

async function submitEdit() {
  submitting.value = true
  try {
    await updateMember(enterpriseId.value, editForm.userId, { positions: editForm.positions })
    ElMessage.success('岗位已更新')
    showEditDialog.value = false
    fetchList()
  } catch { /* error handled by interceptor */ } finally { submitting.value = false }
}

// ===== 移除成员 =====
async function handleRemove(row: MemberItem) {
  try {
    await confirm(
      `确定将 ${row.realName}（${row.phone}）从本企业移除吗？移除后该用户将无法再查看本企业数据。`,
      '移除确认',
      { type: 'warning' },
    )
  } catch { return }
  try {
    await removeMember(enterpriseId.value, row.userId)
    ElMessage.success('已移除')
    fetchList()
  } catch { /* error handled by interceptor */ }
}
</script>

<style scoped>
.list-page { height: 100%; }
.content-card {
  background: var(--bg-card); border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px); display: flex; flex-direction: column;
  height: 100%; gap: var(--spacing-lg, 12px); overflow: auto;
}

.btn-outline-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  height: 37px; padding: 8px 12px; border-radius: 8px;
  font-size: var(--font-small, 14px); font-weight: 500;
  background: var(--info-bg); color: var(--accent-primary);
  border: 1px solid var(--accent-primary); cursor: pointer;
  white-space: nowrap; transition: all .2s;
}
.btn-outline-primary:hover { background: var(--accent-primary10); }

/* ===== 页头 ===== */
.page-header {
  display: flex; align-items: center; gap: 16px;
  padding-bottom: 12px; border-bottom: 1px solid var(--border-default);
}
.page-title {
  margin: 0; font-size: var(--font-lg, 18px); font-weight: 600;
  color: var(--text-primary);
}
.enterprise-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 12px; border-radius: 6px;
  background: var(--info-bg); color: var(--accent-primary);
  font-size: var(--font-small, 14px);
}
.badge-label { color: var(--text-muted); }
.badge-name { font-weight: 500; }
.enterprise-badge.no-enterprise {
  background: var(--warning-bg); color: var(--warning);
}

/* ===== 无企业空状态 ===== */
.empty-block {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 64px 0; text-align: center;
}
.empty-title {
  font-size: var(--font-lg, 18px); font-weight: 500;
  color: var(--text-primary); margin: 0 0 8px;
}
.empty-desc {
  font-size: var(--font-small, 14px); color: var(--text-muted); margin: 0;
}

/* ===== 岗位标签 ===== */
.pos-tags {
  display: flex; flex-wrap: wrap; gap: 4px;
}
.pos-tag {
  display: inline-flex; align-items: center;
  padding: 2px 8px; border-radius: 4px;
  font-size: var(--font-xs, 12px);
  background: var(--info-bg); color: var(--accent-primary);
  white-space: nowrap;
}
.no-pos {
  color: var(--text-muted);
}

/* ===== 手机号匹配结果 ===== */
.phone-match-found {
  color: var(--success);
  font-size: var(--font-small, 14px);
}
.phone-match-new {
  color: var(--warning);
  font-size: var(--font-small, 14px);
}

/* ===== 只读信息 ===== */
.info-text {
  font-size: var(--font-small, 14px);
  color: var(--text-primary);
}

/* ===== 列宽 ===== */
.col-name { min-width: 100px; }
.col-phone { min-width: 130px; }
.col-pos { min-width: 220px; }
.col-date { min-width: 110px; }
.col-actions { width: 100px; white-space: nowrap; }

/* ===== 分页器 ===== */
:deep(.el-pagination .el-pager li) { background-color: var(--pagi-bg); color: var(--pagi-text); border: 1px solid var(--border-default); }
:deep(.el-pagination .el-pager li.is-active) { background-color: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
:deep(.el-pagination .btn-prev), :deep(.el-pagination .btn-next) { background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important; border: 1px solid var(--border-default); }
:deep(.el-pagination .btn-prev.is-disabled), :deep(.el-pagination .btn-next.is-disabled) { color: var(--text-muted) !important; background-color: var(--pagi-bg) !important; }
:deep(.el-pagination .el-select .el-select__wrapper) { background-color: var(--bg-card) !important; color: var(--text-secondary); border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) { background-color: var(--bg-card) !important; border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__inner) { color: var(--text-primary) !important; background-color: var(--bg-card); }
</style>
