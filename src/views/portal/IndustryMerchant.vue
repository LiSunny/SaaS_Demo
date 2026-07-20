<template>
  <div style="font-family:'Noto Sans SC','Outfit',-apple-system,sans-serif;min-height:100vh;background:#fafafa;">
    <section class="ind-hero">
      <div class="ind-hero-grid"></div>
      <div class="ind-hero-content">
        <a href="/portal" class="ind-back"><ChevronLeft :size="16" />场景总览</a>
        <h1 class="ind-hero-title">小商户安全监管</h1>
        <p class="ind-hero-sub">辖区几千家店，靠几个人跑不完 —— 自查打卡 + 入户巡查 + 隐患闭环</p>
      </div>
    </section>
    <div class="sticky-nav" ref="stickyNav">
      <div class="sticky-nav-inner">
        <a v-for="sc in navItems" :key="sc.id" :href="`#${sc.id}`" class="sticky-nav-link" @click.prevent="scrollTo(sc.id)">{{ sc.nav }}</a>
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
    </div>
    <section class="ind-cta"><a href="/portal" class="ind-cta-btn">← 返回场景总览</a></section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronLeft, ClipboardCheck, Search } from 'lucide-vue-next'

const scenes = [{
  id: 'check', icon: ClipboardCheck, title: '商户安全自查', tagline: '每天 1 分钟手机打卡，检查项按业态自动适配',
  roles: [{ name: '商户经营者', duty: '每日安全检查、逐项确认打卡' },{ name: '管理方', duty: '大屏看打卡率、漏打名单、商圈排名' }],
  case: { date: '2023 年 6 月 · 银川', text: '富洋烧烤店员工误接液化气调压器致大量泄漏，处置时反向开大阀门。<strong>31 人死亡，7 人受伤。</strong>2024 年 4 月梧州临街铺面电气线路故障起火，<strong>5 人死亡。</strong>', if: '如果 — 每天营业前有一个"确认燃气阀门""确认电气线路外观"的必填打卡项' },
  journey: [{ time: '05:00', title: '开店前，手机推送', role: '商户 · 老张（川菜馆）', desc: '手机推了一条通知："今日安全检查待完成"。点进——检查清单按餐饮店自动适配：燃气阀门、灭火器压力、油烟通道、电气线路。逐项打勾，1 分钟提交。', shot: '移动端商户安全检查清单页' },{ time: '08:00', title: '大屏看履责率', role: '管理方 · 王姐', desc: '大屏左侧"今日商户履责率"——当前 82%。老张川菜馆 05:03 已打卡。5 家未打卡——杂货店和五金店营业晚，正常。上周 3 家连续漏打，跟进后全部恢复。', shot: 'Web 大屏商户履责监管页' }],
  values: [{ role: '商户', desc: '每天 1 分钟打卡，检查项按业态适配。出了事有每日自查记录' },{ role: '管理方', desc: '绿色在打卡、白色在漏——连着的白在提醒你该打电话了' }],
},{
  id: 'inspect', icon: Search, title: '巡查与隐患处置', tagline: '物业扫码上报 → 推送商户整改 → 拍照回传闭环',
  roles: [{ name: '物业巡查/街道安全员', duty: '按计划巡查、扫码到店、拍照上报' },{ name: '商户经营者', duty: '收到隐患通知、整改后拍照回传' },{ name: '管理方', duty: '大屏看巡查覆盖率、整改率、超期清单' }],
  case: { date: '2024 年 1 月 · 江西新余', text: '临街综合楼地下一层违规建冷库。聚氨酯泡沫释放易燃气体，静电点燃。疏散楼梯无防火分隔，二楼窗外防盗网封死。<strong>39 人遇难。</strong>', if: '如果 — 有人走进地下一层看到在建冷库、防火门缺失被记录上报、隐患有跟踪超时自动亮红' },
  journey: [{ time: '09:00', title: '巡查出发，今天 12 家', role: '巡查员 · 小李', desc: '打开 App，今天的巡查计划已生成——B 区 12 家餐饮店，重点"燃气安全 + 灭火器 + 疏散通道"。路线自动排好。', shot: '移动端巡查任务列表' },{ time: '09:15', title: '发现燃气软管老化', role: '巡查员 · 小李', desc: '老张川菜馆后厨。蹲下看燃气软管——管壁发硬、多处裂纹。拍照→选"燃气软管老化"→"需立即更换金属软管"→提交。自动推送至老张手机。', shot: '移动端隐患上报页' },{ time: '09:30', title: '商户收到推送，整改', role: '商户 · 老张', desc: '手机弹出通知——看到自己管子的照片，裂痕很明显。叫燃气师傅下午换了金属软管。同角度拍新管照片上传——"老→新"对比。', shot: '移动端商户整改上传页' },{ time: '14:30', title: '确认闭环', role: '管理方 · 王姐', desc: '后台看到整改上传——对比照片清楚。点"确认已整改"。大屏隐患整改率从 87% 刷新到 89%。', shot: 'Web 端隐患跟踪看板' },{ time: '16:00', title: '超期自动亮红提醒', role: '系统 + 管理方', desc: '大屏上 1 条标红——"超期未整改"。另一家灭火器压力不足三天前上报，昨天到期还没交。王姐决定明天去店里看。', shot: 'Web 端超期隐患红色标记' }],
  values: [{ role: '巡查人员', desc: '扫码即到、拍照即记录——不用填表、不用口头传' },{ role: '商户', desc: '隐患带照片推送——一看就知道什么出问题了' },{ role: '管理方', desc: '巡查覆盖率、整改率、超期清单——超时自动亮红' }],
}]
const navItems = [{ id: 'check', nav: '商户自查' },{ id: 'inspect', nav: '巡查与隐患' }]

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
.ind-sec-wrap { max-width:1200px; margin:0 auto; padding:32px 32px 0; }
.scene-section { background:#fff; border:1px solid rgba(54,120,227,.12); border-radius:14px; padding:36px; margin-bottom:24px; scroll-margin-top:80px; }
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
