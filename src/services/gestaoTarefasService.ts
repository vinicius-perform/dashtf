import { supabase } from '../lib/supabase';

export interface WeeklyCheckinState {
  criativo_done: boolean;
  calculadora_done: boolean;
}

export interface Encaminhamento {
  id: string;
  client_id: string;
  description: string;
  due_date: string;
  status: 'A fazer' | 'Em andamento' | 'Aguardando' | 'Concluído';
  created_at?: string;
}

const CHECKINS_CACHE_KEY = 'dashtf_weekly_checkins_cache';
const ENCAMINHAMENTOS_CACHE_KEY = 'dashtf_encaminhamentos_cache';

// Utilitários de cache local
function getCheckinsCache(): Record<string, WeeklyCheckinState> {
  try {
    const raw = localStorage.getItem(CHECKINS_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCheckinsCache(cache: Record<string, WeeklyCheckinState>): void {
  try {
    localStorage.setItem(CHECKINS_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

function getEncaminhamentosCache(): Encaminhamento[] {
  try {
    const raw = localStorage.getItem(ENCAMINHAMENTOS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEncaminhamentosCache(list: Encaminhamento[]): void {
  try {
    localStorage.setItem(ENCAMINHAMENTOS_CACHE_KEY, JSON.stringify(list));
  } catch {}
}

/**
 * Busca o mapa de check-ins da semana especificada.
 * Chave do mapa: `${clientId}_${date}`
 */
export async function fetchWeeklyCheckinsMap(
  startDate: string,
  endDate: string
): Promise<Record<string, WeeklyCheckinState>> {
  const map: Record<string, WeeklyCheckinState> = { ...getCheckinsCache() };

  try {
    const { data, error } = await supabase
      .from('weekly_checkins')
      .select('client_id, date, criativo_done, calculadora_done')
      .gte('date', startDate)
      .lte('date', endDate);

    if (!error && Array.isArray(data)) {
      data.forEach((row) => {
        const key = `${row.client_id}_${row.date}`;
        map[key] = {
          criativo_done: Boolean(row.criativo_done),
          calculadora_done: Boolean(row.calculadora_done),
        };
      });
      saveCheckinsCache(map);
    } else if (error) {
      console.warn('Supabase weekly_checkins aviso (utilizando cache local):', error.message);
    }
  } catch (err: any) {
    console.warn('Exceção ao buscar weekly_checkins no Supabase:', err?.message || err);
  }

  return map;
}

/**
 * Realiza upsert instantâneo de um check-in no Supabase e no cache local
 */
export async function upsertCheckin(
  clientId: string,
  date: string,
  criativoDone: boolean,
  calculadoraDone: boolean
): Promise<boolean> {
  const key = `${clientId}_${date}`;
  const cache = getCheckinsCache();
  cache[key] = { criativo_done: criativoDone, calculadora_done: calculadoraDone };
  saveCheckinsCache(cache);

  try {
    const { error } = await supabase.from('weekly_checkins').upsert(
      {
        client_id: clientId,
        date: date,
        criativo_done: criativoDone,
        calculadora_done: calculadoraDone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'client_id,date' }
    );

    if (error) {
      console.warn(`Aviso ao salvar check-in para cliente ${clientId}:`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`Erro ao salvar check-in no Supabase:`, err?.message || err);
    return false;
  }
}

/**
 * Zera os check-ins da semana corrente no Supabase e no cache local
 */
export async function clearWeeklyCheckins(startDate: string, endDate: string): Promise<boolean> {
  // Limpa do cache local
  const cache = getCheckinsCache();
  Object.keys(cache).forEach((key) => {
    const parts = key.split('_');
    const dateStr = parts[1];
    if (dateStr >= startDate && dateStr <= endDate) {
      delete cache[key];
    }
  });
  saveCheckinsCache(cache);

  try {
    const { error } = await supabase
      .from('weekly_checkins')
      .delete()
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.warn('Aviso ao zerar weekly_checkins no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Erro ao zerar weekly_checkins no Supabase:', err?.message || err);
    return false;
  }
}

/**
 * Busca todos os encaminhamentos (tarefas avulsas) ordenados por prazo
 */
export async function fetchEncaminhamentos(): Promise<Encaminhamento[]> {
  try {
    const { data, error } = await supabase
      .from('encaminhamentos')
      .select('*')
      .order('due_date', { ascending: true });

    if (!error && Array.isArray(data)) {
      saveEncaminhamentosCache(data);
      return data;
    }
  } catch (err: any) {
    console.warn('Exceção ao buscar encaminhamentos no Supabase:', err?.message || err);
  }

  // Fallback cache local com alguns itens iniciais se vazio
  const cached = getEncaminhamentosCache();
  if (cached.length === 0) {
    const defaultInitial: Encaminhamento[] = [
      {
        id: 'task-1',
        client_id: '858751867277029',
        description: 'Subir novos criativos de depoimento para CA04 Paraíso da Baleia',
        due_date: '2026-11-16',
        status: 'A fazer',
        created_at: new Date().toISOString()
      },
      {
        id: 'task-2',
        client_id: '1115861513053539',
        description: 'Revisar atendimento no WhatsApp e taxa de resposta da CA02 FA',
        due_date: '2026-11-18',
        status: 'Em andamento',
        created_at: new Date().toISOString()
      },
      {
        id: 'task-3',
        client_id: '977087437378962',
        description: 'Recarregar saldo pré-pago da conta Dot Kayo (alerta < 5 dias)',
        due_date: '2026-11-17',
        status: 'Aguardando',
        created_at: new Date().toISOString()
      }
    ];
    saveEncaminhamentosCache(defaultInitial);
    return defaultInitial;
  }

  return cached;
}

/**
 * Cria um novo encaminhamento
 */
export async function createEncaminhamento(
  task: Omit<Encaminhamento, 'id' | 'created_at'>
): Promise<Encaminhamento> {
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `task_${Date.now()}`;

  const fullTask: Encaminhamento = {
    ...task,
    id: newId,
    created_at: new Date().toISOString()
  };

  // Salva no cache local imediatamente
  const list = getEncaminhamentosCache();
  list.unshift(fullTask);
  saveEncaminhamentosCache(list);

  try {
    const { error } = await supabase.from('encaminhamentos').insert({
      id: fullTask.id,
      client_id: fullTask.client_id,
      description: fullTask.description,
      due_date: fullTask.due_date,
      status: fullTask.status,
      created_at: fullTask.created_at
    });

    if (error) {
      console.warn('Aviso ao criar encaminhamento no Supabase:', error.message);
    }
  } catch (err: any) {
    console.warn('Erro ao inserir encaminhamento no Supabase:', err?.message || err);
  }

  return fullTask;
}

/**
 * Atualiza o status de um encaminhamento
 */
export async function updateEncaminhamentoStatus(
  id: string,
  newStatus: Encaminhamento['status']
): Promise<boolean> {
  const list = getEncaminhamentosCache();
  const updated = list.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
  saveEncaminhamentosCache(updated);

  try {
    const { error } = await supabase
      .from('encaminhamentos')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.warn('Aviso ao atualizar status no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Erro ao atualizar encaminhamento no Supabase:', err?.message || err);
    return false;
  }
}

/**
 * Exclui um encaminhamento
 */
export async function deleteEncaminhamento(id: string): Promise<boolean> {
  const list = getEncaminhamentosCache().filter((item) => item.id !== id);
  saveEncaminhamentosCache(list);

  try {
    const { error } = await supabase.from('encaminhamentos').delete().eq('id', id);
    if (error) {
      console.warn('Aviso ao excluir encaminhamento no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Erro ao excluir encaminhamento no Supabase:', err?.message || err);
    return false;
  }
}

