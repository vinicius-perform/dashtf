export interface TeamOkrItem {
  id: string | number;
  client: string;
  manager: string; // Gestor de Tráfego
  socialMedia?: string; // Social Media Responsável
  schedule: string;
  createdAt?: string;
}

export interface OkrPopupItem {
  id: string | number;
  client: string;
  manager: string;
  socialMedia?: string;
  schedule: string;
  timeStr?: string;
  liveStatus?: 'IN_PROGRESS' | 'UPCOMING' | 'COMPLETED' | 'PENDING';
  timeRemainingText?: string;
}

export interface OkrPopupConfig {
  title: string;
  subtitle: string;
  category: 'all_today' | 'live' | 'upcoming' | 'completed' | 'manager' | 'social_media';
  icon: 'calendar' | 'activity' | 'hourglass' | 'check' | 'user' | 'sparkles';
  items: OkrPopupItem[];
}

export const STORAGE_KEY = 'dashtf_team_okr_clients_v43';

// Days map for current day matching
export const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const isSchedulePending = (schedule: string): boolean => {
  if (!schedule) return true;
  const s = schedule.toLowerCase().trim();
  return s === 'agendar' || s.includes('sem horário') || s.includes('sem horario') || s.includes('pendente') || s === '';
};

export const getManagerBadgeStyle = (manager: string) => {
  const m = manager.toLowerCase();
  if (m.includes('jhonattan')) {
    return 'bg-blue-900/50 text-blue-400 border border-blue-800/60 shadow-xs';
  }
  if (m.includes('wilhian')) {
    return 'bg-emerald-900/50 text-emerald-400 border border-emerald-800/60 shadow-xs';
  }
  if (m.includes('maisa')) {
    return 'bg-purple-900/50 text-purple-400 border border-purple-800/60 shadow-xs';
  }
  if (m.includes('vinicius') || m.includes('yan')) {
    return 'bg-orange-900/50 text-orange-400 border border-orange-800/60 shadow-xs';
  }
  return 'bg-zinc-800 text-zinc-300 border border-zinc-700 shadow-xs';
};

export const getSocialMediaBadgeStyle = (socialMedia?: string) => {
  if (!socialMedia) return 'bg-zinc-800 text-zinc-400 border border-zinc-700 shadow-xs';
  const sm = socialMedia.toLowerCase();
  if (sm.includes('clara')) {
    return 'bg-pink-900/40 text-pink-300 border border-pink-700/60 shadow-xs';
  }
  if (sm.includes('gabriele') || sm.includes('gabi')) {
    return 'bg-amber-900/40 text-amber-300 border border-amber-700/60 shadow-xs';
  }
  if (sm.includes('sara')) {
    return 'bg-rose-900/40 text-rose-300 border border-rose-700/60 shadow-xs';
  }
  return 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/60 shadow-xs';
};

