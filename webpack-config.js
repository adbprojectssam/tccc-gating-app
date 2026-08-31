const macros = require('unplugin-parcel-macros')

module.exports = {
  devtool: 'inline-source-map',
  // unplugin-parcel-macros powers the @react-spectrum/s2 style() macro and
  // must run before other plugins/loaders like Babel.
  plugins: [
    macros.webpack()
  ],
  module: {
    rules: [
      {
        // includes, excludes are in tsconfig.json
        test: /\.ts?$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      },
      {
        // Bundle/serve local font files referenced via url() in @font-face.
        test: /\.(otf|ttf|woff2?)$/,
        type: 'asset/resource'
      }
    ]
  },
  output: {
    filename: 'bundle.js'
  }
}
