const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const outputFile = path.join(rootDir, 'EXPORT_CLAUDE_SISTEMA.md');

const ignorePatterns = [
  'node_modules',
  'dist',
  '.git',
  'bun.lock',
  'package-lock.json',
  '.png',
  '.jpg',
  '.jpeg',
  '.ico',
  '.temp',
  'export_to_claude.js',
  'EXPORT_CLAUDE_SISTEMA.md'
];

function shouldInclude(filePath) {
  for (const ign of ignorePatterns) {
    if (filePath.includes(ign)) return false;
  }
  return true;
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!ignorePatterns.some(p => file.includes(p))) {
        getAllFiles(fullPath, fileList);
      }
    } else {
      if (shouldInclude(fullPath)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

const allFiles = getAllFiles(rootDir).sort();
console.log('Total files to export:', allFiles.length);

let md = '# SISTEMA DASH-TF (FAZENDO ACONTECER) - EXPORTAÇÃO COMPLETA PARA CLAUDE\n\n';
md += '> Este documento consolida a arquitetura completa, modelo de dados, configurações, regras de negócio e todo o código-fonte do sistema **DashTF (Fazendo Acontecer)** para replicação, evolução ou implementação direta no Claude (Claude Projects, Claude Code ou chat).\n\n';

md += '## 1. Visão Geral da Arquitetura\n\n';
md += '- **Stack**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Axios, Supabase (PostgreSQL)\n';
md += '- **Objetivo**: Dashboard operacional de gestão de tráfego pago para agências de tráfego, controle financeiro de contas pré-pagas (com dedução automática de imposto Meta de 12,15%), CRM de leads integrado, gestão de tarefas com tempos/prazos, e auditoria em tempo real da Meta Graph API (v19.0).\n';
md += '- **Módulos Principais**:\n';
md += '  - **1. Gerenciador / Carteira de Contas (`CarteiraTableView.tsx`, `carteiraEngine.ts`)**:\n';
md += '    - Tabela operacional de 7 colunas (Conta, Resultados, Custo por Resultado, Meta de CPL, Status da Meta %, Valor Gasto, Saldo/Orçamento).\n';
md += '    - Consolidação de Resultados: varre o array `actions` da Meta somando simultaneamente Conversas (conexões, iniciadas, primeira resposta), Leads (lead, pixel, onsite, agrupado) e Visitas (cliques no link, visitas ao perfil).\n';
md += '    - Hierarquia de Exibição da Agência: Contas com volume expressivo de WhatsApp mostram Conversas; contas de Leads mostram Leads; contas de perfil mostram Visitas.\n';
md += '    - Input editável de Meta de CPL no padrão Neon (`#c6ff00`), salvo em tempo real no Supabase (`account_settings`).\n';
md += '    - Indicador de Dias Restantes com barra colorida (Verde > 5 dias, Âmbar < 5 dias, Vermelho < 1.5 dias).\n';
md += '  - **2. Financeiro & Controle de Abastecimentos (`FinanceiroView.tsx`, `financeiroService.ts`)**:\n';
md += '    - Controle inteligente de recargas (status "Pago" e "À Fazer") com recálculo instantâneo.\n';
md += '    - Dedução automática de 12,15% de imposto retido na fonte pela Meta para pré-pago brasileiro (PIS, COFINS, ISS).\n';
md += '    - **Cálculo Automático do Saldo Líquido em Conta**: `Saldo = Total Abastecido Líquido (Pago) - Gasto no Período (spend da Meta)`.\n';
md += '    - Radar de Autonomia com alerta de saldo acabando e previsão de término em dias.\n';
md += '    - Área de configuração para marcar quais contas são pré-pagas ou pós-pagas.\n';
md += '  - **3. Gerenciador Detalhado de Campanhas (`GerenciadorView.tsx`, `metaDataEngine.ts`)**:\n';
md += '    - Drill-down em 3 níveis: Campanhas, Conjuntos de Anúncios e Anúncios.\n';
md += '    - Cálculo de métricas: Gasto, CPM, CTR, CPC, Connect Rate, Leads, CPA, ROAS, Status de Entrega com auditoria de dados.\n';
md += '  - **4. Backend Supabase (`supabase/schema.sql`)**:\n';
md += '    - Tabelas: `account_settings` (metas de CPL), `user_integrations` (tokens Meta em nuvem), `crm_leads`, `smm_audit_clients`, `gestao_tarefas`.\n\n';

md += '## 2. Como Rodar o Projeto\n\n';
md += '```bash\n# 1. Instalar dependências\nnpm install\n\n# 2. Iniciar servidor de desenvolvimento\nnpm run dev\n\n# 3. Compilar para produção\nnpm run build\n```\n\n';

md += '## 3. Estrutura de Arquivos do Projeto\n\n```text\n';
for (const f of allFiles) {
  md += path.relative(rootDir, f).replace(/\\/g, '/') + '\n';
}
md += '```\n\n---\n\n## 4. Código Fonte Completo de Todos os Arquivos\n\n';

for (const f of allFiles) {
  const relPath = path.relative(rootDir, f).replace(/\\/g, '/');
  const ext = path.extname(f).replace('.', '') || 'text';
  let lang = 'text';
  if (ext === 'tsx' || ext === 'ts') lang = 'typescript';
  else if (ext === 'json') lang = 'json';
  else if (ext === 'css') lang = 'css';
  else if (ext === 'html') lang = 'html';
  else if (ext === 'sql') lang = 'sql';
  else if (ext === 'js') lang = 'javascript';

  const content = fs.readFileSync(f, 'utf8');

  md += `### Arquivo: \`${relPath}\`\n\n\`\`\`${lang}\n${content}\n\`\`\`\n\n---\n\n`;
}

fs.writeFileSync(outputFile, md, 'utf8');
const stat = fs.statSync(outputFile);
console.log('Exported successfully! Size:', (stat.size / 1024).toFixed(2), 'KB');
