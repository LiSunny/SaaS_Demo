import { cv, disposeCharts, initChart, openOverlay, toolbarHtml, uiToast } from './shared-engine'
import { icoExportSmall, icoPlusSmall, icoRefreshSmall } from './icon-consts'
import { showEventDetail } from './cross-module'
import { EMERGENCY_PLANS, EM_LEVEL_MAP, EM_TYPE_MAP } from '../data/emergency-plans'
// 模块10引擎：应急预案联动系统（原 renderEmergency 族）
// 原 index.html renderContent 分发对应的渲染函数族，原样提取，仅 content→入参

import * as echarts from 'echarts'




export let bindSelectModule = (id: number) => {}
export function setModuleSwitch(fn: (id: number) => void) { bindSelectModule = fn }

let emFilter = 'all'
let emLevelFilter = 'all'
let emSearchKeyword = ''
let emPage = 1
const EM_PAGE_SIZE = 15
let activeContainer: HTMLElement
export function bindContainer(el: HTMLElement) { activeContainer = el }

export function renderEmergency(body: HTMLElement, container?: HTMLElement){
  disposeCharts();
  const content = container || body;
  body.style.overflowY = 'hidden';

  const total = EMERGENCY_PLANS.length;
  const fire = EMERGENCY_PLANS.filter(p=>p.type==='fire').length;
  const gas = EMERGENCY_PLANS.filter(p=>p.type==='gas').length;
  const evac = EMERGENCY_PLANS.filter(p=>p.type==='evac').length;
  const firstaid = EMERGENCY_PLANS.filter(p=>p.type==='firstaid').length;
  const levelI = EMERGENCY_PLANS.filter(p=>p.level==='I').length;
  const drillCount = EMERGENCY_PLANS.reduce((s,p)=>s+p.drills.length,0);

  let list = EMERGENCY_PLANS;
  if(emFilter!=='all') list = list.filter(p=>p.type===emFilter);
  if(emLevelFilter!=='all') list = list.filter(p=>p.level===emLevelFilter);
  const emKw = emSearchKeyword.trim().toLowerCase();
  if(emKw) list = list.filter(p=>`${p.title} ${p.desc} ${p.cover} ${p.typeLabel} ${p.levelLabel}`.toLowerCase().includes(emKw));
  const emTotalPages = Math.max(1, Math.ceil(list.length / EM_PAGE_SIZE));
  if(emPage > emTotalPages) emPage = emTotalPages;
  const emPageList = list.slice((emPage-1)*EM_PAGE_SIZE, emPage*EM_PAGE_SIZE);
  const emTypeHtml = [
    {key:'all', label:'全部类型', count:total},
    {key:'fire', label:'火灾事故', count:fire},
    {key:'gas', label:'燃气泄漏', count:gas},
    {key:'evac', label:'人员疏散', count:evac},
    {key:'firstaid', label:'医疗急救', count:firstaid}
  ].map(f=>`<option value="${f.key}" ${emFilter===f.key?'selected':''}>${f.label}</option>`).join('');
  const emLevelHtml = [
    {key:'all', label:'全部级别', count:total},
    {key:'I', label:'Ⅰ级（重大）', count:levelI},
    {key:'II', label:'Ⅱ级', count:EMERGENCY_PLANS.filter(p=>p.level==='II').length},
    {key:'III', label:'Ⅲ级', count:EMERGENCY_PLANS.filter(p=>p.level==='III').length}
  ].map(f=>`<option value="${f.key}" ${emLevelFilter===f.key?'selected':''}>${f.label}</option>`).join('');
  const emPageButtons = Array.from({length:emTotalPages},(_,i)=>i+1).map(p=>
    `<button type="button" class="ev-page-btn ${p===emPage?'active':''}" onclick="emSetPage(${p})">${p}</button>`
  ).join('');
  const emPagination = `
    <div class="ev-pagination">
      <span class="ev-page-info">共 ${list.length} 项，每页 ${EM_PAGE_SIZE} 项</span>
      <button type="button" class="ev-page-btn" onclick="emSetPage(${emPage-1})" ${emPage<=1?'disabled':''}>上一页</button>
      ${emPageButtons}
      <button type="button" class="ev-page-btn" onclick="emSetPage(${emPage+1})" ${emPage>=emTotalPages?'disabled':''}>下一页</button>
    </div>`;

  const listHtml = emPageList.length ? emPageList.map(p=>`
    <div class="em-item data-row em-row" onclick="showEmergencyDetail(${p.id})">
      <div class="data-main" style="display:flex;align-items:center;gap:10px">
        <div class="em-item-ico ${EM_TYPE_MAP[p.type].ico}">${EM_TYPE_MAP[p.type].icoEl}</div>
        <div style="min-width:0">
          <div class="data-title">${p.title}</div>
          <div class="data-sub">${p.desc}</div>
        </div>
      </div>
      <div><span class="em-item-level ${EM_LEVEL_MAP[p.level].cls}">${p.levelLabel}</span></div>
      <div class="data-cell">${p.cover}</div>
      <div class="data-cell muted">${p.updated}</div>
      <div><span class="em-item-ver">${p.version}</span></div>
      <div class="row-actions">
        <button type="button" class="row-action" onclick="event.stopPropagation();showEmergencyDetail(${p.id})">查看</button>
        <button type="button" class="row-action danger" onclick="event.stopPropagation();uiToast('联动指令已下发')">联动</button>
      </div>
    </div>`).join('') : '<div style="text-align:center;padding:40px;color:var(--muted);font-size:14px">暂无该类应急预案</div>';

  content.innerHTML = `
    ${toolbarHtml('应急预案库', [
      {label:'预案类型：全部'},
      {label:'级别：全部'},
      {label:'状态：已发布'}
    ], [
      {label:'刷新', icon:icoRefreshSmall},
      {label:'导出', icon:icoExportSmall},
      {label:'新增预案', icon:icoPlusSmall, primary:true}
    ])}
    <div class="em-stats">
      <div class="em-stat">
        <div class="em-stat-left">
          <div class="es-label">应急预案数</div>
          <div class="es-value">${total}</div>
          <div class="es-subs">
            <div class="es-sub"><span class="es-dot red"></span><span class="es-num">${fire}</span><span class="es-lbl">火灾</span></div>
            <div class="es-sub"><span class="es-dot orange"></span><span class="es-num">${gas}</span><span class="es-lbl">燃气</span></div>
            <div class="es-sub"><span class="es-dot blue"></span><span class="es-num">${evac}</span><span class="es-lbl">疏散</span></div>
            <div class="es-sub"><span class="es-dot green"></span><span class="es-num">${firstaid}</span><span class="es-lbl">急救</span></div>
          </div>
        </div>
        <div class="em-stat-chart" id="emTypeChart"></div>
      </div>
      <div class="em-stat">
        <div class="em-stat-left">
          <div class="es-label">重大预案</div>
          <div class="es-value" style="color:var(--accent-deep)">${levelI}</div>
          <div class="es-subs">
            <div class="es-sub"><span class="es-dot red"></span><span class="es-num">${levelI}</span><span class="es-lbl">Ⅰ级</span></div>
            <div class="es-sub"><span class="es-dot orange"></span><span class="es-num">${total-levelI}</span><span class="es-lbl">Ⅱ/Ⅲ级</span></div>
          </div>
        </div>
        <div class="em-stat-chart" id="emLevelChart"></div>
      </div>
      <div class="em-stat">
        <div class="em-stat-left">
          <div class="es-label">累计演练</div>
          <div class="es-value">${drillCount}</div>
          <div class="es-subs">
            <div class="es-sub"><span class="es-dot green"></span><span class="es-num">${EMERGENCY_PLANS.reduce((s,p)=>s+p.drills.filter(d=>d.type==='green').length,0)}</span><span class="es-lbl">达标</span></div>
            <div class="es-sub"><span class="es-dot orange"></span><span class="es-num">${EMERGENCY_PLANS.reduce((s,p)=>s+p.drills.filter(d=>d.type==='orange').length,0)}</span><span class="es-lbl">待改进</span></div>
          </div>
        </div>
        <div class="em-stat-chart" id="emDrillChart"></div>
      </div>
    </div>

    <div class="dv-record-panel em-record-panel">
      <div class="ev-list-tools">
        <div class="dv-list-tools-left">
          <label class="dv-filter-group"><span class="dv-filter-label">类型</span><span class="dv-select-wrap"><select class="dv-filter-select" onchange="emSetFilter(this.value)">${emTypeHtml}</select></span></label>
          <label class="dv-filter-group"><span class="dv-filter-label">级别</span><span class="dv-select-wrap"><select class="dv-filter-select" onchange="emSetLevelFilter(this.value)">${emLevelHtml}</select></span></label>
        </div>
        <input class="ev-search-input" value="${emSearchKeyword}" placeholder="搜索预案/适用范围" oninput="emSetSearch(this.value)">
      </div>
      <div class="data-table-wrap">
        <div class="list-head-row em-row">
          <span>预案</span><span>级别</span><span>适用范围</span><span>更新日期</span><span>版本</span><span>操作</span>
        </div>
        <div class="em-list" id="emList">${listHtml}</div>
      </div>
      ${emPagination}
    </div>`;

  renderEmergencyCharts(fire, gas, evac, firstaid, levelI, total, drillCount);
}

