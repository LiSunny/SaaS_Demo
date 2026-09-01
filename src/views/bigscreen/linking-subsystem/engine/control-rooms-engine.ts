import { cv, disposeCharts, initChart, openOverlay } from './shared-engine'
import { icoClock, icoMonitor, icoUser } from './icon-consts'
import { showEventDetail } from './cross-module'
import { CONTROL_ROOMS, CR_CAM_TIMES, CR_LEAVE_EVENTS, CR_STATUS_MAP, DUTY_STATE_MAP } from '../data/control-rooms'
// 模块8引擎：消控联网监控系统（原 renderControlRooms 族）
// 原 index.html renderContent 分发对应的渲染函数族，原样提取，仅 content→入参

import * as echarts from 'echarts'




export let bindSelectModule = (id: number) => {}
export function setModuleSwitch(fn: (id: number) => void) { bindSelectModule = fn }

let crFilter = 'all'
let crSearchKeyword = ''
let crPage = 1
const CR_PAGE_SIZE = 4
let activeContainer: HTMLElement
export function bindContainer(el: HTMLElement) { activeContainer = el }

export function renderControlRooms(body?: HTMLElement, container?: HTMLElement){
  body = body || activeContainer
  disposeCharts();
  const content = container || body;
  body.style.overflowY = 'hidden';

  const total = CONTROL_ROOMS.length;
  const onduty = CONTROL_ROOMS.filter(r=>r.dutyGuard.state==='onduty').length;
  const offduty = total - onduty;
  const leaveTotal = CR_LEAVE_EVENTS.length;
  const leavePending = CR_LEAVE_EVENTS.filter(e=>e.status==='pending').length;
  const leaveDone = leaveTotal - leavePending;
  const maxAbsent = CR_LEAVE_EVENTS.filter(e=>e.status==='pending').reduce((m,e)=>Math.max(m,e.minutes),0);

  /* 筛选：在岗状态 → 模糊搜索 */
  let list = CONTROL_ROOMS;
  if(crFilter==='onduty')  list = list.filter(r=>r.dutyGuard.state==='onduty');
  if(crFilter==='offduty') list = list.filter(r=>r.dutyGuard.state!=='onduty');
  const crKw = crSearchKeyword.trim().toLowerCase();
  if(crKw) list = list.filter(r=>`${r.name} ${r.addr} ${r.shop} ${r.dutyGuard.name}`.toLowerCase().includes(crKw));
  const crTotalPages = Math.max(1, Math.ceil(list.length / CR_PAGE_SIZE));
  if(crPage > crTotalPages) crPage = crTotalPages;
  const crPageList = list.slice((crPage-1)*CR_PAGE_SIZE, crPage*CR_PAGE_SIZE);
  const crStatusHtml = [
    {key:'all', label:'全部状态', count:total},
    {key:'onduty', label:'在岗', count:onduty},
    {key:'offduty', label:'离岗', count:offduty}
  ].map(f=>`<option value="${f.key}" ${crFilter===f.key?'selected':''}>${f.label}</option>`).join('');
  const crPageButtons = Array.from({length:crTotalPages},(_,i)=>i+1).map(p=>
    `<button type="button" class="ev-page-btn ${p===crPage?'active':''}" onclick="crSetPage(${p})">${p}</button>`
  ).join('');
  const crPagination = `
    <div class="ev-pagination">
      <span class="ev-page-info">共 ${list.length} 个，每页 ${CR_PAGE_SIZE} 个</span>
      <button type="button" class="ev-page-btn" onclick="crSetPage(${crPage-1})" ${crPage<=1?'disabled':''}>上一页</button>
      ${crPageButtons}
      <button type="button" class="ev-page-btn" onclick="crSetPage(${crPage+1})" ${crPage>=crTotalPages?'disabled':''}>下一页</button>
    </div>`;

  const wallHtml = crPageList.length ? crPageList.map(r=>{
    const absent = r.dutyGuard.state!=='onduty';
    return `
    <div class="cr-wall-item${absent?' absent':''}" onclick="showCamVideo(${r.id})">
      <div class="cr-wall-cam">
        <img src="${r.cam}" alt="">
        <div class="cr-cam-info">
          <div class="cr-cam-name">${r.name}</div>
          <div class="cr-cam-addr">${r.addr}</div>
        </div>
        <div class="cr-cam-state ${absent?'absent':'onduty'}">${absent?'离岗中':'在岗'}</div>
        <div class="cr-cam-meta">
          <span>${icoUser}${r.dutyGuard.name}</span>
          <span>${icoClock}${CR_CAM_TIMES[(r.id-1)%CR_CAM_TIMES.length]}</span>
        </div>
        ${absent?`<div class="cr-cam-absent"><span>离岗 ${r.absentMinutes||0} 分钟</span></div>`:''}
      </div>
    </div>`;
  }).join('') : '<div style="text-align:center;padding:40px;color:var(--muted);font-size:14px">暂无符合条件的消控室</div>';

  const leaveHtml = CR_LEAVE_EVENTS.map(e=>`
    <div class="cr-leave-item" onclick="showLeaveDetail(${e.id})">
      <div class="cr-leave-shot" onclick="event.stopPropagation();showLeaveShot(${e.id})" title="查看现场监控截图">
        <img src="${e.shot}" alt="">
      </div>
      <div class="cr-leave-body">
        <div class="cr-leave-top">
          <span class="cr-leave-room">${e.room}</span>
          <span class="cr-leave-state ${e.status}">${e.status==='pending'?'待处置':'已处置'}</span>
        </div>
        <div class="cr-leave-desc">${e.status==='pending'
          ? `${e.start} 离岗，已持续 ${e.minutes} 分钟`
          : `${e.start}-${e.end} 离岗 ${e.minutes} 分钟，已返回岗位`}</div>
      </div>
      <div class="cr-leave-op">
        ${e.status==='pending'
          ? `<button type="button" class="row-action" onclick="event.stopPropagation();showLeaveDetail(${e.id})">查看详情</button>`
          : `<button type="button" class="row-action" onclick="event.stopPropagation();showLeaveShot(${e.id})">查看详情</button>`}
      </div>
    </div>`).join('');

  content.innerHTML = `
    <div class="cr-stats">
      <div class="cr-stat">
        <div class="cr-stat-left">
          <div class="cs-label">纳管消控室</div>
          <div class="cs-value">${total}</div>
          <div class="cs-subs">
            <div class="cs-sub clickable" onclick="crSetFilter('onduty')" title="只看在岗"><span class="cs-dot green"></span><span class="cs-num">${onduty}</span><span class="cs-lbl">在岗</span></div>
            <div class="cs-sub clickable" onclick="crSetFilter('offduty')" title="只看离岗"><span class="cs-dot red"></span><span class="cs-num">${offduty}</span><span class="cs-lbl">离岗</span></div>
          </div>
        </div>
        <div class="cr-stat-chart" id="crDutyChart"></div>
      </div>
      <div class="cr-stat">
        <div class="cr-stat-left">
          <div class="cs-label">当前在岗率</div>
          <div class="cs-value" style="color:var(--green-deep)">${Math.round(onduty/total*100)}%</div>
          <div class="cs-subs">
            <div class="cs-sub"><span class="cs-dot red"></span><span class="cs-num">${offduty}</span><span class="cs-lbl">个消控室离岗</span></div>
            <div class="cs-sub"><span class="cs-dot red"></span><span class="cs-num">${maxAbsent}</span><span class="cs-lbl">最长离岗分钟</span></div>
          </div>
        </div>
      </div>
      <div class="cr-stat">
        <div class="cr-stat-left">
          <div class="cs-label">今日离岗告警</div>
          <div class="cs-value">${leaveTotal}</div>
          <div class="cs-subs">
            <div class="cs-sub"><span class="cs-dot red"></span><span class="cs-num">${leavePending}</span><span class="cs-lbl">待处置</span></div>
            <div class="cs-sub"><span class="cs-dot green"></span><span class="cs-num">${leaveDone}</span><span class="cs-lbl">已处置</span></div>
          </div>
        </div>
        <div class="cr-stat-chart" id="crLeaveChart"></div>
      </div>
    </div>

    <div class="cr-main-split">
      <div class="dv-record-panel cr-record-panel">
        <div class="ev-list-tools">
          <div class="dv-list-tools-left">
            <label class="dv-filter-group"><span class="dv-filter-label">在岗状态</span><span class="dv-select-wrap"><select class="dv-filter-select" onchange="crSetFilter(this.value)">${crStatusHtml}</select></span></label>
          </div>
          <input class="ev-search-input" value="${crSearchKeyword}" placeholder="搜索消控室/地址/姓名" oninput="crSetSearch(this.value)">
        </div>
        <div class="data-table-wrap cr-wall-scroll">
          <div class="cr-wall">${wallHtml}</div>
        </div>
        ${crPagination}
      </div>

      <div class="cr-leave-panel">
        <div class="cr-leave-head">
          <div class="cr-leave-title">今日离岗告警</div>
          <span class="cr-leave-count">共 ${leaveTotal} 条</span>
        </div>
        <div class="cr-leave-list">${leaveHtml}</div>
      </div>
    </div>`;

  renderControlRoomCharts(onduty, offduty, leavePending, leaveDone);
}

