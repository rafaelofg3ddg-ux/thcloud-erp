import { getEmpresaSessao, getUsuarioSessao, salvarEmpresaSessao } from "./sessao";

export function getEmpresaId() {
  if (typeof window === "undefined") return null;

  const usuarioSessao = getUsuarioSessao();

  if (usuarioSessao?.empresa_id) {
    return usuarioSessao.empresa_id;
  }

  const usuarioLocal = localStorage.getItem("th_usuario");

  if (usuarioLocal) {
    try {
      const usuario = JSON.parse(usuarioLocal);
      return usuario?.empresa_id || null;
    } catch {
      return null;
    }
  }

  return null;
}

export function salvarEmpresaStorage(empresa: any) {
  if (typeof window === "undefined") return;

  salvarEmpresaSessao(empresa);
  localStorage.setItem("th_empresa", JSON.stringify(empresa));
}

export function getEmpresaStorage() {
  if (typeof window === "undefined") return null;

  const empresaSessao = getEmpresaSessao();

  if (empresaSessao) return empresaSessao;

  const empresaLocal = localStorage.getItem("th_empresa");

  if (empresaLocal) {
    try {
      return JSON.parse(empresaLocal);
    } catch {
      localStorage.removeItem("th_empresa");
    }
  }

  return null;
}

export function limparEmpresaStorage() {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem("th_empresa");
  localStorage.removeItem("th_empresa");
}
