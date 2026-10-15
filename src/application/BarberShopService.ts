import type { RequestRepository } from '../domain/repositories/RequestRepository';
import type {
  LoginErrors,
  RequestErrors,
  RequestForm,
} from '../domain/models';
import { validateLogin, validateRequest } from '../domain/validation';

export type SubmitRequestResult =
  | { valid: true }
  | { valid: false; errors: RequestErrors };

export class BarberShopService {
  constructor(private readonly requestRepository: RequestRepository) {}

  validateLogin(username: string, password: string): LoginErrors {
    return validateLogin(username, password);
  }

  async submitRequest(form: RequestForm): Promise<SubmitRequestResult> {
    const errors = validateRequest(form);
    if (Object.keys(errors).length > 0) {
      return { valid: false, errors };
    }

    await this.requestRepository.save({
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      description: form.description.trim(),
      submittedAt: new Date().toISOString(),
    });

    return { valid: true };
  }
}
