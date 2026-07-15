import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NeonButton } from '../components/NeonButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { PaymentMethod, useAppState } from '../context/AppStateContext';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentAndReceipt'>;

const PAYMENT_METHODS: { key: PaymentMethod; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { key: 'Cash on Delivery', icon: 'cash-multiple' },
  { key: 'Digital Wallet', icon: 'wallet-outline' },
];

export function PaymentAndReceipt({ navigation }: Props) {
  const { receipt, completePayment } = useAppState();
  const [method, setMethod] = useState<PaymentMethod>('Cash on Delivery');
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!success) return;
    const timeout = setTimeout(() => {
      navigation.replace('HomeDashboard');
    }, 2000);
    return () => clearTimeout(timeout);
  }, [success, navigation]);

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      completePayment(method);
      setPaying(false);
      setSuccess(true);
    }, 900);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Invoice & Payment" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <MaterialCommunityIcons name="receipt" size={22} color={colors.accent} />
            <Text style={styles.receiptTitle}>D4 Dakka Receipt</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Service Type</Text>
            <Text style={styles.rowValue}>{receipt?.serviceType ?? '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Vehicle</Text>
            <Text style={styles.rowValue}>{receipt?.vehicleType ?? '—'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Base Fare</Text>
            <Text style={styles.rowValue}>Rs. {receipt?.baseFare ?? 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Distance Fee</Text>
            <Text style={styles.rowValue}>Rs. {receipt?.distanceFee ?? 0}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>Rs. {receipt?.total ?? 0}</Text>
          </View>
        </View>

        <Text style={styles.fieldLabel}>PAYMENT METHOD</Text>
        <View style={styles.methodRow}>
          {PAYMENT_METHODS.map((option) => {
            const active = method === option.key;
            return (
              <Pressable
                key={option.key}
                style={[styles.methodOption, active && styles.methodOptionActive]}
                onPress={() => setMethod(option.key)}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={22}
                  color={active ? colors.background : colors.textSecondary}
                />
                <Text style={[styles.methodText, active && styles.methodTextActive]}>{option.key}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <NeonButton label="Done & Pay" onPress={handlePay} loading={paying} disabled={paying || !receipt} />
      </View>

      <Modal visible={success} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={40} color={colors.background} />
          </View>
          <Text style={styles.successTitle}>Payment Successful</Text>
          <Text style={styles.successSubtitle}>Thanks for riding with D4 Dakka</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  receiptCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  receiptTitle: {
    ...typography.h2,
    marginLeft: spacing.sm,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  rowValue: {
    ...typography.bodyBold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    ...typography.h2,
    fontSize: 16,
  },
  totalValue: {
    ...typography.h1,
    color: colors.accent,
    fontSize: 20,
  },
  fieldLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  methodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  methodOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },
  methodOptionActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  methodText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: '700',
    textAlign: 'center',
  },
  methodTextActive: {
    color: colors.background,
  },
  footer: {
    padding: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.h1,
  },
  successSubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