// Map de Social Media oficial para cada cliente
export const CLIENT_SOCIAL_MEDIA_MAP: Record<string, string> = {
  // --- CLARA BRAGA ---
  'diego padão': 'Clara Braga',
  'diego padao': 'Clara Braga',
  'dr brasil canindé': 'Clara Braga',
  'dr. brasil canindé': 'Clara Braga',
  'dr brasil caninde': 'Clara Braga',
  'dr. brasil caninde': 'Clara Braga',
  'dr derlis teran': 'Clara Braga',
  'dr. derlis teran': 'Clara Braga',
  'dr nicolas': 'Clara Braga',
  'dr. nicolas': 'Clara Braga',
  'dr. cris': 'Clara Braga',
  'dr cris': 'Clara Braga',
  'dr. leonardo chiaradia': 'Clara Braga',
  'dr leonardo chiaradia': 'Clara Braga',
  'dra rafaela nunes': 'Clara Braga',
  'dra. rafaela nunes': 'Clara Braga',
  'dra. bruna emanueli': 'Clara Braga',
  'dra. bruna emanuelli': 'Clara Braga',
  'dra bruna emanueli': 'Clara Braga',
  'dra bruna emanuelli': 'Clara Braga',
  'dra. dora': 'Clara Braga',
  'dra dora': 'Clara Braga',
  'dra. paola telles': 'Clara Braga',
  'dra paola telles': 'Clara Braga',
  'dra. rubenyta leal': 'Clara Braga',
  'dra rubenyta leal': 'Clara Braga',
  'dra. silvia': 'Clara Braga',
  'dra silvia': 'Clara Braga',
  'fa kite surf': 'Clara Braga',
  'fa kitesurf': 'Clara Braga',
  'rangel embalagens': 'Clara Braga',
  'recanto dos amigos': 'Clara Braga',
  'diego patrick': 'Clara Braga',

  // --- GABRIELE DIAS ---
  'bodyincision': 'Gabriele Dias',
  'dr gustavo machado': 'Gabriele Dias',
  'dr. gustavo machado': 'Gabriele Dias',
  'dr kleison resende': 'Gabriele Dias',
  'dr. kleison resende': 'Gabriele Dias',
  'dr rafael almenara': 'Gabriele Dias',
  'dr. rafael almenara': 'Gabriele Dias',
  'dr. gustavo rocha': 'Gabriele Dias',
  'dr gustavo rocha': 'Gabriele Dias',
  'dr. jair dacás': 'Gabriele Dias',
  'dr jair dacás': 'Gabriele Dias',
  'dr. jair dacas': 'Gabriele Dias',
  'dr. rodrigo vieira': 'Gabriele Dias',
  'dr rodrigo vieira': 'Gabriele Dias',
  'dra. aline pereira': 'Gabriele Dias',
  'dra aline pereira': 'Gabriele Dias',
  'dra. keyla klava': 'Gabriele Dias',
  'dra keyla klava': 'Gabriele Dias',
  'dra. marcela fiel': 'Gabriele Dias',
  'dra marcela fiel': 'Gabriele Dias',
  'dra. tatiana fagnani': 'Gabriele Dias',
  'dra tatiana fagnani': 'Gabriele Dias',
  'flegon': 'Gabriele Dias',
  'mathyas': 'Gabriele Dias',
  'sbh': 'Gabriele Dias',

  // --- SARA SILVA ---
  'alessandra montera': 'Sara Silva',
  'clínica doctors (dr. fernando)': 'Sara Silva',
  'clinica doctors (dr. fernando)': 'Sara Silva',
  'clinica doctors': 'Sara Silva',
  'coife odonto': 'Sara Silva',
  'dr. fernando silveira': 'Sara Silva',
  'dr fernando silveira': 'Sara Silva',
  'dr. gabriel': 'Sara Silva',
  'dr gabriel': 'Sara Silva',
  'dr. molino': 'Sara Silva',
  'dr molino': 'Sara Silva',
  'dr. rodrigo coelho': 'Sara Silva',
  'dr rodrigo coelho': 'Sara Silva',
  'dra mariella': 'Sara Silva',
  'dra. mariella': 'Sara Silva',
  'dra mariella palmeira': 'Sara Silva',
  'dra. mariella palmeira': 'Sara Silva',
  'dra. camila citra': 'Sara Silva',
  'dra camila citra': 'Sara Silva',
  'dra. paula': 'Sara Silva',
  'dra paula': 'Sara Silva',
  'dra. samara pighinelli': 'Sara Silva',
  'dra samara pighinelli': 'Sara Silva',
  'fazendo acontecer': 'Sara Silva',
  'nb advocacia': 'Sara Silva',
  'tiago prause': 'Sara Silva',
  'dermo clean': 'Sara Silva',
  'dr. hebert donato': 'Sara Silva',
  'dr. leandro capuchinho': 'Sara Silva',
  'dra. izabelita': 'Sara Silva'
};

export function getSocialMediaForClient(clientName: string): string {
  if (!clientName) return 'Sara Silva';
  const normalized = clientName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  for (const [key, sm] of Object.entries(CLIENT_SOCIAL_MEDIA_MAP)) {
    const normKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (normalized.includes(normKey) || normKey.includes(normalized)) {
      return sm;
    }
  }
  return 'Sara Silva';
}

