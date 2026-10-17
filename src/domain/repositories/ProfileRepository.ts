import type { UserProfile } from '../models';

export interface ProfileRepository {
  signIn(username: string, password: string): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<void>;
  changePassword(
    username: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean>;
}
