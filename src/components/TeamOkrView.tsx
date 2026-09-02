import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Filter, 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  Sparkles, 
  UserCheck, 
  Building2, 
  UserPlus, 
  RefreshCw,
  Activity,
  Radio,
  Hourglass,
  CalendarDays,
  Flame,
  ChevronRight,
  Eye,
  ArrowRight,
  Share2
} from 'lucide-react';

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

export const TeamOkrView: React.FC = () => {
  // Real-time clock state (updates every second)
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Persistent client list loaded from localStorage
  const [clients, setClients] = useState<TeamOkrItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= 35) {
          // Garantir que todos tenham o campo socialMedia populado e Vinicius limpo
          return parsed.map((item: any) => {
            let manager = item.manager || 'Jhonattan';
            if (manager === 'Vinicius Tráfego') manager = 'Vinicius';
            if (manager === 'Vinicius Tráfego / Yan Ferreira') manager = 'Vinicius / Yan Ferreira';
            return {
              ...item,
              manager,
              socialMedia: item.socialMedia || getSocialMediaForClient(item.client)
            };
          });
        }
      }
      return initialClientsList;
    } catch (e) {
      console.error('Erro ao ler clientes do localStorage:', e);
      return initialClientsList;
    }
  });

  // Save clients to localStorage on state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
    } catch (e) {
      console.error('Erro ao salvar clientes no localStorage:', e);
    }
  }, [clients]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [managerFilter, setManagerFilter] = useState<'TODOS' | 'Jhonattan' | 'Wilhian' | 'Maisa' | 'Vinicius'>('TODOS');
  const [socialMediaFilter, setSocialMediaFilter] = useState<'TODAS' | 'Clara Braga' | 'Gabriele Dias' | 'Sara Silva'>('TODAS');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'COM_HORARIO' | 'PENDENTES'>('TODOS');
  const [dayFilter, setDayFilter] = useState<'TODOS' | 'HOJE' | 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta'>('TODOS');

  // Modal State for Register / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<TeamOkrItem | null>(null);

  // Popup Modal State (For clicking on cards to see OKRs list & schedules)
  const [popupConfig, setPopupConfig] = useState<OkrPopupConfig | null>(null);
  const [popupSearch, setPopupSearch] = useState('');

  // Form Fields
  const [formClientName, setFormClientName] = useState('');
  const [formManager, setFormManager] = useState<string>('Jhonattan');
  const [formSocialMedia, setFormSocialMedia] = useState<string>('Sara Silva');
  const [formScheduleType, setFormScheduleType] = useState<'CUSTOM' | 'PENDING'>('CUSTOM');
  const [formDayOfWeek, setFormDayOfWeek] = useState('Segunda');
  const [formTime, setFormTime] = useState('10:00');
  const [formCustomSchedule, setFormCustomSchedule] = useState('');

  // Toast Notification State
  const [toast, setToast] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Close popup on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPopupConfig(null);
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-time Day & Time calculations
  const todayDayName = DAYS_OF_WEEK[currentDate.getDay()]; // e.g. "Terça"
  const currentHours = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();
  const currentMinutesFromMidnight = currentHours * 60 + currentMinutes;
  const currentTimeFormatted = `${String(currentHours).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;

  // Formatted date string (e.g. "Terça · 01 de setembro")
  const formattedTodayDate = useMemo(() => {
    const dayName = todayDayName;
    const dayNum = String(currentDate.getDate()).padStart(2, '0');
    const monthNames = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const monthName = monthNames[currentDate.getMonth()];
    return `${dayName} · ${dayNum} de ${monthName}`;
  }, [currentDate, todayDayName]);

  // Real-Time Meeting Analysis for Today
  const realTimeAnalysis = useMemo(() => {
    const todayMeetings: {
      item: TeamOkrItem;
      parsed: ParsedSchedule;
      status: 'IN_PROGRESS' | 'UPCOMING' | 'COMPLETED';
      timeRemainingText?: string;
    }[] = [];

    clients.forEach((item) => {
      const parsed = parseScheduleInfo(item.schedule);
      if (parsed.day && parsed.day.toLowerCase() === todayDayName.toLowerCase() && parsed.startMinutes !== null) {
        const meetingDuration = 50; // Standard 50-minute meeting window
        const endMinutes = parsed.startMinutes + meetingDuration;

        let status: 'IN_PROGRESS' | 'UPCOMING' | 'COMPLETED' = 'UPCOMING';
        let timeRemainingText = '';

        if (currentMinutesFromMidnight >= parsed.startMinutes && currentMinutesFromMidnight < endMinutes) {
          status = 'IN_PROGRESS';
          const remaining = endMinutes - currentMinutesFromMidnight;
          timeRemainingText = `restam ~${remaining} min`;
        } else if (currentMinutesFromMidnight >= endMinutes) {
          status = 'COMPLETED';
        } else {
          status = 'UPCOMING';
          const untilStart = parsed.startMinutes - currentMinutesFromMidnight;
          if (untilStart > 0 && untilStart <= 60) {
            timeRemainingText = `começa em ${untilStart} min`;
          }
        }

        todayMeetings.push({ item, parsed, status, timeRemainingText });
      }
    });

    // Sort today's meetings by start time
    todayMeetings.sort((a, b) => (a.parsed.startMinutes || 0) - (b.parsed.startMinutes || 0));

    const inProgress = todayMeetings.filter(m => m.status === 'IN_PROGRESS');
    const upcoming = todayMeetings.filter(m => m.status === 'UPCOMING');
    const completed = todayMeetings.filter(m => m.status === 'COMPLETED');

    return {
      todayMeetings,
      totalToday: todayMeetings.length,
      inProgress,
      upcoming,
      completed
    };
  }, [clients, todayDayName, currentMinutesFromMidnight]);

  // Manager & Social Media volume KPIs
  const kpis = useMemo(() => {
    const jhonattanList = clients.filter(item => item.manager.toLowerCase().includes('jhonattan'));
    const wilhianList = clients.filter(item => item.manager.toLowerCase().includes('wilhian'));
    const maisaList = clients.filter(item => item.manager.toLowerCase().includes('maisa'));
    const viniciusList = clients.filter(item => item.manager.toLowerCase().includes('vinicius') || item.manager.toLowerCase().includes('yan'));

    const claraList = clients.filter(item => (item.socialMedia || getSocialMediaForClient(item.client)).toLowerCase().includes('clara'));
    const gabrieleList = clients.filter(item => (item.socialMedia || getSocialMediaForClient(item.client)).toLowerCase().includes('gabriele'));
    const saraList = clients.filter(item => (item.socialMedia || getSocialMediaForClient(item.client)).toLowerCase().includes('sara'));

    return {
      jhonattan: {
        total: jhonattanList.length,
        scheduled: jhonattanList.filter(i => !isSchedulePending(i.schedule)).length,
        pending: jhonattanList.filter(i => isSchedulePending(i.schedule)).length
      },
      wilhian: {
        total: wilhianList.length,
        scheduled: wilhianList.filter(i => !isSchedulePending(i.schedule)).length,
        pending: wilhianList.filter(i => isSchedulePending(i.schedule)).length
      },
      maisa: {
        total: maisaList.length,
        scheduled: maisaList.filter(i => !isSchedulePending(i.schedule)).length,
        pending: maisaList.filter(i => isSchedulePending(i.schedule)).length
      },
      vinicius: {
        total: viniciusList.length,
        scheduled: viniciusList.filter(i => !isSchedulePending(i.schedule)).length,
        pending: viniciusList.filter(i => isSchedulePending(i.schedule)).length
      },
      clara: {
        total: claraList.length
      },
      gabriele: {
        total: gabrieleList.length
      },
      sara: {
        total: saraList.length
      },
      totalClients: clients.length,
      totalPending: clients.filter(i => isSchedulePending(i.schedule)).length,
      totalScheduled: clients.filter(i => !isSchedulePending(i.schedule)).length
    };
  }, [clients]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return clients.filter(item => {
      // Manager filter
      if (managerFilter !== 'TODOS') {
        const itemMgr = item.manager.toLowerCase();
        const filterMgr = managerFilter.toLowerCase();
        if (!itemMgr.includes(filterMgr)) {
          return false;
        }
      }

      // Social Media filter
      if (socialMediaFilter !== 'TODAS') {
        const itemSm = (item.socialMedia || getSocialMediaForClient(item.client)).toLowerCase();
        const filterSm = socialMediaFilter.toLowerCase();
        if (!itemSm.includes(filterSm)) {
          return false;
        }
      }

      // OKR Status filter
      const isPending = isSchedulePending(item.schedule);
      if (statusFilter === 'COM_HORARIO' && isPending) {
        return false;
      }
      if (statusFilter === 'PENDENTES' && !isPending) {
        return false;
      }

      // Day filter
      if (dayFilter !== 'TODOS') {
        const parsed = parseScheduleInfo(item.schedule);
        if (dayFilter === 'HOJE') {
          if (!parsed.day || parsed.day.toLowerCase() !== todayDayName.toLowerCase()) {
            return false;
          }
        } else {
          if (!parsed.day || parsed.day.toLowerCase() !== dayFilter.toLowerCase()) {
            return false;
          }
        }
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchClient = item.client.toLowerCase().includes(query);
        const matchManager = item.manager.toLowerCase().includes(query);
        const matchSocialMedia = (item.socialMedia || getSocialMediaForClient(item.client)).toLowerCase().includes(query);
        const matchSchedule = item.schedule.toLowerCase().includes(query);
        if (!matchClient && !matchManager && !matchSocialMedia && !matchSchedule) {
          return false;
        }
      }

      return true;
    });
  }, [clients, searchQuery, managerFilter, socialMediaFilter, statusFilter, dayFilter, todayDayName]);

  const hasActiveFilters = searchQuery !== '' || managerFilter !== 'TODOS' || socialMediaFilter !== 'TODAS' || statusFilter !== 'TODOS' || dayFilter !== 'TODOS';

  const handleClearFilters = () => {
    setSearchQuery('');
    setManagerFilter('TODOS');
    setSocialMediaFilter('TODAS');
    setStatusFilter('TODOS');
    setDayFilter('TODOS');
  };

  // Open modal for new client
  const handleOpenAddModal = () => {
    setEditingClient(null);
    setFormClientName('');
    setFormManager('Jhonattan');
    setFormSocialMedia('Sara Silva');
    setFormScheduleType('CUSTOM');
    setFormDayOfWeek(todayDayName !== 'Domingo' ? todayDayName : 'Segunda');
    setFormTime('10:00');
    setFormCustomSchedule(`${todayDayName !== 'Domingo' ? todayDayName : 'Segunda'} - 10:00`);
    setIsModalOpen(true);
  };

  // Open modal for editing existing client
  const handleOpenEditModal = (client: TeamOkrItem) => {
    setEditingClient(client);
    setFormClientName(client.client);
    setFormManager(client.manager);
    setFormSocialMedia(client.socialMedia || getSocialMediaForClient(client.client));

    if (isSchedulePending(client.schedule)) {
      setFormScheduleType('PENDING');
      setFormCustomSchedule('Agendar');
    } else {
      setFormScheduleType('CUSTOM');
      setFormCustomSchedule(client.schedule);
      const parsed = parseScheduleInfo(client.schedule);
      if (parsed.day) setFormDayOfWeek(parsed.day);
      if (parsed.timeStr) setFormTime(parsed.timeStr);
    }
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientName.trim()) return;

    let finalSchedule = '';
    if (formScheduleType === 'PENDING') {
      finalSchedule = 'Agendar';
    } else {
      finalSchedule = formCustomSchedule.trim() || `${formDayOfWeek} - ${formTime}`;
    }

    if (editingClient) {
      // Edit existing
      setClients(prev => prev.map(c => {
        if (c.id === editingClient.id) {
          return {
            ...c,
            client: formClientName.trim(),
            manager: formManager,
            socialMedia: formSocialMedia,
            schedule: finalSchedule
          };
        }
        return c;
      }));
      showToast(`Cliente "${formClientName}" atualizado com sucesso!`);
    } else {
      // Create new
      const newClient: TeamOkrItem = {
        id: Date.now(),
        client: formClientName.trim(),
        manager: formManager,
        socialMedia: formSocialMedia,
        schedule: finalSchedule,
        createdAt: new Date().toISOString()
      };
      setClients(prev => [newClient, ...prev]);
      showToast(`Cliente "${formClientName}" cadastrado com sucesso!`);
    }

    setIsModalOpen(false);
  };

  // Handle Delete Client
  const handleDeleteClient = (id: string | number, clientName: string) => {
    if (window.confirm(`Tem certeza que deseja remover o cliente "${clientName}" da carteira de OKRs?`)) {
      setClients(prev => prev.filter(c => c.id !== id));
      showToast(`Cliente "${clientName}" removido.`);
    }
  };

  // Handlers to open Clickable Popups from Cards
  const handleOpenTodayOkrsPopup = () => {
    setPopupSearch('');
    setPopupConfig({
      title: `Todos os OKRs de Hoje — ${formattedTodayDate}`,
      subtitle: `${realTimeAnalysis.totalToday} reuniões agendadas para o dia de hoje`,
      category: 'all_today',
      icon: 'calendar',
      items: realTimeAnalysis.todayMeetings.map(m => ({
        id: m.item.id,
        client: m.item.client,
        manager: m.item.manager,
        socialMedia: m.item.socialMedia || getSocialMediaForClient(m.item.client),
        schedule: m.item.schedule,
        timeStr: m.parsed.timeStr || '',
        liveStatus: m.status,
        timeRemainingText: m.timeRemainingText
      }))
    });
  };

  const handleOpenLiveOkrsPopup = () => {
    setPopupSearch('');
    setPopupConfig({
      title: 'OKRs Em Andamento Agora (Ao Vivo)',
      subtitle: `${realTimeAnalysis.inProgress.length} reunião(ões) acontecendo neste exato minuto`,
      category: 'live',
      icon: 'activity',
      items: realTimeAnalysis.inProgress.map(m => ({
        id: m.item.id,
        client: m.item.client,
        manager: m.item.manager,
        socialMedia: m.item.socialMedia || getSocialMediaForClient(m.item.client),
        schedule: m.item.schedule,
        timeStr: m.parsed.timeStr || '',
        liveStatus: m.status,
        timeRemainingText: m.timeRemainingText
      }))
    });
  };

  const handleOpenUpcomingOkrsPopup = () => {
    setPopupSearch('');
    setPopupConfig({
      title: 'Próximos OKRs de Hoje (Pendentes para Realizar)',
      subtitle: `${realTimeAnalysis.upcoming.length} reuniões a serem realizadas nas próximas horas`,
      category: 'upcoming',
      icon: 'hourglass',
      items: realTimeAnalysis.upcoming.map(m => ({
        id: m.item.id,
        client: m.item.client,
        manager: m.item.manager,
        socialMedia: m.item.socialMedia || getSocialMediaForClient(m.item.client),
        schedule: m.item.schedule,
        timeStr: m.parsed.timeStr || '',
        liveStatus: m.status,
        timeRemainingText: m.timeRemainingText
      }))
    });
  };

  const handleOpenCompletedOkrsPopup = () => {
    setPopupSearch('');
    setPopupConfig({
      title: 'OKRs Já Concluídos Hoje',
      subtitle: `${realTimeAnalysis.completed.length} reuniões finalizadas com sucesso hoje`,
      category: 'completed',
      icon: 'check',
      items: realTimeAnalysis.completed.map(m => ({
        id: m.item.id,
        client: m.item.client,
        manager: m.item.manager,
        socialMedia: m.item.socialMedia || getSocialMediaForClient(m.item.client),
        schedule: m.item.schedule,
        timeStr: m.parsed.timeStr || '',
        liveStatus: m.status,
        timeRemainingText: m.timeRemainingText
      }))
    });
  };

  const handleOpenManagerOkrsPopup = (managerName: string) => {
    setPopupSearch('');
    const managerClients = clients.filter(c => c.manager.toLowerCase().includes(managerName.toLowerCase()));
    
    setPopupConfig({
      title: `Carteira & OKRs — ${managerName}`,
      subtitle: `${managerClients.length} clientes cadastrados na carteira de ${managerName}`,
      category: 'manager',
      icon: 'user',
      items: managerClients.map(c => {
        const parsed = parseScheduleInfo(c.schedule);
        const isToday = parsed.day && parsed.day.toLowerCase() === todayDayName.toLowerCase();
        let liveStatus: 'IN_PROGRESS' | 'UPCOMING' | 'COMPLETED' | 'PENDING' = isSchedulePending(c.schedule) ? 'PENDING' : 'UPCOMING';
        let timeRemainingText = '';

        if (isToday && parsed.startMinutes !== null) {
          const endMinutes = parsed.startMinutes + 50;
          if (currentMinutesFromMidnight >= parsed.startMinutes && currentMinutesFromMidnight < endMinutes) {
            liveStatus = 'IN_PROGRESS';
            timeRemainingText = `restam ~${endMinutes - currentMinutesFromMidnight} min`;
          } else if (currentMinutesFromMidnight >= endMinutes) {
            liveStatus = 'COMPLETED';
          } else {
            liveStatus = 'UPCOMING';
          }
        }

        return {
          id: c.id,
          client: c.client,
          manager: c.manager,
          socialMedia: c.socialMedia || getSocialMediaForClient(c.client),
          schedule: c.schedule,
          timeStr: parsed.timeStr || '',
          liveStatus,
          timeRemainingText
        };
      })
    });
  };

  const handleOpenSocialMediaPopup = (smName: string) => {
    setPopupSearch('');
    const smClients = clients.filter(c => (c.socialMedia || getSocialMediaForClient(c.client)).toLowerCase().includes(smName.toLowerCase()));
    
    setPopupConfig({
      title: `Carteira Social Media — ${smName}`,
      subtitle: `${smClients.length} clientes atribuídos a ${smName}`,
      category: 'social_media',
      icon: 'sparkles',
      items: smClients.map(c => {
        const parsed = parseScheduleInfo(c.schedule);
        return {
          id: c.id,
          client: c.client,
          manager: c.manager,
          socialMedia: c.socialMedia || getSocialMediaForClient(c.client),
          schedule: c.schedule,
          timeStr: parsed.timeStr || '',
          liveStatus: isSchedulePending(c.schedule) ? 'PENDING' : 'UPCOMING'
        };
      })
    });
  };

  // Filtered popup items
  const filteredPopupItems = useMemo(() => {
    if (!popupConfig) return [];
    if (!popupSearch.trim()) return popupConfig.items;
    const q = popupSearch.toLowerCase();
    return popupConfig.items.filter(i => 
      i.client.toLowerCase().includes(q) ||
      i.manager.toLowerCase().includes(q) ||
      (i.socialMedia || '').toLowerCase().includes(q) ||
      i.schedule.toLowerCase().includes(q)
    );
  }, [popupConfig, popupSearch]);

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto animate-fadeIn select-text relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border text-xs font-extrabold animate-bounce ${
          toast.type === 'success' 
            ? 'bg-brand-neon text-black border-black/20 shadow-brand-neon/20' 
            : 'bg-zinc-800 text-white border-zinc-700 shadow-zinc-900/50'
        }`}>
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Header Principal */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-sidebar border border-brand-border rounded-2xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Equipe & OKRs
                <span className="text-xs bg-zinc-800 text-brand-neon font-extrabold px-2.5 py-0.5 rounded-full border border-zinc-700">
                  {kpis.totalClients} Clientes na Carteira
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Acompanhe reuniões de OKR em tempo real, cronograma do dia atual e gestão completa de Tráfego e Social Media.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-brand-card px-4 py-2 rounded-xl border border-brand-border text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{kpis.totalScheduled} Agendados</span>
            </div>
            <span className="text-zinc-600">|</span>
            <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{kpis.totalPending} Pendentes</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="bg-brand-neon hover:bg-brand-neonHover text-black font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-brand-neon/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Cliente</span>
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME DASHBOARD MONITOR DO DIA (Com Cards Clicáveis) */}
      <div className="bg-brand-card/90 border border-brand-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 relative overflow-hidden backdrop-blur-sm">
        {/* Glow de fundo */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-neon/5 rounded-full blur-3xl pointer-events-none" />

        {/* Topo do Card de Hoje: Data e Horário em Tempo Real */}
        <div className="flex items-center justify-between border-b border-brand-border/80 pb-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase text-brand-neon tracking-widest block">
              HOJE
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight capitalize">
              {formattedTodayDate}
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-brand-sidebar/90 border border-brand-border px-4 py-2 rounded-xl shadow-inner">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div className="flex items-center gap-1.5 font-mono text-sm font-black text-emerald-400">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>{currentTimeFormatted}</span>
            </div>
          </div>
        </div>

        {/* 4 Cards de KPIs de Hoje em Tempo Real (Clicáveis p/ abrir Popup) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: OKRS DE HOJE */}
          <div 
            onClick={handleOpenTodayOkrsPopup}
            className="bg-brand-sidebar border border-brand-border hover:border-brand-neon/60 rounded-xl p-4 flex flex-col justify-between transition-all group cursor-pointer hover:shadow-lg hover:shadow-brand-neon/5 hover:-translate-y-0.5"
            title="Clique para ver todos os OKRs de hoje e seus horários"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 group-hover:text-brand-neon transition-colors">
                <CalendarDays className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider group-hover:text-brand-neon flex items-center gap-1">
                <span>Total Hoje</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {realTimeAnalysis.totalToday}
              </div>
              <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-tight block mt-0.5">
                OKRs de Hoje
              </span>
            </div>
          </div>

          {/* Card 2: EM ANDAMENTO AGORA */}
          <div 
            onClick={handleOpenLiveOkrsPopup}
            className={`bg-brand-sidebar border rounded-xl p-4 flex flex-col justify-between transition-all group cursor-pointer hover:-translate-y-0.5 ${
              realTimeAnalysis.inProgress.length > 0 
                ? 'border-emerald-500/60 bg-emerald-950/20 ring-1 ring-emerald-500/40 hover:border-emerald-400 shadow-lg shadow-emerald-950/30' 
                : 'border-brand-border hover:border-emerald-500/40'
            }`}
            title="Clique para ver os OKRs em andamento agora"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                realTimeAnalysis.inProgress.length > 0 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse' 
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
              }`}>
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                <span>Ao Vivo</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                {realTimeAnalysis.inProgress.length}
                {realTimeAnalysis.inProgress.length > 0 && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded-full animate-bounce">
                    Ativo agora
                  </span>
                )}
              </div>
              <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-tight block mt-0.5">
                Em Andamento Agora
              </span>
            </div>
          </div>

          {/* Card 3: FALTAM REALIZAR (PRÓXIMAS HOJE) */}
          <div 
            onClick={handleOpenUpcomingOkrsPopup}
            className="bg-brand-sidebar border border-brand-border hover:border-amber-500/60 rounded-xl p-4 flex flex-col justify-between transition-all group cursor-pointer hover:shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5"
            title="Clique para ver os próximos OKRs de hoje"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Hourglass className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1">
                <span>Pendentes Hoje</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {realTimeAnalysis.upcoming.length}
              </div>
              <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-tight block mt-0.5">
                Faltam Realizar
              </span>
            </div>
          </div>

          {/* Card 4: CONCLUÍDAS HOJE */}
          <div 
            onClick={handleOpenCompletedOkrsPopup}
            className="bg-brand-sidebar border border-brand-border hover:border-blue-500/60 rounded-xl p-4 flex flex-col justify-between transition-all group cursor-pointer hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5"
            title="Clique para ver os OKRs concluídos hoje"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase text-blue-400 tracking-wider flex items-center gap-1">
                <span>Realizadas</span>
                <ChevronRight className="w-3 h-3" />
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {realTimeAnalysis.completed.length}
              </div>
              <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-tight block mt-0.5">
                Concluídas Hoje
              </span>
            </div>
          </div>
        </div>
      </div>



      {/* 4. Filter and Search Toolbar */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Input de Busca Textual */}
          <div className="relative w-full max-w-xs sm:max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar cliente, gestor, social media ou horário..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por Gestor de Tráfego */}
          <div className="flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value as any)}
              className="bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-neon transition-all cursor-pointer font-semibold"
            >
              <option value="TODOS">Todos os Gestores</option>
              <option value="Jhonattan">Jhonattan</option>
              <option value="Wilhian">Wilhian</option>
              <option value="Maisa">Maisa</option>
              <option value="Vinicius">Vinicius</option>
            </select>
          </div>

          {/* Filtro por Social Media */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <select
              value={socialMediaFilter}
              onChange={(e) => setSocialMediaFilter(e.target.value as any)}
              className="bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-neon transition-all cursor-pointer font-semibold"
            >
              <option value="TODAS">Todas as Social Medias</option>
              <option value="Clara Braga">Clara Braga</option>
              <option value="Gabriele Dias">Gabriele Dias</option>
              <option value="Sara Silva">Sara Silva</option>
            </select>
          </div>

          {/* Filtro por Dia da Semana / Hoje */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value as any)}
              className="bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-neon transition-all cursor-pointer font-semibold"
            >
              <option value="TODOS">Todos os Dias</option>
              <option value="HOJE">Apenas Hoje ({todayDayName})</option>
              <option value="Segunda">Segunda-feira</option>
              <option value="Terça">Terça-feira</option>
              <option value="Quarta">Quarta-feira</option>
              <option value="Quinta">Quinta-feira</option>
              <option value="Sexta">Sexta-feira</option>
            </select>
          </div>

          {/* Filtro por Status do Horário */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-neon transition-all cursor-pointer font-semibold"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="COM_HORARIO">Com Horário Definido</option>
              <option value="PENDENTES">Pendentes / Agendar</option>
            </select>
          </div>

          {/* Botão Limpar Filtros */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-brand-neon hover:underline font-semibold flex items-center gap-1 cursor-pointer px-2 py-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        {/* Totalizador de Resultados */}
        <div className="text-xs text-zinc-400 font-mono font-bold">
          Exibindo <span className="text-brand-neon font-black">{filteredData.length}</span> de {clients.length} clientes
        </div>
      </div>

      {/* 5. Tabela Principal de Clientes & OKRs */}
      {filteredData.length === 0 ? (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-500">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              Nenhum cliente encontrado
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Nenhum cliente corresponde aos filtros aplicados. Tente ajustar os filtros ou cadastrar um novo cliente.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-zinc-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-brand-card border border-brand-border rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border bg-brand-sidebar/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5 w-16 text-center">#</th>
                  <th className="py-3.5 px-5">Cliente</th>
                  <th className="py-3.5 px-5">Gestor de Tráfego</th>
                  <th className="py-3.5 px-5">Social Media</th>
                  <th className="py-3.5 px-5">OKR (Reunião)</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-xs">
                {filteredData.map((item, index) => {
                  const pending = isSchedulePending(item.schedule);
                  const managerStyle = getManagerBadgeStyle(item.manager);
                  const socialMediaName = item.socialMedia || getSocialMediaForClient(item.client);
                  const socialMediaStyle = getSocialMediaBadgeStyle(socialMediaName);
                  const initials = item.client.slice(0, 2).toUpperCase();
                  const parsed = parseScheduleInfo(item.schedule);
                  
                  // Check real-time status for today
                  const isToday = parsed.day && parsed.day.toLowerCase() === todayDayName.toLowerCase();
                  let liveStatus: 'IN_PROGRESS' | 'UPCOMING' | 'COMPLETED' | null = null;
                  
                  if (isToday && parsed.startMinutes !== null) {
                    const endMinutes = parsed.startMinutes + 50;
                    if (currentMinutesFromMidnight >= parsed.startMinutes && currentMinutesFromMidnight < endMinutes) {
                      liveStatus = 'IN_PROGRESS';
                    } else if (currentMinutesFromMidnight >= endMinutes) {
                      liveStatus = 'COMPLETED';
                    } else {
                      liveStatus = 'UPCOMING';
                    }
                  }

                  return (
                    <tr 
                      key={item.id}
                      className={`hover:bg-zinc-850/60 transition-colors group ${
                        liveStatus === 'IN_PROGRESS' ? 'bg-emerald-950/20 border-l-4 border-l-emerald-500' : ''
                      }`}
                    >
                      {/* Coluna 1: ID Index */}
                      <td className="py-4 px-5 text-center font-mono text-zinc-500 font-bold text-[11px]">
                        {String(index + 1).padStart(2, '0')}
                      </td>

                      {/* Coluna 2: Cliente */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl border text-xs font-black flex items-center justify-center shrink-0 transition-colors shadow-inner ${
                            liveStatus === 'IN_PROGRESS'
                              ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400'
                              : 'bg-zinc-800 border-zinc-700/80 text-zinc-200 group-hover:border-brand-neon/60 group-hover:text-brand-neon'
                          }`}>
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-white text-sm group-hover:text-brand-neon transition-colors truncate flex items-center gap-2">
                              {item.client}
                              {liveStatus === 'IN_PROGRESS' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Ao Vivo
                                </span>
                              )}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              Clínica / Médico Gerenciado
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Coluna 3: Gestor de Tráfego */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${managerStyle}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                          {item.manager}
                        </span>
                      </td>

                      {/* Coluna 4: Social Media */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${socialMediaStyle}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                          {socialMediaName}
                        </span>
                      </td>

                      {/* Coluna 5: OKR (Reunião) */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {pending ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold text-xs shadow-xs">
                            <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{item.schedule || 'Agendar'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className={`inline-flex items-center gap-1.5 font-semibold px-3 py-1 rounded-lg border ${
                              liveStatus === 'IN_PROGRESS'
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                                : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-200'
                            }`}>
                              <Clock className={`w-3.5 h-3.5 ${liveStatus === 'IN_PROGRESS' ? 'text-emerald-400 animate-spin' : 'text-brand-neon'}`} />
                              <span>{item.schedule}</span>
                            </div>

                            {/* Live Badge Status */}
                            {liveStatus === 'IN_PROGRESS' && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 animate-pulse">
                                Em andamento agora
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Coluna 6: Ações */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                            title="Editar cliente"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClient(item.id, item.client)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-700 hover:border-rose-500/30 transition-colors cursor-pointer"
                            title="Remover cliente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Popup Interativo (Cards Clicáveis) */}
      {popupConfig && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPopupConfig(null)}
        >
          <div 
            className="bg-brand-sidebar border border-brand-border rounded-2xl max-w-2xl w-full shadow-2xl p-6 space-y-5 text-white animate-scaleUp max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Topo do Popup */}
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon">
                  {popupConfig.icon === 'calendar' && <CalendarDays className="w-5 h-5" />}
                  {popupConfig.icon === 'activity' && <Activity className="w-5 h-5 text-emerald-400" />}
                  {popupConfig.icon === 'hourglass' && <Hourglass className="w-5 h-5 text-amber-400" />}
                  {popupConfig.icon === 'check' && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                  {popupConfig.icon === 'user' && <UserCheck className="w-5 h-5 text-purple-400" />}
                  {popupConfig.icon === 'sparkles' && <Sparkles className="w-5 h-5 text-pink-400" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {popupConfig.title}
                  </h3>
                  <span className="text-xs text-zinc-400">
                    {popupConfig.subtitle}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPopupConfig(null)}
                className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Busca Rápida dentro do Popup */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Filtrar por cliente, gestor ou horário..."
                value={popupSearch}
                onChange={(e) => setPopupSearch(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon"
              />
              {popupSearch && (
                <button
                  type="button"
                  onClick={() => setPopupSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Lista com Scroll */}
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {filteredPopupItems.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500">
                  Nenhum item correspondente encontrado.
                </div>
              ) : (
                filteredPopupItems.map((item, idx) => {
                  const managerStyle = getManagerBadgeStyle(item.manager);
                  const smStyle = getSocialMediaBadgeStyle(item.socialMedia);
                  return (
                    <div 
                      key={item.id || idx}
                      className="p-3.5 rounded-xl bg-brand-card border border-brand-border/80 hover:border-brand-neon/40 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-black text-zinc-300 shrink-0">
                          {item.client.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs truncate">
                              {item.client}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${managerStyle}`}>
                              {item.manager}
                            </span>
                            {item.socialMedia && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${smStyle}`}>
                                {item.socialMedia}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-brand-neon" />
                            <span>{item.schedule}</span>
                            {item.timeRemainingText && <span className="text-emerald-400 font-bold">• {item.timeRemainingText}</span>}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.liveStatus === 'IN_PROGRESS' && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold uppercase animate-pulse">
                            Em Reunião
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setPopupConfig(null);
                            const origClient = clients.find(c => c.id === item.id);
                            if (origClient) handleOpenEditModal(origClient);
                          }}
                          className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé do Popup */}
            <div className="pt-3 border-t border-brand-border flex items-center justify-between text-xs text-zinc-400">
              <span className="text-[11px] font-mono">
                Pressione <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 border border-zinc-700">ESC</kbd> para fechar
              </span>

              <button
                type="button"
                onClick={() => setPopupConfig(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal de Cadastro & Edição de Cliente */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-brand-sidebar border border-brand-border rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-5 text-white animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
                  </h3>
                  <span className="text-xs text-zinc-400">
                    Defina o cliente, gestor, social media e horário de OKR
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Campo 1: Nome do Cliente / Clínica */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-brand-neon" />
                  Nome do Cliente / Clínica *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Clínica Harmonize Pro ou Dra. Samantha"
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-all"
                />
              </div>

              {/* Campo 2: Gestor de Tráfego */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-brand-neon" />
                  Gestor de Tráfego Responsável *
                </label>
                <select
                  value={formManager}
                  onChange={(e) => setFormManager(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-neon transition-all cursor-pointer"
                >
                  <option value="Jhonattan">Jhonattan (Gestor)</option>
                  <option value="Wilhian">Wilhian (Gestor)</option>
                  <option value="Maisa">Maisa (Gestora)</option>
                  <option value="Vinicius">Vinicius (Gestor)</option>
                  <option value="Vinicius / Yan Ferreira">Vinicius / Yan Ferreira</option>
                </select>
              </div>

              {/* Campo 3: Social Media */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  Social Media Responsável *
                </label>
                <select
                  value={formSocialMedia}
                  onChange={(e) => setFormSocialMedia(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-neon transition-all cursor-pointer"
                >
                  <option value="Clara Braga">Clara Braga (Social Media)</option>
                  <option value="Gabriele Dias">Gabriele Dias (Social Media)</option>
                  <option value="Sara Silva">Sara Silva (Social Media)</option>
                </select>
              </div>

              {/* Campo 4: Horário do OKR */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-neon" />
                    Horário da Reunião de OKR
                  </span>
                </label>

                {/* Tipo de Horário Switcher */}
                <div className="grid grid-cols-2 gap-2 bg-brand-bg p-1 rounded-xl border border-brand-border">
                  <button
                    type="button"
                    onClick={() => {
                      setFormScheduleType('CUSTOM');
                      setFormCustomSchedule(`${formDayOfWeek} - ${formTime}`);
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      formScheduleType === 'CUSTOM'
                        ? 'bg-zinc-800 text-white shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Horário Definido
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormScheduleType('PENDING');
                      setFormCustomSchedule('Agendar');
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formScheduleType === 'PENDING'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Pendente / Agendar
                  </button>
                </div>

                {formScheduleType === 'CUSTOM' ? (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                          Dia da Semana:
                        </label>
                        <select
                          value={formDayOfWeek}
                          onChange={(e) => {
                            setFormDayOfWeek(e.target.value);
                            setFormCustomSchedule(`${e.target.value} - ${formTime}`);
                          }}
                          className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-neon transition-all cursor-pointer"
                        >
                          <option value="Segunda">Segunda-feira</option>
                          <option value="Terça">Terça-feira</option>
                          <option value="Quarta">Quarta-feira</option>
                          <option value="Quinta">Quinta-feira</option>
                          <option value="Sexta">Sexta-feira</option>
                          <option value="Sábado">Sábado</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                          Horário:
                        </label>
                        <input
                          type="time"
                          value={formTime}
                          onChange={(e) => {
                            setFormTime(e.target.value);
                            setFormCustomSchedule(`${formDayOfWeek} - ${e.target.value}`);
                          }}
                          className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-neon transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                        Texto de Exibição Formatado:
                      </label>
                      <input
                        type="text"
                        value={formCustomSchedule}
                        onChange={(e) => setFormCustomSchedule(e.target.value)}
                        placeholder="Ex: Sexta - 10:00"
                        className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-neon font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Este cliente ficará marcado com alerta de <b>"Agendar"</b> na tabela.</span>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-neon hover:bg-brand-neonHover text-black text-xs font-black shadow-md shadow-brand-neon/20 transition-all cursor-pointer"
                >
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
