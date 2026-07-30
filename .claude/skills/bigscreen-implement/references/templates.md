# 组件模板

## CampusHeader 模板

```vue
<template>
  <div class="campus-header">
    <div class="header-bg" />
    <img class="header-left-decor" src="/campus-header-left.svg" alt="" />
    <h1 class="header-title">{{ title }}</h1>
    <div class="user-area">
      <span class="user-name">{{ displayName }}</span>
      <div class="user-avatar"><img :src="avatarUrl" alt="" /></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
const displayName = computed(() => userStore.user?.realName || '')
const avatarUrl = computed(() => {
  const u = userStore.user
  return u?.avatar || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(u?.realName || 'default')}`
})
</script>
```

CSS 关键值：
- 容器：`height: vh(64)`（或按设计稿调整）
- 标题：`left: vw(43); top: 50%; translateY(-50%)`
- 用户区：`right: vw(24); top: 50%; translateY(-50%)`

## CampusSection 模板

```vue
<template>
  <div class="campus-section">
    <div class="section-header">
      <div class="header-bg-trapezoid" />   <!-- 梯形底纹 -->
      <div class="header-divider" />         <!-- 渐变分割线 -->
      <div class="header-accent" />          <!-- 左侧强调条（z-index:1） -->
      <h2 class="header-title">{{ title }}</h2>
      <p class="header-subtitle">{{ subtitle }}</p>
    </div>
    <div class="section-body"><slot /></div>
  </div>
</template>
```

CSS 关键值：
- 卡片：`background: rgba(43,101,175,0.35); border-radius: 4px; padding: vh(10) vw(10);`
- 标题栏：`height: vh(49); position: relative;`
- 强调条：`left: 0; top: vh(6.5); width: vw(16.5); height: vh(38);`
  - `background: linear-gradient(180deg, white→#B6EAFF→#79D9FF);`
  - `clip-path: polygon(38% 1%, 97% 0%, 59% 100%, 3% 100%);`
  - `z-index: 1;`
- 梯形底纹：`left: vw(6); right: 0; bottom: vh(5); height: vh(22);`
  - `background: linear-gradient(270deg, rgba(190,246,254,0.01)→rgba(72,229,229,0.25));`
- 分割线：`left: 0; right: vw(7); bottom: 0; height: vh(2);`
- 标题：`left: vw(24); top: 0; font: YouSheBiaoTiHei 28px white; line-height: vh(49);`
- 副标题：`right: vw(7); bottom: 0; font: Arial Italic 14px rgba(255,255,255,0.54);`
- 内容区：`padding-top: vh(16);`（卡片 padding 已提供左右下边距）

## Tab 组件模板

```vue
<div class="tab-row">
  <button class="tab-btn" :class="{ active: activeTab === 'key1' }" @click="activeTab = 'key1'">
    <img src="/campus-icons/mX-tab-icon1.svg" alt="" />
    <span>标签1</span>
  </button>
  <button class="tab-btn" :class="{ active: activeTab === 'key2' }" @click="activeTab = 'key2'">
    <img src="/campus-icons/mX-tab-icon2.svg" alt="" />
    <span>标签2</span>
  </button>
</div>
```

## 表格组件模板

```vue
<div class="table-wrap">
  <table class="my-table">
    <thead>
      <tr><th>列1</th><th>列2</th><th class="col-action">操作</th></tr>
    </thead>
    <tbody>
      <tr v-for="(row, i) in data" :key="i">
        <td>{{ row.col1 }}</td>
        <td>{{ row.col2 }}</td>
        <td class="col-action"><img class="btn-view" src="/campus-icons/m2-icon-02.svg" alt="查看" /></td>
      </tr>
    </tbody>
  </table>
</div>
```
