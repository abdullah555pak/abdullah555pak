import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, radius, shadow, typography } from '../theme';

interface NeonButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'solid' | 'outline' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function NeonButton({
  label,
  onPress,
  variant = 'solid',
  disabled,
  loading,
  icon,
  style,
  fullWidth = true,
}: NeonButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
  };

  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, style, { transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        style={[
          styles.base,
          isOutline && styles.outline,
          isDanger && styles.danger,
          !isOutline && !isDanger && !disabled && shadow.glow,
          (disabled || loading) && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isOutline ? colors.accent : colors.background} />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.label,
                isOutline && styles.outlineLabel,
                isDanger && styles.dangerLabel,
                icon ? { marginLeft: 8 } : null,
              ]}
            >
              {label}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  base: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.accentBorder,
  },
  danger: {
    backgroundColor: colors.dangerDim,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.bodyBold,
    color: colors.background,
    fontSize: 16,
  },
  outlineLabel: {
    color: colors.accent,
  },
  dangerLabel: {
    color: colors.danger,
  },
});
