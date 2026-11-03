<template>
  <div class="pump-scene">
    <!-- 三维泵房模型：铺底整屏（同源 iframe，可直接取 contentWindow 上的句柄） -->
    <iframe
      ref="frameRef"
      class="pump-scene__frame"
      src="/pump-room-model/index.html?embed=1"
      title="消防水泵房三维场景"
      @error="failed = true"
    />

    <!-- 加载态：就绪前显示遮罩；超时后提示但不白屏 -->
    <div v-if="!ready" class="pump-scene__overlay">
      <template v-if="failed">
        <span class="pump-scene__msg">三维场景加载失败</span>
        <button type="button" class="pump-scene__retry" @click="reload">重新加载</button>
      </template>
      <template v-else>
        <span class="pump-scene__spinner" />
        <span class="pump-scene__msg">
          {{ slow ? '三维场景加载较慢…' : '正在构建泵房场景…' }}
        </span>
      </template>
    </div>

    <!-- 视图控件：浮在场景左下角 -->
    <div v-if="ready" class="pump-scene__tools">
      <div class="pump-scene__tool-row">
        <button
          v-for="v in VIEW_PRESETS"
          :key="v.key"
          type="button"
          class="pump-scene__tool-btn"
          :class="{ 'is-active': activeView === v.key }"
          @click="applyView(v.key)"
        >
          {{ v.label }}
        </button>
      </div>
      <label class="pump-scene__check">
        <input v-model="cutawayOn" type="checkbox" @change="applyCutaway" />
        <span>剖视</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 水泵房场景监控 · 三维泵房场景
 *
 * 嵌入 public/pump-room-model/（通用消防水泵房三维示例模型，22 个 POI）。
 * 模型侧**零改动**：视图预设与剖视开关都在本页实现。
 *
 * 为什么能在父页实现视图切换：
 *   模型 app.js 内部有 applyView(key)，但没有导出；`__pumpRoom.layout.room.bounds`
 *   与 `clearHeight` 是暴露的，所以本页按模型自己的 SITE 公式重新推导机位，
 *   实测复现值与模型 README 记载完全一致：
 *     外观 pos(-19.2, 10.08, -12.6) / target(0, 1.28, 0)
 *     室内 pos(-10.2, 2.88, -4.95)  / target(1.5, 1.15, 1.5)
 *     剖切 pos(3.84, 18.72, -13.02) / target(0, 0.4, 0)
 *
 * 铺底机位是第四个（实测选定）：俯角 44°、距离 25 m，
 * 低俯角近距会被水罐挡住泵组，这个角度 3 泵 2 罐 2 柜管路阀门全可见。
 * 铺底必须开剖视，否则俯视只能看到屋顶。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

/** 视图预设 */
type ViewKey = 'exterior' | 'interior' | 'section' | 'bed'

const VIEW_PRESETS: Array<{ key: ViewKey; label: string }> = [
  { key: 'bed', label: '铺底' },
  { key: 'exterior', label: '外观' },
  { key: 'interior', label: '室内' },
  { key: 'section', label: '剖切' },
]

const emit = defineEmits<{ (e: 'ready'): void }>()

const frameRef = ref<HTMLIFrameElement | null>(null)
const ready = ref(false)
const failed = ref(false)
/** 超过这个时间还没就绪：提示"较慢"，但保留场景，不白屏 */
const slow = ref(false)
const activeView = ref<ViewKey>('bed')
const cutawayOn = ref(true)

/** 模型句柄（同源 iframe，可直接取） */
function getApp(): any {
  const win = frameRef.value?.contentWindow as any
  return win?.__pumpRoomApp ?? null
}

function getModel(): any {
  const win = frameRef.value?.contentWindow as any
  return win?.__pumpRoom ?? null
}

/**
 * 房间尺度推导（与模型 app.js 的 SITE 一致）
 *
 * 按 layout.room.bounds 实时推导，而不是写死坐标 ——
 * 模型尺寸变了机位仍然成立。
 */
function siteOf(model: any) {
  const b = model.layout?.room?.bounds
  if (!b) return null
  const w = b.maxX - b.minX
  const d = b.maxZ - b.minZ
  const cx = (b.minX + b.maxX) / 2
  const cz = (b.minZ + b.maxZ) / 2
  return {
    w,
    d,
    cx,
    cz,
    span: Math.max(w, d),
    diag: Math.hypot(w, d),
    halfW: w / 2,
    halfD: d / 2,
    clearHeight: model.layout?.room?.clearHeight ?? 4,
  }
}

