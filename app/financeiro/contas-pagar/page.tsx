"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";

type Fornecedor = {
  id: string;
  razao_social: string;
  cnpj: string | null;
};

type CategoriaFinanceira = {
  id: string;
  nome: string;
  tipo: string;
};

type ContaPagar = {
  id: string;
  empresa_id: string;
  fornecedor_id: string | null;
  categoria_id: string | null;
  descricao: string;
  valor: number;
  vencimento: string;
  data_pagamento: string | null;
  status: string | null;
  observacao: string | null;
  created_at: string | null;
};

export default function ContasPagarPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [contas, setContas] = useState<ContaPagar[]>([]);

  const [fornecedorId, setFornecedorId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [observacao, setObservacao] = useState("");
  const [filtro, setFiltro] = useState("todos");

  function empresaAtualId() {
    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }

    return empresaId;
  }

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function converterNumero(valor: string) {
    return Number(String(valor || "0").replace(",", "."));
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  function nomeFornecedor(id: string | null) {
    if (!id) return "-";
    return fornecedores.find((item) => item.id === id)?.razao_social || "-";
  }

  function nomeCategoria(id: string | null) {
    if (!id) return "-";
    return categorias.find((item) => item.id === id)?.nome || "-";
  }

  function statusVisual(conta: ContaPagar) {
    if (conta.status === "pago") {
      return {
        texto: "Pago",
        classe: "bg-green-100 text-green-700",
      };
    }

    if (conta.status === "cancelado") {
      return {
        texto: "Cancelado",
        classe: "bg-slate-100 text-slate-700",
      };
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const venc = new Date(conta.vencimento + "T00:00:00");

    if (venc < hoje) {
      return {
        texto: "Vencido",
        classe: "bg-red-100 text-red-700",
      };
    }

    return {
      texto: "Aberto",
      classe: "bg-orange-100 text-orange-700",
    };
  }

  async function carregarFornecedores() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { data, error } = await supabase
      .from("fornecedores")
      .select("id,razao_social,cnpj")
      .eq("empresa_id", empresaId)
      .order("razao_social");

    if (error) {
      alert("Erro ao carregar fornecedores: " + error.message);
      return;
    }

    setFornecedores(data || []);
  }

  async function carregarCategorias() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { data, error } = await supabase
      .from("categorias_financeiras")
      .select("id,nome,tipo")
      .eq("empresa_id", empresaId)
      .eq("tipo", "despesa")
      .eq("ativo", true)
      .order("nome");

    if (error) {
      alert("Erro ao carregar categorias: " + error.message);
      return;
    }

    setCategorias(data || []);
  }

  async function carregarContas() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { data, error } = await supabase
      .from("contas_pagar")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("vencimento", { ascending: true });

    if (error) {
      alert("Erro ao carregar contas a pagar: " + error.message);
      return;
    }

    setContas(data || []);
  }

  async function salvarConta() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!descricao || !valor || !vencimento) {
      alert("Preencha descrição, valor e vencimento.");
      return;
    }

    const valorNumerico = converterNumero(valor);

    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    const { error } = await supabase.from("contas_pagar").insert([
      {
        empresa_id: empresaId,
        fornecedor_id: fornecedorId || null,
        categoria_id: categoriaId || null,
        descricao,
        valor: valorNumerico,
        vencimento,
        data_pagamento: null,
        status: "aberto",
        observacao: observacao || null,
      },
    ]);

    if (error) {
      alert("Erro ao salvar conta a pagar: " + error.message);
      return;
    }

    alert("Conta a pagar cadastrada com sucesso!");

    setFornecedorId("");
    setCategoriaId("");
    setDescricao("");
    setValor("");
    setVencimento("");
    setObservacao("");

    await carregarContas();
  }

  async function marcarComoPago(conta: ContaPagar) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const confirmar = confirm(
      `Confirmar pagamento de ${moeda(Number(conta.valor || 0))}?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("contas_pagar")
      .update({
        status: "pago",
        data_pagamento: new Date().toISOString().split("T")[0],
      })
      .eq("id", conta.id)
      .eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao marcar como pago: " + error.message);
      return;
    }

    alert("Conta marcada como paga!");
    await carregarContas();
  }

  async function cancelarConta(conta: ContaPagar) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const confirmar = confirm("Deseja cancelar esta conta a pagar?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("contas_pagar")
      .update({
        status: "cancelado",
      })
      .eq("id", conta.id)
      .eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao cancelar conta: " + error.message);
      return;
    }

    alert("Conta cancelada!");
    await carregarContas();
  }

  async function excluirConta(conta: ContaPagar) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const confirmar = confirm("Deseja excluir definitivamente esta conta?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("contas_pagar")
      .delete()
      .eq("id", conta.id)
      .eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao excluir conta: " + error.message);
      return;
    }

    alert("Conta excluída!");
    await carregarContas();
  }

  function contasFiltradas() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return contas.filter((conta) => {
      if (filtro === "todos") return true;

      if (filtro === "aberto") {
        return conta.status !== "pago" && conta.status !== "cancelado";
      }

      if (filtro === "pago") {
        return conta.status === "pago";
      }

      if (filtro === "vencido") {
        const venc = new Date(conta.vencimento + "T00:00:00");
        return (
          venc < hoje &&
          conta.status !== "pago" &&
          conta.status !== "cancelado"
        );
      }

      if (filtro === "cancelado") {
        return conta.status === "cancelado";
      }

      return true;
    });
  }

  function totalAberto() {
    return contas
      .filter((conta) => conta.status !== "pago" && conta.status !== "cancelado")
      .reduce((total, conta) => total + Number(conta.valor || 0), 0);
  }

  function totalPago() {
    return contas
      .filter((conta) => conta.status === "pago")
      .reduce((total, conta) => total + Number(conta.valor || 0), 0);
  }

  function totalVencido() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return contas
      .filter((conta) => {
        const venc = new Date(conta.vencimento + "T00:00:00");
        return (
          venc < hoje &&
          conta.status !== "pago" &&
          conta.status !== "cancelado"
        );
      })
      .reduce((total, conta) => total + Number(conta.valor || 0), 0);
  }

  useEffect(() => {
    carregarFornecedores();
    carregarCategorias();
    carregarContas();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-8">
        <p className="text-blue-600 font-bold">Financeiro</p>

        <h1 className="text-4xl font-black text-slate-900 mt-2">
          Contas a Pagar
        </h1>

        <p className="text-slate-500 mt-2">
          Cadastre, acompanhe e quite as despesas da empresa logada.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card titulo="Em Aberto" valor={moeda(totalAberto())} cor="text-orange-600" />

        <Card titulo="Pago" valor={moeda(totalPago())} cor="text-green-600" />

        <Card titulo="Vencido" valor={moeda(totalVencido())} cor="text-red-600" />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
        <h2 className="text-2xl font-black text-slate-900 mb-6">
          Nova Conta a Pagar
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={fornecedorId}
            onChange={(e) => setFornecedorId(e.target.value)}
            className="border border-slate-300 p-3 rounded-xl text-slate-900 bg-white"
          >
            <option value="">Fornecedor</option>

            {fornecedores.map((fornecedor) => (
              <option key={fornecedor.id} value={fornecedor.id}>
                {fornecedor.razao_social}
              </option>
            ))}
          </select>

          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="border border-slate-300 p-3 rounded-xl text-slate-900 bg-white"
          >
            <option value="">Categoria</option>

            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>

          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição"
            className="border border-slate-300 p-3 rounded-xl text-slate-900"
          />

          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Valor"
            className="border border-slate-300 p-3 rounded-xl text-slate-900"
          />

          <input
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            className="border border-slate-300 p-3 rounded-xl text-slate-900"
          />

          <input
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observação"
            className="border border-slate-300 p-3 rounded-xl text-slate-900"
          />
        </div>

        <button
          onClick={salvarConta}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold"
        >
          Salvar Conta
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-black text-slate-900">
            Contas Cadastradas
          </h2>

          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="border border-slate-300 p-3 rounded-xl text-slate-900 bg-white"
          >
            <option value="todos">Todos</option>
            <option value="aberto">Abertos</option>
            <option value="pago">Pagos</option>
            <option value="vencido">Vencidos</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="p-3 text-left">Fornecedor</th>
                <th className="p-3 text-left">Categoria</th>
                <th className="p-3 text-left">Descrição</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3 text-left">Vencimento</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>

            <tbody>
              {contasFiltradas().map((conta) => {
                const status = statusVisual(conta);

                return (
                  <tr key={conta.id} className="border-b hover:bg-blue-50/40">
                    <td className="p-3 text-slate-800">
                      {nomeFornecedor(conta.fornecedor_id)}
                    </td>

                    <td className="p-3 text-slate-800">
                      {nomeCategoria(conta.categoria_id)}
                    </td>

                    <td className="p-3 text-slate-800 font-medium">
                      {conta.descricao}
                    </td>

                    <td className="p-3 text-right text-slate-900 font-bold">
                      {moeda(Number(conta.valor || 0))}
                    </td>

                    <td className="p-3 text-slate-800">
                      {formatarData(conta.vencimento)}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${status.classe}`}
                      >
                        {status.texto}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        {conta.status !== "pago" &&
                          conta.status !== "cancelado" && (
                            <button
                              onClick={() => marcarComoPago(conta)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
                            >
                              Pagar
                            </button>
                          )}

                        {conta.status !== "cancelado" && (
                          <button
                            onClick={() => cancelarConta(conta)}
                            className="bg-slate-500 hover:bg-slate-600 text-white px-3 py-2 rounded-xl text-sm font-semibold"
                          >
                            Cancelar
                          </button>
                        )}

                        <button
                          onClick={() => excluirConta(conta)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {contasFiltradas().length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    Nenhuma conta encontrada para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
