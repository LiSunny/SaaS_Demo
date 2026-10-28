<template>
  <el-drawer
    :model-value="visible"
    size="780px"
    destroy-on-close
    class="symbol-form-drawer"
    @update:model-value="(v: boolean) => emit('update:visible', v)"
    @closed="handleClosed"
  >
    <template #header>
      <div class="drawer-custom-header">
        <h3 class="drawer-custom-title">{{ mode === 'create' ? '新增图元' : '编辑图元' }}</h3>
      </div>
    </template>

    <div class="drawer-form-body">
      <!-- 产品图 -->
      <div class="sym-block">
        <div class="sym-block__title">产品图</div>
        <OssUpload
          v-model="form.imageUrl"
          folder="symbols"
          accept="image/png,image/jpeg,image/webp"
          placeholder="上传产品图"
          :transform="transformImage"
          @success="onImageUploaded"
        />
        <p class="sym-block__hint">
          建议上传透明底 PNG 正视图。系统自动抠除背景并归一化为 512×512，状态光晕按内容框计算。
        </p>
      </div>

      <!-- 基本信息 -->
      <div class="sym-block">
        <div class="sym-block__title">基本信息</div>

        <div class="form-row">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">图元 ID</span>
          </div>
          <div class="form-control">
            <el-input
              v-model="form.symbolId"
              placeholder="类别-对象-序号，如 CUS-PUMP-01"
              maxlength="20"
              class="clean-input"
              :disabled="mode === 'edit'"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">名称</span>
          </div>
          <div class="form-control">
            <el-input v-model="form.name" placeholder="请输入图元名称" maxlength="30" class="clean-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">所属系统</span>
          </div>
          <div class="form-control">
            <el-select v-model="form.system" placeholder="请选择所属系统" class="clean-select" @change="onSystemChange">
              <el-option v-for="s in SYMBOL_SYSTEMS" :key="s.key" :label="s.name" :value="s.key" />
            </el-select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-label">
            <span class="label-required">*</span>
            <span class="label-text">分类</span>
          </div>
          <div class="form-control">
            <el-select v-model="form.category" placeholder="请选择分类" class="clean-select">
              <el-option
                v-for="c in categoryOptions"
                :key="c.key"
                :label="c.system === 'common' ? `${c.name}（通用）` : c.name"
                :value="c.key"
              />
            </el-select>
          </div>
        </div>

        <div class="form-row form-row-top">
          <div class="form-label">
            <span class="label-text">描述</span>
          </div>
          <div class="form-control">
            <el-input v-model="form.desc" type="textarea" :rows="2" placeholder="图元说明" class="clean-input" />
          </div>
        </div>
      </div>

      <!-- 连接点 -->
      <div class="sym-block">
        <div class="sym-block__title">
          连接点
          <span class="sym-block__count">{{ form.ports.length }} 个</span>
        </div>

        <div class="sym-port-wrap">
          <svg class="sym-port-editor" viewBox="0 0 64 64" @click="onCanvasClick">
            <g class="sym-port-grid">
              <line v-for="i in 9" :key="`v${i}`" :x1="(i - 1) * 8" y1="0" :x2="(i - 1) * 8" y2="64" />
              <line v-for="i in 9" :key="`h${i}`" x1="0" :y1="(i - 1) * 8" x2="64" :y2="(i - 1) * 8" />
            </g>
            <g
              v-for="(p, i) in form.ports"
              :key="i"
              class="sym-port-item"
              :class="{ 'is-active': selectedPort === i }"
              @click.stop="selectedPort = i"
            >
              <line
                :x1="p.x"
                :y1="p.y"
                :x2="p.x + DIR_VEC[p.dir].x * 7"
                :y2="p.y + DIR_VEC[p.dir].y * 7"
              />
              <circle :cx="p.x" :cy="p.y" r="3" />
            </g>
          </svg>

          <div class="sym-port-side">
            <p class="sym-block__hint">点击方框空白处添加连接点，拖到网格线上自动吸附。点击连接点选中后可改出线方向。</p>
            <div v-if="selectedPort !== null" class="sym-port-edit">
              <span class="sym-port-edit__label">出线方向</span>
              <div class="sym-port-dir">
                <button
                  v-for="d in PORT_DIRS"
                  :key="d"
                  type="button"
                  class="sym-port-dir__btn"
                  :class="{ 'is-active': form.ports[selectedPort].dir === d }"
                  @click="setPortDir(d)"
                >
                  {{ DIR_LABEL[d] }}
                </button>
              </div>
              <button type="button" class="btn-default sym-port-del" @click="removePort">删除该连接点</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 绑定点 -->
      <div class="sym-block">
        <div class="sym-block__title">
          绑定点
          <span class="sym-block__count">{{ form.bindings.length }} 个</span>
        </div>

        <div v-for="(b, i) in form.bindings" :key="i" class="sym-binding">
          <div class="sym-binding__head">
            <span class="sym-binding__title">绑定点 {{ i + 1 }}</span>
            <button type="button" class="act-btn act-delete" title="删除绑定点" @click="removeBinding(i)">
              <AppIcon name="delete" class="act-icon" />
            </button>
          </div>

          <div class="form-row">
            <div class="form-label">
              <span class="label-required">*</span>
              <span class="label-text">绑定名</span>
            </div>
            <div class="form-control">
              <el-input v-model="b.name" placeholder="如 运行 / 故障 / 出口压力" maxlength="20" class="clean-input" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-label">
              <span class="label-required">*</span>
              <span class="label-text">点名</span>
            </div>
            <div class="form-control">
              <el-input v-model="b.point" placeholder="点位名，全局唯一，如 CUS_PUMP_01_RUN" maxlength="40" class="clean-input" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-label">
              <span class="label-required">*</span>
              <span class="label-text">类型</span>
            </div>
            <div class="form-control sym-binding__inline">
              <el-select v-model="b.kind" placeholder="请选择类型" class="clean-select">
                <el-option v-for="k in BINDING_KINDS" :key="k.value" :label="k.label" :value="k.value" />
              </el-select>
              <el-select
                v-if="b.kind === 'bool'"
                v-model="b.onClass"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="置位状态类"
                class="clean-select"
              >
                <el-option v-for="s in SYMBOL_STATE_CLASSES" :key="s.value" :label="s.label" :value="s.value" />
              </el-select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-label">
              <span class="label-text">量程</span>
            </div>
            <div class="form-control sym-binding__inline">
              <el-input v-model="b.min" placeholder="下限" class="clean-input" />
              <el-input v-model="b.max" placeholder="上限" class="clean-input" />
              <el-input v-model="b.unit" placeholder="单位" class="clean-input" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-label">
              <span class="label-text">报警限值</span>
            </div>
            <div class="form-control sym-binding__inline">
              <el-input v-model="b.alarmLo" placeholder="报警下限" class="clean-input" />
              <el-input v-model="b.alarmHi" placeholder="报警上限" class="clean-input" />
            </div>
          </div>
        </div>

        <button type="button" class="btn-add sym-binding__add" @click="addBinding">
          <AppIcon name="plus" class="btn-add-icon" />添加绑定点
        </button>
      </div>
    </div>

    <template #footer>
      <button class="btn-default" @click="visible = false">取消</button>
      <button class="btn-primary" :disabled="saving" @click="submit">
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
/**
 * 自定义图元新增/编辑抽屉
 *
 * 图元入库三段式：产品图（上传 OSS）→ 基本信息 → 连接点 + 绑定点。
 * 连接点坐标在 64×64 画布上、吸附到 8 的网格；绑定点点名全局唯一。
 */
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import AppIcon from '@/components/base/AppIcon.vue'
import OssUpload from '@/components/business/OssUpload.vue'
import { SYMBOL_CATEGORIES, SYMBOL_SYSTEMS, SYMBOLS } from '@/symbols'
import { useSymbolStore } from '@/stores/symbols'
import { processSymbolImage } from '@/utils/symbol-image'
import { SYMBOL_STATE_CLASSES } from '@/types/symbol'
import type {
  CustomSymbolBinding,
  CustomSymbolItem,
  CustomSymbolPort,
  SymbolBindingKind,
  SymbolPortDir,
} from '@/types/symbol'

