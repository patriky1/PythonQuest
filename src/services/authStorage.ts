import AsyncStorage from '@react-native-async-storage/async-storage';
import { SignInPayload, SignUpPayload, StoredUser, User } from '@/types/auth';

const USERS_KEY = '@pythonquest:users';
const CURRENT_USER_KEY = '@pythonquest:current-user';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function removePassword(user: StoredUser): User {
  const { password, ...safeUser } = user;
  return safeUser;
}

async function getStoredUsers(): Promise<StoredUser[]> {
  const rawUsers = await AsyncStorage.getItem(USERS_KEY);

  if (!rawUsers) {
    return [];
  }

  try {
    return JSON.parse(rawUsers) as StoredUser[];
  } catch {
    await AsyncStorage.removeItem(USERS_KEY);
    return [];
  }
}

async function saveStoredUsers(users: StoredUser[]) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function getCurrentUser(): Promise<User | null> {
  const rawUser = await AsyncStorage.getItem(CURRENT_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
}

export async function createLocalUser(payload: SignUpPayload): Promise<User> {
  const users = await getStoredUsers();

  const email = normalizeEmail(payload.email);

  const alreadyExists = users.some((user) => user.email === email);

  if (alreadyExists) {
    throw new Error('Já existe uma conta cadastrada com este e-mail.');
  }

  const newUser: StoredUser = {
    id: String(Date.now()),
    name: payload.name.trim(),
    email,
    password: payload.password,
    createdAt: new Date().toISOString()
  };

  const updatedUsers = [...users, newUser];

  await saveStoredUsers(updatedUsers);

  const safeUser = removePassword(newUser);

  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));

  return safeUser;
}

export async function loginLocalUser(payload: SignInPayload): Promise<User> {
  const users = await getStoredUsers();

  const email = normalizeEmail(payload.email);

  const foundUser = users.find((user) => user.email === email);

  if (!foundUser) {
    throw new Error('Usuário não encontrado.');
  }

  if (foundUser.password !== payload.password) {
    throw new Error('Senha incorreta.');
  }

  const safeUser = removePassword(foundUser);

  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));

  return safeUser;
}

export async function logoutLocalUser() {
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
}