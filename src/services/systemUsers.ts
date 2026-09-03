export interface SystemUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'manager' | 'viewer';
}

export const SYSTEM_USERS: SystemUser[] = [
  {
    id: 'usr_antonio_neto_01',
    name: 'Antonio Neto',
    email: 'antonio.neto@dottech.ai',
    password: 'Senha10!DotTech',
    role: 'admin'
  }
];

const LOCAL_AUTH_KEY = 'dashtf_auth_user';

export function getLocalAuthUser(): any | null {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalAuthUser(user: SystemUser): void {
  try {
    const safeUser = {
      id: user.id,
      email: user.email,
      user_metadata: {
        name: user.name,
        role: user.role
      }
    };
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(safeUser));
  } catch (e) {
    console.error('Erro ao salvar usuário localmente:', e);
  }
}

export function clearLocalAuthUser(): void {
  try {
    localStorage.removeItem(LOCAL_AUTH_KEY);
  } catch (e) {
    console.error('Erro ao limpar usuário local:', e);
  }
}

export function validateSystemUser(emailInput: string, passwordInput: string): SystemUser | null {
  const cleanEmail = emailInput.trim().toLowerCase();
  const found = SYSTEM_USERS.find(
    u => u.email.toLowerCase() === cleanEmail && u.password === passwordInput
  );
  return found || null;
}
