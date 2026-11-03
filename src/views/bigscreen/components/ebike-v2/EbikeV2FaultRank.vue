<template>
  <EbikeV2Card title="多发故障排名">
    <div class="rank">
      <div v-for="(r, i) in ranks" :key="r.type" class="rank__row">
        <div class="rank__info">
          <div class="rank__line">
            <!-- 名次徽标：设计稿 117:21489 导出的斜切色块（Figma 原始素材） -->
            <span class="rank__badge">
              <img class="rank__badge-bg" :src="rankBadge" alt="" />
              <span class="rank__badge-no">{{ pad2(i + 1) }}</span>
            </span>

            <span class="rank__type">{{ r.type }}</span>
          </div>

          <!-- 占比条：设计稿 117:21496（灰底 + 蓝色填充，填充长度取百分比） -->
          <span class="rank__bar">
            <i class="rank__bar-fill" :style="{ width: r.rate + '%' }" />
          </span>
        </div>

        <span class="rank__rate">{{ r.rate }}%</span>
      </div>

      <span v-if="!ranks.length" class="rank__empty">该系统暂无异常点位</span>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 多发故障排名（系统监测页右列下卡）
 *
 * 版式按 Figma「智能安全管控平台/系统监测」节点 117:21484：
 *   每行 = [名次徽标 + 故障类型] …… 右对齐百分比，
 *   徽标行下方一条占比条（灰底 + 蓝色填充），行内间距按设计稿：19 / 19 / 12。
 *   行距 18，行高 38。
 *
 * 数据来自实时设备数据（monitor-data.ts 的 monitorFaultRanksOf）：
 *   故障类型 = 按**设备类型**聚合（消火栓环网阀门 / 管网压力探测器 / 末端试水装置 …）
 *   占比     = 该类型的异常设备台数 ÷ 全部异常设备台数
 * 与「设备设施管理 → 运行监控」的三个系统主页同源 —— 哪类设备出问题最多，
 * 画布上对应的图元就会亮起闪烁角标，两边说的是同一件事。
 */
import EbikeV2Card from './EbikeV2Card.vue'
import rankBadge from '@/assets/bigscreen/ebike-v2/monitor/rank-badge-01.svg'
import type { MonitorRankRow } from './monitor-data'

const props = withDefaults(
  defineProps<{
    /** 排名行（由父组件从实时设备数据派生） */
    ranks?: MonitorRankRow[]
  }>(),
  { ranks: () => [] },
)

/** 名次补零：01 / 02 */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 列表：设计稿 #117:21484（column gap 18，padding 16）
   高度按内容（设计稿该卡 vertical: hug），行数按真实数据有多少列多少。 */
.rank {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: vh(18);
  padding: vh(16) vw(16);
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

/* 名次徽标：37×20 斜切色块（设计稿导出的原始素材） */
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

/* 故障类型 18px：设计稿同一套蓝白渐变 */
.rank__type {
  font-family: 'DingTalk JinBuTi', 'PingFang SC', sans-serif;
  font-size: clamp(14px, calc(18 * var(--min-scale)), 18px);
  background: linear-gradient(180deg, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* 空态 */
.rank__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  color: rgba(143, 176, 216, 0.7);
}
</style>
