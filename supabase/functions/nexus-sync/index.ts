import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';
  const metaAccessToken = Deno.env.get('META_ACCESS_TOKEN') || '';
  const accountId = Deno.env.get('META_ACCOUNT_ID') || '1115861513053539';

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. UPDATE Status: RUNNING
    await supabase
      .from('sys_sync_status')
      .upsert({
        id: 1,
        engine_name: 'Nexus Sync',
        status: 'RUNNING',
        message: 'Sincronização profunda Nexus Sync em execução...',
        last_run: new Date().toISOString()
      });

    // 2. Fetch Meta API for last 7 days (time_increment=1)
    const actId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    const normAcc = accountId.replace(/^act_/, '');

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const sinceStr = sevenDaysAgo.toISOString().split('T')[0];
    const untilStr = today.toISOString().split('T')[0];

    let count = 0;

    if (metaAccessToken) {
      const metaUrl = `https://graph.facebook.com/v19.0/${actId}/insights?` + new URLSearchParams({
        access_token: metaAccessToken,
        level: 'campaign',
        fields: 'campaign_id,campaign_name,spend,impressions,inline_link_clicks,actions,cost_per_action_type',
        time_range: JSON.stringify({ since: sinceStr, until: untilStr }),
        time_increment: '1',
        limit: '500'
      });

      const res = await fetch(metaUrl);
      const data = await res.json();
      const rawList = data.data || [];

      if (rawList.length > 0) {
        const formattedRows = rawList.map((ins: any) => ({
          ad_account_id: normAcc,
          campaign_id: ins.campaign_id,
          date: ins.date_start,
          spend: parseFloat(ins.spend || '0'),
          impressions: parseInt(ins.impressions || '0'),
          inline_link_clicks: parseInt(ins.inline_link_clicks || ins.clicks || '0'),
          actions: ins.actions || [],
          cost_per_action_type: ins.cost_per_action_type || [],
          updated_at: new Date().toISOString()
        }));

        // 3. Upsert to meta_daily_insights
        await supabase
          .from('meta_daily_insights')
          .upsert(formattedRows, { onConflict: 'ad_account_id,campaign_id,date' });

        count = formattedRows.length;
      }
    }

    // 4. Garbage Collection: Remove snapshots older than 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(today.getDate() - 60);
    const cutoffDateStr = sixtyDaysAgo.toISOString().split('T')[0];

    await supabase
      .from('meta_daily_insights')
      .delete()
      .lt('date', cutoffDateStr);

    // 5. Finalize Status: SUCCESS
    const successMsg = `Sincronização profunda concluída com sucesso. ${count} snapshots atualizados.`;
    await supabase
      .from('sys_sync_status')
      .upsert({
        id: 1,
        engine_name: 'Nexus Sync',
        status: 'SUCCESS',
        message: successMsg,
        last_run: new Date().toISOString()
      });

    return new Response(JSON.stringify({ success: true, message: successMsg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (err: any) {
    const errorMsg = `Erro no Nexus Sync: ${err.message}`;
    await supabase
      .from('sys_sync_status')
      .upsert({
        id: 1,
        engine_name: 'Nexus Sync',
        status: 'ERROR',
        message: errorMsg,
        last_run: new Date().toISOString()
      });

    return new Response(JSON.stringify({ success: false, error: errorMsg }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
