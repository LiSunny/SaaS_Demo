// 海港区应消联勤平台 · control-rooms 数据（从 index.html 原样抽取，不做任何改动）

export const CONTROL_ROOMS = [
  {id:1, name:"中山路商业街消防控制室(中心)", shop:"中山路商业街", addr:"中山路 100-260 号段", cam:"/linking-subsystem/photos/cam-01.jpg",
   status:'alarm', netStatus:'在线', uptime:'99.2%',
   dutyGuard:{name:"张建国", phone:"138****6789", state:'onduty'},
   shiftSchedule:[
     {time:"00:00-08:00", guard:"夜班 李强", state:'onduty'},
     {time:"08:00-16:00", guard:"白班 张建国", state:'onduty'},
     {time:"16:00-24:00", guard:"晚班 王勇", state:'leave'}
   ],
   devices:[
     {name:"火灾报警控制器", status:'ok', detail:'运行正常'},
     {name:"烟感探测器 ×2", status:'ok', detail:'全部在线'},
     {name:"燃气探测器 ×1", status:'err', detail:'浓度超标告警'},
     {name:"手动报警按钮 ×2", status:'ok', detail:'正常待机'},
     {name:"声光报警器 ×1", status:'ok', detail:'正常待机'},
     {name:"消防联动控制器", status:'ok', detail:'运行正常'}
   ],
   alarms:[
     {time:'2026-06-18 07:45:23', title:'燃气探测器·浓度超标告警', level:'red', desc:'甲烷浓度 380ppm，超过预警阈值'},
     {time:'2026-06-15 08:32:11', title:'燃气探测器·浓度超标预警', level:'orange', desc:'甲烷浓度 360ppm，超预警阈值'},
     {time:'2026-06-15 14:30:00', title:'值班人员短时离岗', level:'orange', desc:'值班人员离开消控室超过15分钟'}
   ]},
  {id:2, name:"中山路商业街消防控制室(东段)", shop:"中山路商业街", addr:"中山路 100-260 号段", cam:"/linking-subsystem/photos/cam-02.jpg",
   status:'online', netStatus:'在线', uptime:'99.8%',
   dutyGuard:{name:"王芳", phone:"139****4321", state:'onduty'},
   shiftSchedule:[
     {time:"08:00-20:00", guard:"白班 王芳", state:'onduty'},
     {time:"20:00-08:00", guard:"夜班 刘静", state:'onduty'}
   ],
   devices:[
     {name:"火灾报警控制器", status:'ok', detail:'运行正常'},
     {name:"烟感探测器 ×1", status:'ok', detail:'在线'},
     {name:"手动报警按钮 ×1", status:'ok', detail:'正常待机'}
   ],
   alarms:[
     {time:'2026-06-16 14:20:00', title:"烟感·低电量预警", level:'gray', desc:'电池电量低于15%，已更换'}
   ]},
  {id:3, name:"解放路商业街消防控制室", shop:"解放路商业街", addr:"解放路 55-120 号段", cam:"/linking-subsystem/photos/cam-03.jpg",
   status:'fault', netStatus:'在线', uptime:'97.5%',
   dutyGuard:{name:"李明", phone:"136****5678", state:'offduty'}, absentMinutes:32,
   shiftSchedule:[
     {time:"08:00-16:00", guard:"白班 李明", state:'offduty'},
     {time:"16:00-24:00", guard:"晚班 赵磊", state:'leave'}
   ],
   devices:[
     {name:"火灾报警控制器", status:'warn', detail:'通信模块故障'},
     {name:"烟感探测器 ×2", status:'ok', detail:'在线'},
     {name:"燃气探测器 ×1", status:'ok', detail:'正常'},
     {name:"手动报警按钮 ×2", status:'ok', detail:'正常待机'}
   ],
   alarms:[
     {time:'2026-06-18 09:00:00', title:'值班人员脱岗', level:'red', desc:'值班人员未在岗，超过30分钟未应答'},
     {time:'2026-06-17 15:20:00', title:'控制器通信故障', level:'orange', desc:'与平台通信中断10分钟后恢复'}
   ]},
  {id:4, name:"解放路商业街消防控制室(北段)", shop:"解放路商业街", addr:"解放路 55-120 号段", cam:"/linking-subsystem/photos/cam-04.jpg",
   status:'online', netStatus:'在线', uptime:'98.9%',
   dutyGuard:{name:"赵强", phone:"137****3333", state:'onduty'},
   shiftSchedule:[
     {time:"10:00-22:00", guard:"白班 赵强", state:'onduty'},
     {time:"22:00-10:00", guard:"夜班 孙杰", state:'onduty'}
   ],
   devices:[
     {name:"火灾报警控制器", status:'ok', detail:'运行正常'},
     {name:"烟感探测器 ×2", status:'ok', detail:'全部在线'},
     {name:"燃气探测器 ×1", status:'ok', detail:'正常'},
     {name:"手动报警按钮 ×2", status:'ok', detail:'正常待机'},
     {name:"声光报警器 ×1", status:'ok', detail:'正常待机'}
   ],
   alarms:[]},
  {id:5, name:"建设路商业街消防控制室", shop:"建设路商业街", addr:"建设路 15-46 号段", cam:"/linking-subsystem/photos/cam-05.jpg",
   status:'offline', netStatus:'离线', uptime:'95.0%',
   dutyGuard:{name:"周伟", phone:"138****5555", state:'onduty'},
   shiftSchedule:[
     {time:"08:00-20:00", guard:"白班 周伟", state:'onduty'},
     {time:"20:00-08:00", guard:"夜班 吴刚", state:'onduty'}
   ],
   devices:[
     {name:"火灾报警控制器", status:'off', detail:'设备离线'},
     {name:"烟感探测器 ×1", status:'off', detail:'离线'},
     {name:"手动报警按钮 ×1", status:'off', detail:'离线'}
   ],
   alarms:[
     {time:'2026-06-18 03:15:00', title:'消控室离线', level:'red', desc:'消控室设备全部离线，疑似断电'},
     {time:'2026-06-16 12:00:00', title:'烟感故障告警', level:'orange', desc:'传感器故障，已维修'}
   ]},
  {id:6, name:"解放路商业街消防控制室(南段)", shop:"解放路商业街", addr:"解放路 55-120 号段", cam:"/linking-subsystem/photos/cam-06.jpg",
   status:'alarm', netStatus:'在线', uptime:'98.3%',
   dutyGuard:{name:"何军", phone:"137****6677", state:'onduty'},
   shiftSchedule:[
     {time:"10:00-22:00", guard:"白班 何军", state:'onduty'},
     {time:"22:00-10:00", guard:"夜班 陈强", state:'onduty'}
   ],
   devices:[
     {name:"火灾报警控制器", status:'ok', detail:'运行正常'},
     {name:"烟感探测器 ×2", status:'err', detail:'1台火警'},
     {name:"燃气探测器 ×1", status:'err', detail:'浓度超标'},
     {name:"手动报警按钮 ×2", status:'ok', detail:'正常待机'},
     {name:"声光报警器 ×1", status:'ok', detail:'正常待机'}
   ],
   alarms:[
     {time:'2026-06-18 19:20:45', title:'烟感·火警告警', level:'red', desc:'烟雾浓度超标，触发火警'},
     {time:'2026-06-18 19:21:00', title:'燃气·浓度超标', level:'red', desc:'甲烷浓度 520ppm，严重超标'}
   ]},
  {id:7, name:"中山路商业街消防控制室(西段)", shop:"中山路商业街", addr:"中山路 100-260 号段", cam:"/linking-subsystem/photos/cam-07.jpg",
   status:'alarm', netStatus:'在线', uptime:'97.8%',
   dutyGuard:{name:"蒋涛", phone:"139****2233", state:'onduty'},
   shiftSchedule:[
     {time:"10:00-22:00", guard:"白班 蒋涛", state:'onduty'},
     {time:"22:00-10:00", guard:"夜班 黄明", state:'onduty'}
   ],
   devices:[
     {name:"火灾报警控制器", status:'ok', detail:'运行正常'},
     {name:"烟感探测器 ×3", status:'err', detail:'1台火警'},
     {name:"燃气探测器 ×2", status:'err', detail:'1台浓度超标'},
     {name:"手动报警按钮 ×3", status:'ok', detail:'正常待机'},
     {name:"声光报警器 ×2", status:'ok', detail:'正常待机'},
     {name:"消防联动控制器", status:'ok', detail:'运行正常'},
     {name:"防火卷帘控制器 ×2", status:'ok', detail:'正常待机'}
   ],
   alarms:[
     {time:'2026-06-18 20:45:09', title:'燃气·浓度超标告警', level:'red', desc:'甲烷浓度 610ppm，严重超标'},
     {time:'2026-06-18 21:10:52', title:'烟感·火警告警', level:'red', desc:'大厅区域烟雾浓度超标'}
   ]}
];


