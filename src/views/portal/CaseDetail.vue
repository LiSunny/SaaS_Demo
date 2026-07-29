<template>
  <div class="case-detail" style="font-family:'Noto Sans SC','Outfit',-apple-system,sans-serif;min-height:100vh;background:#fafafa;">
    <!-- ===== Nav ===== -->
    <nav class="nav" :class="{ scrolled }">
      <div class="nav-inner">
        <a href="/portal" class="nav-brand">
          <img class="nav-logo" src="/favicon.svg" alt="logo" width="28" height="28" />
          <span class="nav-name" :class="{ scrolled }">公共安全管理平台</span>
        </a>
        <div class="nav-links">
          <a href="/portal#平台定位" class="nav-link" :class="{ scrolled }">平台定位</a>
          <a href="/portal#应用场景" class="nav-link" :class="{ scrolled }">应用场景</a>
          <a href="/portal#案例展示" class="nav-link" :class="{ scrolled }">案例展示</a>
        </div>
        <div class="nav-actions">
          <button class="nav-btn" @click="goExperience">去体验</button>
        </div>
      </div>
    </nav>

    <!-- ===== 已发布案例内容 ===== -->
    <template v-if="current">

    <!-- ===== Hero ===== -->
    <section class="cd-hero" :style="{ backgroundImage: `url(${current.image})` }">
      <div class="cd-hero-overlay"></div>
      <a href="/portal#案例展示" class="cd-breadcrumb-link">← 返回案例展示</a>
      <div class="cd-hero-content">
        <span class="cd-hero-tag">{{ current.tag }}</span>
        <h1 class="cd-hero-title">{{ current.name }}</h1>
        <p class="cd-hero-desc">{{ current.desc }}</p>
        <div class="cd-hero-nums">
          <span v-for="n in current.nums" :key="n" class="cd-hero-num">{{ n }}</span>
        </div>
      </div>
    </section>

    <!-- ===== 方案概述 ===== -->
    <section class="cd-section">
      <div class="sec-wrap">
        <h2 class="cd-sec-title">方案概述</h2>
        <div class="cd-body-card">
          <p v-for="(para, i) in current.overview" :key="i"
             class="cd-body-text"
             :class="{ 'cd-marker': isHighlighted(i) }">{{ para }}</p>
        </div>
      </div>
    </section>

    <div class="cd-section-divider"></div>

    <!-- ===== 业务协同示意 ===== -->
    <section v-if="current.collaboration" class="cd-section cd-section-alt">
      <div class="sec-wrap">
        <h2 class="cd-sec-title">业务协同示意</h2>
        <p class="cd-sec-sub">数据自下而上汇聚，决策自上而下贯通</p>
        <div class="cd-collab-flow" ref="collabFlowRef">
          <div v-for="(layer, li) in current.collaboration" :key="li">
            <div :class="['cd-collab-layer', layer.cls]">
              <div class="cd-collab-header">
                <div class="cd-collab-role">
                  <img class="cd-collab-avatar" :src="`https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(layer.avatar)}`" :alt="layer.name" loading="lazy" />
                  <div>
                    <div class="cd-collab-name">{{ layer.name }}</div>
                    <div class="cd-collab-dept">{{ layer.role }}</div>
                  </div>
                </div>
                <span :class="['cd-collab-badge', layer.badgeCls]">{{ layer.badge }}</span>
              </div>
              <div class="cd-collab-cards">
                <div :class="['cd-collab-card', layer.cardCls]" :id="layer.leftId">
                  <div class="cd-collab-card-label">我看到</div>
                  <div class="cd-collab-card-items">
                    <span v-for="(item, ii) in layer.leftItems" :key="ii">{{ item }}</span>
                  </div>
                </div>
                <div :class="['cd-collab-card', layer.cardCls]" :id="layer.rightId">
                  <div class="cd-collab-card-label">{{ layer.rightLabel }}</div>
                  <div class="cd-collab-card-items">
                    <span v-for="(item, ii) in layer.rightItems" :key="ii">{{ item }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="li < current.collaboration.length - 1" class="cd-collab-gap"></div>
          </div>
          <svg class="cd-collab-arrows" ref="collabSvgRef"></svg>
        </div>
        <div class="cd-collab-bottom">
          数据上行（反馈 → 汇聚 → 呈现）&ensp;支撑 &ensp;决策下行（派发 → 指派 → 执行）
        </div>
      </div>
    </section>

    <div class="cd-section-divider"></div>

    <!-- ===== 核心功能 ===== -->

    <section class="cd-section">
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

    <div class="cd-section-divider"></div>

    <!-- ===== 大屏预览截图 ===== -->
    <section v-if="current.previewType" class="cd-section cd-section-alt">
      <div class="sec-wrap">
        <h2 class="cd-sec-title">平台多端展示</h2>
        <p class="cd-sec-sub">{{ current.name }}数据看板 · 多端协同展示</p>
        <div class="cd-preview-mock">
          <!-- Web 大屏 -->
          <div class="cd-preview-frame">
            <div class="cd-preview-bar">
              <span class="cd-preview-dot dot-red"></span>
              <span class="cd-preview-dot dot-yellow"></span>
              <span class="cd-preview-dot dot-green"></span>
              <div class="cd-preview-url">“人工智能+公共安全”管理平台</div>
            </div>
            <img
              class="cd-preview-img"
              :src="previewSrc"
              :alt="current.name + '可视化大屏'"
            />
          </div>
          <!-- 移动端 -->
          <div v-if="mobileSrc" class="cd-phone-frame">
            <img class="cd-phone-img" :src="mobileSrc" alt="移动端预览" />
          </div>
        </div>
        <div class="cd-cta-row">
          <a :href="`/portal/preview/${current.previewType}`" class="cd-cta-btn">查看全屏大屏</a>
          <button class="cd-cta-ghost" @click="goExperience">立即体验完整功能 →</button>
        </div>
      </div>
    </section>

    <div v-if="current.previewType" class="cd-section-divider"></div>

    <!-- ===== 价值总结 ===== -->
    <section class="cd-section">
      <div class="sec-wrap">
        <h2 class="cd-sec-title">客户价值</h2>
        <div class="cd-value-grid">
          <div v-for="v in current.values" :key="v.person" class="cd-value-card">
            <div class="cd-value-top">
              <img class="cd-value-avatar" :src="`https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(v.person)}`" :alt="v.person" loading="lazy" />
              <div class="cd-value-meta">
                <div class="cd-value-person">{{ v.person }}</div>
                <div class="cd-value-role">{{ v.name }}</div>
              </div>
            </div>
            <div class="cd-value-divider"></div>
            <div class="cd-value-quote">{{ v.duty }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== Footer ===== -->
    <footer class="ft">
      <div class="ft-cta">
        <div>
          <p class="ft-cta-label">开始使用</p>
          <h2 class="ft-cta-title">让安全管理从"被动响应"走向"主动智治"</h2>
          <p class="ft-cta-sub">人工智能 + 公共安全管理平台 — 以大安全（消防 + 应急）为核心</p>
          <div class="ft-cta-btns">
            <a href="/portal#应用场景" class="hero-btn-fill">
              浏览应用场景
              <ArrowRight :size="14" style="margin-left:4px" />
            </a>
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

    </template>

    <!-- ===== 尚未发布 ===== -->
    <div v-else class="cd-coming">
      <div class="cd-coming-card">
        <div class="cd-coming-icon">📋</div>
        <h1 class="cd-coming-title">案例详情尚未发布</h1>
        <p class="cd-coming-desc">该案例的详细内容正在准备中，敬请期待</p>
        <a href="/portal#案例展示" class="cd-coming-back">← 返回案例展示</a>
      </div>
    </div>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowRight, Phone, Mail } from 'lucide-vue-next'

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
  demoPhone?: string
  demoPassword?: string
  overview: string[]
  features: { title: string; desc: string }[]
  values: { person: string; name: string; duty: string }[]
  collaboration?: CollabLayer[]
}

