# Integração com a Meta: como colocar no ar

O painel não guarda mais nenhum token da Meta. As chamadas passam por duas Edge Functions do Supabase:

| Função | Para que serve |
|---|---|
| `meta-proxy` | Proxy somente-leitura da Graph API usado pelas telas (campanhas, conjuntos, anúncios, mineração). Injeta o token no servidor e remove o token de qualquer resposta (ex.: `paging.next`). |
| `meta-carteira` | Calcula a tabela **Carteira de Contas** com as mesmas regras do Gerenciador de Anúncios e guarda em cache na tabela `meta_carteira_cache`. Um agendamento atualiza "Hoje" e "Este mês" a cada 15 min. |

A regra de cálculo fica em `supabase/functions/_shared/metaResults.ts`, com testes em `metaResults.test.ts`.

## 1. Revogar o token antigo (urgente)

O token antigo ficou público no histórico do git. No Business Manager:

1. **Configurações do negócio → Usuários → Usuários do sistema**: crie (ou use) um usuário do sistema com acesso às contas de anúncio da carteira e permissão `ads_read`.
2. Gere um **novo token** para ele.
3. Invalide o token antigo: remova o app ou o acesso do usuário que o gerou, ou troque a senha da conta do Facebook dona do token.
4. Apague o token antigo que ficou salvo no banco:
   ```sql
   UPDATE public.user_integrations SET meta_access_token = NULL;
   ```

## 2. Configurar os segredos

```bash
supabase link --project-ref aczsouypqgjlrqdmrtwq
supabase secrets set \
  META_ACCESS_TOKEN="<novo token do usuário do sistema>" \
  ALLOWED_EMAILS="viniciusmarinhods@gmail.com,antonio.neto@dottech.ai" \
  CRON_SECRET="$(openssl rand -hex 24)" \
  META_API_VERSION="v23.0"
```

- `ALLOWED_EMAILS`: só esses e-mails, logados pelo Supabase Auth, conseguem ler dados da Meta. Sem essa lista, ninguém consegue, porque o login do painel permite que qualquer pessoa crie conta.
- `META_API_VERSION`: opcional. Use a versão mais recente suportada pela Meta.
- `CARTEIRA_CACHE_TTL_MIN`: opcional, padrão 10 minutos.

## 3. Criar a tabela de cache

Rode `supabase/migrations/20261118000000_meta_carteira_cache.sql` no SQL Editor, ou use `supabase db push`.

## 4. Publicar as funções

```bash
supabase functions deploy meta-proxy
supabase functions deploy meta-carteira --no-verify-jwt
```

`meta-carteira` usa `--no-verify-jwt` porque o agendador chama sem sessão de usuário. A função faz a própria verificação: exige uma sessão válida com e-mail em `ALLOWED_EMAILS` ou o header `x-cron-secret`.

## 5. Agendar a atualização automática

1. Ative as extensões `pg_cron` e `pg_net` em Database → Extensions.
2. Abra `supabase/cron_meta_carteira.sql`, troque `<CRON_SECRET>` pelo valor do passo 2 e rode no SQL Editor. Não faça commit desse arquivo com o segredo preenchido.

## 6. Conferir com o Gerenciador

Escolha 2 ou 3 contas e compare **Valor gasto**, **Resultados** e **Custo por resultado** nos períodos *Hoje*, *Últimos 7 dias* e *Este mês*. As colunas do Gerenciador precisam estar com a mesma janela de atribuição dos anúncios (configuração padrão).

## O que mudou no cálculo

- **Resultados**: lidos por conjunto de anúncios a partir do campo nativo `results` da Meta. Se esse campo não vier, o sistema usa a meta de desempenho (`optimization_goal`) e conta só um tipo de ação. Os tipos sobrepostos (`lead` + `onsite_web_lead` + `fb_pixel_lead`, ou as três métricas de conversa) não são mais somados.
- **Custo por resultado**: gasto dos conjuntos daquela categoria ÷ resultados. Numa conta mista, aparece a categoria com mais gasto.
- **Datas**: calculadas no fuso de cada conta, não mais em UTC. Atribuição com `use_unified_attribution_setting=true`.
- **Paginação**: todas as páginas de campanhas, conjuntos e insights são lidas, sem o limite de 100.
- **Valor /dia**: soma dos orçamentos que estão de fato veiculando (`effective_status = ACTIVE`): orçamento de campanha (CBO) ou de conjunto (ABO), com orçamento vitalício convertido em média diária. Sem orçamento ativo, mostra o gasto médio por dia do período, e não mais gasto ÷ 30.
- **Saldo pré-pago**: usa primeiro o saldo informado pela Meta (`funding_source_details`). Se não houver, calcula recargas pagas líquidas − gasto desde a primeira recarga paga.

## Testes

```bash
npx tsx supabase/functions/_shared/metaResults.test.ts
```
