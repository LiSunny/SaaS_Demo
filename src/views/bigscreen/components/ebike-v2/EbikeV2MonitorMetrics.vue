<template>
  <section class="mm">
    <!-- ===== 当前系统（设计稿 117:22647 的左段 #127:324）===== -->
    <div ref="systemEl" class="mm__system">
      <div class="mm__system-text">
        <span class="mm__system-label">当前系统</span>
        <div class="mm__system-row">
          <span class="mm__system-name">{{ currentName }}</span>
          <button
            type="button"
            class="mm__system-toggle"
            :aria-expanded="open"
            aria-haspopup="listbox"
            title="切换系统"
            @click="toggle"
          >
            <img :src="caretDown" alt="" />
          </button>
        </div>
      </div>

      <!-- 下拉：系统清单（点击外部收起）。
           Teleport 到 body：指标条带 backdrop-filter，带滤镜的祖先会把溢出的
           子元素裁掉（滤镜区域 = 元素边框盒）—— 留在条内则下拉只剩一条缝。 -->
      <Teleport to="body">
        <Transition name="mm-drop">
          <ul
            v-if="open"
            class="mm__menu"
            role="listbox"
            aria-label="系统切换"
            :style="menuStyle"
          >
            <li v-for="s in systems" :key="s.key">
              <button
                type="button"
                class="mm__menu-item"
                :class="{ 'is-active': s.key === systemKey }"
                role="option"
                :aria-selected="s.key === systemKey"
                @click="select(s.key)"
              >
                {{ s.name }}
              </button>
            </li>
          </ul>
        </Transition>
      </Teleport>
    </div>

    <!-- 分隔线（设计稿 #117:22655） -->
    <span class="mm__divider" />

    <!-- ===== 四项指标（设计稿 #117:22656）===== -->
    <div class="mm__items">
      <div v-for="m in metrics" :key="m.key" class="mm__item">
        <span class="mm__icon">
          <img :src="m.icon" alt="" />
        </span>
        <div class="mm__text">
          <span class="mm__label">{{ m.label }}</span>
          <span class="mm__value" :style="{ color: m.color }">{{ m.value }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * 设备检测指标概览（系统监测页顶部横条）
 *
 * 版式按 Figma「智能安全管控平台/系统监测」节点 117:22647：
 *   左「当前系统」选择框（377 宽）→ 1px 竖分隔线 → 四项指标等分铺满右侧。
 * 指标项 = [56×56 圆角图标框 + 右侧上下两行（指标名 18px / 数值 32px）]，
 * 数值颜色与图标同色（设计稿：设备总数 #A2CAFF、故障 #FFA600、屏蔽 #47FFFF、预警 #FF8A00）。
 *
 * 图标用 Figma 导出的原始素材（节点 125:336 / 125:342 / 125:345 / 125:339），
 * 不自绘 —— 自绘会丢掉那层线宽与配色。
 *
 * 四项计数全部来自平台真值（见 scene-points.ts 的 sceneMetricsOf）：
 * 设备总数 = 画面图元数；故障 / 屏蔽 / 预警 = 画面绑定点位声明的状态类计数。
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import caretDown from '@/assets/bigscreen/ebike-v2/monitor/system-select-down.svg'
import iconTotal from '@/assets/bigscreen/ebike-v2/monitor/metric-icon-cpu.svg'
import iconFault from '@/assets/bigscreen/ebike-v2/monitor/metric-icon-alert-circle.svg'
import iconShield from '@/assets/bigscreen/ebike-v2/monitor/metric-icon-eye-off.svg'
import iconWarn from '@/assets/bigscreen/ebike-v2/monitor/metric-icon-bell.svg'
import { sceneMetricsOf, type SceneMetrics } from './scene-points'
import type { SceneConfig } from '@/types/scene-config'

export interface MonitorSystem {
  key: string
  name: string
}

const props = withDefaults(
  defineProps<{
    /** 可选系统清单 */
    systems?: MonitorSystem[]
    /** 当前系统键 */
    systemKey?: string
    /** 当前画面（指标计数的真值来源） */
    scene?: SceneConfig | null
  }>(),
  { systems: () => [], systemKey: '', scene: null },
)

const emit = defineEmits<{ (e: 'update:systemKey', key: string): void }>()

/* ============================================================
 * 指标
 * ============================================================ */

const metrics = computed(() => {
  const m: SceneMetrics = sceneMetricsOf(props.scene)
  return [
    {
      key: 'total',
      label: '设备总数',
      value: m.total.toLocaleString('en-US'),
      icon: iconTotal,
      color: '#a2caff',
    },
    { key: 'fault', label: '故障', value: String(m.fault), icon: iconFault, color: '#ffa600' },
    { key: 'shield', label: '屏蔽', value: String(m.shield), icon: iconShield, color: '#47ffff' },
    { key: 'warn', label: '预警', value: String(m.warn), icon: iconWarn, color: '#ff8a00' },
  ]
})

/* ============================================================
 * 系统切换
 * ============================================================ */

const currentName = computed(
  () => props.systems.find((s) => s.key === props.systemKey)?.name ?? '本系统',
)

const open = ref(false)

/** 下拉浮层的定位基准：整个「当前系统」框（菜单与框同宽） */
const systemEl = ref<HTMLElement | null>(null)

/** 菜单定位：贴着系统框下沿，与系统框同宽 */
const menuStyle = computed<Record<string, string>>(() => {
  const r = systemEl.value?.getBoundingClientRect()
  if (!r) return {}
  const style: Record<string, string> = {}
  style.top = `${Math.round(r.bottom + 6)}px`
  style.left = `${Math.round(r.left)}px`
  style.width = `${Math.round(r.width)}px`
  return style
})

function toggle() {
  open.value = !open.value
}

function select(key: string) {
  open.value = false
  if (key !== props.systemKey) emit('update:systemKey', key)
}

/** 点击组件外部收起下拉 */
function onDocPointerDown(e: PointerEvent) {
  const el = e.target as HTMLElement | null
  if (el?.closest?.('.mm__system') || el?.closest?.('.mm__menu')) return
  open.value = false
}

watch(open, (v) => {
  if (v) document.addEventListener('pointerdown', onDocPointerDown)
  else document.removeEventListener('pointerdown', onDocPointerDown)
})

onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocPointerDown))
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./fire/fire-common.scss" as fire;

