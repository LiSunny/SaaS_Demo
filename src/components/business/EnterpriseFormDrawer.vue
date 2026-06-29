<template>
  <el-drawer
    :model-value="visible"
    :title="mode === 'edit' ? '编辑租户' : '新增租户'"
    size="680px"
    direction="rtl"
    :close-on-click-modal="true"
    class="enterprise-form-drawer"
    @update:model-value="$emit('update:visible', $event)"
    @closed="handleClosed"
  >
    <!-- 表单区域（可滚动） -->
    <div class="drawer-form-body">
      <!-- 企业名称 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-required">*</span>
          <span class="label-text">企业名称</span>
        </div>
        <div class="form-control">
          <el-input v-model="form.name" placeholder="请输入企业名称" maxlength="100" class="clean-input" />
        </div>
      </div>

      <!-- 负责人姓名 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-required">*</span>
          <span class="label-text">负责人姓名</span>
        </div>
        <div class="form-control">
          <el-input v-model="form.contactName" placeholder="请输入负责人姓名" maxlength="20" class="clean-input" />
        </div>
      </div>

      <!-- 负责人手机号 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-required">*</span>
          <span class="label-text">负责人手机号</span>
        </div>
        <div class="form-control">
          <el-input v-model="form.contactPhone" placeholder="请输入负责人手机号" class="clean-input" />
        </div>
      </div>

      <!-- 企业类别（维度 B） -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">消防类别</span>
        </div>
        <div class="form-control">
          <el-select v-model="form.dimB" placeholder="请选择企业类别（建议填写）" filterable clearable class="clean-select">
            <el-option v-for="o in dictB" :key="o.value" :label="`${o.value} ${o.label}`" :value="o.value" />
          </el-select>
        </div>
      </div>

      <!-- 行业分类（维度 C） -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">行业分类</span>
        </div>
        <div class="form-control">
          <el-select v-model="form.dimC" placeholder="请选择企业所在行业分类" filterable clearable class="clean-select">
            <el-option v-for="o in dictC" :key="o.value" :label="`${o.value} ${o.label}`" :value="o.value" />
          </el-select>
        </div>
      </div>

      <!-- 场所类型（维度 D） -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">场所类型</span>
        </div>
        <div class="form-control">
          <el-select v-model="form.dimD" placeholder="请选择场所类型（建议填写）" filterable clearable class="clean-select">
            <el-option v-for="o in dictD" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </div>
      </div>

      <!-- 企业标签 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">企业标签</span>
        </div>
        <div class="form-control">
          <el-select v-model="form.tags" placeholder="请选择企业标签" multiple filterable allow-create default-first-option class="clean-select" />
        </div>
      </div>

      <!-- 授权期限 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">授权期限</span>
        </div>
        <div class="form-control">
          <el-date-picker v-model="form.validRange" type="datetimerange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD HH:mm:ss" class="clean-datepicker" />
        </div>
      </div>

      <!-- 行政区划 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">行政区划</span>
        </div>
        <div class="form-control">
          <el-cascader v-model="form.regionArr" :options="regionOptions" placeholder="请选择行政区划" clearable class="clean-cascader" />
        </div>
      </div>

      <!-- 详细地址 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">详细地址</span>
        </div>
        <div class="form-control">
          <el-input v-model="form.address" placeholder="请录入详细地址" maxlength="200" class="clean-input" />
        </div>
      </div>

      <!-- Gis标注 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">Gis标注</span>
        </div>
        <div class="form-control form-control-group">
          <el-input :model-value="gisAddress || form.mapLocation" placeholder="请在地图上标注企业位置" readonly class="clean-input flex-1" />
          <button type="button" class="locate-btn" @click="handleLocate">
            <el-icon :size="20"><MapLocation /></el-icon>
            <span>标注位置</span>
          </button>
        </div>
      </div>

      <!-- 上级企业 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">上级企业</span>
        </div>
        <div class="form-control">
          <el-select v-model="form.parentId" placeholder="输入企业名称模糊搜索" clearable filterable remote :remote-method="searchParent" :loading="parentLoading" class="clean-select">
            <el-option v-for="p in parentOptions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </div>
      </div>

      <!-- 备注信息 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">备注信息</span>
        </div>
        <div class="form-control">
          <el-input v-model="form.remark" placeholder="请录入备注信息" maxlength="500" class="clean-input" />
        </div>
      </div>

      <!-- 企业 Logo -->
      <div class="form-row form-row-top">
        <div class="form-label">
          <span class="label-text">企业Logo</span>
        </div>
        <div class="form-control">
          <el-upload action="#" :auto-upload="false" :show-file-list="false" accept="image/jpeg,image/png">
            <div class="logo-upload-box">
              <el-icon :size="34" color="#D9D9D9"><UploadFilled /></el-icon>
              <span class="logo-upload-text">上传图片</span>
            </div>
          </el-upload>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="drawer-footer">
      <button type="button" class="btn-cancel" @click="handleCancel">
        <el-icon :size="20"><CircleCloseFilled /></el-icon>
        <span>取消</span>
      </button>
      <button type="button" class="btn-save" :disabled="submitting" @click="handleSave">
        {{ submitting ? '保存中...' : '保存' }}
      </button>
    </div>

    <!-- GIS 地图标点组件 -->
    <GisMapPicker
      v-model:visible="gisPickerVisible"
      v-model:location="form.mapLocation"
      v-model:address="gisAddress"
      @confirm="handleGisConfirm"
    />
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useConfirm } from '@/composables/useConfirm'
import { MapLocation, UploadFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { useEnterpriseStore } from '@/stores/enterprise'
import type { EnterpriseItem } from '@/types/enterprise'
import GisMapPicker from './GisMapPicker.vue'

const { confirmLeave, showSuccessAlert } = useConfirm()

// ===== Props & Emits =====
const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  editId?: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'saved': []
}>()

