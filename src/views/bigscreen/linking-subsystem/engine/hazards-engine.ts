import { cv, disposeCharts, initChart, openOverlay, toolbarHtml, uiToast } from './shared-engine'
import { icoExportSmall, icoPlusSmall, icoRefreshSmall } from './icon-consts'
import { showEventDetail } from './cross-module'
import { getAllEvents } from './events-engine'
import { SHOPS } from '../data/shops'
import { SHOP_EVENTS, BEFORE_PHOTO_POOL } from '../data/shop-events'
// 模块6引擎：隐患排查治理系统（原 renderHazards 族）
// 原 index.html renderContent 分发对应的渲染函数族，原样提取，仅 content→入参

import * as echarts from 'echarts'






export let bindSelectModule = (id: number) => {}
export function setModuleSwitch(fn: (id: number) => void) { bindSelectModule = fn }
/* 辅助函数（原 index.html 1:1） */
function stripDevPrefix(t){ return t.replace(/^(烟感|燃气探测器|燃气)[·・]/, ''); }
function evTypeLabel(e){
  if(e.type==='hazard') return '隐患排查';
  const t = e.title;
  if(/火警/.test(t)) return '火警';
  if(/预警/.test(t)) return '预警';
  if(/故障/.test(t)) return '故障';
  if(/离线/.test(t)) return '离线';
  return '其它';
}
function evTypeCls(e){
  if(e.type==='hazard') return 'other';
  const t = e.title;
  if(/火警|预警/.test(t)) return 'fire';
  if(/故障/.test(t)) return 'fault';
  if(/离线/.test(t)) return 'offline';
  return 'other';
}
function beforePhotoOf(ev){
  if(ev.photos && ev.photos.before) return ev.photos.before;
  let h = 0;
  for(const ch of ev.id) h = (h*31 + ch.charCodeAt(0)) >>> 0;
  return BEFORE_PHOTO_POOL[h % BEFORE_PHOTO_POOL.length];
}
function hazardDeadlineMs(title){
  if(/疏散出口|疏散通道|通道|出口|堆物|堆放/.test(title)) return 24*3600*1000;
  if(/燃气软管/.test(title)) return 24*3600*1000;
  if(/电线|线路|私拉乱接/.test(title)) return 48*3600*1000;
  if(/灭火器/.test(title)) return 24*3600*1000;
  if(/油烟管道/.test(title)) return 7*24*3600*1000;
  if(/易燃品/.test(title)) return 48*3600*1000;
  return 48*3600*1000;
}
function hzIsOverdue(e){
  if(e.status==='done' || e.status==='closed') return false;
  const t = new Date(e.time.replace(/-/g,'/'));
  if(isNaN(t)) return false;
  return Date.now() > t.getTime() + hazardDeadlineMs(e.title);
}


let hzCurrentShop = 0
let hzStatusFilter = 'all'
let hzLevelFilter = 'all'
let hzSearchKeyword = ''
let hzPage = 1
const HZ_PAGE_SIZE = 15
let activeContainer: HTMLElement
export function bindContainer(el: HTMLElement) { activeContainer = el }

export function applyPendingState(s: any) {
  if (s.hzCurrentShop !== undefined) hzCurrentShop = s.hzCurrentShop
}

