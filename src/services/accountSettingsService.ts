import { supabase } from '../lib/supabase';

export interface AccountSetting {
  account_id: string;
  meta_cpl: number;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = 'dashtf_account_settings_cache';

// Carrega o cache local como fallback imediato
function getLocalCache(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Salva no cache local
function setLocalCache(accountId: string, metaCpl: number): void {
  try {
    const current = getLocalCache();
    current[accountId] = metaCpl;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Falha ao gravar cache local de account_settings:', err);
  }
}

/**
 * Busca todas as metas de CPL configuradas para as contas no Supabase.
 * Faz fallback resiliente para o cache local caso a tabela ainda não exista no Supabase.
 */
export async function fetchAccountSettingsMap(): Promise<Record<string, number>> {
  const settingsMap: Record<string, number> = { ...getLocalCache() };

  try {
    const { data, error } = await supabase
      .from('account_settings')
      .select('account_id, meta_cpl');

    if (!error && Array.isArray(data)) {
      data.forEach((row) => {
        if (row.account_id && row.meta_cpl !== null && row.meta_cpl !== undefined) {
          const val = parseFloat(row.meta_cpl);
          if (!isNaN(val)) {
            settingsMap[row.account_id] = val;
            setLocalCache(row.account_id, val);
          }
        }
      });
    } else if (error) {
      console.warn('Aviso ao consultar Supabase account_settings (utilizando cache local):', error.message);
    }
  } catch (err: any) {
    console.warn('Exceção ao consultar Supabase account_settings (utilizando cache local):', err?.message || err);
  }

  return settingsMap;
}

/**
 * Realiza upsert da Meta de CPL de uma conta de anúncio no Supabase.
 * Grava imediatamente no cache local para resposta ultra rápida na UI.
 */
export async function upsertAccountMetaCpl(accountId: string, metaCpl: number): Promise<boolean> {
  if (!accountId) return false;

  // 1. Atualização Otimista no Cache Local
  setLocalCache(accountId, metaCpl);

  // 2. Upsert no Supabase
  try {
    const { error } = await supabase
      .from('account_settings')
      .upsert(
        {
          account_id: accountId,
          meta_cpl: metaCpl,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'account_id' }
      );

    if (error) {
      console.warn(`Aviso ao persistir meta_cpl no Supabase para conta ${accountId}:`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`Erro de rede ao salvar meta_cpl no Supabase para conta ${accountId}:`, err?.message || err);
    return false;
  }
}