const props = defineProps<{
  visible: boolean
  /** 编辑中的图元；为空表示新增 */
  item?: CustomSymbolItem | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: []
}>()

/** 连接点方向 */
const PORT_DIRS: SymbolPortDir[] = ['left', 'right', 'up', 'down']

/** 方向文案 */
const DIR_LABEL: Record<SymbolPortDir, string> = {
  left: '向左',
  right: '向右',
  up: '向上',
  down: '向下',
}

/** 方向单位向量 */
const DIR_VEC: Record<SymbolPortDir, { x: number; y: number }> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
}

/** 绑定点类型 */
const BINDING_KINDS: Array<{ value: SymbolBindingKind; label: string }> = [
  { value: 'bool', label: '布尔状态' },
  { value: 'level', label: '液位' },
  { value: 'text', label: '数值显示' },
]

/** 图元 ID 命名规范 */
const ID_RE = /^[A-Z]{2,4}-[A-Z]{2,5}-\d{2}$/

/** 绑定点草稿（数值字段用字符串录入） */
interface BindingDraft {
  name: string
  kind: SymbolBindingKind
  point: string
  onClass: string[]
  unit: string
  min: string
  max: string
  alarmLo: string
  alarmHi: string
}

const store = useSymbolStore()

const saving = ref(false)
const selectedPort = ref<number | null>(null)

