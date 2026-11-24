<!--
  MessageNotificationDrawer.vue — 顶栏消息通知抽屉（列表态 / 详情态）

  交互：
    - 点击顶栏消息图标 → 右侧滑出抽屉，默认「列表态」：一行式消息列表
    - 点列表某条 → 抽屉切到「详情态」：标题 / 接收时间 / 上一条·下一条 / 正文
    - 详情态可「返回」回列表态；也可直接跳到消息通知列表页（顶栏「全部」）

  两种入口都复用本组件：
    - 顶栏：DefaultLayout 挂一个实例（不传 detail-id）
    - 消息通知列表页：NotificationList 挂一个实例并传 :detail-id（点行即开详情）

  视觉基准：
    列表态 —— Figma 节点 1334:6526 通知卡片：白底浅灰边框卡片，头部（分类图标 + 分类名 + 接收时间）
              → 正文（未读红点 + 标题 + 两行摘要）→ 底部（查看详情 + 右箭头）
    详情态 —— Figma 节点 6591:7306：56×56 图标块 + 标题 + 接收时间 + 上一条/下一条，
              正文为浅米色纸纹底（#FDFAEF + 平铺纹理），支持 markdown / html / table 三种形态

  未读语义：红点 = 未读（设计稿未明确，此处按未读标记处理）
-->

<template>
  <el-drawer
    v-model="visible"
    direction="rtl"
    :size="drawerSize"
    :with-header="false"
    class="msg-notification-drawer"
    @open="handleOpen"
  >
    <!-- ==================== 列表态（最近消息，卡片） ==================== -->
    <template v-if="view === 'list'">
      <div class="msg-drawer-head">
        <span class="msg-drawer-title">通知公告</span>
        <button class="msg-drawer-more" type="button" @click="goAll">全部</button>
      </div>

      <div class="msg-drawer-body" :class="currentId ? 'is-detail' : 'is-list'">
        <div v-if="store.recentLoading && store.recent.length === 0" class="msg-drawer-empty">加载中…</div>
        <div v-else-if="store.recent.length === 0" class="msg-drawer-empty">暂无消息</div>
        <ul v-else class="msg-list">
          <li
            v-for="item in store.recent"
            :key="item.id"
            class="msg-card"
            role="button"
            tabindex="0"
            @click="openDetail(item, 'list')"
            @keyup.enter="openDetail(item, 'list')"
          >
            <!-- 头部：分类（图标 + 名称）+ 接收时间 -->
            <div class="msg-card-head">
              <span class="msg-card-cat">
                <AppIcon :name="categoryMeta(item).icon" class="msg-card-icon" />
                <span class="msg-card-cat-text">{{ categoryMeta(item).label }}</span>
              </span>
              <span class="msg-card-time">{{ item.receivedAt }}</span>
            </div>

            <!-- 正文：未读红点 + 标题 + 摘要 -->
            <div class="msg-card-main">
              <div class="msg-card-title-row">
                <span v-if="!item.read" class="msg-dot" aria-label="未读" />
                <span class="msg-card-title" :class="{ 'is-unread': !item.read }">{{ item.title }}</span>
              </div>
              <p class="msg-card-text">{{ summary(item) }}</p>
            </div>

            <!-- 底部：查看详情 + 右箭头 -->
            <div class="msg-card-foot">
              <button
                class="msg-card-detail"
                type="button"
                @click.stop="openDetail(item, 'list')"
              >
                查看详情
              </button>
              <AppIcon name="chevron-right" class="msg-card-arrow" />
            </div>
          </li>
        </ul>

        <div class="msg-drawer-foot">
          <button class="msg-drawer-foot-btn" type="button" @click="goAll">查看全部消息</button>
        </div>
      </div>
    </template>

    <!-- ==================== 全部列表态 ==================== -->
    <template v-else-if="view === 'all'">
      <div class="msg-drawer-head">
        <button class="msg-drawer-back" type="button" @click="goList">
          <AppIcon name="chevron-left" class="msg-drawer-back-icon" />
          <span>返回</span>
        </button>
        <span class="msg-drawer-title">消息通知列表</span>
      </div>

      <div class="msg-drawer-body is-all">
        <NotificationTable @open-detail="openDetailFromAll" />
      </div>
    </template>

    <!-- ==================== 详情态 ==================== -->
    <template v-else>
      <!-- 详情态头部：返回（主色）+ 标题 + 右侧「上一条 / 下一条」导航
           导航放在固定头部，避免夹在标题与正文之间打断阅读 -->
      <div class="msg-drawer-head">
        <button class="msg-drawer-back" type="button" @click="backFromDetail">
          <AppIcon name="chevron-left" class="msg-drawer-back-icon" />
          <span>返回</span>
        </button>
        <span class="msg-drawer-title">消息详情</span>
        <div class="msg-drawer-nav">
          <button
            class="msg-nav-btn is-next"
            type="button"
            :disabled="!nextItem"
            title="下一条"
            @click="goNeighbor(nextItem)"
          >
            <AppIcon name="chevron-down" class="msg-nav-icon" />
            <span>下一条</span>
          </button>
          <button
            class="msg-nav-btn is-prev"
            type="button"
            :disabled="!prevItem"
            title="上一条"
            @click="goNeighbor(prevItem)"
          >
            <span>上一条</span>
            <AppIcon name="chevron-up" class="msg-nav-icon" />
          </button>
        </div>
      </div>

      <div class="msg-drawer-body is-detail">
        <div v-if="!detail && !detailLoading" class="msg-drawer-empty">消息不存在或已删除</div>

        <template v-else>
          <!-- 标题区 -->
          <div class="nd-head">
            <span class="nd-icon-wrap">
              <AppIcon :name="categoryIcon" class="nd-icon" />
            </span>
            <div class="nd-head-text">
              <h2 class="nd-title">{{ detail?.title }}</h2>
              <div class="nd-time">{{ detail?.receivedAt }}</div>
            </div>
          </div>

          <div class="nd-divider" />

          <!-- 正文 -->
          <div v-loading="detailLoading" class="nd-body" :style="{ backgroundImage: `url(${detailBgUrl})` }">
            <NotificationContent
              v-if="detail"
              :content-type="detail.contentType"
              :content="detail.content"
              :table-data="detail.tableData"
            />
          </div>
        </template>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppIcon from '@/components/base/AppIcon.vue'
