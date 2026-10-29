/**
 * layout.js — 通用大学校园布局真值表
 *
 * ★ 唯一几何来源。任何模块都从这里读取，不得各自硬编码坐标。
 * ★ 本文件由 tools/gen_layout.mjs 生成，请勿手工编辑；
 *   修改布局请改生成器后重跑：node tools/gen_layout.mjs src/layout.js
 *
 * 坐标：+X 东 / +Z 北 / +Y 上，单位米，原点在场地几何中心。
 * 说明：three.js 为右手系（Y 向上），「X=东 / Z=北」属左手定向，此处作为工程约定使用；
 *       所有坐标均为相对量，模块之间无方位换算，不影响几何正确性与业务功能。
 *
 * v3.0（30,000 在校生规模重排，依 tools/gen_layout.mjs）：
 *   - 用地 127.7 ha（1240×1030 m），生均 42.6 m²/生
 *   - 建筑 60 栋，层数 1~18 层，高度 3.6~54.0 m
 *   - 建筑形式（form）区分塔式 / 板式 / 庭院 / 退台 / 盒式 / 大跨 / 拱壳 / 折板 / 雨篷 / 门厅 / 筒壳 / 马鞍 / 扇形 / 行列式
 *   - 路网 102 条 / 21906 m，6×5 地块网格 + 逐栋自动生成前庭步道
 *   - 绿地 106 块（716373 m²）、运动场地 9 处、广场 5 处、停车场 6 处、水体 3 处
 */
