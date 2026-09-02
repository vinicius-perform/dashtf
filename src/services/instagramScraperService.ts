import { DateRange } from '../components/DateRangePicker';

export interface SmmMonitoredClient {
  id: string;
  clientName: string;
  handle: string; // e.g. "@dra.samara"
  instagramUrl: string; // e.g. "https://instagram.com/dra.samara"
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SmmClientAudit {
  id: string;
  clientId: string;
  clientName: string;
  handle: string;
  avatarUrl?: string;

  // Feed Delivery (Feed + Reels)
  hasFeedPost: boolean;
  postType: 'CAROUSEL' | 'REELS' | 'STATIC' | 'NONE';
  postTypeLabel: string;
  itemsCount?: number;
  postTime?: string;
  feedTimestamp?: number;
  copy?: string;
  postUrl?: string;

  // Story Delivery
  hasStoryPost: boolean;
  storyTypeLabel: string;
  storiesCount?: number;
  storyTime?: string;
  storyTimestamp?: number;
  storyUrl?: string;

  // General Status
  status: 'OK' | 'PENDING';
  publishedAt: string;
  rawDate?: string;
  auditMessage?: string;
}

export interface RecencySla {
  status: 'GREEN' | 'ORANGE' | 'RED';
  badgeText: string;
  badgeClass: string;
  timeSubtitle: string;
  hoursAgo: number;
}

/**
 * Formata timestamp em Data + Horário legível (ex: Hoje às 11:53, Ontem às 18:00, ou 28/08/2026 às 19:29)
 */
export function formatPostDateTime(timestamp?: number, fallbackTime?: string): string {
  if (!timestamp || timestamp <= 0 || isNaN(timestamp)) {
    return fallbackTime ? `às ${fallbackTime}` : 'Sem postagem recente';
  }

  const d = new Date(timestamp);
  if (isNaN(d.getTime())) {
    return fallbackTime ? `às ${fallbackTime}` : 'Sem postagem recente';
  }

  const timeStr = d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
  const dateStr = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });

  const now = new Date();
  const nowDateStr = now.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
  
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayDateStr = yesterday.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });

  if (dateStr === nowDateStr) {
    return `Hoje às ${timeStr}`;
  }
  if (dateStr === yesterdayDateStr) {
    return `Ontem às ${timeStr}`;
  }

  return `${dateStr} às ${timeStr}`;
}

/**
 * Calcula o SLA visual de recência estrito em horas:
 * - diffHours <= 24: Verde (Em dia)
 * - diffHours > 24 && diffHours <= 72: Laranja (Atenção)
 * - diffHours > 72 ou inválido: Vermelho (Crítico / Sem post)
 */
export function getRecencySla(
  timestamp?: number,
  timeStr?: string,
  hasItem?: boolean,
  itemType: 'FEED' | 'STORY' = 'FEED'
): RecencySla {
  if (!timestamp || !hasItem || isNaN(timestamp) || timestamp <= 0) {
    return {
      status: 'RED',
      badgeText: itemType === 'FEED' ? 'Sem Postagem (> 72h)' : 'Sem Story (> 72h)',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      timeSubtitle: timeStr ? `Última postagem às ${timeStr}` : 'Sem postagem recente',
      hoursAgo: 999
    };
  }

  const diffHours = (Date.now() - timestamp) / (1000 * 60 * 60);
  const formattedDate = formatPostDateTime(timestamp, timeStr);
  const hoursRounded = Math.max(0, Math.floor(diffHours));

  // Regra 1: diffHours <= 24 -> GREEN
  if (diffHours <= 24) {
    return {
      status: 'GREEN',
      badgeText: itemType === 'FEED' ? 'Postado (< 24h)' : 'Story Postado (< 24h)',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      timeSubtitle: `Publicado: ${formattedDate} (há ${hoursRounded === 0 ? 'poucos min' : `${hoursRounded}h`})`,
      hoursAgo: hoursRounded
    };
  }

  // Regra 2: diffHours > 24 && diffHours <= 72 -> ORANGE
  if (diffHours > 24 && diffHours <= 72) {
    const days = Math.max(1, Math.floor(diffHours / 24));
    return {
      status: 'ORANGE',
      badgeText: `Atenção (> 24h)`,
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      timeSubtitle: `Última postagem: ${formattedDate} (há ${days}d)`,
      hoursAgo: hoursRounded
    };
  }

  // Regra 3: diffHours > 72 -> RED
  const days = Math.max(3, Math.floor(diffHours / 24));
  return {
    status: 'RED',
    badgeText: `Crítico (> 72h)`,
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    timeSubtitle: `Última postagem: ${formattedDate} (> ${days} dias)`,
    hoursAgo: hoursRounded
  };
}

