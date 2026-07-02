"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { getEmpresaId } from "../../lib/empresa";

type ContaReceber = {
  id: string;
  valor: number;
  vencimento: string;
  status: string | null;
  descricao?: string | null;
  origem?: string | null;
  orcamento_id?: string | null;
  ordem_servico_id?: string | null;
};

type ContaPagar = {
  id: string;
  valor: number;
  vencimento: string;
  status: string | null;
};

type Caixa = {
  id: string;
  saldo_esperado: number | null;
  status: string | null;
};

type VendaFinanceira = {
  id: string;
  numero_venda: number | null;
  valor_total: number | null;
  status: string | null;
  origem?: string | null;
  orcamento_id?: string | null;
  ordem_servico_id?: string | null;
  created_at: string | null;
};

type OrcamentoFinanceiro = {
  id: string;
  numero_orcamento: number | null;
  ordem_servico_id?: string | null;
  convertido_venda_id?: string | null;
  valor_total: number | null;
  status: string | null;
};

type OrdemServicoFinanceira = {
  id: string;
  numero_os: number | null;
  valor_total: number | null;
  valor_produtos: number | null;
  valor_servicos: number | null;
  status: string | null;
};

type MovimentoFinanceiro = {
  id: string;
  tipo: string | null;
  valor: number | null;
  descricao: string | null;
  created_at: string | null;
};

