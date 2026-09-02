export function formatCurrency(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
    return '—';
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
    return '—';
  }
  return new Intl.NumberFormat('pt-BR').format(val);
}

export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
    return '—';
  }
  return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function formatMultiplier(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '—';
  }
  return `${val.toFixed(2)}x`;
}

export const getActionValue = (actions: any[] | undefined | null, type: string): number => {
  if (!actions || !Array.isArray(actions)) return 0;
  const action = actions.find((a: any) => a?.action_type === type);
  return action ? parseInt(action.value, 10) : 0;
};

export const calculateConnectRate = (item: any): { rate: number; linkClicks: number; lpViews: number } => {
  if (!item) return { rate: 0, linkClicks: 0, lpViews: 0 };

  const actions = item.actions || item.rawRecord?.insights?.data?.[0]?.actions || item.rawRecord?.actions || [];

  // 1. Busca as visualizações de página de destino
  let lpViews = getActionValue(actions, 'landing_page_view');
  if (!lpViews && item.landingPageViews) {
    lpViews = parseInt(item.landingPageViews, 10);
  }

  // 2. Busca os cliques no link (tenta pegar da raiz primeiro, se não, busca no array)
  let linkClicks = item.inline_link_clicks !== undefined && item.inline_link_clicks !== null
    ? parseInt(item.inline_link_clicks, 10)
    : (item.clicks !== undefined && item.clicks !== null ? parseInt(item.clicks, 10) : getActionValue(actions, 'link_click'));

  if (!linkClicks && item.clicks) {
    linkClicks = parseInt(item.clicks, 10);
  }

  // 3. Calcula o Connect Rate
  const rate = linkClicks > 0 ? (lpViews / linkClicks) * 100 : 0;

  return { rate, linkClicks, lpViews };
};
