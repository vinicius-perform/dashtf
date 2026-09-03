import { supabase } from '../lib/supabase';
import { ADMIN_META_TOKEN } from './metaDataEngine';

const withTimeout = async <T>(promiseLike: PromiseLike<T>, timeoutMs = 5000): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout de ${timeoutMs}ms excedido na operação do Supabase.`)), timeoutMs);
  });
  try {
    return await Promise.race([Promise.resolve(promiseLike), timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
};

export function maskToken(token: string): string {
  if (!token || token.trim().length < 12) return token;
  const clean = token.trim();
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}

export async function fetchUserMetaToken(userId: string, userEmail?: string): Promise<string | null> {
  if (!userId) return null;

  try {
    const queryPromise = supabase
      .from('user_integrations')
      .select('meta_access_token')
      .eq('user_id', userId)
      .maybeSingle();

    const { data, error } = await withTimeout(queryPromise, 5000);

    if (error) {
      console.warn('⚠️ [SUPABASE CLOUD SYNC] Erro ao consultar user_integrations:', error.message);
    } else if (data?.meta_access_token) {
      console.log('☁️ [SUPABASE CLOUD SYNC] Meta Token carregado com sucesso para o usuário:', userId);
      return data.meta_access_token;
    }
  } catch (err: any) {
    console.error('❌ [SUPABASE CLOUD SYNC] Exceção/Timeout ao buscar Meta Token no Supabase:', err?.message || err);
  }

  // Fallback for administrative accounts
  if (userEmail === 'viniciusmarinhods@gmail.com' || userEmail === 'antonio.neto@dottech.ai') {
    console.log('🔑 [SUPABASE CLOUD SYNC] E-mail admin detectado. Aplicando token Meta administrativo.');
    // Background seed into Supabase user_integrations
    saveUserMetaToken(userId, ADMIN_META_TOKEN).catch(() => {});
    return ADMIN_META_TOKEN;
  }

  return null;
}

export async function saveUserMetaToken(userId: string, token: string): Promise<boolean> {
  if (!userId || !token) return false;

  try {
    const upsertPromise = supabase
      .from('user_integrations')
      .upsert(
        {
          user_id: userId,
          meta_access_token: token.trim(),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

    const { error } = await withTimeout(upsertPromise, 5000);

    if (error) {
      console.error('❌ [SUPABASE CLOUD SYNC] Erro ao salvar meta token em user_integrations:', error.message);
      return false;
    }

    console.log('✅ [SUPABASE CLOUD SYNC] Meta Token persistido no Supabase user_integrations com sucesso!');
    return true;
  } catch (err: any) {
    console.error('❌ [SUPABASE CLOUD SYNC] Exceção/Timeout no Upsert de token:', err?.message || err);
    return false;
  }
}

