import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Ensure process.env is available for compatibility, though import.meta.env is preferred in Vite
    'process.env': process.env
  }
});