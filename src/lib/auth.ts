import { syncLocalKeyToRemote } from './remoteSync';

export interface Admin {
  id: string;
  username: string;
  password: string;
  role: 'admin';
}

const ADMIN_KEY = 'arena_admins';
const SESSION_KEY = 'arena_session';

function uid(): string {
  return crypto.randomUUID();
}

function saveAdmins(admins: Admin[]): void {
  localStorage.setItem(
    ADMIN_KEY,
    JSON.stringify(admins)
  );

  syncLocalKeyToRemote(ADMIN_KEY);
}

export function seedAdmin(): void {
  const admins: Admin[] = JSON.parse(
    localStorage.getItem(ADMIN_KEY) || '[]'
  );

  if (admins.length === 0) {
    admins.push({
      id: uid(),
      username: 'admin',
      password: '123456',
      role: 'admin',
    });

    saveAdmins(admins);
  }
}

export function login(
  username: string,
  password: string
): boolean {
  const admins: Admin[] = JSON.parse(
    localStorage.getItem(ADMIN_KEY) || '[]'
  );

  const user = admins.find(
    admin =>
      admin.username === username &&
      admin.password === password
  );

  if (!user) {
    return false;
  }

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(user)
  );

  return true;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): Admin | null {
  return JSON.parse(
    localStorage.getItem(SESSION_KEY) || 'null'
  );
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

export function getAdmins(): Admin[] {
  return JSON.parse(
    localStorage.getItem(ADMIN_KEY) || '[]'
  );
}

export function createAdmin(
  username: string,
  password: string
): void {
  const admins = getAdmins();

  const exists = admins.some(
    admin => admin.username === username
  );

  if (exists) {
    throw new Error(
      'Já existe um administrador com esse usuário.'
    );
  }

  admins.push({
    id: uid(),
    username,
    password,
    role: 'admin',
  });

  saveAdmins(admins);
}

export function deleteAdmin(
  id: string
): void {
  const admins = getAdmins().filter(
    admin => admin.id !== id
  );

  saveAdmins(admins);
}
