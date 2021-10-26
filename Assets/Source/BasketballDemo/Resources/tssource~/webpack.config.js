module.exports = {
    mode: 'development',
    entry: __dirname + "/output/entry.js",
    devtool: 'inline-source-map',
    output: {
        filename: 'behaviours.cjs',
        path: __dirname + '/../',
        libraryTarget: 'commonjs'
    },
    externals: {
        csharp: 'csharp',
        puerts: 'puerts',
    }
}