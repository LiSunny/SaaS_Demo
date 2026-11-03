# 通用消防水泵房三维建模 · 接口契约（CONTRACT）

> 版本 v1.0.0 ｜ 冻结于建模总控 ｜ 全体成员只读
> 本文件 + `src/layout.js` + `src/core/rng.js` + `src/core/poi.js` 是**唯一基线**。
> 需要改动基线，先在群内提变更，不得就地改写。

---

## 一、目标与范围

搭建**通用**消防水泵房三维示例模型（不绑定具体工程），按标准配置试算：

| 要素 | 数量 | 规格 |
|---|---|---|
| 消防水罐 | 2 座 | 立式钢制罐，R 2.6 m，筒体高 3.4 m，底标高 0.2 m |
| 消防水泵 | 3 台 | 卧式单吸离心泵，2 用 1 备，轴心标高 0.85 m |
| 控制柜 | 2 面 | 立式，1.0 × 0.62 × 2.0 m，靠南墙 |
| 排污井 | 2 座 | 集水坑式，1.2 × 1.2 m，井深 1.6 m |
| 管道 | 2 母管 + 6 支管 | 吸水母管 DN200、出水母管 DN200、泵支管 DN150 |
| 阀门 | 10 只 | 蝶阀 ×8、闸阀 ×2 |

房间 24.0 m(X) × 15.0 m(Z)，梁底净高 4.0 m，结构高 5.2 m。

---

## 二、目录结构与文件归属

```
public/pump-room-model/
├── index.html              ← 引擎集成师
├── styles.css              ← 引擎集成师
├── CONTRACT.md             ← 基线（只读）
├── src/
│   ├── layout.js           ← 基线（只读，几何真值表）
│   ├── app.js              ← 引擎集成师
│   ├── core/
│   │   ├── rng.js          ← 基线（只读）
│   │   ├── poi.js          ← 基线（只读）
│   │   └── materials.js    ← 材质贴图师
│   ├── modules/
│   │   ├── shell.js        ← 土建与给排水师
│   │   ├── tanks.js        ← 水罐师
│   │   ├── pumps.js        ← 泵组师
│   │   ├── piping.js       ← 管路阀门师
│   │   ├── electrical.js   ← 控制柜电气师
│   │   └── lighting.js     ← 灯光渲染师
│   └── assets/
│       └── manifest.json   ← 引擎集成师（运行时导出，非手写）
└── vendor/three/           ← 基线（只读，本地 three.module.js）
```

**文件归属互斥**：每个成员只写自己的文件。并行写入冲突一律由总控仲裁。

---

## 三、坐标与单位约定

- 单位**米**；**+Y 向上**；原点 = 房间地平面几何中心 (0, 0, 0)。
- `+X` 东、`+Z` 北（工程约定，右手系下为左手定向，不影响几何正确性）。
- 尺寸写进 `layout.js` 的真值表，模块内部**禁止**出现世界坐标字面量。
- 允许在模块内部写**局部几何尺寸**（如「电机直径 0.62」），前提是该尺寸也来自 `layout.js` 或模块顶部的常量区，并在文件头注释标明。

### ★ position 字段有两种顺序，务必分清

| 域 | 字段 | 顺序 |
|---|---|---|
| **对象级** | `tanks.*.position`、`valves[].position`、`drainage.sumps[].pump.position`、`architecture.door.position`、`architecture.window.position`、`architecture.signage.*.position`、`lights.emergency.position` | **`[x, z, y]`**（平面在前、高度在后） |
| **对象级（二维）** | `tanks[].center`、`pumps[].position`、`cabinets[].position`、`drainage.sumps[].position` | **`[x, z]`** |
| **POI 级** | `POI_LIST[].position` | **`[x, y, z]`**（与 `core/poi.js` 一致） |

**推荐写法**：`layout.js` 已为易错对象补了具名字段 `x` / `y` / `z`（门、窗、标识牌、应急照明），优先直接读具名字段。
需要从数组取值时用基线导出的辅助函数：

```js
import { objPos } from '../layout.js';
const { x, y, z } = objPos(valve.position);   // 仅用于对象级字段
```

⚠ `objPos` **不能**用于 `POI_LIST[].position`（那本来就是 `[x, y, z]`）。

---

## 四、模块接口契约

### 4.1 统一导出签名

每个 `src/modules/*.js` 必须导出：

```js
/**
 * @param {object} ctx 见 4.2
 * @returns {THREE.Group} 独立分组，模块内所有网格挂在此 group 下
 */
export function buildXxx(ctx) { ... }

export default buildXxx;
```

`buildXxx` 中 `Xxx` 必须与文件名一致：`buildShell` / `buildTanks` / `buildPumps` / `buildPiping` / `buildElectrical` / `buildLighting`。

### 4.2 共享上下文 ctx

