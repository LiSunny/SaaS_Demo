<template>
  <el-drawer
    :model-value="visible"
    title="单位详情"
    size="640px"
    direction="rtl"
    class="unit-detail-drawer"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div v-if="unit" class="drawer-body">
      <!-- ===== 基础信息 ===== -->
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">单位名称</span>
          <span class="detail-value">{{ unit.name }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">单位性质</span>
          <span class="detail-value">{{ unit.nature }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">所属区域</span>
          <span class="detail-value">{{ unit.region || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">归属层级</span>
          <span class="detail-value">{{ nodePathText(unit.nodeId) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">负责人</span>
          <span class="detail-value">{{ unit.contact || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">联系方式</span>
          <span class="detail-value">{{ unit.phone || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">详细地址</span>
          <span class="detail-value">{{ unit.address || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">加入项目</span>
          <span class="detail-value">{{ otherProjects.length ? otherProjects.join('、') : '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">添加日期</span>
          <span class="detail-value">{{ unit.addedAt }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">操作人</span>
          <span class="detail-value">{{ unit.operator }}</span>
        </div>
      </div>

      <div v-if="unit.tags.length" class="tag-row">
        <span v-for="t in unit.tags" :key="t" class="unit-tag">{{ t }}</span>
      </div>

      <!-- ===== 设备列表（只读） ===== -->
      <div class="section">
        <h3 class="section-title">设备列表（{{ devices.length }}）</h3>
        <div v-if="devices.length" class="table-wrap device-table">
          <table class="fi-table">
            <thead>
              <tr class="fi-thead-tr">
                <th class="fi-th col-name"><span>设备名称</span></th>
                <th class="fi-th col-type"><span>类型</span></th>
                <th class="fi-th col-code"><span>编码</span></th>
                <th class="fi-th col-status"><span>状态</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in devices" :key="d.id" class="fi-tbody-tr">
                <td class="fi-td col-name">{{ d.name }}</td>
                <td class="fi-td col-type">{{ d.type }}</td>
                <td class="fi-td col-code">{{ d.code }}</td>
                <td class="fi-td col-status">
                  <span class="status-tag" :class="d.online ? 'is-online' : 'is-offline'">
                    {{ d.online ? '在线' : '离线' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="empty-tip">该单位下还没有设备</p>
      </div>

      <div class="drawer-footer-bar">
        <span class="foot-text">基础信息在台账中维护，项目内只读</span>
        <div class="foot-actions">
          <button class="btn-default" @click="$emit('update:visible', false)">关闭</button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProjectOpsStore } from '@/stores/project-ops'

/**
 * UnitDetailDrawer.vue — 项目内单位详情（只读）
 *
 * 口径见 docs/项目管理/product-design.md §6.4.4
 *   抽屉展示单位基础信息 + 该单位下设备列表（只读）
 *   基础信息给「去台账编辑」链接
 */

const props = defineProps<{
  visible: boolean
  projectId: string
  unitId: string | null
}>()

const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>()

const store = useProjectOpsStore()

const unit = computed(() => store.unitRows(props.projectId).find(r => r.id === props.unitId) ?? null)

const devices = computed(() =>
  props.unitId ? store.devices.filter(d => d.projectId === props.projectId && d.unitId === props.unitId) : [],
)

const otherProjects = computed(() => {
  if (!props.unitId) return []
  return store
    .projectUnits.filter(pu => pu.unitId === props.unitId && pu.projectId !== props.projectId)
    .map(pu => store.projectById(pu.projectId)?.name ?? '')
    .filter(Boolean)
})

function nodePathText(nodeId: string | null): string {
  return store.nodePathText(nodeId)
}
</script>

<style scoped>
.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 20px;
  padding: 16px;
  background: var(--bg-sub-card, #FBFBFB);
  border-radius: var(--radius-sm, 6px);
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

.tag-row { display: flex; flex-wrap: wrap; gap: 6px; }
.unit-tag {
  padding: 2px 8px;
  font-size: 12px;
  color: var(--accent-primary);
  background: var(--info-bg);
  border-radius: 4px;
}

.section-title {
  margin: 0 0 10px;
  font-size: var(--font-small, 14px);
  font-weight: 600;
  color: var(--text-secondary);
}
.device-table { max-height: 300px; overflow: auto; border: 1px solid var(--border-default); border-radius: var(--radius-sm, 6px); }
.col-name { min-width: 160px; }
.col-type { width: 90px; }
.col-code { width: 130px; }
.col-status { width: 80px; }

.status-tag {
  display: inline-flex;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 4px;
}
.status-tag.is-online { color: var(--success-text); background: var(--success-bg); }
.status-tag.is-offline { color: var(--danger-text); background: var(--danger-bg); }

.empty-tip {
  margin: 0;
  padding: 20px 0;
  text-align: center;
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
}

.drawer-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-default);
}
.foot-text { font-size: var(--font-small, 14px); color: var(--text-tertiary); }
</style>
