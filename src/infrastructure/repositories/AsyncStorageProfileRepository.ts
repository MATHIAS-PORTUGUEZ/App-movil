import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { ProfileRepository } from '../../domain/repositories/ProfileRepository';
import type { UserProfile } from '../../domain/models';

const PROFILES_KEY = 'barber-shop.profiles.v1';
const CREDENTIALS_KEY_PREFIX = 'barber-shop.credentials.v1.';

function normalizeUsername(username: string) {
  return username.trim().toLocaleLowerCase();
}

function credentialKey(username: string) {
  return `${CREDENTIALS_KEY_PREFIX}${encodeURIComponent(normalizeUsername(username))}`;
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
  async signIn(
    username: string,
    password: string,
  ): Promise<UserProfile | null> {
    const normalizedUsername = normalizeUsername(username);
    const profiles = parseProfiles(
      await AsyncStorage.getItem(PROFILES_KEY),
    );
    const savedPassword = await SecureStore.getItemAsync(
      credentialKey(normalizedUsername),
    );
    const existingProfile = profiles.find(
      (profile) => normalizeUsername(profile.username) === normalizedUsername,
    );

    if (
      savedPassword !== null &&
      savedPassword !== password
    ) {
      return null;
    }
    if (savedPassword === null && existingProfile) {
      throw new Error(
        'No se pudo verificar esta cuenta local. Crea otra cuenta en este dispositivo.',
      );
    }
    const profile =
      existingProfile ?? {
        username: username.trim(),
        displayName: username.trim(),
        photoUri: null,
      };

    if (savedPassword === null) {
      await SecureStore.setItemAsync(credentialKey(normalizedUsername), password);
    }

    if (!existingProfile) {
      await AsyncStorage.setItem(
        PROFILES_KEY,
        JSON.stringify([...profiles, profile]),
      );
    }

    return profile;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    const profiles = parseProfiles(
      await AsyncStorage.getItem(PROFILES_KEY),
    );
    const normalizedUsername = normalizeUsername(profile.username);
    const updatedProfiles = profiles.some(
      (item) => normalizeUsername(item.username) === normalizedUsername,
    )
      ? profiles.map((item) =>
          normalizeUsername(item.username) === normalizedUsername
            ? profile
            : item,
        )
      : [...profiles, profile];

    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(updatedProfiles));
  }

  async changePassword(
    username: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const normalizedUsername = normalizeUsername(username);
    const key = credentialKey(normalizedUsername);
    const savedPassword = await SecureStore.getItemAsync(key);
    if (savedPassword !== currentPassword) return false;

    await SecureStore.setItemAsync(key, newPassword);
    return true;
  }
}
