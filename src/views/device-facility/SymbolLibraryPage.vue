<template>
  <div class="symbol-page">
    <header class="symbol-page__head">
      <div class="symbol-page__head-left">
        <span class="symbol-page__title">图元管理</span>
        <span class="symbol-page__desc">
          消防系统图元库 · 共 {{ SYMBOLS.length }} 个图元 / {{ SYMBOL_SYSTEMS.length }} 个系统 /
          {{ SYMBOL_CATEGORIES.length }} 个分类 / {{ SYMBOL_POINTS.length }} 个绑定点 /
          {{ portCount }} 个连接点
        </span>
      </div>
      <div class="symbol-page__head-right">
        <button class="btn-default" @click="variant = variant === 'image' ? 'line' : 'image'">
          {{ variant === 'image' ? '图片版' : '线框版' }}
        </button>
        <button class="btn-primary" @click="goBack">{{ backLabel }}</button>
      </div>
    </header>

    <div class="symbol-page__body">
      <!-- 分类与搜索 -->
      <aside class="symbol-page__cats">
        <div class="symbol-page__search">
          <div class="search-input-wrap">
            <input v-model="keyword" class="fi-input" placeholder="搜索图元名称 / ID" />
            <button v-if="keyword" class="fi-clear" @click="keyword = ''">
              <AppIcon name="clear" />
            </button>
            <AppIcon name="search" class="fi-icon" />
          </div>
        </div>

        <div class="symbol-page__sys">
          <button
            v-for="s in systemTabs"
            :key="s.key"
            class="symbol-page__sys-btn"
            :class="{ 'is-active': activeSys === s.key }"
            @click="activeSys = s.key"
          >
            {{ s.name }}
            <span class="symbol-page__cat-count">{{ countOfSystem(s.key) }}</span>
          </button>
        </div>

        <button
          class="symbol-page__cat"
          :class="{ 'is-active': activeCat === '' }"
          @click="activeCat = ''"
        >
          <span>全部分类</span>
          <span class="symbol-page__cat-count">{{ filteredSymbols.length }}</span>
        </button>
        <button
          v-for="cat in visibleCategories"
          :key="cat.key"
          class="symbol-page__cat"
          :class="{ 'is-active': activeCat === cat.key }"
          @click="activeCat = cat.key"
        >
          <span>
            {{ cat.name }}
            <span v-if="cat.system === 'common'" class="symbol-page__cat-tag">通用</span>
          </span>
          <span class="symbol-page__cat-count">{{ countOf(cat.key) }}</span>
        </button>
      </aside>

      <!-- 图元网格 -->
      <section class="symbol-page__grid-wrap">
        <div class="symbol-page__grid">
          <button
            v-for="s in shownSymbols"
            :key="s.id"
            class="symbol-page__card"
            @click="openDetail(s.id)"
          >
            <SymbolThumb :symbol="s.id" :size="56" :variant="variant" />
            <span class="symbol-page__card-name">{{ s.name }}</span>
            <span class="symbol-page__card-id">{{ s.id }}</span>
            <span class="symbol-page__card-meta">
              {{ systemName(s.system) }} · {{ s.category }} · {{ s.bindings.length }} 绑定点
            </span>
          </button>
          <p v-if="!shownSymbols.length" class="symbol-page__empty">没有匹配的图元</p>
        </div>
      </section>
    </div>

    <!-- 图元详情 -->
    <el-drawer v-model="detailVisible" :title="detail?.name || '图元详情'" size="520px" destroy-on-close>
      <div v-if="detail" class="symbol-detail">
        <div class="symbol-detail__preview">
          <SymbolThumb :symbol="detail.id" :size="180" :variant="variant" />
        </div>

        <div class="symbol-detail__desc">{{ detail.desc }}</div>

        <dl class="symbol-detail__meta">
          <div><dt>图元 ID</dt><dd>{{ detail.id }}</dd></div>
          <div><dt>所属系统</dt><dd>{{ systemName(detail.system) }}</dd></div>
          <div><dt>分类</dt><dd>{{ detail.category }}</dd></div>
          <div><dt>画布</dt><dd>{{ detail.size.w }} × {{ detail.size.h }}</dd></div>
          <div><dt>连接点</dt><dd>{{ detail.ports.length }} 个</dd></div>
          <div><dt>绑定点</dt><dd>{{ detail.bindings.length }} 个</dd></div>
          <div><dt>可用风格</dt><dd>{{ detail.styles.join(' / ') }}</dd></div>
        </dl>

        <div class="symbol-detail__section">
          <h3 class="symbol-detail__section-title">状态预览</h3>
          <div class="symbol-detail__states">
            <div
              v-for="s in PREVIEW_STATES"
              :key="s.key"
              class="symbol-detail__state"
            >
              <SymbolThumb :symbol="detail.id" :size="48" :variant="variant" :state="{ [s.key]: true }" />
              <span>{{ s.label }}</span>
            </div>
          </div>
        </div>

        <div class="symbol-detail__section">
          <h3 class="symbol-detail__section-title">绑定点表</h3>
          <table class="fi-table symbol-detail__table">
            <thead>
              <tr class="fi-thead-tr">
                <th class="fi-th"><span>点名</span></th>
                <th class="fi-th"><span>绑定</span></th>
                <th class="fi-th"><span>类型</span></th>
                <th class="fi-th"><span>量程</span></th>
                <th class="fi-th"><span>单位</span></th>
                <th class="fi-th"><span>报警上下限</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in detailPoints" :key="p.point" class="fi-tbody-tr">
                <td class="fi-td">{{ p.point }}</td>
                <td class="fi-td">{{ p.binding }}</td>
                <td class="fi-td">{{ p.dataType }}</td>
                <td class="fi-td">{{ p.min || '—' }} ~ {{ p.max || '—' }}</td>
                <td class="fi-td">{{ p.unit || '—' }}</td>
                <td class="fi-td">{{ p.alarmLo || '—' }} / {{ p.alarmHi || '—' }}</td>
              </tr>
              <tr v-if="!detailPoints.length" class="fi-tbody-tr">
                <td class="fi-td" colspan="6" style="text-align:center;color:var(--text-muted)">
                  该图元在点表中没有记录
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
/**
 * 图元管理（只读）
 *
 * 数据源为图元库产物：manifest.json（几何与绑定）+ points.sample.csv（点表）。
 * 页面不放上传/新建入口 —— 图元入库走图元库构建流程，不在平台上制图。
 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/base/AppIcon.vue'
import SymbolThumb from '@/components/device-facility/SymbolThumb.vue'
import { SYMBOL_CATEGORIES, SYMBOL_POINTS, SYMBOLS, SYMBOL_SYSTEMS, symbolDef } from '@/symbols'
import type { SceneStyle } from '@/types/scene-config'

const router = useRouter()
const route = useRoute()

const variant = ref<SceneStyle>('image')
const keyword = ref('')
const activeCat = ref('')
const activeSys = ref('')
const detailVisible = ref(false)
const detailId = ref('')

const PREVIEW_STATES = [
  { key: 'run', label: '运行' },
  { key: 'fault', label: '故障' },
  { key: 'alarm', label: '报警' },
  { key: 'discharge', label: '喷放' },
  { key: 'manual', label: '手动' },
  { key: 'open', label: '阀开' },
  { key: 'closed', label: '阀关' },
]

/** 系统标签页：全部 + 每个系统 */
const systemTabs = computed(() => [
  { key: '', name: '全部' },
  ...SYMBOL_SYSTEMS.map((s) => ({ key: s.key, name: s.name })),
])