const form = reactive({
  symbolId: '',
  name: '',
  system: 'pipeline',
  category: '',
  desc: '',
  imageUrl: '',
  bbox: [] as number[],
  ports: [] as CustomSymbolPort[],
  bindings: [] as BindingDraft[],
})

/** 新增还是编辑 */
const mode = computed(() => (props.item ? 'edit' : 'create'))

/** 当前系统的可选分类（含通用件） */
const categoryOptions = computed(() =>
  SYMBOL_CATEGORIES.filter((c) => c.system === form.system || c.system === 'common'),
)

/** 打开时重置表单 */
watch(
  () => props.visible,
  (v) => {
    if (!v) return
    selectedPort.value = null
    if (props.item) {
      const it = props.item
      form.symbolId = it.symbolId
      form.name = it.name
      form.system = it.system
      form.category = it.category
      form.desc = it.desc
      form.imageUrl = it.imageUrl
      form.bbox = [...it.bbox]
      form.ports = it.ports.map((p) => ({ ...p }))
      form.bindings = it.bindings.map((b) => ({
        name: b.name,
        kind: b.kind,
        point: b.point,
        onClass: [...(b.onClass ?? [])],
        unit: b.unit ?? '',
        min: b.min === undefined ? '' : String(b.min),
        max: b.max === undefined ? '' : String(b.max),
        alarmLo: b.alarmLo === undefined ? '' : String(b.alarmLo),
        alarmHi: b.alarmHi === undefined ? '' : String(b.alarmHi),
      }))
    } else {
      form.symbolId = ''
      form.name = ''
      form.system = 'pipeline'
      form.category = ''
      form.desc = ''
      form.imageUrl = ''
      form.bbox = []
      form.ports = []
      form.bindings = [newBinding()]
    }
  },
)

/** 切换系统后分类可能失效 */
function onSystemChange() {
  if (!categoryOptions.value.some((c) => c.key === form.category)) {
    form.category = ''
  }
}

