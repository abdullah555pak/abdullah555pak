import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MockMap } from '../components/MockMap';
import { NeonButton } from '../components/NeonButton';
import { RatingStars } from '../components/RatingStars';
import { useAppState } from '../context/AppStateContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { callNumber } from '../utils/dialer';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveTracking'>;

const USER_POS = { x: 76, y: 70 };
const HELPER_START = { x: 14, y: 16 };
const TOTAL_DURATION_MS = 15000;
const STEP_MS = 400;

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

export function ActiveTracking({ navigation }: Props) {
  const { activeRequest, helper, generateReceipt } = useAppState();
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(elapsed / TOTAL_DURATION_MS, 1);
      setProgress(nextProgress);
      if (nextProgress >= 1) {
        clearInterval(interval);
      }
    }, STEP_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setCompleted(true), TOTAL_DURATION_MS);
    return () => clearTimeout(timeout);
  }, []);

  const helperPos = {
    x: lerp(HELPER_START.x, USER_POS.x, progress),
    y: lerp(HELPER_START.y, USER_POS.y, progress),
  };

  const etaMinutes = Math.max(1, Math.ceil((1 - progress) * 8));

  const handleViewReceipt = () => {
    generateReceipt();
    setCompleted(false);
    navigation.replace('PaymentAndReceipt');
  };

  const handleCancel = () => {
    navigation.navigate('HomeDashboard');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Helper is on the way!</Text>
        <Text style={styles.headerSubtitle}>
          {activeRequest ? `${activeRequest.serviceType} · ${activeRequest.address}` : 'Tracking your request'}
        </Text>
      </View>

      <View style={styles.mapWrap}>
        <MockMap
          height={300}
          markers={[
            { id: 'user', x: USER_POS.x, y: USER_POS.y, type: 'user', color: colors.info },
            { id: 'helper', x: helperPos.x, y: helperPos.y, type: 'helper' },
          ]}
        />
        <View style={styles.etaBadge}>
          <Ionicons name="time" size={14} color={colors.accent} />
          <Text style={styles.etaText}>{etaMinutes} min away</Text>
        </View>
      </View>

      <View style={styles.helperCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{helper.avatarInitials}</Text>
        </View>
        <View style={styles.helperInfo}>
          <Text style={styles.helperName}>{helper.name}</Text>
          <RatingStars rating={helper.rating} />
          <View style={styles.plateRow}>
            <MaterialCommunityIcons name="card-text-outline" size={14} color={colors.textMuted} />
            <Text style={styles.plateText}>{helper.vehicleNumber}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <NeonButton
          label="Call Helper"
          onPress={() => callNumber(helper.phone)}
          style={styles.actionButton}
          icon={<Ionicons name="call" size={18} color={colors.background} />}
        />
        <NeonButton
          label="Cancel Request"
          onPress={handleCancel}
          variant="danger"
          style={styles.actionButton}
        />
      </View>

      <Modal visible={completed} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={34} color={colors.background} />
            </View>
            <Text style={styles.modalTitle}>Service Completed</Text>
            <Text style={styles.modalSubtitle}>
              {helper.name} has finished the job. Review your bill to complete payment.
            </Text>
            <NeonButton label="View Invoice" onPress={handleViewReceipt} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h1,
    fontSize: 21,
  },
  headerSubtitle: {
    ...typography.caption,
    marginTop: 4,
  },
  mapWrap: {
    paddingHorizontal: spacing.lg,
  },
  etaBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg + spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18,18,18,0.85)',
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radius.round,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  etaText: {
    ...typography.caption,
    color: colors.accent,
    marginLeft: 4,
    fontWeight: '700',
  },
  helperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    ...shadow.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    ...typography.h2,
    color: colors.accent,
  },
  helperInfo: {
    flex: 1,
  },
  helperName: {
    ...typography.bodyBold,
    fontSize: 17,
    marginBottom: 4,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  plateText: {
    ...typography.caption,
    marginLeft: 5,
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: 'auto',
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  successCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h1,
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