// ===== Store =====
const store = useEnterpriseStore()
const submitting = ref(false)

// ===== GIS 标点 =====
const gisPickerVisible = ref(false)
const gisAddress = ref('')

function handleLocate() {
  gisPickerVisible.value = true
}

// GisMapPicker 确认标注：同步经度、纬度、地址到表单
function handleGisConfirm(payload: { location: string; address: string; lng: number; lat: number }) {
  form.mapLocation = payload.location
  form.mapLng = payload.lng
  form.mapLat = payload.lat
  form.mapAddress = payload.address
  gisAddress.value = payload.address
}

// ===== 表单 =====
const form = reactive({
  name: '',
  contactName: '',
  contactPhone: '',
  tags: [] as string[],
  validRange: [] as string[],
  regionArr: [] as string[],
  parentId: '',
  address: '',
  remark: '',
  logo: '',
  mapLocation: '',
  mapLng: '' as number | string,
  mapLat: '' as number | string,
  mapAddress: '',
  dimB: '',
  dimC: '',
  dimD: '',
})

// ===== 表单校验 =====
function validateForm(): boolean {
  if (!form.name.trim()) { ElMessage.warning('请输入企业名称'); return false }
  if (!form.contactName.trim()) { ElMessage.warning('请输入负责人姓名'); return false }
  if (!form.contactPhone.trim()) { ElMessage.warning('请输入负责人手机号'); return false }
  if (!/^1[3-9]\d{9}$/.test(form.contactPhone.trim())) { ElMessage.warning('请输入正确的手机号'); return false }
  return true
}

// ===== 上级企业搜索 =====
const parentOptions = ref<EnterpriseItem[]>([])
const parentLoading = ref(false)
async function searchParent(kw: string) {
  if (!kw) { parentOptions.value = []; return }
  parentLoading.value = true
  try {
    parentOptions.value = await store.searchEnterprisesRemote(kw)
  } finally {
    parentLoading.value = false
  }
}

