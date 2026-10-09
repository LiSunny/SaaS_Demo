<template>
  <div class="hazard-intro">
    <!-- ===== Hero ===== -->
    <section class="hi-hero">
      <div class="hi-wrap">
        <div class="hi-hero-grid">
          <div class="hi-hero-text">
            <span class="hi-eyebrow"><span class="hi-eyebrow-dot"></span>消防安全管理平台 · 核心模块</span>
            <h1 class="hi-hero-title">{{ hero.title }}</h1>
            <p class="hi-hero-sub">{{ hero.sub }}</p>
            <div class="hi-hero-stats">
              <div v-for="s in hero.stats" :key="s.label" class="hi-hero-stat">
                <div class="hi-hero-stat-num">{{ s.num }}</div>
                <div class="hi-hero-stat-label">{{ s.label }}</div>
              </div>
            </div>
            <div class="hi-hero-roles">
              <div v-for="r in hero.roles" :key="r.name" class="hi-role">
                <div class="hi-role-avatar">{{ r.avatar }}</div>
                <span class="hi-role-name">{{ r.name }}</span>
              </div>
            </div>
          </div>
          <div class="hi-mac">
            <div class="hi-mac-bar">
              <span class="hi-mac-dot dot-red"></span>
              <span class="hi-mac-dot dot-yellow"></span>
              <span class="hi-mac-dot dot-green"></span>
            </div>
            <div class="hi-mac-body">
              <div class="hi-mac-image">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18"/><path d="M9 21V9"/>
                </svg>
                <span>主流程总览截图占位</span>
                <span class="hi-mac-hint">建议尺寸 1200×800 · 替换路径 /screenshots/hazard-flow.png</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 核心能力 ===== -->
    <section class="hi-section">
      <div class="hi-wrap">
        <div class="hi-sec-head">
          <div class="hi-sec-label">{{ sections.cap.label }}</div>
          <h2 class="hi-sec-title">{{ sections.cap.title }}</h2>
          <p class="hi-sec-desc">{{ sections.cap.desc }}</p>
        </div>
        <div class="hi-cap-grid">
          <div v-for="(c, idx) in capabilities" :key="c.title" class="hi-cap-card">
            <span class="hi-cap-num">{{ String(idx + 1).padStart(2, '0') }}</span>
            <div class="hi-cap-icon" v-html="c.icon"></div>
            <h3 class="hi-cap-title">{{ c.title }}</h3>
            <p class="hi-cap-desc">{{ c.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 业务流 ===== -->
    <section class="hi-section">
      <div class="hi-wrap">
        <div class="hi-sec-head">
          <div class="hi-sec-label">{{ sections.flow.label }}</div>
          <h2 class="hi-sec-title">{{ sections.flow.title }}</h2>
          <p class="hi-sec-desc">{{ sections.flow.desc }}</p>
        </div>
        <div class="hi-flow-wrap">
          <div class="hi-mermaid" v-html="mermaidSvg"></div>
        </div>
        <div class="hi-flow-note">
          <div v-for="n in flowNotes" :key="n.title" class="hi-flow-note-item">
            <b>{{ n.title }}</b>
            <span>{{ n.body }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 四个模块 ===== -->
    <section class="hi-section">
      <div class="hi-wrap">
        <div class="hi-sec-head">
          <div class="hi-sec-label">{{ sections.mod.label }}</div>
          <h2 class="hi-sec-title">{{ sections.mod.title }}</h2>
          <p class="hi-sec-desc">{{ sections.mod.desc }}</p>
        </div>
        <div class="hi-mod-grid">
          <div v-for="m in modules" :key="m.id" class="hi-mod-card">
            <div class="hi-mod-head">
              <div class="hi-mod-no" :class="{ accent: m.id === 'M2' }">{{ m.id }}</div>
              <h3 class="hi-mod-title">{{ m.title }}</h3>
            </div>
            <p class="hi-mod-sub">{{ m.sub }}</p>
            <div class="hi-mod-pill-list">
              <span v-for="p in m.pills" :key="p" class="hi-mod-pill">{{ p }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 价值（仅四方协同）===== -->
    <section class="hi-section">
      <div class="hi-wrap">
        <div class="hi-sec-head">
          <div class="hi-sec-label">{{ sections.val.label }}</div>
          <h2 class="hi-sec-title">{{ sections.val.title }}</h2>
          <p class="hi-sec-desc">{{ sections.val.desc }}</p>
        </div>
        <div class="hi-val-four">
          <div v-for="f in fourParties" :key="f.tag" class="hi-val-four-item" :class="f.cls">
            <div class="hi-val-four-tag">{{ f.tag }}</div>
            <div class="hi-val-four-title">{{ f.title }}</div>
            <div class="hi-val-four-desc">{{ f.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 合规 ===== -->
    <section class="hi-section">
      <div class="hi-wrap">
        <div class="hi-sec-head">
          <div class="hi-sec-label">{{ sections.reg.label }}</div>
          <h2 class="hi-sec-title">{{ sections.reg.title }}</h2>
          <p class="hi-sec-desc">{{ sections.reg.desc }}</p>
        </div>
        <div class="hi-reg-grid">
          <div v-for="r in regulations" :key="r.name" class="hi-reg-card">
            <h3 class="hi-reg-name">{{ r.name }}</h3>
            <p class="hi-reg-meta">{{ r.meta }}</p>
            <div class="hi-reg-link">{{ r.link }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ===== mermaid 流程图（独立 ref） =====
const mermaidSvg = ref('')

onMounted(() => {
  // 异步渲染 mermaid：CDN script 加载需要时间，等 DOM 挂载后再 retry
  const tryRenderMermaid = async (retries = 0) => {
    const mermaid = (window as any).mermaid
    if (!mermaid) {
      if (retries < 20) setTimeout(() => tryRenderMermaid(retries + 1), 200)
      return
    }
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        flowchart: { curve: '1404', htmlLabels: true, nodeSpacing: 60, rankSpacing: 70, padding: 20 },
        themeVariables: {
          fontSize: '14px',
          fontFamily: '"Noto Sans SC","Outfit",sans-serif',
          primaryColor: '#eef3ff',
          primaryTextColor: '#101010',
          primaryBorderColor: '#3678e3',
          lineColor: '#3678e3',
          secondaryColor: '#fff',
          tertiaryColor: '#fff',
          mainBkg: '#fff',
          nodeBorder: '#3678e3',
          clusterBkg: '#fff',
          clusterBorder: '#e0e7ff',
          titleColor: '#101010',
          edgeLabelBackground: '#fff',
        },
      })
      const { svg } = await mermaid.render('hi-flow', flowChart)
      mermaidSvg.value = svg
    } catch (e) {
      console.error('mermaid render error', e)
    }
  }
  setTimeout(() => tryRenderMermaid(0), 100)
})

onBeforeUnmount(() => {
  // no-op: 保留钩子以备扩展
})

// ===== 章节文案 =====
const sections = {
  cap: { label: '核心能力', title: '四类能力,覆盖隐患全链路', desc: '不靠人盯、不靠 Excel —— 系统按法规自动调度,从排查到销号全程留痕。' },
  flow: { label: '业务流', title: '一条主流程,覆盖发现到销号', desc: '从巡检员发现隐患,到消防安全管理人销号核验,系统自动调度每一个节点。' },
  mod: { label: '子功能', title: '四个模块,覆盖全流程', desc: '按业务链路组织 —— 排查 → 整改 → 制度计划 → 报表统计,日常用得到的功能都集中在这。' },
  val: { label: '价值', title: '四方协同,各自省心', desc: '企业自查整改、监管机构能看数据、服务机构承接任务 —— 同一套台账,四方各取所需。' },
  reg: { label: '合规依据', title: '国家法规与地方办法,逐条落地', desc: '覆盖 2 部国家法律 + 3 部部门规章 + 2 部地方办法 + 1 部推荐国标,共 8 部。每一条都有对应产品实现,合规不留死角。' },
}

// ===== Hero 数据 =====
const hero = {
  title: '隐患排查治理',
  sub: '覆盖排查→整改→验收→销号→督办全场景的闭环能力。系统按法规自动调度,不依赖 Excel、不靠人盯。',
  stats: [
    { num: '4', label: '业务模块' },
    { num: '37', label: '条法规覆盖' },
    { num: '100%', label: '全流程留痕' },
  ],
  roles: [
    { avatar: '负', name: '消防安全责任人' },
    { avatar: '管', name: '消防安全管理人' },
    { avatar: '巡', name: '巡查员' },
    { avatar: '维', name: '维保工程师' },
    { avatar: '监', name: '安全监管员' },
  ],
}

// ===== 核心能力 4 卡 =====
const capabilities = [
  {
    title: '多渠道发现',
    desc: '巡检打卡、随手拍、举报、专业检查 —— 任意渠道上报,系统统一建档、自动去重。',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  },
  {
    title: '自动定级与分派',
    desc: '判定标准字典 + 流程模板,系统判定一般/重大,自动派单到具体责任人和期限。',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4M9 11V7a3 3 0 0 1 6 0v4"/></svg>',
  },
  {
    title: '闭环跟踪',
    desc: '整改前/后对比取证、销号核验、超期自动亮红+催办,整改全链路时间戳记录。',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.2-8.5M21 4v6h-6"/></svg>',
  },
  {
    title: '数据归集',
    desc: '月报/年报自动生成、双报告推送、监管看板实时呈现闭环率与超期数。',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m7 14 4-4 4 4 5-5"/></svg>',
  },
]

// ===== 流程图（mermaid LR 横向，含超期旁注） =====
const flowChart = `flowchart LR
  A[排查任务派发] --> B[发现隐患]
  B --> C{判定等级}
  C -->|一般| D[审核分派]
  C -->|重大| D
  D --> E[现场整改]
  E --> F{验收}
  F -->|不通过| E
  F -->|通过 一般| H[已闭环]
  F -->|通过 重大| G[销号核验]
  G --> H
  style E stroke:#dc2626,stroke-width:2px
  style F stroke:#dc2626,stroke-width:2px`

// ===== 流程旁注（超时处理）=====
const flowNotes = [
  { title: '关键时限', body: '审核 4 小时 · 分派 1 天 · 整改期限由分派定' },
  { title: '全程留痕', body: '每个节点处理人 / 时间 / 操作内容自动记录' },
  { title: '超期处置', body: '系统自动亮红 + 推送,无需人工催办' },
]

// ===== 四个模块（M1-M4，子功能 100% 对齐 docs §3.3-3.6） =====
const modules = [
  {
    id: 'M1',
    title: '隐患排查',
    sub: '发现、登记、分类、定级、审核分派,每个环节独立留痕。',
    pills: ['隐患上报', '重大隐患判定', '审核定级', '隐患台账', '五定方案', '内部公示'],
  },
  {
    id: 'M2',
    title: '隐患整改',
    sub: '派单、整改、验收、销号,超期自动催办。',
    pills: ['整改工单', '前后对比', '验收', '超期提醒', '销号核验', '整改看板', '挂牌督办'],
  },
  {
    id: 'M3',
    title: '制度与计划',
    sub: '建章立制、排计划、派任务,把排查动作标准化。',
    pills: ['制度建设', '排查计划', '排查任务', '排查清单', '排查方式', '判定标准'],
  },
  {
    id: 'M4',
    title: '报表与统计',
    sub: '月报 / 季报 / 年报自动生成,签字、通报、报送闭环。',
    pills: ['数字看板', '月报', '季报', '年报', '内部通报', '监管报送', '双报告'],
  },
]

// ===== 四方协同（docs §1.2/2.1） =====
const fourParties = [
  {
    cls: 'enterprise',
    tag: '社会单位',
    title: '企业自查整改',
    desc: '企业内部从法人到一线员工,完成隐患排查、整改、签字闭环',
  },
  {
    cls: 'service',
    tag: '服务机构',
    title: '承接整改任务',
    desc: '维保工程师按合同接单、现场整改、上传对比证据',
  },
  {
    cls: 'regulator',
    tag: '监管机构',
    title: '跨企业看数据',
    desc: '辖区所有企业的闭环率、超期数、督办建议一目了然',
  },
  {
    cls: 'ops',
    tag: '运营管理',
    title: '配置平台规则',
    desc: '制度模板、SLA、字段字典、行业插件由平台统一配置',
  },
]

// ===== 法规（8 部核心法规与规范，覆盖 L1/L2 通用 + L3 地方/国标，去除 L1/L2/L3 角标） =====
const regulations = [
  {
    name: '中华人民共和国安全生产法',
    meta: '2021 修正版 · 全国人大常委会',
    link: '§41 主体责任 · 双报告 · 隐患治理制度 · 信息系统强制',
  },
  {
    name: '中华人民共和国消防法',
    meta: '2021 修正版 · 全国人大常委会',
    link: '§54 火灾隐患监督 · §58 临时查封',
  },
  {
    name: '安全生产事故隐患排查治理暂行规定',
    meta: '国家安监总局令第 16 号 · 2008 施行',
    link: '§3 定义分级 · §10 台账档案 · §14 统计签字 · §15 五定方案 · §23 销号',
  },
  {
    name: '消防安全责任制实施办法',
    meta: '国办发〔2017〕87 号',
    link: '§4 四方责任 · §15 单位职责 · §25 信用记录',
  },
  {
    name: '机关团体企业事业单位消防安全管理规定',
    meta: '公安部令第 61 号',
    link: '§15 归口管理 · §25 每日防火巡查 · §32 隐患整改',
  },
  {
    name: '大中型企业安全生产标准化管理体系要求',
    meta: 'GB/T 33000-2025 · 2025-10-31 实施',
    link: '三道防线 · 十大要素 · LS-PDCA',
  },
  {
    name: '河南省安全生产风险管控与隐患治理办法',
    meta: '河南省政府令第 191 号 · 2020-01-31 施行',
    link: '§17 月度报送 · §18 台账 7 字段保存 2 年 · §25 挂牌督办',
  },
  {
    name: '福建省安全生产条例',
    meta: '福建省人大常委会 · 2024-09-01 施行(2024 修订)',
    link: '§21 整改五要素 · 措施责任资金时限预案',
  },
]
</script>

<style scoped>
/* HazardIntro 独立样式：不引用 IndustryShared.css，
   避免门户页全局样式污染后台应用 */

/* ===== 根容器（后台风格：纯白底、与 DefaultLayout 协调） ===== */
.hazard-intro {
  --c-primary: #3678e3;
  --c-text: #1f2329;
  --c-muted: #5e6470;
  --c-line: #e6e8eb;
  --c-bg: #fff;
  --c-bg-soft: #f7f8fa;
  --radius: 10px;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans SC', sans-serif;
  color: var(--c-text);
  background: var(--c-bg);
  padding: 24px 32px 48px;
}

/* ===== Hero ===== */
.hi-hero {
  padding: 8px 0 24px;
}
.hi-wrap { max-width: 1180px; margin: 0 auto; padding: 0 32px; position: relative; }
.hi-hero-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 32px; align-items: center; }
.hi-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 4px 12px; background: rgba(54, 120, 227, 0.08);
  border-radius: 4px; font-size: 12px; font-weight: 600;
  color: var(--c-primary); margin-bottom: 16px;
}
.hi-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c-primary); }
.hi-hero-title {
  font-size: 28px; font-weight: 700; line-height: 1.3;
  margin: 0 0 12px; color: var(--c-text); letter-spacing: -0.3px;
}
.hi-hero-sub {
  font-size: 14px; color: var(--c-muted);
  line-height: 1.65; margin: 0 0 16px; max-width: 520px;
}
.hi-hero-stats {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 24px; margin-bottom: 16px;
  padding: 16px 20px;
  background: var(--c-bg-soft);
  border-radius: var(--radius);
}
.hi-hero-stat { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
.hi-hero-stat-num {
  font-size: 22px; font-weight: 700; color: var(--c-primary); line-height: 1;
}
.hi-hero-stat-label { font-size: 12px; color: var(--c-muted); }
.hi-hero-roles { display: flex; gap: 8px; flex-wrap: wrap; }
.hi-role {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; background: #fff;
  border: 1px solid var(--c-line); border-radius: 999px;
  font-size: 13px;
}
.hi-role-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(54, 120, 227, 0.1);
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; color: var(--c-primary); font-size: 12px;
}
.hi-role-name { color: var(--c-text); }