import NotificationContent from '@/components/business/NotificationContent.vue'
import NotificationTable from '@/components/business/NotificationTable.vue'
import { useNotificationStore } from '@/stores/notification'
import { toPlainSummary } from '@/utils/markdown'
import { NOTIFICATION_CATEGORY_META } from '@/types/notification'
import type { NotificationItem } from '@/types/notification'
import detailBgUrl from '@/assets/notification/notification-detail-bg.png'

/** 抽屉内展示的条数 */
const DRAWER_LIMIT = 20
/** 最近列表态宽度 */
const LIST_SIZE = '400px'
/** 全部列表态 / 详情态宽度（两者一致） */
const WIDE_SIZE = '720px'

/** 抽屉的三个视图：最近列表 → 全部列表 → 详情 */
type DrawerView = 'list' | 'all' | 'detail'

const props = defineProps<{
  modelValue: boolean
  /** 传入则直接进详情态（列表页点行打开详情用） */
  detailId?: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
}>()

const store = useNotificationStore()

/** 当前视图 */
const view = ref<DrawerView>('list')
/** 当前详情 id（null = 不在详情态） */
const currentId = ref<number | null>(null)
/** 详情的来源视图（返回时回到这里；null = 直接关闭抽屉） */
const detailFrom = ref<DrawerView | null>(null)
/** 当前详情数据 */
const detail = ref<NotificationItem | undefined>(undefined)
const detailLoading = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

