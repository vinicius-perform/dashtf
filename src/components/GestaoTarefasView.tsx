import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  MetaAdAccount 
} from '../types/meta';
import { 
  getCurrentWeekDays, 
  getCountdownToNextMonday, 
  checkLateStatus,
  getFortalezaTodayDate,
  WeekDayInfo
} from '../utils/tarefasTime';
import { 
  fetchWeeklyCheckinsMap, 
  upsertCheckin, 
  clearWeeklyCheckins,
  fetchEncaminhamentos,
  createEncaminhamento,
  updateEncaminhamentoStatus,
  deleteEncaminhamento,
  Encaminhamento,
  WeeklyCheckinState
} from '../services/gestaoTarefasService';
import { 
  fetchAgencyPortfolio, 
  AgencyPortfolioItem 
} from '../services/agencyPortfolioService';
import { 
  CalendarCheck, 
  Clock, 
  RotateCcw, 
  Plus, 
  Check, 
  AlertTriangle, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Calendar,
  Building,
  ArrowRight,
  Filter,
  CheckSquare,
  Calculator,
  Palette,
  X
} from 'lucide-react';

interface GestaoTarefasViewProps {
  accounts?: MetaAdAccount[];
}

export const GestaoTarefasView: React.FC<GestaoTarefasViewProps> = ({ accounts = [] }) => {
  // 1. Calendário e Virada Automática (Fortaleza)
  const weekDays = useMemo(() => getCurrentWeekDays(), []);
  const todayStr = useMemo(() => getFortalezaTodayDate(), []);
  const startDate = weekDays[0]?.date || todayStr;
  const endDate = weekDays[weekDays.length - 1]?.date || todayStr;

  const [countdown, setCountdown] = useState(getCountdownToNextMonday());

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownToNextMonday());
    }, 60000); // Atualiza a cada minuto
    return () => clearInterval(timer);
  }, []);

  // 2. Lista de Clientes da Carteira da Agência (Supabase agency_portfolio)
  const [portfolioClients, setPortfolioClients] = useState<AgencyPortfolioItem[]>([]);

  useEffect(() => {
    fetchAgencyPortfolio().then(items => {
      if (items && items.length > 0) {
        setPortfolioClients(items);
      }
    });
  }, []);

  const activeClients = useMemo(() => {
    // 1. Prioriza a carteira oficial de clientes salva no Supabase
    if (portfolioClients && portfolioClients.length > 0) {
      return portfolioClients.map(p => ({
        id: p.account_id,
        name: p.account_name,
        raw_id: `act_${p.account_id}`,
        account_status: 1
      }));
    }
    // 2. Utiliza accounts recebidas via props
    if (accounts && accounts.length > 0) {
      const active = accounts.filter(a => a.account_status === 1);
      return (active.length > 0 ? active : accounts).map(a => ({
        id: a.id,
        name: a.name,
        raw_id: a.raw_id || `act_${a.id}`,
        account_status: a.account_status ?? 1
      }));
    }
    // 3. Fallback inicial
    return [
      { id: '1115861513053539', name: 'CA02 - FA', account_status: 1, raw_id: 'act_1115861513053539' },
      { id: '858751867277029', name: 'CA04 - Paraíso da Baleia', account_status: 1, raw_id: 'act_858751867277029' },
      { id: '977087437378962', name: 'CA01 - Dot Kayo', account_status: 1, raw_id: 'act_977087437378962' },
      { id: '448128631941716', name: 'Silvia Bastos Almeida (#advogadoce)', account_status: 1, raw_id: 'act_448128631941716' }
    ];
  }, [portfolioClients, accounts]);

  // 3. Estado dos Check-ins da Semana
  const [checkinsMap, setCheckinsMap] = useState<Record<string, WeeklyCheckinState>>({});
  const [isCheckinsLoading, setIsCheckinsLoading] = useState(true);

  const loadCheckins = useCallback(async () => {
    setIsCheckinsLoading(true);
    try {
      const data = await fetchWeeklyCheckinsMap(startDate, endDate);
      setCheckinsMap(data);
    } finally {
      setIsCheckinsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadCheckins();
  }, [loadCheckins]);

  // Manipulador de clique no Checkbox (Criativo ou Calculadora)
  const handleToggleCheckin = useCallback(async (
    clientId: string,
    date: string,
    type: 'criativo' | 'calculadora'
  ) => {
    const key = `${clientId}_${date}`;
    const current = checkinsMap[key] || { criativo_done: false, calculadora_done: false };
    
    const updated: WeeklyCheckinState = {
      ...current,
      [type === 'criativo' ? 'criativo_done' : 'calculadora_done']: !current[type === 'criativo' ? 'criativo_done' : 'calculadora_done']
    };

    // Atualização Otimista Imediata
    setCheckinsMap(prev => ({ ...prev, [key]: updated }));

    // Persistência no Supabase
    await upsertCheckin(clientId, date, updated.criativo_done, updated.calculadora_done);
  }, [checkinsMap]);

  // 4. Progresso de Contas em Dia (do Dia Atual)
  const progressStats = useMemo(() => {
    const total = activeClients.length;
    if (total === 0) return { inDayCount: 0, total: 0, percent: 0 };

    let inDayCount = 0;
    activeClients.forEach(client => {
      const key = `${client.id}_${todayStr}`;
      const state = checkinsMap[key];
      // Conta em dia = Criativo e Calculadora marcados para o dia de hoje
      if (state?.criativo_done && state?.calculadora_done) {
        inDayCount++;
      }
    });

    const percent = Math.round((inDayCount / total) * 100);
    return { inDayCount, total, percent };
  }, [activeClients, checkinsMap, todayStr]);

  // 5. Modal de Confirmação: Zerar Semana
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleConfirmResetWeek = async () => {
    setIsResetting(true);
    try {
      await clearWeeklyCheckins(startDate, endDate);
      setCheckinsMap({});
      setIsResetModalOpen(false);
    } catch (err) {
      console.error('Falha ao zerar semana:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // 6. Estado dos Encaminhamentos (Tarefas Avulsas)
  const [encaminhamentos, setEncaminhamentos] = useState<Encaminhamento[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState(true);

  // Form de Novo Encaminhamento
  const [newClientId, setNewClientId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState(todayStr);
  const [newStatus, setNewStatus] = useState<Encaminhamento['status']>('A fazer');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Inicializa select com o primeiro cliente
  useEffect(() => {
    if (activeClients.length > 0 && !newClientId) {
      setNewClientId(activeClients[0].id);
    }
  }, [activeClients, newClientId]);

  const loadTasks = useCallback(async () => {
    setIsTasksLoading(true);
    try {
      const list = await fetchEncaminhamentos();
      setEncaminhamentos(list);
    } finally {
      setIsTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim() || !newClientId || !newDueDate) return;

    setIsAddingTask(true);
    try {
      const created = await createEncaminhamento({
        client_id: newClientId,
        description: newDescription.trim(),
        due_date: newDueDate,
        status: newStatus
      });
      setEncaminhamentos(prev => [created, ...prev]);
      setNewDescription('');
    } catch (err) {
      console.error('Falha ao criar encaminhamento:', err);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleUpdateStatus = async (id: string, nextStatus: Encaminhamento['status']) => {
    setEncaminhamentos(prev =>
      prev.map(t => (t.id === id ? { ...t, status: nextStatus } : t))
    );
    await updateEncaminhamentoStatus(id, nextStatus);
  };

  const handleDeleteTask = async (id: string) => {
    setEncaminhamentos(prev => prev.filter(t => t.id !== id));
    await deleteEncaminhamento(id);
  };

  // Helpers para encontrar nome do cliente
  const getClientName = useCallback((clientId: string) => {
    const found = activeClients.find(c => c.id === clientId);
    return found ? found.name : `Conta ${clientId}`;
  }, [activeClients]);

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto select-none">
      
      {/* HEADER SUPERIOR: TÍTULO, VIRADA AUTOMÁTICA E RESET */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-neon/15 text-brand-neon border border-brand-neon/30 shadow-lg shadow-brand-neon/10">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              <span>Gestão de Tarefas</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-neon text-black">
                F.A. Operação
              </span>
            </h1>
            <p className="text-xs text-zinc-400">
              Cronograma semanal de Criativo & Calculadora e central de encaminhamentos
            </p>
          </div>
        </div>

        {/* Contador de Virada e Botão Zerar Semana */}
        <div className="flex items-center gap-3">
          {/* Contador de Virada Automática (Segunda-feira 00:00 Fortaleza) */}
          <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2 text-xs">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400">Virada automática em:</span>
            <strong className="text-brand-neon font-black font-mono">
              {countdown.formatted}
            </strong>
          </div>

          {/* Botão Outline "Zerar semana" */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 hover:text-white border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 transition-all flex items-center gap-1.5"
            title="Reiniciar os check-ins da semana corrente"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Zerar semana</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SEÇÃO 1: CRONOGRAMA DA SEMANA (MATRIZ DE CHECK-INS)            */}
      {/* ============================================================== */}
      <div className="space-y-4">
        
        {/* Barra de Progresso no Topo */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-neon/10 text-brand-neon border border-brand-neon/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Progresso do Dia Atual ({weekDays.find(d => d.isToday)?.name || 'Hoje'})
              </span>
              <span className="text-xs text-zinc-400">
                <strong className="text-brand-neon">{progressStats.inDayCount}</strong> de <strong className="text-white">{progressStats.total}</strong> contas em dia ({progressStats.percent}%)
              </span>
            </div>
          </div>

          {/* Barra visual de progresso */}
          <div className="flex-1 max-w-md w-full">
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700/60">
              <div
                className="h-full bg-brand-neon rounded-full transition-all duration-500 shadow-sm shadow-brand-neon/40"
                style={{ width: `${Math.max(3, progressStats.percent)}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 hidden sm:block">
            Meta diária: 100% dos clientes com Criativo e Calculadora checados
          </div>
        </div>

        {/* Tabela / Grid da Semana */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4 min-w-[240px]">
                    Cliente / Conta ({activeClients.length})
                  </th>
                  {weekDays.map(day => (
                    <th 
                      key={day.date} 
                      className={`py-3 px-3 text-center min-w-[170px] ${
                        day.isToday ? 'bg-brand-neon/10 border-b-2 border-b-brand-neon text-brand-neon font-black' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{day.name}</span>
                        <span className="text-[10px] font-mono text-zinc-400">({day.formatted})</span>
                        {day.isToday && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-brand-neon text-black">
                            HOJE
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {activeClients.map(client => {
                  return (
                    <tr key={client.id} className="hover:bg-zinc-900/50 transition-colors">
                      {/* Coluna do Cliente */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs truncate max-w-[230px]" title={client.name}>
                          {client.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          ID: {client.id}
                        </div>
                      </td>

                      {/* Colunas dos 5 Dias Úteis */}
                      {weekDays.map(day => {
                        const key = `${client.id}_${day.date}`;
                        const state = checkinsMap[key] || { criativo_done: false, calculadora_done: false };
                        const isDayComplete = state.criativo_done && state.calculadora_done;

                        return (
                          <td 
                            key={day.date} 
                            className={`py-3 px-3 text-center transition-colors ${
                              day.isToday ? 'bg-brand-neon/[0.03]' : ''
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              {/* Toggle Criativo */}
                              <button
                                type="button"
                                onClick={() => handleToggleCheckin(client.id, day.date, 'criativo')}
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 active:scale-95 ${
                                  state.criativo_done
                                    ? 'bg-brand-neon text-black border-brand-neon shadow-sm shadow-brand-neon/30 font-black'
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-700/80 hover:border-zinc-500'
                                }`}
                                title="Check-in de Criativo do dia"
                              >
                                <Palette className="w-3 h-3" />
                                <span>Criativo</span>
                                {state.criativo_done && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>

                              {/* Toggle Calculadora */}
                              <button
                                type="button"
                                onClick={() => handleToggleCheckin(client.id, day.date, 'calculadora')}
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 active:scale-95 ${
                                  state.calculadora_done
                                    ? 'bg-brand-neon text-black border-brand-neon shadow-sm shadow-brand-neon/30 font-black'
                                    : 'bg-zinc-900 text-zinc-400 border-zinc-700/80 hover:border-zinc-500'
                                }`}
                                title="Check-in de Calculadora de Métricas do dia"
                              >
                                <Calculator className="w-3 h-3" />
                                <span>Calculadora</span>
                                {state.calculadora_done && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer da Matriz */}
          <div className="p-3 bg-zinc-900/60 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-brand-neon" />
                <span>Check-in concluído</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-zinc-800 border border-zinc-700" />
                <span>Pendente</span>
              </span>
            </div>
            <span className="text-zinc-500">
              Sincronização global automática em tempo real para toda a equipe
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SEÇÃO 2: ENCAMINHAMENTOS (TAREFAS AVULSAS)                      */}
      {/* ============================================================== */}
      <div className="space-y-4">
        
        {/* Header da Seção */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>Encaminhamentos</span>
              <span className="text-xs font-normal text-zinc-400">(Tarefas Avulsas por Cliente)</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Acompanhamento de prazos, entregáveis e encaminhamentos operacionais
            </p>
          </div>

          <span className="text-xs font-bold text-zinc-400">
            Total: <strong className="text-white">{encaminhamentos.length}</strong> tarefas
          </span>
        </div>

        {/* Formulário de Criação Rápida de Tarefa */}
        <form 
          onSubmit={handleCreateTask}
          className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center gap-3"
        >
          {/* Select de Cliente */}
          <div className="min-w-[200px] flex-1">
            <select
              value={newClientId}
              onChange={(e) => setNewClientId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon rounded-xl text-xs font-bold text-white outline-none"
            >
              {activeClients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição da Tarefa */}
          <div className="min-w-[280px] flex-[2]">
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Descreva a tarefa ou encaminhamento (ex: Subir criativos novos)..."
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon rounded-xl text-xs text-white placeholder-zinc-500 outline-none"
            />
          </div>

          {/* Prazo (Data) */}
          <div className="w-[140px]">
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon rounded-xl text-xs font-mono text-white outline-none"
            />
          </div>

          {/* Status Inicial */}
          <div className="w-[140px]">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 focus:border-brand-neon focus:ring-1 focus:ring-brand-neon rounded-xl text-xs font-bold text-white outline-none"
            >
              <option value="A fazer">A fazer</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Aguardando">Aguardando</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>

          {/* Botão Adicionar Tarefa */}
          <button
            type="submit"
            disabled={isAddingTask || !newDescription.trim()}
            className="px-4 py-2 rounded-xl text-xs font-black bg-brand-neon hover:bg-brand-neonHover text-black shadow-md shadow-brand-neon/20 transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Tarefa</span>
          </button>
        </form>

        {/* Tabela de Encaminhamentos */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3 px-4 min-w-[200px]">Conta / Cliente</th>
                  <th className="py-3 px-4 min-w-[320px]">Descrição da Tarefa</th>
                  <th className="py-3 px-3 min-w-[160px]">Prazo</th>
                  <th className="py-3 px-3 min-w-[150px]">Status</th>
                  <th className="py-3 px-4 w-[60px] text-center">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {isTasksLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      Carregando encaminhamentos...
                    </td>
                  </tr>
                ) : encaminhamentos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-500">
                      Nenhum encaminhamento registrado. Adicione um encaminhamento no formulário acima.
                    </td>
                  </tr>
                ) : (
                  encaminhamentos.map(task => {
                    const lateInfo = checkLateStatus(task.due_date, task.status);

                    return (
                      <tr 
                        key={task.id} 
                        className={`hover:bg-zinc-900/50 transition-colors ${
                          task.status === 'Concluído' ? 'opacity-60' : ''
                        }`}
                      >
                        {/* Conta / Cliente */}
                        <td className="py-3.5 px-4 font-bold text-white text-xs truncate max-w-[200px]">
                          {getClientName(task.client_id)}
                        </td>

                        {/* Descrição */}
                        <td className="py-3.5 px-4 text-zinc-200">
                          <span className={task.status === 'Concluído' ? 'line-through text-zinc-500' : ''}>
                            {task.description}
                          </span>
                        </td>

                        {/* Prazo com Alerta de Atraso */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-xs ${
                              lateInfo.isLate ? 'text-red-400 font-black' : 'text-zinc-300'
                            }`}>
                              {task.due_date ? task.due_date.split('-').reverse().join('/') : '—'}
                            </span>

                            {lateInfo.isLate && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Atrasado ({lateInfo.daysLate}d)</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Editável */}
                        <td className="py-3.5 px-3">
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateStatus(task.id, e.target.value as any)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors outline-none cursor-pointer ${
                              task.status === 'Concluído'
                                ? 'bg-brand-neon/15 text-brand-neon border-brand-neon/40'
                                : task.status === 'Em andamento'
                                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                                : task.status === 'Aguardando'
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            <option value="A fazer">A fazer</option>
                            <option value="Em andamento">Em andamento</option>
                            <option value="Aguardando">Aguardando</option>
                            <option value="Concluído">Concluído</option>
                          </select>
                        </td>

                        {/* Ações (Excluir) */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Excluir encaminhamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL DE SEGURANÇA: CONFIRMAR ZERAMENTO DA SEMANA              */}
      {/* ============================================================== */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-950 border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative select-none">
            
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  Confirmar Zeramento da Semana
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Tem certeza que deseja zerar os check-ins da semana de <strong>{startDate}</strong> a <strong>{endDate}</strong>?
                </p>
                <p className="text-[11px] text-red-400 font-semibold mt-2">
                  Esta ação limpará as marcações de Criativo e Calculadora para toda a equipe.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmResetWeek}
                disabled={isResetting}
                className="px-5 py-2 rounded-xl text-xs font-black bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5"
              >
                {isResetting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Zerando...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Sim, Zerar Semana</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

