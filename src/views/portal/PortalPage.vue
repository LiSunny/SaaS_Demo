<template>
  <div class="portal" style="font-family: 'Noto Sans SC', 'Outfit', -apple-system, sans-serif; overflow-x: hidden;">
    <!-- ===== Nav ===== -->
    <nav class="nav" :class="{ scrolled }">
      <div class="nav-inner">
        <a href="#" class="nav-brand">
          <img class="nav-logo" src="/favicon.svg" alt="logo" width="28" height="28" />
          <span class="nav-name" :class="{ scrolled }">公共安全管理平台</span>
        </a>
        <div class="nav-links">
          <a v-for="l in navLinks" :key="l" :href="`#${l}`" class="nav-link" :class="{ scrolled }">{{ l }}</a>
          <a href="https://www.yuque.com/meiyouhoutaideyaoguai/nuwueb?# 《人工智能+公共安全管理平台》" target="_blank" rel="noopener" class="nav-link nav-link-manual" :class="{ scrolled }">使用手册</a>
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
          <h2 class="sec-title">安全管控生态体系</h2>
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
                  <div class="sc-header-left">
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
          <h2 class="sec-title">AI 如何提升安全管理效率</h2>
        </div>

        <!-- 顶部：能力导航 Tab -->
        <div class="ai-nav">
          <button
            v-for="(a, i) in AI_LIST" :key="i"
            class="ai-nav-btn"
            :class="{ active: activeAIPage === i }"
            @click="activeAIPage = i"
          >
            <span class="ai-nav-num">{{ a.num }}</span>
            <span class="ai-nav-label">{{ a.title }}</span>
          </button>
        </div>

        <!-- 内容区：左播放窗口 + 右文本 -->
        <div class="ai-demo">
          <!-- 左侧：GIF 播放窗口 -->
          <div class="ai-demo-player">
            <div class="ai-player-frame">
              <div class="ai-player-chrome">
                <span class="ai-player-dot dot-red"></span>
                <span class="ai-player-dot dot-yellow"></span>
                <span class="ai-player-dot dot-green"></span>
                <div class="ai-player-url">“人工智能+公共安全”管理平台</div>
              </div>
              <div class="ai-player-viewport">
                <div class="ai-player-track" :style="{ transform: `translateX(-${activeAIPage * 100}%)` }">
                  <div v-for="(page, i) in AI_PAGES" :key="i" class="ai-player-page">
                    <!-- 加载动画 -->
                    <div v-if="page.gifLoading && !page.gifError" class="ai-player-loading">
                      <div class="ai-loading-ring">
                        <span class="ai-loading-dot"></span>
                      </div>
                      <p>加载中…</p>
                    </div>
                    <img
                      :src="`${page.gif}?v=${gifTimestamps[i]}`"
                      :alt="page.title"
                      class="ai-player-gif"
                      :class="{ loaded: !page.gifLoading }"
                      @load="onPageGifLoad(i)"
                      @error="onPageGifError(i)"
                    />
                    <div v-if="page.gifError" class="ai-player-placeholder">
                      <span class="ai-player-ph-icon">🎬</span>
                      <p>{{ page.title }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：当前能力文本介绍 -->
          <div class="ai-demo-text">
            <div class="ai-demo-num-big">{{ AI_LIST[activeAIPage].num }}</div>
            <h3 class="ai-demo-title-big">{{ AI_LIST[activeAIPage].title }}</h3>
            <p class="ai-demo-body-big">{{ AI_LIST[activeAIPage].body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Case Studies ===== -->
    <section id="案例展示" class="cases">
      <div class="sec-wrap">
        <div ref="featHead" class="reveal" :class="{ visible: featHeadV }">
          <div class="sec-label"><span class="sec-label-line"></span>案例展示<span class="sec-label-line"></span></div>
          <h2 class="sec-title">场景实践，持续生长</h2>
          <p class="sec-desc">覆盖校园安全、工贸企业等多领域</p>
        </div>
        <div class="cases-tabs">
          <button v-for="tab in caseTabs" :key="tab.key"
            class="cases-tab"
            :class="{ active: activeCaseTab === tab.key }"
            @click="activeCaseTab = tab.key"
          >{{ tab.label }}</button>
        </div>
        <div class="cases-stage">
          <div class="cases-track" :style="{ transform: `translateX(-${caseScroll * caseStep}%)` }"
            @mouseenter="casePaused = true" @mouseleave="casePaused = false">
            <div v-for="(c, i) in filteredCases" :key="i"
              class="case-slant"
              :style="{ backgroundImage: `url(${c.image})` }"
              @click="goCase(c.slug)"
            >
              <div class="case-slant-overlay"></div>
              <span v-if="c.coming" class="case-slant-coming">即将上线</span>
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
            <div class="ft-brand-icon"><img src="/favicon.svg" alt="logo" width="24" height="24" /></div>
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
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Zap, FileText, Phone, Mail, Store } from 'lucide-vue-next'
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

const HERO_IMAGES = [
  { src: heroCampusImg, alt: '校园安全管理大屏' },
  { src: heroIndustryImg, alt: '工贸企业安全管理大屏' },
  { src: '/screenshots/fgfc_cz.png', alt: '复工复产管理大屏' },
  { src: '/screenshots/quanzhou-cockpit.png', alt: '泉州应消联勤监管大屏' },
  { src: '/screenshots/ebike-safety.png', alt: '电动自行车安防监管大屏' },
]
const heroCards = ref(HERO_IMAGES.map((img, i) => ({ ...img, pos: i })))
const STACK_SIZE = HERO_IMAGES.length
let stackTimer: ReturnType<typeof setInterval>
onMounted(() => {
  stackTimer = setInterval(() => {
    heroCards.value = heroCards.value.map(c => ({
      ...c,
      pos: (c.pos + 1) % STACK_SIZE,
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
  { tag: '单点管控', title: '企业自主管理', body: '面向单个项目或企业的"大安全自主管理"。通过构建智能化的安全管理平台，实现对消防设施、应急预案、风险隐患等要素的实时监测与动态管理，提升单位自身的安全防控能力和应急响应效率。', image: '/images/unsplash/photo-1581092160607-ee22621dd758.jpg' },
  { tag: '全域协同', title: '区域联勤联动', body: '围绕监管部门为核心的"区域联勤联动"机制。打通区域内多个单位、部门之间的信息壁垒，建立统一指挥、快速响应、多方协同的应急联动体系，提升对突发事件的综合处置能力。', image: '/images/unsplash/photo-1434626881859-194d67b2b86f.jpg' },
  { tag: '集团统管', title: '垂直穿透管控', body: '针对大型集团公司的"垂直穿透管控"模式。通过搭建集团级安全管理中枢平台，实现对下属各级子公司、项目单位的安全状况进行统一监管与调度，强化集团对全链条安全风险的掌控能力。', image: '/images/unsplash/photo-1497366216548-37526070297c.jpg' },
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
const carouselPaused = ref(false)
const pauseCarousel = () => { carouselPaused.value = true }
const goIndustry = (slug: string) => {
  pauseCarousel()
  router.push(`/portal/${slug}`)
}
onMounted(() => {
  startCaseScroll()
  carouselTimer = setInterval(() => {
    if (!carouselPaused.value) activeScenario.value = (activeScenario.value + 1) % SCENARIOS.length
  }, 8000)
})
onUnmounted(() => { clearInterval(carouselTimer); clearInterval(caseTimer) })

// ===== AI =====
const activeAIPage = ref(0)
const gifTimestamps = reactive([Date.now(), Date.now(), Date.now()])

// 切换标签时刷新对应页的 GIF 时间戳，触发重新加载
watch(activeAIPage, (newIdx) => {
  gifTimestamps[newIdx] = Date.now()
  AI_PAGES[newIdx].gifLoading = true
  AI_PAGES[newIdx].gifError = false
})

// Each page = a GIF demo corresponding to an AI_LIST item
const AI_PAGES = reactive([
  { num: '01', title: 'AI 智能告警接报', gif: '/images/ai-demo-01.gif', gifError: false, gifLoading: true },
  { num: '02', title: 'AI 替代"人看"',   gif: '/images/ai-demo-02.gif', gifError: false, gifLoading: true },
  { num: '03', title: 'AI 替代"人写"',   gif: '/images/ai-demo-03.gif', gifError: false, gifLoading: true },
])
const onPageGifError = (i: number) => { AI_PAGES[i].gifError = true; AI_PAGES[i].gifLoading = false }
const onPageGifLoad  = (i: number) => { AI_PAGES[i].gifLoading = false }

const AI_LIST = [
  { title: 'AI 智能告警接报', body: '语音、烟感、电气等多源告警统一接入平台，AI 自动去重分级，精准弹窗推送至值班大屏。值班员一键确认即可指派保安到场——从告警触发到人到现场，全程自动记录时间戳。', num: '01' },
  { title: 'AI 替代"人看"', body: '一线人员拍照上传消防设施，AI 自动识别设备主体、匹配对应国标规范、逐项生成检查结论并判定隐患。从"凭经验看一圈"变成"拍照即判定"——不同检查员同一标准，结果可追溯。', num: '02' },
  { title: 'AI 替代"人写"', body: '每天全量告警自动汇聚，AI 聚类识别风险事件簇、诊断根因，区分安保/工程分别输出行动建议，生成结构化日报并归档——安全员不再花数小时翻日志、归类、写报告。', num: '03' },
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
  { slug: 'campus-safety', name: '平安校园', tag: '教育', desc: '覆盖食品安全、防欺凌预警、宿舍安全与应急联动、隐患闭环、安全履职五大核心能力，从"人管人"走向"数据管安全"。', nums: ['5 项能力', '3 项 AI', '全链闭环'], image: '/images/unsplash/photo-1541339907198-e08756dedf3f.jpg' },
  { slug: 'industrial-park', name: '工贸企业安全管理', tag: '工业', desc: '覆盖设备台账、巡查检查、隐患闭环、危险作业管控、告警值守五大场景，构建从设备上线到应急响应的全链路安全管理体系。', nums: ['5 个场景', '18 业务域', '全链闭环'], image: '/images/unsplash/photo-1581092160607-ee22621dd758.jpg' },
  { slug: 'work-resumption', name: '复工复产管理', tag: '垂直业务', desc: '面向工贸企业复工全流程数字化管理，覆盖准备、审核、试产到正式复产四阶段，六步标准化流程确保安全合规，实现企业安全返岗。', nums: ['4 阶段', '6 步流程', '全链追踪'], image: '/images/unsplash/photo-1504917595217-d4dc5ebe6122.jpg' },
  { slug: 'quanzhou-cockpit', name: '泉州应消联勤监管平台', tag: '城市治理', desc: '依托AI大模型与物联网技术，构建全市首个"人工智能+应消联勤"一体化管控平台，覆盖工贸企业自律、消防控制室值守、风险源作业审批等14个核心模块，实现一屏观全域、一网管消防。', nums: ['14 模块', 'AI 研判', '多端协同'], image: '/images/unsplash/photo-1497366216548-37526070297c.jpg' },
  { slug: 'ebike-safety', name: '电动自行车安防监管', tag: '城市治理', desc: '面向居民小区与企事业单位的电动自行车充电安全监管，覆盖充电桩消安台账、火灾预警联动、消控室离岗监控与共享单车投放监管，构建从充电设施到应急响应的全链路安防体系。', nums: ['4 大模块', '3 级联动', '全域覆盖'], image: '/images/unsplash/photo-1441986300917-64674bd600d8.jpg' },
  { slug: 'fire-maintenance', name: '消防维保管理', tag: '垂直业务', desc: '搭建消防设施监测与维保管理平台，实现设备实时感知、全生命周期管理，降低人工巡检成本 60%。', nums: ['500+ 传感器', '30+ 点位', '60% 增效'], image: '/images/unsplash/photo-1581092160607-ee22621dd758.jpg', coming: true },
  { slug: 'hot-work', name: '动火作业管理', tag: '垂直业务', desc: '面向施工现场的动火作业全流程管控，从申请审批、现场监护到完工验收，确保高风险作业合规可控。', nums: ['4 阶段', '15 步流程', '三级审批'], image: '/images/unsplash/photo-1534528741775-53994a69daeb.jpg', coming: true },
  { slug: 'commercial-street', name: '商业街安全管理', tag: '城市治理', desc: '建设商铺消防联控与应急联动平台，打通商户、物业、监管部门三级协同，提升街区整体安全治理水平。', nums: ['100+ 商铺', '3 级联动', '7×24 值守'], image: '/images/unsplash/photo-1517457373958-b7bdd4587205.jpg', coming: true },
]

const filteredCases = computed(() =>
  activeCaseTab.value === 'all' ? CASES : CASES.filter(c => c.tag === activeCaseTab.value)
)

function goCase(slug: string) {
  router.push(`/portal/case/${slug}`)
}

// Cases auto scroll
const caseScroll = ref(0)
const casePaused = ref(false)

const caseStep = computed(() => window.innerWidth < 640 ? 100 : (100 / 3))
let caseTimer: ReturnType<typeof setInterval>
const startCaseScroll = () => {
  const total = filteredCases.value.length
  caseTimer = setInterval(() => {
    if (!casePaused.value && total > 3) {
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
.nav-link { font-size: 15px; font-weight: 600; color: #101010; text-decoration: none; cursor: pointer; transition: color 0.2s; }
.nav-link:hover { color: #3678E3; }
.nav-actions { display: flex; align-items: center; gap: 8px; }
@media (min-width: 640px) { .nav-actions { gap: 12px; } }
.nav-btn { font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 6px; border: none; background: #3678E3; color: #fff; cursor: pointer; box-shadow: 0 2px 8px rgba(54,120,227,0.3); transition: background 0.2s; }
@media (min-width: 640px) { .nav-btn { font-size: 14px; padding: 8px 20px; } }
.nav-btn:hover { background: rgba(54,120,227,0.9); }

.hero-inner { position: relative; z-index: 10; max-width: 1200px; width: 100%; margin: 0 auto; padding: 80px 0; display: flex; align-items: center; gap: 32px; }
.hero { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; overflow: visible; background: linear-gradient(180deg, #f8faff 0%, #eef3ff 50%, #f4f7ff 100%); padding: 40px 0 80px; }
.hero::after { content: ''; position: absolute; inset: 0; z-index: 0; background: url('@/assets/portal/hero-bg.png') center/cover no-repeat; opacity: 0.3; pointer-events: none; }
.hero-left { flex: 1; min-width: 0; text-align: left; margin-left: -40px; }
.hero-right { flex: 0 0 690px; max-width: 100%; margin-right: -100px; }
@media (max-width: 900px) {
  .hero-inner { flex-direction: column; padding: 80px 20px 48px; gap: 32px; }
  .hero-left { text-align: center; margin-left: 0; }
  .hero-right { flex: 0 0 auto; width: 100%; max-width: 100%; margin-right: 0; }
  .hero-btns { justify-content: center; flex-wrap: wrap; }
  .hero-sub { margin: 24px auto 48px; }
}
@media (max-width: 480px) {
  .hero-btns { flex-direction: column; width: 100%; }
  .hero-btn-fill, .hero-btn-ghost { width: 100%; justify-content: center; padding: 14px 20px; }
}
.hero-char { display: inline-block; font-size: clamp(1.5rem, 5vw, 4rem); font-weight: 900; font-family: var(--f-display); line-height: 1.35; opacity: 0; animation: charIn 0.5s ease forwards; color: #101010; }
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
.hero-preview { max-width: 100%; margin: 0 auto; }
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
/* Position 3-4 = hidden behind */
.hero-stack-pos3, .hero-stack-pos4 { z-index: 0; opacity: 0; transform: rotate(0deg) translateX(0); pointer-events: none; }
.hero-stack:hover .hero-stack-pos1 { transform: rotate(3deg) translateX(20px) !important; }
.hero-stack:hover .hero-stack-pos2 { transform: rotate(-5deg) translateX(-28px) !important; }
.hero-stack:hover .hero-stack-pos3 { transform: rotate(-2deg) translateX(-8px) !important; opacity: 0.3; }
.hero-stack:hover .hero-stack-pos4 { transform: rotate(1deg) translateX(4px) !important; opacity: 0.15; }
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
.sc-tag { font-size: 11px; font-weight: 500; padding: 4px 12px; border-radius: 9999px; background: rgba(54,120,227,0.06); color: #3678E3; border: 1px solid rgba(54,120,227,0.15); }
.sc-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.sc-header-left { min-width: 0; flex: 1; }
.sc-summary { font-size: 16px; color: rgba(16,16,16,0.65); line-height: 1.65; margin: 0 0 20px; }
.sc-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.sc-tag { font-size: 11px; font-weight: 500; padding: 4px 12px; border-radius: 9999px; background: rgba(54,120,227,0.06); color: #3678E3; border: 1px solid rgba(54,120,227,0.15); }
.sc-cta { display: inline-flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 8px; border: 1px solid rgba(54,120,227,0.25); background: transparent; color: #3678E3; font-size: 16px; font-weight: 600; white-space: nowrap; flex-shrink: 0; cursor: pointer; transition: all 0.2s; }
.sc-cta:hover { background: #3678E3; color: #fff; border-color: #3678E3; }
.sc-points { list-style: none; padding: 0; margin: 0; }
.sc-points li { display: flex; gap: 12px; font-size: 16px; color: rgba(16,16,16,0.75); line-height: 1.65; margin-bottom: 12px; }
.sc-dot { width: 6px; height: 6px; border-radius: 50%; background: #3678E3; flex-shrink: 0; margin-top: 7px; }
.sc-panel-right { width: 100%; aspect-ratio: 1.47; }
.sc-image { width: 100%; height: 100%; object-fit: contain; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }

/* ===== AI ===== */
.ai { padding: 80px 0; background: #fafafa; }
@media (min-width: 640px) { .ai { padding: 112px 0; } }

/* 顶部：能力导航 Tab */
.ai-nav {
  display: flex; justify-content: center; gap: 12px;
  margin-top: 40px;
  flex-wrap: wrap;
}
.ai-nav-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 22px;
  border: 1px solid rgba(54,120,227,0.15);
  border-radius: 999px;
  background: #fff;
  color: #5E5E5E;
  font-size: 15px; font-weight: 500;
  cursor: pointer;
  transition: all 0.25s;
}
.ai-nav-btn:hover {
  border-color: rgba(54,120,227,0.35);
  color: #3678E3;
}
.ai-nav-btn.active {
  background: #3678E3;
  color: #fff;
  border-color: #3678E3;
}
.ai-nav-num {
  font-size: 12px; font-weight: 700;
  opacity: 0.5;
}
.ai-nav-btn.active .ai-nav-num { opacity: 1; }
.ai-nav-label { line-height: 1; }

/* 内容区：左播放窗口 + 右文本 */
.ai-demo { display: flex; flex-direction: column; gap: 32px; margin-top: 36px; align-items: flex-start; }
@media (min-width: 768px) { .ai-demo { flex-direction: row; gap: 48px; } }

/* 左侧：GIF 播放窗口（宽） */
.ai-demo-player { flex: 1; min-width: 0; width: 100%; }
@media (min-width: 768px) { .ai-demo-player { flex: 1; position: sticky; top: 100px; } }

/* 黑色浏览器容器 */
.ai-player-frame {
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 20px 60px rgba(0,0,0,0.2);
  border-left: 10px solid #2C2C2C;
  border-right: 10px solid #2C2C2C;
  border-bottom: 10px solid #2C2C2C;
}
.ai-player-chrome {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  background: #2C2C2C;
  position: relative;
}
.ai-player-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-red    { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green  { background: #28c840; }
.ai-player-url {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  background: #3f3f3f;
  border-radius: 999px;
  padding: 2px 14px;
  font-size: 10px;
  color: rgba(255,255,255,0.45);
  font-family: 'Noto Sans SC', 'Outfit', sans-serif;
  white-space: nowrap;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 横向分页视口 */
.ai-player-viewport { overflow: hidden; }
.ai-player-track {
  display: flex;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.ai-player-page {
  flex: 0 0 100%;
  min-width: 0;
  position: relative;
  display: flex; align-items: center; justify-content: center;
}
.ai-player-gif {
  width: 100%;
  height: auto;
  display: block;
  opacity: 0;
  transition: opacity 0.3s;
}
.ai-player-gif.loaded { opacity: 1; }

/* 加载动画 */
.ai-player-loading {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 20px;
  background: #1a1a1a;
  z-index: 1;
}
.ai-loading-ring {
  position: relative;
  width: 48px; height: 48px;
}
.ai-loading-ring::before,
.ai-loading-ring::after {
  content: '';
  position: absolute; inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.2);
}
.ai-loading-ring::before {
  animation: ai-ripple 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
.ai-loading-ring::after {
  animation: ai-ripple 2s cubic-bezier(0.4, 0, 0.2, 1) 1s infinite;
}
@keyframes ai-ripple {
  0%   { transform: scale(0.4); opacity: 1; border-color: rgba(255,255,255,0.35); }
  100% { transform: scale(1.6); opacity: 0; border-color: rgba(255,255,255,0.05); }
}
.ai-loading-dot {
  width: 8px; height: 8px;
  background: rgba(255,255,255,0.5);
  border-radius: 50%;
  position: absolute;
  top: 50%; left: 50%;
  margin: -4px 0 0 -4px;
  animation: ai-pulse 2s ease-in-out infinite;
}
@keyframes ai-pulse {
  0%, 100% { transform: scale(0.8); opacity: 0.4; }
  50%      { transform: scale(1.4); opacity: 1; }
}
.ai-player-loading p {
  font-size: 13px; color: rgba(255,255,255,0.3);
  margin: 0;
  animation: ai-fade-text 2s ease-in-out infinite;
  letter-spacing: 0.5px;
}
@keyframes ai-fade-text {
  0%, 100% { opacity: 0.35; }
  50%      { opacity: 0.65; }
}
.ai-player-placeholder {
  position: absolute; inset: 0;
  min-height: 200px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px;
  color: rgba(255,255,255,0.35);
  background: #1a1a1a;
}
.ai-player-ph-icon { font-size: 48px; }
.ai-player-placeholder p { font-size: 15px; margin: 0; }

/* 右侧：当前能力文本介绍（窄） */
.ai-demo-text {
  flex: 0 0 300px;
  width: 100%;
  padding: 24px 0 0;
}
@media (min-width: 768px) { .ai-demo-text { width: 300px; position: sticky; top: 100px; } }

.ai-demo-num-big {
  font-size: 56px; font-weight: 900;
  color: rgba(54,120,227,0.1);
  font-family: var(--f-display);
  line-height: 1;
  margin-bottom: 12px;
}
.ai-demo-title-big {
  font-size: 22px; font-weight: 700;
  color: #101010;
  margin: 0 0 16px;
  font-family: var(--f-display);
  line-height: 1.3;
}
.ai-demo-body-big {
  font-size: 18px; color: #5E5E5E;
  line-height: 1.85;
  margin: 0;
}

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
.case-slant-coming { position: absolute; top: 12px; right: 12px; z-index: 3; font-size: 13px; font-weight: 600; color: #fff; background: linear-gradient(135deg, rgba(234,88,12,0.85), rgba(220,38,38,0.75)); padding: 5px 14px; border-radius: 4px; transform: skewX(6deg); font-family: var(--f-display); letter-spacing: 1px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.case-slant-content { position: relative; z-index: 2; padding: 36px 40px; display: flex; flex-direction: column; justify-content: flex-start; height: 100%; transform: skewX(6deg); }
.case-slant-tag { font-size: 14px; font-weight: 600; color: #fff; background: rgba(54,120,227,0.65); padding: 4px 14px; border-radius: 4px; align-self: flex-start; margin-bottom: 12px; font-family: var(--f-display); flex-shrink: 0; letter-spacing: 0.5px; }
.case-slant-title { font-size: 20px; font-weight: 700; color: #fff; margin: 0 0 8px; font-family: var(--f-display); flex-shrink: 0; min-height: 28px; }
.case-slant-desc { font-size: 16px; color: rgba(255,255,255,0.8); line-height: 1.6; margin: 0 0 14px; flex: 1; overflow: hidden; }
.case-slant-nums { display: flex; gap: 6px; flex-wrap: nowrap; margin-top: auto; flex-shrink: 0; }
.case-slant-nums span { font-size: 11px; color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 4px; white-space: nowrap; }
@media (max-width: 640px) {
  .case-slant { flex: 0 0 calc(100% - 20px); transform: none; min-height: 280px; }
  .case-slant-content { transform: none; padding: 24px; }
  .cases-stage { margin: 24px 0 0; padding: 0; }
}

/* ===== Footer ===== */
.ft { background: linear-gradient(180deg, #eef3ff 0%, #f4f7ff 100%); border-top: 1px solid rgba(54,120,227,0.1); }
.ft-cta { text-align: center; padding: 64px 20px; border-bottom: 1px solid rgba(54,120,227,0.08); }
@media (min-width: 640px) { .ft-cta { padding: 80px 20px; } }
.ft-cta-label { font-size: 18px; color: #3678E3; letter-spacing: 0.1em; text-transform: uppercase; font-family: var(--f-display); font-weight: 800; margin: 0 0 20px; }
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
.mobile-tip-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.35); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.mobile-tip-card { background: #fff; border-radius: 16px; padding: 40px 32px; text-align: center; max-width: 320px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.mobile-tip-icon { font-size: 48px; margin-bottom: 16px; }
.mobile-tip-title { font-size: 18px; font-weight: 700; color: #101010; margin: 0 0 8px; }
.mobile-tip-sub { font-size: 14px; color: #5E5E5E; margin: 0 0 24px; line-height: 1.6; }
.mobile-tip-btn { width: 100%; padding: 12px 24px; border-radius: 8px; border: none; font-size: 15px; font-weight: 600; background: #3678E3; color: #fff; cursor: pointer; transition: background 0.2s; }
.mobile-tip-btn:hover { background: rgba(54,120,227,0.9); }
</style>
