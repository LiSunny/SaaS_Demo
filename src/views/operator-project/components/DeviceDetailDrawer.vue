<template>
  <el-drawer
    :model-value="visible"
    title="设备详情"
    size="520px"
    direction="rtl"
    class="device-detail-drawer"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div v-if="device" class="drawer-body">
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">设备名称</span>
          <span class="detail-value">{{ device.name }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">设备类型</span>
          <span class="detail-value">{{ device.type }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">设备编码</span>
          <span class="detail-value">{{ device.code }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">在线状态</span>
          <span class="detail-value">
            <span class="status-tag" :class="device.online ? 'is-online' : 'is-offline'">
              {{ device.online ? '在线' : '离线' }}
            </span>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">所属单位</span>
          <span class="detail-value">{{ unitName }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">归属层级</span>
          <span class="detail-value">{{ nodePath }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">安装位置</span>
          <span class="detail-value">{{ device.location || '—' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">接入时间</span>
          <span class="detail-value">{{ device.connectedAt }}</span>
        </div>
      </div>

      <div v-if="device.remark" class="remark-block">
        <span class="detail-label">备注</span>
        <p class="remark-text">{{ device.remark }}</p>
      </div>

      <div class="drawer-footer-bar">
        <span class="foot-text">设备归属单位不可在详情中修改</span>
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
 * DeviceDetailDrawer.vue — 项目内设备详情（只读）
 *
 * 口径见 docs/项目管理/product-design.md §7.2.4（操作列含「查看」）
 *   只读展示设备基础信息 + 归属单位 + 归属层级
 */

const props = defineProps<{
  visible: boolean
  projectId: string
  deviceId: string | null
}>()

const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>()

const store = useProjectOpsStore()

const device = computed(
  () => store.devices.find(d => d.id === props.deviceId && d.projectId === props.projectId) ?? null,
)

const unitName = computed(() => {
  const d = device.value
  if (!d) return '—'
  return store.units.find(u => u.id === d.unitId)?.name ?? '—'
})

const nodePath = computed(() => {
  const d = device.value
  if (!d) return '—'
  const link = store.projectUnits.find(pu => pu.projectId === props.projectId && pu.unitId === d.unitId)
  return store.nodePathText(link?.nodeId ?? null)
})
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

.status-tag {
  display: inline-flex;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 4px;
}
.status-tag.is-online { color: var(--success-text); background: var(--success-bg); }
.status-tag.is-offline { color: var(--danger-text); background: var(--danger-bg); }

.remark-block {
  padding: 12px 16px;
  background: var(--bg-sub-card, #FBFBFB);
  border-radius: var(--radius-sm, 6px);
}
.remark-text {
  margin: 6px 0 0;
  font-size: var(--font-small, 14px);
  color: var(--text-secondary);
  line-height: 1.6;
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
.foot-actions { display: flex; gap: 8px; }
</style>
