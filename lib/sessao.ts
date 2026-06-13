"use client";

export type UsuarioSessao = {
  id: string;
  empresa_id: string | null;
  nome: string;
  email?: string;
  perfil: string;
  plano?: string | null;
  plano_nome?: string | null;
  nome_plano?: string | null;
  modulo_fiscal?: boolean;
  modulo_whatsapp?: boolean;
  modulo_delivery?: boolean;
  modulo_crm?: boolean;
  modulo_relatorios_premium?: boolean;
  modulo_multiloja?: boolean;
  [key: string]: any;
};

export function salvarSessaoUsuario(usuario: UsuarioSessao) {
  if (typeof window === "undefined") return;

  sessionStorage.setItem("th_usuario", JSON.stringify(usuario));
  localStorage.setItem("th_usuario", JSON.stringify(usuario));
}

export function getUsuarioSessao(): UsuarioSessao | null {
  if (typeof window === "undefined") return null;

  const sessao = sessionStorage.getItem("th_usuario");

  if (sessao) {
    try {
      return JSON.parse(sessao);
    } catch {
      sessionStorage.removeItem("th_usuario");
    }
  }

  const antigo = localStorage.getItem("th_usuario");

  if (antigo) {
    try {
      const usuario = JSON.parse(antigo);
      sessionStorage.setItem("th_usuario", JSON.stringify(usuario));
      return usuario;
    } catch {
      localStorage.removeItem("th_usuario");
    }
  }

  return null;
}

export function atualizarSessaoUsuario(dados: Partial<UsuarioSessao>) {
  if (typeof window === "undefined") return;

  const atual = getUsuarioSessao();

  if (!atual) return;

  const atualizado = {
    ...atual,
    ...dados,
  };

  sessionStorage.setItem("th_usuario", JSON.stringify(atualizado));
  localStorage.setItem("th_usuario", JSON.stringify(atualizado));
}

export function salvarEmpresaSessao(empresa: any) {
  if (typeof window === "undefined") return;

  sessionStorage.setItem("th_empresa", JSON.stringify(empresa));
  localStorage.setItem("th_empresa", JSON.stringify(empresa));
}

export function getEmpresaSessao() {
  if (typeof window === "undefined") return null;

  const sessao = sessionStorage.getItem("th_empresa");

  if (sessao) {
    try {
      return JSON.parse(sessao);
    } catch {
      sessionStorage.removeItem("th_empresa");
    }
  }

  const antigo = localStorage.getItem("th_empresa");

  if (antigo) {
    try {
      const empresa = JSON.parse(antigo);
      sessionStorage.setItem("th_empresa", JSON.stringify(empresa));
      return empresa;
    } catch {
      localStorage.removeItem("th_empresa");
    }
  }

  return null;
}

export function salvarPermissoesSessao(permissoes: any) {
  if (typeof window === "undefined") return;

  sessionStorage.setItem("th_permissoes", JSON.stringify(permissoes || {}));
  localStorage.setItem("th_permissoes", JSON.stringify(permissoes || {}));
}

export function getPermissoesSessao() {
  if (typeof window === "undefined") return {};

  const sessao = sessionStorage.getItem("th_permissoes");

  if (sessao) {
    try {
      return JSON.parse(sessao);
    } catch {
      sessionStorage.removeItem("th_permissoes");
    }
  }

  const antigo = localStorage.getItem("th_permissoes");

  if (antigo) {
    try {
      const permissoes = JSON.parse(antigo);
      sessionStorage.setItem("th_permissoes", JSON.stringify(permissoes));
      return permissoes;
    } catch {
      localStorage.removeItem("th_permissoes");
    }
  }

  return {};
}

export function sairSessao() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem("th_usuario");
  sessionStorage.removeItem("th_empresa");
  sessionStorage.removeItem("th_permissoes");
  sessionStorage.removeItem("th_configuracoes_gerais");

  localStorage.removeItem("th_usuario");
  localStorage.removeItem("th_empresa");
  localStorage.removeItem("th_permissoes");
  localStorage.removeItem("th_configuracoes_gerais");
}