/* ===== Mac 占位 ===== */
.hi-mac {
  border-radius: var(--radius); overflow: hidden; background: #fff;
  border: 1px solid var(--c-line);
}
.hi-mac-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; background: var(--c-bg-soft);
  border-bottom: 1px solid var(--c-line);
}
.hi-mac-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-red { background: #ff5f57; } .dot-yellow { background: #febc2e; } .dot-green { background: #28c840; }
.hi-mac-body { padding: 16px; background: #fff; }
.hi-mac-image {
  width: 100%; min-height: 280px; border-radius: 6px;
  background: var(--c-bg-soft);
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 8px; color: var(--c-muted);
  padding: 16px;
}
.hi-mac-image svg { opacity: 0.4; color: var(--c-muted); }
.hi-mac-image span { font-size: 12px; color: var(--c-muted); }
.hi-mac-hint { font-size: 11px !important; color: rgba(94, 100, 112, 0.6) !important; }

/* ===== Section 通用 ===== */
.hi-section {
  padding: 32px 0;
  border-top: 1px solid var(--c-line);
  margin-top: 32px;
}
.hi-section:first-of-type { border-top: none; margin-top: 0; }
.hi-section-alt { /* 后台紧凑：不再使用 alt 渐变背景，保持与其他 section 一致 */ }
.hi-sec-wrap { position: relative; z-index: 1; }
.hi-sec-head { margin-bottom: 16px; }
.hi-sec-label {
  font-size: 12px; font-weight: 600;
  color: var(--c-primary); letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.hi-sec-title {
  font-size: 20px; font-weight: 700;
  margin: 0 0 8px; line-height: 1.4; color: var(--c-text);
}
.hi-sec-desc {
  font-size: 13px; color: var(--c-muted);
  line-height: 1.65; margin: 0; max-width: 720px;
}

/* ===== 能力 2x2 ===== */
.hi-cap-grid {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.hi-cap-card {
  background: #fff; border: 1px solid var(--c-line);
  border-radius: var(--radius);
  padding: 20px 18px; position: relative;
  transition: border-color 0.2s;
}
.hi-cap-card:hover { border-color: rgba(54, 120, 227, 0.3); }
.hi-cap-num {
  position: absolute; top: 12px; right: 18px;
  font-size: 32px; font-weight: 800; color: rgba(54, 120, 227, 0.08);
  line-height: 1; pointer-events: none;
}
.hi-cap-icon {
  width: 36px; height: 36px; border-radius: 8px;
  background: rgba(54, 120, 227, 0.08); color: var(--c-primary);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12px;
}
.hi-cap-title {
  font-size: 15px; font-weight: 600; margin: 0 0 6px; color: var(--c-text);
}
.hi-cap-desc {
  font-size: 13px; color: var(--c-muted); line-height: 1.65; margin: 0;
}

/* ===== 流程图 ===== */
.hi-flow-wrap {
  background: #fff; border: 1px solid var(--c-line);
  border-radius: var(--radius);
  padding: 24px 16px; overflow-x: auto;
}
.hi-flow-wrap :deep(.hi-mermaid) { display: flex; justify-content: center; }
.hi-flow-wrap :deep(.hi-mermaid svg) { max-width: 100%; }
.hi-flow-wrap :deep(svg) { font-size: 14px !important; min-width: 720px; }
.hi-flow-wrap :deep(text) { font-size: 14px !important; font-weight: 500; }
.hi-flow-wrap :deep(.edgeLabel text) { font-size: 12px !important; }
.hi-flow-wrap :deep(.edgeLabel rect) { fill: #fff !important; stroke: #dbeafe !important; }
.hi-flow-note {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  margin-top: 16px;
}
.hi-flow-note-item {
  padding: 12px 14px; background: var(--c-bg-soft);
  border-radius: 8px; border: 1px solid var(--c-line);
}
.hi-flow-note-item b {
  display: block; font-size: 13px; color: var(--c-text);
  margin-bottom: 4px; font-weight: 600;
}
.hi-flow-note-item span { font-size: 12px; color: var(--c-muted); }

/* ===== 4 模块 2x2 ===== */
.hi-mod-grid {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.hi-mod-card {
  background: #fff; border: 1px solid var(--c-line);
  border-radius: var(--radius);
  padding: 20px 18px;
  transition: border-color 0.2s;
}
.hi-mod-card:hover { border-color: rgba(54, 120, 227, 0.3); }
.hi-mod-head {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 12px;
}
.hi-mod-no {
  flex: 0 0 32px; height: 32px; border-radius: 6px;
  background: var(--c-primary); color: #fff;
  font-weight: 700; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
}
.hi-mod-no.accent { background: #ea580c; }
.hi-mod-title { font-size: 15px; font-weight: 600; margin: 0; color: var(--c-text); }
.hi-mod-sub {
  font-size: 13px; color: var(--c-muted);
  line-height: 1.6; margin: 0 0 12px;
}
.hi-mod-pill-list { display: flex; flex-wrap: wrap; gap: 6px; }
.hi-mod-pill {
  font-size: 12px; padding: 4px 8px;
  background: rgba(54, 120, 227, 0.06); color: var(--c-primary);
  border-radius: 3px;
}

/* ===== 价值区段（仅四方协同） ===== */
.hi-val-four {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.hi-val-four-item {
  padding: 16px; background: #fff; border-radius: var(--radius);
  border: 1px solid var(--c-line);
  border-left: 3px solid var(--c-primary);
}
.hi-val-four-item.enterprise { border-left-color: #3678e3; }
.hi-val-four-item.service { border-left-color: #7c3aed; }
.hi-val-four-item.regulator { border-left-color: #dc2626; }
.hi-val-four-item.ops { border-left-color: #0d9488; }
.hi-val-four-tag {
  display: inline-block; font-size: 11px; font-weight: 600;
  padding: 4px 8px; border-radius: 3px;
  background: rgba(54, 120, 227, 0.08); color: var(--c-primary);
  margin-bottom: 10px;
}
.hi-val-four-item.enterprise .hi-val-four-tag { background: rgba(54, 120, 227, 0.08); color: #3678e3; }
.hi-val-four-item.service .hi-val-four-tag { background: rgba(124, 58, 237, 0.08); color: #7c3aed; }
.hi-val-four-item.regulator .hi-val-four-tag { background: rgba(220, 38, 38, 0.08); color: #dc2626; }
.hi-val-four-item.ops .hi-val-four-tag { background: rgba(13, 148, 136, 0.08); color: #0d9488; }
.hi-val-four-title {
  font-size: 14px; font-weight: 600; color: var(--c-text);
  margin: 0 0 6px;
}
.hi-val-four-desc {
  font-size: 12px; color: var(--c-muted); line-height: 1.55; margin: 0;
}

/* ===== 法规 4x2 ===== */
.hi-reg-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.hi-reg-card {
  background: #fff; border: 1px solid var(--c-line);
  border-radius: var(--radius);
  padding: 20px 18px;
  transition: border-color 0.2s;
}
.hi-reg-card:hover { border-color: rgba(54, 120, 227, 0.3); }
.hi-reg-name {
  font-size: 14px; font-weight: 600; color: var(--c-text);
  margin: 0 0 6px; line-height: 1.4;
}
.hi-reg-meta {
  font-size: 11px; color: var(--c-muted);
  margin: 0 0 10px; line-height: 1.5;
}
.hi-reg-link {
  font-size: 12px; color: var(--c-primary);
  font-weight: 500;
}

/* ===== 响应式 ===== */
@media (max-width: 960px) {
  .hi-hero-grid, .hi-cap-grid, .hi-mod-grid, .hi-reg-grid { grid-template-columns: 1fr; }
  .hi-val-four { grid-template-columns: repeat(2, 1fr); }
  .hi-flow-note { grid-template-columns: 1fr; }
  .hi-wrap { padding-left: 20px; padding-right: 20px; }
}
</style>
