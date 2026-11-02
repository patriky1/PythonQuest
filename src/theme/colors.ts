import { Platform } from 'react-native';

export const colors = {
  background: '#F5F7FB',
  card: '#FFFFFF',
  surfaceMuted: '#F1F5F9',

  ink: '#0F172A',
  inkSoft: '#1E293B',
  inkText: '#CBD5E1',

  primary: '#16A34A',
  primaryDark: '#15803D',
  primarySoft: '#DCFCE7',
  primaryBorder: '#BBF7D0',

  secondary: '#2563EB',
  secondaryDark: '#1D4ED8',
  secondarySoft: '#DBEAFE',
  secondaryBorder: '#BFDBFE',

  accent: '#FACC15',
  accentSoft: '#FEF3C7',
  accentText: '#92400E',

  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  dangerBorder: '#FECACA',
  dangerText: '#991B1B',

  warning: '#D97706',
  heart: '#E11D48',

  text: '#0F172A',
  textSecondary: '#334155',
  muted: '#64748B',
  border: '#E2E8F0',
  locked: '#CBD5E1',

  codeBg: '#0F172A',
  codeText: '#E2E8F0',
  codeOutput: '#86EFAC'
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999
};

export const monoFont = Platform.select({
  ios: 'Menlo',
  default: 'monospace'
});

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2
  },
  raised: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5
  }
};
