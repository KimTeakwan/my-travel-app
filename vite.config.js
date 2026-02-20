import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    proxy: {
      '/api': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false
      },
      '/kepco': {
        target: 'https://bigdata.kepco.co.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kepco/, ''),
        secure: false
      }, // 👈 여기서 중괄호 닫고 콤마!! 이게 핵심임!!
      
      '/naver-api': {
        target: 'https://naveropenapi.apigw.ntruss.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/naver-api/, ''),
        secure: false,
        headers: {
          'x-ncp-apigw-api-key-id': 'qy1v168ff4', // 새 ID
          'x-ncp-apigw-api-key': 'wGiS75zsubfVAGsNDhrkNjOiSwD9UGnbbzSVLxZE', // 새 Secret
          'Accept': 'application/json'
        }
      }
    }
  }
})