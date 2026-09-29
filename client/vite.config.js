import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
  

export default defineConfig({
  plugins: [react()],

  define: {
    'import.meta.env.VITE_GIPHY_API_KEY': JSON.stringify('Wd9lo6YJrh7AYPDp0wHtpMzwJYIxxuuy')
  }
})


