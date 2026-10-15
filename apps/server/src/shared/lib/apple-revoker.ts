/** What the server keeps of a Believer's Sign in with Apple (`account` row). */
export interface AppleGrant {
  idToken: string | null;
  accessToken: string | null;
  refreshToken: string | null;
}

/**
 * Revokes a Believer's Sign in with Apple when their account is deleted
 * (Apple's account deletion requirement).
 */
export interface AppleRevoker {
  /**
   * `authorizationCode` is a fresh one from the device's Apple sheet: a
   * native sign-in hands the server only an ID token, which Apple does not
   * revoke, so the code is exchanged for a refresh token first.
   */
  revoke: (grant: AppleGrant, authorizationCode?: string) => Promise<void>;
}
