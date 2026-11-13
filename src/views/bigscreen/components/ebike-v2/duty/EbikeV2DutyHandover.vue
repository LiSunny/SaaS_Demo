<template>
  <!-- 页内浮层：覆盖顶栏以下的大屏区域，不跳转路由 -->
  <Teleport to="body">
    <div class="handover" @click.self="emit('close')">
      <section class="handover__panel" role="dialog" aria-label="交接班">
        <!-- ===== 标题栏 ===== -->
        <header class="handover__bar">
          <span class="handover__title">交接班</span>
          <button type="button" class="handover__close" aria-label="关闭" @click="emit('close')">
            ✕
          </button>
        </header>

        <!-- ===== 班次信息 ===== -->
        <div class="handover__info">
          <div v-for="f in fields" :key="f.label" class="handover__field">
            <span class="handover__label">{{ f.label }}</span>
            <span class="handover__value">{{ f.value }}</span>
          </div>
        </div>

        <!-- ===== 未处置事项 ===== -->
        <div class="handover__list-head">
          <span class="handover__section-title">未处置事项</span>
          <span class="handover__count">共 {{ events.length }} 条</span>
        </div>

        <div class="handover__list">
          <p v-if="!events.length" class="handover__empty">当前范围内没有待处置事项，可直接交接班</p>
          <div v-for="e in events" :key="e.id" class="handover__row">
            <span class="handover__badge">{{ e.category }}</span>
            <div class="handover__row-text">
              <span class="handover__row-title">{{ e.source }} · {{ e.point }}</span>
              <span class="handover__row-meta">{{ e.location }} · {{ formatTime(e.latestAt) }}</span>
            </div>
            <button type="button" class="handover__verify" @click="emit('confirm', e.id)">
              核实
            </button>
          </div>
        </div>

        <!-- ===== 底部动作 ===== -->
        <footer class="handover__foot">
          <span class="handover__foot-note">
            今日已核实 {{ confirmedToday }} 条
          </span>
          <button type="button" class="handover__ghost" @click="emit('close')">取消</button>
          <button type="button" class="handover__primary" @click="emit('close')">确认交接</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * 实时警情页 · 交接班浮层
 *
 * 大屏不跳路由（项目约定：大屏内的功能入口用页内浮层），
 * 交接班是"把未处置事项交代给下一班"的动作，所以这里把待核实警情直接列出来，
 * 每条可单独核实；核实后从待核实队列移出，KPI 的「今日已核实事件」随之 +1。
 *
 * 浮层用 Teleport 挂在 body 上：页面根节点的 --fire-* 主题变量与 --min-scale
 * 缩放因子都拿不到（Teleport 后脱离作用域，var() 会静默回退成继承色），
 * 因此这里的色值直接引 SCSS 真源、字号写固定 px。
 */
import { onMounted, onUnmounted } from 'vue'
import { formatTime, type DutyEvent } from './duty-data'

const props = defineProps<{
  /** 待处置（未核实）事项 */
  events: DutyEvent[]
  /** 今日已核实条数 */
  confirmedToday: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', id: string): void
}>()

/** 班次信息：班次 / 交班人取平台值守报告同源记录，接班人为当前值班员 */
const fields = [
  { label: '班次', value: '消控室一班 · 白班' },
  { label: '交班人', value: '王志刚' },
  { label: '接班人', value: '王世豪' },
  { label: '交接时间', value: '2026-11-03 08:00' },
]

/** Esc 关闭浮层 */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../fire/fire-common.scss" as *;

/* 浮层：顶栏之下铺满，遮住大屏内容 */
.handover {
  position: fixed;
  top: vh(68);
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10002; /* 高于悬浮小尼机器人（9999）与浮动聊天层（9998） */
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 13, 52, 0.72);
}

/* 面板本体 */
.handover__panel {
  width: vw(980);
  max-height: vh(760);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 152, 230, 0.16);
  border-radius: vw(8);
  background: rgba(0, 44, 94, 0.98);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

