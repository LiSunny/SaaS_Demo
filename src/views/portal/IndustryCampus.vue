<template>
  <div style="font-family:'Noto Sans SC','Outfit',-apple-system,sans-serif;min-height:100vh;background:#fafafa;">
    <section class="ind-hero">
      <div class="ind-hero-grid"></div>
      <div class="ind-hero-content">
        <a href="/portal" class="ind-back"><ChevronLeft :size="16" />场景总览</a>
        <h1 class="ind-hero-title">校园安全管理</h1>
        <p class="ind-hero-sub">食堂全链条追溯、AI 声音防欺凌、宿舍电气消防巡检 —— 从"人管人"到"数据管安全"</p>
      </div>
    </section>
    <div class="sticky-nav" ref="stickyNav">
      <div class="sticky-nav-inner">
        <a v-for="sc in navItems" :key="sc.id" :href="`#${sc.id}`" class="sticky-nav-link" @click.prevent="scrollTo(sc.id)">{{ sc.nav }}</a>
        <a href="#shared" class="sticky-nav-link shared-link" @click.prevent="scrollTo('shared')">动火作业</a>
      </div>
    </div>
    <div class="ind-sec-wrap">
      <section v-for="sc in scenes" :key="sc.id" :id="sc.id" class="scene-section">
        <div class="scene-header">
          <div class="scene-icon"><component :is="sc.icon" :size="22" color="#3678E3" /></div>
          <div><h2 class="scene-title">{{ sc.title }}</h2><p class="scene-tagline">{{ sc.tagline }}</p></div>
        </div>
        <div class="scene-roles">
          <span class="scene-label">涉及角色</span>
          <div class="scene-roles-row">
            <span v-for="r in sc.roles" :key="r.name" class="role-chip"><span class="role-chip-dot"></span>{{ r.name }}<span class="role-chip-desc"> · {{ r.duty }}</span></span>
          </div>
        </div>
        <div class="scene-body">
          <div class="case-card">
            <div class="case-quote-mark">"</div>
            <div class="case-content">
              <div class="case-head"><span class="case-badge">真实案例</span><span class="case-date">{{ sc.case.date }}</span></div>
              <p class="case-text" v-html="sc.case.text"></p>
              <p class="case-if">{{ sc.case.if }}</p>
            </div>
          </div>
          <div class="journey">
            <span class="scene-label">典型一天</span>
            <div class="journey-track">
              <div v-for="(j, i) in sc.journey" :key="i" class="journey-node" :class="i % 2 === 0 ? 'up' : 'down'">
                <div v-if="i % 2 === 0" class="journey-card">
                  <div class="journey-card-title">{{ j.title }}</div>
                  <div class="journey-card-role">{{ j.role }}</div>
                  <div class="journey-card-desc">{{ j.desc }}</div>
                  <div class="journey-card-shot">📷 {{ j.shot }}</div>
                </div>
                <div class="journey-dot"></div>
                <div class="journey-time">{{ j.time }}</div>
                <div v-if="i % 2 !== 0" class="journey-card">
                  <div class="journey-card-title">{{ j.title }}</div>
                  <div class="journey-card-role">{{ j.role }}</div>
                  <div class="journey-card-desc">{{ j.desc }}</div>
                  <div class="journey-card-shot">📷 {{ j.shot }}</div>
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
      </section>
      <section id="shared" class="scene-section shared-scene" @click="$router.push('/portal/hotwork')">
        <div class="scene-header">
          <div class="scene-icon" style="background:rgba(217,119,6,.1);"><Flame :size="22" color="#d97706" /></div>
          <div><h2 class="scene-title">动火作业管理</h2><p class="scene-tagline">跨行业共享场景 · 15 步 × 4 阶段审批，食堂维修、实验室改造同样适用</p></div>
          <ArrowRight :size="16" color="#d97706" />
        </div>
      </section>
    </div>
    <section class="ind-cta"><a href="/portal" class="ind-cta-btn">← 返回场景总览</a></section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronLeft, ArrowRight, Flame, Utensils, ShieldAlert, Building } from 'lucide-vue-next'

