import React, { useEffect } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './navigation/RootNavigator';
import { useAppStore } from './store/useAppStore';
import { colors } from './theme';

const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    primary: colors.tint,
  },
};

export default function App() {
  const ready = useAppStore((s) => s.ready);
  const init = useAppStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  // Pull fresh health + social data whenever the app returns to the foreground,
  // so rings reflect steps taken while the phone was pocketed.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      const { ready: isReady, refresh } = useAppStore.getState();
      if (state === 'active' && isReady) void refresh();
    });
    return () => subscription.remove();
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>StepCircle</Text>
        <ActivityIndicator color={colors.move} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme}>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  splashTitle: { color: colors.text, fontSize: 28, fontWeight: '700' },
});
