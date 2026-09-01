// 海港区应消联勤平台 · shops 数据（从 index.html 原样抽取，不做任何改动）

export const SHOPS = [
  {id:1, name:"老张川菜馆", type:"餐饮", address:"中山路 128 号", owner:"张建国", phone:"138****6789",
    dutyRate:88, hazards:2, alarms:2, todayDuty:true, x:35, y:38,
    devices:{total:7, smoke:2, extinguisher:3, gas:1, other:1},
    deviceAlarms:[
      {time:"6/18 07:45", title:"烟感·火警", status:"未处置", red:true},
      {time:"6/15 08:32", title:"燃气探测器·预警", status:"未处置", red:true},
      {time:"6/05 06:02", title:"烟感·探测器拆下", status:"已处置", red:false}
    ],
    hazardList:[
      {title:"燃气软管老化", time:"6/15 14:30", status:"已整改", red:false},
      {title:"灭火器过期", time:"6/12 10:20", status:"已整改", red:false}
    ]},
  {id:2, name:"丽人服装店", type:"零售", address:"中山路 156 号", owner:"王芳", phone:"139****4321",
    dutyRate:92, hazards:0, alarms:1, todayDuty:true, x:55, y:25,
    devices:{total:3, smoke:1, extinguisher:2, gas:0, other:0},
    deviceAlarms:[
      {time:"6/16 14:20", title:"烟感·低电量预警", status:"已处置", red:false}
    ],
    hazardList:[]},
  {id:3, name:"天天便利超市", type:"零售", address:"解放路 88 号", owner:"李明", phone:"136****5678",
    dutyRate:75, hazards:1, alarms:0, todayDuty:false, x:70, y:52,
    devices:{total:5, smoke:2, extinguisher:2, gas:1, other:0},
    deviceAlarms:[],
    hazardList:[
      {title:"疏散通道堆放杂物", time:"6/14 09:15", status:"待整改", red:true}
    ]},
  {id:4, name:"美味烧烤店", type:"餐饮", address:"解放路 102 号", owner:"赵强", phone:"137****3333",
    dutyRate:80, hazards:1, alarms:1, todayDuty:true, x:25, y:62,
    devices:{total:6, smoke:2, extinguisher:3, gas:1, other:0},
    deviceAlarms:[
      {time:"6/17 22:10", title:"燃气·浓度超标预警", status:"已处置", red:false}
    ],
    hazardList:[
      {title:"油烟管道未清洗", time:"6/13 16:40", status:"已整改", red:false}
    ]},
  {id:5, name:"顺发理发店", type:"服务", address:"中山路 200 号", owner:"孙丽", phone:"135****4444",
    dutyRate:95, hazards:0, alarms:0, todayDuty:true, x:48, y:72,
    devices:{total:2, smoke:1, extinguisher:1, gas:0, other:0},
    deviceAlarms:[], hazardList:[]},
  {id:6, name:"兴旺五金店", type:"零售", address:"建设路 15 号", owner:"周伟", phone:"138****5555",
    dutyRate:60, hazards:3, alarms:2, todayDuty:false, x:80, y:18,
    devices:{total:4, smoke:1, extinguisher:2, gas:0, other:1},
    deviceAlarms:[
      {time:"6/18 03:15", title:"烟感·设备离线", status:"未处置", red:true},
      {time:"6/16 12:00", title:"烟感·故障告警", status:"已处置", red:false}
    ],
    hazardList:[
      {title:"电气线路老化", time:"6/17 11:30", status:"待整改", red:true},
      {title:"灭火器压力不足", time:"6/15 14:00", status:"待整改", red:true},
      {title:"安全出口堵塞", time:"6/10 10:15", status:"已整改", red:false}
    ]},
  {id:7, name:"湘味小馆", type:"餐饮", address:"中山路 210 号", owner:"何军", phone:"137****6677",
    dutyRate:72, hazards:2, alarms:2, todayDuty:false, x:58, y:60,
    devices:{total:6, smoke:2, extinguisher:3, gas:1, other:0},
    deviceAlarms:[
      {time:"6/18 19:20", title:"烟感·火警", status:"未处置", red:true},
      {time:"6/14 20:05", title:"燃气·浓度超标", status:"未处置", red:true}
    ],
    hazardList:[
      {title:"后厨电线私拉乱接", time:"6/16 15:30", status:"待整改", red:true},
      {title:"燃气软管老化", time:"6/13 10:00", status:"待整改", red:true}
    ]},
  {id:8, name:"好又多超市", type:"零售", address:"解放路 55 号", owner:"钱进", phone:"139****7788",
    dutyRate:68, hazards:2, alarms:1, todayDuty:false, x:18, y:30,
    devices:{total:8, smoke:3, extinguisher:3, gas:1, other:1},
    deviceAlarms:[
      {time:"6/18 11:40", title:"燃气·浓度超标", status:"未处置", red:true}
    ],
    hazardList:[
      {title:"灭火器过期", time:"6/15 09:20", status:"待整改", red:true},
      {title:"仓库通道堆物", time:"6/12 16:45", status:"待整改", red:true}
    ]},
  {id:9, name:"兰州拉面馆", type:"餐饮", address:"建设路 28 号", owner:"马刚", phone:"136****8899",
    dutyRate:55, hazards:2, alarms:2, todayDuty:false, x:88, y:40,
    devices:{total:5, smoke:2, extinguisher:2, gas:1, other:0},
    deviceAlarms:[
      {time:"6/18 08:50", title:"烟感·设备离线", status:"未处置", red:true},
      {time:"6/17 12:30", title:"燃气·浓度超标", status:"处置中", red:true}
    ],
    hazardList:[
      {title:"燃气软管老化", time:"6/16 14:10", status:"待整改", red:true},
      {title:"疏散通道占用", time:"6/15 11:00", status:"待整改", red:true}
    ]},
  {id:10, name:"名剪造型", type:"服务", address:"解放路 120 号", owner:"郑爽", phone:"135****9900",
    dutyRate:90, hazards:1, alarms:1, todayDuty:false, x:10, y:75,
    devices:{total:3, smoke:1, extinguisher:2, gas:0, other:0},
    deviceAlarms:[
      {time:"6/18 10:15", title:"烟感·火警", status:"未处置", red:true}
    ],
    hazardList:[
      {title:"电器线路老化", time:"6/17 17:40", status:"待整改", red:true}
    ]},
  {id:11, name:"宏发烟酒店", type:"零售", address:"建设路 46 号", owner:"吴磊", phone:"138****1122",
    dutyRate:45, hazards:2, alarms:1, todayDuty:false, x:92, y:70,
    devices:{total:4, smoke:2, extinguisher:2, gas:0, other:0},
    deviceAlarms:[
      {time:"6/18 22:30", title:"烟感·火警", status:"未处置", red:true}
    ],
    hazardList:[
      {title:"易燃品存放不当", time:"6/17 09:50", status:"待整改", red:true},
      {title:"灭火器失效", time:"6/14 13:25", status:"待整改", red:true}
    ]},
  {id:12, name:"川渝火锅城", type:"餐饮", address:"中山路 260 号", owner:"蒋涛", phone:"139****2233",
    dutyRate:62, hazards:2, alarms:2, todayDuty:false, x:65, y:82,
    devices:{total:9, smoke:3, extinguisher:4, gas:2, other:0},
    deviceAlarms:[
      {time:"6/18 20:45", title:"燃气·浓度超标", status:"未处置", red:true},
      {time:"6/18 21:10", title:"烟感·火警", status:"未处置", red:true}
    ],
    hazardList:[
      {title:"油烟管道未清洗", time:"6/16 10:30", status:"待整改", red:true},
      {title:"安全出口锁闭", time:"6/15 15:20", status:"待整改", red:true}
    ]}
];


