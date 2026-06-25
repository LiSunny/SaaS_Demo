<template>
  <el-drawer
    :model-value="visible"
    :title="mode === 'edit' ? '编辑租户' : '新增租户'"
    size="680px"
    direction="rtl"
    :close-on-click-modal="false"
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
          <el-input
            v-model="form.name"
            placeholder="请输入企业名称"
            maxlength="100"
            class="clean-input"
          />
        </div>
      </div>

      <!-- 负责人姓名 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-required">*</span>
          <span class="label-text">负责人姓名</span>
        </div>
        <div class="form-control">
          <el-input
            v-model="form.contactName"
            placeholder="请输入负责人姓名"
            maxlength="20"
            class="clean-input"
          />
        </div>
      </div>

      <!-- 负责人手机号 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-required">*</span>
          <span class="label-text">负责人手机号</span>
        </div>
        <div class="form-control">
          <el-input
            v-model="form.contactPhone"
            placeholder="请输入负责人手机号"
            class="clean-input"
          />
        </div>
      </div>

      <!-- 管理角色（维度 A） -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-required">*</span>
          <span class="label-text">管理角色</span>
          <el-popover
            placement="right-start"
            :width="419"
            trigger="hover"
            :show-after="200"
            :hide-after="200"
            popper-class="role-help-popover"
          >
            <template #reference>
              <el-icon class="label-help-icon"><QuestionFilled /></el-icon>
            </template>
            <div class="role-help-content">
              <p class="role-help-summary">定义企业在平台中的管理角色层级</p>
              <div class="role-help-list">
                <div class="role-help-item">
                  <p class="role-help-role">监管方</p>
                  <p class="role-help-desc">消防救援机构/应急管理部门/属地政府（街道/社区等）/行业主管部门</p>
                </div>
                <div class="role-help-item">
                  <p class="role-help-role">管理方</p>
                  <p class="role-help-desc">空间管理方（物业/园区/市场/综合体/商业街等）</p>
                  <p class="role-help-desc">集团管理方</p>
                </div>
                <div class="role-help-item">
                  <p class="role-help-role">社会单位</p>
                  <p class="role-help-desc">落实消防安全主体责任企业</p>
                </div>
                <div class="role-help-item">
                  <p class="role-help-role">服务单位</p>
                  <p class="role-help-desc">消防技术服务机构（维保、检测、评估、工程安装等）</p>
                </div>
                <div class="role-help-item">
                  <p class="role-help-role">平台运营方</p>
                  <p class="role-help-desc">运营管理方</p>
                </div>
              </div>
            </div>
          </el-popover>
        </div>
        <div class="form-control">
          <el-cascader
            v-model="dimACascader"
            :options="dimACascaderOptions"
            :props="{ expandTrigger: 'hover' }"
            placeholder="请选择企业所在管理场景角色"
            clearable
            filterable
            class="clean-cascader"
          />
        </div>
      </div>

      <!-- 企业类别（维度 B） — 仅社会单位显示 -->
      <div v-if="showFireAttrs" class="form-row">
        <div class="form-label">
          <span class="label-required">*</span>
          <span class="label-text">企业类别</span>
        </div>
        <div class="form-control">
          <el-select
            v-model="form.dimB"
            placeholder="请选择企业类别"
            filterable
            class="clean-select"
          >
            <el-option
              v-for="o in dictB"
              :key="o.value"
              :label="`${o.value} ${o.label}`"
              :value="o.value"
            />
          </el-select>
        </div>
      </div>

      <!-- 行业分类（维度 C） -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">行业分类</span>
        </div>
        <div class="form-control">
          <el-select
            v-model="form.dimC"
            placeholder="请选择企业所在行业分类"
            filterable
            class="clean-select"
          >
            <el-option
              v-for="o in dictC"
              :key="o.value"
              :label="`${o.value} ${o.label}`"
              :value="o.value"
            />
          </el-select>
        </div>
      </div>

      <!-- 企业标签 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">企业标签</span>
        </div>
        <div class="form-control">
          <el-select
            v-model="form.tags"
            placeholder="请选择企业标签"
            multiple
            filterable
            allow-create
            default-first-option
            class="clean-select"
          />
        </div>
      </div>

      <!-- 授权期限 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">授权期限</span>
        </div>
        <div class="form-control">
          <el-date-picker
            v-model="form.validRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="clean-datepicker"
          />
        </div>
      </div>

      <!-- 行政区划 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">行政区划</span>
        </div>
        <div class="form-control">
          <el-cascader
            v-model="form.regionArr"
            :options="regionOptions"
            placeholder="请选择行政区划"
            clearable
            class="clean-cascader"
          />
        </div>
      </div>

      <!-- 详细地址 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">详细地址</span>
        </div>
        <div class="form-control">
          <el-input
            v-model="form.address"
            placeholder="请录入详细地址"
            maxlength="200"
            class="clean-input"
          />
        </div>
      </div>

      <!-- Gis标注 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">Gis标注</span>
        </div>
        <div class="form-control form-control-group">
          <el-input
            v-model="form.mapLocation"
            placeholder="请在地图上标注企业位置"
            class="clean-input flex-1"
          />
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
          <el-select
            v-model="form.parentId"
            placeholder="输入企业名称模糊搜索"
            clearable
            filterable
            remote
            :remote-method="searchParent"
            :loading="parentLoading"
            class="clean-select"
          >
            <el-option
              v-for="p in parentOptions"
              :key="p.id"
              :label="p.name"
              :value="p.id"
            />
          </el-select>
        </div>
      </div>

      <!-- 备注信息 -->
      <div class="form-row">
        <div class="form-label">
          <span class="label-text">备注信息</span>
        </div>
        <div class="form-control">
          <el-input
            v-model="form.remark"
            placeholder="请录入备注信息"
            maxlength="500"
            class="clean-input"
          />
        </div>
      </div>

      <!-- 企业 Logo -->
      <div class="form-row form-row-top">
        <div class="form-label">
          <span class="label-text">企业Logo</span>
        </div>
        <div class="form-control">
          <el-upload
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            accept="image/jpeg,image/png"
          >
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
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { QuestionFilled, MapLocation, UploadFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { useEnterpriseStore } from '@/stores/enterprise'
import type { EnterpriseItem, DimALevel1, DimALevel2, DimALevel3 } from '@/types/enterprise'

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
  dimA: { level1: '' as DimALevel1 | '', level2: '' as DimALevel2 | '', level3: '' as DimALevel3 | '' },
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

// ===== 维度 A 级联选择 =====
const dimACascader = ref<string[]>([])

const dimACascaderOptions = [
  {
    value: 'supervisor', label: '监管方',
    children: [
      { value: 'fire_rescue', label: '消防救援机构' },
      { value: 'emergency_mgmt', label: '应急管理部门' },
      { value: 'local_gov', label: '属地政府' },
      { value: 'industry_supervisor', label: '行业主管部门' },
    ],
  },
  {
    value: 'manager', label: '管理方',
    children: [
      {
        value: 'space_manager', label: '空间管理方',
        children: [
          { value: 'property_mgr', label: '物业管理方' },
          { value: 'park_mgr', label: '园区管理方' },
          { value: 'market_mgr', label: '市场管理方' },
          { value: 'complex_mgr', label: '综合体管理方' },
          { value: 'commercial_street_mgr', label: '商业街管理方' },
        ],
      },
      { value: 'group_manager', label: '集团管理方' },
    ],
  },
  { value: 'social_unit', label: '社会单位' },
  {
    value: 'service_unit', label: '服务单位',
    children: [{ value: 'fire_tech_service', label: '消防技术服务机构' }],
  },
  { value: 'platform_operator', label: '平台运营方' },
]

watch(dimACascader, (val) => {
  if (!val || val.length === 0) {
    form.dimA = { level1: '' as DimALevel1 | '', level2: '' as DimALevel2 | '', level3: '' as DimALevel3 | '' }
    form.dimB = ''
    form.dimD = ''
    return
  }
  form.dimA.level1 = (val[0] || '') as DimALevel1 | ''
  form.dimA.level2 = (val[1] || '') as DimALevel2 | ''
  form.dimA.level3 = (val[2] || '') as DimALevel3 | ''
  if (val[0] !== 'social_unit') {
    form.dimB = ''
    form.dimD = ''
  }
}, { deep: true })

const showFireAttrs = computed(() => dimACascader.value[0] === 'social_unit')

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
  if (!dimACascader.value || dimACascader.value.length === 0) {
    ElMessage.warning('请选择管理角色')
    return
  }
  if (showFireAttrs.value && !form.dimB) {
    ElMessage.warning('社会单位必须选择企业类别')
    return
  }

  if (!validateForm()) return

  submitting.value = true
  try {
    const [validFrom, validTo] = form.validRange
    const data: any = {
      ...form,
      validFrom: validFrom || '',
      validTo: validTo || '',
      region: form.regionArr.join(' '),
      dimB: form.dimB, dimC: form.dimC, dimD: form.dimD,
    }
    if (props.mode === 'edit' && props.editId) {
      await store.handleUpdate(props.editId, data)
    } else {
      await store.handleCreate(data)
    }
    emit('saved')
    emit('update:visible', false)
  } finally {
    submitting.value = false
  }
}