/** 宽度：最近列表窄一些；全部列表与详情同宽 */
const drawerSize = computed(() => (view.value === 'list' ? LIST_SIZE : WIDE_SIZE))

/** 分类的图标与文案（口径集中在 types/notification.ts） */
function categoryMeta(item: NotificationItem) {
  return NOTIFICATION_CATEGORY_META[item.category] ?? NOTIFICATION_CATEGORY_META.system
}

const categoryIcon = computed(() => {
  const category = detail.value?.category ?? 'system'
  return NOTIFICATION_CATEGORY_META[category]?.icon ?? 'notification'
})

/** 摘要：剥掉标记取纯文本；表格形态取列名预览 */
function summary(item: NotificationItem): string {
  if (item.contentType === 'table') {
    const cols = item.tableData?.columns ?? []
    return cols.length ? `表格消息：${cols.join(' / ')}` : '表格消息'
  }
  return toPlainSummary(item.content, 60)
}

/** 上一条（更旧）/ 下一条（更新） */
const prevItem = computed(() => store.getNeighbors(currentId.value ?? -1).prev)
const nextItem = computed(() => store.getNeighbors(currentId.value ?? -1).next)

/** 加载详情 */
async function loadDetail(id: number) {
  detailLoading.value = true
  try {
    const found = await store.fetchDetail(id)
    detail.value = found
    // 进入详情即视为已读（幂等）
    if (found) await store.markRead(found.id)
  } finally {
    detailLoading.value = false
  }
}

/** 抽屉打开 → 按入口决定初始视图；带 detail-id 时直接进详情态 */
async function handleOpen() {
  if (props.detailId) {
    view.value = 'detail'
    detailFrom.value = null
    currentId.value = props.detailId
    await loadDetail(props.detailId)
  } else {
    view.value = 'list'
    currentId.value = null
    detail.value = undefined
    await store.fetchRecent(DRAWER_LIMIT)
  }
}

/** 最近列表 → 全部列表 */
function goAll() {
  view.value = 'all'
  currentId.value = null
  detail.value = undefined
}

/** 全部列表 → 最近列表 */
function goList() {
  view.value = 'list'
  currentId.value = null
  detail.value = undefined
  store.fetchRecent(DRAWER_LIMIT)
}

/** 最近列表的卡片 → 详情 */
async function openDetail(item: NotificationItem, from: DrawerView) {
  detailFrom.value = from
  currentId.value = item.id
  view.value = 'detail'
  await loadDetail(item.id)
}

/** 全部列表的点行 → 详情（同一抽屉内切换） */
async function openDetailFromAll(id: number) {
  detailFrom.value = 'all'
  currentId.value = id
  view.value = 'detail'
  await loadDetail(id)
}

/** 详情 → 返回来源视图（无来源则关闭抽屉） */
async function backFromDetail() {
  const from = detailFrom.value
  if (from === 'all') {
    view.value = 'all'
    currentId.value = null
    detail.value = undefined
    await store.fetchList()
    return
  }
  if (from === 'list') {
    goList()
    return
  }
  visible.value = false
}

/** 切换上一条 / 下一条 */
async function goNeighbor(target?: NotificationItem) {
  if (!target) return
  currentId.value = target.id
  await loadDetail(target.id)
}

// 父组件传入的 detail-id 变化时同步（列表页点行 → 打开抽屉详情）
watch(
  () => props.detailId,
  (val) => {
    if (val && visible.value) {
      view.value = 'detail'
      detailFrom.value = null
      currentId.value = val
      loadDetail(val)
    }
  },
)
</script>

<style scoped>
/* ===== 头部（列表态 / 详情态共用） ===== */
.msg-drawer-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px 12px;
  border-bottom: 1px solid var(--bg-main);
  /* 头部固定，不参与列表区滚动 */
  flex-shrink: 0;
}
.msg-drawer-back {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--font-small, 14px);
  color: var(--accent-primary);
  flex-shrink: 0;
}
.msg-drawer-back:hover { color: var(--accent-primary); }
.msg-drawer-back-icon {
  width: 18px;
  height: 18px;
}
.msg-drawer-title {
  flex: 1;
  font-size: var(--font-h5, 16px);
  font-weight: 500;
  color: var(--text-primary);
}

