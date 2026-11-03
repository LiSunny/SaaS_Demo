<template>
  <EbikeV2Card title="实时警情">
    <div class="ma">
      <div v-for="r in rows" :key="r.key" class="ma__row">
        <div class="ma__row-head">
          <span class="ma__lead">
            <span class="ma__badge">{{ r.badge }}</span>
            <span class="ma__title">{{ r.title }}</span>
          </span>
          <span class="ma__time">{{ r.time }}</span>
        </div>
        <span class="ma__loc">{{ r.location }}</span>
      </div>

      <span v-if="!rows.length" class="ma__empty">该系统暂无异常点位</span>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 实时警情（系统监测页右列上卡）
 *
 * 版式按 Figma「智能安全管控平台/系统监测」节点 117:22523：
 *   每条两行：① [胶囊角标 + 故障类型] …… 右对齐完整时间戳 ② 位置
 *   行间 1px 虚线（#234972）
 *
 * 数据来自实时设备数据（monitor-data.ts 的 monitorAlarmsOf）：
 *   角标类别 = 设备当前状态（fault → 故障；alarm → 预警；offline / shielded 同理）
 *   标题     = 设备编号（现场铭牌号）—— 值守员按编号找人
 *   位置     = 设备类型 · 位置描述
 *   时间戳   = 该设备最近一次上报时间
 *
 * 角标配色沿用大屏口径：全页角标只留一个红（#FF8080），档位由角标文案承担。
 * 设计稿把「故障」标橙（#FFA600），与该口径冲突 —— 理由见 fire-common.scss 顶部说明。
 */
import EbikeV2Card from './EbikeV2Card.vue'
import type { MonitorAlarmRow } from './monitor-data'

const props = withDefaults(
  defineProps<{
    /** 警情行（由父组件从实时设备数据派生） */
    rows?: MonitorAlarmRow[]
  }>(),
  { rows: () => [] },
)
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./fire/fire-common.scss" as fire;

.ma {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: vh(16) vw(16);
  overflow: hidden;
}

/* 每条两行；行间虚线（设计稿 #234972，1px 2-2 虚线） */
.ma__row {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: vh(4);
  padding: vh(4) 0;
  border-bottom: 1px dashed #234972;
}

.ma__row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: vw(8);
  min-width: 0;
}

/* 角标 + 故障类型 */
.ma__lead {
  display: flex;
  align-items: center;
  gap: vw(8);
  min-width: 0;
}

/* 胶囊角标：全页角标只留一个红，档位由文案承担 */
.ma__badge {
  @include fire.fire-badge(255, 128, 128, 0.16, 0.2);
}

.ma__title {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1.3;
  color: #96bee9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ma__time {
  flex-shrink: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  line-height: 1.3;
  color: #96bee9;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* 位置（设备名）：比标题弱一级 */
.ma__loc {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(15 * var(--min-scale)), 15px);
  line-height: 1.3;
  color: #96bee9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 空态 */
.ma__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: var(--fire-text-dim);
}
</style>
