<template>
  <div class="ranking-top5">
    <div class="ranking-top5__header">
      <div class="ranking-top5__bar" />
      <span class="ranking-top5__title">{{ title }}</span>
    </div>
    <div class="ranking-top5__list">
      <div
        v-for="(item, index) in items"
        :key="item.name"
        class="ranking-top5__item"
      >
        <div class="ranking-top5__info">
          <div class="ranking-top5__row">
            <!-- 排名序号：前3名优先用图片，无图片则 CSS -->
            <span v-if="index <= 2 && medalSrc(index)" class="ranking-top5__medal">
              <img :src="medalSrc(index)" alt="" />
            </span>
            <span v-else class="ranking-top5__index" :class="rankMedalClass(index)">
              {{ String(index + 1).padStart(2, '0') }}
            </span>
            <!-- 名称 -->
            <span class="ranking-top5__name" :class="rankNameClass(index)">{{ item.name }}</span>
          </div>
          <!-- 进度条 -->
          <div class="ranking-top5__progress">
            <div class="ranking-top5__progress-bg" />
            <div class="ranking-top5__progress-fill" :style="{ width: item.rate + '%' }" />
          </div>
        </div>
        <!-- 百分比 -->
        <span class="ranking-top5__percent">{{ item.rate }}%</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  items: { name: string; rate: number }[]
  /** 金牌图片路径，放在 src/assets/bigscreen/ 下 */
  goldSrc?: string
  /** 银牌图片路径 */
  silverSrc?: string
  /** 铜牌图片路径 */
  bronzeSrc?: string
}>(), {
  goldSrc: () => new URL('@/assets/bigscreen/rank-medal-gold.png', import.meta.url).href,
  silverSrc: () => new URL('@/assets/bigscreen/rank-medal-silver.png', import.meta.url).href,
  bronzeSrc: () => new URL('@/assets/bigscreen/ank-medal-bronze.png', import.meta.url).href,
})

const MEDAL_SRCS = ['goldSrc', 'silverSrc', 'bronzeSrc'] as const

function medalSrc(index: number): string {
  return (props as any)[MEDAL_SRCS[index]] || ''
}

function rankMedalClass(index: number): string {
  if (index === 0) return 'ranking-top5__index--gold'
  if (index === 1) return 'ranking-top5__index--silver'
  if (index === 2) return 'ranking-top5__index--bronze'
  return ''
}

function rankNameClass(index: number): string {
  if (index === 0) return 'ranking-top5__name--gold'
  if (index === 1) return 'ranking-top5__name--silver'
  if (index === 2) return 'ranking-top5__name--bronze'
  return ''
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.ranking-top5 {
  display: flex;
  flex-direction: column;
  gap: vh(12);
}

/* ===== 标题行 ===== */
.ranking-top5__header {
  display: flex;
  align-items: center;
  gap: vw(12);
  flex-shrink: 0;
}

.ranking-top5__bar {
  width: 4px;
  height: 18px;
  background: #2584ab;
  border-radius: 2px;
  box-shadow: 0 0 6px rgba(37, 132, 171, 0.36);
  flex-shrink: 0;
}

.ranking-top5__title {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(18 * var(--min-scale)), 20px);
  font-weight: 500;
  color: #ffffff;
  line-height: normal;
  white-space: nowrap;
}

/* ===== 排名列表 ===== */
.ranking-top5__list {
  display: flex;
  flex-direction: column;
  gap: vh(4);
}

.ranking-top5__item {
  display: flex;
  align-items: center;
  gap: vw(18);
  height: vh(38);
}

.ranking-top5__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(4);
}

.ranking-top5__row {
  display: flex;
  align-items: center;
  gap: vw(19);
}

/* ===== 奖章图片容器（前3名） ===== */
.ranking-top5__medal {
  position: relative;
  width: 30px;
  height: 19px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.ranking-top5__medal-num {
  position: relative;
  z-index: 1;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

/* ===== 排名序号（第4-5名，纯CSS） ===== */
.ranking-top5__index {
  width: 30px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #d4e3ff;
  background: rgba(60, 211, 215, 0.12);
  border: 1px solid rgba(60, 211, 215, 0.15);
  border-radius: 3px;
  flex-shrink: 0;
  line-height: 1;
}

/* 无图片时 CSS 渐变回退 */
.ranking-top5__index--gold {
  color: #fff;
  height: 19px;
  background: linear-gradient(135deg, #f9d567 0%, #c8960c 100%);
  border: none;
  box-shadow: 0 0 6px rgba(249, 213, 103, 0.35);
}

.ranking-top5__index--silver {
  color: #fff;
  height: 19px;
  background: linear-gradient(135deg, #e8eff1 0%, #8a9ba8 100%);
  border: none;
  box-shadow: 0 0 6px rgba(232, 239, 241, 0.3);
}

.ranking-top5__index--bronze {
  color: #fff;
  height: 19px;
  background: linear-gradient(135deg, #efac6f 0%, #b8651f 100%);
  border: none;
  box-shadow: 0 0 6px rgba(239, 172, 111, 0.3);
}

/* ===== 名称 ===== */
.ranking-top5__name {
  font-family: 'PingFang SC', 'Alibaba PuHuiTi', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #d4e3ff;
  white-space: nowrap;
}

.ranking-top5__name--gold {
  color: #f9d567;
  font-weight: 500;
}

.ranking-top5__name--silver {
  color: #e8eff1;
  font-weight: 500;
}

.ranking-top5__name--bronze {
  color: #efac6f;
  font-weight: 500;
}

/* ===== 进度条 ===== */
.ranking-top5__progress {
  display: grid;
  grid-template-rows: max-content;
  width: 100%;
}

.ranking-top5__progress-bg {
  grid-column: 1;
  grid-row: 1;
  height: 6px;
  border-radius: 3px;
  background: #00468f;
}

.ranking-top5__progress-fill {
  grid-column: 1;
  grid-row: 1;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(174.27deg, rgb(32, 92, 169) 9.38%, rgb(20, 141, 255) 90.5%);
}

/* ===== 百分比 ===== */
.ranking-top5__percent {
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: normal;
}
</style>
