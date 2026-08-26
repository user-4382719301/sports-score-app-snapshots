import { Text, type TextProps } from 'react-native';
import { colors, MAX_FONT_SCALE, typography, type TypeVariant } from '@/theme';

type Variant = keyof typeof typography;

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Single text primitive: every string in the app renders through this so
 * hierarchy, color, and Dynamic Type limits stay consistent.
 */
export function AppText({
  variant = 'body',
  color = colors.textPrimary,
  align,
  style,
  ...rest
}: AppTextProps) {
  const type: TypeVariant = typography[variant];
  return (
    <Text
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...rest}
      style={[
        {
          fontSize: type.fontSize,
          lineHeight: type.lineHeight,
          fontWeight: type.fontWeight,
          letterSpacing: type.letterSpacing,
          color,
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
