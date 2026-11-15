export type WikipediaSummary = {
  title: string;
  extract: string;
  thumbnailUrl?: string;
  sourceUrl: string;
};

type WikipediaResponse = {
  title?: unknown;
  extract?: unknown;
  thumbnail?: { source?: unknown };
  content_urls?: { desktop?: { page?: unknown } };
};

const SUMMARY_URL = 'https://es.wikipedia.org/api/rest_v1/page/summary/Cabello';

export async function getHairSummary(): Promise<WikipediaSummary> {
  let response: Response;
  try {
    response = await fetch(SUMMARY_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BarberiaExpo/1.0 (https://github.com/MATHIAS-PORTUGUEZ/App-movil) Expo/57',
        'Api-User-Agent': 'BarberiaExpo/1.0 (https://github.com/MATHIAS-PORTUGUEZ/App-movil) Expo/57',
      },
    });
  } catch {
    throw new Error('No se pudo conectar con el servicio. Comprueba tu conexión a internet e inténtalo de nuevo.');
  }

  if (!response.ok) {
    throw new Error(`El servicio respondió con un error (${response.status}). Inténtalo de nuevo más tarde.`);
  }

  let data: WikipediaResponse;
  try {
    data = await response.json() as WikipediaResponse;
  } catch {
    throw new Error('El servicio envió una respuesta que no se pudo leer.');
  }

  if (typeof data.title !== 'string' || typeof data.extract !== 'string' || !data.extract.trim()) {
    throw new Error('El servicio no devolvió información sobre el tema solicitado.');
  }

  return {
    title: data.title,
    extract: data.extract,
    thumbnailUrl: typeof data.thumbnail?.source === 'string' ? data.thumbnail.source : undefined,
    sourceUrl: typeof data.content_urls?.desktop?.page === 'string'
      ? data.content_urls.desktop.page
      : 'https://es.wikipedia.org/wiki/Cabello',
  };
}
