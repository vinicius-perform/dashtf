-- TABELA 1: CACHE ROTATIVO (SNAPSHOTS DIÁRIOS)
CREATE TABLE IF NOT EXISTS meta_daily_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ad_account_id VARCHAR(255) NOT NULL,
    campaign_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    spend NUMERIC(10, 2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    inline_link_clicks INTEGER DEFAULT 0,
    actions JSONB DEFAULT '{}'::jsonb,
    cost_per_action_type JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(ad_account_id, campaign_id, date)
);

-- Indexação para buscas em milissegundos
CREATE INDEX IF NOT EXISTS idx_meta_insights_date ON meta_daily_insights(date);
CREATE INDEX IF NOT EXISTS idx_meta_insights_campaign ON meta_daily_insights(campaign_id);

-- Ativar Segurança (RLS)
ALTER TABLE meta_daily_insights ENABLE ROW LEVEL SECURITY;

-- Política: Permitir leitura/escrita para usuários autenticados ou acessos via API Key
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for all users' AND tablename = 'meta_daily_insights') THEN
        CREATE POLICY "Enable read access for all users" ON meta_daily_insights FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable insert/update for service role' AND tablename = 'meta_daily_insights') THEN
        CREATE POLICY "Enable insert/update for service role" ON meta_daily_insights FOR ALL USING (true);
    END IF;
END $$;


-- TABELA 2: VISUALIZAÇÕES SALVAS DO DASHBOARD (VIEWS)
CREATE TABLE IF NOT EXISTS user_saved_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- Referência futura ao auth.users
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL, -- Guardará a estrutura de filtros, ordenação e colunas
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar Segurança (RLS)
ALTER TABLE user_saved_views ENABLE ROW LEVEL SECURITY;

-- Política temporária
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all access for views' AND tablename = 'user_saved_views') THEN
        CREATE POLICY "Enable all access for views" ON user_saved_views FOR ALL USING (true);
    END IF;
END $$;


-- TABELA 3: STATUS DO NEXUS SYNC (AUTOMATION HEARTBEAT & CRON STATUS)
CREATE TABLE IF NOT EXISTS sys_sync_status (
    id INT PRIMARY KEY DEFAULT 1,
    engine_name VARCHAR(50) DEFAULT 'Nexus Sync',
    last_run TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status VARCHAR(20) DEFAULT 'SUCCESS', -- 'SUCCESS', 'ERROR', 'RUNNING'
    message TEXT
);

-- Inserir a linha mestre (Singleton)
INSERT INTO sys_sync_status (id, last_run, status, message)
VALUES (1, NOW(), 'SUCCESS', 'Sincronização profunda concluída com sucesso')
ON CONFLICT (id) DO NOTHING;

-- Ativar Segurança (RLS)
ALTER TABLE sys_sync_status ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable all access for sync status' AND tablename = 'sys_sync_status') THEN
        CREATE POLICY "Enable all access for sync status" ON sys_sync_status FOR ALL USING (true);
    END IF;
END $$;


-- TABELA 4: INTEGRAÇÕES DOS USUÁRIOS (PERSISTÊNCIA DE TOKEN DA META API NO SUPABASE)
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    meta_access_token TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Segurança de Nível de Linha (RLS)
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Políticas: O usuário só pode ler, inserir e editar o próprio token
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own integration' AND tablename = 'user_integrations') THEN
        CREATE POLICY "Users can view own integration" ON user_integrations FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own integration' AND tablename = 'user_integrations') THEN
        CREATE POLICY "Users can insert own integration" ON user_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own integration' AND tablename = 'user_integrations') THEN
        CREATE POLICY "Users can update own integration" ON user_integrations FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- O token da Meta NÃO fica mais no banco nem no código: ele é o segredo META_ACCESS_TOKEN das Edge Functions.


-- TABELA 5: INTEGRAÇÃO CRM (PLANILHA DE LEADS)
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_hora TIMESTAMP WITH TIME ZONE,
    nome VARCHAR(255),
    telefone VARCHAR(50),
    email VARCHAR(255) UNIQUE,
    clinica VARCHAR(255),
    especialidade VARCHAR(255),
    objetivo_principal TEXT,
    faturamento VARCHAR(100),
    trafego_pago VARCHAR(100),
    prazo_estimado VARCHAR(100),
    score_pontos INTEGER DEFAULT 0,
    tipo_lead VARCHAR(50),
    campaign_id VARCHAR(255), -- ID vindo do Meta
    adset_id VARCHAR(255),    -- ID vindo do Meta
    ad_id VARCHAR(255),       -- ID vindo do Meta
    sdr VARCHAR(100),
    agendamento VARCHAR(20),  -- 'Sim', 'Não', etc.
    venda VARCHAR(20),        -- 'Sim', 'Não', etc.
    valor_conversao NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Constraint UNIQUE para garantir o funcionamento do ON CONFLICT (email) no Upsert
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_leads_email_key') THEN
        ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_email_key UNIQUE (email);
    END IF;
END $$;

-- Indexação para buscas rápidas no dashboard
CREATE INDEX IF NOT EXISTS idx_crm_leads_campaign ON crm_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON crm_leads(email);
CREATE INDEX IF NOT EXISTS idx_crm_leads_telefone ON crm_leads(telefone);

-- Ativar Segurança (RLS)
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable full access for authenticated users' AND tablename = 'crm_leads') THEN
        CREATE POLICY "Enable full access for authenticated users" ON crm_leads FOR ALL USING (auth.role() = 'authenticated');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Enable read access for all on crm_leads' AND tablename = 'crm_leads') THEN
        CREATE POLICY "Enable read access for all on crm_leads" ON crm_leads FOR SELECT USING (true);
    END IF;
END $$;



