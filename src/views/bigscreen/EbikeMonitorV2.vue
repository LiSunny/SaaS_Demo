<template>
  <div class="ebike-v2">
    <!-- ===== 最低层级：校园三维模型（全屏铺底） ===== -->
    <EbikeV2CampusModel ref="campusRef" />

    <!-- ===== 大标题（浮于模型之上） ===== -->
    <EbikeV2Header />

    <!-- ===== 左右两列模块（浮于模型之上，中间留空展示模型） ===== -->
    <main class="ebike-v2__content">
      <div class="col col--left">
        <EbikeV2Card title="经营主体日常履责" class="col__fixed--536" />
        <EbikeV2Card title="自查隐患运维处置" class="col__fixed--260" />
        <EbikeV2Card title="共享电动自行车监管" class="col__fill" />
      </div>

      <div class="col col--right">
        <EbikeV2Card title="火灾预警点位联动" class="col__fixed--530" />
        <EbikeV2Card title="消控室值班离岗监控" class="col__fill" />
        <EbikeV2Card title="电动自行车火灾预案" class="col__fixed--122" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EbikeV2Header from './components/ebike-v2/EbikeV2Header.vue'
import EbikeV2Card from './components/ebike-v2/EbikeV2Card.vue'
import EbikeV2CampusModel from './components/ebike-v2/EbikeV2CampusModel.vue'
import { provideCampusModel, type CampusModelApi } from './components/ebike-v2/useCampusModel'

/** 模型实例：顶栏的「建筑导航」「昼夜切换」通过 provide/inject 取用 */
const campusRef = ref<CampusModelApi | null>(null)
provideCampusModel(campusRef)
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.ebike-v2 {
  position: relative;
  width: 100vw; height: 100vh;
  overflow: hidden;
  background: #00437A;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 两列悬浮在模型之上；容器整体不吃指针事件，中间留空处可交互三维模型 */
.ebike-v2__content {
  position: absolute;
  top: vh(86); left: 0; right: 0; bottom: vh(16);
  z-index: 10;
  display: flex;
  justify-content: space-between;
  padding: 0 vw(16);
  pointer-events: none;
}

.col {
  display: flex; flex-direction: column; gap: vh(16);
  min-height: 0;
  width: vw(468); flex-shrink: 0;
  pointer-events: auto;
}

/* 固定高度模块（按 Figma 设计稿像素） */
.col__fixed--536 { height: vh(536); }
.col__fixed--530 { height: vh(530); }
.col__fixed--260 { height: vh(260); }
.col__fixed--122 { height: vh(122); }

/* 撑满剩余高度的模块 */
.col__fill { flex: 1; min-height: 0; }
</style>
