export const colors = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceElevated: '#252525',
  surfaceInput: '#2A2A2A',
  accent: '#E0FF00',
  accentDim: 'rgba(224, 255, 0, 0.16)',
  accentBorder: 'rgba(224, 255, 0, 0.35)',
  text: '#F5F5F5',
  textSecondary: '#ABABAB',
  textMuted: '#6E6E6E',
  border: '#2C2C2C',
  danger: '#FF4D4D',
  dangerDim: 'rgba(255, 77, 77, 0.15)',
  success: '#3DDC84',
  successDim: 'rgba(61, 220, 132, 0.15)',
  info: '#4DA8FF',
  black: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  round: 999,
} as const;

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
    color: colors.text,
  },
  h1: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.text,
  },
  h2: {
    fontSize: 19,
    fontWeight: '700' as const,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.text,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.text,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
};

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 10,
  },
};
