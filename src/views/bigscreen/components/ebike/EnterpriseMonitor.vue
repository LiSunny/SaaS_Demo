<template>
  <div class="module-card">
    <EbikeSectionTitle title="消控室值班离岗监控" />
    <div class="card-body">
      <div class="enterprise-select">
        <span class="ent-name">胜邦木业</span>
        <span class="ent-toggle">▼</span>
      </div>
      <div class="monitor-content">
        <div class="personnel-section">
          <div class="personnel-hex">
            <img src="@/assets/bigscreen/icon-personnel.svg" alt="" class="hex-icon-img" />
          </div>
          <div class="personnel-data">
            <span class="personnel-label">持证备案人数</span>
            <span class="personnel-value">97 <small>人</small></span>
          </div>
        </div>
        <div class="camera-feed">
          <div class="surveillance-camera">
            <img src="@/assets/bigscreen/camera-feed.png" alt="消控室监控" />
            <div class="lens-vignette" />
            <div class="scan-lines" />
            <div class="camera-osd">
              <div class="osd-top">
                <span class="rec-indicator"><span class="rec-dot" />REC</span>
                <span class="camera-id">消控室-01</span>
              </div>
              <div class="osd-bottom">
                <span class="osd-timestamp">{{ timestamp }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import EbikeSectionTitle from './EbikeSectionTitle.vue'

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

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.module-card {
  display: flex; flex-direction: column; gap: vh(16);
  background: rgba(0, 80, 140, 0.45);
  border: 1px solid rgba(0, 152, 230, 0.2);
  border-radius: 4px;
  padding: vh(10) vw(10);
}

.card-body { flex: 1; padding: 0 vw(10); display: flex; flex-direction: column; gap: vh(12); }

.enterprise-select {
  display: flex; align-items: center; justify-content: space-between;
  padding: vh(6) vw(10); background: #074980; flex-shrink: 0;
}
.ent-name {
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(20 * var(--min-scale)), 20px); color: #c2e8ff;
}
.ent-toggle { font-size: clamp(14px, calc(20 * var(--min-scale)), 24px); color: rgba(255,255,255,0.5); cursor: pointer; }

.monitor-content { flex: 1; min-height: 0; display: flex; gap: vw(17); }

.personnel-section {
  width: vw(164); flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center; gap: vh(21); padding: vh(6) 0;
}

.personnel-hex {
  position: relative;
  width: calc(60 * var(--min-scale)); height: calc(68 * var(--min-scale));
  overflow: hidden;
}
.hex-icon-img {
  width: 100%; height: 100%; display: block;
}

.personnel-data { display: flex; flex-direction: column; align-items: center; gap: vh(7); }
.personnel-label {
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  background: linear-gradient(to bottom, #ffffff, #c8e4ff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.personnel-value {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif; font-weight: 700;
  font-size: clamp(16px, calc(24 * var(--min-scale)), 24px);
  background: linear-gradient(to bottom, #ffffff, #c8e4ff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  small { font-family: 'Heiti TC', sans-serif; font-size: clamp(10px, calc(14 * var(--min-scale)), 14px); font-weight: 500; }
}

.camera-feed { flex: 1; min-width: 0; }

/* 写实监控摄像头 */
.surveillance-camera {
  position: relative; width: 100%; height: 100%;
  overflow: hidden; background: #000;
  border-radius: 4px;
  border: 1px solid rgba(0, 152, 230, 0.2);
}
.surveillance-camera img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  filter: saturate(0.85) brightness(0.95) hue-rotate(15deg);
}

/* 镜头暗角 */
.lens-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.45) 100%);
  pointer-events: none;
}

/* 扫描线 */
.scan-lines {
  position: absolute; inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.06) 1px, rgba(0,0,0,0.06) 2px);
  pointer-events: none;
  animation: scan-roll 8s linear infinite;
}
@keyframes scan-roll {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

/* OSD 叠加层 */
.camera-osd {
  position: absolute; inset: 0; z-index: 2;
  display: flex; flex-direction: column; justify-content: space-between;
  padding: 6px 8px; pointer-events: none;
}
.osd-top, .osd-bottom { display: flex; }
.osd-top { justify-content: space-between; align-items: flex-start; }
.osd-bottom { justify-content: flex-end; align-items: flex-end; }

.rec-indicator {
  display: inline-flex; align-items: center; gap: 4px;
  font-family: 'Courier New', monospace;
  font-size: clamp(9px, calc(11 * var(--min-scale)), 14px); font-weight: 700;
  color: #ff3333; background: rgba(0,0,0,0.55);
  padding: 2px 8px; border-radius: 2px;
}
.rec-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #ff3333;
  box-shadow: 0 0 4px #ff0000;
  animation: rec-blink 1.2s ease-in-out infinite;
}
@keyframes rec-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

.camera-id, .osd-timestamp {
  font-family: 'Courier New', monospace;
  font-size: clamp(9px, calc(11 * var(--min-scale)), 14px); font-weight: 700;
  color: #fff; background: rgba(0,0,0,0.55);
  padding: 2px 8px; border-radius: 2px;
}
</style>