/** 某系统下可见的分类：该系统专属 + 通用件 */
const visibleCategories = computed(() =>
  SYMBOL_CATEGORIES.filter(
    (c) => !activeSys.value || c.system === activeSys.value || c.system === 'common',
  ),
)

/** 连接点总数（manifest 求和） */
const portCount = computed(() => SYMBOLS.reduce((n, s) => n + s.ports.length, 0))

/** 返回按钮文案：带 scene 参数（从编辑器进入）→ 返回编辑器，否则回组态配置列表 */
const backLabel = computed(() => (route.query.scene ? '返回编辑器' : '返回组态配置'))

const filteredSymbols = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return SYMBOLS.filter((s) => {
    if (activeSys.value && s.system !== activeSys.value && s.system !== 'common') return false
    if (activeCat.value && s.category !== activeCat.value) return false
    if (!kw) return true
    return (
      s.name.toLowerCase().includes(kw) ||
      s.id.toLowerCase().includes(kw) ||
      (s.desc || '').toLowerCase().includes(kw)
    )
  })
})

const shownSymbols = computed(() => filteredSymbols.value)

const detail = computed(() => (detailId.value ? symbolDef(detailId.value) : undefined))
const detailPoints = computed(() => SYMBOL_POINTS.filter((p) => p.symbolId === detailId.value))

