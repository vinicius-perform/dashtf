-- Agendamento da atualização automática da Carteira (rodar UMA vez no SQL Editor do Supabase).
-- Antes: ative as extensões pg_cron e pg_net em Database → Extensions.
-- Substitua <CRON_SECRET> pelo mesmo valor configurado no segredo CRON_SECRET das Edge Functions.
-- NÃO commite este arquivo com o segredo preenchido.

-- Atualiza "Hoje" e "Este mês" de todas as contas ativas a cada 15 minutos
SELECT cron.schedule(
  'meta-carteira-sync',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://aczsouypqgjlrqdmrtwq.supabase.co/functions/v1/meta-carteira',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<CRON_SECRET>'
    ),
    body    := '{"mode":"cron"}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

-- Limpeza diária do cache antigo (03:10 UTC)
SELECT cron.schedule('meta-carteira-purge', '10 3 * * *', $$ SELECT public.purge_meta_carteira_cache(); $$);

-- Para remover:  SELECT cron.unschedule('meta-carteira-sync');
