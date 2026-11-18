-- Cache das linhas da Carteira de Contas calculadas pela Edge Function meta-carteira.
-- Leitura: apenas usuários autenticados. Escrita: apenas service role (Edge Function).
CREATE TABLE IF NOT EXISTS public.meta_carteira_cache (
  account_id  TEXT        NOT NULL,
  since       DATE        NOT NULL,
  until       DATE        NOT NULL,
  payload     JSONB       NOT NULL,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, since, until)
);

CREATE INDEX IF NOT EXISTS meta_carteira_cache_fetched_idx ON public.meta_carteira_cache (fetched_at);

ALTER TABLE public.meta_carteira_cache ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'meta_carteira_cache' AND policyname = 'Authenticated can read carteira cache'
  ) THEN
    CREATE POLICY "Authenticated can read carteira cache"
      ON public.meta_carteira_cache FOR SELECT
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Limpeza: mantém só os últimos 60 dias de cache
CREATE OR REPLACE FUNCTION public.purge_meta_carteira_cache() RETURNS void
LANGUAGE sql AS $$
  DELETE FROM public.meta_carteira_cache WHERE fetched_at < now() - interval '60 days';
$$;
