# 大屏架构详解

## 布局系统

### 缩放方案
项目使用 `@/styles/function.scss` 中的三个函数：
```scss
vw($px)  → calc($px / 1920 * 100vw)   // 水平按设计稿比例
vh($px)  → calc($px / 1080 * 100vh)   // 垂直按设计稿比例  
vmin($px) → calc($px / 1080 * 100vmin) // 取较小边（min(1920,1080)=1080），用于圆/图标
```

`StandaloneLayout.vue` 定义全局 CSS 变量：
```css
:root {
  --dw: 1920; --dh: 1080;
  --w: calc(100vw / var(--dw));
  --h: calc(100vh / var(--dh));
  --min-scale: min(var(--w), var(--h));
}
```

### 字体缩放
```scss
font-size: clamp(最小值, calc(设计px * var(--min-scale)), 最大值);
```
例如 `clamp(11px, calc(16 * var(--min-scale)), 16px)` = 设计稿 16px，最小 11px 保底。

### 三列布局模板
```scss
.campus-content {
  position: absolute;
  top: vh(80);  // Header(64) + gap(16)
  left: 0; right: 0; bottom: vh(16);
  display: flex; gap: vw(16); padding: 0 vw(16);
}
.col-left, .col-right { width: vw(568); flex-shrink: 0; }
.col-center { flex: 1; min-width: 0; }
```

## 路由系统

所有大屏页面放在 `StandaloneLayout` 下（不需要侧栏）。
```ts
{ path: 'landing/campus', name: 'BigscreenCampus',
  component: () => import('@/views/bigscreen/CampusBigscreen.vue') }
```
同时注册类型：`src/types/bigscreen.ts` + `src/config/bigscreen-templates.ts`

## 目录约定

```
src/views/bigscreen/
  CampusBigscreen.vue              ← 主页面
  components/campus/
    CampusHeader.vue               ← 顶部栏
    CampusSection.vue              ← 通用卡片容器
    CampusXxx.vue                  ← 各业务模块
    campus-common.scss             ← 公共 Mixin
    campus-fonts.css               ← 字体声明
public/
  campus-icons/                    ← 从 Figma 下载的图标
  campus-header-*.svg              ← Header 装饰素材
```

## 现有大屏参考

项目已有多个大屏页面，可参考其实现：
- `BigscreenLanding.vue` — 经典三列布局
- `BigscreenGongmao.vue` — 工贸大屏（自定义 Header）
- `EnterpriseCockpit.vue` — 企业驾驶舱（地图集成）
- `BigscreenResumption.vue` — 复工大屏（装饰最丰富）
