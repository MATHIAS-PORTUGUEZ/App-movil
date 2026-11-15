import { useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { SurfaceCard } from '../components/SurfaceCard';
import type { SubmittedRequest, UserProfile } from '../../domain/models';

type ProfileScreenProps = {
  profile: UserProfile;
  requests: SubmittedRequest[];
  isLoadingRequests: boolean;
  onSave: (
    displayName: string,
    photoUri: string | null,
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;
  onCancelBooking: (request: SubmittedRequest) => void;
  onEditBooking: (request: SubmittedRequest) => void;
  onBack: () => void;
  onLogout: () => void;
};

type EditMode = 'none' | 'name' | 'password';

function formatAppointmentDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'full',
  }).format(new Date(year, month - 1, day));
}

export function ProfileScreen({
  profile,
  requests,
  isLoadingRequests,
  onSave,
  onCancelBooking,
  onEditBooking,
  onBack,
  onLogout,
}: ProfileScreenProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [photoUri, setPhotoUri] = useState(profile.photoUri);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [profileErrors, setProfileErrors] = useState<{ name?: string; currentPassword?: string; newPassword?: string }>({});

  const choosePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (result.canceled) return;
      const image = result.assets[0];
      if (!image.base64) {
        throw new Error('No se pudo leer la imagen elegida. Intenta con otra.');
      }

      setPhotoUri(`data:${image.mimeType ?? 'image/jpeg'};base64,${image.base64}`);
    } catch (error) {
      Alert.alert(
        'No se pudo elegir la foto',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al abrir tus fotos.',
      );
    }
  };

  // Solo un modo de edición a la vez: al entrar en uno, se reinician los
  // campos del otro para evitar guardar cambios por accidente.
  const startEditName = () => {
    setDisplayName(profile.displayName);
    setPhotoUri(profile.photoUri);
    setCurrentPassword('');
    setNewPassword('');
    setProfileErrors({});
    setEditMode('name');
  };

  const startEditPassword = () => {
    setDisplayName(profile.displayName);
    setPhotoUri(profile.photoUri);
    setCurrentPassword('');
    setNewPassword('');
    setProfileErrors({});
    setEditMode('password');
  };

  const cancelEdit = () => {
    setDisplayName(profile.displayName);
    setPhotoUri(profile.photoUri);
    setCurrentPassword('');
    setNewPassword('');
    setProfileErrors({});
    setEditMode('none');
  };

  const saveName = async () => {
    const name = displayName.trim();
    if (name.length < 2) {
      setProfileErrors({ name: 'Escribe al menos 2 caracteres.' });
      return;
    }
    if (name.length > 60) {
      setProfileErrors({ name: 'El nombre no puede superar 60 caracteres.' });
      return;
    }
    setProfileErrors({});
    setIsSaving(true);
    try {
      const saved = await onSave(displayName, photoUri, '', '');
      if (!saved) return;
      setEditMode('none');
    } finally {
      setIsSaving(false);
    }
  };

  const savePassword = async () => {
    const nextErrors: typeof profileErrors = {};
    if (!currentPassword) nextErrors.currentPassword = 'Escribe tu contraseña actual.';
    if (newPassword.length < 6) nextErrors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres.';
    setProfileErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setIsSaving(true);
    try {
      const saved = await onSave(
        profile.displayName,
        profile.photoUri,
        currentPassword,
        newPassword,
      );
      if (!saved) return;
      setCurrentPassword('');
      setNewPassword('');
      setEditMode('none');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 gap-5 py-8">
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Regresa a la pantalla principal"
        onPress={onBack}
        className="min-h-11 self-start justify-center px-2"
      >
        <Text className="font-semibold text-white">Volver al inicio</Text>
      </Pressable>

      <View>
        <Text className="text-3xl font-bold text-white">Mi perfil</Text>
        <Text className="mt-2 text-base text-white/80">
          Revisa tu información y tus citas reservadas.
        </Text>
      </View>

      {/* Perfil: foto y nombre (solo lectura por defecto) */}
      <SurfaceCard className="gap-4 p-5">
        <View className="items-center gap-2">
          <Pressable
            accessibilityRole={editMode === 'name' ? 'button' : undefined}
            accessibilityLabel="Cambiar foto de perfil"
            disabled={editMode !== 'name'}
            onPress={choosePhoto}
            className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-[#00BFFF] bg-[#1E2130] active:opacity-80"
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                accessibilityLabel="Foto de perfil"
                resizeMode="cover"
                className="h-full w-full"
              />
            ) : (
              <Text className="text-4xl font-bold text-white">
                {profile.displayName.trim().slice(0, 1).toUpperCase()}
              </Text>
            )}
          </Pressable>
          {editMode !== 'name' ? (
            <View className="items-center gap-1">
              <Text className="text-xl font-bold text-white">
                {profile.displayName}
              </Text>
              <Text className="text-sm text-white/70">
                Correo: {profile.username}
              </Text>
            </View>
          ) : null}
        </View>

        {editMode === 'name' ? (
          <>
            <Text className="text-sm text-white/80">
              Toca la foto para elegir otra.
            </Text>
            <Field
              label="Nombre"
              value={displayName}
              onChangeText={(value) => { setDisplayName(value); setProfileErrors((current) => ({ ...current, name: undefined })); }}
              placeholder="Tu nombre"
              autoCapitalize="words"
              error={profileErrors.name}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <ActionButton
                  label={isSaving ? 'Guardando…' : 'Guardar nombre'}
                  onPress={saveName}
                  disabled={isSaving}
                  variant="success"
                />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={cancelEdit}
                className="min-h-[54px] justify-center px-2"
              >
                <Text className="font-semibold text-white">Cancelar</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <ActionButton
            label="✎  Editar nombre y foto"
            onPress={startEditName}
            variant="secondary"
          />
        )}
      </SurfaceCard>

      {/* Contraseña */}
      <SurfaceCard className="gap-4 p-5">
        <Text className="text-lg font-bold text-white">Contraseña</Text>
        {editMode === 'password' ? (
          <>
            <Text className="text-sm leading-5 text-white/75">
              Confirma tu contraseña actual. La nueva debe tener al menos 6
              caracteres.
            </Text>
            <Field
              label="Contraseña actual"
              value={currentPassword}
              onChangeText={(value) => { setCurrentPassword(value); setProfileErrors((current) => ({ ...current, currentPassword: undefined })); }}
              placeholder="Escribe tu contraseña actual"
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
              error={profileErrors.currentPassword}
            />
            <Field
              label="Nueva contraseña"
              value={newPassword}
              onChangeText={(value) => { setNewPassword(value); setProfileErrors((current) => ({ ...current, newPassword: undefined })); }}
              placeholder="Escribe una nueva contraseña"
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
              error={profileErrors.newPassword}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <ActionButton
                  label={isSaving ? 'Guardando…' : 'Guardar contraseña'}
                  onPress={savePassword}
                  disabled={isSaving}
                  variant="success"
                />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={cancelEdit}
                className="min-h-[54px] justify-center px-2"
              >
                <Text className="font-semibold text-white">Cancelar</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <ActionButton
            label="✎  Editar contraseña"
            onPress={startEditPassword}
            variant="secondary"
          />
        )}
      </SurfaceCard>

      {/* Mis citas: ver, modificar y cancelar */}
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-white">Mis citas</Text>
          {isLoadingRequests ? (
            <Text className="text-sm text-white/75">Cargando…</Text>
          ) : (
            <Text className="text-sm text-white/75">
              {requests.length} {requests.length === 1 ? 'cita' : 'citas'}
            </Text>
          )}
        </View>
        {!isLoadingRequests && requests.length === 0 ? (
          <SurfaceCard className="p-5">
            <Text className="text-sm leading-5 text-white/80">
              No tienes citas futuras reservadas.
            </Text>
          </SurfaceCard>
        ) : null}
        {requests.map((request) => (
          <SurfaceCard
            key={`${request.appointmentDate}-${request.appointmentTime}`}
            className="gap-3 p-4"
          >
            <View>
              <Text className="font-bold capitalize text-white">
                {formatAppointmentDate(request.appointmentDate)}
              </Text>
              <Text className="mt-1 text-sm text-white/80">
                {request.appointmentTime} ·{' '}
                {request.service === 'Corte personalizado'
                  ? request.customService
                  : request.service}{' '}
                · Barbero {request.barber}
              </Text>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <ActionButton
                  label="Modificar"
                  onPress={() => onEditBooking(request)}
                  variant="success"
                />
              </View>
              <View className="flex-1">
                <ActionButton
                  label="Cancelar cita"
                  onPress={() => onCancelBooking(request)}
                  variant="danger"
                />
              </View>
            </View>
          </SurfaceCard>
        ))}
      </View>

      <ActionButton label="Cerrar sesión" onPress={onLogout} variant="danger" />
    </View>
  );
}