export const STREETS = [
  {id:1, name:"中山路商业街", todayDuty:true,  x:50, y:45, shops:[1,2,5,7,11,12], desc:"餐饮零售聚集区，临街商铺 6 家", address:"中山路 100-260 号段", owner:"陈志远", phone:"138****6612"},
  {id:2, name:"解放路商业街", todayDuty:true,  x:30, y:48, shops:[3,4,8,10],     desc:"老城区生活配套商业街，临街商铺 4 家", address:"解放路 55-120 号段", owner:"刘建军", phone:"137****8855"},
  {id:3, name:"建设路商业街", todayDuty:false, x:86, y:28, shops:[6,9],          desc:"新建住宅区底商，临街商铺 2 家", address:"建设路 15-46 号段", owner:"赵国庆", phone:"139****2244"}
];



/* ===== 为每个商铺/商业街生成责任状数据（原 index.html 动态注入 1:1） ===== */
SHOPS.forEach((s: any) => {
  s.resp = {
    title: '消防安全责任人履职承诺书',
    date: '2025-06-03',
    photo: '/linking-subsystem/photos/resp-sample.jpg'
  }
});

STREETS.forEach((st: any) => {
  st.resp = {
    title: '消防安全责任人履职承诺书',
    date: '2025-06-03',
    photo: '/linking-subsystem/photos/resp-sample.jpg'
  }
});
