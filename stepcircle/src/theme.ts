/**
 * Dark, ring-forward look in the spirit of Apple Fitness. Ring colors follow
 * the familiar Move/Exercise/Stand trio so the metaphor reads instantly.
 */
export const colors = {
  background: '#000000',
  card: '#1C1C1E',
  cardElevated: '#2C2C2E',
  separator: '#38383A',
  text: '#FFFFFF',
  textSecondary: '#98989F',
  tint: '#0A84FF',
  move: '#FA114F',
  moveDim: '#3B0F1E',
  exercise: '#92E82A',
  exerciseDim: '#22370D',
  stand: '#00D3F9',
  standDim: '#0A303B',
  gold: '#FFD60A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const type = {
  largeTitle: { fontSize: 32, fontWeight: '700' as const, color: colors.text },
  title: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  headline: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary },
  stat: { fontSize: 24, fontWeight: '700' as const, color: colors.text },
};
