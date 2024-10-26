const path = require('path');

module.exports = {
    mode: 'development',
    entry: [
        "./src/index.html",
        "./src/index.ts"
    ],
    module: {
        rules: [{
            // Load .ts & .tsx files via ts-loader
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: '/node_modules/'
        },
        // Load .html files via file-loader
        {
            test: /\.html/,
            use: [{
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                }
            }]
        }]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, 'build'),
        clean: true
    }
}
