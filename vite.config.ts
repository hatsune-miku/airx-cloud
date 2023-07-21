import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/',
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "src/assets/element.scss" as *; @use "src/assets/vars.scss" as *;`
        //  @use "src/assets/vars.scss" as *;
      }
    }
  },
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment'
  }
})
