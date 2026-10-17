import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RequestRepository } from '../../domain/repositories/RequestRepository';
import { getLocalDateKey, type SubmittedRequest } from '../../domain/models';
import { SlotAlreadyBookedError } from '../../domain/errors/SlotAlreadyBookedError';

const REQUESTS_KEY = 'barber-shop.requests.v1';

function isSubmittedRequest(value: unknown): value is SubmittedRequest {
  if (typeof value !== 'object' || value === null) return false;
  const request = value as Record<string, unknown>;
  return [
    'name',
    'phone',
    'service',
    'customService',
    'barber',
    'promotion',
    'description',
    'appointmentDate',
    'appointmentTime',
    'submittedAt',
  ].every((key) => typeof request[key] === 'string') &&
    (request.ownerUsername === undefined ||
      typeof request.ownerUsername === 'string');
}

function parseRequests(value: string | null): SubmittedRequest[] {
  if (!value) return [];

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || !parsed.every(isSubmittedRequest)) {
    throw new Error('No se pudieron leer las reservas guardadas.');
  }

  return parsed;
}

export class AsyncStorageRequestRepository implements RequestRepository {
  private writeQueue: Promise<void> = Promise.resolve();

  private runSerialized<T>(operation: () => Promise<T>): Promise<T> {
    const task = this.writeQueue.then(operation);
    this.writeQueue = task.then(
      () => undefined,
      () => undefined,
    );
    return task;
  }

  private async readActiveRequests(): Promise<SubmittedRequest[]> {
    const requests = parseRequests(await AsyncStorage.getItem(REQUESTS_KEY));
    const today = getLocalDateKey();
    const activeRequests = requests.filter(
      (request) => request.appointmentDate >= today,
    );

    if (activeRequests.length !== requests.length) {
      await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(activeRequests));
    }

    return activeRequests;
  }

  pruneExpiredRequests(): Promise<void> {
    return this.runSerialized(async () => {
      await this.readActiveRequests();
    });
  }

  getBookedTimes(date: string): Promise<string[]> {
    return this.runSerialized(async () => {
      const requests = await this.readActiveRequests();
      return requests
        .filter((request) => request.appointmentDate === date)
        .map((request) => request.appointmentTime);
    });
  }

  getCancelableTimes(date: string, username: string): Promise<string[]> {
    return this.runSerialized(async () => {
      const requests = await this.readActiveRequests();
      const normalizedUsername = username.trim().toLocaleLowerCase();
      return requests
        .filter(
          (request) =>
            request.appointmentDate === date &&
            request.ownerUsername?.trim().toLocaleLowerCase() === normalizedUsername,
        )
        .map((request) => request.appointmentTime);
    });
  }

  save(request: SubmittedRequest): Promise<void> {
    return this.runSerialized(async () => {
      const requests = await this.readActiveRequests();
      const slotTaken = requests.some(
        (existing) =>
          existing.appointmentDate === request.appointmentDate &&
          existing.appointmentTime === request.appointmentTime,
      );

      if (slotTaken) {
        throw new SlotAlreadyBookedError();
      }

      await AsyncStorage.setItem(
        REQUESTS_KEY,
        JSON.stringify([...requests, request]),
      );
    });
  }

  cancel(date: string, time: string, username: string): Promise<boolean> {
    return this.runSerialized(async () => {
      const requests = await this.readActiveRequests();
      const normalizedUsername = username.trim().toLocaleLowerCase();
      const requestIndex = requests.findIndex(
        (request) =>
          request.appointmentDate === date &&
          request.appointmentTime === time &&
          request.ownerUsername?.trim().toLocaleLowerCase() === normalizedUsername,
      );

      if (requestIndex === -1) return false;

      requests.splice(requestIndex, 1);
      await AsyncStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
      return true;
    });
  }
}
