const path = require("path");
module.exports = {
    mode: "development",
    entry: {
        index: path.resolve(__dirname, "./src/renderer-process/index.ts"),
    },
    devtool: "inline-source-map",
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: "ts-loader",
            exclude: /node_modules/,
        },
        {
            test: /\.css$/,
            use: ["style-loader", "css-loader"]
        }]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".vue", ".json"],
        alias: {
            vue$: "vue/dist/vue.esm.js", //使用vue runtime compuler
            "@": path.resolve("src")
        }
    },
    output: {
        filename: "[name].bundle.debug.js",
        path: path.resolve(__dirname, "./assets/html"),
        publicPath: "./",
    },
    externals: {
        "fs": "commonjs2 fs",
        "path": "commonjs2 path",
        "electron": "commonjs2 electron",
    }
};