const scenes = [{
  id: 'food', icon: Utensils, title: '食品安全全链条管控', tagline: '从食材入库到留样到陪餐——全链条可追溯',
  roles: [{ name: '食堂管理员', duty: '食材采购入库、出库、库存管理' },{ name: '食品安全员', duty: '每餐留样登记、后厨视频巡检' },{ name: '陪餐人', duty: '每餐与学生同食、拍照评价' },{ name: '校长', duty: '第一责任人，大屏看全局' },{ name: '教育局', duty: '查看辖区学校食品安全数据' }],
  case: { date: '2024 年 10 月 · 昆明长丰学校', text: '家长在食堂发现生猪肉散发臭味。承包食堂的公司不具备餐饮服务资质，学校"以包代管"。<strong>校长被免职，企业被罚 578 万元。</strong>', if: '如果 — 食材入库时有电子台账记录来源和保质期、出库时系统拦截过期食材、校长的手机上有后厨实时画面' },
  journey: [{ time: '05:00', title: '食材到货，扫码入库', role: '食堂管理员 · 李师傅', desc: '对着猪肉箱上的二维码一扫——供应商、检疫合格证号、保质期自动填入。确认入库，系统记录时间。', shot: '移动端食品入库扫码页' },{ time: '07:00', title: '早饭备好，留样拍照', role: '食品安全员 · 王姐', desc: '包子、粥、茶叶蛋各取一份装留样盒。录入编号、餐别、留样时间，拍照上传。每餐强制留样，不少于 48 小时。', shot: '移动端食品留样录入页' },{ time: '09:30', title: '校长看后厨大屏', role: '校长 · 陈校长', desc: '打开大屏看早餐检查状态：三个点位全部已完成。切换到明厨亮灶——后厨实时画面清晰可见。', shot: 'Web 大屏食品安全模块' },{ time: '11:30', title: '陪餐老师评价', role: '陪餐人 · 张老师', desc: '和学生一起吃完饭，打开 App 选餐别、评食品质量、评卫生环境、评从业人员规范，拍照提交。', shot: '移动端陪餐评价页' }],
  values: [{ role: '食堂管理员', desc: '所有食材有电子档案，来源可追溯、去向可追踪' },{ role: '校长', desc: '大屏一帧看后厨、台账、留样全貌——不是听汇报，是自己看' },{ role: '家长/学生', desc: '今天在学校吃了什么——不再是"不知道"而是"可以看"' }],
},{
  id: 'bully', icon: ShieldAlert, title: 'AI 防欺凌预警与处置', tagline: '声音识别补上监控盲区——厕所里有人求救，系统听得到',
  roles: [{ name: 'AI 检测系统', duty: '声音识别设备，检测打架、关键词、SOS' },{ name: '安全干部', duty: '大屏收到告警后分级判断、通知保安' },{ name: '校园保安', duty: '到场处置、拍照回执' },{ name: '班主任/德育主任', duty: '事件跟进、心理辅导、家校沟通' }],
  case: { date: '2024 年 10 月 · 安徽凤台', text: '一名 13 岁初一男生被 5 名初二学生带到宿舍殴打、掐脖致死。之前已被反复欺凌，但没有一个系统发现过。<strong>如果他的求救能被听到——一切会不一样。</strong>', if: '如果 — 宿舍和厕所部署了声音识别，当"救命""别打我"被说出时，大屏弹窗、保安在 3 分钟内到场' },
  journey: [{ time: '13:10', title: '厕所传出尖叫声', role: 'AI 检测系统', desc: '三楼女生厕所。声音传感器捕捉关键词："你再说一遍试试""别打我"——紧接着一声撞击和哭泣。系统触发红色告警。', shot: 'Web 端关键词库配置页' },{ time: '13:12', title: '大屏弹窗，值班员看到', role: '安全干部 · 刘老师', desc: '大屏右上角弹出红色告警条。刘老师放下筷子，点击详情——回听了 5 秒声音片段——有人哭，有指责声。点击"确认接警"，推送到保安手机。', shot: 'Web 大屏防欺凌告警弹窗' },{ time: '13:15', title: '保安到场，控制现场', role: '校园保安 · 张师傅', desc: '手机上收到推送：女生宿舍三楼西侧卫生间。赶到现场分开双方。拍照记录（模糊人像），填写到场时间和初步处置。', shot: '移动端事件处置页' },{ time: '13:30', title: '班主任跟进，系统闭环', role: '德育主任 · 马老师', desc: '打开 Web 端查看完整时间线：13:10 检测→13:12 确认→13:15 到场。录入事件描述和后续处理——家长约谈、心理辅导、纪律教育。', shot: 'Web 端事件时间线详情' }],
  values: [{ role: 'AI 检测', desc: '用声音补上摄像头盲区——宿舍和厕所' },{ role: '安全干部', desc: 'AI 先筛一遍，弹出告警再判断——不是扫几十路监控' },{ role: '校长', desc: '欺凌高发在哪、什么时段——数据会说话' }],
},{
  id: 'dorm', icon: Building, title: '宿舍安全与应急联动', tagline: '消防设备有没有水、烟感有没有电——不是等出事才知道',
  roles: [{ name: '宿舍管理员', duty: '每日巡查、核实通道畅通、排查火种' },{ name: '校园保安', duty: '按巡逻点位打卡、设备检查' },{ name: '安全干部', duty: '大屏监控报警设备状态、消防巡检率' },{ name: '班主任', duty: '入寝查房、排查违禁品、履职打卡' }],
  case: { date: '2024 年 1 月 19 日 · 河南方城英才学校', text: '8 岁孩子用打火机烧被子线头。56 平米的宿舍住 34 人，消火栓没水，烟感没电，宿管员没有第一时间报警。<strong>13 个孩子没能活着出来，4 人受伤。</strong>', if: '如果 — 烟感有电并发出警报、消火栓有水、宿管员在系统推送时立即响应、打火机在入寝前被排查出来' },
  journey: [{ time: '07:00', title: '保安巡楼', role: '校园保安 · 王师傅', desc: '走到一楼走廊尽头，扫描墙上二维码——系统确认位置。检查消防栓在位、灭火器压力绿区、走廊畅通。22 个点位，15 分钟全走完。', shot: '移动端巡更检查页' },{ time: '07:30', title: '班主任查违禁品', role: '班主任 · 孙老师', desc: '306 室 8 个学生全员在位。翻到上铺枕头下没收了一个插线板。拍照录入——系统记录违禁品类型、位置、时间。', shot: '移动端班主任履职打卡页' },{ time: '09:00', title: '电消巡检', role: '保安队 · 张师傅', desc: '今天重点查电气。走到 3 楼配电间，扫码弹出检查项——配电箱温度。掏出测温枪：42°C，正常。拍照、填数据、提交。', shot: 'Web 大屏电消巡检模块' },{ time: '14:30', title: '盯大屏：报警设备在线', role: '安全干部 · 赵老师', desc: '左侧"安消报警联动"模块——男生宿舍手报正常、女生宿舍手报正常、一键声光报警器响警号中。点进详情——确认是施工误触发，处理记录。', shot: 'Web 大屏安消报警联动组件' },{ time: '18:30', title: '校长复盘', role: '校长 · 吴校长', desc: '打开大屏：应急联动全部在线。教师履职 12 项已全面落实，保安巡更全覆盖。应急预案 8 类卡片，点开"消防灭火"看分工和逃生路线。', shot: 'Web 大屏履职+预案模块' }],
  values: [{ role: '宿舍管理员', desc: '扫码定位+拍照验证——每天的工作是数字轨迹' },{ role: '值班干部', desc: '报警设备状态实时大屏——不用等人来敲门' },{ role: '校长', desc: '巡检覆盖率、在线率、履职率——三眼就够' }],
}]
const navItems = [{ id: 'food', nav: '食品安全' },{ id: 'bully', nav: 'AI 防欺凌' },{ id: 'dorm', nav: '宿舍安全' }]

