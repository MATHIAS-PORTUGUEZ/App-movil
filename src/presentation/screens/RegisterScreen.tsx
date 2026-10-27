import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { SurfaceCard } from '../components/SurfaceCard';
import { getLocalDateKey, PROMOTIONS } from '../../domain/models';
import type { RequestErrors, RequestForm } from '../../domain/models';

type RegisterScreenProps = {
  form: RequestForm;
  errors: RequestErrors;
  isSubmitting: boolean;
  isEditingBooking: boolean;
  bookedTimes: string[];
  cancelableTimes: string[];
  isLoadingAvailability: boolean;
  availabilityError: string;
  onRefreshAvailability: () => void;
  onCancelBooking: (date: string, time: string) => void;
  onChange: (field: keyof RequestForm, value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

const TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

const LAST_BOOKING_YEAR = 2027;

const MONTH_NAMES = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat('es', { month: 'long' }).format(
    new Date(2027, month, 1),
  ),
);

function getMonthDays(monthDate: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1);
    if (date < today || date.getFullYear() > LAST_BOOKING_YEAR) return null;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    return {
      key,
      weekday: new Intl.DateTimeFormat('es', { weekday: 'short' })
        .format(date)
        .replace('.', '')
        .toUpperCase(),
      day: String(date.getDate()).padStart(2, '0'),
      monthName: new Intl.DateTimeFormat('es', { month: 'long' }).format(date),
    };
  }).filter((day): day is NonNullable<typeof day> => day !== null);
}

function formatSelectedDate(dateKey: string) {
  if (!dateKey) return '';
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(year, month - 1, day));
}

function isPastTimeSlot(date: string, time: string) {
  if (date !== getLocalDateKey()) return false;
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return time <= currentTime;
}

