import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GerenciadorView } from './components/GerenciadorView';
import { MiningView } from './components/MiningView';
import { IntegrationsView } from './components/IntegrationsView';
import { CrmLeadsView } from './components/CrmLeadsView';
import { CreativesView } from './components/CreativesView';
import { SmmAuditView } from './components/SmmAuditView';
import { TeamOkrView } from './components/TeamOkrView';
import { MetaDebugModal } from './components/MetaDebugModal';
import { 
  getSavedMetaConfig, 
  saveMetaConfig,
  fetchCampaigns, 
  fetchAdSets, 
  fetchAds, 
  fetchAccountInsights,
  computeSummaryMetrics, 
  fetchAdAccounts,
  extractLeadsFromActions
} from './services/metaDataEngine';
import { 
  fetchUserMetaToken 
} from './services/userIntegrationService';
import { 
  MetaConfig, 
  MetaAdAccount, 
  MetaCampaign, 
  MetaAdSet, 
  MetaAd, 
  GerenciadorSummary 
} from './types/meta';

import { LoginView } from './components/LoginView';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';
import { DateRange } from './components/DateRangePicker';
import { getTodayRange } from './utils/timezone';
import { 
  fetchHybridCampaigns, 
  sync7DaysAttributionWindow, 
  purgeExpiredSnapshots 
} from './services/meta/dailyInsightsEngine';

