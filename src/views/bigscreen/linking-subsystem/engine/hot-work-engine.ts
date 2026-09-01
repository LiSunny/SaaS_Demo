import { cv, disposeCharts, initChart, openOverlay, toolbarHtml } from './shared-engine'
import { icoExportSmall, icoPlusSmall, icoRefreshSmall } from './icon-consts'
import { showEventDetail } from './cross-module'
import { HOT_WORKS, HW_PHASES, HW_STATUS_MAP } from '../data/hot-works'
// 模块9引擎：动火作业全流程管控（原 renderHotWork 族）
// 原 index.html renderContent 分发对应的渲染函数族，原样提取，仅 content→入参

import * as echarts from 'echarts'




export let bindSelectModule = (id: number) => {}
export function setModuleSwitch(fn: (id: number) => void) { bindSelectModule = fn }

let hwFilter = 'all'
let hwActiveStepNum = 0
let hwDetailId = 0
let hwLevelFilter = 'all'
let hwSearchKeyword = ''
let hwPage = 1
const HW_PAGE_SIZE = 15
let activeContainer: HTMLElement
export function bindContainer(el: HTMLElement) { activeContainer = el }

export function renderHotWork(body: HTMLElement, container?: HTMLElement){
  disposeCharts();
  const content = container || body;
  body.style.overflowY = 'hidden';

  const total = HOT_WORKS.length;
  const pending = HOT_WORKS.filter(w=>w.status==='pending').length;
  const preparing = HOT_WORKS.filter(w=>w.status==='preparing').length;
  const authorized = HOT_WORKS.filter(w=>w.status==='authorized').length;
  const archived = HOT_WORKS.filter(w=>w.status==='archived').length;
  const levelSpecial = HOT_WORKS.filter(w=>w.level==='特级').length;

  let list = HOT_WORKS;
  if(hwFilter!=='all') list = list.filter(w=>w.status===hwFilter);
  if(hwLevelFilter!=='all') list = list.filter(w=>w.level===hwLevelFilter);
  const hwKw = hwSearchKeyword.trim().toLowerCase();
  if(hwKw) list = list.filter(w=>`${w.code} ${w.shop} ${w.addr} ${w.location} ${w.part} ${w.applicant} ${w.levelLabel}`.toLowerCase().includes(hwKw));
  const hwTotalPages = Math.max(1, Math.ceil(list.length / HW_PAGE_SIZE));
  if(hwPage > hwTotalPages) hwPage = hwTotalPages;
  const hwPageList = list.slice((hwPage-1)*HW_PAGE_SIZE, hwPage*HW_PAGE_SIZE);
  const hwStatusHtml = [
    {key:'all', label:'全部状态', count:total},
    {key:'pending', label:'待部署', count:pending},
    {key:'preparing', label:'准备准入', count:preparing},
    {key:'authorized', label:'授权作业', count:authorized},
    {key:'archived', label:'已归档', count:archived}
  ].map(f=>`<option value="${f.key}" ${hwFilter===f.key?'selected':''}>${f.label}</option>`).join('');
  const hwLevelHtml = [
    {key:'all', label:'全部等级', count:total},
    {key:'特级', label:'特级', count:HOT_WORKS.filter(w=>w.level==='特级').length},
    {key:'一级', label:'一级', count:HOT_WORKS.filter(w=>w.level==='一级').length},
    {key:'二级', label:'二级', count:HOT_WORKS.filter(w=>w.level==='二级').length}
  ].map(f=>`<option value="${f.key}" ${hwLevelFilter===f.key?'selected':''}>${f.label}</option>`).join('');
  const hwPageButtons = Array.from({length:hwTotalPages},(_,i)=>i+1).map(p=>
    `<button type="button" class="ev-page-btn ${p===hwPage?'active':''}" onclick="hwSetPage(${p})">${p}</button>`
  ).join('');
  const hwPagination = `
    <div class="ev-pagination">
      <span class="ev-page-info">共 ${list.length} 个，每页 ${HW_PAGE_SIZE} 个</span>
      <button type="button" class="ev-page-btn" onclick="hwSetPage(${hwPage-1})" ${hwPage<=1?'disabled':''}>上一页</button>
      ${hwPageButtons}
      <button type="button" class="ev-page-btn" onclick="hwSetPage(${hwPage+1})" ${hwPage>=hwTotalPages?'disabled':''}>下一页</button>
    </div>`;

  const listHtml = hwPageList.length ? hwPageList.map(w=>`
    <div class="hw-item data-row hw-row" onclick="showHotWorkDetail(${w.id})">
      <div><span class="hw-item-code">${w.code}</span></div>
      <div class="data-main">
        <div class="data-title">${w.shop} · ${w.part||w.location}</div>
        <div class="data-sub">${w.addr} · 申请人：${w.applicant}</div>
      </div>
      <div><span class="hw-item-phase ${HW_PHASES[w.phase-1].cls}">${w.phaseLabel}</span></div>
      <div class="data-cell">${w.levelLabel}</div>
      <div class="data-cell muted">${w.startTime}</div>
      <div class="row-actions">
        <button type="button" class="row-action" onclick="event.stopPropagation();showHotWorkDetail(${w.id})">查看详情</button>
      </div>
    </div>`).join('') : '<div style="text-align:center;padding:40px;color:var(--muted);font-size:14px">暂无符合条件的动火作业</div>';

  content.innerHTML = `
    ${toolbarHtml('动火作业全流程管控', [
      {label:'作业等级：全部'},
      {label:'流程：四阶段'},
      {label:'日期：本周'}
    ], [
      {label:'刷新', icon:icoRefreshSmall},
      {label:'导出', icon:icoExportSmall},
      {label:'新增报备', icon:icoPlusSmall, primary:true}
    ])}
    <div class="hw-stats">
      <div class="hw-stat">
        <div class="hw-stat-left">
          <div class="ws-label">动火作业总数</div>
          <div class="ws-value">${total}</div>
          <div class="ws-subs">
            <div class="ws-sub"><span class="ws-dot red"></span><span class="ws-num">${pending}</span><span class="ws-lbl">待部署</span></div>
            <div class="ws-sub"><span class="ws-dot orange"></span><span class="ws-num">${preparing}</span><span class="ws-lbl">准备准入</span></div>
            <div class="ws-sub"><span class="ws-dot blue"></span><span class="ws-num">${authorized}</span><span class="ws-lbl">授权作业</span></div>
            <div class="ws-sub"><span class="ws-dot green"></span><span class="ws-num">${archived}</span><span class="ws-lbl">已归档</span></div>
          </div>
        </div>
        <div class="hw-stat-chart" id="hwStatusChart"></div>
      </div>
      <div class="hw-stat">
        <div class="hw-stat-left">
          <div class="ws-label">特级作业</div>
          <div class="ws-value" style="color:var(--accent-deep)">${levelSpecial}</div>
          <div class="ws-subs">
            <div class="ws-sub"><span class="ws-dot red"></span><span class="ws-num">${levelSpecial}</span><span class="ws-lbl">特级</span></div>
            <div class="ws-sub"><span class="ws-dot orange"></span><span class="ws-num">${total-levelSpecial}</span><span class="ws-lbl">一级/二级</span></div>
          </div>
        </div>
        <div class="hw-stat-chart" id="hwLevelChart"></div>
      </div>
      <div class="hw-stat">
        <div class="hw-stat-left">
          <div class="ws-label">本周作业</div>
          <div class="ws-value">${total}</div>
          <div class="ws-subs">
            <div class="ws-sub"><span class="ws-dot blue"></span><span class="ws-num">${authorized}</span><span class="ws-lbl">进行中</span></div>
            <div class="ws-sub"><span class="ws-dot green"></span><span class="ws-num">${archived}</span><span class="ws-lbl">已闭环</span></div>
          </div>
        </div>
        <div class="hw-stat-chart" id="hwPhaseChart"></div>
      </div>
    </div>

    <div class="dv-record-panel hw-record-panel">
      <div class="ev-list-tools">
        <div class="dv-list-tools-left">
          <label class="dv-filter-group"><span class="dv-filter-label">状态</span><span class="dv-select-wrap"><select class="dv-filter-select" onchange="hwSetFilter(this.value)">${hwStatusHtml}</select></span></label>
          <label class="dv-filter-group"><span class="dv-filter-label">等级</span><span class="dv-select-wrap"><select class="dv-filter-select" onchange="hwSetLevelFilter(this.value)">${hwLevelHtml}</select></span></label>
        </div>
        <input class="ev-search-input" value="${hwSearchKeyword}" placeholder="搜索编号/商铺/地点/申请人" oninput="hwSetSearch(this.value)">
      </div>
      <div class="data-table-wrap">
        <div class="list-head-row hw-row">
          <span>编号</span><span>作业信息</span><span>阶段</span><span>等级</span><span>计划时间</span><span>操作</span>
        </div>
        <div class="hw-list" id="hwList">${listHtml}</div>
      </div>
      ${hwPagination}
    </div>`;

  renderHotWorkCharts(pending, preparing, authorized, archived, levelSpecial, total);
}

