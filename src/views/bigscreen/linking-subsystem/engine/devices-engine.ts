import { cv, disposeCharts, initChart, openOverlay, toolbarHtml } from './shared-engine'
import { icoDevicePin, icoExportSmall, icoGas, icoPin, icoPlusSmall, icoRefreshSmall, icoSmoke } from './icon-consts'
import { shopDetailHtml, showEventDetail, showShopDetail } from './cross-module'
import { getAllEvents } from './events-engine'
import { SHOPS } from '../data/shops'
import { DEVICES, DEV_STATE } from '../data/devices'
// 模块3引擎：设备运行监测系统（原 renderDevices 族）
// 原 index.html renderContent 分发对应的渲染函数族，原样提取，仅 content→入参

import * as echarts from 'echarts'






export let bindSelectModule = (id: number) => {}
export function setModuleSwitch(fn: (id: number) => void) { bindSelectModule = fn }

let dvFilter = 'all'
let dvTypeFilter = 'all'
let dvSearchKeyword = ''
let dvPage = 1
const DV_PAGE_SIZE = 15

const devStateLabel = (st: any)=> ((DEV_STATE as any)[st] || (DEV_STATE as any).normal).label;
export { devStateLabel }

let activeContainer: HTMLElement
export function bindContainer(el: HTMLElement) { activeContainer = el }

