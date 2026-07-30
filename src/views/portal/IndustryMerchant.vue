<template>
  <div style="font-family:'Noto Sans SC','Outfit',-apple-system,sans-serif;min-height:100vh;background:#fafafa;">
    <nav class="nav" :class="{ scrolled }">
      <div class="nav-inner">
        <a href="/portal" class="nav-brand">
          <img class="nav-logo" src="/favicon.svg" alt="logo" width="28" height="28" />
          <span class="nav-name" :class="{ scrolled }">公共安全管理平台</span>
        </a>
        <div class="nav-links">
          <a v-for="(item, i) in navItems" :key="item.id"
            class="nav-link" :class="{ scrolled }"
            @click.prevent="scrollTo(item.id, i)">{{ item.nav }}</a>
        </div>
        <div class="nav-actions">
          <button class="nav-btn" @click="goExp">去体验</button>
        </div>
      </div>
    </nav>
    <section class="ind-hero" style="background-image:url(/images/unsplash/photo-1441986300917-64674bd600d8.jpg);">
      <div class="ind-hero-grid"></div>
      <div class="ind-hero-content">
        <h1 class="ind-hero-title">{{ pageTitle }}</h1>
        <p class="ind-hero-sub">{{ pageSub }}</p>
      </div>
    </section>
    <div class="ind-sec-wrap">
      <section v-for="sc in scenes" :key="sc.id" :id="sc.id" class="scene-section">
        <div class="scene-header">
          <div class="scene-icon"><component :is="sc.icon" :size="22" color="#3678E3" /></div>
          <div><h2 class="scene-title">{{ sc.title }}</h2><p class="scene-tagline">{{ sc.tagline }}</p></div>
        </div>
        <div class="scene-roles">
          <span class="scene-label">涉及角色</span>
          <div class="role-cards">
            <div v-for="r in sc.roles" :key="r.name" class="role-card">
              <img class="role-avatar" :src="`/images/avatars/${r.person}.svg`" :alt="r.person" loading="lazy" />
              <div class="role-info">
                <div class="role-person">{{ r.person }}</div>
                <div class="role-title">{{ r.name }}</div>
                <div class="role-desc">{{ r.duty }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="scene-body">
          <div class="case-card">
              <p class="case-text" v-html="sc.case.text"></p>
              <p class="case-solution">{{ sc.case.if }}</p>
            </div>
          <div class="journey">
            <span class="scene-label">典型一天</span>
            <div class="journey-track">
              <div v-for="(j, i) in sc.journey" :key="i" class="journey-node" :class="i % 2 === 0 ? 'up' : 'down'">
                <div v-if="i % 2 === 0" class="journey-card"><div class="journey-card-title">{{ j.title }}</div><div class="journey-card-role">{{ j.role }}</div><div class="journey-card-desc">{{ j.desc }}</div><div class="journey-card-shot"><Image :size="12" />{{ j.shot }}</div></div>
                <div class="journey-dot"></div>
                <div class="journey-time">{{ j.time }}</div>
                <div v-if="i % 2 !== 0" class="journey-card"><div class="journey-card-title">{{ j.title }}</div><div class="journey-card-role">{{ j.role }}</div><div class="journey-card-desc">{{ j.desc }}</div><div class="journey-card-shot"><Image :size="12" />{{ j.shot }}</div></div>
              </div>
            </div>
          </div>
        </div>
        <div class="scene-value">
          <span class="scene-label">核心价值</span>
          <div class="scene-value-grid">
            <div v-for="v in sc.values" :key="v.role" class="value-item"><span class="value-role">{{ v.role }}</span><span class="value-desc">{{ v.desc }}</span></div>
          </div>
        </div>
        <div class="shot-placeholder">
          <Image :size="14" /><span>共 <span class="shot-count">{{ sc.journey.length }}</span> 张界面截图</span>
        </div>
      </section>
    </div>
    <section class="ind-cta">
      <a href="#" class="ind-cta-demo">预约演示<ArrowRight :size="14" /></a>
      <a href="/portal" class="ind-cta-btn">← 返回场景总览</a>
    </section>
    <MobileTipModal :show="showMobileTip" :copied="copied" @close="showMobileTip = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowRight, ClipboardCheck, Search, Image } from 'lucide-vue-next'
import { useMobileGuard } from '@/composables/useMobileGuard'
import MobileTipModal from '@/components/base/MobileTipModal.vue'

const { showMobileTip, copied, goExp } = useMobileGuard('/login')

const pageTitle = '小商户安全监管'
const pageSub = '辖区几千家店，靠几个人跑不完 —— 自查打卡 + 入户巡查 + 隐患闭环'

const scenes = [{
  id: 'check', icon: ClipboardCheck, title: '商户安全自查', tagline: '每天 1 分钟手机打卡，检查项按业态自动适配',
  roles: [{ person: '老张', name: '商户经营者', duty: '每日安全检查、逐项确认打卡' },{ person: '王姐', name: '管理方', duty: '大屏看打卡率、漏打名单、商圈排名' }],
  case: { date: '', text: '辖区几千家店，管理方靠几个人跑不过来。商户有没有每天检查燃气、电气——没人知道。出了事才发现这家店三个月没做过一次安全检查。', if: '商户每天手机打卡，检查清单按业态自动适配——餐饮查燃气和油烟、零售查电气和灭火器。管理方大屏看打卡率——绿色已打卡、白色在漏。' },
  journey: [{ time: '05:00', title: '开店前，手机推送', role: '商户 · 老张（川菜馆）', desc: '手机推了一条通知："今日安全检查待完成"。点进——检查清单按餐饮店自动适配：燃气阀门、灭火器压力、油烟通道、电气线路。逐项打勾，1 分钟提交。', shot: '移动端商户安全检查清单页' },{ time: '08:00', title: '大屏看履责率', role: '管理方 · 王姐', desc: '大屏左侧"今日商户履责率"——当前 82%。老张川菜馆 05:03 已打卡。5 家未打卡——杂货店和五金店营业晚，正常。上周 3 家连续漏打，跟进后全部恢复。', shot: 'Web 大屏商户履责监管页' }],
  values: [{ role: '商户', desc: '每天 1 分钟打卡，检查项按业态适配。出了事有每日自查记录' },{ role: '管理方', desc: '绿色在打卡、白色在漏——连着的白在提醒你该打电话了' }],
},{
  id: 'inspect', icon: Search, title: '巡查与隐患处置', tagline: '物业扫码上报 → 推送商户整改 → 拍照回传闭环',
  roles: [{ person: '小李', name: '物业巡查/街道安全员', duty: '按计划巡查、扫码到店、拍照上报' },{ person: '老张', name: '商户经营者', duty: '收到隐患通知、整改后拍照回传' },{ person: '王姐', name: '管理方', duty: '大屏看巡查覆盖率、整改率、超期清单' }],
  case: { date: '', text: '巡查员发现了问题告诉商户，商户说"知道了"——然后就没有然后了。口头传达无记录，隐患超期没人追。下次来还是老样子。', if: '巡查员扫码上报→系统自动推送至商户手机→商户整改后拍照回传→管理方在线确认闭环。超期自动亮红——不是"下次再说"，是"现在就要"。' },
  journey: [{ time: '09:00', title: '巡查出发，今天 12 家', role: '巡查员 · 小李', desc: '打开 App，今天的巡查计划已生成——B 区 12 家餐饮店，重点"燃气安全 + 灭火器 + 疏散通道"。路线自动排好。', shot: '移动端巡查任务列表' },{ time: '09:15', title: '发现燃气软管老化', role: '巡查员 · 小李', desc: '老张川菜馆后厨。蹲下看燃气软管——管壁发硬、多处裂纹。拍照→选"燃气软管老化"→"需立即更换金属软管"→提交。自动推送至老张手机。', shot: '移动端隐患上报页' },{ time: '09:30', title: '商户收到推送，整改', role: '商户 · 老张', desc: '手机弹出通知——看到自己管子的照片，裂痕很明显。叫燃气师傅下午换了金属软管。同角度拍新管照片上传——"老→新"对比。', shot: '移动端商户整改上传页' },{ time: '14:30', title: '确认闭环', role: '管理方 · 王姐', desc: '后台看到整改上传——对比照片清楚。点"确认已整改"。大屏隐患整改率从 87% 刷新到 89%。', shot: 'Web 端隐患跟踪看板' },{ time: '16:00', title: '超期自动亮红提醒', role: '系统 + 管理方', desc: '大屏上 1 条标红——"超期未整改"。另一家灭火器压力不足三天前上报，昨天到期还没交。王姐决定明天去店里看。', shot: 'Web 端超期隐患红色标记' }],
  values: [{ role: '巡查人员', desc: '扫码即到、拍照即记录——不用填表、不用口头传' },{ role: '商户', desc: '隐患带照片推送——一看就知道什么出问题了' },{ role: '管理方', desc: '巡查覆盖率、整改率、超期清单——超时自动亮红' }],
}]
const navItems = [{ id: 'check', nav: '商户自查' },{ id: 'inspect', nav: '巡查与隐患' }]

const scrolled = ref(false)
const activeNav = ref(0)
let scrollFn: () => void
onMounted(() => { scrollFn = () => { scrolled.value = window.scrollY > 48 }; window.addEventListener('scroll', scrollFn, { passive: true }) })
onUnmounted(() => window.removeEventListener('scroll', scrollFn))
const scrollTo = (id: string, index: number) => {
  activeNav.value = index
  const el = document.getElementById(id)
  if (el) { const top = el.getBoundingClientRect().top + window.scrollY - 68; window.scrollTo({ top, behavior: 'smooth' }) }
}
</script>

<style>
@import './IndustryShared.css';
</style>
