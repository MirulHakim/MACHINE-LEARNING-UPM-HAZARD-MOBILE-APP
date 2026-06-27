import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import ResultsScreen from './screens/ResultsScreen';

// Replace with your laptop's Wi-Fi IPv4 address (e.g. 192.168.1.42).
// Find it via: ipconfig (Windows) or ifconfig (macOS/Linux).
const LAPTOP_IP_ADDRESS = '10.63.21.31';
const API_BASE_URL = `http://${LAPTOP_IP_ADDRESS}:5000`;

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#7B1113' },
  headerTintColor: '#FFF8F0',
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: '#7B1113' },
};

export default function App() {
  console.log('[App] Navigation controller initialized. API base:', API_BASE_URL);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'UPM Hazard Detective' }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{ title: 'Camera Scanner' }}
          initialParams={{ apiBaseUrl: API_BASE_URL }}
        />
        <Stack.Screen
          name="Results"
          component={ResultsScreen}
          options={{ title: 'Hazard Report' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