export function renderEmergencyCharts(fire, gas, evac, firstaid, levelI, total, drillCount){
  const baseStyle = {
    type:'pie', radius:['55%','85%'], avoidLabelOverlap:false,
    label:{show:false}, labelLine:{show:false},
    itemStyle:{borderColor:'#fff', borderWidth:2}
  };

  const typeEl = document.getElementById('emTypeChart');
  if(typeEl){
    const chart = echarts.init(typeEl);
    chart.setOption({series:[{...baseStyle, data:[
      {value:fire, name:'火灾', itemStyle:{color:cv('--accent')}},
      {value:gas, name:'燃气', itemStyle:{color:cv('--orange')}},
      {value:evac, name:'疏散', itemStyle:{color:cv('--blue')}},
      {value:firstaid, name:'急救', itemStyle:{color:cv('--green')}}
    ]}]});
  }

  const levelEl = document.getElementById('emLevelChart');
  if(levelEl){
    const chart = echarts.init(levelEl);
    chart.setOption({series:[{...baseStyle, data:[
      {value:levelI, name:'Ⅰ级', itemStyle:{color:cv('--accent')}},
      {value:total-levelI, name:'Ⅱ/Ⅲ级', itemStyle:{color:cv('--orange')}}
    ]}]});
  }

  const drillEl = document.getElementById('emDrillChart');
  if(drillEl){
    const chart = echarts.init(drillEl);
    const ok = EMERGENCY_PLANS.reduce((s,p)=>s+p.drills.filter(d=>d.type==='green').length,0);
    const imp = EMERGENCY_PLANS.reduce((s,p)=>s+p.drills.filter(d=>d.type==='orange').length,0);
    chart.setOption({series:[{...baseStyle, data:[
      {value:ok, name:'达标', itemStyle:{color:cv('--green')}},
      {value:imp, name:'待改进', itemStyle:{color:cv('--orange')}}
    ]}]});
  }
}

