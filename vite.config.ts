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
  server: {
    port: 3200,
    proxy: {
      '/api': {
        // 测试时可通过 VITE_API_TARGET 覆盖后端端口（E2E 测试用 3202）
        target: process.env.VITE_API_TARGET || 'http://localhost:3201',
        changeOrigin: true,
      },
    },
  },
})