const stickyNav = ref<HTMLElement | null>(null)
const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) { const top = el.getBoundingClientRect().top + window.scrollY - (stickyNav.value?.offsetHeight || 48) - 16; window.scrollTo({ top, behavior: 'smooth' }) }
}
</script>

<style scoped>
.ind-hero { position:relative; min-height:32vh; display:flex; align-items:center; background:linear-gradient(160deg,#162d5e,#1e4080); overflow:hidden; }
.ind-hero-grid { position:absolute; inset:0; opacity:.04; background-image:linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px); background-size:80px 80px; }
.ind-hero-content { position:relative; max-width:800px; margin:0 auto; padding:56px 32px; text-align:center; }
.ind-back { display:inline-flex; align-items:center; gap:6px; font-size:14px; color:rgba(255,255,255,.7); text-decoration:none; margin-bottom:24px; transition:color .2s; }
.ind-back:hover { color:#fff; }
.ind-hero-title { font-size:clamp(1.75rem,5vw,2.5rem); font-weight:900; color:#fff; font-family:'Outfit','Noto Sans SC',sans-serif; margin:0 0 12px; }
.ind-hero-sub { font-size:15px; color:rgba(255,255,255,.7); line-height:1.7; max-width:500px; margin:0 auto; }
.sticky-nav { position:sticky; top:0; z-index:20; background:rgba(255,255,255,.92); backdrop-filter:blur(12px); border-bottom:1px solid rgba(54,120,227,.12); }
.sticky-nav-inner { max-width:1200px; margin:0 auto; padding:0 32px; display:flex; gap:0; overflow-x:auto; }
.sticky-nav-link { font-size:14px; font-weight:500; color:rgba(16,16,16,.7); text-decoration:none; padding:14px 20px; white-space:nowrap; border-bottom:2px solid transparent; transition:all .2s; }
.sticky-nav-link:hover { color:#3678E3; }
.sticky-nav-link.shared-link { color:#d97706; margin-left:auto; }
.ind-sec-wrap { max-width:1200px; margin:0 auto; padding:32px 32px 0; }
.scene-section { background:#fff; border:1px solid rgba(54,120,227,.12); border-radius:14px; padding:36px; margin-bottom:24px; scroll-margin-top:80px; }
.scene-section.shared-scene { background:rgba(217,119,6,.06); border-color:rgba(217,119,6,.2); cursor:pointer; transition:all .3s; }
.scene-section.shared-scene:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(217,119,6,.08); }
.scene-header { display:flex; align-items:flex-start; gap:16px; margin-bottom:24px; }
.scene-header .scene-icon { width:44px; height:44px; border-radius:10px; background:rgba(54,120,227,.12); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.scene-title { font-size:20px; font-weight:700; color:#101010; font-family:'Outfit','Noto Sans SC',sans-serif; margin:0 0 4px; }
.scene-tagline { font-size:14px; color:rgba(16,16,16,.7); margin:0; }
.scene-label { font-size:14px; font-weight:600; color:rgba(16,16,16,.75); text-transform:uppercase; letter-spacing:.1em; display:block; margin-bottom:12px; font-family:'Outfit','Noto Sans SC',sans-serif; }
.scene-roles { margin-bottom:28px; }
.scene-roles-row { display:flex; flex-wrap:wrap; gap:8px; }
.role-chip { display:inline-flex; align-items:center; gap:6px; font-size:14px; color:rgba(16,16,16,.7); background:rgba(54,120,227,.12); border:1px solid rgba(54,120,227,.25); border-radius:8px; padding:6px 12px; }
.role-chip-dot { width:5px; height:5px; border-radius:50%; background:#3678E3; flex-shrink:0; }
.role-chip-desc { color:rgba(16,16,16,.75); }
.scene-body { display:flex; flex-direction:column; gap:36px; margin-bottom:28px; }
.case-card { position:relative; background:linear-gradient(135deg,rgba(220,38,38,.06),rgba(220,38,38,.04)); border:1px solid rgba(220,38,38,.22); border-radius:12px; padding:24px 24px 24px 44px; }
.case-quote-mark { position:absolute; top:12px; left:14px; font-size:36px; font-weight:900; color:rgba(220,38,38,.35); line-height:1; font-family:Georgia,serif; }
.case-head { display:flex; align-items:center; gap:10px; margin-bottom:12px; }
.case-badge { font-size:14px; font-weight:700; color:#dc2626; background:rgba(220,38,38,.15); padding:2px 8px; border-radius:4px; text-transform:uppercase; letter-spacing:.08em; }
.case-date { font-size:14px; color:rgba(16,16,16,.75); }
.case-text { font-size:14px; color:rgba(16,16,16,.7); line-height:1.75; margin:0 0 12px; }
.case-if { font-size:14px; color:rgba(54,120,227,.85); line-height:1.65; margin:0; padding:10px 14px; background:rgba(54,120,227,.12); border-radius:6px; border-left:2px solid rgba(54,120,227,.3); }
/* Journey horizontal zigzag */
.journey-track { position:relative; display:flex; justify-content:space-between; padding:60px 0 40px; }
.journey-track::before { content:''; position:absolute; left:8%; right:8%; top:50%; height:1px; background:rgba(54,120,227,.25); }
.journey-node { position:relative; flex:1; display:flex; flex-direction:column; align-items:center; min-width:0; }
.journey-node.up { justify-content:flex-start; }
.journey-node.up .journey-card { order:0; margin-bottom:10px; }
.journey-node.up .journey-dot { order:1; }
.journey-node.up .journey-time { order:2; margin-top:10px; }
.journey-node.down { justify-content:flex-end; }
.journey-node.down .journey-time { order:0; margin-bottom:10px; }
.journey-node.down .journey-dot { order:1; }
.journey-node.down .journey-card { order:2; margin-top:10px; }
.journey-time { font-size:14px; font-weight:700; color:#3678E3; font-family:'Outfit','Noto Sans SC',sans-serif; white-space:nowrap; }
.journey-dot { width:10px; height:10px; border-radius:50%; background:#3678E3; border:2px solid #fff; box-shadow:0 0 0 2px rgba(54,120,227,.25); z-index:1; flex-shrink:0; }
.journey-card { max-width:240px; background:#fff; border:1px solid rgba(54,120,227,.25); border-radius:10px; padding:14px 16px; box-shadow:0 2px 12px rgba(0,0,0,.04); }
.journey-card-title { font-size:14px; font-weight:600; color:#101010; margin-bottom:4px; }
.journey-card-role { font-size:14px; color:#3678E3; font-weight:500; margin-bottom:6px; }
.journey-card-desc { font-size:14px; color:rgba(16,16,16,.7); line-height:1.6; margin-bottom:6px; }
.journey-card-shot { font-size:14px; color:rgba(16,16,16,.7) }
@media (max-width:900px) { .journey-track { flex-direction:column; padding-left:48px; }
  .journey-track::before { left:24px; right:auto; top:0; bottom:0; width:1px; height:auto; }
  .journey-node { flex-direction:row !important; align-items:flex-start; gap:12px; margin-bottom:24px; }
  .journey-node .journey-time { margin:0 !important; white-space:nowrap; position:absolute; left:-56px; top:10px; width:44px; text-align:right; }
  .journey-node .journey-dot { position:absolute; left:-38px; top:14px; margin:0 !important; }
  .journey-node .journey-card { max-width:none; order:3 !important; margin:0 !important; margin-left:12px !important; }
}

.scene-value { }
.scene-value-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
@media (max-width:768px) { .scene-value-grid { grid-template-columns:1fr; } }
.value-item { background:rgba(54,120,227,.12); border:1px solid rgba(54,120,227,.12); border-radius:8px; padding:14px 16px; }
.value-role { display:block; font-size:14px; font-weight:600; color:#3678E3; margin-bottom:4px; }
.value-desc { display:block; font-size:14px; color:rgba(16,16,16,.75); line-height:1.55; }
.ind-cta { padding:0 32px 64px; text-align:center; }
.ind-cta-btn { display:inline-flex; align-items:center; gap:8px; font-size:14px; font-weight:600; color:#3678E3; text-decoration:none; padding:12px 28px; border:1px solid rgba(54,120,227,.2); border-radius:8px; transition:all .2s; }
.ind-cta-btn:hover { background:#3678E3; color:#fff; }
</style>
