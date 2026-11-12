import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import './styles/bigscreen-ep.scss'
import './styles/local-fonts.css' // 项目自定义字体的子集化声明（gzip 仅 ~6KB，全局常驻）

// ⚠️ 首屏瘦身说明（2026-11-12 性能优化）
//
// 这里曾有三个"全量引入"，把 12MB+ 的代码塞进入口 chunk，导致线上首屏 FCP 达 14 秒：
//   1. import * as TDesignIconsVue + 全局注册 → 9.6MB（占入口 chunk 71%）
//   2. app.use(ElementPlus) + element-plus/dist/index.css → 1.5MB JS + 383KB CSS
//   3. app.use(formCreate) + app.use(FcDesigner) → 1.5MB（只有表单设计器页用）
//
// 现状：
//   - TDesign 图标改为按需映射表（src/components/base/appIconMap.ts，61 个真实用到的图标）
//   - Element Plus 改由 unplugin-vue-components 的 ElementPlusResolver 按需自动引入
//   - 中文语言包由 App.vue 的 <el-config-provider> 提供（替代 app.use 的 locale 选项）
//   - form-create / Element Plus 全量改为异步安装，只在进入表单设计器时才加载
//     （见 src/plugins/formDesignerStack.ts）
//
// 新增图标或组件时注意：不要再在入口做全量注册。

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')
