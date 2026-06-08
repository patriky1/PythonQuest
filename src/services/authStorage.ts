import AsyncStorage from '@react-native-async-storage/async-storage';
import { SignInPayload, SignUpPayload, User } from '@/types/auth';

const TOKEN_KEY = '@pythonquest:token';
const CURRENT_USER_KEY = '@pythonquest:current-user';

// Teste no navegador/web:
// http://localhost:3333
//
// Teste no emulador Android:
// http://10.0.2.2:3333
//
// Teste em celular físico:
// usar o IP do computador na rede, exemplo:
// http://192.168.0.10:3333

import { API_URL } from '@/config/api';

type AuthResponse = {
  token: string;
  user: User;
};

type MeResponse = {
  user: User;
};

async function requestApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      'Não foi possível concluir a operação.';

    throw new Error(message);
  }

  return data as T;
}

async function saveAuthSession(token: string, user: User) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  if (!token) {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }

  try {
    const data = await requestApi<MeResponse>('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));

    return data.user;
  } catch {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(CURRENT_USER_KEY);

    return null;
  }
}

export async function createLocalUser(payload: SignUpPayload): Promise<User> {
  const data = await requestApi<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  await saveAuthSession(data.token, data.user);

  return data.user;
}

export async function loginLocalUser(payload: SignInPayload): Promise<User> {
  const data = await requestApi<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  await saveAuthSession(data.token, data.user);

  return data.user;
}

export async function logoutLocalUser() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
}