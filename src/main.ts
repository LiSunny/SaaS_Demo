import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import * as TDesignIconsVue from 'tdesign-icons-vue-next'
import FcDesigner from '@form-create/designer'
import formCreate from '@form-create/element-ui'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
for (const [key, component] of Object.entries(TDesignIconsVue)) {
  app.component(`T${key}`, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.use(formCreate)
app.use(FcDesigner)
app.mount('#app')
