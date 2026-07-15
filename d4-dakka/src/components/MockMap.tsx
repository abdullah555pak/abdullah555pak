import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

export interface MapMarker {
  id: string;
  x: number; // percentage across the map, 0-100
  y: number; // percentage down the map, 0-100
  type: 'user' | 'helper';
  color?: string;
}

interface MockMapProps {
  markers: MapMarker[];
  height?: number;
  style?: ViewStyle;
}

const ROAD_LINES = [
  { top: '18%', width: '140%', rotate: '-8deg', left: '-20%' },
  { top: '46%', width: '160%', rotate: '4deg', left: '-30%' },
  { top: '72%', width: '150%', rotate: '-3deg', left: '-25%' },
  { top: '0%', width: '2px', height: '100%', left: '28%', vertical: true, rotate: '6deg' },
  { top: '0%', width: '2px', height: '100%', left: '68%', vertical: true, rotate: '-5deg' },
] as const;

function RoadLines() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {ROAD_LINES.map((line, index) => (
        <View
          key={index}
          style={[
            styles.roadLine,
            {
              top: line.top,
              left: line.left,
              width: line.width as any,
              height: (line as any).vertical ? ((line as any).height as any) : 2,
              transform: [{ rotate: line.rotate }],
            },
          ]}
        />
      ))}
    </View>
  );
}

function PulsingUserMarker({ color = colors.accent }: { color?: string }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <View style={styles.markerAnchor}>
      <Animated.View
        style={[styles.pulseRing, { backgroundColor: color, transform: [{ scale }], opacity }]}
      />
      <View style={[styles.userDot, { backgroundColor: color }]}>
        <View style={styles.userDotCore} />
      </View>
    </View>
  );
}

function HelperMarker() {
  return (
    <View style={styles.markerAnchor}>
      <View style={styles.helperBadge}>
        <MaterialCommunityIcons name="tow-truck" size={16} color={colors.background} />
      </View>
    </View>
  );
}

export function MockMap({ markers, height = 240, style }: MockMapProps) {
  return (
    <View style={[styles.container, { height }, style]}>
      <LinearGradient
        colors={['#1a2a1f', '#141414', '#111826']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <RoadLines />
      {markers.map((marker) => (
        <View
          key={marker.id}
          style={[
            styles.markerPosition,
            { left: `${marker.x}%` as any, top: `${marker.y}%` as any },
          ]}
        >
          {marker.type === 'user' ? (
            <PulsingUserMarker color={marker.color} />
          ) : (
            <HelperMarker />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  roadLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  markerPosition: {
    position: 'absolute',
    marginLeft: -16,
    marginTop: -16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerAnchor: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.accent,
  },
  userDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F1400',
  },
  userDotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F1400',
  },
  helperBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F1400',
  },
});
