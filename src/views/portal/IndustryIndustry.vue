<template>
  <div style="font-family:'Noto Sans SC','Outfit',-apple-system,sans-serif;min-height:100vh;background:#fafafa;">
    <section class="ind-hero">
      <div class="ind-hero-grid"></div>
      <div class="ind-hero-content">
        <a href="/portal" class="ind-back"><ChevronLeft :size="16" />场景总览</a>
        <h1 class="ind-hero-title">工贸企业安全管理</h1>
        <p class="ind-hero-sub">从设备台账到告警值守 —— 五个独立场景，覆盖工厂安全全链路</p>
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
                <div v-if="i % 2 === 0" class="journey-card"><div class="journey-card-title">{{ j.title }}</div><div class="journey-card-role">{{ j.role }}</div><div class="journey-card-desc">{{ j.desc }}</div><div class="journey-card-shot">📷 {{ j.shot }}</div></div>
                <div class="journey-dot"></div>
                <div class="journey-time">{{ j.time }}</div>
                <div v-if="i % 2 !== 0" class="journey-card"><div class="journey-card-title">{{ j.title }}</div><div class="journey-card-role">{{ j.role }}</div><div class="journey-card-desc">{{ j.desc }}</div><div class="journey-card-shot">📷 {{ j.shot }}</div></div>
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
          <div><h2 class="scene-title">动火作业管理</h2><p class="scene-tagline">跨行业共享场景 · 15 步 × 4 阶段审批，合规报告一键导出 PDF</p></div>
          <ArrowRight :size="16" color="#d97706" />
        </div>
      </section>
    </div>
    <section class="ind-cta"><a href="/portal" class="ind-cta-btn">← 返回场景总览</a></section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronLeft, ArrowRight, Flame, Monitor, ScanEye, AlertTriangle, Bell } from 'lucide-vue-next'

