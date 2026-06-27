import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

const MAROON = '#7B1113';
const MAROON_DARK = '#5C0D0F';
const CREAM = '#FFF8F0';

export default function ResultsScreen({ navigation, route }) {
  const { detectionResult } = route.params || {};

  if (!detectionResult) {
    console.warn('[ResultsScreen] No detectionResult in route params.');
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>No detection data available.</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.primaryButtonText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const {
    annotated_image_base64,
    final_class,
    confidence,
    detected_count,
    recommendation,
  } = detectionResult;

  console.log('[ResultsScreen] Rendering report for:', final_class, confidence);

  const imageUri = annotated_image_base64
    ? `data:image/jpeg;base64,${annotated_image_base64}`
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.reportTitle}>Facilities Hazard Report</Text>
        <Text style={styles.reportSubtitle}>UPM Campus Hazard Detective — AI Analysis</Text>

        {imageUri ? (
          <View style={styles.imageCard}>
            <Text style={styles.sectionLabel}>YOLO Annotated Image</Text>
            <Image
              source={{ uri: imageUri }}
              style={styles.annotatedImage}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={styles.imageCard}>
            <Text style={styles.missingImageText}>Annotated image unavailable.</Text>
          </View>
        )}

        <View style={styles.metricsCard}>
          <Text style={styles.sectionLabel}>Detection Metrics</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricKey}>Hazard Label</Text>
            <Text style={styles.metricValue}>{final_class || 'N/A'}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricKey}>Bounding Boxes</Text>
            <Text style={styles.metricValue}>{detected_count ?? 0}</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricKey}>Top Confidence</Text>
            <Text style={styles.metricValue}>{confidence || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.recommendationCard}>
          <Text style={styles.sectionLabel}>Immediate Maintenance Recommendation</Text>
          <Text style={styles.recommendationText}>
            {recommendation || 'No recommendation was generated for this detection.'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            console.log('[ResultsScreen] Scan another hazard.');
            navigation.navigate('Camera', { apiBaseUrl: route.params?.apiBaseUrl });
          }}
        >
          <Text style={styles.primaryButtonText}>Scan Another Hazard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.secondaryButtonText}>← Back to Home</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  reportTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  reportSubtitle: {
    color: CREAM,
    fontSize: 14,
    marginBottom: 20,
    opacity: 0.85,
  },
  imageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  annotatedImage: {
    width: '100%',
    height: 280,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  missingImageText: {
    color: '#666666',
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 40,
  },
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: CREAM,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: MAROON_DARK,
  },
  sectionLabel: {
    color: MAROON_DARK,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  metricKey: {
    color: '#555555',
    fontSize: 15,
  },
  metricValue: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
  recommendationText: {
    color: '#222222',
    fontSize: 15,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: CREAM,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: MAROON_DARK,
    fontSize: 17,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: CREAM,
    fontSize: 16,
    fontWeight: '600',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
  },
});
