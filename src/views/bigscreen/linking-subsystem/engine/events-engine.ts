import { cmpFallback, cv, initChart, openOverlay, toolbarHtml } from './shared-engine'
import { icoExportSmall, icoRefreshSmall } from './icon-consts'
import { SHOPS } from '../data/shops'
import { BEFORE_PHOTO_POOL, SHOP_EVENTS } from '../data/shop-events'
// 模块2引擎：智能感知告警系统（原 renderEvents 族 1:1）

import * as echarts from 'echarts'





export let bindSelectModule = (id: number) => {}
export function setModuleSwitch(fn: (id: number) => void) { bindSelectModule = fn }
/* 辅助函数（原 index.html events 区 1:1） */
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
function normalizeAlarmRecords(){
  let alarms = getAllEvents().filter(e=>e.type!=='hazard');
  if(alarms.length && alarms.every(e=>e.status==='done')){
    SHOP_EVENTS[1].unshift({
      id:'e1-7',
      type:'smoke',
      level:'warning',
      status:'pending',
      title:'烟感·设备离线告警',
      shop:'老张川菜馆',
      device:'烟感探测器 #SF-006',
      addr:'中山路 128 号 前厅天花板',
      time:'2026-08-26 10:08:00',
      desc:'烟感探测器 在线状态 连续离线超过30分钟，触发设备离线告警。',
      photo:false,
      timeline:[
        {dot:'report', time:'10:08:00', title:'设备自动上报', desc:'烟感探测器 SF-006 连续离线超过30分钟'},
        {dot:'push', time:'10:08:08', title:'告警推送', desc:'平台向商铺经营者与物业技术支撑方推送告警', channels:['sms','app']},
        {dot:'dispatch', time:'10:09:00', title:'自动派单', desc:'系统自动派单至物业技术支撑方现场核查'}
      ]
    });
    alarms = getAllEvents().filter(e=>e.type!=='hazard');
  }

  SHOPS.forEach(shop=>{
    const shopAlarms = (SHOP_EVENTS[shop.id] || []).filter(e=>e.type!=='hazard');
    shop.alarms = shopAlarms.filter(e=>e.status==='pending' || e.status==='processing').length;
    shop.deviceAlarms = shopAlarms.map(e=>({
      title:e.title.replace('告警','').replace('·', '·'),
      time:e.time.slice(5,16).replace('-', '/'),
      status:e.status==='done' ? '已处置' : e.status==='processing' ? '处置中' : '未处置',
      red:e.status!=='done'
    }));
  });
}
function normalizeHazardRecords(){
  Object.values(SHOP_EVENTS).forEach(events=>{
    events.forEach(ev=>{
      if(ev.type!=='hazard') return;
      /* 操作人姓名：自查上报/整改=商铺经营者姓名；云上复核=区域网格员 */
      const shop = SHOPS.find(s=>s.name===ev.shop);
      const ownerName = (shop && shop.owner) || '';
      const gridName = /中山路/.test(ev.addr||'') ? '网格员李明' : /解放路/.test(ev.addr||'') ? '网格员张伟' : '网格员周强';
      const report = ev.timeline.find(t=>t.dot==='report');
      if(report){
        report.operator = ownerName ? '商户'+ownerName : '商铺自查';
        if(ownerName){
          const rDesc = report.desc || '';
          const rHead = /^(每日履职自查|检查|巡查|发现)/.test(rDesc) ? '' : '发现';
          report.desc = '商户'+ownerName + rHead + rDesc;
        }
      }
      const hasPhotos = !!(ev.photos && ev.photos.before && ev.photos.after);
      ev.status = hasPhotos ? 'done' : 'processing';
      if(!hasPhotos) return;

      const handle = ev.timeline.find(t=>t.dot==='handle');
      if(handle){
        handle.time = handle.time==='--' ? '已完成' : handle.time;
        handle.title = '整改完成';
        handle.desc = handle.desc.replace(/待整改|整改中|尚未|清理中|进行中/g,'').replace(/[，,]\s*$/,'').trim() || '商户已完成整改并上传整改后照片';
        if(!/上传|完成|更换|清理|清洗|规范|解锁|整改/.test(handle.desc)){
          handle.desc = '商户已完成整改并上传整改后照片';
        }
        handle.operator = ownerName ? '商户'+ownerName : '商户';
        if(ownerName) handle.desc = handle.desc.replace(/^商户/, '商户'+ownerName);
      }else{
        ev.timeline.push({dot:'handle', time:'已完成', title:'整改完成', desc:'商户已完成整改并上传整改后照片', operator: ownerName ? '商户'+ownerName : '商户'});
      }
      const close = ev.timeline.find(t=>t.dot==='close');
      if(close){
        close.operator = gridName;
        close.desc = (close.desc||'').replace(/^(监管人员|网格员)/, gridName);
      }else{
        ev.timeline.push({dot:'close', time:'复核完成', title:'复核闭环', desc: gridName+'复核通过，隐患已闭环', operator: gridName});
      }
    });
  });
  SHOPS.forEach(shop=>{
    const hazards = (SHOP_EVENTS[shop.id] || []).filter(e=>e.type==='hazard');
    shop.hazards = hazards.length;
    shop.hazardList = hazards.map(e=>({
      title:e.title.replace('排查隐患：',''),
      time:e.time.slice(5,16).replace('-', '/'),
      status:e.status==='done' ? '已闭环' : '处置中',
      red:e.status!=='done'
    }));
  });
}


