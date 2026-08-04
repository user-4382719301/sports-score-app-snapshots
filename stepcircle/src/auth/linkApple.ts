export type AppleLinkResult = 'linked' | 'already-linked' | 'unavailable' | 'cancelled' | 'failed';

/**
 * Link a Sign in with Apple credential onto the current (anonymous) Firebase
 * user so the account survives device swaps and reinstalls. Uses the
 * standard nonce flow: Apple gets the SHA-256 hash, Firebase gets the raw
 * nonce to verify the identity token was minted for this request.
 *
 * All modules are lazy-required so demo mode and Android never load them;
 * on any missing module/capability this degrades to 'unavailable'.
 */
export async function linkAppleAccount(): Promise<AppleLinkResult> {
  let AppleAuth: typeof import('expo-apple-authentication');
  let Crypto: typeof import('expo-crypto');
  let firebaseAuth: typeof import('firebase/auth');
  try {
    AppleAuth = require('expo-apple-authentication');
    Crypto = require('expo-crypto');
    firebaseAuth = require('firebase/auth');
  } catch {
    return 'unavailable';
  }

  try {
    if (!(await AppleAuth.isAvailableAsync())) return 'unavailable';
    const user = firebaseAuth.getAuth().currentUser;
    if (!user) return 'failed';
    if (user.providerData.some((p) => p.providerId === 'apple.com')) return 'already-linked';

    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );

    const appleCredential = await AppleAuth.signInAsync({
      requestedScopes: [
        AppleAuth.AppleAuthenticationScope.FULL_NAME,
        AppleAuth.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    if (!appleCredential.identityToken) return 'failed';

    const provider = new firebaseAuth.OAuthProvider('apple.com');
    const credential = provider.credential({
      idToken: appleCredential.identityToken,
      rawNonce,
    });
    await firebaseAuth.linkWithCredential(user, credential);
    return 'linked';
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'ERR_REQUEST_CANCELED') return 'cancelled';
    if (code === 'auth/provider-already-linked' || code === 'auth/credential-already-in-use') {
      return 'already-linked';
    }
    console.warn('[auth] Apple link failed', e);
    return 'failed';
  }
}
