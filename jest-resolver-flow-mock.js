// Mock cho Flow type
const path = require('path');

// Proper Jest resolver implementation
module.exports = (request, options) => {
  // Check if the request matches a problematic Flow file
  if (request.includes('@react-native/js-polyfills') || request.includes('flow')) {
    // Return mock path for Flow-related files
    return path.resolve(__dirname, '__mocks__/@react-native/js-polyfills/error-guard.js');
  }
  
  // Handle Expo winter/PolyfillFunctions
  if (request.includes('expo/src/winter/PolyfillFunctions')) {
    return path.resolve(__dirname, '__mocks__/expo/src/winter/PolyfillFunctions.js');
  }
  
  // Handle Expo winter/runtime.native
  if (request.includes('expo/src/winter/runtime.native')) {
    return path.resolve(__dirname, '__mocks__/expo/src/winter/runtime.native.js');
  }
  
  // Handle Expo winter/index
  if (request.includes('expo/src/winter')) {
    return path.resolve(__dirname, '__mocks__/expo/src/winter/index.js');
  }
  
  // Otherwise use default resolver
  return options.defaultResolver(request, options);
};

// Also provide sync version for Jest
module.exports.sync = (request, options) => {
  // Check if the request matches a problematic Flow file
  if (request.includes('@react-native/js-polyfills') || request.includes('flow')) {
    // Return mock path for Flow-related files
    return path.resolve(__dirname, '__mocks__/@react-native/js-polyfills/error-guard.js');
  }
  
  // Handle Expo winter/PolyfillFunctions
  if (request.includes('expo/src/winter/PolyfillFunctions')) {
    return path.resolve(__dirname, '__mocks__/expo/src/winter/PolyfillFunctions.js');
  }
  
  // Handle Expo winter/runtime.native
  if (request.includes('expo/src/winter/runtime.native')) {
    return path.resolve(__dirname, '__mocks__/expo/src/winter/runtime.native.js');
  }
  
  // Handle Expo winter/index
  if (request.includes('expo/src/winter')) {
    return path.resolve(__dirname, '__mocks__/expo/src/winter/index.js');
  }
  
  // Otherwise use default resolver
  return options.defaultResolver.sync(request, options);
};
