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
