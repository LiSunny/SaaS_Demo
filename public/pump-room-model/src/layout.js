/**
 * layout.js — 通用消防水泵房几何真值表
 *
 * ★ 唯一几何来源。任何模块都从这里读取，不得各自硬编码世界坐标。
 * ★ 本文件由 Chief（建模总控）编写并冻结，成员只读；需要调整先提变更，不得就地改写。
 *
 * 坐标：+X 东 / +Z 北 / +Y 上，单位米，原点在房间地平面几何中心。
 * 说明：three.js 为右手系（Y 向上），「X=东 / Z=北」属左手定向，此处作为工程约定使用；
 *       所有坐标均为相对量，模块之间无方位换算，不影响几何正确性与业务功能。
 *
 * ★★ position 字段的两种顺序（务必分清）★★
 *   · 本文件「对象级」position 一律为 [x, z, y]（平面在前、高度在后）：
 *       tanks.*.position / valves[].position / sump.pump.position
 *       architecture.door.position / architecture.window.position
 *       architecture.signage.*.position / lights.emergency.position
 *     其中 tanks.center / pumps.position / cabinets[].position / sumps[].position
 *     为二维 [x, z]。
 *   · 本文件「POI 级」position 一律为 [x, y, z]（与 POI_LIST、poi.js 的约定一致）：
 *       POI_LIST[].position
 *   · 为免误读，所有易错对象额外提供了具名字段 x / y / z，优先用具名字段。
 *
 * v1.0.0（标准配置：2 罐 + 3 泵（2 用 1 备）+ 2 面控制柜 + 2 座排污井）：
 *   - 房间 24.0 m(X) × 15.0 m(Z)，结构高 5.2 m，梁底净高 4.0 m
 *   - 北侧 2 座立式钢制消防水罐（R 2.6 m / 罐高 3.4 m）
 *   - 中部 3 台卧式单吸离心消防泵，泵轴心标高 0.85 m
 *   - 南侧 2 面立式水泵控制柜，1 面甲级防火门
 *   - 地面排水沟沿 X 通长，两端各 1 座排污井（集水坑）
 */