export function renderDevices(body: HTMLElement, container?: HTMLElement){
  disposeCharts();
  const content = container || body;
  body.style.overflowY = 'hidden';

  const total = DEVICES.length;
  const normal = DEVICES.filter(d=>d.state==='normal').length;
  const offline = DEVICES.filter(d=>d.state==='offline').length;
  const fault = DEVICES.filter(d=>d.state==='fault').length;
  const fire = DEVICES.filter(d=>d.state==='fire').length;
  const warning = DEVICES.filter(d=>d.state==='warning').length;
  /* 可用设备 = 正常+火警+预警（能正常感知上报）；离线+故障为异常 */
  const available = total - offline - fault;
  const availableRate = Math.round(available/total*100);
  const smokeAll = DEVICES.filter(d=>d.type==='smoke');
  const gasAll = DEVICES.filter(d=>d.type==='gas');
  const smokeAvail = smokeAll.filter(d=>d.state!=='offline'&&d.state!=='fault').length;
  const gasAvail = gasAll.filter(d=>d.state!=='offline'&&d.state!=='fault').length;
  const smokeRate = Math.round(smokeAvail/smokeAll.length*100);
  const gasRate = Math.round(gasAvail/gasAll.length*100);

  const typeFilteredDevices = dvTypeFilter==='all' ? DEVICES : DEVICES.filter(d=>d.type===dvTypeFilter);
  const statusCounts = {
    total: typeFilteredDevices.length,
    normal: typeFilteredDevices.filter(d=>d.state==='normal').length,
    online: typeFilteredDevices.filter(d=>d.state!=='offline' && d.state!=='fault').length,
    offline: typeFilteredDevices.filter(d=>d.state==='offline').length,
    fire: typeFilteredDevices.filter(d=>d.state==='fire').length,
    warning: typeFilteredDevices.filter(d=>d.state==='warning').length,
    fault: typeFilteredDevices.filter(d=>d.state==='fault').length
  };
  const typeFilterLabel = dvTypeFilter==='smoke' ? '烟感' : dvTypeFilter==='gas' ? '燃气' : '全部';
  const statusFilterLabel = dvFilter==='all' ? '全部'
    : dvFilter==='online' ? '在线'
    : devStateLabel(dvFilter);
  const statusFilteredDevices = DEVICES.filter(d=>dvMatchesStatus(d, dvFilter));
  const typeCounts = {
    total: statusFilteredDevices.length,
    smoke: statusFilteredDevices.filter(d=>d.type==='smoke').length,
    gas: statusFilteredDevices.filter(d=>d.type==='gas').length
  };

  /* 设备列表（按类型、状态、关键词筛选） */
  let list = typeFilteredDevices.filter(d=>dvMatchesStatus(d, dvFilter));
  const normalizedKeyword = dvSearchKeyword.trim().toLowerCase();
  if(normalizedKeyword){
    list = list.filter(d=>`${d.code} ${d.shop} ${d.pos} ${d.addr} ${d.model} ${devStateLabel(d.state)} ${d.lastHb} ${d.readingName} ${d.readingValue} 电量 ${d.battery} 信号 ${d.signal}`.toLowerCase().includes(normalizedKeyword));
  }
  const totalPages = Math.max(1, Math.ceil(list.length / DV_PAGE_SIZE));
  if(dvPage > totalPages) dvPage = totalPages;
  const pageList = list.slice((dvPage-1)*DV_PAGE_SIZE, dvPage*DV_PAGE_SIZE);

  const listHtml = pageList.length ? pageList.map(d=>`
    <div class="dv-device data-row dv-row" onclick="showDeviceDetail('${d.id}','monitor')">
      <div><span class="st ${d.state}">${devStateLabel(d.state)}</span></div>
      <div class="data-main" style="display:flex;align-items:center;gap:10px">
        <div class="dvr-ico ${d.type}"><img src="${(d.type==='smoke'?'/linking-subsystem/烟雾报警器_4g-2.svg':'/linking-subsystem/燃气探测器.svg')}" alt=""></div>
        <div style="min-width:0">
          <div class="data-title">${d.code} ${d.type==='smoke'?'烟感探测器':'燃气探测器'}</div>
          <div class="data-sub dvr-pos">${icoPin}${d.pos}</div>
        </div>
      </div>
      <div class="data-main">
        <div class="data-title">${d.shop}</div>
        <div class="data-sub">${d.pos}</div>
      </div>
      <div>
        <div class="dv-runtime ${d.runtimeLevel}">${d.readingValue}</div>
        <div class="dv-runtime-muted">${d.readingName}</div>
      </div>
      <div class="dv-signal-cell">
        <div class="dv-metric-line">
          <span class="dv-metric-label">电量</span><span class="dv-metric-value">${d.battery}%</span><span class="dv-mini-bar"><i class="${d.battery<25?'bad':d.battery<45?'warn':''}" style="width:${d.battery}%"></i></span>
        </div>
        <div class="dv-metric-line">
          <span class="dv-metric-label">信号</span><span class="dv-metric-value">${d.signal}%</span><span class="dv-mini-bar"><i class="${d.signal<30?'bad':d.signal<50?'warn':''}" style="width:${d.signal}%"></i></span>
        </div>
      </div>
      <div class="data-cell muted">${d.lastHb}</div>
      <div class="row-actions">
        <button type="button" class="row-action" onclick="event.stopPropagation();showDeviceDetail('${d.id}','monitor')">详情</button>
      </div>
    </div>`).join('') : '<div style="text-align:center;padding:40px;color:var(--muted);font-size:14px">暂无设备记录</div>';
  const filterOptions = [
    {key:'all', label:'全部', count:statusCounts.total},
    {key:'normal', label:'正常', count:statusCounts.normal, dot:'green'},
    {key:'offline', label:'离线', count:statusCounts.offline},
    {key:'fire', label:'火警', count:statusCounts.fire, dot:'red'},
    {key:'warning', label:'预警', count:statusCounts.warning, dot:'red'},
    {key:'fault', label:'故障', count:statusCounts.fault}
  ];
  const filterHtml = filterOptions.map(f=>
    `<option value="${f.key}" ${dvFilter===f.key?'selected':''}>${f.label}</option>`
  ).join('');
  const typeFilterOptions = [
    {key:'all', label:'全部类型', count:typeCounts.total},
    {key:'smoke', label:'烟感', count:typeCounts.smoke},
    {key:'gas', label:'燃气', count:typeCounts.gas}
  ];
  const typeFilterHtml = typeFilterOptions.map(f=>
    `<option value="${f.key}" ${dvTypeFilter===f.key?'selected':''}>${f.label}</option>`
  ).join('');
  const pageButtons = Array.from({length:totalPages},(_,i)=>i+1).map(p=>
    `<button type="button" class="ev-page-btn ${p===dvPage?'active':''}" onclick="dvSetPage(${p})">${p}</button>`
  ).join('');
  const paginationHtml = `
    <div class="ev-pagination">
      <span class="ev-page-info">共 ${list.length} 条，每页 ${DV_PAGE_SIZE} 条</span>
      <button type="button" class="ev-page-btn" onclick="dvSetPage(${dvPage-1})" ${dvPage<=1?'disabled':''}>上一页</button>
      ${pageButtons}
      <button type="button" class="ev-page-btn" onclick="dvSetPage(${dvPage+1})" ${dvPage>=totalPages?'disabled':''}>下一页</button>
    </div>`;

  content.innerHTML = `
    ${toolbarHtml('设备运行监测', [
      {label:`设备类型：${typeFilterLabel}`},
      {label:'街道：全部'},
      {label:`状态：${statusFilterLabel}`}
    ], [
      {label:'刷新', icon:icoRefreshSmall},
      {label:'导出', icon:icoExportSmall},
      {label:'运维派单', icon:icoPlusSmall, primary:true}
    ])}
    <div class="dv-stats">
      <div class="dv-stat"><div class="dvs-ico total">${icoSmoke}</div><div><div class="dvs-label">接入设备总数</div><div class="dvs-value">${total}<span class="unit" style="font-size:16px;font-weight:600">台</span></div><div class="dvs-legend"><span class="lg smoke clickable ${dvTypeFilter==='smoke'?'active':''}" onclick="dvSetTypeFilter('smoke')"><i></i>烟感 ${smokeAll.length}</span><span class="lg gas clickable ${dvTypeFilter==='gas'?'active':''}" onclick="dvSetTypeFilter('gas')"><i></i>燃气 ${gasAll.length}</span></div></div><div class="dvs-ring" id="dvTypeRing" data-smoke="${smokeAll.length}" data-gas="${gasAll.length}"></div></div>
      <div class="dv-stat"><div class="dvs-ico online">${icoGas}</div><div><div class="dvs-label">设备在线率</div><div class="dvs-value">${availableRate}<span class="unit" style="font-size:16px;font-weight:600">%</span></div><div class="dvs-legend"><span class="lg on clickable ${dvFilter==='online'?'active':''}" onclick="dvSetFilter('online')"><i></i>在线 ${available}</span><span class="lg off clickable ${dvFilter==='offline'?'active':''}" onclick="dvSetFilter('offline')"><i></i>离线 ${offline}</span></div></div><div class="dvs-ring" id="dvRateRing" data-on="${available}" data-off="${offline}" data-fail="${fault}" data-rate="${availableRate}"></div></div>
      <div class="dv-stat clickable ${dvFilter==='fault'&&dvTypeFilter==='all'?'active':''}" onclick="dvSetStatusFilter('fault', true)"><div class="dvs-ico fault">${icoDevicePin}</div><div><div class="dvs-label">故障设备</div><div class="dvs-value" style="${fault>0?'color:#c56a00;':''}">${fault}</div></div></div>
    </div>

    <div class="dv-split no-cap">
      <div class="dv-record-panel">
        <div class="ev-list-tools">
          <div class="dv-list-tools-left">
            <label class="dv-filter-group"><span class="dv-filter-label">类型</span><span class="dv-select-wrap"><select class="dv-filter-select" onchange="dvSelectTypeFilter(this.value)">${typeFilterHtml}</select></span></label>
            <label class="dv-filter-group"><span class="dv-filter-label">状态</span><span class="dv-select-wrap"><select class="dv-filter-select" onchange="dvSetStatusFilter(this.value)">${filterHtml}</select></span></label>
          </div>
          <input class="ev-search-input" value="${dvSearchKeyword}" placeholder="搜索设备/商铺/点位" oninput="dvSetSearch(this.value)">
        </div>
        <div class="data-table-wrap">
          <div class="list-head-row dv-row">
            <span>状态</span><span>设备</span><span>商铺/点位</span><span>实时读数</span><span>电量/信号</span><span>最后心跳</span><span>操作</span>
          </div>
          <div class="dv-list" id="dvList">${listHtml}</div>
        </div>
        ${paginationHtml}
      </div>
    </div>`;

  /* 设备类型占比饼图（ECharts）- 烟感/燃气（与告警系统同款样式/动画） */
  const typeRing = content.querySelector('#dvTypeRing');
  if(typeRing){
    const sm = parseInt(typeRing.dataset.smoke), gs = parseInt(typeRing.dataset.gas);
    const chart = echarts.init(typeRing);
    chart.setOption({
      tooltip:{show:false},
      series:[{
        type:'pie', radius:['55%','85%'], center:['50%','50%'], silent:true,
        avoidLabelOverlap:false,
        label:{show:false}, labelLine:{show:false},
        itemStyle:{borderColor:'#fff', borderWidth:2},
        data:[
          {value:sm, name:'烟感', itemStyle:{color:'#1754b5'}},
          {value:gs, name:'燃气', itemStyle:{color:'#f0a040'}}
        ]
      }]
    });
    chart.resize();
  }

  /* 顶部在线率卡环形图（ECharts，同款样式/动画） */
  const rateRing = content.querySelector('#dvRateRing');
  if(rateRing){
    const on = parseInt(rateRing.dataset.on), off = parseInt(rateRing.dataset.off);
    const chart = echarts.init(rateRing);
    chart.setOption({
      tooltip:{show:false},
      series:[{
        type:'pie', radius:['55%','85%'], center:['50%','50%'], silent:true,
        avoidLabelOverlap:false,
        label:{show:false}, labelLine:{show:false},
        itemStyle:{borderColor:'#fff', borderWidth:2},
        data:[
          {value:on, name:'在线', itemStyle:{color:'#22c55e'}},
          ...(off>0?[{value:off, name:'离线', itemStyle:{color:'#8a919c'}}]:[])
        ]
      }]
    });
    chart.resize();
  }
}