async function handleCancel() {
  try {
    await ElMessageBox.confirm('放弃已填写的内容？', '提示', { type: 'warning' })
    emit('update:visible', false)
  } catch { /* stay */ }
}

function handleLocate() {
  ElMessage.info('地图选点功能（开发中）')
}

// ===== 重置 =====
function resetForm() {
  dimACascader.value = []
  Object.assign(form, {
    name: '', contactName: '', contactPhone: '',
    tags: [], validRange: [], regionArr: [],
    parentId: '', address: '', remark: '', logo: '', mapLocation: '',
    dimA: { level1: '' as DimALevel1 | '', level2: '' as DimALevel2 | '', level3: '' as DimALevel3 | '' },
    dimB: '', dimC: '', dimD: '',
  })
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
        mapLocation: '',
        dimA: { ...d.dimA },
        dimB: d.dimB || '',
        dimC: d.dimC?.code || d.dimC || '',
        dimD: d.dimD || '',
      })
      const cascaderVal: string[] = [d.dimA.level1]
      if (d.dimA.level2) cascaderVal.push(d.dimA.level2)
      if (d.dimA.level3) cascaderVal.push(d.dimA.level3)
      dimACascader.value = cascaderVal
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

/* ===== 表单主体（可滚动） ===== */
.drawer-form-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-bottom: 8px;
}