export function RegisterScreen({
  form,
  errors,
  isSubmitting,
  isEditingBooking,
  bookedTimes,
  cancelableTimes,
  isLoadingAvailability,
  availabilityError,
  onRefreshAvailability,
  onCancelBooking,
  onChange,
  onSubmit,
  onBack,
}: RegisterScreenProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    if (!form.appointmentDate) return new Date(today.getFullYear(), today.getMonth(), 1);
    const [year, month, day] = form.appointmentDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  });
  const [pickerMode, setPickerMode] = useState<'month' | 'year' | null>(null);
  const today = new Date();
  const availableMonths = MONTH_NAMES.map((name, index) => ({
    name,
    index,
  })).filter(
    ({ index }) =>
      visibleMonth.getFullYear() > today.getFullYear() ||
      index >= today.getMonth(),
  );
  const availableDays = getMonthDays(visibleMonth);

  const chooseYear = (year: number) => {
    const month =
      year === today.getFullYear()
        ? Math.max(visibleMonth.getMonth(), today.getMonth())
        : visibleMonth.getMonth();
    setVisibleMonth(new Date(year, month, 1));
    onChange('appointmentDate', '');
    onChange('appointmentTime', '');
    setPickerMode(null);
  };

  const chooseMonth = (month: number) => {
    setVisibleMonth(new Date(visibleMonth.getFullYear(), month, 1));
    onChange('appointmentDate', '');
    onChange('appointmentTime', '');
    setPickerMode(null);
  };

  return (
    <View className="flex-1 gap-5 py-6">
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Regresa a la pantalla principal para elegir otro servicio"
        onPress={onBack}
        hitSlop={8}
        className="min-h-[44px] self-start justify-center rounded-lg px-3 active:opacity-70"
      >
        <Text className="font-semibold text-white">
          {isEditingBooking ? 'Volver al perfil' : 'Servicios'}
        </Text>
      </Pressable>

      <View>
        <Text className="text-3xl font-bold text-white">Reserva tu cita</Text>
        <Text className="mt-2 text-base leading-6 text-white/80">
          Elige el día y la hora que prefieras.
        </Text>
      </View>

      <SurfaceCard className="gap-4 p-4">
        <View className="gap-3">
          <Text className="mt-1 text-sm text-white/75">
            Selecciona el mes, año y día de tu cita
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Seleccionar mes"
              onPress={() => setPickerMode('month')}
              className="min-h-11 flex-1 items-center justify-center rounded-lg border border-white/50 bg-[#252A3D] px-3"
            >
              <Text className="font-bold capitalize text-white">
                {MONTH_NAMES[visibleMonth.getMonth()]}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Seleccionar año"
              onPress={() => setPickerMode('year')}
              className="min-h-11 flex-1 items-center justify-center rounded-lg border border-white/50 bg-[#252A3D] px-3"
            >
              <Text className="font-bold text-white">
                {visibleMonth.getFullYear()}
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pr-2"
          accessibilityLabel="Días disponibles para reservar"
        >
          {availableDays.map((day) => {
            const selected = form.appointmentDate === day.key;
            return (
              <Pressable
                key={day.key}
                accessibilityRole="radio"
                accessibilityLabel={`${day.weekday} ${day.day} de ${day.monthName}`}
                accessibilityState={{ selected }}
                onPress={() => {
                  onChange('appointmentDate', day.key);
                  if (form.appointmentDate !== day.key) {
                    onChange('appointmentTime', '');
                  }
                }}
                className={`min-h-[82px] w-[58px] items-center justify-center rounded-xl border ${
                  selected
                    ? 'border-[#00BFFF] bg-[#1A2A3A]'
                    : 'border-white/40 bg-[#30343F] active:bg-[#414653]'
                }`}
              >
                <Text className="text-[10px] font-semibold text-white/75">
                  {day.weekday}
                </Text>
                <Text className="mt-1 text-xl font-bold text-white">
                  {day.day}
                </Text>
                <Text className="text-[9px] uppercase text-white/75">
                  {day.monthName.slice(0, 3)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {form.appointmentDate ? (
          <Text className="text-sm font-medium capitalize text-white">
            {formatSelectedDate(form.appointmentDate)}
          </Text>
        ) : null}
        {errors.appointmentDate ? (
          <Text accessibilityRole="alert" className="text-sm text-white">
            {errors.appointmentDate}
          </Text>
        ) : null}
      </SurfaceCard>

      <Modal
        visible={pickerMode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerMode(null)}
      >
        <View className="flex-1 justify-center bg-black/60 px-8">
          <SurfaceCard className="max-h-[70%] gap-4 p-5">
            <Text className="text-xl font-bold capitalize text-white">
              Selecciona {pickerMode === 'month' ? 'un mes' : 'un año'}
            </Text>
            <ScrollView>
              {pickerMode === 'month'
                ? availableMonths.map(({ name, index }) => (
                    <Pressable
                      key={name}
                      accessibilityRole="button"
                      onPress={() => chooseMonth(index)}
                      className="min-h-12 justify-center border-b border-white/20 px-2"
                    >
                      <Text className="text-base capitalize text-white">
                        {name}
                      </Text>
                    </Pressable>
                  ))
                : Array.from(
                    { length: Math.max(0, LAST_BOOKING_YEAR - today.getFullYear() + 1) },
                    (_, index) => today.getFullYear() + index,
                  ).map((year) => (
                    <Pressable
                      key={year}
                      accessibilityRole="button"
                      onPress={() => chooseYear(year)}
                      className="min-h-12 justify-center border-b border-white/20 px-2"
                    >
                      <Text className="text-base text-white">{year}</Text>
                    </Pressable>
                  ))}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPickerMode(null)}
              className="min-h-11 items-center justify-center rounded-lg bg-[#E05560]"
            >
              <Text className="font-bold text-white">Cerrar</Text>
            </Pressable>
          </SurfaceCard>
        </View>
      </Modal>

      <SurfaceCard className="gap-4 p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
          <Text className="text-lg font-bold text-white">Horarios</Text>
          <Text className="mt-1 text-sm text-white/75">
            {isLoadingAvailability
              ? 'Consultando horarios guardados…'
              : availabilityError
                ? 'No se pudo consultar la disponibilidad.'
                : form.appointmentDate
              ? `Disponibles para el ${formatSelectedDate(form.appointmentDate)}`
              : 'Primero selecciona un día'}
          </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Actualizar horarios disponibles"
            accessibilityState={{
              disabled: !form.appointmentDate || isLoadingAvailability,
            }}
            disabled={!form.appointmentDate || isLoadingAvailability}
            onPress={onRefreshAvailability}
            className={`ml-2 min-h-10 flex-row items-center justify-center gap-1 rounded-lg border border-white/50 px-3 ${
              !form.appointmentDate || isLoadingAvailability
                ? 'opacity-50'
                : 'bg-[#00BFFF] active:opacity-70'
            }`}
          >
            <Text className="text-base font-bold text-white">↻</Text>
            <Text className="text-xs font-bold text-white">
              {isLoadingAvailability ? 'Actualizando' : 'Actualizar'}
            </Text>
          </Pressable>
        </View>
        {availabilityError ? (
          <View className="gap-2">
            <Text accessibilityRole="alert" className="text-sm text-white">
              {availabilityError}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onRefreshAvailability}
              className="min-h-11 justify-center self-start px-2"
            >
              <Text className="font-semibold text-white">Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        <View className="flex-row flex-wrap gap-2">
          {TIME_SLOTS.map((time) => {
            const selected = form.appointmentTime === time;
            const isBooked = bookedTimes.includes(time);
            const isCancelable = cancelableTimes.includes(time);
            const isPast = Boolean(
              form.appointmentDate && isPastTimeSlot(form.appointmentDate, time),
            );
            const unavailable =
              !form.appointmentDate ||
              (isBooked && !isCancelable) ||
              (isPast && !isCancelable) ||
              isLoadingAvailability ||
              Boolean(availabilityError);
            return (
              <Pressable
                key={time}
                accessibilityRole="radio"
                accessibilityLabel={`${time}${isCancelable ? ', tu reserva, tocar para cancelar' : isBooked ? ', reservado' : isPast ? ', hora pasada' : ''}`}
                accessibilityState={{ selected, disabled: unavailable }}
                disabled={unavailable}
                onPress={() =>
                  isCancelable && !isEditingBooking
                    ? onCancelBooking(form.appointmentDate, time)
                    : onChange('appointmentTime', time)
                }
                className={`min-h-11 w-[31%] items-center justify-center rounded-lg border ${
                  (isBooked && !isCancelable) || (isPast && !isCancelable)
                    ? 'border-white/20 bg-[#111827]'
                    : isCancelable
                      ? 'border-[#3E9B68] bg-[#216342] active:opacity-80'
                      : selected
                    ? 'border-[#00BFFF] bg-[#1A2A3A]'
                    : 'border-white/40 bg-[#20212a] active:bg-[#303341]'
                } ${unavailable ? 'opacity-50' : ''}`}
              >
                <Text className="text-center text-xs font-semibold text-white">
                  {isCancelable
                    ? 'Tu reserva'
                    : isBooked
                      ? 'Reservado'
                      : isPast
                        ? 'Pasó'
                        : time}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {errors.appointmentTime ? (
          <Text accessibilityRole="alert" className="text-sm text-white">
            {errors.appointmentTime}
          </Text>
        ) : null}
      </SurfaceCard>

      <SurfaceCard className="gap-5 p-4">
        <View>
          <Text className="text-lg font-bold text-white">Tus datos</Text>
          <Text className="mt-1 text-sm text-white/75">
            Confirma quién asistirá a la cita.
          </Text>
        </View>

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
          <Text className="text-sm font-semibold text-white">Servicio</Text>
          <View className="min-h-[54px] justify-center rounded-xl border border-white/40 bg-white px-4 py-3">
            <Text className="text-base font-medium text-[#161616]">
              {form.service === 'Corte personalizado'
                ? form.customService || 'Corte personalizado'
                : form.service || 'Regresa y selecciona un servicio'}
            </Text>
          </View>
          {errors.service || errors.customService ? (
            <Text accessibilityRole="alert" className="text-sm text-white">
              {errors.service || errors.customService}
            </Text>
          ) : null}
        </View>
        <View className="gap-2">
          <Text className="text-sm font-semibold text-white">Barbero</Text>
          <View className="min-h-[54px] justify-center rounded-xl border border-white/40 bg-white px-4 py-3">
            <Text className="text-base font-medium text-[#161616]">
              {form.barber || 'Regresa y selecciona un barbero'}
            </Text>
          </View>
          {errors.barber ? (
            <Text accessibilityRole="alert" className="text-sm text-white">
              {errors.barber}
            </Text>
          ) : null}
        </View>
        {form.promotion ? (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-white">
              Promoción elegida
            </Text>
            <View className="min-h-[54px] justify-center rounded-xl border border-white/40 bg-white px-4 py-3">
              <Text className="text-base font-medium text-[#161616]">
                {PROMOTIONS.find((item) => item.id === form.promotion)?.title}
              </Text>
            </View>
          </View>
        ) : null}
        <Field
          label="Descripción"
          value={form.description}
          onChangeText={(value) => onChange('description', value)}
          placeholder="¿Tienes alguna sugerencia o comentario adicional?"
          multiline
          error={errors.description}
        />

        <ActionButton
          label={
            isSubmitting
              ? isEditingBooking
                ? 'Guardando cambios…'
                : 'Enviando solicitud…'
              : isEditingBooking
                ? 'Guardar cambios de la cita'
                : 'Confirmar cita'
          }
          onPress={onSubmit}
          variant="success"
          disabled={isSubmitting}
          accessibilityHint="Envía tu solicitud de cita"
        />
      </SurfaceCard>
    </View>
  );
}
