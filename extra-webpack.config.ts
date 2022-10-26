const webpack = require('webpack');

module.exports = {
  devServer: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
    })
  ],
  resolve: {
      extensions: [ '.ts', '.js' ],
      fallback: {
          "buffer": require.resolve("buffer")
      }
  },
};