/* ===== 表单行 ===== */
.form-row {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 36px;
}
.form-row-top {
  align-items: flex-start;
}

/* ===== 表单标签区 ===== */
.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  width: 110px;
  justify-content: flex-end;
}

.label-required {
  font-size: 18px;
  font-weight: 500;
  color: var(--semantic-danger, #DC2626);
  line-height: 1;
  flex-shrink: 0;
}

.label-text {
  font-size: var(--font-body, 16px);
  font-weight: 400;
  color: var(--text-tertiary, #454545);
  white-space: nowrap;
  line-height: 1;
}

.label-help-icon {
  font-size: 16px;
  color: var(--text-muted, #5E5E5E);
  cursor: pointer;
  transition: color 0.2s;
  flex-shrink: 0;
}
.label-help-icon:hover {
  color: var(--accent-primary, #3678E3);
}

/* ===== 表单控件区 ===== */
.form-control {
  flex: 1;
  min-width: 0;
}

.form-control-group {
  display: flex;
  gap: 10px;
  align-items: center;
}
.flex-1 {
  flex: 1;
  min-width: 0;
}

/* ===== 统一控件外观 ===== */

/* 所有控件占满父容器宽度 */
.clean-input,
.clean-select,
.clean-cascader,
.clean-datepicker {
  width: 100% !important;
}

/* ── input / select：子级 wrapper 负责外观 ── */
.clean-input :deep(.el-input__wrapper),
.clean-select :deep(.el-select__wrapper) {
  min-height: 36px;
  height: 36px;
  border: 1px solid #DEDEDE;
  border-radius: 8px;
  box-shadow: none;
  background: var(--bg-card, #fff);
  padding: 0 18px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}
.clean-input :deep(.el-input__wrapper:hover),
.clean-select :deep(.el-select__wrapper:hover) {
  border-color: var(--accent-primary, #3678E3);
}
.clean-input :deep(.el-input__wrapper.is-focus),
.clean-select :deep(.el-select__wrapper.is-focus) {
  border-color: var(--accent-primary, #3678E3);
  box-shadow: none;
}

/* ── 内部文字统一：已选值 & placeholder（14px 与列表页一致）─── */
.clean-input :deep(.el-input__inner),
.clean-select :deep(.el-input__inner),
.clean-select :deep(.el-select__input),
.clean-cascader :deep(.el-input__inner),
.clean-cascader :deep(.el-cascader__search-input),
.clean-datepicker :deep(.el-input__inner),
.clean-datepicker :deep(.el-range-input) {
  font-size: var(--font-small, 14px);
  color: var(--text-primary, #101010);
  line-height: 36px;
  height: auto;
}

/* placeholder 浅色 */
.clean-input :deep(.el-input__inner::placeholder),
.clean-select :deep(.el-select__placeholder),
.clean-select :deep(.el-select__input::placeholder),
.clean-cascader :deep(.el-input__inner::placeholder),
.clean-cascader :deep(.el-cascader__search-input::placeholder),
.clean-datepicker :deep(.el-input__inner::placeholder),
.clean-datepicker :deep(.el-range-input::placeholder) {
  color: var(--text-placeholder, #D9D9D9);
  font-size: var(--font-small, 14px);
}

/* 下拉箭头 */
.clean-select :deep(.el-select__suffix),
.clean-cascader :deep(.el-cascader__suffix) {
  color: var(--text-muted, #5E5E5E);
}

/* 选中值 */
.clean-select :deep(.el-select__selected-item) {
  color: var(--text-primary, #101010);
}
.clean-cascader :deep(.el-tag) {
  font-size: var(--font-small, 14px);
  color: var(--text-primary, #101010);
}
/* ===== Gis 标注按钮 ===== */
.locate-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: var(--bg-card, #fff);
  color: var(--text-secondary, #2E2E2E);
  font-size: var(--font-small, 14px);
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.15s;
}
.locate-btn:hover {
  background: var(--bg-sub-card, #FBFBFB);
}

/* ===== Logo 上传框 ===== */
.logo-upload-box {
  width: 118px;
  height: 118px;
  border: 1px solid #DEDEDE;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.logo-upload-box:hover {
  border-color: var(--accent-primary, #3678E3);
}
.logo-upload-text {
  font-size: var(--font-body, 16px);
  font-weight: 500;
  color: var(--text-placeholder, #D9D9D9);
}

/* ===== 底部操作栏 ===== */
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
  padding: 12px 0 0;
  border-top: 1px solid var(--border-default, #E9E9E9);
  margin-top: auto;
}

/* 取消按钮 — Figma Danger 描边风格 */
.btn-cancel {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  height: 37px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.1);
  color: var(--semantic-danger, #DC2626);
  font-size: var(--font-small, 14px);
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
}
.btn-cancel:hover {
  opacity: 0.8;
}

/* 保存按钮 — Figma Primary 实心风格 */
.btn-save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  width: 107px;
  height: 37px;
  border: none;
  border-radius: 8px;
  background: var(--semantic-info, #3678E3);
  color: #fff;
  font-size: var(--font-small, 14px);
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
}
.btn-save:hover {
  opacity: 0.85;
}
.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== 管理角色说明 Popover ===== */
.role-help-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.role-help-summary {
  font-size: var(--font-small, 14px);
  font-weight: 400;
  color: var(--text-tertiary, #454545);
  margin: 0 0 8px;
  line-height: 1.5;
}

.role-help-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.role-help-item {
  padding: 4px 0;
  line-height: 1.6;
}

.role-help-role {
  font-size: var(--font-small, 14px);
  font-weight: 500;
  color: var(--text-secondary, #2E2E2E);
  margin: 0 0 2px;
}

.role-help-desc {
  font-size: var(--font-small, 14px);
  font-weight: 400;
  color: var(--text-tertiary, #454545);
  margin: 0;
}
</style>

<style>
/* ── el-drawer body 布局：EP 渲染层级不带 scoped data-v，必须非 scoped ── */
.enterprise-form-drawer .el-drawer__body {
  display: flex !important;
  flex-direction: column;
  overflow: hidden !important;
  padding: 18px 28px !important;
  height: 100%;
  box-sizing: border-box;
}

/* Popover 渲染在 body 层，非 scoped */
.role-help-popover {
  padding: 16px 18px !important;
  border-radius: 8px !important;
  box-shadow: 0 0 1px rgba(0,0,0,0.25) !important;
}

/* ── cascader：Element Plus 根元素不带 scoped data-v，必须非 scoped ── */
.clean-cascader {
  min-height: 36px;
  height: 36px;
  width: 100% !important;
  border: 1px solid #DEDEDE;
  border-radius: 8px;
  box-shadow: none;
  background: var(--bg-card, #fff);
  padding: 0 18px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.clean-cascader:hover { border-color: #3678E3; }
.clean-cascader.is-focus { border-color: #3678E3; box-shadow: none; }
/* cascader 内部 wrapper 透明化（边框由根提供，避免双层边框）*/
.clean-cascader .el-input__wrapper {
  box-shadow: none !important;
  background: transparent;
  border: none;
  padding: 0;
  height: auto;
  border-radius: 0;
}
/* cascader 内部文字 */
.clean-cascader .el-input__inner {
  font-size: 14px;
  color: var(--text-primary, #101010);
}
.clean-cascader .el-input__inner::placeholder {
  color: #D9D9D9;
  font-size: 14px;
}

/* ── datepicker：提高选择器特异性覆盖 EP box-shadow ── */
.clean-datepicker.el-date-editor.el-input__wrapper {
  min-height: 36px;
  height: 36px;
  width: 100% !important;
  border: 1px solid #DEDEDE;
  border-radius: 8px;
  box-shadow: none !important;
  background: var(--bg-card, #fff);
  padding: 0 18px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}
.clean-datepicker.el-date-editor.el-input__wrapper:hover {
  border-color: #3678E3;
  box-shadow: none !important;
}
.clean-datepicker.el-date-editor.el-input__wrapper.is-active {
  border-color: #3678E3;
  box-shadow: none !important;
}
/* datepicker 内部文字 */
.clean-datepicker .el-range-input {
  font-size: 14px;
  color: var(--text-primary, #101010);
}
.clean-datepicker .el-range-input::placeholder {
  color: #D9D9D9;
  font-size: 14px;
}
.clean-datepicker .el-range-separator {
  font-size: 14px;
  color: var(--text-primary, #101010);
}

/* ── select：placeholder 用 .is-transparent 区分有无值 ── */
.clean-select .el-select__placeholder.is-transparent {
  color: #D9D9D9 !important;
  font-size: 14px;
}
.clean-select .el-select__selected-item:not(.is-transparent) {
  color: var(--text-primary, #101010);
  font-size: 14px;
}
.clean-select .el-select__input {
  font-size: 14px;
  color: var(--text-primary, #101010);
}
</style>