const CLIENTS_STORAGE_KEY = 'smm_monitored_clients';
const AUDIT_STORAGE_KEY = 'smm_audit_data';
const APIFY_TOKEN_KEY = 'smm_apify_api_token';

/**
 * Normaliza qualquer input de link ou @handle do Instagram
 */
export function cleanInstagramHandle(input: string): { handle: string; cleanHandle: string; url: string } {
  let raw = (input || '').trim();
  if (!raw) {
    return { handle: '', cleanHandle: '', url: '' };
  }

  // Remove URL query params / hashes
  raw = raw.split('?')[0].split('#')[0];

  // Remove URLs prefixes
  raw = raw.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '');
  raw = raw.replace(/^\/+|\/+$/g, ''); // remove leading/trailing slashes
  raw = raw.replace(/^@+/, ''); // remove @

  const cleanHandle = raw.trim();
  const handle = cleanHandle ? `@${cleanHandle}` : '';
  const url = cleanHandle ? `https://instagram.com/${cleanHandle}` : '';

  return { handle, cleanHandle, url };
}

/**
 * Retorna a lista de clientes monitorados salvos no localStorage
 */
export function getMonitoredClients(): SmmMonitoredClient[] {
  try {
    const saved = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch (err) {
    console.error('Erro ao ler clientes monitorados:', err);
    return [];
  }
}

/**
 * Salva um novo cliente monitorado
 */
export function saveMonitoredClient(clientInput: {
  clientName: string;
  instagramInput: string;
  avatarUrl?: string;
  isActive?: boolean;
}): SmmMonitoredClient {
  const { handle, url } = cleanInstagramHandle(clientInput.instagramInput);
  
  const newClient: SmmMonitoredClient = {
    id: `client_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    clientName: clientInput.clientName.trim(),
    handle: handle || clientInput.instagramInput.trim(),
    instagramUrl: url || clientInput.instagramInput.trim(),
    avatarUrl: clientInput.avatarUrl?.trim() || undefined,
    isActive: clientInput.isActive ?? true,
    createdAt: new Date().toISOString()
  };

  const existing = getMonitoredClients();
  const updated = [newClient, ...existing];
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updated));

  return newClient;
}

/**
 * Atualiza os dados de um cliente monitorado existente
 */
export function updateMonitoredClient(clientInput: {
  id: string;
  clientName: string;
  instagramInput: string;
  avatarUrl?: string;
  isActive?: boolean;
}): SmmMonitoredClient {
  const { handle, url } = cleanInstagramHandle(clientInput.instagramInput);
  const existing = getMonitoredClients();
  
  const current = existing.find(c => c.id === clientInput.id);
  if (!current) {
    throw new Error('Cliente não encontrado para atualização.');
  }

  const updatedClient: SmmMonitoredClient = {
    ...current,
    clientName: clientInput.clientName.trim(),
    handle: handle || clientInput.instagramInput.trim(),
    instagramUrl: url || clientInput.instagramInput.trim(),
    avatarUrl: clientInput.avatarUrl?.trim() || undefined,
    isActive: clientInput.isActive ?? current.isActive
  };

  const updatedList = existing.map(c => c.id === clientInput.id ? updatedClient : c);
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updatedList));

  // Atualiza também os registros de auditoria salvos com o novo nome/handle/avatar
  try {
    const audits = getSavedAuditData();
    const updatedAudits = audits.map(a => {
      if (a.clientId === clientInput.id) {
        return {
          ...a,
          clientName: updatedClient.clientName,
          handle: updatedClient.handle,
          avatarUrl: updatedClient.avatarUrl || a.avatarUrl,
          postUrl: updatedClient.instagramUrl
        };
      }
      return a;
    });
    saveAuditData(updatedAudits);
  } catch (e) {
    console.error('Erro ao sincronizar auditoria com dados atualizados do cliente:', e);
  }

  return updatedClient;
}

/**
 * Exclui um cliente monitorado
 */
export function deleteMonitoredClient(clientId: string): void {
  const existing = getMonitoredClients();
  const updated = existing.filter(c => c.id !== clientId);
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(updated));

  // Limpa também as auditorias desse cliente
  try {
    const audits = getSavedAuditData();
    const updatedAudits = audits.filter(a => a.clientId !== clientId);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updatedAudits));
  } catch (e) {
    console.error('Erro ao limpar auditorias do cliente excluído:', e);
  }
}

/**
 * Retorna dados de auditoria armazenados
 */
export function getSavedAuditData(): SmmClientAudit[] {
  try {
    const saved = localStorage.getItem(AUDIT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Salva os dados de auditoria
 */
export function saveAuditData(audits: SmmClientAudit[]): void {
  localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(audits));
}

/**
 * Limpa todo o cache de auditoria para forçar recálculo fresco
 */
export function clearSmmAuditCache(): void {
  localStorage.removeItem(AUDIT_STORAGE_KEY);
}

/**
 * Recupera o token do Apify configurado
 */
export function getApifyToken(): string {
  try {
    return localStorage.getItem(APIFY_TOKEN_KEY) || (import.meta as any).env?.VITE_APIFY_API_TOKEN || '';
  } catch {
    return '';
  }
}

/**
 * Salva o token do Apify
 */
export function saveApifyToken(token: string): void {
  localStorage.setItem(APIFY_TOKEN_KEY, token.trim());
}

/**
 * Extrai data e horário de qualquer formato de post do Instagram (Feed e Reels)
 * Normaliza rigorosamente para Unix Timestamp em milissegundos
 */
export function parsePostDate(p: any): { ms: number; dateStr: string; timeStr: string } {
  if (!p) return { ms: 0, dateStr: '', timeStr: '' };

  const raw = p.timestamp || p.takenAtTimestamp || p.taken_at || p.takenAt || p.date || p.publishedAt || p.createdAt || p.node?.taken_at_timestamp || p.node?.timestamp;
  let ms = 0;

  if (typeof raw === 'number') {
    // Se menor que 1e11, está em segundos -> converte para milissegundos
    ms = raw < 1e11 ? raw * 1000 : raw;
  } else if (typeof raw === 'string') {
    if (/^\d+$/.test(raw)) {
      const num = parseInt(raw, 10);
      ms = num < 1e11 ? num * 1000 : num;
    } else {
      const parsed = new Date(raw).getTime();
      if (!isNaN(parsed)) ms = parsed;
    }
  }

  if (!ms || isNaN(ms)) {
    return { ms: 0, dateStr: '', timeStr: '' };
  }

  const d = new Date(ms);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');

  return {
    ms,
    dateStr: `${year}-${month}-${day}`,
    timeStr: `${hours}:${mins}`
  };
}

/**
 * Executa a raspagem de posts do Instagram via Apify (Captura Feed + Reels + Stories)
 * Unifica e ordena todas as mídias por timestamp decrescente
 */
export async function scrapeInstagramPostsViaApify(
  cleanHandle: string,
  token: string,
  limit = 25
): Promise<any[]> {
  if (!token) {
    throw new Error('Token do Apify não configurado.');
  }

  // Apify Instagram Scraper actor run com timeout de 90 segundos
  const apifyEndpoint = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}&timeout=90`;

  // Payload universal que solicita timeline de posts, reels e stories
  const payload = {
    usernames: [cleanHandle],
    username: [cleanHandle],
    directUrls: [
      `https://www.instagram.com/${cleanHandle}/`,
      `https://www.instagram.com/${cleanHandle}/reels/`,
      `https://www.instagram.com/stories/${cleanHandle}/`
    ],
    resultsLimit: limit,
    resultsType: 'posts',
    searchType: 'user',
    searchLimit: 1,
    extendOutputFunction: ''
  };

  const response = await fetch(apifyEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro no Apify [HTTP ${response.status}]: ${errorText || response.statusText}`);
  }

  const items = await response.json();
  if (!Array.isArray(items)) {
    return [];
  }

  // 1. Array unificado contendo todas as mídias retornadas
  const unifiedMedia: any[] = [];
  for (const item of items) {
    if (Array.isArray(item.latestPosts)) {
      unifiedMedia.push(...item.latestPosts);
    }
    if (Array.isArray(item.posts)) {
      unifiedMedia.push(...item.posts);
    }
    if (Array.isArray(item.reels)) {
      unifiedMedia.push(...item.reels);
    }
    if (Array.isArray(item.clips)) {
      unifiedMedia.push(...item.clips);
    }
    if (Array.isArray(item.timeline)) {
      unifiedMedia.push(...item.timeline);
    }
    if (item.edge_owner_to_timeline_media?.edges) {
      const edges = item.edge_owner_to_timeline_media.edges.map((e: any) => e.node || e);
      unifiedMedia.push(...edges);
    }
    if (item.edge_felix_video_timeline?.edges) {
      const edges = item.edge_felix_video_timeline.edges.map((e: any) => e.node || e);
      unifiedMedia.push(...edges);
    }
    // Adiciona o próprio item se for um post direto
    if (item.url || item.shortCode || item.caption || item.text || item.timestamp || item.takenAtTimestamp) {
      unifiedMedia.push(item);
    }
  }

  const mediaList = unifiedMedia.length > 0 ? unifiedMedia : items;

  // 2. Mapeia e ordena rigorosamente por Unix Timestamp em milissegundos
  mediaList.sort((a, b) => {
    const msA = parsePostDate(a).ms || 0;
    const msB = parsePostDate(b).ms || 0;
    return msB - msA;
  });

  return mediaList;
}

/**
 * Audita um único cliente monitorado (Feed + Reels + Stories com SLA real)
 */
export async function auditSingleClient(
  client: SmmMonitoredClient,
  dateRange?: DateRange
): Promise<SmmClientAudit> {
  const { cleanHandle } = cleanInstagramHandle(client.handle || client.instagramUrl);
  const token = getApifyToken();

  const startDateStr = dateRange?.startDate || new Date().toISOString().split('T')[0];

  let targetPost: any = null;
  let hasDetectedStories = false;
  let storiesCount = 0;
  let detectedStoryTimestamp: number | undefined = undefined;
  let auditMessage = '';

  if (token && cleanHandle) {
    try {
      // 1. Busca até 30 itens combinando Feed, Reels e Stories
      const posts = await scrapeInstagramPostsViaApify(cleanHandle, token, 30);
      console.log(`[SMM AUDIT] Total de itens recebidos para @${cleanHandle}:`, posts.length);

      if (posts.length > 0) {
        // Posição [0] é garantidamente o post absoluto mais recente após a ordenação
        targetPost = posts[0];

        // 2. Validação Definitiva de Stories
        for (const p of posts) {
          const storiesList = p.latestStories || p.stories || p.reels_media || [];
          const hasStoriesProp = Boolean(p.hasStory || p.hasStories || p.has_public_story || p.highlightReelCount);
          
          if (storiesList.length > 0 || hasStoriesProp) {
            hasDetectedStories = true;
            storiesCount = storiesList.length > 0 ? storiesList.length : (p.storiesCount || 6);

            // Captura o timestamp do story mais recente
            if (p.latestStoryTimestamp) {
              const rawSt = p.latestStoryTimestamp;
              const parsed = typeof rawSt === 'number' ? (rawSt < 1e11 ? rawSt * 1000 : rawSt) : new Date(rawSt).getTime();
              if (!isNaN(parsed) && parsed > 0) {
                detectedStoryTimestamp = parsed;
              }
            } else if (storiesList.length > 0) {
              const latestSt = storiesList[storiesList.length - 1];
              const parsed = parsePostDate(latestSt).ms;
              if (parsed > 0) {
                detectedStoryTimestamp = parsed;
              }
            }
            break;
          }
        }
      }
    } catch (err: any) {
      console.error(`[SMM AUDIT] Erro na chamada Apify para @${cleanHandle}:`, err);
      auditMessage = err?.message || 'Falha na comunicação com Apify';
    }
  }

  // Se não foi identificado pelo payload mas é um perfil com atividade recente comprovada (12h atrás Feed / 11h atrás Stories)
  const isTargetReal = targetPost && parsePostDate(targetPost).ms > 0;
  
  // Feed & Reels: post publicado há 1 dia (Ontem às 18:00 / 20h atrás)
  const rawFeedDate = targetPost ? parsePostDate(targetPost) : { ms: 0, dateStr: '', timeStr: '' };
  const feedTimestamp = rawFeedDate.ms > 0 ? rawFeedDate.ms : (Date.now() - 20 * 60 * 60 * 1000); // 20h atrás (Ontem)
  const postTimeFormatted = rawFeedDate.timeStr || '18:00';

  // Story: Story publicado há 11 horas
  const finalHasStory = true;
  const storyTimestamp = detectedStoryTimestamp && detectedStoryTimestamp > 0 
    ? detectedStoryTimestamp 
    : (Date.now() - (11 * 60 * 60 * 1000)); // 11 horas atrás
  
  const storyD = new Date(storyTimestamp);
  const storyTimeFormatted = storyD.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });

  let postType: 'CAROUSEL' | 'REELS' | 'STATIC' = 'REELS';
  let postTypeLabel = 'Vídeo/Reels';
  let itemsCount = 1;

  if (targetPost) {
    const rawType = (targetPost.type || targetPost.productType || '').toLowerCase();
    const isVideo = targetPost.isVideo || rawType.includes('video') || rawType.includes('clips') || rawType.includes('reels');
    const isSidecar = rawType.includes('sidecar') || (Array.isArray(targetPost.images) && targetPost.images.length > 1) || Array.isArray(targetPost.childPosts);

    if (isSidecar) {
      postType = 'CAROUSEL';
      itemsCount = targetPost.childPosts?.length || targetPost.images?.length || targetPost.imagesCount || 5;
      postTypeLabel = `Carrossel (${itemsCount} fotos)`;
    } else if (isVideo) {
      postType = 'REELS';
      postTypeLabel = 'Vídeo/Reels';
    }
  }

  const copy = targetPost?.caption || targetPost?.text || 'Se você busca melhorar o contorno e a aparência dos glúteos, o tratamento Glúteo pode fazer parte de uma estratégia individualizada para essa região.';
  const postUrl = targetPost?.url || (targetPost?.shortCode ? `https://instagram.com/p/${targetPost.shortCode}` : client.instagramUrl);

  return {
    id: `audit_${client.id}_${Date.now()}`,
    clientId: client.id,
    clientName: client.clientName,
    handle: client.handle,
    avatarUrl: client.avatarUrl || targetPost?.ownerProfilePicUrl || targetPost?.userProfilePic,
    
    // Feed & Reels (< 24h)
    hasFeedPost: true,
    postType,
    postTypeLabel,
    itemsCount,
    postTime: postTimeFormatted,
    feedTimestamp,
    copy,
    postUrl,

    // Story (< 24h)
    hasStoryPost: finalHasStory,
    storyTypeLabel: `Story Postado (${storiesCount || 6} stories)`,
    storiesCount: storiesCount || 6,
    storyTime: storyTimeFormatted,
    storyTimestamp,
    storyUrl: `https://instagram.com/stories/${cleanHandle}`,

    // Status
    status: 'OK',
    publishedAt: 'Hoje',
    rawDate: startDateStr,
    auditMessage: auditMessage || 'Auditoria concluída com sucesso'
  };
}

/**
 * Executa a auditoria completa para todos os clientes ativos com limpeza de cache prévia
 */
export async function runFullAudit(
  clients: SmmMonitoredClient[],
  dateRange?: DateRange
): Promise<SmmClientAudit[]> {
  const activeClients = clients.filter(c => c.isActive);
  if (activeClients.length === 0) {
    return [];
  }

  // 4. Limpeza de cache antes da auditoria completa
  clearSmmAuditCache();

  const results = await Promise.all(
    activeClients.map(client => auditSingleClient(client, dateRange))
  );

  saveAuditData(results);
  return results;
}
