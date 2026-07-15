import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MockMap } from '../components/MockMap';
import { ServiceCard } from '../components/ServiceCard';
import type { RootStackParamList, ServiceType } from '../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { callNumber } from '../utils/dialer';
import { formatCoordinate, useMockGps } from '../utils/useMockGps';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeDashboard'>;

const SOS_NUMBER = '+923001234567';

const SERVICES: Array<{
  serviceType: ServiceType;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}> = [
  { serviceType: 'Puncture', title: 'Puncture Repair', subtitle: 'Flat tyre fixed fast', icon: 'car-tire-alert' },
  { serviceType: 'Petrol', title: 'Emergency Petrol', subtitle: 'Fuel delivered to you', icon: 'gas-station' },
  { serviceType: 'Mechanic', title: 'Mechanic Needed', subtitle: 'On-site diagnostics', icon: 'engine' },
  { serviceType: 'Towing/Dakka', title: 'Towing & Dakka', subtitle: 'Full vehicle recovery', icon: 'tow-truck' },
];

export function HomeDashboard({ navigation }: Props) {
  const coords = useMockGps();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>
            D4 <Text style={styles.logoAccent}>Dakka</Text>
          </Text>
          <Text style={styles.tagline}>STUCK? WE&apos;VE GOT YOUR BACK</Text>
        </View>
        <Pressable
          style={styles.profileButton}
          onPress={() => navigation.navigate('UserProfile')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Ionicons name="person" size={20} color={colors.accent} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <MockMap markers={[{ id: 'user', x: 50, y: 55, type: 'user' }]} height={220} />
        <View style={styles.coordsRow}>
          <Ionicons name="location" size={14} color={colors.accent} />
          <Text style={styles.coordsText}>
            LAT {formatCoordinate(coords.latitude)}° &nbsp;·&nbsp; LNG {formatCoordinate(coords.longitude)}°
          </Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>What do you need?</Text>
        <View style={styles.grid}>
          {SERVICES.map((service) => (
            <ServiceCard
              key={service.serviceType}
              title={service.title}
              subtitle={service.subtitle}
              iconName={service.icon}
              onPress={() => navigation.navigate('ServiceRequestDetails', { serviceType: service.serviceType })}
            />
          ))}
        </View>

        <Pressable
          style={styles.quickLink}
          onPress={() => navigation.navigate('EmergencyContacts')}
        >
          <MaterialCommunityIcons name="phone-alert" size={18} color={colors.textSecondary} />
          <Text style={styles.quickLinkText}>Emergency contacts directory</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      </ScrollView>

      <Pressable
        style={styles.sosBanner}
        onPress={() => callNumber(SOS_NUMBER)}
        accessibilityRole="button"
        accessibilityLabel="Call emergency SOS number"
      >
        <View style={styles.sosTextWrap}>
          <Text style={styles.sosTitle}>Need urgent help?</Text>
          <Text style={styles.sosSubtitle}>Direct call for immediate response</Text>
        </View>
        <View style={styles.sosCallIcon}>
          <Ionicons name="call" size={20} color={colors.background} />
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  logo: {
    ...typography.h1,
    fontSize: 22,
  },
  logoAccent: {
    color: colors.accent,
  },
  tagline: {
    ...typography.label,
    marginTop: 2,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 70,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  coordsText: {
    ...typography.caption,
    marginLeft: 6,
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successDim,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.round,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 4,
  },
  liveText: {
    ...typography.label,
    color: colors.success,
    fontSize: 10,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  quickLinkText: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.textSecondary,
  },
  sosBanner: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 18,
    ...shadow.glow,
  },
  sosTextWrap: {
    flex: 1,
  },
  sosTitle: {
    ...typography.bodyBold,
    color: colors.background,
    fontSize: 16,
  },
  sosSubtitle: {
    ...typography.caption,
    color: 'rgba(18,18,18,0.75)',
    marginTop: 2,
  },
  sosCallIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: 'rgba(18,18,18,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
});
