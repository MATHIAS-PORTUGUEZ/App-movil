import { Pressable, Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { SurfaceCard } from '../components/SurfaceCard';
import type {
  RequestErrors,
  RequestForm,
  RequestType,
} from '../domain/models';
import { REQUEST_TYPES } from '../domain/models';

type RegisterScreenProps = {
  form: RequestForm;
  errors: RequestErrors;
  isSubmitting: boolean;
  onChange: (field: keyof RequestForm, value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export function RegisterScreen({
  form,
  errors,
  isSubmitting,
  onChange,
  onSubmit,
  onBack,
}: RegisterScreenProps) {
  return (
    <View className="flex-1 py-6">
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Regresa a la pantalla principal"
        onPress={onBack}
        hitSlop={8}
        className="mb-6 min-h-[44px] self-start justify-center rounded-lg px-3 active:opacity-70"
      >
        <Text className="font-semibold text-[#ffffff]">Volver al inicio</Text>
      </Pressable>

      <Text className="text-3xl font-bold text-[#F4F0E7]">
        Registrar solicitud
      </Text>
      <Text className="mb-6 mt-2 text-base leading-6 text-[#ffffff]">
        Completa los datos para solicitar tu servicio.
      </Text>

      <SurfaceCard className="gap-5 p-5">
        <Field
          label="Nombre del cliente"
          value={form.name}
          onChangeText={(value) => onChange('name', value)}
          placeholder="Escribe tu nombre"
          error={errors.name}
        />
        <Field
          label="Teléfono"
          value={form.phone}
          onChangeText={(value) => onChange('phone', value)}
          placeholder="Escribe tu teléfono"
          keyboardType="phone-pad"
          error={errors.phone}
        />

        <View className="gap-2">
          <Text className="text-sm font-semibold text-[#fffffe]">
            Tipo de solicitud
          </Text>
          {REQUEST_TYPES.map((type: RequestType) => {
            const selected = form.type === type;
            return (
              <Pressable
                key={type}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                onPress={() => onChange('type', selected ? '' : type)}
                className={`min-h-[50px] justify-center rounded-xl border px-4 py-3 ${
                  selected
                    ? 'border-[#fffefd] bg-[#29241B]'
                    : 'border-[#fffffe] bg-[#141512] active:bg-[#20211E]'
                }`}
              >
                <Text
                  className={
                    selected
                      ? 'font-semibold text-[#0eff02]'
                      : 'text-[#ffffff]'
                  }
                >
                  {selected ? '✓  ' : '○  '}
                  {type}
                </Text>
              </Pressable>
            );
          })}
          {errors.type ? (
            <Text accessibilityRole="alert" className="text-sm text-[#FCA5A5]">
              {errors.type}
            </Text>
          ) : null}
        </View>

        <Field
          label="Descripción"
          value={form.description}
          onChangeText={(value) => onChange('description', value)}
          placeholder="Describe el servicio que necesitas"
          multiline
          error={errors.description}
        />

        <ActionButton
          label={isSubmitting ? 'Enviando solicitud…' : 'Enviar solicitud'}
          onPress={onSubmit}
          icon={isSubmitting ? undefined : 'check'}
          disabled={isSubmitting}
          accessibilityHint="Envía los datos de tu solicitud"
        />
      </SurfaceCard>
    </View>
  );
}
