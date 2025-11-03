import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 开发服务器配置
  //
  server: {
    // (可选) 指定你希望 Vite 运行在哪个端口
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: [
      // 'hdc3d96b.natappfree.cc' // 这是你刚才的域名
      '.natappfree.cc', // 推荐使用这个通配符
    ],
    // (关键) 代理配置
    proxy: {
      '/api/v1/admin': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/api/v1/user': {
        target: 'http://localhost:8888',
        changeOrigin: true,
      },
      '/api/v1/shortener': {
        // 转发到你的 Go shortener-api
        target: 'http://localhost:8887',
        changeOrigin: true,
      },
      '/api/v1/admin-shortener': {
        // 转发到你的 Go shortener-api
        target: 'http://localhost:8887',
        changeOrigin: true,
      },
    },
  },
})
