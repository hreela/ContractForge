import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(async () => {
    return {
      resolve: {
      alias: {
        '@': path.resolve('client', 'src'),
        '@shared': path.resolve('shared'),
        '@assets': path.resolve('attached_assets'),
      }
    },
    root: path.resolve('client'),
    build: {
      outDir: path.resolve('dist/public'),
    }
  };
});