export default function FinanceiroPage() {
  const [saldoCaixa, setSaldoCaixa] = useState(0);
  const [contasReceber, setContasReceber] = useState(0);
  const [contasPagar, setContasPagar] = useState(0);
  const [receberVencido, setReceberVencido] = useState(0);
  const [pagarVencido, setPagarVencido] = useState(0);

  const [vendas, setVendas] = useState<VendaFinanceira[]>([]);
  const [orcamentos, setOrcamentos] = useState<OrcamentoFinanceiro[]>([]);
  const [ordensServico, setOrdensServico] = useState<OrdemServicoFinanceira[]>([]);
  const [contasReceberDetalhe, setContasReceberDetalhe] = useState<ContaReceber[]>([]);
  const [movimentosIntegrados, setMovimentosIntegrados] = useState<MovimentoFinanceiro[]>([]);
  const [carregando, setCarregando] = useState(false);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarNumero(numero: number | null | undefined) {
    if (!numero) return "-";
    return String(numero).padStart(6, "0");
  }

  function statusAberto(status: string | null | undefined) {
    const texto = String(status || "").toLowerCase();
    return texto !== "pago" && texto !== "recebido" && texto !== "cancelado";
  }

  function origemVenda(venda: VendaFinanceira) {
    const origem = String(venda.origem || "").toLowerCase();

    if (origem === "ordem_servico" || venda.ordem_servico_id) return "OS";
    if (origem === "orcamento" || venda.orcamento_id) return "Orçamento";

    return "PDV";
  }

  async function carregarFinanceiro() {
    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return;
    }

    setCarregando(true);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const caixaReq = await supabase
      .from("caixas")
      .select("id,saldo_esperado,status")
      .eq("empresa_id", empresaId)
      .eq("status", "aberto")
      .limit(1)
      .maybeSingle();

    if (caixaReq.error) {
      setCarregando(false);
      alert("Erro ao carregar caixa: " + caixaReq.error.message);
      return;
    }

    const caixa: Caixa | null = caixaReq.data || null;
    setSaldoCaixa(Number(caixa?.saldo_esperado || 0));

    const receberReq = await supabase
      .from("contas_receber")
      .select("id,valor,vencimento,status,descricao,origem,orcamento_id,ordem_servico_id")
      .eq("empresa_id", empresaId);

    if (receberReq.error) {
      setCarregando(false);
      alert("Erro ao carregar contas a receber: " + receberReq.error.message);
      return;
    }

    const receber: ContaReceber[] = receberReq.data || [];
    setContasReceberDetalhe(receber);

    const receberAbertas = receber.filter((conta) => statusAberto(conta.status));

    setContasReceber(
      receberAbertas.reduce(
        (total, conta) => total + Number(conta.valor || 0),
        0
      )
    );

    const receberVencidas = receberAbertas.filter((conta) => {
      const vencimento = new Date(conta.vencimento + "T00:00:00");
      return vencimento < hoje;
    });

    setReceberVencido(
      receberVencidas.reduce(
        (total, conta) => total + Number(conta.valor || 0),
        0
      )
    );

    const pagarReq = await supabase
      .from("contas_pagar")
      .select("id,valor,vencimento,status")
      .eq("empresa_id", empresaId);

    if (pagarReq.error) {
      setCarregando(false);
      alert("Erro ao carregar contas a pagar: " + pagarReq.error.message);
      return;
    }

    const pagar: ContaPagar[] = pagarReq.data || [];

    const pagarAbertas = pagar.filter(
      (conta) => conta.status !== "pago" && conta.status !== "cancelado"
    );

    setContasPagar(
      pagarAbertas.reduce(
        (total, conta) => total + Number(conta.valor || 0),
        0
      )
    );

    const pagarVencidas = pagarAbertas.filter((conta) => {
      const vencimento = new Date(conta.vencimento + "T00:00:00");
      return vencimento < hoje;
    });

    setPagarVencido(
      pagarVencidas.reduce(
        (total, conta) => total + Number(conta.valor || 0),
        0
      )
    );

    const vendasReq = await supabase
      .from("vendas")
      .select("id,numero_venda,valor_total,status,origem,orcamento_id,ordem_servico_id,created_at")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (vendasReq.error) {
      setCarregando(false);
      alert("Erro ao carregar vendas integradas: " + vendasReq.error.message);
      return;
    }

    setVendas(vendasReq.data || []);

    const orcamentosReq = await supabase
      .from("orcamentos")
      .select("id,numero_orcamento,ordem_servico_id,convertido_venda_id,valor_total,status")
      .eq("empresa_id", empresaId)
      .order("numero_orcamento", { ascending: false })
      .limit(100);

    if (!orcamentosReq.error) {
      setOrcamentos(orcamentosReq.data || []);
    } else {
      setOrcamentos([]);
    }

    const osReq = await supabase
      .from("ordens_servico")
      .select("id,numero_os,valor_total,valor_produtos,valor_servicos,status")
      .eq("empresa_id", empresaId)
      .order("numero_os", { ascending: false })
      .limit(100);

    if (!osReq.error) {
      setOrdensServico(osReq.data || []);
    } else {
      setOrdensServico([]);
    }

    const movimentosReq = await supabase
      .from("movimentacoes_caixa")
      .select("id,tipo,valor,descricao,created_at")
      .eq("empresa_id", empresaId)
      .or("descricao.ilike.%OS Nº%,descricao.ilike.%Orçamento Nº%,descricao.ilike.%Orcamento Nº%")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!movimentosReq.error) {
      setMovimentosIntegrados(movimentosReq.data || []);
    } else {
      setMovimentosIntegrados([]);
    }

    setCarregando(false);
  }

  const resumo = useMemo(() => {
    const vendasFinalizadas = vendas.filter((venda) => venda.status !== "cancelada");
    const vendasOs = vendasFinalizadas.filter((venda) => origemVenda(venda) === "OS");
    const vendasOrcamento = vendasFinalizadas.filter((venda) => origemVenda(venda) === "Orçamento");
    const vendasPdv = vendasFinalizadas.filter((venda) => origemVenda(venda) === "PDV");

    const total = (lista: VendaFinanceira[]) =>
      lista.reduce((soma, venda) => soma + Number(venda.valor_total || 0), 0);

    const contasOs = contasReceberDetalhe.filter(
      (conta) => conta.ordem_servico_id || conta.origem === "ordem_servico"
    );

    const contasOrcamento = contasReceberDetalhe.filter(
      (conta) => conta.orcamento_id || conta.origem === "orcamento"
    );

    const osAbertas = ordensServico.filter((ordem) => {
      const status = String(ordem.status || "").toLowerCase();
      return !["entregue", "finalizada", "cancelada", "cancelado"].includes(status);
    });

    return {
      vendasPdv: total(vendasPdv),
      vendasOrcamento: total(vendasOrcamento),
      vendasOs: total(vendasOs),
      qtdVendasPdv: vendasPdv.length,
      qtdVendasOrcamento: vendasOrcamento.length,
      qtdVendasOs: vendasOs.length,
      contasOs: contasOs
        .filter((conta) => statusAberto(conta.status))
        .reduce((soma, conta) => soma + Number(conta.valor || 0), 0),
      contasOrcamento: contasOrcamento
        .filter((conta) => statusAberto(conta.status))
        .reduce((soma, conta) => soma + Number(conta.valor || 0), 0),
      osAbertas: osAbertas.length,
      valorOsAbertas: osAbertas.reduce(
        (soma, ordem) => soma + Number(ordem.valor_total || 0),
        0
      ),
      orcamentosAprovados: orcamentos.filter((orc) => orc.status === "aprovado").length,
      orcamentosConvertidos: orcamentos.filter((orc) => orc.convertido_venda_id).length,
    };
  }, [vendas, contasReceberDetalhe, ordensServico, orcamentos]);

  useEffect(() => {
    carregarFinanceiro();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-blue-600 font-bold">Módulo Financeiro</p>

            <h1 className="text-4xl font-black text-slate-900 mt-2">
              Dashboard Financeiro
            </h1>

            <p className="text-slate-500 mt-2">
              Vendas, contas, caixa, orçamentos e ordens de serviço integrados.
            </p>
          </div>

          <button
            onClick={carregarFinanceiro}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold disabled:opacity-60"
            disabled={carregando}
          >
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card titulo="Saldo em Caixa" valor={moeda(saldoCaixa)} cor="text-blue-600" />
        <Card titulo="Contas a Receber" valor={moeda(contasReceber)} cor="text-green-600" />
        <Card titulo="Contas a Pagar" valor={moeda(contasPagar)} cor="text-red-600" />
        <Card
          titulo="Lucro Estimado"
          valor={moeda(contasReceber - contasPagar)}
          cor={contasReceber - contasPagar >= 0 ? "text-purple-600" : "text-red-600"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Card titulo="Recebimentos Vencidos" valor={moeda(receberVencido)} cor="text-orange-600" />
        <Card titulo="Pagamentos Vencidos" valor={moeda(pagarVencido)} cor="text-red-600" />
      </div>

      <div className="mt-8 bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Integração Comercial</h2>
            <p className="text-slate-500">Resumo financeiro separado por origem da venda.</p>
          </div>
          <Link href="/relatorios" className="bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-2xl font-bold">
            Ver relatórios
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardDetalhe titulo="Vendas diretas no PDV" valor={moeda(resumo.vendasPdv)} detalhe={`${resumo.qtdVendasPdv} venda(s)`} cor="text-blue-700" />
          <CardDetalhe titulo="Vendas de Orçamentos" valor={moeda(resumo.vendasOrcamento)} detalhe={`${resumo.qtdVendasOrcamento} venda(s)`} cor="text-purple-700" />
          <CardDetalhe titulo="Vendas de OS" valor={moeda(resumo.vendasOs)} detalhe={`${resumo.qtdVendasOs} venda(s)`} cor="text-green-700" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <CardDetalhe titulo="Crediário de OS" valor={moeda(resumo.contasOs)} detalhe="Contas em aberto" cor="text-green-700" />
          <CardDetalhe titulo="Crediário de Orçamento" valor={moeda(resumo.contasOrcamento)} detalhe="Contas em aberto" cor="text-purple-700" />
          <CardDetalhe titulo="OS abertas" valor={moeda(resumo.valorOsAbertas)} detalhe={`${resumo.osAbertas} OS pendente(s)`} cor="text-orange-700" />
          <CardDetalhe titulo="Orçamentos convertidos" valor={`${resumo.orcamentosConvertidos}`} detalhe={`${resumo.orcamentosAprovados} aprovado(s)`} cor="text-blue-950" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
          <h2 className="text-xl font-black text-slate-900 mb-4">Últimas vendas integradas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-3">Venda</th>
                  <th className="py-3">Origem</th>
                  <th className="py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {vendas.slice(0, 8).map((venda) => (
                  <tr key={venda.id} className="border-b last:border-b-0">
                    <td className="py-3 font-bold text-slate-900">#{formatarNumero(venda.numero_venda)}</td>
                    <td className="py-3 text-slate-700">{origemVenda(venda)}</td>
                    <td className="py-3 text-right font-black text-blue-800">{moeda(Number(venda.valor_total || 0))}</td>
                  </tr>
                ))}
                {vendas.length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-slate-500">Nenhuma venda encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
          <h2 className="text-xl font-black text-slate-900 mb-4">Movimentos de caixa vinculados</h2>
          <div className="space-y-3">
            {movimentosIntegrados.map((movimento) => (
              <div key={movimento.id} className="border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-black text-slate-900">{movimento.tipo || "Movimento"}</p>
                  <p className="font-black text-green-700">{moeda(Number(movimento.valor || 0))}</p>
                </div>
                <p className="text-sm text-slate-600 mt-1">{movimento.descricao || "-"}</p>
              </div>
            ))}
            {movimentosIntegrados.length === 0 && (
              <p className="text-center text-slate-500 py-6">Nenhum movimento de OS/Orçamento encontrado no caixa.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ titulo, valor, cor }: { titulo: string; valor: string; cor: string }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <p className="text-slate-500">{titulo}</p>
      <h2 className={`text-3xl font-black mt-2 ${cor}`}>{valor}</h2>
    </div>
  );
}

function CardDetalhe({
  titulo,
  valor,
  detalhe,
  cor,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  cor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-bold text-slate-600">{titulo}</p>
      <h3 className={`text-2xl font-black mt-2 ${cor}`}>{valor}</h3>
      <p className="text-xs text-slate-500 mt-1">{detalhe}</p>
    </div>
  );
}
