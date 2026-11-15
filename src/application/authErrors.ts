const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'El correo electrónico no tiene un formato válido.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/invalid-credential': 'El correo o la contraseña son incorrectos.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/wrong-password': 'El correo o la contraseña son incorrectos.',
  'auth/too-many-requests':
    'Hubo demasiados intentos. Espera un momento y vuelve a intentarlo.',
  'auth/network-request-failed':
    'No se pudo conectar con Firebase. Revisa tu conexión a internet.',
  'auth/operation-not-allowed':
    'Activa el proveedor Correo electrónico/contraseña en Firebase Console.',
};

export function getAuthErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code;
    if (typeof code === 'string' && AUTH_ERROR_MESSAGES[code]) {
      return AUTH_ERROR_MESSAGES[code];
    }
  }

  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado al autenticarte.';
}