interface CollabLayer {
  cls: string; badgeCls: string; cardCls: string
  leftId: string; rightId: string
  avatar: string; name: string; role: string; dept: string; badge: string
  rightLabel: string
  leftItems: string[]; rightItems: string[]
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
    overview: [
      '复工复产管理是面向工贸企业的安全管理核心模块，以"六个一"安全标准为指导，将复工流程拆解为4个阶段、11个标准化步骤。',
      '从组建复工团队、签订安全承诺书，到安全培训、技术交底、隐患排查、设备体检，再到整改闭环、联合验收、签发复工令，最后完成试产值班和归档组卷——每一步操作带时间戳、执行人签名、照片附件。',
      '全流程数字化留痕，确保每一步都有据可查，帮助企业在停产检修后安全、合规、高效地恢复生产。',
    ],
    features: [
      { title: '四阶段管理', desc: '复工准备 → 复工审核 → 试产观察 → 正式复产，每个阶段有明确的里程碑和责任人，进度实时可视。' },
      { title: '11 步标准化流程', desc: '严格遵循"六个一"安全标准，覆盖建组、签责、培训、交底、排查、体检、整改、验收、签发、值班、归档全链路。' },
      { title: '可视化大屏', desc: '实时展示各车间复工进度、异常设备和未闭环隐患，一张图掌握全厂复工态势。' },
      { title: '全链追踪留痕', desc: '每步操作带时间戳、执行人签名、照片附件，满足监管审计要求，自证安全尽责。' },
    ],
    values: [
      { person: '王厂长', name: '厂长/总经理', duty: '复工进度实时可视，关键节点一键审批，再也不用等纸质签字流转，风险尽在掌控。' },
      { person: '刘班长', name: '车间主任/班组长', duty: '手机就能完成打卡拍照签字，纸质台账减少了八成，每天省出两小时。' },
      { person: '陈监管', name: '安全监管方', duty: '远程核查复工全流程记录，隐患整改进度一眼看清，从"跑现场"到"在线管"。' },
    ],
  },
  {
    slug: 'industrial-park',
    name: '工贸企业安全管理',
    tag: '工业',
    desc: '覆盖设备台账、巡查检查、隐患闭环、危险作业管控、告警值守五大场景，构建从设备上线到应急响应的全链路安全管理体系。',
    nums: ['5 个场景', '18 业务域', '全链闭环'],
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80',
    previewType: 'gongmao',
    expLink: '/login?redirect=/gongmao',
    demoPhone: '13000000009',
    demoPassword: 'admin123!@#',
    overview: [
      '中国有超过 300 万家工贸企业，共同面临一个无法回避的现实：只要有生产，就有安全风险。设备底数不清——哪台该保养全靠"老师傅"脑子记；巡查走过场——纸质签到表打钩，人没到也能签；隐患口头传——跟班组长说了就算"处理了"；危险作业靠胆子——无证人员也能上阵；告警没人应——消控室晚上无人值班，系统被静音。五个缺口连成一条链，每一个环节都靠人自觉，而人的自觉不堪一击。',
      '平台的做法不是替代人，而是把人的经验固化为系统流程。移动端扫码巡更、拍照查隐患、15 步审批动火票、实时响应告警——企业端管"做"。每台设备有数字档案、每条隐患有闭环链路、每次告警有时间戳——让每一个环节从"信得过"变成"看得见"。',
      '覆盖设备台账与保养、巡查检查、隐患整改闭环、危险作业管控、告警与值守五大场景。从设备上线到保养计划、从隐患上报到整改验收、从动火发起到关闭归档——不是用人管人，是用流程管人。',
    ],
    features: [
      { title: '设备台账与保养', desc: '每台设备建档即生成二维码，保养周期系统自动计算、到期自动推送任务。扫码定位+拍照留痕——保了什么、换了什么件，一扫码就记录。设备状态异常亮灯告警，不是等人发现。' },
      { title: '巡查检查', desc: '巡查计划定义查什么、查几次、谁来查。任务自动生成、推送到手机。扫码验证位置，结构化检查清单逐项引导——巡检从"凭经验看一圈"变成"有数据可查"。异常自动流转整改。' },
      { title: '隐患整改闭环', desc: '上报→分派→整改→验收确认，全链路跟踪。整改前/后对比拍照，每一步自动记录时间戳。超时自动亮红提醒——"尽快搞一下"变成"已闭环"，从发现到处理全程可追溯。' },
      { title: '危险作业管控', desc: '15 步 × 4 阶段审批流程，每一步拍照或签名，跳过即阻止。覆盖动火、受限空间、高处等特殊作业，从申请到验收全生命周期闭环。出了事有完整的审批链，追责找得到人。' },
      { title: '告警与值守', desc: '烟感、电气、手报等各类告警统一接入大屏实时弹窗，系统自动分级。一键调取摄像头实时画面核实，批量确认同类误报。电子交接班自动生成过去 12 小时告警统计和未处置清单。' },
    ],
    values: [
      { person: '赵总', name: '企业负责人', duty: '一张图看全厂安全态势。设备在线率、巡检覆盖率、隐患闭环率——三个数字判断安全管理是否落到实处，出了问题是拿出证据链，不是"我不知道"。' },
      { person: '孙安全员', name: '企业安全员', duty: '从"跑断腿、说不清"变成"系统推送、数据说话"。巡查自动生成任务、隐患一键分派、整改进度实时可见——不再挨个打电话问"那个事弄了没"。' },
      { person: '李明辉', name: '消控值班员', duty: '不再守着密密麻麻的告警指示灯。大屏弹窗+实时视频帮你判断真假，批量确认省下大量重复点击，精力留给真正需要警觉的时刻。' },
    ],
    collaboration: [
      {
        cls: 'cd-cl1', badgeCls: 'cd-cl1-badge', cardCls: 'cd-cl1-card',
        leftId: 'cdl1a', rightId: 'cdl1b',
        avatar: '赵总', name: '赵总', role: '企业负责人', dept: '应急管理部门', badge: '决策层',
        rightLabel: '我决策',
        leftItems: ['全厂安全态势总览与告警热力图', '各车间设备健康度与巡检完成率', '隐患整改进度与合规审计报告'],
        rightItems: ['审批重大告警处置方案', '调整安全资源配置与巡检策略', '一键生成合规报告，自证安全尽责'],
      },
      {
        cls: 'cd-cl2', badgeCls: 'cd-cl2-badge', cardCls: 'cd-cl2-card',
        leftId: 'cdl2a', rightId: 'cdl2b',
        avatar: '孙安全员', name: '孙安全员', role: '安全管理员', dept: '应急管理部门', badge: '管理层',
        rightLabel: '我管理',
        leftItems: ['分级告警推送与异常点位定位', '员工处置进度与整改状态', '设备维保到期提醒与巡检排期'],
        rightItems: ['组织核查、指派员工现场处置', '向上汇报处置结果与设备状态', '调整维保计划与巡检频次'],
      },
      {
        cls: 'cd-cl3', badgeCls: 'cd-cl3-badge', cardCls: 'cd-cl3-card',
        leftId: 'cdl3a', rightId: 'cdl3b',
        avatar: '刘师傅', name: '刘师傅', role: '现场员工', dept: '应急管理部门', badge: '执行层',
        rightLabel: '我执行',
        leftItems: ['手机收到处置任务与点位信息', '保养到期自动提醒与任务推送', '待巡检设备清单与历史记录'],
        rightItems: ['到点位核查、拍照上传留证', '发现隐患即时上报，整改闭环', '按预案响应声光报警'],
      },
    ],
  },
  {
    slug: 'quanzhou-cockpit',
    name: '泉州应消联勤监管平台',
    tag: '城市治理',
    desc: '依托AI大模型与物联网技术，构建全市首个"人工智能+应消联勤"一体化管控平台，实现一屏观全域、一网管消防。',
    nums: ['14 模块', 'AI 研判', '多端协同'],
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
    previewType: 'quanzhou',
    expLink: '/login?redirect=/enterprise-cockpit&phone=13000001111&password=admin123!@%2523',
    overview: [
      '泉州"人工智能+应消联勤"一体化管控平台是面向城市级应急消防治理的数字化中枢。平台以泉州全域为基底，串联监测预警、应消联动、台账管理、大数据研判考核各大模块。',
      '覆盖工贸企业自律驾驶舱、危化企业监控、沿街门店应消预警、消防控制室监管、风险源作业管控等 14 个核心业务场景，构建从企业自查到政府监管的全链条数字化闭环。',
      '通过 AI 大模型、物联网、5G 技术，实现风险动态感知、责任精准监管、治理闭环长效，推动消防工作从"被动响应"向"主动防控"深度转型。',
    ],
    features: [
      { title: '企业驾驶舱', desc: '规上/规下企业接入统计、自查隐患整改报备、安全生产应急预案管理，构建企业自律监管闭环。' },
      { title: 'GIS风险一张图', desc: '高德地图为底图，红黄蓝绿四色标注企业风险等级，一键查看企业详情、风险点位、履职记录。' },
      { title: '消防控制室值守监管', desc: '8路监控画面实时轮播，REC录制、时间戳叠加、暗角扫描线写实风格，在线/离线状态一目了然。' },
      { title: 'AI智能风险预警', desc: '消防主机报警、人员脱岗、设备故障、隐患超期等6类告警实时推送，红/橙/蓝三级分级处置。' },
      { title: '风险源作业管控', desc: '覆盖动火、受限空间、高处、临时用电等八大特殊作业审批，从申请到验收全生命周期闭环。' },
      { title: '安全履责打卡', desc: '未履职/已履职双环统计，8行打卡记录实时追踪，红绿状态一眼识别，压实企业主体责任。' },
    ],
    values: [
      { person: '林局长', name: '应急管理部门', duty: '一屏看全市消防态势，告警自动推送到人，从被动接警变成主动预警，心里有底了。' },
      { person: '钱主管', name: '企业安全负责人', duty: '自查自改全留痕，履职打卡自动记，合规台账一键生成，迎检不再手忙脚乱。' },
      { person: '吴站长', name: '基层消防站', duty: '告警双向推送，巡查任务协同派发，突发事件就近联动，补齐了末端响应短板。' },
    ],
  },
]

