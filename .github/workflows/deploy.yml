
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 載入環境變數
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    // 設定 Base URL，讓 GitHub Pages (https://user.github.io/repo/) 能正確讀取檔案
    // 使用 './' 代表相對路徑，這是最安全的設定
    base: './',
    define: {
      // 在建置時，將程式碼中的 process.env.API_KEY 替換為實際的環境變數值
      // 增加 || '' 以防止 undefined 導致語法錯誤
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.API_KEY || '')
    }
  }
})
