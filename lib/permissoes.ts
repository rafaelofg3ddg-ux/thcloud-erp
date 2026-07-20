export type PermissoesUsuario = {
  permissao_dashboard?: boolean;
  permissao_clientes?: boolean;
  permissao_produtos?: boolean;
  permissao_grupos?: boolean;
  permissao_fornecedores?: boolean;
  permissao_estoque?: boolean;
  permissao_estoque_entrada?: boolean;
  permissao_estoque_saida?: boolean;
  permissao_estoque_ajuste?: boolean;
  permissao_estoque_inventario?: boolean;
  permissao_pdv?: boolean;
  permissao_vendas_consulta?: boolean;
  permissao_devolucoes?: boolean;
  permissao_orcamentos?: boolean;
  permissao_pedidos?: boolean;
  permissao_financeiro?: boolean;
  permissao_contas_receber?: boolean;
  permissao_contas_pagar?: boolean;
  permissao_fluxo_caixa?: boolean;
  permissao_dre?: boolean;
  permissao_relatorios?: boolean;
  permissao_configuracoes?: boolean;
  permissao_usuarios?: boolean;
  permissao_empresa?: boolean;
  permissao_fiscal?: boolean;
  permissao_whatsapp?: boolean;
  permissao_crm?: boolean;
  permissao_delivery?: boolean;
  permissao_multiloja?: boolean;
};

export function getUsuarioLogado(): any {
  if (typeof window === "undefined") return null;
  try {
    const usuario = localStorage.getItem("th_usuario");
    if (!usuario) return null;
    return JSON.parse(usuario);
  } catch {
    return null;
  }
}

export function temPermissao(chave: keyof PermissoesUsuario) {
  const usuario = getUsuarioLogado();
  if (!usuario) return false;
  if (usuario.perfil === "Super Admin" || usuario.perfil === "Administrador") return true;
  return usuario[chave] === true;
}