// ===== 字典 =====
const dictB = ref<{ value: string; label: string }[]>([])
const dictC = ref<{ value: string; label: string }[]>([])
const dictD = ref<{ value: string; label: string }[]>([])

const regionOptions = [
  {
    value: '北京市', label: '北京市',
    children: [{ value: '朝阳区', label: '朝阳区' }, { value: '海淀区', label: '海淀区' }],
  },
  {
    value: '广西壮族自治区', label: '广西壮族自治区',
    children: [{
      value: '贵港市', label: '贵港市',
      children: [{ value: '港南区', label: '港南区' }],
    }],
  },
]

// ===== 操作 =====
async function handleSave() {
  if (!validateForm()) return

  submitting.value = true
  try {
    const [validFrom, validTo] = form.validRange
    // 显式列出提交字段：经纬度使用 mapLng / mapLat 独立字段，不传 mapLocation 合并字段
    const data: any = {
      name: form.name,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      tags: form.tags,
      validFrom: validFrom || '',
      validTo: validTo || '',
      region: form.regionArr.join(' '),
      parentId: form.parentId,
      address: form.address,
      remark: form.remark,
      logo: form.logo,
      dimB: form.dimB,
      dimC: form.dimC,
      dimD: form.dimD,
      // GIS 地图标注：经度、纬度、逆地理地址（三个独立字段）
      mapLng: form.mapLng,
      mapLat: form.mapLat,
      mapAddress: form.mapAddress,
    }
    if (props.mode === 'edit' && props.editId) {
      await store.handleUpdate(props.editId, data)
    } else {
      const item = await store.handleCreate(data)
      // 新建企业时展示管理员账号信息
      if ((item as any)?.adminAccount?.isNewUser) {
        await showSuccessAlert(
          `企业「${item.name}」创建成功！\n\n已自动为企业负责人创建管理员账号：\n手机号：${(item as any).adminAccount.phone}\n初始密码：${(item as any).adminAccount.initialPassword}\n\n请妥善保管并交付给企业管理员，首次登录需修改密码。`,
          '管理员账号已创建',
        )
      }
    }
    emit('saved')
    emit('update:visible', false)
  } finally {
    submitting.value = false
  }
}

async function handleCancel() {
  try {
    await confirmLeave()
    emit('update:visible', false)
  } catch { /* stay */ }
}

// ===== 重置 =====
function resetForm() {
  Object.assign(form, {
    name: '', contactName: '', contactPhone: '',
    tags: [], validRange: [], regionArr: [],
    parentId: '', address: '', remark: '', logo: '', mapLocation: '',
    mapLng: '', mapLat: '', mapAddress: '',
    dimB: '', dimC: '', dimD: '',
  })
  gisAddress.value = ''
}

function handleClosed() {
  resetForm()
}

// ===== 编辑回填 =====
watch(() => props.visible, async (v) => {
  if (!v) return
  await store.fetchDicts()
  dictB.value = store.dictB
  dictC.value = store.dictC
  dictD.value = store.dictD

  if (props.mode === 'edit' && props.editId) {
    await store.fetchDetail(props.editId)
    const d = store.detail
    if (d) {
      Object.assign(form, {
        name: d.name, contactName: d.contactName, contactPhone: d.contactPhone,
        tags: d.tags || [],
        validRange: [d.validFrom, d.validTo].filter(Boolean),
        regionArr: d.region ? d.region.split(' ') : [],
        parentId: d.parentId || '',
        address: d.address || '', remark: d.remark || '', logo: d.logo || '',
        mapLocation: d.mapLocation || '',
        mapLng: d.mapLng ?? (d.mapLocation ? parseFloat(d.mapLocation.split(',')[0]) || '' : ''),
        mapLat: d.mapLat ?? (d.mapLocation ? parseFloat(d.mapLocation.split(',')[1]) || '' : ''),
        mapAddress: d.mapAddress || '',
        dimB: d.dimB || '',
        dimC: d.dimC?.code || d.dimC || '',
        dimD: d.dimD || '',
      })
      // 编辑回填 GIS 地址显示
      gisAddress.value = d.mapAddress || d.mapLocation || ''
    }
  }
})
</script>

