<template>
  <div class="portal" style="font-family: 'Noto Sans SC', 'Outfit', -apple-system, sans-serif; overflow-x: hidden;">
    <!-- ===== Nav ===== -->
    <nav class="nav" :class="{ scrolled }">
      <div class="nav-inner">
        <a href="#" class="nav-brand">
          <img class="nav-logo" src="/favicon.svg" alt="logo" width="28" height="28" />
          <span class="nav-name" :class="{ scrolled }">韧性云</span>
        </a>
        <div class="nav-links">
          <a v-for="l in navLinks" :key="l" :href="`#${l}`" class="nav-link" :class="{ scrolled }">{{ l }}</a>
        </div>
        <div class="nav-actions">
          <button class="nav-btn" @click="handleGoExp">去体验</button>
        </div>
      </div>
    </nav>

    <!-- ===== Hero ===== -->
    <section class="hero">
      <div class="hero-grid"></div>
      <div class="hero-line-d"></div>
      <div class="hero-line-v"></div>
      <div class="hero-content">
        <h1 class="hero-title">
          <span v-for="(ch, i) in titleChars" :key="i"
            class="hero-char"
            :class="{ plus: ch === '+' }"
            :style="{ animationDelay: `${80 + i * 40}ms`, color: ch === '+' ? '#3678E3' : '#fff', textShadow: ch === '+' ? '0 0 30px rgba(54,120,227,0.7)' : 'none' }"
          >{{ ch === ' ' ? ' ' : ch }}</span>
        </h1>
        <p class="hero-sub">覆盖教育、工业、城市治理三大领域，构建从单点管控到全域联动的完整安全治理体系</p>
        <div class="hero-btns">
          <a href="#应用场景" class="hero-btn-fill"><span>了解应用场景</span><ArrowRight :size="15" /></a>
          <a href="#功能矩阵" class="hero-btn-ghost"><span>查看功能矩阵</span><ChevronRight :size="15" /></a>
        </div>
      </div>
      <div class="hero-fade"></div>
      <div class="hero-scroll">
        <span class="hero-scroll-text">向下滚动</span>
        <ChevronDown class="hero-scroll-arrow" :size="20" color="#fff" />
      </div>
    </section>

    <!-- ===== Positioning ===== -->
    <section id="平台定位" class="pos">
      <div class="sec-wrap">
        <div ref="posHead" class="pos-head reveal" :class="{ visible: posHeadV }">
          <div class="sec-label"><span class="sec-label-line"></span>平台定位<span class="sec-label-line"></span></div>
          <h2 class="sec-title">深度赋能三类典型场景</h2>
          <p class="sec-desc">覆盖从单点管控到全域联动的完整安全治理体系</p>
        </div>
        <div class="pos-grid">
          <div v-for="(p, i) in POSITIONING" :key="i" class="pos-card reveal" :style="{ transitionDelay: `${i * 100}ms` }">
            <div class="pos-card-head">
              <div class="pos-card-icon"><component :is="p.icon" :size="17" color="#3678E3" /></div>
              <span class="pos-card-tag">{{ p.tag }}</span>
            </div>
            <h3 class="pos-card-title">{{ p.title }}</h3>
            <p class="pos-card-body">{{ p.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Scenarios ===== -->
    <section id="应用场景" class="scenarios-sec">
      <div class="sec-wrap">
        <div ref="scHead" class="reveal" :class="{ visible: scHeadV }">
          <div class="sec-label"><span class="sec-label-line"></span>应用场景<span class="sec-label-line"></span></div>
          <h2 class="sec-title">核心应用场景</h2>
        </div>
        <!-- Content panel with horizontal slide -->
        <div class="sc-stage">
          <div class="sc-track" :style="{ transform: `translateX(-${activeScenario * 100}%)` }">
            <div v-for="(sc, i) in SCENARIOS" :key="i" class="sc-panel" @click="goIndustry(sc.slug)">
              <div class="sc-panel-left">
                <h3 class="sc-title">{{ sc.title }}</h3>
                <p class="sc-aud">{{ sc.audience }}</p>
                <p class="sc-summary">{{ sc.summary }}</p>
                <div class="sc-tags">
                  <span v-for="t in sc.tags" :key="t" class="sc-tag">{{ t }}</span>
                </div>
                <button class="sc-cta"><span>查看详情</span><ArrowRight :size="13" /></button>
              </div>
              <div class="sc-panel-right">
                <img :src="sc.image" alt="" class="sc-image" />
              </div>
            </div>
          </div>
        </div>
        <!-- Carousel dots -->
        <div class="sc-dots">
          <button v-for="(_, i) in SCENARIOS" :key="i"
            class="sc-dot-btn" :class="{ active: activeScenario === i }"
            @click="activeScenario = i"
          ></button>
        </div>
      </div>
    </section>

    <!-- ===== AI Capabilities ===== -->
    <section id="AI 能力" class="ai">
      <div class="sec-wrap">
        <div ref="aiHead" class="reveal" :class="{ visible: aiHeadV }">
          <div class="sec-label"><span class="sec-label-line"></span>核心能力<span class="sec-label-line"></span></div>
          <h2 class="sec-title">AI 如何提升安全管理</h2>
        </div>
        <div class="ai-grid">
          <div v-for="(a, i) in AI_LIST" :key="i" class="ai-card reveal" :style="{ transitionDelay: `${i * 80}ms` }">
            <span class="ai-num">{{ a.num }}</span>
            <div class="ai-line"></div>
            <h3 class="ai-title">{{ a.title }}</h3>
            <p class="ai-body">{{ a.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Feature Matrix ===== -->
    <section id="功能矩阵" class="feat">
      <div class="sec-wrap">
        <div ref="featHead" class="reveal" :class="{ visible: featHeadV }">
          <div class="sec-label"><span class="sec-label-line"></span>功能矩阵<span class="sec-label-line"></span></div>
          <h2 class="sec-title">覆盖安全管理全业务链路</h2>
          <div class="feat-legend">
            <span v-for="(cfg, k) in STATE_CFG" :key="k" class="feat-legend-item">
              <span class="feat-legend-dot" :style="{ background: cfg.color }"></span>{{ cfg.label }}
            </span>
          </div>
        </div>
        <div class="feat-grid">
          <div v-for="(f, i) in FEATURES" :key="i" class="feat-card reveal" :style="{ transitionDelay: `${i * 40}ms` }">
            <div class="feat-bar" :style="{ background: STATE_CFG[f.state].color }"></div>
            <div class="feat-body">
              <div class="feat-top">
                <h4>{{ f.name }}</h4>
                <span class="feat-badge" :style="{ color: STATE_CFG[f.state].color, background: STATE_CFG[f.state].bg }">{{ STATE_CFG[f.state].label }}</span>
              </div>
              <p>{{ f.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== TechStats ===== -->
    <section id="技术特性" class="tech" ref="techSection">
      <div class="tech-grid-bg"></div>
      <div class="sec-wrap tech-wrap">
        <div ref="techHead" class="reveal" :class="{ visible: techHeadV }">
          <div class="sec-label sec-label--light"><span class="sec-label-line sec-label-line--light"></span>技术特性<span class="sec-label-line sec-label-line--light"></span></div>
          <h2 class="sec-title sec-title--light">多协议兼容，多端协同</h2>
        </div>
        <div class="stats-row">
          <div v-for="(st, i) in STATS" :key="i" class="stat-card">
            <div class="stat-num">{{ countVals[i] }}<span class="stat-unit">{{ st.unit }}</span></div>
            <div class="stat-label">{{ st.label }}</div>
            <div class="stat-sub">{{ st.sub }}</div>
          </div>
        </div>
        <div ref="protoRef" class="protocols reveal" :class="{ visible: protoV }">
          <span class="proto-label">协议支持</span>
          <span v-for="p in PROTOCOLS" :key="p" class="proto-tag">{{ p }}</span>
        </div>
      </div>
    </section>

    <!-- ===== Footer ===== -->
    <footer class="ft">
      <div class="ft-cta">
        <div ref="ftCta" class="reveal" :class="{ visible: ftCtaV }">
          <p class="ft-cta-label">开始使用</p>
          <h2 class="ft-cta-title">让安全管理从"被动响应"走向"主动智治"</h2>
          <p class="ft-cta-sub">人工智能 + 公共安全管理平台 — 以大安全（消防 + 应急）为核心</p>
          <div class="ft-cta-btns">
            <a href="#应用场景" class="hero-btn-fill">浏览应用场景<ArrowRight :size="14" /></a>
            <a href="#" class="hero-btn-ghost" style="border-color: rgba(255,255,255,0.12); color: rgba(255,255,255,0.65);">联系商务团队</a>
          </div>
        </div>
      </div>
      <div class="ft-links-wrap">
        <div class="ft-links">
          <div class="ft-brand">
            <div class="ft-brand-icon"><img src="/favicon.svg" alt="logo" width="12" height="12" /></div>
            <span class="ft-brand-name">公共安全管理平台</span>
            <p class="ft-brand-desc">以大安全为核心，赋能企业、教育、政务三大场景。</p>
            <div class="ft-contact">
              <span><Phone :size="10" color="rgba(54,120,227,0.7)" />xxx-xxx-xxx</span>
              <span><Mail :size="10" color="rgba(54,120,227,0.7)" />xxx@163.com</span>
            </div>
          </div>
          <div v-for="col in FOOTER_COLS" :key="col.title" class="ft-col">
            <h4>{{ col.title }}</h4>
            <a v-for="l in col.links" :key="l" href="#">{{ l }}</a>
          </div>
        </div>
        <div class="ft-bottom">
          <span>© 2026 人工智能 + 公共安全管理平台. All rights reserved.</span>
          <span class="footer-divider">|</span>
          <a class="footer-icp" href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">冀ICP备2026024061号-1</a>
        </div>
      </div>
    </footer>

    <!-- ===== Mobile tip modal ===== -->
    <div v-if="showMobileTip" class="mobile-tip-overlay" @click.self="showMobileTip = false">
      <div class="mobile-tip-card">
        <div class="mobile-tip-icon">💻</div>
        <h3 class="mobile-tip-title">目前仅支持电脑端体验</h3>
        <p class="mobile-tip-sub">请复制链接在电脑浏览器中打开</p>
        <button class="mobile-tip-btn" @click="copyExpUrl">
          {{ copied ? '复制成功，去体验吧' : '复制体验地址' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, ChevronRight, ChevronDown, Shield, Radio, Building2, Zap, FileText, Phone, Mail, Store } from 'lucide-vue-next'
import scenarioCampusImg from '@/assets/portal/scenario-campus.png'
import scenarioIndustryImg from '@/assets/portal/scenario-industry.png'
import scenarioMerchantImg from '@/assets/portal/scenario-ebike.png'

const router = useRouter()

// ===== Mobile detection =====
const isMobile = () => window.innerWidth < 768

// ===== Go experience =====
const showMobileTip = ref(false)
const copied = ref(false)

const handleGoExp = () => {
  if (isMobile()) {
    showMobileTip.value = true
  } else {
    window.open('/login', '_blank')
  }
}

const copyExpUrl = async () => {
  const url = window.location.origin + '/login'
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    // fallback
    const ta = document.createElement('textarea')
    ta.value = url
    ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select(); document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copied.value = true
}

// ===== Scroll & Nav =====
const scrolled = ref(false)
const navLinks = ['平台定位', '应用场景', 'AI 能力', '功能矩阵', '技术特性']
let scrollFn: () => void
onMounted(() => {
  scrollFn = () => { scrolled.value = window.scrollY > 48 }
  window.addEventListener('scroll', scrollFn, { passive: true })
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault()
      const id = (a as HTMLAnchorElement).getAttribute('href')!
      document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
    })
  })
})
onUnmounted(() => window.removeEventListener('scroll', scrollFn))

// ===== Hero =====
const titleChars = '人工智能 + 公共安全管理平台'.split('')

// ===== Section header reveal states =====
const posHeadV = ref(false)
const posHead = ref<HTMLElement | null>(null)
const scHeadV = ref(false)
const scHead = ref<HTMLElement | null>(null)
const aiHeadV = ref(false)
const aiHead = ref<HTMLElement | null>(null)
const featHeadV = ref(false)
const featHead = ref<HTMLElement | null>(null)
const techHeadV = ref(false)
const techHead = ref<HTMLElement | null>(null)
const protoV = ref(false)
const protoRef = ref<HTMLElement | null>(null)
const ftCtaV = ref(false)
const ftCta = ref<HTMLElement | null>(null)

onMounted(() => {
  // Section headers reveal
  const heads = [
    { el: posHead, v: posHeadV }, { el: scHead, v: scHeadV },
    { el: aiHead, v: aiHeadV }, { el: featHead, v: featHeadV },
    { el: techHead, v: techHeadV }, { el: protoRef, v: protoV },
    { el: ftCta, v: ftCtaV },
  ]
  const headObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const h = heads.find(x => x.el.value === e.target)
        if (h) { h.v.value = true; headObs.unobserve(e.target) }
      }
    })
  }, { threshold: 0.12 })
  heads.forEach(h => { if (h.el.value) headObs.observe(h.el.value) })

  // Card reveal (adds .visible class)
  const cardObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { (e.target as HTMLElement).classList.add('visible'); cardObs.unobserve(e.target) }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -24px 0px' })

  // Observe all .reveal card elements
  document.querySelectorAll('.reveal').forEach(el => { cardObs.observe(el) })

  onUnmounted(() => { headObs.disconnect(); cardObs.disconnect() })
})

