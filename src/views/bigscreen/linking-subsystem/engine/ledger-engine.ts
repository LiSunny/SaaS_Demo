import { cv, initChart, openOverlay, toolbarHtml } from './shared-engine'
import { icoExportSmall, icoPlusSmall, icoRefreshSmall } from './icon-consts'
import { getLifeInfo, showDeviceDetail, showEventDetail } from './cross-module'
import { DEVICES } from '../data/devices'
// 模块5引擎：设备生命周期系统（原 renderLedger 族）
// 原 index.html renderContent 分发对应的渲染函数族，原样提取，仅 content→入参





export let bindSelectModule = (id: number) => {}
export function setModuleSwitch(fn: (id: number) => void) { bindSelectModule = fn }

let lgTypeFilter = 'all'
let lgStatusFilter = 'all'
let lgSearchKeyword = ''
let lgPage = 1
const LG_PAGE_SIZE = 15
let activeContainer: HTMLElement
export function bindContainer(el: HTMLElement) { activeContainer = el }

export function renderLedger(body: HTMLElement, container?: HTMLElement){
  const content = container || body;
  body.style.overflowY = 'hidden';
  const total = DEVICES.length;
  const smokeAll = DEVICES.filter(d=>d.type==='smoke').length;
  const gasAll = DEVICES.filter(d=>d.type==='gas').length;
  const lifeCounts = DEVICES.reduce((acc,d)=>{
    acc[getLifeInfo(d).cls]++;
    return acc;
  }, {ok:0, watch:0, due:0, expired:0});

  /* 筛选：类型 → 状态 → 模糊搜索 */
  let list = DEVICES;
  if(lgTypeFilter!=='all') list = list.filter(d=>d.type===lgTypeFilter);
  if(lgStatusFilter!=='all') list = list.filter(d=>getLifeInfo(d).cls===lgStatusFilter);
  const lgKw = lgSearchKeyword.trim().toLowerCase();
  if(lgKw) list = list.filter(d=>{
    const life = getLifeInfo(d);
    return `${d.code} ${d.shop} ${d.pos} ${life.label} ${d.install} ${d.lastMaint}`.toLowerCase().includes(lgKw);
  });
  const lgTotalPages = Math.max(1, Math.ceil(list.length / LG_PAGE_SIZE));
  if(lgPage > lgTotalPages) lgPage = lgTotalPages;
  const pageList = list.slice((lgPage-1)*LG_PAGE_SIZE, lgPage*LG_PAGE_SIZE);
  const lgTypeHtml = [
    {key:'all', label:'全部类型', count:total},
    {key:'smoke', label:'烟感', count:smokeAll},
    {key:'gas', label:'燃气', count:gasAll}
  ].map(f=>`<option value="${f.key}" ${lgTypeFilter===f.key?'selected':''}>${f.label}</option>`).join('');
  const lgStatusHtml = [
    {key:'all', label:'全部寿命', count:total},
    {key:'ok', label:'服役中', count:lifeCounts.ok},
    {key:'watch', label:'关注观察', count:lifeCounts.watch},
    {key:'due', label:'临近到期', count:lifeCounts.due},
    {key:'expired', label:'超期服役', count:lifeCounts.expired}
  ].map(f=>`<option value="${f.key}" ${lgStatusFilter===f.key?'selected':''}>${f.label}</option>`).join('');
  const lgPageButtons = Array.from({length:lgTotalPages},(_,i)=>i+1).map(p=>
    `<button type="button" class="ev-page-btn ${p===lgPage?'active':''}" onclick="lgSetPage(${p})">${p}</button>`
  ).join('');
  const lgPagination = `
    <div class="ev-pagination">
      <span class="ev-page-info">共 ${list.length} 台，每页 ${LG_PAGE_SIZE} 台</span>
      <button type="button" class="ev-page-btn" onclick="lgSetPage(${lgPage-1})" ${lgPage<=1?'disabled':''}>上一页</button>
      ${lgPageButtons}
      <button type="button" class="ev-page-btn" onclick="lgSetPage(${lgPage+1})" ${lgPage>=lgTotalPages?'disabled':''}>下一页</button>
    </div>`;

  const rows = pageList.map(d=>{
    const typeLabel = d.type==='smoke'?'烟感探测器':'燃气探测器';
    const imgFile = d.type==='smoke'?'/linking-subsystem/烟雾报警器_4g-2.svg':'/linking-subsystem/燃气探测器.svg';
    const life = getLifeInfo(d);
    return `<div class="lg-item data-row lg-row" onclick="showDeviceDetail('${d.id}','ledger')">
      <div class="data-main">
        <div class="data-title"><span class="lg-ico"><img src="${imgFile}" alt=""></span>${typeLabel}<span class="lg-code">${d.code}</span></div>
      </div>
      <div class="data-cell">${d.shop}</div>
      <div class="data-cell muted">${d.pos}</div>
      <div class="data-cell muted">${d.install}</div>
      <div class="lg-life">
        <div class="lg-life-top"><span class="lg-life-main">${life.usedText} / ${life.totalText}</span><span class="lg-life-pct">${life.rawPct}%</span></div>
        <div class="lg-life-bar"><i class="${life.cls}" style="width:${life.pct}%"></i></div>
        <div class="lg-life-sub">预计 ${life.expireText} 到期 · ${life.remainingText}</div>
      </div>
      <div class="data-cell muted">${d.lastMaint}</div>
      <div><span class="st ${life.cls}">${life.label}</span></div>
      <div class="row-actions">
        <button type="button" class="row-action" onclick="event.stopPropagation();showDeviceDetail('${d.id}','ledger')">档案</button>
      </div>
    </div>`;
  }).join('');

  content.innerHTML = `
    ${toolbarHtml('设备生命周期台账', [
      {label:'设备类型：全部'},
      {label:'维保：全部'},
      {label:'寿命：全部'}
    ], [
      {label:'刷新', icon:icoRefreshSmall},
      {label:'导出', icon:icoExportSmall},
      {label:'新增设备', icon:icoPlusSmall, primary:true}
    ])}
    <div class="sh-stats">
      <div class="sh-stat"><div class="shs-label">设备总数</div><div class="shs-value">${total}<span class="unit">台</span></div><div class="shs-sub">烟感 ${smokeAll} · 燃气 ${gasAll}</div></div>
      <div class="sh-stat"><div class="shs-label">寿命正常</div><div class="shs-value">${lifeCounts.ok}<span class="unit">台</span></div><div class="shs-sub">处于稳定服役期</div></div>
      <div class="sh-stat"><div class="shs-label">临近到期</div><div class="shs-value" style="${lifeCounts.due>0?'color:#b45309;':''}">${lifeCounts.due}<span class="unit">台</span></div><div class="shs-sub">建议纳入更换计划</div></div>
      <div class="sh-stat"><div class="shs-label">超期服役</div><div class="shs-value" style="${lifeCounts.expired>0?'color:#d63b2f;':''}">${lifeCounts.expired}<span class="unit">台</span></div><div class="shs-sub">需核查或待更换</div></div>
    </div>
    <div class="dv-record-panel lg-record-panel">
      <div class="ev-list-tools">
        <div class="dv-list-tools-left">
          <label class="dv-filter-group"><span class="dv-filter-label">类型</span><span class="dv-select-wrap"><select class="dv-filter-select" onchange="lgSetTypeFilter(this.value)">${lgTypeHtml}</select></span></label>
          <label class="dv-filter-group"><span class="dv-filter-label">寿命</span><span class="dv-select-wrap"><select class="dv-filter-select" onchange="lgSetStatusFilter(this.value)">${lgStatusHtml}</select></span></label>
        </div>
        <input class="ev-search-input" value="${lgSearchKeyword}" placeholder="搜索设备/商铺/位置" oninput="lgSetSearch(this.value)">
      </div>
      <div class="data-table-wrap">
        <div class="list-head-row lg-row">
            <span>设备</span><span>所属商铺</span><span>安装位置</span><span>安装日期</span><span>设备寿命</span><span>最近维保</span><span>生命周期状态</span><span>操作</span>
        </div>
        <div class="lg-list" id="lgList">${rows}</div>
      </div>
      ${lgPagination}
    </div>`;
}

export function lgSetTypeFilter(f){
  lgTypeFilter = f;
  lgPage = 1;
  renderLedger();
}

export function lgSetStatusFilter(f){
  lgStatusFilter = f;
  lgPage = 1;
  renderLedger();
}

export function lgSetSearch(value){
  lgSearchKeyword = value;
  lgPage = 1;
  renderLedger();
  const input = document.querySelector('.ev-list-tools .ev-search-input');
  if(input){ input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
}

export function lgSetPage(page){
  lgPage = Math.max(1, page);
  renderLedger();
}
