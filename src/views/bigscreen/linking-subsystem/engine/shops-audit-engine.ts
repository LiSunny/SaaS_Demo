import { cv, initChart, openOverlay, toolbarHtml } from './shared-engine'
import { icoExportSmall, icoPlusSmall, icoRefreshSmall } from './icon-consts'
import { renderShopDeviceChart, shopDetailHtml, showEventDetail } from './cross-module'
import { SHOPS, STREETS } from '../data/shops'
// 模块4引擎：商铺数字档案系统（原 renderShops 族）
// 原 index.html renderContent 分发对应的渲染函数族，原样提取，仅 content→入参

import * as echarts from 'echarts'




export let bindSelectModule = (id: number) => {}
export function setModuleSwitch(fn: (id: number) => void) { bindSelectModule = fn }

let shMetricFilter = 'all'
let shTypeFilter = 'all'
let shStatusFilter = 'all'
let shSearchKeyword = ''
let shPage = 1
const SH_PAGE_SIZE = 15
let activeContainer: HTMLElement
export function bindContainer(el: HTMLElement) { activeContainer = el }

export { openOverlay }

export function renderShops(body: HTMLElement, container?: HTMLElement){
  const content = container || body;
  body.style.overflowY = 'hidden';
  const total = SHOPS.length;
  const alarmCount = SHOPS.reduce((a,s)=>a+(s.alarms||0),0);
  const hazardCount = SHOPS.reduce((a,s)=>a+(s.hazards||0),0);
  const devTotal = SHOPS.reduce((a,s)=>a+(s.devices?s.devices.total:0),0);
  const avgDuty = Math.round(SHOPS.reduce((a,s)=>a+(s.dutyRate||0),0)/total);
  const deviceShopCount = SHOPS.filter(s=>(s.devices?s.devices.total:0)>0).length;
  const hazardShopCount = SHOPS.filter(s=>(s.hazards||0)>0).length;
  const alarmShopCount = SHOPS.filter(s=>(s.alarms||0)>0).length;
  const typeFilteredShops = shTypeFilter==='all' ? SHOPS : SHOPS.filter(s=>s.type===shTypeFilter);
  const statusFilteredShops = SHOPS.filter(s=>shMatchesMetric(s, shMetricFilter));
  const typeCounts = [...new Set(statusFilteredShops.map(s=>s.type))].map(type=>({
    key:type,
    label:type,
    count:statusFilteredShops.filter(s=>s.type===type).length
  }));
  const statusCounts = {
    total:typeFilteredShops.length,
    alarms:typeFilteredShops.filter(s=>(s.alarms||0)>0).length,
    hazards:typeFilteredShops.filter(s=>(s.hazards||0)>0).length,
    lowDuty:typeFilteredShops.filter(s=>(s.dutyRate||0)<75).length,
    goodDuty:typeFilteredShops.filter(s=>(s.dutyRate||0)>=90).length
  };
  const typeFilterLabel = shTypeFilter==='all' ? '全部' : shTypeFilter;
  const metricFilterLabel = shMetricFilter==='devices' ? '有设备'
    : shMetricFilter==='hazards' ? '在管隐患'
    : shMetricFilter==='alarms' ? '未处置告警'
    : '全部';
  const statusFilterLabel = shStatusFilter==='alarms' ? '有告警'
    : shStatusFilter==='hazards' ? '有隐患'
    : shStatusFilter==='lowDuty' ? '履责偏低'
    : shStatusFilter==='goodDuty' ? '履责良好'
    : '全部';

  let list = SHOPS.filter(s=>shMatchesMetric(s, shMetricFilter));
  if(shTypeFilter!=='all') list = list.filter(s=>s.type===shTypeFilter);
  list = list.filter(s=>shMatchesStatus(s, shStatusFilter));
  const normalizedKeyword = shSearchKeyword.trim().toLowerCase();
  if(normalizedKeyword){
    list = list.filter(s=>`${s.name} ${s.type} ${s.address} ${s.owner} ${s.phone}`.toLowerCase().includes(normalizedKeyword));
  }
  const totalPages = Math.max(1, Math.ceil(list.length / SH_PAGE_SIZE));
  if(shPage > totalPages) shPage = totalPages;
  const pageList = list.slice((shPage-1)*SH_PAGE_SIZE, shPage*SH_PAGE_SIZE);

  const cards = pageList.length ? pageList.map(s=>{
    const dutyCls = s.dutyRate>=90?'':s.dutyRate>=70?'warn':'bad';
    return `<div class="sh-card data-row sh-row" onclick="showShopDetail(${s.id})">
      <div class="data-main">
        <div class="data-title">${s.name}</div>
        <div class="data-sub">${s.address} · ${s.owner} · ${s.phone}</div>
      </div>
      <div><span class="sh-type">${s.type}</span></div>
      <div class="data-cell">${s.devices?s.devices.total:0} 台</div>
      <div class="data-cell ${(s.alarms||0)>0?'danger':''}">${s.alarms||0} 起告警</div>
      <div>
        <span class="sh-dutybar" style="display:inline-block;width:58px;margin:0 6px 0 0;vertical-align:middle"><i class="${dutyCls}" style="width:${s.dutyRate}%"></i></span>
        <span class="sh-duty-num">${s.dutyRate}%</span>
      </div>
      <div class="row-actions">
        <button type="button" class="row-action" onclick="event.stopPropagation();showQRCode(${s.id})">应消码</button>
        <button type="button" class="row-action" onclick="event.stopPropagation();showShopDetail(${s.id})">档案</button>
      </div>
    </div>`;
  }).join('') : '<div style="text-align:center;padding:40px;color:var(--muted);font-size:14px">暂无商铺记录</div>';
  const typeFilterHtml = [
    {key:'all', label:'全部业态', count:statusFilteredShops.length},
    ...typeCounts
  ].map(f=>`<option value="${f.key}" ${shTypeFilter===f.key?'selected':''}>${f.label}</option>`).join('');
  const statusFilterHtml = [
    {key:'all', label:'全部状态', count:statusCounts.total},
    {key:'alarms', label:'有告警', count:statusCounts.alarms},
    {key:'hazards', label:'有隐患', count:statusCounts.hazards},
    {key:'lowDuty', label:'履责偏低', count:statusCounts.lowDuty},
    {key:'goodDuty', label:'履责良好', count:statusCounts.goodDuty}
  ].map(f=>`<option value="${f.key}" ${shStatusFilter===f.key?'selected':''}>${f.label}</option>`).join('');
  const pageButtons = Array.from({length:totalPages},(_,i)=>i+1).map(p=>
    `<button type="button" class="ev-page-btn ${p===shPage?'active':''}" onclick="shSetPage(${p})">${p}</button>`
  ).join('');
  const paginationHtml = `
    <div class="ev-pagination">
      <span class="ev-page-info">共 ${list.length} 家，每页 ${SH_PAGE_SIZE} 家</span>
      <button type="button" class="ev-page-btn" onclick="shSetPage(${shPage-1})" ${shPage<=1?'disabled':''}>上一页</button>
      ${pageButtons}
      <button type="button" class="ev-page-btn" onclick="shSetPage(${shPage+1})" ${shPage>=totalPages?'disabled':''}>下一页</button>
    </div>`;

  content.innerHTML = `
    ${toolbarHtml('商铺数字档案', [
      {label:`业态：${typeFilterLabel}`},
      {label:'网格：全部'},
      {label:`状态：${metricFilterLabel} / ${statusFilterLabel}`}
    ], [
      {label:'刷新', icon:icoRefreshSmall},
      {label:'导出', icon:icoExportSmall},
      {label:'新增商铺', icon:icoPlusSmall, primary:true}
    ])}
    <div class="sh-stats">
      <div class="sh-stat clickable ${shMetricFilter==='all'?'active':''}" onclick="shSetMetricFilter('all')"><div class="shs-label">接入商铺</div><div class="shs-value">${total}<span class="unit">家</span></div><div class="shs-sub">一店一码全覆盖</div></div>
      <div class="sh-stat clickable ${shMetricFilter==='devices'?'active':''}" onclick="shSetMetricFilter('devices')"><div class="shs-label">设备覆盖商铺</div><div class="shs-value">${deviceShopCount}<span class="unit">家</span></div><div class="shs-sub">共 ${devTotal} 台设备</div></div>
      <div class="sh-stat clickable ${shMetricFilter==='hazards'?'active':''}" onclick="shSetMetricFilter('hazards')"><div class="shs-label">在管隐患商铺</div><div class="shs-value">${hazardShopCount}<span class="unit">家</span></div><div class="shs-sub">共 ${hazardCount} 处隐患</div></div>
      <div class="sh-stat clickable ${shMetricFilter==='alarms'?'active':''}" onclick="shSetMetricFilter('alarms')"><div class="shs-label">未处置告警商铺</div><div class="shs-value" style="${alarmShopCount>0?'color:#d63b2f;':''}">${alarmShopCount}<span class="unit">家</span></div><div class="shs-sub">共 ${alarmCount} 起 · 履责 ${avgDuty}%</div></div>
    </div>
    <div class="dv-record-panel sh-record-panel sh-table-wrap">
      <div class="ev-list-tools">
        <div class="dv-list-tools-left">
          <label class="dv-filter-group"><span class="dv-filter-label">业态</span><span class="dv-select-wrap"><select class="dv-filter-select" onchange="shSetTypeFilter(this.value)">${typeFilterHtml}</select></span></label>
          <label class="dv-filter-group"><span class="dv-filter-label">状态</span><span class="dv-select-wrap"><select class="dv-filter-select" onchange="shSetStatusFilter(this.value)">${statusFilterHtml}</select></span></label>
        </div>
        <input class="ev-search-input" value="${shSearchKeyword}" placeholder="搜索商铺/地址/联系人" oninput="shSetSearch(this.value)">
      </div>
      <div class="data-table-wrap">
        <div class="list-head-row sh-row">
          <span>商铺</span><span>业态</span><span>设备</span><span>告警</span><span>履责率</span><span>操作</span>
        </div>
        <div class="sh-list">${cards}</div>
      </div>
      ${paginationHtml}
    </div>`;
}