let evCurrentTab = 'alarm'
let evMarqueeRaf = 0
let evStatusFilter = 'all'
let evSearchKeyword = ''
let evPage = 1
const EV_PAGE_SIZE = 15
let activeContainer: HTMLElement
export function bindContainer(el: HTMLElement) { activeContainer = el }

export function applyPendingState(s: any) {
  if (s.evCurrentTab !== undefined) evCurrentTab = s.evCurrentTab
  if (s.evStatusFilter !== undefined) evStatusFilter = s.evStatusFilter
  if (s.evSearchKeyword !== undefined) evSearchKeyword = s.evSearchKeyword
  if (s.evPage !== undefined) evPage = s.evPage
}
export function getEvState() { return { evCurrentTab, evStatusFilter, evSearchKeyword, evPage } }

export function renderEvents(body?: HTMLElement, container?: HTMLElement){
  body = body || activeContainer
  disposeCharts();
  const content = container || body;
  body.style.overflowY = 'hidden';

  const allEvents = getAllEvents();
  const alarms = allEvents.filter(e=>e.type!=='hazard');
  const hazards = allEvents.filter(e=>e.type==='hazard');

  /* 统计指标 */
  const totalShops = SHOPS.length;
  const alarmPending = alarms.filter(e=>e.status==='pending').length;
  const alarmDone = alarms.filter(e=>e.status==='done').length;
  const hazardPending = hazards.filter(e=>e.status==='pending' || e.status==='processing').length;
  const hazardDone = hazards.filter(e=>e.status==='done').length;

  /* 实时告警态势：按事件展示，去重后保留多家商铺的待关注记录 */
  const seenAlertIds = new Set();
  const alertItems = allEvents
    .filter(e=>e.status==='pending' || e.status==='processing')
    .filter(e=>{
      if(seenAlertIds.has(e.id)) return false;
      seenAlertIds.add(e.id);
      return true;
    })
    .sort((a,b)=>b.time.localeCompare(a.time))
    .slice(0,10);

  const alertCardHtml = e=>{
    const statusLabel = e.status==='pending'
      ? (e.type==='hazard' ? '待整改' : '待处置')
      : '处置中';
    const statusColor = e.type==='hazard' ? 'var(--orange)' : 'var(--accent)';
    return `
      <div class="ev-shop-card" onclick="showEventDetail('${e.id}')">
        <div class="ev-shop-card-head">
          <span class="ev-shop-card-name">${e.shop}</span>
          <span class="ev-shop-card-time">${e.time.slice(5,16).replace('-', '/')}</span>
        </div>
        <div class="ev-shop-card-title">${stripDevPrefix(e.title).replace('排查隐患：','')}</div>
        <div class="ev-shop-card-row">
          <span><span class="ev-shop-card-dot" style="background:${statusColor}"></span>${evTypeLabel(e)}</span>
          <span>${statusLabel}</span>
        </div>
      </div>`;
  };

  const shopCardsHtml = alertItems.length
    ? `<div class="ev-marquee"><div class="ev-marquee-track">${alertItems.map(alertCardHtml).join('')}</div></div>`
    : '<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow);padding:16px;text-align:center;color:var(--muted);font-size:13px;flex:none">当前无未处置或处置中的事件</div>';

  /* 列表 */
  const rawList = evCurrentTab==='alarm' ? alarms : hazards;
  const normalizedKeyword = evSearchKeyword.trim().toLowerCase();
  const list = rawList.filter(e=>{
    const statusMatched = evStatusFilter==='all'
      || (evStatusFilter==='open' ? (e.status==='pending' || e.status==='processing') : e.status===evStatusFilter);
    const searchMatched = !normalizedKeyword
      || `${e.shop} ${e.title} ${e.device} ${e.addr}`.toLowerCase().includes(normalizedKeyword);
    return statusMatched && searchMatched;
  });
  const totalPages = Math.max(1, Math.ceil(list.length / EV_PAGE_SIZE));
  if(evPage > totalPages) evPage = totalPages;
  const pageList = list.slice((evPage-1)*EV_PAGE_SIZE, evPage*EV_PAGE_SIZE);
  const listHtml = pageList.length ? pageList.map(e=>{
    const displayTitle = stripDevPrefix(e.title);
    const statusLabel = e.status==='pending'
      ? (e.type==='hazard' ? '待整改' : '待处置')
      : e.status==='processing'
        ? '处置中'
        : (e.type==='hazard' ? '已闭环' : '已处置');
    return `
    <div class="ev-item data-row ev-row" onclick="showEventDetail('${e.id}')">
      <div class="data-main">
        <div class="data-title ${evCurrentTab==='alarm'?'alarm-red':''}">${displayTitle}</div>
        <div class="data-sub">${e.desc}</div>
      </div>
      <div class="data-cell">${e.shop}</div>
      <div class="data-cell"><span class="ev-type-tag ${evTypeCls(e)}">${evTypeLabel(e)}</span></div>
      <div class="data-cell muted">${e.device}</div>
      <div><span class="ev-item-status ${hzIsOverdue(e)?'overdue':e.status}">${hzIsOverdue(e)?'超期未整改':statusLabel}</span></div>
      <div class="row-actions">
        <button type="button" class="row-action" onclick="event.stopPropagation();showEventDetail('${e.id}')">详情</button>
      </div>
    </div>`;
  }).join('') : '<div style="text-align:center;padding:40px;color:var(--muted);font-size:14px">暂无记录</div>';
  const filterOptions = evCurrentTab==='alarm'
    ? [
      {key:'all', label:'全部', count:alarms.length},
      {key:'pending', label:'待处置', count:alarmPending, dot:'red'},
      {key:'done', label:'已处置', count:alarmDone, dot:'green'}
    ]
    : [
      {key:'all', label:'全部', count:hazards.length},
      {key:'open', label:'未闭环', count:hazardPending, dot:'red'},
      {key:'done', label:'已闭环', count:hazardDone, dot:'green'}
    ];
  const filterHtml = filterOptions.map(f=>`
    <button type="button" class="ev-filter-chip ${evStatusFilter===f.key?'active':''}" onclick="evSetStatusFilter('${f.key}')">
      ${f.dot?`<span class="dot ${f.dot}"></span>`:''}${f.label}<b>${f.count}</b>
    </button>`).join('');
  const pageButtons = Array.from({length:totalPages},(_,i)=>i+1).map(p=>
    `<button type="button" class="ev-page-btn ${p===evPage?'active':''}" onclick="evSetPage(${p})">${p}</button>`
  ).join('');
  const paginationHtml = `
    <div class="ev-pagination">
      <span class="ev-page-info">共 ${list.length} 条，每页 ${EV_PAGE_SIZE} 条</span>
      <button type="button" class="ev-page-btn" onclick="evSetPage(${evPage-1})" ${evPage<=1?'disabled':''}>上一页</button>
      ${pageButtons}
      <button type="button" class="ev-page-btn" onclick="evSetPage(${evPage+1})" ${evPage>=totalPages?'disabled':''}>下一页</button>
    </div>`;

  content.innerHTML = `
    ${toolbarHtml('事件处置工作台', [
      {label:'时间：近 7 日'},
      {label:'区域：全部街道'},
      {label:`状态：${evCurrentTab==='alarm'?'设备告警':'排查隐患'}`}
    ], [
      {label:'刷新', icon:icoRefreshSmall},
      {label:'导出', icon:icoExportSmall}
    ])}
    <div class="ev-stats">
      <div class="ev-stat">
        <div class="ev-stat-left">
          <div class="es-label">设备告警事件</div>
          <div class="es-value">${alarms.length}</div>
          <div class="es-subs">
            <div class="ev-sub clickable" onclick="evApplyMetricFilter('alarm','pending')"><span class="ev-dot red"></span><span class="ev-num">${alarmPending}</span><span class="ev-lbl">待处置</span></div>
            <div class="ev-sub clickable" onclick="evApplyMetricFilter('alarm','done')"><span class="ev-dot green"></span><span class="ev-num">${alarmDone}</span><span class="ev-lbl">已处置</span></div>
          </div>
        </div>
        <div class="ev-stat-chart" id="alarmChart"></div>
      </div>
      <div class="ev-stat">
        <div class="ev-stat-left">
          <div class="es-label">排查隐患记录</div>
          <div class="es-value">${hazards.length}</div>
          <div class="es-subs">
            <div class="ev-sub clickable" onclick="evApplyMetricFilter('hazard','open')"><span class="ev-dot red"></span><span class="ev-num">${hazardPending}</span><span class="ev-lbl">未闭环</span></div>
            <div class="ev-sub clickable" onclick="evApplyMetricFilter('hazard','done')"><span class="ev-dot green"></span><span class="ev-num">${hazardDone}</span><span class="ev-lbl">已闭环</span></div>
          </div>
        </div>
        <div class="ev-stat-chart" id="hazardChart"></div>
      </div>
    </div>

    <div class="ev-marquee-title">实时告警态势<span class="cnt">共 ${new Set(alertItems.map(e=>e.shop)).size} 家商铺 · ${alertItems.length} 条记录</span></div>
    ${shopCardsHtml}

    <div class="ev-list-title">
      <span class="lt">事件记录<span class="cnt">${evCurrentTab==='alarm'?'设备告警':'排查隐患'} ${list.length} 条</span></span>
    </div>
    <div class="event-record-panel">
      <div class="ev-tabs">
        <div class="ev-tab ${evCurrentTab==='alarm'?'active':''}" onclick="evSwitchTab('alarm')">
          设备告警<span class="ev-tab-badge">${alarms.length}</span>
        </div>
        <div class="ev-tab ${evCurrentTab==='hazard'?'active':''}" onclick="evSwitchTab('hazard')">
          排查隐患<span class="ev-tab-badge">${hazards.length}</span>
        </div>
      </div>
      <div class="ev-list-tools">
        <div class="ev-filter-chips">${filterHtml}</div>
        <input class="ev-search-input" value="${evSearchKeyword}" placeholder="搜索店铺名称" oninput="evSetSearch(this.value)">
      </div>
      <div class="data-table-wrap">
        <div class="list-head-row ev-row">
          <span>事件</span><span>商铺</span><span>类型</span><span>来源设备/上报人</span><span>状态</span><span>操作</span>
        </div>
        <div class="ev-list" id="evList">${listHtml}</div>
      </div>
      ${paginationHtml}
    </div>`;

  /* ECharts 环形图 */
  renderEventCharts(alarmPending, alarmDone, hazardPending, hazardDone);
  startEventMarqueeAutoScroll();
}