export function App() {
  // Auth Session State & Loading Guard
  const [session, setSession] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'gerenciador' | 'mineracao' | 'leads' | 'criativos' | 'integracoes' | 'smm-audit' | 'equipe-okrs'>('gerenciador');
  const [activeLevel, setActiveLevel] = useState<string>('campanhas');
  const [metaConfig, setMetaConfig] = useState<MetaConfig>(getSavedMetaConfig());
  const [accounts, setAccounts] = useState<MetaAdAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(metaConfig.selectedAccountId || '1115861513053539');

  const selectedAccObj = accounts.find(a => a.id === selectedAccountId);
  const accountTimezone = selectedAccObj?.timezone_name || 'America/Sao_Paulo';

  const [dateRange, setDateRange] = useState<DateRange>(() => getTodayRange(accountTimezone));

  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [adsets, setAdSets] = useState<MetaAdSet[]>([]);
  const [ads, setAds] = useState<MetaAd[]>([]);
  const [summary, setSummary] = useState<GerenciadorSummary>(computeSummaryMetrics([]));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(new Date().toLocaleString('pt-BR'));

  // 1. Check Supabase Auth Session Persistence on App Mount (Prevents F5 flash)
  // 1. Check Supabase Auth Session Persistence on App Mount (Prevents F5 flash)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setIsAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setIsAuthChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 1.b Load User Meta Integration Token from Supabase user_integrations table on Session
  useEffect(() => {
    if (!session?.user?.id) return;

    let isMounted = true;
    const userId = session.user.id;
    const userEmail = session.user.email;

    fetchUserMetaToken(userId, userEmail)
      .then((dbToken) => {
        if (!isMounted || !dbToken) return;
        setMetaConfig((prev) => {
          if (prev.accessToken === dbToken && prev.isConnected) {
            return prev; // Preserve identity to avoid downstream re-renders
          }
          return {
            ...prev,
            accessToken: dbToken,
            isConnected: true
          };
        });
      })
      .catch((err) => {
        console.error('Falha ao sincronizar token da Meta:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id, session?.user?.email]);

  // Trigger 60-day retention purger on app mount
  useEffect(() => {
    purgeExpiredSnapshots(60);
  }, []);

  // Midnight Reactivity Check: Auto-advance "Hoje" date filter when account timezone crosses midnight
  useEffect(() => {
    const interval = setInterval(() => {
      const freshToday = getTodayRange(accountTimezone);
      setDateRange((prev) => {
        if (prev.label.startsWith('Hoje') && prev.startDate !== freshToday.startDate) {
          console.log(`🌙 [MIDNIGHT REACTIVITY] Account timezone crossed midnight! Advancing filter to ${freshToday.startDate}`);
          return freshToday;
        }
        return prev;
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [accountTimezone]);

  const handleSelectAccount = useCallback((accId: string) => {
    const accObj = accounts.find(a => a.id === accId);
    setMetaConfig((prev) => {
      const updatedConfig: MetaConfig = {
        ...prev,
        selectedAccountId: accId,
        accountName: accObj ? accObj.name : prev.accountName
      };
      saveMetaConfig(updatedConfig);
      return updatedConfig;
    });
    setSelectedAccountId(accId);
  }, [accounts]);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentConfig: MetaConfig = {
        ...metaConfig,
        selectedAccountId: selectedAccountId
      };

      // Hybrid Orchestration: 100% DB for past, Live for Today, Combined for Ranges
      const [campData, adsetData, accInsights] = await Promise.all([
        fetchHybridCampaigns(currentConfig, dateRange, fetchCampaigns),
        fetchAdSets(currentConfig, undefined, dateRange),
        fetchAccountInsights(currentConfig, dateRange)
      ]);

      const adData = await fetchAds(currentConfig, adsetData, dateRange);

      setCampaigns(campData);
      setAdSets(adsetData);
      setAds(adData);

      const baseSummary = computeSummaryMetrics(campData);

      // Strictly map account level KPI insights
      if (accInsights) {
        if (accInsights.spend !== undefined && accInsights.spend !== null) {
          baseSummary.investimentoTotal = parseFloat(accInsights.spend);
        }
        if (accInsights.impressions) {
          baseSummary.impressioesTotal = parseInt(accInsights.impressions);
        }

        // Inline Link Clicks for Cliques no Link (Not generic clicks)
        const inlineClicks = accInsights.inline_link_clicks !== undefined
          ? parseInt(accInsights.inline_link_clicks)
          : (accInsights.clicks ? parseInt(accInsights.clicks) : null);
        baseSummary.cliquesTotal = inlineClicks;

        // Inline Link Click CTR for CTR Médio
        if (accInsights.inline_link_click_ctr !== undefined) {
          baseSummary.ctrMedio = parseFloat(parseFloat(accInsights.inline_link_click_ctr).toFixed(2));
        } else if (accInsights.ctr) {
          baseSummary.ctrMedio = parseFloat(parseFloat(accInsights.ctr).toFixed(2));
        }

        // CPC Médio (Cost per link click)
        if (accInsights.cpc !== undefined) {
          baseSummary.cpcMedio = parseFloat(parseFloat(accInsights.cpc).toFixed(2));
        } else if (accInsights.spend && inlineClicks) {
          baseSummary.cpcMedio = parseFloat((parseFloat(accInsights.spend) / inlineClicks).toFixed(2));
        }

        // Strict Lead Action Extraction for Account Card
        if (accInsights.actions) {
          const accLeads = extractLeadsFromActions(accInsights.actions);
          baseSummary.leadsTotal = accLeads.count > 0 ? accLeads.count : null;
          if (accLeads.count > 0 && baseSummary.investimentoTotal) {
            baseSummary.cpaMedio = parseFloat((baseSummary.investimentoTotal / accLeads.count).toFixed(2));
          } else {
            baseSummary.cpaMedio = null;
          }
        }
      }

      setSummary(baseSummary);
      setLastUpdatedTime(new Date().toLocaleString('pt-BR'));
    } catch (e) {
      console.error('Error in Meta Data Integrity Engine:', e);
    } finally {
      setIsLoading(false);
    }
  }, [metaConfig, selectedAccountId, dateRange]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleToggleCampaignStatus = useCallback((campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? { ...c, status: c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
          : c
      )
    );
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const handleToggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as any);
  }, []);

  // 2. Initial Auth Session Checking Splash Guard
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white select-none">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-neon animate-spin" />
          <span className="text-xs text-zinc-400 font-semibold tracking-wide">
            Verificando autenticação no Supabase...
          </span>
        </div>
      </div>
    );
  }

  // 3. Unauthenticated State Guard -> Render Login Screen
  if (!session) {
    return (
      <LoginView 
        onLoginSuccess={() => {
          supabase.auth.getSession().then(({ data: { session: newSession } }) => {
            setSession(newSession);
          });
        }} 
      />
    );
  }

  // 4. Authenticated State -> Render Full Dashboard
  return (
    <div className="flex min-h-screen bg-brand-bg text-white font-sans selection:bg-brand-neon selection:text-black">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        activeLevel={activeLevel}
        setActiveLevel={setActiveLevel}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header Bar */}
        <Header
          activeTab={activeTab}
          metaConfig={metaConfig}
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          setSelectedAccountId={handleSelectAccount}
          dateRange={dateRange}
          setDateRange={setDateRange}
          onRefresh={loadAllData}
          isLoading={isLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenDebug={() => setIsDebugOpen(true)}
          lastUpdatedTime={lastUpdatedTime}
        />

        {/* Dynamic Screen View */}
        <main className="flex-1 pb-12">
          {activeTab === 'gerenciador' && (
            <GerenciadorView
              summary={summary}
              campaigns={campaigns}
              adsets={adsets}
              ads={ads}
              activeLevel={activeLevel}
              setActiveLevel={setActiveLevel}
              onToggleCampaignStatus={handleToggleCampaignStatus}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'mineracao' && (
            <MiningView onNavigateToGerenciador={() => setActiveTab('gerenciador')} />
          )}

          {activeTab === 'leads' && (
            <CrmLeadsView isLoading={isLoading} />
          )}

          {activeTab === 'criativos' && (
            <CreativesView
              ads={ads}
              campaigns={campaigns}
              adsets={adsets}
              isLoading={isLoading}
              dateRange={dateRange}
              setDateRange={setDateRange}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'smm-audit' && (
            <SmmAuditView />
          )}

          {activeTab === 'equipe-okrs' && (
            <TeamOkrView />
          )}

          {activeTab === 'integracoes' && (
            <IntegrationsView
              session={session}
              metaConfig={metaConfig}
              setMetaConfig={setMetaConfig}
              accounts={accounts}
              setAccounts={setAccounts}
              onRefreshData={loadAllData}
            />
          )}
        </main>

        {/* Meta Data Debug Engine Modal */}
        <MetaDebugModal
          isOpen={isDebugOpen}
          onClose={() => setIsDebugOpen(false)}
          config={metaConfig}
        />
      </div>
    </div>
  );
}

export default App;
