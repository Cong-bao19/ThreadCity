module.exports = {
  presets: [
    'babel-preset-expo',
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: [
    'react-native-reanimated/plugin',
    ["@babel/plugin-transform-private-methods", { "loose": true }],
    ["@babel/plugin-transform-private-property-in-object", { "loose": true }],
    ["@babel/plugin-transform-class-properties", { "loose": true }],
  ],
};