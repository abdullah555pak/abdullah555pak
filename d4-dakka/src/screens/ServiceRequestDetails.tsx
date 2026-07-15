import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NeonButton } from '../components/NeonButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAppState, VehicleType } from '../context/AppStateContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceRequestDetails'>;

const MOCK_ADDRESS = 'Main Boulevard, Lahore';

const SERVICE_ICON: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  Puncture: 'car-tire-alert',
  Petrol: 'gas-station',
  Mechanic: 'engine',
  'Towing/Dakka': 'tow-truck',
};

const PRICE_BY_VEHICLE: Record<VehicleType, number> = {
  'Motorcycle/Bike': 5,
  'Car/Auto': 15,
};

function SearchingOverlay() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.radarRing, { transform: [{ rotate }] }]} />
      <View style={styles.radarCore}>
        <Ionicons name="search" size={26} color={colors.accent} />
      </View>
      <Text style={styles.overlayTitle}>Finding your nearest helper…</Text>
      <Text style={styles.overlaySubtitle}>Scanning verified mechanics nearby</Text>
    </View>
  );
}

export function ServiceRequestDetails({ navigation, route }: Props) {
  const { serviceType } = route.params;
  const { setActiveRequest } = useAppState();
  const [vehicleType, setVehicleType] = useState<VehicleType>('Car/Auto');
  const [searching, setSearching] = useState(false);

  const price = PRICE_BY_VEHICLE[vehicleType];

  const handleConfirm = () => {
    setSearching(true);
    setTimeout(() => {
      setActiveRequest({
        serviceType,
        vehicleType,
        address: MOCK_ADDRESS,
        estimate: price,
      });
      setSearching(false);
      navigation.replace('ActiveTracking');
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Request Service" onBack={() => navigation.navigate('HomeDashboard')} />

      <View style={styles.content}>
        <View style={styles.serviceBanner}>
          <View style={styles.serviceIconCircle}>
            <MaterialCommunityIcons name={SERVICE_ICON[serviceType]} size={24} color={colors.accent} />
          </View>
          <View>
            <Text style={styles.serviceLabel}>SERVICE TYPE</Text>
            <Text style={styles.serviceName}>{serviceType}</Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>PICKUP LOCATION</Text>
        <View style={styles.addressRow}>
          <Ionicons name="location-sharp" size={18} color={colors.accent} />
          <Text style={styles.addressText}>{MOCK_ADDRESS}</Text>
          <View style={styles.gpsBadge}>
            <Text style={styles.gpsBadgeText}>GPS</Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>VEHICLE TYPE</Text>
        <View style={styles.toggleRow}>
          {(['Motorcycle/Bike', 'Car/Auto'] as VehicleType[]).map((option) => {
            const active = vehicleType === option;
            return (
              <Pressable
                key={option}
                style={[styles.toggleOption, active && styles.toggleOptionActive]}
                onPress={() => setVehicleType(option)}
              >
                <MaterialCommunityIcons
                  name={option === 'Car/Auto' ? 'car' : 'motorbike'}
                  size={18}
                  color={active ? colors.background : colors.textSecondary}
                />
                <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.priceCard}>
          <View>
            <Text style={styles.priceLabel}>ESTIMATED PRICE</Text>
            <Text style={styles.priceHint}>Based on selected vehicle</Text>
          </View>
          <Text style={styles.priceValue}>${price}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <NeonButton
          label="Confirm & Find Nearest Helper"
          onPress={handleConfirm}
          loading={searching}
          disabled={searching}
        />
      </View>

      {searching ? <SearchingOverlay /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  serviceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  serviceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  serviceLabel: {
    ...typography.label,
  },
  serviceName: {
    ...typography.h2,
    marginTop: 2,
  },
  fieldLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  addressText: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.sm,
  },
  gpsBadge: {
    backgroundColor: colors.accentDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.round,
  },
  gpsBadgeText: {
    ...typography.label,
    fontSize: 10,
    color: colors.accent,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
  },
  toggleOptionActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  toggleText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 6,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: colors.background,
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  priceLabel: {
    ...typography.label,
  },
  priceHint: {
    ...typography.caption,
    marginTop: 2,
  },
  priceValue: {
    ...typography.display,
    fontSize: 28,
    color: colors.accent,
  },
  footer: {
    padding: spacing.lg,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18,18,18,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.accentBorder,
    borderTopColor: colors.accent,
  },
  radarCore: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  overlayTitle: {
    ...typography.h2,
    marginTop: spacing.xl,
  },
  overlaySubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