export function renderHazards(body?: HTMLElement, container?: HTMLElement){
  body = body || activeContainer
  disposeCharts();
  const content = container || body;
  body.style.overflowY = 'hidden';

  const allHazards = getAllEvents().filter(e=>e.type==='hazard');
  const pending = allHazards.filter(e=>e.status==='pending').length;
  const processing = allHazards.filter(e=>e.status==='processing').length;
  const done = allHazards.filter(e=>e.status==='done').length;
  const totalHazards = allHazards.length;

  /* 有隐患的商户列表 */
  const shopsWithHazards = SHOPS.filter(s=>{
    const events = SHOP_EVENTS[s.id] || [];
    return events.some(e=>e.type==='hazard');
  });

  /* 当前筛选的隐患：商户 → 状态 → 等级 → 模糊搜索 */
  let filtered = hzCurrentShop===0
    ? allHazards
    : allHazards.filter(e=>{
        const shop = SHOPS.find(s=>s.name===e.shop);
        return shop && shop.id===hzCurrentShop;
      });
  if(hzStatusFilter!=='all') filtered = filtered.filter(e=> hzStatusFilter==='open' ? (e.status==='pending'||e.status==='processing') : e.status===hzStatusFilter);
  if(hzLevelFilter!=='all') filtered = filtered.filter(e=>e.level===hzLevelFilter);
  const kwNorm = hzSearchKeyword.trim().toLowerCase();
  if(kwNorm) filtered = filtered.filter(e=>
    `${e.title} ${e.desc} ${e.shop} ${e.level==='urgent'?'重大':e.level==='warning'?'较大':'一般'} ${e.status==='pending'?'待整改':e.status==='processing'?'处置中':'已闭环'}`.toLowerCase().includes(kwNorm));
  const hzTotalPages = Math.max(1, Math.ceil(filtered.length / HZ_PAGE_SIZE));
  if(hzPage > hzTotalPages) hzPage = hzTotalPages;
  const pageList = filtered.slice((hzPage-1)*HZ_PAGE_SIZE, hzPage*HZ_PAGE_SIZE);
  const statusFilterHtml = [
    {key:'all', label:'全部状态', count:totalHazards},
    {key:'open', label:'未闭环', count:pending+processing},
    {key:'done', label:'已闭环', count:done}
  ].map(f=>`<option value="${f.key}" ${hzStatusFilter===f.key?'selected':''}>${f.label}</option>`).join('');
  const levelFilterHtml = [
    {key:'all', label:'全部等级', count:totalHazards},
    {key:'urgent', label:'重大', count:allHazards.filter(e=>e.level==='urgent').length},
    {key:'warning', label:'较大', count:allHazards.filter(e=>e.level==='warning').length},
    {key:'info', label:'一般', count:allHazards.filter(e=>e.level==='info').length}
  ].map(f=>`<option value="${f.key}" ${hzLevelFilter===f.key?'selected':''}>${f.label}</option>`).join('');
  const hzPageButtons = Array.from({length:hzTotalPages},(_,i)=>i+1).map(p=>
    `<button type="button" class="ev-page-btn ${p===hzPage?'active':''}" onclick="hzSetPage(${p})">${p}</button>`
  ).join('');
  const hzPagination = `
    <div class="ev-pagination">
      <span class="ev-page-info">共 ${filtered.length} 条，每页 ${HZ_PAGE_SIZE} 条</span>
      <button type="button" class="ev-page-btn" onclick="hzSetPage(${hzPage-1})" ${hzPage<=1?'disabled':''}>上一页</button>
      ${hzPageButtons}
      <button type="button" class="ev-page-btn" onclick="hzSetPage(${hzPage+1})" ${hzPage>=hzTotalPages?'disabled':''}>下一页</button>
    </div>`;

  /* 商户筛选 */
  const shopFilterHtml = [
    {key:0, label:'全部商户'},
    ...shopsWithHazards.map(s=>({key:s.id, label:s.name}))
  ].map(f=>`<option value="${f.key}" ${hzCurrentShop===f.key?'selected':''}>${f.label}</option>`).join('');

  /* 隐患列表 */
  const levelLabel = (lv)=> lv==='urgent'?'重大':lv==='warning'?'较大':'一般';
  const statusLabel = (st)=> st==='pending'?'待整改':st==='processing'?'处置中':'已闭环';

  const listHtml = pageList.length ? pageList.map(e=>`
    <div class="hz-item data-row hz-row" onclick="showEventDetail('${e.id}')">
      <div class="data-main">
        <div class="data-title">${e.title.replace('排查隐患：','')}</div>
      </div>
      <div><span class="hz-item-level ${e.level}">${levelLabel(e.level)}</span></div>
      <div class="data-cell">${e.shop}</div>
      <div class="data-cell muted">${e.time}</div>
      <div><span class="hz-item-status ${hzIsOverdue(e)?'overdue':e.status}">${hzIsOverdue(e)?'超期未整改':statusLabel(e.status)}</span></div>
      <div class="row-actions">
        <button type="button" class="row-action" onclick="event.stopPropagation();showEventDetail('${e.id}')">详情</button>
        ${e.status!=='done' ? `<button type="button" class="row-action danger" onclick="event.stopPropagation();uiToast('催办成功，已通知商户责任人限期整改')">催办</button>` : ''}
      </div>
    </div>`).join('') : '<div style="text-align:center;padding:40px;color:var(--muted);font-size:14px">暂无符合条件的隐患记录</div>';

  content.innerHTML = `
    ${toolbarHtml('隐患治理台账', [
      {label:'整改状态：全部'},
      {label:'隐患等级：全部'},
      {label:'来源：履责自查'}
    ], [
      {label:'刷新', icon:icoRefreshSmall},
      {label:'导出', icon:icoExportSmall},
      {label:'发起复核', icon:icoPlusSmall, primary:true}
    ])}
    <div class="hz-stats">
      <div class="hz-stat">
        <div class="hz-stat-left">
          <div class="hs-label">上报隐患总数</div>
          <div class="hs-value">${totalHazards}</div>
          <div class="hs-subs">
            <div class="hs-sub"><span class="hs-dot red"></span><span class="hs-num">${pending}</span><span class="hs-lbl">待整改</span></div>
            <div class="hs-sub"><span class="hs-dot orange"></span><span class="hs-num">${processing}</span><span class="hs-lbl">整改中</span></div>
            <div class="hs-sub"><span class="hs-dot green"></span><span class="hs-num">${done}</span><span class="hs-lbl">已闭环</span></div>
          </div>
        </div>
        <div class="hz-stat-chart" id="hzTotalChart"></div>
      </div>
      <div class="hz-stat">
        <div class="hz-stat-left">
          <div class="hs-label">已闭环隐患</div>
          <div class="hs-value" style="color:var(--green-deep)">${done}</div>
          <div class="hs-subs">
            <div class="hs-sub"><span class="hs-dot green"></span><span class="hs-num">${done}</span><span class="hs-lbl">已整改闭环</span></div>
            <div class="hs-sub"><span class="hs-dot gray"></span><span class="hs-num">${pending+processing}</span><span class="hs-lbl">未闭环</span></div>
          </div>
        </div>
        <div class="hz-stat-chart" id="hzDoneChart"></div>
      </div>
      <div class="hz-stat">
        <div class="hz-stat-left">
          <div class="hs-label">涉及商户</div>
          <div class="hs-value">${shopsWithHazards.length}</div>
          <div class="hs-subs">
            <div class="hs-sub"><span class="hs-dot red"></span><span class="hs-num">${shopsWithHazards.filter(s=>(SHOP_EVENTS[s.id]||[]).some(e=>e.type==='hazard'&&(e.status==='pending'||e.status==='processing'))).length}</span><span class="hs-lbl">有未闭环</span></div>
            <div class="hs-sub"><span class="hs-dot green"></span><span class="hs-num">${shopsWithHazards.filter(s=>(SHOP_EVENTS[s.id]||[]).every(e=>e.type!=='hazard'||e.status==='done')).length}</span><span class="hs-lbl">全部闭环</span></div>
          </div>
        </div>
        <div class="hz-stat-chart" id="hzShopChart"></div>
      </div>
    </div>

    <div class="dv-record-panel hz-record-panel">
      <div class="ev-list-tools">
        <div class="dv-list-tools-left">
          <label class="dv-filter-group"><span class="dv-filter-label">商户</span><span class="dv-select-wrap"><select class="dv-filter-select" onchange="hzFilterShop(+this.value)">${shopFilterHtml}</select></span></label>
          <label class="dv-filter-group"><span class="dv-filter-label">状态</span><span class="dv-select-wrap"><select class="dv-filter-select" onchange="hzSetStatusFilter(this.value)">${statusFilterHtml}</select></span></label>
          <label class="dv-filter-group"><span class="dv-filter-label">等级</span><span class="dv-select-wrap"><select class="dv-filter-select" onchange="hzSetLevelFilter(this.value)">${levelFilterHtml}</select></span></label>
        </div>
        <input class="ev-search-input" value="${hzSearchKeyword}" placeholder="搜索隐患/商铺/状态" oninput="hzSetSearch(this.value)">
      </div>
      <div class="data-table-wrap">
        <div class="list-head-row hz-row">
          <span>隐患</span><span>等级</span><span>商铺</span><span>上报时间</span><span>状态</span><span>操作</span>
        </div>
        <div class="hz-list" id="hzList">${listHtml}</div>
      </div>
      ${hzPagination}
    </div>`;

  /* ECharts 环形图 */
  renderHazardCharts(pending, processing, done, shopsWithHazards);
}

