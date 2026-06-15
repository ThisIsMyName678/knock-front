// ─── Design Tokens ──────────────────────────────────────────────────────────
// Single source of truth for all visual values.

export const Colors = {
  primary: '#18181B',
  primaryLight: '#3F3F46',
  primaryDark: '#09090B',
  primaryContainer: '#F1F5F9',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#18181B',

  accent: '#6366F1',
  accentMuted: '#EEF2FF',
  onAccent: '#FFFFFF',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  surfaceElevated: '#FFFFFF',

  onBackground: '#0F172A',
  onSurface: '#0F172A',
  onSurfaceVariant: '#64748B',
  onSurfaceMuted: '#94A3B8',

  success: '#10B981',
  successContainer: '#ECFDF5',
  onSuccess: '#FFFFFF',

  warning: '#F59E0B',
  warningContainer: '#FFFBEB',
  onWarning: '#FFFFFF',

  error: '#DC2626',
  errorContainer: '#FEF2F2',
  onError: '#FFFFFF',

  info: '#0EA5E9',
  infoContainer: '#F0F9FF',

  outline: '#CBD5E1',
  outlineVariant: '#E2E8F0',
  outlineLight: '#E2E8F0',

  inbound: '#10B981',
  inboundBg: '#ECFDF5',
  outbound: '#EF4444',
  outboundBg: '#FEF2F2',

  feedMaintenance: '#F59E0B',
  feedPayments: '#6366F1',
  feedMessages: '#10B981',
  feedContracts: '#64748B',
  feedDocuments: '#8B5CF6',

  statusOpen: '#F59E0B',
  statusOpenBg: '#FFFBEB',
  statusInProgress: '#6366F1',
  statusInProgressBg: '#EEF2FF',
  statusClosed: '#10B981',
  statusClosedBg: '#ECFDF5',
  statusCancelled: '#64748B',
  statusCancelledBg: '#F1F5F9',

  tabActive: '#18181B',
  tabInactive: '#94A3B8',
  tabBg: '#FFFFFF',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 20,
  '2xl': 24,
  full: 999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

export const FontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 26,
  '4xl': 32,
} as const;

export const FontFamily = {
  regular: 'Assistant_400Regular',
  semiBold: 'Assistant_600SemiBold',
  bold: 'Assistant_700Bold',
  extraBold: 'Assistant_800ExtraBold',
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.45,
  relaxed: 1.6,
} as const;

export const ZIndex = {
  base: 1,
  dropdown: 10,
  sticky: 20,
  header: 50,
  modal: 100,
  toast: 200,
} as const;

export const MIN_TOUCH = 44;
export const HEADER_HEIGHT = 60;
export const TAB_BAR_HEIGHT = 62;
export const CONTENT_HORIZONTAL_PADDING = 20;
export const MAX_CONTENT_WIDTH = 640;

/** Shared layout presets */
export const SurfaceStyle = {
  page: { flex: 1 as const, backgroundColor: Colors.background },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineLight,
    ...Shadow.sm,
  },
} as const;
