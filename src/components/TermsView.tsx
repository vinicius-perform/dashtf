import React from 'react';
import { LegalLayout, LegalSection, LEGAL_LAST_UPDATED } from './LegalLayout';

interface TermsViewProps {
  onBack: () => void;
  onOpenPrivacy: () => void;
}

const INTRO =
  'Estes Termos de Serviço ("Termos") regem o acesso e o uso do painel de gestão de mídia e performance ("Plataforma" ou "Painel") disponibilizado pela Fazendo Acontecer ("Fazendo Acontecer", "nós"). Ao acessar ou utilizar a Plataforma, você ("Usuário") declara ter lido, compreendido e concordado com estes Termos. Caso não concorde, não utilize a Plataforma.';

const SECTIONS: LegalSection[] = [
  {
    title: '1. Descrição do Serviço',
    blocks: [
      {
        type: 'p',
        text: 'A Plataforma é uma ferramenta de uso interno e restrito destinada a colaboradores, prestadores de serviço e clientes autorizados da Fazendo Acontecer, com as seguintes finalidades principais:'
      },
      {
        type: 'ul',
        items: [
          'consolidação e visualização de métricas de campanhas de anúncios (Meta Ads e outras fontes conectadas);',
          'gestão e qualificação de leads e oportunidades comerciais (CRM);',
          'análise de criativos, concorrência e desempenho de mídia;',
          'auditoria de social media, acompanhamento de equipe e OKRs;',
          'administração de usuários e integrações.'
        ]
      },
      {
        type: 'p',
        text: 'A Fazendo Acontecer pode, a seu critério, incluir, alterar ou remover funcionalidades a qualquer momento.'
      }
    ]
  },
  {
    title: '2. Cadastro e Conta de Acesso',
    blocks: [
      {
        type: 'ul',
        items: [
          'O acesso depende de credenciais individuais (e-mail e senha) criadas e gerenciadas por meio do provedor de autenticação da Plataforma.',
          'O Usuário é responsável por manter a confidencialidade de suas credenciais e por todas as atividades realizadas em sua conta.',
          'O Usuário deve comunicar imediatamente à Fazendo Acontecer qualquer uso não autorizado ou suspeita de violação de segurança.',
          'Contas podem ser criadas, suspensas, desativadas ou removidas por administradores da Fazendo Acontecer, inclusive em caso de desligamento, encerramento de contrato ou violação destes Termos.'
        ]
      }
    ]
  },
  {
    title: '3. Regras de Uso',
    blocks: [
      { type: 'p', text: 'Ao utilizar a Plataforma, o Usuário compromete-se a:' },
      {
        type: 'ul',
        items: [
          'utilizar o Painel apenas para as finalidades profissionais autorizadas;',
          'não compartilhar credenciais, telas, relatórios ou dados com terceiros não autorizados;',
          'não copiar, exportar ou extrair dados além do necessário para a execução de suas atividades;',
          'não tentar acessar áreas, contas ou dados aos quais não tenha autorização;',
          'não realizar engenharia reversa, cópia, adaptação ou exploração indevida da Plataforma;',
          'não introduzir malware, scripts automatizados não autorizados ou sobrecarregar a infraestrutura;',
          'respeitar a legislação aplicável, os direitos de terceiros e as políticas internas da Fazendo Acontecer.'
        ]
      }
    ]
  },
  {
    title: '4. Integrações de Terceiros',
    blocks: [
      {
        type: 'ul',
        items: [
          'A Plataforma pode se conectar a serviços de terceiros, como a Meta (Facebook/Instagram) Ads, por meio de tokens de acesso e APIs.',
          'Ao conectar uma integração, o Usuário declara possuir autorização para vincular a respectiva conta e autoriza a Plataforma a acessar, processar e armazenar os dados necessários ao funcionamento das funcionalidades.',
          'O uso das APIs e dados de terceiros também está sujeito aos termos e políticas desses terceiros. A Fazendo Acontecer não se responsabiliza por indisponibilidades, alterações ou descontinuações desses serviços.'
        ]
      }
    ]
  },
  {
    title: '5. Dados e Conteúdo',
    blocks: [
      {
        type: 'ul',
        items: [
          'Os dados de campanhas, leads, clientes e métricas exibidos na Plataforma pertencem à Fazendo Acontecer e/ou aos seus clientes, conforme os contratos aplicáveis.',
          'O tratamento de dados pessoais é regido pela Política de Privacidade, que é parte integrante destes Termos.',
          'O Usuário é responsável pela veracidade e adequação das informações que inserir na Plataforma.'
        ]
      }
    ]
  },
  {
    title: '6. Propriedade Intelectual',
    blocks: [
      {
        type: 'p',
        text: 'Todo o software, layout, marca, identidade visual, textos, estrutura de telas e demais elementos da Plataforma são de titularidade da Fazendo Acontecer ou de seus licenciadores, sendo vedada qualquer utilização não expressamente autorizada.'
      }
    ]
  },
  {
    title: '7. Disponibilidade e Suporte',
    blocks: [
      { type: 'p', text: 'A Plataforma é fornecida "no estado em que se encontra" e "conforme disponível".' },
      {
        type: 'p',
        text: 'A Fazendo Acontecer envida esforços razoáveis para manter a Plataforma em funcionamento, mas não garante operação ininterrupta ou livre de erros, podendo realizar manutenções, atualizações e interrupções programadas ou emergenciais.'
      }
    ]
  },
  {
    title: '8. Limitação de Responsabilidade',
    blocks: [
      {
        type: 'p',
        text: 'Na máxima extensão permitida pela legislação, a Fazendo Acontecer não será responsável por danos indiretos, lucros cessantes, perda de dados ou prejuízos decorrentes de: (i) uso ou impossibilidade de uso da Plataforma; (ii) decisões tomadas com base nas métricas exibidas; (iii) falhas de integrações de terceiros; ou (iv) uso indevido das credenciais pelo Usuário.'
      }
    ]
  },
  {
    title: '9. Suspensão e Encerramento',
    blocks: [
      {
        type: 'p',
        text: 'A Fazendo Acontecer pode suspender ou encerrar o acesso do Usuário, total ou parcialmente, a qualquer momento, em caso de violação destes Termos, término da relação profissional/contratual ou necessidade de proteção da segurança da informação.'
      }
    ]
  },
  {
    title: '10. Alterações dos Termos',
    blocks: [
      {
        type: 'p',
        text: 'Estes Termos podem ser atualizados periodicamente. A versão vigente será sempre a publicada nesta página, com a respectiva data de atualização. O uso continuado da Plataforma após alterações representa concordância com a nova versão.'
      }
    ]
  },
  {
    title: '11. Legislação Aplicável e Foro',
    blocks: [
      {
        type: 'p',
        text: 'Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de [cidade/UF] para dirimir quaisquer controvérsias, com renúncia a qualquer outro, por mais privilegiado que seja.'
      }
    ]
  },
  {
    title: '12. Contato',
    blocks: [
      {
        type: 'p',
        text: 'Dúvidas sobre estes Termos podem ser encaminhadas para [contato@fazendoacontecer.com.br].'
      }
    ]
  }
];

export const TermsView: React.FC<TermsViewProps> = ({ onBack, onOpenPrivacy }) => (
  <LegalLayout
    title="Termos de Serviço"
    updatedAt={LEGAL_LAST_UPDATED}
    intro={INTRO}
    sections={SECTIONS}
    onBack={onBack}
    crossLinkLabel="Política de Privacidade"
    onCrossLink={onOpenPrivacy}
  />
);
