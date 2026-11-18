import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Wallet, 
  AlertTriangle, 
  Plus, 
  Check, 
  Clock, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Copy, 
  Edit2, 
  Trash2, 
  Sparkles, 
  MessageCircle, 
  AlertCircle, 
  RefreshCw,
  Flame,
  CheckCircle2,
  X,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Percent,
  Receipt,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal
} from 'lucide-react';
import { 
  ContaPrePaga, 
  RecargaItem, 
  RecargaStatus,
  MetricasContaPrePaga 
} from '../types/financeiro';
import { MetaAdAccount } from '../types/meta';
import { 
  getFinanceiroAccounts, 
  saveFinanceiroAccounts,
  addFinanceiroAccount,
  updateFinanceiroAccount,
  deleteFinanceiroAccount,
  addRecarga,
  updateRecarga,
  toggleRecargaStatus,
  deleteRecarga,
  calcularMetricasConta,
  gerarResumoWhatsApp,
  DEFAULT_META_TAX_PERCENT,
  isAccountMarkedPrepay,
  toggleAccountPrepayStatus
} from '../services/financeiroService';
import { isMatchingAccount, getSpendForAccount } from '../services/carteiraEngine';
import { formatCurrency } from '../utils/formatters';

interface FinanceiroViewProps {
  accounts?: MetaAdAccount[];
}

