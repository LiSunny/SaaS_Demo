<template>
  <div style="font-family:'Noto Sans SC','Outfit',-apple-system,sans-serif;min-height:100vh;background:#fafafa;">
    <!-- Nav (same style as PortalPage) -->
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

    <!-- Hero -->
    <section class="ind-hero" style="background-image:url(https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80);">
      <div class="ind-hero-grid"></div>
      <div class="ind-hero-content">
        <h1 class="ind-hero-title">{{ pageTitle }}</h1>
        <p class="ind-hero-sub">{{ pageSub }}</p>
      </div>
    </section>

    <!-- Content -->
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
                <div v-if="i % 2 === 0" class="journey-card">
                  <div class="journey-card-title">{{ j.title }}</div>
                  <div class="journey-card-role">{{ j.role }}</div>
                  <div class="journey-card-desc">{{ j.desc }}</div>
                  <div class="journey-card-shot"><Image :size="12" />{{ j.shot }}</div>
                </div>
                <div class="journey-dot"></div>
                <div class="journey-time">{{ j.time }}</div>
                <div v-if="i % 2 !== 0" class="journey-card">
                  <div class="journey-card-title">{{ j.title }}</div>
                  <div class="journey-card-role">{{ j.role }}</div>
                  <div class="journey-card-desc">{{ j.desc }}</div>
                  <div class="journey-card-shot"><Image :size="12" />{{ j.shot }}</div>
                </div>
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
import { ArrowRight, Utensils, ShieldAlert, Building, Image } from 'lucide-vue-next'
import { useMobileGuard } from '@/composables/useMobileGuard'
import MobileTipModal from '@/components/base/MobileTipModal.vue'

const { showMobileTip, copied, goExp, copyExpUrl } = useMobileGuard('/login')

const pageTitle = '校园安全管理'
const pageSub = '食堂全链条追溯、AI 声音防欺凌、宿舍电气消防巡检 —— 从"人管人"到"数据管安全"'

