import { MetaAd } from '../types/meta';

export type AdSuggestionType = 'PAUSAR' | 'FADIGA' | 'REPLICAR' | 'MANTER' | 'ATENCAO' | 'OBSERVAR';

export interface AdSuggestionInfo {
  type: AdSuggestionType;
  label: string;
  reason: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconName: 'pause' | 'flame' | 'sparkles' | 'check' | 'alert' | 'eye';
}

/**
 * Extrai o número de conversas (mensagens iniciadas) e o CPL real de um anúncio.
 */
export function extractAdConversasAndCpl(ad: MetaAd): { conversas: number; cpl: number | null } {
  let conversas = 0;
  let cpl: number | null = null;

  // 1. Verifica array de ações detalhadas da Meta API
  if (Array.isArray(ad.actions)) {
    for (const a of ad.actions) {
      if (
        a.action_type === 'onsite_conversion.total_messaging_connection' ||
        a.action_type === 'onsite_conversion.messaging_conversation_started_7d' ||
        a.action_type === 'onsite_conversion.messaging_first_reply'
      ) {
        const val = parseInt(a.value, 10) || 0;
        if (val > conversas) conversas = val;
      }
    }
  }

  // 2. Fallback para ad.conversions caso actions não tenha conversas de mensagem
  if (conversas === 0 && ad.conversions !== null && ad.conversions !== undefined) {
    conversas = Number(ad.conversions) || 0;
  }

  // 3. Determina CPL (Custo por conversa)
  if (ad.cpa !== null && ad.cpa !== undefined && ad.cpa > 0) {
    cpl = Number(ad.cpa);
  } else if (conversas > 0 && ad.spend && ad.spend > 0) {
    cpl = Number(ad.spend) / conversas;
  }

  return { conversas, cpl };
}

/**
 * Normaliza o CTR para escala percentual (ex: 1.25 para 1,25%).
 */
function normalizeCtr(ctrValue: number | null | undefined): number {
  if (ctrValue === null || ctrValue === undefined) return 0;
  const num = Number(ctrValue);
  // Se for decimal < 0.05 (ex: 0.008), multiplica por 100
  if (num > 0 && num < 0.05) return num * 100;
  return num;
}

/**
 * Engine de Diagnóstico: Avalia o anúncio com base na Meta de CPL da conta
 * e retorna a sugestão e justificativa exata segundo as réguas da operação F.A.
 */
export function getAdSuggestion(ad: MetaAd, metaCpl: number | null | undefined): AdSuggestionInfo {
  const spend = Number(ad.spend || 0);
  const { conversas, cpl } = extractAdConversasAndCpl(ad);
  const frequency = Number(ad.frequency || 1.0);
  const ctr = normalizeCtr(ad.ctr);

  // Referência de CPL da conta (fallback de R$ 25,00 se não cadastrado)
  const targetCpl = metaCpl && metaCpl > 0 ? metaCpl : 25.0;

  // REGRA 1: PAUSAR (Vermelho)
  // - Gastou 2x a Meta sem gerar conversas
  // - OU gastou 3x a Meta com o CPL 50% acima (CPL > metaCpl * 1.5)
  const semConversasGastoDobro = conversas === 0 && spend >= targetCpl * 2;
  const gastoTriploCplAlto = spend >= targetCpl * 3 && cpl !== null && cpl > targetCpl * 1.5;

  if (semConversasGastoDobro) {
    return {
      type: 'PAUSAR',
      label: 'Pausar',
      reason: `Gastou ${spend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (mais de 2× a meta) sem gerar nenhuma conversa.`,
      badgeBg: 'bg-red-500/15',
      badgeText: 'text-red-400',
      badgeBorder: 'border-red-500/30',
      iconName: 'pause'
    };
  }

  if (gastoTriploCplAlto) {
    return {
      type: 'PAUSAR',
      label: 'Pausar',
      reason: `Gastou mais de 3× a meta com CPL de ${cpl?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (50% acima da meta de ${targetCpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}).`,
      badgeBg: 'bg-red-500/15',
      badgeText: 'text-red-400',
      badgeBorder: 'border-red-500/30',
      iconName: 'pause'
    };
  }

  // REGRA 2: FADIGA (Laranja/Âmbar)
  // - Frequência > 3 E CTR < 0.8%
  if (frequency > 3 && ctr < 0.8 && spend > targetCpl * 0.5) {
    return {
      type: 'FADIGA',
      label: 'Fadiga',
      reason: `Público saturado: Frequência alta (${frequency.toFixed(2)}) com CTR fraco (${ctr.toFixed(2)}% < 0,8%).`,
      badgeBg: 'bg-orange-500/15',
      badgeText: 'text-orange-400',
      badgeBorder: 'border-orange-500/30',
      iconName: 'flame'
    };
  }

  // REGRA 3: REPLICAR (Verde Neon #CCFF00)
  // - 3+ conversas E CPL 20% abaixo da Meta (CPL < metaCpl * 0.8)
  if (conversas >= 3 && cpl !== null && cpl < targetCpl * 0.8) {
    return {
      type: 'REPLICAR',
      label: 'Replicar',
      reason: `Campeão: ${conversas} conversas com CPL de ${cpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (20% abaixo da meta).`,
      badgeBg: 'bg-[#CCFF00]',
      badgeText: 'text-black font-black',
      badgeBorder: 'border-[#CCFF00]',
      iconName: 'sparkles'
    };
  }

  // REGRA 6: OBSERVAR (Cinza Escuro)
  // - Gasto muito baixo para tomar decisão (menos de 50% da meta de CPL)
  if (spend < targetCpl * 0.5) {
    return {
      type: 'OBSERVAR',
      label: 'Observar',
      reason: `Volume baixo: investiu apenas ${spend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, insuficiente para decisão estatística.`,
      badgeBg: 'bg-zinc-800/80',
      badgeText: 'text-zinc-400',
      badgeBorder: 'border-zinc-700/60',
      iconName: 'eye'
    };
  }

  // REGRA 4: MANTER (Cinza Claro)
  // - CPL até 20% acima da referência (CPL <= metaCpl * 1.2) com conversas geradas
  if (conversas > 0 && cpl !== null && cpl <= targetCpl * 1.2) {
    return {
      type: 'MANTER',
      label: 'Manter',
      reason: `Desempenho estável: CPL de ${cpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} está dentro da margem saudável de até +20% da meta.`,
      badgeBg: 'bg-zinc-700/40',
      badgeText: 'text-zinc-200',
      badgeBorder: 'border-zinc-600/50',
      iconName: 'check'
    };
  }

  // REGRA 5: ATENÇÃO (Amarelo)
  // - Custo acima ou gasto sem resultado, mas sem dados suficientes para pausar
  return {
    type: 'ATENCAO',
    label: 'Atenção',
    reason: conversas === 0
      ? `Investiu ${spend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} sem conversas até o momento. Monitorar antes de pausar.`
      : `CPL de ${cpl?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} está acima da meta desejada (+20%). Avaliar criativo.`,
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    iconName: 'alert'
  };
}