// Map de Handles oficiais do Instagram para os clientes
export const CLIENT_HANDLE_MAP: Record<string, string> = {
  'alessandra montera': '@alessandramontera',
  'bodyincision': '@bodyincision',
  'clínica doctors (dr. fernando)': '@clinicadoctors',
  'clinica doctors (dr. fernando)': '@clinicadoctors',
  'clinica doctors': '@clinicadoctors',
  'coife odonto': '@coifeodonto',
  'dermo clean': '@dermoclean',
  'diego padão': '@diegopadao',
  'diego padao': '@diegopadao',
  'diego patrick': '@diegopatrick',
  'dr. brasil canindé': '@drbrasilcaninde',
  'dr brasil caninde': '@drbrasilcaninde',
  'dr. derlis teran': '@drderlisteran',
  'dr derlis teran': '@drderlisteran',
  'dr. gustavo machado': '@drgustavomachado',
  'dr gustavo machado': '@drgustavomachado',
  'dr. kleison resende': '@drkleisonresende',
  'dr kleison resende': '@drkleisonresende',
  'dr. nicolas': '@drnicolas',
  'dr nicolas': '@drnicolas',
  'dr. rafael almenara': '@drrafaelalmenara',
  'dr rafael almenara': '@drrafaelalmenara',
  'dr. cris': '@drcris',
  'dr cris': '@drcris',
  'dr. fernando silveira': '@drfernandosilveira',
  'dr fernando silveira': '@drfernandosilveira',
  'dr. gabriel': '@drgabriel',
  'dr gabriel': '@drgabriel',
  'dr. gustavo rocha': '@drgustavorocha',
  'dr gustavo rocha': '@drgustavorocha',
  'dr. hebert donato': '@drhebertdonato',
  'dr hebert donato': '@drhebertdonato',
  'dr. jair dacás': '@drjairdacas',
  'dr jair dacas': '@drjairdacas',
  'dr. leandro capuchinho': '@drleandrocapuchinho',
  'dr leandro capuchinho': '@drleandrocapuchinho',
  'dr. leonardo chiaradia': '@drleonardochiaradia',
  'dr leonardo chiaradia': '@drleonardochiaradia',
  'dr. molino': '@drmolino',
  'dr molino': '@drmolino',
  'dr. rodrigo coelho': '@drrodrigocoelho',
  'dr rodrigo coelho': '@drrodrigocoelho',
  'dr. rodrigo vieira': '@drrodrigovieira',
  'dr rodrigo vieira': '@drrodrigovieira',
  'dra. izabelita': '@draizabelita',
  'dra izabelita': '@draizabelita',
  'dra. mariella': '@dramariella',
  'dra mariella': '@dramariella',
  'dra. mariella palmeira': '@dramariellapalmeira',
  'dra mariella palmeira': '@dramariellapalmeira',
  'dra. rafaela nunes': '@drarafaelanunes',
  'dra rafaela nunes': '@drarafaelanunes',
  'dra. aline pereira': '@draalinepereira',
  'dra aline pereira': '@draalinepereira',
  'dra. bruna emanuelli': '@drabrunaemanuelli',
  'dra bruna emanuelli': '@drabrunaemanuelli',
  'dra. camila citra': '@dracamilacitra',
  'dra camila citra': '@dracamilacitra',
  'dra. dora': '@dradora',
  'dra dora': '@dradora',
  'dra. keyla klava': '@drakeylaklava',
  'dra keyla klava': '@drakeylaklava',
  'dra. marcela fiel': '@dramarcelafiel',
  'dra marcela fiel': '@dramarcelafiel',
  'dra. paola telles': '@drapaoletelles',
  'dra paola telles': '@drapaoletelles',
  'dra. paula': '@drapaula',
  'dra paula': '@drapaula',
  'dra. rubenyta leal': '@drarubanytaleal',
  'dra rubenyta leal': '@drarubanytaleal',
  'dra. samara pighinelli': '@drasamarapighinelli',
  'dra samara pighinelli': '@drasamarapighinelli',
  'dra. silvia': '@drasilvia',
  'dra silvia': '@drasilvia',
  'dra. tatiana fagnani': '@dratatianafagnani',
  'dra tatiana fagnani': '@dratatianafagnani',
  'fa kite surf': '@fakitesurf',
  'fa kitesurf': '@fakitesurf',
  'fazendo acontecer': '@fazendoacontecer',
  'flegon': '@flegon',
  'mathyas': '@mathyas',
  'nb advocacia': '@nbadvocacia',
  'rangel embalagens': '@rangelembalagens',
  'recanto dos amigos': '@recantodosamigos',
  'sbh': '@sbh',
  'tiago prause': '@tiagoprause'
};

export function getInstagramHandleForClient(clientName: string): string {
  if (!clientName) return '@cliente';
  const normalized = clientName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  for (const [key, handle] of Object.entries(CLIENT_HANDLE_MAP)) {
    const normKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (normalized === normKey || normalized.includes(normKey) || normKey.includes(normalized)) {
      return handle;
    }
  }

  const clean = normalized.replace(/[^a-z0-9]/g, '');
  return `@${clean || 'cliente'}`;
}

