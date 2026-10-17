import type { SubmittedRequest } from '../models';

export interface RequestRepository {
  pruneExpiredRequests(): Promise<void>;
  getBookedTimes(date: string): Promise<string[]>;
  getCancelableTimes(date: string, username: string): Promise<string[]>;
  save(request: SubmittedRequest): Promise<void>;
  cancel(date: string, time: string, username: string): Promise<boolean>;
}
