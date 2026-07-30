<template>
  <div class="alarm-rescue">
    <!-- 远程通断电 -->
    <div class="rc-card rc-card--control">
      <p class="rc-title">远程通断电</p>
      <img class="rc-ctrl-icon" src="/campus-icons/m9-power.svg" alt="" />
      <div class="rc-ctrl-action">
        <span>去控制</span>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>

    <!-- 女生宿舍 -->
    <div class="rc-card rc-card--normal">
      <img class="rc-building" src="/campus-icons/m9-female-dorm.svg" alt="" />
      <p class="rc-name rc-name--gradient">女生宿舍</p>
      <p class="rc-status rc-status--ok">正常</p>
    </div>

    <!-- 男生宿舍 -->
    <div class="rc-card rc-card--alarm">
      <img class="rc-building" src="/campus-icons/m9-male-dorm.svg" alt="" />
      <p class="rc-name rc-name--gradient">男生宿舍</p>
      <p class="rc-status rc-status--fire">火警</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.alarm-rescue {
  display: flex;
  gap: vw(16);
  height: 100%;
}

.rc-card {
  flex: 1;
  border-radius: 4px;
  position: relative;
  display: flex;
}

/* ===== 远程通断电（Control） ===== */
.rc-card--control {
  background: rgba(72, 229, 229, 0.05);
  border: 1px solid rgba(72, 229, 229, 0.8);
}

.rc-title {
  position: absolute;
  left: vw(14);
  top: vh(10);
  margin: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(13px, calc(20 * var(--min-scale)), 20px);
  font-weight: 500;
  color: #ffffff;
}

.rc-ctrl-icon {
  position: absolute;
  left: calc(24.5 * var(--min-scale));
  bottom: calc(17 * var(--min-scale));
  width: calc(36 * var(--min-scale));
  height: calc(36 * var(--min-scale));
}

.rc-ctrl-action {
  position: absolute;
  right: calc(12 * var(--min-scale));
  bottom: calc(8 * var(--min-scale));
  display: flex;
  align-items: center;
  color: #ffffff;
  cursor: pointer;

  span {
    font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
    font-size: clamp(11px, calc(16 * var(--min-scale)), 16px);
  }
}

/* ===== 宿舍卡片（Normal & Alarm） ===== */
.rc-card--normal {
  background: rgba(72, 229, 229, 0.08);
  border: 1px solid rgba(72, 229, 229, 0.8);
}

.rc-card--alarm {
  background: rgba(244, 67, 54, 0.28);
  border: 1px solid #f44336;
}

.rc-building {
  position: absolute;
  left: calc(6 * var(--min-scale));
  top: 50%;
  transform: translateY(-50%);
  width: calc(62 * var(--min-scale));
  height: calc(62 * var(--min-scale));
}

.rc-name {
  position: absolute;
  left: calc(73 * var(--min-scale));
  top: vh(13);
  margin: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(13px, calc(20 * var(--min-scale)), 20px);
  font-weight: 500;
  white-space: nowrap;

  &--gradient {
    background: linear-gradient(180deg, #ffffff 0%, #84d6ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.rc-status {
  position: absolute;
  left: calc(73 * var(--min-scale));
  bottom: vh(8);
  margin: 0;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(16px, calc(24 * var(--min-scale)), 24px);
  font-weight: 500;

  &--ok { color: #3ce336; }
  &--fire { color: #da372e; }
}
</style>