/* ===== 横条容器（设计稿 #117:22647）=====
   底 rgba(0,44,94,.72) + 1px 描边 + 背景模糊，与大屏其它卡片同一套玻璃底。 */
.mm {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(36);
  padding: vh(12) vw(12);
  border: 1px solid rgba(0, 152, 230, 0.16);
  border-radius: 3px;
  background: rgba(0, 44, 94, 0.72);
  backdrop-filter: blur(9px) saturate(125%);
  -webkit-backdrop-filter: blur(9px) saturate(125%);
}

/* ===== 当前系统选择框（设计稿 #127:324）===== */
.mm__system {
  position: relative;
  flex-shrink: 0;
  width: vw(377);
  padding: vh(10) vw(16);
  border: 1px solid rgba(128, 209, 253, 0.15);
  border-radius: 8px;
  background: #00326c;
}

.mm__system-text {
  display: flex;
  flex-direction: column;
  gap: vh(8);
}

/* 「当前系统」：设计稿 14px 粗体 #A2CAFF，透明度 0.7 */
.mm__system-label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(14 * var(--min-scale)), 14px);
  font-weight: 700;
  line-height: 18px;
  color: #a2caff;
  opacity: 0.7;
}

/* 系统名 + 下拉箭头 */
.mm__system-row {
  display: flex;
  align-items: center;
  gap: vw(8);
}

.mm__system-name {
  flex: 1;
  min-width: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(24 * var(--min-scale)), 24px);
  font-weight: 700;
  line-height: 32px;
  color: #a2caff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mm__system-toggle {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;

  img {
    width: 24px;
    height: 24px;
    display: block;
  }
}

/* 下拉浮层（Teleport 到 body，按触发按钮定位）
   浮层被传送到 body，脱离大屏根节点 —— 页面级的 --fire-text-* 与 --min-scale
   都取不到（var() 解析失败会回退成继承色，正文就成了黑字）。
   所以这里的色值直接引 fire-common.scss 的 SCSS 真源，字号用固定 px。 */
.mm__menu {
  position: fixed;
  z-index: 2000;
  margin: 0;
  padding: vh(4) 0;
  list-style: none;
  border: 1px solid rgba(120, 190, 255, 0.24);
  border-radius: 4px;
  background: rgba(4, 32, 70, 0.96);
  backdrop-filter: blur(9px);
  -webkit-backdrop-filter: blur(9px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.mm__menu-item {
  display: block;
  width: 100%;
  padding: vh(8) vw(16);
  border: none;
  background: transparent;
  text-align: left;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 16px;
  line-height: 1.3;
  color: fire.$fire-text-label;
  cursor: pointer;
  white-space: nowrap;
}

.mm__menu-item:hover {
  background: rgba(0, 84, 160, 0.45);
  color: fire.$fire-text-title;
}

.mm__menu-item.is-active {
  color: #a2caff;
  background: rgba(0, 68, 130, 0.6);
}

.mm-drop-enter-active,
.mm-drop-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.mm-drop-enter-from,
.mm-drop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ===== 分隔线（设计稿 #117:22655：1px × 96）===== */
.mm__divider {
  flex-shrink: 0;
  width: 1px;
  height: vh(96);
  background: rgba(128, 209, 253, 0.15);
}

/* ===== 四项指标 ===== */
.mm__items {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

/* 指标项等分铺满（设计稿每个指标 horizontal: fill） */
.mm__item {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: vw(18);
  padding: 0 vw(18);
}

/* 图标框：56×56，深蓝底 + 1px 描边 + 圆角 8 */
.mm__icon {
  flex-shrink: 0;
  width: min(vw(56), vh(56));
  height: min(vw(56), vh(56));
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(128, 209, 253, 0.15);
  border-radius: 8px;
  background: #00346f;

  img {
    width: min(vw(28), vh(28));
    height: min(vw(28), vh(28));
    display: block;
  }
}

.mm__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(8);
}

/* 指标名 18px */
.mm__label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(18 * var(--min-scale)), 18px);
  line-height: 1.2;
  color: #96bee9;
  white-space: nowrap;
}

/* 数值 32px：颜色由指标自带（与图标同色） */
.mm__value {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(32 * var(--min-scale)), 32px);
  font-weight: 500;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
