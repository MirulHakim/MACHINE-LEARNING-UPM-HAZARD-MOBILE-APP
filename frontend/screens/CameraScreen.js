import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { StatusBar } from 'expo-status-bar';

const MAROON = '#7B1113';
const CREAM = '#FFF8F0';

export default function CameraScreen({ navigation, route }) {
  const { apiBaseUrl } = route.params;
  const [isProcessing, setIsProcessing] = useState(false);

  const launchCameraAndDetect = async () => {
    console.log('[CameraScreen] Step 1: Requesting camera permissions.');
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      console.log('[CameraScreen] Camera permission status:', permission.status);

      if (permission.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to scan hazards.'
        );
        return;
      }

      console.log('[CameraScreen] Step 2: Launching native camera via launchCameraAsync.');
      const cameraResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (cameraResult.canceled) {
        console.log('[CameraScreen] User cancelled the camera capture.');
        return;
      }

      const asset = cameraResult.assets?.[0];
      if (!asset?.uri) {
        console.warn('[CameraScreen] Camera returned no image URI.');
        Alert.alert('Capture Error', 'No image was captured. Please try again.');
        return;
      }

      console.log('[CameraScreen] Step 3: Image captured — preparing multipart upload.');
      setIsProcessing(true);

      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'hazard_photo.jpg',
      });

      const endpoint = `${apiBaseUrl}/detect-hazard`;
      console.log('[CameraScreen] Step 4: POST', endpoint);

      const response = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      console.log('[CameraScreen] Step 5: Server responded with status:', response.status);
      const data = response.data;

      if (data.status === 'no_detection' || data.error) {
        console.log('[CameraScreen] No hazard detected:', data.error);
        Alert.alert(
          'No Hazard Detected',
          data.error || 'Try zooming in or retaking the photo with better lighting.'
        );
        return;
      }

      if (data.status !== 'success' || !data.annotated_image_base64) {
        console.warn('[CameraScreen] Unexpected response shape:', data);
        Alert.alert('Processing Error', 'The server returned an unexpected response.');
        return;
      }

      console.log('[CameraScreen] Step 6: Detection success — navigating to Results.');
      navigation.navigate('Results', { detectionResult: data, apiBaseUrl });
    } catch (error) {
      console.error('[CameraScreen] API dispatch failed:', error?.message || error);

      let message = 'Could not reach the backend server.';
      if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.code === 'ECONNABORTED') {
        message = 'Request timed out. Ensure the backend is running and reachable.';
      } else if (error.message) {
        message = error.message;
      }

      Alert.alert('Connection Error', message);
    } finally {
      setIsProcessing(false);
      console.log('[CameraScreen] Processing stream complete.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.heading}>Hazard Scanner</Text>
        <Text style={styles.description}>
          Tap below to open your phone's native camera. The photo will be sent to your
          laptop's YOLO model for detection and Gemini for maintenance advice.
        </Text>

        <TouchableOpacity
          style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
          onPress={launchCameraAndDetect}
          disabled={isProcessing}
          activeOpacity={0.85}
        >
          <Text style={styles.captureButtonText}>
            {isProcessing ? 'Processing...' : 'Capture Hazard Photo'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isProcessing}
        >
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>

      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingTitle}>AI Processing Stream...</Text>
          <Text style={styles.loadingSubtitle}>
            Sending photo to your laptop's YOLO model and querying Gemini...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MAROON,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  description: {
    color: CREAM,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    opacity: 0.9,
  },
  captureButton: {
    backgroundColor: CREAM,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonText: {
    color: MAROON,
    fontSize: 18,
    fontWeight: '800',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    color: CREAM,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtitle: {
    color: CREAM,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'center',
    opacity: 0.9,
  },
});
