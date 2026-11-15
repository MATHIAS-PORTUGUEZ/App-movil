import AsyncStorage from '@react-native-async-storage/async-storage';
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

const PROFILES_KEY = 'barber-shop.profiles.v1';

function normalizeEmail(email: string) {
  return email.trim().toLocaleLowerCase();
}

function isUserProfile(value: unknown): value is UserProfile {
  if (typeof value !== 'object' || value === null) return false;
  const profile = value as Record<string, unknown>;
  return (
    typeof profile.username === 'string' &&
    typeof profile.displayName === 'string' &&
    (typeof profile.photoUri === 'string' || profile.photoUri === null)
  );
}

function parseProfiles(value: string | null): UserProfile[] {
  if (!value) return [];

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || !parsed.every(isUserProfile)) {
    throw new Error('No se pudieron leer los perfiles guardados.');
  }

  return parsed;
}

export class AsyncStorageProfileRepository implements ProfileRepository {
  async signIn(email: string, password: string): Promise<UserProfile | null> {
    const credential = await signInWithEmailAndPassword(
      getFirebaseAuth(),
      normalizeEmail(email),
      password,
    );
    return this.profileForUser(credential.user);
  }

  async createAccount(
    email: string,
    password: string,
  ): Promise<UserProfile | null> {
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      normalizeEmail(email),
      password,
    );
    const profile = await this.profileForUser(credential.user);
    await this.saveProfile(profile);
    return profile;
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(getFirebaseAuth());
  }

  observeAuthState(listener: (profile: UserProfile | null) => void) {
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (!user) {
        listener(null);
        return;
      }

      void this.profileForUser(user)
        .then(listener)
        .catch(() => listener(null));
    });
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    const profiles = parseProfiles(await AsyncStorage.getItem(PROFILES_KEY));
    const normalizedEmail = normalizeEmail(profile.username);
    const updatedProfiles = profiles.some(
      (item) => normalizeEmail(item.username) === normalizedEmail,
    )
      ? profiles.map((item) =>
          normalizeEmail(item.username) === normalizedEmail ? profile : item,
        )
      : [...profiles, profile];

    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));

    const user = getFirebaseAuth().currentUser;
    if (user && normalizeEmail(user.email ?? '') === normalizedEmail) {
      await updateProfile(user, { displayName: profile.displayName });
    }
  }

  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = getFirebaseAuth().currentUser;
    if (!user?.email || normalizeEmail(user.email) !== normalizeEmail(email)) {
      return false;
    }

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      return true;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error.code === 'auth/invalid-credential' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/user-mismatch')
      ) {
        return false;
      }
      throw error;
    }
  }

  private async profileForUser(user: User): Promise<UserProfile> {
    const email = user.email ?? '';
    const normalizedEmail = normalizeEmail(email);
    const profiles = parseProfiles(await AsyncStorage.getItem(PROFILES_KEY));
    const existingProfile = profiles.find(
      (profile) => normalizeEmail(profile.username) === normalizedEmail,
    );
    if (existingProfile) return { ...existingProfile, uid: user.uid };

    return {
      username: normalizedEmail,
      displayName:
        user.displayName?.trim() || normalizedEmail.split('@')[0] || 'Cliente',
      photoUri: user.photoURL,
      uid: user.uid,
    };
  }
}
