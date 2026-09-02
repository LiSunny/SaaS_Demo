import { cv, disposeCharts, initChart, openOverlay, toolbarHtml, uiToast } from './shared-engine'
import { icoExportSmall, icoPlusSmall, icoRefreshSmall } from './icon-consts'
import { showEventDetail } from './cross-module'
import { getAllEvents } from './events-engine'
import { SHOPS } from '../data/shops'
import { SHOP_EVENTS, BEFORE_PHOTO_POOL } from '../data/shop-events'
// 模块6引擎：隐患排查治理系统（原 renderHazards 族）
// 原 index.html renderContent 分发对应的渲染函数族，原样提取，仅 content→入参

import * as echarts from 'echarts'


/* ===== 第一屏/二级页 视图切换（方案A：子系统内 view 状态，无独立路由） ===== */
let hzView: 'overview' | 'list' = 'overview'

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
  if (s.hzCurrentShop !== undefined) { hzCurrentShop = s.hzCurrentShop; hzView = 'list' }
}

/* ===== 隐患数据统一获取（第一屏/二级页共用） ===== */
function hazardData(){
  const allHazards = getAllEvents().filter(e=>e.type==='hazard');
  const pending = allHazards.filter(e=>e.status==='pending').length;
  const processing = allHazards.filter(e=>e.status==='processing').length;
  const done = allHazards.filter(e=>e.status==='done').length;
  const totalHazards = allHazards.length;
  const shopsWithHazards = SHOPS.filter(s=>{
    const events = SHOP_EVENTS[s.id] || [];
    return events.some(e=>e.type==='hazard');
  });
  return { allHazards, pending, processing, done, totalHazards, shopsWithHazards };
}

/* ===== 概览入口：分发 overview / list ===== */
export function renderHazards(body?: HTMLElement, container?: HTMLElement){
  disposeHazardsMap();
  if (hzView === 'list') { renderHazardsList(body, container); return }
  renderHazardsOverview(body, container);
}

