import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const MAROON = '#7B1113';
const MAROON_DARK = '#5C0D0F';
const CREAM = '#FFF8F0';

export default function HomeScreen({ navigation }) {
  const handleOpenScanner = () => {
    console.log('[HomeScreen] Navigating to Camera scanner.');
    navigation.navigate('Camera');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.badge}>UPM FACILITIES</Text>
          <Text style={styles.title}>Campus Hazard Detective</Text>
          <Text style={styles.subtitle}>
            Real-time AI hazard scanning for a safer campus environment.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How to Use</Text>
          <Text style={styles.step}>1. Ensure your phone and laptop are on the same Wi-Fi network.</Text>
          <Text style={styles.step}>2. Update LAPTOP_IP_ADDRESS in App.js with your laptop's local IP.</Text>
          <Text style={styles.step}>3. Start the Flask backend on your laptop (python server.py).</Text>
          <Text style={styles.step}>4. Tap "Open Camera Scanner" and photograph a campus hazard.</Text>
          <Text style={styles.step}>5. Review the YOLO-annotated image and Gemini maintenance report.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detection Pipeline</Text>
          <Text style={styles.pipelineText}>
            Photo → YOLO bounding boxes → Gemini facilities recommendation → Scrollable report
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleOpenScanner}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Open Camera Scanner</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MAROON,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  badge: {
    color: CREAM,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    opacity: 0.85,
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: CREAM,
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    color: MAROON_DARK,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  step: {
    color: '#333333',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  pipelineText: {
    color: '#444444',
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  primaryButton: {
    backgroundColor: CREAM,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: MAROON_DARK,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
