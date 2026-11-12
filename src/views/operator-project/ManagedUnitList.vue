<template>
  <div class="list-page">
    <div class="content-card">

      <!-- ===== 筛选栏 ===== -->
      <div class="filter-bar">
        <div class="filter-left">
          <div class="search-input-wrap">
            <input
              v-model="form.keyword"
              class="fi-input"
              :placeholder="cfg.keywordPlaceholder"
              @keyup.enter="doSearch"
            />
            <button v-if="form.keyword" class="fi-clear" @click="clearKeyword">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>

          <div class="fi-select-wrap">
            <el-select v-model="form.region" placeholder="所属区域" clearable>
              <el-option v-for="r in regionOptions" :key="r" :label="r" :value="r" />
            </el-select>
          </div>

          <button class="btn-primary" @click="doSearch">查询</button>
        </div>

        <div class="filter-right">
          <button class="btn-add" @click="openCreate">
            <AppIcon name="plus" class="btn-add-icon" />{{ cfg.addLabel }}
          </button>
        </div>
      </div>

      <!-- ===== 数据表格 ===== -->
      <div class="table-wrap">
        <table class="fi-table">
          <thead>
            <tr class="fi-thead-tr">
              <th v-for="col in columns" :key="col.key" class="fi-th" :class="col.cls">
                <span>{{ col.label }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pageRows" :key="row.id" class="fi-tbody-tr">
              <td v-for="col in columns" :key="col.key" class="fi-td" :class="col.cls">
                <template v-if="col.key === 'name'">
                  <span class="cell-ellipsis" :title="row.name">{{ row.name }}</span>
                  <span v-if="kind === 'family' && row.contact" class="cell-sub">户主：{{ row.contact }}</span>
                </template>
                <template v-else-if="col.key === 'nature'">
                  <span class="unit-tag" :class="natureTagClass(row.nature)">{{ row.nature }}</span>
                </template>
                <template v-else-if="col.key === 'venueType'">
                  <span class="unit-tag venue">{{ row.venueType || '—' }}</span>
                </template>
                <template v-else-if="col.key === 'region'">{{ row.region || '—' }}</template>
                <template v-else-if="col.key === 'address'">
                  <span class="cell-ellipsis" :title="row.address">{{ row.address || '—' }}</span>
                </template>
                <template v-else-if="col.key === 'contact'">{{ row.contact || '—' }}</template>
                <template v-else-if="col.key === 'phone'">{{ row.phone || '—' }}</template>
                <template v-else-if="col.key === 'projectCount'">{{ projectNames(row).length }} 个</template>
                <template v-else-if="col.key === 'projects'">
                  <span class="cell-ellipsis" :title="projectsText(row)">{{ projectsText(row) || '—' }}</span>
                </template>
                <template v-else-if="col.key === 'devices'">{{ deviceCount(row) }} 台</template>
                <template v-else-if="col.key === 'actions'">
                  <div class="action-cell">
                    <button class="act-btn act-preview" title="查看详情" @click="openDetail(row)">
                      <AppIcon name="browse" class="act-icon" />
                    </button>
                    <button class="act-btn act-edit" title="编辑" @click="openEdit(row)">
                      <AppIcon name="edit" class="act-icon" />
                    </button>
                    <button class="act-btn act-join" title="加入项目" @click="openJoin(row)">
                      <AppIcon name="plus" class="act-icon" />
                    </button>
                    <button class="act-btn act-delete" title="删除" @click="handleDelete(row)">
                      <AppIcon name="delete" class="act-icon" />
                    </button>
                  </div>
                </template>
              </td>
            </tr>
            <tr v-if="pageRows.length === 0">
              <td class="fi-td empty-cell" :colspan="columnCount">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ===== 分页 ===== -->
      <div class="pagination-wrap">
        <span class="pagi-total">共 {{ total }} 条记录 第 {{ page }}/{{ totalPages }} 页</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          background
        />
      </div>

      <!-- ===== 新增 / 编辑弹窗 ===== -->
      <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px" destroy-on-close>
        <el-form ref="formRef" :model="unitForm" :rules="formRules" label-width="110px">
          <el-form-item :label="cfg.nameLabel" prop="name">
            <el-input v-model="unitForm.name" :placeholder="cfg.namePlaceholder" maxlength="50" clearable />
          </el-form-item>

          <el-form-item v-if="kind === 'enterprise'" label="单位性质" prop="nature">
            <el-select v-model="unitForm.nature" placeholder="请选择单位性质" style="width:100%">
              <el-option v-for="n in UNIT_NATURE_OPTIONS" :key="n" :label="n" :value="n" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="kind === 'venue'" label="场所类型" prop="venueType">
            <el-select v-model="unitForm.venueType" placeholder="请选择场所类型" style="width:100%">
              <el-option v-for="t in VENUE_TYPE_OPTIONS" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>

          <el-form-item label="所属区域" prop="region">
            <el-input v-model="unitForm.region" placeholder="如：海港区" maxlength="30" clearable />
          </el-form-item>

          <el-form-item label="地址" prop="address">
            <el-input v-model="unitForm.address" placeholder="详细地址" maxlength="100" clearable />
          </el-form-item>

          <el-form-item :label="cfg.contactLabel" prop="contact">
            <el-input v-model="unitForm.contact" placeholder="姓名" maxlength="20" clearable />
          </el-form-item>

          <el-form-item label="联系方式" prop="phone">
            <el-input v-model="unitForm.phone" placeholder="手机号" maxlength="11" clearable />
          </el-form-item>

          <el-form-item label="标签" prop="tags">
            <el-select
              v-model="unitForm.tags"
              multiple
              filterable
              allow-create
              default-first-option
              collapse-tags
              collapse-tags-tooltip
              placeholder="输入标签后回车"
              style="width:100%"
            >
              <el-option v-for="t in tagOptions" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="kind === 'enterprise'" label="是否重点单位">
            <el-switch v-model="unitForm.isKeyUnit" />
          </el-form-item>
        </el-form>
        <template #footer>
          <button class="btn-default" @click="dialogVisible = false">取消</button>
          <button class="btn-primary" @click="submitForm">保存</button>
        </template>
      </el-dialog>

      <!-- ===== 单位详情抽屉（只读） ===== -->
      <el-drawer v-model="drawerVisible" :title="`${cfg.title}详情`" size="520px" destroy-on-close>
        <div v-if="detail">
          <div class="scope-note">
            <AppIcon name="info-circle" />
            <span>本台账共 {{ kindTotal }} {{ cfg.unitWord }}，以下为单位基础信息（只读）。</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">{{ cfg.nameLabel }}</span>
            <span class="detail-value">{{ detail.name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ kind === 'venue' ? '场所类型' : '单位性质' }}</span>
            <span class="detail-value">
              <span class="unit-tag" :class="natureTagClass(detail.nature)">{{ detail.nature }}</span>
              <span v-if="kind === 'venue'" class="unit-tag venue">{{ detail.venueType || '—' }}</span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">所属区域</span>
            <span class="detail-value">{{ detail.region || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">地址</span>
            <span class="detail-value">{{ detail.address || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ cfg.contactLabel }}</span>
            <span class="detail-value">{{ detail.contact || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">联系方式</span>
            <span class="detail-value">{{ detail.phone || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">标签</span>
            <span class="detail-value">{{ detail.tags.length ? detail.tags.join('、') : '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">所属项目</span>
            <span class="detail-value">{{ projectsText(detail) || '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">设备数</span>
            <span class="detail-value">{{ deviceCount(detail) }} 台</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">创建时间</span>
            <span class="detail-value">{{ detail.createdAt }}</span>
          </div>
        </div>
      </el-drawer>

      <!-- ===== 加入项目（反向入口，design.md §6.4.1 入口 3） ===== -->
      <JoinProjectDrawer v-model:visible="joinVisible" :unit="joinUnit" />

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus/es/components/message/index.mjs'
import 'element-plus/es/components/message/style/css.mjs'
import { ElMessageBox } from 'element-plus/es/components/message-box/index.mjs'
import 'element-plus/es/components/message-box/style/css.mjs'
import type { FormInstance, FormRules } from 'element-plus'
import { UNIT_NATURE_OPTIONS, VENUE_TYPE_OPTIONS, useProjectOpsStore } from '@/stores/project-ops'
import type { ManagedUnit, UnitKind, UnitNature } from '@/types/project-ops'
import AppIcon from '@/components/base/AppIcon.vue'
import JoinProjectDrawer from './components/JoinProjectDrawer.vue'

/**
 * ManagedUnitList.vue — 项目管理（运营商侧）三个台账列表页
 *
 * 重点单位 / 家庭 / 九小场所三个台账共用本组件，通过 kind prop 切换标题与列。
 * 口径见 docs/项目管理/product-design.md §3.1（三个台账列表壳）、§6.4.1（三个入口）、
 * §6.4.5（家庭 / 小场所差异与量词）、§7.3（三个台账列定义）、§8.2（单位规则）、§9（状态设计）。
 * 数据来自 Pinia store（useProjectOpsStore），分页在前端做，不发请求。
 */

const props = defineProps<{ kind: UnitKind }>()

const store = useProjectOpsStore()

// ===== 台账配置（标题 / 量词 / 表单字段文案） =====

interface KindCfg {
  /** 台账名称，用于标题 */
  title: string
  /** 单位量词：企业用「家 / 个」，家庭用「户 / 个」，九小场所用「个」（design.md §6.4.5） */
  unitWord: string
  /** 名称列标题 */
  nameLabel: string
  /** 名称输入框占位文案 */
  namePlaceholder: string
  /** 负责人 / 联系人列标题 */
  contactLabel: string
  /** 关键字搜索框占位文案 */
  keywordPlaceholder: string
  /** 新增按钮文案 */
  addLabel: string
}

const CFG: Record<UnitKind, KindCfg> = {
  enterprise: {
    title: '重点单位',
    unitWord: '家',
    nameLabel: '单位名称',
    namePlaceholder: '请输入单位名称',
    contactLabel: '负责人',
    keywordPlaceholder: '单位名称 / 负责人 / 标签',
    addLabel: '新增单位',
  },
  family: {
    title: '家庭',
    unitWord: '户',
    nameLabel: '家庭名称 / 户主',
    namePlaceholder: '请输入家庭名称，如：张桂芳家庭',
    contactLabel: '联系人',
    keywordPlaceholder: '家庭名称 / 户主 / 地址',
    addLabel: '新增家庭',
  },
  venue: {
    title: '九小场所',
    unitWord: '个',
    nameLabel: '场所名称',
    namePlaceholder: '请输入场所名称',
    contactLabel: '负责人',
    keywordPlaceholder: '场所名称 / 负责人 / 标签',
    addLabel: '新增场所',
  },
}

const cfg = computed(() => CFG[props.kind])

// ===== 列定义（design.md §7.3） =====

type ColumnKey =
  | 'name'
  | 'nature'
  | 'venueType'
  | 'region'
  | 'address'
  | 'contact'
  | 'phone'
  | 'projectCount'
  | 'projects'
  | 'devices'
  | 'actions'

interface ColumnDef {
  key: ColumnKey
  label: string
  cls: string
}

const COLUMNS: Record<UnitKind, ColumnDef[]> = {
  enterprise: [
    { key: 'name', label: '单位名称', cls: 'col-name' },
    { key: 'nature', label: '单位性质', cls: 'col-nature' },
    { key: 'region', label: '所属区域', cls: 'col-region' },
    { key: 'contact', label: '负责人', cls: 'col-contact' },
    { key: 'phone', label: '联系方式', cls: 'col-phone' },
    { key: 'projectCount', label: '所属项目数', cls: 'col-count' },
    { key: 'devices', label: '设备数', cls: 'col-count' },
    { key: 'actions', label: '操作', cls: 'col-actions' },
  ],
  family: [
    { key: 'name', label: '家庭名称 / 户主', cls: 'col-name' },
    { key: 'region', label: '所属区域', cls: 'col-region' },
    { key: 'address', label: '地址', cls: 'col-address' },
    { key: 'phone', label: '联系方式', cls: 'col-phone' },
    { key: 'projects', label: '所属项目', cls: 'col-projects' },
    { key: 'devices', label: '设备数', cls: 'col-count' },
    { key: 'actions', label: '操作', cls: 'col-actions' },
  ],
  venue: [
    { key: 'name', label: '场所名称', cls: 'col-name' },
    { key: 'venueType', label: '场所类型', cls: 'col-nature' },
    { key: 'region', label: '所属区域', cls: 'col-region' },
    { key: 'address', label: '地址', cls: 'col-address' },
    { key: 'contact', label: '负责人', cls: 'col-contact' },
    { key: 'projects', label: '所属项目', cls: 'col-projects' },
    { key: 'devices', label: '设备数', cls: 'col-count' },
    { key: 'actions', label: '操作', cls: 'col-actions' },
  ],
}

const columns = computed(() => COLUMNS[props.kind])
const columnCount = computed(() => columns.value.length)

// ===== 数据与筛选 =====

/** 本台账的单位范围：重点单位只列 isKeyUnit 的企业；家庭 / 九小场所按 kind 全量 */
const kindUnits = computed<ManagedUnit[]>(() => {
  const all = store.units
  if (props.kind === 'enterprise') return all.filter(u => u.kind === 'enterprise' && u.isKeyUnit)
  return all.filter(u => u.kind === props.kind)
})

const kindTotal = computed(() => kindUnits.value.length)

/** 区域下拉选项：取自本台账已有单位 */
const regionOptions = computed(() =>
  Array.from(new Set(kindUnits.value.map(u => u.region).filter(r => r !== ''))).sort(),
)

/** 输入中的筛选条件 */
const form = ref<{ keyword: string; region: string }>({ keyword: '', region: '' })
/** 已生效的筛选条件（点查询 / 回车后生效） */
const applied = ref<{ keyword: string; region: string }>({ keyword: '', region: '' })

const page = ref(1)
const size = ref(10)

const filtered = computed<ManagedUnit[]>(() => {
  const kw = applied.value.keyword.trim().toLowerCase()
  const region = applied.value.region
  return kindUnits.value.filter(u => {
    if (region && u.region !== region) return false
    if (!kw) return true
    return (
      u.name.toLowerCase().includes(kw) ||
      u.nature.toLowerCase().includes(kw) ||
      u.venueType.toLowerCase().includes(kw) ||
      u.region.toLowerCase().includes(kw) ||
      u.address.toLowerCase().includes(kw) ||
      u.contact.toLowerCase().includes(kw) ||
      u.phone.toLowerCase().includes(kw) ||
      u.tags.some(t => t.toLowerCase().includes(kw))
    )
  })
})

const total = computed(() => filtered.value.length)
const totalPages = computed(() => Math.ceil(total.value / size.value) || 1)
/** 前端分页切片 */
const pageRows = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value))

function doSearch() {
  applied.value = { keyword: form.value.keyword, region: form.value.region }
  page.value = 1
}

function clearKeyword() {
  form.value.keyword = ''
  doSearch()
}

watch(total, () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})

watch(size, () => {
  page.value = 1
})

watch(
  () => props.kind,
  () => {
    form.value = { keyword: '', region: '' }
    applied.value = { keyword: '', region: '' }
    page.value = 1
    dialogVisible.value = false
    drawerVisible.value = false
  },
)

// ===== 行数据辅助 =====

/** 所属项目名 */
function projectNames(unit: ManagedUnit): string[] {
  return store.projectNamesOfUnit(unit.id)
}

/** 所属项目文案（逗号连接） */
function projectsText(unit: ManagedUnit): string {
  return projectNames(unit).join('、')
}

/** 设备数 */
function deviceCount(unit: ManagedUnit): number {
  return store.devices.filter(d => d.unitId === unit.id).length
}

/** 单位性质标签样式 */
const NATURE_TAG_CLASS: Record<UnitNature, string> = {
  党政机关: 'party',
  社会单位: 'social',
  技术服务机构: 'service',
  九小场所·个人: 'venue',
  家庭: 'family',
  其它: 'other',
}

function natureTagClass(nature: UnitNature): string {
  return `unit-tag ${NATURE_TAG_CLASS[nature] ?? 'other'}`
}

// ===== 新增 / 编辑 =====

interface UnitForm {
  name: string
  nature: UnitNature
  venueType: string
  region: string
  address: string
  contact: string
  phone: string
  tags: string[]
  isKeyUnit: boolean
}

const TAG_OPTIONS: Record<UnitKind, string[]> = {
  enterprise: ['消防安全重点单位', '物业', '维保', '检测', '学校', '医院'],
  family: ['独居老人', '低保', '烈军属', '残疾'],
  venue: ['餐饮', '零售', '娱乐', '洗浴', '住宿'],
}

const tagOptions = computed(() => TAG_OPTIONS[props.kind])

const dialogVisible = ref(false)
const drawerVisible = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref<FormInstance>()
const unitForm = ref<UnitForm>(blankForm())

/** 默认表单：性质按台账类型固定（家庭 / 九小场所的 nature 由台账决定） */
function blankForm(): UnitForm {
  const nature: UnitNature =
    props.kind === 'enterprise' ? '社会单位' : props.kind === 'family' ? '家庭' : '九小场所·个人'
  return {
    name: '',
    nature,
    venueType: '',
    region: '',
    address: '',
    contact: '',
    phone: '',
    tags: [],
    isKeyUnit: false,
  }
}

const dialogTitle = computed(() => `${editingId.value ? '编辑' : '新增'}${cfg.value.title}`)

const formRules = computed<FormRules>(() => {
  const rules: FormRules = {
    name: [{ required: true, message: `请输入${cfg.value.title}名称`, trigger: 'blur' }],
    phone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }],
  }
  if (props.kind === 'enterprise') {
    rules.nature = [{ required: true, message: '请选择单位性质', trigger: 'change' }]
  }
  if (props.kind === 'venue') {
    rules.venueType = [{ required: true, message: '请选择场所类型', trigger: 'change' }]
  }
  return rules
})

function openCreate() {
  editingId.value = null
  unitForm.value = blankForm()
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

function openEdit(unit: ManagedUnit) {
  editingId.value = unit.id
  unitForm.value = {
    name: unit.name,
    nature: unit.nature,
    venueType: unit.venueType,
    region: unit.region,
    address: unit.address,
    contact: unit.contact,
    phone: unit.phone,
    tags: [...unit.tags],
    isKeyUnit: unit.isKeyUnit,
  }
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const payload = {
    name: unitForm.value.name.trim(),
    nature: unitForm.value.nature,
    region: unitForm.value.region.trim(),
    address: unitForm.value.address.trim(),
    contact: unitForm.value.contact.trim(),
    phone: unitForm.value.phone.trim(),
    tags: [...unitForm.value.tags],
    venueType: unitForm.value.venueType,
    isKeyUnit: unitForm.value.isKeyUnit,
  }

  if (editingId.value) {
    store.updateUnit(editingId.value, payload)
  } else {
    const res = store.createUnit({ ...payload, kind: props.kind })
    if (!res.ok) {
      ElMessage.error(res.msg)
      return
    }
  }
  ElMessage.success('保存成功')
  dialogVisible.value = false
}

// ===== 详情抽屉 =====

const detail = ref<ManagedUnit | null>(null)

function openDetail(unit: ManagedUnit) {
  detail.value = unit
  drawerVisible.value = true
}

// ===== 加入项目（反向入口） =====
const joinVisible = ref(false)
const joinUnit = ref<ManagedUnit | null>(null)

function openJoin(unit: ManagedUnit) {
  joinUnit.value = unit
  joinVisible.value = true
}

// ===== 删除 =====

async function handleDelete(unit: ManagedUnit) {
  const projects = projectNames(unit).length
  const devices = deviceCount(unit)
  const impacts: string[] = []
  if (projects) impacts.push(`已接入的 ${projects} 个项目关联关系将一并清除`)
  if (devices) impacts.push(`其名下 ${devices} 台设备将一并删除`)
  const tip = `确定删除「${unit.name}」？${impacts.length ? impacts.join('，') + '。' : ''}`

  try {
    await ElMessageBox.confirm(tip, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  store.removeUnit(unit.id)
  ElMessage.success('删除成功')
}
</script>

<style scoped>
.list-page { height: 100%; }
.content-card {
  background: var(--bg-card); border-radius: var(--radius-md, 8px);
  padding: var(--spacing-xl, 16px); display: flex; flex-direction: column;
  height: 100%; gap: var(--spacing-lg, 12px); overflow: auto;
}

/* ===== 列宽 ===== */
.col-name { min-width: 160px; }
.col-nature { min-width: 120px; }
.col-region { min-width: 110px; }
.col-address { min-width: 200px; text-align: left; }
.col-contact { min-width: 110px; }
.col-phone { min-width: 130px; }
.col-count { min-width: 110px; }
.col-projects { min-width: 220px; text-align: left; }
.col-actions { width: 130px; min-width: 130px; white-space: nowrap; }

/* ===== 单位性质 / 场所类型标签 ===== */
.unit-tag {
  display: inline-flex; align-items: center; height: 24px;
  padding: 0 var(--spacing-md, 8px); border-radius: var(--radius-sm, 6px);
  font-size: var(--font-small, 14px); background: var(--normal-bg); color: var(--text-secondary);
}
.unit-tag.party { background: var(--info-bg); color: var(--accent-primary); }
.unit-tag.social { background: var(--success-bg); color: var(--success-text); }
.unit-tag.service { background: var(--purple-bg); color: var(--purple-text); }
.unit-tag.venue { background: var(--warning-bg); color: var(--warning-text); }
.unit-tag.family { background: var(--normal-bg); color: var(--normal); }
.unit-tag.other { background: var(--normal-bg); color: var(--text-secondary); }

/* ===== 单元格 ===== */
.cell-ellipsis {
  display: inline-block; max-width: 260px; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap; vertical-align: middle;
}
.cell-sub { display: block; margin-top: 2px; font-size: var(--font-small, 14px); color: var(--text-muted); }

.empty-cell { text-align: center; color: var(--text-muted); padding: var(--spacing-xl, 16px) 0; }

/* ===== 详情抽屉 ===== */
.detail-row {
  display: flex; gap: var(--spacing-lg, 12px);
  padding: var(--spacing-md, 8px) 0; border-bottom: 1px solid var(--border-low);
}
.detail-label {
  width: 96px; flex-shrink: 0; color: var(--text-secondary); font-size: var(--font-small, 14px);
}
.detail-value { flex: 1; color: var(--text-primary); word-break: break-all; }
.detail-value .unit-tag + .unit-tag { margin-left: var(--spacing-sm, 6px); }

@media (max-width: 800px) {
  .filter-bar { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: stretch; }
  .pagination-wrap { flex-direction: column; gap: var(--spacing-lg, 12px); align-items: flex-start; }
}

/* ===== 分页：覆盖 Element Plus 默认样式（与 device/DeviceList.vue 保持一致） ===== */
:deep(.el-pagination .el-pager li) { background-color: var(--pagi-bg); color: var(--pagi-text); border: 1px solid var(--border-default); }
:deep(.el-pagination .el-pager li.is-active) { background-color: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
:deep(.el-pagination .btn-prev), :deep(.el-pagination .btn-next) { background-color: var(--pagi-bg) !important; color: var(--pagi-text) !important; border: 1px solid var(--border-default); }
:deep(.el-pagination .btn-prev.is-disabled), :deep(.el-pagination .btn-next.is-disabled) { color: var(--text-muted) !important; background-color: var(--pagi-bg) !important; }
:deep(.el-pagination .el-select .el-select__wrapper) { background-color: var(--bg-card) !important; color: var(--text-secondary); border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__wrapper) { background-color: var(--bg-card) !important; border: 1px solid var(--border-high) !important; box-shadow: none !important; }
:deep(.el-pagination .el-pagination__jump .el-input__inner) { color: var(--text-primary) !important; background-color: var(--bg-card); }
</style>