// Helper to parse schedule day and time
export interface ParsedSchedule {
  day: string | null;
  timeStr: string | null;
  startMinutes: number | null;
  isPending: boolean;
}

export const parseScheduleInfo = (schedule: string): ParsedSchedule => {
  if (!schedule || isSchedulePending(schedule)) {
    return { day: null, timeStr: null, startMinutes: null, isPending: true };
  }

  const s = schedule.trim();
  let foundDay: string | null = null;
  for (const day of ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']) {
    if (s.toLowerCase().includes(day.toLowerCase())) {
      foundDay = day;
      break;
    }
  }

  // Extract HH:mm
  const timeMatch = s.match(/(\d{1,2}):(\d{2})/);
  let timeStr: string | null = null;
  let startMinutes: number | null = null;

  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const mins = parseInt(timeMatch[2], 10);
    timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    startMinutes = hours * 60 + mins;
  }

  return {
    day: foundDay,
    timeStr,
    startMinutes,
    isPending: false
  };
};

export const initialClientsList: TeamOkrItem[] = [
  // Jhonattan + Sara Silva / Clara Braga / Gabriele Dias
  { id: 1, client: 'Alessandra Montera', manager: 'Jhonattan', socialMedia: 'Sara Silva', schedule: 'Sexta - 10:00' },
  { id: 2, client: 'Bodyincision', manager: 'Jhonattan', socialMedia: 'Gabriele Dias', schedule: 'Sexta - 11:00' },
  { id: 3, client: 'Clínica Doctors (Dr. Fernando)', manager: 'Jhonattan', socialMedia: 'Sara Silva', schedule: 'Sexta - sem horário' },
  { id: 4, client: 'Coife Odonto', manager: 'Wilhian', socialMedia: 'Sara Silva', schedule: 'Terça - 08:30' },
  { id: 5, client: 'Dermo Clean', manager: 'Maisa', socialMedia: 'Sara Silva', schedule: 'Agendar' },
  { id: 6, client: 'Diego Padão', manager: 'Wilhian', socialMedia: 'Clara Braga', schedule: 'Quarta - 08:30' },
  { id: 7, client: 'Diego Patrick', manager: 'Wilhian', socialMedia: 'Clara Braga', schedule: 'Agendar' },
  { id: 8, client: 'Dr. Brasil Canindé', manager: 'Wilhian', socialMedia: 'Clara Braga', schedule: 'Agendar' },
  { id: 9, client: 'Dr. Derlis Teran', manager: 'Wilhian', socialMedia: 'Clara Braga', schedule: 'Quarta - 15:00' },
  { id: 10, client: 'Dr. Gustavo Machado', manager: 'Jhonattan', socialMedia: 'Gabriele Dias', schedule: 'Agendar' },
  { id: 11, client: 'Dr. Kleison Resende', manager: 'Wilhian', socialMedia: 'Gabriele Dias', schedule: 'Sexta - 08:30' },
  { id: 12, client: 'Dr. Nicolas', manager: 'Wilhian', socialMedia: 'Clara Braga', schedule: 'Segunda - 09:00' },
  { id: 13, client: 'Dr. Rafael Almenara', manager: 'Wilhian', socialMedia: 'Gabriele Dias', schedule: 'Sexta - 14:00' },
  { id: 14, client: 'Dr. Cris', manager: 'Wilhian', socialMedia: 'Clara Braga', schedule: 'Quarta - 14:00' },
  { id: 15, client: 'Dr. Fernando Silveira', manager: 'Jhonattan', socialMedia: 'Sara Silva', schedule: 'Quarta - 08:30' },
  { id: 16, client: 'Dr. Gabriel', manager: 'Wilhian', socialMedia: 'Sara Silva', schedule: 'Agendar' },
  { id: 17, client: 'Dr. Gustavo Rocha', manager: 'Wilhian', socialMedia: 'Gabriele Dias', schedule: 'Agendar' },
  { id: 18, client: 'Dr. Hebert Donato', manager: 'Maisa', socialMedia: 'Sara Silva', schedule: 'Quarta - 13:30' },
  { id: 19, client: 'Dr. Jair Dacás', manager: 'Jhonattan', socialMedia: 'Gabriele Dias', schedule: 'Quarta - 09:30' },
  { id: 20, client: 'Dr. Leandro Capuchinho', manager: 'Wilhian', socialMedia: 'Sara Silva', schedule: 'Terça - 14:00' },
  { id: 21, client: 'Dr. Leonardo Chiaradia', manager: 'Jhonattan', socialMedia: 'Clara Braga', schedule: 'Agendar' },
  { id: 22, client: 'Dr. Molino', manager: 'Maisa', socialMedia: 'Sara Silva', schedule: 'Agendar' },
  { id: 23, client: 'Dr. Rodrigo Coelho', manager: 'Maisa', socialMedia: 'Sara Silva', schedule: 'Terça - 10:00' },
  { id: 24, client: 'Dr. Rodrigo Vieira', manager: 'Jhonattan', socialMedia: 'Gabriele Dias', schedule: 'Terça - 14:00' },
  { id: 25, client: 'Dra. Izabelita', manager: 'Jhonattan', socialMedia: 'Sara Silva', schedule: 'Agendar' },
  { id: 26, client: 'Dra. Mariella', manager: 'Vinicius', socialMedia: 'Sara Silva', schedule: 'Quarta - 10:30' },
  { id: 27, client: 'Dra. Rafaela Nunes', manager: 'Jhonattan', socialMedia: 'Clara Braga', schedule: 'Agendar' },
  { id: 28, client: 'Dra. Aline Pereira', manager: 'Wilhian', socialMedia: 'Gabriele Dias', schedule: 'Terça - 15:00' },
  { id: 29, client: 'Dra. Bruna Emanuelli', manager: 'Wilhian', socialMedia: 'Clara Braga', schedule: 'Agendar' },
  { id: 30, client: 'Dra. Camila Citra', manager: 'Maisa', socialMedia: 'Sara Silva', schedule: 'Terça - 11:00' },
  { id: 31, client: 'Dra. Dora', manager: 'Jhonattan', socialMedia: 'Clara Braga', schedule: 'Agendar' },
  { id: 32, client: 'Dra. Keyla Klava', manager: 'Jhonattan', socialMedia: 'Gabriele Dias', schedule: 'Terça - 10:00' },
  { id: 33, client: 'Dra. Marcela Fiel', manager: 'Jhonattan', socialMedia: 'Gabriele Dias', schedule: 'Sexta - 11:00' },
  { id: 34, client: 'Dra. Paola Telles', manager: 'Wilhian', socialMedia: 'Clara Braga', schedule: 'Quarta - 09:30' },
  { id: 35, client: 'Dra. Paula', manager: 'Wilhian', socialMedia: 'Sara Silva', schedule: 'Agendar' },
  { id: 36, client: 'Dra. Rubenyta Leal', manager: 'Wilhian', socialMedia: 'Clara Braga', schedule: 'Terça - 11:00' },
  { id: 37, client: 'Dra. Samara Pighinelli', manager: 'Vinicius / Yan Ferreira', socialMedia: 'Sara Silva', schedule: 'Quinta - 17:00' },
  { id: 38, client: 'Dra. Silvia', manager: 'Maisa', socialMedia: 'Clara Braga', schedule: 'Segunda - 15:00' },
  { id: 39, client: 'Dra. Tatiana Fagnani', manager: 'Jhonattan', socialMedia: 'Gabriele Dias', schedule: 'Segunda - 10:00' },
  { id: 40, client: 'FA Kite Surf', manager: 'Wilhian', socialMedia: 'Clara Braga', schedule: 'Agendar' },
  { id: 41, client: 'Fazendo Acontecer', manager: 'Vinicius', socialMedia: 'Sara Silva', schedule: 'Segunda - 14:00' },
  { id: 42, client: 'Flegon', manager: 'Wilhian', socialMedia: 'Gabriele Dias', schedule: 'Sexta - 14:00' },
  { id: 43, client: 'Mathyas', manager: 'Jhonattan', socialMedia: 'Gabriele Dias', schedule: 'Agendar' },
  { id: 44, client: 'NB Advocacia', manager: 'Wilhian', socialMedia: 'Sara Silva', schedule: 'Agendar' },
  { id: 45, client: 'Rangel Embalagens', manager: 'Wilhian', socialMedia: 'Clara Braga', schedule: 'Agendar' },
  { id: 46, client: 'Recanto dos Amigos', manager: 'Jhonattan', socialMedia: 'Clara Braga', schedule: 'Agendar' },
  { id: 47, client: 'SBH', manager: 'Wilhian', socialMedia: 'Gabriele Dias', schedule: 'Agendar' },
  { id: 48, client: 'Tiago Prause', manager: 'Wilhian', socialMedia: 'Sara Silva', schedule: 'Terça - 17:00' }
];
