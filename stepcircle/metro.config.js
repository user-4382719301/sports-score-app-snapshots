const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The Firebase JS SDK's package-exports entry points ship untranspiled
// private class fields, which Hermes (Expo Go / dev builds) can't parse.
// Falling back to classic resolution picks Firebase's compatible CJS
// builds instead. See https://docs.expo.dev/guides/using-firebase/
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
