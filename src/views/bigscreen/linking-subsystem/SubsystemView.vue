<template>
  <!-- 单一 hostEl 直出引擎内容。
       overview（商铺主体责任系统）已定位为独立大屏（/landing/linking/responsibility），
       壳内不再渲染，SubsystemLayout 对 /sub/1 深链接做 replace 跳转 -->
  <div ref="hostEl" class="subsystem-view" :data-system="custom"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MODULES } from './data/modules'
import { linkingRouteFor } from './data/nav'
import { bindModuleSwitch, consumePendingState } from './engine/shared-engine'
import { mountEngineGlobals, unmountEngineGlobals, REGISTERS, COMMON_GLOBALS } from './engine/subsystem-globals'

const props = defineProps<{ mod: number }>()
const hostEl = ref<HTMLElement>()
const router = useRouter()

/* 当前系统的 custom 标记，供差异化 CSS [data-system=...] 选择器使用 */
const custom = computed(() => MODULES.find((x: any) => x.id === props.mod)?.custom || '')

/** 各模块引擎（懒加载），mod.custom → engine 文件 */
const engineLoaders: Record<string, () => Promise<any>> = {
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
  bindModuleSwitch((id: number) => router.push(linkingRouteFor(id)))
  engine.bindContainer?.(body)
  engine.applyPendingState?.(st)
  engine.setModuleSwitch?.((id: number) => router.push(linkingRouteFor(id)))

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
   Vue 中多了本包装层，需继承其弹性布局，模块内部 flex:1 才能撑满高度 */
.subsystem-view {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
/* 统一内容区四周 20px 内边距 + 顶层兄弟块间 14px 间距（所有系统一致） */
.subsystem-view {
  padding: 20px;
  gap: 14px;
}
/* hazards 第一屏（三栏仪表盘）按设计稿：内容容器四周 0 内边距（用户 2026-09-02 确认：整个内容容器不留边距，由面板自带） */
.subsystem-view[data-system="hazards"] {
  padding: 0;
}
</style>
