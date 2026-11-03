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
 * 数据来自画面的绑定点位（scene-points.ts）：
 *   角标类别 = 绑定声明的状态类（is-fault → 故障；is-over / is-alarm / is-flow → 预警）
 *   故障类型 = 点位名（消防泵组的「故障」点、管道段的「渗漏故障」点 …）
 *   位置     = 画面图元标签（设备名）—— 平台画面暂无逐点位的房间位置，先给设备名
 *   时间戳   = 按系统名做确定性随机（同一系统刷新页面看到同一批警情）
 *
 * 角标配色沿用大屏口径：全页角标只留一个红（#FF8080），档位由角标文案承担。
 * 设计稿把「故障」标橙（#FFA600），与该口径冲突 —— 理由见 fire-common.scss 顶部说明。
 */
import { computed } from 'vue'
import EbikeV2Card from './EbikeV2Card.vue'
import { rngOf, seedOf } from './seeded-random'
import {
  FAULT_STATE_CLASSES,
  hasStateClass,
  isAbnormalSource,
  pointSourcesOf,
} from './scene-points'
import type { SceneConfig } from '@/types/scene-config'

const props = withDefaults(
  defineProps<{
    /** 当前画面 */
    scene?: SceneConfig | null
    /** 当前系统名（决定演示时间戳的种子） */
    systemName?: string
  }>(),
  { scene: null, systemName: '本系统' },
)

/** 卡片可见条数：与设计稿一致（4 条，下面留白） */
const VISIBLE = 4

const pad = (n: number): string => String(n).padStart(2, '0')

/** 时刻文本：2026-11-03 14:22 */
function fmt(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * 警情条目
 *
 * 每个异常点位出一条警情；同一设备的多个异常点位各占一条。
 * 时间为演示值（后端暂无实时告警接口），按系统名做种子 → 刷新页面不跳。
 */
const rows = computed(() => {
  const sources = pointSourcesOf(props.scene).filter(isAbnormalSource)
  if (!sources.length) return []

  const rnd = rngOf(seedOf(`${props.systemName}-${props.scene?.id ?? ''}`))
  const base = Date.now()

  return sources.slice(0, VISIBLE).map((s, i) => {
    // 时间倒序、间隔不等，避免整点齐刷刷
    const ago = (i * 37 + Math.floor(rnd() * 26) + 3) * 60_000
    const fault = hasStateClass(s.onClasses, FAULT_STATE_CLASSES)
    return {
      key: `${s.nodeId}-${s.point}-${i}`,
      badge: fault ? '故障' : '预警',
      title: s.point,
      time: fmt(base - ago),
      location: s.device,
    }
  })
})
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