/* 详情态头部右侧：上一条 / 下一条（固定在头部，滚动时始终可点） */
.msg-drawer-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.msg-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 10px;
  border-radius: var(--radius-sm, 6px);
  border: 1px solid transparent;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background .15s, border-color .15s, opacity .15s;
}
.msg-nav-icon {
  width: 16px;
  height: 16px;
}
.msg-nav-btn.is-next {
  background: var(--accent-primary10);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
.msg-nav-btn.is-next:hover:not(:disabled) {
  background: var(--accent-primary);
  color: #fff;
}
.msg-nav-btn.is-prev {
  background: var(--danger-bg);
  border-color: rgba(220, 38, 38, .2);
  color: var(--danger);
}
.msg-nav-btn.is-prev:hover:not(:disabled) {
  border-color: var(--danger);
}
.msg-nav-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
}
.msg-drawer-more {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: var(--font-small, 14px);
  font-weight: 400;
  color: var(--accent-primary);
}
.msg-drawer-more:hover { text-decoration: underline; }

/* ===== 主体 =====
   抽屉本身不滚动：头部固定，垂直滚动只发生在列表区（.msg-list） */
.msg-drawer-body {
  flex: 1;
  min-height: 0;
}
.msg-drawer-body.is-list {
  display: flex;
  flex-direction: column;
  padding: 6px 20px 20px;
}
/* 全部列表态：筛选 + 表格 + 分页整段滚动 */
.msg-drawer-body.is-all {
  overflow-y: auto;
  padding: 16px 20px 20px;
}
/* 详情态：整段详情内容滚动 */
.msg-drawer-body.is-detail {
  overflow-y: auto;
  padding: 6px 20px 20px;
}

/* ===== 卡片式列表（Figma 节点 1334:6526） =====
   卡片：白底 + 1px 浅灰边框 + 8px 圆角
   头部：分类图标 + 分类名 …… 接收时间（底部 1px 分隔线）
   正文：未读红点 + 标题 + 两行摘要
   底部：查看详情 + 右箭头（顶部 1px 分隔线）
   色值取自设计稿：分类图标 #4A79EE（面性）、右箭头 #AAAAAA（线性 1.625）、
   次要文字 #666666、主要文字 #333333、分隔线 rgba(240,241,246,.8) */
.msg-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* 列表区独立垂直滚动：头部固定，不随列表滚动 */
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.msg-card {
  background: var(--bg-card);
  border: 1px solid var(--nd-card-border);
  border-radius: var(--radius-md, 8px);
  padding: 8px 12px;
  cursor: pointer;
  transition: box-shadow .15s, border-color .15s;
}
.msg-card:hover {
  border-color: var(--border-default);
  box-shadow: 0 2px 8px rgba(16, 16, 16, .06);
}
.msg-card:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* 头部：分类 + 时间 */
.msg-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--nd-divider);
}
.msg-card-cat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
/* 分类图标：线性描边（铃铛 / 气泡），18×18，#4A79EE */
.msg-card-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--nd-icon);
}
/* TDesign 24px 线性图标缩到 18px 后线宽偏细，补到视觉 ~1.5px，与右箭头 1.625 对齐 */
.msg-card-icon path { stroke-width: 2; }
.msg-card-cat-text {
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--nd-text-weak);
  white-space: nowrap;
}
.msg-card-time {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--nd-text-weak);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* 正文：红点 + 标题 + 摘要 */
.msg-card-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}
.msg-card-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.msg-card-title {
  font-size: 14px;
  font-weight: 400;
  line-height: 21px;
  color: var(--nd-text-weak);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.msg-card-title.is-unread {
  font-weight: 500;
  color: var(--nd-text-strong);
}
.msg-card-text {
  margin: 0;
  font-size: 12px;
  font-weight: 400;
  line-height: 17px;
  color: var(--nd-text-weak);
  /* 两行截断（设计稿摘要区高 34px = 2 × 17px） */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

/* 底部：查看详情 + 右箭头 */
.msg-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0 0;
  border-top: 1px solid var(--nd-divider);
}
.msg-card-detail {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 400;
  line-height: 17px;
  color: var(--nd-text-strong);
}
.msg-card-detail:hover { color: var(--accent-primary); }
/* 右箭头：设计稿为线性 1.625 描边，#AAAAAA */
.msg-card-arrow {
  width: 16px;
  height: 16px;
  color: var(--nd-arrow);
}
/* TDesign chevron-right 默认线宽 1，对齐设计稿的 1.625 */
.msg-card-arrow path { stroke-width: 1.625; }

/* 未读红点：跟随项目危险红令牌 */
.msg-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--danger);
  flex-shrink: 0;
}

