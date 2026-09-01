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
  ArrowRight
} from 'lucide-react';

export interface TeamOkrItem {
  id: string | number;
  client: string;
  manager: string;
  schedule: string;
  createdAt?: string;
}

export interface OkrPopupItem {
  id: string | number;
  client: string;
  manager: string;
  schedule: string;
  timeStr?: string;
  liveStatus?: 'IN_PROGRESS' | 'UPCOMING' | 'COMPLETED' | 'PENDING';
  timeRemainingText?: string;
}

export interface OkrPopupConfig {
  title: string;
  subtitle: string;
  category: 'all_today' | 'live' | 'upcoming' | 'completed' | 'manager';
  icon: 'calendar' | 'activity' | 'hourglass' | 'check' | 'user';
  items: OkrPopupItem[];
}

export const STORAGE_KEY = 'dashtf_team_okr_clients_v41';

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
  { id: 1, client: 'Alessandra Montera', manager: 'Jhonattan', schedule: 'Sexta - 10:00' },
  { id: 2, client: 'Bodyincision', manager: 'Jhonattan', schedule: 'Sexta - 11:00' },
  { id: 3, client: 'Clínica Doctors (Dr. Fernando)', manager: 'Jhonattan', schedule: 'Sexta - sem horário' },
  { id: 4, client: 'Coife Odonto', manager: 'Wilhian', schedule: 'Terça - 08:30' },
  { id: 5, client: 'Dermo Clean', manager: 'Maisa', schedule: 'Agendar' },
  { id: 6, client: 'Diego Padão', manager: 'Wilhian', schedule: 'Quarta - 08:30' },
  { id: 7, client: 'Diego Patrick', manager: 'Wilhian', schedule: 'Agendar' },
  { id: 8, client: 'Dr. Derlis Teran', manager: 'Wilhian', schedule: 'Quarta - 15:00' },
  { id: 9, client: 'Dr. Gustavo Machado', manager: 'Jhonattan', schedule: 'Agendar' },
  { id: 10, client: 'Dr. Kleison Resende', manager: 'Wilhian', schedule: 'Sexta - 08:30' },
  { id: 11, client: 'Dr. Nicolas', manager: 'Wilhian', schedule: 'Segunda - 09:00' },
  { id: 12, client: 'Dr. Rafael Almenara', manager: 'Wilhian', schedule: 'Sexta - 14:00' },
  { id: 13, client: 'Dr. Cris', manager: 'Wilhian', schedule: 'Quarta - 14:00' },
  { id: 14, client: 'Dr. Fernando Silveira', manager: 'Jhonattan', schedule: 'Quarta - 08:30' },
  { id: 15, client: 'Dr. Gabriel', manager: 'Wilhian', schedule: 'Agendar' },
  { id: 16, client: 'Dr. Gustavo Rocha', manager: 'Wilhian', schedule: 'Agendar' },
  { id: 17, client: 'Dr. Hebert Donato', manager: 'Maisa', schedule: 'Quarta - 13:30' },
  { id: 18, client: 'Dr. Jair Dacás', manager: 'Jhonattan', schedule: 'Quarta - 09:30' },
  { id: 19, client: 'Dr. Leandro Capuchinho', manager: 'Wilhian', schedule: 'Terça - 14:00' },
  { id: 20, client: 'Dr. Leonardo Chiaradia', manager: 'Jhonattan', schedule: 'Agendar' },
  { id: 21, client: 'Dr. Molino', manager: 'Maisa', schedule: 'Agendar' },
  { id: 22, client: 'Dr. Rodrigo Coelho', manager: 'Maisa', schedule: 'Terça - 10:00' },
  { id: 23, client: 'Dr. Rodrigo Vieira', manager: 'Jhonattan', schedule: 'Terça - 14:00' },
  { id: 24, client: 'Dra. Izabelita', manager: 'Jhonattan', schedule: 'Agendar' },
  { id: 25, client: 'Dra. Mariella', manager: 'Vinicius Tráfego', schedule: 'Quarta - 10:30' },
  { id: 26, client: 'Dra. Rafaela Nunes', manager: 'Jhonattan', schedule: 'Agendar' },
  { id: 27, client: 'Dra. Aline Pereira', manager: 'Wilhian', schedule: 'Terça - 15:00' },
  { id: 28, client: 'Dra. Bruna Emanuelli', manager: 'Wilhian', schedule: 'Agendar' },
  { id: 29, client: 'Dra. Camila Citra', manager: 'Maisa', schedule: 'Terça - 11:00' },
  { id: 30, client: 'Dra. Dora', manager: 'Jhonattan', schedule: 'Agendar' },
  { id: 31, client: 'Dra. Keyla Klava', manager: 'Jhonattan', schedule: 'Terça - 10:00' },
  { id: 32, client: 'Dra. Marcela Fiel', manager: 'Jhonattan', schedule: 'Sexta - 11:00' },
  { id: 33, client: 'Dra. Paola Telles', manager: 'Wilhian', schedule: 'Quarta - 09:30' },
  { id: 34, client: 'Dra. Paula', manager: 'Wilhian', schedule: 'Agendar' },
  { id: 35, client: 'Dra. Rubenyta Leal', manager: 'Wilhian', schedule: 'Terça - 11:00' },
  { id: 36, client: 'Dra. Samara Pighinelli', manager: 'Vinicius Tráfego / Yan Ferreira', schedule: 'Quinta - 17:00' },
  { id: 37, client: 'Dra. Silvia', manager: 'Maisa', schedule: 'Segunda - 15:00' },
  { id: 38, client: 'Dra. Tatiana Fagnani', manager: 'Jhonattan', schedule: 'Segunda - 10:00' },
  { id: 39, client: 'FA Kite Surf', manager: 'Wilhian', schedule: 'Agendar' },
  { id: 40, client: 'Flegon', manager: 'Wilhian', schedule: 'Sexta - 14:00' },
  { id: 41, client: 'Tiago Prause', manager: 'Wilhian', schedule: 'Terça - 17:00' }
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

  // Persistent client list loaded from localStorage (defaulting to the 41 registered clients)
  const [clients, setClients] = useState<TeamOkrItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= 35) return parsed;
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

  // Manager volume KPIs
  const kpis = useMemo(() => {
    const jhonattanList = clients.filter(item => item.manager.toLowerCase().includes('jhonattan'));
    const wilhianList = clients.filter(item => item.manager.toLowerCase().includes('wilhian'));
    const maisaList = clients.filter(item => item.manager.toLowerCase().includes('maisa'));
    const viniciusList = clients.filter(item => item.manager.toLowerCase().includes('vinicius') || item.manager.toLowerCase().includes('yan'));

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
        const matchSchedule = item.schedule.toLowerCase().includes(query);
        if (!matchClient && !matchManager && !matchSchedule) {
          return false;
        }
      }

      return true;
    });
  }, [clients, searchQuery, managerFilter, statusFilter, dayFilter, todayDayName]);

  const hasActiveFilters = searchQuery !== '' || managerFilter !== 'TODOS' || statusFilter !== 'TODOS' || dayFilter !== 'TODOS';

  const handleClearFilters = () => {
    setSearchQuery('');
    setManagerFilter('TODOS');
    setStatusFilter('TODOS');
    setDayFilter('TODOS');
  };

  // Open modal for new client
  const handleOpenAddModal = () => {
    setEditingClient(null);
    setFormClientName('');
    setFormManager('Jhonattan');
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
      setClients(prev => prev.map(c => 
        c.id === editingClient.id 
          ? { ...c, client: formClientName.trim(), manager: formManager, schedule: finalSchedule }
          : c
      ));
      showToast(`Cliente "${formClientName.trim()}" atualizado com sucesso!`);
    } else {
      const newClient: TeamOkrItem = {
        id: `cli-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        client: formClientName.trim(),
        manager: formManager,
        schedule: finalSchedule,
        createdAt: new Date().toLocaleDateString('pt-BR')
      };
      setClients(prev => [newClient, ...prev]);
      showToast(`Cliente "${formClientName.trim()}" cadastrado com sucesso!`);
    }

    setIsModalOpen(false);
  };

  // Delete client
  const handleDeleteClient = (id: string | number, clientName: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    showToast(`Cliente "${clientName}" removido da carteira.`, 'info');
  };

  // HANDLERS FOR POPUPS ON CARD CLICKS
  const handleOpenTodayOkrsPopup = () => {
    setPopupSearch('');
    setPopupConfig({
      title: `OKRs de Hoje (${todayDayName})`,
      subtitle: `${formattedTodayDate} • ${realTimeAnalysis.totalToday} reuniões agendadas para hoje`,
      category: 'all_today',
      icon: 'calendar',
      items: realTimeAnalysis.todayMeetings.map(m => ({
        id: m.item.id,
        client: m.item.client,
        manager: m.item.manager,
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
      title: 'OKRs em Andamento Agora',
      subtitle: `Reuniões de OKR ativas neste momento (${currentTimeFormatted})`,
      category: 'live',
      icon: 'activity',
      items: realTimeAnalysis.inProgress.map(m => ({
        id: m.item.id,
        client: m.item.client,
        manager: m.item.manager,
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
      title: 'Próximos OKRs de Hoje',
      subtitle: `Reuniões agendadas para ${todayDayName} que ainda vão iniciar`,
      category: 'upcoming',
      icon: 'hourglass',
      items: realTimeAnalysis.upcoming.map(m => ({
        id: m.item.id,
        client: m.item.client,
        manager: m.item.manager,
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
      title: 'OKRs Concluídos Hoje',
      subtitle: `Reuniões de ${todayDayName} cujo horário já foi finalizado`,
      category: 'completed',
      icon: 'check',
      items: realTimeAnalysis.completed.map(m => ({
        id: m.item.id,
        client: m.item.client,
        manager: m.item.manager,
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
          schedule: c.schedule,
          timeStr: parsed.timeStr || '',
          liveStatus,
          timeRemainingText
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
                Acompanhe reuniões de OKR em tempo real, cronograma do dia atual e gestão completa da carteira.
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

        {/* Banner "EM OKR NESTE MOMENTO" (Tempo Real com Identificação de Gestores Ativos) */}
        <div className="bg-brand-sidebar border border-brand-border rounded-xl p-4 space-y-3 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                realTimeAnalysis.inProgress.length > 0 ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'
              }`} />
              <span className="text-[11px] font-black uppercase text-zinc-300 tracking-wider">
                Em OKR Neste Momento
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              Duração estimada: 45–60 min por reunião
            </span>
          </div>

          {realTimeAnalysis.inProgress.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400 py-1 font-medium">
              <Radio className="w-4 h-4 text-zinc-500" />
              <span>Nenhum gestor em OKR neste horário.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {realTimeAnalysis.inProgress.map(({ item, parsed, timeRemainingText }) => (
                <div 
                  key={item.id}
                  onClick={handleOpenLiveOkrsPopup}
                  className="bg-emerald-950/30 border border-emerald-500/40 hover:border-emerald-400 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/20 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                      {item.client.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm truncate">
                          {item.client}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getManagerBadgeStyle(item.manager)}`}>
                          {item.manager}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>Início às {parsed.timeStr}</span>
                        {timeRemainingText && <span>• {timeRemainingText}</span>}
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider animate-pulse shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Em Reunião
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Top 4 KPI Cards (Volume da Carteira Geral por Gestor - Clicáveis p/ Popup) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Jhonattan */}
        <div 
          onClick={() => handleOpenManagerOkrsPopup('Jhonattan')}
          className={`bg-brand-card border rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all group cursor-pointer hover:border-blue-500/60 hover:-translate-y-0.5 ${
            managerFilter === 'Jhonattan' 
              ? 'border-blue-500 ring-1 ring-blue-500/50 bg-blue-950/10' 
              : 'border-brand-border'
          }`}
          title="Clique para ver todas as reuniões e clientes do Jhonattan"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-blue-400 uppercase tracking-wider block">
                Jhonattan
              </span>
              <span className="text-[10px] bg-blue-900/40 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-800/50">
                Gestor
              </span>
            </div>
            <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
              {kpis.jhonattan.total}
              <span className="text-xs text-zinc-400 font-semibold">clientes</span>
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-2">
              <span className="text-emerald-400 font-medium">{kpis.jhonattan.scheduled} com horário</span>
              {kpis.jhonattan.pending > 0 && (
                <span className="text-rose-400 font-medium flex items-center gap-0.5">
                  • {kpis.jhonattan.pending} a agendar
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-base shadow-lg shadow-blue-900/30 group-hover:scale-105 transition-transform">
            JH
          </div>
        </div>

        {/* Card 2: Wilhian */}
        <div 
          onClick={() => handleOpenManagerOkrsPopup('Wilhian')}
          className={`bg-brand-card border rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all group cursor-pointer hover:border-emerald-500/60 hover:-translate-y-0.5 ${
            managerFilter === 'Wilhian' 
              ? 'border-emerald-500 ring-1 ring-emerald-500/50 bg-emerald-950/10' 
              : 'border-brand-border'
          }`}
          title="Clique para ver todas as reuniões e clientes do Wilhian"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider block">
                Wilhian
              </span>
              <span className="text-[10px] bg-emerald-900/40 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-800/50">
                Gestor
              </span>
            </div>
            <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
              {kpis.wilhian.total}
              <span className="text-xs text-zinc-400 font-semibold">clientes</span>
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-2">
              <span className="text-emerald-400 font-medium">{kpis.wilhian.scheduled} com horário</span>
              {kpis.wilhian.pending > 0 && (
                <span className="text-rose-400 font-medium flex items-center gap-0.5">
                  • {kpis.wilhian.pending} a agendar
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-base shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
            WH
          </div>
        </div>

        {/* Card 3: Maisa */}
        <div 
          onClick={() => handleOpenManagerOkrsPopup('Maisa')}
          className={`bg-brand-card border rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all group cursor-pointer hover:border-purple-500/60 hover:-translate-y-0.5 ${
            managerFilter === 'Maisa' 
              ? 'border-purple-500 ring-1 ring-purple-500/50 bg-purple-950/10' 
              : 'border-brand-border'
          }`}
          title="Clique para ver todas as reuniões e clientes da Maisa"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider block">
                Maisa
              </span>
              <span className="text-[10px] bg-purple-900/40 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-800/50">
                Gestora
              </span>
            </div>
            <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
              {kpis.maisa.total}
              <span className="text-xs text-zinc-400 font-semibold">clientes</span>
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-2">
              <span className="text-emerald-400 font-medium">{kpis.maisa.scheduled} com horário</span>
              {kpis.maisa.pending > 0 && (
                <span className="text-rose-400 font-medium flex items-center gap-0.5">
                  • {kpis.maisa.pending} a agendar
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-700 flex items-center justify-center text-white font-black text-base shadow-lg shadow-purple-900/30 group-hover:scale-105 transition-transform">
            MA
          </div>
        </div>

        {/* Card 4: Vinicius */}
        <div 
          onClick={() => handleOpenManagerOkrsPopup('Vinicius')}
          className={`bg-brand-card border rounded-2xl p-5 shadow-lg flex items-center justify-between transition-all group cursor-pointer hover:border-orange-500/60 hover:-translate-y-0.5 ${
            managerFilter === 'Vinicius' 
              ? 'border-orange-500 ring-1 ring-orange-500/50 bg-orange-950/10' 
              : 'border-brand-border'
          }`}
          title="Clique para ver todas as reuniões e clientes do Vinicius"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-orange-400 uppercase tracking-wider block">
                Vinicius
              </span>
              <span className="text-[10px] bg-orange-900/40 text-orange-300 font-bold px-2 py-0.5 rounded-full border border-orange-800/50">
                Tráfego
              </span>
            </div>
            <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
              {kpis.vinicius.total}
              <span className="text-xs text-zinc-400 font-semibold">clientes</span>
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-2">
              <span className="text-emerald-400 font-medium">{kpis.vinicius.scheduled} com horário</span>
              {kpis.vinicius.pending > 0 && (
                <span className="text-rose-400 font-medium flex items-center gap-0.5">
                  • {kpis.vinicius.pending} a agendar
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-orange-900/30 group-hover:scale-105 transition-transform">
            VN
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
              placeholder="Buscar cliente, gestor ou horário..."
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

          {/* Filtro por Dia da Semana / Hoje */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-zinc-400 hidden sm:inline-block">
              Dia:
            </label>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value as any)}
              className={`bg-brand-bg border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-brand-neon transition-all cursor-pointer ${
                dayFilter === 'HOJE' ? 'border-brand-neon text-brand-neon font-black' : 'border-brand-border text-white'
              }`}
            >
              <option value="TODOS">Todos os Dias</option>
              <option value="HOJE">🔥 Apenas Hoje ({todayDayName})</option>
              <option value="Segunda">Segunda-feira</option>
              <option value="Terça">Terça-feira</option>
              <option value="Quarta">Quarta-feira</option>
              <option value="Quinta">Quinta-feira</option>
              <option value="Sexta">Sexta-feira</option>
            </select>
          </div>

          {/* Seletor por Gestor */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-zinc-400 hidden sm:inline-block">
              Gestor:
            </label>
            <select
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value as any)}
              className="bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-neon transition-all cursor-pointer"
            >
              <option value="TODOS">Todos os Gestores</option>
              <option value="Jhonattan">Jhonattan</option>
              <option value="Wilhian">Wilhian</option>
              <option value="Maisa">Maisa</option>
              <option value="Vinicius">Vinicius Tráfego</option>
            </select>
          </div>

          {/* Seletor por Status do OKR */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-zinc-400 hidden sm:inline-block">
              Status OKR:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-neon transition-all cursor-pointer"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="COM_HORARIO">Com Horário Definido</option>
              <option value="PENDENTES">Pendentes / Agendar</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs text-zinc-400 hover:text-brand-neon flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}

          {/* Sincronizar 41 Clientes */}
          <button
            type="button"
            onClick={() => {
              setClients(initialClientsList);
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(initialClientsList));
              } catch (e) {
                console.error(e);
              }
              showToast('Lista de 41 clientes restaurada com sucesso!');
            }}
            className="text-xs text-zinc-400 hover:text-brand-neon flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700/80 bg-brand-bg hover:bg-zinc-800/80 transition-colors cursor-pointer ml-auto sm:ml-0"
            title="Recarregar todos os 41 clientes oficiais cadastrados"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restaurar 41 Clientes</span>
          </button>
        </div>

        <div className="text-xs text-zinc-400 font-medium ml-auto whitespace-nowrap">
          Exibindo <span className="text-white font-bold">{filteredData.length}</span> de {clients.length} clientes
        </div>
      </div>

      {/* 5. Tabela de Gerenciamento */}
      {clients.length === 0 ? (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-12 text-center shadow-xl">
          <div className="flex flex-col items-center justify-center gap-3 text-zinc-400 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-brand-neon/10 border border-brand-neon/30 flex items-center justify-center text-brand-neon shadow-inner">
              <Building2 className="w-8 h-8 stroke-[1.75]" />
            </div>
            <h3 className="text-base font-extrabold text-white">
              Nenhum cliente cadastrado ainda
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Inicie o gerenciamento da sua equipe cadastrando o primeiro cliente, vinculando o gestor de tráfego responsável e definindo o dia/horário da reunião de OKR.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-2 bg-brand-neon hover:bg-brand-neonHover text-black font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg shadow-brand-neon/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Cadastrar Primeiro Cliente</span>
            </button>
          </div>
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
                  <th className="py-3.5 px-5">OKR (Reunião)</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-xs">
                {filteredData.map((item, index) => {
                  const pending = isSchedulePending(item.schedule);
                  const managerStyle = getManagerBadgeStyle(item.manager);
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

                      {/* Coluna 4: OKR (Reunião) */}
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
                            {liveStatus === 'UPCOMING' && (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                Hoje
                              </span>
                            )}
                            {liveStatus === 'COMPLETED' && (
                              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700">
                                Concluída hoje
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Coluna 5: Ações (Editar e Excluir) */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-brand-neon border border-zinc-700 transition-colors cursor-pointer"
                            title="Editar cliente"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClient(item.id, item.client)}
                            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-700 hover:border-rose-500/30 transition-colors cursor-pointer"
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

          {filteredData.length === 0 && (
            <div className="p-12 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
              <Filter className="w-8 h-8 text-zinc-600 mb-1" />
              <span className="text-sm font-bold text-zinc-400">Nenhum cliente encontrado para o filtro atual</span>
              <p className="text-xs text-zinc-500 max-w-sm">
                Tente ajustar o termo de pesquisa ou redefinir os seletores de gestor, dia ou status do OKR.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="mt-2 text-xs text-brand-neon hover:underline font-bold cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. POPUP INTERATIVO DE LISTAGEM DE OKRS (Ao clicar em qualquer card) */}
      {popupConfig && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setPopupConfig(null)}
        >
          <div 
            className="bg-brand-sidebar border border-brand-border rounded-2xl max-w-2xl w-full shadow-2xl p-6 space-y-4 text-white animate-scaleUp max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Topo do Popup */}
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-inner ${
                  popupConfig.icon === 'activity' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' :
                  popupConfig.icon === 'hourglass' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                  popupConfig.icon === 'check' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                  popupConfig.icon === 'user' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                  'bg-brand-neon/15 text-brand-neon border border-brand-neon/30'
                }`}>
                  {popupConfig.icon === 'activity' && <Activity className="w-5 h-5" />}
                  {popupConfig.icon === 'hourglass' && <Hourglass className="w-5 h-5" />}
                  {popupConfig.icon === 'check' && <CheckCircle2 className="w-5 h-5" />}
                  {popupConfig.icon === 'user' && <UserCheck className="w-5 h-5" />}
                  {popupConfig.icon === 'calendar' && <CalendarDays className="w-5 h-5" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-white text-base">
                      {popupConfig.title}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-zinc-800 text-brand-neon border border-zinc-700">
                      {popupConfig.items.length} {popupConfig.items.length === 1 ? 'reunião' : 'reuniões'}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400 block mt-0.5">
                    {popupConfig.subtitle}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPopupConfig(null)}
                className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Fechar (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input de Busca rápida no Popup */}
            {popupConfig.items.length > 4 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filtrar por cliente, gestor ou horário nesta lista..."
                  value={popupSearch}
                  onChange={(e) => setPopupSearch(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon transition-all"
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
            )}

            {/* Lista com Rolagem */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[180px]">
              {filteredPopupItems.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
                  <Radio className="w-8 h-8 text-zinc-600 mb-1" />
                  <span className="text-sm font-bold text-zinc-400">Nenhuma reunião encontrada nesta categoria</span>
                  <span className="text-xs text-zinc-500">
                    {popupSearch ? 'Nenhum resultado corresponde à sua pesquisa interna.' : 'No momento não há registros para esta visualização.'}
                  </span>
                </div>
              ) : (
                filteredPopupItems.map((item, idx) => {
                  const initials = item.client.slice(0, 2).toUpperCase();
                  const pending = isSchedulePending(item.schedule);

                  return (
                    <div 
                      key={`${item.id}-${idx}`}
                      className={`border rounded-xl p-3.5 flex items-center justify-between gap-3 transition-all hover:border-brand-neon/60 ${
                        item.liveStatus === 'IN_PROGRESS' 
                          ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm' 
                          : 'bg-brand-bg/80 border-brand-border/80'
                      }`}
                    >
                      {/* Cliente e Avatar */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border ${
                          item.liveStatus === 'IN_PROGRESS'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-200'
                        }`}>
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-extrabold text-white text-xs truncate flex items-center gap-2">
                            {item.client}
                            {item.liveStatus === 'IN_PROGRESS' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Ao Vivo
                              </span>
                            )}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getManagerBadgeStyle(item.manager)}`}>
                              {item.manager}
                            </span>
                            {item.timeRemainingText && (
                              <span className="text-[10px] text-emerald-400 font-mono">
                                • {item.timeRemainingText}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Horário e Status */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          {pending ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg">
                              <AlertCircle className="w-3 h-3" />
                              Agendar
                            </span>
                          ) : (
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold border ${
                              item.liveStatus === 'IN_PROGRESS'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : item.liveStatus === 'UPCOMING'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : item.liveStatus === 'COMPLETED'
                                ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                : 'bg-zinc-800/80 text-zinc-200 border-zinc-700'
                            }`}>
                              <Clock className="w-3.5 h-3.5 text-brand-neon" />
                              <span>{item.schedule}</span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const original = clients.find(c => c.id === item.id);
                            if (original) {
                              setPopupConfig(null);
                              handleOpenEditModal(original);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-brand-neon border border-zinc-700 transition-colors cursor-pointer"
                          title="Editar este cliente"
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
                    Defina o cliente, gestor e horário de OKR
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
                  <option value="Vinicius Tráfego">Vinicius Tráfego</option>
                  <option value="Vinicius Tráfego / Yan Ferreira">Vinicius Tráfego / Yan Ferreira</option>
                </select>
              </div>

              {/* Campo 3: Horário do OKR */}
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
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-brand-neon hover:bg-brand-neonHover text-black font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-brand-neon/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
