import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard } from 'react-native';
import { BarberShopService } from '../application/BarberShopService';
import type {
  LoginErrors,
  RequestErrors,
  RequestForm,
} from '../domain/models';
import { EMPTY_FORM } from '../domain/models';

type Screen = 'login' | 'home' | 'register';

export function useBarberShop(service: BarberShopService) {
  const [screen, setScreen] = useState<Screen>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [form, setForm] = useState<RequestForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<RequestErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInProgress = useRef(false);

  useEffect(() => {
    Keyboard.dismiss();
  }, [screen]);

  const updateForm = (field: keyof RequestForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updateUsername = (value: string) => {
    setUsername(value);
    setLoginErrors((current) => ({ ...current, username: undefined }));
  };

  const updatePassword = (value: string) => {
    setPassword(value);
    setLoginErrors((current) => ({ ...current, password: undefined }));
  };

  const showRegister = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setScreen('register');
  };

  const signIn = () => {
    const errors = service.validateLogin(username, password);
    setLoginErrors(errors);

    if (Object.keys(errors).length === 0) {
      setScreen('home');
    }
  };

  const submitRequest = async () => {
    if (submissionInProgress.current) return;

    submissionInProgress.current = true;
    setIsSubmitting(true);
    try {
      const result = await service.submitRequest(form);
      if (!result.valid) {
        setFormErrors(result.errors);
        return;
      }

      setFormErrors({});
      Alert.alert('Solicitud enviada', `Gracias, ${form.name.trim()}.`);
      setScreen('home');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado. Intenta nuevamente.';
      Alert.alert('No se pudo enviar la solicitud', message);
    } finally {
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  };

  return {
    screen,
    username,
    password,
    loginErrors,
    form,
    formErrors,
    isSubmitting,
    updateUsername,
    updatePassword,
    updateForm,
    signIn,
    submitRequest,
    showHome: () => setScreen('home'),
    showRegister,
    signOut: () => setScreen('login'),
  };
}
