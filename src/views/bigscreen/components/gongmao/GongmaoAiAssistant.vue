<template>
  <GongmaoSectionCard title="AI师傅带徒培训">
    <div class="ai-assistant-wrap">
      <!-- 机器人头像 (Figma: 86×86px) -->
      <div class="robot-avatar">
        <img
          class="robot-img"
          src="@/assets/bigscreen/gongmao-ai-robot.png"
          alt="AI助手"
        />
      </div>

      <!-- 聊天气泡 (Figma: 385×86px, 圆角矩形 + 左侧箭头) -->
      <div class="chat-bubble">
        <img
          class="bubble-bg"
          src="@/assets/bigscreen/gongmao-ai-bubble.svg"
          alt=""
        />
        <div class="bubble-text">
          <p class="bubble-line">我是小安助手！</p>
          <p class="bubble-line">有什么安全生产相关的问题可以向我提问！</p>
        </div>
      </div>
    </div>
  </GongmaoSectionCard>
</template>

<script setup lang="ts">
import GongmaoSectionCard from './GongmaoSectionCard.vue'
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ===== 内容容器 ===== */
.ai-assistant-wrap {
  display: flex;
  align-items: center;
  gap: vw(28);
  padding: vh(16) vw(24);
}

/* ===== 机器人头像 (Figma: 86×86px) ===== */
.robot-avatar {
  width: vw(86);
  height: vh(86);
  flex-shrink: 0;
}

.robot-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* ===== 聊天气泡 (Figma: 385×86px) ===== */
.chat-bubble {
  position: relative;
  width: vw(385);
  height: vh(86);
  flex-shrink: 0;
}

.bubble-bg {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

/* 气泡内文字 (Figma: left 41.33px, 垂直居中, 17px 白色) */
.bubble-text {
  position: absolute;
  left: vw(41);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
}

.bubble-line {
  margin: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: clamp(12px, calc(17 * var(--min-scale)), 17px);
  font-weight: 400;
  line-height: 1.6;
  color: #ffffff;
  white-space: nowrap;

  &:first-child {
    margin-bottom: vh(4);
  }
}
</style>
