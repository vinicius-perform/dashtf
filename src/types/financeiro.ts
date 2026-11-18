export type RecargaStatus = 'Pago' | 'À Fazer' | 'Cancelado';

export interface RecargaItem {
  id: string;
  tipo: string; // ex: "Recarga", "Recarga Semanal", "Boleto", "PIX"
  valor: number; // Valor Bruto depositado
  valorLiquido?: number; // Valor Líquido creditado na conta Meta após desconto de 12,15%
  impostoValor?: number; // Valor retido de imposto
  status: RecargaStatus;
  data: string; // ex: "03/11", "23/11", ou "2024-11-23"
  observacao?: string;
  pagoEm?: string;
}

export interface ContaPrePaga {
  id: string;
  nome: string;
  metaAccountId?: string; // ID da conta no Meta Ads se vinculada
  totalInvestir: number; // Total Bruto a ser depositado no mês/ciclo (ex: 4000)
  totalInvestirLiquido?: number; // Total Líquido real em anúncios (ex: 3514)
  saldoAtualEmConta: number; // Saldo disponível atual na conta Meta (já líquido)
  gastoMedioDiario: number; // Gasto médio diário (R$/dia)
  diasAlertaLimite: number; // Limiar de dias para alertar saldo acabando (default: 4)
  aplicarImposto: boolean; // Se desconta imposto Meta (default: true para contas pré-pagas)
  aliquotaImpostoPercentual: number; // Padrão: 12.15% (imposto Meta Brasil)
  recargas: RecargaItem[];
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MetricasContaPrePaga {
  totalInvestirBruto: number; // ex: 4.000
  totalInvestirLiquido: number; // ex: 3.514 (com 12,15% descontado)
  impostoTotalInvestir: number; // ex: 486
  totalPagoBruto: number;
  totalPagoLiquido: number;
  impostoPagoTotal: number;
  totalAFazerBruto: number;
  totalAFazerLiquido: number;
  percentualAbastecido: number;
  saldoRestanteInvestimentoBruto: number;
  saldoRestanteInvestimentoLiquido: number;
  saldoAtualEmConta: number; // Saldo na Meta (líquido)
  gastoMedioDiario: number;
  diasRestantesSaldo: number | null; // saldoAtualEmConta / gastoMedioDiario
  taxaImposto: number; // 12.15
  aplicarImposto: boolean;
  statusAlerta: 'CRITICO' | 'ATENCAO' | 'OK';
  mensagemAlerta?: string;
  proximaRecarga?: RecargaItem | null;
}
