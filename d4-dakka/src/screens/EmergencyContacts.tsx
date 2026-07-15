import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { callNumber } from '../utils/dialer';

type Props = NativeStackScreenProps<RootStackParamList, 'EmergencyContacts'>;

interface EmergencyContact {
  id: string;
  name: string;
  description: string;
  number: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

const CONTACTS: EmergencyContact[] = [
  { id: 'police', name: 'Police', description: 'National emergency police line', number: '15', icon: 'police-badge' },
  { id: 'ambulance', name: 'Ambulance', description: 'Rescue 1122 emergency medical', number: '1122', icon: 'ambulance' },
  { id: 'highway', name: 'Highway Helpline', description: 'National Highways & Motorway Police', number: '130', icon: 'road-variant' },
  { id: 'fire', name: 'Fire Brigade', description: 'Rescue and fire emergency', number: '16', icon: 'fire-truck' },
  { id: 'd4dakka', name: 'D4 Dakka Support', description: 'Direct roadside assistance line', number: '+923001234567', icon: 'wrench' },
];

export function EmergencyContacts({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Emergency Contacts" onBack={() => navigation.goBack()} />
      <FlatList
        data={CONTACTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => callNumber(item.number)}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name={item.icon} size={22} color={colors.accent} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.number}>{item.number}</Text>
            </View>
            <View style={styles.callButton}>
              <Ionicons name="call" size={18} color={colors.background} />
            </View>
          </Pressable>
        )}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.bodyBold,
    fontSize: 16,
  },
  description: {
    ...typography.caption,
    marginTop: 2,
  },
  number: {
    ...typography.caption,
    color: colors.accent,
    marginTop: 4,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
});