// ===== Positioning =====
const POSITIONING = [
  { tag: '单点管控', title: '企业自主管理', body: '面向工贸企业、学校等主体单位，提供从日常巡检、隐患排查到应急响应的一站式安全自管能力，帮助落实安全主体责任。', icon: Building2 },
  { tag: '全域协同', title: '区域联勤联动', body: '面向教育局、应急管理局等监管部门，通过局端宏观监管与校端 / 企端微观执行的纵向架构，实现跨主体数据汇聚与精准督办。', icon: Radio },
  { tag: '集团统管', title: '垂直穿透管控', body: '面向集团型企业，总部一屏掌握各分支安全态势，数据逐级汇聚、风险逐层预警、指令直达末端，实现安全与业务管控深度融合。', icon: Shield },
]

// ===== Scenarios =====
const activeScenario = ref(0)
const SCENARIOS = [
  {
    title: '校园安全管理', audience: '教育局 · 中小学（含寄宿制）', slug: 'campus',
    summary: '食堂后厨全链条追溯、AI 声音识别防欺凌、宿舍电气消防巡检——让学校从"人管人"走向"数据管安全"。',
    tags: ['食品安全', 'AI 防欺凌', '宿舍安全'],
    icon: FileText, image: scenarioCampusImg,
  },
  {
    title: '工贸企业安全管理', audience: '应急管理局 · 规上 / 规下工贸企业', slug: 'industry',
    summary: '设备台账、巡查检查、隐患闭环、告警值守、动火管控——五个独立场景覆盖工厂安全全链路。',
    tags: ['设备保养', '巡查检查', '隐患闭环', '告警值守'],
    icon: Zap, image: scenarioIndustryImg,
  },
  {
    title: '小商户安全监管', audience: '街道办 · 市场监管局 · 物业', slug: 'merchant',
    summary: '商户每日安全自查打卡、物业入户巡查上报、隐患整改拍照闭环——覆盖辖区几千家店。',
    tags: ['安全自查', '巡查与隐患'],
    icon: Store, image: scenarioMerchantImg,
  },
]
// Auto carousel
let carouselTimer: ReturnType<typeof setInterval>
let carouselPaused = false
const pauseCarousel = () => { carouselPaused = true }
const goIndustry = (slug: string) => {
  pauseCarousel()
  router.push(`/portal/${slug}`)
}
onMounted(() => {
  carouselTimer = setInterval(() => {
    if (!carouselPaused) activeScenario.value = (activeScenario.value + 1) % SCENARIOS.length
  }, 4000)
})
onUnmounted(() => clearInterval(carouselTimer))

