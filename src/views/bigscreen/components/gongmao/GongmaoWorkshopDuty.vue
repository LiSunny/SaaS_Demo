<template>
  <GongmaoSectionCard title="压实车间主体履责" badge="责任状">
    <div class="duty-wrap">
      <!-- 车间 Tab 栏 -->
      <div class="tab-bar">
        <button
          v-for="ws in workshops"
          :key="ws.id"
          :class="['tab-btn', { active: ws.id === activeWorkshop }]"
          @click="activeWorkshop = ws.id"
        >
          <span class="tab-label">{{ ws.name }}</span>
        </button>
      </div>

      <!-- 履职表格 -->
      <div class="duty-table">
        <!-- 表头 -->
        <div class="table-header">
          <div class="col-status">履职状态</div>
          <div class="col-team">班组</div>
          <div class="col-person">履职人</div>
          <div class="col-actions">操作</div>
        </div>

        <!-- 数据行 -->
        <div
          v-for="(row, i) in dutyRows"
          :key="i"
          class="table-row"
        >
          <div class="col-status">
            <span :class="['status-text', row.status === '已履职' ? 'status-done' : 'status-undone']">{{ row.status }}</span>
          </div>
          <div class="col-team">{{ row.team }}</div>
          <div class="col-person">{{ row.person }}</div>
          <div class="col-actions">
            <template v-if="row.hasActions">
              <img
                class="action-icon action-preview"
                src="@/assets/bigscreen/gongmao-icon-preview.svg"
                alt="预览"
              />
              <img
                class="action-icon"
                src="@/assets/bigscreen/gongmao-icon-action.svg"
                alt="操作"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
  </GongmaoSectionCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GongmaoSectionCard from './GongmaoSectionCard.vue'

interface Workshop {
  id: number
  name: string
}

interface DutyRow {
  status: string
  team: string
  person: string
  hasActions: boolean
}

const workshops: Workshop[] = [
  { id: 1, name: '第一车间' },
  { id: 2, name: '第二车间' },
  { id: 3, name: '第三车间' },
  { id: 4, name: '第四车间' },
]

const activeWorkshop = ref(1)

const dutyRows: DutyRow[] = [
  { status: '已履职', team: '车间主任', person: '李常芮', hasActions: true },
  { status: '已履职', team: '生产三组', person: '李国逸', hasActions: true },
  { status: '已履职', team: '生产二组', person: '潘裕', hasActions: true },
  { status: '已履职', team: '仓储物流一组', person: '石小燕', hasActions: true },
  { status: '未履职', team: '生产一组', person: '张明华', hasActions: true },
  { status: '已履职', team: '设备维修组', person: '王建国', hasActions: true },
  { status: '已履职', team: '质检组', person: '陈晓芳', hasActions: true },
  { status: '未履职', team: '仓储物流二组', person: '刘伟强', hasActions: true },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

.duty-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: vh(6) vw(16) 0 vw(16);
  gap: vh(6);
  overflow: hidden;
}

/* ===== Tab 栏 ===== */
.tab-bar {
  display: flex;
  align-items: center;
  gap: vw(16);
}

.tab-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: vw(126);
  height: vh(34);
  border: none;
  background: linear-gradient(
    180deg,
    rgba(24, 82, 167, 0.35) 0%,
    rgba(10, 89, 207, 0.18) 100%
  );
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: linear-gradient(
      180deg,
      rgba(24, 82, 167, 0.55) 0%,
      rgba(10, 89, 207, 0.3) 100%
    );
  }

  &.active {
    background: linear-gradient(
      180deg,
      rgba(24, 82, 167, 0.7) 0%,
      rgba(10, 89, 207, 0.5) 100%
    );
  }
}

.tab-label {
  color: #5e9dc4;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(13px, calc(18 * var(--min-scale)), 18px);
  font-weight: 700;
  line-height: 1;
  transition: all 0.2s ease;
}

.tab-btn:hover .tab-label {
  color: #a0c4e8;
}

.tab-btn.active .tab-label {
  background: linear-gradient(to bottom, #ffffff 0%, #89b5ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== 表格 ===== */
.duty-table {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: vh(4);
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: vh(6);
  /* 固定展示 4 行：表头(38) + 4行(38×4) + 间隙(4×4) = 210 */
  max-height: vh(210);
  /* 隐藏滚动条 */
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

/* 表头 */
.table-header {
  display: flex;
  align-items: center;
  gap: vw(16);
  height: vh(38);
  padding: 0 vw(18);
  background:
    linear-gradient(
      90deg,
      rgba(2, 48, 133, 0) 0%,
      rgba(24, 82, 167, 0.58) 19.712%,
      rgba(10, 89, 207, 0.68) 48.558%,
      rgba(24, 82, 167, 0.58) 80%,
      rgba(2, 51, 141, 0) 100%
    ),
    #01438e;
  border-top: 1px solid #023085;
  color: #d8d8d8;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 2;
}

/* 数据行 */
.table-row {
  display: flex;
  align-items: center;
  gap: vw(16);
  height: vh(38);
  padding: 0 vw(18);
  flex-shrink: 0;

  &:nth-child(odd) {
    background: linear-gradient(
      90deg,
      rgba(2, 48, 133, 0) 0%,
      rgba(24, 82, 167, 0.28) 19.712%,
      rgba(10, 89, 207, 0.36) 48.558%,
      rgba(24, 82, 167, 0.28) 80%,
      rgba(2, 51, 141, 0) 100%
    );
  }
}

/* 列宽 */
.col-status {
  width: vw(108);
  text-align: center;
  flex-shrink: 0;
}

.col-team {
  flex: 1;
  min-width: 0;
  color: #d8d8d8;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
}

.col-person {
  width: vw(128);
  flex-shrink: 0;
  color: #d8d8d8;
  font-family: 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(12px, calc(16 * var(--min-scale)), 16px);
  font-weight: 500;
  line-height: 1;
}

.col-actions {
  width: vw(58);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: vw(8);
}

/* 履职状态 */
.status-text {
  font-family: 'DingTalk_JinBuTi', 'Alibaba PuHuiTi', sans-serif;
  font-size: clamp(14px, calc(18 * var(--min-scale)), 18px);
  font-weight: 400;
  line-height: 1;
}

.status-done {
  color: #2ba86d;
}

.status-undone {
  color: #e65c4b;
}

/* 操作图标 */
.action-icon {
  display: block;
  flex-shrink: 0;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
}

.action-preview {
  width: vh(26);
  height: vh(26);
}

.action-icon:not(.action-preview) {
  width: vh(24);
  height: vh(24);
}
</style>
