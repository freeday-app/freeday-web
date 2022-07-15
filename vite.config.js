import { loadEnv, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const env = loadEnv(
    'dev',
    process.cwd()
);

export default defineConfig({
    plugins: [
        react()
    ],
    server: {
        proxy: {
            '/api': {
                target: env.VITE_API_URL,
                changeOrigin: true,
                secure: false
            }
        }
    }
});
