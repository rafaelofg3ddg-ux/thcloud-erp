export function getEmpresaId() {
  if (typeof window === "undefined") return null;

  try {
    const usuario = localStorage.getItem("th_usuario");
    if (!usuario) return null;

    const dados = JSON.parse(usuario);

    return dados.empresa_id || null;
  } catch {
    return null;
  }
}

export function getEmpresaStorage() {
  if (typeof window === "undefined") return null;

  try {
    const empresa = localStorage.getItem("th_empresa");
    if (!empresa) return null;

    return JSON.parse(empresa);
  } catch {
    return null;
  }
}

export function salvarEmpresaStorage(empresa: any) {
  if (typeof window === "undefined") return;

  localStorage.setItem("th_empresa", JSON.stringify(empresa));
}

export function getLogoEmpresa() {
  const empresa = getEmpresaStorage();

  return empresa?.logo_url || "/logo-thcloud-transparente.png";
}

export function getNomeEmpresa() {
  const empresa = getEmpresaStorage();

  return (
    empresa?.nome_fantasia ||
    empresa?.nome ||
    empresa?.razao_social ||
    "THCloud ERP"
  );
}