const current = computed(() => CASES.find(c => c.slug === slug.value) || null)

// 自动马克笔高亮：三段式概述中始终高亮第2段（方案/怎么做）
const isHighlighted = (i: number) => {
  const len = current.value?.overview?.length || 0
  if (len === 0) return false
  if (len === 1) return i === 0
  return i === 1
}

const PREVIEW_SCREENSHOTS: Record<string, string> = {
  resumption: '/screenshots/fgfc_cz.png',
  gongmao: '/screenshots/gongmao.png',
  quanzhou: '/screenshots/quanzhou-cockpit.png',
}
const previewSrc = computed(() => PREVIEW_SCREENSHOTS[current.value?.previewType || ''] || '')

const MOBILE_SCREENSHOTS: Record<string, string> = {
  gongmao: '/screenshots/gongmao-mobile.png',
}
const mobileSrc = computed(() => MOBILE_SCREENSHOTS[current.value?.previewType || ''] || '')

// ===== Footer =====
const FOOTER_COLS = [
  { title: '应用场景', links: ['校园安全', '工贸企业', '小商户安全监管'] },
  { title: '功能模块', links: ['远程值守', '巡查检查', '隐患管理', 'AI 告警分析', '可视化大屏'] },
  { title: '技术', links: ['MQTT 直连', 'TCP 直连', 'HTTP 订阅', '多端协同', 'API 文档'] },
  { title: '联系我们', links: ['预约演示', '商务合作', '技术支持', '关于平台'] },
]

