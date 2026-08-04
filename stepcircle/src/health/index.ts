import { Platform } from 'react-native';
import type { HealthAdapter } from './HealthAdapter';
import { DemoHealthAdapter } from './demoAdapter';

/**
 * Picks the platform health store, falling back to demo data when the native
 * module isn't present (Expo Go, web preview, tests). The requires are lazy so
 * a missing native module can't crash startup.
 */
export function createHealthAdapter(): HealthAdapter {
  try {
    if (Platform.OS === 'ios') {
      const { HealthKitAdapter } = require('./healthKitAdapter');
      return new HealthKitAdapter();
    }
    if (Platform.OS === 'android') {
      const { HealthConnectAdapter } = require('./healthConnectAdapter');
      return new HealthConnectAdapter();
    }
  } catch (e) {
    console.warn('[health] native health module unavailable, using demo data', e);
  }
  return new DemoHealthAdapter();
}

export { DemoHealthAdapter };
export type { HealthAdapter };
