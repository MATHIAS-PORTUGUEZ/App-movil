import type { SubmittedRequest } from '../models';

export interface RequestRepository {
  save(request: SubmittedRequest): Promise<void>;
}
