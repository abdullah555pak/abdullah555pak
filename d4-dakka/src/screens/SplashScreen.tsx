import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NeonButton } from '../components/NeonButton';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, shadow, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [fade, rise, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Animated.View style={[styles.logoWrap, { opacity: fade, transform: [{ translateY: rise }] }]}>
          <View style={styles.logoGlow}>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <MaterialCommunityIcons name="tire" size={92} color={colors.accentBorder} />
            </Animated.View>
            <MaterialCommunityIcons
              name="wrench"
              size={44}
              color={colors.accent}
              style={styles.wrenchOverlay}
            />
          </View>
          <Text style={styles.title}>D4 DAKKA</Text>
          <Text style={styles.subtitle}>STUCK? WE&apos;VE GOT YOUR BACK</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: fade }]}>
        <NeonButton label="GET STARTED" onPress={() => navigation.replace('HomeDashboard')} />
        <Text style={styles.footerNote}>24/7 roadside help across Lahore</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
  },
  logoGlow: {
    width: 160,
    height: 160,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadow.glow,
  },
  wrenchOverlay: {
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
  },
  title: {
    ...typography.display,
    letterSpacing: 4,
  },
  subtitle: {
    ...typography.label,
    marginTop: spacing.sm,
    color: colors.accent,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  footerNote: {
    ...typography.caption,
    marginTop: spacing.md,
  },
});
