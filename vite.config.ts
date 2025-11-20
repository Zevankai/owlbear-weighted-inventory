import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl()
  ],
  server: {
    cors: true, // <--- ADD THIS LINE
    // Optional: If the above isn't enough, you can be more aggressive:
    // cors: { origin: "*" } 
  }
})