export function renderHazardCharts(pending, processing, done, shopsWithHazards){
  const baseStyle = {
    type:'pie', radius:['55%','85%'], avoidLabelOverlap:false,
    label:{show:false}, labelLine:{show:false},
    itemStyle:{borderColor:'#fff', borderWidth:2}
  };

  /* 隐患总数分布 */
  const totalEl = document.getElementById('hzTotalChart');
  if(totalEl){
    const chart = echarts.init(totalEl);
    const data = [
      {value:pending, name:'待整改', itemStyle:{color:cv('--alert')}},
      {value:processing, name:'整改中', itemStyle:{color:cv('--orange')}},
      {value:done, name:'已闭环', itemStyle:{color:cv('--green')}}
    ];
    chart.setOption({series:[{...baseStyle, data}]});
  }

  /* 闭环率 */
  const doneEl = document.getElementById('hzDoneChart');
  if(doneEl){
    const chart = echarts.init(doneEl);
    const total = pending+processing+done;
    const rate = total>0 ? Math.round(done/total*100) : 0;
    chart.setOption({series:[{...baseStyle, data:[
      {value:done, name:'已闭环', itemStyle:{color:cv('--green')}},
      {value:total-done, name:'未闭环', itemStyle:{color:'#eef0f3'}}
    ]}]});
  }

  /* 商户分布 */
  const shopEl = document.getElementById('hzShopChart');
  if(shopEl){
    const chart = echarts.init(shopEl);
    const openCnt = shopsWithHazards.filter(s=>(SHOP_EVENTS[s.id]||[]).some(e=>e.type==='hazard'&&(e.status==='pending'||e.status==='processing'))).length;
    const closedCnt = shopsWithHazards.length - openCnt;
    chart.setOption({series:[{...baseStyle, data:[
      {value:openCnt, name:'有未闭环', itemStyle:{color:cv('--alert')}},
      {value:closedCnt, name:'全部闭环', itemStyle:{color:cv('--green')}}
    ]}]});
  }
}

export function hzFilterShop(shopId){
  hzCurrentShop = shopId;
  hzPage = 1;
  renderHazards();
}

export function hzSetStatusFilter(f){
  hzStatusFilter = f;
  hzPage = 1;
  renderHazards();
}

export function hzSetLevelFilter(f){
  hzLevelFilter = f;
  hzPage = 1;
  renderHazards();
}

export function hzSetSearch(value){
  hzSearchKeyword = value;
  hzPage = 1;
  renderHazards();
  const input = document.querySelector('.ev-list-tools .ev-search-input');
  if(input){ input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
}

export function hzSetPage(page){
  hzPage = Math.max(1, page);
  renderHazards();
}

export { showEventDetail }
