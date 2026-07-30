<template>
  <div class="safety-duty">
    <!-- 区域切换 Tab -->
    <div class="tab-row">
      <button
        class="tab-btn"
        :class="{ active: activeZone === 'dorm' }"
        @click="activeZone = 'dorm'"
      >
        <img class="tab-icon" src="/campus-icons/m1-icon-02.svg" alt="" />
        <span>宿舍区履责</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeZone === 'teach' }"
        @click="activeZone = 'teach'"
      >
        <img class="tab-icon" src="/campus-icons/m1-icon-12.svg" alt="" />
        <span>教学区履责</span>
      </button>
      <div class="tab-filter">
        <span>6月</span>
        <img class="filter-icon" src="/campus-icons/m1-icon-09.svg" alt="" />
      </div>
    </div>

    <!-- 统计卡片行 -->
    <div class="stat-row">
      <!-- 履责数据（带椭圆装饰） -->
      <div class="stat-card stat-card--main">
        <img class="stat-circle" src="/campus-icons/m1-icon-04.svg" alt="" />
        <img class="stat-check" src="/campus-icons/m1-icon-01.svg" alt="" />
        <img class="stat-bg-wide" src="/campus-icons/m1-icon-06.svg" alt="" />
        <div class="stat-text">
          <span class="stat-label">履责数据</span>
          <span class="stat-value">100<span class="stat-unit">个</span></span>
        </div>
      </div>

      <!-- 已履责 -->
      <div class="stat-card">
        <img class="stat-bg-narrow" src="/campus-icons/m1-icon-07.svg" alt="" />
        <div class="stat-text stat-text--offset">
          <span class="stat-label">已履责</span>
          <span class="stat-value">90<span class="stat-unit">个</span></span>
        </div>
      </div>

      <!-- 上报异常 -->
      <div class="stat-card">
        <img class="stat-bg-narrow" src="/campus-icons/m1-icon-07.svg" alt="" />
        <div class="stat-text stat-text--offset">
          <span class="stat-label">上报异常</span>
          <span class="stat-value">90<span class="stat-unit">个</span></span>
        </div>
      </div>
    </div>

    <!-- 人员卡片行 -->
    <div class="personnel-row">
      <div
        v-for="p in personnel"
        :key="p.name"
        class="personnel-card"
      >
        <img
          class="personnel-avatar"
          :src="p.done ? '/campus-icons/m1-icon-05.svg' : '/campus-icons/m1-icon-13.svg'"
          alt=""
        />
        <div class="personnel-info">
          <span class="personnel-role">{{ p.role }}</span>
          <span class="personnel-name">{{ p.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeZone = ref<'dorm' | 'teach'>('dorm')

const personnel = [
  { role: '宿管员', name: '陈恩博', done: true },
  { role: '电工', name: '李晓宣', done: false },
  { role: '电工', name: '李强', done: false },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.safety-duty {
  display: flex;
  flex-direction: column;
  gap: vh(18);
  height: 100%;
}

/* ===== Tab 切换行 ===== */
.tab-row {
  display: flex;
  align-items: center;
  gap: vw(12);
  height: vh(47);
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: vw(10);
  flex: 1;
  height: 100%;
  padding: vh(10) vw(10);
  border: none;
  border-radius: 4px 4px 0 0;
  background: transparent;
  cursor: pointer;
  font-family: inherit;

  span {
    font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
    font-size: clamp(13px, calc(20 * var(--min-scale)), 20px);
    font-weight: 500;
    color: #00c0c0;
    white-space: nowrap;
  }

  &.active {
    background: linear-gradient(180deg, rgba(0, 215, 215, 0.15) 0%, rgba(0, 215, 215, 0) 100%);
    span { color: #ffffff; }
  }
}

.tab-icon {
  width: calc(24 * var(--min-scale));
  height: calc(24 * var(--min-scale));
  flex-shrink: 0;
}

.tab-filter {
  display: flex;
  align-items: center;
  gap: vw(6);
  padding: vh(6) vw(8);
  border-radius: 4px;
  cursor: pointer;

  span {
    font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
    font-size: clamp(11px, calc(14 * var(--min-scale)), 14px);
    font-weight: 500;
    color: #ffffff;
  }
}

.filter-icon {
  width: calc(16 * var(--min-scale));
  height: calc(16 * var(--min-scale));
}

/* ===== 统计卡片行 ===== */
.stat-row {
  display: flex;
  gap: vw(12);
}

.stat-card {
  position: relative;
  flex: 1;
  min-height: vh(78);

  &--main {
    flex: 1.3;
  }
}

/* 椭圆装饰（第一张卡片） */
.stat-circle {
  position: absolute;
  left: 0;
  top: 0;
  width: calc(78 * var(--min-scale));
  height: calc(78 * var(--min-scale));
}

.stat-check {
  position: absolute;
  left: calc(19 * var(--min-scale));
  top: calc(21 * var(--min-scale));
  width: calc(40.6 * var(--min-scale));
  height: calc(36 * var(--min-scale));
}

/* 宽版背景（第一张卡片） */
.stat-bg-wide {
  position: absolute;
  right: 0;
  bottom: 0;
  width: calc(202.5 * var(--min-scale));
  height: calc(47.5 * var(--min-scale));
}

/* 窄版背景（第二、三张卡片） */
.stat-bg-narrow {
  position: absolute;
  right: 0;
  bottom: 0;
  width: calc(156.5 * var(--min-scale));
  height: calc(47.5 * var(--min-scale));
}

/* 文字内容 */
.stat-text {
  position: absolute;
  left: calc(88 * var(--min-scale));
  bottom: vh(13);
  display: flex;
  flex-direction: column;
  gap: vh(4);
  z-index: 1;

  &--offset {
    left: calc(45 * var(--min-scale));
    bottom: vh(13);
  }
}

.stat-label {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(13px, calc(18 * var(--min-scale)), 18px);
  font-weight: 500;
  color: #ffffff;
}

.stat-value {
  font-family: 'DingTalk JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(18px, calc(28 * var(--min-scale)), 28px);
  color: #ffffff;
}

.stat-unit {
  font-size: clamp(12px, calc(18 * var(--min-scale)), 18px);
  margin-left: vw(4);
}

/* ===== 人员卡片行 ===== */
.personnel-row {
  display: flex;
  gap: vw(12);
}

.personnel-card {
  display: flex;
  align-items: center;
  gap: vw(10);
  flex: 1;
  padding: vh(6) vw(10);
  background: rgba(0, 215, 215, 0.05);
  border-radius: 4px;
}

.personnel-avatar {
  width: calc(42 * var(--min-scale));
  height: calc(42 * var(--min-scale));
  flex-shrink: 0;
}

.personnel-info {
  display: flex;
  flex-direction: column;
  gap: vh(4);
}

.personnel-role {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(11px, calc(16 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #f0f0f0;
}

.personnel-name {
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: clamp(13px, calc(18 * var(--min-scale)), 18px);
  font-weight: 500;
  color: #f0f0f0;
}
</style>
