// 海港区应消联勤平台 · devices 数据（从 index.html 原样抽取，不做任何改动）
import { SHOPS } from './shops'

function makeDev(s,type,code,idx){
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
function getLifeInfo(d){
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

let __devSeq = { sf: 1, gs: 1 }
export const DEVICES = (()=>{
  const list = [];
  SHOPS.forEach(s=>{
    const sfBase = s.devices.smoke||0, gsBase = s.devices.gas||0;
    for(let i=1;i<=sfBase;i++){
      const sf = '#SF-'+String(__devSeq.sf).padStart(3,'0'); __devSeq.sf++;
      list.push(makeDev(s,'smoke',sf,i));
    }
    for(let i=1;i<=gsBase;i++){
      const gs = '#GS-'+String(__devSeq.gs).padStart(3,'0'); __devSeq.gs++;
      list.push(makeDev(s,'gas',gs,i));
    }
  });
  return list;
})();


export const DEV_STATE = {
  normal:  {label:'正常', cls:'normal'},
  offline: {label:'离线', cls:'offline'},
  fire:    {label:'火警', cls:'fire'},
  warning: {label:'预警', cls:'warning'},
  fault:   {label:'故障', cls:'fault'}
};

