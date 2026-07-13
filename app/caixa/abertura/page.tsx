"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { formatarData, formatarMoeda } from "../../../components/global/THFormat";

type Caixa = {
  id: string;
  empresa_id: string | null;
  usuario: string | null;
  valor_abertura: number;
  valor_fechamento: number | null;
  status: string | null;
  data_abertura: string | null;
  data_fechamento: string | null;
  observacao: string | null;
};

export default function AberturaCaixaPage() {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [caixaAberto, setCaixaAberto] = useState<Caixa | null>(null);

  const [usuario, setUsuario] = useState("Admin");
  const [valorAbertura, setValorAbertura] = useState("0,00");
  const [observacao, setObservacao] = useState("");

  function converterNumero(valor: string) {
    return Number(String(valor || "0").replace(",", "."));
  }

  async function carregarDados() {
    const empresaReq = await supabase
      .from("empresas")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (!empresaReq.error && empresaReq.data) {
      setEmpresaId(empresaReq.data.id);
    }

    const caixaAbertoReq = await supabase
      .from("caixas")
      .select("*")
      .eq("status", "aberto")
      .order("data_abertura", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (caixaAbertoReq.error) {
      alert("Erro ao verificar caixa aberto: " + caixaAbertoReq.error.message);
      return;
    }

    setCaixaAberto(caixaAbertoReq.data || null);

    const caixasReq = await supabase
      .from("caixas")
      .select("*")
      .order("data_abertura", { ascending: false })
      .limit(20);

    if (caixasReq.error) {
      alert("Erro ao carregar caixas: " + caixasReq.error.message);
      return;
    }

    setCaixas(caixasReq.data || []);
  }

  async function abrirCaixa() {
    if (caixaAberto) {
      alert("Já existe um caixa aberto.");
      return;
    }

    if (!usuario) {
      alert("Informe o operador.");
      return;
    }

    const valor = converterNumero(valorAbertura);

    if (isNaN(valor) || valor < 0) {
      alert("Valor de abertura inválido.");
      return;
    }

    const { error } = await supabase.from("caixas").insert([
      {
        empresa_id: empresaId,
        usuario,
        valor_abertura: valor,
        valor_fechamento: null,
        status: "aberto",
        data_abertura: new Date().toISOString(),
        data_fechamento: null,
        observacao,
      },
    ]);

    if (error) {
      alert("Erro ao abrir caixa: " + error.message);
      return;
    }

    alert("Caixa aberto com sucesso!");

    setValorAbertura("0,00");
    setObservacao("");

    carregarDados();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Abertura de Caixa
          </h1>
          <p className="text-slate-600 mt-1">
            Controle de abertura do caixa diário
          </p>
        </div>

        <div className="w-24 h-16 bg-slate-900 rounded-xl flex items-center justify-center">
          <img
            src="/logo-thcloud.jpeg"
            alt="THCloud"
            className="max-h-14 max-w-20 object-contain"
          />
        </div>
      </div>

      {caixaAberto && (
        <div className="bg-green-100 border border-green-300 text-green-800 rounded-xl p-5 mb-8">
          <h2 className="text-xl font-bold mb-2">Caixa Aberto</h2>
          <p>
            Operador: <strong>{caixaAberto.usuario || "-"}</strong>
          </p>
          <p>
            Valor de abertura:{" "}
            <strong>{formatarMoeda(Number(caixaAberto.valor_abertura))}</strong>
          </p>
          <p>
            Aberto em: <strong>{formatarData(caixaAberto.data_abertura)}</strong>
          </p>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Novo Caixa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="Operador"
            className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium"
            disabled={!!caixaAberto}
          />

          <input
            value={valorAbertura}
            onChange={(e) => setValorAbertura(e.target.value)}
            placeholder="Valor de Abertura"
            className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium"
            disabled={!!caixaAberto}
          />

          <input
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observação"
            className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium"
            disabled={!!caixaAberto}
          />
        </div>

        <button
          onClick={abrirCaixa}
          disabled={!!caixaAberto}
          className={`mt-6 px-6 py-3 rounded-lg font-semibold text-white ${
            caixaAberto
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          Abrir Caixa
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Histórico de Caixas
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-3 text-left">Operador</th>
                <th className="p-3 text-left">Abertura</th>
                <th className="p-3 text-left">Fechamento</th>
                <th className="p-3 text-left">Valor Inicial</th>
                <th className="p-3 text-left">Valor Final</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {caixas.map((caixa) => (
                <tr key={caixa.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 text-slate-900 font-medium">
                    {caixa.usuario || "-"}
                  </td>

                  <td className="p-3 text-slate-800">
                    {formatarData(caixa.data_abertura)}
                  </td>

                  <td className="p-3 text-slate-800">
                    {formatarData(caixa.data_fechamento)}
                  </td>

                  <td className="p-3 text-slate-800 font-semibold">
                    {formatarMoeda(Number(caixa.valor_abertura || 0))}
                  </td>

                  <td className="p-3 text-slate-800 font-semibold">
                    {caixa.valor_fechamento === null
                      ? "-"
                      : formatarMoeda(Number(caixa.valor_fechamento || 0))}
                  </td>

                  <td className="p-3">
                    {caixa.status === "aberto" ? (
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                        Aberto
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-700 font-semibold text-sm">
                        Fechado
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {caixas.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-700">
                    Nenhum caixa encontrado.
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