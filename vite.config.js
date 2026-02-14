import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: {
    proxy: {
      // 🎡 기존 축제 정보용 (공공데이터포털)
      '/api': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false
      },
      // ⚡ [추가] 한전 전력데이터 포털용 (전기차)
      '/kepco': {
        target: 'https://bigdata.kepco.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kepco/, ''),
        secure: false
      }
    }
  }
})