export function renderHotWorkCharts(pending, preparing, authorized, archived, levelSpecial, total){
  const baseStyle = {
    type:'pie', radius:['55%','85%'], avoidLabelOverlap:false,
    label:{show:false}, labelLine:{show:false},
    itemStyle:{borderColor:'#fff', borderWidth:2}
  };

  const statusEl = document.getElementById('hwStatusChart');
  if(statusEl){
    const chart = echarts.init(statusEl);
    chart.setOption({series:[{...baseStyle, data:[
      {value:pending, name:'待部署', itemStyle:{color:cv('--accent')}},
      {value:preparing, name:'准备准入', itemStyle:{color:cv('--orange')}},
      {value:authorized, name:'授权作业', itemStyle:{color:cv('--blue')}},
      {value:archived, name:'已归档', itemStyle:{color:cv('--green')}}
    ]}]});
  }

  const levelEl = document.getElementById('hwLevelChart');
  if(levelEl){
    const chart = echarts.init(levelEl);
    chart.setOption({series:[{...baseStyle, data:[
      {value:levelSpecial, name:'特级', itemStyle:{color:cv('--accent')}},
      {value:total-levelSpecial, name:'一级/二级', itemStyle:{color:cv('--orange')}}
    ]}]});
  }

  const phaseEl = document.getElementById('hwPhaseChart');
  if(phaseEl){
    const chart = echarts.init(phaseEl);
    chart.setOption({series:[{...baseStyle, data:[
      {value:authorized, name:'进行中', itemStyle:{color:cv('--blue')}},
      {value:archived, name:'已闭环', itemStyle:{color:cv('--green')}}
    ]}]});
  }
}

