import { supabase } from "./supabase";
import { getEmpresaId, getEmpresaStorage, salvarEmpresaStorage } from "./empresa";

export type EmpresaPDF = {
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  logo_url: string;
};

function texto(valor: unknown) {
  return String(valor ?? "").trim();
}

function montarEndereco(empresa: any) {
  return [
    empresa?.endereco || empresa?.logradouro || empresa?.rua,
    empresa?.numero,
    empresa?.bairro,
    empresa?.cidade,
    empresa?.uf || empresa?.estado,
  ]
    .filter(Boolean)
    .join(", ");
}

function normalizarEmpresaPDF(empresa: any = {}, usuario: any = {}): EmpresaPDF {
  const cnpjCpf =
    empresa?.cnpj ||
    empresa?.cpf ||
    usuario?.empresa_cnpj ||
    usuario?.empresa_cpf ||
    "";

  return {
    nome_fantasia:
      texto(empresa?.nome_fantasia) ||
      texto(empresa?.nome) ||
      texto(usuario?.empresa_nome) ||
      "THCloud ERP",
    razao_social:
      texto(empresa?.razao_social) ||
      texto(usuario?.empresa_razao_social),
    cnpj: texto(cnpjCpf),
    telefone:
      texto(empresa?.telefone) ||
      texto(empresa?.celular) ||
      texto(usuario?.empresa_telefone),
    whatsapp:
      texto(empresa?.whatsapp) ||
      texto(empresa?.celular) ||
      texto(usuario?.empresa_whatsapp),
    email:
      texto(empresa?.email) ||
      texto(usuario?.empresa_email),
    endereco: texto(montarEndereco(empresa)),
    logo_url:
      texto(empresa?.logo_url) ||
      texto(empresa?.logo) ||
      texto(empresa?.logoUrl) ||
      "/logo-thcloud.jpeg",
  };
}

function lerUsuarioLocal() {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(localStorage.getItem("th_usuario") || "{}");
  } catch {
    return {};
  }
}

export async function carregarEmpresaPDF(): Promise<EmpresaPDF> {
  const usuario = lerUsuarioLocal();
  const empresaStorage = getEmpresaStorage() || {};
  const empresaId = getEmpresaId() || empresaStorage?.id || usuario?.empresa_id;

  if (empresaId) {
    const { data } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", empresaId)
      .maybeSingle();

    if (data) {
      salvarEmpresaStorage(data);
      return normalizarEmpresaPDF(data, usuario);
    }
  }

  return normalizarEmpresaPDF(empresaStorage, usuario);
}

export function htmlLogoEmpresa(empresa: EmpresaPDF, textoHtml: (valor: unknown) => string) {
  if (!empresa.logo_url) {
    return `<div class="logo-texto">TH</div>`;
  }

  return `<img src="${textoHtml(empresa.logo_url)}" alt="Logo da empresa" />`;
}
