module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // This plugin MUST be listed last.
      'react-native-reanimated/plugin',
    ],
  };
};