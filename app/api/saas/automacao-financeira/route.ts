import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

type ConfiguracaoSaas = {
  dias_carencia: number | null;
  gerar_cobranca_automatica: boolean | null;
  bloquear_automaticamente: boolean | null;
  enviar_notificacao_vencimento: boolean | null;
};

type Empresa = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  ativo: boolean | null;
  plano: string | null;
  valor_mensal: number | null;
  status_assinatura: string | null;
  data_inicio_assinatura: string | null;
  data_vencimento_assinatura: string | null;
};

type Cobranca = {
  id: string;
  empresa_id: string | null;
  vencimento: string | null;
  status: string | null;
};

function hojeISO() {
  return new Date().toISOString().split("T")[0];
}

function adicionarDias(dataBase: string, dias: number) {
  const data = new Date(dataBase + "T00:00:00");
  data.setDate(data.getDate() + dias);
  return data.toISOString().split("T")[0];
}

function nomeEmpresa(empresa: Empresa) {
  return empresa.nome_fantasia || empresa.razao_social || "Empresa sem nome";
}

function normalizarStatus(status: string | null) {
  const valor = String(status || "").toLowerCase();

  if (valor === "pago" || valor === "paga") return "Pago";
  if (valor === "cancelado" || valor === "cancelada") return "Cancelado";
  if (valor === "vencido" || valor === "vencida") return "Vencido";
  if (valor === "bloqueado" || valor === "bloqueada") return "Bloqueado";
  if (valor === "teste") return "Teste";
  if (valor === "ativo" || valor === "ativa") return "Ativo";
  if (valor === "aberto" || valor === "aberta") return "Aberta";

  return status || "Aberta";
}

async function registrarHistorico(empresaId: string, acao: string, descricao: string) {
  try {
    await supabase.from("historico_empresas").insert([
      {
        empresa_id: empresaId,
        acao,
        descricao,
        usuario: "Automação THCloud",
      },
    ]);
  } catch {}
}

async function criarNotificacaoSaas(
  tipo: string,
  titulo: string,
  descricao: string,
  empresaId: string | null
) {
  try {
    const dataHoje = hojeISO();

    const { data: existente } = await supabase
      .from("notificacoes_saas")
      .select("id")
      .eq("tipo", tipo)
      .eq("titulo", titulo)
      .eq("descricao", descricao)
      .eq("empresa_id", empresaId)
      .gte("created_at", dataHoje)
      .maybeSingle();

    if (existente?.id) return;

    await supabase.from("notificacoes_saas").insert([
      {
        tipo,
        titulo,
        descricao,
        empresa_id: empresaId,
        lida: false,
      },
    ]);
  } catch {}
}

async function buscarConfiguracao() {
  const { data } = await supabase
    .from("configuracoes_saas")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (data) return data as ConfiguracaoSaas;

  const padrao = {
    dias_carencia: 3,
    gerar_cobranca_automatica: true,
    bloquear_automaticamente: true,
    enviar_notificacao_vencimento: true,
  };

  await supabase.from("configuracoes_saas").insert([padrao]);

  return padrao as ConfiguracaoSaas;
}

async function existeCobrancaAbertaMes(empresaId: string, anoMes: string) {
  const { data } = await supabase
    .from("cobrancas_saas")
    .select("id,empresa_id,vencimento,status")
    .eq("empresa_id", empresaId)
    .gte("vencimento", `${anoMes}-01`)
    .lte("vencimento", `${anoMes}-31`)
    .neq("status", "Cancelado")
    .limit(1)
    .maybeSingle();

  return data as Cobranca | null;
}

