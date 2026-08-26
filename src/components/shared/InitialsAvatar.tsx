import { StyleSheet, View } from 'react-native';
import { radii } from '@/theme';
import { AppText } from './AppText';

interface InitialsAvatarProps {
  initials: string;
  color: string;
  size?: number;
  /** Squared avatars read as team crests; round as player faces. */
  shape?: 'round' | 'square';
}

/** Generated placeholder art: tinted tile + initials. No licensed marks. */
export function InitialsAvatar({ initials, color, size = 44, shape = 'round' }: InitialsAvatarProps) {
  const fontVariant = size >= 56 ? 'heading' : size >= 40 ? 'subheading' : 'micro';
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: shape === 'round' ? size / 2 : radii.md,
          backgroundColor: `${color}2E`,
          borderColor: `${color}66`,
        },
      ]}
    >
      <AppText variant={fontVariant} color={color}>
        {initials}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
