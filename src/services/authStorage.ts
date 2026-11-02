import AsyncStorage from '@react-native-async-storage/async-storage';

import { requestApi, TOKEN_KEY } from '@/services/apiClient';
import { SignInPayload, SignUpPayload, User } from '@/types/auth';

const CURRENT_USER_KEY = '@pythonquest:current-user';

type AuthResponse = {
  token: string;
  user: User;
};

type MeResponse = {
  user: User;
};

async function saveAuthSession(token: string, user: User) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [CURRENT_USER_KEY, JSON.stringify(user)]
  ]);
}

async function clearAuthSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, CURRENT_USER_KEY]);
}

async function getCachedUser(): Promise<User | null> {
  const rawUser = await AsyncStorage.getItem(CURRENT_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    return null;
  }
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
      auth: true
    });

    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));

    return data.user;
  } catch (error) {
    const isOffline =
      error instanceof Error && error.message.startsWith('Sem conexão');

    // Offline: mantém o aluno logado com os dados salvos no aparelho.
    if (isOffline) {
      return getCachedUser();
    }

    await clearAuthSession();
    return null;
  }
}

export async function registerUser(payload: SignUpPayload): Promise<User> {
  const data = await requestApi<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  await saveAuthSession(data.token, data.user);

  return data.user;
}

export async function loginUser(payload: SignInPayload): Promise<User> {
  const data = await requestApi<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  await saveAuthSession(data.token, data.user);

  return data.user;
}

export async function logoutUser() {
  await clearAuthSession();
}