export async function GET(request: NextRequest) {
  try {
    const tokenUrl = request.nextUrl.searchParams.get("token");
    const tokenAmbiente =
      process.env.SAAS_CRON_TOKEN || process.env.BACKUP_CRON_TOKEN || "";

    if (tokenAmbiente && tokenUrl !== tokenAmbiente) {
      return NextResponse.json(
        {
          ok: false,
          erro: "Token inválido.",
        },
        { status: 401 }
      );
    }

    const configuracao = await buscarConfiguracao();

    const hoje = hojeISO();
    const anoMesAtual = hoje.slice(0, 7);
    const diasCarencia = Number(configuracao.dias_carencia || 0);

    const { data: empresasData, error: empresasError } = await supabase
      .from("empresas")
      .select(
        "id,nome_fantasia,razao_social,ativo,plano,valor_mensal,status_assinatura,data_inicio_assinatura,data_vencimento_assinatura"
      )
      .not("id", "is", null);

    if (empresasError) {
      return NextResponse.json(
        {
          ok: false,
          erro: empresasError.message,
        },
        { status: 500 }
      );
    }

    const empresas = (empresasData || []) as Empresa[];

    let cobrancasGeradas = 0;
    let empresasBloqueadas = 0;
    let notificacoesGeradas = 0;
    let empresasAnalisadas = 0;

    for (const empresa of empresas) {
      empresasAnalisadas += 1;

      const nome = nomeEmpresa(empresa);
      const status = normalizarStatus(empresa.status_assinatura);

      if (status === "Cancelado") continue;

      const vencimento =
        empresa.data_vencimento_assinatura ||
        empresa.data_inicio_assinatura ||
        hoje;

      if (configuracao.gerar_cobranca_automatica !== false) {
        const cobrancaExistente = await existeCobrancaAbertaMes(
          empresa.id,
          anoMesAtual
        );

        if (!cobrancaExistente && empresa.ativo !== false) {
          const { error: erroCobranca } = await supabase
            .from("cobrancas_saas")
            .insert([
              {
                empresa_id: empresa.id,
                descricao: `Mensalidade THCloud ERP - ${empresa.plano || "Básico"}`,
                valor: Number(empresa.valor_mensal || 0),
                vencimento,
                status: "Aberta",
                forma_pagamento: null,
                observacoes: "Cobrança gerada automaticamente pelo THCloud.",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]);

          if (!erroCobranca) {
            cobrancasGeradas += 1;

            await registrarHistorico(
              empresa.id,
              "Cobrança automática gerada",
              `Cobrança mensal gerada automaticamente com vencimento em ${vencimento}.`
            );
          }
        }
      }

      if (configuracao.enviar_notificacao_vencimento !== false) {
        const diasParaVencer = Math.ceil(
          (new Date(vencimento + "T00:00:00").getTime() -
            new Date(hoje + "T00:00:00").getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if ([7, 3, 0].includes(diasParaVencer)) {
          await criarNotificacaoSaas(
            "vencimento_assinatura",
            "Assinatura próxima do vencimento",
            `${nome} vence em ${diasParaVencer === 0 ? "hoje" : `${diasParaVencer} dia(s)`}. Vencimento: ${vencimento}.`,
            empresa.id
          );

          notificacoesGeradas += 1;
        }

        if (diasParaVencer < 0) {
          await criarNotificacaoSaas(
            "assinatura_vencida",
            "Assinatura vencida",
            `${nome} está vencida desde ${vencimento}.`,
            empresa.id
          );

          notificacoesGeradas += 1;
        }
      }

      if (configuracao.bloquear_automaticamente !== false) {
        const dataLimiteBloqueio = adicionarDias(vencimento, diasCarencia);

        if (
          empresa.ativo !== false &&
          dataLimiteBloqueio < hoje &&
          status !== "Teste"
        ) {
          const { error: erroBloqueio } = await supabase
            .from("empresas")
            .update({
              ativo: false,
              status_assinatura: "Bloqueado",
              updated_at: new Date().toISOString(),
            })
            .eq("id", empresa.id);

          if (!erroBloqueio) {
            empresasBloqueadas += 1;

            await registrarHistorico(
              empresa.id,
              "Bloqueio automático",
              `Empresa bloqueada automaticamente após ${diasCarencia} dia(s) de carência. Vencimento: ${vencimento}.`
            );

            await criarNotificacaoSaas(
              "bloqueio_automatico",
              "Empresa bloqueada automaticamente",
              `${nome} foi bloqueada por atraso na assinatura.`,
              empresa.id
            );

            notificacoesGeradas += 1;
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      executado_em: new Date().toISOString(),
      empresas_analisadas: empresasAnalisadas,
      cobrancas_geradas: cobrancasGeradas,
      empresas_bloqueadas: empresasBloqueadas,
      notificacoes_geradas: notificacoesGeradas,
      configuracao: {
        dias_carencia: diasCarencia,
        gerar_cobranca_automatica:
          configuracao.gerar_cobranca_automatica !== false,
        bloquear_automaticamente: configuracao.bloquear_automaticamente !== false,
        enviar_notificacao_vencimento:
          configuracao.enviar_notificacao_vencimento !== false,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        erro: error?.message || "Erro ao executar automação financeira SaaS.",
      },
      { status: 500 }
    );
  }
}
