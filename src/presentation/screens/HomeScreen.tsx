import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { BarberShopLogo } from '../components/BarberShopLogo';
import { Field } from '../components/Field';
import { SurfaceCard } from '../components/SurfaceCard';
import { HairCareInfoCard } from '../components/HairCareInfoCard';
import type {
  CatalogItem,
  BarberName,
  PromotionId,
  RequestErrors,
  RequestForm,
  ServiceType,
  UserProfile,
} from '../../domain/models';

type HomeTab = 'Servicio' | 'Barberos' | 'Promo';

type HomeScreenProps = {
  profile: UserProfile;
  form: RequestForm;
  errors: RequestErrors;
  onChange: (field: keyof RequestForm, value: string) => void;
  onSelectService: (service: ServiceType | '') => void;
  onSelectBarber: (barber: BarberName | '') => void;
  onSelectPromotion: (promotion: PromotionId | '') => void;
  onRegister: () => void;
  onOpenProfile: () => void;
  services: CatalogItem[];
  barbers: CatalogItem[];
  promotions: CatalogItem[];
  isCatalogAdmin: boolean;
  onManageBusiness: () => void;
};

const TABS: HomeTab[] = ['Servicio', 'Barberos', 'Promo'];

const BARBER_PHOTOS: Record<string, number> = {
  Messi: require('../../../assets/barber-messi.jpg'),
  Ronaldo: require('../../../assets/barber-ronaldo.jpg'),
  Neymar: require('../../../assets/barber-neymar.jpg'),
};

function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <View
      className={`h-6 w-6 items-center justify-center rounded-full border ${
        selected ? 'border-[#00BFFF] bg-[#00BFFF]' : 'border-white/60'
      }`}
    >
      {selected ? <Text className="text-xs font-bold text-white">✓</Text> : null}
    </View>
  );
}

