import { defineConfig } from 'vite';

export default defineConfig({
  // 相对路径，方便部署到 nginx 任意子路径。
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
