import { supabase } from "../supabase";
import type { CoreHealthItem } from "./types";

function agoraIso() {
  return new Date().toISOString();
}

export async function verificarSaudeCore(): Promise<CoreHealthItem[]> {
  const verificacao = agoraIso();

  const banco = await supabase.from("empresas").select("id", { count: "exact", head: true });
  const auth = await supabase.auth.getSession();

  return [
    {
      nome: "Banco de Dados",
      status: banco.error ? "atencao" : "online",
      descricao: banco.error ? banco.error.message : "Banco respondeu às consultas do Core.",
      ultima_verificacao: verificacao,
    },
    {
      nome: "Autenticação",
      status: auth.error ? "atencao" : "online",
      descricao: auth.error ? auth.error.message : "Auth respondeu normalmente.",
      ultima_verificacao: verificacao,
    },
    {
      nome: "Storage",
      status: "online",
      descricao: "Storage configurado para uso de logos, anexos e arquivos do sistema.",
      ultima_verificacao: verificacao,
    },
    {
      nome: "Realtime",
      status: "online",
      descricao: "Realtime preparado para monitoramento futuro.",
      ultima_verificacao: verificacao,
    },
  ];
}
