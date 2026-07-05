# TH Cloud — Arquitetura e Roteiro Técnico

## Objetivo

Este documento define o padrão técnico do TH Cloud como produto SaaS comercial. O objetivo é evoluir o ERP com segurança, estabilidade, rastreabilidade e baixo risco para clientes em produção.

## Ambientes

O TH Cloud deve evoluir com três ambientes:

1. **DEV** — desenvolvimento e testes internos.
2. **HOMOLOGAÇÃO** — validação antes de liberar para clientes.
3. **PRODUÇÃO** — ambiente usado por clientes.

Regra: nunca aplicar mudanças estruturais diretamente em produção sem backup e validação prévia.

## Versionamento

O sistema adota versionamento semântico:

- `1.0.0` — versão base estável.
- `1.0.1` — correções pequenas.
- `1.1.0` — melhorias compatíveis.
- `2.0.0` — mudanças grandes.

A versão atual fica centralizada em `lib/systemVersion.ts`.

## Separação de áreas

### ERP do Cliente

Uso operacional diário:

- Dashboard
- Clientes
- Produtos
- Serviços
- Equipamentos
- Ordem de Serviço
- Orçamentos
- PDV
- Financeiro
- Compras
- Relatórios

### Plataforma / Super Admin

Gestão SaaS e infraestrutura:

- Empresas
- Usuários
- Planos
- Assinaturas
- Infraestrutura
- Auditoria
- Logs
- Backups
- Core do Sistema
- Métricas SaaS
- Cobranças
- Bloqueios

## Super Admin

A estrutura oficial do Super Admin é:

- **Visão Geral**
  - Dashboard Executivo
- **Gestão**
  - Empresas
  - Usuários
  - Planos
  - Assinaturas
- **Infraestrutura**
  - Dashboard Técnico
  - Saúde do Sistema
  - Banco e Performance
  - Auditoria
  - Logs
  - Backups
  - Atualizações
  - Core do Sistema
- **Plataforma**
  - Configurações Globais
  - Notificações
  - Onboarding
- **SaaS**
  - Métricas SaaS
  - Cobranças
  - Bloqueios
  - Implantação
- **Sistema**
  - Controle Master
  - Sobre e Licença

## Padrão de componentes

Componentes administrativos reutilizáveis ficam em:

```txt
components/admin/
```

Componentes globais do ERP ficam em:

```txt
components/global/
```

Regra: novas telas devem reutilizar componentes existentes antes de criar novos componentes.

## Checklist obrigatório antes de cada sprint

1. Objetivo da sprint.
2. Módulos afetados.
3. Risco: baixo, médio ou alto.
4. Necessidade de SQL.
5. Impacto nas integrações.
6. Plano de rollback.
7. Testes mínimos antes de homologar.

## Política de banco de dados

Mudanças seguras:

- `CREATE INDEX IF NOT EXISTS`
- `CREATE TABLE IF NOT EXISTS` quando necessário
- views auxiliares
- funções auxiliares não destrutivas

Mudanças de alto risco:

- `DROP TABLE`
- `DROP COLUMN`
- `TRUNCATE`
- `DELETE` sem filtro
- alteração de tipo de coluna
- ativação de RLS sem políticas testadas

## Rollback

Toda sprint deve permitir reversão simples. Para sprints sem SQL, o rollback é restaurar os arquivos alterados. Para sprints com SQL, deve haver script de reversão ou plano manual documentado.

## Diretriz principal

A evolução do TH Cloud deve preservar estabilidade dos módulos críticos:

- PDV
- Ordem de Serviço
- Financeiro
- Produtos
- Estoque
- Relatórios
- Integrações entre módulos

