export interface DateInfo {
  year: number;
  month: number;
  day: number;
  dateStr: string;      // YYYY-MM-DD
  shortDate: string;    // DD/MM/YY
}

export function getDateInAccountTimezone(d: Date = new Date(), timezone = 'America/Sao_Paulo'): DateInfo {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const dateStr = formatter.format(d); // Returns YYYY-MM-DD
    const [yStr, mStr, dStr] = dateStr.split('-');
    const year = parseInt(yStr);
    const month = parseInt(mStr);
    const day = parseInt(dStr);
    const shortDate = `${dStr}/${mStr}/${yStr.slice(2)}`;
    return { year, month, day, dateStr, shortDate };
  } catch (e) {
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const mStr = String(month).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    return {
      year,
      month,
      day,
      dateStr: `${year}-${mStr}-${dStr}`,
      shortDate: `${dStr}/${mStr}/${String(year).slice(2)}`
    };
  }
}

export function getTodayRange(timezone = 'America/Sao_Paulo') {
  const info = getDateInAccountTimezone(new Date(), timezone);
  return {
    startDate: info.dateStr,
    endDate: info.dateStr,
    label: `Hoje (${info.shortDate})`
  };
}

export function getYesterdayRange(timezone = 'America/Sao_Paulo') {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const info = getDateInAccountTimezone(d, timezone);
  return {
    startDate: info.dateStr,
    endDate: info.dateStr,
    label: `Ontem (${info.shortDate})`
  };
}

export function getLast7DaysRange(timezone = 'America/Sao_Paulo') {
  const todayInfo = getDateInAccountTimezone(new Date(), timezone);
  const startD = new Date();
  startD.setDate(startD.getDate() - 6);
  const startInfo = getDateInAccountTimezone(startD, timezone);

  return {
    startDate: startInfo.dateStr,
    endDate: todayInfo.dateStr,
    label: `${startInfo.shortDate} - ${todayInfo.shortDate}`
  };
}

export function getThisMonthRange(timezone = 'America/Sao_Paulo') {
  const todayInfo = getDateInAccountTimezone(new Date(), timezone);
  const mStr = String(todayInfo.month).padStart(2, '0');
  const startDate = `${todayInfo.year}-${mStr}-01`;
  const startShort = `01/${mStr}/${String(todayInfo.year).slice(2)}`;

  return {
    startDate,
    endDate: todayInfo.dateStr,
    label: `${startShort} - ${todayInfo.shortDate}`
  };
}

export function getLastMonthRange(timezone = 'America/Sao_Paulo') {
  const todayInfo = getDateInAccountTimezone(new Date(), timezone);
  const prevMonthDate = new Date(todayInfo.year, todayInfo.month - 2, 1);
  const lastDayPrevMonth = new Date(todayInfo.year, todayInfo.month - 1, 0);

  const startInfo = getDateInAccountTimezone(prevMonthDate, timezone);
  const endInfo = getDateInAccountTimezone(lastDayPrevMonth, timezone);

  return {
    startDate: startInfo.dateStr,
    endDate: endInfo.dateStr,
    label: `${startInfo.shortDate} - ${endInfo.shortDate}`
  };
}

export function formatDateRangeLabel(startDate: string, endDate: string, timezone = 'America/Sao_Paulo'): string {
  const todayRange = getTodayRange(timezone);
  const yesterdayRange = getYesterdayRange(timezone);

  const formatDateDisplay = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const y = parts[0].slice(2);
    const m = parts[1];
    const d = parts[2];
    return `${d}/${m}/${y}`;
  };

  if (startDate === endDate) {
    if (startDate === todayRange.startDate) {
      return `Hoje (${formatDateDisplay(startDate)})`;
    }
    if (startDate === yesterdayRange.startDate) {
      return `Ontem (${formatDateDisplay(startDate)})`;
    }
    return formatDateDisplay(startDate);
  }

  return `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`;
}
