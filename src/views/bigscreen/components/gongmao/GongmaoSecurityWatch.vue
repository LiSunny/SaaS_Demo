<template>
  <GongmaoSectionCard title="应消一体救援联动" badge="值班记录">
    <div class="rescue-wrap">
      <!-- ===== 火警告警卡片行 (Figma: 2 卡片并排, gap 8px) ===== -->
      <div class="alert-row">
        <div
          v-for="(alert, i) in alerts"
          :key="i"
          class="alert-card"
        >
          <img class="alert-thumb" :src="alertThumbSrc" alt="" />
          <div class="alert-info">
            <span :class="['alert-tag', `alert-tag--${alert.level}`]">
              {{ alert.tag }}
            </span>
            <p class="alert-location">{{ alert.location }}</p>
          </div>
        </div>
      </div>

      <!-- ===== 视频监控 + 事件列表 (Figma: Component 24, gap 16px) ===== -->
      <div class="monitor-row">
        <!-- 视频画面 — Figma: 203px 宽 -->
        <div class="monitor-video">
          <div class="video-frame">
            <img class="video-img" :src="videoFeedSrc" alt="" />
            <div class="video-label">
              <p class="video-label-text">{{ videoName }}</p>
            </div>
          </div>
          <!-- 分页指示器 (Figma: 4 个圆角条) -->
          <div class="video-dots">
            <span
              v-for="(dot, di) in videoDots"
              :key="di"
              :class="['dot', { 'dot--active': dot.active }]"
            />
          </div>
        </div>

        <!-- 预警事件列表 — Figma: flex-1, gap 10px -->
        <div class="monitor-events">
          <div
            v-for="(event, ei) in events"
            :key="ei"
            class="event-card"
          >
            <div class="event-header">
              <span :class="['event-tag', `event-tag--${event.statusType}`]">
                {{ event.status }}
              </span>
              <p class="event-name">{{ event.name }}</p>
            </div>
            <p class="event-time">{{ event.time }}</p>
          </div>
        </div>
      </div>
    </div>
  </GongmaoSectionCard>
</template>

<script setup lang="ts">
import GongmaoSectionCard from './GongmaoSectionCard.vue'
import alertThumbSrc from '@/assets/bigscreen/gongmao-rescue-alert-thumb.svg'
import videoFeedSrc from '@/assets/bigscreen/gongmao-rescue-video-feed.svg'

interface AlertItem {
  tag: string
  level: 'fire' | 'warning'
  location: string
}

interface EventItem {
  status: string
  statusType: 'handled' | 'pending'
  name: string
  time: string
}

interface VideoDot {
  active: boolean
}

// ===== Mock 数据 — 对应 Figma 设计稿 =====

const alerts: AlertItem[] = [
  { tag: '火警', level: 'fire', location: '管理单元+安装位置' },
  { tag: '火警', level: 'fire', location: '管理单元+安装位置' },
]

const videoName = '1#消防控制室'

const videoDots: VideoDot[] = [
  { active: true },
  { active: false },
  { active: false },
  { active: false },
]

const events: EventItem[] = [
  {
    status: '已处置',
    statusType: 'handled',
    name: '预警（人员离岗）',
    time: '2025-06-12 18:20:34',
  },
  {
    status: '未处置',
    statusType: 'pending',
    name: '预警（人员离岗）',
    time: '2025-06-12 18:20:34',
  },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ===== 外层容器：按内容自适应高度 ===== */
.rescue-wrap {
  display: flex;
  flex-direction: column;
  gap: vh(18);
  padding: vh(8) 0;
}

/* =============================================
   火警告警卡片行 (Figma: 2 卡片并排, gap 8px, px 8px)
   ============================================= */
.alert-row {
  display: flex;
  gap: vw(8);
  padding: 0 vw(8);
}

/* 单张卡片 — Figma: bg #083f9e, rounded 2px, padding 12px, gap 12px */
.alert-card {
  display: flex;
  flex: 1;
  gap: vw(12);
  align-items: flex-start;
  min-width: 0;
  padding: vh(12) vw(12);
  background: #083f9e;
  border-radius: 2px;
}

/* 缩略图 — Figma: 60×60, rounded 4px */
.alert-thumb {
  display: block;
  width: vw(60);
  height: vh(60);
  flex-shrink: 0;
  border-radius: 4px;
  object-fit: cover;
}

/* 文字信息 — Figma: flex-col, gap 4px */
.alert-info {
  display: flex;
  flex-direction: column;
  gap: vh(4);
  flex: 1;
  min-width: 0;
  height: vh(60);
}

/* 标签 — Figma: bg rgba(244,67,54,0.3), px 6px, py 4px, rounded 4px */
.alert-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: vh(4) vw(6);
  border-radius: 4px;
  font-family: 'DingTalk_JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 14px);
  font-weight: 400;
  line-height: 1;
  color: #da372e;
  background: rgba(244, 67, 54, 0.3);
  white-space: nowrap;
}