export const CR_STATUS_MAP = {
  online:  {label:'运行正常', cls:'online'},
  offline: {label:'离线', cls:'offline'},
  alarm:    {label:'告警中', cls:'alarm'},
  fault:    {label:'设备故障', cls:'fault'}
};


export const DUTY_STATE_MAP = {
  onduty:  {label:'在岗', cls:'onduty'},
  offduty: {label:'离岗', cls:'offduty'},
  leave:   {label:'请假', cls:'leave'}
};


export const CR_LEAVE_EVENTS = [
  {id:1, roomId:3, room:'解放路商业街消防控制室', guard:'李明', start:'13:53', end:'', minutes:32, status:'pending', shot:'/linking-subsystem/photos/离岗告警01.png', shotBig:'/linking-subsystem/photos/离岗告警01_big.png'},
  {id:2, roomId:5, room:'建设路商业街消防控制室', guard:'周伟', start:'14:07', end:'14:19', minutes:12, status:'done', shot:'/linking-subsystem/photos/离岗告警02.png', shotBig:'/linking-subsystem/photos/离岗告警02_big.png'},
  {id:3, roomId:1, room:'中山路商业街消防控制室(中心)', guard:'张建国', start:'11:30', end:'11:36', minutes:6, status:'done', shot:'/linking-subsystem/photos/离岗告警03.png', shotBig:'/linking-subsystem/photos/离岗告警03_big.png'},
  {id:4, roomId:6, room:'解放路商业街消防控制室(南段)', guard:'何军', start:'09:20', end:'09:24', minutes:4, status:'done', shot:'/linking-subsystem/photos/离岗告警04.png', shotBig:'/linking-subsystem/photos/离岗告警04_big.png'}
];


export const CR_CAM_TIMES = ['14:25:03','14:25:11','14:25:19','14:25:27','14:25:35','14:25:43','14:25:51'];

