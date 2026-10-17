export type ServiceType =
  | 'Low Fade'
  | 'Mullet'
  | 'Taper'
  | 'Corte personalizado';

export type BarberName = 'Messi' | 'Ronaldo' | 'Neymar';

export type PromotionId = 'fade-day' | 'full-style' | 'first-visit';

export type Promotion = {
  id: PromotionId;
  title: string;
  description: string;
  discount: string;
};

export type RequestForm = {
  name: string;
  phone: string;
  service: ServiceType | '';
  customService: string;
  barber: BarberName | '';
  promotion: PromotionId | '';
  description: string;
  appointmentDate: string;
  appointmentTime: string;
};

export type UserProfile = {
  username: string;
  displayName: string;
  photoUri: string | null;
};

export type LoginErrors = {
  username?: string;
  password?: string;
};

export type RequestErrors = Partial<Record<keyof RequestForm, string>>;

export type SubmittedRequest = RequestForm & {
  submittedAt: string;
  ownerUsername?: string;
};

export const SERVICE_TYPES: ServiceType[] = [
  'Low Fade',
  'Mullet',
  'Taper',
  'Corte personalizado',
];

export const BARBERS: BarberName[] = ['Messi', 'Ronaldo', 'Neymar'];

export const PROMOTIONS: Promotion[] = [
  {
    id: 'fade-day',
    title: 'Día de Fade',
    description: 'Dale un nuevo acabado a tu Low Fade.',
    discount: '15% de descuento',
  },
  {
    id: 'full-style',
    title: 'Cambio de estilo',
    description: 'Anímate a probar un Mullet o un Taper.',
    discount: '10% de descuento',
  },
  {
    id: 'first-visit',
    title: 'Primera visita',
    description: 'Un detalle especial para conocer la barbería.',
    discount: 'Bebida de cortesía',
  },
];

export const EMPTY_FORM: RequestForm = {
  name: '',
  phone: '',
  service: '',
  customService: '',
  barber: '',
  promotion: '',
  description: '',
  appointmentDate: '',
  appointmentTime: '',
};

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
