const path = require('path')

module.exports = {
    mode: 'development',
    entry: __dirname + '/output/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'puerts-runtime.js'
    },
    devtool: 'inline-source-map'
}