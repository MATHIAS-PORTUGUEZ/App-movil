import { useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { SurfaceCard } from '../components/SurfaceCard';
import type { UserProfile } from '../domain/models';

type ProfileScreenProps = {
  profile: UserProfile;
  onSave: (
    displayName: string,
    photoUri: string | null,
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;
  onBack: () => void;
  onLogout: () => void;
};

export function ProfileScreen({
  profile,
  onSave,
  onBack,
  onLogout,
}: ProfileScreenProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [photoUri, setPhotoUri] = useState(profile.photoUri);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const save = async () => {
    setIsSaving(true);
    try {
      await onSave(displayName, photoUri, currentPassword, newPassword);
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
          Edita tu información personal.
        </Text>
      </View>

      <SurfaceCard className="items-center gap-4 p-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cambiar foto de perfil"
          onPress={choosePhoto}
          className="h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#1900ff] active:opacity-80"
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
              {displayName.trim().slice(0, 1).toUpperCase()}
            </Text>
          )}
        </Pressable>
        <Text className="text-sm text-white/80">
          Toca la foto para elegir otra
        </Text>
        <Field
          label="Nombre"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Tu nombre"
          autoCapitalize="words"
        />
      </SurfaceCard>

      <SurfaceCard className="gap-5 p-5">
        <View>
          <Text className="text-xl font-bold text-white">
            Cambiar contraseña
          </Text>
          <Text className="mt-1 text-sm leading-5 text-white/75">
            Déjala vacía si no quieres cambiarla. La nueva debe tener al menos
            6 caracteres.
          </Text>
        </View>
        <Field
          label="Contraseña actual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Escribe tu contraseña actual"
          secureTextEntry
          autoCapitalize="none"
        />
        <Field
          label="Nueva contraseña"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Escribe una nueva contraseña"
          secureTextEntry
          autoCapitalize="none"
        />
        <ActionButton
          label={isSaving ? 'Guardando…' : 'Guardar cambios'}
          onPress={save}
          disabled={isSaving}
        />
      </SurfaceCard>
      <ActionButton
        label="Cerrar sesión"
        onPress={onLogout}
        variant="danger"
      />
    </View>
  );
}