```js
ctx = {
  THREE,          // three.js 模块
  mat,            // (name: string) => THREE.Material  材质库取用函数
  rng,            // () => number  可复现伪随机（禁止 Math.random）
  pois,           // POI 注册表：{ add(poi), get(id), list(), byCategory(c), size() }
  layout,         // PUMP_ROOM 几何真值表（只读）
  options,        // { quality: 'high'|'medium'|'low', wireframe: boolean }
}
```

### 4.3 材质库契约

材质贴图师必须实现 `createMaterials(THREE)`，返回：

```js
{
  get(name) { /* 返回 THREE.Material */ },
  dispose() { /* 释放全部材质与贴图 */ }
}
```

**必须实现的材质名**（缺失即视为不合格）：

| 名称 | 用途 | 建议基色/质感 |
|---|---|---|
| `floor` | 泵房环氧防滑地坪 | 深灰 `#4a4d52`，细颗粒防滑 |
| `wall` | 墙体（水泥抹灰/涂料） | 浅灰 `#b9b5ab` |
| `ceiling` | 顶棚 | 浅灰白 `#c8c5bd` |
| `beam` | 屋面梁 | 混凝土灰 `#a5a29a` |
| `door` | 甲级防火门 | 消防红 `#B23A2E` |
| `windowGlass` | 观察窗玻璃 | 半透明浅青 |
| `steelTank` | 水罐筒体 | 不锈钢拉丝 `#c3c8cc` |
| `steelPipe` | 管道本体 | 镀锌灰 `#9aa0a6` |
| `pipeMarkRed` | 消防管道红色标识环 | `#C0392B` |
| `valveBody` | 阀门阀体 | 深灰 `#6e7378` |
| `valveHandle` | 阀门手轮 | 消防红 `#C0392B` |
| `pumpCasing` | 泵蜗壳 | 铸铁蓝 `#2f5d8c` |
| `motorBody` | 电机 | 深灰绿 `#4a5a52` |
| `skid` | 混凝土惯性底座 | 混凝土灰 `#9d9a92` |
| `guard` | 联轴器护罩 | 安全黄 `#d8a21a` |
| `cabinet` | 控制柜柜体 | 浅灰 RAL7035 `#c9cbc8` |
| `cabinetDoor` | 控制柜柜门 | 稍深 `#b6b8b5` |
| `cabinetBase` | 控制柜底座 | 深灰 `#7c7f82` |
| `indicatorOn` | 指示灯（运行/绿） | `#2ecc71` 自发光 |
| `indicatorOff` | 指示灯（停/灰） | `#4a4d50` |
| `indicatorFault` | 故障指示（红） | `#e74c3c` 自发光 |
| `grating` | 格栅盖板 | 铸铁黑 `#3a3d40` |
| `sumpWall` | 排污井井壁 | 混凝土灰 `#8e8b84` |
| `trench` | 排水沟沟体 | 深灰 `#55585c` |
| `cableTray` | 电缆桥架 | 镀锌灰 `#a8adb2` |
| `cable` | 电缆 | 黑 `#2a2c2f` |
| `lampShell` | 灯具外壳 | 浅灰 `#cfd2d5` |
| `lampGlow` | 灯管发光面 | 暖白 `#FFF4E0` 自发光 |
| `signPlate` | 标牌底板 | 白 `#efefef` |
| `signText` | 标牌文字 | 深蓝 `#1b3a5c` |
| `water` | 水罐内水面 | 青蓝 `#2d7f9e`，半透明 |

**硬性要求**：
- 零外部贴图依赖，全部用 Canvas 程序化绘制并缓存，贴图尺寸 ≤ 256×256。
- 模块内**不得**私自 `new THREE.MeshStandardMaterial`，一律 `ctx.mat('xxx')` 取用。
- 同一材质实例在全场景复用（避免 draw call 膨胀）。

### 4.4 POI 注册契约

`layout.js` 的 `POI_LIST` 已给出全部 POI 的 id / 名称 / 类别 / 坐标 / 包围盒。

模块**不得**自行新增 POI id，只做**挂接**：把属于该 POI 的网格登记到对应 id，使拾取命中。

推荐做法（由引擎集成师提供的统一约定）：

```js
// 模块内：把网格挂到 POI
const g = new THREE.Group();
g.name = 'PR_PUMP_01';
// ... 构建网格，加入 g
ctx.pois.attach('PR_PUMP_01', g);   // 若基线无 attach，见 4.5
```

**4.5 POI 挂接口径（已实现，不需等待）**：

`core/poi.js` 已实现 `register(poiId, mesh)` / `meshesOf(poiId)` / `meshCount()`。
引擎集成师在 ctx 中同时提供两个等价入口，成员**任选其一**使用：

```js
ctx.pois.register('PR_PUMP_01', mesh);     // 直接用基线 store
ctx.poiIndex.register('PR_PUMP_01', mesh);  // 引擎集成师提供的别名
```

