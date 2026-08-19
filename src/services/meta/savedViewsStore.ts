import { supabase } from '../../lib/supabase';

export interface FilterTag {
  id: string;
  type: 'NAME' | 'ID' | 'STATUS' | 'SPEND';
  label: string;
  value: string;
}

export interface SavedViewConfig {
  filters: FilterTag[];
  sorting?: {
    column: string;
    direction: 'ASC' | 'DESC';
  };
  visibleColumns?: string[];
}

export interface SavedView {
  id: string;
  name: string;
  description: string;
  access: 'PRIVATE' | 'PUBLIC';
  isDefault: boolean;
  config: SavedViewConfig;
  createdAt: string;
}

const STORAGE_VIEWS_KEY = 'fazendo_acontecer_saved_views_db';

const DEFAULT_PRESET_VIEWS: SavedView[] = [
  {
    id: 'view_all',
    name: 'Todos os anúncios',
    description: 'Visualização padrão com todas as campanhas, conjuntos e anúncios.',
    access: 'PUBLIC',
    isDefault: true,
    createdAt: new Date().toISOString(),
    config: {
      filters: [],
      sorting: { column: 'spend', direction: 'DESC' }
    }
  },
  {
    id: 'view_fa',
    name: 'FA',
    description: 'Filtra todas as campanhas contendo a sigla FA.',
    access: 'PRIVATE',
    isDefault: false,
    createdAt: new Date().toISOString(),
    config: {
      filters: [
        { id: 'f_fa', type: 'NAME', label: 'Nome contém', value: 'FA' }
      ],
      sorting: { column: 'spend', direction: 'DESC' }
    }
  },
  {
    id: 'view_breno',
    name: 'BRENO',
    description: 'Campanhas atribuídas à operação Breno.',
    access: 'PRIVATE',
    isDefault: false,
    createdAt: new Date().toISOString(),
    config: {
      filters: [
        { id: 'f_breno', type: 'NAME', label: 'Nome contém', value: 'BRENO' }
      ],
      sorting: { column: 'spend', direction: 'DESC' }
    }
  },
  {
    id: 'view_active',
    name: 'Anúncios ativos',
    description: 'Filtra apenas campanhas e conjuntos com veiculação ativa.',
    access: 'PUBLIC',
    isDefault: false,
    createdAt: new Date().toISOString(),
    config: {
      filters: [
        { id: 'f_active', type: 'STATUS', label: 'Veiculação', value: 'Ativo' }
      ],
      sorting: { column: 'deliveryInfo', direction: 'DESC' }
    }
  },
  {
    id: 'view_had_delivery',
    name: 'Tiveram veiculação',
    description: 'Campanhas que geraram impressões no período.',
    access: 'PUBLIC',
    isDefault: false,
    createdAt: new Date().toISOString(),
    config: {
      filters: [
        { id: 'f_delivery', type: 'SPEND', label: 'Gasto maior que', value: '0' }
      ],
      sorting: { column: 'spend', direction: 'DESC' }
    }
  }
];

export function getSavedViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORAGE_VIEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load saved views locally:', e);
  }
  // Initialize with defaults
  saveSavedViews(DEFAULT_PRESET_VIEWS);
  return DEFAULT_PRESET_VIEWS;
}

export function saveSavedViews(views: SavedView[]): void {
  try {
    localStorage.setItem(STORAGE_VIEWS_KEY, JSON.stringify(views));
  } catch (e) {
    console.warn('Failed to save views locally:', e);
  }
}

// Asynchronously sync views with Supabase PostgreSQL user_saved_views table
export async function syncSavedViewsFromSupabase(): Promise<SavedView[]> {
  try {
    const { data, error } = await supabase
      .from('user_saved_views')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase user_saved_views sync error:', error.message);
      return getSavedViews();
    }

    if (data && data.length > 0) {
      const remoteViews: SavedView[] = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        access: 'PUBLIC',
        isDefault: Boolean(item.is_default),
        config: item.config || { filters: [] },
        createdAt: item.created_at
      }));

      // Combine with preset defaults
      const mergedMap = new Map<string, SavedView>();
      DEFAULT_PRESET_VIEWS.forEach(v => mergedMap.set(v.id, v));
      remoteViews.forEach(v => mergedMap.set(v.id, v));

      const mergedList = Array.from(mergedMap.values());
      saveSavedViews(mergedList);
      return mergedList;
    }
  } catch (e) {
    console.warn('Failed to fetch user_saved_views from Supabase:', e);
  }
  return getSavedViews();
}

export function createSavedView(newView: Omit<SavedView, 'id' | 'createdAt'>): SavedView {
  const views = getSavedViews();
  const created: SavedView = {
    ...newView,
    id: `view_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  const updated = [...views, created];
  saveSavedViews(updated);

  // Async push to Supabase PostgreSQL user_saved_views table
  supabase
    .from('user_saved_views')
    .insert({
      name: created.name,
      description: created.description,
      config: created.config,
      is_default: created.isDefault
    })
    .then(({ data, error }) => {
      if (error) console.warn('Supabase create view insert error:', error.message);
      else console.log('✅ Saved View persisted to Supabase PostgreSQL:', created.name);
    });

  return created;
}

export function updateSavedView(id: string, updates: Partial<SavedView>): SavedView[] {
  const views = getSavedViews();
  const updated = views.map(v => v.id === id ? { ...v, ...updates } : v);
  saveSavedViews(updated);

  // Async update in Supabase PostgreSQL
  if (!id.startsWith('view_all') && !id.startsWith('view_fa') && !id.startsWith('view_breno')) {
    supabase
      .from('user_saved_views')
      .update({
        name: updates.name,
        description: updates.description,
        config: updates.config,
        is_default: updates.isDefault
      })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('Supabase update view error:', error.message);
      });
  }

  return updated;
}

export function deleteSavedView(id: string): SavedView[] {
  const views = getSavedViews();
  const updated = views.filter(v => v.id !== id);
  saveSavedViews(updated);

  // Async delete from Supabase PostgreSQL
  if (!id.startsWith('view_all') && !id.startsWith('view_fa')) {
    supabase
      .from('user_saved_views')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('Supabase delete view error:', error.message);
      });
  }

  return updated;
}
