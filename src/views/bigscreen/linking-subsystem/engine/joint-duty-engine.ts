import { cv, disposeCharts, initChart, openOverlay, uiToast } from './shared-engine'
import { icoFb, icoFile, icoNotice, icoRead } from './icon-consts'
import { showEventDetail } from './cross-module'
import { NOTICES, NOTICE_SHOPS } from '../data/notices'
import { SHOPS } from '../data/shops'
// 模块7引擎：联勤协同联动系统（原 renderJointDuty 族）
// 原 index.html renderContent 分发对应的渲染函数族，原样提取，仅 content→入参

import * as echarts from 'echarts'




export let bindSelectModule = (id: number) => {}
export function setModuleSwitch(fn: (id: number) => void) { bindSelectModule = fn }

let jdFilter = 'all'
let jdSearchKeyword = ''
let jdPage = 1
const JD_PAGE_SIZE = 15
let activeContainer: HTMLElement
export function bindContainer(el: HTMLElement) { activeContainer = el }

export function renderJointDuty(body?: HTMLElement, container?: HTMLElement){
  body = body || activeContainer
  disposeCharts();
  const content = container || body;
  body.style.overflowY = 'hidden';

  const total = NOTICES.length;
  let totalRead=0, totalShops=0, fbCount=0, hasFbCount=0;
  NOTICES.forEach(n=>{
    totalRead += n.reads.length;
    totalShops += NOTICE_SHOPS.length;
    fbCount += n.feedbacks.length;
  });
  const readPct = Math.round(totalRead/totalShops*100);
  const withFb = NOTICES.filter(n=>n.feedbacks.length>0).length;

  let list = NOTICES;
  if(jdFilter==='read') list = list.filter(n=>n.reads.length===NOTICE_SHOPS.length);
  else if(jdFilter==='unread') list = list.filter(n=>n.reads.length<NOTICE_SHOPS.length);
  else if(jdFilter==='feedback') list = list.filter(n=>n.feedbacks.length>0);
  const jdKw = jdSearchKeyword.trim().toLowerCase();
  if(jdKw) list = list.filter(n=>`${n.code} ${n.title} ${n.publisher} ${n.scope}`.toLowerCase().includes(jdKw));
  const jdTotalPages = Math.max(1, Math.ceil(list.length / JD_PAGE_SIZE));
  if(jdPage > jdTotalPages) jdPage = jdTotalPages;
  const jdPageList = list.slice((jdPage-1)*JD_PAGE_SIZE, jdPage*JD_PAGE_SIZE);
  const jdPageButtons = Array.from({length:jdTotalPages},(_,i)=>i+1).map(p=>
    `<button type="button" class="ev-page-btn ${p===jdPage?'active':''}" onclick="jdSetPage(${p})">${p}</button>`
  ).join('');
  const jdPagination = `
    <div class="ev-pagination">
      <span class="ev-page-info">共 ${list.length} 条，每页 ${JD_PAGE_SIZE} 条</span>
      <button type="button" class="ev-page-btn" onclick="jdSetPage(${jdPage-1})" ${jdPage<=1?'disabled':''}>上一页</button>
      ${jdPageButtons}
      <button type="button" class="ev-page-btn" onclick="jdSetPage(${jdPage+1})" ${jdPage>=jdTotalPages?'disabled':''}>下一页</button>
    </div>`;

  /* 阅读状态下拉筛选 */
  const jdFilterHtml = [
    {key:'all', label:'全部'},
    {key:'read', label:'已全部阅读'},
    {key:'unread', label:'阅读中'},
    {key:'feedback', label:'有反馈'}
  ].map(f=>`<option value="${f.key}" ${jdFilter===f.key?'selected':''}>${f.label}</option>`).join('');

  /* 公告列表 */
  const listHtml = jdPageList.length ? jdPageList.map(n=>{
    const readN = n.reads.length, fbN = n.feedbacks.length;
    const readRate = Math.round(readN/NOTICE_SHOPS.length*100);
    return `
    <div class="jd-item data-row jd-row" onclick="showNoticeDetail(${n.id})">
      <div><span class="jd-item-code">${n.code}</span></div>
      <div class="data-main">
        <div class="data-title">${n.title}</div>
        <div class="data-sub">${n.publisher} · ${n.time}</div>
      </div>
      <div><span class="jd-item-type ${n.feedbacks.length?'fb':'plat'}">${n.scope}</span></div>
      <div><span class="jd-item-read">${readRate}%</span></div>
      <div class="data-cell">${fbN} 条反馈</div>
      <div class="row-actions">
        <button type="button" class="row-action" onclick="event.stopPropagation();showNoticeDetail(${n.id})">详情</button>
        <button type="button" class="row-action" onclick="event.stopPropagation();uiToast('催读提醒已发送')">催读</button>
      </div>
    </div>`;
  }).join('') : '<div style="text-align:center;padding:40px;color:var(--muted);font-size:14px">暂无符合条件的公告</div>';

  content.innerHTML = `
    <div class="jd-stats">
      <div class="jd-stat">
        <div class="jd-stat-left">
          <div class="js-label">通知公告</div>
          <div class="js-value">${total}</div>
          <div class="js-subs">
            <div class="js-sub"><span class="js-dot blue"></span><span class="js-num">${withFb}</span><span class="js-lbl">有反馈</span></div>
            <div class="js-sub"><span class="js-dot gray"></span><span class="js-num">${total-withFb}</span><span class="js-lbl">无反馈</span></div>
          </div>
        </div>
        <div class="jd-stat-chart" id="jdStatusChart"></div>
      </div>
      <div class="jd-stat">
        <div class="jd-stat-left">
          <div class="js-label">平均阅读率</div>
          <div class="js-value">${readPct}<span class="unit">%</span></div>
          <div class="js-subs">
            <div class="js-sub"><span class="js-dot green"></span><span class="js-num">${totalRead}</span><span class="js-lbl">已读人次</span></div>
            <div class="js-sub"><span class="js-dot orange"></span><span class="js-num">${totalShops-totalRead}</span><span class="js-lbl">未读人次</span></div>
          </div>
        </div>
        <div class="jd-stat-chart" id="jdTypeChart"></div>
      </div>
      <div class="jd-stat">
        <div class="jd-stat-left">
          <div class="js-label">企业反馈</div>
          <div class="js-value">${fbCount}</div>
          <div class="js-subs">
            <div class="js-sub"><span class="js-dot green"></span><span class="js-num">${fbCount}</span><span class="js-lbl">反馈数</span></div>
          </div>
        </div>
        <div class="jd-stat-chart" id="jdChainChart"></div>
      </div>
    </div>

    <div class="dv-record-panel jd-record-panel">
      <div class="ev-list-tools">
        <div class="dv-list-tools-left">
          <label class="dv-filter-group"><span class="dv-filter-label">状态</span><span class="dv-select-wrap"><select class="dv-filter-select" onchange="jdSetFilter(this.value)">${jdFilterHtml}</select></span></label>
          <input class="ev-search-input" value="${jdSearchKeyword}" placeholder="搜索公告/发布方/范围" oninput="jdSetSearch(this.value)">
        </div>
        <div class="jd-send" onclick="openNoticeDialog()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>新建通知
        </div>
      </div>
      <div class="data-table-wrap">
        <div class="list-head-row jd-row">
          <span>编号</span><span>公告</span><span>范围</span><span>阅读率</span><span>反馈</span><span>操作</span>
        </div>
        <div class="jd-list" id="jdList">${listHtml}</div>
      </div>
      ${jdPagination}
    </div>`;

  renderJointDutyCharts(withFb, total-withFb, totalRead, totalShops-totalRead, fbCount);
}

