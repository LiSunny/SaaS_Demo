<template>
  <div class="fc-monitoring">
    <div v-if="!enterprise?.rooms?.length" class="fc-monitoring__empty">
      暂无消控室数据
    </div>
    <div v-else class="fc-monitoring__rooms">
      <div v-for="room in enterprise.rooms" :key="room.id" class="fc-room">
        <BigscreenModuleTitle :title="room.name" />
        <div class="fc-room__cameras">
          <div
            v-for="cam in room.cameras"
            :key="cam.id"
            class="fc-camera"
            :class="{ 'is-offline': cam.status === 'offline' }"
          >
            <!-- 在线：显示截图 + OSD -->
            <template v-if="cam.status === 'online'">
              <div class="surveillance-camera">
                <img :src="cam.snapshotUrl" :alt="cam.name" />
                <div class="lens-vignette"></div>
                <div class="scan-lines"></div>
                <div class="camera-osd">
                  <div class="osd-top">
                    <span class="rec-indicator">
                      <span class="rec-dot"></span>REC
                    </span>
                    <span class="camera-id">{{ cam.name }}</span>
                  </div>
                  <div class="osd-bottom">
                    <span class="osd-timestamp">{{ timestamp }}</span>
                  </div>
                </div>
              </div>
            </template>
            <!-- 离线：灰色占位 -->
            <template v-else>
              <div class="surveillance-camera offline-placeholder">
                <div class="offline-content">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="3" width="20" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M2 3l20 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                  <span>设备离线</span>
                </div>
              </div>
            </template>
            <div class="fc-camera__label">{{ cam.name }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import BigscreenModuleTitle from '../BigscreenModuleTitle.vue'

interface Camera {
  id: number
  name: string
  status: 'online' | 'offline'
  snapshotUrl: string
}

interface FireControlRoom {
  id: number
  name: string
  cameras: Camera[]
}

interface FireControlEnterprise {
  id: number
  name: string
  address: string
  contactPerson: string
  contactPhone: string
  rooms: FireControlRoom[]
  status: 'normal' | 'alert'
}

defineProps<{
  enterprise: FireControlEnterprise
}>()

const timestamp = ref(formatTs())
let timer: ReturnType<typeof setInterval> | null = null

function formatTs(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

onMounted(() => { timer = setInterval(() => { timestamp.value = formatTs() }, 1000) })
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.fc-monitoring {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.fc-monitoring::-webkit-scrollbar { width: 3px; }
.fc-monitoring::-webkit-scrollbar-track { background: transparent; }
.fc-monitoring::-webkit-scrollbar-thumb { background: rgba(71, 132, 232, 0.25); border-radius: 2px; }

.fc-monitoring__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(137, 181, 255, 0.4);
  font-size: clamp(13px, calc(15 * var(--min-scale)), 17px);
}

.fc-monitoring__rooms {
  display: flex;
  flex-direction: column;
  gap: calc(14 * var(--h));
}

.fc-room__cameras {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(220 * var(--w)), 1fr));
  gap: calc(10 * var(--w));
  margin-top: calc(8 * var(--h));
}

.fc-camera {
  display: flex;
  flex-direction: column;
  gap: calc(4 * var(--h));
  min-width: 0;
}

.fc-camera.is-offline .fc-camera__label {
  color: rgba(137, 181, 255, 0.35);
}

/* ===== 写实监控摄像头样式（复用 RiskControl 风格） ===== */
.surveillance-camera {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: #000;
  border-radius: 4px;
  border: 1px solid rgba(71, 132, 232, 0.25);
}

.surveillance-camera img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  filter: saturate(0.85) brightness(0.95) hue-rotate(15deg);
}

.offline-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(107, 114, 128, 0.4);
}

.offline-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(107, 114, 128, 0.7);
  font-size: clamp(11px, calc(12 * var(--min-scale)), 14px);
}

/* 镜头暗角 */
.lens-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.45) 100%);
  pointer-events: none;
}

/* 扫描线 */
.scan-lines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 1px,
    rgba(0, 0, 0, 0.06) 1px,
    rgba(0, 0, 0, 0.06) 2px
  );
  pointer-events: none;
  animation: scan-roll 8s linear infinite;
}

@keyframes scan-roll {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

/* OSD 信息叠加层 */
.camera-osd {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 6px 8px;
  pointer-events: none;
  z-index: 2;
}

.osd-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.osd-bottom {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
}

.rec-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Courier New', 'Consolas', monospace;
  font-size: clamp(9px, calc(11 * var(--min-scale)), 14px);
  font-weight: 700;
  color: #ff3333;
  background: rgba(0, 0, 0, 0.55);
  padding: 2px 8px;
  border-radius: 2px;
  letter-spacing: 0.5px;
}

.rec-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff3333;
  box-shadow: 0 0 4px #ff0000;
  animation: rec-blink 1.2s ease-in-out infinite;
}

@keyframes rec-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

.camera-id {
  font-family: 'Courier New', 'Consolas', monospace;
  font-size: clamp(9px, calc(11 * var(--min-scale)), 14px);
  font-weight: 700;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.55);
  padding: 2px 8px;
  border-radius: 2px;
  letter-spacing: 0.5px;
}

.osd-timestamp {
  font-family: 'Courier New', 'Consolas', monospace;
  font-size: clamp(9px, calc(11 * var(--min-scale)), 14px);
  color: #ffffff;
  background: rgba(0, 0, 0, 0.55);
  padding: 2px 8px;
  border-radius: 2px;
  letter-spacing: 0.5px;
}

.fc-camera__label {
  font-size: clamp(10px, calc(11 * var(--min-scale)), 13px);
  color: rgba(137, 181, 255, 0.6);
  text-align: center;
  white-space: nowrap;
}
</style>
