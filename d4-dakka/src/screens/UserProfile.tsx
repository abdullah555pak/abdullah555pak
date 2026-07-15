import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { HistoryEntry, useAppState } from '../context/AppStateContext';
import type { RootStackParamList, ServiceType } from '../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

const SERVICE_ICON: Record<ServiceType, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  Puncture: 'car-tire-alert',
  Petrol: 'gas-station',
  Mechanic: 'engine',
  'Towing/Dakka': 'tow-truck',
};

function HistoryRow({ item }: { item: HistoryEntry }) {
  return (
    <View style={styles.historyRow}>
      <View style={styles.historyIconCircle}>
        <MaterialCommunityIcons name={SERVICE_ICON[item.serviceType]} size={20} color={colors.accent} />
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyService}>{item.serviceType}</Text>
        <Text style={styles.historyDate}>{item.date}</Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={styles.historyAmount}>Rs. {item.amount}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
    </View>
  );
}

export function UserProfile({ navigation }: Props) {
  const { user, serviceHistory } = useAppState();
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Profile" onBack={() => navigation.goBack()} />

      <FlatList
        data={serviceHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListHeaderComponent={
          <View>
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.name}>{user.name}</Text>
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.phone}>{user.phone}</Text>
              </View>
            </View>

            <View style={styles.vehicleCard}>
              <View style={styles.vehicleIconCircle}>
                <MaterialCommunityIcons
                  name={user.vehicleType === 'Car/Auto' ? 'car' : 'motorbike'}
                  size={22}
                  color={colors.accent}
                />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.fieldLabel}>REGISTERED VEHICLE</Text>
                <Text style={styles.vehicleValue}>{user.vehicleType}</Text>
              </View>
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>{user.vehiclePlate}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Service History</Text>
          </View>
        }
        renderItem={({ item }) => <HistoryRow item={item} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No rides yet. Request your first service!</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accentDim,
    borderWidth: 2,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.h1,
    color: colors.accent,
  },
  name: {
    ...typography.h1,
    fontSize: 20,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  phone: {
    ...typography.caption,
    marginLeft: 6,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  vehicleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  fieldLabel: {
    ...typography.label,
  },
  vehicleValue: {
    ...typography.bodyBold,
    marginTop: 2,
  },
  plateBadge: {
    backgroundColor: colors.surfaceInput,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  plateText: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  historyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyService: {
    ...typography.bodyBold,
  },
  historyDate: {
    ...typography.caption,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    ...typography.bodyBold,
    color: colors.accent,
  },
  statusBadge: {
    backgroundColor: colors.successDim,
    borderRadius: radius.round,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  statusText: {
    ...typography.label,
    fontSize: 9,
    color: colors.success,
  },
  emptyText: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
