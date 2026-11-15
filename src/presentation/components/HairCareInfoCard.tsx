import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, Text, View } from 'react-native';
import { getHairSummary, type WikipediaSummary } from '../../application/WikipediaSummaryService';
import { SurfaceCard } from './SurfaceCard';

export function HairCareInfoCard() {
  const [summary, setSummary] = useState<WikipediaSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void getHairSummary()
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar la información.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setThumbnailFailed(false);
    try {
      setSummary(await getHairSummary());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar la información.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <SurfaceCard className="gap-3 p-4">
      <Text className="text-lg font-bold text-white">Dato sobre el cabello</Text>
      {isLoading ? (
        <View className="min-h-20 flex-row items-center justify-center gap-3">
          <ActivityIndicator accessibilityLabel="Cargando información del cabello" color="#00BFFF" />
          <Text className="text-sm text-white/75">Cargando información…</Text>
        </View>
      ) : error ? (
        <View className="gap-3">
          <Text accessibilityRole="alert" className="text-sm leading-5 text-[#FCA5A5]">{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void loadSummary()} className="self-start rounded-lg border border-[#00BFFF] px-4 py-2">
            <Text className="font-semibold text-[#00BFFF]">Reintentar</Text>
          </Pressable>
        </View>
      ) : summary ? (
        <>
          {summary.thumbnailUrl ? (
            thumbnailFailed ? null : (
              <Image
                source={{ uri: summary.thumbnailUrl }}
                accessibilityLabel={`Imagen de ${summary.title}`}
                resizeMode="cover"
                onError={() => setThumbnailFailed(true)}
                className="h-40 w-full rounded-xl"
              />
            )
          ) : null}
          <Text className="font-semibold text-[#00BFFF]">{summary.title}</Text>
          <Text className="text-sm leading-5 text-white/80">{summary.extract}</Text>
          <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(summary.sourceUrl)} className="self-start py-1">
            <Text className="text-sm font-semibold text-[#00BFFF]">Fuente: Wikipedia</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => void loadSummary()} className="self-start rounded-lg border border-white/30 px-4 py-2">
            <Text className="font-semibold text-white">Actualizar</Text>
          </Pressable>
        </>
      ) : null}
    </SurfaceCard>
  );
}
