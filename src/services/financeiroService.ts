import { ContaPrePaga, MetricasContaPrePaga, RecargaItem, RecargaStatus } from '../types/financeiro';
import { MetaAdAccount } from '../types/meta';

const STORAGE_KEY = 'dashtf_financeiro_contas_v1';
const PREPAY_OVERRIDES_KEY = 'dashtf_prepay_overrides_v1';
export const DEFAULT_META_TAX_PERCENT = 12.15; // 12,15% de imposto retido na fonte pela Meta no Brasil (pré-pago)

export const DEFAULT_CONTAS_PRE_PAGAS: ContaPrePaga[] = [
  {
    id: 'acc_sayury',
    nome: 'Sayury',
    metaAccountId: '1770294427520018',
    totalInvestir: 2243,
    saldoAtualEmConta: 320,
    gastoMedioDiario: 80,
    diasAlertaLimite: 4,
    aplicarImposto: true,
    aliquotaImpostoPercentual: DEFAULT_META_TAX_PERCENT,
    ativo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recargas: [
      { id: 'say_1', tipo: 'Recarga', valor: 400, status: 'Pago', data: '03/11' },
      { id: 'say_2', tipo: 'Recarga', valor: 561, status: 'Pago', data: '09/11' },
      { id: 'say_3', tipo: 'Recarga', valor: 561, status: 'Pago', data: '16/11' },
      { id: 'say_4', tipo: 'Recarga', valor: 561, status: 'À Fazer', data: '23/11' }
    ]
  },
  {
    id: '977087437378962',
    nome: 'Dot Kayo',
    metaAccountId: '977087437378962',
    totalInvestir: 4000,
    saldoAtualEmConta: 879,
    gastoMedioDiario: 126,
    diasAlertaLimite: 4,
    aplicarImposto: true,
    aliquotaImpostoPercentual: DEFAULT_META_TAX_PERCENT,
    ativo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recargas: [
      { id: 'kayo_1', tipo: 'Recarga', valor: 1000, status: 'Pago', data: '06/11' },
      { id: 'kayo_2', tipo: 'Recarga', valor: 1000, status: 'Pago', data: '11/11' },
      { id: 'kayo_3', tipo: 'Recarga', valor: 1000, status: 'Pago', data: '17/11' },
      { id: 'kayo_4', tipo: 'Recarga', valor: 1000, status: 'À Fazer', data: '23/11' }
    ]
  }
];

/**
 * Lê do LocalStorage as contas pré-pagas com fallback nos defaults.
 * Garante que contas antigas ganhem os campos de imposto da Meta.
 */
export function getFinanceiroAccounts(): ContaPrePaga[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: any) => ({
          ...c,
          aplicarImposto: c.aplicarImposto ?? true,
          aliquotaImpostoPercentual: c.aliquotaImpostoPercentual ?? DEFAULT_META_TAX_PERCENT
        }));
      }
    }
  } catch (err) {
    console.warn('Erro ao ler contas pré-pagas do localStorage:', err);
  }
  return DEFAULT_CONTAS_PRE_PAGAS;
}

/**
 * Persiste as contas pré-pagas no LocalStorage.
 */
export function saveFinanceiroAccounts(contas: ContaPrePaga[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contas));
    return true;
  } catch (err) {
    console.error('Erro ao salvar contas pré-pagas no localStorage:', err);
    return false;
  }
}

/**
 * Lê do LocalStorage os overrides manuais de status Pré-pago vs Pós-pago
 */
