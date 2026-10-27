<template>
  <section class="prop-panel">
    <header class="prop-panel__head">
      <span class="prop-panel__title">属性</span>
      <span class="prop-panel__state">{{ stateText }}</span>
    </header>

    <div class="prop-panel__body">
      <!-- ===== 选中图元 ===== -->
      <template v-if="node">
        <div class="prop-panel__block">
          <label class="prop-panel__label">图元</label>
          <div class="prop-panel__code">{{ node.symbol }}</div>
          <div class="prop-panel__hint">{{ symbolMeta?.name }} · {{ symbolMeta?.category }}</div>
        </div>

        <div class="prop-panel__block">
          <label class="prop-panel__label">标签</label>
          <el-input
            :model-value="node.label || ''"
            size="small"
            placeholder="图元下方显示名称"
            @update:model-value="(v: string) => patchNode({ label: v })"
          />
        </div>

        <div class="prop-panel__block">
          <label class="prop-panel__label">绑定点名</label>
          <el-select
            :model-value="node.point || ''"
            size="small"
            placeholder="不绑定"
            filterable
            class="prop-panel__select"
            @update:model-value="(v: string) => patchNode({ point: v })"
          >
            <el-option label="（不绑定）" value="" />
            <el-option-group v-if="ownPoints.length" label="该图元">
              <el-option
                v-for="p in ownPoints"
                :key="p.point"
                :label="`${p.binding} · ${p.point}`"
                :value="p.point"
              />
            </el-option-group>
            <el-option-group label="全部点位">
              <el-option
                v-for="p in otherPoints"
                :key="p.point"
                :label="`${p.symbolName} · ${p.binding} · ${p.point}`"
                :value="p.point"
              />
            </el-option-group>
          </el-select>
        </div>

        <div class="prop-panel__block">
          <label class="prop-panel__label">显示值</label>
          <el-input
            :model-value="node.value || ''"
            size="small"
            placeholder="例：0.65 MPa"
            @update:model-value="(v: string) => patchNode({ value: v })"
          />
        </div>

        <div class="prop-panel__row">
          <div class="prop-panel__block">
            <label class="prop-panel__label">X</label>
            <el-input-number
              :model-value="Math.round(node.x)"
              size="small"
              :controls="false"
              @update:model-value="(v: number | undefined) => patchNode({ x: Number(v) || 0 })"
            />
          </div>
          <div class="prop-panel__block">
            <label class="prop-panel__label">Y</label>
            <el-input-number
              :model-value="Math.round(node.y)"
              size="small"
              :controls="false"
              @update:model-value="(v: number | undefined) => patchNode({ y: Number(v) || 0 })"
            />
          </div>
        </div>

        <div class="prop-panel__block">
          <label class="prop-panel__label">图元尺寸</label>
          <el-select
            :model-value="node.size"
            size="small"
            class="prop-panel__select"
            @update:model-value="(v: number) => patchNode({ size: v })"
          >
            <el-option v-for="v in SIZES" :key="v" :label="`${v} px`" :value="v" />
          </el-select>
        </div>

        <div class="prop-panel__block">
          <label class="prop-panel__label">状态预览</label>
          <div class="prop-panel__states">
            <button
              v-for="s in STATE_KEYS"
              :key="s.key"
              class="prop-panel__state-btn"
              :class="[`is-${s.key}`, { 'is-on': node.state?.[s.key] }]"
              @click="toggleState(s.key)"
            >
              {{ s.label }}
            </button>
          </div>
        </div>

        <button class="prop-panel__danger" @click="emit('delete-node', node.id)">删除该图元</button>
      </template>

      <!-- ===== 选中连线 ===== -->
      <template v-else-if="edge">
        <div class="prop-panel__block">
          <label class="prop-panel__label">连线类型</label>
          <el-select
            :model-value="edge.kind || 'pipe'"
            size="small"
            class="prop-panel__select"
            @update:model-value="(v: string) => patchEdge({ kind: v as 'pipe' | 'control' })"
          >
            <el-option label="管道" value="pipe" />
            <el-option label="电气（虚线）" value="control" />
          </el-select>
        </div>

        <div class="prop-panel__block">
          <label class="prop-panel__label">折点</label>
          <el-input
            :model-value="viaText"
            size="small"
            placeholder="例：700,300 | 700,500"
            @update:model-value="onViaInput"
          />
        </div>

        <button class="prop-panel__danger" @click="emit('delete-edge', edge.id)">删除该连线</button>
      </template>

      <!-- ===== 未选中 ===== -->
      <template v-else>
        <div class="prop-panel__block">
          <label class="prop-panel__label">统计</label>
          <div class="prop-panel__stats">
            <span>图元</span><b>{{ nodes.length }}</b>
            <span>连线</span><b>{{ edges.length }}</b>
            <span>图元库</span><b>{{ SYMBOLS.length }}</b>
          </div>
        </div>
        <div class="prop-panel__hint-block">
          <b>放置</b>：点右侧图元 → 画布点击<br />
          <b>移动</b>：拖动图元<br />
          <b>连线</b>：拖动图元上的绿色连接点到另一图元<br />
          <b>删除</b>：选中后按 Delete<br />
          <b>保存</b>：写入本地；导出 JSON 可交付
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 属性面板（编辑器右侧栏下部）
 *
 * 选中图元 → 改标签 / 绑定点名 / 显示值 / 坐标 / 尺寸 / 状态；
 * 选中连线 → 改类型与折点；未选中 → 画面统计与操作提示。
 */