const scenes = [{
  id: 'device', icon: Monitor, title: '设备台账与保养', tagline: '几百台设备哪台该保养——不再靠人脑记',
  roles: [{ name: '设备管理员', duty: '设备建档、二维码管理、保养计划配置' },{ name: '维保工程师', duty: '接收保养任务、到场执行、拍照留痕' },{ name: '企业负责人', duty: '大屏看设备在线率、保养完成率' }],
  case: { date: '2024 年 1 月 · 常州燊荣公司', text: '湿法除尘器水泵堵塞无水运行——但<strong>没有人知道</strong>，因为没有设备状态监测。铝合金粉尘积聚，静电引爆，<strong>8 死 8 伤</strong>。', if: '如果 — 每台设备有数字档案、状态异常自动亮灯、保养到期自动推送任务' },
  journey: [{ time: '08:00', title: '看台账，标黄就是关注', role: '设备管理员 · 老刘', desc: '打开台账，347 台设备按分类展开——消防水泵 3 台即将过保亮黄、叉车 1 台已逾期 5 天亮红。截图给维保主管。', shot: 'Web 端设备台账列表页' },{ time: '09:30', title: '接到任务，扫码保养', role: '维保工程师 · 小王', desc: '收到推送："消防水泵-B1-03 季度保养，今日截止。"下到地下一层，扫描水泵二维码——弹出检查清单。逐项检查、拍照、提交。', shot: '移动端保养执行页' },{ time: '14:00', title: '看态势：一台离线了', role: '企业负责人 · 周总', desc: '大屏：在线率 96%、保养完成率 92%、3 台过保、1 台离线。点进——3 号车间配电箱昨晚起离线。打电话给车间主任："去看一眼。"', shot: 'Web 端设备状态看板' }],
  values: [{ role: '设备管理员', desc: '几百台设备保养周期系统自动算、自动提醒' },{ role: '维保工程师', desc: '任务推送→扫码执行→自动记录' },{ role: '企业负责人', desc: '在线率和保养率——两个数字掌握全局' }],
},{
  id: 'patrol', icon: ScanEye, title: '巡查检查', tagline: '巡检员到没到现场、查了什么——扫码打卡，轨迹可验',
  roles: [{ name: '安全管理员', duty: '配置巡查计划、项目频次，看巡查报表' },{ name: '巡检员', duty: '按任务到点位扫码打卡、逐项检查' },{ name: '整改责任人', duty: '收到异常通知后到场处理、拍照回执' }],
  case: { date: '2023 年 6 月 · 银川', text: '烧烤店燃气爆炸前一月，消防刚做过安全检查。<strong>检查了，但没查出来。</strong>31 人死亡。同年 7 月，齐齐哈尔体育馆坍塌——事故前刚检查过校舍。<strong>11 人死亡。</strong>', if: '如果 — 巡检员到点位扫码验证位置、结构化清单逐项引导、拍照上传不可跳过' },
  journey: [{ time: '08:00', title: '看今天的巡查任务', role: '安全管理员 · 张工', desc: '今天 3 条任务已自动生成——A 区消防设施 12 点位、B 车间设备 8 点位、C 库房 5 点位。三个巡检员手机上都收到了。', shot: 'Web 端巡查任务管理页' },{ time: '09:00', title: '到点位，扫码打卡', role: '巡检员 · 王师傅', desc: '走到"消防栓-01"，扫码弹出检查单。逐项确认，拍照提交。12 个点位逐一完成——2 个异常标注。', shot: '移动端扫码巡查页' },{ time: '10:30', title: '异常流转，整改到场', role: '整改人 · 小陈', desc: '手机收到两条异常：灭火器压力偏低、应急灯不亮。带备件逐个到场更换。同角度拍照——异常前和修复后对比。', shot: '移动端异常处理页' }],
  values: [{ role: '安全管理员', desc: '任务自动生成分发，完成率实时可见' },{ role: '巡检员', desc: '扫码定位验证，检查清单引导——不凭记忆' },{ role: '企业负责人', desc: '覆盖率、异常率——判断巡查是否落到实处' }],
},{
  id: 'hazard', icon: AlertTriangle, title: '隐患整改闭环', tagline: '隐患说给班组长没用——全链路跟踪，超时自动亮红',
  roles: [{ name: '隐患上报人', duty: '发现隐患拍照描述提交' },{ name: '安全管理员', duty: '审核、分派、设期限、确认验收' },{ name: '整改责任人', duty: '接到任务到场处理、前后对比拍照' },{ name: '监管方', duty: '查看辖区隐患闭环率、超期清单' }],
  case: { date: '2022-2023 年 · 多地事故调查', text: '应急管理部公布的多起重大事故案例中，<strong>同一句话反复出现：</strong>"该企业前期排查整改未形成闭环。"排查过了——但闭环断了。直到出事，隐患还在那里。', if: '如果 — 每条隐患从上报到闭环有时间戳和前后对比图，超时自动亮红提醒管理方' },
  journey: [{ time: '08:30', title: '发现隐患，上报', role: '巡检员 · 赵师傅', desc: 'B 车间东侧消防通道被纸箱杂物占一半。拍照→选"消防通道堵塞"→填描述→提交。', shot: '移动端隐患上报页' },{ time: '09:00', title: '分派整改人，设期限', role: '安全管理员 · 张工', desc: '确认为有效隐患。点击分派给 B 车间班长王师傅，期限今日 17:00。系统推送至王师傅手机。', shot: 'Web 端隐患分派页' },{ time: '10:00', title: '整改，拍对比照', role: '整改人 · 王师傅', desc: '手机收到推送。安排人把纸箱清走，站在同角度拍通道畅通的对比图——"堵→通"一目了然。', shot: '移动端整改上传页' },{ time: '14:00', title: '验收闭环', role: '安全管理员 · 张工', desc: '看对比照片——通道清空了。点"确认验收"，系统记录确认人、时间。"已闭环"出现在台账中。', shot: 'Web 端隐患台账' },{ time: '17:00', title: '超期自动亮红', role: '系统 + 管理方', desc: '大屏上 1 条隐患标红——"超期未整改"。灭火器隐患昨天到期还没交。管理方决定明天去店里看。', shot: 'Web 端超期隐患标记' }],
  values: [{ role: '隐患上报人', desc: '上报即有记录——"我说过了"变成"系统里有"' },{ role: '安全管理员', desc: '分派→跟踪→验收，一步不可跳过，超时自动提醒' },{ role: '监管方', desc: '辖区闭环率、超期数——不需到现场' }],
},{
  id: 'alert', icon: Bell, title: '告警与值守', tagline: '消控室无人、系统被静音——大屏弹窗 + 批量处置',
  roles: [{ name: '消控值班员', duty: '24h 值守，告警弹窗响应、分级确认、一键核实' },{ name: '安全管理员', duty: '配置联动规则、看告警趋势' },{ name: '处置人员', duty: '收到推送到场核实、处置、拍照回执' }],
  case: { date: '2023 年 12 月 · 吉首工贸城', text: '凌晨炭火炉引燃可燃物。烟感触发——但<strong>消控室晚上长期无人值班</strong>，自动报警未切自动。<strong>1.8 万平米过火，923 万损失，24 人被追责。</strong>', if: '如果 — 大屏实时弹窗推送到值班员手机、系统自动记录响应时间、无人应答自动升级告警' },
  journey: [{ time: '07:30', title: '交接班：看过去 12 小时', role: '消控值班员 · 李明辉', desc: '系统展示：总告警 47 条、已确认 45、待确认 2（灰尘误报）、真实告警 4（均处置）、1 台设备离线。确认 2 条误报，为离线水泵建工单。', shot: 'Web 端值班工作台交接班页' },{ time: '10:15', title: '告警弹窗！火警响起', role: '消控值班员 · 李明辉', desc: '大屏红色告警条：1 号厂房二层烟感 ×2。调实时监控——没烟雾火光。判定焊接误报，推送巡检员核实，6 分钟闭环。', shot: 'Web 端告警弹窗+实时视频' },{ time: '11:00', title: '批量确认误报', role: '消控值班员 · 李明辉', desc: '装修施工连续触发 4 条烟感——全是误报。勾选全部→一键关联理由→批量关闭。精力留给真实的、需要警觉的告警。', shot: 'Web 端告警列表批量操作' },{ time: '14:30', title: '看告警趋势', role: '安全管理员 · 张工', desc: '近 30 天趋势：火警 2、故障 47、误报 689。某区域上周起告警密度翻倍——和工厂装修同期。决定：降低装修区域灵敏度，夜间正常。', shot: 'Web 端告警趋势分析' }],
  values: [{ role: '消控值班员', desc: '弹窗+视频分辨真假，批量确认省重复点击' },{ role: '安全管理员', desc: '告警趋势自动生成——哪里多了、响应慢了' },{ role: '企业负责人', desc: '响应率和平均时间——判断值守团队在不在状态' }],
}]
const navItems = [{ id: 'device', nav: '设备保养' },{ id: 'patrol', nav: '巡查检查' },{ id: 'hazard', nav: '隐患整改' },{ id: 'alert', nav: '告警值守' }]

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
.journey-card { max-width:260px; background:#fff; border:1px solid rgba(54,120,227,.25); border-radius:10px; padding:14px 16px; box-shadow:0 2px 12px rgba(0,0,0,.04); }
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
