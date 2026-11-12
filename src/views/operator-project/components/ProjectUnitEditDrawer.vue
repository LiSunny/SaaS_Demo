<template>
  <el-drawer
    :model-value="visible"
    title="编辑项目内信息"
    size="520px"
    direction="rtl"
    class="unit-edit-drawer"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div v-if="row" class="drawer-body">
      <!-- ===== 基础信息（只读，来源台账） ===== -->
      <div class="base-block">
        <div class="base-head">
          <span class="base-title">基础信息</span>
          <button class="btn-link base-link" @click="goLedger">去台账编辑</button>
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">单位名称</span>
            <span class="detail-value">{{ row.name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">单位性质</span>
            <span class="detail-value">{{ row.nature }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">负责人</span>
            <span class="detail-value">{{ row.contact || '—' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">联系方式</span>
            <span class="detail-value">{{ row.phone || '—' }}</span>
          </div>
        </div>
        <p class="base-tip">基础信息在台账中维护，项目内只读。</p>
      </div>

      <!-- ===== 项目级字段（可编辑） ===== -->
      <div class="form-row">
        <div class="form-label"><span class="label-text">项目内标签</span></div>
        <div class="form-control">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="回车创建标签"
            class="w-full"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-label"><span class="label-text">项目内联系人</span></div>
        <div class="form-control">
          <el-input v-model="form.contact" placeholder="本项目内的对接人" maxlength="20" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-label"><span class="label-text">项目内备注</span></div>
        <div class="form-control">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="备注" maxlength="200" />
        </div>
      </div>

      <div class="drawer-footer-bar">
        <span class="foot-text">只修改项目级字段，台账基础信息不受影响</span>
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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus/es/components/message/index.mjs'
import 'element-plus/es/components/message/style/css.mjs'
import { useProjectOpsStore } from '@/stores/project-ops'
import type { ProjectUnitRow } from '@/types/project-ops'

/**
 * ProjectUnitEditDrawer.vue — 项目内单位编辑抽屉
 *
 * 口径见 docs/项目管理/product-design.md §6.4.4、§8.2
 *   编辑范围：项目内只改项目级字段（标签 / 备注 / 项目内联系人）
 *   基础信息给「去台账编辑」链接，不在本抽屉内改
 */

const props = defineProps<{
  visible: boolean
  projectId: string
  unitId: string | null
}>()

const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>()

const router = useRouter()
const store = useProjectOpsStore()

const row = computed<ProjectUnitRow | null>(
  () => store.unitRows(props.projectId).find(r => r.id === props.unitId) ?? null,
)

const form = ref({ tags: [] as string[], contact: '', remark: '' })

watch(
  () => [props.visible, props.unitId],
  () => {
    if (!props.visible) return
    const r = row.value
    form.value = {
      tags: r ? [...r.projectTags] : [],
      contact: r?.projectContact ?? '',
      remark: r?.projectRemark ?? '',
    }
  },
)

/** 台账路由按单位类型区分（design.md §4.1） */
function goLedger() {
  const r = row.value
  if (!r) return
  const route =
    r.kind === 'family' ? '/managed/families' : r.kind === 'venue' ? '/managed/small-venues' : '/managed/key-units'
  emit('update:visible', false)
  router.push(route)
}

function save() {
  if (!props.unitId) return
  const r = store.updateProjectUnit(props.projectId, props.unitId, {
    tags: form.value.tags,
    contact: form.value.contact,
    remark: form.value.remark,
  })
  if (!r.ok) {
    ElMessage.warning(r.msg)
    return
  }
  ElMessage.success('保存成功')
  emit('update:visible', false)
}
</script>

<style scoped>
.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.base-block {
  padding: 14px;
  background: var(--bg-sub-card, #FBFBFB);
  border-radius: var(--radius-sm, 6px);
}
.base-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.base-title {
  font-size: var(--font-small, 14px);
  font-weight: 600;
  color: var(--text-secondary);
}
.base-link { font-size: var(--font-small, 14px); }

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 20px;
}
.detail-item { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.detail-label { font-size: 12px; color: var(--text-muted); }
.detail-value {
  font-size: var(--font-small, 14px);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.base-tip {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

.form-row { display: flex; align-items: center; gap: 16px; min-height: 36px; }
.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  width: 110px;
  justify-content: flex-end;
}
.label-text { font-size: var(--font-body, 16px); font-weight: 400; color: var(--text-tertiary); white-space: nowrap; }
.form-control { flex: 1; min-width: 0; position: relative; }
.w-full { width: 100% !important; }

.drawer-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-default);
}
.foot-text { font-size: var(--font-small, 14px); color: var(--text-tertiary); }
.foot-actions { display: flex; gap: 8px; }
</style>
