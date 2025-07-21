module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@utils': './src/utils',
            '@constants': './src/constants',
            '@store': './src/store',
            '@navigation': './src/navigation',
          },
        },
      ],
    ],
  };
}; 