export function emSetFilter(f){
  emFilter = f;
  emPage = 1;
  renderEmergency();
}

export function emSetLevelFilter(f){
  emLevelFilter = f;
  emPage = 1;
  renderEmergency();
}

export function emSetSearch(value){
  emSearchKeyword = value;
  emPage = 1;
  renderEmergency();
  const input = document.querySelector('.ev-list-tools .ev-search-input');
  if(input){ input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
}

export function emSetPage(page){
  emPage = Math.max(1, page);
  renderEmergency();
}

export function showEmergencyDetail(id){
  const p = EMERGENCY_PLANS.find(x=>x.id===id);
  if(!p) return;

  const orgHtml = p.org.map(o=>`
    <div class="em-org-row">
      <div class="em-org-role">${o.role}</div>
      <div class="em-org-name">${o.name}</div>
      <div class="em-org-duty">${o.duty}</div>
    </div>`).join('');

  const flowHtml = p.flow.map((s,i)=>`
    <div class="em-flow-step">
      <div class="em-flow-dot ${s.done?'done':''}">${i+1}</div>
      <div class="em-flow-body">
        <div class="em-flow-title">${s.t}</div>
        <div class="em-flow-desc">${s.d}</div>
      </div>
    </div>`).join('');

  const forceHtml = p.force.map(f=>`
    <div class="em-force-cell">
      <div class="fk">${f.k}</div>
      <div class="fv">${f.v}</div>
    </div>`).join('');

  const resHtml = p.res.map(r=>`
    <div class="em-res-cell">
      <div class="rn">${r.n}</div>
      <div class="rc">${r.c}</div>
    </div>`).join('');

  const drillHtml = p.drills.map(d=>`
    <div class="em-drill">
      <div class="em-drill-dot ${d.type}"></div>
      <div class="em-drill-body">
        <div class="em-drill-title">${d.t}</div>
        <div class="em-drill-meta">${d.d}</div>
        <div class="em-drill-note">${d.note}</div>
      </div>
    </div>`).join('');

  openOverlay('em-detail-overlay', `
    <div class="em-detail" onclick="event.stopPropagation()">
      <div class="em-detail-head">
        <div>
          <div class="em-detail-title">${p.title}</div>
          <div style="font-size:13px;color:var(--muted);margin-top:2px">${p.typeLabel} · ${p.cover} · ${p.version} · 更新于 ${p.updated}</div>
        </div>
        <div class="em-detail-close" onclick="this.closest('.em-detail-overlay').remove()">✕</div>
      </div>
      <div class="em-detail-body">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <span class="em-item-level ${EM_LEVEL_MAP[p.level].cls}" style="margin-left:0">${p.levelLabel}</span>
          <span style="font-size:13px;color:var(--text-secondary)">${p.desc}</span>
        </div>

        <div class="section-title">适用场景</div>
        <div class="role-row">${p.scenes.map(s=>`<span class="role">${s}</span>`).join('')}</div>

        <div class="section-title">应急组织架构</div>
        <div class="em-org">${orgHtml}</div>

        <div class="section-title">应急处置流程</div>
        <div class="em-flow">${flowHtml}</div>

        <div class="section-title">力量调度</div>
        <div class="em-force">${forceHtml}</div>

        <div class="section-title">物资配置</div>
        <div class="em-res">${resHtml}</div>

        <div class="section-title">演练记录</div>
        ${drillHtml}
      </div>
    </div>`);
}
