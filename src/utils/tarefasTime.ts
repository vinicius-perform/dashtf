/**
 * Utilitários de Tempo e Calendário para a Gestão de Tarefas
 * Fuso horário de referência: America/Fortaleza (UTC-3)
 */

export interface WeekDayInfo {
  name: string;      // "Segunda", "Terça", etc.
  shortName: string; // "Seg", "Ter", etc.
  date: string;      // "YYYY-MM-DD"
  formatted: string; // "17/11"
  isToday: boolean;
}

/**
 * Retorna a data atual no fuso horário de Fortaleza no formato "YYYY-MM-DD"
 */
export function getFortalezaTodayDate(): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Fortaleza',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Retorna os 5 dias úteis (Segunda a Sexta) da semana corrente
 */
export function getCurrentWeekDays(): WeekDayInfo[] {
  const todayStr = getFortalezaTodayDate();
  const [year, month, day] = todayStr.split('-').map(Number);
  
  // Cria data de meio-dia no fuso local para evitar problemas com virada de meia-noite
  const refDate = new Date(year, month - 1, day, 12, 0, 0);
  const dayOfWeek = refDate.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  
  // Distância até Segunda-feira (dia 1)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() + diffToMonday);

  const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const dayShort = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

  const weekDays: WeekDayInfo[] = [];

  for (let i = 0; i < 5; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);

    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    weekDays.push({
      name: dayNames[i],
      shortName: dayShort[i],
      date: dateStr,
      formatted: `${d}/${m}`,
      isToday: dateStr === todayStr
    });
  }

  return weekDays;
}

/**
 * Calcula a contagem regressiva até a próxima segunda-feira às 00:00 (Fortaleza)
 */
export function getCountdownToNextMonday(): { days: number; hours: number; minutes: number; formatted: string } {
  const todayStr = getFortalezaTodayDate();
  const [year, month, day] = todayStr.split('-').map(Number);
  const now = new Date();

  // Encontra a segunda-feira da semana atual
  const refDate = new Date(year, month - 1, day, 12, 0, 0);
  const dayOfWeek = refDate.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() + diffToMonday);

  // Próxima segunda-feira às 00:00:00
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  nextMonday.setHours(0, 0, 0, 0);

  const diffMs = Math.max(0, nextMonday.getTime() - now.getTime());
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    days,
    hours,
    minutes,
    formatted: `${days}d ${hours}h ${minutes}m`
  };
}

/**
 * Calcula se uma data de prazo está atrasada em relação a hoje e quantos dias de atraso
 */
export function checkLateStatus(dueDateStr: string, status: string): { isLate: boolean; daysLate: number } {
  if (status === 'Concluído' || !dueDateStr) {
    return { isLate: false, daysLate: 0 };
  }

  const todayStr = getFortalezaTodayDate();
  if (dueDateStr < todayStr) {
    const due = new Date(dueDateStr + 'T12:00:00');
    const today = new Date(todayStr + 'T12:00:00');
    const diffMs = today.getTime() - due.getTime();
    const daysLate = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    return { isLate: true, daysLate };
  }

  return { isLate: false, daysLate: 0 };
}