/* ===== 标题栏 ===== */
.handover__bar {
  flex-shrink: 0;
  height: vh(44);
  display: flex;
  align-items: center;
  padding: 0 vw(16);
  background: linear-gradient(90deg, rgba(6, 64, 110, 1) 0%, rgba(6, 64, 110, 0) 100%);
  border-bottom: 1px solid rgba(128, 209, 253, 0.15);
}

.handover__title {
  font-family: 'SectionTitleHans', 'PingFang SC', sans-serif;
  font-weight: 900;
  font-size: 18px;
  color: #a2caff;
  line-height: 1;
}

.handover__close {
  margin-left: auto;
  width: vw(28);
  height: vh(28);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(120, 190, 255, 0.24);
  border-radius: vw(3);
  background: rgba(0, 68, 130, 0.45);
  color: #cfe4ff;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: rgba(0, 92, 168, 0.7);
  }
}

/* ===== 班次信息 ===== */
.handover__info {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: vw(10);
  padding: vw(16) vw(16) vw(10);
}

.handover__field {
  display: flex;
  flex-direction: column;
  gap: vh(4);
  padding: vh(8) vw(10);
  border: 1px solid rgba(120, 190, 255, 0.16);
  border-radius: vw(4);
  background: rgba(0, 31, 60, 0.5);
}

.handover__label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: $fire-text-dim;
  line-height: 1.2;
}

.handover__value {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 15px;
  color: $fire-text-title;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 未处置事项 ===== */
.handover__list-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: vh(6) vw(16);
}

.handover__section-title {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 15px;
  color: $fire-text-title;
  line-height: 1.2;
}

.handover__count {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: $fire-text-dim;
  line-height: 1.2;
}

.handover__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 vw(16) vw(8);
}

.handover__empty {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: $fire-text-dim;
  text-align: center;
  padding: vh(40) 0;
  margin: 0;
}

.handover__row {
  display: flex;
  align-items: center;
  gap: vw(10);
  padding: vh(8) vw(10);
  margin-bottom: vh(6);
  border: 1px solid rgba(120, 190, 255, 0.14);
  border-radius: vw(4);
  background: rgba(0, 31, 60, 0.5);
}

/* 类别角标：全页只留一个红 */
.handover__badge {
  flex-shrink: 0;
  padding: vh(2) vw(8);
  border: 1px solid $fire-anomaly;
  border-radius: vw(4);
  background: rgba(255, 128, 128, 0.16);
  color: $fire-anomaly;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  line-height: 1.2;
  white-space: nowrap;
}

.handover__row-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(3);
}

.handover__row-title {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 15px;
  color: $fire-text-title;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.handover__row-meta {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: $fire-text-sub;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.handover__verify {
  flex-shrink: 0;
  height: vh(28);
  padding: 0 vw(14);
  border: 1px solid rgba(0, 134, 228, 0.9);
  border-radius: vw(3);
  background: rgba(0, 134, 228, 0.9);
  color: #ffffff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: rgba(0, 152, 230, 0.95);
  }
}

/* ===== 底部动作 ===== */
.handover__foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(10);
  padding: vh(10) vw(16);
  border-top: 1px solid rgba(120, 190, 255, 0.16);
}

.handover__foot-note {
  flex: 1;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: $fire-text-dim;
}

.handover__ghost {
  height: vh(32);
  padding: 0 vw(18);
  border: 1px solid rgba(120, 190, 255, 0.28);
  border-radius: vw(4);
  background: rgba(0, 68, 130, 0.45);
  color: $fire-text-label;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  cursor: pointer;
}

.handover__primary {
  height: vh(32);
  padding: 0 vw(22);
  border: none;
  border-radius: vw(4);
  background: rgba(0, 134, 228, 0.9);
  color: #ffffff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 15px;
  cursor: pointer;

  &:hover {
    background: rgba(0, 152, 230, 0.95);
  }
}
</style>
