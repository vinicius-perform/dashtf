import axios from 'axios';
import { AiScreenContext } from '../hooks/useAiContext';
import { 
  createEncaminhamento, 
  upsertCheckin 
} from './gestaoTarefasService';
import { getFortalezaTodayDate } from '../utils/tarefasTime';

export type AiProvider = 'gemini' | 'openai' | 'anthropic';

export interface AiSettings {
  provider: AiProvider;
  apiKey: string;
  model?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  executedActions?: Array<{
    type: 'create_task' | 'register_checkin';
    message: string;
    details?: any;
  }>;
}

const AI_SETTINGS_STORAGE_KEY = 'dashtf_ai_settings';

export function getAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-1.5-flash'
  };
}

export function saveAiSettings(settings: AiSettings): void {
  try {
    localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Falha ao salvar configurações de IA:', err);
  }
}

/**
 * System Prompt que transforma o modelo em Assistente de Tráfego Sênior da F.A.
 */
export function buildSystemPrompt(context: AiScreenContext): string {
  const today = getFortalezaTodayDate();

  return `Você é o Assistente de Tráfego com IA da operação "F.A. | Fazendo Acontecer", especialista em Meta Ads, microgerenciamento de anúncios, controle de caixa e gestão de tarefas.

SUA MISSÃO:
1. Analisar os números reais da tela ativa e priorizar ações táticas (escalar, pausar, trocar criativo, alertar sobre saldo pré-pago ou saturação).
2. Ser direto, assertivo e focado em lucro, ROI e cumprimento da Meta de CPL.
3. Responda em Português do Brasil com formatação markdown limpa (listas, negrito, valores em R$).
4. Identificar e executar ordens do usuário para registrar check-ins ou criar tarefas/encaminhamentos.

REGRAS DE NEGÓCIO DA F.A.:
- Saldo Pré-pago: Alerta Médio (< 5 dias de cobertura) e Alerta Crítico (< 1,5 dia de cobertura).
- Pausar Anúncio: Gastou 2× a meta sem conversa, ou 3× a meta com CPL 50% acima.
- Fadiga de Anúncio: Frequência > 3 e CTR < 0,8%.
- Replicar Anúncio: 3+ conversas com CPL 20% abaixo da meta.
- Escala de Orçamento: Sugira +20% (limite seguro da Meta para não resetar o aprendizado).

CAPACIDADE DE AÇÃO NATIVA (Comandos do usuário):
Se o usuário pedir para "criar tarefa", "criar encaminhamento" ou "registrar check-in", retorne ao final da sua resposta um bloco JSON com a ação estruturada para ser executada automaticamente no banco:

Para criar encaminhamento:
\`\`\`json:action
{
  "action": "create_task",
  "client_id": "ID_DO_CLIENTE",
  "client_name": "NOME_DO_CLIENTE",
  "description": "Texto objetivo da tarefa",
  "due_date": "${today}",
  "status": "A fazer"
}
\`\`\`

Para registrar check-in da semana:
\`\`\`json:action
{
  "action": "register_checkin",
  "client_id": "ID_DO_CLIENTE",
  "client_name": "NOME_DO_CLIENTE",
  "date": "${today}",
  "type": "criativo",
  "done": true
}
\`\`\`
(Nota: 'type' pode ser 'criativo' ou 'calculadora').

DADOS EM TEMPO REAL DA TELA ATIVA (O QUE VOCÊ ESTÁ ENXERGANDO AGORA):
${JSON.stringify(context, null, 2)}
`;
}

/**
 * Parser de Ações: intercepta blocos de ação JSON retornados pela IA e executa no Supabase
 */
export async function parseAndExecuteAiActions(
  rawText: string
): Promise<{ text: string; executedActions?: ChatMessage['executedActions'] }> {
  const executedActions: NonNullable<ChatMessage['executedActions']> = [];
  let cleanText = rawText;

  // Regex para encontrar blocos ```json:action ... ``` ou blocos JSON contendo "action":
  const actionRegex = /```(?:json:action|json)\s*([\s\S]*?)\s*```/g;
  let match: RegExpExecArray | null;

  while ((match = actionRegex.exec(rawText)) !== null) {
    const rawJson = match[1];
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed && parsed.action === 'create_task') {
        await createEncaminhamento({
          client_id: parsed.client_id || '',
          description: parsed.description || 'Tarefa solicitada via Assistente IA',
          due_date: parsed.due_date || getFortalezaTodayDate(),
          status: (parsed.status as any) || 'A fazer'
        });

        executedActions.push({
          type: 'create_task',
          message: `Encaminhamento criado: "${parsed.description}" para ${parsed.client_name || parsed.client_id} (Prazo: ${parsed.due_date})`,
          details: parsed
        });
      } else if (parsed && parsed.action === 'register_checkin') {
        const isCriativo = parsed.type === 'criativo';
        const isCalculadora = parsed.type === 'calculadora';
        await upsertCheckin(
          parsed.client_id,
          parsed.date || getFortalezaTodayDate(),
          isCriativo ? Boolean(parsed.done) : false,
          isCalculadora ? Boolean(parsed.done) : false
        );

        executedActions.push({
          type: 'register_checkin',
          message: `Check-in de ${parsed.type === 'criativo' ? 'Criativo' : 'Calculadora'} registrado com sucesso para ${parsed.client_name || parsed.client_id}!`,
          details: parsed
        });
      }

      // Remove o bloco JSON da mensagem visível para manter a leitura limpa
      cleanText = cleanText.replace(match[0], '').trim();
    } catch (e) {
      console.warn('Falha ao processar ação da IA:', e);
    }
  }

  return { 
    text: cleanText, 
    executedActions: executedActions.length > 0 ? executedActions : undefined 
  };
}

