module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // RN 0.81+ ships untranspiled private class fields, assuming the
    // device's Hermes supports them. Some Expo Go / Hermes builds don't
    // ("SyntaxError: private properties are not supported"), so transpile
    // them unconditionally — harmless on engines that do support them.
    plugins: [
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-private-methods',
      '@babel/plugin-transform-private-property-in-object',
    ],
  };
};