export function renderJointDutyCharts(withFb, noFb, totalRead, totalUnread, fbCount){
  const baseStyle = {
    type:'pie', radius:['55%','85%'], avoidLabelOverlap:false,
    label:{show:false}, labelLine:{show:false},
    itemStyle:{borderColor:'#fff', borderWidth:2}
  };

  /* 通知公告分布（有反馈/无反馈） */
  const statusEl = document.getElementById('jdStatusChart');
  if(statusEl){
    const chart = echarts.init(statusEl);
    chart.setOption({series:[{...baseStyle, data:[
      {value:withFb, name:'有反馈', itemStyle:{color:cv('--blue')}},
      {value:noFb, name:'无反馈', itemStyle:{color:'#c3c8d1'}}
    ]}]});
  }

  /* 阅读率分布（已读/未读） */
  const typeEl = document.getElementById('jdTypeChart');
  if(typeEl){
    const chart = echarts.init(typeEl);
    chart.setOption({series:[{...baseStyle, data:[
      {value:totalRead, name:'已阅读', itemStyle:{color:cv('--green')}},
      {value:totalUnread, name:'未阅读', itemStyle:{color:cv('--orange')}}
    ]}]});
  }

  const chainEl = document.getElementById('jdChainChart');
  if(chainEl){
    const chart = echarts.init(chainEl);
    chart.setOption({series:[{...baseStyle, data:[
      {value:fbCount, name:'反馈数', itemStyle:{color:cv('--green')}}
    ]}]});
  }
}

