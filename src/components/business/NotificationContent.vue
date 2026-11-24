<!--
  NotificationContent.vue — 消息正文分发渲染器

  三种并列形态（不是"先做一种，以后再扩展"）：
    - markdown  受限 Markdown 渲染（src/utils/markdown.ts，零依赖）
    - html      HTML 网页，iframe srcdoc 沙箱渲染
    - table     结构化表格

  HTML 分支的沙箱边界：
    - sandbox="allow-scripts allow-popups allow-forms"，**刻意不给 allow-same-origin**
      → 内页处于独立不透明源，读不到父页 DOM / cookie / localStorage
    - allow-scripts 只让内容自身的脚本运行（图表类富文本需要）
    - 高度自适应：父组件在 srcdoc 末尾注入一段上报脚本，内页 postMessage 高度，
      父组件用 window 'message' 监听并设置 iframe 高度
-->

<template>
  <div class="notification-content">
    <!-- ===== Markdown ===== -->
    <div v-if="contentType === 'markdown'" class="md-body" v-html="markdownHtml" />

    <!-- ===== HTML 网页 ===== -->
    <iframe
      v-else-if="contentType === 'html'"
      class="html-frame"
      :srcdoc="srcdoc"
      :style="{ height: `${frameHeight}px` }"
      sandbox="allow-scripts allow-popups allow-forms"
      title="消息内容"
    />

    <!-- ===== 表格 ===== -->
    <div v-else-if="contentType === 'table'" class="table-wrap">
      <table class="fi-table">
        <thead>
          <tr class="fi-thead-tr">
            <th v-for="col in columns" :key="col" class="fi-th">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in rows" :key="rowIndex" class="fi-tbody-tr">
            <td v-for="(cell, cellIndex) in row" :key="cellIndex" class="fi-td">{{ cell }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="content-empty">暂无内容</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { renderMarkdown } from '@/utils/markdown'
import type { NotificationContentType, NotificationTableData } from '@/types/notification'

const props = defineProps<{
  contentType: NotificationContentType
  content: string
  tableData?: NotificationTableData
}>()

/** ===== Markdown ===== */
const markdownHtml = computed(() => renderMarkdown(props.content || ''))

/** ===== 表格 ===== */
const columns = computed(() => props.tableData?.columns ?? [])
const rows = computed(() => props.tableData?.rows ?? [])

/** ===== HTML ===== */

/**
 * 内页高度上报脚本
 *
 * 注入到 srcdoc 末尾，页面 load 后把内容高度报给父组件。
 * 用 try/catch 兜住极端情况下 body 尚未就绪的异常。
 */
const HEIGHT_REPORTER = `
<script>
(function () {
  function report() {
    try {
      var de = document.documentElement;
      var body = document.body;
      var h = Math.max(
        de ? de.scrollHeight : 0,
        body ? body.scrollHeight : 0,
        de ? de.offsetHeight : 0,
        body ? body.offsetHeight : 0
      );
      parent.postMessage({ __notificationContentHeight: h }, '*');
    } catch (e) {}
  }
  if (document.readyState === 'complete') report();
  else window.addEventListener('load', report);
  window.addEventListener('resize', report);
  setTimeout(report, 200);
  setTimeout(report, 1000);
})();
<\/script>`

/** 把上报脚本拼到 srcdoc 末尾（优先插到 </body> 前） */
const srcdoc = computed(() => {
  const html = props.content || ''
  if (!html.trim()) return ''
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${HEIGHT_REPORTER}</body>`)
  }
  return `${html}${HEIGHT_REPORTER}`
})

const frameHeight = ref(320)

/** 接收内页上报的高度 */
function onMessage(event: MessageEvent) {
  const data = event.data
  if (!data || typeof data !== 'object') return
  const height = (data as { __notificationContentHeight?: unknown }).__notificationContentHeight
  if (typeof height !== 'number' || !Number.isFinite(height)) return
  // 夹在合理区间，避免内页异常高度把页面撑爆
  frameHeight.value = Math.min(Math.max(Math.ceil(height), 120), 2400)
}

onMounted(() => window.addEventListener('message', onMessage))
onBeforeUnmount(() => window.removeEventListener('message', onMessage))
</script>

<style scoped>
.notification-content {
  width: 100%;
}

/* ===== Markdown ===== */
.md-body {
  color: var(--text-primary);
  font-size: var(--font-small, 14px);
  line-height: 1.85;
  word-break: break-word;
}
.md-body :deep(.md-h1),
.md-body :deep(.md-h2),
.md-body :deep(.md-h3) {
  color: var(--text-primary);
  font-weight: 600;
  line-height: 1.5;
  margin: 16px 0 8px;
}
.md-body :deep(.md-h1) { font-size: 20px; }
.md-body :deep(.md-h2) {
  font-size: 18px;
  padding-left: 10px;
  border-left: 3px solid var(--accent-primary);
}
.md-body :deep(.md-h3) { font-size: 16px; }
.md-body :deep(.md-h1:first-child),
.md-body :deep(.md-h2:first-child),
.md-body :deep(.md-h3:first-child) { margin-top: 0; }
.md-body :deep(.md-p) { margin: 6px 0; }
.md-body :deep(.md-list) { margin: 6px 0; padding-left: 22px; }
.md-body :deep(.md-li) { margin: 3px 0; }
.md-body :deep(.md-list .md-list) { margin: 3px 0; }
.md-body :deep(.md-strong) { font-weight: 600; color: var(--text-primary); }
.md-body :deep(.md-em) { font-style: italic; }
.md-body :deep(.md-del) { text-decoration: line-through; color: var(--text-muted); }
.md-body :deep(.md-code) {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--bg-sub-card);
  border: 1px solid var(--border-low);
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 13px;
}
.md-body :deep(.md-quote) {
  margin: 8px 0;
  padding: 8px 12px;
  border-left: 3px solid var(--border-high);
  background: var(--bg-sub-card);
  border-radius: 0 6px 6px 0;
  color: var(--text-secondary);
}

/* ===== HTML 网页 ===== */
.html-frame {
  display: block;
  width: 100%;
  border: none;
  border-radius: 6px;
  background: var(--bg-card);
  transition: height .18s ease;
}

/* ===== 表格 ===== */
.table-wrap {
  width: 100%;
  overflow-x: auto;
}
.table-wrap :deep(.fi-table) {
  background: transparent;
}
.table-wrap :deep(.fi-tbody-tr:nth-child(even)) {
  background: transparent;
}
.table-wrap :deep(.fi-td) {
  font-size: var(--font-small, 14px);
  text-align: left;
  white-space: normal;
}

.content-empty {
  padding: 32px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: var(--font-small, 14px);
}
</style>
