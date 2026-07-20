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

// Token assinado no login (JWT contendo a empresa do usuario).
// Por enquanto ele so e guardado - nenhuma consulta ao banco usa
// esse token ainda, entao salvar/ler/limpar aqui nao muda nada
// no funcionamento atual do sistema.
export function salvarTokenSessao(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) return;

  sessionStorage.setItem("th_token", token);
  localStorage.setItem("th_token", token);
}

export function getTokenSessao(): string | null {
  if (typeof window === "undefined") return null;

  return sessionStorage.getItem("th_token") || localStorage.getItem("th_token");
}

export function sairSessao() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem("th_usuario");
  sessionStorage.removeItem("th_empresa");
  sessionStorage.removeItem("th_permissoes");
  sessionStorage.removeItem("th_configuracoes_gerais");
  sessionStorage.removeItem("th_token");

  localStorage.removeItem("th_usuario");
  localStorage.removeItem("th_empresa");
  localStorage.removeItem("th_permissoes");
  localStorage.removeItem("th_configuracoes_gerais");
  localStorage.removeItem("th_token");
}