/* ============ 第一屏：三栏仪表盘（按设计稿 ii478VTDQ5RBGJKeCVmQJ1 112-16669） ============ */
/* 每个统计卡一个线性 SVG 图标（禁 emoji） */
function hzKpiIcon(name: string): string {
  const m: Record<string,string> = {
    open: '<path d="M12 8a4 4 0 100 8 4 4 0 000-8z"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
    add: '<path d="M12 8v8M8 12h8M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
    done: '<path d="M12 21a9 9 0 100-18 9 9 0 000 18z"/><path d="M8 12l3 3 5-6"/>',
    shop: '<path d="M3 9l1-5h16l1 5"/><path d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0"/><path d="M5 12v8h14v-8"/>',
    overdue: '<path d="M12 9v4l2.5 2.5"/><path d="M12 21a9 9 0 100-18 9 9 0 000 18z"/>',
    major: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5"/><path d="M12 18h.01"/>',
    feed: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    fullscreen: '<path d="M8 3H5a2 2 0 00-2 2v3"/><path d="M16 3h3a2 2 0 012 2v3"/><path d="M8 21H5a2 2 0 01-2-2v-3"/><path d="M16 21h3a2 2 0 002-2v-3"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${m[name]||m.open}</svg>`;
}

function hzPanelHead(title: string, right?: string, tip?: string): string {
  const info = tip
    ? `<span class="hz-title-info" data-tip="${tip.replace(/"/g, '&quot;')}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-5"/><path d="M12 8h.01"/></svg>
      </span>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hz-title-info"><circle cx="12" cy="12" r="9"/><path d="M12 16v-5"/><path d="M12 8h.01"/></svg>`;
  return `
    <div class="hz-panel-head">
      <div class="hz-panel-title">${title}${info}</div>
      <div class="hz-panel-right">${right || ''}</div>
    </div>`;
}

/* 统计卡：统一封装（设计稿式「图标 + 标题 + 大数值」，无 sub 行） */
function hzKpiCard(label: string, value: number|string, icon: string, valueClass: string = ''): string {
  return `
    <div class="hz-kpi">
      <div class="hz-kpi-icon">${hzKpiIcon(icon)}</div>
      <div class="hz-kpi-mid">
        <div class="hz-kpi-label">${label}</div>
        <div class="hz-kpi-value ${valueClass}">${value}</div>
      </div>
    </div>`;
}

function hzLevelLabel(lv){ return lv==='urgent'?'重大':lv==='warning'?'较大':'一般'; }
function hzStatusLabel(st){ return st==='pending'?'待整改':st==='processing'?'处置中':'已闭环'; }

/* ===== 第一屏概览（新增） ===== */
export function renderHazardsOverview(body?: HTMLElement, container?: HTMLElement){
  body = body || activeContainer
  disposeCharts();
  const content = container || body;
  body.style.overflowY = 'hidden';

  const { allHazards, pending, processing, done } = hazardData();
  const today = new Date().toISOString().slice(0,10);
  const todayNew = allHazards.filter(e=>e.time.startsWith(today)).length;
  const totalHazards = allHazards.length;
  const overdue = allHazards.filter(e=>hzIsOverdue(e)).length;
  const closedRate = totalHazards > 0 ? Math.round(done/totalHazards*100) : 0;

  /* 隐患清单：近期若干条 */
  const recent = [...allHazards].sort((a,b)=> (b.time||'').localeCompare(a.time||'')).slice(0,6);
  const miniList = recent.map(e=>`
    <div class="hz-mini-row" onclick="showEventDetail('${e.id}')">
      <span class="hz-item-level ${e.level}">${hzLevelLabel(e.level)}</span>
      <span class="hz-mini-title">${e.title.replace('排查隐患：','')}</span>
      <span class="hz-mini-shop">${e.shop}</span>
      <span class="hz-item-status ${hzIsOverdue(e)?'overdue':e.status}">${hzIsOverdue(e)?'超期未整改':hzStatusLabel(e.status)}</span>
    </div>`).join('') || '<div class="hz-mini-empty">暂无隐患记录</div>';

  /* 未闭环隐患商户 TOP5：按商户统计未闭环隐患数，取前 5 */
  const topShops = SHOPS
    .map(s=>{
      const events = SHOP_EVENTS[s.id] || [];
      const open = events.filter(e=>e.type==='hazard' && (e.status==='pending' || e.status==='processing')).length;
      return { name:s.name, open };
    })
    .filter(s=>s.open > 0)
    .sort((a,b)=>b.open - a.open)
    .slice(0,5);
  const topListHtml = topShops.length
    ? topShops.map((s,i)=>`
        <div class="hz-top-row" onclick="hzOpenShopList(${SHOPS.find(x=>x.name===s.name)?.id || 0})">
          <span class="hz-top-rank">${i+1}</span>
          <span class="hz-top-name">${s.name}</span>
          <span class="hz-top-cnt">未闭环 ${s.open} 条</span>
        </div>`).join('')
    : '<div class="hz-mini-empty">暂无未闭环隐患商户</div>';

  /* 实时动态：复用智能感知告警系统的「实时告警态势」卡片（ev-shop-card），垂直滚动 */
  const feedEvents = [...allHazards].sort((a,b)=> (b.time||'').localeCompare(a.time||''));
  const feedListHtml = feedEvents.map(e=>{
    const statusLabel = e.status==='pending' ? '待整改' : e.status==='processing' ? '处置中' : '已闭环';
    const statusColor = e.status==='done'||e.status==='closed' ? 'var(--green)' : (e.level==='urgent' ? 'var(--alert)' : 'var(--orange)');
    return `
      <div class="ev-shop-card hz-feed-card" onclick="showEventDetail('${e.id}')">
        <div class="ev-shop-card-head">
          <span class="ev-shop-card-name">${e.shop}</span>
          <span class="ev-shop-card-time">${e.time.slice(5,16).replace('-', '/')}</span>
        </div>
        <div class="ev-shop-card-title">${e.title.replace('排查隐患：','')}</div>
        <div class="ev-shop-card-row">
          <span><span class="ev-shop-card-dot" style="background:${statusColor}"></span>${evTypeLabel(e)}</span>
          <span>${statusLabel}</span>
        </div>
      </div>`;
  }).join('') || '<div class="hz-mini-empty">暂无隐患动态</div>';

  content.innerHTML = `
    <div class="hz-dash">
      <!-- 左栏 -->
      <div class="hz-dash-col hz-dash-left">
        <div class="hz-panel hz-panel-overview" style="flex:1 1 0;">
          ${hzPanelHead('辖区概览', `<div class="hz-panel-date">${today}</div>`,
            `「辖区概览」统计口径：\n· 未闭环隐患 = 待整改 + 处置中\n· 超期未整改 = 未闭环隐患中，超整改期限（疏散通道 24h / 电线 48h 等）仍未闭环的数量\n· 今日新增 = 当天新上报隐患数（00:00-24:00）\n· 闭环率 = 已闭环隐患 ÷ 累计上报隐患（含待整改、处置中、已闭环），基于全部历史累计`)}
          <div class="hz-kpi-grid">
            ${hzKpiCard('未闭环隐患', pending+processing, 'open', (pending+processing)>0 ? 'value-danger' : '')}
            ${hzKpiCard('今日新增', todayNew, 'add', todayNew>0 ? 'value-danger' : '')}
            ${hzKpiCard('超期未整改', overdue, 'overdue', overdue>0 ? 'value-danger' : '')}
            ${hzKpiCard('闭环率', closedRate + '%', 'done', closedRate<50 ? 'value-danger' : (closedRate<90 ? 'value-warn' : ''))}
          </div>
          <div class="hz-chart-block">
            <div class="hz-chart-title">上报趋势<span class="hz-chart-sub">近 7 日 · 隐患上报数</span></div>
            <div class="hz-trend-chart" id="hzTrendChart"></div>
          </div>
          <div class="hz-chart-block">
            <div class="hz-chart-title">分类分布<span class="hz-chart-sub">按隐患等级</span></div>
            <div class="hz-dist-chart" id="hzDistChart"></div>
          </div>
          <div class="hz-chart-block">
            <div class="hz-chart-title">未闭环隐患商户 TOP5<span class="hz-chart-sub">按未闭环数量</span></div>
            <div class="hz-top-list">${topListHtml}</div>
          </div>
        </div>
      </div>

      <!-- 中栏 -->
      <div class="hz-dash-col hz-dash-center">
        <div class="hz-panel hz-map-panel" style="flex:58 1 0;">
          ${hzPanelHead('隐患地图', `
            <div class="hz-map-actions">
              <button type="button" class="hz-icon-btn" title="全屏" onclick="hzMapFs()">${hzKpiIcon('fullscreen').replace('class="','class="hz-fs-ico "')}</button>
            </div>`)}
          <div class="hz-map-wrap"><div id="hzMap" class="hz-map-canvas"></div><div class="map-load-state" id="hzMapState">地图初始化中…</div></div>
        </div>
        <div class="hz-panel hz-panel-list" style="flex:34 1 0;">
          ${hzPanelHead('隐患清单', `<div class="hz-panel-more" onclick="hzShowList()">更多 ›</div>`)}
          <div class="hz-mini-list">${miniList}</div>
        </div>
      </div>

      <!-- 右栏 -->
      <div class="hz-dash-col hz-dash-right">
        <div class="hz-panel hz-panel-feed" style="flex:1 1 0;">
          ${hzPanelHead('实时动态', `<div class="hz-panel-date">${today}</div>`)}
          <div class="hz-feed-card-list" id="hzFeedList">
            ${feedListHtml}
          </div>
        </div>
      </div>
    </div>`;

  renderHazardMap();
  renderHazardTrend();
  renderHazardDist();
  startHazardFeedScroll();
}

/* ============ 辖区态势：近 7 日隐患上报趋势（ECharts 折线面积图，进场动画） ============ */
export function renderHazardTrend(){
  const el = document.getElementById('hzTrendChart') as HTMLElement;
  if(!el) return;
  disposeCharts();  /* 释放旧实例 */
  const chart = initChart(el);
  if(!chart || typeof chart === 'undefined') return;

  const allHazards = getAllEvents().filter(e=>e.type==='hazard');
  /* 近 7 天日期轴 */
  const days: string[] = [];
  const counts: number[] = [];
  for(let i=6;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().slice(0,10);
    days.push(key.slice(5));  /* MM-DD */
    counts.push(allHazards.filter(e=>e.time.startsWith(key)).length);
  }

  chart.setOption({
    animation: true,
    animationDuration: 1200,
    animationEasing: 'cubicOut',
    grid: { left: 34, right: 16, top: 24, bottom: 24 },
    tooltip: { trigger:'axis', backgroundColor:'#fff', borderColor:'#dbe4ef', textStyle:{color:'#233850', fontSize:12}, axisPointer:{ type:'line', lineStyle:{ color:'#c3d2e4' } } },
    xAxis: {
      type:'category', boundaryGap:false, data: days,
      axisLine:{ lineStyle:{ color:'#dbe4ef' } },
      axisTick:{ show:false },
      axisLabel:{ color:'#7c8ba0', fontSize:11, interval:0 }
    },
    yAxis: {
      type:'value', minInterval:1,
      splitLine:{ lineStyle:{ color:'#e7edf6' } },
      axisLabel:{ color:'#7c8ba0', fontSize:11 }
    },
    series: [{
      name:'上报隐患', type:'line',
      data: counts, smooth:true, symbol:'circle', symbolSize:6,
      lineStyle:{ width:2.5, color:'#1754b5' },
      itemStyle:{ color:'#1754b5', borderColor:'#fff', borderWidth:2 },
      areaStyle:{
        color: {
          type:'linear', x:0, y:0, x2:0, y2:1,
          colorStops:[
            { offset:0, color:'rgba(23,84,181,.28)' },
            { offset:1, color:'rgba(23,84,181,0)' }
          ]
        }
      },
      emphasis:{ focus:'series' }
    }]
  });
}

/* ============ 辖区态势：隐患分类分布（按等级横向条形图，进场动画） ============ */
export function renderHazardDist(){
  const el = document.getElementById('hzDistChart') as HTMLElement;
  if(!el) return;
  const chart = initChart(el);
  if(!chart || typeof chart === 'undefined') return;

  const allHazards = getAllEvents().filter(e=>e.type==='hazard');
  const urgent = allHazards.filter(e=>e.level==='urgent').length;
  const warning = allHazards.filter(e=>e.level==='warning').length;
  const info = allHazards.filter(e=>e.level==='info').length;
  const data = [
    { name:'重大', value: urgent, color:'#0d3a7a' },
    { name:'较大', value: warning, color:'#1754b5' },
    { name:'一般', value: info, color:'#5b93dd' },
  ];

  chart.setOption({
    animation: true,
    animationDuration: 1200,
    animationEasing: 'cubicOut',
    grid: { left: 44, right: 32, top: 8, bottom: 8 },
    tooltip: { trigger:'axis', axisPointer:{ type:'shadow' }, backgroundColor:'#fff', borderColor:'#dbe4ef', textStyle:{color:'#233850', fontSize:12} },
    xAxis: { type:'value', minInterval:1, splitLine:{ lineStyle:{ color:'#e7edf6' } }, axisLabel:{ color:'#7c8ba0', fontSize:11 } },
    yAxis: {
      type:'category', data: data.map(d=>d.name),
      axisLine:{ show:false }, axisTick:{ show:false },
      axisLabel:{ color:'#46586d', fontSize:13, fontWeight:600 }
    },
    series: [{
      type:'bar', barWidth:14,
      data: data.map(d=>({ value:d.value, itemStyle:{ color:d.color, borderRadius:[0,7,7,0] } })),
      label:{ show:true, position:'right', color:'#233850', fontSize:13, fontWeight:700 },
      showBackground: true,
      backgroundStyle:{ color:'rgba(24,34,50,.04)', borderRadius:[0,7,7,0] },
      itemStyle:{ borderRadius:[0,7,7,0] }
    }]
  });
}

/* ============ 高德地图：隐患点位标注 ============ */
let hzMap: any = null
function hzShopLngLat(s){
  const baseLng = 119.6004;
  const baseLat = 39.9354;
  const lng = baseLng + (s.x - 50) * 0.00072;
  const lat = baseLat - (s.y - 50) * 0.00054;
  return [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
}
function hzMarkerHtml(s): string {
  const open = (SHOP_EVENTS[s.id]||[]).filter(e=>e.type==='hazard'&&(e.status==='pending'||e.status==='processing'));
  const color = open.some(e=>e.level==='urgent') ? '#d62409' : '#ff5252';
  return `
    <div class="hz-map-marker open" style="--mk:${color}" data-shop-id="${s.id}" onclick="event.stopPropagation();hzOpenShopList(${s.id})">
      <span class="hz-map-marker-dot"></span>
      <span class="hz-map-marker-tip">${s.name} · 未闭环 ${open.length} 条</span>
    </div>`;
}
function disposeHazardsMap(){
  if(hzMap){ try{ hzMap.destroy(); }catch(_){ /* noop */ } hzMap = null; }
}
function renderHazardMap(){
  const el = document.getElementById('hzMap');
  if(!el) return;
  const AMap = (window as any).AMap;
  if(typeof AMap === 'undefined'){
    const state = document.getElementById('hzMapState');
    if(state) state.textContent = '高德地图加载失败，请检查网络或 Key 配置';
    return;
  }
  el.innerHTML = '';
  const state = document.getElementById('hzMapState');
  if(state) state.remove();

  hzMap = new AMap.Map('hzMap', {
    zoom: 15,
    center: [119.6004, 39.9354],
    viewMode: '2D',
    resizeEnable: true,
    scrollWheel: false,
    touchZoom: false,
    doubleClickZoom: false,
    showBuildingBlock: true,
    mapStyle: 'amap://styles/whitesmoke'
  });

  const openShops = SHOPS.filter(s=>(SHOP_EVENTS[s.id]||[]).some(e=>e.type==='hazard'&&(e.status==='pending'||e.status==='processing')));
  const markers = openShops.map(s=>{
    const marker = new AMap.Marker({
      position: hzShopLngLat(s),
      anchor: 'bottom-center',
      content: hzMarkerHtml(s),
      offset: new AMap.Pixel(0, 0),
      extData: { shopId: s.id }
    });
    marker.setMap(hzMap);
    return marker;
  });

  hzMap.on('complete', ()=>{
    if(markers.length) hzMap.setFitView(null, false, [60,60,60,60]);
  });
}

/* ============ 实时动态：垂直自动滚动 ============ */
let hzFeedRaf = 0
function startHazardFeedScroll(){
  if(hzFeedRaf) cancelAnimationFrame(hzFeedRaf);
  const wrap = document.getElementById('hzFeedList') as HTMLElement;
  if(!wrap) return;
  /* 内容不溢出则不滚动 */
  if(wrap.scrollHeight <= wrap.clientHeight + 2) return;

  let lastTs = 0;
  let paused = false;
  wrap.addEventListener('mouseenter', ()=>{ paused = true; });
  wrap.addEventListener('mouseleave', ()=>{ paused = false; });

  const step = (ts: number)=>{
    if(!document.body.contains(wrap)) return;
    if(!lastTs) lastTs = ts;
    const dt = ts - lastTs;
    lastTs = ts;
    if(!paused){
      wrap.scrollTop += dt * 0.018;
      const maxTop = wrap.scrollHeight - wrap.clientHeight;
      if(wrap.scrollTop >= maxTop - 1){
        wrap.scrollTop = 0;   /* 滚到底后循环回顶部 */
      }
    }
    hzFeedRaf = requestAnimationFrame(step);
  };
  hzFeedRaf = requestAnimationFrame(step);
}

/* 全屏地图 */
export function hzMapFs(){
  const wrap = document.querySelector('.hz-map-wrap') as HTMLElement;
  if(!wrap) return;
  if(document.fullscreenElement){ document.exitFullscreen(); return; }
  const fs = wrap.querySelector('.hz-map-canvas') as HTMLElement;
  if(fs && fs.requestFullscreen) fs.requestFullscreen();
  else wrap.requestFullscreen?.();
}

/* 概览 → 二级页（列表） */
export function hzShowList(){
  hzView = 'list';
  hzPage = 1;
  renderHazards();
}
/* 二级页 → 概览 */
export function hzShowOverview(){
  hzView = 'overview';
  renderHazards();
}
/* 地图标注 → 该商户隐患列表 */
export function hzOpenShopList(shopId: number){
  hzCurrentShop = shopId;
  hzView = 'list';
  hzPage = 1;
  renderHazards();
}

/* ============ 二级页：隐患治理台账（原第一屏整体保留） ============ */
function renderHazardsList(body?: HTMLElement, container?: HTMLElement){
  body = body || activeContainer
  disposeCharts();
  const content = container || body;
  body.style.overflowY = 'hidden';

  const { allHazards, pending, processing, done, totalHazards, shopsWithHazards } = hazardData();

  /* 有隐患的商户列表 */
  const shopsWithHazardsList = SHOPS.filter(s=>{
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
    ...shopsWithHazardsList.map(s=>({key:s.id, label:s.name}))
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
    <div class="hz-list-backbar">
      <button type="button" class="ev-page-btn" onclick="hzShowOverview()">← 返回概览</button>
      <span class="hz-list-title-tx">隐患治理台账</span>
    </div>
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
