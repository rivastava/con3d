import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isLibrary = mode === 'library'
  
  return {
    plugins: [
      react(),
      ...(isLibrary ? [dts({ include: ['src'] })] : [])
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/core': path.resolve(__dirname, './src/core'),
        '@/modules': path.resolve(__dirname, './src/modules'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/store': path.resolve(__dirname, './src/store'),
        '@/api': path.resolve(__dirname, './src/api'),
        '@/assets': path.resolve(__dirname, './src/assets')
      }
    },
    build: isLibrary ? {
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: 'Con3DMaterialConfigurator',
        formats: ['es', 'umd'],
        fileName: (format) => `con3d-material-configurator.${format}.js`
      },
      rollupOptions: {
        external: ['react', 'react-dom', 'three'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            three: 'THREE'
          }
        }
      }
    } : {},
    optimizeDeps: {
      include: ['three', 'three-stdlib', '@react-three/fiber', '@react-three/drei']
    },
    assetsInclude: ['**/*.hdr', '**/*.exr', '**/*.gltf', '**/*.glb', '**/*.ktx2']
  }
})