/**
 * 各视图的机位
 *
 * exterior / interior / section 三档与模型内部 CAMERA_PRESETS 完全一致；
 * bed（铺底）是本页为「模型铺底 + 卡片悬浮」版式实测选定的机位。
 */
function cameraOf(key: ViewKey, site: ReturnType<typeof siteOf>) {
  if (!site) return null
  const { cx, cz, w, d, span, diag, halfW, halfD, clearHeight } = site

  if (key === 'exterior') {
    return {
      position: [cx - halfW - w * 0.3, span * 0.42, cz - halfD - d * 0.34],
      target: [cx, clearHeight * 0.32, cz],
    }
  }
  if (key === 'interior') {
    return {
      position: [cx - halfW + w * 0.075, Math.min(2.9, clearHeight * 0.72), cz - halfD + d * 0.17],
      target: [cx + w * 0.0625, 1.15, cz + d * 0.1],
    }
  }
  if (key === 'section') {
    return {
      position: [cx + span * 0.16, span * 0.78, cz - diag * 0.46],
      target: [cx, 0.4, cz],
    }
  }
  // 铺底：俯角 44°、距离 25 m 的球坐标机位
  const elev = (44 * Math.PI) / 180
  const azim = (-52 * Math.PI) / 180
  const dist = 25
  return {
    position: [
      cx + dist * Math.cos(elev) * Math.sin(azim),
      dist * Math.sin(elev),
      cz + dist * Math.cos(elev) * Math.cos(azim),
    ],
    // 目标点左移一点：房间居中偏左，右侧空出来给详情列
    target: [cx - 1.2, 0.9, cz],
  }
}

/** 应用机位 */
function applyCamera(key: ViewKey) {
  const app = getApp()
  const model = getModel()
  if (!app?.camera || !app?.controls) return
  const cam = cameraOf(key, siteOf(model))
  if (!cam) return
  app.camera.position.set(cam.position[0], cam.position[1], cam.position[2])
  app.controls.target.set(cam.target[0], cam.target[1], cam.target[2])
  app.camera.lookAt(cam.target[0], cam.target[1], cam.target[2])
  app.controls.update()
}

/** 剖视开关：去屋顶 + 隐去朝向相机的墙 */
function applyCutaway() {
  const model = getModel()
  const cut = model?.cutaway
  if (!cut) return
  cut.apply(cutawayOn.value)
  cut.refresh()
}

/** 切换视图预设 */
function applyView(key: ViewKey) {
  activeView.value = key
  applyCamera(key)
  // 剖切俯视自带水平剖切面，其余视角回到"去屋顶 + 隐墙"的开剖视
  if (key === 'section') {
    cutawayOn.value = true
  }
  applyCutaway()
}

/**
 * 聚焦到某个 POI（右侧详情列表点击时调用）
 *
 * selectPOI(id, true) = 高亮 + 相机聚焦。
 * 这是"选中"标记，不是设备状态 —— 设备状态只由角标承担，两者不混用。
 */
function focusPoi(poiId: string) {
  const app = getApp()
  if (!app?.selectPOI) return
  app.selectPOI(poiId, true)
}

/** 重新加载模型 */
function reload() {
  failed.value = false
  ready.value = false
  slow.value = false
  const frame = frameRef.value
  if (!frame) return
  // 重新赋值 src 触发重载：就绪信号要重新等，轮询也要重新起
  frame.src = '/pump-room-model/index.html?embed=1'
  startPoll()
}

/** 模型就绪：应用初始机位与剖视 */
function setupScene() {
  if (ready.value) return
  activeView.value = 'bed'
  cutawayOn.value = true
  applyCamera('bed')
  applyCutaway()
  ready.value = true
  emit('ready')
}

let slowTimer: number | undefined
let pollTimer: number | undefined

/**
 * 轮询等模型真正就绪
 *
 * 等的是 __pumpRoom（模型 start() 跑完才挂，带 layout / cutaway / ready:true），
 * 不是 __pumpRoomApp —— 后者在模块加载时就有了，那一刻场景还没装配，
 * 按它就绪等于对着空气应用机位：铺底机位与剖视都落空，
 * 页面会先闪一帧模型自带的"外观"机位，再跳回铺底机位。
 */
