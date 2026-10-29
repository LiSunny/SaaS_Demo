<template>
  <SubsystemMonitorLayout
    title="消防水系统"
    :cards="cards"
    :tabs="TABS"
    :scene="FIREWATER_SCENE"
    :alarm-records="alarmRecords"
    :alarm-unhandled="alarmUnhandled"
    alarm-label="火警"
    @handle-alarm="markHandled"
    @control="handleControl"
    @config="onConfig"
  />
</template>

<script setup lang="ts">
/**
 * 消防水系统监测（设备设施管理 › 运行监控）
 *
 * 版式与下钻逻辑都在公共骨架 `SubsystemMonitorLayout` 里，
 * 与气体灭火系统监测共用同一套组件；本页只负责消防水自己的数据与口径：
 *   - 组态画面与图元绑定：config/firewater-scene.ts
 *   - 报警记录：stores/firewater-alarm.ts
 *   - 设备档案：config/subsystem-profiles.ts 的 pipeline
 */
import { computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSubsystemStore } from '@/stores/subsystem'
import { useFirewaterAlarmStore } from '@/stores/firewater-alarm'
import type { PointDef } from '@/types/subsystem'
import type { SubsystemTabKey } from '@/types/subsystem-scene'
import { computeFireWaterCards, FIREWATER_SCENE } from '@/config/firewater-scene'
import SubsystemMonitorLayout from '@/components/subsystem/SubsystemMonitorLayout.vue'

const store = useSubsystemStore()
const { points, refreshSeq } = storeToRefs(store)
const { getRuntime, loadSubsystem, stopTimer } = store

const alarm = useFirewaterAlarmStore()
const { records: alarmRecords, unhandledCount: alarmUnhandled } = storeToRefs(alarm)

const TABS: Array<{ key: SubsystemTabKey; label: string }> = [
  { key: 'overview', label: '系统总览' },
  { key: 'alarm', label: '报警记录' },
  { key: 'ledger', label: '设备台帐' },
]

const cards = computed(() => computeFireWaterCards(points.value, getRuntime))

function markHandled(id: string): void {
  alarm.markHandled(id)
}

function onConfig(p: PointDef): void {
  ElMessage.info(`「${p.code}」的设备配置能力尚未接入`)
}

async function handleControl({ point, action }: { point: PointDef; action: string }): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确认对 ${point.code}（${point.location}）下发「${action === 'start' ? '远程启动' : '远程停止'}」指令？该操作将真实动作于消防设施。`,
      '联动控制二次确认',
      { type: 'warning', confirmButtonText: '确认下发', cancelButtonText: '取消' },
    )
    ElMessage.success(`指令已下发：${point.code} ${action === 'start' ? '启动' : '停止'}`)
  } catch {
    // 用户取消
  }
}

// ===== 生命周期 =====

onMounted(() => {
  loadSubsystem('pipeline')
  /**
   * 立即播种一次报警记录，不等首轮刷新。
   *
   * 刷新周期 3s，若只靠 refreshSeq 驱动，切到「报警记录」的前 3 秒是空表，
   * 值班员会以为"没有报警"而不是"数据还没到"。
   */
  alarm.sync(points.value, getRuntime)
})

/**
 * 报警记录与点位状态同源：每轮刷新后同步一次。
 *
 * runtime 是 keyed 的 reactive Map，内容变而引用不变，watch(runtime) 不触发，
 * 所以用 store 的刷新序号驱动。跃迁判定在 store 内做（正常 → 报警/故障 才记一条）。
 */
watch(refreshSeq, () => {
  alarm.sync(points.value, getRuntime)
})

onBeforeUnmount(() => stopTimer())
</script>
