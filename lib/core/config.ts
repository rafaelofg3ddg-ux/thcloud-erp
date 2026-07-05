export const CORE_MODULES = [
  "PDV",
  "PRODUTOS",
  "CLIENTES",
  "ORDEM_SERVICO",
  "ORCAMENTOS",
  "FINANCEIRO",
  "ESTOQUE",
  "RELATORIOS",
  "SUPER_ADMIN",
  "INFRAESTRUTURA",
] as const;

export const CORE_ROLLBACK_GUIDE = [
  "Substituir os arquivos da sprint pelo backup anterior.",
  "Não há SQL destrutivo nesta entrega.",
  "Nenhuma tabela operacional é alterada.",
  "Caso o menu Core não seja desejado, remover apenas o link do Sidebar.",
];
