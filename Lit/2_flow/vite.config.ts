
import { defineConfig } from 'vite'


// https://vitejs.dev/config/
export default defineConfig({
    root: 'src',
    server: {
        host: '0.0.0.0',
        port: 8080
    },
    // Vite is using rollup for the build process.
    build: {
        // The default is esbuild which is 20 ~ 40x faster than terser and only 1 ~ 2% worse compression.
        minify: 'esbuild',
        outDir: '../build/production',
        // ../build is not inside project root. Still force to empty it.
        emptyOutDir: true,
        rollupOptions: {
            input: {
                'index': './src/index.html',
                'view/home': './src/view/home.ts',
                'view/about': './src/view/about.ts',
            },
            output:
            {
                // Keep the bundle as an ES module file, suitable for other bundlers and inclusion as a <script type=module> tag in modern browsers.
                format: "es",
                // Default: "assets/[name]-[hash][extname]"
                assetFileNames: "assets/[name][extname]",
                // Default: "assets/[name]-[hash].js"
                entryFileNames: "[name].js",
                // Default: "[name]-[hash].js"
                chunkFileNames: "[name].js"
            }
        }
    }
})
