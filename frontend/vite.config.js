import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * El backend no declara ninguna configuracion CORS y mantiene la sesion en una
 * cookie (JSESSIONID) con proteccion CSRF activa. Servir el frontend detras de
 * este proxy deja ambos en el mismo origen durante el desarrollo, que es lo que
 * la cookie y el token X-XSRF-TOKEN necesitan, sin tocar una sola linea del
 * servidor.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const destino = env.VITE_API_URL || 'http://localhost:8080';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: destino, changeOrigin: false },
      },
    },
  };
});
