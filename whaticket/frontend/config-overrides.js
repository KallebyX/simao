const webpack = require('webpack');

module.exports = function override(config, env) {
  // Configuração mais simples e compatível
  config.resolve.fallback = {
    "process": require.resolve("process/browser.js"),
    "buffer": require.resolve("buffer"),
    "path": require.resolve("path-browserify"),
    "os": false,
    "crypto": false,
    "stream": false,
    "assert": false,
    "http": false,
    "https": false,
    "url": false,
    "util": false,
    "fs": false,
    "child_process": false
  };

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
    })
  ]);

  // Configurações de build otimizadas
  config.optimization = {
    ...config.optimization,
    minimize: false, // Desabilitar minificação para build mais rápido
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  };

  return config;
};