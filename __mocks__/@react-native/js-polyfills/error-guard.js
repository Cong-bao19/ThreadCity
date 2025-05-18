// Mock file for @react-native/js-polyfills/error-guard.js
module.exports = {
  ErrorUtils: {
    setGlobalHandler: () => {},
    getGlobalHandler: () => () => {},
    reportError: () => {},
    reportFatalError: () => {},
  },
};
