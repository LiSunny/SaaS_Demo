<template>
  <div class="campus-layer">
    <iframe
      ref="frameRef"
      class="campus-layer__frame"
      :src="frameSrc"
      title="校园三维模型"
    />
    <Transition name="campus-fade" @after-leave="onOverlayGone">
      <div v-if="!ready" class="campus-layer__loading">
        <span class="campus-layer__spinner" />
        <span class="campus-layer__text">正在构建校园场景…</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  BIGSCREEN_CAMPUS_CAMERA,
  BIGSCREEN_CAMPUS_DEFAULT_TIME,
  BIGSCREEN_CAMPUS_ENTRY_CAMERA,
  BIGSCREEN_CAMPUS_ENTRY_DURATION,
  BIGSCREEN_CAMPUS_THEMES,
  type CampusCamera,
  type CampusTheme,
  type CampusTimePreset,
} from './campusTheme'

type QualityPreset = 'high' | 'medium' | 'low'

const props = withDefaults(
  defineProps<{
    /** 初始昼夜预设 */
    time?: CampusTimePreset
    /** 画质预设 */
    quality?: QualityPreset
    /** 昼夜三档各自的大屏配色 */
    themes?: Record<CampusTimePreset, CampusTheme>
    /** 初始机位 */
    camera?: CampusCamera
  }>(),
  {
    time: BIGSCREEN_CAMPUS_DEFAULT_TIME,
    quality: 'medium',
    themes: () => BIGSCREEN_CAMPUS_THEMES,
    camera: () => BIGSCREEN_CAMPUS_CAMERA,
  },
)

const frameRef = ref<HTMLIFrameElement | null>(null)
const ready = ref(false)

/** 模型实例（window.campusApp，见 campus-model README §5.1） */
const model = ref<any>(null)

/** 当前昼夜预设 */
const currentTime = ref<CampusTimePreset>(props.time)

const frameSrc = computed(() => '/campus-model/index.html?embed=1')

/** 同源 iframe，直接取模型暴露的 app 对象 */
function getModel() {
  const win = frameRef.value?.contentWindow as any
  return win?.campusApp ?? null
}

function applySceneStyle() {
  const app = getModel()
  if (!app) return
  const THREE = app.ctx?.THREE
  const th = props.themes[currentTime.value]
  if (!THREE || !app.scene || !th) return

  // 天穹：模型用 ShaderMaterial 画渐变天空，唯一带 topColor/bottomColor uniform 的网格
  // 是天穹本体（renderOrder = -1000），按此特征定位，避免误改其它着色器材质。
  app.scene.traverse((obj: any) => {
    const u = obj.material?.uniforms
    if (obj.isMesh && obj.renderOrder === -1000 && u?.topColor && u?.bottomColor) {
      u.topColor.value.set(th.skyTop)
      u.bottomColor.value.set(th.skyBottom)
    }
    if (obj.isDirectionalLight) {
      obj.color.set(th.sunColor)
      obj.intensity = th.sunIntensity
    } else if (obj.isHemisphereLight) {
      obj.color.set(th.hemiSky)
      obj.groundColor.set(th.hemiGround)
      obj.intensity = th.hemiIntensity
    } else if (obj.isAmbientLight) {
      obj.color.set(th.ambientColor)
      obj.intensity = th.ambientIntensity
    }
  })

  app.scene.background = new THREE.Color(th.skyBottom)
  if (app.scene.fog) {
    app.scene.fog.color = new THREE.Color(th.fogColor)
    app.scene.fog.density = th.fogDensity
  }
  app.renderer.toneMappingExposure = th.exposure

  applyNightGlow(app, th.nightGlow)
}

/**
 * 夜间灯光浓度：路灯点光 + 窗户自发光。
 * 模型按预设的 nightFactor 等比缩放这两者，这里按目标浓度重新归一。
 * 窗户自发光的基准强度只记录一次，之后按「基准 × 目标浓度」重算，
 * 反复切换昼夜不会累积误差。
 */
const emissiveBase = new Map<string, number>()

