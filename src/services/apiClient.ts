import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '@/config/api';

export const TOKEN_KEY = '@pythonquest:token';

// O servidor gratuito pode levar até ~1 minuto para "acordar".
const REQUEST_TIMEOUT_MS = 70000;

type RequestOptions = RequestInit & {
  auth?: boolean;
  fallbackMessage?: string;
};

export function getAuthToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function requestApi<T>(
  path: string,
  { auth = false, fallbackMessage, headers, ...options }: RequestOptions = {}
): Promise<T> {
  const authHeaders: Record<string, string> = {};

  if (auth) {
    const token = await getAuthToken();

    if (!token) {
      throw new Error('Usuário não autenticado.');
    }

    authHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...(headers || {})
      }
    });
  } catch {
    throw new Error(
      'Sem conexão com o servidor. Verifique sua internet e tente novamente.'
    );
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        fallbackMessage ||
        'Não foi possível concluir a operação.'
    );
  }

  return data as T;
}
