// Mock implementation for expo-camera
import React from 'react';
import { View, Text } from 'react-native';

// Mock CameraView component
export const CameraView = ({ onBarcodeScanned, children, ...props }) => {
  // Simulate scanning a QR code after 2 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onBarcodeScanned) {
        onBarcodeScanned({
          type: 'qr',
          data: 'https://example.com/test-qr-code'
        });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [onBarcodeScanned]);

  return (
    <View {...props} style={[{ backgroundColor: '#cccccc' }, props.style]}>
      <Text style={{ textAlign: 'center', padding: 20, color: '#fff' }}>
        MOCK CAMERA
      </Text>
      <Text style={{ textAlign: 'center', color: '#fff' }}>
        (Will auto-scan in 2 seconds)
      </Text>
      {children}
    </View>
  );
};

// Mock permissions hook
export const useCameraPermissions = () => {
  return [
    { granted: true },
    async () => ({ granted: true })
  ];
};

// Default export for compatibility
export default {
  CameraView,
  useCameraPermissions
};
