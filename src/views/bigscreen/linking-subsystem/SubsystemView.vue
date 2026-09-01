<template>
  <div ref="hostEl" class="subsystem-view"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { MODULES } from './data/modules'
import { bindModuleSwitch, consumePendingState } from './engine/shared-engine'
import { mountEngineGlobals, unmountEngineGlobals, REGISTERS, COMMON_GLOBALS } from './engine/subsystem-globals'

const props = defineProps<{ mod: number }>()
const hostEl = ref<HTMLElement>()
const router = useRouter()

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
</style>
