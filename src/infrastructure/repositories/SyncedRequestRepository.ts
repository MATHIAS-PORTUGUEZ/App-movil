import type { RequestRepository } from '../../domain/repositories/RequestRepository';
import { SlotAlreadyBookedError } from '../../domain/errors/SlotAlreadyBookedError';
import type { RequestForm, SubmittedRequest } from '../../domain/models';
import { getFirebaseAuth } from '../firebase';
import { FirestoreRequestRepository } from './FirestoreRequestRepository';
import { SQLiteRequestRepository } from './SQLiteRequestRepository';

export class SyncedRequestRepository implements RequestRepository {
  constructor(
    private readonly cloud: FirestoreRequestRepository,
    private readonly local: SQLiteRequestRepository,
  ) {}

  async pruneExpiredRequests() {
    await this.local.pruneExpiredRequests();
    // Local cleanup must still happen when the device has no network.
    await this.cloud.pruneExpiredRequests().catch(() => undefined);
  }

  async getBookedTimes(date: string) {
    try {
      return await this.cloud.getBookedTimes(date);
    } catch {
      return this.local.getBookedTimes(date);
    }
  }

  async getCancelableTimes(date: string, username: string) {
    try {
      return await this.cloud.getCancelableTimes(date, username);
    } catch {
      return this.local.getCancelableTimes(date, username);
    }
  }

  async getUserRequests(username: string) {
    const cached = await this.local.getUserRequests(username);
    try {
      let remote = await this.cloud.getUserRequests(username);
      const remoteSlots = new Set(remote.map((item) => `${item.appointmentDate}|${item.appointmentTime}`));
      for (const item of cached) {
        const key = `${item.appointmentDate}|${item.appointmentTime}`;
        if (remoteSlots.has(key)) continue;
        try {
          await this.cloud.save(item);
        } catch (error) {
          if (!(error instanceof SlotAlreadyBookedError)) throw error;
        }
      }
      remote = await this.cloud.getUserRequests(username);
      await this.local.replaceUserRequests(username, remote);
      return remote;
    } catch {
      return cached;
    }
  }

  async save(request: SubmittedRequest) {
    await this.cloud.save(request);
    try {
      const ownerUid = getFirebaseAuth().currentUser?.uid;
      await this.local.save({ ...request, ...(ownerUid ? { ownerUid } : {}) });
    } catch (error) {
      if (!(error instanceof SlotAlreadyBookedError)) throw error;
      const remote = await this.cloud.getUserRequests(request.ownerUsername ?? '');
      await this.local.replaceUserRequests(request.ownerUsername ?? '', remote);
    }
  }

  async update(date: string, time: string, username: string, request: RequestForm) {
    const updated = await this.cloud.update(date, time, username, request);
    if (!updated) return false;
    const remote = await this.cloud.getUserRequests(username);
    await this.local.replaceUserRequests(username, remote);
    return true;
  }

  async cancel(date: string, time: string, username: string) {
    const canceled = await this.cloud.cancel(date, time, username);
    if (!canceled) return false;
    const remote = await this.cloud.getUserRequests(username);
    await this.local.replaceUserRequests(username, remote);
    return true;
  }
}
