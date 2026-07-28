<template>
  <div class="cockpit">
    <!-- ===== 顶部标题栏 ===== -->
    <BigscreenHeader
      :title="titleText"
      :username="userStore.user?.realName || ''"
      :bigscreens="bigscreens"
      :current-bigscreen-id="currentBigscreenId"
    />

    <!-- ===== 内容区：三栏布局 ===== -->
    <div class="cockpit-content">

      <!-- ==================== 左侧列：自律管理 ==================== -->
      <div class="col-left">
        <!-- 1. 企业主体自律概览 -->
        <div class="card">
          <BigscreenModuleTitle title="企业主体自律概览" subtitle="Discipline" />
          <!-- 统计 -->
          <div class="card-stats">
            <div class="stat-item">
              <div class="stat-hex">
                <img src="@/assets/bigscreen/enterprise-cockpit/icon-building.svg" alt="" class="stat-hex-icon" />
              </div>
              <div class="stat-info">
                <span class="stat-label">规上企业接入</span>
                <span class="stat-value">10 <small>家</small></span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-hex">
                <img src="@/assets/bigscreen/enterprise-cockpit/icon-warning.svg" alt="" class="stat-hex-icon" />
              </div>
              <div class="stat-info">
                <span class="stat-label">规下企业接入</span>
                <span class="stat-value">102 <small>家</small></span>
              </div>
            </div>
          </div>
          <!-- 表格 -->
          <div class="data-table">
            <div class="dt-header">
              <span>企业类型</span><span>企业名称</span><span>接入日期</span>
            </div>
            <div class="dt-row" v-for="(r, i) in enterpriseList" :key="i" :class="{ 'dt-row--alt': i % 2 === 1 }">
              <span>{{ r.type }}</span><span>{{ r.name }}</span><span>{{ r.date }}</span>
            </div>
          </div>
        </div>

        <!-- 2. 自查隐患整改报备 -->
        <div class="card">
          <BigscreenModuleTitle title="自查隐患整改报备" subtitle="Hidden Danger" />
          <!-- 表格 -->
          <div class="data-table">
            <div class="dt-header dt-header--4">
              <span>整改状态</span><span>隐患内容</span><span>上报企业</span><span>上报时间</span>
            </div>
            <div class="dt-row dt-row--4" v-for="(r, i) in hiddenList" :key="i" :class="{ 'dt-row--alt': i % 2 === 1 }">
              <span :class="r.status === '已整改' ? 'text-green' : 'text-amber'">{{ r.status }}</span>
              <span>{{ r.content }}</span><span>{{ r.company }}</span><span class="text-dim">{{ r.date }}</span>
            </div>
          </div>
        </div>

        <!-- 3. 应急预案管理 -->
        <div class="card">
          <BigscreenModuleTitle title="安全生产应急预案" subtitle="Preplan" />
          <!-- Tab 切换 -->
          <div class="tab-row">
            <span v-for="t in planTabs" :key="t" class="tab" :class="{ active: planTab === t }" @click="planTab = t">{{ t }}</span>
          </div>
          <!-- 环形图 + 分类统计 -->
          <div class="donut-row">
            <div ref="planChartRef" class="donut-ring"></div>
            <div class="donut-breakdown">
              <div class="donut-summary">
                <span class="bd-label">接入企业</span>
                <span class="bd-value">234 <small>家</small></span>
              </div>
              <div v-for="(p, i) in planTypes" :key="i" class="donut-item">
                <span class="bd-dot" :style="{ background: p.color }"></span>
                <span class="bd-label">{{ p.name }}</span>
                <span class="bd-value">{{ p.count }} <small>家</small></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 中间列：态势感知 ==================== -->
      <div class="col-center">
        <!-- 4 报警统计 -->
        <div class="alarm-row">
          <div class="alarm-item">
            <div class="alarm-icon-box orange">
              <img src="@/assets/bigscreen/enterprise-cockpit/alarm-report.svg" alt="" />
            </div>
            <div class="alarm-info">
              <span class="alarm-label">安全违规举报</span>
              <span class="alarm-value">9 件</span>
            </div>
          </div>
          <div class="alarm-item">
            <div class="alarm-icon-box red">
              <img src="@/assets/bigscreen/enterprise-cockpit/alarm-fire.svg" alt="" />
            </div>
            <div class="alarm-info">
              <span class="alarm-label">火灾事故报警</span>
              <span class="alarm-value">102 起</span>
            </div>
          </div>
          <div class="alarm-item">
            <div class="alarm-icon-box red">
              <img src="@/assets/bigscreen/enterprise-cockpit/alarm-accident.svg" alt="" />
            </div>
            <div class="alarm-info">
              <span class="alarm-label">生产事故报警</span>
              <span class="alarm-value">102 起</span>
            </div>
          </div>
          <div class="alarm-item">
            <div class="alarm-icon-box green">
              <img src="@/assets/bigscreen/enterprise-cockpit/alarm-rescue.svg" alt="" />
            </div>
            <div class="alarm-info">
              <span class="alarm-label">应急救援联动</span>
              <span class="alarm-value">10 家</span>
            </div>
          </div>
        </div>

        <!-- 高德地图：GIS 风险一张图 -->
        <EnterpriseCockpitMap style="flex: 1.7;" />

        <!-- 底部双卡片 -->
        <div class="center-bottom">
          <!-- 5. AI智能风险预警 -->
          <div class="card card-half">
            <BigscreenModuleTitle title="AI智能风险预警" subtitle="Risk Alert" />
            <!-- 告警统计 -->
            <div class="card-stats">
              <div class="stat-item">
                <div class="stat-hex"><img src="@/assets/bigscreen/enterprise-cockpit/icon-fireroom.svg" class="stat-hex-icon" alt="" /></div>
                <div class="stat-info">
                  <span class="stat-label">重大风险</span>
                  <span class="stat-value" style="color:#ff4e51">1 <small>条</small></span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-hex"><img src="@/assets/bigscreen/enterprise-cockpit/icon-riskpoint.svg" class="stat-hex-icon" alt="" /></div>
                <div class="stat-info">
                  <span class="stat-label">待处置告警</span>
                  <span class="stat-value" style="color:#fe9100">6 <small>条</small></span>
                </div>
              </div>
            </div>
            <!-- 告警滚动列表 -->
            <div class="alert-list">
              <div class="alert-item" v-for="a in alertList" :key="a.id" :class="'alert-' + a.level">
                <div class="alert-head">
                  <span class="alert-level-tag" :class="'tag-' + a.level">{{ a.levelLabel }}</span>
                  <span class="alert-type">{{ a.type }}</span>
                  <span class="alert-time">{{ a.time }}</span>
                </div>
                <div class="alert-body">
                  <span class="alert-company">{{ a.company }}</span>
                  <span class="alert-desc">{{ a.desc }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 6. 重点单位风险管控（复用 RiskControl 组件） -->
          <RiskControl style="flex: 1; min-height: 0;" />
        </div>
      </div>

      <!-- ==================== 右侧列：执行处置 ==================== -->
      <div class="col-right">
        <!-- 7. 安全主体履责打卡 -->
        <div class="card">
          <BigscreenModuleTitle title="安全主体履责打卡" subtitle="Daily List" />
          <div class="card-stats">
            <div class="stat-item">
                <div class="stat-hex"><img src="@/assets/bigscreen/enterprise-cockpit/icon-warning.svg" class="stat-hex-icon" alt="" /></div>
                <div class="stat-info">
                  <span class="stat-label">未履职</span>
                  <span class="stat-value" style="color:#f63d3d">99 <small>家</small></span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-hex"><img src="@/assets/bigscreen/enterprise-cockpit/icon-building.svg" class="stat-hex-icon" alt="" /></div>
                <div class="stat-info">
                  <span class="stat-label">已履职</span>
                  <span class="stat-value" style="color:#10c700">99 <small>家</small></span>
              </div>
            </div>
          </div>
          <div class="data-table">
            <div class="dt-header"><span>履职打卡</span><span>企业名称</span><span>负责人</span></div>
            <div class="dt-row" v-for="(r, i) in dutyList" :key="i" :class="{ 'dt-row--alt': i % 2 === 1 }">
              <span :style="{ color: r.status === '已履职' ? '#10c700' : '#f63d3d' }">{{ r.status }}</span>
              <span>{{ r.company }}</span><span>{{ r.person }}</span>
            </div>
          </div>
        </div>

        <!-- 8. 风险源作业报审批 -->
        <div class="card">
          <BigscreenModuleTitle title="风险源作业报审批" subtitle="Approval" />
          <div class="card-stats">
            <div class="stat-item">
                <div class="stat-hex"><img src="@/assets/bigscreen/enterprise-cockpit/icon-pending.svg" class="stat-hex-icon" alt="" /></div>
                <div class="stat-info">
                  <span class="stat-label">待审批</span>
                  <span class="stat-value" style="color:#fe9100">10 <small>个</small></span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-hex"><img src="@/assets/bigscreen/enterprise-cockpit/icon-approved.svg" class="stat-hex-icon" alt="" /></div>
                <div class="stat-info">
                  <span class="stat-label">已审批</span>
                  <span class="stat-value" style="color:#10c700">102 <small>个</small></span>
              </div>
            </div>
          </div>
          <div class="data-table">
            <div class="dt-header dt-header--4"><span>审批状态</span><span>作业类型</span><span>上报企业</span><span>上报时间</span></div>
            <div class="dt-row dt-row--4" v-for="(r, i) in approvalList" :key="i" :class="{ 'dt-row--alt': i % 2 === 1 }">
              <span :style="{ color: r.status === '已通过' ? '#10c700' : '#ff4e51' }">{{ r.status }}</span>
              <span>{{ r.type }}</span><span>{{ r.company }}</span><span class="text-dim">{{ r.date }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'
import BigscreenHeader from './components/BigscreenHeader.vue'
import BigscreenModuleTitle from './components/BigscreenModuleTitle.vue'
import EnterpriseCockpitMap from './components/enterprise-cockpit/EnterpriseCockpitMap.vue'
import RiskControl from './components/RiskControl.vue'
import { getUserBigscreens } from '@/api/bigscreen'
import { useUserStore } from '@/stores/user'
import type { UserBigscreenItem } from '@/types/bigscreen'

const route = useRoute()
const userStore = useUserStore()
const bigscreens = ref<UserBigscreenItem[]>([])
const currentBigscreenId = ref(Number(route.query.bigscreenId) || 0)

const titleText = '泉州\u201C人工智能+应消联勤\u201D监管平台'

const enterpriseList = [
  { type: '规上企业', name: '匹克体育用品有限公司', date: '2025-09-10' },
  { type: '规上企业', name: '安踏体育用品集团', date: '2025-09-10' },
  { type: '规下企业', name: '南益纺织有限公司', date: '2025-09-10' },
  { type: '规上企业', name: '恒安集团有限公司', date: '2025-09-10' },
  { type: '规上企业', name: '达利食品集团有限公司', date: '2025-09-10' },
  { type: '规上企业', name: '泉州福炼化工厂', date: '2025-09-10' },
  { type: '规下企业', name: '利郎集团', date: '2025-09-10' },
]

const hiddenList = [
  { status: '整改中', content: '生产车间消防通道堆放纸箱物料', company: '匹克集团', date: '2025-09-10' },
  { status: '整改中', content: '电气线路老化未更换，存在短路风险', company: '泉州石化', date: '2025-09-10' },
  { status: '已整改', content: '灭火器超期未年检已更换', company: '恒安集团', date: '2025-09-10' },
  { status: '已整改', content: '危化品仓库通风系统故障修复', company: '福炼化工厂', date: '2025-09-10' },
  { status: '整改中', content: '员工宿舍违规使用大功率电器', company: '达利食品', date: '2025-09-10' },
  { status: '整改中', content: '车间安全出口标识损坏', company: '九牧厨卫', date: '2025-09-10' },
  { status: '已整改', content: '仓库违规存放易燃溶剂已清理', company: '特步集团', date: '2025-09-10' },
]

const alertList = [
  { id: 1, level: 'high', levelLabel: '重大', type: '消防主机报警', company: '泉州石化', desc: '炼油区烟感报警未处置', time: '15:32' },
  { id: 2, level: 'high', levelLabel: '重大', type: '人员脱岗', company: '福炼化工厂', desc: '消控室值班人员离岗超过30分钟', time: '15:28' },
  { id: 3, level: 'medium', levelLabel: '较大', type: '设备故障', company: '匹克集团', desc: '2#喷淋泵控制柜通讯异常', time: '15:15' },
  { id: 4, level: 'medium', levelLabel: '较大', type: '隐患超期', company: '安踏体育', desc: '电气线路隐患整改超期未闭环', time: '14:50' },
  { id: 5, level: 'low', levelLabel: '一般', type: '巡检逾期', company: '利郎集团', desc: '今日安全巡检任务未完成', time: '14:30' },
  { id: 6, level: 'low', levelLabel: '一般', type: '维保提醒', company: '达利食品', desc: '灭火器年检即将到期', time: '13:45' },
]

const dutyList = [
  { status: '未履职', company: '匹克体育用品有限公司', person: '许景南' },
  { status: '未履职', company: '泉州福炼化工厂', person: '王建国' },
  { status: '未履职', company: '安踏体育用品集团', person: '丁世忠' },
  { status: '未履职', company: '恒安集团有限公司', person: '许连捷' },
  { status: '未履职', company: '利郎集团', person: '王冬星' },
  { status: '未履职', company: '南益纺织有限公司', person: '黄少波' },
  { status: '已履职', company: '达利食品集团有限公司', person: '许世辉' },
  { status: '已履职', company: '特步集团', person: '丁水波' },
]

const approvalList = [
  { status: '待审批', type: '动火作业', company: '泉州石化', date: '2025-09-10' },
  { status: '待审批', type: '高空作业', company: '匹克集团', date: '2025-09-10' },
  { status: '已驳回', type: '受限空间', company: '福炼化工厂', date: '2025-09-10' },
  { status: '已通过', type: '动火作业', company: '安踏体育', date: '2025-09-10' },
  { status: '已通过', type: '临时用电', company: '恒安集团', date: '2025-09-10' },
  { status: '已通过', type: '高处作业', company: '达利食品', date: '2025-09-10' },
  { status: '已通过', type: '吊装作业', company: '利郎集团', date: '2025-09-10' },
]

const planTabs = ['教育行业', '工贸企业', '社区物业', '其它行业']
const planTab = ref('工贸企业')
const planTypes = [
  { name: '综合应急预案', count: 36, color: '#148dff' },
  { name: '专项应急预案', count: 36, color: '#30c8d3' },
  { name: '现场处置方案', count: 36, color: '#0151a4' },
  { name: '岗位应急卡片', count: 36, color: '#0175b3' },
]

// ECharts 应急预案环形图
const planChartRef = ref<HTMLDivElement | null>(null)
let planChart: echarts.ECharts | null = null

function initPlanChart() {
  if (!planChartRef.value) return
  planChart = echarts.init(planChartRef.value)
  planChart.setOption({
    series: [{
      type: 'pie',
      radius: ['55%', '85%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      silent: true,
      itemStyle: { borderColor: 'transparent', borderWidth: 0 },
      label: { show: false },
      data: planTypes.map(p => ({ value: p.count, name: p.name, itemStyle: { color: p.color } })),
    }],
  })
}

onMounted(async () => {
  try {
    const screens = await getUserBigscreens()
    if (screens?.length) {
      bigscreens.value = screens
      currentBigscreenId.value = Number(route.query.bigscreenId) || screens[0]?.id || 0
    }
  } catch { /* swallow */ }
  nextTick(() => initPlanChart())
})
onBeforeUnmount(() => {
  planChart?.dispose(); planChart = null
})
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.cockpit {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', 'Microsoft YaHei', sans-serif;

  background: radial-gradient(
    86.83% 85.05% at 50% 27.59%,
    #005dae 0%,
    #02397c 100%
  );
}

/* ===== 内容区 ===== */
.cockpit-content {
  position: absolute;
  top: vh(86);
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: vw(18);
  padding: 0 vw(16) vh(16) vw(16);
}

/* ===== 三列 ===== */
.col-left,
.col-right {
  width: vw(448);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: vh(16);
}

.col-center {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: vh(16);
}

/* ===== 卡片容器 ===== */
.card {
  flex: 1;
  min-height: 0;
  background: linear-gradient(180deg, rgba(1, 70, 146, 0.4) 0%, rgba(4, 87, 167, 0.2) 100%);
  border: 1px solid rgba(71, 132, 232, 0.3);
  border-radius: vw(4);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: vh(16);

  &.card-half {
    flex: 1;
    min-height: 0;
  }
}

/* ===== 占位文字 ===== */
.ph {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: vh(32) vw(16);
  font-size: clamp(12px, calc(14 * var(--min-scale)), 16px);
  color: rgba(137, 181, 255, 0.25);
}

/* ===== 4 报警统计 ===== */
.alarm-row {
  display: flex;
  gap: vw(16);
  flex-shrink: 0;
  height: vh(88);
}

.alarm-item {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: vw(16);
  padding: vh(10) vw(16);
  background: linear-gradient(180deg, rgba(1, 70, 146, 0.4) 0%, rgba(4, 87, 167, 0.2) 100%);
  border: 1px solid rgba(71, 132, 232, 0.3);
  border-radius: vw(4);
  justify-content: center;
  box-sizing: border-box;
}

.alarm-icon-box {
  width: vw(56);
  height: vw(56);
  flex-shrink: 0;
  border-radius: vw(8);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: auto;
    height: auto;
    max-width: 55%;
    max-height: 55%;
  }

  &.orange  { background: linear-gradient(135deg, #fa6c21, #ffd358); }
  &.red     { background: linear-gradient(135deg, #fa2159, #ff6f58); }
  &.green   { background: linear-gradient(135deg, #00f293, #04824b); }
}

.alarm-info {
  display: flex;
  flex-direction: column;
  gap: vh(12);
  width: vw(123);
}

.alarm-label {
  font-size: clamp(12px, calc(18 * var(--min-scale)), 18px);
  font-weight: 700;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  color: #f1f1f1;
  line-height: 1.2;
}

.alarm-value {
  font-size: clamp(16px, calc(24 * var(--min-scale)), 24px);
  font-weight: 700;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  color: #fff;
  line-height: 1.2;
}

/* ===== 底部双卡片 ===== */
.center-bottom {
  display: flex;
  gap: vw(16);
  flex: 1;
  min-height: 0;
}
/* ===== 统计行 ===== */
.card-stats {
  display: flex;
  gap: vw(10);
  padding: 0 vw(16);
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: vw(16);
}

.stat-hex {
  width: vw(64);
  height: vw(64);
  flex-shrink: 0;
}

.stat-hex {
  width: vw(64);
  height: vw(64);
  flex-shrink: 0;
}

.stat-hex-icon {
  width: 100%;
  height: 100%;
  display: block;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: vh(12);

  .stat-label {
    font-size: clamp(12px, calc(18 * var(--min-scale)), 18px);
    font-weight: 700;
    font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
    color: #f1f1f1;
  }

  .stat-value {
    font-size: clamp(16px, calc(24 * var(--min-scale)), 24px);
    font-weight: 700;
    font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
    color: #fff;

    small { font-size: 0.65em; font-weight: 400; color: rgba(255,255,255,0.5); }
  }
}

/* ===== 数据表格 ===== */
.data-table {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 vw(8);
  display: flex;
  flex-direction: column;
}

.dt-header,
.dt-row {
  display: flex;
  align-items: center;
  height: vh(42);
  padding: 0 vw(10);
  flex-shrink: 0;

  span {
    font-size: clamp(11px, calc(16 * var(--min-scale)), 16px);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:nth-child(1) { width: vw(104); }
    &:nth-child(2) { flex: 1; text-align: left; }
    &:nth-child(3) { width: vw(129); }
  }
}

.dt-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #0357a7;
  border-radius: vw(4) vw(4) 0 0;
  span { color: #addaff; font-weight: 500; }
}

.dt-row {
  color: #f1f1f1;

  &.dt-row--alt { background: rgba(0, 73, 142, 0.3); }

  span:nth-child(3) { color: #d7d7d7; }
}

/* 4列表格 */
.dt-header--4 span,
.dt-row--4 span {
  &:nth-child(1) { width: vw(90); }
  &:nth-child(2) { flex: 1; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &:nth-child(3) { width: vw(110); }
  &:nth-child(4) { width: vw(100); }
}

.text-green  { color: #10c700 !important; }
.text-amber  { color: #f59e0b !important; }
.text-dim    { color: #d7d7d7 !important; }

/* ===== Tab 行 ===== */
.tab-row {
  display: flex;
  gap: vw(16);
  padding: vh(2) vw(16);
}

.tab {
  font-size: clamp(13px, calc(18 * var(--min-scale)), 18px);
  font-weight: 700;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  color: rgba(255,255,255,0.35);
  cursor: pointer;
  transition: color 0.2s;

  &.active { color: #0094e5; }
  &:hover:not(.active) { color: rgba(255,255,255,0.6); }
}

/* ===== 环形图行 ===== */
.donut-row {
  flex: 1;
  display: flex;
  align-items: center;
  gap: vw(32);
  padding: 0 vw(16);
  min-height: 0;
}

.donut-ring {
  width: vw(119);
  height: vw(119);
  flex-shrink: 0;
}

.donut-breakdown {
  display: flex;
  flex-direction: column;
  gap: vh(18);
  flex: 1;
}

.donut-summary {
  display: flex;
  align-items: baseline;
  gap: vw(8);
}

.donut-item {
  display: flex;
  align-items: center;
  gap: vw(6);
}

.bd-dot {
  width: vw(8);
  height: vw(8);
  border-radius: 50%;
  flex-shrink: 0;
}

.bd-label {
  flex: 1;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  color: rgba(255,255,255,0.7);
}

.bd-value {
  font-size: clamp(16px, calc(24 * var(--min-scale)), 24px);
  font-weight: 700;
  font-family: 'Douyin Sans', 'Alibaba PuHuiTi', sans-serif;
  color: #fff;

  small { font-size: 0.6em; font-weight: 400; color: rgba(255,255,255,0.5); }
}

.data-table::-webkit-scrollbar { display: none; }
.data-table { scrollbar-width: none; -ms-overflow-style: none; }

/* ===== 告警列表 ===== */
.alert-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 vw(8);
  display: flex;
  flex-direction: column;
  gap: vh(4);
}

.alert-item {
  padding: vh(8) vw(10);
  border-radius: vw(4);
  flex-shrink: 0;

  &.alert-high   { background: rgba(255,0,0,0.08); border-left: 2px solid #ff4e51; }
  &.alert-medium { background: rgba(254,145,0,0.06); border-left: 2px solid #fe9100; }
  &.alert-low    { background: rgba(0,165,254,0.05); border-left: 2px solid #00a5fe; }
}

.alert-head {
  display: flex;
  align-items: center;
  gap: vw(8);
  margin-bottom: vh(4);
}

.alert-level-tag {
  font-size: clamp(9px, calc(11 * var(--min-scale)), 12px);
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 2px;
  flex-shrink: 0;

  &.tag-high   { background: rgba(255,0,0,0.2); color: #ff4e51; }
  &.tag-medium { background: rgba(254,145,0,0.2); color: #fe9100; }
  &.tag-low    { background: rgba(0,165,254,0.2); color: #00a5fe; }
}

.alert-type {
  flex: 1;
  font-size: clamp(11px, calc(14 * var(--min-scale)), 14px);
  font-weight: 600;
  color: #f1f1f1;
}

.alert-time {
  font-size: clamp(10px, calc(12 * var(--min-scale)), 13px);
  color: rgba(255,255,255,0.4);
  flex-shrink: 0;
  font-family: 'Courier New', monospace;
}

.alert-body {
  display: flex;
  gap: vw(12);
  padding-left: vw(4);
}

.alert-company {
  font-size: clamp(10px, calc(13 * var(--min-scale)), 14px);
  color: rgba(255,255,255,0.6);
  flex-shrink: 0;
}

.alert-desc {
  font-size: clamp(10px, calc(13 * var(--min-scale)), 14px);
  color: rgba(255,255,255,0.35);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-list::-webkit-scrollbar { display: none; }
.alert-list { scrollbar-width: none; -ms-overflow-style: none; }
</style>
