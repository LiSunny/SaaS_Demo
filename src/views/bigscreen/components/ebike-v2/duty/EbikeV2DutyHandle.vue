<template>
  <EbikeV2Card title="警情处理" class="handle">
    <div class="handle__inner">
      <!-- ===== 核实结果 ===== -->
      <div class="handle__group">
        <span class="handle__group-label">核实结果：</span>
        <div class="handle__chips">
          <button
            v-for="o in VERIFY_OPTIONS"
            :key="o"
            type="button"
            class="handle__chip"
            :class="{ 'is-active': verify === o }"
            @click="verify = o"
          >
            <span class="handle__radio" />
            {{ o }}
          </button>
        </div>
      </div>

      <!-- ===== 处理结果 ===== -->
      <div class="handle__group">
        <span class="handle__group-label">处理结果：</span>
        <div class="handle__chips">
          <button
            v-for="o in HANDLE_OPTIONS"
            :key="o"
            type="button"
            class="handle__chip"
            :class="{ 'is-active': handle === o }"
            @click="handle = o"
          >
            <span class="handle__radio" />
            {{ o }}
          </button>
        </div>
      </div>

      <!-- ===== 处理说明 ===== -->
      <div class="handle__group handle__group--grow">
        <span class="handle__group-label">处理说明：</span>
        <textarea
          v-model="note"
          class="handle__textarea"
          placeholder="请输入处理说明"
        />
      </div>

      <!-- ===== 底部：设备控制 + 主按钮 ===== -->
      <div class="handle__foot">
        <!-- 设备控制：只有一个「消音」动作，压成矮条 -->
        <div class="handle__ctrl">
          <span class="handle__ctrl-label">设备控制</span>
          <button type="button" class="handle__ctrl-btn" @click="emit('mute')">消音</button>
          <button type="button" class="handle__ctrl-refresh" title="刷新设备状态" @click="emit('refresh')">
            <AppIcon name="refresh" />
          </button>
        </div>

        <button type="button" class="handle__submit" @click="submit">确认核实处置</button>
      </div>
    </div>
  </EbikeV2Card>
</template>

<script setup lang="ts">
/**
 * 值守工作台 · 警情处理
 *
 * 字段与云端一致：核实结果（火警 / 故障 / 误报 / 测试）、
 * 处理结果（火警排除 / 转隐患处置 / 生成真实警情）、处理说明、确认核实处置。
 *
 * 版式改动：云端这些 radio 竖排在一个 236px 高的卡里，表单体只剩 118px，
 * 看到底要内部滚动。这里改成横向 chip 组 + 说明框定高 + 主按钮贴底，
 * 一屏放得下全部字段与按钮。
 *
 * 「设备控制」在云端是独立一整块（236px 高，里面只有一个「消音」按钮），
 * 这里压成底部矮条，与处置动作同区。
 */
import { ref } from 'vue'
import EbikeV2Card from '../EbikeV2Card.vue'
import AppIcon from '@/components/base/AppIcon.vue'

const emit = defineEmits<{
  (e: 'submit', payload: { verify: string; handle: string; note: string }): void
  (e: 'mute'): void
  (e: 'refresh'): void
}>()

const VERIFY_OPTIONS = ['火警', '故障', '误报', '测试']
const HANDLE_OPTIONS = ['火警排除', '转隐患处置', '生成真实警情']

const verify = ref('火警')
const handle = ref('')
const note = ref('')

function submit() {
  emit('submit', { verify: verify.value, handle: handle.value, note: note.value })
}
</script>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "../fire/fire-common.scss" as *;

.handle {
  height: 100%;
}

.handle__inner {
  @include fire-panel;
  gap: vh(10);
  padding: vh(12) vw(16) vh(10);
}

/* ===== 分组 ===== */
.handle__group {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  gap: vw(10);
}

/* 说明框所在行：占满剩余高度。
   align-items: stretch —— 默认的 flex-start 会让说明框只占自身高度，
   卡片下半截就空出一大块。 */
.handle__group--grow {
  flex: 1;
  min-height: 0;
  align-items: stretch;
}

.handle__group-label {
  flex-shrink: 0;
  width: vw(72);
  padding-top: vh(4);
  @include fire-label(14);
  color: var(--fire-text-title);
  white-space: nowrap;
}

/* ===== chip 组 ===== */
.handle__chips {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: vw(8);
}

.handle__chip {
  display: inline-flex;
  align-items: center;
  gap: vw(6);
  height: vh(26);
  padding: 0 vw(10);
  border: 1px solid rgba(120, 190, 255, 0.2);
  border-radius: vw(12);
  background: rgba(0, 68, 130, 0.35);
  color: var(--fire-text-label);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.handle__chip:hover {
  background: rgba(0, 92, 168, 0.55);
}

.handle__chip.is-active {
  background: rgba(0, 134, 228, 0.8);
  border-color: rgba(96, 200, 255, 0.6);
  color: #ffffff;
}

/* 单选圈 */
.handle__radio {
  width: vw(11);
  height: vw(11);
  border-radius: 50%;
  border: 1px solid rgba(143, 176, 216, 0.8);
  position: relative;
  flex-shrink: 0;
}

.handle__chip.is-active .handle__radio {
  border-color: #ffffff;
}

.handle__chip.is-active .handle__radio::after {
  content: '';
  position: absolute;
  inset: vw(2);
  border-radius: 50%;
  background: #ffffff;
}

/* ===== 说明框 ===== */
.handle__textarea {
  flex: 1;
  min-height: vh(52);
  padding: vh(8) vw(10);
  border: 1px solid rgba(120, 190, 255, 0.22);
  border-radius: vw(2);
  background: rgba(0, 24, 56, 0.5);
  color: var(--fire-text-title);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  resize: none;
}

.handle__textarea:focus {
  border-color: rgba(96, 200, 255, 0.7);
}

.handle__textarea::placeholder {
  color: var(--fire-text-dim);
}

/* ===== 底部：设备控制 + 主按钮 ===== */
.handle__foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: vw(12);
  padding-top: vh(8);
  border-top: 1px solid rgba(120, 190, 255, 0.16);
}

/* 设备控制矮条 */
.handle__ctrl {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: vw(8);
}

.handle__ctrl-label {
  @include fire-dim(14);
  white-space: nowrap;
}

.handle__ctrl-btn {
  height: vh(26);
  padding: 0 vw(12);
  border: 1px solid rgba(120, 190, 255, 0.28);
  border-radius: vw(2);
  background: rgba(0, 68, 130, 0.5);
  color: var(--fire-text-title);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.handle__ctrl-btn:hover {
  background: rgba(0, 92, 168, 0.75);
}

.handle__ctrl-refresh {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: vh(26);
  height: vh(26);
  border: 1px solid rgba(120, 190, 255, 0.28);
  border-radius: vw(2);
  background: rgba(0, 68, 130, 0.5);
  color: var(--fire-text-label);
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

.handle__ctrl-refresh:hover {
  background: rgba(0, 92, 168, 0.75);
}

/* 主按钮 */
.handle__submit {
  flex-shrink: 0;
  height: vh(32);
  padding: 0 vw(20);
  border: 1px solid rgba(96, 200, 255, 0.6);
  border-radius: vw(2);
  background: linear-gradient(180deg, rgba(0, 134, 228, 0.95) 0%, rgba(0, 86, 168, 0.95) 100%);
  color: #ffffff;
  font-family: 'Alibaba PuHuiTi', 'PingFang SC', sans-serif;
  font-size: 14px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: filter 0.15s;
}

.handle__submit:hover {
  filter: brightness(1.12);
}
</style>
