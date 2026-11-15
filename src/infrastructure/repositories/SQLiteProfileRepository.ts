import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import type { UserProfile } from '../../domain/models';
import { getFirebaseAuth } from '../firebase';
import { getLocalDatabase } from '../sqliteDatabase';

function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase();
}

export class SQLiteProfileRepository implements ProfileRepository {
  async signIn(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(getFirebaseAuth(), normalizeEmail(email), password);
    return this.profileForUser(credential.user);
  }

  async createAccount(email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), normalizeEmail(email), password);
    const profile = await this.profileForUser(credential.user);
    await this.saveProfile(profile);
    return profile;
  }

  signOut() {
    return firebaseSignOut(getFirebaseAuth());
  }

  observeAuthState(listener: (profile: UserProfile | null) => void) {
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (!user) {
        listener(null);
        return;
      }
      void this.profileForUser(user).then(listener).catch(() => listener(null));
    });
  }

  async saveProfile(profile: UserProfile) {
    const db = await getLocalDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO profiles (username, payload) VALUES (?, ?)',
      normalizeEmail(profile.username),
      JSON.stringify(profile),
    );
    const user = getFirebaseAuth().currentUser;
    if (user && normalizeEmail(user.email ?? '') === normalizeEmail(profile.username)) {
      await updateProfile(user, { displayName: profile.displayName });
    }
  }

  async changePassword(email: string, currentPassword: string, newPassword: string) {
    const user = getFirebaseAuth().currentUser;
    if (!user?.email || normalizeEmail(user.email) !== normalizeEmail(email)) return false;

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      return true;
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error &&
          (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-mismatch')) return false;
      throw error;
    }
  }

  private async profileForUser(user: User): Promise<UserProfile> {
    const email = user.email ?? '';
    const normalized = normalizeEmail(email);
    const db = await getLocalDatabase();
    const row = await db.getFirstAsync<{ payload: string }>(
      'SELECT payload FROM profiles WHERE username = ?', normalized,
    );
    if (row) return { ...(JSON.parse(row.payload) as UserProfile), uid: user.uid };

    return {
      username: normalized,
      displayName: user.displayName?.trim() || normalized.split('@')[0] || 'Cliente',
      photoUri: user.photoURL,
      uid: user.uid,
    };
  }
}
