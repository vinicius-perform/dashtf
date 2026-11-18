import { supabase } from '../lib/supabase';

export interface AgencyPortfolioItem {
  id?: string;
  account_id: string;
  account_name: string;
  is_active: boolean;
  added_at?: string;
}

const LOCAL_STORAGE_KEY = 'dashtf_agency_portfolio';

// Clientes padrão da carteira da Fazendo Acontecer (Fase 1 / Fase 3)
export const DEFAULT_PORTFOLIO_CLIENTS: AgencyPortfolioItem[] = [
  { account_id: '1115861513053539', account_name: 'CA02 - FA', is_active: true },
  { account_id: '858751867277029', account_name: 'CA04 - Paraíso da Baleia', is_active: true },
  { account_id: '977087437378962', account_name: 'CA01 - Dot Kayo', is_active: true },
  { account_id: '448128631941716', account_name: 'Silvia Bastos Almeida (#advogadoce)', is_active: true }
];

/**
 * Lê a carteira do cache local do navegador
 */
function getLocalPortfolio(): AgencyPortfolioItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Erro ao ler carteira do cache local:', e);
  }
  return DEFAULT_PORTFOLIO_CLIENTS;
}

/**
 * Salva a carteira no cache local do navegador
 */
function saveLocalPortfolio(items: AgencyPortfolioItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Erro ao gravar carteira no cache local:', e);
  }
}

/**
 * Busca todas as contas ativas da Carteira de Clientes da Agência
 * Tenta no Supabase primeiro; se a tabela não existir, usa o cache local.
 */
export async function fetchAgencyPortfolio(): Promise<AgencyPortfolioItem[]> {
  try {
    const { data, error } = await supabase
      .from('agency_portfolio')
      .select('id, account_id, account_name, is_active, added_at')
      .order('account_name', { ascending: true });

    if (error) {
      // Se tabela não existe (PGRST205 / 42P01), usa cache local com fallback
      console.warn('Supabase agency_portfolio indisponível, usando cache local:', error.message);
      return getLocalPortfolio().filter(item => item.is_active);
    }

    if (data && data.length > 0) {
      const activeItems = data.filter((item: AgencyPortfolioItem) => item.is_active);
      saveLocalPortfolio(data);
      return activeItems.length > 0 ? activeItems : data;
    }
  } catch (e) {
    console.warn('Exceção ao buscar agency_portfolio no Supabase:', e);
  }

  // Fallback cache local
  return getLocalPortfolio().filter(item => item.is_active);
}

/**
 * Sincroniza e salva a nova carteira de clientes selecionados
 * Desativa/remove as desmarcadas e insere/atualiza as marcadas.
 */
export async function syncAgencyPortfolio(
  selectedAccounts: Array<{ account_id: string; account_name: string }>
): Promise<{ success: boolean; count: number; error?: string }> {
  const selectedIds = new Set(selectedAccounts.map(a => a.account_id));
  const now = new Date().toISOString();

  // 1. Atualiza imediatamente o cache local para resposta ultra-rápida (otimista)
  const localItems: AgencyPortfolioItem[] = selectedAccounts.map(a => ({
    account_id: a.account_id,
    account_name: a.account_name,
    is_active: true,
    added_at: now
  }));
  saveLocalPortfolio(localItems);

  // 2. Tenta persistir e sincronizar no Supabase
  try {
    // 2.1 Busca contas existentes no banco para reconciliação
    const { data: existingRows, error: fetchErr } = await supabase
      .from('agency_portfolio')
      .select('account_id, is_active');

    if (fetchErr) {
      // Tabela não criada ainda no Supabase
      console.warn('Tabela agency_portfolio ainda não criada no Supabase. Gravado com sucesso no cache local.');
      return { success: true, count: selectedAccounts.length };
    }

    // 2.2 Desativa ou deleta contas desmarcadas
    if (existingRows && existingRows.length > 0) {
      const idsToDeactivate = existingRows
        .filter(r => !selectedIds.has(r.account_id) && r.is_active)
        .map(r => r.account_id);

      if (idsToDeactivate.length > 0) {
        await supabase
          .from('agency_portfolio')
          .update({ is_active: false })
          .in('account_id', idsToDeactivate);
      }
    }

    // 2.3 Faz upsert de todas as contas selecionadas com is_active = true
    if (selectedAccounts.length > 0) {
      const rowsToUpsert = selectedAccounts.map(acc => ({
        account_id: acc.account_id,
        account_name: acc.account_name,
        is_active: true,
        added_at: now
      }));

      const { error: upsertErr } = await supabase
        .from('agency_portfolio')
        .upsert(rowsToUpsert, { onConflict: 'account_id' });

      if (upsertErr) {
        console.warn('Erro ao fazer upsert em agency_portfolio:', upsertErr.message);
      }
    }

    return { success: true, count: selectedAccounts.length };
  } catch (err: any) {
    console.error('Erro na sincronização da carteira:', err);
    return { success: true, count: selectedAccounts.length, error: err?.message };
  }
}

