import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { ELEMENT_PLUS_COMPONENTS } from './src/config/element-plus-components'

/**
 * Element Plus 精确按需 resolver
 *
 * 官方 ElementPlusResolver 对 EP 2.x 一律返回 `from: "element-plus/es"`（全量入口），
 * Rollup/Rolldown 无法把它 tree-shake 干净 —— 结果整个 element-plus（1.5MB）
 * 都进了首屏入口 chunk（实测占入口 chunk 的 73%）。
 *
 * 这里改用生成的精确路径表（src/config/element-plus-components.ts）：
 *   ElButton     → element-plus/es/components/button/index.mjs
 *   ElTableColumn→ element-plus/es/components/table/index.mjs   （子组件随父组件一起）
 * 每个组件只带自己那一份样式（sideEffects），互不牵连。
 *
 * ⚠️ 若要新增 Element Plus 组件，先跑 `node scripts/gen-element-plus-map.mjs`
 *    刷新路径表，否则该组件不会被自动引入。
 */
const elementPlusOnDemand = {
  type: 'component' as const,
  resolve(name: string) {
    if (!/^El[A-Z]/.test(name)) return undefined
    // ElIcon* 交给官方 resolver（它会映射到 @element-plus/icons-vue 的具名导出）
    if (/^ElIcon.+/.test(name)) return undefined
    const entry = ELEMENT_PLUS_COMPONENTS[name]
    if (!entry) return undefined
    return {
      name,
      from: `element-plus/${entry.from}`,
      ...(entry.style ? { sideEffects: `element-plus/${entry.style}` } : {}),
    }
  },
}

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [elementPlusOnDemand, ElementPlusResolver()],
    }),
    Components({
      resolvers: [elementPlusOnDemand, ElementPlusResolver()],
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
      // 图元库产物（symbol-library/dist）—— MANIFEST / GEOMETRY / runtime / 点表 / 示例布局
      '@symbols': resolve(__dirname, 'symbol-library/dist'),
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