export function getAllEvents(){
  let all = [];
  for(const sid in SHOP_EVENTS) all = all.concat(SHOP_EVENTS[sid]);
  return all;
}

export function startEventMarqueeAutoScroll(){
  if(evMarqueeRaf) cancelAnimationFrame(evMarqueeRaf);
  const wrap = document.querySelector('.ev-marquee');
  const track = document.querySelector('.ev-marquee-track');
  if(!wrap || !track || track.scrollWidth <= wrap.clientWidth) return;

  let lastTs = 0;
  let paused = false;
  wrap.addEventListener('mouseenter', ()=>{ paused = true; });
  wrap.addEventListener('mouseleave', ()=>{ paused = false; });

  const step = (ts)=>{
    if(!document.body.contains(wrap)) return;
    if(!lastTs) lastTs = ts;
    const dt = ts - lastTs;
    lastTs = ts;
    if(!paused){
      wrap.scrollLeft += dt * 0.035;
      if(wrap.scrollLeft >= track.scrollWidth - wrap.clientWidth - 1){
        wrap.scrollLeft = 0;
      }
    }
    evMarqueeRaf = requestAnimationFrame(step);
  };
  evMarqueeRaf = requestAnimationFrame(step);
}

export function renderEventCharts(alarmPending, alarmDone, hazardPending, hazardDone){
  const baseStyle = {
    type:'pie', radius:['55%','85%'], avoidLabelOverlap:false,
    label:{show:false}, labelLine:{show:false},
    itemStyle:{borderColor:'#fff', borderWidth:2}
  };

  /* 告警分布（两态） */
  const alarmEl = document.getElementById('alarmChart');
  if(alarmEl){
    const alarmChart = echarts.init(alarmEl);
    const alarmData = [
      {value:alarmPending, name:'待处置', itemStyle:{color:cv('--alert')}},
      {value:alarmDone, name:'已处置', itemStyle:{color:cv('--green')}}
    ];
    alarmChart.setOption({series:[{...baseStyle, data:alarmData}]});
  }

  /* 隐患分布 */
  const hazardEl = document.getElementById('hazardChart');
  if(hazardEl){
    const hazardChart = echarts.init(hazardEl);
    const hazardData = [
      {value:hazardPending, name:'未闭环', itemStyle:{color:cv('--alert')}},
      {value:hazardDone, name:'已闭环', itemStyle:{color:cv('--green')}}
    ];
    hazardChart.setOption({series:[{...baseStyle, data:hazardData}]});
  }
}

