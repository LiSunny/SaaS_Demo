<template>
  <!--
    中文语言包由此提供。
    原来是在 main.ts 里 app.use(ElementPlus, { locale: zhCn }) 提供的；
    改为按需引入 Element Plus 后，全局安装已移除，locale 改由 el-config-provider 下发。
  -->
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>