export function shMatchesMetric(s, filter){
  if(filter==='devices') return (s.devices?s.devices.total:0) > 0;
  if(filter==='hazards') return (s.hazards||0) > 0;
  if(filter==='alarms') return (s.alarms||0) > 0;
  return true;
}

export function shMatchesStatus(s, filter){
  if(filter==='alarms') return (s.alarms||0) > 0;
  if(filter==='hazards') return (s.hazards||0) > 0;
  if(filter==='lowDuty') return (s.dutyRate||0) < 75;
  if(filter==='goodDuty') return (s.dutyRate||0) >= 90;
  return true;
}

export function qrSvg(seed){
  let s = seed*2654435761 % 2147483647;
  const rnd = ()=>{ s = (s*1103515245+12345) % 2147483648; return s/2147483648; };
  const n = 21, cell = 100/n;
  let cells = '';
  for(let y=0;y<n;y++){ for(let x=0;x<n;x++){
    let fill;
    if((x<7&&y<7)||(x>=14&&y<7)||(x<7&&y>=14)) fill = (x%7===0||y%7===0||x===6||y===6||x%7===6||y%7===6)?'#1f2329':'#fff';
    else fill = rnd()>0.5?'#1f2329':'#fff';
    cells += `<rect x="${x*cell}" y="${y*cell}" width="${cell}" height="${cell}" fill="${fill}"/>`;
  }}
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#fff"/>${cells}</svg>`;
}