export function jdSetFilter(f){
  jdFilter = f;
  jdPage = 1;
  renderJointDuty();
}

export function jdSetSearch(value){
  jdSearchKeyword = value;
  jdPage = 1;
  renderJointDuty();
  const input = document.querySelector('.ev-list-tools .ev-search-input');
  if(input){ input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
}

export function jdSetPage(page){
  jdPage = Math.max(1, page);
  renderJointDuty();
}

export function openNoticeDialog(){
  const now = new Date();
  const pad = n=>String(n).padStart(2,'0');
  const autoCode = `GG-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(NOTICES.length+1)}`;
  const shopGridHtml = NOTICE_SHOPS.map(s=>`
    <label class="nf-shop"><input type="checkbox" value="${s}">${s}</label>`).join('');
  const typeMap = {};
  NOTICE_SHOPS.forEach(s=>{
    const sh = SHOPS.find(x=>x.name===s);
    const t = sh ? sh.type : '其它';
    typeMap[t] = (typeMap[t]||0) + 1;
  });
  const typeGridHtml = Object.entries(typeMap).map(([t,c])=>`
    <label class="nf-shop"><input type="checkbox" value="${t}">${t}类商铺（${c} 家）</label>`).join('');
  openOverlay('jd-detail-overlay', `
    <div class="jd-detail notice-drawer" onclick="event.stopPropagation()">
      <div class="jd-detail-head">
        <div>
          <div class="jd-detail-title">新建通知</div>
          <div style="font-size:13px;color:var(--muted);margin-top:2px">填写公告信息，发布后同步至辖区企业</div>
        </div>
        <div class="jd-detail-close" onclick="this.closest('.jd-detail-overlay').remove()">✕</div>
      </div>
      <div class="jd-detail-body">
        <div class="nb-card">
          <div class="nb-sec">
            <span class="nb-sec-ico c1">${icoNotice}</span>
            <span class="nb-sec-title">基本信息</span>
          </div>
          <div class="nf-field">
            <div class="nf-label">公告标题</div>
            <input class="nf-input" id="nfTitle" placeholder="请输入公告标题">
          </div>
          <div class="nf-row">
            <div class="nf-field">
              <div class="nf-label">公告编号 <span class="nf-tip">自动生成</span></div>
              <div class="nf-code"><span id="nfCode">${autoCode}</span><span class="nf-regenerate" onclick="regenerateNoticeCode()">重新生成</span></div>
            </div>
            <div class="nf-field">
              <div class="nf-label">发布方</div>
              <div class="nf-static">海港区应急管理局 · 消防大队</div>
            </div>
          </div>
          <div class="nf-field">
            <div class="nf-label">下发范围</div>
            <div class="nf-scope" id="nfScope">
              <span class="scr active" data-mode="all" onclick="setNfScope(this,'all')">全部企业</span>
              <span class="scr" data-mode="type" onclick="setNfScope(this,'type')">按业态</span>
              <span class="scr" data-mode="part" onclick="setNfScope(this,'part')">指定企业</span>
            </div>
            <div class="nf-shop-grid" id="nfTypeGrid" style="display:none">${typeGridHtml}</div>
            <div class="nf-shop-grid" id="nfShopGrid" style="display:none">${shopGridHtml}</div>
          </div>
        </div>
        <div class="nb-card">
          <div class="nb-sec">
            <span class="nb-sec-ico c1">${icoNotice}</span>
            <span class="nb-sec-title">公告内容</span>
            <span class="nb-sec-count">摘要 + 正文段落</span>
          </div>
          <div class="nf-field">
            <div class="nf-label">公告摘要</div>
            <textarea class="nf-textarea nf-summary" id="nfSummary" placeholder="一句话概括公告要点（详情页摘要框展示）"></textarea>
          </div>
          <div class="nf-field">
            <div class="nf-label">正文内容 <span class="nf-tip">支持小标题与段落</span></div>
            <div class="nf-blocks" id="nfBlocks">
              <div class="nf-block">
                <input class="nf-input nf-block-h" placeholder="小标题（可选）">
                <textarea class="nf-textarea nf-block-p" placeholder="段落内容…"></textarea>
              </div>
            </div>
            <div class="nf-add-block" onclick="addNoticeBlock()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>添加段落</div>
          </div>
          <div class="nf-field">
            <div class="nf-label">附件上传</div>
            <div class="nf-upload"><span class="up-ico">${icoFile}</span>点击上传附件（图片 / 文档，可多个）</div>
          </div>
        </div>
      </div>
      <div class="notice-foot">
        <div class="nf-cancel" onclick="this.closest('.jd-detail-overlay').remove()">取消</div>
        <div class="nf-send" onclick="publishNotice()">发布通知</div>
      </div>
    </div>`);
}

export function setNfScope(el, mode){
  el.parentElement.querySelectorAll('.scr').forEach(s=>s.classList.remove('active'));
  el.classList.add('active');
  const typeGrid = document.getElementById('nfTypeGrid');
  const shopGrid = document.getElementById('nfShopGrid');
  if(typeGrid) typeGrid.style.display = mode==='type' ? 'grid' : 'none';
  if(shopGrid) shopGrid.style.display = mode==='part' ? 'grid' : 'none';
}

export function regenerateNoticeCode(){
  const now = new Date();
  const pad = n=>String(n).padStart(2,'0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
  const used = NOTICES.filter(n=>n.code.includes(stamp)).length;
  const el = document.getElementById('nfCode');
  if(el) el.textContent = `GG-${stamp}-${pad(used+1)}`;
}

export function addNoticeBlock(){
  const el = document.createElement('div');
  el.className = 'nf-block';
  el.innerHTML = `
    <span class="nf-block-del" onclick="this.parentElement.remove()">删除</span>
    <input class="nf-input nf-block-h" placeholder="小标题（可选）">
    <textarea class="nf-textarea nf-block-p" placeholder="段落内容…"></textarea>`;
  document.getElementById('nfBlocks').appendChild(el);
}

export function publishNotice(){
  const titleEl = document.getElementById('nfTitle');
  const title = titleEl.value.trim();
  if(!title){ titleEl.focus(); return; }
  let scope = '全部企业';
  const active = document.querySelector('#nfScope .scr.active');
  const mode = active ? active.getAttribute('data-mode') : 'all';
  if(mode==='type'){
    const types = [...document.querySelectorAll('#nfTypeGrid input:checked')].map(i=>i.value);
    scope = types.length ? types.map(t=>`${t}类商铺`).join('、') : '全部企业';
  }else if(mode==='part'){
    const shops = [...document.querySelectorAll('#nfShopGrid input:checked')].map(i=>i.value);
    scope = shops.length ? `指定企业（${shops.length} 家）` : '全部企业';
  }
  const summary = document.getElementById('nfSummary').value.trim() || title;
  const blocks = [];
  document.querySelectorAll('#nfBlocks .nf-block').forEach(b=>{
    const h = b.querySelector('.nf-block-h').value.trim();
    const p = b.querySelector('.nf-block-p').value.trim();
    if(h) blocks.push({type:'h', text:h});
    if(p) blocks.push({type:'p', text:p});
  });
  if(!blocks.length) blocks.push({type:'p', text:summary});
  const now = new Date();
  const pad = n=>String(n).padStart(2,'0');
  NOTICES.unshift({
    id: Date.now(),
    code: document.getElementById('nfCode').textContent,
    title, scope,
    publisher:'海港区应急管理局 · 消防大队',
    time:`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    summary, body: blocks, attachments: [], reads: [], feedbacks: []
  });
  jdFilter = 'all';
  jdPage = 1;
  const ov = document.querySelector('.jd-detail-overlay');
  if(ov) ov.remove();
  renderJointDuty();
  uiToast('通知发布成功');
}

export function showNoticeDetail(id){
  const n = NOTICES.find(x=>x.id===id);
  if(!n) return;

  const bodyHtml = n.body.map(b=>{
    if(b.type==='h') return `<div class="nb-h">${b.text}</div>`;
    return `<div class="nb-p">${b.text}</div>`;
  }).join('');

  const attachHtml = n.attachments.length ? n.attachments.map(a=>`
    <span class="nb-attach">${icoFile}<span class="a-name">${a.name}</span><span class="a-size">${a.size}</span></span>`).join('') : '<div class="nb-none">无附件</div>';

  const readOk = n.reads.includes.bind(n.reads);
  const readListHtml = NOTICE_SHOPS.map((s,i)=>{
    const read = readOk(i+1);
    return `<span class="nb-shop ${read?'read':'unread'}">${read?'✓':'✗'} ${s}</span>`;
  }).join('');
  const unreadCount = NOTICE_SHOPS.length - n.reads.length;
  const readRate = Math.round(n.reads.length/NOTICE_SHOPS.length*100);

  const fbHtml = n.feedbacks.length ? n.feedbacks.map(f=>`
    <div class="nb-fb">
      <div class="nb-fb-head">
        <span class="nb-fb-shop">${f.shop}</span>
        <span class="nb-fb-time">${f.time}</span>
      </div>
      <div class="nb-fb-text">${f.text}</div>
      ${f.attachments.length?`<div class="nb-fb-file">${f.attachments.map(fa=>`<span class="nb-attach">${icoFile}<span class="a-name">${fa.name}</span><span class="a-size">${fa.size}</span></span>`).join('')}</div>`:''}
    </div>`).join('') : '<div class="nb-none">暂无企业反馈</div>';

  openOverlay('jd-detail-overlay', `
    <div class="jd-detail" onclick="event.stopPropagation()">
      <div class="jd-detail-head">
        <div>
          <div class="jd-detail-title">${n.title}</div>
          <div style="font-size:13px;color:var(--muted);margin-top:2px">${n.code} · ${n.scope} · ${n.publisher} · ${n.time}</div>
        </div>
        <div class="jd-detail-close" onclick="this.closest('.jd-detail-overlay').remove()">✕</div>
      </div>

      <div class="jd-detail-body">

        <!-- 板块一：公告内容 -->
        <div class="nb-card">
          <div class="nb-sec">
            <span class="nb-sec-ico c1">${icoNotice}</span>
            <span class="nb-sec-title">公告内容</span>
            <span class="nb-sec-count">共 ${n.body.length} 段 · ${n.attachments.length} 个附件</span>
          </div>
          <div class="nb-summary">${n.summary}</div>
          <div class="nb-body">${bodyHtml}</div>
          <div class="nb-attach-row">${attachHtml}</div>
        </div>

        <!-- 板块二：阅读统计 -->
        <div class="nb-card">
          <div class="nb-sec">
            <span class="nb-sec-ico c2">${icoRead}</span>
            <span class="nb-sec-title">阅读统计</span>
            <span class="nb-sec-count">已读 ${n.reads.length} / ${NOTICE_SHOPS.length} 家</span>
          </div>
          <div class="nb-stat-grid">
            <div class="nb-stat-box">
              <div class="nb-stat-num">${readRate}<span class="u">%</span></div>
              <div class="nb-stat-label">阅读率</div>
            </div>
            <div class="nb-stat-box">
              <div class="nb-stat-num">${n.reads.length}</div>
              <div class="nb-stat-label">已读企业</div>
            </div>
            <div class="nb-stat-box unread">
              <div class="nb-stat-num">${unreadCount}</div>
              <div class="nb-stat-label">未读企业</div>
            </div>
          </div>
          <div class="nb-readbar"><div class="nb-readbar-fill" style="width:${readRate}%"></div></div>
          <div class="nb-shopl">${readListHtml}</div>
        </div>

        <!-- 板块三：企业反馈 -->
        <div class="nb-card">
          <div class="nb-sec">
            <span class="nb-sec-ico c3">${icoFb}</span>
            <span class="nb-sec-title">企业反馈</span>
            <span class="nb-sec-count">${n.feedbacks.length} 条反馈</span>
          </div>
          ${fbHtml}
        </div>

      </div>
    </div>`);
}
