import { supabase } from '../lib/supabase';
import { ADMIN_META_TOKEN } from './metaDataEngine';

export function maskToken(token: string): string {
  if (!token || token.trim().length < 12) return token;
  const clean = token.trim();
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
}

export async function fetchUserMetaToken(userId: string, userEmail?: string): Promise<string | null> {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('user_integrations')
      .select('meta_access_token')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data?.meta_access_token) {
      console.log('☁️ [SUPABASE CLOUD SYNC] Meta Token loaded successfully for user:', userId);
      return data.meta_access_token;
    }
  } catch (err) {
    console.warn('⚠️ [SUPABASE CLOUD SYNC] Could not query user_integrations:', err);
  }

  // Fallback for administrative account (viniciusmarinhods@gmail.com)
  if (userEmail === 'viniciusmarinhods@gmail.com') {
    console.log('🔑 [SUPABASE CLOUD SYNC] Admin email detected. Applying administrative Meta token.');
    // Attempt automatic background seed into Supabase user_integrations
    saveUserMetaToken(userId, ADMIN_META_TOKEN).catch(() => {});
    return ADMIN_META_TOKEN;
  }

  return null;
}

export async function saveUserMetaToken(userId: string, token: string): Promise<boolean> {
  if (!userId || !token) return false;

  try {
    const { error } = await supabase
      .from('user_integrations')
      .upsert(
        {
          user_id: userId,
          meta_access_token: token.trim(),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('❌ [SUPABASE CLOUD SYNC] Error saving meta token to user_integrations:', error);
      return false;
    }

    console.log('✅ [SUPABASE CLOUD SYNC] Meta Token successfully persisted to Supabase user_integrations!');
    return true;
  } catch (err) {
    console.error('❌ [SUPABASE CLOUD SYNC] Upsert exception:', err);
    return false;
  }
}