import { computed } from 'vue'
import { SYMBOLS, SYMBOL_POINTS, symbolDef } from '@/symbols'
import type { SceneEdge, SceneNode, SceneSelection } from '@/types/scene-config'

const props = defineProps<{
  selection: SceneSelection
  nodes: SceneNode[]
  edges: SceneEdge[]
}>()

const emit = defineEmits<{
  'update-node': [id: string, patch: Partial<SceneNode>]
  'delete-node': [id: string]
  'update-edge': [id: string, patch: Partial<SceneEdge>]
  'delete-edge': [id: string]
}>()

const SIZES = [40, 48, 60, 72, 96]

const STATE_KEYS = [
  { key: 'run', label: '运行' },
  { key: 'fault', label: '故障' },
  { key: 'manual', label: '手动' },
  { key: 'open', label: '阀开' },
  { key: 'closed', label: '阀关' },
]

const node = computed(() =>
  props.selection?.type === 'node'
    ? props.nodes.find((n) => n.id === props.selection!.id) ?? null
    : null,
)

const edge = computed(() =>
  props.selection?.type === 'edge'
    ? props.edges.find((e) => e.id === props.selection!.id) ?? null
    : null,
)

const symbolMeta = computed(() => (node.value ? symbolDef(node.value.symbol) : undefined))

const ownPoints = computed(() =>
  node.value ? SYMBOL_POINTS.filter((p) => p.symbolId === node.value!.symbol) : [],
)

const otherPoints = computed(() =>
  node.value ? SYMBOL_POINTS.filter((p) => p.symbolId !== node.value!.symbol) : [],
)

const stateText = computed(() => {
  if (node.value) return `已选图元 ${node.value.label || node.value.symbol}`
  if (edge.value) return '已选连线'
  return '未选中'
})

const viaText = computed(() => (edge.value?.via || []).map((v) => v.join(',')).join(' | '))

function patchNode(patch: Partial<SceneNode>) {
  if (node.value) emit('update-node', node.value.id, patch)
}

function patchEdge(patch: Partial<SceneEdge>) {
  if (edge.value) emit('update-edge', edge.value.id, patch)
}

function toggleState(key: string) {
  if (!node.value) return
  const state = { ...(node.value.state || {}) }
  state[key] = !state[key]
  patchNode({ state })
}

function onViaInput(text: string) {
  const via = text
    .split('|')
    .map((s) => s.split(',').map((v) => Number(v.trim())))
    .filter((p) => p.length === 2 && p.every((v) => Number.isFinite(v))) as [number, number][]
  patchEdge({ via })
}
</script>

<style scoped>
.prop-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}
.prop-panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-low);
}
.prop-panel__title {
  font-size: var(--font-small);
  font-weight: 600;
  color: var(--text-primary);
}
.prop-panel__state {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.prop-panel__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}
.prop-panel__block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
  min-width: 0;
}
.prop-panel__row {
  display: flex;
  gap: var(--spacing-lg);
}
.prop-panel__row .prop-panel__block { flex: 1; }
.prop-panel__label {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.prop-panel__code {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: var(--font-xs);
  color: var(--text-primary);
}
.prop-panel__hint {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.prop-panel__select {
  width: 100%;
}
.prop-panel__stats {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--spacing-xs) var(--spacing-lg);
  font-size: var(--font-xs);
  color: var(--text-secondary);
}
.prop-panel__stats b {
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}
.prop-panel__states {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}
.prop-panel__state-btn {
  padding: var(--spacing-xs) var(--spacing-md);
  font: inherit;
  font-size: var(--font-xs);
  color: var(--text-secondary);
  background: var(--bg-sub-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.prop-panel__state-btn.is-on {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: var(--accent-primary10);
}
.prop-panel__state-btn.is-fault.is-on {
  border-color: var(--danger);
  color: var(--danger);
  background: var(--danger-bg);
}
.prop-panel__state-btn.is-manual.is-on {
  border-color: var(--warning);
  color: var(--warning-text);
  background: var(--warning-bg);
}
.prop-panel__hint-block {
  font-size: var(--font-xs);
  line-height: 1.9;
  color: var(--text-muted);
}
.prop-panel__hint-block b { color: var(--text-secondary); }
.prop-panel__danger {
  height: var(--btn-height, 37px);
  font: inherit;
  font-size: var(--font-small);
  color: var(--danger);
  background: var(--danger-bg);
  border: 1px solid var(--danger);
  border-radius: var(--radius-md);
  cursor: pointer;
}
.prop-panel__danger:hover { filter: brightness(0.97); }
</style>
