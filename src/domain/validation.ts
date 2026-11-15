import type {
  CreateAccountErrors,
  LoginErrors,
  RequestErrors,
  RequestForm,
} from './models';
import { getLocalDateKey } from './models';

export function validateLogin(
  email: string,
  password: string,
): LoginErrors {
  const errors: LoginErrors = {};
  if (!email.trim()) {
    errors.email = 'Escribe tu correo electrónico.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Escribe un correo electrónico válido.';
  }
  if (!password.trim()) errors.password = 'Escribe tu contraseña.';
  if (password.trim() && password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.';
  }
  return errors;
}

export function validateCreateAccount(
  email: string,
  password: string,
): CreateAccountErrors {
  const errors: CreateAccountErrors = {};
  if (!email.trim()) {
    errors.email = 'Escribe tu correo electrónico.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Escribe un correo electrónico válido.';
  }
  if (password.trim().length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.';
  }
  return errors;
}

export function validateRequest(form: RequestForm): RequestErrors {
  const errors: RequestErrors = {};
  if (!form.name.trim()) errors.name = 'Escribe el nombre de quien asistirá.';
  else if (form.name.trim().length < 2) errors.name = 'El nombre debe tener al menos 2 caracteres.';
  else if (form.name.trim().length > 60) errors.name = 'El nombre no puede superar 60 caracteres.';

  if (!form.phone.trim()) {
    errors.phone = 'El teléfono es obligatorio.';
  } else if (
    !/^\+?[\d\s()-]{8,18}$/.test(form.phone.trim()) ||
    (form.phone.match(/\d/g) ?? []).length < 8
  ) {
    errors.phone = 'Ingresa un teléfono válido (mínimo 8 dígitos).';
  }

  if (!form.service) errors.service = 'Selecciona un servicio.';
  if (form.service === 'Corte personalizado' && !form.customService.trim()) {
    errors.customService = 'Describe el corte que tienes en mente.';
  }
  if (!form.barber) errors.barber = 'Selecciona un barbero.';
  if (!form.appointmentDate) {
    errors.appointmentDate = 'Selecciona el día de tu cita.';
  } else if (form.appointmentDate < getLocalDateKey()) {
    errors.appointmentDate = 'La cita debe ser para hoy o una fecha futura.';
  }
  if (!form.appointmentTime) {
    errors.appointmentTime = 'Selecciona un horario disponible.';
  } else if (
    form.appointmentDate === getLocalDateKey() &&
    form.appointmentTime <=
      `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
  ) {
    errors.appointmentTime = 'Elige una hora futura.';
  }

  return errors;
}