function applyNightGlow(app: any, target: number) {
  const pointLights: any[] = []
  app.scene.traverse((obj: any) => {
    if (obj.isPointLight && obj.userData?.baseIntensity) pointLights.push(obj)
  })
  if (!pointLights.length) return

  // 模型当前的 nightFactor（由点光强度反推）
  const factor = pointLights[0].intensity / pointLights[0].userData.baseIntensity
  pointLights.forEach((light) => {
    light.visible = target > 0.02
    light.intensity = light.userData.baseIntensity * target
  })

  // 窗户自发光材质在场景里被多个网格共用，按 uuid 去重
  const seen = new Set<string>()
  app.scene.traverse((obj: any) => {
    const list = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : []
    list.forEach((m: any) => {
      if (!m || !('emissive' in m) || seen.has(m.uuid)) return
      seen.add(m.uuid)
      if (factor > 0 && !emissiveBase.has(m.uuid)) {
        // 此刻的值 = 基准 × factor，反推基准
        emissiveBase.set(m.uuid, m.emissiveIntensity / factor)
      }
      const base = emissiveBase.get(m.uuid)
      if (base !== undefined) m.emissiveIntensity = base * target
    })
  })
}

/** 按机位参数换算相机位置与注视点 */
function resolveCamera(cam: CampusCamera) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const horiz = cam.distance * Math.cos(rad(cam.elevation))
  const target = {
    x: cam.targetX ?? 0,
    y: cam.targetY,
    z: cam.targetZ ?? 0,
  }
  const position = {
    x: target.x + horiz * Math.sin(rad(cam.azimuth)),
    y: target.y + cam.distance * Math.sin(rad(cam.elevation)),
    z: target.z - horiz * Math.cos(rad(cam.azimuth)),
  }
  return { target, position }
}

/** 直接把模型摆到指定机位（无动画） */
function applyCamera(app: any, cam: CampusCamera = props.camera) {
  const THREE = app.ctx?.THREE
  if (!THREE || !app.camera || !app.controls) return
  const { target: t, position: p } = resolveCamera(cam)
  const target = new THREE.Vector3(t.x, t.y, t.z)
  app.controls.target.copy(target)
  app.camera.position.set(p.x, p.y, p.z)
  app.camera.lookAt(target)
  // 大屏背景层：只允许旋转 / 缩放。平移会把目标点拖到地面以下、模型跑出画面。
  app.controls.enablePan = true
  app.controls.update()
}

/** 入场轨迹：从模型内置的园区全景俯视飞到落位机位 */
function playEntryFlight(app: any) {
  const { target: t, position: p } = resolveCamera(props.camera)
  app.flyToCamera?.({
    position: [p.x, p.y, p.z],
    target: [t.x, t.y, t.z],
    duration: BIGSCREEN_CAMPUS_ENTRY_DURATION,
  })
}

let entryStarted = false
let entryTimer: number | undefined
let entryFallbackTimer: number | undefined

/** 起飞（幂等） */
function startEntryFlight() {
  if (entryStarted) return
  entryStarted = true
  clearEntryTimers()
  const app = getModel()
  if (!app) return
  playEntryFlight(app)
}

/** 遮罩淡出完成：留 0.3s 无遮挡俯视再起飞 */
function onOverlayGone() {
  if (entryStarted) return
  entryTimer = window.setTimeout(startEntryFlight, 300)
}

function clearEntryTimers() {
  if (entryTimer !== undefined) {
    window.clearTimeout(entryTimer)
    entryTimer = undefined
  }
  if (entryFallbackTimer !== undefined) {
    window.clearTimeout(entryFallbackTimer)
    entryFallbackTimer = undefined
  }
}

/** 就绪后把预设与视觉方案套用到模型上 */
function configure() {
  const app = getModel()
  if (!app) return
  model.value = app
  app.setQuality?.(props.quality)
  app.setTimePreset?.(currentTime.value, true)
  applySceneStyle()
  // 相机先摆到园区全景俯视，作为入场轨迹的起飞点
  applyCamera(app, BIGSCREEN_CAMPUS_ENTRY_CAMERA)
  ready.value = true
  // 兜底：遮罩淡出回调未触发时，最迟 1.5s 起飞
  entryFallbackTimer = window.setTimeout(startEntryFlight, 1500)
}

