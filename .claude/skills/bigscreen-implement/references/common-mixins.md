# 公共 SCSS Mixin 参考

放在 `campus-common.scss` 中，所有模块组件用 `@use "./campus-common.scss" as *;` 引入。

## Mixin 清单

### 滚动条隐藏
```scss
@mixin hide-scrollbar {
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

### 表格
```scss
@mixin campus-table { /* 完整表格样式：sticky thead, #0F437A 背景, #40b6b6 表头文字 */ }
@mixin table-wrap { /* flex:1, overflow-y:auto, 自动 hide-scrollbar */ }
```

### Tab
```scss
@mixin tab-row { display: flex; gap: vw(12); flex-shrink: 0; }
@mixin tab-btn-base { /* tab 按钮基础样式 + 非选中态 #00c0c0 */ }
@mixin tab-active { /* 渐变背景 + 白色文字 */ }
```

### 表格元素
```scss
@mixin btn-view { /* 56×24 查看按钮 */ }
@mixin tag-done { /* 已完成标签：青色 #21dcdb */ }
```

### 状态标签
```scss
@mixin status-badge {
  /* DingTalk JinBuTi 字体, 圆角 4px */
  &.status--pending { color: #da372e; background: rgba(244,67,54,0.3); }
  &.status--done { color: #21dcdb; background: rgba(0,164,164,0.3); }
}
```

## 使用示例

```vue
<style lang="scss" scoped>
@use "@/styles/function.scss" as *;
@use "./campus-common.scss" as *;

.tab-row { @include tab-row; }
.tab-btn { @include tab-btn-base; }
.table-wrap { @include table-wrap; }
.my-table { @include campus-table; }
.btn-view { @include btn-view; }
.tag-done { @include tag-done; }
.badge { @include status-badge; }
.list { overflow-y: auto; @include hide-scrollbar; }
</style>
```
