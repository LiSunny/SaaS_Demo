<template>
  <!-- 商铺主体责任系统 · 悬浮浮层（屏幕左右各一列模块面板 / 底部图例条 / 全屏弹窗骨架）
       地图由 overview-engine 注入 hostEl，本组件 absolute 叠加悬浮。
       模块 = 独立组件（responsibility/modules/*），壳 = ModulePanel，小标题 = ModuleTitle -->
  <div class="ov-overlay">
    <!-- 左右各一列常驻面板（原两列同在右侧，2026-09-03 改为屏幕左右各一列） -->
    <div class="ov-side-panel">
      <div class="ov-col">
        <RegionStats />
        <KeySupervision />
        <RegionRisk />
      </div>
      <div class="ov-col">
        <DutyRateDist />
        <BizRiskDist />
        <AlarmHazardHandling />
      </div>
    </div>

    <!-- 底部图例条：原 .ov-map 左上角图例迁移至此（引擎 ovToggleTypeShow 通过 .ml-item[data-duty] 同步勾选态），
         同时替换并移除原底部筛选条 -->
    <div class="ov-legend-bar">
      <span class="ov-legend-title">商铺与商业街分布地图</span>
      <div class="ov-legend-item ml-item active" data-duty="streets" @click="toggleTypeShow('streets')">
        <span class="ml-check"></span>
        <span class="ml-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V8l8-4 8 4v13"/><path d="M9 21v-6h6v6"/><path d="M12 5v3"/></svg></span>
        <span class="ml-label">商业街</span>
        <span class="ml-count green">{{ streetsDuty }}</span>
        <span class="ml-count red">{{ streetsNotDuty }}</span>
      </div>
      <div class="ov-legend-item ml-item active" data-duty="shops" @click="toggleTypeShow('shops')">
        <span class="ml-check"></span>
        <span class="ml-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9l1-5h16l1 5"/><path d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0"/><path d="M5 12v8h14v-8"/><path d="M9 20v-5h6v5"/></svg></span>
        <span class="ml-label">商铺</span>
        <span class="ml-count green">{{ shopsDuty }}</span>
        <span class="ml-count red">{{ shopsNotDuty }}</span>
      </div>
      <div class="ov-legend-note">
        <span class="ml-note-item"><span class="ml-dot duty"></span>今日履职 <b>{{ dutyTotal }}</b></span>
        <span class="ml-note-item"><span class="ml-dot notduty"></span>今日未履职 <b>{{ notDutyTotal }}</b></span>
      </div>
    </div>

    <!-- 全屏居中弹窗骨架（内容下一阶段接入） -->
    <div class="ov-modal" v-if="modalOpen" @click.self="modalOpen = false">
      <div class="ov-modal-body">
        <div class="ov-modal-head">
          <span class="ov-modal-title">商铺档案</span>
          <div class="ov-modal-close" @click="modalOpen = false">✕</div>
        </div>
        <div class="ov-modal-content">
          <div class="ov-module-empty">弹窗内容占位 · 基本信息 / 责任状 / 履责日历</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RegionStats from './responsibility/modules/RegionStats.vue'
import KeySupervision from './responsibility/modules/KeySupervision.vue'
import RegionRisk from './responsibility/modules/RegionRisk.vue'
import DutyRateDist from './responsibility/modules/DutyRateDist.vue'
import BizRiskDist from './responsibility/modules/BizRiskDist.vue'
import AlarmHazardHandling from './responsibility/modules/AlarmHazardHandling.vue'
import { SHOPS, STREETS } from './data/shops'
import { ovToggleTypeShow } from './engine/overview-engine'

/* 弹窗开合（后续由地图标记点击 selectShop 触发，本阶段骨架） */
const modalOpen = ref(false)

/* ===== 底部图例条数据（与 overview-engine 原图例口径一致） ===== */
const streetsDuty = STREETS.filter(s => s.todayDuty).length
const streetsNotDuty = STREETS.length - streetsDuty
const shopsDuty = SHOPS.filter(s => s.todayDuty).length
const shopsNotDuty = SHOPS.length - shopsDuty
const dutyTotal = streetsDuty + shopsDuty
const notDutyTotal = streetsNotDuty + shopsNotDuty

/* 勾选/隐藏由引擎直接操作 .ml-item 的 active/off class（与地图点位显隐同步） */
function toggleTypeShow(key: 'streets' | 'shops') {
  ovToggleTypeShow(key)
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* 悬浮层：absolute 铺满 overview 宿主 */
.ov-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;      /* 不挡地图交互；子元素需交互再打开 */
  z-index: 10;
}

/* ===== 左右各一列常驻面板 =====
   两列分别锚定屏幕左/右（top:80 避开悬浮标题条 / bottom:22 对齐底部图例条），
   尺寸全部走 vw/vh 视口适配（基准 1920×1080，任意窗口等比缩放完整显示）；
   容器 pointer-events:none 让中间地图区域可交互，仅两列自身接管事件 */
