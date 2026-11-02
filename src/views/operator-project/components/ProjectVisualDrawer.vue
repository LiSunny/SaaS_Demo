<template>
  <el-drawer
    :model-value="visible"
    title="项目可视化"
    size="720px"
    direction="rtl"
    class="project-visual-drawer"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="visual-body">
      <!-- ===== 页签 ===== -->
      <div class="visual-tabs">
        <button
          class="visual-tab"
          :class="{ active: kind === 'bigscreen' }"
          @click="kind = 'bigscreen'"
        >大屏</button>
        <button
          class="visual-tab"
          :class="{ active: kind === 'dashboard' }"
          @click="kind = 'dashboard'"
        >看板</button>
      </div>

      <!-- ===== 模板卡片 ===== -->
      <div v-if="templates.length" class="template-grid">
        <div
          v-for="t in templates"
          :key="t.id"
          class="template-card"
          :class="{ 'is-selected': selectedId === t.id }"
          @click="selectedId = t.id"
        >
          <div class="template-thumb" :style="{ background: t.thumb }">
            <AppIcon :name="kind === 'bigscreen' ? 'dashboard' : 'chart'" class="thumb-icon" />
            <span v-if="selectedId === t.id" class="check-badge">
              <AppIcon name="check" />
            </span>
          </div>
          <div class="template-meta">
            <div class="template-name">{{ t.name }}</div>
            <div class="template-scene">{{ t.scene }}</div>
            <div class="template-desc">{{ t.desc }}</div>
          </div>
        </div>
      </div>

      <!-- ===== 空态 ===== -->
      <div v-else class="visual-empty">
        <p class="empty-title">还没有为项目配置{{ kind === 'bigscreen' ? '大屏' : '看板' }}</p>
        <button class="btn-outline-primary btn-sm" @click="selectedId = null">去选择模板</button>
      </div>

      <!-- ===== 选中模板操作 ===== -->
      <div v-if="selectedTemplate" class="template-actions">
        <div class="action-row">
          <span class="action-label">当前选择</span>
          <span class="action-value">{{ selectedTemplate.name }}</span>
        </div>
        <div class="action-row">
          <span class="action-label">设为默认</span>
          <el-switch v-model="asDefault" />
        </div>
        <div class="action-row">
          <button class="btn-default btn-sm" @click="preview">
            <AppIcon name="browse" class="btn-icon" />预览
          </button>
        </div>
      </div>

      <div class="visual-footer">
        <span class="foot-text">
          {{ kind === 'bigscreen' ? '大屏' : '看板' }}绑定项目后可从项目入口直接打开
        </span>
        <div class="foot-actions">
          <button class="btn-default" @click="$emit('update:visible', false)">取消</button>
          <button class="btn-primary" @click="save">保存</button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import AppIcon from '@/components/base/AppIcon.vue'
import { useProjectOpsStore } from '@/stores/project-ops'

/**
 * ProjectVisualDrawer.vue — 项目可视化抽屉
 *
 * 口径见 docs/项目管理/product-design.md §6.6、§7.2.5
 *   两个页签：大屏 / 看板；模板卡片（缩略图 + 名称 + 场景 + 描述）
 *   操作：预览、设为默认、底部保存；未配置时显示空态 +「去选择模板」
 *   P0 只做「选模板 + 绑定项目 + 预览」，不做自由搭建
 */

const props = defineProps<{
  visible: boolean
  projectId: string
}>()

const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>()

const store = useProjectOpsStore()

const kind = ref<'bigscreen' | 'dashboard'>('bigscreen')
const selectedId = ref<string | null>(null)
const asDefault = ref(false)

watch(
  () => props.visible,
  val => {
    if (!val) return
    const project = store.projectById(props.projectId)
    const bound = project?.visual[kind.value] ?? null
    selectedId.value = bound
    asDefault.value = !!bound
  },
)

watch(kind, () => {
  const project = store.projectById(props.projectId)
  const bound = project?.visual[kind.value] ?? null
  selectedId.value = bound
  asDefault.value = !!bound
})

const templates = computed(() => store.templates.filter(t => t.kind === kind.value))
const selectedTemplate = computed(() => store.templateById(selectedId.value))

function preview() {
  if (!selectedTemplate.value) {
    ElMessage.warning('请先选择模板')
    return
  }
  ElMessage.info(`预览「${selectedTemplate.value.name}」：P0 阶段为模板预览占位，暂未接入真实大屏渲染`)
}

function save() {
  store.setVisual(props.projectId, kind.value, selectedId.value)
  emit('update:visible', false)
  ElMessage.success('保存成功')
}
</script>

<style scoped>
.visual-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.visual-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border-default);
  padding-bottom: 8px;
}
.visual-tab {
  padding: 6px 18px;
  font-size: var(--font-small, 14px);
  color: var(--text-tertiary);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
}
.visual-tab.active {
  color: var(--accent-primary);
  background: var(--accent-primary10);
  font-weight: 500;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  max-height: 440px;
  overflow: auto;
  padding-right: 4px;
}
.template-card {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  cursor: pointer;
  transition: all .2s;
  background: var(--bg-card);
}
.template-card:hover { border-color: var(--accent-primary); }
.template-card.is-selected {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-primary10);
}
.template-thumb {
  position: relative;
  aspect-ratio: 16 / 9;
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb-icon { font-size: 30px; color: rgba(255, 255, 255, 0.85); }
.check-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #fff;
  background: var(--accent-primary);
}
.template-meta { padding: 10px 12px 12px; }
.template-name { font-size: var(--font-small, 14px); font-weight: 500; color: var(--text-primary); }
.template-scene { margin-top: 2px; font-size: 12px; color: var(--accent-primary); }
.template-desc { margin-top: 6px; font-size: 12px; color: var(--text-muted); line-height: 1.5; }

.visual-empty { padding: 60px 0; text-align: center; }
.empty-title { margin: 0 0 12px; font-size: var(--font-small, 14px); color: var(--text-muted); }

.template-actions {
  padding: 12px;
  background: var(--bg-sub-card, #FBFBFB);
  border-radius: var(--radius-sm, 6px);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.action-row { display: flex; align-items: center; gap: 12px; }
.action-label { width: 64px; font-size: 12px; color: var(--text-muted); }
.action-value { font-size: var(--font-small, 14px); color: var(--text-primary); }

.visual-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-default);
}
.foot-text { font-size: var(--font-small, 14px); color: var(--text-tertiary); }
.foot-actions { display: flex; gap: 8px; }

.btn-outline-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 4px 12px;
  border-radius: var(--radius-sm, 6px);
  font-size: var(--font-small, 14px);
  background: var(--info-bg);
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
  cursor: pointer;
}
.btn-sm { height: 30px; }
.btn-icon { font-size: 13px; }
</style>
