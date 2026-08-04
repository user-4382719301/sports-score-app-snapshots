import { FIREBASE_CONFIG, SOCIAL_BACKEND } from '../config';
import type { SocialService } from './SocialService';
import { DemoSocialService } from './demoSocialService';

/**
 * Picks the social backend. Demo is the default; flip SOCIAL_BACKEND to
 * 'firebase' and fill in FIREBASE_CONFIG (src/config.ts) to go multi-user.
 * Falls back to demo with a warning rather than crashing on a bad config.
 */
export function createSocialService(): SocialService {
  if (SOCIAL_BACKEND === 'firebase' && FIREBASE_CONFIG.projectId) {
    try {
      const { FirebaseSocialService } = require('./firebaseSocialService');
      return new FirebaseSocialService();
    } catch (e) {
      console.warn('[social] Firebase backend unavailable, using demo data', e);
    }
  }
  return new DemoSocialService();
}

export type { SocialService };
