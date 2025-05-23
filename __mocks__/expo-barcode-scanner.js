// Mock for expo-barcode-scanner
export const BarCodeScanner = 'BarCodeScanner';
export default {
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scanFromURLAsync: jest.fn()
};
