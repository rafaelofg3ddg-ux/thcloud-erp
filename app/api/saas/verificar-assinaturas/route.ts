import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../../lib/supabaseAdmin";

type Empresa = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  ativo: boolean | null;
  plano: string | null;
  valor_mensal: number | null;
  status_assinatura: string | null;
  data_vencimento_assinatura: string | null;
};

function hojeISO() {
  return new Date().toISOString().split("T")[0];
}

function nomeEmpresa(empresa: Empresa) {
  return empresa.nome_fantasia || empresa.razao_social || "Empresa sem nome";
}

async function registrarNotificacaoSaas(titulo: string, mensagem: string, link = "/admin/assinaturas") {
  try {
    await supabase.from("notificacoes").insert([
      {
        empresa_id: null,
        titulo,
        mensagem,
        tipo: "saas",
        destino: "super_admin",
        link,
        lida: false,
        ativo: true,
        automatico: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  } catch {
    // Se a tabela notificacoes tiver estrutura diferente, não bloqueia a automação.
  }
}

export async function GET(request: NextRequest) {
  try {
    const tokenUrl = request.nextUrl.searchParams.get("token");
    const tokenAmbiente = process.env.BACKUP_CRON_TOKEN || process.env.SAAS_CRON_TOKEN || "";

    if (tokenAmbiente && tokenUrl !== tokenAmbiente) {
      return NextResponse.json(
        {
          ok: false,
          erro: "Token inválido.",
        },
        { status: 401 }
      );
    }

    const hoje = hojeISO();

    const { data: empresas, error } = await supabase
      .from("empresas")
      .select(
        "id,nome_fantasia,razao_social,ativo,plano,valor_mensal,status_assinatura,data_vencimento_assinatura"
      )
      .not("data_vencimento_assinatura", "is", null);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          erro: error.message,
        },
        { status: 500 }
      );
    }

    const lista = (empresas || []) as Empresa[];

    const vencidas = lista.filter((empresa) => {
      if (!empresa.data_vencimento_assinatura) return false;
      if (empresa.status_assinatura === "Pago") return false;
      if (empresa.status_assinatura === "Cancelado") return false;
      return empresa.data_vencimento_assinatura < hoje;
    });

    const vencendo = lista.filter((empresa) => {
      if (!empresa.data_vencimento_assinatura) return false;

      const dataVencimento = new Date(empresa.data_vencimento_assinatura + "T00:00:00");
      const dataHoje = new Date(hoje + "T00:00:00");
      const diferencaDias = Math.ceil(
        (dataVencimento.getTime() - dataHoje.getTime()) / (1000 * 60 * 60 * 24)
      );

      return diferencaDias >= 0 && diferencaDias <= 3;
    });

    let bloqueadas = 0;
    let erros = 0;

    for (const empresa of vencidas) {
      const { error: erroUpdate } = await supabase
        .from("empresas")
        .update({
          ativo: false,
          status_assinatura: "Bloqueado",
          updated_at: new Date().toISOString(),
        })
        .eq("id", empresa.id);

      if (erroUpdate) {
        erros += 1;
        continue;
      }

      bloqueadas += 1;

      await registrarNotificacaoSaas(
        "Empresa bloqueada por vencimento",
        `${nomeEmpresa(empresa)} foi bloqueada automaticamente. Vencimento: ${empresa.data_vencimento_assinatura}.`,
        "/admin/assinaturas"
      );
    }

    for (const empresa of vencendo) {
      await registrarNotificacaoSaas(
        "Assinatura próxima do vencimento",
        `${nomeEmpresa(empresa)} vence em breve. Vencimento: ${empresa.data_vencimento_assinatura}.`,
        "/admin/assinaturas"
      );
    }

    return NextResponse.json({
      ok: true,
      executado_em: new Date().toISOString(),
      empresas_analisadas: lista.length,
      vencendo_em_ate_3_dias: vencendo.length,
      vencidas: vencidas.length,
      bloqueadas,
      erros,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        erro: error?.message || "Erro ao verificar assinaturas SaaS.",
      },
      { status: 500 }
    );
  }
}