export const PUMP_ROOM = {
  meta: {
    id: 'PUMP_ROOM_GENERIC_001',
    name: '通用消防水泵房示例模型',
    version: '1.0.0',
    units: 'meter',
    upAxis: 'Y',
    description:
      '不绑定具体工程、按标准消防泵房配置试算的三维示例模型，用于业务平台的三维展示与功能验证。',
    standards: [
      'GB 50974-2014 消防给水及消火栓系统技术规范',
      'GB 50268-2008 给水排水管道工程施工及验收规范',
    ],
  },

  /* ════════════════════════════════════════════════════════════════════
   * 房间外壳
   * ════════════════════════════════════════════════════════════════════ */
  room: {
    bounds: { minX: -12, maxX: 12, minZ: -7.5, maxZ: 7.5 },
    /** 地坪面标高 */
    floorY: 0,
    /** 墙内侧完成面到梁底净高 */
    clearHeight: 4.0,
    /** 结构总高（地面到屋面板底 / 梁顶） */
    totalHeight: 5.2,
    /** 墙体厚度 */
    wallThickness: 0.24,
    /** 设备四周操作通道最小净宽（用于校核布置） */
    minAisle: 1.0,
  },

  /** 屋面梁：沿 X 方向跨越房间，底标高 = clearHeight */
  beams: {
    count: 4,
    zPositions: [-6.0, -2.0, 2.0, 6.0],
    width: 0.35,
    depth: 1.2,
    bottomY: 4.0,
    topY: 5.2,
  },

  /* ════════════════════════════════════════════════════════════════════
   * 消防水罐（北侧 2 座立式钢制水罐）
   * 坐标系说明：center 为 [x, z]；height 为筒体高；baseY 为罐底基座顶标高
   * ════════════════════════════════════════════════════════════════════ */
  tanks: [
    {
      id: 'TANK_01',
      name: '1# 消防水罐',
      category: '水罐',
      center: [-5.0, 4.6],
      radius: 2.6,
      height: 3.4,
      baseY: 0.2,
      wallThickness: 0.06,
      /** 罐顶锥形盖高 */
      roofHeight: 0.32,
      /** 侧壁下部出水口（南侧，法兰朝 -Z），接吸水母管 */
      outlet: { position: [-5.0, 2.0, 0.85], direction: 'south', dn: 200, flangeRadius: 0.17 },
      /** 检修人孔（顶盖中心） */
      manhole: { position: [-5.0, 4.6, 3.92], radius: 0.34, height: 0.16 },
      /** 呼吸阀 / 排气口（顶盖偏东） */
      vent: { position: [-3.6, 4.6, 3.9], radius: 0.08, height: 0.26 },
      /** 液位计（南侧立管） */
      levelGauge: { position: [-4.1, 1.94, 1.55], radius: 0.045, height: 2.4 },
      /** 检修爬梯（南侧） */
      ladder: { position: [-6.1, 1.9, 0], width: 0.46, height: 3.6 },
      /** 罐底泄水口（接排水） */
      drain: { position: [-5.0, 5.9, 0.24], dn: 80 },
    },
    {
      id: 'TANK_02',
      name: '2# 消防水罐',
      category: '水罐',
      center: [5.0, 4.6],
      radius: 2.6,
      height: 3.4,
      baseY: 0.2,
      wallThickness: 0.06,
      roofHeight: 0.32,
      outlet: { position: [5.0, 2.0, 0.85], direction: 'south', dn: 200, flangeRadius: 0.17 },
      manhole: { position: [5.0, 4.6, 3.92], radius: 0.34, height: 0.16 },
      vent: { position: [6.4, 4.6, 3.9], radius: 0.08, height: 0.26 },
      levelGauge: { position: [5.9, 1.94, 1.55], radius: 0.045, height: 2.4 },
      ladder: { position: [3.9, 1.9, 0], width: 0.46, height: 3.6 },
      drain: { position: [5.0, 5.9, 0.24], dn: 80 },
    },
  ],

  /* ════════════════════════════════════════════════════════════════════
   * 消防泵机组（3 台卧式单吸离心泵，2 用 1 备）
   * 局部坐标：position 为蜗壳中心 [x, z]，axisY 为轴心标高
   * 泵轴线沿 Z：电机在 -Z 侧，蜗壳吸入口朝 +Z，出水口朝 +Y
   * ════════════════════════════════════════════════════════════════════ */
  pumps: [
    {
      id: 'PUMP_01',
      name: '1# 消防主泵',
      duty: '主用',
      category: '水泵',
      position: [-6.0, -0.05],
      axisY: 0.85,
      model: 'XBD8/25-125',
      ratedFlow: '25 L/s',
      ratedHead: '0.32 MPa',
      ratedPower: '18.5 kW',
      status: 'running',
      dutyLabel: '主用',
    },
    {
      id: 'PUMP_02',
      name: '2# 消防主泵',
      duty: '主用',
      category: '水泵',
      position: [0.0, -0.05],
      axisY: 0.85,
      model: 'XBD8/25-125',
      ratedFlow: '25 L/s',
      ratedHead: '0.32 MPa',
      ratedPower: '18.5 kW',
      status: 'running',
      dutyLabel: '主用',
    },
    {
      id: 'PUMP_03',
      name: '3# 消防备用泵',
      duty: '备用',
      category: '水泵',
      position: [6.0, -0.05],
      axisY: 0.85,
      model: 'XBD8/25-125',
      ratedFlow: '25 L/s',
      ratedHead: '0.32 MPa',
      ratedPower: '18.5 kW',
      status: 'standby',
      dutyLabel: '备用',
    },
  ],

  /** 泵机组几何明细（各泵通用，模块内部据此拼装，不得硬编码世界坐标） */
  pumpGeometry: {
    /** 蜗壳：外径 0.84 / 轴向长 0.62 */
    volute: { radius: 0.42, length: 0.62 },
    /** 吸入口法兰面相对蜗壳中心的 +Z 偏移 */
    suctionFlangeOffset: 0.44,
    suctionFlangeRadius: 0.2,
    /** 出水口：蜗壳顶部，管内径 DN150 */
    dischargeRadius: 0.084,
    dischargeBaseY: 1.21,
    /** 联轴器护罩 */
    couplingGuard: { length: 0.26, size: 0.42 },
    /** 电机：长 0.95（Z 向）/ 直径 0.62 */
    motor: { length: 0.95, radius: 0.31 },
    motorFanCover: { length: 0.13, radius: 0.27 },
    /** 混凝土惯性底座 */
    skid: { width: 1.5, length: 3.25, height: 0.28 },
  },

  /* ════════════════════════════════════════════════════════════════════
   * 管道系统
   * ════════════════════════════════════════════════════════════════════ */
  pipes: {
    /** 吸水母管（DN200，沿 X） */
    suctionHeader: {
      id: 'PIPE_SUCTION',
      name: '吸水母管',
      dn: 200,
      radius: 0.11,
      z: 1.5,
      y: 0.85,
      xMin: -9.2,
      xMax: 9.2,
    },
    /** 出水母管（DN200，沿 X，东端穿墙） */
    dischargeHeader: {
      id: 'PIPE_DISCHARGE',
      name: '出水母管',
      dn: 200,
      radius: 0.11,
      z: -3.6,
      y: 1.65,
      xMin: -9.2,
      xMax: 12.0,
      /** 出墙穿墙套管 */
      wallSleeve: { x: 11.88, radius: 0.2, length: 0.3 },
    },
    /** 泵支管：DN150，母管 → 泵吸入口（沿 -Z） */
    suctionBranch: {
      dn: 150,
      radius: 0.084,
      /** 母管中心 Z → 泵吸入口法兰 Z */
      fromZ: 1.5,
      toZ: 0.39,
      y: 0.85,
    },
    /** 泵出水立管 + 横支管：DN150，蜗壳顶 → 出水母管 */
    dischargeBranch: {
      dn: 150,
      radius: 0.084,
      /** 立管顶标高 = 出水母管标高 */
      topY: 1.65,
      /** 立管所在 Z */
      riserZ: -0.05,
      /** 横支管终点 Z = 出水母管 Z */
      headerZ: -3.6,
    },
    /** 水罐出水短管：DN200，罐壁 → 吸水母管（沿 -Z） */
    tankOutletPipe: {
      dn: 200,
      radius: 0.11,
      fromZ: 2.0,
      toZ: 1.5,
      y: 0.85,
    },
    /** 管道支架：母管沿线每 3.0 m 一处 */
    support: { spacing: 3.0, width: 0.16, depth: 0.1 },
    /** 消防管道红色标识环：管段每 6.0 m 一道，宽 0.12 */
    markRing: { spacing: 6.0, width: 0.12 },
  },

  /* ════════════════════════════════════════════════════════════════════
   * 阀门（10 只）
   * orientation: 'x' 管道轴向沿 X / 'z' 沿 Z / 'y' 沿 Y（立管）
   * bbox: 该阀门的实际几何包围盒 [x, y, z]，含阀体与手轮，由 tools/sync_poi_bbox.mjs 实测回填
   * ════════════════════════════════════════════════════════════════════ */
  valves: [
    { id: 'VLV_01', name: '1# 泵吸水蝶阀', category: '阀门', type: '蝶阀', position: [-6.0, 1.0, 0.85], dn: 150, radius: 0.11, orientation: 'z', state: '开启', bbox: { min: [-6.11, 0.74, 0.907], max: [-5.875, 1.055, 1.093] } },
    { id: 'VLV_02', name: '2# 泵吸水蝶阀', category: '阀门', type: '蝶阀', position: [0.0, 1.0, 0.85], dn: 150, radius: 0.11, orientation: 'z', state: '开启', bbox: { min: [-0.11, 0.74, 0.907], max: [0.125, 1.055, 1.093] } },
    { id: 'VLV_03', name: '3# 泵吸水蝶阀', category: '阀门', type: '蝶阀', position: [6.0, 1.0, 0.85], dn: 150, radius: 0.11, orientation: 'z', state: '开启', bbox: { min: [5.875, 0.74, 0.907], max: [6.11, 1.055, 1.093] } },
    { id: 'VLV_04', name: '1# 泵出水蝶阀', category: '阀门', type: '蝶阀', position: [-6.0, -0.6, 1.65], dn: 150, radius: 0.11, orientation: 'z', state: '开启', bbox: { min: [-6.11, 1.54, -0.693], max: [-5.875, 1.855, -0.507] } },
    { id: 'VLV_05', name: '2# 泵出水蝶阀', category: '阀门', type: '蝶阀', position: [0.0, -0.6, 1.65], dn: 150, radius: 0.11, orientation: 'z', state: '开启', bbox: { min: [-0.11, 1.54, -0.693], max: [0.125, 1.855, -0.507] } },
    { id: 'VLV_06', name: '3# 泵出水蝶阀', category: '阀门', type: '蝶阀', position: [6.0, -0.6, 1.65], dn: 150, radius: 0.11, orientation: 'z', state: '开启', bbox: { min: [5.875, 1.54, -0.693], max: [6.11, 1.855, -0.507] } },
    { id: 'VLV_07', name: '吸水母管总阀', category: '阀门', type: '闸阀', position: [-8.9, 1.5, 0.85], dn: 200, radius: 0.13, orientation: 'x', state: '开启', bbox: { min: [-9.035, 0.68, 1.33], max: [-8.765, 1.075, 1.67] } },
    { id: 'VLV_08', name: '出水母管总阀', category: '阀门', type: '闸阀', position: [-8.9, -3.6, 1.65], dn: 200, radius: 0.13, orientation: 'x', state: '开启', bbox: { min: [-9.035, 1.48, -3.77], max: [-8.765, 1.875, -3.43] } },
    { id: 'VLV_09', name: '1# 水罐出水阀', category: '阀门', type: '蝶阀', position: [-5.0, 1.78, 0.85], dn: 200, radius: 0.13, orientation: 'z', state: '开启', bbox: { min: [-5.13, 0.72, 1.687], max: [-4.855, 1.075, 1.873] } },
    { id: 'VLV_10', name: '2# 水罐出水阀', category: '阀门', type: '蝶阀', position: [5.0, 1.78, 0.85], dn: 200, radius: 0.13, orientation: 'z', state: '开启', bbox: { min: [4.855, 0.72, 1.687], max: [5.13, 1.075, 1.873] } },
  ],

  /* ════════════════════════════════════════════════════════════════════
   * 水泵控制柜（南墙 2 面立式柜）
   * ════════════════════════════════════════════════════════════════════ */
  cabinets: [
    {
      id: 'CABINET_01',
      name: '1# 消防泵控制柜',
      category: '控制柜',
      position: [-3.2, -6.85],
      width: 1.0,
      depth: 0.62,
      height: 2.0,
      baseHeight: 0.1,
      /** 柜门朝向（法向） */
      facing: 'north',
      controls: ['主泵启动', '主泵停止', '备用泵切换', '手/自动'],
      indicator: { power: '运行', fault: '正常' },
    },
    {
      id: 'CABINET_02',
      name: '2# 消防泵控制柜',
      category: '控制柜',
      position: [-1.9, -6.85],
      width: 1.0,
      depth: 0.62,
      height: 2.0,
      baseHeight: 0.1,
      facing: 'north',
      controls: ['备泵启动', '备泵停止', '双泵联动', '手/自动'],
      indicator: { power: '运行', fault: '正常' },
    },
  ],

  /* ════════════════════════════════════════════════════════════════════
   * 排水系统：排水沟 + 2 座排污井（集水坑）
   * ════════════════════════════════════════════════════════════════════ */
  drainage: {
    /** 地面排水沟：沿 X 通长 */
    trench: {
      id: 'TRENCH_01',
      name: '泵房排水沟',
      z: -4.4,
      xMin: -10.4,
      xMax: 10.4,
      width: 0.4,
      depth: 0.15,
      /** 沟盖板 */
      cover: { thickness: 0.03, gap: 0.5 },
    },
    /** 排污井（集水坑）：排水沟两端 */
    sumps: [
      {
        id: 'SUMP_01',
        name: '1# 排污井',
        category: '排污井',
        position: [-10.4, -4.4],
        size: 1.2,
        depth: 1.6,
        /** 格栅盖板与地面齐平 */
        cover: { thickness: 0.04, barWidth: 0.05, barGap: 0.11 },
        /** 井内潜水排污泵 */
        pump: { model: 'WQ50-20', power: '3.0 kW', position: [-10.4, -4.4, 0.18] },
        /** 排水立管 DN50 沿墙上升 */
        dischargePipe: { dn: 50, radius: 0.03, wall: 'west', topY: 2.4 },
      },
      {
        id: 'SUMP_02',
        name: '2# 排污井',
        category: '排污井',
        position: [10.4, -4.4],
        size: 1.2,
        depth: 1.6,
        cover: { thickness: 0.04, barWidth: 0.05, barGap: 0.11 },
        pump: { model: 'WQ50-20', power: '3.0 kW', position: [10.4, -4.4, 0.18] },
        dischargePipe: { dn: 50, radius: 0.03, wall: 'east', topY: 2.4 },
      },
    ],
  },

  /* ════════════════════════════════════════════════════════════════════
   * 建筑构件：门 / 窗 / 电缆桥架
   * ════════════════════════════════════════════════════════════════════ */
  architecture: {
    /** 甲级防火门（南墙偏东） */
    door: {
      id: 'DOOR_01',
      name: '甲级防火门',
      wall: 'south',
      position: [8.0, -7.5, 0],
      /** 具名坐标（与 position 等价，避免顺序误读）：门扇中心所在墙面点 */
      x: 8.0,
      y: 0.0,
      z: -7.5,
      width: 1.2,
      height: 2.1,
      thickness: 0.06,
      openDirection: 'north',
      leafColor: '#B23A2E',
    },
    /** 东墙观察窗 */
    window: {
      id: 'WINDOW_01',
      name: '观察窗',
      wall: 'east',
      position: [12.0, 1.0, 0],
      /** 具名坐标：窗洞中心所在墙面点（y 为窗台标高，另见 sillY） */
      x: 12.0,
      y: 0.0,
      z: 1.0,
      width: 1.8,
      height: 1.2,
      sillY: 1.6,
      thickness: 0.08,
    },
    /** 电缆桥架：主干沿南墙，支干通达每台泵电机上方 */
    cableTray: {
      main: { z: -7.05, y: 2.55, xMin: -3.9, xMax: 7.0, width: 0.4 },
      branches: [
        { x: -6.0, fromZ: -7.05, toZ: -0.9, y: 2.55, width: 0.3 },
        { x: 0.0, fromZ: -7.05, toZ: -0.9, y: 2.55, width: 0.3 },
        { x: 6.0, fromZ: -7.05, toZ: -0.9, y: 2.55, width: 0.3 },
      ],
    },
    /** 标识牌：房号牌 + 设备标牌 */
    signage: {
      roomPlate: {
        position: [7.35, -7.36, 1.75],
        /** 具名坐标 */
        x: 7.35,
        y: 1.75,
        z: -7.36,
        width: 0.5,
        height: 0.3,
        text: '消防水泵房',
      },
      pumpPlates: [
        { position: [-6.0, -1.85, 1.35], x: -6.0, y: 1.35, z: -1.85, width: 0.42, height: 0.26, text: '1# 消防主泵' },
        { position: [0.0, -1.85, 1.35], x: 0.0, y: 1.35, z: -1.85, width: 0.42, height: 0.26, text: '2# 消防主泵' },
        { position: [6.0, -1.85, 1.35], x: 6.0, y: 1.35, z: -1.85, width: 0.42, height: 0.26, text: '3# 消防备用泵' },
      ],
    },
  },

  /* ════════════════════════════════════════════════════════════════════
   * 照明灯具（8 盏 LED 吸顶工矿灯）
   * ════════════════════════════════════════════════════════════════════ */
  lights: {
    mountingY: 3.9,
    xPositions: [-8.5, -3.0, 3.0, 8.5],
    zPositions: [1.2, -5.2],
    /** 灯具外形：长 1.2 / 宽 0.3 */
    fixture: { length: 1.2, width: 0.3, height: 0.12 },
    /** 光源参数 */
    source: { color: '#FFF4E0', intensity: 1.0, distance: 14, decay: 1.6 },
    /** 应急照明（出口方向，门上方） */
    emergency: {
      position: [8.0, -7.2, 2.6],
      /** 具名坐标 */
      x: 8.0,
      y: 2.6,
      z: -7.2,
      intensity: 0.6,
    },
  },

  /* ════════════════════════════════════════════════════════════════════
   * POI 类别（业务平台消费）
   * id 与 POI_LIST 的 category 字段取值一致，一一对应
   * ════════════════════════════════════════════════════════════════════ */
  poiCategories: [
    { id: '房间', name: '房间', color: '#7A8CA3' },
    { id: '水罐', name: '水罐', color: '#2F7FBF' },
    { id: '水泵', name: '水泵', color: '#1E9E6A' },
    { id: '阀门', name: '阀门', color: '#C0392B' },
    { id: '管道', name: '管道', color: '#E08A3C' },
    { id: '控制柜', name: '控制柜', color: '#8E6BD1' },
    { id: '排污井', name: '排污井', color: '#6B7A8F' },
  ],
};

