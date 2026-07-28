<template>
  <div class="case-detail" style="font-family:'Noto Sans SC','Outfit',-apple-system,sans-serif;min-height:100vh;background:#fafafa;">
    <!-- ===== Nav ===== -->
    <nav class="nav" :class="{ scrolled }">
      <div class="nav-inner">
        <a href="/portal" class="nav-brand">
          <img class="nav-logo" src="/favicon.svg" alt="logo" width="28" height="28" />
          <span class="nav-name" :class="{ scrolled }">韧性云</span>
        </a>
        <div class="nav-links">
          <a href="/portal#平台定位" class="nav-link" :class="{ scrolled }">平台定位</a>
          <a href="/portal#应用场景" class="nav-link" :class="{ scrolled }">应用场景</a>
          <a href="/portal#案例展示" class="nav-link" :class="{ scrolled }">案例展示</a>
        </div>
        <div class="nav-actions">
          <a href="/login" class="nav-btn">去体验</a>
        </div>
      </div>
    </nav>

    <!-- ===== Hero ===== -->
    <section class="cd-hero" :style="{ backgroundImage: `url(${current.image})` }">
      <div class="cd-hero-overlay"></div>
      <div class="cd-hero-content">
        <span class="cd-hero-tag">{{ current.tag }}</span>
        <h1 class="cd-hero-title">{{ current.name }}</h1>
        <p class="cd-hero-desc">{{ current.desc }}</p>
        <div class="cd-hero-nums">
          <span v-for="n in current.nums" :key="n" class="cd-hero-num">{{ n }}</span>
        </div>
      </div>
    </section>

    <!-- ===== 案例介绍 ===== -->
    <section class="cd-section">
      <div class="sec-wrap">
        <h2 class="cd-sec-title">方案概述</h2>
        <div class="cd-body-card">
          <p class="cd-body-text">{{ current.overview }}</p>
        </div>
      </div>
    </section>

    <!-- ===== 核心功能 ===== -->
    <section class="cd-section cd-section-alt">
      <div class="sec-wrap">
        <h2 class="cd-sec-title">核心功能</h2>
        <div class="cd-features">
          <div v-for="(f, i) in current.features" :key="i" class="cd-feature-card">
            <div class="cd-feature-num">{{ String(i + 1).padStart(2, '0') }}</div>
            <h3 class="cd-feature-title">{{ f.title }}</h3>
            <p class="cd-feature-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 大屏预览截图 ===== -->
    <section v-if="current.previewType" class="cd-section">
      <div class="sec-wrap">
        <h2 class="cd-sec-title">可视化大屏预览</h2>
        <p class="cd-sec-sub">7×24 实时数据看板，多维度展示复工态势</p>
        <div class="cd-preview-mock">
          <div class="cd-preview-frame">
            <div class="cd-preview-bar">
              <span class="cd-preview-dot dot-red"></span>
              <span class="cd-preview-dot dot-yellow"></span>
              <span class="cd-preview-dot dot-green"></span>
            </div>
            <img
              class="cd-preview-img"
              :src="previewSrc"
              :alt="current.name + '可视化大屏'"
            />
          </div>
        </div>
        <div class="cd-cta-row">
          <a :href="`/portal/preview/${current.previewType}`" class="cd-cta-btn">查看全屏大屏</a>
          <a :href="current.expLink" class="cd-cta-ghost">立即体验完整功能 →</a>
        </div>
      </div>
    </section>

    <!-- ===== 价值总结 ===== -->
    <section class="cd-section cd-section-alt">
      <div class="sec-wrap">
        <h2 class="cd-sec-title">客户价值</h2>
        <div class="cd-value-grid">
          <div v-for="v in current.values" :key="v.role" class="cd-value-card">
            <div class="cd-value-role">{{ v.role }}</div>
            <p class="cd-value-desc">{{ v.desc }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

// ===== 案例数据 =====
interface CaseData {
  slug: string
  name: string
  tag: string
  desc: string
  nums: string[]
  image: string
  previewType: string | null
  expLink: string
  overview: string
  features: { title: string; desc: string }[]
  values: { role: string; desc: string }[]
}

const CASES: CaseData[] = [
  {
    slug: 'work-resumption',
    name: '复工复产管理',
    tag: '垂直业务',
    desc: '面向工贸企业复工全流程数字化管理，覆盖准备、审核、试产到正式复产四阶段，六步标准化流程确保安全合规。',
    nums: ['4 阶段', '11 步骤', '全链追踪'],
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200&q=80',
    previewType: 'resumption',
    expLink: '/login?redirect=/resumption-bigscreen',
    overview: '复工复产管理是面向工贸企业的安全管理核心模块，以"六个一"安全标准为指导，将复工流程拆解为4个阶段、11个标准化步骤。从组建复工团队、签订安全承诺书，到安全培训、技术交底、隐患排查、设备体检，再到整改闭环、联合验收、签发复工令，最终完成试产值班和归档组卷。全流程数字化留痕，确保每一步都有据可查，帮助企业在停产检修后安全、合规、高效地恢复生产。',
    features: [
      { title: '四阶段管理', desc: '复工准备 → 复工审核 → 试产观察 → 正式复产，每个阶段有明确的里程碑和责任人，进度实时可视。' },
      { title: '11 步标准化流程', desc: '严格遵循"六个一"安全标准，覆盖建组、签责、培训、交底、排查、体检、整改、验收、签发、值班、归档全链路。' },
      { title: '可视化大屏', desc: '实时展示各车间复工进度、异常设备和未闭环隐患，一张图掌握全厂复工态势。' },
      { title: '全链追踪留痕', desc: '每步操作带时间戳、执行人签名、照片附件，满足监管审计要求，自证安全尽责。' },
    ],
    values: [
      { role: '厂长/总经理', desc: '一张图掌握全厂复工进度，关键节点审批数字化，签发复工令有据可依，降低法律风险。' },
      { role: '车间主任/班组长', desc: '标准化步骤指引，手机端即可完成打卡、拍照、签字，告别纸质台账，效率提升 60%+。' },
      { role: '安全监管方', desc: '远程核查企业复工全流程记录，隐患整改进度实时可见，从"上门查"变为"在线管"。' },
    ],
  },
  {
    slug: 'industrial-park',
    name: '工业园区安全监测',
    tag: '工业',
    desc: '面向化工园区、制造工厂部署环境感知与安全监测终端，实时预警可燃气体、有毒物质，联动应急响应机制。',
    nums: ['800+ 监测点', '3 类感知', '实时预警'],
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80',
    previewType: 'gongmao',
    expLink: '/login?redirect=/gongmao',
    overview: '工业园区安全监测方案面向化工园区、制造工厂等高风险场景，通过部署多类型环境感知终端（气体、温度、烟感、视频），构建全域安全感知网络。平台支持 MQTT、TCP、HTTP 等多种通信协议，兼容主流传感器厂商设备。AI 引擎实时分析监测数据，发现异常即刻触发分级告警——从现场声光报警到管理端弹窗推送、短信通知，确保响应零延迟。同时联动应急指挥平台，自动匹配预案、调度救援资源。',
    features: [
      { title: '多协议设备接入', desc: '支持 MQTT 直连、TCP 直连、HTTP 订阅、Modbus 等 4 种通信协议，兼容 90% 以上主流传感器厂商。' },
      { title: 'AI 实时研判', desc: '交叉分析多源感知数据，在火花产生前预判电气火灾风险，自动联动降尘和停机指令，误报率 < 3%。' },
      { title: '分级告警联动', desc: '绿/黄/橙/红四级告警体系，自动匹配应急预案，联动消防广播、排烟、喷淋系统，缩短响应时间 70%。' },
      { title: '可视化大屏', desc: 'GIS 地图展示监测点位分布与实时状态，告警热力图、设备健康度一目了然，支持多屏联动指挥。' },
    ],
    values: [
      { role: '园区管理方', desc: '一张图掌握全域安全态势，告警自动分级推送，从"被动接警"变为"主动预警"，降低事故发生率。' },
      { role: '企业安全员', desc: '设备状态实时可见，维保提醒自动推送，告别人工巡检盲区，合规记录自动生成。' },
      { role: '应急管理部门', desc: '实时接入园区监测数据，突发事件秒级知晓，远程调度指挥，提升区域应急协同效率。' },
    ],
  },
]

const current = computed(() => CASES.find(c => c.slug === slug.value) || CASES[0])

const PREVIEW_SCREENSHOTS: Record<string, string> = {
  resumption: '/screenshots/fgfc_cz.png',
  gongmao: '/screenshots/gongmao.png',
}
const previewSrc = computed(() => PREVIEW_SCREENSHOTS[current.value.previewType || ''] || '')

// ===== Nav scroll =====
const scrolled = ref(false)
let scrollFn: () => void
onMounted(() => {
  scrollFn = () => { scrolled.value = window.scrollY > 48 }
  window.addEventListener('scroll', scrollFn, { passive: true })
})
onUnmounted(() => window.removeEventListener('scroll', scrollFn))
</script>

<style scoped>
/* ===== Nav ===== */
.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; transition: all 0.5s; background: rgba(255,255,255,0.92); border-bottom: 1px solid rgba(54,120,227,0.08); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 1px 8px rgba(0,0,0,0.04); }
.nav.scrolled { background: rgba(255,255,255,0.96); border-bottom: 1px solid rgba(54,120,227,0.12); box-shadow: 0 2px 20px rgba(0,0,0,0.06); }
.nav-inner { max-width: 1360px; margin: 0 auto; padding: 0 16px; height: 56px; display: flex; align-items: center; justify-content: space-between; }
@media (min-width: 640px) { .nav-inner { padding: 0 32px; height: 64px; } }
.nav-brand { display: flex; align-items: center; gap: 8px; text-decoration: none; }
.nav-logo { width: 28px; height: 28px; border-radius: 6px; background: #3678E3; flex-shrink: 0; }
.nav-name { font-weight: 700; font-size: 16px; color: #101010; }
.nav-links { display: none; gap: 28px; }
@media (min-width: 768px) { .nav-links { display: flex; } }
.nav-link { font-size: 15px; font-weight: 600; color: rgba(16,16,16,0.6); text-decoration: none; cursor: pointer; transition: color 0.2s; }
.nav-link:hover { color: #3678E3; }
.nav-actions { display: flex; align-items: center; gap: 12px; }
.nav-btn { font-size: 14px; font-weight: 600; padding: 8px 20px; border-radius: 6px; border: none; background: #3678E3; color: #fff; cursor: pointer; text-decoration: none; box-shadow: 0 2px 8px rgba(54,120,227,0.3); transition: background 0.2s; }
.nav-btn:hover { background: rgba(54,120,227,0.9); }

/* ===== Shared ===== */
.sec-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; }

/* ===== Hero ===== */
.cd-hero { position: relative; min-height: 420px; display: flex; align-items: center; justify-content: center; background-size: cover; background-position: center; padding-top: 64px; }
.cd-hero-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 100%); }
.cd-hero-content { position: relative; z-index: 1; text-align: center; max-width: 720px; padding: 64px 32px; }
.cd-hero-tag { display: inline-block; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9); background: rgba(54,120,227,0.5); padding: 4px 14px; border-radius: 4px; margin-bottom: 16px; letter-spacing: 0.06em; }
.cd-hero-title { font-size: clamp(28px, 5vw, 48px); font-weight: 800; color: #fff; margin: 0 0 16px; }
.cd-hero-desc { font-size: 18px; color: rgba(255,255,255,0.8); line-height: 1.7; margin: 0 auto 24px; max-width: 560px; }
.cd-hero-nums { display: flex; justify-content: center; gap: 8px; }
.cd-hero-num { font-size: 14px; color: #93c5fd; background: rgba(54,120,227,0.25); padding: 4px 14px; border-radius: 6px; font-weight: 500; }

/* ===== Section ===== */
.cd-section { padding: 64px 0; }
.cd-section-alt { background: #f5f7fc; }
.cd-sec-title { font-size: 24px; font-weight: 700; color: #101010; margin: 0 0 8px; text-align: center; }
.cd-sec-sub { font-size: 16px; color: #5E5E5E; text-align: center; margin: 0 0 32px; }

/* ===== Overview ===== */
.cd-body-card { background: #fff; border-radius: 14px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
.cd-body-text { font-size: 16px; color: #5E5E5E; line-height: 1.9; margin: 0; }

/* ===== Features ===== */
.cd-features { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 32px; }
@media (min-width: 768px) { .cd-features { grid-template-columns: repeat(2, 1fr); } }
.cd-feature-card { background: #fff; border: 1px solid rgba(54,120,227,0.08); border-radius: 12px; padding: 28px; position: relative; overflow: hidden; transition: all 0.25s; }
.cd-feature-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(54,120,227,0.1); }
.cd-feature-num { position: absolute; top: 16px; right: 20px; font-size: 36px; font-weight: 900; color: rgba(54,120,227,0.08); font-family: 'Outfit', sans-serif; line-height: 1; }
.cd-feature-title { font-size: 18px; font-weight: 700; color: #101010; margin: 0 0 10px; }
.cd-feature-desc { font-size: 15px; color: #5E5E5E; line-height: 1.7; margin: 0; }

/* ===== Preview Screenshot ===== */
.cd-preview-mock { max-width: 960px; margin: 0 auto; }
.cd-preview-frame { border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 20px 60px rgba(0,0,0,0.2); background: #fff; border: 1px solid rgba(0,0,0,0.06); }
.cd-preview-bar { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #f5f5f7; }
.cd-preview-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-red { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green { background: #28c840; }
.cd-preview-img { width: 100%; display: block; }

/* CTA */
.cd-cta-row { display: flex; justify-content: center; gap: 16px; margin-top: 32px; }
.cd-cta-btn { display: inline-flex; align-items: center; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600; text-decoration: none; color: #fff; background: #3678E3; box-shadow: 0 4px 20px rgba(54,120,227,0.45); transition: background 0.2s; }
.cd-cta-btn:hover { background: rgba(54,120,227,0.9); }
.cd-cta-ghost { display: inline-flex; align-items: center; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 500; text-decoration: none; color: #3678E3; border: 1px solid rgba(54,120,227,0.25); transition: all 0.2s; }
.cd-cta-ghost:hover { background: rgba(54,120,227,0.06); }

/* ===== Value Grid ===== */
.cd-value-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 32px; }
@media (min-width: 768px) { .cd-value-grid { grid-template-columns: repeat(3, 1fr); } }
.cd-value-card { background: #fff; border: 1px solid rgba(54,120,227,0.08); border-radius: 12px; padding: 28px; }
.cd-value-role { font-size: 16px; font-weight: 700; color: #3678E3; margin-bottom: 10px; }
.cd-value-desc { font-size: 15px; color: #5E5E5E; line-height: 1.7; margin: 0; }

</style>