/** 新建绑定点草稿 */
function newBinding(): BindingDraft {
  return {
    name: '',
    kind: 'bool',
    point: '',
    onClass: [],
    unit: '',
    min: '',
    max: '',
    alarmLo: '',
    alarmHi: '',
  }
}

// ===== 产品图 =====

/** 上传前加工：抠背景 + 归一化到 512，同时记录内容框 */
async function transformImage(file: File): Promise<File> {
  const result = await processSymbolImage(file)
  form.bbox = result.bbox
  return new File([result.blob], `${file.name.replace(/\.[^.]+$/, '')}.png`, { type: 'image/png' })
}

/** 图片上传完成 */
function onImageUploaded() {
  // bbox 已在 transformImage 中写入
}

// ===== 连接点 =====

/** 画布点击：吸附到 8 的网格后新增连接点 */
function onCanvasClick(e: MouseEvent) {
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const x = ((e.clientX - rect.left) / rect.width) * 64
  const y = ((e.clientY - rect.top) / rect.height) * 64
  const gx = Math.min(64, Math.max(0, Math.round(x / 8) * 8))
  const gy = Math.min(64, Math.max(0, Math.round(y / 8) * 8))
  form.ports.push({ x: gx, y: gy, dir: 'right' })
  selectedPort.value = form.ports.length - 1
}

/** 设置选中连接点的出线方向 */
function setPortDir(dir: SymbolPortDir) {
  if (selectedPort.value === null) return
  form.ports[selectedPort.value].dir = dir
}

/** 删除选中的连接点 */
function removePort() {
  if (selectedPort.value === null) return
  form.ports.splice(selectedPort.value, 1)
  selectedPort.value = null
}

// ===== 绑定点 =====

function addBinding() {
  form.bindings.push(newBinding())
}

function removeBinding(index: number) {
  form.bindings.splice(index, 1)
}

// ===== 校验与提交 =====

/** 字符串转数字，空串返回 undefined */
function num(v: string): number | undefined {
  const t = v.trim()
  if (!t) return undefined
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}

function validate(): boolean {
  const id = form.symbolId.trim().toUpperCase()
  if (!id) {
    ElMessage.warning('请输入图元 ID')
    return false
  }
  if (!ID_RE.test(id)) {
    ElMessage.warning('图元 ID 需符合「类别-对象-序号」，如 CUS-PUMP-01')
    return false
  }
  if (mode.value === 'create' && SYMBOLS.some((s) => s.id === id)) {
    ElMessage.warning(`图元 ID 已存在：${id}`)
    return false
  }
  if (!form.name.trim()) {
    ElMessage.warning('请输入图元名称')
    return false
  }
  if (!form.system) {
    ElMessage.warning('请选择所属系统')
    return false
  }
  if (!form.category) {
    ElMessage.warning('请选择分类')
    return false
  }
  if (!form.imageUrl) {
    ElMessage.warning('请上传产品图')
    return false
  }
  if (!form.bindings.length) {
    ElMessage.warning('请至少添加一个绑定点')
    return false
  }

  const points = new Set<string>()
  for (const b of form.bindings) {
    if (!b.name.trim()) {
      ElMessage.warning('绑定点名称不能为空')
      return false
    }
    if (!b.point.trim()) {
      ElMessage.warning(`绑定点「${b.name}」缺少点名`)
      return false
    }
    if (points.has(b.point.trim())) {
      ElMessage.warning(`点名重复：${b.point.trim()}`)
      return false
    }
    points.add(b.point.trim())
  }

  return true
}

