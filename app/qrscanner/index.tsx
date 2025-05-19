import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, Platform, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

export default function Page() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isEmulator, setIsEmulator] = useState(false);
  const [showTestOptions, setShowTestOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);

  // In a real app, you would use better detection methods
  // For now we'll use a simple approach just for demo
  useEffect(() => {
    // This is a simplified approach - in production you'd want more robust detection
    // Setting to true to enable emulator testing features
    setIsEmulator(true);
  }, []);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    alert(`Bar code with type ${type} and data ${data} has been scanned!`);
    // If it's a valid URL, you could handle it here
    if (data.startsWith('http')) {
      // Open the URL or process it as needed
    }
    router.back(); // Return to previous screen after scanning
  };
    const simulateScan = (data: string) => {
    handleBarCodeScanned({ type: 'qr', data });
  };
  
  const pickImage = async () => {
    try {
      // Request gallery permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        processQRFromImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert("Error picking image. Please try again.");
    }
  };
  
  const processQRFromImage = async (imageUri: string) => {
    try {
      setImageProcessing(true);
      
      // In a real app, you would use a barcode scanning library
      // that can process images, like expo-barcode-scanner's scanFromURLAsync
      // For this demo, we'll just show the image and simulate a scan after a delay
      
      setTimeout(() => {
        // Simulate processing and finding a QR code
        simulateScan('https://threadcity.example.com/profile/' + Math.floor(Math.random() * 10000));
        setImageProcessing(false);
        setSelectedImage(null);
      }, 2000);
      
    } catch (error) {
      console.error("Error processing QR code from image:", error);
      alert("Could not process QR code from image. Please try another image.");
      setImageProcessing(false);
      setSelectedImage(null);
    }
  };
  if (!permission) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Scan QR Code</Text>
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={() => setShowTestOptions(!showTestOptions)}
        >
          <Icon name="bug" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {isEmulator && showTestOptions && (
        <View style={styles.testPanel}>
          <Text style={styles.testPanelTitle}>Emulator Test Controls</Text>
          <TouchableOpacity 
            style={styles.testOption}
            onPress={() => simulateScan('https://example.com/product/123')}
          >
            <Text style={styles.testOptionText}>Simulate Product QR</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.testOption}
            onPress={() => simulateScan('https://threadcity.example.com/profile/12345')}
          >
            <Text style={styles.testOptionText}>Simulate Profile QR</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.testOption}
            onPress={() => simulateScan('INVALID-DATA')}
          >
            <Text style={styles.testOptionText}>Simulate Invalid QR</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
      </View>      <View style={styles.footer}>
        <Text style={styles.instruction}>Position the QR code within the frame to scan</Text>
        
        <View style={styles.footerButtons}>
          {scanned && (
            <Button title="Tap to Scan Again" onPress={() => setScanned(false)} />
          )}
          
          <TouchableOpacity 
            style={styles.uploadButton}
            onPress={pickImage}
            disabled={imageProcessing}
          >
            <Icon name="image-outline" size={24} color="#fff" />
            <Text style={styles.uploadButtonText}>
              {imageProcessing ? "Processing..." : "Upload QR Image"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {selectedImage && (
          <View style={styles.selectedImageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            {imageProcessing && (
              <View style={styles.processingOverlay}>
                <Text style={styles.processingText}>Processing QR Code...</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },  backButton: {
    padding: 8,
  },
  testButton: {
    padding: 8,
  },
  testPanel: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  testPanelTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  testOption: {
    backgroundColor: '#333',
    padding: 12,
    marginVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
  },
  testOptionText: {
    color: '#fff',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    margin: 16,
  },
  camera: {
    flex: 1,
  },  footer: {
    padding: 20,
    alignItems: 'center',
  },
  instruction: {
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  uploadButton: {
    backgroundColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  uploadButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  selectedImageContainer: {
    marginTop: 20,
    width: 200,
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#444',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  }
});