export function makeDev(s,type,code,idx){
  /* 设备状态五态分配：正常/离线/火警/预警/故障 */
  let state = 'normal';
  const isSmoke = type==='smoke';
  // 离线：兴旺五金店(6)、兰州拉面馆(9) 第1台烟感
  if(isSmoke && (s.id===6||s.id===9) && idx===1) state='offline';
  // 火警：老张川菜(1)、美客烧烤(4) 第1台烟感（对应告警事件）
  else if(isSmoke && (s.id===1||s.id===4) && idx===1) state='fire';
  // 预警：燃气探测器 后厨(1/4/7/12) 第1台（浓度超标预警）
  else if(!isSmoke && (s.id===1||s.id===4||s.id===7||s.id===12) && idx===1) state='warning';
  // 故障：川渝火锅城(12) 第2台烟感
  else if(isSmoke && s.id===12 && idx===2) state='fault';
  const faults = [];
  if(state==='offline') faults.push('设备离线');
  if(state==='fault') faults.push('传感器故障');
  if(state==='fire') faults.push('火警告警');
  if(state==='warning') faults.push('浓度超标');
  /* 按业态匹配安装点位 */
  const biz = s.type;
  const smokePos = biz==='餐饮' ? (idx===1?'后厨天花板':idx===2?'大厅天花板':'库房顶部')
                 : biz==='零售' ? (idx===1?'商铺吊顶':idx===2?'库房顶部':'仓储区顶部')
                 : (idx===1?'店内吊顶':'仓库顶部');
  const gasPos = idx===1 ? '后厨燃气接口' : '燃气管道阀门处';
  const lifeTotalDays = isSmoke ? 3650 : 1825;
  const lifeSeeds = isSmoke ? [280, 760, 1380, 2480, 3220, 3710] : [220, 640, 1180, 1580, 1845];
  const runDays = lifeSeeds[(s.id + idx) % lifeSeeds.length] + (s.id * 13 + idx * 17) % 45;
  const installDate = new Date(2026, 7, 27);
  installDate.setDate(installDate.getDate() - runDays);
  const install = fmtDate(installDate);
  const lifeDays = lifeTotalDays - runDays;
  const purch = '2025-12-'+String((s.id+idx)%27+1).padStart(2,'0');
  const scrapDate = new Date(installDate);
  scrapDate.setDate(scrapDate.getDate() + lifeTotalDays);
  const scrap = fmtDate(scrapDate);
  const nextMaint = '2026-09-'+String((s.id*3+idx)%27+1).padStart(2,'0');
  const lastMaint = dLastMaint(type, runDays, s.id, idx);
  const owner = s.owner||'商户负责人', phone = s.phone||'138****0000';
  const smokeValue = state==='fire' ? (0.78 + ((s.id+idx)%4)*0.06).toFixed(2)
                   : state==='offline' ? '--'
                   : (0.04 + ((s.id*idx)%5)*0.02).toFixed(2);
  const gasValue = state==='warning' ? 320 + ((s.id+idx)%6)*25
                 : state==='offline' ? '--'
                 : 40 + ((s.id*idx)%9)*8;
  const readingValue = isSmoke ? `${smokeValue} dB/m` : `${gasValue} ppm`;
  const readingName = isSmoke ? '烟雾浓度' : '燃气浓度';
  const battery = state==='offline' ? Math.max(8, 24 - s.id) : Math.max(18, 96 - ((s.id*7 + idx*11) % 58));
  const signal = state==='offline' ? Math.max(8, 28 - s.id) : Math.max(35, 92 - ((s.id*5 + idx*13) % 48));
  const runtimeLevel = state==='fire' ? 'danger' : (state==='warning' || state==='fault' ? 'warning' : '');
  return {
    id: code, type, code, shopId:s.id, shop:s.name, addr:s.address,
    pos: (isSmoke ? smokePos : gasPos),
    install, runDays, lifeDays, lifeTotalDays, purch, scrap, nextMaint, lastMaint,
    owner, phone, model: isSmoke ? '海曼 SD-DO05' : '汉威 BS-100',
    state, faults, readingValue, readingName, battery, signal, runtimeLevel,
    lastHb: state!=='offline' ? '2026-08-25 10:'+String(10+idx*7).padStart(2,'0') : ('离线 '+(s.id*3+idx)+' 小时'),
    maint: isSmoke ? [
      {t:'2026-02-10', act:'安装接入', d:'已安装并联网，自检通过'},
      {t:'2026-05-12', act:'季度维保', d:'功能测试、灵敏度校验正常'},
      {t:'2026-06-18', act:'火警事件', d:'触发火警告警，已现场处置'}
    ] : [
      {t:'2026-02-14', act:'安装接入', d:'已安装并联网，气密性测试通过'},
      {t:'2026-05-08', act:'季度维保', d:'浓度标定、报警测试正常'},
      {t:'2026-06-15', act:'浓度预警', d:'触发浓度超标预警，已处置'}
    ]
  };
}

