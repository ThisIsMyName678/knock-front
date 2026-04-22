// ─── Design Tokens ──────────────────────────────────────────────────────────
// Single source of truth for all visual values.
// NEVER import colors/spacing/typography directly — always go through tokens.

export const Colors = {
  // Brand
  primary: '#004a99',
  primaryLight: '#1a65b3',
  primaryDark: '#003875',
  primaryContainer: '#d7e2ff',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#001b3f',

  // Surfaces
  background: '#f9f9ff',
  surface: '#ffffff',
  surfaceVariant: '#f1f4f9',
  surfaceElevated: '#ffffff',

  // Text
  onBackground: '#111c2d',
  onSurface: '#111c2d',
  onSurfaceVariant: '#64748b',
  onSurfaceMuted: '#94a3b8',

  // Semantic
  success: '#10b981',
  successContainer: '#d1fae5',
  onSuccess: '#ffffff',

  warning: '#f59e0b',
  warningContainer: '#fef3c7',
  onWarning: '#ffffff',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',

  info: '#0284c7',
  infoContainer: '#e0f2fe',

  // Borders
  outline: '#94a3b8',
  outlineVariant: '#c2c6d3',
  outlineLight: '#e8eaf0',

  // Money direction
  inbound: '#10b981',
  inboundBg: '#d1fae5',
  outbound: '#ef4444',
  outboundBg: '#fee2e2',

  // Feed / Feed stripe colors
  feedMaintenance: '#f59e0b',
  feedPayments: '#004a99',
  feedMessages: '#10b981',
  feedContracts: '#6b7280',

  // Status
  statusOpen: '#f59e0b',
  statusOpenBg: '#fef3c7',
  statusInProgress: '#004a99',
  statusInProgressBg: '#d7e2ff',
  statusClosed: '#10b981',
  statusClosedBg: '#d1fae5',
  statusCancelled: '#6b7280',
  statusCancelledBg: '#f1f5f9',

  // Tab bar
  tabActive: '#004a99',
  tabInactive: '#94a3b8',
  tabBg: '#ffffff',
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
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  full: 999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 8,
  },
} as const;

export const FontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
} as const;

export const FontFamily = {
  regular: 'Assistant_400Regular',
  semiBold: 'Assistant_600SemiBold',
  bold: 'Assistant_700Bold',
  extraBold: 'Assistant_800ExtraBold',
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.4,
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

// Touch target minimum (accessibility)
export const MIN_TOUCH = 44;

// Layout
export const HEADER_HEIGHT = 60;
export const TAB_BAR_HEIGHT = 62;
export const CONTENT_HORIZONTAL_PADDING = 16;
export const MAX_CONTENT_WIDTH = 640; // for tablet centering
