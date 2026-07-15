import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActiveTracking } from '../screens/ActiveTracking';
import { EmergencyContacts } from '../screens/EmergencyContacts';
import { HomeDashboard } from '../screens/HomeDashboard';
import { PaymentAndReceipt } from '../screens/PaymentAndReceipt';
import { ServiceRequestDetails } from '../screens/ServiceRequestDetails';
import { SplashScreen } from '../screens/SplashScreen';
import { UserProfile } from '../screens/UserProfile';
import { colors } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="HomeDashboard" component={HomeDashboard} />
        <Stack.Screen name="ServiceRequestDetails" component={ServiceRequestDetails} />
        <Stack.Screen name="ActiveTracking" component={ActiveTracking} options={{ gestureEnabled: false }} />
        <Stack.Screen name="PaymentAndReceipt" component={PaymentAndReceipt} options={{ gestureEnabled: false }} />
        <Stack.Screen name="EmergencyContacts" component={EmergencyContacts} />
        <Stack.Screen name="UserProfile" component={UserProfile} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
