import React from 'react';
import { LegalLayout, LegalSection, LEGAL_LAST_UPDATED } from './LegalLayout';

interface PrivacyViewProps {
  onBack: () => void;
  onOpenTerms: () => void;
}

const INTRO =
  'Esta Política de Privacidade descreve como a Fazendo Acontecer ("nós") coleta, utiliza, armazena e protege dados pessoais no âmbito do painel interno de gestão de mídia e performance ("Plataforma"), em conformidade com a Lei nº 13.709/2018 – Lei Geral de Proteção de Dados Pessoais ("LGPD").';

const SECTIONS: LegalSection[] = [
  {
    title: '1. Controlador e Encarregado',
    blocks: [
      {
        type: 'p',
        text: 'O controlador dos dados tratados na Plataforma é a Fazendo Acontecer, inscrita no CNPJ [CNPJ], com sede em [endereço]. O contato do Encarregado pelo Tratamento de Dados (DPO) é [dpo@fazendoacontecer.com.br].'
      }
    ]
  },
  {
    title: '2. Dados que Coletamos',
    blocks: [
      {
        type: 'ul',
        items: [
          'Dados de conta e autenticação: nome, e-mail corporativo, senha (armazenada de forma criptografada pelo provedor de autenticação), papel/perfil de acesso, data de criação e registros de login.',
          'Dados de uso: páginas acessadas, ações realizadas na Plataforma, filtros aplicados, data e hora de acesso, e informações técnicas do dispositivo/navegador e endereço IP.',
          'Dados de integrações: tokens de acesso a plataformas de anúncios (por exemplo, Meta Ads), identificadores de contas de anúncio, campanhas, conjuntos, anúncios e respectivas métricas.',
          'Dados de leads e clientes (CRM): nome, telefone, e-mail, empresa/clínica, especialidade, objetivo, faixa de faturamento, origem da campanha e demais informações inseridas para qualificação comercial.',
          'Dados de equipe: nome de colaboradores, função, agenda de clientes e indicadores de acompanhamento (OKRs).'
        ]
      }
    ]
  },
  {
    title: '3. Finalidades e Bases Legais',
    blocks: [
      {
        type: 'p',
        text: 'Tratamos dados pessoais para as seguintes finalidades, com as respectivas bases legais da LGPD:'
      },
      {
        type: 'ul',
        items: [
          'Autenticar e controlar o acesso à Plataforma – execução de contrato e legítimo interesse;',
          'Fornecer as funcionalidades de dashboards, CRM, auditoria e relatórios – execução de contrato e legítimo interesse;',
          'Integrar contas de anúncios e sincronizar métricas – execução de contrato e legítimo interesse;',
          'Gerir leads e oportunidades comerciais de clientes da agência – legítimo interesse do controlador/cliente e, quando aplicável, consentimento do titular coletado no formulário de origem;',
          'Garantir segurança, prevenir fraudes e registrar logs – cumprimento de obrigação legal e legítimo interesse;',
          'Aprimorar e manter a Plataforma – legítimo interesse.'
        ]
      }
    ]
  },
  {
    title: '4. Compartilhamento de Dados',
    blocks: [
      { type: 'p', text: 'Os dados podem ser compartilhados com:' },
      {
        type: 'ul',
        items: [
          'Provedores de infraestrutura e software que suportam a operação da Plataforma (hospedagem, banco de dados, autenticação), na condição de operadores;',
          'Plataformas de anúncios e APIs conectadas por integração, conforme a funcionalidade utilizada;',
          'Clientes da Fazendo Acontecer, quanto aos dados de suas próprias campanhas e leads;',
          'Autoridades públicas, quando exigido por lei, ordem judicial ou processo regulatório.'
        ]
      },
      { type: 'p', text: 'Não vendemos dados pessoais.' }
    ]
  },
  {
    title: '5. Transferência Internacional',
    blocks: [
      {
        type: 'p',
        text: 'Alguns provedores podem processar dados em servidores localizados fora do Brasil. Nesses casos, adotamos salvaguardas compatíveis com a LGPD, como cláusulas contratuais e a exigência de padrões adequados de segurança.'
      }
    ]
  },
  {
    title: '6. Armazenamento e Retenção',
    blocks: [
      {
        type: 'ul',
        items: [
          'Os dados são armazenados em ambientes controlados de provedores de nuvem contratados.',
          'Mantemos os dados pelo tempo necessário ao cumprimento das finalidades, das obrigações legais e regulatórias e do exercício regular de direitos.',
          'Dados de contas de usuários são eliminados ou anonimizados após o encerramento do acesso, ressalvadas as hipóteses de guarda obrigatória.'
        ]
      }
    ]
  },
  {
    title: '7. Segurança da Informação',
    blocks: [
      {
        type: 'p',
        text: 'Adotamos medidas técnicas e administrativas para proteger os dados, incluindo controle de acesso por perfil, criptografia de credenciais, restrição de rede, registro de atividades e políticas internas de segurança. Nenhum sistema é totalmente imune a incidentes; em caso de incidente de segurança relevante, adotaremos as providências e comunicações previstas na LGPD.'
      }
    ]
  },
  {
    title: '8. Direitos do Titular',
    blocks: [
      {
        type: 'p',
        text: 'Nos termos da LGPD, o titular pode solicitar: confirmação da existência de tratamento; acesso aos dados; correção de dados incompletos, inexatos ou desatualizados; anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade; portabilidade; informação sobre compartilhamentos; e revogação de consentimento. As solicitações podem ser feitas pelo contato indicado nesta Política e serão respondidas nos prazos legais.'
      }
    ]
  },
  {
    title: '9. Cookies e Tecnologias Semelhantes',
    blocks: [
      {
        type: 'p',
        text: 'A Plataforma utiliza armazenamento local (local/session storage) e cookies estritamente necessários para manter a sessão autenticada e preferências de navegação. Não utilizamos cookies de publicidade de terceiros no Painel.'
      }
    ]
  },
  {
    title: '10. Dados de Leads Fornecidos por Clientes',
    blocks: [
      {
        type: 'p',
        text: 'Quando a Fazendo Acontecer atua como operadora de dados de leads em nome de um cliente, o tratamento observa as instruções desse cliente, que figura como controlador. Solicitações de titulares relativas a esses dados podem ser encaminhadas ao respectivo cliente ou intermediadas pela Fazendo Acontecer.'
      }
    ]
  },
  {
    title: '11. Alterações desta Política',
    blocks: [
      {
        type: 'p',
        text: 'Esta Política pode ser atualizada a qualquer tempo. A versão vigente é a publicada nesta página, com a data de atualização correspondente. Alterações relevantes poderão ser comunicadas pelos canais internos.'
      }
    ]
  },
  {
    title: '12. Contato',
    blocks: [
      {
        type: 'p',
        text: 'Para exercer direitos ou esclarecer dúvidas sobre privacidade e proteção de dados, entre em contato pelo e-mail [dpo@fazendoacontecer.com.br] ou [contato@fazendoacontecer.com.br].'
      }
    ]
  }
];

export const PrivacyView: React.FC<PrivacyViewProps> = ({ onBack, onOpenTerms }) => (
  <LegalLayout
    title="Política de Privacidade"
    updatedAt={LEGAL_LAST_UPDATED}
    intro={INTRO}
    sections={SECTIONS}
    onBack={onBack}
    crossLinkLabel="Termos de Serviço"
    onCrossLink={onOpenTerms}
  />
);