约定：
- `register` 会自动把 `mesh.userData.poiId` 写成该 POI id（仅当未设置时），无需模块自行赋值。
- 挂接的网格必须**已加入场景图**（即在模块返回的 group 之内），否则拾取拿不到。
- 模块**不得**新增 POI id；id 清单以 `layout.js` 的 `POI_LIST` 为准。

### 4.6 网格命名

模块产出的网格需带可读名称，便于排查：

```
<模块前缀>_<对象>_<序号>   例：PUMP_01_VOLUTE、PIPE_SUCTION_SEG_03、VALVE_03_BODY
```

同时给关键网格设置 `userData.poiId = 'PR_XXX'`，供射线拾取精确命中。

---

## 五、硬性禁止

1. **禁止任何 CDN / 外部网络请求**：three.js 用本地 `../vendor/three/three.module.js`。
2. **禁止外部素材文件**（贴图、模型、字体），全部程序化生成。
3. **禁止 `Math.random()`**：统一用 `ctx.rng()`（mulberry32，可复现）。
4. **禁止硬编码世界坐标**：位置一律从 `ctx.layout` 读取。
5. **禁止修改基线文件**：`layout.js` / `core/rng.js` / `core/poi.js` / `CONTRACT.md`。
6. **禁止 `console.log` 调试残留**：仅保留必要错误日志。
7. 不得改写他人文件。

---

## 六、各模块交付要求

| 模块 | 负责人 | 必须包含 |
|---|---|---|
| `shell.js` | 土建与给排水师 | 地坪、四周墙体、梁、顶棚、甲级防火门、观察窗、地面排水沟 + 沟盖板、2 座排污井（井壁 / 格栅盖板 / 潜水泵 / 排水立管）、墙裙与必要的防撞标识 |
| `tanks.js` | 水罐师 | 2 座水罐：基座、筒体、锥形顶盖、人孔、呼吸阀、液位计立管、检修爬梯、进出水法兰与短管、罐底泄水管 |
| `pumps.js` | 泵组师 | 3 台机组：混凝土惯性底座、泵蜗壳（带吸入口法兰 / 顶部出水口）、联轴器护罩、电机 + 风扇罩 + 支座、泵体支腿、就地压力表与电气接线盒 |
| `piping.js` | 管路阀门师 | 吸水母管、出水母管（含穿墙套管）、3 条泵吸水支管、3 条泵出水立管 + 横支管、2 条水罐出水短管、管件（弯头 / 三通）、管道支架、红色标识环、10 只阀门（阀体 + 手轮 + 铭牌）、压力表 |
| `electrical.js` | 控制柜电气师 | 2 面控制柜（柜体 / 柜门 / 底座 / 指示灯 / 按钮 / 仪表 / 铭牌）、电缆桥架主干与 3 条支干、桥架内电缆、房号牌与 3 块泵标牌 |
| `lighting.js` | 灯光渲染师 | 8 盏工矿灯灯具模型 + 点光源、应急照明、灯具吊杆；并导出运行时开/关灯接口 |
| `materials.js` | 材质贴图师 | 4.3 表中全部材质名 + `get` / `dispose` |

### 6.1 lighting.js 额外导出

```js
export function buildLighting(ctx) { ... }          // 返回 { group, setOn(bool) }
export function setLightingOn(state) { ... }        // 可选：全局开关
```

`buildLighting` 返回值需带 `setOn(enabled)` 方法，引擎集成师据此做灯光开关。

### 6.2 几何校核要求

每个模块写完必须自查并在交付说明里给出数值：

- 管道中心线是否与 `layout.pipes` 完全一致（误差 ≤ 1 mm）。
- 阀门位置是否与 `layout.valves` 完全一致。
- 设备与墙面/相邻设备的净距是否 ≥ `layout.room.minAisle`（1.0 m）。
- 设备最高点是否低于梁底净高 4.0 m。
- 三角面数与网格数（自估或实测，给出量级即可）。

---

## 七、自检与交付

交付前必须实际执行并贴出结果：

```bash
# 1. 语法自检
node --check public/pump-room-model/src/modules/<你的文件>.js

# 2. 导入自检（确认导出名正确）
node -e "import('./public/pump-room-model/src/modules/<你的文件>.js')
  .then(m=>console.log(Object.keys(m)))"
```

> 注：模块依赖 three.js，浏览器外直接 import 可能因 `three` 裸导入失败。
> 此时以 `node --check` 为准，并用 `grep` 自检导出名；**不要**为此引入构建工具或改写 import 形式。

交付说明必须包含：

1. 交付文件路径与行数；
2. 实现的要点（几何构成、材质使用、POI 挂接情况）；
3. 实际执行的命令与输出（命令 + 真实结果，不许省略）；
4. 已知不足与未完成项（如实写，没有就写「无」）。

**禁止只写代码不给验证结果。**
