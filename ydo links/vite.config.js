import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true, // or '0.0.0.0' to expose to all
    port: 5173,
    strictPort: true,
    cors: true, // enable CORS for all origins
allowedHosts: ['https://752f-182-183-70-208.ngrok-free.app'], // allow all hosts
    // Optional: add headers if needed
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  },
  plugins: [react()],
})