// ===== AI =====
const AI_LIST = [
  { title: 'AI 防欺凌预警', body: '在宿舍区、教学区和公共区域部署 AI 音频感知终端，捕捉敏感求救词；同步视觉算法识别异常聚集与肢体冲突。检测到风险事件即刻触发红色告警，通知安保人员在欺凌升级前到场干预。', num: '01' },
  { title: '电气火灾风险预判', body: '实时监测配电房电流波形，结合车间粉尘浓度传感器数据，AI 交叉分析发现切割机回路电流异常且粉尘浓度临界时，在火花产生前自动报警，联动降尘系统并推送停机检查指令。', num: '02' },
  { title: '明厨亮灶 AI 监管', body: '后厨 AI 视觉终端通过红外感应实现鼠患识别并抓拍取证，同时自动识别人员的口罩、工帽穿戴合规及违规吸烟行为。告警即时推送至管理人员，教育局端可远程核查消杀过程记录。', num: '03' },
  { title: '精准执法导航', body: '平台 AI 模型综合分析辖区内企业的电气监测、巡检记录及搜索行为等多维数据，发现高风险目标时自动标记，建议执法人员定向检查其除尘系统与电气防爆措施，将执法资源精准投放。', num: '04' },
]

// ===== Features =====
const FEATURES = [
  { name: '远程值守', desc: '消控室工作台、预案管理、告警推送、值守报表', state: 'done' },
  { name: '巡查检查', desc: '点位管理、巡查任务、计划编排、异常处理、巡查报表', state: 'done' },
  { name: '隐患管理', desc: '隐患上报、初核、整改、复查全流程闭环跟踪', state: 'done' },
  { name: '设备管理', desc: '设备台账、实时监控、事件日志、保养计划与任务', state: 'done' },
  { name: '维保管理', desc: '维保合同管理、维保记录、保养规范配置与执行', state: 'done' },
  { name: '工单管理', desc: '流程模板配置、工单监控、处置流转、归档追溯', state: 'wip' },
  { name: '危险作业', desc: '动火、高空等特殊作业备案、审批与全流程监管', state: 'wip' },
  { name: '动态表单', desc: '自定义表单设计、填写记录管理与数据分析', state: 'done' },
  { name: 'AI 告警分析', desc: '基于 Coze 工作流生成设备告警事件 AI 分析报告', state: 'done' },
  { name: '可视化大屏', desc: '应急局、企业、校园多级驾驶舱，一屏掌握全局', state: 'wip' },
  { name: '消息通知', desc: '站内信、短信、语音、第三方推送多通道覆盖', state: 'done' },
  { name: '系统管理', desc: '组织架构、人员岗位、权限配置、相关方管理', state: 'done' },
]
const STATE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  done: { label: '已上线', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  wip: { label: '开发中', color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
  planned: { label: '规划中', color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
}

// ===== TechStats count-up =====
const STATS = [
  { value: 205, unit: '台', label: '设备接入', sub: '港南二中项目' },
  { value: 6, unit: '种', label: '设备类型', sub: '多品牌兼容' },
  { value: 4, unit: '种', label: '通信协议', sub: 'MQTT · TCP · HTTP' },
  { value: 3, unit: '端', label: '多端协同', sub: 'PC · 移动 · 大屏' },
]
const countVals = ref(STATS.map(() => 0))
const techSection = ref<HTMLElement | null>(null)
let counted = false

onMounted(() => {
  const obs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !counted) {
      counted = true
      STATS.forEach((st, i) => {
        const t0 = performance.now()
        const tick = (now: number) => {
          const p = Math.min((now - t0) / 1800, 1)
          countVals.value[i] = Math.floor((1 - Math.pow(1 - p, 3)) * st.value)
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
      obs.disconnect()
    }
  }, { threshold: 0.3 })
  if (techSection.value) obs.observe(techSection.value)
  onUnmounted(() => obs.disconnect())
})

// ===== Protocols =====
const PROTOCOLS = ['MQTT 直连', 'TCP 直连', 'HTTP 订阅', 'MQTT 三方中转']

// ===== Footer =====
const FOOTER_COLS = [
  { title: '应用场景', links: ['校园安全', '工贸企业', '小商户安全监管', '动火作业管理'] },
  { title: '功能模块', links: ['远程值守', '巡查检查', '隐患管理', 'AI 告警分析', '可视化大屏'] },
  { title: '技术', links: ['MQTT 直连', 'TCP 直连', 'HTTP 订阅', '多端协同', 'API 文档'] },
  { title: '联系我们', links: ['预约演示', '商务合作', '技术支持', '关于平台'] },
]
</script>

<style>
/* ===== Font ===== */
.font-outfit { font-family: 'Outfit', 'Noto Sans SC', sans-serif; }

/* ===== Scrollbar ===== */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-thumb { background: rgba(54,120,227,0.25); border-radius: 2px; }

/* ===== Reveal ===== */
.reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }

/* ===== Keyframes ===== */
@keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
</style>

<style scoped>
/* ===== Shared ===== */
.sec-wrap { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
@media (min-width: 640px) { .sec-wrap { padding: 0 32px; } }
.sec-label { display: flex; align-items: center; gap: 12px; justify-content: center; margin-bottom: 16px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.2em; color: #3678E3; font-family: 'Outfit', 'Noto Sans SC', sans-serif; }
.sec-label-line { display: block; width: 32px; height: 1px; background: rgba(54,120,227,0.4); }
.sec-title { font-size: clamp(1.5rem, 4vw, 1.875rem); font-weight: 700; color: #101010; margin: 0 0 12px; font-family: 'Outfit', 'Noto Sans SC', sans-serif; text-align: center; }
.sec-desc { font-size: 14px; color: #5E5E5E; text-align: center; max-width: 480px; margin: 0 auto; }

/* ===== Nav ===== */
.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; transition: all 0.5s; background: transparent; border-bottom: 1px solid transparent; backdrop-filter: none; }
.nav.scrolled { background: rgba(255,255,255,0.96); border-bottom: 1px solid rgba(54,120,227,0.1); backdrop-filter: blur(16px); box-shadow: 0 1px 20px rgba(0,0,0,0.06); }
.nav-inner { max-width: 1360px; margin: 0 auto; padding: 0 16px; height: 56px; display: flex; align-items: center; justify-content: space-between; }
@media (min-width: 640px) { .nav-inner { padding: 0 32px; height: 64px; } }
.nav-brand { display: flex; align-items: center; gap: 6px; text-decoration: none; }
@media (min-width: 640px) { .nav-brand { gap: 8px; } }
.nav-logo { width: 24px; height: 24px; border-radius: 6px; background: #3678E3; flex-shrink: 0; }
@media (min-width: 640px) { .nav-logo { width: 28px; height: 28px; } }
.nav-name { font-weight: 700; font-size: 13px; color: #fff; transition: color 0.5s; font-family: 'Outfit', 'Noto Sans SC', sans-serif; letter-spacing: -0.01em; white-space: nowrap; }
@media (min-width: 640px) { .nav-name { font-size: 16px; } }
.nav-name.scrolled { color: #101010; }
.nav-links { display: none; gap: 28px; }
@media (min-width: 768px) { .nav-links { display: flex; } }
.nav-link { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.7); text-decoration: none; transition: color 0.2s; }
.nav-link:hover { color: #3678E3; }
.nav-link.scrolled { color: rgba(16,16,16,0.6); }
.nav-link.scrolled:hover { color: #3678E3; }
.nav-actions { display: flex; align-items: center; gap: 8px; }
@media (min-width: 640px) { .nav-actions { gap: 12px; } }
.nav-btn { font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 6px; border: none; background: #3678E3; color: #fff; cursor: pointer; box-shadow: 0 2px 8px rgba(54,120,227,0.3); transition: background 0.2s; }
@media (min-width: 640px) { .nav-btn { font-size: 14px; padding: 8px 20px; } }
.nav-btn:hover { background: rgba(54,120,227,0.9); }

/* ===== Hero ===== */
.hero { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; background: linear-gradient(160deg, #162d5e 0%, #1e4080 55%, #1a3568 100%); }
.hero-grid { position: absolute; inset: 0; opacity: 0.045; background-image: linear-gradient(rgba(255,255,255,1) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px); background-size: 80px 80px; }
.hero-line-d { position: absolute; top: 0; right: 0; width: 1px; height: 100%; opacity: 0.1; background: linear-gradient(to bottom, transparent, #3678E3, transparent); }
.hero-line-v { position: absolute; top: 0; left: 33.33%; width: 1px; height: 100%; opacity: 0.05; background: linear-gradient(to bottom, transparent, #fff, transparent); }
.hero-content { position: relative; z-index: 10; max-width: 960px; margin: 0 auto; padding: 80px 20px 128px; text-align: center; }
@media (min-width: 640px) { .hero-content { padding-left: 32px; padding-right: 32px; } }
.hero-char { display: inline-block; font-size: clamp(2rem, 6vw, 4rem); font-weight: 900; font-family: 'Outfit', 'Noto Sans SC', sans-serif; line-height: 1.1; opacity: 0; animation: charIn 0.5s ease forwards; }
@keyframes charIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.hero-sub { font-size: 16px; color: rgba(255,255,255,0.55); line-height: 1.7; max-width: 560px; margin: 28px auto 40px; opacity: 0; animation: fadeIn 0.6s ease 0.8s forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@media (min-width: 640px) { .hero-sub { font-size: 18px; } }
.hero-btns { display: flex; flex-direction: column; align-items: center; gap: 12px; opacity: 0; animation: fadeIn 0.6s ease 1s forwards; }
@media (min-width: 640px) { .hero-btns { flex-direction: row; justify-content: center; } }
.hero-btn-fill { display: flex; align-items: center; gap: 8px; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; color: #fff; background: #3678E3; text-decoration: none; box-shadow: 0 4px 20px rgba(54,120,227,0.45); transition: background 0.2s; }
.hero-btn-fill:hover { background: rgba(54,120,227,0.9); }
.hero-btn-ghost { display: flex; align-items: center; gap: 8px; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.75); border: 1px solid rgba(255,255,255,0.15); text-decoration: none; transition: background 0.2s; }
.hero-btn-ghost:hover { background: rgba(255,255,255,0.05); }
.hero-fade { position: absolute; bottom: 0; left: 0; right: 0; height: 80px; background: linear-gradient(to bottom, transparent, rgba(22,45,94,0.3)); pointer-events: none; }
.hero-scroll { position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 8px; opacity: 0.75; }
.hero-scroll-text { font-size: 13px; font-weight: 500; color: #93c5fd; }
.hero-scroll-arrow { color: #93c5fd; animation: bounce 2s infinite; }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(8px); } }

/* ===== Positioning ===== */
.pos { padding: 80px 0; background: #fafafa; }
@media (min-width: 640px) { .pos { padding: 112px 0; } }
.pos-head { text-align: center; margin-bottom: 36px; }
.pos-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 768px) { .pos-grid { grid-template-columns: repeat(3, 1fr); } }
.pos-card { background: #fff; border: 1px solid rgba(54,120,227,0.12); border-radius: 12px; padding: 24px; transition: all 0.3s; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
@media (min-width: 640px) { .pos-card { padding: 32px; } }
.pos-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(54,120,227,0.1); }
.pos-card-head { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.pos-card-icon { width: 36px; height: 36px; border-radius: 8px; background: rgba(54,120,227,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pos-card-tag { font-size: 12px; font-weight: 600; color: #3678E3; letter-spacing: 0.08em; background: rgba(54,120,227,0.07); padding: 2px 8px; border-radius: 4px; font-family: 'Outfit', 'Noto Sans SC', sans-serif; }
.pos-card-title { font-size: 16px; font-weight: 700; color: #101010; margin: 0 0 8px; font-family: 'Outfit', 'Noto Sans SC', sans-serif; }
.pos-card-body { font-size: 14px; color: #5E5E5E; line-height: 1.65; margin: 0; }

/* ===== Scenarios ===== */
.scenarios-sec { padding: 80px 0; background: linear-gradient(180deg, #eef3ff 0%, #e8effc 50%, #f4f7ff 100%); }
@media (min-width: 640px) { .scenarios-sec { padding: 112px 0; } }
.sc-dots { display: flex; justify-content: center; gap: 10px; margin-top: 24px; }
.sc-dot-btn { width: 8px; height: 8px; border-radius: 50%; border: none; background: #d0d8e8; cursor: pointer; padding: 0; transition: all 0.3s; }
.sc-dot-btn.active { width: 24px; border-radius: 4px; background: #3678E3; }
.sc-stage { overflow: hidden; border-radius: 16px; }
.sc-track { display: flex; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.sc-panel { flex-shrink: 0; width: 100%; display: grid; grid-template-columns: 1fr; gap: 32px; padding: 32px; min-height: 380px; box-sizing: border-box; border-radius: 16px; background: rgba(255,255,255,0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 8px 32px rgba(54,120,227,0.08), inset 0 1px 0 rgba(255,255,255,0.6); cursor: pointer; transition: all 0.35s; }
.sc-panel:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(54,120,227,0.15); }
@media (min-width: 1024px) { .sc-panel { grid-template-columns: 1fr 1fr; gap: 48px; padding: 40px; min-height: 360px; } }
.sc-title { font-size: 22px; font-weight: 700; font-family: 'Outfit', 'Noto Sans SC', sans-serif; color: #101010; margin: 0 0 4px; }
@media (min-width: 640px) { .sc-title { font-size: 26px; } }
.sc-aud { font-size: 14px; color: #3678E3; font-weight: 500; margin: 0 0 16px; }
.sc-summary { font-size: 14px; color: rgba(16,16,16,0.65); line-height: 1.65; margin: 0 0 20px; }
.sc-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.sc-tag { font-size: 11px; font-weight: 500; padding: 4px 12px; border-radius: 9999px; background: rgba(54,120,227,0.06); color: #3678E3; border: 1px solid rgba(54,120,227,0.15); }
.sc-cta { display: inline-flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 8px; border: 1px solid rgba(54,120,227,0.25); background: transparent; color: #3678E3; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.sc-cta:hover { background: #3678E3; color: #fff; border-color: #3678E3; }
.sc-points { list-style: none; padding: 0; margin: 0; }
.sc-points li { display: flex; gap: 12px; font-size: 14px; color: rgba(16,16,16,0.75); line-height: 1.65; margin-bottom: 12px; }
.sc-dot { width: 6px; height: 6px; border-radius: 50%; background: #3678E3; flex-shrink: 0; margin-top: 7px; }
.sc-image { width: 100%; height: 100%; object-fit: contain; border-radius: 12px; border: 4px solid #e5e5e5; }

/* ===== AI ===== */
.ai { padding: 80px 0; background: #fafafa; }
@media (min-width: 640px) { .ai { padding: 112px 0; } }
.ai-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 48px; }
@media (min-width: 640px) { .ai-grid { grid-template-columns: repeat(2, 1fr); } }
.ai-card { position: relative; background: #fff; border: 1px solid rgba(54,120,227,0.1); border-radius: 12px; padding: 28px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.04); transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
.ai-card:hover { background: #3678E3; border-color: #3678E3; box-shadow: 0 10px 36px rgba(54,120,227,0.35); transform: translateY(-2px); }
.ai-num { position: absolute; top: 16px; right: 20px; font-size: 48px; font-weight: 900; color: rgba(54,120,227,0.1); font-family: 'Outfit', 'Noto Sans SC', sans-serif; line-height: 1; pointer-events: none; user-select: none; transition: color 0.35s; }
.ai-card:hover .ai-num { color: rgba(255,255,255,0.15); }
.ai-line { width: 24px; height: 2px; background: #3678E3; margin-bottom: 16px; transition: width 0.35s, background 0.35s; }
.ai-card:hover .ai-line { width: 48px; background: #fff; }
.ai-title { font-size: 16px; font-weight: 700; color: #101010; margin: 0 0 12px; font-family: 'Outfit', 'Noto Sans SC', sans-serif; transition: color 0.35s; }
.ai-card:hover .ai-title { color: #fff; }
.ai-body { font-size: 14px; color: #5E5E5E; line-height: 1.8; margin: 0; transition: color 0.35s; }
.ai-card:hover .ai-body { color: rgba(255,255,255,0.85); }

/* ===== Features ===== */
.feat { padding: 80px 0; background: #fff; }
@media (min-width: 640px) { .feat { padding: 112px 0; } }
.feat-legend { display: flex; justify-content: center; gap: 20px; margin-top: 20px; }
.feat-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #5E5E5E; }
.feat-legend-dot { width: 8px; height: 8px; border-radius: 50%; display: block; }
.feat-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 48px; }
@media (min-width: 640px) { .feat-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .feat-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1280px) { .feat-grid { grid-template-columns: repeat(4, 1fr); } }
.feat-card { display: flex; border-radius: 12px; overflow: hidden; background: #fff; border: 1px solid rgba(54,120,227,0.1); box-shadow: 0 1px 6px rgba(0,0,0,0.04); transition: all 0.25s; }
.feat-card:hover { box-shadow: 0 6px 24px rgba(54,120,227,0.1); }
.feat-bar { width: 4px; flex-shrink: 0; transition: width 0.2s; }
.feat-card:hover .feat-bar { width: 5px; }
.feat-body { flex: 1; padding: 16px; }
.feat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.feat-top h4 { font-size: 14px; font-weight: 700; color: #101010; margin: 0; }
.feat-badge { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; font-family: 'Outfit', 'Noto Sans SC', sans-serif; flex-shrink: 0; margin-left: 8px; }
.feat-body p { font-size: 12px; color: #5E5E5E; line-height: 1.5; margin: 0; }

/* ===== TechStats ===== */
.tech { position: relative; padding: 80px 0; background: linear-gradient(160deg, #162d5e 0%, #1e4080 100%); overflow: hidden; }
@media (min-width: 640px) { .tech { padding: 112px 0; } }
.tech-grid-bg { position: absolute; inset: 0; opacity: 0.04; background-image: linear-gradient(rgba(255,255,255,1) 1px,transparent 1px), linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px); background-size: 60px 60px; }
.tech-wrap { position: relative; }
.sec-label--light { color: rgba(147,197,253,1); }
.sec-label-line--light { background: rgba(147,197,253,0.4); }
.sec-title--light { color: #fff; }
.stats-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; border-radius: 16px; overflow: hidden; margin-bottom: 56px; background: rgba(255,255,255,0.04); }
@media (min-width: 1024px) { .stats-row { grid-template-columns: repeat(4, 1fr); } }
.stat-card { display: flex; flex-direction: column; align-items: center; padding: 40px 16px; text-align: center; background: rgba(26,53,104,0.6); }
.stat-num { font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; color: #fff; font-family: 'Outfit', 'Noto Sans SC', sans-serif; line-height: 1; margin-bottom: 4px; }
.stat-unit { font-size: 18px; font-weight: 400; color: rgba(255,255,255,0.5); margin-left: 4px; }
.stat-label { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.8); margin-top: 8px; }
.stat-sub { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 4px; font-family: 'Outfit', 'Noto Sans SC', sans-serif; }
.protocols { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 12px; }
.proto-label { font-size: 12px; color: rgba(255,255,255,0.4); font-family: 'Outfit', 'Noto Sans SC', sans-serif; margin-right: 8px; }
.proto-tag { font-size: 12px; font-weight: 600; padding: 6px 16px; border-radius: 9999px; background: rgba(54,120,227,0.15); border: 1px solid rgba(54,120,227,0.3); color: #93c5fd; font-family: 'Outfit', 'Noto Sans SC', sans-serif; }

/* ===== Footer ===== */
.ft { background: #0d1a38; }
.ft-cta { text-align: center; padding: 64px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
@media (min-width: 640px) { .ft-cta { padding: 80px 20px; } }
.ft-cta-label { font-size: 12px; color: rgba(147,197,253,0.7); letter-spacing: 0.2em; text-transform: uppercase; font-family: 'Outfit', 'Noto Sans SC', sans-serif; margin: 0 0 20px; }
.ft-cta-title { font-size: 24px; font-weight: 700; color: #fff; margin: 0 0 16px; font-family: 'Outfit', 'Noto Sans SC', sans-serif; }
@media (min-width: 640px) { .ft-cta-title { font-size: 30px; } }
.ft-cta-sub { font-size: 14px; color: rgba(255,255,255,0.6); max-width: 448px; margin: 0 auto 32px; }
.ft-cta-btns { display: flex; flex-direction: column; align-items: center; gap: 12px; }
@media (min-width: 640px) { .ft-cta-btns { flex-direction: row; justify-content: center; } }
.ft-links-wrap { max-width: 1200px; margin: 0 auto; padding: 48px 20px; }
@media (min-width: 640px) { .ft-links-wrap { padding: 48px 32px; } }
.ft-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; padding-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.05); }
@media (min-width: 640px) { .ft-links { grid-template-columns: repeat(4, 1fr); } }
@media (min-width: 768px) { .ft-links { grid-template-columns: 2fr 1fr 1fr 1fr 1fr; } }
.ft-brand-icon { width: 24px; height: 24px; border-radius: 6px; background: #3678E3; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
.ft-brand-name { font-size: 14px; font-weight: 700; color: #fff; font-family: 'Outfit', 'Noto Sans SC', sans-serif; }
.ft-brand-desc { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.65; margin: 12px 0 16px; }
.ft-contact { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.6); }
.ft-contact span { display: flex; align-items: center; gap: 6px; }
.ft-col h4 { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.7); margin: 0 0 12px; font-family: 'Outfit', 'Noto Sans SC', sans-serif; }
.ft-col a { display: block; font-size: 12px; color: rgba(255,255,255,0.55); text-decoration: none; padding: 4px 0; transition: color 0.2s; }
.ft-col a:hover { color: rgba(255,255,255,0.85); }
.ft-bottom { display: flex; flex-direction: column; align-items: center; gap: 12px; padding-top: 32px; font-size: 12px; color: rgba(255,255,255,0.5); }
@media (min-width: 640px) { .ft-bottom { flex-direction: row; justify-content: space-between; } }
.footer-icp { font-family: 'Outfit', 'Noto Sans SC', sans-serif; color: rgba(255,255,255,0.5); text-decoration: none; cursor: pointer; transition: color 0.2s; }
.footer-icp:hover { color: rgba(147,197,253,0.9); }

/* ===== Mobile tip modal ===== */
.mobile-tip-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 20px; }
.mobile-tip-card { background: #fff; border-radius: 16px; padding: 40px 32px; text-align: center; max-width: 320px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.mobile-tip-icon { font-size: 48px; margin-bottom: 16px; }
.mobile-tip-title { font-size: 18px; font-weight: 700; color: #101010; margin: 0 0 8px; }
.mobile-tip-sub { font-size: 14px; color: #5E5E5E; margin: 0 0 24px; line-height: 1.6; }
.mobile-tip-btn { width: 100%; padding: 12px 24px; border-radius: 8px; border: none; font-size: 15px; font-weight: 600; background: #3678E3; color: #fff; cursor: pointer; transition: background 0.2s; }
.mobile-tip-btn:hover { background: rgba(54,120,227,0.9); }
</style>
