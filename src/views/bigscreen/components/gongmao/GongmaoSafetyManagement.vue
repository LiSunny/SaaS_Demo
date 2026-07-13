<template>
  <GongmaoSectionCard title="应急安全文化建设" class="safety-culture">
    <div class="culture-grid">
      <!-- 第 1 行：安全制度 | 应急预案 -->
      <div class="culture-row">
        <div class="culture-card">
          <div class="card-icon-wrap">
            <img
              class="card-icon"
              src="@/assets/bigscreen/gongmao-icon-safety-system.png"
              alt="安全制度"
            />
          </div>
          <div class="card-text">
            <div class="card-title-row">
              <span class="card-title">安全制度</span>
              <img
                class="card-arrow"
                src="@/assets/bigscreen/gongmao-icon-arrow-right.svg"
                alt=""
              />
            </div>
            <span class="card-subtitle">规范基石·有章可循</span>
          </div>
        </div>
        <div class="culture-card">
          <div class="card-icon-wrap">
            <img
              class="card-icon"
              src="@/assets/bigscreen/gongmao-icon-emergency-plan.png"
              alt="应急预案"
            />
          </div>
          <div class="card-text">
            <div class="card-title-row">
              <span class="card-title">应急预案</span>
              <img
                class="card-arrow"
                src="@/assets/bigscreen/gongmao-icon-arrow-right.svg"
                alt=""
              />
            </div>
            <span class="card-subtitle">快速响应·防患未然</span>
          </div>
        </div>
      </div>

      <!-- 第 2 行：教育培训 | 应急演练 -->
      <div class="culture-row">
        <div class="culture-card">
          <div class="card-icon-wrap">
            <img
              class="card-icon"
              src="@/assets/bigscreen/gongmao-icon-education.png"
              alt="教育培训"
            />
          </div>
          <div class="card-text">
            <div class="card-title-row">
              <span class="card-title">教育培训</span>
              <img
                class="card-arrow"
                src="@/assets/bigscreen/gongmao-icon-arrow-right.svg"
                alt=""
              />
            </div>
            <span class="card-subtitle">知识沉淀·赋能全员</span>
          </div>
        </div>
        <div class="culture-card">
          <div class="card-icon-wrap">
            <img
              class="card-icon"
              src="@/assets/bigscreen/gongmao-icon-drill.png"
              alt="应急演练"
            />
          </div>
          <div class="card-text">
            <div class="card-title-row">
              <span class="card-title">应急演练</span>
              <img
                class="card-arrow"
                src="@/assets/bigscreen/gongmao-icon-arrow-right.svg"
                alt=""
              />
            </div>
            <span class="card-subtitle">实战检验·磨炼战力</span>
          </div>
        </div>
      </div>

      <!-- 第 3 行：班前会 | 交接班 -->
      <div class="culture-row">
        <div class="culture-card">
          <div class="card-icon-wrap">
            <img
              class="card-icon"
              src="@/assets/bigscreen/gongmao-icon-preshift.png"
              alt="班前会"
            />
          </div>
          <div class="card-text">
            <div class="card-title-row">
              <span class="card-title">班前会</span>
              <img
                class="card-arrow"
                src="@/assets/bigscreen/gongmao-icon-arrow-right.svg"
                alt=""
              />
            </div>
            <span class="card-subtitle">晨间交底·安全起步</span>
          </div>
        </div>
        <div class="culture-card">
          <div class="card-icon-wrap">
            <img
              class="card-icon"
              src="@/assets/bigscreen/gongmao-icon-handover.png"
              alt="交接班"
            />
          </div>
          <div class="card-text">
            <div class="card-title-row">
              <span class="card-title">交接班</span>
              <img
                class="card-arrow"
                src="@/assets/bigscreen/gongmao-icon-arrow-right.svg"
                alt=""
              />
            </div>
            <span class="card-subtitle">严细交接 · 安全前行</span>
          </div>
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

.safety-culture {
  /* 确保模块完整显示，不收缩 */
  flex-shrink: 0;
}

.culture-grid {
  display: flex;
  flex-direction: column;
  gap: vh(8);
  padding: vh(8) vw(12);
}

/* ===== 每一行 ===== */
.culture-row {
  display: flex;
  gap: vw(12);
}

/* ===== 卡片 — Figma: bg-[#003c9c], flex:1, gap:16px, px:12px, py:6px ===== */
.culture-card {
  display: flex;
  flex: 1 0 0;
  min-width: 0;
  align-items: center;
  gap: vw(16);
  padding: vh(6) vw(12);
  background: #003c9c;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #0048b8;
  }
}

/* ===== 图标区域 (Figma: 42×42) ===== */
.card-icon-wrap {
  position: relative;
  width: vw(42);
  height: vh(42);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* ===== 文字区域 ===== */
.card-text {
  display: flex;
  flex: 1 0 0;
  min-width: 0;
  flex-direction: column;
  gap: vh(6);
}

/* ===== 标题行 (标题 + 箭头) ===== */
.card-title-row {
  display: flex;
  align-items: center;
  gap: vw(10);
}

/* ===== 标题文字 (Figma: Alibaba PuHuiTi Medium, 18px, #d8d8d8, tracking 2.88px) ===== */
.card-title {
  flex: 1 0 0;
  min-width: 0;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(13px, calc(18 * var(--min-scale)), 18px);
  font-weight: 500;
  color: #d8d8d8;
  letter-spacing: vw(2.88);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 右箭头图标 (Figma: 24×24) ===== */
.card-arrow {
  display: block;
  width: vw(24);
  height: vh(24);
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.culture-card:hover .card-arrow {
  opacity: 1;
}

/* ===== 副标题 (Figma: Alibaba PuHuiTi Regular, 16px, #a2c4ff, tracking 2.56px) ===== */
.card-subtitle {
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 400;
  color: #a2c4ff;
  letter-spacing: vw(2.56);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