export function fmtDate(date){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export function formatUsedLife(days){
  const years = Math.floor(days / 365);
  const months = Math.max(0, Math.floor((days % 365) / 30));
  if(years <= 0) return `已用 ${months || 1}个月`;
  return `已用 ${years}年${months ? months + '个月' : ''}`;
}

export function dLastMaint(type, runDays, shopId, idx){
  const date = new Date(2026, 7, 27);
  date.setDate(date.getDate() - (18 + (shopId * 5 + idx * 9) % 70));
  return fmtDate(date);
}

export function getLifeInfo(d){
  const total = d.lifeTotalDays || 3650;
  const rawPct = Math.round(d.runDays / total * 100);
  const pct = Math.max(0, Math.min(100, rawPct));
  const expire = new Date(d.install);
  expire.setDate(expire.getDate() + total);
  const cls = rawPct >= 100 ? 'expired' : rawPct >= 90 ? 'due' : rawPct >= 70 ? 'watch' : 'ok';
  const label = rawPct >= 100 ? '超期服役' : rawPct >= 90 ? '临近到期' : rawPct >= 70 ? '关注观察' : '服役中';
  const totalYears = total / 365;
  return {
    pct,
    rawPct,
    cls,
    label,
    totalText: totalYears % 1 === 0 ? `${totalYears}年` : `${Math.round(total / 30)}个月`,
    usedText: formatUsedLife(d.runDays),
    expireText: `${expire.getFullYear()}-${String(expire.getMonth()+1).padStart(2,'0')}`,
    remainingText: d.lifeDays >= 0 ? `剩余约 ${Math.ceil(d.lifeDays / 30)}个月` : `已超期 ${Math.ceil(Math.abs(d.lifeDays) / 30)}个月`
  };
}

export function dvMatchesStatus(d, filter){
  if(filter==='normal') return d.state==='normal';
  if(filter==='online') return d.state!=='offline' && d.state!=='fault';
  if(filter==='offline') return d.state==='offline';
  if(filter==='fire') return d.state==='fire';
  if(filter==='warning') return d.state==='warning';
  if(filter==='fault') return d.state==='fault';
  return true;
}

export function dvSetFilter(f){ dvSetStatusFilter(f); }

export function dvSetStatusFilter(f, resetType=false){
  dvFilter = f;
  if(resetType) dvTypeFilter = 'all';
  dvPage = 1;
  renderDevices();
}

export function dvSetTypeFilter(f){
  dvTypeFilter = dvTypeFilter===f ? 'all' : f;
  dvPage = 1;
  renderDevices();
}

export function dvSelectTypeFilter(f){
  dvTypeFilter = f;
  dvPage = 1;
  renderDevices();
}

export function dvSetSearch(value){
  dvSearchKeyword = value;
  dvPage = 1;
  renderDevices();
  const input = document.querySelector('.dv-record-panel .ev-search-input');
  if(input){
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

export function dvSetPage(page){
  dvPage = Math.max(1, page);
  renderDevices();
}

export function getDeviceHistory(d){
  const base = parseFloat(d.readingValue) || 0;
  return Array.from({length:12},(_,i)=>{
    const hour = String(8 + i).padStart(2,'0') + ':00';
    let value;
    if(d.type==='smoke'){
      value = d.state==='fire' && i>=8 ? base + (i-7)*0.03 : Math.max(0.01, base * .65 + ((d.shopId+i)%5)*0.015);
      return {time:hour, value:Number(value.toFixed(2))};
    }
    value = d.state==='warning' && i>=7 ? base - (11-i)*12 : Math.max(12, base * .55 + ((d.shopId+i*3)%8)*6);
    return {time:hour, value:Math.round(value)};
  });
}

export function getAllDeviceMetricHistories(d){
  const primary = getDeviceHistory(d);
  const times = primary.map(x=>x.time);
  const tempBase = d.type==='smoke' ? 25 : 28;
  return [
    {key:'primary', icon:'数据', name:d.readingName, unit:d.type==='smoke'?'dB/m':'ppm', color:d.runtimeLevel==='danger'?'#d63b2f':d.runtimeLevel==='warning'?'#f0a040':'#1f6feb', data:primary.map(x=>x.value)},
    {key:'battery', icon:'电量', name:'电池电量', unit:'%', color:'#22c55e', data:times.map((_,i)=>Math.max(5, d.battery - Math.floor((11-i)/3)))},
    {key:'signal', icon:'信号', name:'通信信号', unit:'%', color:'#4a79ee', data:times.map((_,i)=>Math.max(5, Math.min(100, d.signal + ((i%5)-2)*3)))},
    {key:'temp', icon:'温度', name:'环境温度', unit:'℃', color:'#f0a040', data:times.map((_,i)=>Number((tempBase + ((d.shopId+i)%6)*0.8 + (d.state==='fire'&&i>8 ? (i-8)*2.2 : 0)).toFixed(1)))}
  ].map(m=>({...m, times}));
}

export function renderMetricChart(el, metric){
  const chart = echarts.init(el);
  chart.setOption({
    grid:{left:38,right:14,top:18,bottom:28},
    tooltip:{trigger:'axis', formatter:(items)=>{
      const item = items[0];
      return `${item.axisValue}<br>${metric.name}: ${item.data} ${metric.unit}`;
    }},
    xAxis:{type:'category',data:metric.times,axisTick:{show:false},axisLine:{lineStyle:{color:'#c9d7e8'}},axisLabel:{color:'#6b7280',fontSize:10}},
    yAxis:{type:'value',axisLine:{show:false},axisTick:{show:false},splitLine:{lineStyle:{color:'#e8eef5'}},axisLabel:{color:'#6b7280',fontSize:10}},
    series:[{
      type:'line',
      smooth:true,
      symbolSize:5,
      data:metric.data,
      lineStyle:{width:3,color:metric.color},
      itemStyle:{color:metric.color},
      areaStyle:{color:'rgba(31,111,235,.06)'}
    }]
  });
  chart.resize();
}

export function renderDeviceHistoryModalCharts(id){
  if(typeof echarts==='undefined') return;
  const d = DEVICES.find(x=>x.id===id);
  if(!d) return;
  getAllDeviceMetricHistories(d).forEach(metric=>{
    const el = document.getElementById(`historyChart-${metric.key}-${id.replace('#','')}`);
    if(el) renderMetricChart(el, metric);
  });
}

export function showDeviceDetail(id, mode='monitor'){
  const d = DEVICES.find(x=>x.id===id);
  if(!d) return;
  const isLedger = mode === 'ledger';
  const stateLabel = devStateLabel(d.state);
  const typeLabel = d.type==='smoke'?'烟感探测器':'燃气探测器';
  const stateCls = d.state;
  const life = getLifeInfo(d);
  const assetCards = isLedger ? `
          <div class="dd-asset-card ${life.cls}"><div class="l">生命周期状态</div><div class="v">${life.label}</div></div>
          <div class="dd-asset-card"><div class="l">寿命进度</div><div class="v">${life.rawPct}<span style="font-size:14px;color:var(--muted);font-weight:400">%</span></div></div>
          <div class="dd-asset-card"><div class="l">预计到期</div><div class="v">${life.expireText}</div></div>` : `
          <div class="dd-asset-card ${stateCls}"><div class="l">状态</div><div class="v">${stateLabel}</div></div>
          <div class="dd-asset-card"><div class="l">${d.readingName}</div><div class="v" style="font-size:22px">${d.readingValue}</div></div>
          <div class="dd-asset-card"><div class="l">最后心跳</div><div class="v" style="font-size:18px">${d.lastHb}</div></div>`;
  const basicFields = isLedger ? `
            <div class="dd-field"><div class="fl">设备编码</div><div class="fv"><b>${d.code}</b></div></div>
            <div class="dd-field"><div class="fl">设备类型</div><div class="fv">${typeLabel}</div></div>
            <div class="dd-field"><div class="fl">所属商铺</div><div class="fv">${d.shop}</div></div>
            <div class="dd-field"><div class="fl">安装位置</div><div class="fv">${d.addr} ${d.pos}</div></div>
            <div class="dd-field"><div class="fl">安装日期</div><div class="fv">${d.install}</div></div>
            <div class="dd-field"><div class="fl">设计寿命</div><div class="fv">${life.totalText}</div></div>
            <div class="dd-field"><div class="fl">已使用</div><div class="fv">${life.usedText.replace('已用 ','')} · ${life.rawPct}%</div></div>
            <div class="dd-field"><div class="fl">预计到期</div><div class="fv">${d.scrap}</div></div>
            <div class="dd-field"><div class="fl">最近维保</div><div class="fv">${d.lastMaint}</div></div>
            <div class="dd-field"><div class="fl">联系人</div><div class="fv">${d.owner}（设备管理人）</div></div>
            <div class="dd-field"><div class="fl">电话</div><div class="fv">${d.phone}</div></div>` : `
            <div class="dd-field"><div class="fl">设备编码</div><div class="fv"><b>${d.code}</b></div></div>
            <div class="dd-field"><div class="fl">设备类型</div><div class="fv">${typeLabel}</div></div>
            <div class="dd-field"><div class="fl">所属商铺</div><div class="fv">${d.shop}</div></div>
            <div class="dd-field"><div class="fl">安装位置</div><div class="fv">${d.addr} ${d.pos}</div></div>
            <div class="dd-field"><div class="fl">状态</div><div class="fv">${stateLabel}</div></div>
            <div class="dd-field"><div class="fl">实时读数</div><div class="fv">${d.readingName} ${d.readingValue}</div></div>
            <div class="dd-field"><div class="fl">电量/信号</div><div class="fv">电量 ${d.battery}% · 信号 ${d.signal}%</div></div>
            <div class="dd-field"><div class="fl">最后心跳</div><div class="fv">${d.lastHb}</div></div>
            <div class="dd-field"><div class="fl">异常原因</div><div class="fv">${d.faults.length ? d.faults.join('、') : '无'}</div></div>
            <div class="dd-field"><div class="fl">联系人</div><div class="fv">${d.owner}（设备管理人）</div></div>
            <div class="dd-field"><div class="fl">电话</div><div class="fv">${d.phone}</div></div>`;
  const maintRecords = isLedger ? d.maint.filter(m=>/安装|维保|检修|自检|标定/.test(m.act)) : d.maint;
  const maintRows = maintRecords.map(m=>`<div class="dd-rec-item"><span class="dd-rec-dot"></span><span class="date">${m.t}</span><div class="c"><div class="act">${m.act}</div><div class="desc">${m.d}</div></div></div>`).join('');
  const inspectRecords = d.maint.filter(m=>/维保|检修|自检|标定/.test(m.act));
  const inspectRows = inspectRecords.length>0 ? inspectRecords.map(m=>`<div class="dd-rec-item"><span class="dd-rec-dot"></span><span class="date">${m.t}</span><div class="c"><div class="act">${m.act}</div><div class="desc">${m.d}</div></div></div>`).join('') : `<div class="dd-rec-item"><span class="dd-rec-dot"></span><span class="date">--</span><div class="c"><div class="act">待巡检</div><div class="desc">暂无巡检记录</div></div></div>`;
  const relatedEvents = (SHOP_EVENTS[d.shopId] || [])
    .filter(e=>e.type===d.type || (d.type==='smoke' && /烟感|火警|烟雾/.test(e.title + e.desc)) || (d.type==='gas' && /燃气|浓度/.test(e.title + e.desc)))
    .slice(0,5);
  const relatedRows = relatedEvents.length ? relatedEvents.map(e=>`
            <div class="dd-event-row" onclick="showEventDetail('${e.id}')">
              <div class="dd-event-body">
                <div class="dd-event-title">${e.title.replace(/^(烟感|燃气|燃气探测器)[·・]/, '')}</div>
                <div class="dd-event-meta">${e.time} · ${e.desc}</div>
              </div>
              <span class="sd-tag-sm ${e.status==='done'?'green':'red'}">${e.status==='done'?'已处置':e.status==='processing'?'处置中':'未处置'}</span>
            </div>`).join('') : '<div class="sd-row" style="color:var(--muted);font-size:13px">暂无关联事件</div>';
  const monitorBlocks = '';
  const monitorTabs = isLedger ? `
          <span class="dd-tab active" data-dtab="basic" onclick="ddTab('basic')">生命周期档案</span>
          <span class="dd-tab" data-dtab="maint" onclick="ddTab('maint')">保养记录</span>
          <span class="dd-tab" data-dtab="inspect" onclick="ddTab('inspect')">巡检记录</span>
          <span class="dd-tab" data-dtab="log" onclick="ddTab('log')">操作日志</span>` : `
          <span class="dd-tab active" data-dtab="basic" onclick="ddTab('basic')">设备详情</span>
          <span class="dd-tab" data-dtab="events" onclick="ddTab('events')">告警事件</span>
          <span class="dd-tab" data-dtab="log" onclick="ddTab('log')">操作日志</span>`;
  const logRows = isLedger ? `
            <div class="dd-rec-item"><span class="dd-rec-dot"></span><span class="date">${d.install}</span><div class="c"><div class="act">设备建档</div><div class="desc">完成一机一码登记，形成生命周期档案</div></div></div>
            <div class="dd-rec-item"><span class="dd-rec-dot"></span><span class="date">${d.lastMaint}</span><div class="c"><div class="act">最近维保</div><div class="desc">完成设备外观、联网与功能核查</div></div></div>` : `
            <div class="dd-rec-item"><span class="dd-rec-dot"></span><span class="date">${d.install}</span><div class="c"><div class="act">设备接入</div><div class="desc">安装联网并完成自检，上报 ${d.code}</div></div></div>
            <div class="dd-rec-item"><span class="dd-rec-dot"></span><span class="date">2026-08-25</span><div class="c"><div class="act">运行上报</div><div class="desc">${d.lastHb} · ${d.faults.length ? d.faults.join('、') : '状态正常'}</div></div></div>`;
  openOverlay('dv-detail-overlay', `
    <div class="dv-detail" onclick="event.stopPropagation()">
      <div class="dd-top">
        <span class="dd-back" onclick="this.closest('.dv-detail-overlay').remove()">← 返回${isLedger?'生命周期台账':'设备列表'}</span>
        <div class="dd-top-right">
          <span class="dd-btn edit">编辑</span>
          <span class="dd-btn del">删除</span>
        </div>
      </div>
      <div class="dv-detail-body">
        <div class="dd-head">
          <div class="dd-thumb"><img src="${(d.type==='smoke'?'/linking-subsystem/烟雾报警器_4g-2.svg':'/linking-subsystem/燃气探测器.svg')}" alt=""></div>
          <div>
            <div class="dd-title">${d.code} ${typeLabel}</div>
            <div class="dd-sub">所属商铺：${d.shop}</div>
          </div>
        </div>

          <div class="dd-asset">
${assetCards}
          </div>
        ${isLedger ? '' : `
        <div class="dd-runtime-grid">
          <div class="dd-runtime-item">
            <div class="dd-runtime-head"><div class="l">${d.readingName}</div><button type="button" class="dd-history-link" title="查看历史曲线" onclick="showDeviceHistory('${d.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ico('数据')}</svg></button></div>
            <div class="v">${d.readingValue}</div>
          </div>
          <div class="dd-runtime-item">
            <div class="dd-runtime-head"><div class="l">电池电量</div><button type="button" class="dd-history-link" title="查看历史曲线" onclick="showDeviceHistory('${d.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ico('数据')}</svg></button></div>
            <div class="v">${d.battery}%</div>
          </div>
          <div class="dd-runtime-item">
            <div class="dd-runtime-head"><div class="l">通信信号</div><button type="button" class="dd-history-link" title="查看历史曲线" onclick="showDeviceHistory('${d.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ico('数据')}</svg></button></div>
            <div class="v">${d.signal}%</div>
          </div>
        </div>`}

        <div class="dd-tabs">
${monitorTabs}
        </div>
        <div class="dd-content" data-content="basic">
          <div class="dd-form">
${basicFields}
          </div>
${monitorBlocks}
        </div>
        <div class="dd-content" data-content="maint" style="display:none">
          <div class="dd-rec">
            ${maintRows}
          </div>
        </div>
        <div class="dd-content" data-content="inspect" style="display:none">
          <div class="dd-rec">
            ${inspectRows}
          </div>
        </div>
        <div class="dd-content" data-content="events" style="display:none">
          <div class="dd-monitor-title">告警事件<span class="cnt">${relatedEvents.length} 条</span></div>
          <div>${relatedRows}</div>
        </div>
        <div class="dd-content" data-content="log" style="display:none">
          <div class="dd-rec">
${logRows}
          </div>
        </div>
      </div>
    </div>`);
}

export function ddTab(name){
  document.querySelectorAll('.dd-tab').forEach(t=>t.classList.toggle('active', t.dataset.dtab===name));
  document.querySelectorAll('.dd-content').forEach(c=>c.style.display = c.dataset.content===name ? '' : 'none');
}

export function showDeviceHistory(id){
  const d = DEVICES.find(x=>x.id===id);
  if(!d) return;
  const chartId = id.replace('#','');
  const metrics = getAllDeviceMetricHistories(d);
  const cards = metrics.map(m=>`
    <div class="history-chart-card">
      <div class="history-chart-title"><span class="hc-l"><span class="hc-ico"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ico(m.icon)}</svg></span>${m.name}</span><span>${m.unit}</span></div>
      <div class="history-chart" id="historyChart-${m.key}-${chartId}"></div>
    </div>`).join('');
  openOverlay('sd-modal-overlay', `
    <div class="sd-modal history-modal" onclick="event.stopPropagation()">
      <div class="sd-modal-head">
        <span class="sd-modal-title">${d.code} ${d.type==='smoke'?'烟感探测器':'燃气探测器'} · 实时数据历史曲线</span>
        <div class="sd-modal-close" onclick="this.closest('.sd-modal-overlay').remove()">✕</div>
      </div>
      <div class="sd-modal-body">
        <div class="history-chart-grid">${cards}</div>
      </div>
    </div>`);
  requestAnimationFrame(()=>renderDeviceHistoryModalCharts(id));
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
