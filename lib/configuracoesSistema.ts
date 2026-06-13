export type ConfiguracoesSistema = {
  nome_sistema: string;
  tema_cor: string;
  modo_compacto: boolean;
  permitir_estoque_negativo: boolean;
  alerta_estoque_baixo: boolean;
  imprimir_cupom_automatico: boolean;
  imprimir_romaneio_delivery: boolean;
  mostrar_logo_cupom: boolean;
  mensagem_cupom: string;
  validade_orcamento_dias: number;
  bloquear_venda_sem_caixa: boolean;
  exigir_cliente_crediario: boolean;
  exigir_autorizacao_sangria: boolean;
  exigir_autorizacao_desconto: boolean;
  desconto_maximo_percentual: number;
  chave_pix: string;
  nome_recebedor_pix: string;
  cidade_pix: string;
  whatsapp_padrao: string;
  mensagem_whatsapp_orcamento: string;
  horario_funcionamento: string;
  observacoes_internas: string;
  permitir_arredondamento_operador: boolean;
  intervalo_parcelas_padrao_dias: number;
  gerar_promissoria_crediario: boolean;
};

export const CONFIGURACOES_PADRAO: ConfiguracoesSistema = {
  nome_sistema: "THCloud ERP",
  tema_cor: "#1d4ed8",
  modo_compacto: false,
  permitir_estoque_negativo: false,
  alerta_estoque_baixo: true,
  imprimir_cupom_automatico: true,
  imprimir_romaneio_delivery: true,
  mostrar_logo_cupom: true,
  mensagem_cupom: "Obrigado pela preferência!",
  validade_orcamento_dias: 7,
  bloquear_venda_sem_caixa: true,
  exigir_cliente_crediario: true,
  exigir_autorizacao_sangria: true,
  exigir_autorizacao_desconto: false,
  desconto_maximo_percentual: 0,
  chave_pix: "",
  nome_recebedor_pix: "TH GESTAO",
  cidade_pix: "SAO PAULO",
  whatsapp_padrao: "",
  mensagem_whatsapp_orcamento: "Olá! Segue seu orçamento. Qualquer dúvida estamos à disposição.",
  horario_funcionamento: "",
  observacoes_internas: "",
  permitir_arredondamento_operador: true,
  intervalo_parcelas_padrao_dias: 30,
  gerar_promissoria_crediario: true,
};

export function normalizarConfiguracoesSistema(data: any): ConfiguracoesSistema {
  return {
    ...CONFIGURACOES_PADRAO,
    nome_sistema: data?.nome_sistema || CONFIGURACOES_PADRAO.nome_sistema,
    tema_cor: data?.tema_cor || CONFIGURACOES_PADRAO.tema_cor,
    modo_compacto: data?.modo_compacto === true,
    permitir_estoque_negativo: data?.permitir_estoque_negativo === true,
    alerta_estoque_baixo: data?.alerta_estoque_baixo !== false,
    imprimir_cupom_automatico: data?.imprimir_cupom_automatico !== false,
    imprimir_romaneio_delivery: data?.imprimir_romaneio_delivery !== false,
    mostrar_logo_cupom: data?.mostrar_logo_cupom !== false,
    mensagem_cupom: data?.mensagem_cupom || CONFIGURACOES_PADRAO.mensagem_cupom,
    validade_orcamento_dias: Number(data?.validade_orcamento_dias || 7),
    bloquear_venda_sem_caixa: data?.bloquear_venda_sem_caixa !== false,
    exigir_cliente_crediario: data?.exigir_cliente_crediario !== false,
    exigir_autorizacao_sangria: data?.exigir_autorizacao_sangria !== false,
    exigir_autorizacao_desconto: data?.exigir_autorizacao_desconto === true,
    desconto_maximo_percentual: Number(data?.desconto_maximo_percentual || 0),
    chave_pix: data?.chave_pix || "",
    nome_recebedor_pix: data?.nome_recebedor_pix || CONFIGURACOES_PADRAO.nome_recebedor_pix,
    cidade_pix: data?.cidade_pix || CONFIGURACOES_PADRAO.cidade_pix,
    whatsapp_padrao: data?.whatsapp_padrao || "",
    mensagem_whatsapp_orcamento: data?.mensagem_whatsapp_orcamento || CONFIGURACOES_PADRAO.mensagem_whatsapp_orcamento,
    horario_funcionamento: data?.horario_funcionamento || "",
    observacoes_internas: data?.observacoes_internas || "",
    permitir_arredondamento_operador: data?.permitir_arredondamento_operador !== false,
    intervalo_parcelas_padrao_dias: Number(data?.intervalo_parcelas_padrao_dias || 30),
    gerar_promissoria_crediario: data?.gerar_promissoria_crediario !== false,
  };
}
