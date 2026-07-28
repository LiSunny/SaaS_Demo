<template>
  <div class="preview-bigscreen">
    <!-- 截图主体（含 Mac 窗口框） -->
    <div class="pb-frame">
      <div class="pb-bar">
        <span class="pb-dot dot-red"></span>
        <span class="pb-dot dot-yellow"></span>
        <span class="pb-dot dot-green"></span>
      </div>
      <img
        class="pb-img"
        :src="preview.src"
        :alt="preview.title"
      />
    </div>

    <!-- 底部浮层 -->
    <div class="pb-float">
      <a :href="preview.backLink" class="pb-back">← 返回案例</a>
      <span class="pb-hint">以上为静态预览效果，登录后查看实时数据</span>
      <a :href="preview.expLink" class="pb-exp">登录体验完整功能</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const type = computed(() => route.params.type as string)

interface PreviewInfo {
  src: string
  title: string
  backLink: string
  expLink: string
}

const PREVIEWS: Record<string, PreviewInfo> = {
  resumption: {
    src: '/screenshots/fgfc_cz.png',
    title: '复工复产可视化大屏',
    backLink: '/portal/case/work-resumption',
    expLink: '/login?redirect=/resumption-bigscreen',
  },
  gongmao: {
    src: '/screenshots/gongmao.png',
    title: '工贸企业安全监测大屏',
    backLink: '/portal/case/industrial-park',
    expLink: '/login?redirect=/gongmao',
  },
}

const preview = computed(() => PREVIEWS[type.value] || PREVIEWS.resumption)
</script>

<style scoped>
.preview-bigscreen {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #012458;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.pb-frame {
  width: 90vw;
  max-width: 1400px;
  max-height: 90vh;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3), 0 24px 72px rgba(0,0,0,0.5);
  background: #fff;
  border: 1px solid rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
}

.pb-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f5f5f7;
  flex-shrink: 0;
}

.pb-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-red { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green { background: #28c840; }

.pb-img {
  width: 100%;
  display: block;
  flex: 1;
  object-fit: contain;
  background: #012458;
}

.pb-float {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 24px;
  background: rgba(0,0,0,0.75);
  border: 1px solid rgba(54,120,227,0.3);
  border-radius: 12px;
  backdrop-filter: blur(12px);
}

.pb-back {
  font-size: 14px;
  color: rgba(212,234,255,0.5);
  text-decoration: none;
  white-space: nowrap;
}
.pb-back:hover { color: rgba(212,234,255,0.8); }

.pb-hint {
  font-size: 13px;
  color: rgba(212,234,255,0.5);
  white-space: nowrap;
}

.pb-exp {
  font-size: 14px;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 6px;
  background: #3678E3;
  color: #fff;
  text-decoration: none;
  white-space: nowrap;
}
.pb-exp:hover { background: rgba(54,120,227,0.8); }
</style>
