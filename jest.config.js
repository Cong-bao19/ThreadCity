/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@react-navigation/.*)"
  ],
  setupFiles: [
    "<rootDir>/jest.setup.js"
  ],
  moduleFileExtensions: [
    "ts", 
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
  },  testPathIgnorePatterns: [
    // "/node_modules/",
    // "ThemedText.test.tsx",
    // "ThemedView.test.tsx",
    // "ParallaxScrollView.test.tsx",
    // "HelloWave.test.tsx",
    // "ExternalLink.test.tsx",
    // "Collapsible.test.tsx"
  ],  moduleNameMapper: {
    // Mock non-JS asset files
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js",
    "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js",    // Add React Native specific mocks
    "^react-native$": "<rootDir>/__mocks__/react-native.js",
    "^react-native/Libraries/Components/.*": "<rootDir>/__mocks__/react-native.js",
    "^react-native-elements$": "<rootDir>/__mocks__/react-native-elements.js",
    "@react-native/js-polyfills/error-guard": "<rootDir>/__mocks__/@react-native/js-polyfills/error-guard.js",
    // Add Expo polyfill mocks
    "expo/src/winter/PolyfillFunctions": "<rootDir>/__mocks__/expo/src/winter/PolyfillFunctions.js",
    "expo/src/winter/runtime.native": "<rootDir>/__mocks__/expo/src/winter/runtime.native.js",
    "expo/src/winter/index": "<rootDir>/__mocks__/expo/src/winter/index.js",
    // Add path aliases from tsconfig
    "^@/(.*)$": "<rootDir>/$1"
  },
  resolver: "<rootDir>/jest-resolver-flow-mock.js",
  testEnvironment: "node",
  globals: {
    "__DEV__": true
  }
}
