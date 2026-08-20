import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS Preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método não permitido. Utilize o método POST." }), 
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Payload JSON inválido." }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const leadsBatch = Array.isArray(payload) ? payload : [payload];

    if (leadsBatch.length === 0 || !leadsBatch[0]) {
      return new Response(
        JSON.stringify({ error: "Corpo da requisição vazio ou sem objetos de lead válidos." }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Inicializar cliente Supabase com Service Role Key para ignorar RLS server-to-server
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.");
      return new Response(
        JSON.stringify({ error: "Erro interno no servidor de banco de dados (Credenciais ausentes)." }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Desestruturar e sanitizar o payload garantindo conversão explícita de qualquer tipo (números, nulos) para String
    const formattedLeads = leadsBatch.map((item: any) => {
      const toString = (val: any) => String(val !== undefined && val !== null ? val : "").trim();

      const rawEmail = toString(item.email || item["E-mail"] || item["email"]);
      const emailClean = rawEmail.toLowerCase();
      
      const rawDate = item.data_hora || item["Data/Hora"] || item["data_hora"];

      return {
        data_hora: rawDate ? new Date(rawDate).toISOString() : new Date().toISOString(),
        nome: toString(item.nome || item["Nome"]) || "Lead Sem Nome",
        telefone: toString(item.telefone || item["Telefone"]),
        email: emailClean || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@sem-email.com`,
        clinica: toString(item.clinica || item["Nome da Clínica"]),
        especialidade: toString(item.especialidade || item["Especialidade"]),
        objetivo_principal: toString(item.objetivo_principal || item["Objetivo Principal"]),
        faturamento: toString(item.faturamento || item["Faturamento"]),
        trafego_pago: toString(item.trafego_pago || item["Tráfego Pago"]),
        prazo_estimado: toString(item.prazo_estimado || item["Prazo Estimado para Iniciar"]),
        score_pontos: parseInt(toString(item.score_pontos || item["Score Pontos"] || "0"), 10) || 0,
        tipo_lead: (toString(item.tipo_lead || item["Tipo do Lead"] || "D") || "D").toUpperCase(),
        campaign_id: toString(item.campaign_id || item["Campanha"]),
        adset_id: toString(item.adset_id || item["Conjunto"]),
        ad_id: toString(item.ad_id || item["Anúncio"]),
        sdr: toString(item.sdr || item["SDR"]),
        agendamento: toString(item.agendamento || item["AGENDAMENTO"] || "Não"),
        venda: toString(item.venda || item["VENDA"] || "Não"),
        valor_conversao: parseFloat(toString(item.valor_conversao || item["VALOR DE CONVERSÃO"] || "0").replace(",", ".")) || 0,
        updated_at: new Date().toISOString()
      };
    });

    // Upsert na tabela crm_leads batendo pela chave UNIQUE do e-mail
    const { data, error } = await supabase
      .from("crm_leads")
      .upsert(formattedLeads, { onConflict: "email" })
      .select();

    if (error) {
      console.error("Erro no Upsert da tabela crm_leads:", error);
      return new Response(
        JSON.stringify({ error: `Falha no salvamento do banco PostgreSQL: ${error.message}` }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Injeção/Atualização (Upsert) realizada com sucesso para ${formattedLeads.length} lead(s).`,
        count: formattedLeads.length,
        inserted: data
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Exceção na Edge Function sync-crm-sheet:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno não tratado no servidor." }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