function startPoll() {
  if (pollTimer) window.clearInterval(pollTimer)
  pollTimer = window.setInterval(() => {
    if (ready.value) {
      window.clearInterval(pollTimer)
      pollTimer = undefined
      return
    }
    if (getModel()) setupScene()
  }, 100)
}

/** 模型回报就绪（index.html 的 embed 脚本 postMessage） */
function onMessage(e: MessageEvent) {
  if (e.data?.type !== 'pump-room-model:ready') return
  // 模型是摘掉加载遮罩之后才发消息的，句柄此刻必然在位；
  // 留一拍是为了等 start() 的最后几步收尾。
  window.setTimeout(() => {
    if (!ready.value && getModel()) setupScene()
  }, 60)
}

onMounted(() => {
  window.addEventListener('message', onMessage)
  slowTimer = window.setTimeout(() => {
    if (!ready.value) slow.value = true
  }, 3000)
  startPoll()
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
  if (slowTimer) window.clearTimeout(slowTimer)
  if (pollTimer) window.clearInterval(pollTimer)
})

/** 对外暴露：父组件（页面）用它做「点详情 → 聚焦三维」 */
defineExpose({ focusPoi, applyView })
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.pump-scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  /* 显式层级：模型铺底为 0，悬浮层 10、顶栏 100。
     不写 z-index 时 computed 是 auto，靠 DOM 顺序压着 —— 层级是隐式的，
     后续插入元素就会踩翻。 */
  z-index: 0;
  /* 模型自身背景是近黑工业冷灰，与大屏深蓝不同 —— 保留模型原色，
     保住泵房场景的工业质感；页面区与模型区靠卡片边框分隔，不强行改色。 */
  background: #0d1218;
}

.pump-scene__frame {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
}

/* ===== 加载 / 失败遮罩 ===== */
.pump-scene__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: vh(12);
  background: rgba(6, 16, 28, 0.85);
  z-index: 3;
}

.pump-scene__spinner {
  width: vw(28);
  height: vw(28);
  border: 2px solid rgba(120, 190, 255, 0.25);
  border-top-color: rgba(120, 190, 255, 0.85);
  border-radius: 50%;
  animation: pump-scene-spin 0.9s linear infinite;
}

@keyframes pump-scene-spin {
  to {
    transform: rotate(360deg);
  }
}

.pump-scene__msg {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: rgba(169, 201, 234, 0.9);
  letter-spacing: 1px;
}

.pump-scene__retry {
  height: vh(30);
  padding: 0 vw(16);
  border: 1px solid rgba(120, 190, 255, 0.4);
  border-radius: vw(2);
  background: rgba(0, 68, 130, 0.7);
  color: #eaf6ff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  cursor: pointer;
}

.pump-scene__retry:hover {
  background: rgba(0, 92, 168, 0.85);
}

/* ===== 视图控件 ===== */
.pump-scene__tools {
  position: absolute;
  left: vw(16);
  bottom: vh(16);
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: vh(8);
  align-items: flex-start;
}

.pump-scene__tool-row {
  display: flex;
  gap: vw(6);
}

.pump-scene__tool-btn {
  height: vh(28);
  padding: 0 vw(12);
  border: 1px solid rgba(120, 190, 255, 0.28);
  border-radius: vw(2);
  background: rgba(6, 24, 44, 0.72);
  color: rgba(200, 228, 255, 0.9);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.pump-scene__tool-btn:hover {
  background: rgba(0, 92, 168, 0.8);
  color: #eaf6ff;
}

.pump-scene__tool-btn.is-active {
  background: linear-gradient(180deg, rgba(0, 134, 228, 0.9) 0%, rgba(0, 86, 168, 0.9) 100%);
  border-color: rgba(96, 200, 255, 0.6);
  color: #fff;
}

.pump-scene__check {
  display: flex;
  align-items: center;
  gap: vw(6);
  height: vh(24);
  padding: 0 vw(10);
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: vw(2);
  background: rgba(6, 24, 44, 0.72);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: rgba(200, 228, 255, 0.9);
  cursor: pointer;
  user-select: none;
}
</style>
