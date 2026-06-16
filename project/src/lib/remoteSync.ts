import { isSupabaseConfigured, supabase } from './supabase';

type TableConfig = {
  key: string;
  table: string;
};

const TABLES: TableConfig[] = [
  { key: 'arena_categories', table: 'categories' },
  { key: 'arena_products', table: 'products' },
  { key: 'arena_members', table: 'members' },
  { key: 'arena_plans', table: 'plans' },
  { key: 'arena_sales', table: 'sales' },
  { key: 'arena_sale_items', table: 'sale_items' },
  { key: 'arena_suppliers', table: 'suppliers' },
];

const timers: Record<string, number> = {};

function loadLocalRows(key: string): Record<string, unknown>[] {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function cleanRow(row: Record<string, unknown>): Record<string, unknown> {
  const {
    member,
    sale_items,
    product,
    ...clean
  } = row;

  void member;
  void sale_items;
  void product;

  return clean;
}

async function fetchRemoteRows(config: TableConfig): Promise<Record<string, unknown>[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(config.table)
    .select('*');

  if (error) {
    throw error;
  }

  return (data ?? []) as Record<string, unknown>[];
}

async function upsertRemoteRows(config: TableConfig): Promise<void> {
  if (!supabase) return;

  const rows = loadLocalRows(config.key).map(cleanRow);

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase
    .from(config.table)
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    throw error;
  }
}

async function replaceRemoteRows(config: TableConfig): Promise<void> {
  if (!supabase) return;

  const rows = loadLocalRows(config.key).map(cleanRow);
  const remoteRows = await fetchRemoteRows(config);
  const localIds = new Set(rows.map(row => String(row.id)));
  const idsToDelete = remoteRows
    .map(row => String(row.id))
    .filter(id => !localIds.has(id));

  for (let index = 0; index < idsToDelete.length; index += 100) {
    const chunk = idsToDelete.slice(index, index + 100);
    const { error } = await supabase
      .from(config.table)
      .delete()
      .in('id', chunk);

    if (error) {
      throw error;
    }
  }

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase
    .from(config.table)
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    throw error;
  }
}

function findTableConfig(key: string): TableConfig | undefined {
  return TABLES.find(config => config.key === key);
}

function hasLocalData(): boolean {
  return TABLES.some(config => loadLocalRows(config.key).length > 0);
}

export async function initializeRemoteSync(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  try {
    if (hasLocalData()) {
      for (const config of TABLES) {
        await upsertRemoteRows(config);
      }
    }

    for (const config of TABLES) {
      const rows = await fetchRemoteRows(config);
      localStorage.setItem(config.key, JSON.stringify(rows));
    }

    localStorage.setItem('arena_last_remote_sync', new Date().toISOString());
  } catch (error) {
    console.error('Falha ao sincronizar com Supabase:', error);
  }
}

export function syncLocalKeyToRemote(key: string): void {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  const config = findTableConfig(key);

  if (!config) {
    return;
  }

  window.clearTimeout(timers[key]);

  timers[key] = window.setTimeout(() => {
    replaceRemoteRows(config).catch(error => {
      console.error(`Falha ao enviar ${config.table} para Supabase:`, error);
    });
  }, 300);
}
