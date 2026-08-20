import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_CHUNK_SIZE = 500;

function sanitizeString(val: any, maxLength = 255): string {
  if (val === undefined || val === null) return "";
  return String(val).trim().slice(0, maxLength);
}

function parseCurrency(val: any): number {
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleanStr = String(val)
    .replace(/[^0-9,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
}

function parseIsoDate(val: any): string {
  if (!val) return new Date().toISOString();
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

serve(async (req: Request) => {
  // Handle CORS Preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ success: false, error: "Método HTTP não permitido. Utilize POST." }), 
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Corpo da requisição não contém um JSON válido." }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawBatch = Array.isArray(payload) ? payload : [payload];
    const leadsBatch = rawBatch.filter((item) => item && typeof item === "object");

    if (leadsBatch.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Nenhum registro de lead válido foi fornecido." }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Inicializar cliente Supabase com Service Role Key para persistência server-to-server
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ [SYNC-CRM-SHEET] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes no ambiente.");
      return new Response(
        JSON.stringify({ success: false, error: "Erro interno no servidor de banco de dados." }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const nowIso = new Date().toISOString();

    // Sanitização e normalização estrita de tipos
    const formattedLeads = leadsBatch.map((item: any) => {
      const rawEmail = sanitizeString(item.email || item["E-mail"] || item["email"]);
      const emailClean = rawEmail.toLowerCase();
      
      const rawDate = item.data_hora || item["Data/Hora"] || item["data_hora"];

      return {
        data_hora: parseIsoDate(rawDate),
        nome: sanitizeString(item.nome || item["Nome"]) || "Lead Sem Nome",
        telefone: sanitizeString(item.telefone || item["Telefone"], 50),
        email: emailClean || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@sem-email.com`,
        clinica: sanitizeString(item.clinica || item["Nome da Clínica"]),
        especialidade: sanitizeString(item.especialidade || item["Especialidade"]),
        objetivo_principal: sanitizeString(item.objetivo_principal || item["Objetivo Principal"], 1000),
        faturamento: sanitizeString(item.faturamento || item["Faturamento"], 100),
        trafego_pago: sanitizeString(item.trafego_pago || item["Tráfego Pago"], 100),
        prazo_estimado: sanitizeString(item.prazo_estimado || item["Prazo Estimado para Iniciar"], 100),
        score_pontos: parseInt(String(item.score_pontos || item["Score Pontos"] || "0"), 10) || 0,
        tipo_lead: (sanitizeString(item.tipo_lead || item["Tipo do Lead"] || "D", 10) || "D").toUpperCase(),
        campaign_id: sanitizeString(item.campaign_id || item["Campanha"] || item["campaign_id"], 100),
        adset_id: sanitizeString(item.adset_id || item["Conjunto"] || item["adset_id"], 100),
        ad_id: sanitizeString(item.ad_id || item["Anúncio"] || item["ad_id"], 100),
        sdr: sanitizeString(item.sdr || item["SDR"], 100),
        agendamento: sanitizeString(item.agendamento || item["AGENDAMENTO"] || "Não", 20),
        venda: sanitizeString(item.venda || item["VENDA"] || "Não", 20),
        valor_conversao: parseCurrency(item.valor_conversao || item["VALOR DE CONVERSÃO"]),
        updated_at: nowIso
      };
    });

    // Processamento seguro em chunks para suportar lotes massivos (ex: 5.000 leads)
    let totalProcessed = 0;
    for (let i = 0; i < formattedLeads.length; i += BATCH_CHUNK_SIZE) {
      const chunk = formattedLeads.slice(i, i + BATCH_CHUNK_SIZE);
      const { error: upsertError } = await supabase
        .from("crm_leads")
        .upsert(chunk, { onConflict: "email" });

      if (upsertError) {
        console.error(`❌ [SYNC-CRM-SHEET] Erro no Upsert do lote ${i} - ${i + chunk.length}:`, upsertError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Falha ao persistir os registros de leads no banco de dados." 
          }), 
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      totalProcessed += chunk.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronização de leads concluída com sucesso.`,
        processedCount: totalProcessed
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("❌ [SYNC-CRM-SHEET] Exceção não tratada na Edge Function:", err?.message || err);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno no processamento do webhook." }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