export function getPrepayOverrides(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(PREPAY_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Salva um override manual para uma conta específica
 */
export function setPrepayOverride(accountId: string, isPrepay: boolean): void {
  try {
    const overrides = getPrepayOverrides();
    const cleanId = (accountId || '').replace(/\D/g, '');
    if (cleanId) {
      overrides[cleanId] = isPrepay;
      localStorage.setItem(PREPAY_OVERRIDES_KEY, JSON.stringify(overrides));
    }
  } catch {}
}

/**
 * Verifica se uma conta Meta é considerada pré-paga, priorizando:
 * 1. Override manual definido pelo usuário no painel Financeiro
 * 2. Existência de configuração ativa em financeiroAccounts
 * 3. Flag nativa is_prepay_account da Meta Graph API
 */
export function isAccountMarkedPrepay(
  acc: { id: string; name?: string; is_prepay_account?: boolean },
  finContas?: ContaPrePaga[]
): boolean {
  const cleanId = (acc.id || '').replace(/\D/g, '');
  const overrides = getPrepayOverrides();
  if (cleanId && overrides[cleanId] !== undefined) {
    return overrides[cleanId];
  }

  const contas = finContas || getFinanceiroAccounts();
  const finMatch = contas.find(c => {
    const cleanFinId = (c.id || '').replace(/\D/g, '');
    const cleanMetaId = c.metaAccountId ? c.metaAccountId.replace(/\D/g, '') : '';
    if (cleanId && (cleanFinId === cleanId || cleanMetaId === cleanId)) return true;
    const cleanFinName = (c.nome || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanAccName = (acc.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanFinName && cleanAccName) {
      if (cleanFinName.includes(cleanAccName) || cleanAccName.includes(cleanFinName)) return true;
    }
    return false;
  });

  if (finMatch) {
    return finMatch.ativo !== false;
  }

  return Boolean(acc.is_prepay_account);
}

/**
 * Alterna rapidamente se uma conta Meta é pré-paga ou pós-paga
 */
export function toggleAccountPrepayStatus(
  acc: MetaAdAccount,
  explicitStatus?: boolean
): boolean {
  const currentStatus = isAccountMarkedPrepay(acc);
  const nextStatus = explicitStatus !== undefined ? explicitStatus : !currentStatus;
  const cleanId = (acc.id || '').replace(/\D/g, '');

  if (cleanId) {
    setPrepayOverride(cleanId, nextStatus);
  }

  const contas = getFinanceiroAccounts();
  const index = contas.findIndex(c => {
    const cleanFinId = (c.id || '').replace(/\D/g, '');
    const cleanMetaId = c.metaAccountId ? c.metaAccountId.replace(/\D/g, '') : '';
    if (cleanId && (cleanFinId === cleanId || cleanMetaId === cleanId)) return true;
    const cleanFinName = (c.nome || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanAccName = (acc.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanFinName && cleanAccName) {
      if (cleanFinName.includes(cleanAccName) || cleanAccName.includes(cleanFinName)) return true;
    }
    return false;
  });

  if (nextStatus) {
    // Ativa ou cria como Pré-paga
    if (index >= 0) {
      contas[index].ativo = true;
      if (cleanId && !contas[index].metaAccountId) {
        contas[index].metaAccountId = cleanId;
      }
      contas[index].updatedAt = new Date().toISOString();
    } else {
      const dailyBudget = typeof (acc as any).daily_budget === 'number' ? (acc as any).daily_budget : 80;
      const initialBalance = typeof acc.balance === 'number' ? acc.balance : 0;
      const nova: ContaPrePaga = {
        id: cleanId || `acc_${Date.now()}`,
        nome: acc.name,
        metaAccountId: cleanId || undefined,
        totalInvestir: dailyBudget > 0 ? dailyBudget * 30 : 2000,
        saldoAtualEmConta: initialBalance,
        gastoMedioDiario: dailyBudget > 0 ? dailyBudget : 80,
        diasAlertaLimite: 4,
        aplicarImposto: true,
        aliquotaImpostoPercentual: DEFAULT_META_TAX_PERCENT,
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        recargas: []
      };
      contas.push(nova);
    }
  } else {
    // Desmarca como Pré-paga (torna Pós-paga)
    if (index >= 0) {
      if (!contas[index].recargas || contas[index].recargas.length === 0) {
        contas.splice(index, 1);
      } else {
        contas[index].ativo = false;
        contas[index].updatedAt = new Date().toISOString();
      }
    }
  }

  saveFinanceiroAccounts(contas);
  return nextStatus;
}

/**
 * Adiciona uma nova conta pré-paga.
 */
export function addFinanceiroAccount(dados: Partial<ContaPrePaga>): ContaPrePaga {
  const contas = getFinanceiroAccounts();
  const novaConta: ContaPrePaga = {
    id: dados.id || `acc_${Date.now()}`,
    nome: dados.nome || 'Nova Conta Pré-Paga',
    metaAccountId: dados.metaAccountId,
    totalInvestir: dados.totalInvestir || 0,
    saldoAtualEmConta: dados.saldoAtualEmConta || 0,
    gastoMedioDiario: dados.gastoMedioDiario || 50,
    diasAlertaLimite: dados.diasAlertaLimite || 4,
    aplicarImposto: dados.aplicarImposto ?? true,
    aliquotaImpostoPercentual: dados.aliquotaImpostoPercentual ?? DEFAULT_META_TAX_PERCENT,
    ativo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recargas: dados.recargas || []
  };

  contas.push(novaConta);
  saveFinanceiroAccounts(contas);
  return novaConta;
}

/**
 * Atualiza campos de uma conta pré-paga.
 */
export function updateFinanceiroAccount(id: string, updates: Partial<ContaPrePaga>): ContaPrePaga | null {
  const contas = getFinanceiroAccounts();
  const index = contas.findIndex(c => c.id === id);
  if (index === -1) return null;

  contas[index] = {
    ...contas[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  saveFinanceiroAccounts(contas);
  return contas[index];
}

/**
 * Remove uma conta pré-paga.
 */
export function deleteFinanceiroAccount(id: string): boolean {
  const contas = getFinanceiroAccounts();
  const filtered = contas.filter(c => c.id !== id);
  if (filtered.length === contas.length) return false;
  saveFinanceiroAccounts(filtered);
  return true;
}

/**
 * Adiciona um abastecimento/recarga a uma conta.
 */
export function addRecarga(contaId: string, recarga: Omit<RecargaItem, 'id'>): RecargaItem | null {
  const contas = getFinanceiroAccounts();
  const conta = contas.find(c => c.id === contaId);
  if (!conta) return null;

  const taxa = conta.aplicarImposto ? (conta.aliquotaImpostoPercentual ?? DEFAULT_META_TAX_PERCENT) / 100 : 0;
  const impostoValor = parseFloat((recarga.valor * taxa).toFixed(2));
  const valorLiquido = parseFloat((recarga.valor * (1 - taxa)).toFixed(2));

  const novoItem: RecargaItem = {
    ...recarga,
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    impostoValor,
    valorLiquido
  };

  conta.recargas.push(novoItem);
  conta.updatedAt = new Date().toISOString();
  saveFinanceiroAccounts(contas);
  return novoItem;
}

/**
 * Atualiza um item de recarga existente.
 */
export function updateRecarga(contaId: string, recargaId: string, updates: Partial<RecargaItem>): boolean {
  const contas = getFinanceiroAccounts();
  const conta = contas.find(c => c.id === contaId);
  if (!conta) return false;

  const recIndex = conta.recargas.findIndex(r => r.id === recargaId);
  if (recIndex === -1) return false;

  const taxa = conta.aplicarImposto ? (conta.aliquotaImpostoPercentual ?? DEFAULT_META_TAX_PERCENT) / 100 : 0;
  const novoValor = updates.valor !== undefined ? updates.valor : conta.recargas[recIndex].valor;
  const impostoValor = parseFloat((novoValor * taxa).toFixed(2));
  const valorLiquido = parseFloat((novoValor * (1 - taxa)).toFixed(2));

  conta.recargas[recIndex] = {
    ...conta.recargas[recIndex],
    ...updates,
    valor: novoValor,
    impostoValor,
    valorLiquido
  };

  conta.updatedAt = new Date().toISOString();
  saveFinanceiroAccounts(contas);
  return true;
}

/**
 * Alterna rapidamente o status de uma recarga entre 'Pago' e 'À Fazer'.
 */
export function toggleRecargaStatus(contaId: string, recargaId: string): RecargaStatus | null {
  const contas = getFinanceiroAccounts();
  const conta = contas.find(c => c.id === contaId);
  if (!conta) return null;

  const rec = conta.recargas.find(r => r.id === recargaId);
  if (!rec) return null;

  const newStatus: RecargaStatus = rec.status === 'Pago' ? 'À Fazer' : 'Pago';
  rec.status = newStatus;
  if (newStatus === 'Pago') {
    rec.pagoEm = new Date().toISOString();
  } else {
    delete rec.pagoEm;
  }

  conta.updatedAt = new Date().toISOString();
  saveFinanceiroAccounts(contas);
  return newStatus;
}

/**
 * Remove um item de recarga.
 */
export function deleteRecarga(contaId: string, recargaId: string): boolean {
  const contas = getFinanceiroAccounts();
  const conta = contas.find(c => c.id === contaId);
  if (!conta) return false;

  conta.recargas = conta.recargas.filter(r => r.id !== recargaId);
  conta.updatedAt = new Date().toISOString();
  saveFinanceiroAccounts(contas);
  return true;
}

/**
 * Calcula todas as métricas financeiras de uma conta pré-paga considerando o imposto da Meta (12,15%).
 */
export function calcularMetricasConta(
  conta: ContaPrePaga,
  metaAccount?: MetaAdAccount
): MetricasContaPrePaga {
  const taxaImposto = conta.aliquotaImpostoPercentual ?? DEFAULT_META_TAX_PERCENT;
  const aplicarImposto = conta.aplicarImposto ?? true;
  const taxaDecimal = aplicarImposto ? taxaImposto / 100 : 0;

  // Valor Bruto (Depositado pelo cliente) e Líquido (Real que entra na conta Meta)
  const totalInvestirBruto = conta.totalInvestir || 0;
  const totalInvestirLiquido = parseFloat((totalInvestirBruto * (1 - taxaDecimal)).toFixed(2));
  const impostoTotalInvestir = parseFloat((totalInvestirBruto * taxaDecimal).toFixed(2));
  
  let totalPagoBruto = 0;
  let totalPagoLiquido = 0;
  let impostoPagoTotal = 0;

  let totalAFazerBruto = 0;
  let totalAFazerLiquido = 0;

  let proximaRecarga: RecargaItem | null = null;

  for (const r of conta.recargas) {
    const rTax = parseFloat((r.valor * taxaDecimal).toFixed(2));
    const rNet = parseFloat((r.valor * (1 - taxaDecimal)).toFixed(2));
    r.impostoValor = rTax;
    r.valorLiquido = rNet;

    if (r.status === 'Pago') {
      totalPagoBruto += r.valor;
      totalPagoLiquido += rNet;
      impostoPagoTotal += rTax;
    } else if (r.status === 'À Fazer') {
      totalAFazerBruto += r.valor;
      totalAFazerLiquido += rNet;
      if (!proximaRecarga) {
        proximaRecarga = r;
      }
    }
  }

  const percentualAbastecido = totalInvestirBruto > 0 
    ? Math.min(100, Math.round((totalPagoBruto / totalInvestirBruto) * 100))
    : 0;

  const saldoRestanteInvestimentoBruto = Math.max(0, totalInvestirBruto - totalPagoBruto);
  const saldoRestanteInvestimentoLiquido = Math.max(0, totalInvestirLiquido - totalPagoLiquido);

  // 1. Busca gasto no período no cache da carteira se houver
  let gastoMeta = 0;
  try {
    const rawSpend = localStorage.getItem('dashtf_carteira_spend_cache');
    if (rawSpend) {
      const cache = JSON.parse(rawSpend);
      const match = Object.values(cache).find((c: any) => {
        if (c.id === conta.id || (conta.metaAccountId && c.id === conta.metaAccountId)) return true;
        const nameA = (c.name || '').toLowerCase();
        const nameF = (conta.nome || '').toLowerCase();
        return nameA.includes(nameF) || nameF.includes(nameA);
      });
      if (match && typeof (match as any).spend === 'number') {
        gastoMeta = (match as any).spend;
      }
    }
  } catch {}

  // O Saldo em Conta na Meta Ads é Líquido e é CALCULADO AUTOMATICAMENTE:
  // Saldo Atual = Total Abastecido Líquido (Pago) - Gasto Meta
  let saldoAtual = 0;
  if (totalPagoLiquido > 0) {
    saldoAtual = Math.max(0, parseFloat((totalPagoLiquido - gastoMeta).toFixed(2)));
  } else if (conta.saldoAtualEmConta > 0) {
    saldoAtual = conta.saldoAtualEmConta;
  } else if (metaAccount?.balance !== undefined && metaAccount.balance !== null) {
    const rawBalance = typeof metaAccount.balance === 'number' 
      ? metaAccount.balance 
      : parseFloat(metaAccount.balance as string);
    if (!isNaN(rawBalance) && rawBalance > 0) {
      saldoAtual = rawBalance;
    }
  }

  const gastoMedioDiario = conta.gastoMedioDiario > 0 ? conta.gastoMedioDiario : 50;
  
  let diasRestantesSaldo: number | null = null;
  if (saldoAtual !== null && saldoAtual !== undefined && gastoMedioDiario > 0) {
    diasRestantesSaldo = parseFloat((saldoAtual / gastoMedioDiario).toFixed(1));
  }

  // Avaliação de Alerta Proativo de Saldo
  let statusAlerta: 'CRITICO' | 'ATENCAO' | 'OK' = 'OK';
  let mensagemAlerta = '';

  const diasLimite = conta.diasAlertaLimite || 4;

  if (diasRestantesSaldo !== null && diasRestantesSaldo <= 1.5) {
    statusAlerta = 'CRITICO';
    mensagemAlerta = `Saldo crítico! Restam apenas ~${diasRestantesSaldo} dias (R$ ${saldoAtual.toFixed(0)}) antes de pausar os anúncios.`;
  } else if (diasRestantesSaldo !== null && diasRestantesSaldo <= diasLimite) {
    statusAlerta = 'ATENCAO';
    mensagemAlerta = `Orçamento prestes a acabar! Faltam ~${diasRestantesSaldo} dias de saldo disponível.`;
  } else if (proximaRecarga) {
    statusAlerta = 'OK';
    mensagemAlerta = `Próxima recarga: Depósito de R$ ${proximaRecarga.valor.toLocaleString('pt-BR')} (Líq. R$ ${(proximaRecarga.valorLiquido ?? (proximaRecarga.valor * (1 - taxaDecimal))).toLocaleString('pt-BR')}) em ${proximaRecarga.data}.`;
  } else {
    statusAlerta = 'OK';
    mensagemAlerta = 'Fluxo de abastecimento dentro do planejado.';
  }

  return {
    totalInvestirBruto,
    totalInvestirLiquido,
    impostoTotalInvestir,
    totalPagoBruto,
    totalPagoLiquido,
    impostoPagoTotal,
    totalAFazerBruto,
    totalAFazerLiquido,
    percentualAbastecido,
    saldoRestanteInvestimentoBruto,
    saldoRestanteInvestimentoLiquido,
    saldoAtualEmConta: saldoAtual,
    gastoMedioDiario,
    diasRestantesSaldo,
    taxaImposto,
    aplicarImposto,
    statusAlerta,
    mensagemAlerta,
    proximaRecarga
  };
}

/**
 * Gera mensagem formatada pronta para enviar ao cliente via WhatsApp
 * discriminando com total clareza o imposto de 12,15% da Meta.
 */
export function gerarResumoWhatsApp(conta: ContaPrePaga, metricas: MetricasContaPrePaga): string {
  const dataHoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  
  let texto = `📊 *RELATÓRIO FINANCEIRO & ABASTECIMENTO - ${conta.nome.toUpperCase()}*\n`;
  texto += `📅 Data: ${dataHoje}\n\n`;
  
  texto += `💰 *Orçamento Mensal Total:* R$ ${metricas.totalInvestirBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
  if (metricas.aplicarImposto) {
    texto += `🏛️ *Imposto Meta (${metricas.taxaImposto}% retido):* - R$ ${metricas.impostoTotalInvestir.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
    texto += `🎯 *Total Líquido em Anúncios:* R$ ${metricas.totalInvestirLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
  } else {
    texto += `\n`;
  }

  texto += `✅ *Total Já Abastecido:* R$ ${metricas.totalPagoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${metricas.percentualAbastecido}% do planejado)\n`;
  if (metricas.aplicarImposto) {
    texto += `   ↳ Líquido creditado: R$ ${metricas.totalPagoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
  }
  
  texto += `💳 *Saldo Atual em Conta:* R$ ${metricas.saldoAtualEmConta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (~${metricas.diasRestantesSaldo ?? '—'} dias de veiculação)\n\n`;

  if (metricas.proximaRecarga) {
    const liqProx = metricas.proximaRecarga.valorLiquido ?? (metricas.proximaRecarga.valor * (1 - (metricas.taxaImposto / 100)));
    texto += `⚡ *Próxima Recarga:* R$ ${metricas.proximaRecarga.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (metricas.aplicarImposto) {
      texto += ` (Líq. R$ ${liqProx.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
    }
    texto += ` prevista para *${metricas.proximaRecarga.data}*\n\n`;
  }

  texto += `📌 *Cronograma de Recargas:*\n`;
  conta.recargas.forEach(r => {
    const statusIcon = r.status === 'Pago' ? '🟢 Pago' : '🟡 À Fazer';
    const liqR = r.valorLiquido ?? (r.valor * (1 - (metricas.taxaImposto / 100)));
    texto += `• ${r.tipo}: R$ ${r.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (metricas.aplicarImposto) {
      texto += ` (Líq: R$ ${liqR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
    }
    texto += ` — ${r.data} [${statusIcon}]\n`;
  });

  texto += `\n_Gerado automaticamente pelo DashTF_ 🚀`;
  return texto;
}
