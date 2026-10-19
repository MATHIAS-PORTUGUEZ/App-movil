import type { RequestForm, SubmittedRequest } from '../models';

export interface RequestRepository {
  pruneExpiredRequests(): Promise<void>;
  getBookedTimes(date: string): Promise<string[]>;
  getCancelableTimes(date: string, username: string): Promise<string[]>;
  getUserRequests(username: string): Promise<SubmittedRequest[]>;
  save(request: SubmittedRequest): Promise<void>;
  update(
    date: string,
    time: string,
    username: string,
    request: RequestForm,
  ): Promise<boolean>;
  cancel(date: string, time: string, username: string): Promise<boolean>;
}