export function HomeScreen({
  profile,
  form,
  errors,
  onChange,
  onSelectService,
  onSelectBarber,
  onSelectPromotion,
  onRegister,
  onOpenProfile,
  services,
  barbers,
  promotions,
  isCatalogAdmin,
  onManageBusiness,
}: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<HomeTab>('Servicio');
  const canContinue =
    Boolean(form.service) &&
    Boolean(form.barber) &&
    (form.service !== 'Corte personalizado' || Boolean(form.customService.trim()));

  return (
    <View className="flex-1 gap-5 py-8">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold uppercase tracking-[2px] text-white">
          BARBERÍA
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir mi perfil"
          onPress={onOpenProfile}
          className="h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-[#00BFFF] active:opacity-70"
        >
          {profile.photoUri ? (
            <Image
              source={{ uri: profile.photoUri }}
              accessibilityLabel="Foto de perfil"
              resizeMode="cover"
              className="h-full w-full"
            />
          ) : (
            <Text className="font-bold text-white">
              {profile.displayName.trim().slice(0, 1).toUpperCase()}
            </Text>
          )}
        </Pressable>
      </View>

      {isCatalogAdmin ? (
        <Pressable accessibilityRole="button" onPress={onManageBusiness} className="self-start rounded-xl border border-[#00BFFF] px-4 py-2 active:opacity-75">
          <Text className="font-semibold text-[#00BFFF]">Administrar negocio</Text>
        </Pressable>
      ) : null}

      <BarberShopLogo variant="hero" />

      <View>
        <Text className="text-3xl font-bold leading-10 text-white">
          Hola, {profile.displayName.trim()}.
        </Text>
        <Text className="mt-1 text-base leading-6 text-white/80">
          Elige tu servicio, barbero y una promo para tu próxima visita.
        </Text>
      </View>

      <View className="flex-row gap-2">
        {TABS.map((tab) => {
          const selected = activeTab === tab;
          return (
            <Pressable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setActiveTab(tab)}
              className={`min-h-11 flex-1 items-center justify-center rounded-xl ${
                selected
                  ? 'bg-[#00BFFF]'
                  : 'border border-white/40 bg-[#2A2D3E] active:opacity-80'
              }`}
            >
              <Text className="font-bold text-white">{tab}</Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === 'Servicio' ? (
        <View className="gap-3">
          <Text className="text-xl font-bold text-white">Elige tu corte</Text>
          <SurfaceCard className="gap-3 p-4">
            {services.map((item) => {
              const selected = form.service === item.name;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    onSelectService(selected ? '' : item.name);
                    setActiveTab('Barberos');
                  }}
                  className={`min-h-[72px] flex-row items-center rounded-xl border px-4 py-3 active:opacity-80 ${
                    selected
                      ? 'border-[#00BFFF] bg-[#1A2A3A]'
                      : 'border-white/40 bg-[#20212a]'
                  }`}
                >
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#00BFFF]">
                    <Text className="text-lg text-white">✂</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-white">{item.name}</Text>
                    <Text className="mt-1 text-xs leading-4 text-white/75">
                      {item.description}
                    </Text>
                    {item.price ? <Text className="mt-1 text-xs font-bold text-white">{item.price}</Text> : null}
                  </View>
                  <SelectionMark selected={selected} />
                </Pressable>
              );
            })}
            {form.service === 'Corte personalizado' ? (
              <Field
                label="Describe tu corte"
                value={form.customService}
                onChangeText={(value) => onChange('customService', value)}
                placeholder="Ej.: degradado medio con diseño"
                error={errors.customService}
                multiline
              />
            ) : null}
          </SurfaceCard>
          {errors.service ? (
            <Text accessibilityRole="alert" className="text-sm text-white">
              {errors.service}
            </Text>
          ) : null}
        </View>
      ) : null}

      {activeTab === 'Barberos' ? (
        <View className="gap-3">
          <Text className="text-xl font-bold text-white">
            Elige tu barbero
          </Text>
          <Text className="text-sm leading-5 text-white/80">
            Selecciona quién quieres que te atienda.
          </Text>
          {form.service === 'Corte personalizado' ? (
            <Field
              label="Describe tu corte"
              value={form.customService}
              onChangeText={(value) => onChange('customService', value)}
              placeholder="Ej.: degradado medio con diseño"
              error={errors.customService}
              multiline
            />
          ) : null}
          <SurfaceCard className="gap-3 p-4">
            {barbers.map((barber) => {
              const selected = form.barber === barber.name;
              const barberPhoto = BARBER_PHOTOS[barber.name];
              const occupied = barber.isOccupied === true;
              return (
                <Pressable
                  key={barber.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: occupied }}
                  onPress={() =>
                    onSelectBarber(selected ? '' : barber.name)
                  }
                  disabled={occupied}
                  className={`min-h-[88px] flex-row items-center rounded-xl border px-4 py-3 active:opacity-80 ${
                    selected
                      ? 'border-[#00BFFF] bg-[#1A2A3A]'
                      : 'border-white/40 bg-[#20212a]'
                  }`}
                >
                  {barber.photoUrl ? (
                    <Image
                      className="mr-3 border border-white/30 bg-[#2E3450]"
                      source={{ uri: barber.photoUrl }}
                      accessibilityLabel={`Foto de ${barber.name}`}
                      resizeMode="cover"
                      style={{ width: 64, height: 64, borderRadius: 32 }}
                    />
                  ) : barberPhoto ? (
                    <Image
                      className="mr-3 border border-white/30 bg-[#2E3450]"
                      source={barberPhoto}
                      accessibilityLabel={`Foto de ${barber.name}`}
                      resizeMode="cover"
                      style={{ width: 64, height: 64, borderRadius: 32 }}
                    />
                  ) : (
                    <View className="mr-3 h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-[#2E3450]">
                      <Text className="text-lg font-bold text-white">
                        {barber.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-bold text-white">{barber.name}</Text>
                    <Text className="mt-1 text-xs text-white/75">
                      {barber.description}
                    </Text>
                  </View>
                  {occupied ? (
                    <View className="rounded-full border border-[#F87171] bg-[#542B35] px-3 py-2"><Text className="text-xs font-bold text-[#FCA5A5]">Ocupado</Text></View>
                  ) : <SelectionMark selected={selected} />}
                </Pressable>
              );
            })}
          </SurfaceCard>
          {errors.barber ? (
            <Text accessibilityRole="alert" className="text-sm text-white">
              {errors.barber}
            </Text>
          ) : null}
          <Text className="text-xs leading-5 text-white/70">
            Barberos y disponibilidad de demostración; confirma tu cita para
            enviar la solicitud.
          </Text>
        </View>
      ) : null}

      {activeTab === 'Promo' ? (
        <View className="gap-3">
          <Text className="text-xl font-bold text-white">
            Promociones de cortes
          </Text>
          <Text className="text-sm leading-5 text-white/80">
            Elige una promo opcional para incluirla en tu solicitud.
          </Text>
          <SurfaceCard className="gap-3 p-4">
            {promotions.map((promotion) => {
              const selected = form.promotion === promotion.id;
              return (
                <Pressable
                  key={promotion.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() =>
                    onSelectPromotion(selected ? '' : promotion.id)
                  }
                  className={`min-h-[90px] flex-row items-center rounded-xl border px-4 py-3 active:opacity-80 ${
                    selected
                      ? 'border-[#00BFFF] bg-[#1A2A3A]'
                      : 'border-white/40 bg-[#20212a]'
                  }`}
                >
                  <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-[#00BFFF]">
                    <Text className="text-lg font-bold text-white">%</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-white">
                    {promotion.name}
                    </Text>
                    <Text className="mt-1 text-xs text-white/75">
                      {promotion.description}
                    </Text>
                    <Text className="mt-1 text-xs font-bold text-white">
                      {promotion.discount}
                    </Text>
                  </View>
                  <SelectionMark selected={selected} />
                </Pressable>
              );
            })}
          </SurfaceCard>
          <Text className="text-xs leading-5 text-white/70">
            Promociones de tu barberia preferida.
          </Text>
        </View>
      ) : null}

      <View className="gap-2">
        {form.service || form.barber ? (
          <Text className="text-center text-sm text-white/85">
            {form.service === 'Corte personalizado'
              ? form.customService || 'Corte personalizado'
              : form.service || 'Sin servicio'}{' '}
            {form.barber ? `· Barbero ${form.barber}` : '· Elige un barbero'}
          </Text>
        ) : (
          <Text className="text-center text-sm text-white/85">
            Elige un servicio y un barbero para continuar.
          </Text>
        )}
        <ActionButton
          label="Elegir fecha y horario"
          onPress={onRegister}
          variant="success"
          disabled={!canContinue}
          accessibilityHint="Continúa para elegir día, horario y completar tus datos"
        />
      </View>

      <HairCareInfoCard />
    </View>
  );
}