export function evFilterShop(shopId){
  /* 点击店铺卡片可直接滚动到列表区域，后续可扩展筛选 */
  document.getElementById('evList').scrollIntoView({behavior:'smooth',block:'start'});
}

export function evSwitchTab(tab){
  evCurrentTab = tab;
  evStatusFilter = 'all';
  evPage = 1;
  renderEvents();
}

export function evSetStatusFilter(status){
  evStatusFilter = status;
  evPage = 1;
  renderEvents();
}

export function evSetSearch(value){
  evSearchKeyword = value;
  evPage = 1;
  renderEvents();
  requestAnimationFrame(()=>{
    const input = document.querySelector('.ev-search-input');
    if(input){
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  });
}

export function evSetPage(page){
  evPage = Math.max(1, page);
  renderEvents();
}

export function evApplyMetricFilter(tab, status){
  evCurrentTab = tab;
  evStatusFilter = status;
  evPage = 1;
  renderEvents();
  requestAnimationFrame(()=>{
    document.querySelector('.event-record-panel')?.scrollIntoView({behavior:'smooth', block:'start'});
  });
}

export function showEventDetail(eventId){
  let ev = null;
  for(const sid in SHOP_EVENTS){
    const found = SHOP_EVENTS[sid].find(e=>e.id===eventId);
    if(found){ ev = found; break; }
  }
  if(!ev) return;

  /* 隐患走独立「整改视角」弹窗 */
  if(ev.type==='hazard'){ showHazardDetail(ev); return; }

  const statusLabel = ev.status==='pending' ? '待处置' : ev.status==='processing' ? '处置中' : '已处置';

  /* 操作人推断：系统触发=系统；人员操作从描述中提取 */
  function deriveOperator(t){
    if(['report','push','dispatch'].includes(t.dot)) return '系统';
    const d = t.desc || '';
    let m; /* 匹配 网格员/商户/技术员 + 姓名（人名符限长，勿贪婪整句） */
    if((m=d.match(/网格员[^\u3002，。]{0,4}/))) return m[0];
    if((m=d.match(/商户[^\u3002，。]{0,3}/))) return m[0];
    if((m=d.match(/技术员[^\u3002，。]{0,3}/))) return m[0];
    if(/物业/.test(d)) return '物业';
    if(/技术/.test(d)) return '技术员';
    if(/复核/.test(t.title)) return '系统';
    return '系统';
  }

  /* 按事件内容匹配写实现场照片 */
  function genScene(ev){
    let src = '/linking-subsystem/现场处置-设备检修.png';
    let alt = '设备检修现场照片';
    if(/低电量|离线|故障|拆下|电池|检修/.test(ev.title + ev.desc)){
      src = '/linking-subsystem/现场处置-设备检修.png';
      alt = '设备异常现场检修照片';
    }else if(ev.type==='smoke' && /火警|烟雾|烟感/.test(ev.title + ev.desc)){
      src = '/linking-subsystem/现场处置-烟感火警.png';
      alt = '烟感火警现场核实照片';
    }else if(ev.type==='gas' || /燃气|甲烷|浓度|泄漏|阀/.test(ev.title + ev.desc)){
      src = '/linking-subsystem/现场处置-燃气排查.png';
      alt = '燃气浓度超标现场排查照片';
    }
    return `<img src="${src}" alt="${alt}" onerror="this.closest('.ev-tl-photo-box').classList.add('chart-fallback');this.replaceWith(document.createTextNode('现场照片加载失败'))">`;
  }

  /* 固定四步完整展示：事件上报 / 告警推送 / 现场处置 / 事件闭环（不再按状态裁剪，未开始步骤以灰虚线呈现） */
  function buildTimeline(){
    const TITLE = {report:'事件上报', push:'告警推送', dispatch:'现场处置', handle:'现场处置', close:'事件闭环'};
    const find = dot => ev.timeline.find(t=>t.dot===dot);
    const report = find('report'), push = find('push'), dispatch = find('dispatch'), handle = find('handle'), close = find('close');
    const nodes = [];
    if(report) nodes.push({...report, title:'事件上报'});
    if(push){
      const r = {...push, title:'告警推送'};
      /* 推送完成时间 = 派单节点时刻（派单与处置合并，但推送时长≤1分钟需用它） */
      const idx = ev.timeline.indexOf(push);
      const nxt = ev.timeline[idx+1];
      r.pushEnd = (nxt && nxt.dot==='dispatch') ? nxt.time : null;
      nodes.push(r);
    }
    if(dispatch || handle){
      nodes.push({
        ...(handle || dispatch), title:'现场处置', dot:'handle',
        dispatchTime: dispatch ? dispatch.time : null,
        handleTime: handle ? handle.time : null,
        dDesc: dispatch ? dispatch.desc : (handle ? handle.desc : '')
      });
    }
    if(close) nodes.push({...close, title:'事件闭环'});
    /* 数据无闭环节点时兜底合成（未处置事件也完整展示四步） */
    else nodes.push({dot:'close', title:'事件闭环', time:'--', desc:'--'});
    return nodes;
  }
  const tlBodies = buildTimeline();

  const tlHtml = tlBodies.map((t,i)=>{
    const channels = t.channels ? `<div class="ev-tl-channels">${t.channels.map(c=>{
      const labels = {sms:'短信',voice:'语音',app:'APP推送'};
      const cls = c==='app' ? 'apppush' : c;
      return `<span class="ev-tl-channel ${cls}">${labels[c]||c}</span>`;
    }).join('')}</div>` : '';
    const next = tlBodies[i+1];
    const isDoneEv = ev.status==='done';
    /* 步骤状态：已处置=全部完成；未处置=上报/推送完成、现场处置当前、事件闭环未开始 */
    let step;
    if(isDoneEv) step='done';
    else if(t.dot==='report' || t.dot==='push') step='done';
    else if(t.dot==='handle') step='current';
    else step='todo';
    const nodeDone = step==='done';
    /* 时间：上报/闭环=瞬时；推送=派单时刻（≤1分钟）；处置：已处置=到场→闭环（≤1小时），未处置=派单/到场后进行中 */
    let startT = t.time, endT;
    if(t.dot==='report' || t.dot==='close') endT = startT;
    else if(t.dot==='push') endT = t.pushEnd || startT;
    else {
      if(isDoneEv) endT = next ? next.time : '--';
      else {
        endT = '--';
        if(ev.status==='pending') startT = t.dispatchTime || '--';
      }
    }
    if(step==='todo'){ startT = '--'; endT = '--'; }
    /* 操作人：未开始=--；未处置的现场处置=--（自动派单阶段对应人员尚未明确）；已完成环节=描述中人员 */
    const opUnset = t.dot==='handle' && ev.status==='pending' && t.dispatchTime;
    const operator = (step==='todo' || opUnset) ? '--' : (t.operator || deriveOperator(t));
    /* 已完成节点=绿色对钩；当前阶段=蓝色呼吸；未开始=淡灰原点+虚线 */
    const dotCls = `${t.dot} ${step}`;
    const dotInner = nodeDone ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>' : '';
    /* 描述：未处置的现场处置显示派单信息；未开始步骤显示 -- */
    const descText = step==='todo' ? '--' : (opUnset ? t.dDesc : t.desc);
    /* 现场照片：已进入处置（已处置/处置中）才展示 */
    const showPhoto = t.title==='现场处置' && ev.status!=='pending';
    const photo = showPhoto ? `<div class="ev-tl-photo"><div class="ev-tl-photo-box">
      ${genScene(ev)}
      <div class="ev-tl-photo-cap"><span class="t">现场处置实拍</span><span>${startT}</span></div>
    </div></div>` : '';
    return `
      <div class="ev-tl-item ${step==='todo'?'todo':''}">
        <div class="ev-tl-dot ${dotCls}">${dotInner}</div>
        <div class="ev-tl-meta">
          <span class="field"><span class="k">开始</span><span class="v">${startT}</span></span>
          <span class="field"><span class="k">完成</span><span class="v">${endT}</span></span>
          <span class="field"><span class="k">操作人</span><span class="v">${operator}</span></span>
        </div>
        <div class="ev-tl-title">${t.title}</div>
        <div class="ev-tl-desc">${descText}</div>
        ${channels}
        ${photo}
      </div>`;
  }).join('');

  openOverlay('ev-detail-overlay', `
    <div class="ev-detail" onclick="event.stopPropagation()">
      <div class="ev-detail-head">
        <div class="ev-detail-head-left">
          <span class="dd-back" onclick="this.closest('.ev-detail-overlay').remove()">← 返回事件列表</span>
        </div>
        <div class="ev-detail-close" onclick="this.closest('.ev-detail-overlay').remove()">✕</div>
      </div>
      <div class="ev-detail-body">
        <div class="ev-detail-status-big ${ev.status}">
          <span class="dot"></span>${statusLabel}
          <span class="ev-detail-ev-name">${stripDevPrefix(ev.title)}</span>
        </div>
        <div class="ev-detail-meta">
          <div class="ev-detail-field"><div class="l">商铺</div><div class="v">${ev.shop}</div></div>
          <div class="ev-detail-field"><div class="l">位置</div><div class="v">${ev.addr}</div></div>
          <div class="ev-detail-field"><div class="l">设备/来源</div><div class="v">${ev.device}</div></div>
          <div class="ev-detail-field"><div class="l">上报时间</div><div class="v">${ev.time}</div></div>
        </div>
        <div style="font-size:14px;font-weight:600;margin-bottom:6px">处置时间线</div>
        <div class="ev-timeline">${tlHtml}</div>
      </div>
    </div>`);
}

export function showHazardDetail(ev){
  const levelLabel = ev.level==='urgent' ? '重大隐患' : ev.level==='warning' ? '较大隐患' : '一般隐患';
  /* 整改状态 */
  const rectifyStatus = ev.status==='pending' ? '待整改' : ev.status==='processing' ? '处置中' : '已闭环';

  /* 整改倒计时：未闭环显示剩余时间/已超期时长（期限按隐患标题推断），实时刷新 */
  const deadlineTs = new Date(ev.time.replace(/-/g,'/')).getTime() + hazardDeadlineMs(ev.title);
  const overdue = ev.status!=='done' && Date.now() > deadlineTs;
  function fmtDur(ms){
    const s = Math.max(0, Math.floor(ms/1000));
    const d = Math.floor(s/86400), h = Math.floor((s%86400)/3600), m = Math.floor((s%3600)/60), sec = s%60;
    const pad = n => String(n).padStart(2,'0');
    return d>0 ? `${d}天 ${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}:${pad(sec)}`;
  }
  function fmtCountdown(ms){
    return ms > 0 ? `剩余 ${fmtDur(ms)}` : `已超期 ${fmtDur(-ms)}`;
  }

  /* 按隐患标题推断整改要求/期限/责任人 */
  function rectifyInfo(){
    const t = ev.title;
    if(/疏散出口|疏散通道|通道|出口|堆物|堆放/.test(t)) return {req:'清理疏散通道占用物，保持通道畅通，恢复安全出口正常开启', dl:'24小时', owner:'商铺经营者'};
    if(/燃气软管/.test(t)) return {req:'更换老化燃气软管，紧固接口并做气密性检测', dl:'24小时', owner:'商铺经营者'};
    if(/电线|线路|私拉乱接/.test(t)) return {req:'重新规范敷设电气线路，拆除私拉乱接电线', dl:'48小时', owner:'商铺经营者'};
    if(/灭火器/.test(t)) return {req:'更换/重新充装过期灭火器，确保压力正常', dl:'24小时', owner:'商铺经营者'};
    if(/油烟管道/.test(t)) return {req:'清洗后厨油烟管道，清除积油', dl:'7天', owner:'商铺经营者'};
    if(/易燃品/.test(t)) return {req:'规范易燃品存放，远离火源并分隔存放', dl:'48小时', owner:'商铺经营者'};
    return {req:'按整改要求完成隐患消除', dl:'48小时', owner:'商铺经营者'};
  }
  const ri = rectifyInfo();
  /* 责任人联系电话（来自商铺档案） */
  const shopRec = SHOPS.find(s=>s.name===ev.shop);
  const rectPhone = (shopRec && shopRec.phone) || '--';

  /* 整改时间线固定三步：自查上报 → 现场整改 → 云上复核（整改通知不展示；未开始步骤以灰点呈现） */
  function buildTimeline(){
    const TITLE = {report:'自查上报', push:'现场整改', dispatch:'现场整改', handle:'现场整改', close:'云上复核'};
    const find = dot => ev.timeline.find(t=>t.dot===dot);
    const report = find('report'), dispatch = find('dispatch'), handle = find('handle'), close = find('close');
    const nodes = [];
    if(report) nodes.push({...report, title:'自查上报'});
    if(dispatch || handle){
      nodes.push({
        ...(handle || dispatch), title:'现场整改', dot:'handle',
        dispatchTime: dispatch ? dispatch.time : null,
        dDesc: dispatch ? dispatch.desc : null
      });
    }
    if(close) nodes.push({...close, title:'云上复核'});
    else nodes.push({dot:'close', title:'云上复核', time:'--', desc:'--'});
    return nodes;
  }
  const tlBodies = buildTimeline();
  /* 整改前照片：上报记录自带；无照片时从文件夹整改前照片池随机选用；整改后照片：按处置进度，整改完成才展示 */
  const beforeSrc = beforePhotoOf(ev);
  const afterDone = ev.status==='done' && !!(ev.photos && ev.photos.after);
  const compareHtml = `
        <div class="hz-compare">
          <div class="cmp"><label>整改前</label><img src="${beforeSrc}" alt="整改前" onerror="cmpFallback(this,'整改前')"><div class="cap">现场原状</div></div>
          ${afterDone
            ? `<div class="cmp"><label>整改后</label><img src="${ev.photos.after}" alt="整改后" onerror="cmpFallback(this,'整改后')"><div class="cap">整改完成</div></div>`
            : `<div class="cmp"><label>整改后</label><div class="cmp-empty"><span>整改后照片待上传</span></div></div>`}
        </div>`;

  function deriveOperator(t){
    if(t.dot==='report') return '商铺自查'; // 隐患为每日履职自查上报
    if(['push','dispatch'].includes(t.dot)) return '系统';
    const d = t.desc || '';
    let m;
    if((m=d.match(/商户[^\u3002，。]{0,3}/))) return m[0];
    if(/物业/.test(d)) return '物业';
    if(/技术/.test(d)) return '技术员';
    return '系统';
  }

  const tlHtml = tlBodies.map((t,i)=>{
    const next = tlBodies[i+1];
    const isDoneEv = ev.status==='done';
    /* 步骤状态：已闭环=全部完成；未闭环=自查上报完成、现场整改当前、云上复核未开始 */
    let step;
    if(isDoneEv) step='done';
    else if(t.dot==='report') step='done';
    else if(t.dot==='handle') step='current';
    else step='todo';
    const nodeDone = step==='done';
    /* 时间：自查上报/云上复核=瞬时；现场整改=完成→复核 */
    let startT = t.time, endT;
    if(t.dot==='report' || t.dot==='close') endT = startT;
    else endT = next ? next.time : '--';
    if(step==='todo'){ startT = '--'; endT = '--'; }
    /* 操作人：未开始/整改未完成=--；已完成=描述中人员 */
    const opUnset = t.dot==='handle' && !isDoneEv;
    const operator = (step==='todo' || opUnset) ? '--' : (t.operator || deriveOperator(t));
    /* 已完成节点=绿色对钩；当前阶段=蓝色呼吸；未开始=淡灰原点 */
    const dotCls = `${t.dot} ${step}`;
    const dotInner = nodeDone ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>' : '';
    /* 描述：整改未完成显示派单信息；未开始步骤显示 -- */
    const descText = step==='todo' ? '--' : (opUnset ? (t.dDesc || t.desc) : t.desc);
    return `
      <div class="ev-tl-item ${step==='todo'?'todo':''}">
        <div class="ev-tl-dot ${dotCls}">${dotInner}</div>
        <div class="ev-tl-meta">
          <span class="field"><span class="k">开始</span><span class="v">${startT}</span></span>
          <span class="field"><span class="k">完成</span><span class="v">${endT}</span></span>
          <span class="field"><span class="k">操作人</span><span class="v">${operator}</span></span>
        </div>
        <div class="ev-tl-title">${t.title}</div>
        <div class="ev-tl-desc">${descText}</div>
      </div>`;
  }).join('');

  openOverlay('ev-detail-overlay', `
    <div class="ev-detail" onclick="event.stopPropagation()">
      <div class="ev-detail-head">
        <div class="ev-detail-head-left">
          <span class="dd-back" onclick="this.closest('.ev-detail-overlay').remove()">← 返回隐患列表</span>
        </div>
        <div class="ev-detail-close" onclick="this.closest('.ev-detail-overlay').remove()">✕</div>
      </div>
      <div class="ev-detail-body">
        <div class="ev-detail-status-big ${ev.status}">
          <span class="dot"></span>${rectifyStatus}
          <span class="ev-detail-ev-name">${stripDevPrefix(ev.title)}</span>
          ${overdue ? `<span class="hz-overdue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v5"/><path d="M12 16h.01"/><circle cx="12" cy="12" r="10"/></svg>超期未整改</span>` : ''}
        </div>
        <div class="ev-detail-meta">
          <div class="ev-detail-field"><div class="l">商铺</div><div class="v">${ev.shop}</div></div>
          <div class="ev-detail-field"><div class="l">位置</div><div class="v">${ev.addr}</div></div>
          <div class="ev-detail-field"><div class="l">隐患等级</div><div class="v"><span class="hz-level ${ev.level}">${levelLabel}</span></div></div>
          ${ev.status!=='done' ? `<div class="ev-detail-field"><div class="l">整改倒计时</div><div class="v hz-countdown ${overdue?'over':'soon'}" id="hzCountdown">${fmtCountdown(deadlineTs-Date.now())}</div></div>` : ''}
          <div class="ev-detail-field"><div class="l">上报时间</div><div class="v">${ev.time}</div></div>
        </div>
        <div class="hz-rectify">
          <div class="hz-rectify-row"><span class="k">整改要求</span><span class="v">${ri.req}</span></div>
          <div class="hz-rectify-row"><span class="k">责任人</span><span class="v">${ri.owner}-${rectPhone}</span></div>
        </div>
        ${compareHtml}
        <div style="font-size:14px;font-weight:600;margin-bottom:6px">整改时间线</div>
        <div class="ev-timeline">${tlHtml}</div>
      </div>
    </div>`);

  /* 整改倒计时实时刷新：弹窗关闭（元素移除）即停止 */
  if(ev.status!=='done'){
    const timer = setInterval(()=>{
      const el = document.getElementById('hzCountdown');
      if(!el){ clearInterval(timer); return; }
      el.textContent = fmtCountdown(deadlineTs - Date.now());
    },1000);
  }
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
