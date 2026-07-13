<template>
  <GongmaoSectionCard title="消防设施维保管理">
    <div class="fire-ledger-wrap">
      <!-- 消防台账 卡片 -->
      <div class="nav-card" @click="handleCardClick('ledger')">
        <div class="card-icon-wrap">
          <img
            class="card-icon"
            src="@/assets/bigscreen/gongmao-icon-fire-ledger.png"
            alt=""
          />
        </div>
        <div class="card-text">
          <p class="card-title">消防台账</p>
          <p class="card-subtitle">台账管控，隐患清零</p>
        </div>
        <img
          class="card-arrow"
          src="@/assets/bigscreen/gongmao-icon-arrow-right.svg"
          alt=""
        />
      </div>

      <!-- 维保监察 卡片 -->
      <div class="nav-card" @click="handleCardClick('inspect')">
        <div class="card-icon-wrap">
          <img
            class="card-icon"
            src="@/assets/bigscreen/gongmao-icon-maintenance-inspect.png"
            alt=""
          />
        </div>
        <div class="card-text">
          <p class="card-title">维保监察</p>
          <p class="card-subtitle">维保监察，安全护航</p>
        </div>
        <img
          class="card-arrow"
          src="@/assets/bigscreen/gongmao-icon-arrow-right.svg"
          alt=""
        />
      </div>
    </div>
  </GongmaoSectionCard>
</template>

<script setup lang="ts">
import GongmaoSectionCard from './GongmaoSectionCard.vue'

const emit = defineEmits<{
  (e: 'nav', target: 'ledger' | 'inspect'): void
}>()

function handleCardClick(target: 'ledger' | 'inspect') {
  emit('nav', target)
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* ===== 外层容器：填充父级 flex 列的剩余空间 ===== */
.fire-ledger-wrap {
  display: flex;
  align-items: center;
  gap: vw(12);
  padding: vh(8) vw(16);
}

/* ===== 导航卡片 ===== */
.nav-card {
  display: flex;
  align-items: center;
  gap: vw(16);
  flex: 1;
  min-width: 0;
  padding: vh(6) vw(12);
  background: #003c9c;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  user-select: none;

  &:hover {
    background: #0050cc;
    box-shadow: 0 0 12px rgba(0, 80, 204, 0.4);
  }

  &:active {
    background: #00308a;
  }
}

/* ===== 图标容器 (Figma: 42×42) ===== */
.card-icon-wrap {
  width: vw(42);
  height: vh(42);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* ===== 文字区域 (Figma: flex-1, gap 6px) ===== */
.card-text {
  display: flex;
  flex-direction: column;
  gap: vh(6);
  flex: 1;
  min-width: 0;
}

/* 标题 — Alibaba_PuHuiTi Medium 18px, #d8d8d8, tracking 2.88px */
.card-title {
  margin: 0;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(13px, calc(18 * var(--min-scale)), 18px);
  font-weight: 500;
  line-height: 1;
  color: #d8d8d8;
  letter-spacing: vw(2.88);
  white-space: nowrap;
}

/* 副标题 — Alibaba_PuHuiTi Regular 16px, #a2c4ff, tracking 2.56px */
.card-subtitle {
  margin: 0;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 400;
  line-height: 1;
  color: #a2c4ff;
  letter-spacing: vw(2.56);
  white-space: nowrap;
}

/* ===== 右侧箭头 (Figma: 24×24) ===== */
.card-arrow {
  display: block;
  width: vw(24);
  height: vh(24);
  flex-shrink: 0;
  opacity: 0.75;
  transition: opacity 0.2s ease, transform 0.2s ease;

  .nav-card:hover & {
    opacity: 1;
    transform: translateX(2px);
  }
}
</style>
