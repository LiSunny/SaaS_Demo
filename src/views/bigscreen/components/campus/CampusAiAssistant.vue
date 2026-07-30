<template>
  <div class="ai-assistant">
    <!-- 气泡 -->
    <div class="bubble-wrap">
      <!-- SVG 原始 80×212，旋转 -90° 变为 212×80 -->
      <div class="bubble-rotator">
        <img class="bubble-bg" src="/campus-icons/m6-bubble.svg" alt="" />
      </div>
      <p class="bubble-text">
        我是韧性AI小助手！<br />有任何问题可以随时向我提问！
      </p>
    </div>

    <!-- 机器人 -->
    <img class="robot-img" src="@/assets/agent-robot.svg" alt="韧性AI" />
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.ai-assistant {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: vh(8);
}

/* ===== 气泡 ===== */
.bubble-wrap {
  position: relative;
  width: calc(212 * var(--min-scale));
  height: calc(80 * var(--min-scale));
}

/* 旋转容器：80×212 → 旋转 -90° → 视觉 212×80 */
.bubble-rotator {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(80 * var(--min-scale));
  height: calc(212 * var(--min-scale));
  transform: translate(-50%, -50%) rotate(-90deg);
}

.bubble-bg {
  width: 100%;
  height: 100%;
  display: block;
}

.bubble-text {
  position: absolute;
  left: 50%;
  top: 18%;
  transform: translateX(-50%);
  margin: 0;
  z-index: 1;
  width: calc(171 * var(--min-scale));
  text-align: center;
  font-family: 'Source-KeynoteartHans', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(9px, calc(12 * var(--min-scale)), 12px);
  color: #ffffff;
  line-height: 1.5;
  text-shadow: 0 0 4px rgba(0, 221, 255, 0.68);
}

/* ===== 机器人（带缓动弹簧动画） ===== */
.robot-img {
  width: calc(115 * var(--min-scale));
  height: calc(154 * var(--min-scale));
  object-fit: contain;
  animation: robot-bounce 3s ease-in-out infinite;
}

@keyframes robot-bounce {
  0%, 100% { transform: translateY(0); }
  15% { transform: translateY(calc(-8 * var(--min-scale))); }
  30% { transform: translateY(0); }
  45% { transform: translateY(calc(-4 * var(--min-scale))); }
  60% { transform: translateY(0); }
}
</style>