/* 位置文字 — Figma: 16px white, Alibaba PuHuiTi Medium */
.alert-location {
  display: flex;
  flex: 1;
  align-items: center;
  margin: 0;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1.2;
  color: #ffffff;
  /* 超出省略 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* =============================================
   视频监控 + 事件列表行 (Figma: gap 16px, px 8px)
   ============================================= */
.monitor-row {
  display: flex;
  gap: vw(16);
  padding: 0 vw(8);
}

/* ===== 视频画面区 — Figma: 203px 宽, flex-col, gap 6px ===== */
.monitor-video {
  display: flex;
  flex-direction: column;
  gap: vh(6);
  align-items: center;
  width: vw(203);
  flex-shrink: 0;
}

/* 视频画面外层 — flex: 1 填充视频列高度（与事件列表对齐） */
.video-frame {
  position: relative;
  width: 100%;
  flex: 1;
  border-radius: 4px;
  overflow: hidden;
}

/* 视频画面图片 — Figma 真实截图，覆盖整个 frame */
.video-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 底部标签覆盖 — Figma: bg rgba(18,18,18,0.58), px 10px, py 4px */
.video-label {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: vh(4) vw(10);
  background: rgba(18, 18, 18, 0.58);
  border-radius: 0 0 4px 4px;
}

/* 标签文字 — Figma: YouSheBiaoTiHei 16px white */
.video-label-text {
  margin: 0;
  font-family: 'YouSheBiaoTiHei', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 400;
  line-height: 1;
  color: #ffffff;
  white-space: nowrap;
}

/* ===== 分页指示器 ===== */
.video-dots {
  display: flex;
  gap: vw(6);
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 圆角条 — Figma: 默认 16×4, active 32×4 */
.dot {
  display: block;
  height: vh(4);
  width: vw(16);
  border-radius: 2px;
  background: rgba(32, 92, 194, 0.56);
  transition: width 0.3s ease, background 0.3s ease;

  &--active {
    width: vw(32);
    background: #aeccff;
  }
}

/* ===== 预警事件列表 — Figma: flex-1, flex-col, gap 10px ===== */
.monitor-events {
  display: flex;
  flex-direction: column;
  gap: vh(10);
  flex: 1;
  min-width: 0;
}

/* 事件卡片 — Figma: bg #083f9e, px 8px, py 4px, rounded 2px */
.event-card {
  display: flex;
  flex-direction: column;
  gap: vh(10);
  padding: vh(4) vw(8);
  background: #083f9e;
  border-radius: 2px;
}

/* 事件头部 — Figma: flex items-center gap 14px */
.event-header {
  display: flex;
  align-items: center;
  gap: vw(14);
}

/* 事件标签 — Figma: p 6px, rounded 4px, 14px */
.event-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: vh(6) vw(6);
  border-radius: 4px;
  font-family: 'DingTalk_JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 14px);
  font-weight: 400;
  line-height: 1;
  white-space: nowrap;

  /* 已处置 — 青色系 */
  &--handled {
    color: #21dcdb;
    background: rgba(0, 164, 164, 0.3);
  }

  /* 未处置 — 红色系 */
  &--pending {
    color: #da372e;
    background: rgba(244, 67, 54, 0.3);
  }
}

/* 事件名称 — Figma: 16px white, Alibaba PuHuiTi Medium */
.event-name {
  margin: 0;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
  color: #ffffff;
  white-space: nowrap;
}

/* 事件时间 — Figma: 16px white, Alibaba PuHuiTi Medium */
.event-time {
  margin: 0;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
  color: #ffffff;
  white-space: nowrap;
}
</style>
