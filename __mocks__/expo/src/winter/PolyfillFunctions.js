// Mock for Expo's PolyfillFunctions module
export const polyfillGlobal = jest.fn();
export const polyfillObject = jest.fn();
export const install = jest.fn();
export default {
  polyfillGlobal,
  polyfillObject,
  install
};