<style scoped>
/* ===== Drawer body 布局 ===== */
:deep(.el-drawer__header) {
  margin-bottom: 0 !important;
  padding: 28px 28px 18px !important;
  border-bottom: 1px solid var(--border-default, #E9E9E9);
}

.drawer-form-body {
  flex: 1; min-height: 0; overflow-y: auto;
  display: flex; flex-direction: column; gap: 18px; padding-bottom: 8px;
}

.form-row { display: flex; align-items: center; gap: 16px; min-height: 36px; }
.form-row-top { align-items: flex-start; }

.form-label {
  display: flex; align-items: center; gap: 8px;
  flex-shrink: 0; width: 110px; justify-content: flex-end;
}
.label-required { font-size: 18px; font-weight: 500; color: var(--semantic-danger, #DC2626); line-height: 1; flex-shrink: 0; }
.label-text { font-size: var(--font-body, 16px); font-weight: 400; color: var(--text-tertiary, #454545); white-space: nowrap; line-height: 1; }

.form-control { flex: 1; min-width: 0; }
.form-control-group { display: flex; gap: 10px; align-items: center; }
.flex-1 { flex: 1; min-width: 0; }

.clean-input, .clean-select, .clean-cascader, .clean-datepicker { width: 100% !important; }

.clean-input :deep(.el-input__wrapper),
.clean-select :deep(.el-select__wrapper) {
  min-height: 36px; height: 36px; border: 1px solid #DEDEDE; border-radius: 8px;
  box-shadow: none; background: var(--bg-card, #fff); padding: 0 18px;
  display: flex; align-items: center; box-sizing: border-box;
}
.clean-input :deep(.el-input__wrapper:hover),
.clean-select :deep(.el-select__wrapper:hover) { border-color: var(--accent-primary, #3678E3); }
.clean-input :deep(.el-input__wrapper.is-focus),
.clean-select :deep(.el-select__wrapper.is-focus) { border-color: var(--accent-primary, #3678E3); box-shadow: none; }

.clean-input :deep(.el-input__inner),
.clean-select :deep(.el-input__inner),
.clean-select :deep(.el-select__input),
.clean-cascader :deep(.el-input__inner),
.clean-cascader :deep(.el-cascader__search-input),
.clean-datepicker :deep(.el-input__inner),
.clean-datepicker :deep(.el-range-input) {
  font-size: var(--font-small, 14px); color: var(--text-primary, #101010); line-height: 36px; height: auto;
}

.clean-input :deep(.el-input__inner::placeholder),
.clean-select :deep(.el-select__placeholder),
.clean-select :deep(.el-select__input::placeholder),
.clean-cascader :deep(.el-input__inner::placeholder),
.clean-cascader :deep(.el-cascader__search-input::placeholder),
.clean-datepicker :deep(.el-input__inner::placeholder),
.clean-datepicker :deep(.el-range-input::placeholder) {
  color: var(--text-placeholder, #D9D9D9); font-size: var(--font-small, 14px);
}

.clean-select :deep(.el-select__suffix),
.clean-cascader :deep(.el-cascader__suffix) { color: var(--text-muted, #5E5E5E); }
.clean-select :deep(.el-select__selected-item) { color: var(--text-primary, #101010); }
.clean-cascader :deep(.el-tag) { font-size: var(--font-small, 14px); color: var(--text-primary, #101010); }

.locate-btn {
  display: inline-flex; align-items: center; gap: 10px; padding: 8px 12px; height: 36px;
  border: none; border-radius: 8px; background: var(--bg-card, #fff);
  color: var(--text-secondary, #2E2E2E); font-size: var(--font-small, 14px); font-weight: 500;
  font-family: inherit; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: background 0.15s;
}
.locate-btn:hover { background: var(--bg-sub-card, #FBFBFB); }

.logo-upload-box {
  width: 118px; height: 118px; border: 1px solid #DEDEDE; border-radius: 8px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  cursor: pointer; transition: border-color 0.2s;
}
.logo-upload-box:hover { border-color: var(--accent-primary, #3678E3); }
.logo-upload-text { font-size: var(--font-body, 16px); font-weight: 500; color: var(--text-placeholder, #D9D9D9); }

.drawer-footer {
  display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0;
  padding: 12px 0 0; border-top: 1px solid var(--border-default, #E9E9E9); margin-top: auto;
}

.btn-cancel {
  display: inline-flex; align-items: center; gap: 10px; padding: 8px 12px; height: 37px;
  border: 1px solid rgba(220, 38, 38, 0.2); border-radius: 8px; background: rgba(220, 38, 38, 0.1);
  color: var(--semantic-danger, #DC2626); font-size: var(--font-small, 14px); font-weight: 500;
  font-family: inherit; cursor: pointer; white-space: nowrap; transition: opacity 0.15s;
}
.btn-cancel:hover { opacity: 0.8; }

.btn-save {
  display: inline-flex; align-items: center; justify-content: center; padding: 8px 12px;
  width: 107px; height: 37px; border: none; border-radius: 8px;
  background: var(--semantic-info, #3678E3); color: #fff;
  font-size: var(--font-small, 14px); font-weight: 500; font-family: inherit;
  cursor: pointer; white-space: nowrap; transition: opacity 0.15s;
}
.btn-save:hover { opacity: 0.85; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
</style>

<style>
.enterprise-form-drawer .el-drawer__body {
  display: flex !important; flex-direction: column; overflow: hidden !important;
  padding: 18px 28px !important; height: 100%; box-sizing: border-box;
}

.clean-cascader {
  min-height: 36px; height: 36px; width: 100% !important;
  border: 1px solid #DEDEDE; border-radius: 8px; box-shadow: none;
  background: var(--bg-card, #fff); padding: 0 18px;
  display: flex; align-items: center; box-sizing: border-box; transition: border-color 0.2s;
}
.clean-cascader:hover { border-color: #3678E3; }
.clean-cascader.is-focus { border-color: #3678E3; box-shadow: none; }
.clean-cascader .el-input__wrapper {
  box-shadow: none !important; background: transparent; border: none; padding: 0; height: auto; border-radius: 0;
}
.clean-cascader .el-input__inner { font-size: 14px; color: var(--text-primary, #101010); }
.clean-cascader .el-input__inner::placeholder { color: #D9D9D9; font-size: 14px; }

.clean-datepicker.el-date-editor.el-input__wrapper {
  min-height: 36px; height: 36px; width: 100% !important;
  border: 1px solid #DEDEDE; border-radius: 8px; box-shadow: none !important;
  background: var(--bg-card, #fff); padding: 0 18px;
  display: flex; align-items: center; box-sizing: border-box;
}
.clean-datepicker.el-date-editor.el-input__wrapper:hover { border-color: #3678E3; box-shadow: none !important; }
.clean-datepicker.el-date-editor.el-input__wrapper.is-active { border-color: #3678E3; box-shadow: none !important; }
.clean-datepicker .el-range-input { font-size: 14px; color: var(--text-primary, #101010); }
.clean-datepicker .el-range-input::placeholder { color: #D9D9D9; font-size: 14px; }
.clean-datepicker .el-range-separator { font-size: 14px; color: var(--text-primary, #101010); }

.clean-select .el-select__placeholder.is-transparent { color: #D9D9D9 !important; font-size: 14px; }
.clean-select .el-select__selected-item:not(.is-transparent) { color: var(--text-primary, #101010); font-size: 14px; }
.clean-select .el-select__input { font-size: 14px; color: var(--text-primary, #101010); }
</style>