let configured = false
let pollTimer: number | undefined

/** 模型是否就绪：app 对象存在，且场景装配完成（iframe 的 #loading 已移除） */
function isModelReady(): boolean {
  if (!getModel()) return false
  const doc = frameRef.value?.contentDocument
  if (doc?.getElementById('loading')) return false
  return true
}

/**
 * 等模型就绪后配置一次（幂等）。
 * ready 消息可能在父页监听器注册之前就已发出（父页挂载慢于 iframe 建模），
 * 那样整套机位与主题会静默失效 —— 故用轮询兜底。
 */
function ensureConfigured() {
  if (configured || !isModelReady()) return
  configured = true
  configure()
  stopPolling()
}

function stopPolling() {
  if (pollTimer === undefined) return
  window.clearInterval(pollTimer)
  pollTimer = undefined
}

function handleMessage(e: MessageEvent) {
  if (e?.data?.type !== 'campus-model:ready') return
  if (frameRef.value && e.source !== frameRef.value.contentWindow) return
  ensureConfigured()
}

onMounted(() => {
  window.addEventListener('message', handleMessage)
  pollTimer = window.setInterval(() => ensureConfigured(), 150)
  window.setTimeout(stopPolling, 60000)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
  stopPolling()
  clearEntryTimers()
  try {
    model.value?.stop?.()
  } catch { /* 模型可能未初始化 */ }
})

/** ===== 对外暴露的模型控制接口 ===== */
defineExpose({
  /** 模型实例 */
  get model() {
    return model.value
  },
  /** 当前昼夜预设 */
  get timePreset() {
    return currentTime.value
  },
  /**
   * 切换昼夜预设：模型立即切到该预设，再用大屏配色覆盖天空 / 灯光 / 雾。
   * 用立即模式（不做 1.2s 过渡），避免过渡中间态把天空刷成预设原始色。
   */
  setTimePreset(name: CampusTimePreset) {
    const app = getModel()
    if (!app) return
    app.setTimePreset?.(name, true)
    currentTime.value = name
    applySceneStyle()
  },
  setQuality(name: QualityPreset) {
    getModel()?.setQuality?.(name)
  },
  resetView() {
    const app = getModel()
    app?.resetView?.()
    applyCamera(app)
  },
  /** 重新套用大屏视觉方案（天空 / 灯光 / 雾 / 机位） */
  applyTheme() {
    const app = getModel()
    if (!app) return
    applySceneStyle()
    applyCamera(app)
  },
  /** 选中并飞行定位到某个 POI */
  selectPOI(poi: any, options?: { fly?: boolean }) {
    getModel()?.selectPOI?.(poi, options)
  },
  /**
   * 建筑导航面板（模型自带 POI 列表：搜索 + 分类 + 建筑清单）。
   * 面板本体在 iframe 内，大屏侧只切 .is-open 类控制显隐。
   */
  togglePoiPanel(force?: boolean) {
    const panel = frameRef.value?.contentDocument?.getElementById('poi-panel')
    if (!panel) return false
    const open = force === undefined ? !panel.classList.contains('is-open') : force
    panel.classList.toggle('is-open', open)
    return open
  },
})
</script>

<style lang="scss" scoped>
.campus-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: #00437a;
}

.campus-layer__frame {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
}

.campus-layer__loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: #00437a;
  color: #c8e4ff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;
}

/* 遮罩淡出，露出俯视园区 → 落位的入场轨迹 */
.campus-fade-leave-active {
  transition: opacity 0.6s ease;
}

.campus-fade-leave-to {
  opacity: 0;
}

.campus-layer__spinner {
  width: 34px; height: 34px;
  border: 2px solid rgba(120, 190, 255, 0.25);
  border-top-color: #69ccff;
  border-radius: 50%;
  animation: campus-spin 0.9s linear infinite;
}

@keyframes campus-spin {
  to { transform: rotate(360deg); }
}
</style>
