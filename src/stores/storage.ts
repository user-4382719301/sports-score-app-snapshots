import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import { buildSeed, type SeedData } from '@/data';

export const zustandStorage = createJSONStorage(() => AsyncStorage);

export const STORE_KEYS = [
  'relay/user',
  'relay/games',
  'relay/collection',
  'relay/relay',
  'relay/history',
  'relay/notifications',
  'relay/rewards',
] as const;

let seed: SeedData | null = null;

/** One shared seed per launch so every store starts from the same world. */
export function getInitialSeed(): SeedData {
  if (!seed) {
    seed = buildSeed(new Date());
  }
  return seed;
}

/** Force-build a fresh seed (used by reset-demo and day rollover). */
export function rebuildSeed(): SeedData {
  seed = buildSeed(new Date());
  return seed;
}

export async function clearPersistedState(): Promise<void> {
  await AsyncStorage.multiRemove([...STORE_KEYS]);
}