export const FinanceiroView: React.FC<FinanceiroViewProps> = ({ accounts = [] }) => {
  const [contas, setContas] = useState<ContaPrePaga[]>(() => getFinanceiroAccounts());
  const [selectedContaId, setSelectedContaId] = useState<string>(() => {
    const list = getFinanceiroAccounts();
    return list.length > 0 ? list[0].id : '';
  });

  // Notificação Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modais
  const [isAddRecargaOpen, setIsAddRecargaOpen] = useState(false);
  const [isAddContaOpen, setIsAddContaOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaPrePaga | null>(null);
  const [editingRecarga, setEditingRecarga] = useState<RecargaItem | null>(null);

  // Formulário Nova/Editar Recarga
  const [recargaTipo, setRecargaTipo] = useState('Recarga');
  const [recargaValor, setRecargaValor] = useState('');
  const [recargaStatus, setRecargaStatus] = useState<RecargaStatus>('À Fazer');
  const [recargaData, setRecargaData] = useState('');
  const [recargaObs, setRecargaObs] = useState('');

  // Formulário Nova Conta
  const [novaContaNome, setNovaContaNome] = useState('');
  const [novaContaMetaId, setNovaContaMetaId] = useState('');
  const [novaContaTotal, setNovaContaTotal] = useState('');
  const [novaContaSaldo, setNovaContaSaldo] = useState('');
  const [novaContaRitmo, setNovaContaRitmo] = useState('');
  const [novaContaAlertaDias, setNovaContaAlertaDias] = useState('4');
  const [novaContaAplicarImposto, setNovaContaAplicarImposto] = useState(true);
  const [novaContaTaxaImposto, setNovaContaTaxaImposto] = useState('12.15');

  // Formulário Edição Rápida da Conta Atual
  const [quickTotalInvestir, setQuickTotalInvestir] = useState('');
  const [quickSaldoAtual, setQuickSaldoAtual] = useState('');
  const [quickGastoDiario, setQuickGastoDiario] = useState('');
  const [quickDiasAlerta, setQuickDiasAlerta] = useState('');
  const [quickAplicarImposto, setQuickAplicarImposto] = useState(true);
  const [quickTaxaImposto, setQuickTaxaImposto] = useState('12.15');
  const [isManualSaldoOverride, setIsManualSaldoOverride] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Estado de exibição do painel de seleção de contas pré-pagas
  const [isPrepaySelectorOpen, setIsPrepaySelectorOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('dashtf_prepay_selector_open');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleSelectorOpen = useCallback(() => {
    setIsPrepaySelectorOpen((prev: boolean) => {
      const next = !prev;
      try {
        localStorage.setItem('dashtf_prepay_selector_open', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const refreshContas = useCallback(() => {
    const updated = getFinanceiroAccounts();
    setContas(updated);
    const activeOnes = updated.filter(c => c.ativo !== false);
    if (activeOnes.length > 0 && (!selectedContaId || !activeOnes.some(c => c.id === selectedContaId))) {
      setSelectedContaId(activeOnes[0].id);
    }
  }, [selectedContaId]);

  // Contas ativas pré-pagas
  const contasAtivas = useMemo(() => {
    return contas.filter(c => c.ativo !== false);
  }, [contas]);

  // Lista unificada de todas as contas da carteira Meta com status pré-pago
  const allAccountsList = useMemo(() => {
    const list: Array<{ id: string; name: string; isPrepay: boolean; recargasCount: number }> = [];
    const seenIds = new Set<string>();

    accounts.forEach(acc => {
      const cleanId = (acc.id || '').replace(/\D/g, '');
      if (cleanId) seenIds.add(cleanId);
      const isPrepay = isAccountMarkedPrepay(acc, contas);
      const finAcc = contas.find(c => isMatchingAccount(c, acc));
      list.push({
        id: acc.id,
        name: acc.name || `Conta ${acc.id}`,
        isPrepay,
        recargasCount: finAcc?.recargas?.length || 0
      });
    });

    contasAtivas.forEach(c => {
      const cleanFinId = (c.id || '').replace(/\D/g, '');
      const cleanMetaId = c.metaAccountId ? c.metaAccountId.replace(/\D/g, '') : '';
      if (!seenIds.has(cleanFinId) && (!cleanMetaId || !seenIds.has(cleanMetaId))) {
        if (cleanFinId) seenIds.add(cleanFinId);
        list.push({
          id: c.metaAccountId || c.id,
          name: c.nome,
          isPrepay: c.ativo !== false,
          recargasCount: c.recargas?.length || 0
        });
      }
    });

    return list;
  }, [accounts, contas]);

  // Alterna uma conta entre Pré-Paga e Pós-Paga
  const handleTogglePrepay = useCallback((targetAcc: { id: string; name: string }) => {
    const accObj = accounts.find(a => a.id === targetAcc.id) || {
      id: targetAcc.id,
      name: targetAcc.name,
      currency: 'BRL',
      account_status: 1,
      is_prepay_account: false
    } as MetaAdAccount;

    const newStatus = toggleAccountPrepayStatus(accObj);
    const updated = getFinanceiroAccounts();
    setContas(updated);

    if (newStatus) {
      const cleanId = (targetAcc.id || '').replace(/\D/g, '');
      const foundNew = updated.find(c => {
        const cClean = (c.id || '').replace(/\D/g, '');
        const mClean = c.metaAccountId ? c.metaAccountId.replace(/\D/g, '') : '';
        return (cleanId && (cClean === cleanId || mClean === cleanId)) || c.nome === targetAcc.name;
      });
      if (foundNew) {
        setSelectedContaId(foundNew.id);
      }
      showToast(`Conta "${targetAcc.name}" marcada como Pré-Paga!`);
    } else {
      const remainingActive = updated.filter(c => c.ativo !== false);
      if (remainingActive.length > 0) {
        setSelectedContaId(remainingActive[0].id);
      }
      showToast(`Conta "${targetAcc.name}" desmarcada (Pós-paga).`);
    }
  }, [accounts, showToast]);

  // Conta selecionada atual (apenas entre as ativas)
  const activeConta = useMemo(() => {
    return contasAtivas.find(c => c.id === selectedContaId) || contasAtivas[0] || null;
  }, [contasAtivas, selectedContaId]);

  // Gasto no período puxado da carteira / Meta Ads
  const spendInfo = useMemo(() => {
    if (!activeConta) return null;
    return getSpendForAccount(activeConta);
  }, [activeConta]);

  const gastoMeta = spendInfo?.spend ?? 0;

  // Conta da Meta vinculada (por ID, metaAccountId ou nome)
  const linkedMetaAccount = useMemo(() => {
    if (!activeConta) return undefined;
    return accounts.find(a => isMatchingAccount(activeConta, a));
  }, [activeConta, accounts]);

  // Métricas da conta ativa
  const activeMetricas = useMemo(() => {
    if (!activeConta) return null;
    return calcularMetricasConta(activeConta, linkedMetaAccount);
  }, [activeConta, linkedMetaAccount]);

  // Gasto e métricas automáticas para a conta que está sendo editada no modal
  const editingSpendInfo = useMemo(() => {
    if (!editingConta) return null;
    return getSpendForAccount(editingConta);
  }, [editingConta]);

  const editingAutoMetrics = useMemo(() => {
    if (!editingConta) return { totalPagoBruto: 0, totalPagoLiquido: 0, impostoPago: 0, saldoAtual: 0, gastoMeta: 0 };
    
    const taxa = editingConta.aplicarImposto !== false 
      ? (editingConta.aliquotaImpostoPercentual ?? DEFAULT_META_TAX_PERCENT) / 100 
      : 0;

    let totalPagoBruto = 0;
    let totalPagoLiquido = 0;
    let impostoPago = 0;

    for (const r of editingConta.recargas) {
      if (r.status === 'Pago') {
        totalPagoBruto += r.valor;
        const rTax = r.impostoValor !== undefined ? r.impostoValor : parseFloat((r.valor * taxa).toFixed(2));
        const rNet = r.valorLiquido !== undefined ? r.valorLiquido : parseFloat((r.valor * (1 - taxa)).toFixed(2));
        impostoPago += rTax;
        totalPagoLiquido += rNet;
      }
    }

    const spend = editingSpendInfo?.spend ?? 0;
    const saldoAtual = totalPagoLiquido > 0 
      ? Math.max(0, parseFloat((totalPagoLiquido - spend).toFixed(2)))
      : (editingConta.saldoAtualEmConta || 0);

    return {
      totalPagoBruto,
      totalPagoLiquido,
      impostoPago,
      saldoAtual,
      gastoMeta: spend
    };
  }, [editingConta, editingSpendInfo]);

  // Sincroniza formulário rápido quando a conta ativa muda
  useEffect(() => {
    if (activeConta && activeMetricas) {
      setQuickTotalInvestir(activeConta.totalInvestir.toString());
      setQuickSaldoAtual(activeMetricas.saldoAtualEmConta.toString());
      setQuickGastoDiario(activeConta.gastoMedioDiario.toString());
      setQuickDiasAlerta((activeConta.diasAlertaLimite || 4).toString());
      setQuickAplicarImposto(activeConta.aplicarImposto ?? true);
      setQuickTaxaImposto((activeConta.aliquotaImpostoPercentual ?? DEFAULT_META_TAX_PERCENT).toString());
      setIsManualSaldoOverride(false);
    }
  }, [activeConta, activeMetricas?.saldoAtualEmConta]);

  // Métricas macro de todas as contas para os cards do topo
  const resumoGeral = useMemo(() => {
    let totalInvestirGlobalBruto = 0;
    let totalInvestirGlobalLiquido = 0;
    let totalImpostoInvestirGlobal = 0;

    let totalPagoGlobalBruto = 0;
    let totalPagoGlobalLiquido = 0;

    let totalAFazerGlobalBruto = 0;
    let totalAFazerGlobalLiquido = 0;

    let contasEmAlertaCount = 0;
    const alertasLista: Array<{
      contaNome: string;
      contaId: string;
      diasRestantes: number | null;
      saldo: number;
      mensagem: string;
      statusAlerta: 'CRITICO' | 'ATENCAO';
      proximaRecarga?: RecargaItem | null;
    }> = [];

    contasAtivas.forEach(c => {
      const meta = accounts.find(a => a.id === c.metaAccountId);
      const m = calcularMetricasConta(c, meta);
      totalInvestirGlobalBruto += m.totalInvestirBruto;
      totalInvestirGlobalLiquido += m.totalInvestirLiquido;
      totalImpostoInvestirGlobal += m.impostoTotalInvestir;

      totalPagoGlobalBruto += m.totalPagoBruto;
      totalPagoGlobalLiquido += m.totalPagoLiquido;

      totalAFazerGlobalBruto += m.totalAFazerBruto;
      totalAFazerGlobalLiquido += m.totalAFazerLiquido;

      if (m.statusAlerta === 'CRITICO' || m.statusAlerta === 'ATENCAO') {
        contasEmAlertaCount++;
        alertasLista.push({
          contaNome: c.nome,
          contaId: c.id,
          diasRestantes: m.diasRestantesSaldo,
          saldo: m.saldoAtualEmConta,
          mensagem: m.mensagemAlerta || '',
          statusAlerta: m.statusAlerta,
          proximaRecarga: m.proximaRecarga
        });
      }
    });

    const percentualPagoGlobal = totalInvestirGlobalBruto > 0 
      ? Math.round((totalPagoGlobalBruto / totalInvestirGlobalBruto) * 100) 
      : 0;

    return {
      totalInvestirGlobalBruto,
      totalInvestirGlobalLiquido,
      totalImpostoInvestirGlobal,
      totalPagoGlobalBruto,
      totalPagoGlobalLiquido,
      totalAFazerGlobalBruto,
      totalAFazerGlobalLiquido,
      percentualPagoGlobal,
      contasEmAlertaCount,
      alertasLista
    };
  }, [contas, accounts]);

  // Manipulador para alternar status com 1 clique rápido
  const handleToggleStatus = (recargaId: string) => {
    if (!activeConta) return;
    const newStatus = toggleRecargaStatus(activeConta.id, recargaId);
    if (newStatus) {
      refreshContas();
      showToast(`Status da recarga alterado para: ${newStatus}`);
    }
  };

  // Abrir modal de nova recarga
  const handleOpenAddRecarga = () => {
    setEditingRecarga(null);
    setRecargaTipo('Recarga');
    setRecargaValor('');
    setRecargaStatus('À Fazer');
    
    // Sugere a data de 7 dias à frente
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7);
    const day = String(nextDate.getDate()).padStart(2, '0');
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    setRecargaData(`${day}/${month}`);
    setRecargaObs('');
    setIsAddRecargaOpen(true);
  };

  // Abrir modal para editar recarga existente
  const handleOpenEditRecarga = (rec: RecargaItem) => {
    setEditingRecarga(rec);
    setRecargaTipo(rec.tipo);
    setRecargaValor(rec.valor.toString());
    setRecargaStatus(rec.status);
    setRecargaData(rec.data);
    setRecargaObs(rec.observacao || '');
    setIsAddRecargaOpen(true);
  };

  // Salvar Recarga (Criar ou Atualizar)
  const handleSaveRecarga = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConta) return;

    const valorNum = parseFloat(recargaValor.replace('R$', '').trim().replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) {
      alert('Por favor, informe um valor válido para a recarga.');
      return;
    }

    if (!recargaData.trim()) {
      alert('Por favor, informe a data da recarga (ex: 23/11).');
      return;
    }

    if (editingRecarga) {
      updateRecarga(activeConta.id, editingRecarga.id, {
        tipo: recargaTipo.trim() || 'Recarga',
        valor: valorNum,
        status: recargaStatus,
        data: recargaData.trim(),
        observacao: recargaObs.trim() || undefined
      });
      showToast('Recarga atualizada com sucesso!');
    } else {
      addRecarga(activeConta.id, {
        tipo: recargaTipo.trim() || 'Recarga',
        valor: valorNum,
        status: recargaStatus,
        data: recargaData.trim(),
        observacao: recargaObs.trim() || undefined
      });
      showToast('Nova recarga adicionada com sucesso!');
    }

    setIsAddRecargaOpen(false);
    refreshContas();
  };

  // Excluir recarga
  const handleDeleteRecarga = (recId: string) => {
    if (!activeConta) return;
    if (window.confirm('Tem certeza que deseja excluir esta recarga?')) {
      deleteRecarga(activeConta.id, recId);
      refreshContas();
      showToast('Recarga removida.');
    }
  };

  // Abrir modal para configurar parâmetros da conta com métricas automáticas
  const handleOpenEditConta = (conta: ContaPrePaga) => {
    const meta = accounts.find(a => isMatchingAccount(conta, a));
    const m = calcularMetricasConta(conta, meta);
    
    setEditingConta(conta);
    setQuickTotalInvestir(conta.totalInvestir.toString());
    setQuickSaldoAtual(m.saldoAtualEmConta.toString());
    setQuickGastoDiario(conta.gastoMedioDiario.toString());
    setQuickDiasAlerta((conta.diasAlertaLimite || 4).toString());
    setQuickAplicarImposto(conta.aplicarImposto ?? true);
    setQuickTaxaImposto((conta.aliquotaImpostoPercentual ?? DEFAULT_META_TAX_PERCENT).toString());
    setIsManualSaldoOverride(false);
  };

  // Salvar alterações da conta
  const handleSaveQuickConta = () => {
    const targetConta = editingConta || activeConta;
    if (!targetConta) return;

    const totalNum = parseFloat(quickTotalInvestir.replace('R$', '').trim().replace(',', '.'));
    const ritmoNum = parseFloat(quickGastoDiario.replace('R$', '').trim().replace(',', '.'));
    const diasAlertaNum = parseInt(quickDiasAlerta, 10);
    const taxaNum = parseFloat(quickTaxaImposto.replace(',', '.')) || DEFAULT_META_TAX_PERCENT;

    let finalSaldo = editingAutoMetrics.saldoAtual;
    if (isManualSaldoOverride) {
      const parsedManual = parseFloat(quickSaldoAtual.replace('R$', '').trim().replace(',', '.'));
      if (!isNaN(parsedManual)) {
        finalSaldo = parsedManual;
      }
    }

    updateFinanceiroAccount(targetConta.id, {
      totalInvestir: !isNaN(totalNum) ? totalNum : targetConta.totalInvestir,
      saldoAtualEmConta: finalSaldo,
      gastoMedioDiario: !isNaN(ritmoNum) ? ritmoNum : targetConta.gastoMedioDiario,
      diasAlertaLimite: !isNaN(diasAlertaNum) ? diasAlertaNum : 4,
      aplicarImposto: quickAplicarImposto,
      aliquotaImpostoPercentual: taxaNum
    });

    setEditingConta(null);
    refreshContas();
    showToast('Parâmetros da conta e saldo atualizados!');
  };

  // Criar nova conta pré-paga
  const handleCreateConta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaContaNome.trim()) {
      alert('Informe o nome da conta.');
      return;
    }

    const total = parseFloat(novaContaTotal.replace('R$', '').trim().replace(',', '.')) || 0;
    const saldo = parseFloat(novaContaSaldo.replace('R$', '').trim().replace(',', '.')) || 0;
    const ritmo = parseFloat(novaContaRitmo.replace('R$', '').trim().replace(',', '.')) || 50;
    const alerta = parseInt(novaContaAlertaDias, 10) || 4;
    const taxa = parseFloat(novaContaTaxaImposto.replace(',', '.')) || DEFAULT_META_TAX_PERCENT;

    const created = addFinanceiroAccount({
      nome: novaContaNome.trim(),
      metaAccountId: novaContaMetaId.trim() || undefined,
      totalInvestir: total,
      saldoAtualEmConta: saldo,
      gastoMedioDiario: ritmo,
      diasAlertaLimite: alerta,
      aplicarImposto: novaContaAplicarImposto,
      aliquotaImpostoPercentual: taxa,
      recargas: []
    });

    setIsAddContaOpen(false);
    setNovaContaNome('');
    setNovaContaMetaId('');
    setNovaContaTotal('');
    setNovaContaSaldo('');
    setNovaContaRitmo('');

    refreshContas();
    setSelectedContaId(created.id);
    showToast(`Conta pré-paga "${created.nome}" cadastrada com sucesso!`);
  };

  // Excluir conta
  const handleDeleteConta = (contaId: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a conta pré-paga "${nome}"?`)) {
      deleteFinanceiroAccount(contaId);
      refreshContas();
      showToast(`Conta "${nome}" excluída.`);
    }
  };

  // Copiar relatório para WhatsApp
  const handleCopyWhatsApp = () => {
    if (!activeConta || !activeMetricas) return;
    const texto = gerarResumoWhatsApp(activeConta, activeMetricas);
    navigator.clipboard.writeText(texto).then(() => {
      showToast('Relatório completo copiado com imposto Meta discriminado! Pronto para o WhatsApp.');
    }).catch(() => {
      showToast('Falha ao copiar texto.');
    });
  };

  // Cálculo ao vivo do imposto digitado no modal de recarga
  const liveRecargaNum = parseFloat(recargaValor.replace('R$', '').trim().replace(',', '.')) || 0;
  const liveTaxRate = (activeConta?.aplicarImposto ? (activeConta?.aliquotaImpostoPercentual ?? DEFAULT_META_TAX_PERCENT) : 0) / 100;
  const liveTaxValue = liveRecargaNum * liveTaxRate;
  const liveNetValue = liveRecargaNum * (1 - liveTaxRate);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto select-none text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-brand-neon text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-brand-neon shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner de Alerta Inteligente de Saldo Acabando */}
      {resumoGeral.alertasLista.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/30 border border-amber-500/40 rounded-2xl p-5 shadow-lg shadow-amber-950/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400 shrink-0 mt-0.5 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-amber-200">
                    Radar Financeiro: {resumoGeral.alertasLista.length} conta(s) com saldo prestes a acabar
                  </h3>
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Ação Necessária
                  </span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {resumoGeral.alertasLista.map((alerta, idx) => (
                    <div key={idx} className="text-xs text-zinc-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>
                        <strong className="text-white font-semibold">{alerta.contaNome}</strong>: 
                        {' '}Saldo disponível em conta de <strong>{formatCurrency(alerta.saldo)}</strong> durará aprox. 
                        {' '}<strong className="text-amber-300">{alerta.diasRestantes ?? '—'} dias</strong>.
                        {alerta.proximaRecarga ? (
                          <span className="text-zinc-400 ml-1">
                            (Próxima recarga: Depósito de {formatCurrency(alerta.proximaRecarga.valor)} previsto para {alerta.proximaRecarga.data})
                          </span>
                        ) : (
                          <span className="text-amber-400 ml-1 font-semibold">
                            (Nenhuma recarga programada!)
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => setSelectedContaId(alerta.contaId)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold ml-1 cursor-pointer"
                      >
                        Ver conta →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
              <button
                onClick={handleOpenAddRecarga}
                className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Agendar Recarga
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top 4 Metric KPI Cards (Com distinção explícita de Imposto Meta 12,15%) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Total Planejado (Bruto vs Líquido Anúncios) */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Total a Ser Investido
            </span>
            <div className="p-2 bg-zinc-800/80 rounded-xl text-brand-neon">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              {formatCurrency(resumoGeral.totalInvestirGlobalBruto)}
            </div>
            <div className="text-xs text-brand-neon font-semibold mt-1 flex items-center gap-1">
              <span>Líq. Anúncios: {formatCurrency(resumoGeral.totalInvestirGlobalLiquido)}</span>
              <span className="text-[10px] text-zinc-500 font-normal">(-12,15% imposto)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Abastecido (Pago) */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Total Já Abastecido
            </span>
            <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Check className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 tracking-tight">
              {formatCurrency(resumoGeral.totalPagoGlobalBruto)}
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mt-1">
              <span className="text-emerald-300 font-semibold">
                Líq: {formatCurrency(resumoGeral.totalPagoGlobalLiquido)}
              </span>
              <span className="text-[11px] font-bold text-zinc-400">
                {resumoGeral.percentualPagoGlobal}% pago
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Recargas À Fazer (Pendentes) */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Recargas À Fazer
            </span>
            <div className="p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-400 tracking-tight">
              {formatCurrency(resumoGeral.totalAFazerGlobalBruto)}
            </div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center justify-between">
              <span className="text-amber-300 font-semibold">
                Líq: {formatCurrency(resumoGeral.totalAFazerGlobalLiquido)}
              </span>
              <span className="text-[10px] text-zinc-500">
                {contasAtivas.reduce((acc, c) => acc + c.recargas.filter(r => r.status === 'À Fazer').length, 0)} pendente(s)
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Radar de Saldo & Imposto Retido */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 relative overflow-hidden group hover:border-zinc-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Imposto Meta Retido
            </span>
            <div className="p-2 bg-blue-500/15 border border-blue-500/30 rounded-xl text-blue-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-400 tracking-tight">
              {formatCurrency(resumoGeral.totalImpostoInvestirGlobal)}
            </div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                12,15%
              </span>
              <span>Descontado pela Meta na entrada</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO: MARCAR QUAIS CONTAS SÃO PRÉ-PAGAS OU NÃO */}
      <div className="bg-brand-card/90 border border-brand-border rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-brand-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Marcar Contas Pré-Pagas
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {contasAtivas.length} pré-paga{contasAtivas.length !== 1 ? 's' : ''} marcada{contasAtivas.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Clique nas contas abaixo para definir quais operam com abastecimento pré-pago (imposto Meta de 12,15%) ou pós-pago (cartão de crédito).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleSelectorOpen}
            className="text-xs text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl border border-brand-border bg-zinc-900/80 hover:bg-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-neon" />
            <span>{isPrepaySelectorOpen ? 'Ocultar Lista' : 'Gerenciar Contas Pré-Pagas'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isPrepaySelectorOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Grade de Contas para Marcar / Desmarcar com 1 Clique */}
        {isPrepaySelectorOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1 animate-in fade-in duration-200">
            {allAccountsList.map(acc => {
              return (
                <div
                  key={acc.id}
                  onClick={() => handleTogglePrepay(acc)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-2 group ${
                    acc.isPrepay
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-500/10 hover:border-amber-300'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-400'
                  }`}
                  title={acc.isPrepay ? 'Clique para desmarcar (Pós-paga)' : 'Clique para marcar como Pré-paga'}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className={`text-xs font-bold truncate block ${acc.isPrepay ? 'text-white' : 'text-zinc-300'}`}>
                        {acc.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono block">
                        ID: {acc.id}
                      </span>
                    </div>

                    {/* Switch Toggle */}
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                      acc.isPrepay ? 'bg-amber-500' : 'bg-zinc-700'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        acc.isPrepay ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-zinc-800/80">
                    <span className={`font-semibold flex items-center gap-1.5 ${
                      acc.isPrepay ? 'text-amber-400 font-bold' : 'text-zinc-500'
                    }`}>
                      {acc.isPrepay ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Pré-paga
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5" /> Pós-paga (Cartão)
                        </>
                      )}
                    </span>

                    {acc.isPrepay && (
                      <span className="text-[10px] text-zinc-400 bg-black/40 px-2 py-0.5 rounded-md font-mono">
                        {acc.recargasCount > 0 ? `${acc.recargasCount} recargas` : 'Nova'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Seletor de Contas Pré-Pagas em Pílulas / Abas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {contasAtivas.length === 0 && (
            <div className="text-xs text-zinc-500 italic py-2">
              Nenhuma conta marcada como pré-paga no momento. Marque uma conta acima para gerenciar.
            </div>
          )}
          {contasAtivas.map(conta => {
            const isSelected = conta.id === selectedContaId;
            const meta = accounts.find(a => a.id === conta.metaAccountId);
            const m = calcularMetricasConta(conta, meta);

            return (
              <button
                key={conta.id}
                onClick={() => setSelectedContaId(conta.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800 text-white border-2 border-brand-neon shadow-lg shadow-brand-neon/10'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-brand-border'
                }`}
              >
                <span>{conta.nome}</span>

                {/* Badge de Alerta na aba */}
                {m.statusAlerta === 'CRITICO' ? (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" title="Saldo crítico!" />
                ) : m.statusAlerta === 'ATENCAO' ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400" title="Saldo em atenção" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" title="Saldo regular" />
                )}

                <span className="text-[11px] font-normal text-zinc-500">
                  {formatCurrency(conta.totalInvestir)}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setIsAddContaOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-brand-neon hover:text-black hover:bg-brand-neon border border-dashed border-brand-neon/40 hover:border-brand-neon transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Conta Pré-Paga
          </button>
        </div>

        {/* Ações da Conta Selecionada */}
        {activeConta && (
          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Tag de Alíquota de Imposto Meta Ativa */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[11px] text-blue-300">
              <Receipt className="w-3.5 h-3.5" />
              <span>Imposto Meta: <strong>{activeConta.aplicarImposto ? `${activeConta.aliquotaImpostoPercentual ?? DEFAULT_META_TAX_PERCENT}%` : 'Isento'}</strong></span>
            </div>

            <button
              onClick={handleCopyWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:text-black hover:bg-emerald-400 border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
              title="Copia resumo pronto com imposto discriminado para o WhatsApp do cliente"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Copiar p/ WhatsApp
            </button>

            <button
              onClick={() => handleOpenEditConta(activeConta)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 border border-brand-border transition-all cursor-pointer"
              title="Editar parâmetros orçamentários e imposto da Meta"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Configurar Conta
            </button>

            <button
              onClick={() => handleDeleteConta(activeConta.id, activeConta.nome)}
              className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all cursor-pointer"
              title="Excluir conta pré-paga"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Conteúdo Principal da Conta Selecionada */}
      {activeConta && activeMetricas && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lado Esquerdo (2 colunas): Tabela de Abastecimentos / Recargas estilo Planilha */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header da Seção de Recargas */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Controle de Abastecimentos</span>
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full border border-zinc-700">
                    {activeConta.nome}
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Clique no status para alternar instantaneamente entre <strong className="text-emerald-400">Pago</strong> e <strong className="text-amber-400">À Fazer</strong>.
                </p>
              </div>

              <button
                onClick={handleOpenAddRecarga}
                className="bg-brand-neon hover:bg-brand-neonHover text-black px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-neon/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Recarga
              </button>
            </div>

            {/* TABELA FIEL AO PRINT DO CLIENTE (com cálculo e transparência do imposto da Meta) */}
            <div className="bg-black/90 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                {/* Linha Superior Preta / Escura Idêntica ao Print */}
                <thead>
                  <tr className="bg-zinc-900/90 border-b border-zinc-700">
                    <th className="py-3.5 px-4 text-xs font-bold text-white uppercase tracking-wider border-r border-zinc-700 w-1/4">
                      TOTAL A SER INVESTIDO
                    </th>
                    <th className="py-3.5 px-4 text-xs font-bold text-white text-right border-r border-zinc-700 w-1/3">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base text-brand-neon font-black">
                            {formatCurrency(activeMetricas.totalInvestirLiquido)}
                          </span>
                          <button
                            onClick={() => handleOpenEditConta(activeConta)}
                            className="text-zinc-500 hover:text-white p-1 rounded cursor-pointer"
                            title="Alterar Total a ser investido e imposto Meta"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                        {activeMetricas.aplicarImposto && (
                          <div className="text-[10px] text-zinc-400 font-normal mt-0.5">
                            Bruto: {formatCurrency(activeMetricas.totalInvestirBruto)} (-{activeMetricas.taxaImposto}% imposto = -{formatCurrency(activeMetricas.impostoTotalInvestir)})
                          </div>
                        )}
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-xs font-bold text-white text-center border-r border-zinc-700 w-1/6">
                      Status
                    </th>
                    <th className="py-3.5 px-4 text-xs font-bold text-white text-center w-1/5">
                      Data
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-800">
                  {activeConta.recargas.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-500 text-sm">
                        Nenhuma recarga cadastrada para esta conta. Clique em "+ Adicionar Recarga".
                      </td>
                    </tr>
                  ) : (
                    activeConta.recargas.map((rec) => {
                      const isPago = rec.status === 'Pago';
                      const taxaDecimal = (activeConta.aplicarImposto ? (activeConta.aliquotaImpostoPercentual ?? DEFAULT_META_TAX_PERCENT) : 0) / 100;
                      const liqVal = rec.valorLiquido ?? parseFloat((rec.valor * (1 - taxaDecimal)).toFixed(2));
                      const taxVal = rec.impostoValor ?? parseFloat((rec.valor * taxaDecimal).toFixed(2));

                      return (
                        <tr 
                          key={rec.id}
                          className="hover:bg-zinc-900/60 transition-colors group"
                        >
                          {/* Coluna 1: Tipo / Descrição */}
                          <td className="py-3 px-4 text-sm font-semibold text-zinc-200 border-r border-zinc-800">
                            <div className="flex items-center justify-between">
                              <span>{rec.tipo}</span>
                              {rec.observacao && (
                                <span className="text-[10px] text-zinc-500 bg-zinc-800/80 px-2 py-0.5 rounded">
                                  {rec.observacao}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Coluna 2: Valor Bruto + Líquido na Meta */}
                          <td className="py-3 px-4 text-sm text-right text-white border-r border-zinc-800">
                            <div className="flex flex-col items-end">
                              <span className="font-black text-white">
                                {formatCurrency(rec.valor)}
                              </span>
                              {activeMetricas.aplicarImposto && (
                                <span className="text-[10px] text-emerald-400 font-mono font-medium">
                                  Líq. Meta: {formatCurrency(liqVal)} (-{formatCurrency(taxVal)})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Coluna 3: Status (Estilo exato da planilha do print com verde vibrante) */}
                          <td className="py-2.5 px-4 text-center border-r border-zinc-800">
                            <button
                              onClick={() => handleToggleStatus(rec.id)}
                              className={`w-full py-1.5 px-3 rounded-lg text-xs font-extrabold tracking-wide transition-all shadow-sm cursor-pointer select-none ${
                                isPago
                                  ? 'bg-[#00E676] text-black hover:bg-[#00c853] shadow-emerald-500/20'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black'
                              }`}
                              title="Clique para alternar o status da recarga"
                            >
                              {rec.status}
                            </button>
                          </td>

                          {/* Coluna 4: Data + Ações rápidas */}
                          <td className="py-3 px-4 text-sm font-medium text-center text-zinc-300">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-zinc-200">{rec.data}</span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOpenEditRecarga(rec)}
                                  className="p-1 text-zinc-500 hover:text-white rounded cursor-pointer"
                                  title="Editar recarga"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRecarga(rec.id)}
                                  className="p-1 text-zinc-500 hover:text-red-400 rounded cursor-pointer"
                                  title="Excluir recarga"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Rodapé Totalizador da Tabela */}
                <tfoot className="bg-zinc-900/90 border-t-2 border-zinc-700 text-xs">
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-zinc-400 border-r border-zinc-700">
                      Total Abastecido (Pago):
                    </td>
                    <td className="py-3.5 px-4 font-black text-right text-emerald-400 border-r border-zinc-700">
                      <div>{formatCurrency(activeMetricas.totalPagoBruto)}</div>
                      {activeMetricas.aplicarImposto && (
                        <div className="text-[10px] text-emerald-300 font-normal">
                          Líq: {formatCurrency(activeMetricas.totalPagoLiquido)}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-zinc-300 border-r border-zinc-700">
                      {activeMetricas.percentualAbastecido}% do total
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-amber-400">
                      À Fazer: {formatCurrency(activeMetricas.totalAFazerBruto)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Aviso de Balanço do Planejamento */}
            <div className="p-3.5 bg-zinc-900/50 border border-brand-border rounded-xl flex items-center justify-between text-xs">
              <span className="text-zinc-400">
                Soma das recargas: <strong className="text-white">{formatCurrency(activeMetricas.totalPagoBruto + activeMetricas.totalAFazerBruto)}</strong>
                {activeMetricas.aplicarImposto && (
                  <span className="text-zinc-500 ml-1">
                    (Líq. Meta: {formatCurrency(activeMetricas.totalPagoLiquido + activeMetricas.totalAFazerLiquido)})
                  </span>
                )}
              </span>
              {activeMetricas.totalInvestirBruto - (activeMetricas.totalPagoBruto + activeMetricas.totalAFazerBruto) > 0 ? (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Resta programar {formatCurrency(activeMetricas.totalInvestirBruto - (activeMetricas.totalPagoBruto + activeMetricas.totalAFazerBruto))} (Líq. {formatCurrency(activeMetricas.totalInvestirLiquido - (activeMetricas.totalPagoLiquido + activeMetricas.totalAFazerLiquido))}) em recargas.
                </span>
              ) : activeMetricas.totalInvestirBruto - (activeMetricas.totalPagoBruto + activeMetricas.totalAFazerBruto) === 0 ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Todas as recargas estão 100% provisionadas para este mês!
                </span>
              ) : (
                <span className="text-zinc-400 font-semibold">
                  Recargas superam o valor inicial planejado em {formatCurrency((activeMetricas.totalPagoBruto + activeMetricas.totalAFazerBruto) - activeMetricas.totalInvestirBruto)}.
                </span>
              )}
            </div>
          </div>

          {/* Lado Direito (1 coluna): Radar de Saldo, Burn Rate & Duração (Runway) */}
          <div className="space-y-4">
            {/* Card de Diagnóstico do Saldo em Conta */}
            <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${
                    activeMetricas.statusAlerta === 'CRITICO' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : activeMetricas.statusAlerta === 'ATENCAO' 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {activeMetricas.statusAlerta === 'CRITICO' ? (
                      <Flame className="w-5 h-5 animate-pulse" />
                    ) : activeMetricas.statusAlerta === 'ATENCAO' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Radar de Autonomia</h3>
                    <p className="text-[11px] text-zinc-400">Previsão de término do saldo</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEditConta(activeConta)}
                  className="text-xs text-brand-neon hover:underline font-semibold cursor-pointer"
                >
                  Ajustar
                </button>
              </div>

              {/* Destaque Grande de Dias Restantes */}
              <div className="text-center py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                  Duração Estimada do Saldo
                </div>
                <div className={`text-4xl font-black mt-1 tracking-tight ${
                  activeMetricas.statusAlerta === 'CRITICO'
                    ? 'text-red-400'
                    : activeMetricas.statusAlerta === 'ATENCAO'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {activeMetricas.diasRestantesSaldo !== null 
                    ? `~${activeMetricas.diasRestantesSaldo} dias` 
                    : 'Sem estimativa'}
                </div>
                <div className="text-xs text-zinc-400 mt-1 px-2">
                  {activeMetricas.mensagemAlerta}
                </div>
              </div>

              {/* Indicadores Detalhados de Fluxo */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">Saldo Líquido na Meta:</span>
                    <span className="inline-flex items-center gap-0.5 text-[9px] bg-brand-neon/10 text-brand-neon px-1.5 py-0.5 rounded border border-brand-neon/30 font-bold">
                      <Sparkles className="w-2.5 h-2.5" /> Automático
                    </span>
                  </div>
                  <span className="font-bold text-white text-sm font-mono">
                    {formatCurrency(activeMetricas.saldoAtualEmConta)}
                  </span>
                </div>

                <div className="text-[10px] text-zinc-500 flex items-center justify-between bg-zinc-900/60 px-2.5 py-1 rounded-lg font-mono">
                  <span>Abastecido Líq. - Gasto:</span>
                  <span>{formatCurrency(activeMetricas.totalPagoLiquido)} - {formatCurrency(gastoMeta)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Ritmo de Consumo Diário:</span>
                  <span className="font-bold text-zinc-300">
                    {formatCurrency(activeMetricas.gastoMedioDiario)} / dia
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Imposto Meta Retido:</span>
                  <span className="font-bold text-blue-400">
                    {activeMetricas.aplicarImposto ? `${activeMetricas.taxaImposto}% retido` : '0%'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Limiar de Alerta de Saldo:</span>
                  <span className="font-bold text-zinc-300">
                    menos de {activeConta.diasAlertaLimite || 4} dias
                  </span>
                </div>

                {activeMetricas.proximaRecarga && (
                  <div className="p-3 bg-zinc-900/90 border border-amber-500/30 rounded-xl space-y-1 mt-2">
                    <div className="flex items-center justify-between text-amber-300 font-bold">
                      <span>Próxima Recarga (Depósito):</span>
                      <span>{formatCurrency(activeMetricas.proximaRecarga.valor)}</span>
                    </div>
                    {activeMetricas.aplicarImposto && (
                      <div className="flex items-center justify-between text-[11px] text-emerald-400">
                        <span>Crédito Líquido na Meta:</span>
                        <span>{formatCurrency(activeMetricas.proximaRecarga.valorLiquido ?? (activeMetricas.proximaRecarga.valor * (1 - (activeMetricas.taxaImposto / 100))))}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                      <span>Data Programada:</span>
                      <span className="text-white font-mono">{activeMetricas.proximaRecarga.data}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Ação rápida para marcar próxima recarga como paga */}
              {activeMetricas.proximaRecarga && (
                <button
                  onClick={() => handleToggleStatus(activeMetricas.proximaRecarga!.id)}
                  className="w-full py-2.5 px-4 bg-[#00E676] hover:bg-[#00c853] text-black font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Marcar Recarga de {activeMetricas.proximaRecarga.data} como PAGA
                </button>
              )}
            </div>

            {/* Dica Operacional sobre o Imposto da Meta Ads */}
            <div className="bg-zinc-900/60 border border-brand-border rounded-2xl p-4 text-xs text-zinc-400 space-y-2">
              <div className="flex items-center gap-2 text-zinc-300 font-bold">
                <Percent className="w-4 h-4 text-brand-neon" />
                <span>Como funciona o imposto da Meta (12,15%)?</span>
              </div>
              <p>
                Em contas pré-pagas no Brasil, a Meta retém <strong>12,15%</strong> de impostos (PIS, COFINS e ISS) no ato do pagamento do boleto ou PIX. O saldo que aparece dentro do Gerenciador de Anúncios é o <strong>valor líquido já com o desconto</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Adicionar / Editar Recarga com Calculadora de Imposto em Tempo Real */}
      {isAddRecargaOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-brand-neon" />
                {editingRecarga ? 'Editar Abastecimento' : 'Novo Abastecimento / Recarga'}
              </h3>
              <button
                onClick={() => setIsAddRecargaOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecarga} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Tipo / Descrição
                </label>
                <input
                  type="text"
                  value={recargaTipo}
                  onChange={(e) => setRecargaTipo(e.target.value)}
                  placeholder="ex: Recarga, Recarga Semanal, Boleto, PIX"
                  className="w-full bg-zinc-900 border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Valor do Depósito / Recarga Bruta (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={recargaValor}
                  onChange={(e) => setRecargaValor(e.target.value)}
                  placeholder="ex: 561 ou 1000"
                  className="w-full bg-zinc-900 border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon font-black text-white"
                  required
                />
                
                {/* Calculadora em Tempo Real de Imposto Meta */}
                {liveRecargaNum > 0 && activeConta?.aplicarImposto && (
                  <div className="mt-2 p-2.5 bg-zinc-900/90 border border-brand-border rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Imposto Meta ({activeConta?.aliquotaImpostoPercentual ?? DEFAULT_META_TAX_PERCENT}%):</span>
                      <span className="text-red-400 font-mono">- {formatCurrency(liveTaxValue)}</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-emerald-400 pt-1 border-t border-zinc-800">
                      <span>Crédito Líquido na Meta:</span>
                      <span className="font-mono text-sm">{formatCurrency(liveNetValue)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Status
                  </label>
                  <select
                    value={recargaStatus}
                    onChange={(e) => setRecargaStatus(e.target.value as RecargaStatus)}
                    className="w-full bg-zinc-900 border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon cursor-pointer"
                  >
                    <option value="À Fazer">À Fazer</option>
                    <option value="Pago">Pago</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Data (DD/MM)
                  </label>
                  <input
                    type="text"
                    value={recargaData}
                    onChange={(e) => setRecargaData(e.target.value)}
                    placeholder="ex: 23/11"
                    className="w-full bg-zinc-900 border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-brand-neon"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Observação / Meio (Opcional)
                </label>
                <input
                  type="text"
                  value={recargaObs}
                  onChange={(e) => setRecargaObs(e.target.value)}
                  placeholder="ex: PIX, Boleto emitido, Nota fiscal..."
                  className="w-full bg-zinc-900 border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRecargaOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-neon hover:bg-brand-neonHover text-black text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-neon/20 cursor-pointer"
                >
                  {editingRecarga ? 'Salvar Alterações' : 'Adicionar Recarga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Configurar / Editar Parâmetros da Conta & Imposto Meta */}
      {editingConta && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-brand-neon" />
                Configurar Conta: {editingConta.nome}
              </h3>
              <button
                onClick={() => setEditingConta(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Total a ser investido no mês (Valor Bruto em R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={quickTotalInvestir}
                  onChange={(e) => setQuickTotalInvestir(e.target.value)}
                  placeholder="ex: 4000"
                  className="w-full bg-zinc-900 border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon font-black text-brand-neon"
                />
                
                {/* Prévia ao vivo do Líquido com o Imposto Meta */}
                {parseFloat(quickTotalInvestir) > 0 && quickAplicarImposto && (
                  <div className="mt-1.5 text-xs text-zinc-400 flex items-center justify-between">
                    <span>Líquido real para anúncios:</span>
                    <strong className="text-emerald-400 font-mono">
                      {formatCurrency(parseFloat(quickTotalInvestir) * (1 - (parseFloat(quickTaxaImposto) || DEFAULT_META_TAX_PERCENT) / 100))}
                    </strong>
                  </div>
                )}
              </div>

              {/* Saldo Atual Puxado Automaticamente com Detalhamento */}
              <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Saldo Atual em Conta</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-neon/15 text-brand-neon border border-brand-neon/30">
                    <Sparkles className="w-3 h-3" /> Puxado Automaticamente
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-0.5">
                  <span className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
                    {formatCurrency(isManualSaldoOverride ? (parseFloat(quickSaldoAtual) || 0) : editingAutoMetrics.saldoAtual)}
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Disponível no Gerenciador
                  </span>
                </div>

                {/* Fórmula e Detalhamento Automático */}
                <div className="text-[11px] bg-black/50 border border-zinc-800/80 rounded-lg p-2.5 space-y-1 font-mono">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span>(+) Abastecido Líquido (Pago):</span>
                    <strong className="text-white font-bold">{formatCurrency(editingAutoMetrics.totalPagoLiquido)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>(-) Gasto Realizado Meta Ads:</span>
                    <strong className="text-red-400 font-bold">- {formatCurrency(editingAutoMetrics.gastoMeta)}</strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800 text-emerald-400 font-semibold">
                    <span>(=) Saldo Disponível Calculado:</span>
                    <strong className="text-sm font-black">{formatCurrency(editingAutoMetrics.saldoAtual)}</strong>
                  </div>
                </div>

                {/* Opção para alternância manual se o usuário quiser sobrescrever */}
                <div className="pt-0.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsManualSaldoOverride(!isManualSaldoOverride)}
                    className="text-[11px] text-zinc-400 hover:text-brand-neon transition-colors cursor-pointer"
                  >
                    {isManualSaldoOverride ? '← Voltar para cálculo 100% automático' : 'Ajustar saldo manualmente'}
                  </button>
                  {isManualSaldoOverride && (
                    <span className="text-[10px] text-amber-400 font-semibold">Ajuste Manual Ativo</span>
                  )}
                </div>

                {isManualSaldoOverride && (
                  <div className="pt-2 border-t border-zinc-800 space-y-1 animate-in fade-in duration-150">
                    <label className="block text-[11px] text-zinc-400 font-semibold">
                      Valor Manual do Saldo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={quickSaldoAtual}
                      onChange={(e) => setQuickSaldoAtual(e.target.value)}
                      placeholder="ex: 1337.08"
                      className="w-full bg-zinc-950 border border-brand-border rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-neon font-bold font-mono"
                    />
                    <span className="text-[10px] text-zinc-500 block">
                      Apenas preencha se desejar sobrescrever o saldo automático calculado.
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Gasto Médio/Dia (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={quickGastoDiario}
                    onChange={(e) => setQuickGastoDiario(e.target.value)}
                    placeholder="ex: 126"
                    className="w-full bg-zinc-900 border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Dias Limite de Alerta
                  </label>
                  <input
                    type="number"
                    value={quickDiasAlerta}
                    onChange={(e) => setQuickDiasAlerta(e.target.value)}
                    placeholder="ex: 4"
                    className="w-full bg-zinc-900 border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon"
                  />
                </div>
              </div>

              {/* Configurações do Imposto Meta */}
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">Descontar Imposto da Meta</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={quickAplicarImposto}
                    onChange={(e) => setQuickAplicarImposto(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-neon focus:ring-brand-neon bg-zinc-900 border-zinc-700 cursor-pointer"
                  />
                </div>

                {quickAplicarImposto && (
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Alíquota do Imposto Retido (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={quickTaxaImposto}
                      onChange={(e) => setQuickTaxaImposto(e.target.value)}
                      placeholder="12.15"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-neon font-mono"
                    />
                    <span className="text-[10px] text-zinc-500 mt-1 block">
                      Padrão de 12,15% aplicado pela Meta no pré-pago brasileiro (PIS, COFINS, ISS).
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingConta(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickConta}
                  className="px-5 py-2.5 bg-brand-neon hover:bg-brand-neonHover text-black text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-neon/20 cursor-pointer"
                >
                  Salvar Parâmetros
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Adicionar Nova Conta Pré-Paga */}
      {isAddContaOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-neon" />
                Cadastrar Conta Pré-Paga
              </h3>
              <button
                onClick={() => setIsAddContaOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateConta} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Nome do Cliente / Conta
                </label>
                <input
                  type="text"
                  value={novaContaNome}
                  onChange={(e) => setNovaContaNome(e.target.value)}
                  placeholder="ex: Cliente Exemplo"
                  className="w-full bg-zinc-900 border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon"
                  required
                />
              </div>

              {accounts.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Vincular a uma Conta Meta Ads (Opcional)
                  </label>
                  <select
                    value={novaContaMetaId}
                    onChange={(e) => {
                      setNovaContaMetaId(e.target.value);
                      const acc = accounts.find(a => a.id === e.target.value);
                      if (acc) {
                        if (!novaContaNome) {
                          setNovaContaNome(acc.name);
                        }
                        if (acc.balance !== undefined && acc.balance !== null) {
                          const rawBal = typeof acc.balance === 'number' ? acc.balance : parseFloat(acc.balance as string);
                          if (!isNaN(rawBal) && rawBal > 0) {
                            setNovaContaSaldo(rawBal.toString());
                          }
                        }
                      }
                    }}
                    className="w-full bg-zinc-900 border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon cursor-pointer"
                  >
                    <option value="">Nenhuma (Controle Manual)</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Total Bruto a ser investido no mês (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={novaContaTotal}
                  onChange={(e) => setNovaContaTotal(e.target.value)}
                  placeholder="ex: 4000"
                  className="w-full bg-zinc-900 border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Saldo Inicial na Meta (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={novaContaSaldo}
                    onChange={(e) => setNovaContaSaldo(e.target.value)}
                    placeholder="ex: 800"
                    className="w-full bg-zinc-900 border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Opcional. Atualizado automaticamente pelas recargas.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Gasto Diário Médio (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={novaContaRitmo}
                    onChange={(e) => setNovaContaRitmo(e.target.value)}
                    placeholder="ex: 120"
                    className="w-full bg-zinc-900 border border-brand-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-neon"
                  />
                </div>
              </div>

              {/* Imposto Meta Checkbox */}
              <div className="flex items-center gap-2 p-2.5 bg-zinc-900 rounded-xl border border-zinc-800">
                <input
                  type="checkbox"
                  id="novaContaImposto"
                  checked={novaContaAplicarImposto}
                  onChange={(e) => setNovaContaAplicarImposto(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-neon bg-zinc-800 border-zinc-700 cursor-pointer"
                />
                <label htmlFor="novaContaImposto" className="text-xs text-zinc-300 cursor-pointer">
                  Descontar imposto pré-pago da Meta (12,15%)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddContaOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-neon hover:bg-brand-neonHover text-black text-xs font-bold rounded-xl transition-all shadow-md shadow-brand-neon/20 cursor-pointer"
                >
                  Cadastrar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
