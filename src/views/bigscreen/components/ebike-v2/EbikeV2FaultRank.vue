<template>
  <EbikeV2Card title="多发故障排名">
    <div class="rank">
      <div v-for="(r, i) in RANKS" :key="r.type" class="rank__row">
        <div class="rank__info">
          <div class="rank__line">
            <!-- 名次徽标：设计稿 7:332 的斜切色块 + 白色粗体序号 -->
            <span class="rank__badge">
              <svg
                class="rank__badge-bg"
                viewBox="0 0 37 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="rank-badge-grad"
                    x1="32.4165" y1="2" x2="6.9165" y2="17.5"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#387DD7" />
                    <stop offset="0.490385" stop-color="#4081D9" stop-opacity="0.56" />
                    <stop offset="1" stop-color="#063F91" stop-opacity="0.89" />
                  </linearGradient>
                </defs>
                <path
                  d="M8.6839 0.569509C8.84985 0.221573 9.20101 0 9.58649 0H35.8316C36.5669 0 37.0508 0.766842 36.7342 1.43049L28.1491 19.4305C27.9831 19.7784 27.632 20 27.2465 20H1.00139C0.266123 20 -0.217727 19.2332 0.0988017 18.5695L8.6839 0.569509Z"
                  fill="url(#rank-badge-grad)"
                />
              </svg>
              <span class="rank__badge-no">{{ pad2(i + 1) }}</span>
            </span>

            <span class="rank__type">{{ r.type }}</span>
            <span class="rank__device">{{ r.device }}</span>
          </div>

          <!-- 占比条：设计稿 7:337（灰底 + 蓝色填充，填充长度取百分比） -->
          <span class="rank__bar">
            <i class="rank__bar-fill" :style="{ width: r.rate + '%' }" />
          </span>
        </div>

        <span class="rank__rate">{{ r.rate }}%</span>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 多发故障排名
 *
 * 版式照 Figma「多发故障排名」卡内结构（node 7:311 的 #7:328 列表）：
 *   每行 = [名次徽标 + 故障类型 + 设备类型] + 右侧百分比，
 *   徽标行下方一条占比条（灰底 + 蓝色填充）。
 *   行内间距按设计稿：徽标与文字 19、条目之间 18、文字行与占比条 12。
 *
 * 数据为设计稿演示值（接入真实故障统计接口前不落库）。
 */
import EbikeV2Card from './EbikeV2Card.vue'

interface FaultRank {
  /** 故障类型 */
  type: string
  /** 设备类型 */
  device: string
  /** 占比（%），同时决定占比条长度 */
  rate: number
}

/** 演示数据：与设计稿一致 */
const RANKS: FaultRank[] = [
  { type: '欠压故障', device: '独立式感烟探测器', rate: 96 },
  { type: '底座脱离', device: '独立式感烟探测器', rate: 36 },
  { type: '主电故障', device: '火灾报警主机', rate: 36 },
  { type: '备电故障', device: '火灾报警主机', rate: 36 },
]

/** 名次补零：01 / 02 */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 列表：设计稿 #7:328（column gap 18，padding 0 16）
   上内边距补标题栏与列表之间的 16px 间距（设计稿标题高 48，本页标题栏高 40） */
.rank {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: vh(18);
  padding: vh(16) vw(16) 0;
  overflow: hidden;
}

/* 单行：左信息列 + 右百分比，行高 38 */
.rank__row {
  flex-shrink: 0;
  height: vh(38);
  display: flex;
  align-items: center;
  gap: vw(19);
}

/* 左列：徽标行 + 占比条，列间距 12 */
.rank__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(12);
}

.rank__line {
  display: flex;
  align-items: center;
  gap: vw(19);
  min-width: 0;
}

/* 名次徽标：37×20 斜切色块 */
.rank__badge {
  position: relative;
  flex-shrink: 0;
  width: vw(37);
  height: vh(20);
}

.rank__badge-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.rank__badge-no {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Douyin Sans', sans-serif;
  font-weight: 700;
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
  color: #ffffff;
}

/* 故障类型 18px / 设备类型 16px：设计稿同一套蓝白渐变，
   小字号的渐变行程更短，视觉上自然弱一档 */
.rank__type,
.rank__device {
  font-family: 'DingTalk JinBuTi', 'PingFang SC', sans-serif;
  background: linear-gradient(180deg, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
}

.rank__type {
  font-size: clamp(14px, calc(18 * var(--min-scale)), 18px);
}

.rank__device {
  font-size: clamp(14px, calc(16 * var(--min-scale)), 16px);
}

/* 占比条：灰底 + 蓝色填充 */
.rank__bar {
  display: block;
  height: vh(6);
  border-radius: vh(3);
  background: #d9d9d9;
  overflow: hidden;
}

.rank__bar-fill {
  display: block;
  height: 100%;
  border-radius: vh(3);
  background: linear-gradient(180deg, #205ca9 0%, #00439a 100%);
}

/* 百分比 */
.rank__rate {
  flex-shrink: 0;
  font-family: 'Douyin Sans', sans-serif;
  font-weight: 700;
  font-size: clamp(14px, calc(20 * var(--min-scale)), 20px);
  background: linear-gradient(180deg, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
}
</style>
