import type { RequestRepository } from '../../domain/repositories/RequestRepository';
import type { SubmittedRequest } from '../../domain/models';

export class InMemoryRequestRepository implements RequestRepository {
  private readonly requests: SubmittedRequest[] = [];

  async save(request: SubmittedRequest): Promise<void> {
    this.requests.push(request);
  }
}
