const webpack = require('webpack');

module.exports = function override(config, env) {
  console.log('🔧 Config-overrides aplicado - mapeamento direto...');
  
  // Mapear process/browser diretamente
  config.resolve.alias = {
    ...config.resolve.alias,
    'process/browser': require.resolve('process/browser'),
    'process': require.resolve('process/browser')
  };
  
  // Configurar fallbacks
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "path": require.resolve("path-browserify"),
    "buffer": require.resolve("buffer"),
    "process": require.resolve("process/browser"),
    "process/browser": require.resolve("process/browser"),
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

  // ProvidePlugin
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    })
  ]);

  console.log('✅ Webpack5 mapeamento direto configurado!');
  return config;
};