/* ══════════════════════════════════════════════════════════════════════
 * POI 清单（几何真值表直接给出，模块只负责把对应网格挂到 POI id 上）
 * ══════════════════════════════════════════════════════════════════════ */

export const POI_LIST = [
  {
    id: 'PR_ROOM_01',
    name: '消防水泵房',
    category: '房间',
    type: 'area',
    position: [0, 0, 0],
    anchor: 'center',
    bbox: { min: [-12.3, -0.2, -7.8], max: [12.3, 5.4, 7.8] },
    summary: '24.0 m × 15.0 m 消防水泵房，梁底净高 4.0 m，配置 2 罐 3 泵 2 柜 2 井。',
    tags: ['泵房', '消防给水'],
    meta: { area: 360, clearHeight: 4.0, deviceCount: 19 },
  },
  {
    id: 'PR_TANK_01',
    name: '1# 消防水罐',
    category: '水罐',
    type: 'facility',
    position: [-5.0, 0.2, 1.9],
    anchor: 'ground',
    bbox: { min: [-7.6, 0, 1.788], max: [-2.4, 3.92, 7.2] },
    summary: '立式钢制消防水罐，有效容积 60 m³，出水口 DN200 接吸水母管。',
    tags: ['消防水罐', '储水'],
    meta: { radius: 2.6, height: 3.4, capacity: 60 },
  },
  {
    id: 'PR_TANK_02',
    name: '2# 消防水罐',
    category: '水罐',
    type: 'facility',
    position: [5.0, 0.2, 1.9],
    anchor: 'ground',
    bbox: { min: [2.4, 0, 1.788], max: [7.6, 3.92, 7.2] },
    summary: '立式钢制消防水罐，与 1# 罐并联供水，出水口 DN200 接吸水母管。',
    tags: ['消防水罐', '储水'],
    meta: { radius: 2.6, height: 3.4, capacity: 60 },
  },
  {
    id: 'PR_PUMP_01',
    name: '1# 消防主泵',
    category: '水泵',
    type: 'facility',
    position: [-6.0, 0, -0.05],
    anchor: 'center',
    bbox: { min: [-6.75, 0, -2.375], max: [-5.25, 1.251, 0.875] },
    summary: 'XBD8/25-125 卧式单吸离心消防泵，25 L/s / 0.32 MPa / 18.5 kW，主用。',
    tags: ['消防泵', '主用'],
    meta: { model: 'XBD8/25-125', flow: '25 L/s', head: '0.32 MPa', power: '18.5 kW', status: '运行' },
  },
  {
    id: 'PR_PUMP_02',
    name: '2# 消防主泵',
    category: '水泵',
    type: 'facility',
    position: [0, 0, -0.05],
    anchor: 'center',
    bbox: { min: [-0.75, 0, -2.375], max: [0.75, 1.251, 0.875] },
    summary: 'XBD8/25-125 卧式单吸离心消防泵，25 L/s / 0.32 MPa / 18.5 kW，主用。',
    tags: ['消防泵', '主用'],
    meta: { model: 'XBD8/25-125', flow: '25 L/s', head: '0.32 MPa', power: '18.5 kW', status: '运行' },
  },
  {
    id: 'PR_PUMP_03',
    name: '3# 消防备用泵',
    category: '水泵',
    type: 'facility',
    position: [6.0, 0, -0.05],
    anchor: 'center',
    bbox: { min: [5.25, 0, -2.375], max: [6.75, 1.251, 0.875] },
    summary: 'XBD8/25-125 卧式单吸离心消防泵，与主泵互备，常态停机待命。',
    tags: ['消防泵', '备用'],
    meta: { model: 'XBD8/25-125', flow: '25 L/s', head: '0.32 MPa', power: '18.5 kW', status: '备用' },
  },
  {
    id: 'PR_CABINET_01',
    name: '1# 消防泵控制柜',
    category: '控制柜',
    type: 'facility',
    position: [-3.2, 0, -6.54],
    anchor: 'ground',
    bbox: { min: [-3.71, 0, -7.16], max: [-2.7, 2.1, -6.48] },
    summary: '1# 主泵就地控制柜，手/自动切换、主泵启停、双泵联动。',
    tags: ['控制柜', '电气'],
    meta: { width: 1.0, depth: 0.62, height: 2.0 },
  },
  {
    id: 'PR_CABINET_02',
    name: '2# 消防泵控制柜',
    category: '控制柜',
    type: 'facility',
    position: [-1.9, 0, -6.54],
    anchor: 'ground',
    bbox: { min: [-2.41, 0, -7.16], max: [-1.4, 2.1, -6.48] },
    summary: '2# 备泵就地控制柜，备泵启停、与主泵互备切换。',
    tags: ['控制柜', '电气'],
    meta: { width: 1.0, depth: 0.62, height: 2.0 },
  },
  {
    id: 'PR_SUMP_01',
    name: '1# 排污井',
    category: '排污井',
    type: 'facility',
    position: [-10.4, 0, -4.4],
    anchor: 'ground',
    bbox: { min: [-12.3, -1.75, -5.12], max: [-9.68, 2.445, -3.68] },
    summary: '集水坑式排污井，井深 1.6 m，内设 WQ50-20 潜水排污泵，带铸铁格栅盖板。',
    tags: ['排污井', '集水坑'],
    meta: { size: 1.2, depth: 1.6, pump: 'WQ50-20' },
  },
  {
    id: 'PR_SUMP_02',
    name: '2# 排污井',
    category: '排污井',
    type: 'facility',
    position: [10.4, 0, -4.4],
    anchor: 'ground',
    bbox: { min: [9.68, -1.75, -5.12], max: [12.3, 2.445, -3.68] },
    summary: '集水坑式排污井，井深 1.6 m，内设 WQ50-20 潜水排污泵，带铸铁格栅盖板。',
    tags: ['排污井', '集水坑'],
    meta: { size: 1.2, depth: 1.6, pump: 'WQ50-20' },
  },
  {
    id: 'PR_PIPE_SUCTION',
    name: '吸水母管',
    category: '管道',
    type: 'facility',
    position: [0, 0.85, 1.5],
    anchor: 'center',
    bbox: { min: [-9.2, 0.74, 1.39], max: [9.2, 0.96, 1.61] },
    summary: 'DN200 消防吸水母管，汇接 2 座水罐出水并向 3 台泵吸水支管分配。',
    tags: ['吸水母管', 'DN200'],
    meta: { dn: 200, length: 18.4 },
  },
  {
    id: 'PR_PIPE_DISCHARGE',
    name: '出水母管',
    category: '管道',
    type: 'facility',
    position: [1.4, 1.65, -3.6],
    anchor: 'center',
    bbox: { min: [-9.2, 1.54, -3.71], max: [12.0, 1.76, -3.49] },
    summary: 'DN200 消防出水母管，汇接 3 台泵出水，东端穿墙接室内消火栓环网。',
    tags: ['出水母管', 'DN200'],
    meta: { dn: 200, length: 21.2 },
  },
  ...PUMP_ROOM.valves.map((v) => ({
    id: `PR_${v.id}`,
    name: v.name,
    category: '阀门',
    type: 'facility',
    position: [v.position[0], v.position[2], v.position[1]],
    anchor: 'center',
    bbox: v.bbox,
    summary: `${v.type}，DN${v.dn}，${v.state}。`,
    tags: ['阀门', v.type],
    meta: { dn: v.dn, type: v.type, state: v.state },
  })),
];

export default PUMP_ROOM;

/**
 * 对象级 position（顺序 [x, z, y]）→ 具名坐标。
 * ⚠ 只用于「对象级」字段（tanks.*.position / valves[].position / architecture.*.position /
 *   lights.emergency.position / sump.pump.position）。
 *   POI_LIST[].position 本身就是 [x, y, z]，不要用本函数转换。
 *
 * @param {number[]} pos
 * @returns {{x:number, y:number, z:number}}
 */
export function objPos(pos) {
  return { x: pos[0], y: pos[2], z: pos[1] };
}