function countOf(cat: string) {
  return SYMBOLS.filter((s) => s.category === cat).length
}

function countOfSystem(sys: string) {
  if (!sys) return SYMBOLS.length
  return SYMBOLS.filter((s) => s.system === sys).length
}

function systemName(key: string) {
  return SYMBOL_SYSTEMS.find((s) => s.key === key)?.name || key
}

function openDetail(id: string) {
  detailId.value = id
  detailVisible.value = true
}

function goBack() {
  // 从编辑器进入（带 scene 参数）→ 回到该画面的编辑器；否则回组态配置列表
  const sceneId = route.query.scene
  if (sceneId) {
    router.push(`/device-facility/rule/scene-config/${sceneId}/editor`)
    return
  }
  router.push('/device-facility/rule/scene-config')
}
</script>

<style scoped>
.symbol-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: 100%;
  min-height: 0;
}

/* 头部 */
.symbol-page__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}
.symbol-page__head-left {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}
.symbol-page__title {
  font-size: var(--font-h4);
  font-weight: 600;
  color: var(--text-primary);
}
.symbol-page__desc {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.symbol-page__head-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

/* 主体 */
.symbol-page__body {
  display: flex;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;
}
.symbol-page__cats {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-lg);
  overflow-y: auto;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}
.symbol-page__search {
  margin-bottom: var(--spacing-md);
}
.symbol-page__search .search-input-wrap { width: 100%; }
.symbol-page__cat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-md);
  font: inherit;
  font-size: var(--font-small);
  color: var(--text-secondary);
  background: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
}
.symbol-page__cat:hover { background: var(--accent-primary10); }
.symbol-page__cat.is-active {
  color: var(--accent-primary);
  background: var(--accent-primary10);
  font-weight: 600;
}
.symbol-page__cat-count {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

/* 一级分类：系统 */
.symbol-page__sys {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding-bottom: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-low);
}
.symbol-page__sys-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font: inherit;
  font-size: var(--font-small);
  color: var(--text-secondary);
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
}
.symbol-page__sys-btn:hover { background: var(--accent-primary10); }
.symbol-page__sys-btn.is-active {
  color: var(--accent-primary);
  background: var(--accent-primary10);
  border-color: var(--accent-primary);
  font-weight: 600;
}
.symbol-page__cat-tag {
  margin-left: var(--spacing-xs);
  padding: 0 5px;
  font-size: 10px;
  font-weight: 400;
  color: var(--text-muted);
  background: var(--bg-sub-card);
  border: 1px solid var(--border-default);
  border-radius: 999px;
}

/* 网格 */
.symbol-page__grid-wrap {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: var(--spacing-lg);
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}
.symbol-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: var(--spacing-lg);
}
.symbol-page__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-lg) var(--spacing-md);
  background: var(--bg-sub-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  font: inherit;
}
.symbol-page__card:hover {
  border-color: var(--accent-primary);
  background: var(--accent-primary10);
}
.symbol-page__card-name {
  font-size: var(--font-small);
  color: var(--text-primary);
}
.symbol-page__card-id {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.symbol-page__card-meta {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.symbol-page__empty {
  grid-column: 1 / -1;
  padding: var(--spacing-xxl) 0;
  text-align: center;
  font-size: var(--font-xs);
  color: var(--text-muted);
}

/* 详情 */
.symbol-detail {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}
.symbol-detail__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  background: var(--bg-sub-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
}
.symbol-detail__desc {
  font-size: var(--font-small);
  color: var(--text-secondary);
}
.symbol-detail__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md) var(--spacing-lg);
  margin: 0;
}
.symbol-detail__meta > div {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.symbol-detail__meta dt {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.symbol-detail__meta dd {
  margin: 0;
  font-size: var(--font-small);
  color: var(--text-primary);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}
.symbol-detail__section-title {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-small);
  font-weight: 600;
  color: var(--text-primary);
}
.symbol-detail__states {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}
.symbol-detail__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--bg-sub-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  font-size: var(--font-xs);
  color: var(--text-secondary);
}
.symbol-detail__table {
  font-size: var(--font-xs);
}
.symbol-detail__table .fi-td {
  font-size: var(--font-xs);
  padding: var(--spacing-md);
}
</style>
