import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { CatalogItem } from '../../domain/models';
import { ActionButton } from '../components/ActionButton';
import { Field } from '../components/Field';
import { SurfaceCard } from '../components/SurfaceCard';
import {
  createCatalogId,
  type CatalogKind,
  FirestoreCatalogRepository,
} from '../../infrastructure/repositories/FirestoreCatalogRepository';

type Props = { repository: FirestoreCatalogRepository; onBack: () => void };
type Draft = Omit<CatalogItem, 'id'>;
const EMPTY_DRAFT: Draft = { name: '', description: '', price: '', discount: '', photoUrl: null, photoPath: null, isOccupied: false };
const CATEGORIES: { id: CatalogKind; label: string }[] = [
  { id: 'services', label: 'Servicios' },
  { id: 'barbers', label: 'Barberos' },
  { id: 'promotions', label: 'Promociones' },
];

export function CatalogManagementScreen({ repository, onBack }: Props) {
  const [kind, setKind] = useState<CatalogKind>('services');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string; price?: string }>({});

  const selectCategory = (nextKind: CatalogKind) => {
    if (nextKind === kind) return;
    setKind(nextKind);
    setIsLoading(true);
    setSelected(null);
    setEditingId(null);
    setIsCreating(false);
    setDraft(EMPTY_DRAFT);
    setPendingPhotoUri(null);
    setFieldErrors({});
    setError('');
  };

  useEffect(() => {
    let active = true;
    void repository.seedDefaultsIfEmpty(kind).catch((cause: unknown) => {
      if (!active) return;
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar el catálogo.');
    });
    const unsubscribe = repository.subscribe(
      kind,
      (nextItems) => {
        if (!active) return;
        setItems(nextItems);
        setIsLoading(false);
      },
      (cause) => {
        if (!active) return;
        setError(cause.message);
        setIsLoading(false);
      },
    );
    return () => { active = false; unsubscribe(); };
  }, [kind, repository]);

  const startNew = () => {
    setSelected(null);
    setEditingId(null);
    setIsCreating(true);
    setDraft(EMPTY_DRAFT);
    setPendingPhotoUri(null);
    setFieldErrors({});
  };

  const cancelForm = () => {
    setEditingId(null);
    setIsCreating(false);
    setDraft(EMPTY_DRAFT);
    setPendingPhotoUri(null);
    setFieldErrors({});
  };

  const startEdit = (item: CatalogItem) => {
    setSelected(null);
    setEditingId(item.id);
    setIsCreating(false);
    setPendingPhotoUri(null);
    setFieldErrors({});
    setDraft({ ...item, price: item.price ?? '', discount: item.discount ?? '' });
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Permite el acceso a tus fotos para elegir una imagen del barbero.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPendingPhotoUri(result.assets[0].uri);
  };

  const setBarberOccupied = async (item: CatalogItem) => {
    try {
      await repository.save(kind, { ...item, isOccupied: item.isOccupied !== true });
    } catch (cause) {
      Alert.alert('No se pudo cambiar el estado', cause instanceof Error ? cause.message : 'Revisa las reglas de Firestore.');
    }
  };

  const save = async () => {
    const name = draft.name.trim();
    const description = draft.description.trim();
    const nextErrors: typeof fieldErrors = {};
    if (!name) nextErrors.name = 'Escribe un nombre.';
    else if (name.length < 2) nextErrors.name = 'Usa al menos 2 caracteres.';
    else if (name.length > 60) nextErrors.name = 'El nombre no puede superar 60 caracteres.';
    if (!description) nextErrors.description = 'Escribe una descripción.';
    else if (description.length > 240) nextErrors.description = 'La descripción no puede superar 240 caracteres.';
    if (kind === 'services' && draft.price.trim() && !/^\d+(?:[.,]\d{1,2})?$/.test(draft.price.trim())) {
      nextErrors.price = 'Escribe un precio válido, por ejemplo 35 o 35.50.';
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    const id = editingId ?? createCatalogId(name);
    if (!id) {
      Alert.alert('Nombre no válido', 'Escribe un nombre para el registro.');
      return;
    }
    if (!editingId && items.some((item) => item.id === id)) {
      Alert.alert('Ya existe', 'Ya hay un registro con ese nombre.');
      return;
    }
    setIsSaving(true);
    try {
      let savedDraft = { ...draft, name, description, price: draft.price.trim(), discount: draft.discount.trim() };
      if (kind === 'barbers' && pendingPhotoUri) {
        const photo = await repository.uploadBarberPhoto(id, pendingPhotoUri);
        savedDraft = { ...savedDraft, ...photo };
      }
      await repository.save(kind, { ...savedDraft, id });
      const oldPath = items.find((item) => item.id === editingId)?.photoPath;
      if (oldPath && savedDraft.photoPath !== oldPath) {
        void repository.deleteBarberPhoto(oldPath).catch(() => undefined);
      }
      setEditingId(null);
      setIsCreating(false);
      setDraft(EMPTY_DRAFT);
      setPendingPhotoUri(null);
    } catch (cause) {
      Alert.alert('No se pudo guardar', cause instanceof Error ? cause.message : 'Revisa las reglas de Firestore y la configuración de Firebase Storage.');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = (item: CatalogItem) => {
    Alert.alert('Eliminar registro', `¿Quieres eliminar “${item.name}”?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
        void repository.remove(kind, item.id).then(async () => {
          if (kind === 'barbers' && item.photoPath) {
            await repository.deleteBarberPhoto(item.photoPath).catch(() => undefined);
          }
          if (selected?.id === item.id) setSelected(null);
        }).catch((cause: unknown) => Alert.alert('No se pudo eliminar', cause instanceof Error ? cause.message : 'Revisa las reglas de Firestore.'));
      } },
    ]);
  };

  const editing = editingId !== null;
  const showPrice = kind === 'services';
  const showDiscount = kind === 'promotions';

  return (
    <View className="flex-1 gap-5 py-8">
      <Pressable accessibilityRole="button" onPress={onBack} className="self-start rounded-lg px-2 py-2">
        <Text className="font-semibold text-[#00BFFF]">‹ Volver</Text>
      </Pressable>
      <View>
        <Text className="text-3xl font-bold text-white">Administrar negocio</Text>
        <Text className="mt-1 text-sm leading-5 text-white/75">Gestiona los datos que ven tus clientes.</Text>
      </View>

      <View className="flex-row gap-2">
        {CATEGORIES.map((category) => (
          <Pressable key={category.id} onPress={() => selectCategory(category.id)} accessibilityRole="tab" accessibilityState={{ selected: kind === category.id }} className={`flex-1 items-center rounded-xl px-2 py-3 ${kind === category.id ? 'bg-[#00BFFF]' : 'border border-white/30 bg-[#252A3D]'}`}>

            <Text className="text-center text-xs font-bold text-white">{category.label}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text accessibilityRole="alert" className="text-sm text-[#FCA5A5]">{error}</Text> : null}
      {isLoading ? <ActivityIndicator color="#00BFFF" /> : null}

      {!selected && !editing ? (
        <>
          <ActionButton label="＋ Registrar nuevo" onPress={startNew} />
          {items.map((item) => (
            <SurfaceCard key={item.id} className="gap-3 p-4">
              <Text className="text-lg font-bold text-white">{item.name}</Text>
              <Text numberOfLines={2} className="text-sm text-white/75">{item.description}</Text>
              {kind === 'barbers' ? (
                <View className="flex-row items-center justify-between">
                  <Text className={`text-sm font-bold ${item.isOccupied ? 'text-[#FCA5A5]' : 'text-emerald-300'}`}>{item.isOccupied ? 'Ocupado' : 'Disponible'}</Text>
                  <Pressable onPress={() => void setBarberOccupied(item)} className={`rounded-lg border px-3 py-2 ${item.isOccupied ? 'border-emerald-300' : 'border-[#FCA5A5]'}`}>
                    <Text className={`font-semibold ${item.isOccupied ? 'text-emerald-300' : 'text-[#FCA5A5]'}`}>{item.isOccupied ? 'Marcar disponible' : 'Marcar ocupado'}</Text>
                  </Pressable>
                </View>
              ) : null}
              <View className="flex-row gap-3">
                <Pressable onPress={() => setSelected(item)} className="rounded-lg border border-[#00BFFF] px-4 py-2"><Text className="font-semibold text-[#00BFFF]">Ver detalle</Text></Pressable>
                <Pressable onPress={() => startEdit(item)} className="rounded-lg border border-white/30 px-4 py-2"><Text className="font-semibold text-white">Editar</Text></Pressable>
                <Pressable onPress={() => remove(item)} className="rounded-lg border border-[#E05560] px-4 py-2"><Text className="font-semibold text-[#FCA5A5]">Eliminar</Text></Pressable>
              </View>
            </SurfaceCard>
          ))}
          {!isLoading && items.length === 0 ? <Text className="text-center text-white/70">No hay registros en esta categoría.</Text> : null}
        </>
      ) : null}

      {selected ? (
        <SurfaceCard className="gap-4 p-5">
          <Text className="text-2xl font-bold text-white">{selected.name}</Text>
          {kind === 'barbers' && selected.photoUrl ? <Image source={{ uri: selected.photoUrl }} accessibilityLabel={`Foto de ${selected.name}`} resizeMode="cover" className="h-44 w-44 self-center rounded-full" /> : null}
          <Text className="text-base leading-6 text-white/80">{selected.description}</Text>
          {kind === 'barbers' ? <Text className={`font-bold ${selected.isOccupied ? 'text-[#FCA5A5]' : 'text-emerald-300'}`}>Estado: {selected.isOccupied ? 'Ocupado' : 'Disponible'}</Text> : null}
          {selected.price ? <Text className="font-semibold text-white">Precio: {selected.price}</Text> : null}
          {selected.discount ? <Text className="font-semibold text-white">Promoción: {selected.discount}</Text> : null}
          <View className="flex-row gap-3">
            <ActionButton label="Editar" onPress={() => startEdit(selected)} />
            <ActionButton label="Volver a la lista" variant="secondary" onPress={() => setSelected(null)} />
          </View>
          <ActionButton label="Eliminar" variant="danger" onPress={() => remove(selected)} />
        </SurfaceCard>
      ) : null}

      {editing || isCreating ? (
        <SurfaceCard className="gap-4 p-4">
          <Text className="text-xl font-bold text-white">{editing ? 'Editar registro' : 'Nuevo registro'}</Text>
          <Field label="Nombre" value={draft.name} onChangeText={(name) => { setDraft((current) => ({ ...current, name })); setFieldErrors((current) => ({ ...current, name: undefined })); }} placeholder="Nombre" error={fieldErrors.name} />
          <Field label="Descripción" value={draft.description} onChangeText={(description) => { setDraft((current) => ({ ...current, description })); setFieldErrors((current) => ({ ...current, description: undefined })); }} placeholder="Describe este registro" multiline error={fieldErrors.description} />
          {kind === 'barbers' ? (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-[#E8E3D8]">Foto del barbero</Text>
              {(pendingPhotoUri || draft.photoUrl) ? <Image source={{ uri: pendingPhotoUri ?? draft.photoUrl ?? undefined }} accessibilityLabel="Vista previa de la foto del barbero" resizeMode="cover" className="h-36 w-36 self-center rounded-full" /> : <Text className="text-sm text-white/65">Aún no hay una foto seleccionada.</Text>}
              <Pressable onPress={() => void pickPhoto()} className="self-start rounded-xl border border-[#00BFFF] px-4 py-3"><Text className="font-semibold text-[#00BFFF]">Elegir foto</Text></Pressable>
            </View>
          ) : null}
          {showPrice ? <Field label="Precio (opcional)" value={draft.price} onChangeText={(price) => { setDraft((current) => ({ ...current, price })); setFieldErrors((current) => ({ ...current, price: undefined })); }} placeholder="Ej.: 35 o 35.50" keyboardType="decimal-pad" error={fieldErrors.price} /> : null}
          {showDiscount ? <Field label="Beneficio o descuento (opcional)" value={draft.discount} onChangeText={(discount) => setDraft((current) => ({ ...current, discount }))} placeholder="Ej.: 15% de descuento" /> : null}
          <ActionButton label={isSaving ? 'Guardando…' : 'Guardar cambios'} onPress={() => void save()} disabled={isSaving} />
          <ActionButton label="Cancelar" variant="secondary" onPress={cancelForm} disabled={isSaving} />
        </SurfaceCard>
      ) : null}
      <Text className="text-center text-xs text-white/60">Se cargarán los registros iniciales actuales al abrir cada categoría por primera vez.</Text>
    </View>
  );
}
