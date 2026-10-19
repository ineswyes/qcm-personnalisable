import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Adresse du site sur GitHub Pages : https://ineswyes.github.io/qcm-personnalisable/
  base: '/qcm-personnalisable/',
})
