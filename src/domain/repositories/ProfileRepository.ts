import type { UserProfile } from '../models';

export interface ProfileRepository {
  signIn(email: string, password: string): Promise<UserProfile | null>;
  createAccount(
    email: string,
    password: string,
  ): Promise<UserProfile | null>;
  signOut(): Promise<void>;
  observeAuthState(
    listener: (profile: UserProfile | null) => void,
  ): () => void;
  saveProfile(profile: UserProfile): Promise<void>;
  changePassword(
    username: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean>;
}
