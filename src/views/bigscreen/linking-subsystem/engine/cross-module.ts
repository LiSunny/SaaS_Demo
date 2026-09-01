// 跨模块引擎共享函数（原 index.html 1:1，独立文件避免引擎间循环依赖）
import { SHOPS, STREETS } from '../data/shops'
import * as echarts from 'echarts'
import { SHOP_EVENTS, BEFORE_PHOTO_POOL } from '../data/shop-events'
import { initChart, cv, openOverlay, cmpFallback } from './shared-engine'
function fmtDate(date){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function formatUsedLife(days){
  const years = Math.floor(days / 365);
  const months = Math.max(0, Math.floor((days % 365) / 30));
  if(years <= 0) return `已用 ${months || 1}个月`;
  return `已用 ${years}年${months ? months + '个月' : ''}`;
}
function dLastMaint(type, runDays, shopId, idx){
  const date = new Date(2026, 7, 27);
  date.setDate(date.getDate() - (18 + (shopId * 5 + idx * 9) % 70));
  return fmtDate(date);
}
const icoCheck = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`
const icoAlert = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`
const icoPin = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>`
const icoUser = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
const icoPhone = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>`
const icoDoc = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>`
export function getAllEvents(){
  let all = [];
  for(const sid in SHOP_EVENTS) all = all.concat(SHOP_EVENTS[sid]);
  return all;
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
    let src = '现场处置-设备检修.png';
    let alt = '设备检修现场照片';
    if(/低电量|离线|故障|拆下|电池|检修/.test(ev.title + ev.desc)){
      src = '现场处置-设备检修.png';
      alt = '设备异常现场检修照片';
    }else if(ev.type==='smoke' && /火警|烟雾|烟感/.test(ev.title + ev.desc)){
      src = '现场处置-烟感火警.png';
      alt = '烟感火警现场核实照片';
    }else if(ev.type==='gas' || /燃气|甲烷|浓度|泄漏|阀/.test(ev.title + ev.desc)){
      src = '现场处置-燃气排查.png';
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

export function renderShopDeviceChart(shopId){
  if(typeof echarts==='undefined') return;
  const el = document.getElementById(`shopDeviceChart-${shopId}`);
  if(!el) return;
  const chart = echarts.init(el);
  const data = [
    {value:parseInt(el.dataset.smoke||0), name:'烟感', itemStyle:{color:'#4a79ee'}},
    {value:parseInt(el.dataset.extinguisher||0), name:'灭火器', itemStyle:{color:'#39b54a'}},
    {value:parseInt(el.dataset.gas||0), name:'燃气报警', itemStyle:{color:'#f0a040'}},
    {value:parseInt(el.dataset.other||0), name:'其他', itemStyle:{color:'#8d8d8d'}}
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

export function shopDetailHtml(id: number, full?: boolean, container?: HTMLElement){
  const s = SHOPS.find(x=>x.id===id);
  if(!s) return '';
  const backStreet = detailBackStreetId ? STREETS.find(x=>x.id===detailBackStreetId) : null;

  /* 履责日历: 6月, 1日=周一, today=23 */
  const weekdays = ['日','一','二','三','四','五','六'];
  const today = 23;
  let calHtml = '';
  weekdays.forEach(d=>{ calHtml += `<div class="sd-cal-cell" style="color:#b9b9b9">${d}</div>`; });
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
    {c:'#4a79ee', t:'烟感', n:dev.smoke},
    {c:'#39b54a', t:'灭火器', n:dev.extinguisher},
    {c:'#f0a040', t:'燃气报警', n:dev.gas},
    {c:'#8d8d8d', t:'其他', n:dev.other}
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
