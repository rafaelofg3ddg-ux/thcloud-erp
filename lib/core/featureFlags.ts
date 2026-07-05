import type { FeatureFlag } from "./types";

export const CORE_FEATURE_FLAGS: FeatureFlag[] = [
  {
    chave: "modulo_ordem_servico",
    nome: "Ordem de Serviço",
    descricao: "Controla se o cliente visualiza e utiliza o módulo de Ordem de Serviço.",
    ativo: true,
    modulo: "Operação",
    risco: "baixo",
  },
  {
    chave: "infra_monitoramento",
    nome: "Monitoramento Técnico",
    descricao: "Exibe indicadores técnicos no Super Admin.",
    ativo: true,
    modulo: "Infraestrutura",
    risco: "baixo",
  },
  {
    chave: "auditoria_centralizada",
    nome: "Auditoria Centralizada",
    descricao: "Prepara o Core para registrar eventos padronizados dos módulos.",
    ativo: true,
    modulo: "Core",
    risco: "baixo",
  },
  {
    chave: "atualizacoes_controladas",
    nome: "Atualizações Controladas",
    descricao: "Base para liberar versões por empresa no futuro.",
    ativo: false,
    modulo: "Deploy",
    risco: "medio",
  },
];

export function featureFlagAtiva(chave: string) {
  return CORE_FEATURE_FLAGS.some((flag) => flag.chave === chave && flag.ativo);
}
