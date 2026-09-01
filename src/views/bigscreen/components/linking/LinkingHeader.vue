<template>
  <header class="linking-header">
    <!-- ===== 左侧装饰组（Figma: left -2px top 0） ===== -->
    <div class="header-left">
      <!-- Group151 960×61 @ (0,0) -->
      <img class="h-decor-left" src="@/assets/bigscreen/linking/linking-header-left.svg" alt="" />
      <!-- Group150 350×84 @ (608,0) -->
      <img class="h-decor-mid" src="@/assets/bigscreen/linking/linking-header-mid.svg" alt="" />
      <!-- 三个色条 @ (576,68)，20×4px gap 8px（#f0fce1/#ebffcf/#d9ffa5） -->
      <div class="h-bars">
        <i /><i /><i />
      </div>
      <!-- Union 60.5×8 @ (515,20) -->
      <img class="h-union" src="@/assets/bigscreen/linking/linking-header-union.svg" alt="" />
    </div>

    <!-- ===== 右侧装饰组（Figma: left 958px，整体水平镜像） ===== -->
    <div class="header-right">
      <!-- Group152 960×61 @ (0,0) -->
      <img class="h-decor-right" src="@/assets/bigscreen/linking/linking-header-right.svg" alt="" />
      <!-- Group150 镜像 350×84 @ (0,0) -->
      <img class="h-decor-mid" src="@/assets/bigscreen/linking/linking-header-mid.svg" alt="" />
      <!-- 色条镜像 @ (306,68) -->
      <div class="h-bars">
        <i /><i /><i />
      </div>
      <!-- Union 镜像 @ (382.47,20) -->
      <img class="h-union" src="@/assets/bigscreen/linking/linking-header-union.svg" alt="" />
    </div>

    <!-- ===== 主标题（Figma: top 13px 居中，YouSheBiaoTiHei 32px，渐变 #e5f2ff→#b0cdff） ===== -->
    <h1 class="header-title">
      <span>海港区</span>
      <span class="title-quote">&#x201C;</span>
      <span>人工智能+沿街店铺</span>
      <span class="title-quote">&#x201D;</span>
      <span>应消联勤平台</span>
    </h1>

    <!-- ===== 标题下方光晕条（Figma Rectangle 198: 259×5 @ (828,70)，radial 渐变白芯→青蓝 + box-shadow 光晕） ===== -->
    <div class="title-line" />
  </header>
</template>

<style lang="scss" scoped>
@use "@/styles/function.scss" as *;

/* Header 总高 84px（Figma） */
.linking-header {
  position: absolute;
  top: 0; left: 0;
  width: 100vw; height: vh(84);
  z-index: 100;
}

/* ===== 左侧装饰组 ===== */
.header-left {
  position: absolute;
  left: vw(-2); top: 0;
  width: vw(960); height: vh(84);
  pointer-events: none;
}

/* Group151（Figma: 960×61 @ (0,0)） */
.h-decor-left {
  position: absolute;
  left: 0; top: 0;
  width: vw(960); height: vh(61);
  display: block;
}

/* Group150（Figma: 容器 350×84 @ (608,0)，SVG 实宽 350.779 带 inset 溢出，
   右侧镜像同宽 → 两板在中心重叠闭合接缝；不足时会露出描边竖线） */
.h-decor-mid {
  position: absolute;
  left: vw(608); top: vh(-0.75);
  width: vw(350.779); height: vh(85.63);
  display: block;
}

/* 三个色条（Figma: @ (576,68)，20×4px gap 8px） */
.h-bars {
  position: absolute;
  left: vw(576); top: vh(68);
  display: flex; align-items: center;
  gap: vw(8);
}

.h-bars i {
  display: block;
  width: vw(20); height: vh(4);
  flex-shrink: 0;
}

.h-bars i:nth-child(1) { background: #f0fce1; }
.h-bars i:nth-child(2) { background: #ebffcf; }
.h-bars i:nth-child(3) { background: #d9ffa5; }

/* Union（Figma: 60.5×8 @ (515,20)） */
.h-union {
  position: absolute;
  left: vw(515); top: vh(20);
  width: vw(60.533); height: vh(8);
  display: block;
}

/* ===== 右侧装饰组 =====
 * Figma 中每个元素在自身高度容器内做 -scale-y-100 rotate-180（= 水平镜像）。
 * 用 scaleX(-1) 等价实现，且不受容器高度影响（避免垂直位移）。 */
.header-right {
  position: absolute;
  left: vw(958); top: 0;
  width: vw(960); height: vh(84);
  pointer-events: none;
}

/* Group152（Figma: 960×61 @ (0,0)，水平镜像） */
.h-decor-right {
  position: absolute;
  left: 0; top: 0;
  width: vw(960); height: vh(61);
  display: block;
  transform: scaleX(-1);
}

/* 右侧组内的 mid/bars/union 复用上面的样式（按镜像前坐标定位 + scaleX(-1)） */
.header-right .h-decor-mid {
  left: 0;
  transform: scaleX(-1);
}

.header-right .h-bars {
  left: vw(306);
  transform: scaleX(-1);
}

.header-right .h-union {
  left: vw(382.47);
  transform: scaleX(-1);
}

/* ===== 主标题 ===== */
.header-title {
  position: absolute;
  top: vh(13);
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  white-space: nowrap;
  font-family: 'YouSheBiaoTiHei', 'Source-KeynoteartHans', 'PingFang SC', sans-serif;
  font-size: clamp(24px, calc(32 * var(--min-scale)), 32px);
  font-weight: 400;
  line-height: normal;
  background: linear-gradient(to bottom, #e5f2ff 0%, #b0cdff 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 vh(4) vh(8) rgba(0, 45, 122, 0.47);
}

/* 引号负字距（Figma: tracking -10.56px，让弯引号贴近文字）
   font-family 用系统标准字体：YouSheBiaoTiHei-2.ttf 缺 201C/201D 弯引号字形，
   会用 fallback 的直引号（两条竖线段），看起来像一根竖线。 */
.title-quote {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  letter-spacing: vw(-10.56);
}

/* ===== 标题下方光晕条（Figma Rectangle 198 原样 CSS） =====
   Figma 代码：
   width: 259px; height: 5px; left: 828px; top: 70px;
   background: radial-gradient(50% 50% at 50% 50%, #D9D9D9 0%, #1DA6DA 100%);
   box-shadow: 0px 0px 6px rgba(98, 185, 218, 0.74); */
.title-line {
  position: absolute;
  left: vw(828); top: vh(70);
  width: vw(259); height: vh(5);
  background: radial-gradient(50% 50% at 50% 50%, #d9d9d9 0%, #1da6da 100%);
  box-shadow: 0 0 6px rgba(98, 185, 218, 0.74);
  pointer-events: none;
}
</style>