export function shSetMetricFilter(f){
  shMetricFilter = f;
  shPage = 1;
  renderShops();
}

export function shSetTypeFilter(f){
  shTypeFilter = f;
  shPage = 1;
  renderShops();
}

export function shSetStatusFilter(f){
  shStatusFilter = f;
  shPage = 1;
  renderShops();
}

export function shSetSearch(value){
  shSearchKeyword = value;
  shPage = 1;
  renderShops();
  const input = document.querySelector('.sh-record-panel .ev-search-input');
  if(input){
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

export function shSetPage(page){
  shPage = Math.max(1, page);
  renderShops();
}

export function showShopDetail(id){
  const s = SHOPS.find(x=>x.id===id);
  if(!s) return;
  openOverlay('dv-detail-overlay', `
    <div class="dv-detail" onclick="event.stopPropagation()">
      <div class="dd-top">
        <span class="dd-back" onclick="this.closest('.dv-detail-overlay').remove()">← 返回店铺列表</span>
        <div class="dd-top-right">
          <span class="dd-btn edit" onclick="showQRCode(${s.id})">查看应消码</span>
        </div>
      </div>
      <div class="dv-detail-body sh-drawer-body">
        <div class="sh-drawer-detail">${shopDetailHtml(id, true)}</div>
      </div>
    </div>`);
  requestAnimationFrame(()=>renderShopDeviceChart(id));
}

export function showQRCode(id){
  const s = SHOPS.find(x=>x.id===id);
  if(!s) return;
  openOverlay('sd-modal-overlay', `
    <div class="sd-modal qr-modal" onclick="event.stopPropagation()">
      <div class="sd-modal-head">
        <span class="sd-modal-title">应消码 · ${s.name}</span>
        <div class="sd-modal-close" onclick="this.closest('.sd-modal-overlay').remove()">✕</div>
      </div>
      <div class="sd-modal-body qr-modal-body">
        <img class="qr-img" src="应消码示例.png" alt="应消码">
      </div>
    </div>`);
}

export function disposeCharts(){
  if(evMarqueeRaf){
    cancelAnimationFrame(evMarqueeRaf);
    evMarqueeRaf = 0;
  }
  if(typeof echarts==='undefined') return;
  document.querySelectorAll('#content [id]').forEach(el=>{
    const inst = echarts.getInstanceByDom(el);
    if(inst) inst.dispose();
  });
}