/** 草稿 → 提交体 */
function toBindings(): CustomSymbolBinding[] {
  return form.bindings.map((b) => {
    const out: CustomSymbolBinding = {
      name: b.name.trim(),
      kind: b.kind,
      point: b.point.trim(),
    }
    if (b.kind === 'bool' && b.onClass.length) out.onClass = [...b.onClass]
    if (b.unit.trim()) out.unit = b.unit.trim()
    const min = num(b.min)
    const max = num(b.max)
    if (min !== undefined) out.min = min
    if (max !== undefined) out.max = max
    const alarmLo = num(b.alarmLo)
    const alarmHi = num(b.alarmHi)
    if (alarmLo !== undefined) out.alarmLo = alarmLo
    if (alarmHi !== undefined) out.alarmHi = alarmHi
    return out
  })
}

async function submit() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = {
      symbolId: form.symbolId.trim().toUpperCase(),
      name: form.name.trim(),
      system: form.system,
      category: form.category,
      desc: form.desc.trim(),
      imageUrl: form.imageUrl,
      bbox: form.bbox,
      ports: form.ports.map((p) => ({ ...p })),
      bindings: toBindings(),
    }
    if (mode.value === 'create') {
      await store.create(payload)
      ElMessage.success('图元已新增')
    } else if (props.item) {
      await store.update(props.item.id, payload)
      ElMessage.success('图元已更新')
    }
    emit('saved')
    emit('update:visible', false)
  } catch {
    // 错误已由请求拦截器提示
  } finally {
    saving.value = false
  }
}

function handleClosed() {
  emit('update:visible', false)
}
</script>

<style scoped>
.drawer-custom-title {
  margin: 0;
  font-size: var(--font-h4, 16px);
  font-weight: 600;
  color: var(--text-primary);
}

.sym-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border-low);
}
.sym-block + .sym-block {
  padding-top: var(--spacing-lg);
}
.sym-block__title {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
  font-size: var(--font-small);
  font-weight: 600;
  color: var(--text-primary);
}
.sym-block__count {
  font-size: var(--font-xs);
  font-weight: 400;
  color: var(--text-muted);
}
.sym-block__hint {
  margin: 0;
  font-size: var(--font-xs);
  line-height: 1.6;
  color: var(--text-muted);
}

/* ===== 连接点编辑 ===== */
.sym-port-wrap {
  display: flex;
  gap: var(--spacing-xl);
  align-items: flex-start;
}
.sym-port-editor {
  width: 240px;
  height: 240px;
  flex-shrink: 0;
  background: var(--bg-sub-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: crosshair;
}
.sym-port-grid line {
  stroke: var(--border-low);
  stroke-width: 0.3;
}
.sym-port-item {
  cursor: pointer;
}
.sym-port-item line {
  stroke: var(--text-tertiary);
  stroke-width: 1.2;
}
.sym-port-item circle {
  fill: var(--bg-card);
  stroke: var(--text-tertiary);
  stroke-width: 1.4;
}
.sym-port-item.is-active circle {
  fill: var(--accent-primary);
  stroke: var(--accent-primary);
}
.sym-port-item.is-active line {
  stroke: var(--accent-primary);
}
.sym-port-side {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
.sym-port-edit {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-sub-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}
.sym-port-edit__label {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.sym-port-dir {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}
.sym-port-dir__btn {
  padding: 4px 10px;
  font: inherit;
  font-size: var(--font-xs);
  color: var(--text-secondary);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.sym-port-dir__btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.sym-port-dir__btn.is-active {
  color: #fff;
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}
.sym-port-del {
  align-self: flex-start;
}

/* ===== 绑定点 ===== */
.sym-binding {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-sub-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}
.sym-binding__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sym-binding__title {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--text-secondary);
}
.sym-binding__inline {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}
.sym-binding__inline > * {
  flex: 1;
  min-width: 120px;
}
.sym-binding__add {
  align-self: flex-start;
}
</style>

<style>
@import '../../views/resumption/steps/shared-form.css';

.symbol-form-drawer .el-drawer__body {
  display: flex !important;
  flex-direction: column;
  overflow-y: auto !important;
  padding: 18px 28px !important;
  height: 100%;
  box-sizing: border-box;
}
</style>
