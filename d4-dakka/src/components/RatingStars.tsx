import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';

interface RatingStarsProps {
  rating: number;
  size?: number;
}

export function RatingStars({ rating, size = 14 }: RatingStarsProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }).map((_, index) => {
        let name: React.ComponentProps<typeof Ionicons>['name'] = 'star-outline';
        if (index < fullStars) name = 'star';
        else if (index === fullStars && hasHalf) name = 'star-half';
        return <Ionicons key={index} name={name} size={size} color={colors.accent} style={styles.star} />;
      })}
      <Text style={styles.value}>{rating.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
  value: {
    ...typography.caption,
    marginLeft: 6,
    color: colors.textSecondary,
  },
});
