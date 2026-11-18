import { useMemo } from 'react';
import { 
  MetaAccountCarteiraItem, 
  MetaAd, 
  MetaAdSet, 
  MetaCampaign, 
  GerenciadorSummary, 
  MetaAdAccount 
} from '../types/meta';
import { getAdSuggestion, extractAdConversasAndCpl } from '../utils/adDiagnostics';
import { getFortalezaTodayDate } from '../utils/tarefasTime';
import { getFinanceiroAccounts, calcularMetricasConta } from '../services/financeiroService';

export interface AiScreenContext {
  activeTab: string;
  viewMode?: 'carteira' | 'campanhas';
  selectedAccount?: {
    id: string;
    name: string;
    metaCpl?: number | null;
  };
  macroCarteira?: {
    totalAccounts: number;
    contasEmRiscoSaldo: Array<{
      name: string;
      id: string;
      balance: number;
      remainingDays: number | null;
      isCritico: boolean;
    }>;
    contasEstouroCpl: Array<{
      name: string;
      id: string;
      cpl: number | null;
      metaCpl: number | null;
      percentOver: number;
      excessoTotal: number;
    }>;
    carteiraResumo: Array<{
      name: string;
      spend: number;
      conversas: number;
      cpl: number | null;
      metaCpl: number | null;
      balance: number;
    }>;
  };
  microConta?: {
    funil: {
      investimento: number;
      cpm: number;
      ctr: number;
      connectRate: number;
      leads: number;
      cpl: number;
    };
    topAds: Array<{
      name: string;
      id: string;
      spend: number;
      conversas: number;
      cpl: number | null;
      ctr: number | null;
      frequency: number | null;
      cpm: number | null;
      sugestao: string;
      motivoSugestao: string;
    }>;
  };
  tarefasContext?: {
    today: string;
    totalContas: number;
  };
  agencyClients: Array<{ id: string; name: string }>;
}

/**
 * Hook que empacota todo o contexto da tela em tempo real para alimentar a IA
 */
export function useAiContext(params: {
  activeTab: string;
  viewMode?: 'carteira' | 'campanhas';
  accounts?: MetaAdAccount[];
  selectedAccountId?: string;
  carteiraItems?: MetaAccountCarteiraItem[];
  summary?: GerenciadorSummary;
  ads?: MetaAd[];
  campaigns?: MetaCampaign[];
}): { context: AiScreenContext; contextPromptString: string } {
  const {
    activeTab,
    viewMode = 'carteira',
    accounts = [],
    selectedAccountId,
    carteiraItems = [],
    summary,
    ads = [],
  } = params;

  const context: AiScreenContext = useMemo(() => {
    const today = getFortalezaTodayDate();
    const selectedAcc = accounts.find(a => a.id === selectedAccountId);
    const selectedItem = carteiraItems.find(i => i.id === selectedAccountId);

    const agencyClients = (accounts.length > 0 ? accounts : carteiraItems).map(a => ({
      id: a.id,
      name: a.name
    }));

    // 1. Dados da Visão Macro (Carteira de Contas)
    const contasEmRiscoSaldo = carteiraItems
      .filter(item => item.is_prepay_account && item.remaining_days !== null && item.remaining_days < 5)
      .map(item => ({
        name: item.name,
        id: item.id,
        balance: item.balance,
        remainingDays: item.remaining_days,
        isCritico: (item.remaining_days ?? 99) < 1.5
      }));

    const contasEstouroCpl = carteiraItems
      .filter(item => item.cpl !== null && item.meta_cpl !== null && item.cpl > item.meta_cpl)
      .map(item => ({
        name: item.name,
        id: item.id,
        cpl: item.cpl,
        metaCpl: item.meta_cpl,
        percentOver: item.status_meta_percent ?? 0,
        excessoTotal: item.excesso_pago ?? 0
      }));

    const carteiraResumo = carteiraItems.map(item => ({
      name: item.name,
      spend: item.spend,
      conversas: item.conversas,
      cpl: item.cpl,
      metaCpl: item.meta_cpl,
      balance: item.balance
    }));

    // 2. Dados da Visão Micro (Métricas da Conta e Top 25 Anúncios)
    const targetMetaCpl = selectedItem?.meta_cpl ?? 25.0;
    const sortedAds = [...ads]
      .sort((a, b) => Number(b.spend || 0) - Number(a.spend || 0))
      .slice(0, 25);

    const topAds = sortedAds.map(ad => {
      const { conversas, cpl } = extractAdConversasAndCpl(ad);
      const diag = getAdSuggestion(ad, targetMetaCpl);
      return {
        name: ad.name,
        id: ad.id,
        spend: Number(ad.spend || 0),
        conversas,
        cpl,
        ctr: Number(ad.ctr || 0),
        frequency: Number(ad.frequency || 1),
        cpm: Number(ad.cpm || 0),
        sugestao: diag.label,
        motivoSugestao: diag.reason
      };
    });

    const funil = {
      investimento: summary?.investimentoTotal ?? 0,
      cpm: summary?.cpmMedio ?? 0,
      ctr: summary?.ctrMedio ?? 0,
      connectRate: summary?.connectRate ?? 0,
      leads: summary?.leadsTotal ?? 0,
      cpl: summary?.cpaMedio ?? 0
    };

    return {
      activeTab,
      viewMode,
      selectedAccount: selectedAcc ? {
        id: selectedAcc.id,
        name: selectedAcc.name,
        metaCpl: selectedItem?.meta_cpl
      } : undefined,
      macroCarteira: {
        totalAccounts: carteiraItems.length,
        contasEmRiscoSaldo,
        contasEstouroCpl,
        carteiraResumo
      },
      microConta: {
        funil,
        topAds
      },
      tarefasContext: {
        today,
        totalContas: agencyClients.length
      },
      financeiroContext: {
        contasPrePagas: getFinanceiroAccounts().map(c => {
          const m = calcularMetricasConta(c);
          return {
            nome: c.nome,
            totalInvestirBruto: m.totalInvestirBruto,
            totalInvestirLiquido: m.totalInvestirLiquido,
            totalPagoBruto: m.totalPagoBruto,
            totalPagoLiquido: m.totalPagoLiquido,
            totalAFazerBruto: m.totalAFazerBruto,
            saldoAtual: m.saldoAtualEmConta,
            diasRestantesSaldo: m.diasRestantesSaldo,
            statusAlerta: m.statusAlerta,
            taxaImposto: m.taxaImposto,
            proximaRecarga: m.proximaRecarga ? `${m.proximaRecarga.data} (R$ ${m.proximaRecarga.valor})` : 'Nenhuma'
          };
        })
      },
      agencyClients
    };
  }, [activeTab, viewMode, accounts, selectedAccountId, carteiraItems, summary, ads]);

  // Converte em string estruturada e compacta para injetar no System Prompt
  const contextPromptString = useMemo(() => {
    return JSON.stringify(context, null, 2);
  }, [context]);

  return { context, contextPromptString };
}

