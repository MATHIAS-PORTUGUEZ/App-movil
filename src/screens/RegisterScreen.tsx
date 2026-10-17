import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { SurfaceCard } from '../components/SurfaceCard';
import { getLocalDateKey, PROMOTIONS } from '../domain/models';
import type { RequestErrors, RequestForm } from '../domain/models';

type RegisterScreenProps = {
  form: RequestForm;
  errors: RequestErrors;
  isSubmitting: boolean;
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

const DAYS_PER_PAGE = 5;

function getUpcomingDays(startOffset: number) {
  const today = new Date();

  return Array.from({ length: DAYS_PER_PAGE }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + startOffset + index);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return {
      key: `${year}-${month}-${day}`,
      weekday: new Intl.DateTimeFormat('es', { weekday: 'short' })
        .format(date)
        .replace('.', '')
        .toUpperCase(),
      day,
      monthName: new Intl.DateTimeFormat('es', { month: 'long' }).format(date),
    };
  });
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

function getMonthLabel(days: ReturnType<typeof getUpcomingDays>) {
  const formatter = new Intl.DateTimeFormat('es', {
    month: 'long',
    year: 'numeric',
  });
  const firstMonth = formatter.format(new Date(`${days[0].key}T12:00:00`));
  const lastMonth = formatter.format(
    new Date(`${days[days.length - 1].key}T12:00:00`),
  );

  return firstMonth === lastMonth
    ? new Intl.DateTimeFormat('es', { month: 'long' }).format(
        new Date(`${days[0].key}T12:00:00`),
      )
    : `${firstMonth} - ${lastMonth}`;
}

export function RegisterScreen({
  form,
  errors,
  isSubmitting,
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
  const [datePage, setDatePage] = useState(0);
  const upcomingDays = getUpcomingDays(datePage * DAYS_PER_PAGE);
  const monthLabel = getMonthLabel(upcomingDays);

  return (
    <View className="flex-1 gap-5 py-6">
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Regresa a la pantalla principal para elegir otro servicio"
        onPress={onBack}
        hitSlop={8}
        className="min-h-[44px] self-start justify-center rounded-lg px-3 active:opacity-70"
      >
        <Text className="font-semibold text-white">←  Servicios</Text>
      </Pressable>

      <View>
        <Text className="text-3xl font-bold text-white">Reserva tu cita</Text>
        <Text className="mt-2 text-base leading-6 text-white/80">
          Elige el día y la hora que prefieras.
        </Text>
      </View>

      <SurfaceCard className="gap-4 p-4">
        <View>
          <Text className="text-lg font-bold capitalize text-white">
            {monthLabel}
          </Text>
          <Text className="mt-1 text-sm text-white/75">
            Selecciona un día disponible
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver fechas anteriores"
            accessibilityState={{ disabled: datePage === 0 }}
            disabled={datePage === 0}
            onPress={() => setDatePage((page) => Math.max(0, page - 1))}
            className={`h-10 w-7 items-center justify-center rounded-lg ${
              datePage === 0 ? 'opacity-30' : 'bg-[#1900ff] active:opacity-70'
            }`}
          >
            <Text className="text-xl font-bold text-white">‹</Text>
          </Pressable>
          <View
            accessibilityLabel="Días disponibles para reservar"
            className="flex-1 flex-row justify-center gap-1"
          >
            {upcomingDays.map((day) => {
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
                  className={`min-h-[82px] w-[52px] items-center justify-center rounded-xl border ${
                    selected
                      ? 'border-white bg-[#1900ff]'
                      : 'border-white/40 bg-[#20212a] active:bg-[#303341]'
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
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver fechas siguientes"
            onPress={() => setDatePage((page) => page + 1)}
            className="h-10 w-7 items-center justify-center rounded-lg bg-[#1900ff] active:opacity-70"
          >
            <Text className="text-xl font-bold text-white">›</Text>
          </Pressable>
        </View>
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

      <SurfaceCard className="gap-4 p-4">
        <View>
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
                  isCancelable
                    ? onCancelBooking(form.appointmentDate, time)
                    : onChange('appointmentTime', time)
                }
                className={`min-h-11 w-[31%] items-center justify-center rounded-lg border ${
                  (isBooked && !isCancelable) || (isPast && !isCancelable)
                    ? 'border-white/20 bg-[#111827]'
                    : isCancelable
                      ? 'border-[#16a34a] bg-[#14532d] active:opacity-80'
                      : selected
                    ? 'border-white bg-[#1900ff]'
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
          placeholder="Cuéntanos qué estilo buscas"
          multiline
          error={errors.description}
        />

        <ActionButton
          label={isSubmitting ? 'Enviando solicitud…' : 'Confirmar cita'}
          onPress={onSubmit}
          variant="success"
          icon={isSubmitting ? undefined : 'check'}
          disabled={isSubmitting}
          accessibilityHint="Envía tu solicitud de cita"
        />
      </SurfaceCard>
    </View>
  );
}
