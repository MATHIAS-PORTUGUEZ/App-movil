import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard } from 'react-native';
import { BarberShopService } from '../application/BarberShopService';
import {
  PROMOTIONS,
  type BarberName,
  type CreateAccountErrors,
  type CreateAccountForm,
  type LoginErrors,
  type PromotionId,
  type RequestErrors,
  type RequestForm,
  type ServiceType,
  type SubmittedRequest,
  type UserProfile,
  EMPTY_FORM,
} from '../domain/models';

type Screen = 'login' | 'createAccount' | 'home' | 'register' | 'profile';

function formatAppointmentDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'long',
  }).format(new Date(year, month - 1, day));
}

export function useBarberShop(service: BarberShopService) {
  const [screen, setScreen] = useState<Screen>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [createAccountForm, setCreateAccountForm] = useState<CreateAccountForm>({
    username: '',
    password: '',
  });
  const [createAccountErrors, setCreateAccountErrors] =
    useState<CreateAccountErrors>({});
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [form, setForm] = useState<RequestForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<RequestErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileRequests, setProfileRequests] = useState<SubmittedRequest[]>([]);
  const [isLoadingProfileRequests, setIsLoadingProfileRequests] = useState(false);
  const [editingRequest, setEditingRequest] = useState<SubmittedRequest | null>(null);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [cancelableTimes, setCancelableTimes] = useState<string[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const submissionInProgress = useRef(false);
  const cancellationInProgress = useRef(false);
  const availabilityRequest = useRef(0);

  useEffect(() => {
    Keyboard.dismiss();
  }, [screen]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let isActive = true;

    const cleanExpiredRequests = async () => {
      try {
        await service.pruneExpiredRequests();
      } catch (error) {
        Alert.alert(
          'No se pudieron actualizar las reservas',
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al eliminar reservas vencidas.',
        );
      }
    };

    const scheduleNextCleanup = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      timeout = setTimeout(() => {
        void cleanExpiredRequests().finally(() => {
          if (isActive) scheduleNextCleanup();
        });
      }, nextMidnight.getTime() - now.getTime());
    };

    void cleanExpiredRequests();
    scheduleNextCleanup();

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [service]);

  const loadAvailability = async (date: string) => {
    const requestId = ++availabilityRequest.current;
    if (!date) {
      setBookedTimes([]);
      setCancelableTimes([]);
      setAvailabilityError('');
      setIsLoadingAvailability(false);
      return;
    }

    setIsLoadingAvailability(true);
    setAvailabilityError('');

    try {
      const [times, ownTimes] = await Promise.all([
        service.getBookedTimes(date),
        profile
          ? service.getCancelableTimes(date, profile.username)
          : Promise.resolve([]),
      ]);
      if (availabilityRequest.current === requestId) {
        setBookedTimes(times);
        setCancelableTimes(ownTimes);
      }
    } catch (error) {
      if (availabilityRequest.current !== requestId) return;
      setAvailabilityError(
        error instanceof Error
          ? error.message
          : 'No se pudo consultar la disponibilidad guardada.',
      );
    } finally {
      if (availabilityRequest.current === requestId) {
        setIsLoadingAvailability(false);
      }
    }
  };

  const updateForm = (field: keyof RequestForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
    if (field === 'appointmentDate') {
      setForm((current) => ({
        ...current,
        appointmentTime:
          current.appointmentDate === value ? current.appointmentTime : '',
      }));
      setBookedTimes([]);
      setCancelableTimes([]);
      void loadAvailability(value);
    }
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
    setForm((current) => ({
      ...EMPTY_FORM,
      name: profile?.displayName ?? current.name,
      service: current.service,
      customService: current.customService,
      barber: current.barber,
      promotion: current.promotion,
    }));
    setFormErrors({});
    setScreen('register');
  };

  const showCreateAccount = () => {
    setCreateAccountForm({ username: '', password: '' });
    setCreateAccountErrors({});
    setScreen('createAccount');
  };

  const updateCreateAccountForm = (
    field: keyof CreateAccountForm,
    value: string,
  ) => {
    setCreateAccountForm((current) => ({ ...current, [field]: value }));
    setCreateAccountErrors((current) => ({ ...current, [field]: undefined }));
  };

  const createAccount = async () => {
    setIsCreatingAccount(true);
    try {
      const result = await service.createAccount(
        createAccountForm.username,
        createAccountForm.password,
      );
      if (!result.valid) {
        setCreateAccountErrors(result.errors);
        return;
      }

      setProfile(result.profile);
      setUsername(result.profile.username);
      setPassword('');
      setForm((current) => ({
        ...current,
        name: result.profile.displayName,
      }));
      setCreateAccountForm({ username: '', password: '' });
      setScreen('home');
    } catch (error) {
      Alert.alert(
        'No se pudo crear la cuenta',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const backToLogin = () => {
    setCreateAccountForm({ username: '', password: '' });
    setCreateAccountErrors({});
    setScreen('login');
  };

  const refreshAvailability = async () => {
    if (!form.appointmentDate || isLoadingAvailability) return;

    setIsLoadingAvailability(true);
    setAvailabilityError('');
    try {
      await service.pruneExpiredRequests();
      await loadAvailability(form.appointmentDate);
    } catch (error) {
      setAvailabilityError(
        error instanceof Error
          ? error.message
          : 'No se pudieron actualizar los horarios.',
      );
      setIsLoadingAvailability(false);
    }
  };

  const loadProfileRequests = async (username: string) => {
    setIsLoadingProfileRequests(true);
    try {
      setProfileRequests(await service.getUserRequests(username));
    } catch (error) {
      Alert.alert(
        'No se pudieron cargar tus citas',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al consultar tus reservas.',
      );
    } finally {
      setIsLoadingProfileRequests(false);
    }
  };

  const showProfile = () => {
    setScreen('profile');
    if (profile) void loadProfileRequests(profile.username);
  };

  const editBooking = (request: SubmittedRequest) => {
    setEditingRequest(request);
    setForm({
      name: request.name,
      phone: request.phone,
      service: request.service,
      customService: request.customService,
      barber: request.barber,
      promotion: request.promotion,
      description: request.description,
      appointmentDate: request.appointmentDate,
      appointmentTime: request.appointmentTime,
    });
    setFormErrors({});
    setScreen('register');
    void loadAvailability(request.appointmentDate);
  };

  const backFromRegister = () => {
    if (editingRequest) {
      setEditingRequest(null);
      setScreen('profile');
      if (profile) void loadProfileRequests(profile.username);
      return;
    }
    setScreen('home');
  };

  const selectService = (service: ServiceType | '') => {
    setForm((current) => ({ ...current, service }));
    setFormErrors((current) => ({
      ...current,
      service: undefined,
      customService: undefined,
    }));
  };

  const selectBarber = (barber: BarberName | '') => {
    setForm((current) => ({ ...current, barber }));
    setFormErrors((current) => ({ ...current, barber: undefined }));
  };

  const selectPromotion = (promotion: PromotionId | '') => {
    setForm((current) => ({ ...current, promotion }));
  };

  const signIn = async () => {
    const errors = service.validateLogin(username, password);
    setLoginErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setIsSigningIn(true);
    try {
      const authenticatedProfile = await service.signIn(username, password);
      if (!authenticatedProfile) {
        setLoginErrors({
          password: 'Usuario o contraseña incorrectos. Si aún no tienes cuenta, créala aquí.',
        });
        return;
      }

      setProfile(authenticatedProfile);
      setUsername(authenticatedProfile.username);
      setPassword('');
      setForm((current) => ({
        ...current,
        name: authenticatedProfile.displayName,
      }));
      setScreen('home');
    } catch (error) {
      Alert.alert(
        'No se pudo iniciar sesión',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.',
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const saveProfile = async (
    displayName: string,
    photoUri: string | null,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> => {
    if (!profile) return false;
    if (displayName.trim().length < 2) {
      Alert.alert('Revisa tu nombre', 'Escribe al menos 2 caracteres.');
      return false;
    }

    const shouldChangePassword = newPassword.length > 0;
    if (shouldChangePassword && currentPassword.length === 0) {
      Alert.alert(
        'Falta tu contraseña actual',
        'Escríbela para confirmar el cambio.',
      );
      return false;
    }
    if (shouldChangePassword && newPassword.length < 6) {
      Alert.alert(
        'Contraseña muy corta',
        'La nueva contraseña debe tener al menos 6 caracteres.',
      );
      return false;
    }

    try {
      if (
        shouldChangePassword &&
        !(await service.changePassword(
          profile.username,
          currentPassword,
          newPassword,
        ))
      ) {
        Alert.alert('Contraseña incorrecta', 'Revisa tu contraseña actual.');
        return false;
      }

      const updatedProfile = {
        ...profile,
        displayName: displayName.trim(),
        photoUri,
      };
      await service.saveProfile(updatedProfile);
      setProfile(updatedProfile);
      setForm((current) => ({ ...current, name: updatedProfile.displayName }));
      Alert.alert('Perfil actualizado', 'Se guardaron tus cambios en este dispositivo.');
      return true;
    } catch (error) {
      Alert.alert(
        'No se pudo guardar el perfil',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.',
      );
      return false;
    }
  };

  const submitRequest = async () => {
    if (submissionInProgress.current) return;

    submissionInProgress.current = true;
    setIsSubmitting(true);
    try {
      if (!profile) return;
      const result = editingRequest
        ? await service.updateRequest(
            form,
            profile.username,
            editingRequest.appointmentDate,
            editingRequest.appointmentTime,
          )
        : await service.submitRequest(form, profile.username);
      if (!result.valid) {
        if ('notFound' in result) {
          Alert.alert(
            'No se encontró la cita',
            'Vuelve al perfil para actualizar la lista de reservas.',
          );
          setEditingRequest(null);
          setScreen('profile');
          await loadProfileRequests(profile.username);
          return;
        }
        setFormErrors(result.errors);
        if (result.errors.appointmentTime) {
          void loadAvailability(form.appointmentDate);
        }
        return;
      }

      setFormErrors({});
      const selectedPromotion = PROMOTIONS.find(
        (promotion) => promotion.id === form.promotion,
      );
      const promotionText = selectedPromotion
        ? ` También seleccionaste: ${selectedPromotion.title} (${selectedPromotion.discount}).`
        : '';
      Alert.alert(
        editingRequest ? 'Cita actualizada' : 'Solicitud registrada',
        editingRequest
          ? `Tu cita se actualizó para el ${formatAppointmentDate(form.appointmentDate)} a las ${form.appointmentTime}.`
          : `Gracias, ${form.name.trim()}. Solicitaste ${form.service === 'Corte personalizado' ? form.customService.trim() : form.service} con ${form.barber}, para el ${formatAppointmentDate(form.appointmentDate)} a las ${form.appointmentTime}.${promotionText}`,
      );
      availabilityRequest.current += 1;
      setEditingRequest(null);
      setForm(EMPTY_FORM);
      setBookedTimes([]);
      setAvailabilityError('');
      setIsLoadingAvailability(false);
      setScreen('profile');
      await loadProfileRequests(profile.username);
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

  const cancelBooking = (date: string, time: string) => {
    if (!profile || cancellationInProgress.current) return;

    Alert.alert(
      'Cancelar reserva',
      `¿Quieres liberar el horario de las ${time}?`,
      [
        { text: 'Conservar', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              cancellationInProgress.current = true;
              try {
                const canceled = await service.cancelBooking(
                  date,
                  time,
                  profile.username,
                );
                if (!canceled) {
                  Alert.alert(
                    'No se pudo cancelar',
                    'La reserva ya no está disponible para esta cuenta.',
                  );
                  return;
                }
                await loadAvailability(date);
                if (screen === 'profile') {
                  await loadProfileRequests(profile.username);
                }
                Alert.alert('Reserva cancelada', 'El horario ya está disponible.');
              } catch (error) {
                Alert.alert(
                  'No se pudo cancelar la reserva',
                  error instanceof Error
                    ? error.message
                    : 'Ocurrió un error inesperado.',
                );
              } finally {
                cancellationInProgress.current = false;
              }
            })();
          },
        },
      ],
    );
  };

  return {
    screen,
    username,
    password,
    profile,
    profileRequests,
    isLoadingProfileRequests,
    editingRequest,
    loginErrors,
    createAccountForm,
    createAccountErrors,
    isCreatingAccount,
    form,
    formErrors,
    isSubmitting,
    isSigningIn,
    bookedTimes,
    cancelableTimes,
    isLoadingAvailability,
    availabilityError,
    refreshAvailability,
    updateUsername,
    updatePassword,
    updateForm,
    signIn,
    createAccount,
    showCreateAccount,
    updateCreateAccountForm,
    backToLogin,
    saveProfile,
    submitRequest,
    cancelBooking,
    editBooking,
    backFromRegister,
    showHome: () => setScreen('home'),
    showProfile,
    showRegister,
    selectService,
    selectBarber,
    selectPromotion,
    signOut: () => {
      availabilityRequest.current += 1;
      setProfile(null);
      setProfileRequests([]);
      setEditingRequest(null);
      setPassword('');
      setForm(EMPTY_FORM);
      setFormErrors({});
      setScreen('login');
    },
  };
}
