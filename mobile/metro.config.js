const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = mergeConfig(getDefaultConfig(__dirname), {
  /* your config */
  transformer: {
    minifierConfig: {
      keep_fnames: true,
    },
  },
});

// Suppress reanimated warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0] &&
    typeof args[0] === 'string' &&
    args[0].includes('[Reanimated]')
  ) {
    return;
  }
  originalWarn(...args);
};

module.exports = withNativeWind(config, { input: './global.css' });