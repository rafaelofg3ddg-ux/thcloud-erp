"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getEmpresaId } from "../../lib/empresa";

type ContaReceber = {
  id: string;
  valor: number;
  vencimento: string;
  status: string | null;
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

export default function FinanceiroPage() {
  const [saldoCaixa, setSaldoCaixa] = useState(0);
  const [contasReceber, setContasReceber] = useState(0);
  const [contasPagar, setContasPagar] = useState(0);
  const [receberVencido, setReceberVencido] = useState(0);
  const [pagarVencido, setPagarVencido] = useState(0);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function carregarFinanceiro() {
    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return;
    }

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
      alert("Erro ao carregar caixa: " + caixaReq.error.message);
      return;
    }

    const caixa: Caixa | null = caixaReq.data || null;

    setSaldoCaixa(Number(caixa?.saldo_esperado || 0));

    const receberReq = await supabase
      .from("contas_receber")
      .select("id,valor,vencimento,status")
      .eq("empresa_id", empresaId);

    if (receberReq.error) {
      alert("Erro ao carregar contas a receber: " + receberReq.error.message);
      return;
    }

    const receber: ContaReceber[] = receberReq.data || [];

    const receberAbertas = receber.filter(
      (conta) =>
        conta.status !== "pago" &&
        conta.status !== "recebido" &&
        conta.status !== "cancelado"
    );

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
  }

  useEffect(() => {
    carregarFinanceiro();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-600 font-bold">Módulo Financeiro</p>

            <h1 className="text-4xl font-black text-slate-900 mt-2">
              Dashboard Financeiro
            </h1>

            <p className="text-slate-500 mt-2">
              Controle financeiro da empresa logada.
            </p>
          </div>

          <button
            onClick={carregarFinanceiro}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          titulo="Saldo em Caixa"
          valor={moeda(saldoCaixa)}
          cor="text-blue-600"
        />

        <Card
          titulo="Contas a Receber"
          valor={moeda(contasReceber)}
          cor="text-green-600"
        />

        <Card
          titulo="Contas a Pagar"
          valor={moeda(contasPagar)}
          cor="text-red-600"
        />

        <Card
          titulo="Lucro Estimado"
          valor={moeda(contasReceber - contasPagar)}
          cor={contasReceber - contasPagar >= 0 ? "text-purple-600" : "text-red-600"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Card
          titulo="Recebimentos Vencidos"
          valor={moeda(receberVencido)}
          cor="text-orange-600"
        />

        <Card
          titulo="Pagamentos Vencidos"
          valor={moeda(pagarVencido)}
          cor="text-red-600"
        />
      </div>
    </div>
  );
}

function Card({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: string;
  cor: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <p className="text-slate-500">{titulo}</p>

      <h2 className={`text-3xl font-black mt-2 ${cor}`}>{valor}</h2>
    </div>
  );
}
