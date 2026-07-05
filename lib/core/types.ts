export type CoreSeverity = "info" | "success" | "warning" | "error";

export type CoreModule =
  | "CORE"
  | "PDV"
  | "OS"
  | "PRODUTOS"
  | "CLIENTES"
  | "FINANCEIRO"
  | "ESTOQUE"
  | "RELATORIOS"
  | "SUPER_ADMIN";

export type CoreEvent = {
  id?: string;
  empresa_id?: string | null;
  usuario_id?: string | null;
  usuario_nome?: string | null;
  modulo: CoreModule | string;
  acao: string;
  descricao: string;
  registro_id?: string | null;
  registro_tipo?: string | null;
  severidade?: CoreSeverity;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
};

export type FeatureFlag = {
  chave: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  modulo: string;
  risco: "baixo" | "medio" | "alto";
};

export type CoreHealthStatus = "online" | "atencao" | "offline";

export type CoreHealthItem = {
  nome: string;
  status: CoreHealthStatus;
  descricao: string;
  ultima_verificacao: string;
};
