import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'


// https://vitejs.dev/config/
export default defineConfig({
    root: 'src',
    server: {
        host: '0.0.0.0',
        port: 8080
    },
    plugins: [viteSingleFile()],
    // Vite is using rollup for the build process.
    build: {
        // The default is esbuild which is 20 ~ 40x faster than terser and only 1 ~ 2% worse compression.
        minify: 'esbuild',
        outDir: '../build/production',
        // ../build is not inside project root. Still force to empty it.
        emptyOutDir: true
    }
})
