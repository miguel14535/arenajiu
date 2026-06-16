export interface Admin {
  id: string;
  username: string;
  password: string;
  created_at: string;
}

const ADMIN_KEY = 'arena_admins';
const SESSION_KEY = 'arena_session';

export function getAdmins(): Admin[] {
  const data = localStorage.getItem(ADMIN_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveAdmins(admins: Admin[]) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admins));
}

export function seedAdmin() {
  const admins = getAdmins();

  if (admins.length === 0) {
    saveAdmins([
      {
        id: crypto.randomUUID(),
        username: 'admin',
        password: '123456',
        created_at: new Date().toISOString(),
      },
    ]);
  }
}

export function login(
  username: string,
  password: string
): Admin | null {
  const admins = getAdmins();

  const admin = admins.find(
    a =>
      a.username === username &&
      a.password === password
  );

  if (admin) {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(admin)
    );
  }

  return admin || null;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn() {
  return localStorage.getItem(SESSION_KEY) !== null;
}

export function getCurrentAdmin(): Admin | null {
  const data = localStorage.getItem(SESSION_KEY);

  if (!data) return null;

  return JSON.parse(data);
}

export function createAdmin(
  username: string,
  password: string
) {
  const admins = getAdmins();

  admins.push({
    id: crypto.randomUUID(),
    username,
    password,
    created_at: new Date().toISOString(),
  });

  saveAdmins(admins);
}