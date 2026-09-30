<!--
  ReportPanel
  平安校园报告（右下模块）
  设计稿节点：670:2480（报告）

  包含：
    - 4 份报告（日报 / 周报 / 月报 / 季报），每份含文档图标 + 标题 + 时间 + 审阅按钮
-->
<template>
  <div class="rp-panel">
    <div class="rp-list">
      <div class="rp-list__head">
        <img src="/campus-monitor/icons/doc-success.svg" class="rp-list__head-icon" alt="" />
        <span class="rp-list__head-title">平安校园报告</span>
      </div>
      <ul class="rp-list__items">
        <li
          v-for="(report, idx) in reports"
          :key="idx"
          class="rp-item"
        >
          <div class="rp-item__icon">
            <img src="/campus-monitor/icons/report-doc.png" alt="" class="rp-item__icon-bg" />
            <img src="/campus-monitor/icons/doc-bg.svg" alt="" class="rp-item__icon-fg" />
          </div>
          <div class="rp-item__main">
            <span class="rp-item__title">{{ report.title }}</span>
            <span class="rp-item__date">{{ report.date }}</span>
          </div>
          <button class="rp-item__action" @click="handleReview(report.key)">
            审阅
            <img src="/campus-monitor/icons/circle-right-up.svg" class="rp-item__action-icon" alt="" />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Report {
  key: string
  title: string
  date: string
}

const reports: Report[] = [
  { key: 'daily',   title: '平安校园日报',   date: '2026-09-20' },
  { key: 'weekly',  title: '平安校园周报',   date: '2026-09-15' },
  { key: 'monthly', title: '平安校园月报',   date: '2026-09-01' },
  { key: 'quarter', title: '平安校园季报',   date: '2026-07-01' },
]

function handleReview(_key: string) {
  // 占位：跳转报告详情或弹出审阅窗口（POC 阶段不做）
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../campus-monitor-common.scss" as *;

.rp-panel {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  min-height: 0;
}

.rp-list {
  flex: 1;
  display: flex; flex-direction: column;
  gap: vh(8);
  min-height: 0;

  &__head {
    flex: 0 0 auto;
    display: flex; align-items: center; gap: vw(6);
    padding: 0 vw(2);
  }

  &__head-icon {
    width: vh(14); height: vh(14); flex-shrink: 0;
  }

  &__head-title {
    flex: 1;
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 13px;
    color: $cm-text-tertiary;
  }

  &__items {
    flex: 1;
    list-style: none;
    margin: 0; padding: 0;
    display: flex; flex-direction: column;
    gap: vh(8);
    overflow: hidden;
    @include cm-hide-scrollbar;
  }
}

.rp-item {
  flex: 1;
  display: flex; align-items: center;
  gap: vw(10);
  padding: vh(6) vw(10);
  background: $cm-bg-tile;
  border-radius: 6px;

  &__icon {
    flex: 0 0 auto;
    position: relative;
    width: vh(36); height: vh(36);

    img {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: contain;
    }
  }

  &__main {
    flex: 1;
    display: flex; flex-direction: column;
    gap: vh(2);
    min-width: 0;
  }

  &__title {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 14px;
    color: $cm-text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__date {
    @include cm-num;
    font-size: 11px;
    color: $cm-text-b0;
  }

  &__action {
    flex: 0 0 auto;
    display: flex; align-items: center;
    gap: vw(4);
    padding: vh(5) vw(10);
    background: $cm-bg-pill;
    border: 1px solid rgba(0, 215, 239, 0.3);
    border-radius: 14px;
    color: $cm-accent-cyan;
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 11px;
    line-height: 1;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: rgba(0, 136, 209, 0.6);
    }

    &-icon {
      width: vh(10); height: vh(10);
    }
  }
}
</style>