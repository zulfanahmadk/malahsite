import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    server: {
        middlewareMode: false,
        port: 5173,
        strictPort: false,
        host: '0.0.0.0',
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
        hmr: {
            host: process.env.VITE_HMR_HOST || 'localhost',
            port: 5173,
            protocol: 'ws',
        },
    },
});
