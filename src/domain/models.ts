export type RequestType =
  | 'Corte de cabello'
  | 'Arreglo de barba'
  | 'Corte + barba'
  | 'Otro';

export type RequestForm = {
  name: string;
  phone: string;
  type: RequestType | '';
  description: string;
};

export type LoginErrors = {
  username?: string;
  password?: string;
};

export type RequestErrors = Partial<Record<keyof RequestForm, string>>;

export type SubmittedRequest = RequestForm & {
  submittedAt: string;
};

export const REQUEST_TYPES: RequestType[] = [
  'Corte de cabello',
  'Arreglo de barba',
  'Corte + barba',
  'Otro',
];

export const EMPTY_FORM: RequestForm = {
  name: '',
  phone: '',
  type: '',
  description: '',
};
