// 海港区应消联勤平台 · emergency-plans 数据（从 index.html 原样抽取，不做任何改动）

export const EMERGENCY_PLANS = [
  {id:1, type:'fire', typeLabel:'火灾事故', title:'沿街商铺火灾处置应急预案', level:'I', levelLabel:'Ⅰ级（重大）',
   version:'V3.2', updated:'2026-06-20', cover:'覆盖辖区内 12 家沿街商铺',
   scenes:['餐饮类商铺后厨起火','电气线路短路引燃','易燃品存放不当失火'],
   desc:'针对沿街商铺火灾事故，明确探测触发、多渠道报警、先期处置、专业救援、复盘归档的全流程响应机制。',
   org:[
     {role:'总指挥', name:'街道应急管理办 刘主任', duty:'统筹指挥、下达调度指令'},
     {role:'现场指挥', name:'消防救援站 王站长', duty:'现场处置指挥、力量部署'},
     {role:'网格员', name:'李明', duty:'先期到场核实、组织疏散'},
     {role:'经营者', name:'张建国', duty:'初期扑救、配合断电断气'},
     {role:'后勤保障', name:'物业 刘经理', duty:'物资保障、通道清理'}
   ],
   flow:[
     {t:'探测触发', d:'烟感/燃气探测到真实火情阈值，平台研判并上报', done:true},
     {t:'多渠道报警', d:'同步推送经营者、网格员、微型消防站、指挥中心四端', done:true},
     {t:'预案调度', d:'报警信息、点位图、力量与预案同步推送至救援终端', done:true},
     {t:'先期处置', d:'就近力量先期到场、疏散人群、初期扑救', done:false},
     {t:'专业救援', d:'消防救援力量到场，灭火、搜救、排烟', done:false},
     {t:'战情复盘', d:'处置全过程留痕，事后复盘改进预案', done:false}
   ],
   force:[
     {k:'初期处置', v:'经营者+网格员'},
     {k:'先期力量', v:'微型消防站 6人'},
     {k:'专业救援', v:'消防大队 2车12人'},
     {k:'到场时限', v:'城区 8 分钟'},
     {k:'联动单位', v:'公安/急救/燃气'},
     {k:'指挥层级', v:'指挥中心统一调度'}
   ],
   res:[
     {n:'灭火器', c:'≥4具'},
     {n:'消防水带', c:'2条'},
     {n:'应急照明', c:'3盏'},
     {n:'警示标识', c:'1套'},
     {n:'急救包', c:'1个'},
     {n:'对讲机', c:'2台'}
   ],
   drills:[
     {t:'沿街商铺消防演练', d:'2026-06-15', type:'green', note:'组织12家商铺开展灭火器实操与疏散演练，现场疏散用时3分20秒'},
     {t:'消防安全月专项演练', d:'2026-05-28', type:'green', note:'联合消防大队模拟后厨起火，验证预案调度机制，全程用时12分钟'},
     {t:'燃气泄漏应急演练', d:'2026-04-30', type:'orange', note:'演练中发现商铺应急照明配置不足，已列入整改'}
   ]},
  {id:2, type:'gas', typeLabel:'燃气泄漏', title:'餐饮场所燃气泄漏应急预案', level:'II', levelLabel:'Ⅱ级（较大）',
   version:'V2.1', updated:'2026-05-15', cover:'覆盖辖区 6 家燃气餐饮商铺',
   scenes:['燃气软管老化破裂','接口松动漏气','阀门未关泄漏'],
   desc:'针对餐饮场所燃气泄漏，建立探测、预警、关阀、疏散、检修的闭环处置流程，防范爆燃事故。',
   org:[
     {role:'总指挥', name:'街道应急管理办 刘主任', duty:'统筹指挥、调度燃气公司'},
     {role:'现场指挥', name:'消防站 王站长', duty:'警戒隔离、稀释气体'},
     {role:'网格员', name:'李明', duty:'到场核查、组织疏散'},
     {role:'经营者', name:'店主', duty:'立即关阀、开窗通风'},
     {role:'专业技术', name:'燃气公司 张工', duty:'查漏修复、复检达标'}
   ],
   flow:[
     {t:'浓度探测', d:'燃气探测器检测浓度超标（预警300ppm），平台研判并上报', done:true},
     {t:'预警推送', d:'推送经营者+网格员，提示立即关阀通风', done:true},
     {t:'关阀警戒', d:'经营者关闭总阀，撤离人员，划定警戒区', done:false},
     {t:'专业处置', d:'燃气公司到场查漏、修复、复检', done:false},
     {t:'复盘闭环', d:'隐患整改完成，记录归档', done:false}
   ],
   force:[
     {k:'预警推送', v:'经营者和网格员'},
     {k:'先期处置', v:'网格员到场警戒'},
     {k:'专业技术', v:'燃气公司 4人'},
     {k:'现场警戒', v:'公安划警戒区'},
     {k:'联动单位', v:'急救/消防待命'},
     {k:'到场时限', v:'燃气 30 分钟'}
   ],
   res:[
     {n:'燃气探测器', c:'1台'},
     {n:'警戒带', c:'2卷'},
     {n:'防爆对讲机', c:'2台'},
     {n:'灭火器', c:'≥2具'}
   ],
   drills:[
     {t:'燃气泄漏应急演练', d:'2026-04-30', type:'orange', note:'演练发现应急照明不足，已列整改'},
     {t:'后厨燃气专项检查', d:'2026-03-20', type:'green', note:'对6家餐饮商户燃气软管全部更换为金属波纹管'}
   ]},
  {id:3, type:'evac', typeLabel:'人员疏散', title:'人员密集场所疏散应急预案', level:'III', levelLabel:'Ⅲ级（一般）',
   version:'V1.8', updated:'2026-06-10', cover:'覆盖商超/餐饮等人流密集场所',
   scenes:['火灾时人员疏散','突发断电人群恐慌','通道堵塞紧急疏通'],
   desc:'针对人员密集商铺，制定疏散路线、广播引导、秩序维护、集合清点机制，确保快速安全撤离。',
   org:[
     {role:'疏散指挥', name:'物业 刘经理', duty:'广播引导、疏散调度'},
     {role:'秩序维护', name:'保安队长', duty:'通道疏导、防止拥挤'},
     {role:'清点负责人', name:'网格员', duty:'集合点清点人数'},
     {role:'救援引导', name:'消防 王站长', duty:'开辟救援通道'},
     {role:'后勤', name:'物业专员', duty:'断电断气、照明保障'}
   ],
   flow:[
     {t:'启动疏散', d:'确认险情，立即启动疏散广播', done:true},
     {t:'引导撤离', d:'专人引导沿疏散通道撤离', done:false},
     {t:'秩序维护', d:'通道口值守，防止拥挤踩踏', done:false},
     {t:'集合清点', d:'引导至安全集合点清点人数', done:false},
     {t:'排查反馈', d:'确认无被困人员，反馈指挥中心', done:false}
   ],
   force:[
     {k:'疏散引导', v:'物业+保安 8人'},
     {k:'秩序维护', v:'网格员+志愿者'},
     {k:'救援通道', v:'消防大队'},
     {k:'清点管理', v:'网格员'},
     {k:'联动单位', v:'急救/公安'}
   ],
   res:[
     {n:'应急广播', c:'1套'},
     {n:'疏散指示', c:'6块'},
     {n:'应急照明', c:'4盏'},
     {n:'扩音器', c:'2台'}
   ],
   drills:[
     {t:'人员疏散演练', d:'2026-06-05', type:'green', note:'模拟商超火灾疏散，全员撤离用时4分45秒，秩序良好'},
     {t:'夜间疏散演练', d:'2026-04-18', type:'orange', note:'夜间演练发现2盏应急照明损坏，已更换'}
   ]},
  {id:4, type:'firstaid', typeLabel:'医疗急救', title:'突发事件医疗救护应急预案', level:'III', levelLabel:'Ⅲ级（一般）',
   version:'V1.5', updated:'2026-05-30', cover:'覆盖全部沿街商铺（含急救点配置）',
   scenes:['火灾人员烧伤','烟雾中毒昏迷','摔倒磕碰受伤'],
   desc:'针对各类突发事故造成的人伤，明确先期急救、呼叫120、病例移交、送医跟进流程，最大限度挽救生命。',
   org:[
     {role:'急救指挥', name:'街道卫健 陈主任', duty:'医疗救援统筹调度'},
     {role:'现场急救', name:'经急救培训的网格员', duty:'先期止血包扎、心肺复苏'},
     {role:'医疗对接', name:'卫生院 值班医生', duty:'对接120、病例移交'},
     {role:'现场配合', name:'经营者', duty:'提供伤情信息、协助转运'}
   ],
   flow:[
     {t:'先期急救', d:'对伤员止血、包扎、心肺复苏', done:true},
     {t:'呼叫120', d:'同步拨打120，报告伤情位置', done:false},
     {t:'现场护理', d:'等待期间持续监护，防止伤情恶化', done:false},
     {t:'病例移交', d:'与120医护交接伤情与现场信息', done:false},
     {t:'送医跟进', d:'跟踪救治情况，记录归档', done:false}
   ],
   force:[
     {k:'先期急救', v:'培训网格员'},
     {k:'医疗救援', v:'120急救中心'},
     {k:'现场配合', v:'经营者+物业'},
     {k:'医疗对接', v:'街道卫生院'},
     {k:'联动单位', v:'消防/公安'}
   ],
   res:[
     {n:'急救包', c:'每店1个'},
     {n:'AED', c:'街区2台'},
     {n:'担架', c:'1副'},
     {n:'止血带', c:'2条'}
   ],
   drills:[
     {t:'急救技能培训', d:'2026-05-20', type:'green', note:'组织网格员开展心肺复苏与包扎培训，12人通过考核'}
   ]}
];


export const EM_LEVEL_MAP = {I:{label:'Ⅰ级',cls:'I'},II:{label:'Ⅱ级',cls:'II'},III:{label:'Ⅲ级',cls:'III'}};


const icoFireAlert = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c4.4 0 8-3.6 8-8 0-5-4-9-8-12-4 3-8 7-8 12 0 4.4 3.6 8 8 8z"/><path d="M12 22v-9"/><path d="M9 17h6"/></svg>`
const icoGasAlert = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C9 6 7 9 7 13a5 5 0 0010 0c0-4-2-7-5-11z"/><path d="M12 18a2 2 0 01-2-2c0-1 1-2 2-4 1 2 2 3 2 4a2 2 0 01-2 2z"/></svg>`
const icoEvac = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`
const icoFirstAid = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M12 11v5"/><path d="M9.5 13.5h5"/><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`

export const EM_TYPE_MAP = {
  fire:{label:'火灾事故', ico:'fire', icoEl:icoFireAlert},
  gas:{label:'燃气泄漏', ico:'gas', icoEl:icoGasAlert},
  evac:{label:'人员疏散', ico:'evac', icoEl:icoEvac},
  firstaid:{label:'医疗急救', ico:'firstaid', icoEl:icoFirstAid}
};

