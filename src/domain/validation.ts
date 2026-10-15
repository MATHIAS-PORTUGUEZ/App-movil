import type {
  LoginErrors,
  RequestErrors,
  RequestForm,
} from './models';

export function validateLogin(
  username: string,
  password: string,
): LoginErrors {
  const errors: LoginErrors = {};
  if (!username.trim()) errors.username = 'Escribe tu usuario.';
  if (!password.trim()) errors.password = 'Escribe tu contraseña.';
  return errors;
}

export function validateRequest(form: RequestForm): RequestErrors {
  const errors: RequestErrors = {};
  if (!form.name.trim()) errors.name = 'El nombre es obligatorio.';

  if (!form.phone.trim()) {
    errors.phone = 'El teléfono es obligatorio.';
  } else if (
    !/^\+?[\d\s()-]{8,18}$/.test(form.phone.trim()) ||
    (form.phone.match(/\d/g) ?? []).length < 8
  ) {
    errors.phone = 'Ingresa un teléfono válido (mínimo 8 dígitos).';
  }

  if (!form.type) errors.type = 'Selecciona el tipo de solicitud.';
  if (!form.description.trim()) {
    errors.description = 'Cuéntanos qué servicio necesitas.';
  }

  return errors;
}