/**
 * Envia mensagem para o provedor configurado (Gemini, OpenAI ou Anthropic)
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  context: AiScreenContext,
  settings: AiSettings
): Promise<{ text: string; executedActions?: ChatMessage['executedActions'] }> {
  const systemPrompt = buildSystemPrompt(context);

  // Se não houver API Key, utiliza o Fallback Engine Nativo de Tráfego
  if (!settings.apiKey || settings.apiKey.trim().length < 5) {
    return generateSmartFallbackResponse(message, context);
  }

  try {
    // 1. Google Gemini API
    if (settings.provider === 'gemini') {
      const model = settings.model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.apiKey.trim()}`;
      
      const contents = [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nPergunta do gestor de tráfego:\n${message}` }]
        }
      ];

      const res = await axios.post(url, { contents }, { timeout: 20000 });
      const rawAnswer = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Nenhuma resposta retornada pela IA.';
      return await parseAndExecuteAiActions(rawAnswer);
    }

    // 2. OpenAI API
    if (settings.provider === 'openai') {
      const model = settings.model || 'gpt-4o-mini';
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-4).map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text })),
        { role: 'user', content: message }
      ];

      const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model,
        messages,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${settings.apiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });

      const rawAnswer = res.data?.choices?.[0]?.message?.content || 'Nenhuma resposta retornada.';
      return await parseAndExecuteAiActions(rawAnswer);
    }

    // 3. Anthropic Claude API
    if (settings.provider === 'anthropic') {
      const model = settings.model || 'claude-3-5-sonnet-20241022';
      const res = await axios.post('https://api.anthropic.com/v1/messages', {
        model,
        system: systemPrompt,
        max_tokens: 1024,
        messages: [{ role: 'user', content: message }]
      }, {
        headers: {
          'x-api-key': settings.apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });

      const rawAnswer = res.data?.content?.[0]?.text || 'Nenhuma resposta retornada.';
      return await parseAndExecuteAiActions(rawAnswer);
    }
  } catch (err: any) {
    console.error('Erro na chamada da API de IA:', err);
    // Em caso de falha de rede/quota na API do usuário, faz fallback inteligente
    const fallback = await generateSmartFallbackResponse(message, context);
    return {
      text: `*(Aviso: Falha ao contatar a API da ${settings.provider}. Resposta gerada pela Engine Local de Tráfego)*\n\n${fallback.text}`,
      executedActions: fallback.executedActions
    };
  }

  return generateSmartFallbackResponse(message, context);
}

/**
 * Motor Local de Respostas Inteligentes para o Assistente (Zero-Config / Fallback)
 * Lê os dados reais do contexto e entrega diagnósticos analíticos precisos da F.A.
 */
