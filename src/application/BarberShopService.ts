import type { RequestRepository } from '../domain/repositories/RequestRepository';
import type { ProfileRepository } from '../domain/repositories/ProfileRepository';
import { SlotAlreadyBookedError } from '../domain/errors/SlotAlreadyBookedError';
import type {
  LoginErrors,
  RequestErrors,
  RequestForm,
  SubmittedRequest,
  UserProfile,
} from '../domain/models';
import { validateLogin, validateRequest } from '../domain/validation';

export type SubmitRequestResult =
  | { valid: true }
  | { valid: false; errors: RequestErrors };

export class BarberShopService {
  constructor(
    private readonly requestRepository: RequestRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  validateLogin(username: string, password: string): LoginErrors {
    return validateLogin(username, password);
  }

  async signIn(
    username: string,
    password: string,
  ): Promise<UserProfile | null> {
    return this.profileRepository.signIn(username, password);
  }

  async pruneExpiredRequests(): Promise<void> {
    await this.requestRepository.pruneExpiredRequests();
  }

  async getBookedTimes(date: string): Promise<string[]> {
    return this.requestRepository.getBookedTimes(date);
  }

  async getCancelableTimes(date: string, username: string): Promise<string[]> {
    return this.requestRepository.getCancelableTimes(date, username);
  }

  async getUserRequests(username: string): Promise<SubmittedRequest[]> {
    return this.requestRepository.getUserRequests(username);
  }

  async cancelBooking(
    date: string,
    time: string,
    username: string,
  ): Promise<boolean> {
    return this.requestRepository.cancel(date, time, username);
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    await this.profileRepository.saveProfile(profile);
  }

  async changePassword(
    username: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    return this.profileRepository.changePassword(
      username,
      currentPassword,
      newPassword,
    );
  }

  async submitRequest(
    form: RequestForm,
    ownerUsername: string,
  ): Promise<SubmitRequestResult> {
    const errors = validateRequest(form);
    if (Object.keys(errors).length > 0) {
      return { valid: false, errors };
    }

    try {
      await this.requestRepository.save({
        ...form,
        ownerUsername,
        name: form.name.trim(),
        phone: form.phone.trim(),
        customService: form.customService.trim(),
        description: form.description.trim(),
        submittedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof SlotAlreadyBookedError) {
        return {
          valid: false,
          errors: { appointmentTime: error.message },
        };
      }
      throw error;
    }

    return { valid: true };
  }

  async updateRequest(
    form: RequestForm,
    ownerUsername: string,
    originalDate: string,
    originalTime: string,
  ): Promise<SubmitRequestResult | { valid: false; notFound: true }> {
    const errors = validateRequest(form);
    if (Object.keys(errors).length > 0) {
      return { valid: false, errors };
    }

    try {
      const updated = await this.requestRepository.update(
        originalDate,
        originalTime,
        ownerUsername,
        {
          ...form,
          name: form.name.trim(),
          phone: form.phone.trim(),
          customService: form.customService.trim(),
          description: form.description.trim(),
        },
      );
      if (!updated) return { valid: false, notFound: true };
    } catch (error) {
      if (error instanceof SlotAlreadyBookedError) {
        return {
          valid: false,
          errors: { appointmentTime: error.message },
        };
      }
      throw error;
    }

    return { valid: true };
  }
}
