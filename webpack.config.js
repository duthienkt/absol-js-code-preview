const path = require('path');


var packages = {
    default: {
        entry: ["./dev.js"],
        filename: "./dist/absol-js-code-preivew.js"
    },
    slave: {
        entry: ['./slave.js'],
        filename: "./dist/absol-js-code-preivew-slave.js"
    }
}

const PACKAGE = 'slave';


module.exports = {
    mode: process.env.MODE || "development",
    // mode: 'production',
    entry: packages[PACKAGE].entry,
    output: {
        path: path.join(__dirname, "."),
        filename: packages[PACKAGE].filename
    },
    resolve: {
        modules: [
            path.join(__dirname, './node_modules')
        ]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                options: { presets: [['@babel/preset-env', { modules: false }]] }
            },
            {
                test: /\.(tpl|txt|xml|rels)$/i,
                use: 'raw-loader',
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            }
        ]
    },
    optimization: {
        minimize: false
    },
    devServer: {
        compress: true,
        disableHostCheck: true,
        host: '0.0.0.0'
    },
    performance: {
        hints: false
    }
};