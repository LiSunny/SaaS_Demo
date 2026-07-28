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
      <div class="hero-inner">
        <div class="hero-left">
          <h1 class="hero-title">
            <span v-for="(ch, i) in titleChars" :key="i">
              <template v-if="ch === '+'"><span class="hero-char plus" :style="{ animationDelay: `${80 + i * 40}ms`, color: '#3678E3', textShadow: '0 0 30px rgba(54,120,227,0.2)' }">+</span><br /></template>
              <span v-else class="hero-char" :style="{ animationDelay: `${80 + i * 40}ms` }">{{ ch === ' ' ? ' ' : ch }}</span>
            </span>
          </h1>
          <p class="hero-sub">覆盖教育、工业、城市治理三大领域，构建从单点管控到全域联动的完整安全治理体系</p>
          <div class="hero-btns">
            <a href="#应用场景" class="hero-btn-fill"><span>了解应用场景</span><ArrowRight :size="15" /></a>
            <a href="/login" class="hero-btn-ghost"><span>去体验</span><ArrowRight :size="15" /></a>
          </div>
        </div>
        <div class="hero-right">
          <div class="hero-preview reveal">
            <div class="hero-stack">
              <div v-for="card in heroCards" :key="card.alt"
                class="hero-stack-card"
                :class="'hero-stack-pos' + card.pos"
              >
                <div class="hero-window-bar">
                  <span class="hero-window-dot dot-red"></span>
                  <span class="hero-window-dot dot-yellow"></span>
                  <span class="hero-window-dot dot-green"></span>
                </div>
                <img :src="card.src" :alt="card.alt" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Trust Bar ===== -->
    <section class="trust">
      <div class="sec-wrap">
        <div class="trust-row">
          <div v-for="(t, i) in TRUST_NUMS" :key="i" class="trust-item reveal" :style="{ transitionDelay: `${i * 80}ms` }">
            <div class="trust-num">{{ t.num }}<span class="trust-unit">{{ t.unit }}</span></div>
            <div class="trust-label">{{ t.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Positioning ===== -->
    <section id="平台定位" class="pos">
      <div class="sec-wrap">
        <div ref="posHead" class="pos-head reveal" :class="{ visible: posHeadV }">
          <div class="sec-label"><span class="sec-label-line"></span>平台定位<span class="sec-label-line"></span></div>
          <h2 class="sec-title">深度赋能三类管理模式</h2>
          <p class="sec-desc">覆盖从单点管控到全域联动的完整安全治理体系</p>
        </div>
        <div class="pos-grid">
          <div v-for="(p, i) in POSITIONING" :key="i" class="pos-card reveal" :style="{ transitionDelay: `${i * 100}ms` }">
            <div class="pos-card-bg" :style="{ backgroundImage: `url(${p.image})` }"></div>
            <div class="pos-card-overlay"></div>
            <div class="pos-card-content">
              <div class="pos-card-top">
                <span class="pos-card-tag">{{ p.tag }}</span>
                <h3 class="pos-card-title">{{ p.title }}</h3>
              </div>
              <p class="pos-card-body">{{ p.body }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Scenarios ===== -->
    <section id="应用场景" class="scenarios-sec">
      <div class="sec-wrap">
        <div ref="scHead" class="reveal" :class="{ visible: scHeadV }" style="text-align:center; margin-bottom:36px;">
          <div class="sec-label"><span class="sec-label-line"></span>应用场景<span class="sec-label-line"></span></div>
          <h2 class="sec-title">核心应用场景</h2>
          <p class="sec-desc">覆盖校园安全、工贸企业、小商户经营等典型场景，提供从日常巡检、隐患管理到应急响应的闭环解决方案</p>
        </div>
        <!-- Content panel with horizontal slide -->
        <div class="sc-stage">
          <div class="sc-track" :style="{ transform: `translateX(-${activeScenario * 100}%)` }">
            <div v-for="(sc, i) in SCENARIOS" :key="i" class="sc-panel" @click="goIndustry(sc.slug)" @mouseenter="carouselPaused = true" @mouseleave="carouselPaused = false">
              <div class="sc-panel-left">
                <div class="sc-header-row">
                  <div>
                    <h3 class="sc-title">{{ sc.title }}</h3>
                    <p class="sc-aud">{{ sc.audience }}</p>
                  </div>
                  <button class="sc-cta"><span>查看详情</span><ArrowRight :size="13" /></button>
                </div>
                <p class="sc-summary">{{ sc.summary }}</p>
                <div class="sc-tags">
                  <span v-for="t in sc.tags" :key="t" class="sc-tag">{{ t }}</span>
                </div>
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
          <div class="sec-label"><span class="sec-label-line"></span>AI赋能<span class="sec-label-line"></span></div>
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

    <!-- ===== Case Studies ===== -->
    <section id="案例展示" class="cases">
      <div class="sec-wrap">
        <div ref="featHead" class="reveal" :class="{ visible: featHeadV }">
          <div class="sec-label"><span class="sec-label-line"></span>案例展示<span class="sec-label-line"></span></div>
          <h2 class="sec-title">落地案例，真实可见</h2>
          <p class="sec-desc">已在校园安全、工贸企业等领域完成多个项目交付</p>
        </div>
        <div class="cases-tabs">
          <button v-for="tab in caseTabs" :key="tab.key"
            class="cases-tab"
            :class="{ active: activeCaseTab === tab.key }"
            @click="activeCaseTab = tab.key"
          >{{ tab.label }}</button>
        </div>
        <div class="cases-stage">
          <div class="cases-track" :style="{ transform: `translateX(-${caseScroll * (100 / 3)}%)` }"
            @mouseenter="casePaused = true" @mouseleave="casePaused = false">
            <div v-for="(c, i) in filteredCases" :key="i"
              class="case-slant"
              :style="{ backgroundImage: `url(${c.image})` }"
              @click="goCase(c.slug)"
            >
              <div class="case-slant-overlay"></div>
              <div class="case-slant-content">
                <span class="case-slant-tag">{{ c.tag }}</span>
                <h4 class="case-slant-title">{{ c.name }}</h4>
                <p class="case-slant-desc">{{ c.desc }}</p>
                <div class="case-slant-nums">
                  <span v-for="n in c.nums" :key="n">{{ n }}</span>
                </div>
              </div>
            </div>
          </div>
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
            <a href="#" class="hero-btn-ghost">联系商务团队</a>
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
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Zap, FileText, Phone, Mail, Store, Monitor, ClipboardCheck, AlertTriangle, Cpu, Brain, Bell } from 'lucide-vue-next'
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
const navLinks = ['平台定位', '应用场景', 'AI 能力', '案例展示']
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

// ===== Hero stack carousel =====
import heroCampusImg from '@/assets/portal/hero-campus.png'
import heroIndustryImg from '@/assets/portal/hero-industry.png'
import heroMerchantImg from '@/assets/portal/hero-merchant.png'

const HERO_IMAGES = [
  { src: heroCampusImg, alt: '校园安全管理大屏' },
  { src: heroIndustryImg, alt: '工贸企业安全管理大屏' },
  { src: heroMerchantImg, alt: '小商户安全监管大屏' },
]
const heroCards = ref(HERO_IMAGES.map((img, i) => ({ ...img, pos: i })))
let stackTimer: ReturnType<typeof setInterval>
onMounted(() => {
  stackTimer = setInterval(() => {
    heroCards.value = heroCards.value.map(c => ({
      ...c,
      pos: (c.pos + 1) % 3,
    }))
  }, 4000)
})
onUnmounted(() => clearInterval(stackTimer))

// ===== Section header reveal states =====
const posHeadV = ref(false)
const posHead = ref<HTMLElement | null>(null)
const scHeadV = ref(false)
const scHead = ref<HTMLElement | null>(null)
const aiHeadV = ref(false)
const aiHead = ref<HTMLElement | null>(null)
const featHeadV = ref(false)
const featHead = ref<HTMLElement | null>(null)
const ftCtaV = ref(false)
const ftCta = ref<HTMLElement | null>(null)

onMounted(() => {
  // Section headers reveal
  const heads = [
    { el: posHead, v: posHeadV }, { el: scHead, v: scHeadV },
    { el: aiHead, v: aiHeadV }, { el: featHead, v: featHeadV },
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

// ===== Trust Bar =====
const TRUST_NUMS = [
  { num: '205', unit: '+', label: '台设备接入' },
  { num: '3', unit: '类', label: '核心场景覆盖' },
  { num: '3', unit: '端', label: '多端协同' },
  { num: '4', unit: '种', label: '通信协议兼容' },
]

// ===== Positioning =====
const POSITIONING = [
  { tag: '单点管控', title: '企业自主管理', body: '面向单个项目或企业的"大安全自主管理"。通过构建智能化的安全管理平台，实现对消防设施、应急预案、风险隐患等要素的实时监测与动态管理，提升单位自身的安全防控能力和应急响应效率。', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80' },
  { tag: '全域协同', title: '区域联勤联动', body: '围绕监管部门为核心的"区域联勤联动"机制。打通区域内多个单位、部门之间的信息壁垒，建立统一指挥、快速响应、多方协同的应急联动体系，提升对突发事件的综合处置能力。', image: 'https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=600&q=80' },
  { tag: '集团统管', title: '垂直穿透管控', body: '针对大型集团公司的"垂直穿透管控"模式。通过搭建集团级安全管理中枢平台，实现对下属各级子公司、项目单位的安全状况进行统一监管与调度，强化集团对全链条安全风险的掌控能力。', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80' },
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
    title: '工贸企业安全管理', audience: '应急局 · 规上 / 规下工贸企业', slug: 'industry',
    summary: '设备台账、巡查检查、隐患闭环、告警值守、动火管控——五个独立场景覆盖工厂安全全链路。',
    tags: ['设备保养', '巡查检查', '隐患闭环', '告警值守'],
    icon: Zap, image: scenarioIndustryImg,
  },
  {
    title: '小商户安全监管', audience: '街道办 · 应急局 · 物业', slug: 'merchant',
    summary: '商户每日安全自查打卡、物业入户巡查上报、隐患整改拍照闭环——覆盖辖区几千家店。',
    tags: ['安全自查', '巡查与隐患'],
    icon: Store, image: scenarioMerchantImg,
  },
]
// Auto carousel
let carouselTimer: ReturnType<typeof setInterval>
let carouselPaused: boolean = false
const pauseCarousel = () => { carouselPaused = true }
const goIndustry = (slug: string) => {
  pauseCarousel()
  router.push(`/portal/${slug}`)
}
onMounted(() => {
  startCaseScroll()
  carouselTimer = setInterval(() => {
    if (!carouselPaused) activeScenario.value = (activeScenario.value + 1) % SCENARIOS.length
  }, 8000)
})
onUnmounted(() => { clearInterval(carouselTimer); clearInterval(caseTimer) })

// ===== AI =====
const AI_LIST = [
  { title: 'AI 防欺凌预警', body: '在宿舍区、教学区和公共区域部署 AI 音频感知终端，捕捉敏感求救词；同步视觉算法识别异常聚集与肢体冲突。检测到风险事件即刻触发红色告警，通知安保人员在欺凌升级前到场干预。', num: '01' },
  { title: '电气火灾风险预判', body: '实时监测配电房电流波形，结合车间粉尘浓度传感器数据，AI 交叉分析发现切割机回路电流异常且粉尘浓度临界时，在火花产生前自动报警，联动降尘系统并推送停机检查指令。', num: '02' },
  { title: '明厨亮灶 AI 监管', body: '后厨 AI 视觉终端通过红外感应实现鼠患识别并抓拍取证，同时自动识别人员的口罩、工帽穿戴合规及违规吸烟行为。告警即时推送至管理人员，教育局端可远程核查消杀过程记录。', num: '03' },
  { title: '精准执法导航', body: '平台 AI 模型综合分析辖区内企业的电气监测、巡检记录及搜索行为等多维数据，发现高风险目标时自动标记，建议执法人员定向检查其除尘系统与电气防爆措施，将执法资源精准投放。', num: '04' },
]

// ===== Cases =====
const activeCaseTab = ref('all')
const caseTabs = [
  { key: 'all', label: '全部' },
  { key: '教育', label: '教育' },
  { key: '工业', label: '工业' },
  { key: '城市治理', label: '城市治理' },
  { key: '垂直业务', label: '垂直业务' },
]
const CASES = [
  { slug: 'gangnan-campus', name: '港南二中校园安全', tag: '教育', desc: '部署 AI 防欺凌系统、消防监测终端与应急指挥平台，实现校园安全事件早发现、快响应，覆盖 200+ 终端设备。', nums: ['200+ 设备', '6 类终端', '4 种协议'], image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80' },
  { slug: 'industrial-park', name: '工贸企业安全监测', tag: '工业', desc: '面向化工、制造等工贸企业部署环境感知与安全监测终端，实时预警可燃气体、有毒物质，联动应急响应机制。', nums: ['800+ 监测点', '3 类感知', '实时预警'], image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80' },
  { slug: 'fire-maintenance', name: '消防维保管理', tag: '垂直业务', desc: '搭建消防设施监测与维保管理平台，实现设备实时感知、全生命周期管理，降低人工巡检成本 60%。', nums: ['500+ 传感器', '30+ 点位', '60% 增效'], image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80' },
  { slug: 'hot-work', name: '动火作业管理', tag: '垂直业务', desc: '面向施工现场的动火作业全流程管控，从申请审批、现场监护到完工验收，确保高风险作业合规可控。', nums: ['4 阶段', '15 步流程', '三级审批'], image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80' },
  { slug: 'work-resumption', name: '复工复产管理', tag: '垂直业务', desc: '面向工贸企业复工全流程数字化管理，覆盖准备、审核、试产到正式复产四阶段，六步标准化流程确保安全合规，实现企业安全返岗。', nums: ['4 阶段', '6 步流程', '全链追踪'], image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80' },
  { slug: 'commercial-street', name: '商业街安全管理', tag: '城市治理', desc: '建设商铺消防联控与应急联动平台，打通商户、物业、监管部门三级协同，提升街区整体安全治理水平。', nums: ['100+ 商铺', '3 级联动', '7×24 值守'], image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80' },
  { slug: 'quanzhou-cockpit', name: '泉州应消联勤监管平台', tag: '城市治理', desc: '依托AI大模型与物联网技术，构建全市首个"人工智能+应消联勤"一体化管控平台，覆盖工贸企业自律、消防控制室值守、风险源作业审批等14个核心模块，实现一屏观全域、一网管消防。', nums: ['14 模块', 'AI 研判', '多端协同'], image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80' },
]

const filteredCases = computed(() =>
  activeCaseTab.value === 'all' ? CASES : CASES.filter(c => c.tag === activeCaseTab.value)
)

function goCase(slug: string) {
  router.push(`/portal/case/${slug}`)
}

// Cases auto scroll
const caseScroll = ref(0)
let casePaused: boolean = false
let caseTimer: ReturnType<typeof setInterval>
const startCaseScroll = () => {
  const total = filteredCases.value.length
  caseTimer = setInterval(() => {
    if (!casePaused && total > 3) {
      caseScroll.value = (caseScroll.value + 1) % (total - 2)
    }
  }, 4000)
}
watch(activeCaseTab, () => {
  caseScroll.value = 0
  clearInterval(caseTimer)
  startCaseScroll()
})

// ===== Footer =====
const FOOTER_COLS = [
  { title: '应用场景', links: ['校园安全', '工贸企业', '小商户安全监管'] },
  { title: '功能模块', links: ['远程值守', '巡查检查', '隐患管理', 'AI 告警分析', '可视化大屏'] },
  { title: '技术', links: ['MQTT 直连', 'TCP 直连', 'HTTP 订阅', '多端协同', 'API 文档'] },
  { title: '联系我们', links: ['预约演示', '商务合作', '技术支持', '关于平台'] },
]
</script>

<style>
/* ===== Font ===== */
.font-outfit { font-family: var(--f-display); }

html, body { margin: 0; padding: 0; }

/* ===== Scrollbar (hidden) ===== */
::-webkit-scrollbar { display: none; }
* { scrollbar-width: none; }

/* ===== Reveal ===== */
.reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.7s ease, transform 0.7s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }

/* ===== Keyframes ===== */
@keyframes fadeSlideIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
</style>

<style scoped>
/* ===== Font Tokens ===== */
.portal { --f-display: 'Outfit', 'Noto Sans SC', sans-serif; --f-body: 'Noto Sans SC', 'Outfit', sans-serif; }
/* ===== Shared ===== */
.sec-wrap { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
@media (min-width: 640px) { .sec-wrap { padding: 0 32px; } }
.sec-label { display: flex; align-items: center; gap: 12px; justify-content: center; margin-bottom: 16px; font-size: 18px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #3678E3; font-family: var(--f-display); }
.sec-label-line { display: block; width: 32px; height: 1px; background: rgba(54,120,227,0.4); }
.sec-title { font-size: clamp(1.5rem, 4vw, 1.875rem); font-weight: 700; color: #101010; margin: 0 0 12px; font-family: var(--f-display); text-align: center; }
.sec-desc { font-size: 16px; color: #5E5E5E; text-align: center; max-width: 480px; margin: 0 auto; }

/* ===== Nav ===== */
.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; transition: all 0.5s; background: rgba(255,255,255,0.92); border-bottom: 1px solid rgba(54,120,227,0.08); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 1px 8px rgba(0,0,0,0.04); }
.nav.scrolled { background: rgba(255,255,255,0.96); border-bottom: 1px solid rgba(54,120,227,0.12); box-shadow: 0 2px 20px rgba(0,0,0,0.06); }
.nav-inner { max-width: 1360px; margin: 0 auto; padding: 0 16px; height: 56px; display: flex; align-items: center; justify-content: space-between; }
@media (min-width: 640px) { .nav-inner { padding: 0 32px; height: 64px; } }
.nav-brand { display: flex; align-items: center; gap: 6px; text-decoration: none; }
@media (min-width: 640px) { .nav-brand { gap: 8px; } }
.nav-logo { width: 24px; height: 24px; border-radius: 6px; background: #3678E3; flex-shrink: 0; }
@media (min-width: 640px) { .nav-logo { width: 28px; height: 28px; } }
.nav-name { font-weight: 700; font-size: 13px; color: #101010; font-family: var(--f-display); letter-spacing: -0.01em; white-space: nowrap; }
@media (min-width: 640px) { .nav-name { font-size: 16px; } }
.nav-links { display: none; gap: 28px; }
@media (min-width: 768px) { .nav-links { display: flex; } }
.nav-link { font-size: 15px; font-weight: 600; color: rgba(16,16,16,0.6); text-decoration: none; cursor: pointer; transition: color 0.2s; }
.nav-link:hover { color: #3678E3; }
.nav-actions { display: flex; align-items: center; gap: 8px; }
@media (min-width: 640px) { .nav-actions { gap: 12px; } }
.nav-btn { font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 6px; border: none; background: #3678E3; color: #fff; cursor: pointer; box-shadow: 0 2px 8px rgba(54,120,227,0.3); transition: background 0.2s; }
@media (min-width: 640px) { .nav-btn { font-size: 14px; padding: 8px 20px; } }
.nav-btn:hover { background: rgba(54,120,227,0.9); }

/* ===== Hero ===== */
.hero { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; background: linear-gradient(180deg, #f8faff 0%, #eef3ff 50%, #f4f7ff 100%); padding: 40px 0 80px; }
.hero::after { content: ''; position: absolute; inset: 0; z-index: 0; background: url('@/assets/portal/hero-bg.png') center/cover no-repeat; opacity: 0.3; pointer-events: none; }
.hero-inner { position: relative; z-index: 10; max-width: 1200px; width: 100%; margin: 0 auto; padding: 80px 0; display: flex; align-items: center; gap: 48px; }
.hero-left { flex: 1; min-width: 0; text-align: left; margin-left: -80px; }
.hero-right { flex: 0 0 690px; margin-right: -80px; }
@media (max-width: 900px) {
  .hero-inner { flex-direction: column; padding: 80px 20px 48px; gap: 32px; }
  .hero-left { text-align: center; }
  .hero-right { flex: 0 0 auto; width: 100%; max-width: 690px; }
}
.hero-char { display: inline-block; font-size: clamp(2rem, 6vw, 4rem); font-weight: 900; font-family: var(--f-display); line-height: 1.35; opacity: 0; animation: charIn 0.5s ease forwards; color: #101010; }
.hero-char.plus { font-size: clamp(2.5rem, 7vw, 4.5rem); font-family: 'SF Mono', 'JetBrains Mono', 'Menlo', monospace; }
@keyframes charIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.hero-sub { font-size: 16px; color: #5E5E5E; line-height: 1.7; max-width: 480px; margin: 24px 0 48px; opacity: 0; animation: fadeIn 0.6s ease 0.8s forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@media (min-width: 640px) { .hero-sub { font-size: 18px; } }
.hero-btns { display: flex; align-items: center; gap: 12px; opacity: 0; animation: fadeIn 0.6s ease 1s forwards; }
.hero-left .hero-btns { justify-content: flex-start; }
.hero-btn-fill { display: flex; align-items: center; gap: 8px; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; color: #fff; background: #3678E3; text-decoration: none; box-shadow: 0 4px 20px rgba(54,120,227,0.45); transition: background 0.2s; }
.hero-btn-fill:hover { background: rgba(54,120,227,0.9); }
.hero-btn-ghost { display: flex; align-items: center; gap: 8px; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 500; color: #5E5E5E; border: 1px solid rgba(0,0,0,0.12); text-decoration: none; transition: background 0.2s; }
.hero-btn-ghost:hover { background: rgba(0,0,0,0.04); }
/* ===== Hero preview ===== */
.hero-preview { max-width: 690px; margin: 0; }
.dot-red { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green { background: #28c840; }
.hero-stack { position: relative; padding-top: 62.5%; }
.hero-stack-card {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease, z-index 0.7s;
  background: #fff;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08);
  display: flex; flex-direction: column;
}
.hero-window-bar { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #f5f5f7; border-bottom: 1px solid rgba(0,0,0,0.06); flex-shrink: 0; }
.hero-window-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.hero-stack-card img { flex: 1; width: 100%; object-fit: contain; background: #fafafa; }
/* Position 0 = front */
.hero-stack-pos0 { z-index: 3; opacity: 1; transform: rotate(0deg) translateX(0); }
/* Position 1 = middle */
.hero-stack-pos1 { z-index: 2; opacity: 0.7; transform: rotate(1.5deg) translateX(8px); }
/* Position 2 = back */
.hero-stack-pos2 { z-index: 1; opacity: 0.55; transform: rotate(-3deg) translateX(-12px); }
.hero-stack:hover .hero-stack-pos1 { transform: rotate(3deg) translateX(20px) !important; }
.hero-stack:hover .hero-stack-pos2 { transform: rotate(-5deg) translateX(-28px) !important; }
.hero-stack-card img {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.hero-preview-placeholder {
  width: 100%; height: 100%;
  border: 2px dashed rgba(0,0,0,0.08);
  background: rgba(0,0,0,0.02);
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-preview-hint { font-size: 14px; color: rgba(0,0,0,0.2); }
.hero-fade { position: absolute; bottom: 0; left: 0; right: 0; height: 80px; background: linear-gradient(to bottom, transparent, rgba(22,45,94,0.3)); pointer-events: none; }
/* ===== Trust Bar ===== */
.trust { padding: 48px 0; background: #fff; border-bottom: 1px solid rgba(0,0,0,0.04); }
.trust-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
@media (min-width: 768px) { .trust-row { grid-template-columns: repeat(4, 1fr); } }
.trust-item { text-align: center; }
.trust-num { font-size: 2rem; font-weight: 900; color: #101010; font-family: var(--f-display); line-height: 1; }
@media (min-width: 640px) { .trust-num { font-size: 2.5rem; } }
.trust-unit { font-size: 1rem; font-weight: 500; color: #3678E3; margin-left: 2px; }
.trust-label { font-size: 16px; color: #5E5E5E; margin-top: 4px; }

/* ===== Positioning ===== */
.pos { padding: 80px 0; background: #fafafa; }
@media (min-width: 640px) { .pos { padding: 112px 0; } }
.pos-head { text-align: center; margin-bottom: 36px; }
.pos-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 768px) { .pos-grid { grid-template-columns: repeat(3, 1fr); } }
.pos-card { position: relative; border-radius: 14px; overflow: hidden; min-height: 240px; transition: all 0.3s; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.pos-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(54,120,227,0.12); }
.pos-card-bg { position: absolute; inset: 0; background-size: cover; background-position: center; transition: transform 0.4s; }
.pos-card:hover .pos-card-bg { transform: scale(1.05); }
.pos-card-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.25) 100%); z-index: 1; }
.pos-card-content { position: relative; z-index: 2; display: flex; flex-direction: column; justify-content: flex-start; height: 100%; padding: 32px; }
.pos-card-top { margin-bottom: 16px; }
.pos-card-tag { display: inline-block; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.85); letter-spacing: 0.06em; background: rgba(54,120,227,0.4); padding: 4px 10px; border-radius: 4px; margin-bottom: 12px; font-family: var(--f-display); }
.pos-card-title { font-size: 20px; font-weight: 700; color: #fff; margin: 0; font-family: var(--f-display); }
.pos-card-body { font-size: 16px; color: rgba(255,255,255,0.8); line-height: 1.65; margin: auto 0 0; min-height: 80px; }

/* ===== Scenarios ===== */
.scenarios-sec { padding: 80px 0; background: linear-gradient(180deg, #eef3ff 0%, #e8effc 50%, #f4f7ff 100%); }
@media (min-width: 640px) { .scenarios-sec { padding: 112px 0; } }
.sc-dots { display: flex; justify-content: center; gap: 10px; margin-top: 24px; }
.sc-dot-btn { width: 8px; height: 8px; border-radius: 50%; border: none; background: #d0d8e8; cursor: pointer; padding: 0; transition: all 0.3s; }
.sc-dot-btn.active { width: 24px; border-radius: 4px; background: #3678E3; }
.sc-stage { overflow: hidden; border-radius: 16px; }
.sc-track { display: flex; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.sc-panel { flex-shrink: 0; width: 100%; display: grid; grid-template-columns: 1fr; gap: 32px; padding: 32px; box-sizing: border-box; border-radius: 16px; background: rgba(255,255,255,0.55); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 8px 32px rgba(54,120,227,0.08), inset 0 1px 0 rgba(255,255,255,0.6); cursor: pointer; transition: all 0.35s; }
.sc-panel:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(54,120,227,0.15); }
@media (min-width: 1024px) { .sc-panel { grid-template-columns: 1fr; gap: 32px; padding: 40px; min-height: auto; } }
.sc-title { font-size: 22px; font-weight: 700; font-family: var(--f-display); color: #101010; margin: 0 0 4px; }
@media (min-width: 640px) { .sc-title { font-size: 26px; } }
.sc-aud { font-size: 16px; color: #3678E3; font-weight: 500; margin: 0; }
.sc-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.sc-summary { font-size: 16px; color: rgba(16,16,16,0.65); line-height: 1.65; margin: 0 0 20px; }
.sc-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.sc-tag { font-size: 11px; font-weight: 500; padding: 4px 12px; border-radius: 9999px; background: rgba(54,120,227,0.06); color: #3678E3; border: 1px solid rgba(54,120,227,0.15); }
.sc-cta { display: inline-flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 8px; border: 1px solid rgba(54,120,227,0.25); background: transparent; color: #3678E3; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.sc-cta:hover { background: #3678E3; color: #fff; border-color: #3678E3; }
.sc-points { list-style: none; padding: 0; margin: 0; }
.sc-points li { display: flex; gap: 12px; font-size: 16px; color: rgba(16,16,16,0.75); line-height: 1.65; margin-bottom: 12px; }
.sc-dot { width: 6px; height: 6px; border-radius: 50%; background: #3678E3; flex-shrink: 0; margin-top: 7px; }
.sc-panel-right { width: 100%; aspect-ratio: 1.47; }
.sc-image { width: 100%; height: 100%; object-fit: contain; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }

/* ===== AI ===== */
.ai { padding: 80px 0; background: #fafafa; }
@media (min-width: 640px) { .ai { padding: 112px 0; } }
.ai-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 48px; }
@media (min-width: 640px) { .ai-grid { grid-template-columns: repeat(2, 1fr); } }
.ai-card { position: relative; background: #fff; border: 1px solid rgba(54,120,227,0.1); border-radius: 12px; padding: 28px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.04); transition: all 0.25s ease; }
.ai-num { position: absolute; top: 16px; right: 20px; font-size: 48px; font-weight: 900; color: rgba(54,120,227,0.1); font-family: var(--f-display); line-height: 1; pointer-events: none; user-select: none; transition: color 0.35s; }
.ai-line { width: 24px; height: 2px; background: #3678E3; margin-bottom: 16px; transition: width 0.35s, background 0.35s; }
.ai-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(54,120,227,0.12); border-color: rgba(54,120,227,0.25); }
.ai-card:hover .ai-num { color: rgba(54,120,227,0.18); }
.ai-card:hover .ai-line { width: 48px; background: rgba(54,120,227,0.5); }
.ai-title { font-size: 16px; font-weight: 700; color: #101010; margin: 0 0 12px; font-family: var(--f-display); }
.ai-body { font-size: 16px; color: #5E5E5E; line-height: 1.8; margin: 0; }

/* ===== Case Studies ===== */
.cases { padding: 80px 0; background: #fff; }
@media (min-width: 640px) { .cases { padding: 112px 0; } }
.cases-tabs { display: flex; justify-content: center; gap: 8px; margin-top: 32px; }
.cases-tab { font-size: 16px; font-weight: 500; color: #5E5E5E; padding: 8px 24px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); background: #fff; cursor: pointer; transition: all 0.2s; }
.cases-tab.active { background: #3678E3; color: #fff; border-color: #3678E3; }
.cases-tab:hover:not(.active) { border-color: rgba(54,120,227,0.3); color: #3678E3; }
.cases-stage { overflow: hidden; border-radius: 16px; margin: 24px -20px 0; padding: 0 20px; }
.cases-track { display: flex; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.case-slant { position: relative; flex: 0 0 calc(33.333% - 11px); margin-right: 16px; transform: skewX(-6deg); background-size: cover; background-position: center; border-radius: 16px; overflow: hidden; min-height: 320px; transition: transform 0.3s; cursor: pointer; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
.case-slant:hover { transform: skewX(-6deg) scale(1.02); z-index: 4; box-shadow: 0 12px 40px rgba(0,0,0,0.2); }
.case-slant-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 100%); z-index: 1; }
.case-slant-content { position: relative; z-index: 2; padding: 36px 40px; display: flex; flex-direction: column; justify-content: flex-start; height: 100%; transform: skewX(6deg); }
.case-slant-tag { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.8); background: rgba(54,120,227,0.4); padding: 4px 12px; border-radius: 4px; align-self: flex-start; margin-bottom: 12px; font-family: var(--f-display); flex-shrink: 0; }
.case-slant-title { font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 8px; font-family: var(--f-display); flex-shrink: 0; min-height: 28px; }
.case-slant-desc { font-size: 16px; color: rgba(255,255,255,0.8); line-height: 1.6; margin: 0 0 14px; flex: 1; overflow: hidden; }
.case-slant-nums { display: flex; gap: 6px; flex-wrap: nowrap; margin-top: auto; flex-shrink: 0; }
.case-slant-nums span { font-size: 13px; color: #93c5fd; background: rgba(54,120,227,0.2); padding: 3px 10px; border-radius: 6px; white-space: nowrap; }
@media (max-width: 640px) {
  .case-slant { transform: none; min-height: 180px; }
  .case-slant-1, .case-slant-2 { margin-left: 0; }
  .case-slant-content { transform: none; padding: 24px; }
}

/* ===== Footer ===== */
.ft { background: linear-gradient(180deg, #eef3ff 0%, #f4f7ff 100%); border-top: 1px solid rgba(54,120,227,0.1); }
.ft-cta { text-align: center; padding: 64px 20px; border-bottom: 1px solid rgba(54,120,227,0.08); }
@media (min-width: 640px) { .ft-cta { padding: 80px 20px; } }
.ft-cta-label { font-size: 16px; color: #3678E3; letter-spacing: 0.1em; text-transform: uppercase; font-family: var(--f-display); margin: 0 0 20px; }
.ft-cta-title { font-size: 24px; font-weight: 700; color: #101010; margin: 0 0 16px; font-family: var(--f-display); }
@media (min-width: 640px) { .ft-cta-title { font-size: 30px; } }
.ft-cta-sub { font-size: 16px; color: #5E5E5E; max-width: 448px; margin: 0 auto 32px; }
.ft-cta-btns { display: flex; flex-direction: column; align-items: center; gap: 12px; }
@media (min-width: 640px) { .ft-cta-btns { flex-direction: row; justify-content: center; } }
.ft-links-wrap { max-width: 1200px; margin: 0 auto; padding: 48px 20px; }
@media (min-width: 640px) { .ft-links-wrap { padding: 48px 32px; } }
.ft-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; padding-bottom: 40px; border-bottom: 1px solid rgba(54,120,227,0.08); }
@media (min-width: 640px) { .ft-links { grid-template-columns: repeat(4, 1fr); } }
@media (min-width: 768px) { .ft-links { grid-template-columns: 2fr 1fr 1fr 1fr 1fr; } }
.ft-brand-icon { width: 24px; height: 24px; border-radius: 6px; background: #3678E3; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
.ft-brand-name { font-size: 16px; font-weight: 700; color: #101010; font-family: var(--f-display); }
.ft-brand-desc { font-size: 16px; color: #5E5E5E; line-height: 1.65; margin: 12px 0 16px; }
.ft-contact { display: flex; flex-direction: column; gap: 6px; font-size: 16px; color: #5E5E5E; }
.ft-contact span { display: flex; align-items: center; gap: 6px; }
.ft-col h4 { font-size: 16px; font-weight: 600; color: #3678E3; margin: 0 0 12px; font-family: var(--f-display); }
.ft-col a { display: block; font-size: 16px; color: #5E5E5E; text-decoration: none; padding: 4px 0; transition: color 0.2s; }
.ft-col a:hover { color: #3678E3; }
.ft-bottom { display: flex; flex-direction: column; align-items: center; gap: 12px; padding-top: 32px; font-size: 16px; color: rgba(16,16,16,0.5); }
@media (min-width: 640px) { .ft-bottom { flex-direction: row; justify-content: space-between; } }
.footer-icp { font-family: var(--f-display); color: rgba(16,16,16,0.5); text-decoration: none; cursor: pointer; transition: color 0.2s; }
.footer-icp:hover { color: #3678E3; }

/* ===== Mobile tip modal ===== */
.mobile-tip-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; padding: 20px; }
.mobile-tip-card { background: #fff; border-radius: 16px; padding: 40px 32px; text-align: center; max-width: 320px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.mobile-tip-icon { font-size: 48px; margin-bottom: 16px; }
.mobile-tip-title { font-size: 18px; font-weight: 700; color: #101010; margin: 0 0 8px; }
.mobile-tip-sub { font-size: 14px; color: #5E5E5E; margin: 0 0 24px; line-height: 1.6; }
.mobile-tip-btn { width: 100%; padding: 12px 24px; border-radius: 8px; border: none; font-size: 15px; font-weight: 600; background: #3678E3; color: #fff; cursor: pointer; transition: background 0.2s; }
.mobile-tip-btn:hover { background: rgba(54,120,227,0.9); }
</style>
