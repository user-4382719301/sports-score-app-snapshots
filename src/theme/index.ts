/**
 * Relay design tokens. Premium dark mode: near-black navy surfaces, purple
 * brand accent, blue for live states, green for success, gold for evolved
 * cards, red for failures. All colors pass WCAG AA against their intended
 * surfaces at body sizes.
 */

export const colors = {
  // Surfaces
  background: '#070B14',
  surface: '#0D1421',
  surfaceRaised: '#131C2E',
  surfaceSunken: '#0A101B',
  border: '#1E2A42',
  borderStrong: '#2C3B5C',

  // Brand
  primary: '#8B5CF6',
  primaryBright: '#A78BFA',
  primaryDeep: '#5B34C4',
  primarySoft: 'rgba(139, 92, 246, 0.16)',

  // Live / statistical
  live: '#38BDF8',
  liveDeep: '#0284C7',
  liveSoft: 'rgba(56, 189, 248, 0.14)',

  // Relay success
  success: '#34D399',
  successDeep: '#059669',
  successSoft: 'rgba(52, 211, 153, 0.14)',

  // Evolved / high-level
  gold: '#F2C14E',
  goldDeep: '#B98A1F',
  goldSoft: 'rgba(242, 193, 78, 0.14)',

  // Failure / urgency
  danger: '#F87171',
  dangerDeep: '#DC2626',
  dangerSoft: 'rgba(248, 113, 113, 0.14)',

  // Text
  textPrimary: '#F2F5FB',
  textSecondary: '#9DA9C0',
  textMuted: '#66748F',
  textOnAccent: '#0B0F1A',

  // Misc
  overlay: 'rgba(4, 7, 13, 0.72)',
  shimmer: 'rgba(255, 255, 255, 0.05)',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export interface TypeVariant {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  letterSpacing?: number;
}

export const typography: Record<
  'display' | 'title' | 'heading' | 'subheading' | 'body' | 'bodyBold' | 'caption' | 'label' | 'micro',
  TypeVariant
> = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 23, lineHeight: 29, fontWeight: '800', letterSpacing: -0.3 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '700', letterSpacing: -0.2 },
  subheading: { fontSize: 15, lineHeight: 21, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' },
  bodyBold: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0.6 },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.2 },
} as const;

/** Minimum recommended hit target on iOS. */
export const MIN_TAP_TARGET = 44;

/** Caps Dynamic Type scaling so layouts stay usable while still growing. */
export const MAX_FONT_SCALE = 1.4;