const scenes = [{
  id: 'food', icon: Utensils, title: '食品安全全链条管控', tagline: '从食材入库到留样到陪餐——全链条可追溯',
  roles: [{ person: '李师傅', name: '食堂管理员', duty: '食材采购入库、出库、库存管理' },{ person: '王姐', name: '食品安全员', duty: '每餐留样登记、后厨视频巡检' },{ person: '张老师', name: '陪餐人', duty: '每餐与学生同食、拍照评价' },{ person: '陈校长', name: '校长', duty: '第一责任人，大屏看全局' },{ person: '刘科长', name: '教育局', duty: '查看辖区学校食品安全数据' }],
  case: { date: '', text: '学校食堂食材来源不清、保质期靠人工记忆、留样不规范——出了问题无法追溯是哪批食材、哪个环节。"以包代管"的后果是校长只能听汇报，看不到后厨真实情况。', if: '食材入库扫码自动记录来源和保质期，过期自动拦截。每餐留样拍照上传、强制不少于 48 小时。校长打开手机就能看后厨实时画面——不是听汇报，是自己看。' },
  journey: [{ time: '05:00', title: '食材到货，扫码入库', role: '食堂管理员 · 李师傅', desc: '对着猪肉箱上的二维码一扫——供应商、检疫合格证号、保质期自动填入。确认入库，系统记录时间。', shot: '移动端食品入库扫码页' },{ time: '07:00', title: '早饭备好，留样拍照', role: '食品安全员 · 王姐', desc: '包子、粥、茶叶蛋各取一份装留样盒。录入编号、餐别、留样时间，拍照上传。每餐强制留样，不少于 48 小时。', shot: '移动端食品留样录入页' },{ time: '09:30', title: '校长看后厨大屏', role: '校长 · 陈校长', desc: '打开大屏看早餐检查状态：三个点位全部已完成。切换到明厨亮灶——后厨实时画面清晰可见。', shot: 'Web 大屏食品安全模块' },{ time: '11:30', title: '陪餐老师评价', role: '陪餐人 · 张老师', desc: '和学生一起吃完饭，打开 App 选餐别、评食品质量、评卫生环境、评从业人员规范，拍照提交。', shot: '移动端陪餐评价页' }],
  values: [{ role: '食堂管理员', desc: '所有食材有电子档案，来源可追溯、去向可追踪' },{ role: '校长', desc: '大屏一帧看后厨、台账、留样全貌——不是听汇报，是自己看' },{ role: '家长/学生', desc: '今天在学校吃了什么——不再是"不知道"而是"可以看"' }],
},{
  id: 'bully', icon: ShieldAlert, title: 'AI 防欺凌预警与处置', tagline: '声音识别补上监控盲区——厕所里有人求救，系统听得到',
  roles: [{ person: 'AI', name: 'AI 检测系统', duty: '声音识别设备，检测打架、关键词、SOS' },{ person: '刘老师', name: '安全干部', duty: '大屏收到告警后分级判断、通知保安' },{ person: '张师傅', name: '校园保安', duty: '到场处置、拍照回执' },{ person: '马老师', name: '班主任/德育主任', duty: '事件跟进、心理辅导、家校沟通' }],
  case: { date: '', text: '宿舍、厕所是监控盲区。欺凌发生时无人知晓——被打的孩子不敢说，目睹的同学不敢管。直到出了大事回头查，才发现已经持续了几个月。', if: '在宿舍和厕所部署 AI 声音识别，捕捉求救关键词和异常声响。检测到风险即刻推送告警——保安在 3 分钟内到场，把事态控制在升级之前。' },
  journey: [{ time: '13:10', title: '厕所传出尖叫声', role: 'AI 检测系统', desc: '三楼女生厕所。声音传感器捕捉关键词："你再说一遍试试""别打我"——紧接着一声撞击和哭泣。系统触发红色告警。', shot: 'Web 端关键词库配置页' },{ time: '13:12', title: '大屏弹窗，值班员看到', role: '安全干部 · 刘老师', desc: '大屏右上角弹出红色告警条。刘老师放下筷子，点击详情——回听了 5 秒声音片段——有人哭，有指责声。点击"确认接警"，推送到保安手机。', shot: 'Web 大屏防欺凌告警弹窗' },{ time: '13:15', title: '保安到场，控制现场', role: '校园保安 · 张师傅', desc: '手机上收到推送：女生宿舍三楼西侧卫生间。赶到现场分开双方。拍照记录（模糊人像），填写到场时间和初步处置。', shot: '移动端事件处置页' },{ time: '13:30', title: '班主任跟进，系统闭环', role: '德育主任 · 马老师', desc: '打开 Web 端查看完整时间线：13:10 检测→13:12 确认→13:15 到场。录入事件描述和后续处理——家长约谈、心理辅导、纪律教育。', shot: 'Web 端事件时间线详情' }],
  values: [{ role: 'AI 检测', desc: '用声音补上摄像头盲区——宿舍和厕所' },{ role: '安全干部', desc: 'AI 先筛一遍，弹出告警再判断——不是扫几十路监控' },{ role: '校长', desc: '欺凌高发在哪、什么时段——数据会说话' }],
},{
  id: 'dorm', icon: Building, title: '宿舍安全与应急联动', tagline: '消防设备有没有水、烟感有没有电——不是等出事才知道',
  roles: [{ person: '周阿姨', name: '宿舍管理员', duty: '每日巡查、核实通道畅通、排查火种' },{ person: '王师傅', name: '校园保安', duty: '按巡逻点位打卡、设备检查' },{ person: '赵老师', name: '安全干部', duty: '大屏监控报警设备状态、消防巡检率' },{ person: '孙老师', name: '班主任', duty: '入寝查房、排查违禁品、履职打卡' }],
  case: { date: '', text: '消火栓有没有水、烟感有没有电——没人定期核实。宿舍管理员靠人脑记谁在谁不在，违禁品排查全靠翻。一次漏查可能就是一场灾难。', if: '烟感在线状态实时大屏，异常自动告警。宿管扫码巡更、班主任入寝查房拍照留痕——每个安全环节都有数字脚印。' },
  journey: [{ time: '07:00', title: '保安巡楼', role: '校园保安 · 王师傅', desc: '走到一楼走廊尽头，扫描墙上二维码——系统确认位置。检查消防栓在位、灭火器压力绿区、走廊畅通。22 个点位，15 分钟全走完。', shot: '移动端巡更检查页' },{ time: '07:30', title: '班主任查违禁品', role: '班主任 · 孙老师', desc: '306 室 8 个学生全员在位。翻到上铺枕头下没收了一个插线板。拍照录入——系统记录违禁品类型、位置、时间。', shot: '移动端班主任履职打卡页' },{ time: '09:00', title: '电消巡检', role: '保安队 · 张师傅', desc: '今天重点查电气。走到 3 楼配电间，扫码弹出检查项——配电箱温度。掏出测温枪：42°C，正常。拍照、填数据、提交。', shot: 'Web 大屏电消巡检模块' },{ time: '14:30', title: '盯大屏：报警设备在线', role: '安全干部 · 赵老师', desc: '左侧"安消报警联动"模块——男生宿舍手报正常、女生宿舍手报正常、一键声光报警器响警号中。点进详情——确认是施工误触发，处理记录。', shot: 'Web 大屏安消报警联动组件' },{ time: '18:30', title: '校长复盘', role: '校长 · 吴校长', desc: '打开大屏：应急联动全部在线。教师履职 12 项已全面落实，保安巡更全覆盖。应急预案 8 类卡片，点开"消防灭火"看分工和逃生路线。', shot: 'Web 大屏履职+预案模块' }],
  values: [{ role: '宿舍管理员', desc: '扫码定位+拍照验证——每天的工作是数字轨迹' },{ role: '值班干部', desc: '报警设备状态实时大屏——不用等人来敲门' },{ role: '校长', desc: '巡检覆盖率、在线率、履职率——三眼就够' }],
}]
const navItems = [{ id: 'food', nav: '食品安全' },{ id: 'bully', nav: 'AI 防欺凌' },{ id: 'dorm', nav: '宿舍安全' }]

const scrolled = ref(false)
const activeNav = ref(0)

let scrollFn: () => void
onMounted(() => {
  scrollFn = () => { scrolled.value = window.scrollY > 48 }
  window.addEventListener('scroll', scrollFn, { passive: true })
})
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
