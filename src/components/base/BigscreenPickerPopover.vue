<!--
  BigscreenPickerPopover.vue — 多大屏选择浮层

  关键设计：trigger="click" + reference slot（按钮必须放在 reference 里），否则
  Element Plus 找不到锚点 → 弹窗飞到屏幕左上角。

  数据：父组件传入 list，popver show 时由父组件 fetch（通过 @show 事件通知）
  反馈：用户点击某张大屏时 emit('select', item)，由父组件负责跳转
  布局：单列水平卡（缩略图左 120px + 名称/徽章/场景右），适合 2-5 个大屏
  位置：placement=bottom（弹窗中心对准 reference 底部中心）
-->
<template>
  <el-popover
    v-model:visible="visible"
    :width="320"
    placement="bottom"
    trigger="click"
    :show-arrow="false"
    :teleported="true"
    @show="emit('show')"
  >
    <template #reference>
      <slot name="reference" />
    </template>

    <div class="bs-picker">
      <div class="bs-picker-header">
        <span class="bs-picker-title">选择大屏</span>
        <span class="bs-picker-count">共 {{ list.length }} 个可用大屏</span>
      </div>

      <div v-if="loading" class="bs-picker-loading">加载中…</div>
      <div v-else-if="list.length === 0" class="bs-picker-empty">暂无可用大屏</div>
      <div v-else class="bs-picker-list">
        <button
          v-for="bs in list"
          :key="bs.id"
          class="bs-picker-card"
          @click="handleSelect(bs)"
        >
          <div class="bs-picker-thumb">
            <img v-if="bs.thumbnail" :src="bs.thumbnail" :alt="bs.name" />
            <AppIcon v-else name="bigscreen" class="bs-picker-thumb-placeholder" />
          </div>
          <div class="bs-picker-info">
            <div class="bs-picker-name-row">
              <span class="bs-picker-name">{{ bs.name }}</span>
              <span v-if="bs.isDefault" class="bs-picker-default-badge">默认</span>
            </div>
            <div class="bs-picker-scenario">{{ bs.scenario || '未设置场景' }}</div>
          </div>
        </button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import type { UserBigscreenItem } from '@/types/bigscreen'

const props = defineProps<{
  /** popover 显隐（v-model） */
  modelValue: boolean
  /** 大屏列表（父组件负责 fetch 与 0/1/≥2 分流） */
  list: UserBigscreenItem[]
  /** 是否正在 fetch（控制 loading 占位） */
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'show':              []
  'select':            [item: UserBigscreenItem]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

/** 选中后：emit select（父组件负责跳转）+ 关闭浮层 */
function handleSelect(item: UserBigscreenItem) {
  emit('select', item)
  visible.value = false
}
</script>

<style scoped>
.bs-picker {
  padding: var(--spacing-md, 12px);
}

/* ===== 头部 ===== */
.bs-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--spacing-md, 12px);
}
.bs-picker-title {
  font-size: var(--font-h5, 14px);
  font-weight: 600;
  color: var(--text-primary);
}
.bs-picker-count {
  font-size: var(--font-xs, 12px);
  color: var(--text-tertiary);
}

/* ===== loading / empty 状态 ===== */
.bs-picker-loading,
.bs-picker-empty {
  padding: var(--spacing-xxl, 24px);
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--font-small, 14px);
}

/* ===== 列表（垂直堆叠） ===== */
.bs-picker-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 8px);
  max-height: 360px;
  overflow-y: auto;
}

/* ===== 单张卡（水平布局：缩略图左 + 信息右） ===== */
.bs-picker-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 12px);
  padding: var(--spacing-sm, 8px);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  overflow: hidden;
  width: 100%;
  transition: border-color .15s, box-shadow .15s, transform .15s;
}
.bs-picker-card:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, .08);
  transform: translateY(-1px);
}

/* ===== 缩略图：固定 120px 宽，16:9 比例 ===== */
.bs-picker-thumb {
  flex-shrink: 0;
  width: 120px;
  aspect-ratio: 16 / 9;
  background: var(--bg-main);
  border-radius: var(--radius-sm, 4px);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bs-picker-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.bs-picker-thumb-placeholder {
  width: 32px;
  height: 32px;
  color: var(--text-tertiary);
}

/* ===== 信息区 ===== */
.bs-picker-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ===== 名称行（名称 + 默认徽章） ===== */
.bs-picker-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.bs-picker-name {
  font-size: var(--font-small, 13px);
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}
.bs-picker-default-badge {
  flex-shrink: 0;
  padding: 1px 6px;
  font-size: 10px;
  background: var(--accent-primary);
  color: #fff;
  border-radius: var(--radius-sm, 3px);
  line-height: 1.4;
}

/* ===== 场景 ===== */
.bs-picker-scenario {
  font-size: var(--font-xs, 12px);
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>