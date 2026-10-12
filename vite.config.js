import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // base: './' asegura que si publicas en GitHub Pages o subcarpetas, las rutas relativas funcionen
  base: './'
})