export function hwSetFilter(f){
  hwFilter = f;
  hwPage = 1;
  renderHotWork();
}

export function hwSetLevelFilter(f){
  hwLevelFilter = f;
  hwPage = 1;
  renderHotWork();
}

export function hwSetSearch(value){
  hwSearchKeyword = value;
  hwPage = 1;
  renderHotWork();
  const input = document.querySelector('.ev-list-tools .ev-search-input');
  if(input){ input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
}

export function hwSetPage(page){
  hwPage = Math.max(1, page);
  renderHotWork();
}

export function buildHotWorkSteps(w){
  /* 阶段一：发起部署（步骤1-2） */
  const phase1 = [
    {num:1, title:'动火作业发起', phase:1, fields:[
      {k:'申请人员', v:w.applicant},
      {k:'申请时间', v:w.startTime},
      {k:'申请班组', v:w.team},
      {k:'动火地点', v:w.location},
      {k:'作业部位', v:w.part},
      {k:'作业采取措施概述', v:w.measures, full:true, text:true}
    ]},
    {num:2, title:'车间主体部署', phase:1, fields:[
      {k:'部署人员', v:w.deployer||'待部署'},
      {k:'部署时间', v:w.deployTime||'待部署'}
    ]}
  ];

  /* 阶段二：准备准入（步骤3-8） */
  const phase2 = [
    {num:3, title:'动火证照备案', phase:2, fields:w.operators?.map(o=>({k:o.role, v:o.name+' / '+o.cert+' / 有效期至 '+o.valid})) || [{k:'作业人员', v:'待添加'}]},
    {num:4, title:'动火技术交底', phase:2, fields:w.briefing?[
      {k:'会议时间', v:w.briefing.time},
      {k:'会议地点', v:w.briefing.place},
      {k:'车间主任', v:w.briefing.director},
      {k:'班组长', v:w.briefing.leader},
      {k:'动火人', v:w.briefing.fireman},
      {k:'监护人', v:w.briefing.guard},
      {k:'安全管理员', v:w.briefing.admin}
    ]:[{k:'技术交底', v:'待完成'}]},
    {num:5, title:'单位环护方案', phase:2, fields:w.plan?[{k:'环护方案', v:w.plan, full:true, text:true}]:[{k:'环护方案', v:'待制定'}]},
    {num:6, title:'监护人责任链', phase:2, fields:w.guardChain?.map(g=>({k:g.role, v:g.name+' / '+g.phone})) || [{k:'责任链', v:'待建立'}]},
    {num:7, title:'动火应急预案', phase:2, fields:w.emergency?[{k:'应急预案', v:w.emergency, full:true, text:true}]:[{k:'应急预案', v:'待制定'}]},
    {num:8, title:'安全管理员审', phase:2, fields:w.adminReview?[
      {k:'作业级别', v:w.levelLabel},
      {k:'审核人', v:w.adminReview.reviewer},
      {k:'审核结果', v:w.adminReview.result},
      {k:'审核时间', v:w.adminReview.time},
      {k:'审核意见', v:w.adminReview.opinion, full:true, text:true}
    ]:[{k:'审核', v:'待审核'}]}
  ];

  /* 阶段三：授权作业（步骤9-13） */
  const phase3 = [
    {num:9, title:'签动火作业票', phase:3, important:true, fields:w.ticketSign?[
      {k:'申请班组', v:w.team},
      {k:'申请人员', v:w.applicant},
      {k:'申请时间', v:w.startTime},
      {k:'动火地点', v:w.location},
      {k:'作业部位', v:w.part},
      {k:'作业等级', v:w.levelLabel},
      {k:'作业开始时间', v:w.ticketSign.startT},
      {k:'作业结束时间', v:w.ticketSign.endT},
      {k:'批准意见', v:w.ticketSign.opinion, full:true, text:true},
      {k:'签字人', v:w.ticketSign.signer}
    ]:[{k:'作业票', v:'待签署'}]},
    {num:10, title:'现场安全会商', phase:3, fields:w.meetRecord?[
      {k:'会议时间', v:w.meetRecord.time},
      {k:'会议地点', v:w.meetRecord.place},
      {k:'主持人', v:w.meetRecord.host},
      {k:'记录人', v:w.meetRecord.recorder},
      {k:'车间主任', v:w.meetRecord.director},
      {k:'班组长', v:w.meetRecord.leader},
      {k:'动火人', v:w.meetRecord.fireman},
      {k:'监护人', v:w.meetRecord.guard},
      {k:'安全管理员', v:w.meetRecord.admin},
      {k:'厂长/副厂长', v:w.meetRecord.manager}
    ]:[{k:'安全会商', v:'待完成'}]},
    {num:11, title:'动火人自律书', phase:3, fields:w.selfCommit?[{k:'自律承诺', v:w.selfCommit, full:true, text:true}]:[{k:'自律书', v:'待签署'}]},
    {num:12, title:'动火指令下达', phase:3, fields:w.command?[
      {k:'下达时间', v:w.command.time},
      {k:'作业开始时间', v:w.command.startT},
      {k:'作业结束时间', v:w.command.endT},
      {k:'作业地点', v:w.command.location},
      {k:'作业等级', v:w.command.level},
      {k:'作业内容', v:w.command.content, full:true, text:true},
      {k:'指令状态', v:w.command.status},
      {k:'指令依据', v:w.command.basis},
      {k:'下达人签字', v:w.command.signer},
      {k:'接收人签字', v:w.command.receiver}
    ]:[{k:'指令下达', v:'待下达'}]},
    {num:13, title:'动火现场实录', phase:3, fields:w.siteLog?[
      {k:'记录时间', v:w.siteLog.time},
      {k:'实录内容', v:w.siteLog.content, full:true, text:true},
      {k:'记录人', v:w.siteLog.logger}
    ]:[{k:'现场实录', v:'待记录'}]}
  ];

  /* 阶段四：归档闭环（步骤14-15） */
  const phase4 = [
    {num:14, title:'清理现场交接', phase:4, fields:w.cleanup?[
      {k:'清理时间', v:w.cleanup.time},
      {k:'清理结果', v:w.cleanup.result, full:true, text:true},
      {k:'处理人', v:w.cleanup.handler},
      {k:'接收人', v:w.cleanup.receiver}
    ]:[{k:'现场交接', v:'待完成'}]},
    {num:15, title:'签关闭动火票', phase:4, fields:w.closeTicket?[
      {k:'实际开始时间', v:w.closeTicket.actualStart},
      {k:'实际结束时间', v:w.closeTicket.actualEnd},
      {k:'关闭人', v:w.closeTicket.closer},
      {k:'关闭时间', v:w.closeTicket.closeTime}
    ]:[{k:'关闭动火票', v:'待签署'}]}
  ];

  return [...phase1, ...phase2, ...phase3, ...phase4];
}

export function showHotWorkDetail(id){
  const w = HOT_WORKS.find(x=>x.id===id);
  if(!w) return;
  hwDetailId = id;

  const statusLabel = (st)=> (HW_STATUS_MAP[st]||HW_STATUS_MAP.pending).label;
  const statusCls = (st)=> (HW_STATUS_MAP[st]||HW_STATUS_MAP.pending).cls;

  /* 四阶段进度条 */
  const phaseBarHtml = HW_PHASES.map(p=>{
    const cls = p.id < w.phase ? 'done' : p.id === w.phase ? 'active' : '';
    return `<div class="hw-phase-step ${cls}">
      <div class="hw-phase-circle">${p.id < w.phase ? '✓' : p.id}</div>
      <div class="hw-phase-label">${p.name}</div>
    </div>`;
  }).join('');

  /* 15 步骤（不裁剪：未开始步骤灰态展示） */
  const steps = buildHotWorkSteps(w);
  const stepState = (s)=> s.phase < w.phase ? 'done' : s.phase === w.phase ? 'active' : 'pending';
  const defaultStep = steps.find(s=>stepState(s)==='active') || steps[0];
  hwActiveStepNum = defaultStep.num;
  const activeStep = steps.find(s=>s.num===hwActiveStepNum) || defaultStep;

  /* 左侧步骤导航：按四阶段分组 */
  const navHtml = HW_PHASES.map(p=>{
    const items = steps.filter(s=>s.phase===p.id).map(s=>{
      const st = stepState(s);
      const numCls = st==='done' ? 'done' : st==='active' ? 'active' : '';
      const inner = st==='done' ? '✓' : s.num;
      return `<div class="hw-step-item ${st==='active' && s.num===hwActiveStepNum ? 'active' : ''}" onclick="hwSelectStep(this,${s.num})">
        <span class="hw-step-item-num ${numCls}">${inner}</span>
        <span class="hw-step-item-title">${s.title}</span>
        ${s.important?'<span class="hz-level urgent" style="margin-left:auto;font-size:9px"><span class="dot"></span>重要</span>':''}
      </div>`;
    }).join('');
    return `<div class="hw-nav-group">
      <div class="hw-nav-group-title">${p.name}</div>
      ${items}
    </div>`;
  }).join('');

  openOverlay('hw-detail-overlay', `
    <div class="hw-detail" onclick="event.stopPropagation()">
      <div class="hw-detail-head">
        <div>
          <div class="hw-detail-title">${w.code}</div>
          <div style="font-size:13px;color:var(--muted);margin-top:2px">${w.shop} · ${w.addr} · ${w.part}</div>
        </div>
        <div class="hw-detail-close" onclick="this.closest('.hw-detail-overlay').remove()">✕</div>
      </div>
      <div class="hw-detail-body">
        <div class="dv-status-big ${statusCls(w.status)}">
          <span class="dot"></span>${statusLabel(w.status)}
          <span class="hw-item-phase ${HW_PHASES[w.phase-1].cls}" style="margin-left:12px">${w.phaseLabel}</span>
        </div>
        <div class="ev-detail-meta">
          <div class="ev-detail-field"><div class="l">作业等级</div><div class="v">${w.levelLabel}</div></div>
          <div class="ev-detail-field"><div class="l">申请人</div><div class="v">${w.applicant}</div></div>
          <div class="ev-detail-field"><div class="l">计划开始</div><div class="v">${w.startTime}</div></div>
          <div class="ev-detail-field"><div class="l">计划结束</div><div class="v">${w.endTime}</div></div>
        </div>
        <div class="section-title">动火作业流程</div>
        <div class="hw-phase-bar">${phaseBarHtml}</div>
        <div class="hw-layout">
          <div class="hw-nav">${navHtml}</div>
          <div class="hw-content" id="hwStepContent">${hwStepContentHtml(w, activeStep)}</div>
        </div>
      </div>
    </div>`);
}

export function hwStepContentHtml(w, s){
  const st = s.phase < w.phase ? 'done' : s.phase === w.phase ? 'active' : 'pending';
  const tagLabel = st==='done'?'已完成':st==='active'?'进行中':'待处理';
  const fieldsHtml = (s.fields||[]).map(f=>`
    <div class="hw-field ${f.full?'full':''}">
      <div class="fk">${f.k}</div>
      <div class="${f.text?'fv-text':'fv'}">${f.v||'—'}</div>
    </div>`).join('');
  return `<div class="hw-content-head">
      <div class="hw-content-num ${st}">${s.num}</div>
      <div class="hw-content-title">${s.title}${s.important?'<span class="hz-level urgent" style="margin-left:8px;font-size:10px"><span class="dot"></span>重要</span>':''}</div>
      <span class="hw-step-tag ${st}">${tagLabel}</span>
    </div>
    <div class="hw-field-grid">${fieldsHtml}</div>`;
}

export function hwSelectStep(el, num){
  hwActiveStepNum = num;
  document.querySelectorAll('.hw-step-item').forEach(it=>it.classList.remove('active'));
  if(el) el.classList.add('active');
  const w = HOT_WORKS.find(x=>x.id===hwDetailId);
  if(!w) return;
  const s = buildHotWorkSteps(w).find(x=>x.num===num);
  const c = document.getElementById('hwStepContent');
  if(c && s) c.innerHTML = hwStepContentHtml(w, s);
}