export const CAMPUS = {
  "meta": {
    "id": "CAMPUS_GENERIC_001",
    "name": "通用大学校园示例模型",
    "version": "3.0.0",
    "units": "meter",
    "upAxis": "Y",
    "students": 30000,
    "plannedPopulation": 34500,
    "description": "不绑定具体学校、按 30,000 在校生规模试算的现代大学校园三维示例模型，用于业务平台的三维展示与功能验证。"
  },
  "site": {
    "bounds": {
      "minX": -620,
      "maxX": 620,
      "minZ": -515,
      "maxZ": 515
    },
    "origin": {
      "x": 0,
      "y": 0,
      "z": -515,
      "label": "场地西南角基准点"
    },
    "groundSize": 1240,
    "groundPadding": 120,
    "terrain": {
      "baseY": 0,
      "relief": 0,
      "note": "示例模型采用水平地平面；真实项目可在此叠加高程场。"
    }
  },
  "zones": [
    {
      "id": "Z1",
      "name": "教学区",
      "color": "#4C7BD9",
      "bounds": {
        "minX": -585,
        "maxX": -180,
        "minZ": -120,
        "maxZ": 480
      },
      "center": [
        -380,
        180
      ],
      "desc": "八栋教学楼与八栋学院楼构成的西侧教学核心，含退台与庭院两类体量。"
    },
    {
      "id": "Z2",
      "name": "图书与学术中心区",
      "color": "#C9A227",
      "bounds": {
        "minX": 0,
        "maxX": 180,
        "minZ": 120,
        "maxZ": 510
      },
      "center": [
        90,
        300
      ],
      "desc": "中心图书馆、学术报告厅、学术交流中心与图书馆前广场构成的图书信息核心。"
    },
    {
      "id": "Z3",
      "name": "行政办公区",
      "color": "#8E6BD1",
      "bounds": {
        "minX": 0,
        "maxX": 180,
        "minZ": -450,
        "maxZ": -120
      },
      "center": [
        90,
        -280
      ],
      "desc": "行政主楼、机关办公楼与会议中心，紧邻南门。"
    },
    {
      "id": "Z4",
      "name": "生活服务区",
      "color": "#E08A3C",
      "bounds": {
        "minX": -585,
        "maxX": 0,
        "minZ": -450,
        "maxZ": -120
      },
      "center": [
        -290,
        -280
      ],
      "desc": "高层公寓、板式公寓与低层生活公寓二十二栋，含三座食堂、超市、校医院与生活区广场。"
    },
    {
      "id": "Z5",
      "name": "体育运动区",
      "color": "#34A853",
      "bounds": {
        "minX": 180,
        "maxX": 585,
        "minZ": -120,
        "maxZ": 480
      },
      "center": [
        380,
        180
      ],
      "desc": "两座标准 400m 田径场、两座体育馆、两座风雨操场与球类场地。"
    },
    {
      "id": "Z6",
      "name": "科研实训区",
      "color": "#5B8FF9",
      "bounds": {
        "minX": -180,
        "maxX": 0,
        "minZ": 120,
        "maxZ": 510
      },
      "center": [
        -90,
        300
      ],
      "desc": "材料、生命、环境实验楼与工程训练、智能制造、创新创业平台。"
    },
    {
      "id": "Z7",
      "name": "农学生态示范区",
      "color": "#2FA8A0",
      "bounds": {
        "minX": 180,
        "maxX": 585,
        "minZ": -450,
        "maxZ": -120
      },
      "center": [
        380,
        -280
      ],
      "desc": "教学温室、智能温室与农学实训基地构成的农学生态示范区。"
    },
    {
      "id": "Z8",
      "name": "交通后勤区",
      "color": "#8A8F98",
      "bounds": {
        "minX": -180,
        "maxX": 180,
        "minZ": -515,
        "maxZ": -460
      },
      "center": [
        0,
        -486
      ],
      "desc": "南门、校门广场与南门门卫值班区等出入口后勤设施。"
    },
    {
      "id": "Z9",
      "name": "景观生态区",
      "color": "#7CB342",
      "bounds": {
        "minX": -180,
        "maxX": 180,
        "minZ": -120,
        "maxZ": 120
      },
      "center": [
        0,
        0
      ],
      "desc": "明理湖、中心广场、湖畔绿地、湖心桥与中轴绿楔构成的连续景观核心。"
    }
  ],
  "roads": [
    {
      "id": "RD_RING_W",
      "name": "西环路",
      "width": 14,
      "type": "secondary",
      "points": [
        [
          -585,
          -450
        ],
        [
          -585,
          480
        ]
      ]
    },
    {
      "id": "RD_LINK_W1",
      "name": "西区纵向路",
      "width": 10,
      "type": "secondary",
      "points": [
        [
          -390,
          -450
        ],
        [
          -390,
          480
        ]
      ]
    },
    {
      "id": "RD_LINK_W2",
      "name": "中轴西纵路",
      "width": 10,
      "type": "secondary",
      "points": [
        [
          -180,
          -450
        ],
        [
          -180,
          480
        ]
      ]
    },
    {
      "id": "RD_AXIS_MAIN",
      "name": "主轴景观大道",
      "width": 26,
      "type": "main",
      "points": [
        [
          0,
          -450
        ],
        [
          0,
          480
        ]
      ]
    },
    {
      "id": "RD_LINK_E1",
      "name": "中轴东纵路",
      "width": 10,
      "type": "secondary",
      "points": [
        [
          180,
          -450
        ],
        [
          180,
          480
        ]
      ]
    },
    {
      "id": "RD_LINK_E2",
      "name": "东区纵向路",
      "width": 10,
      "type": "secondary",
      "points": [
        [
          390,
          -450
        ],
        [
          390,
          480
        ]
      ]
    },
    {
      "id": "RD_RING_E",
      "name": "东环路",
      "width": 14,
      "type": "secondary",
      "points": [
        [
          585,
          -450
        ],
        [
          585,
          480
        ]
      ]
    },
    {
      "id": "RD_RING_S",
      "name": "南环路",
      "width": 14,
      "type": "secondary",
      "points": [
        [
          -585,
          -450
        ],
        [
          585,
          -450
        ]
      ]
    },
    {
      "id": "RD_CROSS_A",
      "name": "生活区横路",
      "width": 12,
      "type": "secondary",
      "points": [
        [
          -585,
          -300
        ],
        [
          585,
          -300
        ]
      ]
    },
    {
      "id": "RD_CROSS_B",
      "name": "中南部横路",
      "width": 12,
      "type": "secondary",
      "points": [
        [
          -585,
          -120
        ],
        [
          585,
          -120
        ]
      ]
    },
    {
      "id": "RD_CROSS_C",
      "name": "中北部横路",
      "width": 12,
      "type": "secondary",
      "points": [
        [
          -585,
          120
        ],
        [
          585,
          120
        ]
      ]
    },
    {
      "id": "RD_CROSS_D",
      "name": "教学区横路",
      "width": 12,
      "type": "secondary",
      "points": [
        [
          -585,
          330
        ],
        [
          585,
          330
        ]
      ]
    },
    {
      "id": "RD_RING_N",
      "name": "北环路",
      "width": 14,
      "type": "secondary",
      "points": [
        [
          -585,
          480
        ],
        [
          585,
          480
        ]
      ]
    },
    {
      "id": "RD_GATE_LINK_W",
      "name": "南门值班区西支路",
      "width": 6,
      "type": "secondary",
      "points": [
        [
          -46,
          -450
        ],
        [
          -46,
          -502
        ]
      ]
    },
    {
      "id": "RD_GATE_LINK_E",
      "name": "南门值班区东支路",
      "width": 6,
      "type": "secondary",
      "points": [
        [
          46,
          -502
        ],
        [
          46,
          -450
        ]
      ]
    },
    {
      "id": "RD_GATE_LINK_S",
      "name": "南门值班区横路",
      "width": 6,
      "type": "secondary",
      "points": [
        [
          -46,
          -502
        ],
        [
          46,
          -502
        ]
      ]
    },
    {
      "id": "RD_GATE_N_LINK_W",
      "name": "北门值班区西支路",
      "width": 6,
      "type": "secondary",
      "points": [
        [
          -20,
          480
        ],
        [
          -20,
          512
        ]
      ]
    },
    {
      "id": "RD_GATE_N_LINK_E",
      "name": "北门值班区东支路",
      "width": 6,
      "type": "secondary",
      "points": [
        [
          20,
          512
        ],
        [
          20,
          480
        ]
      ]
    },
    {
      "id": "RD_GATE_N_LINK_S",
      "name": "北门值班区横路",
      "width": 6,
      "type": "secondary",
      "points": [
        [
          -20,
          512
        ],
        [
          20,
          512
        ]
      ]
    },
    {
      "id": "RD_FRONT_001",
      "name": "第一教学楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -562.5,
          330
        ],
        [
          -562.5,
          338
        ],
        [
          -490.5,
          338
        ],
        [
          -490.5,
          330
        ]
      ]
    },
    {
      "id": "RD_FRONT_002",
      "name": "外国语学院楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -482.5,
          330
        ],
        [
          -482.5,
          338
        ],
        [
          -410.5,
          338
        ],
        [
          -410.5,
          330
        ]
      ]
    },
    {
      "id": "RD_FRONT_003",
      "name": "新闻传播学院楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -562.5,
          480
        ],
        [
          -562.5,
          471
        ],
        [
          -490.5,
          471
        ],
        [
          -490.5,
          480
        ]
      ]
    },
    {
      "id": "RD_FRONT_004",
      "name": "艺术设计学院楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -482.5,
          480
        ],
        [
          -482.5,
          471
        ],
        [
          -410.5,
          471
        ],
        [
          -410.5,
          480
        ]
      ]
    },
    {
      "id": "RD_FRONT_005",
      "name": "第三教学楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -562.5,
          120
        ],
        [
          -562.5,
          128
        ],
        [
          -490.5,
          128
        ],
        [
          -490.5,
          120
        ]
      ]
    },
    {
      "id": "RD_FRONT_006",
      "name": "计算机学院楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -482.5,
          120
        ],
        [
          -482.5,
          128
        ],
        [
          -410.5,
          128
        ],
        [
          -410.5,
          120
        ]
      ]
    },
    {
      "id": "RD_FRONT_007",
      "name": "第五教学楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -574,
          330
        ],
        [
          -574,
          322
        ],
        [
          -502,
          322
        ],
        [
          -502,
          330
        ]
      ]
    },
    {
      "id": "RD_FRONT_008",
      "name": "经济管理学院楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -562.5,
          -120
        ],
        [
          -562.5,
          -112
        ],
        [
          -490.5,
          -112
        ],
        [
          -490.5,
          -120
        ]
      ]
    },
    {
      "id": "RD_FRONT_009",
      "name": "马克思主义学院楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -482.5,
          -120
        ],
        [
          -482.5,
          -112
        ],
        [
          -410.5,
          -112
        ],
        [
          -410.5,
          -120
        ]
      ]
    },
    {
      "id": "RD_FRONT_010",
      "name": "第六教学楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -574,
          120
        ],
        [
          -574,
          112
        ],
        [
          -502,
          112
        ],
        [
          -502,
          120
        ]
      ]
    },
    {
      "id": "RD_FRONT_011",
      "name": "第二教学楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -361,
          330
        ],
        [
          -361,
          338
        ],
        [
          -289,
          338
        ],
        [
          -289,
          330
        ]
      ]
    },
    {
      "id": "RD_FRONT_012",
      "name": "第四教学楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -281,
          330
        ],
        [
          -281,
          338
        ],
        [
          -209,
          338
        ],
        [
          -209,
          330
        ]
      ]
    },
    {
      "id": "RD_FRONT_013",
      "name": "第七教学楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -381,
          480
        ],
        [
          -381,
          471
        ],
        [
          -309,
          471
        ],
        [
          -309,
          480
        ]
      ]
    },
    {
      "id": "RD_FRONT_014",
      "name": "第八教学楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -381,
          120
        ],
        [
          -381,
          128
        ],
        [
          -309,
          128
        ],
        [
          -309,
          120
        ]
      ]
    },
    {
      "id": "RD_FRONT_015",
      "name": "数学与统计学院楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -381,
          330
        ],
        [
          -381,
          322
        ],
        [
          -309,
          322
        ],
        [
          -309,
          330
        ]
      ]
    },
    {
      "id": "RD_FRONT_016",
      "name": "电子信息学院楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -381,
          -120
        ],
        [
          -381,
          -112
        ],
        [
          -309,
          -112
        ],
        [
          -309,
          -120
        ]
      ]
    },
    {
      "id": "RD_FRONT_017",
      "name": "材料实验中心前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -170,
          120
        ],
        [
          -170,
          128
        ],
        [
          -98,
          128
        ],
        [
          -98,
          120
        ]
      ]
    },
    {
      "id": "RD_FRONT_018",
      "name": "生命科学实验楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -90,
          120
        ],
        [
          -90,
          128
        ],
        [
          -18,
          128
        ],
        [
          -18,
          120
        ]
      ]
    },
    {
      "id": "RD_FRONT_019",
      "name": "环境科学实验楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -170,
          330
        ],
        [
          -170,
          322
        ],
        [
          -98,
          322
        ],
        [
          -98,
          330
        ]
      ]
    },
    {
      "id": "RD_FRONT_020",
      "name": "工程训练中心前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -90,
          330
        ],
        [
          -90,
          322
        ],
        [
          -18,
          322
        ],
        [
          -18,
          330
        ]
      ]
    },
    {
      "id": "RD_FRONT_021",
      "name": "智能制造实训楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -170,
          330
        ],
        [
          -170,
          338
        ],
        [
          -98,
          338
        ],
        [
          -98,
          330
        ]
      ]
    },
    {
      "id": "RD_FRONT_022",
      "name": "创新创业中心前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -90,
          330
        ],
        [
          -90,
          338
        ],
        [
          -18,
          338
        ],
        [
          -18,
          330
        ]
      ]
    },
    {
      "id": "RD_FRONT_023",
      "name": "中心图书馆前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          0,
          423
        ],
        [
          15,
          423
        ],
        [
          15,
          469
        ],
        [
          0,
          469
        ]
      ]
    },
    {
      "id": "RD_FRONT_024",
      "name": "学术报告厅前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          18,
          120
        ],
        [
          18,
          128
        ],
        [
          90,
          128
        ],
        [
          90,
          120
        ]
      ]
    },
    {
      "id": "RD_FRONT_025",
      "name": "学术交流中心前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          98,
          120
        ],
        [
          98,
          128
        ],
        [
          170,
          128
        ],
        [
          170,
          120
        ]
      ]
    },
    {
      "id": "RD_FRONT_026",
      "name": "行政主楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          18,
          -300
        ],
        [
          18,
          -292
        ],
        [
          90,
          -292
        ],
        [
          90,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_027",
      "name": "机关办公楼前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          98,
          -300
        ],
        [
          98,
          -292
        ],
        [
          170,
          -292
        ],
        [
          170,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_028",
      "name": "会议中心前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          17,
          -450
        ],
        [
          17,
          -441
        ],
        [
          89,
          -441
        ],
        [
          89,
          -450
        ]
      ]
    },
    {
      "id": "RD_FRONT_029",
      "name": "1号高层公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -350,
          -450
        ],
        [
          -350,
          -441
        ],
        [
          -316,
          -441
        ],
        [
          -316,
          -450
        ]
      ]
    },
    {
      "id": "RD_FRONT_030",
      "name": "2号高层公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -254,
          -450
        ],
        [
          -254,
          -441
        ],
        [
          -220,
          -441
        ],
        [
          -220,
          -450
        ]
      ]
    },
    {
      "id": "RD_FRONT_031",
      "name": "3号高层公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -350,
          -300
        ],
        [
          -350,
          -308
        ],
        [
          -316,
          -308
        ],
        [
          -316,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_032",
      "name": "4号高层公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -254,
          -300
        ],
        [
          -254,
          -308
        ],
        [
          -220,
          -308
        ],
        [
          -220,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_033",
      "name": "5号高层公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -149.5,
          -120
        ],
        [
          -149.5,
          -128
        ],
        [
          -115.5,
          -128
        ],
        [
          -115.5,
          -120
        ]
      ]
    },
    {
      "id": "RD_FRONT_034",
      "name": "6号高层公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -72.5,
          -120
        ],
        [
          -72.5,
          -128
        ],
        [
          -38.5,
          -128
        ],
        [
          -38.5,
          -120
        ]
      ]
    },
    {
      "id": "RD_FRONT_035",
      "name": "7号高层公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -149.5,
          -300
        ],
        [
          -149.5,
          -308
        ],
        [
          -115.5,
          -308
        ],
        [
          -115.5,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_036",
      "name": "8号高层公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -72.5,
          -300
        ],
        [
          -72.5,
          -308
        ],
        [
          -38.5,
          -308
        ],
        [
          -38.5,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_037",
      "name": "1号学生公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -562.5,
          -450
        ],
        [
          -562.5,
          -441
        ],
        [
          -490.5,
          -441
        ],
        [
          -490.5,
          -450
        ]
      ]
    },
    {
      "id": "RD_FRONT_038",
      "name": "2号学生公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -482.5,
          -450
        ],
        [
          -482.5,
          -441
        ],
        [
          -410.5,
          -441
        ],
        [
          -410.5,
          -450
        ]
      ]
    },
    {
      "id": "RD_FRONT_039",
      "name": "3号学生公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -522.5,
          -300
        ],
        [
          -522.5,
          -308
        ],
        [
          -450.5,
          -308
        ],
        [
          -450.5,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_040",
      "name": "4号学生公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -562.5,
          -120
        ],
        [
          -562.5,
          -128
        ],
        [
          -490.5,
          -128
        ],
        [
          -490.5,
          -120
        ]
      ]
    },
    {
      "id": "RD_FRONT_041",
      "name": "5号学生公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -170,
          -450
        ],
        [
          -170,
          -441
        ],
        [
          -98,
          -441
        ],
        [
          -98,
          -450
        ]
      ]
    },
    {
      "id": "RD_FRONT_042",
      "name": "1号生活公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -562.5,
          -300
        ],
        [
          -562.5,
          -292
        ],
        [
          -490.5,
          -292
        ],
        [
          -490.5,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_043",
      "name": "2号生活公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -482.5,
          -300
        ],
        [
          -482.5,
          -292
        ],
        [
          -410.5,
          -292
        ],
        [
          -410.5,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_044",
      "name": "3号生活公寓前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -482.5,
          -120
        ],
        [
          -482.5,
          -128
        ],
        [
          -410.5,
          -128
        ],
        [
          -410.5,
          -120
        ]
      ]
    },
    {
      "id": "RD_FRONT_045",
      "name": "第一食堂前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -361,
          -300
        ],
        [
          -361,
          -292
        ],
        [
          -289,
          -292
        ],
        [
          -289,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_046",
      "name": "校园超市前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -281,
          -300
        ],
        [
          -281,
          -292
        ],
        [
          -209,
          -292
        ],
        [
          -209,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_047",
      "name": "第二食堂前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -361,
          -120
        ],
        [
          -361,
          -128
        ],
        [
          -289,
          -128
        ],
        [
          -289,
          -120
        ]
      ]
    },
    {
      "id": "RD_FRONT_048",
      "name": "校医院前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -281,
          -120
        ],
        [
          -281,
          -128
        ],
        [
          -209,
          -128
        ],
        [
          -209,
          -120
        ]
      ]
    },
    {
      "id": "RD_FRONT_049",
      "name": "第三食堂前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -171,
          -300
        ],
        [
          -171,
          -292
        ],
        [
          -99,
          -292
        ],
        [
          -99,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_050",
      "name": "生活服务中心前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -90,
          -450
        ],
        [
          -90,
          -441
        ],
        [
          -18,
          -441
        ],
        [
          -18,
          -450
        ]
      ]
    },
    {
      "id": "RD_FRONT_051",
      "name": "综合体育馆前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          189,
          120
        ],
        [
          189,
          128
        ],
        [
          261,
          128
        ],
        [
          261,
          120
        ]
      ]
    },
    {
      "id": "RD_FRONT_052",
      "name": "风雨操场前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          189,
          330
        ],
        [
          189,
          322
        ],
        [
          261,
          322
        ],
        [
          261,
          330
        ]
      ]
    },
    {
      "id": "RD_FRONT_053",
      "name": "第二风雨操场前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          189,
          -120
        ],
        [
          189,
          -112
        ],
        [
          261,
          -112
        ],
        [
          261,
          -120
        ]
      ]
    },
    {
      "id": "RD_FRONT_054",
      "name": "第二体育馆前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          189,
          120
        ],
        [
          189,
          112
        ],
        [
          261,
          112
        ],
        [
          261,
          120
        ]
      ]
    },
    {
      "id": "RD_FRONT_055",
      "name": "教学温室大棚前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          189,
          -300
        ],
        [
          189,
          -292
        ],
        [
          261,
          -292
        ],
        [
          261,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_056",
      "name": "智能温室基地前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          399,
          -300
        ],
        [
          399,
          -292
        ],
        [
          471,
          -292
        ],
        [
          471,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_057",
      "name": "农学实训基地前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          399,
          -120
        ],
        [
          399,
          -128
        ],
        [
          471,
          -128
        ],
        [
          471,
          -120
        ]
      ]
    },
    {
      "id": "RD_FRONT_058",
      "name": "南门门卫室（东）前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          46,
          -494.5
        ],
        [
          51,
          -494.5
        ],
        [
          51,
          -485.5
        ],
        [
          46,
          -485.5
        ]
      ]
    },
    {
      "id": "RD_FRONT_059",
      "name": "南门门卫室（西）前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -46,
          -494.5
        ],
        [
          -51,
          -494.5
        ],
        [
          -51,
          -485.5
        ],
        [
          -46,
          -485.5
        ]
      ]
    },
    {
      "id": "RD_FRONT_060",
      "name": "北门门卫室前庭步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          27,
          480
        ],
        [
          27,
          493.5
        ],
        [
          41,
          493.5
        ],
        [
          41,
          480
        ]
      ]
    },
    {
      "id": "RD_FRONT_061",
      "name": "CAMPUS_PLAZA_MAIN接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          0,
          -18
        ],
        [
          -32,
          -18
        ],
        [
          -32,
          58
        ],
        [
          0,
          58
        ]
      ]
    },
    {
      "id": "RD_FRONT_062",
      "name": "CAMPUS_PLAZA_NORTH接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          180,
          337
        ],
        [
          161,
          337
        ],
        [
          161,
          389
        ],
        [
          180,
          389
        ]
      ]
    },
    {
      "id": "RD_FRONT_063",
      "name": "CAMPUS_PLAZA_GATE接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -40,
          -450
        ],
        [
          -40,
          -459
        ],
        [
          40,
          -459
        ],
        [
          40,
          -450
        ]
      ]
    },
    {
      "id": "RD_FRONT_064",
      "name": "CAMPUS_PLAZA_SPORT接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          390,
          130
        ],
        [
          360,
          130
        ],
        [
          360,
          174
        ],
        [
          390,
          174
        ]
      ]
    },
    {
      "id": "RD_FRONT_065",
      "name": "CAMPUS_PLAZA_LIFE接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          0,
          -255
        ],
        [
          -62,
          -255
        ],
        [
          -62,
          -215
        ],
        [
          0,
          -215
        ]
      ]
    },
    {
      "id": "RD_FRONT_066",
      "name": "CAMPUS_TRACK_01接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          180,
          183.74
        ],
        [
          194.54500000000002,
          183.74
        ],
        [
          194.54500000000002,
          276.26
        ],
        [
          180,
          276.26
        ]
      ]
    },
    {
      "id": "RD_FRONT_067",
      "name": "CAMPUS_TRACK_02接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          180,
          -46.26
        ],
        [
          194.54500000000002,
          -46.26
        ],
        [
          194.54500000000002,
          46.26
        ],
        [
          180,
          46.26
        ]
      ]
    },
    {
      "id": "RD_FRONT_068",
      "name": "CAMPUS_COURT_BASKET_01接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          390,
          182
        ],
        [
          430,
          182
        ],
        [
          430,
          218
        ],
        [
          390,
          218
        ]
      ]
    },
    {
      "id": "RD_FRONT_069",
      "name": "CAMPUS_COURT_BASKET_02接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          0,
          -208
        ],
        [
          -64,
          -208
        ],
        [
          -64,
          -172
        ],
        [
          0,
          -172
        ]
      ]
    },
    {
      "id": "RD_FRONT_070",
      "name": "CAMPUS_COURT_BASKET_03接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          390,
          -228
        ],
        [
          490,
          -228
        ],
        [
          490,
          -192
        ],
        [
          390,
          -192
        ]
      ]
    },
    {
      "id": "RD_FRONT_071",
      "name": "CAMPUS_COURT_TENNIS_01接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          390,
          389
        ],
        [
          441,
          389
        ],
        [
          441,
          411
        ],
        [
          390,
          411
        ]
      ]
    },
    {
      "id": "RD_FRONT_072",
      "name": "CAMPUS_COURT_TENNIS_02接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          390,
          -11
        ],
        [
          441,
          -11
        ],
        [
          441,
          11
        ],
        [
          390,
          11
        ]
      ]
    },
    {
      "id": "RD_FRONT_073",
      "name": "CAMPUS_COURT_TENNIS_03接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          213,
          480
        ],
        [
          213,
          413
        ],
        [
          247,
          413
        ],
        [
          247,
          480
        ]
      ]
    },
    {
      "id": "RD_FRONT_074",
      "name": "CAMPUS_COURT_TENNIS_04接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          43,
          -300
        ],
        [
          43,
          -327
        ],
        [
          77,
          -327
        ],
        [
          77,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_075",
      "name": "CAMPUS_PARK_01接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          240,
          -300
        ],
        [
          240,
          -349
        ],
        [
          330,
          -349
        ],
        [
          330,
          -300
        ]
      ]
    },
    {
      "id": "RD_FRONT_076",
      "name": "CAMPUS_PARK_02接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          0,
          -399
        ],
        [
          -52,
          -399
        ],
        [
          -52,
          -351
        ],
        [
          0,
          -351
        ]
      ]
    },
    {
      "id": "RD_FRONT_077",
      "name": "CAMPUS_PARK_03接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          274,
          330
        ],
        [
          274,
          380
        ],
        [
          350,
          380
        ],
        [
          350,
          330
        ]
      ]
    },
    {
      "id": "RD_FRONT_078",
      "name": "CAMPUS_PARK_04接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          66,
          -120
        ],
        [
          66,
          -158
        ],
        [
          122,
          -158
        ],
        [
          122,
          -120
        ]
      ]
    },
    {
      "id": "RD_FRONT_079",
      "name": "CAMPUS_PARK_05接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          -390,
          210
        ],
        [
          -449,
          210
        ],
        [
          -449,
          250
        ],
        [
          -390,
          250
        ]
      ]
    },
    {
      "id": "RD_FRONT_080",
      "name": "CAMPUS_PARK_06接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          56,
          330
        ],
        [
          56,
          307
        ],
        [
          132,
          307
        ],
        [
          132,
          330
        ]
      ]
    },
    {
      "id": "RD_FRONT_081",
      "name": "CAMPUS_LAKE_01接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          0,
          -20
        ],
        [
          33,
          -20
        ],
        [
          33,
          60
        ],
        [
          0,
          60
        ]
      ]
    },
    {
      "id": "RD_FRONT_082",
      "name": "CAMPUS_POND_02接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          390,
          -393
        ],
        [
          462,
          -393
        ],
        [
          462,
          -357
        ],
        [
          390,
          -357
        ]
      ]
    },
    {
      "id": "RD_FRONT_083",
      "name": "CAMPUS_POND_03接入步道",
      "width": 3,
      "type": "path",
      "points": [
        [
          0,
          215
        ],
        [
          -62,
          215
        ],
        [
          -62,
          255
        ],
        [
          0,
          255
        ]
      ]
    }
  ],
  "buildings": [
    {
      "id": "CAMPUS_TEACH_01",
      "name": "第一教学楼",
      "category": "教学",
      "zone": "Z1",
      "type": "teaching",
      "form": "courtyard",
      "position": [
        -526.5,
        0,
        366
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 52
      },
      "floors": 8,
      "floorHeight": 3.9,
      "facade": "concrete",
      "roof": "flat",
      "facadeStyle": "band",
      "windowRatio": 0.46,
      "extras": [
        "entrance"
      ],
      "summary": "公共课教学主楼，八层板式围合内庭院，设阶梯教室与智慧教室",
      "tags": [
        "教学",
        "公共教室"
      ]
    },
    {
      "id": "CAMPUS_COLLEGE_03",
      "name": "外国语学院楼",
      "category": "教学",
      "zone": "Z1",
      "type": "college",
      "form": "slab",
      "position": [
        -446.5,
        0,
        359
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 38
      },
      "floors": 5,
      "floorHeight": 3.9,
      "facade": "brick",
      "roof": "flat",
      "facadeStyle": "grid",
      "windowRatio": 0.42,
      "extras": [
        "entrance"
      ],
      "summary": "外语教学与同声传译实训中心",
      "tags": [
        "教学",
        "学院楼"
      ]
    },
    {
      "id": "CAMPUS_COLLEGE_05",
      "name": "新闻传播学院楼",
      "category": "教学",
      "zone": "Z1",
      "type": "college",
      "form": "slab",
      "position": [
        -526.5,
        0,
        450
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 38
      },
      "floors": 5,
      "floorHeight": 3.9,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "grid",
      "windowRatio": 0.42,
      "extras": [
        "entrance"
      ],
      "summary": "新闻传播与数字媒体实验教学中心",
      "tags": [
        "教学",
        "学院楼"
      ]
    },
    {
      "id": "CAMPUS_COLLEGE_06",
      "name": "艺术设计学院楼",
      "category": "教学",
      "zone": "Z1",
      "type": "college",
      "form": "terrace",
      "position": [
        -446.5,
        0,
        451
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 36
      },
      "floors": 4,
      "floorHeight": 4.2,
      "facade": "concrete",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.52,
      "extras": [
        "entrance"
      ],
      "summary": "艺术与设计学院，展陈工坊与退台展廊",
      "tags": [
        "教学",
        "学院楼"
      ]
    },
    {
      "id": "CAMPUS_TEACH_03",
      "name": "第三教学楼",
      "category": "教学",
      "zone": "Z1",
      "type": "teaching",
      "form": "slab",
      "position": [
        -526.5,
        0,
        156
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 52
      },
      "floors": 6,
      "floorHeight": 3.9,
      "facade": "concrete",
      "roof": "flat",
      "facadeStyle": "grid",
      "windowRatio": 0.44,
      "extras": [
        "entrance"
      ],
      "summary": "专业教学楼，设专业实验室与研讨室",
      "tags": [
        "教学",
        "实验室"
      ]
    },
    {
      "id": "CAMPUS_COLLEGE_01",
      "name": "计算机学院楼",
      "category": "教学",
      "zone": "Z1",
      "type": "college",
      "form": "slab",
      "position": [
        -446.5,
        0,
        150
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 40
      },
      "floors": 7,
      "floorHeight": 3.9,
      "facade": "glass",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.62,
      "extras": [
        "entrance"
      ],
      "summary": "计算机与人工智能学院教学楼",
      "tags": [
        "教学",
        "学院楼"
      ]
    },
    {
      "id": "CAMPUS_TEACH_05",
      "name": "第五教学楼",
      "category": "教学",
      "zone": "Z1",
      "type": "teaching",
      "form": "terrace",
      "position": [
        -538,
        0,
        300
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 40
      },
      "floors": 5,
      "floorHeight": 3.9,
      "facade": "glass",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.55,
      "extras": [
        "entrance"
      ],
      "summary": "退台式教学楼，层层退台形成景观台阶与屋顶花园",
      "tags": [
        "教学",
        "公共教室"
      ]
    },
    {
      "id": "CAMPUS_COLLEGE_02",
      "name": "经济管理学院楼",
      "category": "教学",
      "zone": "Z1",
      "type": "college",
      "form": "courtyard",
      "position": [
        -526.5,
        0,
        -90
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 40
      },
      "floors": 6,
      "floorHeight": 3.9,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "band",
      "windowRatio": 0.45,
      "extras": [
        "entrance"
      ],
      "summary": "经济管理学院教学楼，含案例教学中心",
      "tags": [
        "教学",
        "学院楼"
      ]
    },
    {
      "id": "CAMPUS_COLLEGE_04",
      "name": "马克思主义学院楼",
      "category": "教学",
      "zone": "Z1",
      "type": "college",
      "form": "box",
      "position": [
        -446.5,
        0,
        -93
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 34
      },
      "floors": 4,
      "floorHeight": 3.9,
      "facade": "stone",
      "roof": "flat",
      "facadeStyle": "grid",
      "windowRatio": 0.38,
      "extras": [
        "entrance"
      ],
      "summary": "人文社科教学与教师研修空间",
      "tags": [
        "教学",
        "学院楼"
      ]
    },
    {
      "id": "CAMPUS_TEACH_06",
      "name": "第六教学楼",
      "category": "教学",
      "zone": "Z1",
      "type": "teaching",
      "form": "terrace",
      "position": [
        -538,
        0,
        90
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 40
      },
      "floors": 5,
      "floorHeight": 3.9,
      "facade": "concrete",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.5,
      "extras": [
        "entrance"
      ],
      "summary": "退台式教学楼，共享中庭与室外连廊",
      "tags": [
        "教学",
        "公共教室"
      ]
    },
    {
      "id": "CAMPUS_TEACH_02",
      "name": "第二教学楼",
      "category": "教学",
      "zone": "Z1",
      "type": "teaching",
      "form": "courtyard",
      "position": [
        -325,
        0,
        366
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 52
      },
      "floors": 8,
      "floorHeight": 3.9,
      "facade": "glass",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.58,
      "extras": [
        "entrance"
      ],
      "summary": "公共课教学主楼，玻璃幕墙立面，内设通高中庭",
      "tags": [
        "教学",
        "公共教室"
      ]
    },
    {
      "id": "CAMPUS_TEACH_04",
      "name": "第四教学楼",
      "category": "教学",
      "zone": "Z1",
      "type": "teaching",
      "form": "slab",
      "position": [
        -245,
        0,
        362
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 44
      },
      "floors": 6,
      "floorHeight": 3.9,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "grid",
      "windowRatio": 0.44,
      "extras": [
        "entrance"
      ],
      "summary": "专业教学楼，设专业实验室与研讨室",
      "tags": [
        "教学",
        "实验室"
      ]
    },
    {
      "id": "CAMPUS_TEACH_07",
      "name": "第七教学楼",
      "category": "教学",
      "zone": "Z1",
      "type": "teaching",
      "form": "slab",
      "position": [
        -345,
        0,
        447
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 44
      },
      "floors": 6,
      "floorHeight": 3.9,
      "facade": "concrete",
      "roof": "flat",
      "facadeStyle": "grid",
      "windowRatio": 0.44,
      "extras": [
        "entrance"
      ],
      "summary": "西校区专业教学楼，设共享实验平台",
      "tags": [
        "教学",
        "实验室"
      ]
    },
    {
      "id": "CAMPUS_TEACH_08",
      "name": "第八教学楼",
      "category": "教学",
      "zone": "Z1",
      "type": "teaching",
      "form": "terrace",
      "position": [
        -345,
        0,
        150
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 40
      },
      "floors": 5,
      "floorHeight": 3.9,
      "facade": "glass",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.55,
      "extras": [
        "entrance"
      ],
      "summary": "退台式教学楼，层层退台朝向中轴绿楔",
      "tags": [
        "教学",
        "公共教室"
      ]
    },
    {
      "id": "CAMPUS_COLLEGE_07",
      "name": "数学与统计学院楼",
      "category": "教学",
      "zone": "Z1",
      "type": "college",
      "form": "box",
      "position": [
        -345,
        0,
        302
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 36
      },
      "floors": 4,
      "floorHeight": 4.2,
      "facade": "brick",
      "roof": "flat",
      "facadeStyle": "grid",
      "windowRatio": 0.4,
      "extras": [
        "entrance"
      ],
      "summary": "数学与统计学科教学中心，含计算实验教室",
      "tags": [
        "教学",
        "学院楼"
      ]
    },
    {
      "id": "CAMPUS_COLLEGE_08",
      "name": "电子信息学院楼",
      "category": "教学",
      "zone": "Z1",
      "type": "college",
      "form": "slab",
      "position": [
        -345,
        0,
        -90
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 40
      },
      "floors": 6,
      "floorHeight": 4,
      "facade": "glass",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.6,
      "extras": [
        "entrance"
      ],
      "summary": "电子信息与通信工程学科教学中心",
      "tags": [
        "教学",
        "学院楼"
      ]
    },
    {
      "id": "CAMPUS_LAB_01",
      "name": "材料实验中心",
      "category": "科研",
      "zone": "Z6",
      "type": "lab",
      "form": "box",
      "position": [
        -134,
        0,
        147
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 34
      },
      "floors": 6,
      "floorHeight": 4.4,
      "facade": "concrete",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.5,
      "extras": [
        "entrance",
        "rooftop"
      ],
      "summary": "大型仪器实验平台，含屋顶设备层",
      "tags": [
        "科研",
        "实验室"
      ]
    },
    {
      "id": "CAMPUS_LAB_02",
      "name": "生命科学实验楼",
      "category": "科研",
      "zone": "Z6",
      "type": "lab",
      "form": "box",
      "position": [
        -54,
        0,
        146
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 32
      },
      "floors": 6,
      "floorHeight": 4.4,
      "facade": "glass",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.55,
      "extras": [
        "entrance",
        "rooftop"
      ],
      "summary": "生命科学与生物工程实验平台",
      "tags": [
        "科研",
        "实验室"
      ]
    },
    {
      "id": "CAMPUS_LAB_03",
      "name": "环境科学实验楼",
      "category": "科研",
      "zone": "Z6",
      "type": "lab",
      "form": "terrace",
      "position": [
        -134,
        0,
        305
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 30
      },
      "floors": 5,
      "floorHeight": 4.4,
      "facade": "concrete",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.5,
      "extras": [
        "entrance"
      ],
      "summary": "环境与土木实验平台，退台布置采光实验舱",
      "tags": [
        "科研",
        "实验室"
      ]
    },
    {
      "id": "CAMPUS_TRAIN_01",
      "name": "工程训练中心",
      "category": "科研",
      "zone": "Z6",
      "type": "lab",
      "form": "arch",
      "position": [
        -54,
        0,
        304
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 32
      },
      "floors": 2,
      "floorHeight": 7,
      "facade": "brick",
      "roof": "arched",
      "facadeStyle": "curtain",
      "windowRatio": 0.45,
      "extras": [
        "entrance",
        "canopy"
      ],
      "summary": "工程实训车间与综合加工中心",
      "tags": [
        "科研",
        "实训"
      ]
    },
    {
      "id": "CAMPUS_TRAIN_02",
      "name": "智能制造实训楼",
      "category": "科研",
      "zone": "Z6",
      "type": "lab",
      "form": "box",
      "position": [
        -134,
        0,
        355
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 30
      },
      "floors": 6,
      "floorHeight": 4.4,
      "facade": "metal",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.55,
      "extras": [
        "entrance"
      ],
      "summary": "智能制造与机器人实训平台",
      "tags": [
        "科研",
        "实训"
      ]
    },
    {
      "id": "CAMPUS_TRAIN_03",
      "name": "创新创业中心",
      "category": "科研",
      "zone": "Z6",
      "type": "lab",
      "form": "pavilion",
      "position": [
        -54,
        0,
        355
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 30
      },
      "floors": 4,
      "floorHeight": 4.2,
      "facade": "glass",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.65,
      "extras": [
        "entrance"
      ],
      "summary": "学生创新创业与孵化空间，含路演与共享工位",
      "tags": [
        "科研",
        "创新"
      ]
    },
    {
      "id": "CAMPUS_LIB_01",
      "name": "中心图书馆",
      "category": "图书",
      "zone": "Z2",
      "type": "library",
      "form": "pavilion",
      "position": [
        60,
        0,
        446
      ],
      "rotation": 0,
      "footprint": {
        "w": 86,
        "d": 46
      },
      "floors": 9,
      "floorHeight": 4.5,
      "facade": "glass",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.68,
      "extras": [
        "entrance",
        "columns",
        "rooftop"
      ],
      "summary": "校园中心地标，阅览翼与书库塔楼组合，主入口正对主轴大道",
      "tags": [
        "地标",
        "中心轴",
        "自习"
      ]
    },
    {
      "id": "CAMPUS_AUDIT_01",
      "name": "学术报告厅",
      "category": "教学",
      "zone": "Z2",
      "type": "auditorium",
      "form": "fan",
      "position": [
        54,
        0,
        150
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 40
      },
      "floors": 2,
      "floorHeight": 7,
      "facade": "glass",
      "roof": "curved",
      "facadeStyle": "curtain",
      "windowRatio": 0.45,
      "extras": [
        "entrance"
      ],
      "summary": "千座级学术报告厅，扇形观众席与环幕",
      "tags": [
        "会议",
        "报告"
      ]
    },
    {
      "id": "CAMPUS_AUDIT_02",
      "name": "学术交流中心",
      "category": "教学",
      "zone": "Z2",
      "type": "auditorium",
      "form": "box",
      "position": [
        134,
        0,
        148
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 36
      },
      "floors": 2,
      "floorHeight": 6.5,
      "facade": "metal",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.5,
      "extras": [
        "entrance"
      ],
      "summary": "专家工作室与学术沙龙，含路演厅",
      "tags": [
        "会议",
        "交流"
      ]
    },
    {
      "id": "CAMPUS_ADMIN_01",
      "name": "行政主楼",
      "category": "行政",
      "zone": "Z3",
      "type": "office",
      "form": "box",
      "position": [
        54,
        0,
        -275
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 30
      },
      "floors": 5,
      "floorHeight": 4,
      "facade": "stone",
      "roof": "flat",
      "facadeStyle": "grid",
      "windowRatio": 0.42,
      "extras": [
        "entrance"
      ],
      "summary": "学校主楼与行政办公中心，含校史厅",
      "tags": [
        "办公",
        "会议"
      ]
    },
    {
      "id": "CAMPUS_ADMIN_02",
      "name": "机关办公楼",
      "category": "行政",
      "zone": "Z3",
      "type": "office",
      "form": "slab",
      "position": [
        134,
        0,
        -277
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 26
      },
      "floors": 5,
      "floorHeight": 4,
      "facade": "concrete",
      "roof": "flat",
      "facadeStyle": "grid",
      "windowRatio": 0.4,
      "extras": [
        "entrance"
      ],
      "summary": "各职能部门与院系办公室",
      "tags": [
        "办公"
      ]
    },
    {
      "id": "CAMPUS_ADMIN_03",
      "name": "会议中心",
      "category": "行政",
      "zone": "Z3",
      "type": "office",
      "form": "pavilion",
      "position": [
        53,
        0,
        -424
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 30
      },
      "floors": 2,
      "floorHeight": 6,
      "facade": "glass",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.55,
      "extras": [
        "entrance",
        "sign"
      ],
      "summary": "多功能会议厅与报告厅，含会见与接待空间",
      "tags": [
        "会议",
        "接待"
      ]
    },
    {
      "id": "CAMPUS_DORM_T01",
      "name": "1号高层公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "tower",
      "position": [
        -333,
        0,
        -422
      ],
      "rotation": 0,
      "footprint": {
        "w": 34,
        "d": 34
      },
      "floors": 16,
      "floorHeight": 3,
      "facade": "concrete",
      "roof": "flat",
      "facadeStyle": "band",
      "windowRatio": 0.5,
      "extras": [
        "entrance"
      ],
      "summary": "高层学生公寓，16 层塔式，一层四户",
      "tags": [
        "住宿",
        "高层"
      ]
    },
    {
      "id": "CAMPUS_DORM_T02",
      "name": "2号高层公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "tower",
      "position": [
        -237,
        0,
        -422
      ],
      "rotation": 0,
      "footprint": {
        "w": 34,
        "d": 34
      },
      "floors": 16,
      "floorHeight": 3,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "band",
      "windowRatio": 0.5,
      "extras": [
        "entrance"
      ],
      "summary": "高层学生公寓，16 层塔式，一层四户",
      "tags": [
        "住宿",
        "高层"
      ]
    },
    {
      "id": "CAMPUS_DORM_T03",
      "name": "3号高层公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "tower",
      "position": [
        -333,
        0,
        -327
      ],
      "rotation": 0,
      "footprint": {
        "w": 34,
        "d": 34
      },
      "floors": 18,
      "floorHeight": 3,
      "facade": "concrete",
      "roof": "flat",
      "facadeStyle": "band",
      "windowRatio": 0.5,
      "extras": [
        "entrance"
      ],
      "summary": "高层学生公寓，18 层塔式，一层四户",
      "tags": [
        "住宿",
        "高层"
      ]
    },
    {
      "id": "CAMPUS_DORM_T04",
      "name": "4号高层公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "tower",
      "position": [
        -237,
        0,
        -327
      ],
      "rotation": 0,
      "footprint": {
        "w": 34,
        "d": 34
      },
      "floors": 18,
      "floorHeight": 3,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "band",
      "windowRatio": 0.5,
      "extras": [
        "entrance"
      ],
      "summary": "高层学生公寓，18 层塔式，一层四户",
      "tags": [
        "住宿",
        "高层"
      ]
    },
    {
      "id": "CAMPUS_DORM_T05",
      "name": "5号高层公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "tower",
      "position": [
        -132.5,
        0,
        -147
      ],
      "rotation": 0,
      "footprint": {
        "w": 34,
        "d": 34
      },
      "floors": 16,
      "floorHeight": 3,
      "facade": "concrete",
      "roof": "flat",
      "facadeStyle": "band",
      "windowRatio": 0.5,
      "extras": [
        "entrance"
      ],
      "summary": "高层学生公寓，16 层塔式，一层四户",
      "tags": [
        "住宿",
        "高层"
      ]
    },
    {
      "id": "CAMPUS_DORM_T06",
      "name": "6号高层公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "tower",
      "position": [
        -55.5,
        0,
        -147
      ],
      "rotation": 0,
      "footprint": {
        "w": 34,
        "d": 34
      },
      "floors": 16,
      "floorHeight": 3,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "band",
      "windowRatio": 0.5,
      "extras": [
        "entrance"
      ],
      "summary": "高层学生公寓，16 层塔式，一层四户",
      "tags": [
        "住宿",
        "高层"
      ]
    },
    {
      "id": "CAMPUS_DORM_T07",
      "name": "7号高层公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "tower",
      "position": [
        -132.5,
        0,
        -327
      ],
      "rotation": 0,
      "footprint": {
        "w": 34,
        "d": 34
      },
      "floors": 16,
      "floorHeight": 3,
      "facade": "concrete",
      "roof": "flat",
      "facadeStyle": "band",
      "windowRatio": 0.5,
      "extras": [
        "entrance"
      ],
      "summary": "高层学生公寓，16 层塔式，一层四户",
      "tags": [
        "住宿",
        "高层"
      ]
    },
    {
      "id": "CAMPUS_DORM_T08",
      "name": "8号高层公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "tower",
      "position": [
        -55.5,
        0,
        -327
      ],
      "rotation": 0,
      "footprint": {
        "w": 34,
        "d": 34
      },
      "floors": 18,
      "floorHeight": 3,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "band",
      "windowRatio": 0.5,
      "extras": [
        "entrance"
      ],
      "summary": "高层学生公寓，18 层塔式，一层四户",
      "tags": [
        "住宿",
        "高层"
      ]
    },
    {
      "id": "CAMPUS_DORM_01",
      "name": "1号学生公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "slab",
      "position": [
        -526.5,
        0,
        -430.5
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 17
      },
      "floors": 12,
      "floorHeight": 3,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "band",
      "windowRatio": 0.48,
      "extras": [
        "entrance"
      ],
      "summary": "板式学生公寓，十二层连续阳台带",
      "tags": [
        "住宿"
      ]
    },
    {
      "id": "CAMPUS_DORM_02",
      "name": "2号学生公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "slab",
      "position": [
        -446.5,
        0,
        -430.5
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 17
      },
      "floors": 12,
      "floorHeight": 3,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "band",
      "windowRatio": 0.48,
      "extras": [
        "entrance"
      ],
      "summary": "板式学生公寓，十二层连续阳台带",
      "tags": [
        "住宿"
      ]
    },
    {
      "id": "CAMPUS_DORM_03",
      "name": "3号学生公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "slab",
      "position": [
        -486.5,
        0,
        -318.5
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 17
      },
      "floors": 12,
      "floorHeight": 3,
      "facade": "brick",
      "roof": "flat",
      "facadeStyle": "band",
      "windowRatio": 0.48,
      "extras": [
        "entrance"
      ],
      "summary": "板式学生公寓，十二层连续阳台带",
      "tags": [
        "住宿"
      ]
    },
    {
      "id": "CAMPUS_DORM_04",
      "name": "4号学生公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "slab",
      "position": [
        -526.5,
        0,
        -138.5
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 17
      },
      "floors": 12,
      "floorHeight": 3,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "band",
      "windowRatio": 0.48,
      "extras": [
        "entrance"
      ],
      "summary": "板式学生公寓，十二层连续阳台带",
      "tags": [
        "住宿"
      ]
    },
    {
      "id": "CAMPUS_DORM_05",
      "name": "5号学生公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "slab",
      "position": [
        -134,
        0,
        -430.5
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 17
      },
      "floors": 12,
      "floorHeight": 3,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "band",
      "windowRatio": 0.48,
      "extras": [
        "entrance"
      ],
      "summary": "板式学生公寓，十二层连续阳台带",
      "tags": [
        "住宿"
      ]
    },
    {
      "id": "CAMPUS_DORM_L01",
      "name": "1号生活公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "walkup",
      "position": [
        -526.5,
        0,
        -282
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 16
      },
      "floors": 6,
      "floorHeight": 3.2,
      "facade": "plaster",
      "roof": "pitched",
      "facadeStyle": "band",
      "windowRatio": 0.46,
      "extras": [
        "entrance"
      ],
      "summary": "低层生活公寓，六层行列式，临近生活服务中心",
      "tags": [
        "住宿",
        "低层"
      ]
    },
    {
      "id": "CAMPUS_DORM_L02",
      "name": "2号生活公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "walkup",
      "position": [
        -446.5,
        0,
        -282
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 16
      },
      "floors": 6,
      "floorHeight": 3.2,
      "facade": "plaster",
      "roof": "pitched",
      "facadeStyle": "band",
      "windowRatio": 0.46,
      "extras": [
        "entrance"
      ],
      "summary": "低层生活公寓，六层行列式，临近生活服务中心",
      "tags": [
        "住宿",
        "低层"
      ]
    },
    {
      "id": "CAMPUS_DORM_L03",
      "name": "3号生活公寓",
      "category": "生活",
      "zone": "Z4",
      "type": "dorm",
      "form": "walkup",
      "position": [
        -446.5,
        0,
        -138
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 16
      },
      "floors": 6,
      "floorHeight": 3.2,
      "facade": "plaster",
      "roof": "pitched",
      "facadeStyle": "band",
      "windowRatio": 0.46,
      "extras": [
        "entrance"
      ],
      "summary": "低层生活公寓，六层行列式，临近生活服务中心",
      "tags": [
        "住宿",
        "低层"
      ]
    },
    {
      "id": "CAMPUS_CANTEEN_01",
      "name": "第一食堂",
      "category": "生活",
      "zone": "Z4",
      "type": "canteen",
      "form": "hall",
      "position": [
        -325,
        0,
        -273
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 34
      },
      "floors": 2,
      "floorHeight": 5.4,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.55,
      "extras": [
        "entrance",
        "canopy"
      ],
      "summary": "大型综合餐厅，含清真窗口与风味档口",
      "tags": [
        "餐饮"
      ]
    },
    {
      "id": "CAMPUS_STORE_01",
      "name": "校园超市",
      "category": "生活",
      "zone": "Z4",
      "type": "store",
      "form": "pavilion",
      "position": [
        -245,
        0,
        -278
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 24
      },
      "floors": 2,
      "floorHeight": 4.2,
      "facade": "glass",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.62,
      "extras": [
        "entrance",
        "sign"
      ],
      "summary": "日用百货与生鲜超市",
      "tags": [
        "生活服务"
      ]
    },
    {
      "id": "CAMPUS_CANTEEN_02",
      "name": "第二食堂",
      "category": "生活",
      "zone": "Z4",
      "type": "canteen",
      "form": "hall",
      "position": [
        -325,
        0,
        -146
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 32
      },
      "floors": 2,
      "floorHeight": 5.4,
      "facade": "concrete",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.52,
      "extras": [
        "entrance",
        "canopy"
      ],
      "summary": "风味餐饮与夜宵广场",
      "tags": [
        "餐饮"
      ]
    },
    {
      "id": "CAMPUS_CLINIC_01",
      "name": "校医院",
      "category": "服务",
      "zone": "Z4",
      "type": "clinic",
      "form": "box",
      "position": [
        -245,
        0,
        -144
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 28
      },
      "floors": 5,
      "floorHeight": 3.8,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "grid",
      "windowRatio": 0.45,
      "extras": [
        "entrance",
        "sign"
      ],
      "summary": "门诊、药房、口腔与体检中心",
      "tags": [
        "医疗"
      ]
    },
    {
      "id": "CAMPUS_CANTEEN_03",
      "name": "第三食堂",
      "category": "生活",
      "zone": "Z4",
      "type": "canteen",
      "form": "box",
      "position": [
        -135,
        0,
        -276
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 28
      },
      "floors": 3,
      "floorHeight": 4.6,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.5,
      "extras": [
        "entrance",
        "canopy"
      ],
      "summary": "高层公寓配套餐厅与便利超市",
      "tags": [
        "餐饮"
      ]
    },
    {
      "id": "CAMPUS_STORE_02",
      "name": "生活服务中心",
      "category": "生活",
      "zone": "Z4",
      "type": "store",
      "form": "pavilion",
      "position": [
        -54,
        0,
        -427
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 24
      },
      "floors": 2,
      "floorHeight": 4.2,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.5,
      "extras": [
        "entrance",
        "sign"
      ],
      "summary": "快递、理发、打印与学生事务一站式服务",
      "tags": [
        "生活服务"
      ]
    },
    {
      "id": "CAMPUS_GYM_01",
      "name": "综合体育馆",
      "category": "运动",
      "zone": "Z5",
      "type": "gym",
      "form": "barrel",
      "position": [
        225,
        0,
        152
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 44
      },
      "floors": 1,
      "floorHeight": 14,
      "facade": "metal",
      "roof": "curved",
      "facadeStyle": "curtain",
      "windowRatio": 0.4,
      "extras": [
        "entrance",
        "columns"
      ],
      "summary": "综合体育馆，筒壳屋面，含 6000 座看台与室内球场",
      "tags": [
        "体育",
        "场馆"
      ]
    },
    {
      "id": "CAMPUS_SPORTHALL_01",
      "name": "风雨操场",
      "category": "运动",
      "zone": "Z5",
      "type": "gym",
      "form": "fold",
      "position": [
        225,
        0,
        305
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 30
      },
      "floors": 1,
      "floorHeight": 10,
      "facade": "concrete",
      "roof": "curved",
      "facadeStyle": "grid",
      "windowRatio": 0.35,
      "extras": [
        "entrance"
      ],
      "summary": "折板屋面风雨操场，四季可用的室外球场",
      "tags": [
        "体育",
        "室外"
      ]
    },
    {
      "id": "CAMPUS_SPORTHALL_02",
      "name": "第二风雨操场",
      "category": "运动",
      "zone": "Z5",
      "type": "gym",
      "form": "fold",
      "position": [
        225,
        0,
        -95
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 30
      },
      "floors": 1,
      "floorHeight": 10,
      "facade": "concrete",
      "roof": "curved",
      "facadeStyle": "grid",
      "windowRatio": 0.35,
      "extras": [
        "entrance"
      ],
      "summary": "折板屋面风雨操场，配看台与灯光",
      "tags": [
        "体育",
        "室外"
      ]
    },
    {
      "id": "CAMPUS_GYM_02",
      "name": "第二体育馆",
      "category": "运动",
      "zone": "Z5",
      "type": "gym",
      "form": "saddle",
      "position": [
        225,
        0,
        90
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 40
      },
      "floors": 1,
      "floorHeight": 12,
      "facade": "metal",
      "roof": "curved",
      "facadeStyle": "curtain",
      "windowRatio": 0.42,
      "extras": [
        "entrance",
        "columns"
      ],
      "summary": "马鞍形屋面体育馆，含游泳馆与训练馆",
      "tags": [
        "体育",
        "场馆"
      ]
    },
    {
      "id": "CAMPUS_GREENHOUSE_01",
      "name": "教学温室大棚",
      "category": "科研",
      "zone": "Z7",
      "type": "greenhouse",
      "form": "arch",
      "position": [
        225,
        0,
        -275
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 30
      },
      "floors": 1,
      "floorHeight": 9,
      "facade": "glassRoof",
      "roof": "arched",
      "facadeStyle": "curtain",
      "windowRatio": 0.8,
      "extras": [
        "entrance"
      ],
      "summary": "植物实验与教学温室",
      "tags": [
        "科研",
        "农学"
      ]
    },
    {
      "id": "CAMPUS_GREENHOUSE_02",
      "name": "智能温室基地",
      "category": "科研",
      "zone": "Z7",
      "type": "greenhouse",
      "form": "arch",
      "position": [
        435,
        0,
        -275
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 30
      },
      "floors": 1,
      "floorHeight": 9,
      "facade": "glassRoof",
      "roof": "arched",
      "facadeStyle": "curtain",
      "windowRatio": 0.8,
      "extras": [
        "entrance"
      ],
      "summary": "连栋智能温室与植物工厂",
      "tags": [
        "科研",
        "农学"
      ]
    },
    {
      "id": "CAMPUS_AGRI_01",
      "name": "农学实训基地",
      "category": "科研",
      "zone": "Z7",
      "type": "store",
      "form": "box",
      "position": [
        435,
        0,
        -143
      ],
      "rotation": 0,
      "footprint": {
        "w": 72,
        "d": 26
      },
      "floors": 2,
      "floorHeight": 4.6,
      "facade": "brick",
      "roof": "flat",
      "facadeStyle": "grid",
      "windowRatio": 0.4,
      "extras": [
        "entrance"
      ],
      "summary": "农机具库与农产品加工实训车间",
      "tags": [
        "科研",
        "农学"
      ]
    },
    {
      "id": "CAMPUS_GATEHOUSE_01",
      "name": "南门门卫室（东）",
      "category": "服务",
      "zone": "Z8",
      "type": "gatehouse",
      "form": "pavilion",
      "position": [
        60,
        0,
        -490
      ],
      "rotation": 0,
      "footprint": {
        "w": 14,
        "d": 9
      },
      "floors": 1,
      "floorHeight": 3.6,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.5,
      "extras": [
        "entrance"
      ],
      "summary": "校园门卫值班岗亭",
      "tags": [
        "门卫"
      ]
    },
    {
      "id": "CAMPUS_GATEHOUSE_02",
      "name": "南门门卫室（西）",
      "category": "服务",
      "zone": "Z8",
      "type": "gatehouse",
      "form": "pavilion",
      "position": [
        -60,
        0,
        -490
      ],
      "rotation": 0,
      "footprint": {
        "w": 14,
        "d": 9
      },
      "floors": 1,
      "floorHeight": 3.6,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.5,
      "extras": [
        "entrance"
      ],
      "summary": "校园门卫值班岗亭",
      "tags": [
        "门卫"
      ]
    },
    {
      "id": "CAMPUS_GATEHOUSE_03",
      "name": "北门门卫室",
      "category": "服务",
      "zone": "Z2",
      "type": "gatehouse",
      "form": "pavilion",
      "position": [
        34,
        0,
        500
      ],
      "rotation": 0,
      "footprint": {
        "w": 14,
        "d": 9
      },
      "floors": 1,
      "floorHeight": 3.6,
      "facade": "plaster",
      "roof": "flat",
      "facadeStyle": "curtain",
      "windowRatio": 0.5,
      "extras": [
        "entrance"
      ],
      "summary": "校园门卫值班岗亭",
      "tags": [
        "门卫"
      ]
    }
  ],
  "water": [
    {
      "id": "CAMPUS_LAKE_01",
      "zone": "Z9",
      "name": "明理湖",
      "center": [
        100,
        20
      ],
      "rx": 65,
      "rz": 40,
      "depth": 2.6,
      "level": -0.45
    },
    {
      "id": "CAMPUS_POND_02",
      "zone": "Z7",
      "name": "荷塘",
      "center": [
        490,
        -375
      ],
      "rx": 26,
      "rz": 18,
      "depth": 1.6,
      "level": -0.35
    },
    {
      "id": "CAMPUS_POND_03",
      "zone": "Z6",
      "name": "映月池",
      "center": [
        -94,
        235
      ],
      "rx": 30,
      "rz": 20,
      "depth": 1.4,
      "level": -0.3
    }
  ],
  "courts": [
    {
      "id": "CAMPUS_TRACK_01",
      "zone": "Z5",
      "name": "田径场",
      "type": "track",
      "w": 176.91,
      "d": 92.52,
      "inner": [
        105,
        68
      ],
      "radius": 36.5,
      "outerRadius": 46.26,
      "straight": 84.39,
      "lanes": 8,
      "laneWidth": 1.22,
      "stagger": 0.3,
      "infield": [
        157.39,
        73
      ],
      "finishStraight": "south",
      "note": "标准 400m 塑胶跑道，8 道；量角线周长 400.00m；弯道倾角本版未实现，标记「待确认」。",
      "center": [
        285,
        230
      ]
    },
    {
      "id": "CAMPUS_TRACK_02",
      "zone": "Z5",
      "name": "第二田径场",
      "type": "track",
      "w": 176.91,
      "d": 92.52,
      "inner": [
        105,
        68
      ],
      "radius": 36.5,
      "outerRadius": 46.26,
      "straight": 84.39,
      "lanes": 8,
      "laneWidth": 1.22,
      "stagger": 0.3,
      "infield": [
        157.39,
        73
      ],
      "finishStraight": "south",
      "note": "标准 400m 塑胶跑道，8 道。",
      "center": [
        285,
        0
      ]
    },
    {
      "id": "CAMPUS_COURT_BASKET_01",
      "zone": "Z5",
      "type": "court",
      "name": "篮球场群",
      "center": [
        460,
        200
      ],
      "w": 56,
      "d": 36,
      "courts": 2
    },
    {
      "id": "CAMPUS_COURT_BASKET_02",
      "zone": "Z4",
      "type": "court",
      "name": "生活区篮球场",
      "center": [
        -94,
        -190
      ],
      "w": 56,
      "d": 36,
      "courts": 2
    },
    {
      "id": "CAMPUS_COURT_BASKET_03",
      "zone": "Z7",
      "type": "court",
      "name": "农学区篮球场",
      "center": [
        520,
        -210
      ],
      "w": 56,
      "d": 36,
      "courts": 2
    },
    {
      "id": "CAMPUS_COURT_TENNIS_01",
      "zone": "Z5",
      "type": "tennis",
      "name": "网球场",
      "center": [
        460,
        400
      ],
      "w": 34,
      "d": 22,
      "courts": 1
    },
    {
      "id": "CAMPUS_COURT_TENNIS_02",
      "zone": "Z5",
      "type": "tennis",
      "name": "第二网球场",
      "center": [
        460,
        0
      ],
      "w": 34,
      "d": 22,
      "courts": 1
    },
    {
      "id": "CAMPUS_COURT_TENNIS_03",
      "zone": "Z5",
      "type": "tennis",
      "name": "第三网球场",
      "center": [
        230,
        400
      ],
      "w": 34,
      "d": 22,
      "courts": 1
    },
    {
      "id": "CAMPUS_COURT_TENNIS_04",
      "zone": "Z3",
      "type": "tennis",
      "name": "行政区网球场",
      "center": [
        60,
        -340
      ],
      "w": 34,
      "d": 22,
      "courts": 1
    }
  ],
  "plazas": [
    {
      "id": "CAMPUS_PLAZA_MAIN",
      "zone": "Z9",
      "name": "中心广场",
      "center": [
        -94,
        20
      ],
      "w": 120,
      "d": 76
    },
    {
      "id": "CAMPUS_PLAZA_NORTH",
      "zone": "Z2",
      "name": "图书馆前广场",
      "center": [
        94,
        363
      ],
      "w": 130,
      "d": 52
    },
    {
      "id": "CAMPUS_PLAZA_GATE",
      "zone": "Z8",
      "name": "校门广场",
      "center": [
        0,
        -478
      ],
      "w": 80,
      "d": 34
    },
    {
      "id": "CAMPUS_PLAZA_SPORT",
      "zone": "Z5",
      "name": "体育馆前广场",
      "center": [
        323,
        152
      ],
      "w": 70,
      "d": 44
    },
    {
      "id": "CAMPUS_PLAZA_LIFE",
      "zone": "Z4",
      "name": "生活区广场",
      "center": [
        -94,
        -235
      ],
      "w": 60,
      "d": 40
    }
  ],
  "greenAreas": [
    {
      "id": "GREEN_01",
      "zone": "Z4",
      "name": "生活服务区绿地 1",
      "rect": [
        -578,
        -422,
        -395,
        -327
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_02",
      "zone": "Z4",
      "name": "生活服务区绿地 2",
      "rect": [
        -578,
        -274,
        -395,
        -147
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_03",
      "zone": "Z1",
      "name": "教学区绿地 3",
      "rect": [
        -578,
        -70,
        -395,
        70
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_04",
      "zone": "Z1",
      "name": "教学区绿地 4",
      "rect": [
        -502,
        70,
        -395,
        110
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_05",
      "zone": "Z1",
      "name": "教学区绿地 5",
      "rect": [
        -578,
        182,
        -395,
        210
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_06",
      "zone": "Z1",
      "name": "教学区绿地 6",
      "rect": [
        -578,
        210,
        -521,
        250
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_07",
      "zone": "Z1",
      "name": "教学区绿地 7",
      "rect": [
        -451,
        210,
        -395,
        250
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_08",
      "zone": "Z1",
      "name": "教学区绿地 8",
      "rect": [
        -578,
        250,
        -395,
        280
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_09",
      "zone": "Z1",
      "name": "教学区绿地 9",
      "rect": [
        -502,
        280,
        -395,
        320
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_10",
      "zone": "Z1",
      "name": "教学区绿地 10",
      "rect": [
        -578,
        392,
        -395,
        431
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_11",
      "zone": "Z4",
      "name": "生活服务区绿地 11",
      "rect": [
        -385,
        -439,
        -350,
        -405
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_12",
      "zone": "Z4",
      "name": "生活服务区绿地 12",
      "rect": [
        -316,
        -439,
        -254,
        -405
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_13",
      "zone": "Z4",
      "name": "生活服务区绿地 13",
      "rect": [
        -220,
        -439,
        -185,
        -405
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_14",
      "zone": "Z4",
      "name": "生活服务区绿地 14",
      "rect": [
        -385,
        -405,
        -185,
        -344
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_15",
      "zone": "Z4",
      "name": "生活服务区绿地 15",
      "rect": [
        -385,
        -344,
        -350,
        -310
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_16",
      "zone": "Z4",
      "name": "生活服务区绿地 16",
      "rect": [
        -316,
        -344,
        -254,
        -310
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_17",
      "zone": "Z4",
      "name": "生活服务区绿地 17",
      "rect": [
        -220,
        -344,
        -185,
        -310
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_18",
      "zone": "Z4",
      "name": "生活服务区绿地 18",
      "rect": [
        -385,
        -256,
        -185,
        -162
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_19",
      "zone": "Z1",
      "name": "教学区绿地 19",
      "rect": [
        -309,
        -110,
        -185,
        -70
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_20",
      "zone": "Z1",
      "name": "教学区绿地 20",
      "rect": [
        -385,
        -70,
        -185,
        114
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_21",
      "zone": "Z1",
      "name": "教学区绿地 21",
      "rect": [
        -309,
        130,
        -185,
        170
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_22",
      "zone": "Z1",
      "name": "教学区绿地 22",
      "rect": [
        -385,
        170,
        -185,
        284
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_23",
      "zone": "Z1",
      "name": "教学区绿地 23",
      "rect": [
        -309,
        284,
        -185,
        320
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_24",
      "zone": "Z1",
      "name": "教学区绿地 24",
      "rect": [
        -385,
        392,
        -185,
        425
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_25",
      "zone": "Z1",
      "name": "教学区绿地 25",
      "rect": [
        -309,
        425,
        -185,
        469
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_26",
      "zone": "Z4",
      "name": "生活服务区绿地 26",
      "rect": [
        -175,
        -399,
        -134,
        -351
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_27",
      "zone": "Z4",
      "name": "生活服务区绿地 27",
      "rect": [
        -54,
        -399,
        -13,
        -351
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_28",
      "zone": "Z4",
      "name": "生活服务区绿地 28",
      "rect": [
        -175,
        -344,
        -149.5,
        -310
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_29",
      "zone": "Z4",
      "name": "生活服务区绿地 29",
      "rect": [
        -115.5,
        -344,
        -72.5,
        -310
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_30",
      "zone": "Z4",
      "name": "生活服务区绿地 30",
      "rect": [
        -38.5,
        -344,
        -13,
        -310
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_31",
      "zone": "Z4",
      "name": "生活服务区绿地 31",
      "rect": [
        -99,
        -290,
        -13,
        -262
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_32",
      "zone": "Z4",
      "name": "生活服务区绿地 32",
      "rect": [
        -175,
        -255,
        -124,
        -215
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_33",
      "zone": "Z4",
      "name": "生活服务区绿地 33",
      "rect": [
        -64,
        -255,
        -13,
        -215
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_34",
      "zone": "Z4",
      "name": "生活服务区绿地 34",
      "rect": [
        -175,
        -208,
        -122,
        -172
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_35",
      "zone": "Z4",
      "name": "生活服务区绿地 35",
      "rect": [
        -66,
        -208,
        -13,
        -172
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_36",
      "zone": "Z4",
      "name": "生活服务区绿地 36",
      "rect": [
        -175,
        -164,
        -149.5,
        -130
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_37",
      "zone": "Z4",
      "name": "生活服务区绿地 37",
      "rect": [
        -115.5,
        -164,
        -72.5,
        -130
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_38",
      "zone": "Z4",
      "name": "生活服务区绿地 38",
      "rect": [
        -38.5,
        -164,
        -13,
        -130
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_39",
      "zone": "Z9",
      "name": "景观生态区绿地 39",
      "rect": [
        -175,
        -114,
        -13,
        -18
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_40",
      "zone": "Z9",
      "name": "景观生态区绿地 40",
      "rect": [
        -175,
        58,
        -13,
        114
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_41",
      "zone": "Z6",
      "name": "科研实训区绿地 41",
      "rect": [
        -175,
        164,
        -13,
        215
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_42",
      "zone": "Z6",
      "name": "科研实训区绿地 42",
      "rect": [
        -175,
        215,
        -124,
        255
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_43",
      "zone": "Z6",
      "name": "科研实训区绿地 43",
      "rect": [
        -64,
        215,
        -13,
        255
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_44",
      "zone": "Z6",
      "name": "科研实训区绿地 44",
      "rect": [
        -175,
        255,
        -13,
        288
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_45",
      "zone": "Z6",
      "name": "科研实训区绿地 45",
      "rect": [
        -175,
        370,
        -13,
        473
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_46",
      "zone": "Z3",
      "name": "行政办公区绿地 46",
      "rect": [
        89,
        -439,
        175,
        -409
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_47",
      "zone": "Z3",
      "name": "行政办公区绿地 47",
      "rect": [
        13,
        -409,
        175,
        -351
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_48",
      "zone": "Z3",
      "name": "行政办公区绿地 48",
      "rect": [
        77,
        -351,
        175,
        -329
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_49",
      "zone": "Z3",
      "name": "行政办公区绿地 49",
      "rect": [
        13,
        -329,
        175,
        -306
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_50",
      "zone": "Z3",
      "name": "行政办公区绿地 50",
      "rect": [
        13,
        -260,
        175,
        -200
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_51",
      "zone": "Z3",
      "name": "行政办公区绿地 51",
      "rect": [
        13,
        -200,
        66,
        -160
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_52",
      "zone": "Z3",
      "name": "行政办公区绿地 52",
      "rect": [
        122,
        -200,
        175,
        -160
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_53",
      "zone": "Z3",
      "name": "行政办公区绿地 53",
      "rect": [
        13,
        -160,
        175,
        -126
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_54",
      "zone": "Z9",
      "name": "景观生态区绿地 54",
      "rect": [
        13,
        -114,
        175,
        -20
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_55",
      "zone": "Z9",
      "name": "景观生态区绿地 55",
      "rect": [
        13,
        60,
        175,
        114
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_56",
      "zone": "Z2",
      "name": "图书中心区绿地 56",
      "rect": [
        13,
        170,
        175,
        275
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_57",
      "zone": "Z2",
      "name": "图书中心区绿地 57",
      "rect": [
        13,
        275,
        56,
        305
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_58",
      "zone": "Z2",
      "name": "图书中心区绿地 58",
      "rect": [
        132,
        275,
        175,
        305
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_59",
      "zone": "Z2",
      "name": "图书中心区绿地 59",
      "rect": [
        13,
        305,
        175,
        324
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_60",
      "zone": "Z2",
      "name": "图书中心区绿地 60",
      "rect": [
        13,
        389,
        175,
        423
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_61",
      "zone": "Z2",
      "name": "图书中心区绿地 61",
      "rect": [
        103,
        423,
        175,
        469
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_62",
      "zone": "Z7",
      "name": "农学生态示范区绿地 62",
      "rect": [
        185,
        -443,
        385,
        -399
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_63",
      "zone": "Z7",
      "name": "农学生态示范区绿地 63",
      "rect": [
        185,
        -399,
        240,
        -351
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_64",
      "zone": "Z7",
      "name": "农学生态示范区绿地 64",
      "rect": [
        330,
        -399,
        385,
        -351
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_65",
      "zone": "Z7",
      "name": "农学生态示范区绿地 65",
      "rect": [
        185,
        -351,
        385,
        -306
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_66",
      "zone": "Z7",
      "name": "农学生态示范区绿地 66",
      "rect": [
        261,
        -290,
        385,
        -260
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_67",
      "zone": "Z7",
      "name": "农学生态示范区绿地 67",
      "rect": [
        185,
        -250,
        300,
        -150
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_68",
      "zone": "Z7",
      "name": "农学生态示范区绿地 68",
      "rect": [
        185,
        -150,
        385,
        -126
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_69",
      "zone": "Z5",
      "name": "体育运动区绿地 69",
      "rect": [
        261,
        -110,
        385,
        -80
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_70",
      "zone": "Z5",
      "name": "体育运动区绿地 70",
      "rect": [
        185,
        -80,
        385,
        -46.3
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_71",
      "zone": "Z5",
      "name": "体育运动区绿地 71",
      "rect": [
        185,
        46.3,
        385,
        70
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_72",
      "zone": "Z5",
      "name": "体育运动区绿地 72",
      "rect": [
        261,
        70,
        385,
        110
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_73",
      "zone": "Z5",
      "name": "体育运动区绿地 73",
      "rect": [
        261,
        130,
        288,
        174
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_74",
      "zone": "Z5",
      "name": "体育运动区绿地 74",
      "rect": [
        358,
        130,
        385,
        174
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_75",
      "zone": "Z5",
      "name": "体育运动区绿地 75",
      "rect": [
        261,
        290,
        385,
        320
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_76",
      "zone": "Z5",
      "name": "体育运动区绿地 76",
      "rect": [
        185,
        336,
        385,
        382
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_77",
      "zone": "Z5",
      "name": "体育运动区绿地 77",
      "rect": [
        185,
        418,
        385,
        473
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_78",
      "zone": "Z7",
      "name": "农学生态示范区绿地 78",
      "rect": [
        395,
        -443,
        578,
        -393
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_79",
      "zone": "Z7",
      "name": "农学生态示范区绿地 79",
      "rect": [
        395,
        -393,
        464,
        -357
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_80",
      "zone": "Z7",
      "name": "农学生态示范区绿地 80",
      "rect": [
        516,
        -393,
        578,
        -357
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_81",
      "zone": "Z7",
      "name": "农学生态示范区绿地 81",
      "rect": [
        395,
        -357,
        578,
        -306
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_82",
      "zone": "Z7",
      "name": "农学生态示范区绿地 82",
      "rect": [
        471,
        -290,
        578,
        -260
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_83",
      "zone": "Z7",
      "name": "农学生态示范区绿地 83",
      "rect": [
        395,
        -260,
        578,
        -228
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_84",
      "zone": "Z7",
      "name": "农学生态示范区绿地 84",
      "rect": [
        395,
        -228,
        492,
        -192
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_85",
      "zone": "Z7",
      "name": "农学生态示范区绿地 85",
      "rect": [
        548,
        -228,
        578,
        -192
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_86",
      "zone": "Z7",
      "name": "农学生态示范区绿地 86",
      "rect": [
        395,
        -192,
        578,
        -156
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_87",
      "zone": "Z7",
      "name": "农学生态示范区绿地 87",
      "rect": [
        471,
        -156,
        578,
        -130
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_88",
      "zone": "Z5",
      "name": "体育运动区绿地 88",
      "rect": [
        395,
        -114,
        578,
        -11
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_89",
      "zone": "Z5",
      "name": "体育运动区绿地 89",
      "rect": [
        395,
        -11,
        443,
        11
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_90",
      "zone": "Z5",
      "name": "体育运动区绿地 90",
      "rect": [
        477,
        -11,
        578,
        11
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_91",
      "zone": "Z5",
      "name": "体育运动区绿地 91",
      "rect": [
        395,
        11,
        578,
        114
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_92",
      "zone": "Z5",
      "name": "体育运动区绿地 92",
      "rect": [
        395,
        126,
        578,
        182
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_93",
      "zone": "Z5",
      "name": "体育运动区绿地 93",
      "rect": [
        395,
        182,
        432,
        218
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_94",
      "zone": "Z5",
      "name": "体育运动区绿地 94",
      "rect": [
        488,
        182,
        578,
        218
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_95",
      "zone": "Z5",
      "name": "体育运动区绿地 95",
      "rect": [
        395,
        218,
        578,
        324
      ],
      "density": 0.55
    },
    {
      "id": "GREEN_96",
      "zone": "Z5",
      "name": "体育运动区绿地 96",
      "rect": [
        395,
        336,
        578,
        389
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_97",
      "zone": "Z5",
      "name": "体育运动区绿地 97",
      "rect": [
        395,
        389,
        443,
        411
      ],
      "density": 0.75
    },
    {
      "id": "GREEN_98",
      "zone": "Z5",
      "name": "体育运动区绿地 98",
      "rect": [
        477,
        389,
        578,
        411
      ],
      "density": 0.6000000000000001
    },
    {
      "id": "GREEN_99",
      "zone": "Z5",
      "name": "体育运动区绿地 99",
      "rect": [
        395,
        411,
        578,
        473
      ],
      "density": 0.7000000000000001
    },
    {
      "id": "GREEN_100",
      "zone": "Z9",
      "name": "外围西侧绿带",
      "rect": [
        -618,
        -430,
        -594,
        450
      ],
      "density": 0.6
    },
    {
      "id": "GREEN_101",
      "zone": "Z9",
      "name": "外围东侧绿带",
      "rect": [
        594,
        -430,
        618,
        450
      ],
      "density": 0.6
    },
    {
      "id": "GREEN_102",
      "zone": "Z9",
      "name": "北侧外围绿地（西）",
      "rect": [
        -570,
        490,
        -60,
        512
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_103",
      "zone": "Z9",
      "name": "北侧外围绿地（东）",
      "rect": [
        60,
        490,
        570,
        512
      ],
      "density": 0.65
    },
    {
      "id": "GREEN_104",
      "zone": "Z8",
      "name": "南侧校门外绿地（西）",
      "rect": [
        -230,
        -505,
        -80,
        -462
      ],
      "density": 0.5
    },
    {
      "id": "GREEN_105",
      "zone": "Z8",
      "name": "南侧校门外绿地（东）",
      "rect": [
        80,
        -505,
        230,
        -462
      ],
      "density": 0.5
    },
    {
      "id": "GREEN_AGRI",
      "zone": "Z7",
      "name": "农学实训基地田垄",
      "rect": [
        300,
        -250,
        380,
        -150
      ],
      "density": 0.9
    }
  ],
  "gates": [
    {
      "id": "CAMPUS_GATE_SOUTH",
      "zone": "Z8",
      "name": "南门（主校门）",
      "position": [
        0,
        -504
      ],
      "rotation": 0,
      "width": 56,
      "height": 12,
      "style": "grand"
    },
    {
      "id": "CAMPUS_GATE_NORTH",
      "zone": "Z8",
      "name": "北门",
      "position": [
        0,
        514
      ],
      "rotation": 0,
      "width": 32,
      "height": 9,
      "style": "simple"
    },
    {
      "id": "CAMPUS_GATE_WEST",
      "zone": "Z8",
      "name": "西校门",
      "position": [
        -592,
        60
      ],
      "rotation": 1.5707963267948966,
      "width": 24,
      "height": 8,
      "style": "simple"
    },
    {
      "id": "CAMPUS_GATE_EAST",
      "zone": "Z8",
      "name": "东校门",
      "position": [
        592,
        60
      ],
      "rotation": 1.5707963267948966,
      "width": 24,
      "height": 8,
      "style": "simple"
    }
  ],
  "landmarks": [
    {
      "id": "CAMPUS_SCULPT_01",
      "zone": "Z9",
      "name": "主广场雕塑",
      "type": "sculpture",
      "position": [
        -130,
        0,
        20
      ],
      "scale": 1,
      "style": "abstract"
    },
    {
      "id": "CAMPUS_SCULPT_02",
      "zone": "Z9",
      "name": "中心广场雕塑",
      "type": "sculpture",
      "position": [
        -58,
        0,
        20
      ],
      "scale": 1,
      "style": "abstract"
    },
    {
      "id": "CAMPUS_CLOCK_01",
      "zone": "Z9",
      "name": "钟塔",
      "type": "clocktower",
      "position": [
        40,
        0,
        20
      ],
      "scale": 1,
      "style": "modern"
    },
    {
      "id": "CAMPUS_SIGN_01",
      "zone": "Z8",
      "name": "校名墙",
      "type": "signwall",
      "position": [
        0,
        0,
        -496
      ],
      "scale": 1,
      "style": "stone"
    },
    {
      "id": "CAMPUS_STATUE_01",
      "zone": "Z9",
      "name": "建校纪念碑",
      "type": "monument",
      "position": [
        100,
        0,
        96
      ],
      "scale": 1,
      "style": "stone"
    },
    {
      "id": "CAMPUS_SCULPT_03",
      "zone": "Z5",
      "name": "运动区雕塑",
      "type": "sculpture",
      "position": [
        285,
        0,
        100
      ],
      "scale": 1,
      "style": "abstract"
    },
    {
      "id": "CAMPUS_STATUE_02",
      "zone": "Z4",
      "name": "生活区纪念碑",
      "type": "monument",
      "position": [
        -94,
        0,
        -150
      ],
      "scale": 1,
      "style": "stone"
    },
    {
      "id": "CAMPUS_SCULPT_04",
      "zone": "Z9",
      "name": "实训区雕塑",
      "type": "sculpture",
      "position": [
        -94,
        0,
        100
      ],
      "scale": 1,
      "style": "abstract"
    }
  ],
  "parking": [
    {
      "id": "CAMPUS_PARK_01",
      "zone": "Z7",
      "name": "东区停车场",
      "center": [
        285,
        -375
      ],
      "w": 90,
      "d": 48,
      "rows": 4,
      "cols": 16
    },
    {
      "id": "CAMPUS_PARK_02",
      "zone": "Z4",
      "name": "生活区停车场",
      "center": [
        -94,
        -375
      ],
      "w": 80,
      "d": 48,
      "rows": 4,
      "cols": 14
    },
    {
      "id": "CAMPUS_PARK_03",
      "zone": "Z5",
      "name": "运动区停车场",
      "center": [
        312,
        400
      ],
      "w": 76,
      "d": 36,
      "rows": 2,
      "cols": 14
    },
    {
      "id": "CAMPUS_PARK_04",
      "zone": "Z3",
      "name": "行政区停车场",
      "center": [
        94,
        -180
      ],
      "w": 56,
      "d": 40,
      "rows": 3,
      "cols": 10
    },
    {
      "id": "CAMPUS_PARK_05",
      "zone": "Z1",
      "name": "教学区停车场",
      "center": [
        -486,
        230
      ],
      "w": 70,
      "d": 40,
      "rows": 3,
      "cols": 12
    },
    {
      "id": "CAMPUS_PARK_06",
      "zone": "Z2",
      "name": "图书馆停车场",
      "center": [
        94,
        290
      ],
      "w": 76,
      "d": 30,
      "rows": 2,
      "cols": 14
    }
  ],
  "bridges": [
    {
      "id": "CAMPUS_BRIDGE_01",
      "zone": "Z9",
      "name": "湖心桥",
      "position": [
        100,
        0,
        20
      ],
      "rotation": 1.5707963267948966,
      "length": 100,
      "width": 10,
      "height": 4.6
    }
  ]
};

/** POI 类别白名单（用于 UI 分组与筛选） */
export const POI_CATEGORIES = ['教学', '图书', '行政', '生活', '运动', '科研', '景观', '服务', '交通', '纪念'];

/** 建筑类型 → 归属类别映射（供校验用） */
export const BUILDING_TYPES = [
  'teaching', 'college', 'lab', 'auditorium', 'library', 'office', 'dorm',
  'canteen', 'store', 'clinic', 'gym', 'greenhouse', 'gatehouse',
];

export default CAMPUS;
