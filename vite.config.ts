import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { resolve } from 'path'
import { readFileSync } from 'fs'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    {
      name: 'geojson-loader',
      load(id) {
        if (id.endsWith('.geojson')) {
          const json = readFileSync(id, 'utf-8')
          return `export default ${json}`
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    // ⚠️ 预构建全部 Element Plus 按需组件：懒加载路由（如 StreetDetailPage）首次进入时
    // 若发现未预构建的 el-* 组件，vite 会触发依赖重优化 + 全页 reload，
    // 导致正在进行的动态 import 报 "Failed to fetch dynamically imported module"。
    // 在启动时一次性预构建，运行时不再触发。
    include: [
      'element-plus/es',
      ...['base', 'breadcrumb', 'button', 'card', 'cascader', 'checkbox', 'checkbox-group', 'col', 'collapse', 'collapse-item', 'date-picker', 'dialog', 'divider', 'drawer', 'dropdown', 'dropdown-item', 'dropdown-menu', 'form', 'form-item', 'icon', 'input', 'input-number', 'link', 'message', 'message-box', 'option', 'pagination', 'popover', 'radio', 'radio-group', 'row', 'select', 'skeleton', 'slider', 'step', 'steps', 'switch', 'tab-pane', 'table', 'table-column', 'tabs', 'tag', 'tooltip', 'tree', 'upload'].map(
        (name) => `element-plus/es/components/${name}/style/css`,
      ),
    ],
  },
  server: {
    port: 3200,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3201',
        changeOrigin: true,
      },
    },
  },
})
