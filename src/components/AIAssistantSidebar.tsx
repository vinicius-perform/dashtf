import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Minimize2, 
  Maximize2, 
  Sparkles, 
  Settings, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Check, 
  MessageSquare,
  Clock,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { AiScreenContext } from '../hooks/useAiContext';
import { 
  ChatMessage, 
  getAiSettings, 
  sendChatMessage, 
  AiSettings 
} from '../services/aiAssistantService';

interface AIAssistantSidebarProps {
  context: AiScreenContext;
  onOpenSettings: () => void;
}

export const AIAssistantSidebar: React.FC<AIAssistantSidebarProps> = ({
  context,
  onOpenSettings
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Olá! Sou o **Assistente de Tráfego com IA** da F.A. Estou conectado aos números ao vivo da sua carteira.\n\nComo posso ajudar na sua operação hoje?',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const aiSettings = getAiSettings();
  const hasKey = Boolean(aiSettings.apiKey && aiSettings.apiKey.trim().length > 5);

  // Auto-scroll para o fim das mensagens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Inicializa o Web Speech API (SpeechRecognition para Ditado por Voz)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleVoiceDictation = () => {
    if (!recognitionRef.current) {
      alert('Seu navegador não possui suporte para reconhecimento de voz via Web Speech API.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Erro ao iniciar reconhecimento de voz:', e);
      }
    }
  };

  // Leitura em voz alta (SpeechSynthesis)
  const handleToggleSpeech = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Seu navegador não possui suporte para síntese de voz.');
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMessageId(msgId);

    // Limpa markdown simples para fala fluida
    const cleanSpeechText = text
      .replace(/[*#`_]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/R\$\s*/g, 'Reais ');

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(text, messages, context, aiSettings);

      const aiMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        executedActions: response.executedActions
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Erro ao processar mensagem do assistente:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Atalhos Rápidos de Pergunta
  const quickPrompts = [
    { label: '⚠️ Contas em risco de saldo', query: 'Quais contas estão com saldo em risco de esgotar?' },
    { label: '🎯 Onde otimizar CPL hoje?', query: 'Quais contas estão com o CPL mais estourado acima da meta?' },
    { label: '📊 Diagnosticar Top 25 Anúncios', query: 'Faça um diagnóstico rápido dos anúncios: quais devo pausar e quais devo replicar?' },
    { label: '📝 Criar tarefa rápida', query: 'Crie uma tarefa para subir novos criativos na conta ativa' }
  ];

  return (
    <>
      {/* BOTÃO FLUTUANTE (QUANDO FECHADO) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-zinc-950 border border-brand-neon hover:border-brand-neonHover text-white p-3.5 rounded-2xl shadow-2xl hover:shadow-brand-neon/30 hover:scale-105 transition-all flex items-center gap-3 group"
          title="Abrir Assistente de Tráfego com IA"
        >
          <div className="relative">
            <div className="p-2 rounded-xl bg-brand-neon/20 text-brand-neon">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-neon rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-neon rounded-full" />
          </div>

          <div className="text-left hidden sm:block">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Assistente F.A.</span>
              <Sparkles className="w-3 h-3 text-brand-neon" />
            </span>
            <span className="text-[10px] text-zinc-400 block font-medium">
              IA conectada ao painel
            </span>
          </div>
        </button>
      )}

      {/* PAINEL LATERAL RETRÁTIL (DRAWER) */}
      {isOpen && (
        <aside
          className={`fixed top-0 right-0 h-full z-50 bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${
            isMaximized ? 'w-full sm:w-[680px]' : 'w-full sm:w-[440px]'
          }`}
        >
          {/* HEADER DO PAINEL */}
          <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-neon/15 text-brand-neon border border-brand-neon/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Assistente F.A.</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-neon text-black">
                    Live Context
                  </span>
                </h3>
                
                {/* Status da Conexão da IA */}
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                  <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-400' : 'bg-brand-neon animate-pulse'}`} />
                  <span className="text-zinc-400">
                    {hasKey ? `Conectado (${aiSettings.provider.toUpperCase()})` : 'Engine Nativa Ativa'}
                  </span>
                </div>
              </div>
            </div>

            {/* Controles do Header: Configurações, Maximizar, Minimizar */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenSettings}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Configurar Chave de API"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors hidden sm:block"
                title={isMaximized ? 'Restaurar tamanho' : 'Maximizar painel'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Fechar assistente"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* BANNER DE CONTEXTO ATIVO */}
          <div className="px-4 py-2 bg-zinc-900/40 border-b border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5 truncate">
              <Layers className="w-3 h-3 text-brand-neon shrink-0" />
              <span>Visão atual:</span>
              <strong className="text-zinc-200 capitalize">
                {context.viewMode === 'campanhas' ? `Conta: ${context.selectedAccount?.name || 'Detalhes'}` : 'Carteira Global'}
              </strong>
            </span>

            <span className="text-zinc-500 font-mono text-[10px]">
              {context.macroCarteira?.totalAccounts || 0} contas lidas
            </span>
          </div>

          {/* CORPO DO CHAT (HISTÓRICO DE MENSAGENS) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-4 text-xs leading-relaxed shadow-lg relative ${
                      isUser
                        ? 'bg-zinc-800 text-white rounded-br-none border border-zinc-700/80'
                        : 'bg-zinc-900 text-zinc-100 rounded-bl-none border border-brand-neon/30 shadow-brand-neon/5'
                    }`}
                  >
                    {/* Header da Mensagem do Assistente */}
                    {!isUser && (
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80 text-[10px] text-zinc-400">
                        <span className="font-bold text-brand-neon flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Assistente F.A.
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Botão de Leitura por Voz (speechSynthesis) */}
                          <button
                            type="button"
                            onClick={() => handleToggleSpeech(msg.id, msg.text)}
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title={speakingMessageId === msg.id ? 'Parar leitura' : 'Ler resposta em voz alta'}
                          >
                            {speakingMessageId === msg.id ? (
                              <VolumeX className="w-3.5 h-3.5 text-brand-neon animate-pulse" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span>{msg.timestamp}</span>
                        </div>
                      </div>
                    )}

                    {/* Texto com Formatação Markdown */}
                    <div className="whitespace-pre-wrap space-y-1.5">
                      {msg.text}
                    </div>

                    {/* AÇÕES EXECUTADAS AUTOMATICAMENTE NO SUPABASE */}
                    {msg.executedActions && msg.executedActions.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-zinc-800/80 space-y-1.5">
                        {msg.executedActions.map((action, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-xl bg-brand-neon/15 border border-brand-neon/30 text-brand-neon text-[11px] font-bold flex items-center gap-2 animate-in zoom-in-95"
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-neon" />
                            <span>{action.message}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Indicador de Digitando / Carregando */}
            {isLoading && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 w-fit animate-pulse">
                <div className="w-2 h-2 rounded-full bg-brand-neon animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-brand-neon animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-brand-neon animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] ml-1">Analisando números e gerando estratégia...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ATALHOS RÁPIDOS DE SUGESTÃO DE PERGUNTAS */}
          <div className="px-4 py-2 border-t border-zinc-800/60 bg-zinc-900/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.query)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-[11px] font-medium text-zinc-300 hover:text-white transition-all shrink-0 active:scale-95"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* INPUT DE MENSAGEM E COMANDOS DE VOZ */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? 'Ouvindo sua voz...' : 'Pergunte ou ordene uma ação...'}
                  disabled={isLoading}
                  className={`w-full pl-3.5 pr-10 py-2.5 bg-zinc-900 border focus:border-brand-neon focus:ring-1 focus:ring-brand-neon rounded-xl text-xs text-white placeholder-zinc-500 outline-none transition-all ${
                    isListening ? 'border-brand-neon ring-1 ring-brand-neon animate-pulse' : 'border-zinc-700'
                  }`}
                />

                {/* Botão de Ditado por Voz (Web Speech API) */}
                <button
                  type="button"
                  onClick={handleToggleVoiceDictation}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                    isListening
                      ? 'bg-brand-neon text-black font-black animate-pulse shadow-md shadow-brand-neon/30'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={isListening ? 'Parar gravação' : 'Falar por voz'}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2.5 rounded-xl bg-brand-neon hover:bg-brand-neonHover text-black font-black transition-all disabled:opacity-40 disabled:hover:bg-brand-neon shadow-lg shadow-brand-neon/20 shrink-0"
                title="Enviar mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-500">
              <span>Ditado e Leitura em voz alta via Web Speech</span>
              <span>Reconhece comandos operacionais</span>
            </div>
          </div>
        </aside>
      )}
    </>
  );
};

