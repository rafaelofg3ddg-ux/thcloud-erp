import { supabase } from "./supabase";

async function notificacaoExiste(empresaId: string, titulo: string) {
  const hoje = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("notificacoes")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("titulo", titulo)
    .gte("created_at", hoje + "T00:00:00")
    .limit(1);

  return (data || []).length > 0;
}

async function criarNotificacaoAutomatica(params: {
  empresaId: string;
  titulo: string;
  mensagem: string;
  tipo?: string;
  link?: string;
  criadoPor?: string;
}) {
  const existe = await notificacaoExiste(params.empresaId, params.titulo);

  if (existe) return;

  await supabase.from("notificacoes").insert([
    {
      empresa_id: params.empresaId,
      titulo: params.titulo,
      mensagem: params.mensagem,
      tipo: params.tipo || "alerta",
      destino: "todos",
      link: params.link || "/dashboard",
      lida: false,
      ativo: true,
      automatico: true,
      criado_por: params.criadoPor || "Sistema",
    },
  ]);
}

export async function gerarNotificacoesAutomaticas(
  empresaId: string,
  usuarioNome = "Sistema"
) {
  if (!empresaId) return;

  try {
    const produtosReq = await supabase
      .from("produtos")
      .select("id,nome,qtd_atual,qtd_minima")
      .eq("empresa_id", empresaId)
      .eq("ativo", true);

    const produtos = produtosReq.data || [];

    const produtosBaixo = produtos.filter((produto: any) => {
      const atual = Number(produto.qtd_atual || 0);
      const minimo = Number(produto.qtd_minima || 0);
      return minimo > 0 && atual <= minimo;
    });

    if (produtosBaixo.length > 0) {
      await criarNotificacaoAutomatica({
        empresaId,
        titulo: `Estoque baixo: ${produtosBaixo.length} produto(s)`,
        mensagem: `Existem ${produtosBaixo.length} produto(s) abaixo ou igual ao estoque mínimo. Verifique o estoque.`,
        tipo: "alerta",
        link: "/relatorios/estoque",
        criadoPor: usuarioNome,
      });
    }

    const hoje = new Date().toISOString().split("T")[0];

    const receberReq = await supabase
      .from("contas_receber")
      .select("id,valor,vencimento,status")
      .eq("empresa_id", empresaId)
      .lt("vencimento", hoje);

    const contasVencidas = (receberReq.data || []).filter(
      (conta: any) => conta.status !== "pago"
    );

    if (contasVencidas.length > 0) {
      const total = contasVencidas.reduce(
        (soma: number, conta: any) => soma + Number(conta.valor || 0),
        0
      );

      await criarNotificacaoAutomatica({
        empresaId,
        titulo: `Clientes com parcelas vencidas`,
        mensagem: `${contasVencidas.length} conta(s) vencida(s), total aproximado de R$ ${total.toFixed(2).replace(".", ",")}.`,
        tipo: "alerta",
        link: "/financeiro/contas-receber",
        criadoPor: usuarioNome,
      });
    }

    try {
      const pagarReq = await supabase
        .from("contas_pagar")
        .select("id,valor,vencimento,status")
        .eq("empresa_id", empresaId)
        .lt("vencimento", hoje);

      const pagarVencidas = (pagarReq.data || []).filter(
        (conta: any) => conta.status !== "pago"
      );

      if (pagarVencidas.length > 0) {
        await criarNotificacaoAutomatica({
          empresaId,
          titulo: `Contas a pagar vencidas`,
          mensagem: `Existem ${pagarVencidas.length} despesa(s) vencida(s). Verifique o financeiro.`,
          tipo: "alerta",
          link: "/financeiro/contas-pagar",
          criadoPor: usuarioNome,
        });
      }
    } catch {}

    return true;
  } catch {
    return false;
  }
}
