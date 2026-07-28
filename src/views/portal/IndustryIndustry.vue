<template>
  <div style="font-family:'Noto Sans SC','Outfit',-apple-system,sans-serif;min-height:100vh;background:#fafafa;">
    <nav class="nav" :class="{ scrolled }">
      <div class="nav-inner">
        <a href="/portal" class="nav-brand">
          <img class="nav-logo" src="/favicon.svg" alt="logo" width="28" height="28" />
          <span class="nav-name" :class="{ scrolled }">韧性云</span>
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
    <section class="ind-hero" style="background-image:url(https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80);">
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
              <img class="role-avatar" :src="`https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(r.person)}`" :alt="r.person" loading="lazy" />
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
import { ArrowRight, Monitor, ScanEye, AlertTriangle, Bell, Image } from 'lucide-vue-next'
import { useMobileGuard } from '@/composables/useMobileGuard'
import MobileTipModal from '@/components/base/MobileTipModal.vue'

const { showMobileTip, copied, goExp } = useMobileGuard('/login')

const pageTitle = '工贸企业安全管理'
const pageSub = '从设备台账到告警值守 —— 五个独立场景，覆盖工厂安全全链路'

const scenes = [{
  id: 'device', icon: Monitor, title: '设备台账与保养', tagline: '几百台设备哪台该保养——不再靠人脑记',
  roles: [{ person: '老刘', name: '设备管理员', duty: '设备建档、二维码管理、保养计划配置' },{ person: '小王', name: '维保工程师', duty: '接收保养任务、到场执行、拍照留痕' },{ person: '周总', name: '企业负责人', duty: '大屏看设备在线率、保养完成率' }],
  case: { date: '', text: '几百台设备，哪台该保养、哪台快过期——全靠人脑记和纸质台账。一台关键设备状态异常无人发现，可能就是一次停产或事故。', if: '每台设备有数字档案，保养周期系统自动计算、到期自动推送任务。状态异常亮灯告警——不是等人发现，是系统主动告诉你。' },
  journey: [{ time: '08:00', title: '看台账，标黄就是关注', role: '设备管理员 · 老刘', desc: '打开台账，347 台设备按分类展开——消防水泵 3 台即将过保亮黄、叉车 1 台已逾期 5 天亮红。截图给维保主管。', shot: 'Web 端设备台账列表页' },{ time: '09:30', title: '接到任务，扫码保养', role: '维保工程师 · 小王', desc: '收到推送："消防水泵-B1-03 季度保养，今日截止。"下到地下一层，扫描水泵二维码——弹出检查清单。逐项检查、拍照、提交。', shot: '移动端保养执行页' },{ time: '14:00', title: '看态势：一台离线了', role: '企业负责人 · 周总', desc: '大屏：在线率 96%、保养完成率 92%、3 台过保、1 台离线。点进——3 号车间配电箱昨晚起离线。打电话给车间主任："去看一眼。"', shot: 'Web 端设备状态看板' }],
  values: [{ role: '设备管理员', desc: '几百台设备保养周期系统自动算、自动提醒' },{ role: '维保工程师', desc: '任务推送→扫码执行→自动记录' },{ role: '企业负责人', desc: '在线率和保养率——两个数字掌握全局' }],
},{
  id: 'patrol', icon: ScanEye, title: '巡查检查', tagline: '巡检员到没到现场、查了什么——扫码打卡，轨迹可验',
  roles: [{ person: '张工', name: '安全管理员', duty: '配置巡查计划、项目频次，看巡查报表' },{ person: '王师傅', name: '巡检员', duty: '按任务到点位扫码打卡、逐项检查' },{ person: '小陈', name: '整改责任人', duty: '收到异常通知后到场处理、拍照回执' }],
  case: { date: '', text: '巡检员到底去没去现场、查了什么——靠纸质签到和口头汇报。检查过了但问题没查出来——因为没有结构化检查清单引导，纯凭经验。', if: '扫码验证位置，结构化清单逐项引导，拍照上传不可跳过。异常自动流转整改——巡检从"走一圈"变成"有数据可查"。' },
  journey: [{ time: '08:00', title: '看今天的巡查任务', role: '安全管理员 · 张工', desc: '今天 3 条任务已自动生成——A 区消防设施 12 点位、B 车间设备 8 点位、C 库房 5 点位。三个巡检员手机上都收到了。', shot: 'Web 端巡查任务管理页' },{ time: '09:00', title: '到点位，扫码打卡', role: '巡检员 · 王师傅', desc: '走到"消防栓-01"，扫码弹出检查单。逐项确认，拍照提交。12 个点位逐一完成——2 个异常标注。', shot: '移动端扫码巡查页' },{ time: '10:30', title: '异常流转，整改到场', role: '整改人 · 小陈', desc: '手机收到两条异常：灭火器压力偏低、应急灯不亮。带备件逐个到场更换。同角度拍照——异常前和修复后对比。', shot: '移动端异常处理页' }],
  values: [{ role: '安全管理员', desc: '任务自动生成分发，完成率实时可见' },{ role: '巡检员', desc: '扫码定位验证，检查清单引导——不凭记忆' },{ role: '企业负责人', desc: '覆盖率、异常率——判断巡查是否落到实处' }],
},{
  id: 'hazard', icon: AlertTriangle, title: '隐患整改闭环', tagline: '隐患说给班组长没用——全链路跟踪，超时自动亮红',
  roles: [{ person: '赵师傅', name: '隐患上报人', duty: '发现隐患拍照描述提交' },{ person: '张工', name: '安全管理员', duty: '审核、分派、设期限、确认验收' },{ person: '王师傅', name: '整改责任人', duty: '接到任务到场处理、前后对比拍照' },{ person: '李科长', name: '监管方', duty: '查看辖区隐患闭环率、超期清单' }],
  case: { date: '', text: '隐患上报了但没人跟——班组长说了、安全员记了，但闭环在哪个环节断了谁也不知道。直到出事回头看，才发现那条隐患三个月前就报过。', if: '每条隐患从上报到闭环有时间戳和前后对比图。超期自动亮红提醒管理方——"在跟了"变成"已闭环"。' },
  journey: [{ time: '08:30', title: '发现隐患，上报', role: '巡检员 · 赵师傅', desc: 'B 车间东侧消防通道被纸箱杂物占一半。拍照→选"消防通道堵塞"→填描述→提交。', shot: '移动端隐患上报页' },{ time: '09:00', title: '分派整改人，设期限', role: '安全管理员 · 张工', desc: '确认为有效隐患。点击分派给 B 车间班长王师傅，期限今日 17:00。系统推送至王师傅手机。', shot: 'Web 端隐患分派页' },{ time: '10:00', title: '整改，拍对比照', role: '整改人 · 王师傅', desc: '手机收到推送。安排人把纸箱清走，站在同角度拍通道畅通的对比图——"堵→通"一目了然。', shot: '移动端整改上传页' },{ time: '14:00', title: '验收闭环', role: '安全管理员 · 张工', desc: '看对比照片——通道清空了。点"确认验收"，系统记录确认人、时间。"已闭环"出现在台账中。', shot: 'Web 端隐患台账' },{ time: '17:00', title: '超期自动亮红', role: '系统 + 管理方', desc: '大屏上 1 条隐患标红——"超期未整改"。灭火器隐患昨天到期还没交。管理方决定明天去店里看。', shot: 'Web 端超期隐患标记' }],
  values: [{ role: '隐患上报人', desc: '上报即有记录——"我说过了"变成"系统里有"' },{ role: '安全管理员', desc: '分派→跟踪→验收，一步不可跳过，超时自动提醒' },{ role: '监管方', desc: '辖区闭环率、超期数——不需到现场' }],
},{
  id: 'alert', icon: Bell, title: '告警与值守', tagline: '消控室无人、系统被静音——大屏弹窗 + 批量处置',
  roles: [{ person: '李明辉', name: '消控值班员', duty: '24h 值守，告警弹窗响应、分级确认、一键核实' },{ person: '张工', name: '安全管理员', duty: '配置联动规则、看告警趋势' },{ person: '刘师傅', name: '处置人员', duty: '收到推送到场核实、处置、拍照回执' }],
  case: { date: '', text: '消控室晚上没人值班、报警系统被静音——不是没有报警，是没有人响应。批量误报消耗精力，真正危险的告警反而被淹没在海量通知里。', if: '大屏实时弹窗推送至值班员手机，系统自动记录响应时间。批量确认误报一键处理，精力留给真正需要警觉的告警。' },
  journey: [{ time: '07:30', title: '交接班：看过去 12 小时', role: '消控值班员 · 李明辉', desc: '系统展示：总告警 47 条、已确认 45、待确认 2（灰尘误报）、真实告警 4（均处置）、1 台设备离线。确认 2 条误报，为离线水泵建工单。', shot: 'Web 端值班工作台交接班页' },{ time: '10:15', title: '告警弹窗！火警响起', role: '消控值班员 · 李明辉', desc: '大屏红色告警条：1 号厂房二层烟感 ×2。调实时监控——没烟雾火光。判定焊接误报，推送巡检员核实，6 分钟闭环。', shot: 'Web 端告警弹窗+实时视频' },{ time: '11:00', title: '批量确认误报', role: '消控值班员 · 李明辉', desc: '装修施工连续触发 4 条烟感——全是误报。勾选全部→一键关联理由→批量关闭。精力留给真实的、需要警觉的告警。', shot: 'Web 端告警列表批量操作' },{ time: '14:30', title: '看告警趋势', role: '安全管理员 · 张工', desc: '近 30 天趋势：火警 2、故障 47、误报 689。某区域上周起告警密度翻倍——和工厂装修同期。决定：降低装修区域灵敏度，夜间正常。', shot: 'Web 端告警趋势分析' }],
  values: [{ role: '消控值班员', desc: '弹窗+视频分辨真假，批量确认省重复点击' },{ role: '安全管理员', desc: '告警趋势自动生成——哪里多了、响应慢了' },{ role: '企业负责人', desc: '响应率和平均时间——判断值守团队在不在状态' }],
}]
const navItems = [{ id: 'device', nav: '设备保养' },{ id: 'patrol', nav: '巡查检查' },{ id: 'hazard', nav: '隐患整改' },{ id: 'alert', nav: '告警值守' }]

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
