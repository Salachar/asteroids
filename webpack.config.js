const path = require('path');

module.exports = {
  entry: './src/js/main.js',
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif|mp3)$/i,
        loader: 'file-loader',
        options: {
          name: '[path][name].[ext]',
          esModule: false,
        },
      }
    ],
  },
  output: {
    filename: 'base.js',
    path: path.resolve(__dirname, 'build')
  },
  optimization: {
    minimize: false
  },
  resolve: {
    alias: {
      "core": path.resolve(__dirname, 'src/js/core/'),
      "game": path.resolve(__dirname, 'src/js/game/'),
      "lib": path.resolve(__dirname, 'src/js/lib/'),
      "math": path.resolve(__dirname, 'src/js/lib/math'),
      "draw": path.resolve(__dirname, 'src/js/lib/draw'),
      "segment": path.resolve(__dirname, 'src/js/lib/segment'),
      "helpers": path.resolve(__dirname, 'src/js/lib/helpers'),
      "sounds": path.resolve(__dirname, 'src/sounds'),
      "audio-player": path.resolve(__dirname, 'src/js/lib/audio-player'),
      "audio-manager": path.resolve(__dirname, 'src/js/lib/audio-manager')
    }
  },
  watch: true
};