async function generateSmartFallbackResponse(
  message: string,
  context: AiScreenContext
): Promise<{ text: string; executedActions?: ChatMessage['executedActions'] }> {
  const msgLower = message.toLowerCase();
  const today = getFortalezaTodayDate();

  // COMANDO 1: Criar tarefa / encaminhamento
  if (msgLower.includes('criar tarefa') || msgLower.includes('encaminhamento') || msgLower.includes('criar encaminhamento')) {
    const client = context.agencyClients[0] || { id: '1115861513053539', name: 'CA02 - FA' };
    const taskDesc = message.replace(/criar tarefa/i, '').replace(/criar encaminhamento/i, '').replace(/para/i, '').trim() || 'Ajustar criativos e orçamento da conta';

    const actionBlock = `\`\`\`json:action
{
  "action": "create_task",
  "client_id": "${client.id}",
  "client_name": "${client.name}",
  "description": "${taskDesc}",
  "due_date": "${today}",
  "status": "A fazer"
}
\`\`\``;

    const rawResponse = `Entendido! Registrei o novo encaminhamento operacional na aba de **Gestão de Tarefas**:\n\n- **Cliente:** ${client.name}\n- **Tarefa:** ${taskDesc}\n- **Prazo:** ${today}\n\n${actionBlock}`;
    return await parseAndExecuteAiActions(rawResponse);
  }

  // COMANDO 2: Registrar check-in
  if (msgLower.includes('check-in') || msgLower.includes('checkin') || msgLower.includes('marcar criativo') || msgLower.includes('marcar calculadora')) {
    const client = context.agencyClients[0] || { id: '1115861513053539', name: 'CA02 - FA' };
    const isCalculadora = msgLower.includes('calculadora');
    const type = isCalculadora ? 'calculadora' : 'criativo';

    const actionBlock = `\`\`\`json:action
{
  "action": "register_checkin",
  "client_id": "${client.id}",
  "client_name": "${client.name}",
  "date": "${today}",
  "type": "${type}",
  "done": true
}
\`\`\``;

    const rawResponse = `Perfeito! Acabei de marcar o check-in de **${type === 'criativo' ? 'Criativo' : 'Calculadora'}** para **${client.name}** na data de hoje (${today}).\n\n${actionBlock}`;
    return await parseAndExecuteAiActions(rawResponse);
  }

  // DIAGNÓSTICO 1: Pergunta sobre Saldo / Risco de Caixa
  if (msgLower.includes('saldo') || msgLower.includes('risco') || msgLower.includes('caixa')) {
    const riscos = context.macroCarteira?.contasEmRiscoSaldo || [];
    if (riscos.length > 0) {
      const list = riscos.map(r => 
        `- **${r.name}:** Saldo de R$ ${r.balance.toFixed(2)} (${r.remainingDays?.toFixed(1)} dias restantes) — ${r.isCritico ? '🔴 **CRÍTICO** (< 1,5d)' : '🟡 **ALERTA MÉDIO** (< 5d)'}`
      ).join('\n');

      return {
        text: `### ⚠️ Diagnóstico de Saldo e Risco de Caixa\n\nIdentifiquei **${riscos.length} contas pré-pagas** com saldo abaixo da régua de segurança de 5 dias:\n\n${list}\n\n**Recomendação Imediata:** Notificar os clientes ou emitir recarga PIX/Boleto antes do término do saldo para não interromper a veiculação dos anúncios ativos.`
      };
    } else {
      return {
        text: `### ✅ Saúde Financeira das Contas\n\nTodas as contas pré-pagas ativas da carteira possuem saldo com mais de 5 dias de cobertura. Nenhuma conta em risco crítico no momento.`
      };
    }
  }

  // DIAGNÓSTICO 2: Pergunta sobre CPL / Otimização / Metas
  if (msgLower.includes('cpl') || msgLower.includes('meta') || msgLower.includes('otimizar') || msgLower.includes('estouro')) {
    const estouradas = context.macroCarteira?.contasEstouroCpl || [];
    if (estouradas.length > 0) {
      const top3 = estouradas.slice(0, 3).map((e, idx) => 
        `${idx + 1}. **${e.name}:** CPL Atual **R$ ${e.cpl?.toFixed(2)}** vs Meta **R$ ${e.metaCpl?.toFixed(2)}** (+${e.percentOver.toFixed(1)}% acima / Excedente: R$ ${e.excessoTotal.toFixed(2)})`
      ).join('\n');

      return {
        text: `### 🎯 Prioridades de Otimização (Estouro de CPL)\n\nAs contas prioritárias para intervenção imediata da equipe são:\n\n${top3}\n\n**Ações Recomendadas:**\n1. Abrir a visão detalhada de cada conta e pausar os anúncios marcados como **Pausar** ou **Fadiga**.\n2. Replicar criativos que estão com CPL 20% abaixo da meta.\n3. Checar a taxa de resposta e tempo de primeiro atendimento no WhatsApp.`
      };
    }
  }

  // DIAGNÓSTICO 3: Visão de Anúncios / Top 25
  const topAds = context.microConta?.topAds || [];
  if (topAds.length > 0) {
    const pausar = topAds.filter(a => a.sugestao === 'Pausar');
    const replicar = topAds.filter(a => a.sugestao === 'Replicar');
    const fadiga = topAds.filter(a => a.sugestao === 'Fadiga');

    return {
      text: `### 📊 Diagnóstico dos Criativos da Conta (${context.selectedAccount?.name || 'Conta Ativa'})\n\nAnalisei os **25 anúncios com maior investimento**:\n\n- 🔴 **Para Pausar (${pausar.length}):** ${pausar.map(p => `\`${p.name}\``).slice(0, 2).join(', ') || 'Nenhum'}\n- 🟢 **Para Replicar (${replicar.length}):** ${replicar.map(r => `\`${r.name}\``).slice(0, 2).join(', ') || 'Nenhum'}\n- 🟠 **Com Fadiga (${fadiga.length}):** ${fadiga.map(f => `\`${f.name}\``).slice(0, 2).join(', ') || 'Nenhum'}\n\n**Estratégia Recomendada:** Escalar em até +20% o orçamento dos conjuntos com criativos marcados como **Replicar**, e pausar imediatamente criativos sem conversas que gastaram o dobro da meta de CPL.`
    };
  }

  // RESPOSTA PADRÃO GERAL
  return {
    text: `Olá! Estou monitorando a carteira de contas da **F.A. | Fazendo Acontecer** em tempo real.\n\nVocê pode me pedir:\n- *"Quais contas estão com saldo em risco?"*\n- *"Onde devo otimizar ou pausar anúncios hoje?"*\n- *"Crie uma tarefa para subir criativos na conta CA04"*\n- *"Marque o check-in de criativo para o cliente de hoje"*\n\nComo posso acelerar sua operação de tráfego agora?`
  };
}
