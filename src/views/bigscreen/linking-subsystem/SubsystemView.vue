<template>
  <!-- overview（商铺主体责任系统）：引擎注入全屏地图 + 悬浮浮层（右侧面板/筛选条/弹窗）
       非 overview：单一 hostEl 直出引擎内容 -->
  <div v-if="custom === 'overview'" class="subsystem-scene">
    <div ref="hostEl" class="subsystem-view" :data-system="custom"></div>
    <OverviewOverlay />
  </div>
  <div v-else ref="hostEl" class="subsystem-view" :data-system="custom"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MODULES } from './data/modules'
import { bindModuleSwitch, consumePendingState } from './engine/shared-engine'
import { mountEngineGlobals, unmountEngineGlobals, REGISTERS, COMMON_GLOBALS } from './engine/subsystem-globals'
import OverviewOverlay from './OverviewOverlay.vue'

const props = defineProps<{ mod: number }>()
const hostEl = ref<HTMLElement>()
const router = useRouter()

/* 当前系统的 custom 标记，供差异化 CSS [data-system=...] 选择器使用 */
const custom = computed(() => MODULES.find((x: any) => x.id === props.mod)?.custom || '')

/** 各模块引擎（懒加载），mod.custom → engine 文件 */
const engineLoaders: Record<string, () => Promise<any>> = {
  overview: () => import('./engine/overview-engine'),
  events: () => import('./engine/events-engine'),
  hazards: () => import('./engine/hazards-engine'),
  controlRooms: () => import('./engine/control-rooms-engine'),
  hotWork: () => import('./engine/hot-work-engine'),
  emergency: () => import('./engine/emergency-engine'),
  jointDuty: () => import('./engine/joint-duty-engine'),
  devices: () => import('./engine/devices-engine'),
  shops: () => import('./engine/shops-audit-engine'),
  ledger: () => import('./engine/ledger-engine'),
}

/** 主渲染函数名（原 index.html renderContent 分发 1:1） */
const renderFns: Record<string, string> = {
  events: 'renderEvents', hazards: 'renderHazards', controlRooms: 'renderControlRooms',
  hotWork: 'renderHotWork', emergency: 'renderEmergency', jointDuty: 'renderJointDuty',
  devices: 'renderDevices', shops: 'renderShops', ledger: 'renderLedger',
}

let lastCustom: string | null = null

async function renderModule(mod: number) {
  const m = MODULES.find((x: any) => x.id === mod)
  const body = hostEl.value
  if (!m || !body) return
  body.innerHTML = ''
  const custom = (m as any).custom
  if (lastCustom && lastCustom !== custom) {
    unmountEngineGlobals(REGISTERS[lastCustom])
  }

  const engine = custom && engineLoaders[custom] ? await engineLoaders[custom]() : null
  if (!engine) {
    body.innerHTML = `<div class="panel" style="padding:24px"><div class="panel-head"><div class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg></div><div><div class="panel-title">${m.title}</div><div class="panel-tagline">${(m as any).tagline}</div></div></div></div>`
    lastCustom = custom
    return
  }

  /* 消费跨模块状态（openShopMore 传入）+ 绑定跨模块跳转 */
  const st = consumePendingState()
  bindModuleSwitch((id: number) => router.push(`/landing/linking/sub/${id}`))
  engine.bindContainer?.(body)
  engine.applyPendingState?.(st)
  engine.setModuleSwitch?.((id: number) => router.push(`/landing/linking/sub/${id}`))

  if (custom === 'overview') {
    engine.renderOverview(body, body)
    engine.mountOverviewGlobals?.()
  } else {
    const fnName = renderFns[custom]
    if (fnName && typeof engine[fnName] === 'function') {
      engine[fnName](body, body)
    } else {
      body.innerHTML = `<div class="panel" style="padding:24px"><div class="panel-head"><div class="panel-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg></div><div><div class="panel-title">${m.title}</div><div class="panel-tagline">载入中…</div></div></div></div>`
    }
    // 公共全局（openShopMore 等跨模块弹窗按钮）
  const common = await import('./engine/shared-engine')
  COMMON_GLOBALS.forEach(n => { if (typeof (common as any)[n] === 'function') (window as any)[n] = (common as any)[n] })
  mountEngineGlobals(engine, REGISTERS[custom] || { fns: [] })
  }
  lastCustom = custom
}

onMounted(() => renderModule(props.mod))
watch(
  () => props.mod,
  () => renderModule(props.mod)
)
onBeforeUnmount(() => {
  if (lastCustom) unmountEngineGlobals(REGISTERS[lastCustom])
})
</script>

<style>
/* 原 index.html 模块内容直接注入 iframe-shell-body（flex 纵向容器），
   Vue 中多了本包装层，需继承其弹性布局，模块内部 .ov-split 等 flex:1 才能撑满高度 */
.subsystem-view {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
/* 统一内容区四周 20px 内边距 + 顶层兄弟块间 14px 间距（所有系统一致）；
   overview 例外——其 .responsibility-system 自带 20px padding + 背景铺满宿主，宿主再补会叠加成 40px */
.subsystem-view:not([data-system="overview"]) {
  padding: 20px;
  gap: 14px;
}
/* hazards 第一屏（三栏仪表盘）按设计稿：内容容器四周 0 内边距（用户 2026-09-02 确认：整个内容容器不留边距，由面板自带） */
.subsystem-view[data-system="hazards"] {
  padding: 0;
}
/* ===== overview（商铺主体责任系统 · 全屏辖区态势）场景容器 =====
   地图由 overview-engine 注入 hostEl（.responsibility-system 铺满），
   OverviewOverlay 以 absolute 悬浮叠加。容器作 relative 定位基准 + flex 全屏。 */
.subsystem-scene {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.subsystem-scene .subsystem-view {
  flex: 1;
  min-height: 0;
}
</style>
