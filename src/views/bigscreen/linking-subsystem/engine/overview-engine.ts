// @ts-nocheck
import { cv, initChart, openOverlay } from './shared-engine'
import { SHOPS, STREETS } from '../data/shops'
// 模块1引擎：商铺主体责任系统（原 index.html renderOverview 族函数原样提取，仅改 iframeBody→入参）

import * as echarts from 'echarts'





/** 跨模块跳转回调（原 selectModule），由页面组件注入 */
export let selectModule = (id: number) => {}
export function bindSelectModule(fn: (id: number) => void) { selectModule = fn }

export const icoCheck = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`
export const icoAlert = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`
export const icoPin = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`
export const icoUser = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
export const icoPhone = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>`
export const icoDoc = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>`

let gaodeMap: any = null
let gaodeMarkers: any[] = []
let gaodeStreetMarkers: any[] = []
let selectedShopId = 3
let selectedStreetId: number | null = null
let detailBackStreetId: number | null = null
let ovShowStreets = true
let ovShowShops = true
let ovShowStreetDuty = true
let ovShowStreetNotDuty = true
let ovShowDuty = true
let ovShowNotDuty = true
let activeContainer: HTMLElement

export function setSelectedShop(id: number) { selectedShopId = id }
export function getSelectedShop() { return selectedShopId }

/** 详情弹窗回调：地图点位点击（selectShop/selectStreet）→ OverviewOverlay 打开商铺/商业街详情弹窗
 *  （独立大屏无 #shopDetail 浮动卡，renderShopDetail/renderStreetDetail 无容器即静默返回） */
export type DetailModalPayload = { kind: 'shop' | 'street'; id: number }
let detailModalCallback: ((p: DetailModalPayload) => void) | null = null
export function bindDetailModal(fn: ((p: DetailModalPayload) => void) | null) { detailModalCallback = fn }

export function renderOverview(body: HTMLElement, container: HTMLElement){
  activeContainer = container
  body.style.overflowY = 'hidden';

  body.innerHTML = `
    <div class="responsibility-system">
    <div class="ov-map">
      <!-- 图例已迁移至 OverviewOverlay 底部图例条（原 .map-label 随底部筛选条一并移除） -->
      <div id="gaodeMap" class="gaode-map"><div class="map-load-state">高德地图加载中...</div></div>
    </div>
    </div>`;

  const detailEl = container.querySelector('#shopDetail') as HTMLElement;
  if(selectedStreetId) renderStreetDetail(selectedStreetId, detailEl); else renderShopDetail(selectedShopId, detailEl);
  renderGaodeMap();
}

function shopLngLat(s){
  const baseLng = 119.6004;
  const baseLat = 39.9354;
  const lng = baseLng + (s.x - 50) * 0.00072;
  const lat = baseLat - (s.y - 50) * 0.00054;
  return [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
}

function gaodeMarkerHtml(s){
  /* 图钉+单字：铺=水滴钉内嵌「铺」字；颜色仍表达履职状态（duty 绿 / not-duty 红） */
  return `
    <div class="amap-shop-marker ${s.todayDuty?'duty':'not-duty'} ${s.id===selectedShopId?'active':''}" data-shop-id="${s.id}" onclick="event.stopPropagation();selectShop(${s.id})">
      <div class="pin-shape"><span class="pin-char">铺</span></div>
      <div class="marker-tip">${s.name}</div>
    </div>`;
}

function gaodeStreetMarkerHtml(st){
  /* 商业街=大号水滴钉+金圈，内嵌「街」字，与商铺钉明显区分 */
  return `
    <div class="amap-street-marker ${st.todayDuty?'duty':'not-duty'} ${st.id===selectedStreetId?'active':''}" data-street-id="${st.id}" onclick="event.stopPropagation();selectStreet(${st.id})">
      <div class="pin-shape"><span class="pin-char">街</span></div>
      <div class="marker-tip">${st.name}</div>
    </div>`;
}

export function renderGaodeMap(){
  const el = activeContainer.querySelector('#gaodeMap') as HTMLElement;
  if(!el) return;
  if(typeof AMap === 'undefined'){
    el.innerHTML = '<div class="map-load-state">高德地图加载失败，请检查网络或 Key 配置</div>';
    return;
  }
  el.innerHTML = '';

  gaodeMap = new AMap.Map('gaodeMap', {
    zoom: 15,
    center: [119.6004, 39.9354],
    viewMode: '2D',
    resizeEnable: true,
    mapStyle: 'amap://styles/349dd62f0c95fd4de6fae2e8e043966b'
  });

  gaodeMarkers = SHOPS.map(s=>{
    const marker = new AMap.Marker({
      position: shopLngLat(s),
      anchor: 'bottom-center',
      content: gaodeMarkerHtml(s),
      extData: {shopId:s.id}
    });
    marker.on('click', ()=>selectShop(s.id));
    marker.setMap(gaodeMap);
    return marker;
  });

  gaodeStreetMarkers = STREETS.map(st=>{
    const marker = new AMap.Marker({
      position: shopLngLat(st),
      anchor: 'bottom-center',
      content: gaodeStreetMarkerHtml(st),
      extData: {streetId:st.id}
    });
    marker.on('click', ()=>selectStreet(st.id));
    marker.setMap(gaodeMap);
    return marker;
  });

  gaodeMap.on('complete', ()=>{
    /* 默认居中显示全部点位；complete 后再校正一次尺寸（容器布局可能晚于地图初始化稳定） */
    gaodeMap.setFitView(null, false, [120,120,120,120]);
    gaodeMap.invalidateSize?.();
  });

  updateGaodeMarkers();
}

/* 容器尺寸变化后强制高德重算画布/瓦片（resizeEnable 对部分缩放场景不重绘，底部会露出底色） */
export function resizeGaodeMap(){
  gaodeMap?.invalidateSize?.();
}

export function updateGaodeMarkers(){
  gaodeMarkers.forEach(marker=>{
    const sid = marker.getExtData().shopId;
    const shop = SHOPS.find(s=>s.id===sid);
    if(!shop) return;
    marker.setContent(gaodeMarkerHtml(shop));
    const show = ovShowShops && ((ovShowDuty && shop.todayDuty) || (ovShowNotDuty && !shop.todayDuty));
    marker.setMap(show ? gaodeMap : null);
  });
  gaodeStreetMarkers.forEach(marker=>{
    const stid = marker.getExtData().streetId;
    const st = STREETS.find(x=>x.id===stid);
    if(!st) return;
    marker.setContent(gaodeStreetMarkerHtml(st));
    const show = ovShowStreets && ((ovShowStreetDuty && st.todayDuty) || (ovShowStreetNotDuty && !st.todayDuty));
    marker.setMap(show ? gaodeMap : null);
  });
  /* 不再 panTo 到选中商铺，保持全览视图 */
}

export function ovToggleTypeShow(key){
  if(key==='streets') ovShowStreets = !ovShowStreets;
  else ovShowShops = !ovShowShops;
  [['streets',ovShowStreets],['shops',ovShowShops]].forEach(([k,on])=>{
    document.querySelectorAll(`.ml-item[data-duty="${k}"]`).forEach(el=>{
      el.classList.toggle('active', on);
      el.classList.toggle('off', !on);
    });
  });
  updateGaodeMarkers();
}

export function ovToggleStreetShow(key){
  if(key==='streetduty') ovShowStreetDuty = !ovShowStreetDuty;
  else ovShowStreetNotDuty = !ovShowStreetNotDuty;
  ['streetduty','streetnotduty'].forEach(k=>{
    const on = k==='streetduty' ? ovShowStreetDuty : ovShowStreetNotDuty;
    document.querySelectorAll(`.ov-sub[data-duty="${k}"]`).forEach(el=>{
      el.classList.toggle('off', !on);
    });
  });
  updateGaodeMarkers();
}

export function ovToggleDutyShow(key){
  if(key==='duty') ovShowDuty = !ovShowDuty;
  else ovShowNotDuty = !ovShowNotDuty;
  ['duty','notduty'].forEach(k=>{
    const on = k==='duty' ? ovShowDuty : ovShowNotDuty;
    document.querySelectorAll(`.ov-sub[data-duty="${k}"]`).forEach(el=>{
      el.classList.toggle('off', !on);
    });
  });
  updateGaodeMarkers();
}

export function selectShop(id){
  detailBackStreetId = selectedStreetId;   /* 记住来源商业街，供详情面板返回 */
  selectedShopId = id;
  selectedStreetId = null;
  document.querySelectorAll('.shop-pin').forEach(p=>{
    p.classList.toggle('active', parseInt(p.dataset.shopId)===id);
  });
  updateGaodeMarkers();
  renderShopDetail(id);
  detailModalCallback?.({ kind: 'shop', id });
}

export function selectStreet(id){
  selectedStreetId = id;
  selectedShopId = null;   /* 与 selectShop 对称：街/铺选中互斥 */
  detailBackStreetId = null;
  updateGaodeMarkers();
  renderStreetDetail(id);
  detailModalCallback?.({ kind: 'street', id });
}

export function renderStreetDetail(id: number, container?: HTMLElement){
  const el = container || (activeContainer.querySelector?.('#shopDetail') as HTMLElement);
  /* 框架阶段：#shopDetail 浮动卡已移除，详情改为弹窗（OverviewOverlay 下一阶段接入），
     无容器时不覆盖整屏地图/内容 */
  if(!el) return;
  el.innerHTML = streetDetailHtml(id);
}

export function showResponsibility(id: number, type: string){
  const isStreet = type==='street';
  const s = isStreet ? STREETS.find(x=>x.id===id) : SHOPS.find(x=>x.id===id);
  if(!s || !s.resp) return;
  const r = s.resp;
  openOverlay('sd-modal-overlay', `
    <div class="sd-modal" onclick="event.stopPropagation()">
      <div class="sd-modal-head">
        <span class="sd-modal-title">${r.title}</span>
        <div class="sd-modal-close" onclick="this.closest('.sd-modal-overlay').remove()">✕</div>
      </div>
      <div class="sd-modal-body">
        <div class="sd-resp-photo-wrap">
          <img src="${r.photo}" class="sd-resp-photo" alt="责任状照片" />
          <div class="sd-resp-photo-note">线下签署 · 拍照上传存档</div>
        </div>
      </div>
    </div>`);
}

export function shopDetailHtml(id: number, full?: boolean, container?: HTMLElement){
  const s = SHOPS.find(x=>x.id===id);
  if(!s) return '';
  const backStreet = detailBackStreetId ? STREETS.find(x=>x.id===detailBackStreetId) : null;

  /* 履责日历: 6月, 1日=周一, today=23 */
  const weekdays = ['日','一','二','三','四','五','六'];
  const today = 23;
  let calHtml = '';
  weekdays.forEach(d=>{ calHtml += `<div class="sd-cal-cell" style="color:#C0D7E8">${d}</div>`; });
  calHtml += '<div class="sd-cal-cell"></div>'; /* 6/1=周一, 前面1个空格 */
  for(let d=1; d<=30; d++){
    let cls = '';
    if(d < today){
      cls = (Math.round(d/today*100) <= s.dutyRate) ? 'done' : 'miss';
    } else if(d === today){
      cls = 'today';
    }
    calHtml += `<div class="sd-cal-cell ${cls}">${String(d).padStart(2,'0')}</div>`;
  }

  const alarmsHtml = s.deviceAlarms.length ? s.deviceAlarms.map(a=>`
    <div class="sd-row">
      <div style="flex:1">
        <div style="font-weight:500;color:var(--text);font-size:13px">${a.title}</div>
        <div class="sd-time">${a.time}</div>
      </div>
      <span class="sd-tag-sm ${a.red?'red':'green'}">${a.status}</span>
    </div>`).join('') : '<div class="sd-row" style="color:var(--muted);font-size:13px">暂无告警记录</div>';

  const hazardsHtml = s.hazardList.length ? s.hazardList.map(h=>`
    <div class="sd-row">
      <div style="flex:1">
        <div style="font-weight:500;color:var(--text);font-size:13px">${h.title}</div>
        <div class="sd-time">${h.time}</div>
      </div>
      <span class="sd-tag-sm ${h.red?'red':'green'}">${h.status}</span>
    </div>`).join('') : '<div class="sd-row" style="color:var(--muted);font-size:13px">暂无隐患记录</div>';

  const dev = s.devices;
  const devRows = [
    {c:'#6CB8F0', t:'烟感', n:dev.smoke},
    {c:'#3DDC97', t:'灭火器', n:dev.extinguisher},
    {c:'#F5B027', t:'燃气报警', n:dev.gas},
    {c:'#9BAEC4', t:'其他', n:dev.other}
  ].filter(d=>d.n>0).map(d=>`
    <div class="sd-device-row">
      <span class="sd-device-dot" style="background:${d.c}"></span>
      <span>${d.t} <strong style="color:var(--text)\">${d.n}</strong> 台</span>
    </div>`).join('');

  return `
    <div class="sd-card">
      ${backStreet ? `<div class="sd-back" onclick="selectStreet(${backStreet.id})">‹ 返回${backStreet.name}</div>` : ''}
      <div class="sd-section">
        <div class="sd-head">
          <div class="sd-name-row"><div class="sd-name">${s.name}</div><span class="sd-tag">${s.type}</span></div>
        </div>
        <div class="sd-today-status ${s.todayDuty?'duty':'not-duty'}">${s.todayDuty?icoCheck:icoAlert}${s.todayDuty?'今日已履职':'今日未履职'}</div>
        <div class="sd-info">${icoPin}<span>${s.address}</span></div>
        <div class="sd-contact">
          <div class="sd-info">${icoUser}<span>${s.owner}</span></div>
          <div class="sd-info">${icoPhone}<span>${s.phone}</span></div>
        </div>
        <div class="sd-stats">
          <div class="sd-st"><div class="v">${s.dutyRate}%</div><div class="l">本月履责率</div></div>
          <div class="sd-st"><div class="v ${s.hazards>0?'':'green'}">${s.hazards}</div><div class="l">未闭环隐患</div></div>
          <div class="sd-st"><div class="v ${s.alarms>0?'':'green'}">${s.alarms}</div><div class="l">未处置告警</div></div>
        </div>
      </div>

      <div class="sd-section">
        <div class="sd-section-title">安全责任状</div>
        <div class="sd-resp" onclick="showResponsibility(${s.id})">
          <div class="sd-resp-ico">${icoDoc}</div>
          <div class="sd-resp-body">
            <div class="sd-resp-name">${s.resp.title}</div>
            <div class="sd-resp-date">签署日期：${s.resp.date}</div>
          </div>
          <span class="sd-resp-arrow">›</span>
        </div>
      </div>

      <div class="sd-section">
        <div class="sd-section-title">本月履责记录</div>
        <div class="sd-cal">${calHtml}</div>
      </div>
      ${full ? `
      <div class="sd-section">
        <div class="sd-section-title">安全设备（共 ${dev.total} 台）</div>
        <div class="sd-device-summary">
          <div>${devRows || '<div style="color:var(--muted);font-size:13px">暂无设备</div>'}</div>
          <div class="sd-device-chart" id="shopDeviceChart-${s.id}" data-smoke="${dev.smoke}" data-extinguisher="${dev.extinguisher}" data-gas="${dev.gas}" data-other="${dev.other}" data-total="${dev.total}"></div>
        </div>
      </div>

      <div class="sd-section">
        <div class="sd-section-title-row">
          <div class="sd-section-title">设备告警</div>
          <button type="button" class="sd-more-link" onclick="openShopMore('alarm', ${s.id})">更多</button>
        </div>
        ${alarmsHtml}
      </div>

      <div class="sd-section">
        <div class="sd-section-title-row">
          <div class="sd-section-title">近期隐患</div>
          <button type="button" class="sd-more-link" onclick="openShopMore('hazard', ${s.id})">更多</button>
        </div>
        ${hazardsHtml}
      </div>` : ''}
    </div>`;
}

export function streetDetailHtml(id: number){
  const st = STREETS.find(x=>x.id===id);
  if(!st) return '';
  const shops = st.shops.map(sid=>SHOPS.find(x=>x.id===sid)).filter(Boolean);
  const dutyN = shops.filter(s=>s.todayDuty).length;
  const avgRate = Math.round(shops.reduce((a,s)=>a+s.dutyRate,0)/shops.length);
  const hazardN = shops.reduce((a,s)=>a+s.hazards,0);
  const alarmN = shops.reduce((a,s)=>a+s.alarms,0);
  const shopRows = shops.map(s=>`
    <div class="sd-street-shop" onclick="selectShop(${s.id})">
      <span class="sd-street-dot ${s.todayDuty?'green':'red'}"></span>
      <span class="sd-street-name">${s.name}</span>
      <span class="sd-street-type">${s.type}</span>
      <span class="sd-street-arrow">›</span>
    </div>`).join('');
  return `
    <div class="sd-card">
      <div class="sd-section">
        <div class="sd-head">
          <div class="sd-name-row"><div class="sd-name">${st.name}</div><span class="sd-tag">商业街</span></div>
        </div>
        <div class="sd-today-status ${st.todayDuty?'duty':'not-duty'}">${st.todayDuty?icoCheck:icoAlert}${st.todayDuty?'今日已履职':'今日未履职'}</div>
        <div class="sd-info">${icoPin}<span>${st.address}</span></div>
        <div class="sd-contact">
          <div class="sd-info">${icoUser}<span>${st.owner}</span></div>
          <div class="sd-info">${icoPhone}<span>${st.phone}</span></div>
        </div>
        <div class="sd-street-desc">${st.desc}</div>
        <div class="sd-stats">
          <div class="sd-st"><div class="v">${shops.length}</div><div class="l">纳管商铺</div></div>
          <div class="sd-st"><div class="v">${dutyN}</div><div class="l">今日履职</div></div>
          <div class="sd-st"><div class="v">${avgRate}%</div><div class="l">平均履责率</div></div>
        </div>
      </div>
      <div class="sd-section">
        <div class="sd-section-title">安全责任状</div>
        <div class="sd-resp" onclick="showResponsibility(${st.id}, 'street')">
          <div class="sd-resp-ico">${icoDoc}</div>
          <div class="sd-resp-body">
            <div class="sd-resp-name">${st.resp.title}</div>
            <div class="sd-resp-date">签署日期：${st.resp.date}</div>
          </div>
          <span class="sd-resp-arrow">›</span>
        </div>
      </div>
      <div class="sd-section">
        <div class="sd-section-title">街内商铺（${shops.length} 家）</div>
        ${shopRows}
      </div>
      <div class="sd-section">
        <div class="sd-section-title">风险概况</div>
        <div class="sd-street-risk">
          <div class="sd-street-risk-item"><span class="v">${hazardN}</span><span class="l">未闭环隐患</span></div>
          <div class="sd-street-risk-item"><span class="v">${alarmN}</span><span class="l">未处置告警</span></div>
        </div>
      </div>
    </div>`;
}

export function renderShopDetail(id: number, container?: HTMLElement){
  const el = container || (activeContainer.querySelector?.('#shopDetail') as HTMLElement);
  /* 框架阶段：#shopDetail 浮动卡已移除，详情改为弹窗（OverviewOverlay 下一阶段接入），
     无容器时不覆盖整屏地图/内容 */
  if(!el) return;
  el.innerHTML = shopDetailHtml(id);
}

export function renderShopDeviceChart(shopId){
  if(typeof echarts==='undefined') return;
  const el = document.getElementById(`shopDeviceChart-${shopId}`);
  if(!el) return;
  const chart = echarts.init(el);
  const data = [
    {value:parseInt(el.dataset.smoke||0), name:'烟感', itemStyle:{color:'#6CB8F0'}},
    {value:parseInt(el.dataset.extinguisher||0), name:'灭火器', itemStyle:{color:'#3DDC97'}},
    {value:parseInt(el.dataset.gas||0), name:'燃气报警', itemStyle:{color:'#F5B027'}},
    {value:parseInt(el.dataset.other||0), name:'其他', itemStyle:{color:'#9BAEC4'}}
  ];
  chart.setOption({
    tooltip:{trigger:'item', formatter:'{b}: {c} 台'},
    series:[{
      type:'pie',
      radius:['52%','82%'],
      center:['50%','50%'],
      avoidLabelOverlap:false,
      label:{show:false},
      labelLine:{show:false},
      itemStyle:{borderColor:'#fff', borderWidth:2},
      data
    }],
    graphic:[{
      type:'text',
      left:'center',
      top:'center',
      style:{text:el.dataset.total || '', fill:'#1f2329', fontSize:15, fontWeight:'bold'}
    }]
  });
  chart.resize();
}

export function cmpFallback(el, label){
  el.outerHTML = `<div class="cmp-empty"><span>${label} · 图片待替换</span></div>`;
}

/* ===== 内联 onclick 所需的全局挂载（原 index.html 顶层全局函数 1:1） ===== */
export function mountOverviewGlobals() {
  const w = window as any
  w.selectShop = selectShop
  w.selectStreet = selectStreet
  w.ovToggleTypeShow = ovToggleTypeShow
  w.ovToggleStreetShow = ovToggleStreetShow
  w.ovToggleDutyShow = ovToggleDutyShow
  w.showResponsibility = showResponsibility
  w.openShopMore = (kind: string, shopId: number) => import('./shared-engine').then(m => {
    m.openShopMore(kind, shopId, moduleSwitchCallback)
  })
  w.sdRemoveOverlay = (el: HTMLElement) => el.remove()
}
export function unmountOverviewGlobals() {
  const w = window as any
  ;['selectShop','selectStreet','ovToggleTypeShow','ovToggleStreetShow','ovToggleDutyShow','showResponsibility','openShopMore','sdRemoveOverlay'].forEach(n => delete w[n])
}
/** openShopMore 跨模块跳转回调（UnsubLayout 绑定的 router） */
let moduleSwitchCallback: (id: number) => void = () => {}
export function bindOverviewSwitch(fn: (id: number) => void) { moduleSwitchCallback = fn }
