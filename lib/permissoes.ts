export function temPermissao(
  perfil: string,
  permissao: string
) {
  const permissoes: Record<string, string[]> = {
    "Super Admin": ["*"],

    Administrador: [
      "dashboard",
      "clientes",
      "produtos",
      "estoque",
      "vendas",
      "financeiro",
      "relatorios",
      "usuarios",
      "configuracoes",
    ],

    Gerente: [
      "dashboard",
      "clientes",
      "produtos",
      "estoque",
      "vendas",
      "financeiro",
      "relatorios",
    ],

    Financeiro: [
      "dashboard",
      "financeiro",
      "relatorios",
    ],

    Estoquista: [
      "dashboard",
      "produtos",
      "estoque",
    ],

    Vendedor: [
      "dashboard",
      "clientes",
      "vendas",
    ],

    "Operador de Caixa": [
      "dashboard",
      "vendas",
    ],
  };

  const lista = permissoes[perfil] || [];

  if (lista.includes("*")) return true;

  return lista.includes(permissao);
}