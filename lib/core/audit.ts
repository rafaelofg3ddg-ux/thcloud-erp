import { supabase } from "../supabase";
import type { CoreEvent } from "./types";

export async function registrarEventoCore(evento: CoreEvent) {
  const payload = {
    empresa_id: evento.empresa_id ?? null,
    usuario_id: evento.usuario_id ?? null,
    modulo: evento.modulo,
    acao: evento.acao,
    descricao: evento.descricao,
    registro_id: evento.registro_id ?? null,
    registro_tipo: evento.registro_tipo ?? null,
    severidade: evento.severidade ?? "info",
    metadata: evento.metadata ?? {},
  };

  const { error } = await supabase.from("auditoria").insert(payload);

  if (error) {
    console.warn("TH Cloud Core: não foi possível registrar auditoria", error.message);
    return { ok: false, error };
  }

  return { ok: true, error: null };
}

export async function listarEventosCore(limite = 20) {
  const { data, error } = await supabase
    .from("auditoria")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) return [];
  return data || [];
}
