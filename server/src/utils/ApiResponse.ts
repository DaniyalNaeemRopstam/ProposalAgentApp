export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiFailure = {
  success: false;
  message: string;
  errors?: unknown;
};

export function ok<T>(data: T, message?: string): ApiSuccess<T> {
  return message ? { success: true, data, message } : { success: true, data };
}

export function fail(message: string, errors?: unknown): ApiFailure {
  return errors !== undefined ? { success: false, message, errors } : { success: false, message };
}
