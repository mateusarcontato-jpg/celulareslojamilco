import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signOut as firebaseSignOut,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { TechnicianUser } from '../types/auth';

const LOCAL_TECH_STORAGE_KEY = 'amilco_current_technician_v1';

// Credencial Oficial Definida pelo Usuário
export const OFFICIAL_USER = 'Amilcoti';
export const OFFICIAL_PASS = 'amilco@2026ti';

const OFFICIAL_PROFILE: TechnicianUser = {
  id: 'tech-amilcoti',
  name: 'Amilco T.I.',
  email: 'amilcoti@amilco.com.br',
  role: 'Técnico de T.I.',
  store: 'TODAS',
  createdAt: new Date().toISOString(),
};

export function getStoredCurrentTechnician(): TechnicianUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_TECH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredCurrentTechnician(tech: TechnicianUser | null): void {
  try {
    if (tech) {
      localStorage.setItem(LOCAL_TECH_STORAGE_KEY, JSON.stringify(tech));
    } else {
      localStorage.removeItem(LOCAL_TECH_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Erro ao salvar técnico logado:', err);
  }
}

/**
 * Autenticação do Técnico por Usuário/E-mail e Senha
 * Credencial solicitada: Usuário "Amilcoti" e Senha "amilco@2026ti"
 */
export async function loginWithCredentialsService(
  usernameOrEmail: string, 
  password: string
): Promise<TechnicianUser> {
  const cleanUser = usernameOrEmail.trim();

  // 1. Verificação da Credencial Oficial Solicitada
  if (
    cleanUser.toLowerCase() === OFFICIAL_USER.toLowerCase() ||
    cleanUser.toLowerCase() === 'amilcoti@amilco.com.br'
  ) {
    if (password === OFFICIAL_PASS) {
      saveStoredCurrentTechnician(OFFICIAL_PROFILE);
      // Tenta sincronizar perfil no Firestore
      try {
        await setDoc(doc(db, 'users', OFFICIAL_PROFILE.id), OFFICIAL_PROFILE);
      } catch {
        // ignora se offline
      }
      return OFFICIAL_PROFILE;
    } else {
      throw new Error('Senha incorreta para o usuário Amilcoti.');
    }
  }

  // 2. Se for um e-mail diferente, tenta autenticar pelo Firebase Auth
  if (cleanUser.includes('@')) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanUser.toLowerCase(), password);
      const fbUser = userCredential.user;

      let techProfile: TechnicianUser | null = null;
      try {
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          techProfile = userDoc.data() as TechnicianUser;
        }
      } catch {
        // ignora
      }

      if (!techProfile) {
        techProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || cleanUser.split('@')[0],
          email: cleanUser.toLowerCase(),
          role: 'Técnico de T.I.',
          store: 'LOJA ACARAÚ',
          avatarUrl: fbUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
        };
      }

      saveStoredCurrentTechnician(techProfile);
      return techProfile;
    } catch {
      throw new Error('Usuário ou senha inválidos.');
    }
  }

  throw new Error('Usuário não reconhecido. Use o usuário "Amilcoti" e sua senha definida.');
}

/**
 * Login com Google (opcional)
 */
export async function loginWithGoogleService(): Promise<TechnicianUser> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;

  let techProfile: TechnicianUser = {
    id: fbUser.uid,
    name: fbUser.displayName || 'Técnico Amilco',
    email: fbUser.email || '',
    role: 'Técnico de T.I.',
    store: 'LOJA ACARAÚ',
    avatarUrl: fbUser.photoURL || undefined,
    createdAt: new Date().toISOString(),
  };

  try {
    const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
    if (userDoc.exists()) {
      techProfile = userDoc.data() as TechnicianUser;
    } else {
      await setDoc(doc(db, 'users', fbUser.uid), techProfile);
    }
  } catch {
    // ignora
  }

  saveStoredCurrentTechnician(techProfile);
  return techProfile;
}

/**
 * Logout do técnico
 */
export async function logoutTechnicianService(): Promise<void> {
  saveStoredCurrentTechnician(null);
  try {
    await firebaseSignOut(auth);
  } catch {
    // ignore
  }
}
