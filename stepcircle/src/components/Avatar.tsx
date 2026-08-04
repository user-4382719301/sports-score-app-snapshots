import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  initials: string;
  color: string;
  size?: number;
}

export function Avatar({ initials, color, size = 44 }: Props) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  text: { color: '#000', fontWeight: '700' },
});
