<!--
  AlarmPanel
  实时告警事件（右中模块）
  设计稿节点：670:2480（告警）

  包含：
    - 顶部：未处置事件 + 未闭环隐患（双大数字 + 类型徽标）
    - 底部：未处置/未闭环清单（4 行：故障/欠压故障, 预警/燃气预警 ×2, 故障/电池故障）
-->
<template>
  <div class="al-panel">
    <!-- 顶部：双数字 -->
    <div class="al-summary">
      <div class="al-summary__col">
        <div class="al-summary__num-row">
          <span class="al-summary__num">{{ pendingEvent.value }}</span>
        </div>
        <div class="al-summary__label-row">
          <span class="al-summary__tag al-summary__tag--danger">未处置</span>
          <span class="al-summary__label">事件</span>
        </div>
      </div>
      <div class="al-summary__divider"></div>
      <div class="al-summary__col">
        <div class="al-summary__num-row">
          <span class="al-summary__num al-summary__num--warn">{{ pendingHazard.value }}</span>
        </div>
        <div class="al-summary__label-row">
          <span class="al-summary__tag al-summary__tag--warn">未闭环</span>
          <span class="al-summary__label">隐患</span>
        </div>
      </div>
    </div>

    <!-- 底部：清单 -->
    <div class="al-list">
      <div class="al-list__head">
        <img src="/campus-monitor/icons/alarm.svg" class="al-list__head-icon" alt="" />
        <span class="al-list__head-title">未处置 / 未闭环清单</span>
      </div>
      <ul class="al-list__items">
        <li
          v-for="(item, idx) in items"
          :key="idx"
          class="al-item"
        >
          <span
            class="al-item__tag"
            :class="`al-item__tag--${item.typeKey}`"
          >{{ item.type }}</span>
          <span class="al-item__slash">/</span>
          <span class="al-item__name">{{ item.name }}</span>
          <span class="al-item__time">{{ item.time }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AlarmItem {
  type: string          // 故障 / 预警
  typeKey: 'fault' | 'warn'
  name: string          // 欠压故障 / 燃气预警 ...
  time: string          // 14:35
}

const pendingEvent = { value: '9999999' }
const pendingHazard = { value: '9999999' }

const items: AlarmItem[] = [
  { type: '故障', typeKey: 'fault', name: '欠压故障', time: '14:35' },
  { type: '预警', typeKey: 'warn',  name: '燃气预警', time: '13:58' },
  { type: '预警', typeKey: 'warn',  name: '燃气预警', time: '12:21' },
  { type: '故障', typeKey: 'fault', name: '电池故障', time: '11:47' },
]
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../campus-monitor-common.scss" as *;

.al-panel {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  gap: vh(10);
  min-height: 0;
}

/* ===== 顶部：双数字 ===== */
.al-summary {
  flex: 0 0 auto;
  display: flex; align-items: stretch;
  padding: vh(10) vw(12);
  background: $cm-bg-tile;
  border-radius: 8px;
  gap: vw(10);

  &__col {
    flex: 1;
    display: flex; flex-direction: column;
    align-items: center;
    gap: vh(4);
    min-width: 0;
  }

  &__divider {
    width: 1px;
    background: rgba(255, 255, 255, 0.12);
  }

  &__num-row {
    display: flex; align-items: flex-end;
    justify-content: center;
    width: 100%;
  }

  &__num {
    @include cm-num;
    font-size: 30px;
    color: $cm-text-primary;
    line-height: 1;
    letter-spacing: -1px;

    &--warn { color: $cm-accent-orange; }
  }

  &__label-row {
    display: flex; align-items: center;
    gap: vw(4);
  }

  &__tag {
    padding: vh(2) vw(6);
    border-radius: 3px;
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 10px;
    line-height: 1.2;

    &--danger {
      background: rgba(244, 67, 54, 0.18);
      color: $cm-accent-red;
      border: 1px solid rgba(244, 67, 54, 0.36);
    }

    &--warn {
      background: rgba(255, 166, 0, 0.18);
      color: $cm-accent-orange;
      border: 1px solid rgba(255, 166, 0, 0.36);
    }
  }

  &__label {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 12px;
    color: $cm-text-tertiary;
  }
}

/* ===== 底部：清单 ===== */
.al-list {
  flex: 1;
  display: flex; flex-direction: column;
  gap: vh(6);
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
    gap: vh(6);
    overflow: hidden;
    @include cm-hide-scrollbar;
  }
}

.al-item {
  flex: 1;
  display: flex; align-items: center;
  gap: vw(6);
  padding: 0 vw(10);
  background: $cm-bg-tile;
  border-radius: 6px;

  &__tag {
    flex: 0 0 auto;
    padding: vh(2) vw(6);
    border-radius: 3px;
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 10px;
    line-height: 1.2;

    &--fault {
      background: rgba(244, 67, 54, 0.18);
      color: $cm-accent-red;
      border: 1px solid rgba(244, 67, 54, 0.36);
    }

    &--warn {
      background: rgba(255, 166, 0, 0.18);
      color: $cm-accent-orange;
      border: 1px solid rgba(255, 166, 0, 0.36);
    }
  }

  &__slash {
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 12px;
    color: $cm-text-b0;
    flex-shrink: 0;
  }

  &__name {
    flex: 1;
    font-family: 'Alibaba PuHuiTi', sans-serif;
    font-size: 13px;
    color: $cm-text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    flex: 0 0 auto;
    @include cm-num;
    font-size: 11px;
    color: $cm-text-tertiary;
  }
}
</style>