// ===== 移动端检测 + 体验跳转 =====
const isMobile = () => window.innerWidth < 768
const showMobileTip = ref(false)
const copied = ref(false)

function goExperience() {
  if (isMobile()) {
    showMobileTip.value = true
    return
  }
  const c = current.value
  // 从 expLink 提取 redirect 目标
  const redirectMatch = c?.expLink?.match(/redirect=([^&]+)/)
  const redirect = redirectMatch ? decodeURIComponent(redirectMatch[1]) : '/enterprise-cockpit'
  const params = new URLSearchParams({ redirect })
  if (c?.demoPhone) params.set('phone', c.demoPhone)
  if (c?.demoPassword) params.set('password', c.demoPassword)
  window.location.href = `/login?${params.toString()}`
}

const copyExpUrl = async () => {
  const url = window.location.origin + '/login'
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = url
    ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select(); document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

// ===== Nav scroll =====
const scrolled = ref(false)
let scrollFn: () => void

// ---- 业务协同示意箭头 ----
const collabFlowRef = ref<HTMLElement | null>(null)
const collabSvgRef = ref<SVGSVGElement | null>(null)

const collabArrowDefs: { from: string; to: string; label: string; color: string; dir: 'up' | 'down' }[] = [
  { from: 'cdl2a', to: 'cdl1a', label: '数据上报', color: '#059669', dir: 'up' },
  { from: 'cdl1b', to: 'cdl2b', label: '指令派发', color: '#3678e3', dir: 'down' },
  { from: 'cdl3a', to: 'cdl2a', label: '结果反馈', color: '#059669', dir: 'up' },
  { from: 'cdl2b', to: 'cdl3b', label: '任务指派', color: '#3678e3', dir: 'down' },
]

function drawCollabArrows() {
  const flowEl = collabFlowRef.value
  const svg = collabSvgRef.value
  if (!flowEl || !svg) return

  const fr = flowEl.getBoundingClientRect()
  const w = fr.width; const h = fr.height
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
  svg.style.width = w + 'px'; svg.style.height = h + 'px'
  let html = ''; const as = 7

  collabArrowDefs.forEach(def => {
    const fromEl = document.getElementById(def.from)
    const toEl = document.getElementById(def.to)
    if (!fromEl || !toEl) return
    const frB = fromEl.getBoundingClientRect()
    const toB = toEl.getBoundingClientRect()
    const mx = (frB.left - fr.left + frB.width / 2 + toB.left - fr.left + toB.width / 2) / 2
    let y1: number, y2: number, midY: number
    if (def.dir === 'down') {
      y1 = frB.bottom - fr.top; y2 = toB.top - fr.top; midY = (y1 + y2) / 2
    } else {
      y1 = frB.top - fr.top; y2 = toB.bottom - fr.top; midY = (y1 + y2) / 2
    }
    html += `<line x1="${mx}" y1="${y1}" x2="${mx}" y2="${y2}" stroke="${def.color}" stroke-opacity="0.55" stroke-width="2.5" stroke-dasharray="10 6" class="cd-collab-arrow-line"/>`
    const hs = def.dir === 'down' ? -1 : 1
    html += `<polygon points="${mx},${y2} ${mx - as},${y2 + hs * as * 1.6} ${mx + as},${y2 + hs * as * 1.6}" fill="${def.color}" fill-opacity="0.65"/>`
    html += `<text x="${mx + 10}" y="${midY + 4}" fill="${def.color}" font-size="13" font-family="'Noto Sans SC','Outfit',sans-serif" font-weight="500">${def.label}</text>`
  })
  svg.innerHTML = html
}

let collabResizeFn: () => void
onMounted(() => {
  window.scrollTo(0, 0)
  scrollFn = () => { scrolled.value = window.scrollY > 48 }
  window.addEventListener('scroll', scrollFn, { passive: true })
  setTimeout(drawCollabArrows, 100)
  collabResizeFn = drawCollabArrows
  window.addEventListener('resize', collabResizeFn)
})
onUnmounted(() => {
  window.removeEventListener('scroll', scrollFn)
  window.removeEventListener('resize', collabResizeFn)
})
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
.nav-link { font-size: 16px; font-weight: 600; color: rgba(16,16,16,0.6); text-decoration: none; cursor: pointer; transition: color 0.2s; }
.nav-link:hover { color: #3678E3; }
.nav-actions { display: flex; align-items: center; gap: 12px; }
.nav-btn { font-size: 14px; font-weight: 600; padding: 8px 20px; border-radius: 6px; border: none; background: #3678E3; color: #fff; cursor: pointer; text-decoration: none; box-shadow: 0 2px 8px rgba(54,120,227,0.3); transition: background 0.2s; }
.nav-btn:hover { background: rgba(54,120,227,0.9); }

/* ===== Hero ===== */
.cd-hero { position: relative; min-height: 420px; display: flex; align-items: center; justify-content: center; background-size: cover; background-position: center; padding-top: 64px; }
.cd-hero-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 100%); }
.cd-breadcrumb-link { position: absolute; top: 80px; left: 32px; z-index: 2; font-size: 16px; font-weight: 500; color: rgba(255,255,255,0.85); text-decoration: none; transition: opacity 0.2s; }
.cd-breadcrumb-link:hover { opacity: 0.7; }
.cd-hero-content { position: relative; z-index: 1; text-align: center; max-width: 720px; padding: 64px 32px; }
.cd-hero-tag { display: inline-block; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9); background: rgba(54,120,227,0.5); padding: 4px 14px; border-radius: 4px; margin-bottom: 16px; letter-spacing: 0.06em; }
.cd-hero-title { font-size: clamp(28px, 5vw, 48px); font-weight: 800; color: #fff; margin: 0 0 16px; }
.cd-hero-desc { font-size: 18px; color: rgba(255,255,255,0.8); line-height: 1.7; margin: 0 auto 24px; max-width: 560px; }
.cd-hero-nums { display: flex; justify-content: center; gap: 8px; }
.cd-hero-num { font-size: 14px; color: #93c5fd; background: rgba(54,120,227,0.25); padding: 4px 14px; border-radius: 6px; font-weight: 500; }

/* ===== Shared ===== */
.sec-wrap { max-width: 1200px; margin: 0 auto; padding: 0 32px; position: relative; z-index: 1; }

/* ===== Section ===== */
.cd-section { padding: 64px 0; }
.cd-section-alt { background: linear-gradient(135deg, #f5f7fc 0%, #eef3ff 50%, #f5f7fc 100%); position: relative; overflow: hidden; }
/* 背景装饰光斑 */
.cd-section-alt::before {
  content: '';
  position: absolute;
  top: -120px;
  right: -80px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(54,120,227,0.06) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}
.cd-section-alt::after {
  content: '';
  position: absolute;
  bottom: -100px;
  left: -60px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(54,120,227,0.04) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}
.cd-sec-title { font-size: 24px; font-weight: 700; color: #101010; margin: 0 0 8px; text-align: center; }
.cd-sec-sub { font-size: 16px; color: #5E5E5E; text-align: center; margin: 0 0 32px; }

/* ===== Section Divider ===== */
.cd-section-divider { max-width: 1200px; margin: 0 auto; height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(54,120,227,0.12) 20%, rgba(54,120,227,0.12) 80%, transparent 100%); }

/* ===== Overview ===== */
.cd-body-card { padding: 0; }
.cd-body-text { font-size: 16px; color: #5E5E5E; line-height: 1.9; margin: 0; }
.cd-body-text + .cd-body-text { margin-top: 16px; }

/* 首字下沉：第一段开头第一个字放大，跨两行 */
.cd-body-text:first-child::first-letter {
  float: left;
  font-size: 3.2em;
  font-weight: 700;
  color: #2a2a2a;
  line-height: 0.85;
  margin-right: 8px;
  margin-top: 4px;
}

.cd-marker {
  display: inline;
  background: linear-gradient(0deg, rgba(54,120,227,0.35) 0%, rgba(54,120,227,0.35) 40%, transparent 40%);
  background-size: 100% 1.9em;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

/* ===== Features ===== */
.cd-features { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 32px; }
@media (min-width: 640px) { .cd-features { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1080px) { .cd-features { grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); } }
.cd-feature-card { background: #fff; border: 1px solid rgba(54,120,227,0.08); border-radius: 12px; padding: 28px; position: relative; overflow: hidden; transition: all 0.25s; }
.cd-feature-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(54,120,227,0.1); }
.cd-feature-num { position: absolute; top: 16px; right: 20px; font-size: 36px; font-weight: 900; color: rgba(54,120,227,0.08); font-family: 'Outfit', sans-serif; line-height: 1; }
.cd-feature-title { font-size: 18px; font-weight: 700; color: #101010; margin: 0 0 10px; }
.cd-feature-desc { font-size: 16px; color: #5E5E5E; line-height: 1.7; margin: 0; }

/* ===== Preview Screenshot ===== */
.cd-preview-mock { max-width: 1080px; margin: 0 auto; display: flex; align-items: flex-end; gap: 16px; }
.cd-preview-frame { flex: 1; min-width: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.12), 0 20px 60px rgba(0,0,0,0.2); background: #1a1a1a; border-left: 10px solid #2C2C2C; border-right: 10px solid #2C2C2C; border-bottom: 10px solid #2C2C2C; }
.cd-preview-bar { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #2C2C2C; position: relative; }
.cd-preview-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-red { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green { background: #28c840; }
.cd-preview-url {
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
.cd-preview-img { width: 100%; display: block; }

/* 移动端 */
.cd-phone-frame {
  width: 220px;
  flex-shrink: 0;
}
.cd-phone-img {
  width: 100%;
  display: block;
}

/* CTA */
.cd-cta-row { display: flex; justify-content: center; gap: 16px; margin-top: 32px; }
.cd-cta-btn { display: inline-flex; align-items: center; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600; text-decoration: none; color: #fff; background: #3678E3; box-shadow: 0 4px 20px rgba(54,120,227,0.45); transition: background 0.2s; }
.cd-cta-btn:hover { background: rgba(54,120,227,0.9); }
.cd-cta-ghost { display: inline-flex; align-items: center; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 500; text-decoration: none; color: #3678E3; border: 1px solid rgba(54,120,227,0.25); transition: all 0.2s; }
.cd-cta-ghost:hover { background: rgba(54,120,227,0.06); }

/* ===== Value Grid ===== */
.cd-value-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 32px; }
@media (min-width: 768px) { .cd-value-grid { grid-template-columns: repeat(3, 1fr); } }

.cd-value-card {
  display: flex; flex-direction: column; gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 8px;
  transition: all 0.3s;
}
.cd-value-card:hover {
  background: rgba(255, 255, 255, 0.72);
  border-color: rgba(54, 120, 227, 0.18);
  box-shadow: 0 8px 32px rgba(54, 120, 227, 0.1);
  transform: translateY(-2px);
}

/* Row 1: avatar + meta */
.cd-value-top { display: flex; align-items: center; gap: 12px; }
.cd-value-avatar { width: 48px; height: 48px; border-radius: 10px; flex-shrink: 0; object-fit: cover; background: linear-gradient(135deg, #e8f0fe, #dce8fa); }
.cd-value-meta { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.cd-value-person { font-size: 16px; font-weight: 600; color: #101010; line-height: 1.4; }
.cd-value-role { font-size: 14px; font-weight: 500; color: #3678e3; line-height: 1.4; }

/* Row 2: divider */
.cd-value-divider { height: 0; border-top: 1px dashed rgba(54,120,227,0.18); }

/* Row 3: quote */
.cd-value-quote {
  font-size: 18px; font-weight: 400; color: #5e5e5e; line-height: 1.2;
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(180,160,130,0.06) 1px, rgba(180,160,130,0.06) 2px),
    #faf7f0;
  border-radius: 6px;
  padding: 12px 14px;
  height: 128px;
  overflow: hidden;
}

/* ===== Footer ===== */
.ft { background: linear-gradient(180deg, #eef3ff 0%, #f4f7ff 100%); border-top: 1px solid rgba(54,120,227,0.1); font-family: var(--f-body, 'Noto Sans SC', 'Outfit', sans-serif); }
.ft-cta { text-align: center; padding: 64px 20px; border-bottom: 1px solid rgba(54,120,227,0.08); }
@media (min-width: 640px) { .ft-cta { padding: 80px 20px; } }
.ft-cta-label { font-size: 16px; color: #3678E3; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 20px; }
.ft-cta-title { font-size: 24px; font-weight: 700; color: #101010; margin: 0 0 16px; }
@media (min-width: 640px) { .ft-cta-title { font-size: 30px; } }
.ft-cta-sub { font-size: 16px; color: #5E5E5E; max-width: 448px; margin: 0 auto 32px; }
.ft-cta-btns { display: flex; flex-direction: column; align-items: center; gap: 12px; }
@media (min-width: 640px) { .ft-cta-btns { flex-direction: row; justify-content: center; } }
.hero-btn-fill { display: inline-flex; align-items: center; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; background: #3678E3; color: #fff; text-decoration: none; cursor: pointer; border: none; box-shadow: 0 4px 20px rgba(54,120,227,0.45); transition: background 0.2s; }
.hero-btn-fill:hover { background: rgba(54,120,227,0.9); }
.hero-btn-ghost { display: inline-flex; align-items: center; font-size: 16px; font-weight: 500; padding: 14px 32px; border-radius: 8px; border: 1px solid rgba(54,120,227,0.25); color: #3678E3; text-decoration: none; cursor: pointer; background: transparent; transition: all 0.2s; }
.hero-btn-ghost:hover { background: rgba(54,120,227,0.06); }

.ft-links-wrap { max-width: 1200px; margin: 0 auto; padding: 48px 20px; }
@media (min-width: 640px) { .ft-links-wrap { padding: 48px 32px; } }
.ft-links { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; padding-bottom: 40px; border-bottom: 1px solid rgba(54,120,227,0.08); }
@media (min-width: 640px) { .ft-links { grid-template-columns: repeat(4, 1fr); } }
@media (min-width: 768px) { .ft-links { grid-template-columns: 2fr 1fr 1fr 1fr 1fr; } }
.ft-brand-icon { width: 24px; height: 24px; border-radius: 6px; background: #3678E3; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
.ft-brand-name { font-size: 16px; font-weight: 700; color: #101010; }
.ft-brand-desc { font-size: 16px; color: #5E5E5E; line-height: 1.65; margin: 12px 0 16px; }
.ft-contact { display: flex; flex-direction: column; gap: 6px; font-size: 16px; color: #5E5E5E; }
.ft-contact span { display: flex; align-items: center; gap: 6px; }
.ft-col h4 { font-size: 16px; font-weight: 600; color: #3678E3; margin: 0 0 12px; }
.ft-col a { display: block; font-size: 16px; color: #5E5E5E; text-decoration: none; padding: 4px 0; transition: color 0.2s; }
.ft-col a:hover { color: #3678E3; }
.ft-bottom { display: flex; flex-direction: column; align-items: center; gap: 12px; padding-top: 32px; font-size: 16px; color: rgba(16,16,16,0.5); }
@media (min-width: 640px) { .ft-bottom { flex-direction: row; justify-content: space-between; } }
.footer-divider { color: rgba(16,16,16,0.25); }
.footer-icp { color: rgba(16,16,16,0.5); text-decoration: none; cursor: pointer; transition: color 0.2s; }
.footer-icp:hover { color: #3678E3; }

/* ===== Coming Soon ===== */
.cd-coming { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding-top: 64px; }
.cd-coming-card { text-align: center; padding: 64px 32px; }
.cd-coming-icon { font-size: 64px; margin-bottom: 24px; }
.cd-coming-title { font-size: 28px; font-weight: 700; color: #101010; margin: 0 0 12px; }
.cd-coming-desc { font-size: 16px; color: #5E5E5E; margin: 0 0 32px; }
.cd-coming-back:hover { opacity: 0.7; }

/* ===== Mobile tip ===== */
.mobile-tip-card { background: #fff; border-radius: 16px; padding: 40px 32px; text-align: center; max-width: 320px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
.mobile-tip-icon { font-size: 48px; margin-bottom: 16px; }
.mobile-tip-title { font-size: 18px; font-weight: 700; color: #101010; margin: 0 0 8px; }
.mobile-tip-sub { font-size: 14px; color: #5E5E5E; margin: 0 0 24px; line-height: 1.6; }
.mobile-tip-btn { width: 100%; padding: 12px 24px; border-radius: 8px; border: none; font-size: 15px; font-weight: 600; background: #3678E3; color: #fff; cursor: pointer; transition: background 0.2s; }
.mobile-tip-btn:hover { background: rgba(54,120,227,0.9); }

/* ===== 业务协同示意 ===== */
.cd-collab-flow { position: relative; }
.cd-collab-arrows { position: absolute; top: 0; left: 0; pointer-events: none; z-index: 2; }

.cd-collab-layer { border-radius: 12px; padding: 16px 22px 20px; }
.cd-cl1 { background: #e8f0fa; }
.cd-cl2 { background: #f0ecf7; }
.cd-cl3 { background: #e6f3e8; }

.cd-collab-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.cd-collab-role { display: flex; align-items: center; gap: 10px; }
.cd-collab-avatar { width: 36px; height: 36px; border-radius: 10px; background: #fff; flex-shrink: 0; }
.cd-collab-name { font-size: 16px; font-weight: 600; color: #101010; }
.cd-collab-dept { font-size: 12px; color: #3678e3; font-weight: 500; margin-top: 2px; }

.cd-collab-badge { font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 6px; letter-spacing: 0.04em; }
.cd-cl1-badge { background: #3678e3; color: #fff; }
.cd-cl2-badge { background: #7c3aed; color: #fff; }
.cd-cl3-badge { background: #059669; color: #fff; }

.cd-collab-cards { display: flex; gap: 14px; }
.cd-collab-card { flex: 1; min-width: 0; background: #fff; border-radius: 8px; padding: 14px 16px; }
.cd-cl1-card { border: 1.5px solid #a0c4f2; }
.cd-cl2-card { border: 1.5px solid #ccaaf6; }
.cd-cl3-card { border: 1.5px solid #8cc78e; }

.cd-collab-card-label { font-size: 12px; font-weight: 600; color: #94a3b8; letter-spacing: 0.04em; margin-bottom: 8px; }
.cd-collab-card-items { display: flex; flex-direction: column; gap: 6px; }
.cd-collab-card-items span { font-size: 14px; color: #495565; line-height: 1.55; display: flex; align-items: flex-start; gap: 6px; }
.cd-collab-card-items span::before { content: ''; width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; margin-top: 8px; opacity: 0.45; }
.cd-cl1-card .cd-collab-card-items span::before { background: #3678e3; }
.cd-cl2-card .cd-collab-card-items span::before { background: #7c3aed; }
.cd-cl3-card .cd-collab-card-items span::before { background: #059669; }

.cd-collab-gap { height: 36px; }

.cd-collab-bottom { text-align: center; margin-top: 24px; font-size: 14px; color: #5e5e5e; line-height: 1.7; }

@media (max-width: 600px) {
  .cd-collab-layer { padding: 14px 14px 18px; }
  .cd-collab-cards { flex-direction: column; }
  .cd-collab-gap { height: 24px; }
}
</style>

<!-- 箭头流动动画：非 scoped，因为 SVG 元素是 JS 动态创建的 -->
<style>
.cd-collab-arrow-line {
  animation: collabDashFlow 1.6s linear infinite;
}
@keyframes collabDashFlow {
  to { stroke-dashoffset: -32; }
}
</style>
