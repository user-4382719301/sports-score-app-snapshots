/**
 * App configuration.
 *
 * SOCIAL_BACKEND:
 *  - 'demo'     — on-device fake friends/competitions; zero setup, works in Expo Go.
 *  - 'firebase' — real multi-user backend. Fill in FIREBASE_CONFIG (Firebase
 *    console → Project settings → Your apps → Web app) and deploy the rules +
 *    functions in ../firebase (see docs/BACKEND.md).
 */
export const SOCIAL_BACKEND: 'demo' | 'firebase' = 'demo';

export const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};
