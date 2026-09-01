// 海港区应消联勤平台 · shop-events 数据（从 index.html 原样抽取，不做任何改动）

export const SHOP_EVENTS = {
  1: [
    {id:'e1-5', type:'hazard', level:'urgent', status:'processing', title:'排查隐患：安全出口指示灯不亮', shop:'老张川菜馆',
     device:'每日履职自查上报', addr:'中山路 128 号 后门安全出口', time:'2026-08-26 09:18:00',
     desc:'每日履职自查发现后门安全出口指示灯不亮，夜间疏散识别能力不足，需立即检修或更换。',
     photo:false, timeline:[
       {dot:'report', time:'09:18:00', title:'自查上报隐患', desc:'发现安全出口指示灯不亮，已上报平台'},
       {dot:'push', time:'09:18:12', title:'整改通知推送', desc:'通知商铺经营者当日内完成检修', channels:['sms','app']},
       {dot:'handle', time:'--', title:'处置中', desc:'商户正在联系维保人员检修'}
     ]},
    {id:'e1-6', type:'hazard', level:'warning', status:'processing', title:'排查隐患：配电箱前堆放杂物', shop:'老张川菜馆',
     device:'每日履职自查上报', addr:'中山路 128 号 一层配电箱', time:'2026-08-26 08:42:00',
     desc:'每日履职自查发现配电箱前方堆放清洁用品和纸箱，影响紧急断电操作，需清理并保持通道畅通。',
     photo:false, timeline:[
       {dot:'report', time:'08:42:00', title:'自查上报隐患', desc:'发现配电箱前堆物，影响应急操作'},
       {dot:'push', time:'08:42:20', title:'整改通知推送', desc:'通知商铺经营者立即清理', channels:['sms','app']},
       {dot:'handle', time:'--', title:'处置中', desc:'商户正在清理配电箱前方堆放物'}
       ]},
       {id:'e1-8', type:'hazard', level:'urgent', status:'processing', title:'排查隐患：油烟管道油垢堆积', shop:'老张川菜馆',
       device:'每日履职自查上报', addr:'中山路 128 号 后厨油烟管道', time:'2026-08-27 09:05:00',
       desc:'每日履职自查发现后厨油烟管道油垢堆积，存在火灾隐患，需限期清洗。',
       photo:false, timeline:[
        {dot:'report', time:'09:05:00', title:'自查上报隐患', desc:'每日履职自查发现油烟管道油垢堆积，已上报平台'},
        {dot:'push', time:'09:05:15', title:'整改通知推送', desc:'通知商铺经营者7日内完成油烟管道清洗', channels:['sms','app']},
        {dot:'handle', time:'--', title:'处置中', desc:'商户正在联系专业清洗公司排期'}
       ]},
    {id:'e1-1', type:'smoke', level:'urgent', status:'pending', title:'烟感·火警告警', shop:'老张川菜馆',
     device:'烟感探测器 #SF-001', addr:'中山路 128 号 厨房天花板', time:'2026-06-18 07:45:23',
     desc:'烟感探测器 烟雾浓度 0.85dB/m，触发火警告警。',
     photo:true, timeline:[
       {dot:'report', time:'07:45:23', title:'设备自动上报', desc:'烟感探测器 SF-001 检测到烟雾浓度达到 0.85dB/m（阈值0.50），设备自动上报火警告警'},
       {dot:'push', time:'07:45:31', title:'多渠道告警推送', desc:'平台同步向商铺经营者、网格员、微型消防站推送告警', channels:['sms','voice','app']},
       {dot:'dispatch', time:'07:46:15', title:'自动派单', desc:'系统自动派单至网格员李明，要求8分钟内到场核实'},
       {dot:'handle', time:'08:02:40', title:'到场核实', desc:'网格员李明到场核实，确认为后厨油烟引燃，已现场扑灭，无人员伤亡'},
       {dot:'close', time:'08:15:00', title:'事件闭环', desc:'隐患已消除，设备恢复正常，事件标记为已闭环'}
     ]},
    {id:'e1-2', type:'gas', level:'warning', status:'done', title:'燃气探测器·浓度超标预警', shop:'老张川菜馆',
     device:'燃气探测器 #GS-002', addr:'中山路 128 号 后厨燃气管道接口', time:'2026-06-15 08:32:11',
     desc:'燃气探测器 甲烷浓度 380ppm，触发浓度超标预警。',
     photo:false, timeline:[
       {dot:'report', time:'08:32:11', title:'设备自动上报', desc:'燃气探测器 GS-002 检测到甲烷浓度 380ppm，超过预警阈值300ppm'},
       {dot:'push', time:'08:32:18', title:'告警推送', desc:'向商铺经营者推送预警信息', channels:['sms','app']},
       {dot:'dispatch', time:'08:32:50', title:'自动派单', desc:'派单至商户立即排查'},
       {dot:'handle', time:'08:45:00', title:'商户自查处置', desc:'商户张建国检查发现燃气软管接口松动，已紧固处理', operator:'商户张建国'},
       {dot:'close', time:'09:10:00', title:'事件闭环', desc:'网格员李明复检通过，浓度恢复正常，事件闭环', operator:'网格员李明'}
     ]},
    {id:'e1-3', type:'gas', level:'warning', status:'done', title:'燃气探测器·低电量预警', shop:'老张川菜馆',
     device:'燃气探测器 #GS-002', addr:'中山路 128 号 后厨', time:'2026-06-05 06:02:45',
     desc:'燃气探测器 电池电量 18%，触发低电量预警。',
     photo:false, timeline:[
       {dot:'report', time:'06:02:45', title:'设备自动上报', desc:'设备电量降至18%，触发低电量预警'},
       {dot:'push', time:'06:02:50', title:'告警推送', desc:'通知物业技术支撑方', channels:['app']},
       {dot:'dispatch', time:'06:03:20', title:'自动派单', desc:'派单至物业技术支撑方'},
       {dot:'handle', time:'06/05 14:00', title:'更换电池', desc:'技术员王涛到场更换电池', operator:'技术员王涛'},
       {dot:'close', time:'06/05 14:30', title:'事件闭环', desc:'网格员李明复核确认，设备恢复正常运行', operator:'网格员李明'}
     ]},
    {id:'e1-4', type:'hazard', level:'urgent', status:'done', title:'排查隐患：燃气软管老化', shop:'老张川菜馆',
     device:'每日履职自查上报', addr:'中山路 128 号 后厨燃气软管', time:'2026-06-15 14:30:00',
     desc:'每日履职自查发现燃气软管表面龟裂老化，存在燃气泄漏风险，已当场要求商户更换。',
     photo:true, photos:{before:'/linking-subsystem/photos/整改前.png', after:'/linking-subsystem/photos/整改后.png'}, timeline:[
       {dot:'report', time:'14:30:00', title:'自查上报隐患', desc:'每日履职自查发现燃气软管老化龟裂，拍照上报'},
       {dot:'push', time:'14:30:15', title:'整改通知推送', desc:'向商铺经营者下发整改通知单，限3日内更换', channels:['sms','app']},
       {dot:'dispatch', time:'14:31:00', title:'派单整改', desc:'派单至商铺经营者整改，抄送网格员跟踪'},
       {dot:'handle', time:'06/16 10:00', title:'整改完成', desc:'商户已更换燃气金属波纹管，上传整改后照片'},
       {dot:'close', time:'06/16 11:00', title:'复核闭环', desc:'网格员复核通过，隐患闭环'}
     ]}
  ],
  2: [
    {id:'e2-1', type:'smoke', level:'info', status:'done', title:'烟感·低电量预警', shop:'丽人服装店',
     device:'烟感探测器 #SF-008', addr:'中山路 156 号 店铺天花板', time:'2026-06-16 14:20:00',
     desc:'烟感探测器 电池电量 12%，触发低电量预警。',
     photo:false, timeline:[
       {dot:'report', time:'14:20:00', title:'设备自动上报', desc:'电量降至12%'},
       {dot:'push', time:'14:20:05', title:'告警推送', desc:'通知物业', channels:['app']},
       {dot:'dispatch', time:'14:20:45', title:'自动派单', desc:'派单至物业'},
       {dot:'handle', time:'06/17 09:00', title:'更换电池', desc:'技术员王涛更换电池', operator:'技术员王涛'},
       {dot:'close', time:'06/17 09:20', title:'事件闭环', desc:'网格员李明复核确认，设备恢复正常', operator:'网格员李明'}
     ]}
  ],
  3: [
    {id:'e3-1', type:'hazard', level:'urgent', status:'processing', title:'排查隐患：疏散通道堆放杂物', shop:'天天便利超市',
     device:'每日履职自查上报', addr:'解放路 88 号 后门疏散通道', time:'2026-06-14 09:15:00',
     desc:'每日履职自查发现后门疏散通道堆放大量纸箱货物，严重影响人员疏散，存在安全隐患。',
     photo:true, photos:{before:'/linking-subsystem/photos/整改前-e3-1.png', after:'/linking-subsystem/photos/整改后-e3-1.png'}, timeline:[
       {dot:'report', time:'09:15:00', title:'自查上报隐患', desc:'发现疏散通道堆放杂物，拍照上报'},
       {dot:'push', time:'09:15:20', title:'整改通知推送', desc:'向商户下发限期整改通知', channels:['sms','app']},
       {dot:'dispatch', time:'09:16:00', title:'派单整改', desc:'派单至商户，限24小时内清理'},
       {dot:'handle', time:'--', title:'待整改', desc:'商户尚未完成清理，整改进行中'}
     ]}
  ],
  4: [
    {id:'e4-1', type:'gas', level:'warning', status:'done', title:'燃气·浓度超标预警', shop:'美味烧烤店',
     device:'燃气探测器 #GS-005', addr:'解放路 102 号 后厨燃气灶接口', time:'2026-06-17 22:10:33',
     desc:'燃气探测器 甲烷浓度 450ppm，触发浓度超标预警。',
     photo:false, timeline:[
       {dot:'report', time:'22:10:33', title:'设备自动上报', desc:'甲烷浓度 450ppm'},
       {dot:'push', time:'22:10:40', title:'告警推送', desc:'向商户推送预警', channels:['sms','voice','app']},
       {dot:'dispatch', time:'22:11:10', title:'自动派单', desc:'派单至商户排查'},
       {dot:'handle', time:'22:25:00', title:'商户处置', desc:'商户赵强检查发现燃气灶接口松动，已紧固', operator:'商户赵强'},
       {dot:'close', time:'22:40:00', title:'事件闭环', desc:'网格员张伟复检通过，事件闭环', operator:'网格员张伟'}
     ]},
    {id:'e4-2', type:'hazard', level:'info', status:'done', title:'排查隐患：油烟管道未清洗', shop:'美味烧烤店',
     device:'每日履职自查上报', addr:'解放路 102 号 后厨油烟管道', time:'2026-06-13 16:40:00',
     desc:'油烟管道积油较厚。',
     photo:true, photos:{before:'/linking-subsystem/photos/整改前-e4-2.png', after:'/linking-subsystem/photos/整改后-e4-2.png'}, timeline:[
       {dot:'report', time:'16:40:00', title:'自查上报', desc:'发现油烟管道积油'},
       {dot:'push', time:'16:40:10', title:'整改通知', desc:'通知商户限期清洗', channels:['app']},
       {dot:'handle', time:'06/15 10:00', title:'整改完成', desc:'商户完成清洗并上传照片'},
       {dot:'close', time:'06/15 14:00', title:'复核闭环', desc:'复核通过'}
     ]}
  ],
  5: [],
  6: [
    {id:'e6-1', type:'smoke', level:'urgent', status:'pending', title:'烟感·设备离线告警', shop:'兴旺五金店',
     device:'烟感探测器 #SF-012', addr:'建设路 15 号 库房天花板', time:'2026-06-18 03:15:00',
     desc:'烟感探测器 在线状态 连续离线超过6小时，触发设备离线告警。',
     photo:false, timeline:[
       {dot:'report', time:'03:15:00', title:'设备离线告警', desc:'设备 SF-012 离线超过6小时'},
       {dot:'push', time:'03:15:08', title:'告警推送', desc:'通知物业技术支撑方', channels:['sms','app']},
       {dot:'dispatch', time:'03:16:00', title:'自动派单', desc:'系统自动派单至技术支撑方上门检修'},
       {dot:'handle', time:'06/18 09:40', title:'检修处置中', desc:'技术人员已到场，正在更换故障模组'}
     ]},
    {id:'e6-2', type:'smoke', level:'warning', status:'done', title:'烟感·故障告警', shop:'兴旺五金店',
     device:'烟感探测器 #SF-012', addr:'建设路 15 号 库房', time:'2026-06-16 12:00:00',
     desc:'烟感探测器 故障码 E03，触发故障告警。',
     photo:false, timeline:[
       {dot:'report', time:'12:00:00', title:'设备故障上报', desc:'故障码 E03 传感器异常'},
       {dot:'push', time:'12:00:10', title:'告警推送', desc:'通知物业', channels:['app']},
       {dot:'dispatch', time:'12:00:40', title:'自动派单', desc:'派单至物业'},
       {dot:'handle', time:'06/16 15:00', title:'检修完成', desc:'技术员王涛更换传感器', operator:'技术员王涛'},
       {dot:'close', time:'06/16 15:30', title:'事件闭环', desc:'网格员周强复核确认，设备恢复正常', operator:'网格员周强'}
     ]},
    {id:'e6-3', type:'hazard', level:'urgent', status:'processing', title:'排查隐患：电气线路老化', shop:'兴旺五金店',
     device:'每日履职自查上报', addr:'建设路 15 号 库房电气线路', time:'2026-06-17 11:30:00',
     desc:'每日履职自查发现库房电气线路老化严重，绝缘层破损，存在短路火灾风险。',
     photo:true, photos:{before:'/linking-subsystem/photos/整改前-e6-3.png', after:'/linking-subsystem/photos/整改后-e6-3.png'}, timeline:[
       {dot:'report', time:'11:30:00', title:'自查上报隐患', desc:'发现电气线路老化破损，拍照上报'},
       {dot:'push', time:'11:30:15', title:'整改通知推送', desc:'下发限期整改通知，要求2日内更换线路', channels:['sms','app']},
       {dot:'dispatch', time:'11:31:00', title:'派单整改', desc:'派单至商户整改，抄送消防执法部门'},
       {dot:'handle', time:'--', title:'待整改', desc:'商户整改中'}
     ]},
    {id:'e6-4', type:'hazard', level:'urgent', status:'processing', title:'排查隐患：灭火器压力不足', shop:'兴旺五金店',
     device:'每日履职自查上报', addr:'建设路 15 号 店铺灭火器', time:'2026-06-15 14:00:00',
     desc:'检查发现2具灭火器压力表指针在红区，无法正常使用。',
     photo:true, photos:{before:'/linking-subsystem/photos/整改前-e6-4.png', after:'/linking-subsystem/photos/整改后-e6-4.png'}, timeline:[
       {dot:'report', time:'14:00:00', title:'自查上报', desc:'灭火器压力不足，拍照上报'},
       {dot:'push', time:'14:00:10', title:'整改通知', desc:'要求立即更换', channels:['sms','app']},
       {dot:'dispatch', time:'14:01:00', title:'派单', desc:'派单至商户更换'},
       {dot:'handle', time:'--', title:'待整改', desc:'商户尚未更换'}
       ]}
       ],
       7: [
       {id:'e7-1', type:'smoke', level:'urgent', status:'pending', title:'烟感·火警告警', shop:'湘味小馆',
       device:'烟感探测器 #SF-021', addr:'中山路 210 号 后厨天花板', time:'2026-06-18 19:20:45',
       desc:'烟感探测器 烟雾浓度 0.92dB/m，触发火警告警。',
       photo:false, timeline:[
        {dot:'report', time:'19:20:45', title:'设备自动上报', desc:'烟雾浓度 0.92dB/m，超过阈值，触发火警告警'},
        {dot:'push', time:'19:20:53', title:'多渠道告警推送', desc:'同步推送经营者、网格员、微型消防站', channels:['sms','voice','app']},
        {dot:'dispatch', time:'19:21:30', title:'自动派单', desc:'系统自动派单至网格员张伟，要求8分钟内到场'},
        {dot:'handle', time:'--', title:'待处置', desc:'网格员赶往现场途中'}
       ]},
       {id:'e7-2', type:'gas', level:'urgent', status:'pending', title:'燃气·浓度超标预警', shop:'湘味小馆',
       device:'燃气探测器 #GS-018', addr:'中山路 210 号 后厨燃气接口', time:'2026-06-14 20:05:12',
       desc:'燃气探测器 甲烷浓度 520ppm，触发浓度超标预警。',
       photo:false, timeline:[
        {dot:'report', time:'20:05:12', title:'设备自动上报', desc:'甲烷浓度 520ppm，超告警阈值'},
        {dot:'push', time:'20:05:20', title:'告警推送', desc:'推送商户与网格员', channels:['sms','app']},
        {dot:'dispatch', time:'20:06:00', title:'自动派单', desc:'系统自动派单至商户立即排查'},
        {dot:'handle', time:'--', title:'待处置', desc:'商户排查中'}
       ]},
       {id:'e7-3', type:'hazard', level:'urgent', status:'processing', title:'排查隐患：后厨电线私拉乱接', shop:'湘味小馆',
       device:'每日履职自查上报', addr:'中山路 210 号 后厨', time:'2026-08-22 15:30:00',
       desc:'每日履职自查发现后厨电器线路私拉乱接，部分线路裸露，存在触电和短路火灾风险。',
       photo:true, photos:{before:'/linking-subsystem/photos/整改前-e7-3.png', after:'/linking-subsystem/photos/整改后-e7-3.png'}, timeline:[
        {dot:'report', time:'15:30:00', title:'自查上报', desc:'发现电线私拉乱接，拍照上报'},
        {dot:'push', time:'15:30:12', title:'整改通知', desc:'下发整改通知，限3日内整改', channels:['sms','app']},
        {dot:'dispatch', time:'15:31:00', title:'派单', desc:'派单至商户整改'},
        {dot:'handle', time:'--', title:'待整改', desc:'商户整改中'}
       ]},
       {id:'e7-4', type:'hazard', level:'urgent', status:'processing', title:'排查隐患：燃气软管老化', shop:'湘味小馆',
       device:'每日履职自查上报', addr:'中山路 210 号 后厨', time:'2026-06-13 10:00:00',
       desc:'检查发现燃气软管老化开裂，存在燃气泄漏风险，要求尽快更换。',
       photo:true, photos:{before:'/linking-subsystem/photos/整改前-e7-4.png', after:'/linking-subsystem/photos/整改后-e7-4.png'}, timeline:[
        {dot:'report', time:'10:00:00', title:'自查上报', desc:'燃气软管老化，拍照上报'},
        {dot:'push', time:'10:00:10', title:'整改通知', desc:'限2日内更换', channels:['sms','app']},
        {dot:'handle', time:'--', title:'待整改', desc:'商户整改中'}
       ]}
       ],
       8: [
       {id:'e8-1', type:'gas', level:'urgent', status:'pending', title:'燃气·浓度超标预警', shop:'好又多超市',
        device:'燃气探测器 #GS-025', addr:'解放路 55 号 仓库燃气管道', time:'2026-06-18 11:40:33',
        desc:'燃气探测器 甲烷浓度 480ppm，触发浓度超标预警。',
        photo:false, timeline:[
          {dot:'report', time:'11:40:33', title:'设备自动上报', desc:'甲烷浓度 480ppm'},
          {dot:'push', time:'11:40:41', title:'告警推送', desc:'推送商户与物业', channels:['sms','voice','app']},
          {dot:'dispatch', time:'11:41:20', title:'自动派单', desc:'系统自动派单至物业技术支撑方'},
          {dot:'handle', time:'12:20:00', title:'现场处置中', desc:'技术人员已到场，正在排查泄漏点'}
        ]},
       {id:'e8-2', type:'hazard', level:'urgent', status:'processing', title:'排查隐患：灭火器过期', shop:'好又多超市',
       device:'每日履职自查上报', addr:'解放路 55 号 收银台旁', time:'2026-08-23 09:20:00',
       desc:'巡查发现2具灭火器已超过有效期限，需立即更换。',
       photo:true, photos:{before:'/linking-subsystem/photos/整改前-e8-2.png', after:'/linking-subsystem/photos/整改后-e8-2.png'}, timeline:[
        {dot:'report', time:'09:20:00', title:'自查上报', desc:'灭火器过期，拍照上报'},
        {dot:'push', time:'09:20:10', title:'整改通知', desc:'限当日内更换', channels:['sms','app']},
        {dot:'dispatch', time:'09:21:00', title:'派单', desc:'派单至商户'},
        {dot:'handle', time:'--', title:'待整改', desc:'商户整改中'}
       ]},
       {id:'e8-3', type:'hazard', level:'urgent', status:'processing', title:'排查隐患：仓库通道堆物', shop:'好又多超市',
       device:'每日履职自查上报', addr:'解放路 55 号 仓库', time:'2026-06-12 16:45:00',
       desc:'仓库疏散通道堆放大量货物，影响紧急疏散。',
       photo:true, photos:{before:'/linking-subsystem/photos/整改前-e8-3.png', after:'/linking-subsystem/photos/整改后-e8-3.png'}, timeline:[
        {dot:'report', time:'16:45:00', title:'自查上报', desc:'通道堆物，拍照上报'},
        {dot:'push', time:'16:45:10', title:'整改通知', desc:'限24小时清理', channels:['sms','app']},
        {dot:'handle', time:'--', title:'待整改', desc:'商户清理中'}
       ]}
       ],
       9: [
       {id:'e9-1', type:'smoke', level:'urgent', status:'pending', title:'烟感·设备离线告警', shop:'兰州拉面馆',
        device:'烟感探测器 #SF-030', addr:'建设路 28 号 前厅天花板', time:'2026-06-18 08:50:00',
        desc:'烟感探测器 在线状态 离线超过8小时，触发设备离线告警。',
        photo:false, timeline:[
          {dot:'report', time:'08:50:00', title:'设备离线告警', desc:'设备离线超8小时'},
          {dot:'push', time:'08:50:08', title:'告警推送', desc:'通知物业技术支撑方', channels:['sms','app']},
          {dot:'dispatch', time:'08:51:00', title:'自动派单', desc:'系统自动派单至技术支撑方'},
          {dot:'handle', time:'10:20:00', title:'检修处置中', desc:'技术人员已到场检查，正在排查供电线路'}
        ]},
       {id:'e9-2', type:'gas', level:'warning', status:'pending', title:'燃气·浓度超标预警', shop:'兰州拉面馆',
       device:'燃气探测器 #GS-022', addr:'建设路 28 号 后厨', time:'2026-06-17 12:30:15',
       desc:'燃气探测器 甲烷浓度 360ppm，触发浓度超标预警。',
       photo:false, timeline:[
        {dot:'report', time:'12:30:15', title:'设备自动上报', desc:'甲烷浓度 360ppm'},
        {dot:'push', time:'12:30:22', title:'告警推送', desc:'推送商户', channels:['sms','app']},
        {dot:'dispatch', time:'12:31:00', title:'自动派单', desc:'系统自动派单至商户排查'},
        {dot:'handle', time:'--', title:'处置中', desc:'商户排查燃气接口'}
       ]},
       {id:'e9-3', type:'hazard', level:'urgent', status:'processing', title:'排查隐患：燃气软管老化', shop:'兰州拉面馆',
       device:'每日履职自查上报', addr:'建设路 28 号 后厨', time:'2026-08-21 14:10:00',
       desc:'燃气软管出现老化龟裂，存在泄漏风险。',
       photo:true, photos:{before:'/linking-subsystem/photos/整改前-e9-3.png', after:'/linking-subsystem/photos/整改后-e9-3.png'}, timeline:[
        {dot:'report', time:'14:10:00', title:'自查上报', desc:'软管老化，拍照上报'},
        {dot:'push', time:'14:10:10', title:'整改通知', desc:'限2日内更换', channels:['sms','app']},
        {dot:'handle', time:'--', title:'待整改', desc:'商户整改中'}
       ]},
       {id:'e9-4', type:'hazard', level:'warning', status:'processing', title:'排查隐患：疏散通道占用', shop:'兰州拉面馆',
       device:'每日履职自查上报', addr:'建设路 28 号 后门', time:'2026-06-15 11:00:00',
       desc:'后门疏散通道被杂物占用，需清理恢复畅通。',
       photo:true, photos:{before:'/linking-subsystem/photos/整改前-e9-4.png', after:'/linking-subsystem/photos/整改后-e9-4.png'}, timeline:[
        {dot:'report', time:'11:00:00', title:'自查上报', desc:'通道占用，拍照上报'},
        {dot:'push', time:'11:00:10', title:'整改通知', desc:'限24小时清理', channels:['app']},
        {dot:'handle', time:'--', title:'待整改', desc:'商户清理中'}
       ]}
       ],
       10: [
       {id:'e10-1', type:'smoke', level:'urgent', status:'pending', title:'烟感·火警告警', shop:'名剪造型',
       device:'烟感探测器 #SF-035', addr:'解放路 120 号 店铺天花板', time:'2026-06-18 10:15:27',
       desc:'烟感探测器 烟雾浓度 0.78dB/m，触发火警告警。',
       photo:false, timeline:[
        {dot:'report', time:'10:15:27', title:'设备自动上报', desc:'烟雾浓度 0.78dB/m，超过阈值，触发火警'},
        {dot:'push', time:'10:15:35', title:'多渠道告警推送', desc:'同步推送经营者、网格员', channels:['sms','voice','app']},
        {dot:'dispatch', time:'10:16:10', title:'自动派单', desc:'系统自动派单至网格员'},
        {dot:'handle', time:'--', title:'待处置', desc:'网格员赶往现场'}
       ]},
       {id:'e10-2', type:'hazard', level:'urgent', status:'processing', title:'排查隐患：电器线路老化', shop:'名剪造型',
       device:'每日履职自查上报', addr:'解放路 120 号 店内', time:'2026-08-22 17:40:00',
       desc:'店内电器线路老化，绝缘层破损，存在短路火灾风险。',
       photo:true, photos:{before:'/linking-subsystem/photos/整改前-e10-2.png', after:'/linking-subsystem/photos/整改后-e10-2.png'}, timeline:[
        {dot:'report', time:'17:40:00', title:'自查上报', desc:'线路老化，拍照上报'},
        {dot:'push', time:'17:40:10', title:'整改通知', desc:'限3日内更换', channels:['sms','app']},
        {dot:'handle', time:'--', title:'待整改', desc:'商户整改中'}
       ]}
       ],
       11: [
       {id:'e11-1', type:'smoke', level:'urgent', status:'pending', title:'烟感·火警告警', shop:'宏发烟酒店',
       device:'烟感探测器 #SF-040', addr:'建设路 46 号 店铺天花板', time:'2026-06-18 22:30:18',
       desc:'烟感探测器 烟雾浓度 0.86dB/m，触发火警告警。',
       photo:false, timeline:[
        {dot:'report', time:'22:30:18', title:'设备自动上报', desc:'烟雾浓度 0.86dB/m，超过阈值，触发火警'},
        {dot:'push', time:'22:30:26', title:'多渠道告警推送', desc:'同步推送经营者、微型消防站', channels:['sms','voice','app']},
        {dot:'dispatch', time:'22:31:00', title:'自动派单', desc:'系统自动派单至微型消防站'},
        {dot:'handle', time:'--', title:'待处置', desc:'微站力量赶往现场'}
       ]},
       {id:'e11-2', type:'hazard', level:'urgent', status:'processing', title:'排查隐患：易燃品存放不当', shop:'宏发烟酒店',
       device:'每日履职自查上报', addr:'建设路 46 号 库房', time:'2026-08-23 09:50:00',
       desc:'库房内白酒等易燃品存放于电源插座附近，需规范存放。',
       photo:true, photos:{before:'/linking-subsystem/photos/整改前-e11-2.png', after:'/linking-subsystem/photos/整改后-e11-2.png'}, timeline:[
        {dot:'report', time:'09:50:00', title:'自查上报', desc:'易燃品靠近电源，拍照上报'},
        {dot:'push', time:'09:50:10', title:'整改通知', desc:'限当日内规范存放', channels:['sms','app']},
        {dot:'handle', time:'--', title:'待整改', desc:'商户整改中'}
       ]},
       {id:'e11-3', type:'hazard', level:'urgent', status:'processing', title:'排查隐患：灭火器失效', shop:'宏发烟酒店',
       device:'每日履职自查上报', addr:'建设路 46 号 店内', time:'2026-06-14 13:25:00',
       desc:'店内灭火器压力表指针在红区，无法正常使用。',
       photo:true, photos:{before:'/linking-subsystem/photos/整改前-e11-3.png', after:'/linking-subsystem/photos/整改后-e11-3.png'}, timeline:[
        {dot:'report', time:'13:25:00', title:'自查上报', desc:'灭火器失效，拍照上报'},
        {dot:'push', time:'13:25:10', title:'整改通知', desc:'要求立即更换', channels:['sms','app']},
        {dot:'handle', time:'--', title:'待整改', desc:'商户整改中'}
       ]}
       ],
       12: [
       {id:'e12-1', type:'gas', level:'urgent', status:'pending', title:'燃气·浓度超标预警', shop:'川渝火锅城',
        device:'燃气探测器 #GS-031', addr:'中山路 260 号 后厨燃气接口', time:'2026-06-18 20:45:09',
        desc:'燃气探测器 甲烷浓度 610ppm，触发浓度超标预警。',
        photo:false, timeline:[
          {dot:'report', time:'20:45:09', title:'设备自动上报', desc:'甲烷浓度 610ppm，严重超标'},
          {dot:'push', time:'20:45:17', title:'多渠道告警推送', desc:'同步推送经营者、网格员、微型消防站', channels:['sms','voice','app']},
          {dot:'dispatch', time:'20:46:00', title:'自动派单', desc:'系统自动派单至网格员与燃气公司'},
          {dot:'handle', time:'21:20:00', title:'现场处置中', desc:'网格员与燃气公司技术人员已到场，正在关闭总阀排查'}
        ]},
       {id:'e12-2', type:'smoke', level:'urgent', status:'pending', title:'烟感·火警告警', shop:'川渝火锅城',
       device:'烟感探测器 #SF-042', addr:'中山路 260 号 大厅天花板', time:'2026-06-18 21:10:52',
       desc:'烟感探测器 烟雾浓度 0.71dB/m，触发火警告警。',
       photo:false, timeline:[
        {dot:'report', time:'21:10:52', title:'设备自动上报', desc:'烟雾浓度 0.71dB/m，超过阈值，触发火警'},
        {dot:'push', time:'21:11:00', title:'多渠道告警推送', desc:'同步推送经营者、网格员', channels:['sms','voice','app']},
        {dot:'dispatch', time:'21:11:40', title:'自动派单', desc:'系统自动派单至网格员'},
        {dot:'handle', time:'--', title:'待处置', desc:'网格员赶往现场'}
       ]},
       {id:'e12-3', type:'hazard', level:'urgent', status:'processing', title:'排查隐患：油烟管道未清洗', shop:'川渝火锅城',
       device:'每日履职自查上报', addr:'中山路 260 号 后厨', time:'2026-08-20 10:30:00',
       desc:'油烟管道积油严重，存在火灾隐患，要求限期清洗。',
       photo:true, photos:{before:'/linking-subsystem/photos/整改前-e12-3.png', after:'/linking-subsystem/photos/整改后-e12-3.png'}, timeline:[
        {dot:'report', time:'10:30:00', title:'自查上报', desc:'积油严重，拍照上报'},
        {dot:'push', time:'10:30:10', title:'整改通知', desc:'限1周内清洗', channels:['sms','app']},
        {dot:'handle', time:'--', title:'待整改', desc:'商户整改中'}
       ]},
       {id:'e12-4', type:'hazard', level:'urgent', status:'processing', title:'排查隐患：安全出口锁闭', shop:'川渝火锅城',
       device:'每日履职自查上报', addr:'中山路 260 号 侧门', time:'2026-06-15 15:20:00',
       desc:'营业期间侧门安全出口被锁闭，违反消防规定，要求立即解锁。',
       photo:true, photos:{before:'/linking-subsystem/photos/整改前-e12-4.png', after:'/linking-subsystem/photos/整改后-e12-4.png'}, timeline:[
        {dot:'report', time:'15:20:00', title:'自查上报', desc:'出口锁闭，拍照上报'},
        {dot:'push', time:'15:20:10', title:'整改通知', desc:'要求立即解锁', channels:['sms','app']},
        {dot:'handle', time:'--', title:'待整改', desc:'商户整改中'}
       ]}
       ]
       };


export const BEFORE_PHOTO_POOL = [
  '/linking-subsystem/photos/整改前-e12-4.png','/linking-subsystem/photos/整改前-e11-2.png','/linking-subsystem/photos/整改前-e9-3.png','/linking-subsystem/photos/整改前-e7-4.png',
  '/linking-subsystem/photos/整改前-e11-3.png','/linking-subsystem/photos/整改前-e8-2.png','/linking-subsystem/photos/整改前-e6-4.png','/linking-subsystem/photos/整改前-e10-2.png',
  '/linking-subsystem/photos/整改前-e7-3.png','/linking-subsystem/photos/整改前-e6-3.png','/linking-subsystem/photos/整改前-e12-3.png','/linking-subsystem/photos/整改前-e4-2.png',
  '/linking-subsystem/photos/整改前-e9-4.png','/linking-subsystem/photos/整改前-e8-3.png','/linking-subsystem/photos/整改前-e3-1.png','/linking-subsystem/photos/整改前.png'
];