.ov-side-panel {
  position: absolute;
  top: vh(80);
  bottom: vh(22);
  left: vw(24);
  right: vw(24);
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}
.ov-col {
  width: vw(384);
  display: flex;
  flex-direction: column;
  gap: vh(14);
  pointer-events: auto;
}
.ov-module-empty {
  font-size: 12px;
  color: rgba(192, 215, 232, 0.55);
  letter-spacing: 0.5px;
}

/* ===== 底部图例条（原 .ov-map 左上角图例迁移至此，替换原筛选条） =====
   勾选态 active/off 由引擎 ovToggleTypeShow 直接切换 class；
   尺寸走 vw/vh 视口适配 */
.ov-legend-bar {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: vh(22);
  display: flex;
  align-items: center;
  gap: vw(18);
  padding: vh(10) vw(18);
  background: rgba(10, 32, 56, 0.85);
  border: 1px solid rgba(110, 227, 237, 0.35);
  border-radius: vmin(10);
  color: #C0D7E8;
  font-size: vmin(13);
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  pointer-events: auto;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 26px rgba(0, 10, 30, 0.4);
}
.ov-legend-title {
  font-size: vmin(13);
  font-weight: 600;
  color: #F2F8FC;
  white-space: nowrap;
}
.ov-legend-item {
  display: flex;
  align-items: center;
  gap: vw(6);
  font-size: vmin(12);
  font-weight: 500;
  cursor: pointer;
  padding: vh(3) vw(6);
  margin: 0;
  border-radius: vmin(5);
  transition: background 0.15s;
  white-space: nowrap;
}
.ov-legend-item:hover { background: rgba(110, 227, 237, 0.10); }
.ml-label { white-space: nowrap; }
.ml-check {
  width: vmin(14);
  height: vmin(14);
  border-radius: vmin(3);
  border: 1.5px solid #5788a9;
  background: #0A3050;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.ml-item.active .ml-check { background: #2E78AD; border-color: #6FE3ED; }
.ml-item.active .ml-check::after {
  content: '';
  width: vmin(7);
  height: vmin(4);
  border-left: 2px solid #fff;
  border-bottom: 2px solid #fff;
  transform: rotate(-45deg);
  margin-top: vmin(-2);
}
.ml-item.off .ml-check { background: rgba(10, 48, 80, 0.5); border-color: #3d6284; }
.ml-item.off .ml-count { opacity: 0.5; }
.ml-icon {
  width: vmin(14);
  height: vmin(14);
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6FE3ED;
}
.ml-icon svg {
  width: vmin(14);
  height: vmin(14);
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ml-count {
  min-width: vw(20);
  text-align: center;
  font-size: vmin(11);
  font-weight: 700;
  line-height: 1;
  padding: vh(3) vw(5);
  border-radius: vmin(2);
  background: #0E3A5E;
  color: #F2F8FC;
}
.ml-count.green { background: rgba(61, 220, 151, 0.16); color: #7cf0b3; }
.ml-count.red { background: rgba(255, 112, 100, 0.16); color: #ff9d93; }
.ml-count + .ml-count { margin-left: vw(-4); }
.ov-legend-note {
  display: flex;
  gap: vw(12);
  padding-left: vw(14);
  border-left: 1px dashed rgba(110, 227, 237, 0.25);
  font-size: vmin(11);
  font-weight: 500;
  color: #C0D7E8;
  white-space: nowrap;
}
.ml-note-item { display: flex; align-items: center; gap: vw(5); }
.ml-note-item b { font-weight: 700; color: #FFFFFF; }
.ml-dot { width: vmin(8); height: vmin(8); border-radius: 50%; flex: none; }
.ml-dot.duty { background: #3DDC97; }
.ml-dot.notduty { background: #FF7064; }

/* ===== 全屏居中弹窗 ===== */
.ov-modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(4, 20, 40, 0.62);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  pointer-events: auto;
}
.ov-modal-body {
  width: min(760px, 90vw);
  max-height: 86vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, rgba(12, 78, 128, 0.96), rgba(7, 44, 74, 0.98));
  border: 1px solid rgba(110, 227, 237, 0.4);
  border-radius: 12px;
  color: #F2F8FC;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  box-shadow: 0 24px 70px rgba(0, 8, 26, 0.55);
  overflow: hidden;
}
.ov-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  border-bottom: 1px solid rgba(110, 227, 237, 0.25);
}
.ov-modal-title { font-size: 17px; font-weight: 700; }
.ov-modal-close {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 7px;
  cursor: pointer;
  color: #C0D7E8;
  font-size: 15px;
  border: 1px solid rgba(110, 227, 237, 0.3);
}
.ov-modal-close:hover { background: rgba(110, 227, 237, 0.12); }
.ov-modal-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