export function renderControlRoomCharts(onduty, offduty, leavePending, leaveDone){
  const baseStyle = {
    type:'pie', radius:['55%','85%'], avoidLabelOverlap:false,
    label:{show:false}, labelLine:{show:false},
    itemStyle:{borderColor:'#fff', borderWidth:2}
  };

  const dutyEl = document.getElementById('crDutyChart');
  if(dutyEl){
    const chart = echarts.init(dutyEl);
    chart.setOption({series:[{...baseStyle, data:[
      {value:onduty, name:'在岗', itemStyle:{color:cv('--green')}},
      {value:offduty, name:'离岗', itemStyle:{color:cv('--accent')}}
    ]}]});
  }

  const leaveEl = document.getElementById('crLeaveChart');
  if(leaveEl){
    const chart = echarts.init(leaveEl);
    chart.setOption({series:[{...baseStyle, data:[
      {value:leavePending, name:'待处置', itemStyle:{color:cv('--accent')}},
      {value:leaveDone, name:'已处置', itemStyle:{color:cv('--green')}}
    ]}]});
  }
}

export function crSetFilter(f){
  crFilter = f;
  crPage = 1;
  renderControlRooms();
}

export function crSetSearch(value){
  crSearchKeyword = value;
  crPage = 1;
  renderControlRooms();
  const input = document.querySelector('.ev-list-tools .ev-search-input');
  if(input){ input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
}

export function crSetPage(page){
  crPage = Math.max(1, page);
  renderControlRooms();
}

export function showCamVideo(id){
  const r = CONTROL_ROOMS.find(x=>x.id===id);
  if(!r) return;
  const absent = r.dutyGuard.state!=='onduty';
  const video = r.cam.replace(/\.jpg$/,'.mp4');
  openOverlay('cr-video-overlay', `
    <div class="cr-video-box" onclick="event.stopPropagation()">
      <div class="cr-video-head">
        <span class="cr-video-title">${icoMonitor}${r.name} · 实时监控</span>
        <div class="cr-video-head-right">
          <span class="cr-live-tag ${absent?'absent':'live'}">${absent?'离岗中':'LIVE'}</span>
          <span class="cr-video-time">${icoClock}2026-08-27 ${CR_CAM_TIMES[(r.id-1)%CR_CAM_TIMES.length]}</span>
          <span class="cr-shot-close" onclick="this.closest('.cr-video-overlay').remove()">✕</span>
        </div>
      </div>
      <div class="cr-video-wrap">
        <video src="${video}" autoplay muted loop playsinline controls></video>
        <div class="cr-video-addr">${r.addr} · ${r.shop}</div>
        ${absent?`<div class="cr-video-absent"><span>离岗 ${r.absentMinutes||0} 分钟</span></div>`:''}
      </div>
      <div class="cr-video-foot">
        <span class="cr-video-desc">${absent?`离岗 ${r.absentMinutes||0} 分钟`:''} · 设备${(CR_STATUS_MAP[r.status]||{}).label||''}</span>
        <button type="button" class="action-btn" onclick="this.closest('.cr-video-overlay').remove();showControlRoomDetail(${r.id})">查看详情</button>
      </div>
    </div>`);
}

export function showControlRoomDetail(id){
  const r = CONTROL_ROOMS.find(x=>x.id===id);
  if(!r) return;

  const statusLabel = (st)=> (CR_STATUS_MAP[st]||CR_STATUS_MAP.online).label;
  const statusCls = (st)=> (CR_STATUS_MAP[st]||CR_STATUS_MAP.online).cls;
  const dutyLabel = (st)=> (DUTY_STATE_MAP[st]||DUTY_STATE_MAP.onduty).label;
  const dutyCls = (st)=> (DUTY_STATE_MAP[st]||DUTY_STATE_MAP.onduty).cls;
  const absent = r.dutyGuard.state!=='onduty';
  const alarmDotCls = (lv)=> lv==='red'?'red':lv==='orange'?'orange':'gray';

  const deviceStatusCls = (s)=> s==='ok'?'ok':s==='err'?'err':s==='warn'?'warn':'off';

  const shiftHtml = r.shiftSchedule.map(s=>`
    <tr>
      <td>${s.time}</td>
      <td>${s.guard}</td>
      <td><span class="cr-duty-tag ${dutyCls(s.state)}">${dutyLabel(s.state)}</span></td>
    </tr>`).join('');

  const deviceHtml = r.devices.map(d=>`
    <div class="cr-device-cell">
      <div class="dn">${d.name}</div>
      <div class="ds ${deviceStatusCls(d.status)}">${d.detail}</div>
    </div>`).join('');

  const alarmHtml = r.alarms.length ? r.alarms.map(a=>`
    <div class="cr-alarm-item">
      <div class="cr-alarm-dot ${alarmDotCls(a.level)}"></div>
      <div class="cr-alarm-body">
        <div class="cr-alarm-title">${a.title}</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-top:2px">${a.desc}</div>
        <div class="cr-alarm-time">${a.time}</div>
      </div>
    </div>`).join('') : '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">暂无告警记录</div>';

  const myLeaves = CR_LEAVE_EVENTS.filter(e=>e.roomId===r.id);
  const leaveRecordHtml = myLeaves.length ? myLeaves.map(e=>`
    <div class="cr-alarm-item" style="cursor:pointer" onclick="showLeaveShot(${e.id})">
      <div class="cr-alarm-dot ${e.status==='pending'?'red':'gray'}"></div>
      <div class="cr-alarm-body">
        <div class="cr-alarm-title">离岗告警 · ${e.status==='pending'?'待处置':'已处置'}</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-top:2px">${e.start} 离岗，${e.status==='pending'?`已持续 ${e.minutes} 分钟`:`${e.end} 返回岗位，离岗 ${e.minutes} 分钟`}</div>
        <div class="cr-alarm-time">${e.start} · 点击查看监控截图</div>
      </div>
    </div>`).join('') : '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">今日无离岗记录</div>';

  openOverlay('cr-detail-overlay', `
    <div class="cr-detail" onclick="event.stopPropagation()">
      <div class="cr-detail-head">
        <div>
          <div class="cr-detail-title">${r.name}</div>
          <div style="font-size:13px;color:var(--muted);margin-top:2px">${r.addr} · ${r.shop}</div>
        </div>
        <div class="cr-detail-close" onclick="this.closest('.cr-detail-overlay').remove()">✕</div>
      </div>
      <div class="cr-detail-body">
        <div class="cr-cam-big${absent?' absent':''}">
          <img src="${r.cam}" alt="">
          <div class="cr-cam-big-info">
            <span>${icoMonitor}CAM-0${r.id} · ${r.name}</span>
            <span>${icoClock}2026-08-27 ${CR_CAM_TIMES[(r.id-1)%CR_CAM_TIMES.length]}</span>
          </div>
          ${absent?`<div class="cr-cam-big-absent"><span>离岗 ${r.absentMinutes||0} 分钟</span></div>`:''}
        </div>
        <div class="dv-status-big ${dutyCls(r.dutyGuard.state)}">
          <span class="dot"></span>${dutyLabel(r.dutyGuard.state)}
          <span class="cr-item-status ${statusCls(r.status)}" style="margin-left:12px">${statusLabel(r.status)}</span>
        </div>
        <div class="ev-detail-meta">
          <div class="ev-detail-field"><div class="l">姓名</div><div class="v">${r.dutyGuard.name}</div></div>
          <div class="ev-detail-field"><div class="l">联系电话</div><div class="v">${r.dutyGuard.phone}</div></div>
          <div class="ev-detail-field"><div class="l">当前状态</div><div class="v">${absent?`<span class="cr-leave-state pending">离岗 ${r.absentMinutes||0} 分钟</span>`:`<span class="cr-leave-state done">在岗</span>`}</div></div>
          <div class="ev-detail-field"><div class="l">联网状态</div><div class="v">${r.netStatus} · ${r.uptime}</div></div>
        </div>
        <div class="section-title">今日离岗记录</div>
        <div>${leaveRecordHtml}</div>
        <div class="section-title">今日排班</div>
        <table class="cr-duty-table">
          <thead><tr><th>时段</th><th>姓名</th><th>状态</th></tr></thead>
          <tbody>${shiftHtml}</tbody>
        </table>
        <div class="section-title">设备运行状态</div>
        <div class="cr-device-grid">${deviceHtml}</div>
        <div class="section-title">告警记录</div>
        <div>${alarmHtml}</div>
      </div>
    </div>`);
}

export function showLeaveShot(id){
  const e = CR_LEAVE_EVENTS.find(x=>x.id===id);
  if(!e) return;
  openOverlay('cr-shot-overlay', `
    <div class="cr-shot-lightbox" onclick="event.stopPropagation()">
      <div class="cr-shot-head">
        <span>现场监控画面截图</span>
        <span class="cr-shot-close" onclick="this.closest('.cr-shot-overlay').remove()">✕</span>
      </div>
      <img src="${e.shotBig||e.shot}" alt="">
      <div class="cr-shot-meta">${e.room} · ${e.start} 离岗监控画面${e.end?` · ${e.end} 返回岗位`:''}</div>
    </div>`);
}

export function showLeaveDetail(id){
  const e = CR_LEAVE_EVENTS.find(x=>x.id===id);
  if(!e) return;
  const pending = e.status==='pending';
  const tl = [
    {time:e.start, title:'离岗开始', desc:'值班人员离开消控室', st:'done'},
    {time:e.start, title:'离岗告警推送', desc:'系统检测到值班位无人，推送离岗告警', st:'done'},
    pending
      ? {time:'--', title:'等待返回', desc:'待处置，等待返回岗位', st:'todo'}
      : {time:e.end, title:'返回岗位', desc:'值班人员返回消控室', st:'done'}
  ];
  openOverlay('cr-leave-detail-overlay', `
    <div class="cr-detail" onclick="event.stopPropagation()">
      <div class="cr-detail-head">
        <div>
          <div class="cr-detail-title">离岗告警详情</div>
          <div style="font-size:13px;color:var(--muted);margin-top:2px">${e.room}</div>
        </div>
        <div class="cr-detail-close" onclick="this.closest('.cr-leave-detail-overlay').remove()">✕</div>
      </div>
      <div class="cr-detail-body">
        <div class="cr-cam-big${pending?' absent':''}">
          <img src="${e.shotBig||e.shot}" alt="">
          <div class="cr-cam-big-info">
            <span>${icoMonitor}现场监控 · ${e.room}</span>
            <span>${icoClock}${e.start}</span>
          </div>
          ${pending?`<div class="cr-cam-big-absent"><span>离岗 ${e.minutes} 分钟</span></div>`:''}
        </div>
        <div class="dv-status-big ${pending?'offduty':'onduty'}">
          <span class="dot"></span>${pending?'离岗中':'已返回岗位'}
          <span class="cr-leave-state ${pending?'pending':'done'}" style="margin-left:12px">${pending?'待处置':'已处置'}</span>
        </div>
        <div class="ev-detail-meta">
          <div class="ev-detail-field"><div class="l">消控室</div><div class="v">${e.room}</div></div>
          <div class="ev-detail-field"><div class="l">姓名</div><div class="v">${e.guard}</div></div>
          <div class="ev-detail-field"><div class="l">离岗时间</div><div class="v">${e.start}</div></div>
          <div class="ev-detail-field"><div class="l">离岗时长</div><div class="v">${e.minutes} 分钟</div></div>
          <div class="ev-detail-field"><div class="l">处置状态</div><div class="v">${pending?'待处置':'已处置'}</div></div>
          <div class="ev-detail-field"><div class="l">返回时间</div><div class="v">${pending?'--':e.end}</div></div>
        </div>
        ${pending
          ? `<div style="display:flex;gap:10px;margin-bottom:16px">
              <button type="button" class="action-btn" style="flex:1" onclick="showLeaveShot(${e.id})">查看详情</button>
            </div>`
          : `<div style="margin-bottom:16px;padding:10px 14px;background:var(--green-soft);color:var(--green-deep);border-radius:8px;font-size:13px;font-weight:600">已于 ${e.end} 返回岗位，离岗 ${e.minutes} 分钟</div>`}
        <div class="section-title">处置过程</div>
        <div class="ld-tl">
          ${tl.map(t=>`
            <div class="ld-tl-item">
              <span class="ld-tl-dot ${t.st}"></span>
              <div class="ld-tl-title">${t.title}</div>
              <div class="ld-tl-desc">${t.desc}</div>
              <div class="ld-tl-time">${t.time}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`);
}