/* ===== 底部 ===== */
.msg-drawer-foot {
  flex-shrink: 0;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--bg-main);
}
.msg-drawer-foot-btn {
  width: 100%;
  height: 38px;
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-md, 8px);
  background: transparent;
  color: var(--accent-primary);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s;
}
.msg-drawer-foot-btn:hover { background: var(--accent-primary10); }

/* ===== 详情态 ===== */
.nd-head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0 10px;
}
.nd-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md, 8px);
  background: var(--info-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.nd-icon {
  width: 28px;
  height: 28px;
  color: var(--accent-primary);
}
.nd-head-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}
.nd-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.45;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.nd-time {
  font-size: 14px;
  color: var(--text-muted);
}

.nd-divider {
  height: 1px;
  background: var(--border-high);
  margin-bottom: 12px;
}

/* 正文 */
.nd-body {
  min-height: 260px;
  padding: 8px;
  border-radius: var(--radius-md, 8px);
  background-color: #FDFAEF;
  background-repeat: repeat;
  background-size: auto;
}

/* ===== 空态 ===== */
.msg-drawer-empty {
  padding: 48px 0;
  text-align: center;
  font-size: var(--font-small, 14px);
  color: var(--text-muted);
}
</style>

<!--
  抽屉容器样式（teleport 到 body，必须非 scoped）
  选择器限定 .msg-notification-drawer，避免污染其它抽屉。
-->
<style>
.msg-notification-drawer.el-drawer {
  background: var(--bg-main);
  /* 设计稿字体：Alibaba PuHuiTi（后台自定义文字默认是系统字体，这里与设计稿保持一致） */
  font-family: 'Alibaba PuHuiTi', -apple-system, BlinkMacSystemFont, sans-serif;
  /* 设计稿色值（浅色主题），组件内统一从这里取 */
  --nd-text-strong: #333333;      /* 标题 / 查看详情 */
  --nd-text-weak: #666666;        /* 分类名 / 时间 / 摘要 */
  --nd-icon: #4A79EE;              /* 分类图标（面性实心） */
  --nd-arrow: #AAAAAA;             /* 右箭头（线性 1.625） */
  --nd-divider: rgba(240, 241, 246, .8);
  --nd-card-border: #F3F4F8;
}
.msg-notification-drawer .el-drawer__body {
  padding: 0;
  /* 抽屉本身不滚动，滚动交给内部列表区 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
/* 暗色主题：设计稿浅色值不可读，降级为项目令牌 */
html.dark .msg-notification-drawer {
  --nd-text-strong: var(--text-primary);
  --nd-text-weak: var(--text-muted);
  --nd-arrow: var(--text-muted);
  --nd-divider: var(--border-low);
  --nd-card-border: var(--border-default);
}
/* 暗色主题：浅米色纸纹不可读，降级为纯色 */
html.dark .msg-notification-drawer .nd-body {
  background-color: var(--bg-sub-card);
  background-image: none !important;
}
</style>
