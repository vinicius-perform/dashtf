import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  Search,
  Cpu,
  Play,
  FileSpreadsheet,
  BookOpen,
  Loader2,
  RefreshCw,
  Zap
} from 'lucide-react';
import { getAllRawAuditRecords } from '../services/metaDataEngine';
import { MetaConfig } from '../types/meta';
import { METRIC_DICTIONARY } from '../services/meta/metricDictionary';
import { runMetaDataEngineUnitTests, UnitTestResult } from '../services/meta/unitTests';
import { runInitialBackfillScript } from '../services/meta/dailyInsightsEngine';

interface MetaDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MetaConfig;
}

export const MetaDebugModal: React.FC<MetaDebugModalProps> = ({
  isOpen,
  onClose,
  config
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'actions' | 'tests' | 'dictionary' | 'backfill' | 'config'>('audit');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<UnitTestResult[]>([]);

  // Backfill 60-Day State
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<{ success: boolean; message: string; totalRecords: number } | null>(null);

  if (!isOpen) return null;

  const records = getAllRawAuditRecords();
  const filteredRecords = records.filter(r => 
    r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(r.raw).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedAudit = records.find(r => r.id === selectedRecordId) || records[0];

  // Extract all distinct Action Types found in audit store
  const actionInspectorRows: Array<{ action_type: string; value: string; level: string; recordId: string }> = [];
  records.forEach(r => {
    const actions = r.raw?.insights?.data?.[0]?.actions || [];
    actions.forEach((act: any) => {
      actionInspectorRows.push({
        action_type: act.action_type,
        value: act.value,
        level: r.lineage?.level || 'UNKNOWN',
        recordId: r.id
      });
    });
  });

  const handleRunTests = () => {
    const res = runMetaDataEngineUnitTests();
    setTestResults(res);
  };

  const handleExecuteBackfill = async () => {
    setIsBackfilling(true);
    setBackfillResult(null);
    try {
      const res = await runInitialBackfillScript(config, '2026-07-01', '2026-08-18');
      setBackfillResult(res);
    } catch (err: any) {
      setBackfillResult({ success: false, totalRecords: 0, message: err.message || 'Erro no processamento' });
    } finally {
      setIsBackfilling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-brand-border rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-brand-border bg-brand-sidebar flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-neon/10 text-brand-neon border border-brand-neon/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                META DATA DEBUG & AUDIT ENGINE
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                  ZERO ESTIMATES STRICT
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Auditoria completa da resposta RAW da Meta Marketing API v19.0
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-brand-card hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 border-b border-brand-border/60 bg-brand-bg flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'audit' ? 'bg-brand-neon text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>RAW & Linhagem ({records.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'actions' ? 'bg-brand-neon text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Action Inspector ({actionInspectorRows.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('backfill')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'backfill' ? 'bg-brand-neon text-black font-bold shadow-md shadow-brand-neon/20' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4 text-brand-neon group-hover:text-black" />
              <span>Carga Inicial (Backfill 60d)</span>
            </button>

            <button
              onClick={() => setActiveTab('dictionary')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'dictionary' ? 'bg-brand-neon text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Dicionário de Métricas</span>
            </button>

            <button
              onClick={() => setActiveTab('tests')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'tests' ? 'bg-brand-neon text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Testes de Integridade</span>
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'config' ? 'bg-brand-neon text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Status API</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2 shrink-0">
            <span>Graph API: <strong className="text-brand-neon">v19.0</strong></span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden p-6">
          {activeTab === 'audit' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
              {/* Record List */}
              <div className="flex flex-col border border-brand-border rounded-xl bg-brand-card overflow-hidden">
                <div className="p-3 border-b border-brand-border bg-brand-sidebar">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Filtrar por ID ou Payload..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-neon font-mono"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/80">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((r) => {
                      const isSelected = selectedAudit?.id === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedRecordId(r.id)}
                          className={`w-full text-left p-3 text-xs flex flex-col gap-1 transition-colors ${
                            isSelected ? 'bg-brand-neon/15 border-l-2 border-brand-neon text-white' : 'hover:bg-zinc-800/40 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono">
                            <span className="font-bold text-brand-neon">{r.id}</span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 rounded">
                              {r.lineage?.reconciliationStatus || 'VALID'}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono truncate">
                            Endpoint: {r.lineage?.endpoint}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-zinc-500 italic">
                      Nenhum registro RAW em memória. Conecte sua conta Meta para ingestão.
                    </div>
                  )}
                </div>
              </div>

              {/* Inspector JSON Viewer */}
              <div className="md:col-span-2 flex flex-col border border-brand-border rounded-xl bg-[#0B0B0D] overflow-hidden">
                <div className="px-4 py-2.5 border-b border-brand-border bg-brand-sidebar flex items-center justify-between font-mono text-xs">
                  <span className="text-brand-neon font-bold">
                    {selectedAudit ? selectedAudit.id : 'SELECIONE UM REGISTRO'}
                  </span>
                  <span className="text-zinc-500 text-[10px]">
                    {selectedAudit?.lineage?.fetchedAt}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] text-emerald-400 whitespace-pre-wrap leading-relaxed select-text bg-[#09090b]">
                  {selectedAudit ? JSON.stringify(selectedAudit.raw, null, 2) : '// Nenhum payload RAW selecionado'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="flex flex-col border border-brand-border rounded-xl bg-brand-card overflow-hidden h-full">
              <div className="p-3 border-b border-brand-border bg-brand-sidebar flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Inspeção de Action Types Normalizados ({actionInspectorRows.length})
                </h3>
                <span className="text-[11px] text-zinc-400 font-mono">
                  Preservação individual sem somar ações semanticamente distintas
                </span>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-brand-bg border-b border-brand-border text-[11px] font-bold text-brand-textMuted uppercase">
                      <th className="py-2.5 px-4">Action Type</th>
                      <th className="py-2.5 px-4 text-right">Valor / Ocorrências</th>
                      <th className="py-2.5 px-4 text-center">Nível</th>
                      <th className="py-2.5 px-4">Record ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {actionInspectorRows.length > 0 ? (
                      actionInspectorRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-zinc-800/40">
                          <td className="py-2.5 px-4 font-bold text-brand-neon">{row.action_type}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-white">{row.value}</td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px]">
                              {row.level}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-zinc-400 truncate max-w-[200px]">{row.recordId}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-zinc-500 italic">
                          Nenhum action_type registrado no momento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'dictionary' && (
            <div className="flex flex-col border border-brand-border rounded-xl bg-brand-card overflow-hidden h-full">
              <div className="p-3 border-b border-brand-border bg-brand-sidebar">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Dicionário Central de Métricas (Central Metric Dictionary)
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {Object.values(METRIC_DICTIONARY).map((def) => (
                  <div key={def.key} className="p-3.5 rounded-lg border border-brand-border bg-brand-bg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 font-bold text-white">
                        <span>{def.displayName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          def.source === 'DIRECT_API' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {def.source}
                        </span>
                        {def.isPrimaryResult && (
                          <span className="bg-brand-neon/20 text-brand-neon border border-brand-neon/30 px-2 py-0.5 rounded text-[10px]">
                            RESULTADO PRINCIPAL
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-400 text-[11px] mt-1">{def.description}</p>
                    </div>

                    <div className="font-mono text-[11px] text-right shrink-0">
                      {def.formula && (
                        <div className="text-brand-neon">Fórmula: <code>{def.formula}</code></div>
                      )}
                      {def.metaField && (
                        <div className="text-zinc-400">Campo Meta: <code>{def.metaField}</code></div>
                      )}
                      {def.actionType && (
                        <div className="text-zinc-400">Action Type: <code>{def.actionType}</code></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="flex flex-col border border-brand-border rounded-xl bg-brand-card overflow-hidden h-full p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Bateria Automatizada de Testes de Integridade</h3>
                  <p className="text-xs text-zinc-400">
                    Executa validações rigorosas de paginação, idempotência, ações e tolerância zero a nulos/divisões por zero.
                  </p>
                </div>

                <button
                  onClick={handleRunTests}
                  className="flex items-center gap-2 bg-brand-neon text-black font-bold text-xs px-4 py-2 rounded-lg hover:bg-brand-neonHover transition-all shadow-md shadow-brand-neon/20"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Executar Testes Agora</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {testResults.length > 0 ? (
                  testResults.map((t, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border flex items-center justify-between text-xs font-mono ${
                        t.passed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {t.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
                        <div>
                          <div className="font-bold text-white">{t.name} <span className="text-[10px] opacity-60">[{t.category}]</span></div>
                          <div className="text-[11px] opacity-90 mt-0.5">{t.message}</div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {t.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-zinc-500 italic">
                    Clique em "Executar Testes Agora" para rodar a bateria de testes de integridade.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'backfill' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-brand-card border border-brand-border rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-brand-neon/15 text-brand-neon border border-brand-neon/30">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      Carga Inicial de Dados Históricos (Backfill de 60 Dias)
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Baixa todos os snapshots diários (`time_increment=1`) de <strong>01/07/2026 até 18/08/2026</strong> da Meta API e grava em lote no <strong>Supabase PostgreSQL</strong>.
                    </p>
                  </div>
                </div>

                <div className="bg-brand-sidebar border border-brand-border/80 rounded-xl p-4 space-y-2 text-xs font-mono text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Período de Varredura:</span>
                    <span className="text-brand-neon font-bold">01/07/2026 ➔ 18/08/2026 (49 dias)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Modo de Agregação:</span>
                    <span className="text-white font-bold">time_increment=1 (Quebra Diária Nativa)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Destino de Gravação:</span>
                    <span className="text-emerald-400 font-bold">Supabase (`meta_daily_insights`) + Cache Local</span>
                  </div>
                </div>

                {/* Toast Result Feedback Banner */}
                {backfillResult && (
                  <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                    backfillResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}>
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm text-white">
                        {backfillResult.success ? 'Carga Inicial Concluída!' : 'Erro na Carga Inicial'}
                      </div>
                      <div className="mt-1 font-mono">{backfillResult.message}</div>
                    </div>
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  onClick={handleExecuteBackfill}
                  disabled={isBackfilling}
                  className="w-full py-3.5 px-4 bg-brand-neon hover:bg-brand-neonHover text-black font-black text-xs rounded-xl shadow-lg shadow-brand-neon/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBackfilling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Baixando histórico de 60 dias da Meta API e gravando no Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Executar Carga Inicial de 60 Dias (Supabase DB)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-brand-card border border-brand-border rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Estado da Conexão com a Meta Graph API
                </h3>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-400">Status da Conexão:</span>
                    <span className={config.isConnected ? 'text-emerald-400 font-bold' : 'text-yellow-400 font-bold'}>
                      {config.isConnected ? 'CONECTADO (LIVE API)' : 'PENDENTE DE TOKEN DA META'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-400">Conta Selecionada:</span>
                    <span className="text-white font-bold">{config.selectedAccountId}</span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-zinc-800">
                    <span className="text-zinc-400">Versão da API:</span>
                    <span className="text-brand-neon font-bold">{config.apiVersion}</span>
                  </div>

                  <div className="flex justify-between py-2">
                    <span className="text-zinc-400">Última Sincronização:</span>
                    <span className="text-white">{config.lastSyncedAt || 'Não realizada'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
