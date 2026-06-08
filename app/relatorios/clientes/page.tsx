"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Cliente = {
  id: string;
  empresa_id: string | null;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  limite_credito: number | null;
  created_at: string | null;
};

export default function RelatorioClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");

  const [empresaNome, setEmpresaNome] = useState("Empresa");
  const [usuarioNome, setUsuarioNome] = useState("Administrador");

  const [totalClientes, setTotalClientes] = useState(0);
  const [clientesComTelefone, setClientesComTelefone] = useState(0);
  const [clientesComEmail, setClientesComEmail] = useState(0);
  const [clientesComDocumento, setClientesComDocumento] = useState(0);
  const [limiteCreditoTotal, setLimiteCreditoTotal] = useState(0);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function formatarTexto(valor: string | null) {
    if (!valor || String(valor).trim() === "") return "-";
    return valor;
  }

  function zerarResumo() {
    setClientes([]);
    setTotalClientes(0);
    setClientesComTelefone(0);
    setClientesComEmail(0);
    setClientesComDocumento(0);
    setLimiteCreditoTotal(0);
  }

  async function carregarRelatorio() {
    const usuario = JSON.parse(localStorage.getItem("th_usuario") || "{}");
    const empresaId = usuario.empresa_id;

    setEmpresaNome(usuario.empresa_nome || "Empresa");
    setUsuarioNome(usuario.nome || "Administrador");

    if (!empresaId) {
      zerarResumo();
      return;
    }

    let consulta = supabase
      .from("clientes")
      .select(
        "id,empresa_id,nome,cpf_cnpj,telefone,email,endereco,limite_credito,created_at"
      )
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    if (busca.trim() !== "") {
      consulta = consulta.ilike("nome", `%${busca.trim()}%`);
    }

    const { data, error } = await consulta;

    if (error) {
      alert("Erro ao carregar clientes: " + error.message);
      return;
    }

    const lista: Cliente[] = data || [];

    setClientes(lista);
    setTotalClientes(lista.length);

    setClientesComTelefone(
      lista.filter((cliente) => String(cliente.telefone || "").trim() !== "")
        .length
    );

    setClientesComEmail(
      lista.filter((cliente) => String(cliente.email || "").trim() !== "")
        .length
    );

    setClientesComDocumento(
      lista.filter((cliente) => String(cliente.cpf_cnpj || "").trim() !== "")
        .length
    );

    setLimiteCreditoTotal(
      lista.reduce(
        (total, cliente) => total + Number(cliente.limite_credito || 0),
        0
      )
    );
  }

  function imprimirPdf() {
    window.print();
  }

  useEffect(() => {
    carregarRelatorio();
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen p-8 print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            background: white !important;
          }

          aside,
          header,
          .no-print {
            display: none !important;
          }

          main {
            min-height: auto !important;
          }

          .documento-relatorio {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }

          .quebra-pagina {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="no-print max-w-5xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            Relatório de Clientes
          </h1>

          <p className="text-slate-500">
            Relatório profissional de clientes cadastrados no THCloud ERP.
          </p>
        </div>

        <button
          onClick={imprimirPdf}
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-bold shadow-sm"
        >
          Imprimir / Salvar PDF
        </button>
      </div>

      <div className="no-print max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-xl font-black text-slate-900 mb-4">
          Filtros
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Buscar por nome
            </label>

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite o nome do cliente"
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={carregarRelatorio}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-bold"
            >
              Atualizar
            </button>
          </div>
        </div>
      </div>

      <div className="documento-relatorio max-w-5xl mx-auto bg-white border border-slate-200 shadow-lg rounded-2xl overflow-hidden">
        <div className="px-8 pt-8 pb-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b-4 border-blue-700 pb-5">
            <div className="flex items-center gap-4">
              <img
                src="/logo-thcloud-transparente.png"
                alt="THCloud"
                className="h-14 w-14 object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/logo-thcloud.jpeg";
                }}
              />

              <div>
                <h2 className="text-2xl font-black text-blue-800">
                  THCloud
                </h2>

                <p className="text-sm text-slate-500 font-semibold">
                  ERP Inteligente
                </p>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                RELATÓRIO DE CLIENTES
              </h1>

              <p className="text-sm text-slate-500 font-semibold mt-1">
                Relatório Cadastral
              </p>
            </div>

            <div className="text-right text-xs text-slate-600">
              <p>
                <strong>Filtro:</strong>{" "}
                {busca.trim() === "" ? "Todos" : busca}
              </p>

              <p className="mt-1">
                <strong>Emissão:</strong>{" "}
                {new Date().toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 text-blue-800 font-black text-sm border-b border-slate-200">
                DADOS DA EMPRESA
              </div>

              <table className="w-full text-sm">
                <tbody>
                  <LinhaInfo titulo="Empresa" valor={empresaNome} />
                  <LinhaInfo titulo="Sistema" valor="THCloud ERP" />
                  <LinhaInfo titulo="Site" valor="thcloud.com.br" />
                  <LinhaInfo titulo="Responsável" valor={usuarioNome} />
                </tbody>
              </table>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 text-blue-800 font-black text-sm border-b border-slate-200">
                DADOS DO RELATÓRIO
              </div>

              <table className="w-full text-sm">
                <tbody>
                  <LinhaInfo titulo="Relatório" valor="Clientes" />
                  <LinhaInfo
                    titulo="Filtro"
                    valor={busca.trim() === "" ? "Todos" : busca}
                  />
                  <LinhaInfo titulo="Clientes" valor={`${totalClientes}`} />
                  <LinhaInfo
                    titulo="Limite Total"
                    valor={moeda(limiteCreditoTotal)}
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-8 pb-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ResumoCard titulo="Clientes" valor={`${totalClientes}`} cor="text-blue-700" />
            <ResumoCard titulo="Com Telefone" valor={`${clientesComTelefone}`} cor="text-green-700" />
            <ResumoCard titulo="Com E-mail" valor={`${clientesComEmail}`} cor="text-purple-700" />
            <ResumoCard titulo="Com CPF/CNPJ" valor={`${clientesComDocumento}`} cor="text-orange-700" />
          </div>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Resumo do Cadastro
          </h2>

          <table className="w-full border border-slate-300 text-sm">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">DESCRIÇÃO</th>
                <th className="p-3 text-right w-52">TOTAL</th>
              </tr>
            </thead>

            <tbody>
              <LinhaResumo titulo="TOTAL DE CLIENTES" detalhe="Clientes encontrados no filtro" valor={`${totalClientes}`} cor="text-blue-950" />
              <LinhaResumo titulo="CLIENTES COM TELEFONE" detalhe="Clientes que possuem telefone cadastrado" valor={`${clientesComTelefone}`} cor="text-green-700" />
              <LinhaResumo titulo="CLIENTES COM E-MAIL" detalhe="Clientes que possuem e-mail cadastrado" valor={`${clientesComEmail}`} cor="text-purple-700" />
              <LinhaResumo titulo="CLIENTES COM CPF/CNPJ" detalhe="Clientes que possuem documento cadastrado" valor={`${clientesComDocumento}`} cor="text-orange-700" />
              <LinhaResumo titulo="LIMITE DE CRÉDITO TOTAL" detalhe="Soma dos limites de crédito cadastrados" valor={moeda(limiteCreditoTotal)} cor="text-blue-700" />
            </tbody>
          </table>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Clientes Cadastrados
          </h2>

          <table className="w-full border border-slate-300 text-xs">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">NOME</th>
                <th className="p-3 text-left">CPF/CNPJ</th>
                <th className="p-3 text-left">TELEFONE</th>
                <th className="p-3 text-left">E-MAIL</th>
                <th className="p-3 text-right">LIMITE</th>
                <th className="p-3 text-left">CADASTRO</th>
              </tr>
            </thead>

            <tbody>
              {clientes.map((cliente, index) => (
                <tr
                  key={cliente.id}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} border-b border-slate-200`}
                >
                  <td className="p-3 text-slate-900 font-semibold">
                    {cliente.nome}
                  </td>

                  <td className="p-3 text-slate-700">
                    {formatarTexto(cliente.cpf_cnpj)}
                  </td>

                  <td className="p-3 text-slate-700">
                    {formatarTexto(cliente.telefone)}
                  </td>

                  <td className="p-3 text-slate-700">
                    {formatarTexto(cliente.email)}
                  </td>

                  <td className="p-3 text-right font-black text-blue-950">
                    {moeda(Number(cliente.limite_credito || 0))}
                  </td>

                  <td className="p-3 text-slate-700">
                    {formatarData(cliente.created_at)}
                  </td>
                </tr>
              ))}

              {clientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Nenhum cliente encontrado para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>

            {clientes.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t border-slate-300">
                  <td colSpan={4} className="p-3 text-right font-black text-slate-900">
                    LIMITE TOTAL
                  </td>

                  <td className="p-3 text-right font-black text-blue-800">
                    {moeda(limiteCreditoTotal)}
                  </td>

                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="px-8 pb-6">
          <div className="border border-blue-300 rounded-xl p-4 flex gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center font-black text-sm">
              i
            </div>

            <div>
              <p className="font-black text-blue-800">Observação</p>
              <p className="text-sm text-slate-700 mt-1">
                Relatório gerado automaticamente pelo sistema THCloud ERP com base
                nos clientes cadastrados da empresa logada.
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-5 border-t border-slate-300 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-xs text-slate-700">
            <div>
              <p className="font-bold text-slate-900">
                THCloud ERP - Sistema de Gestão Empresarial
              </p>
            </div>

            <div className="text-center">
              <p className="font-bold text-blue-700">www.thcloud.com.br</p>
            </div>

            <div className="text-right">
              <p>Página 1 de 1</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinhaInfo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <tr className="border-b last:border-b-0 border-slate-100">
      <td className="bg-slate-50 p-3 font-bold text-slate-800 w-32">
        {titulo}:
      </td>
      <td className="p-3 text-slate-800 font-medium">{valor}</td>
    </tr>
  );
}

function LinhaResumo({
  titulo,
  detalhe,
  valor,
  cor,
}: {
  titulo: string;
  detalhe: string;
  valor: string;
  cor: string;
}) {
  return (
    <tr className="border-b border-slate-200">
      <td className="p-4">
        <p className="font-black text-slate-900">{titulo}</p>
        <p className="text-xs text-slate-500">{detalhe}</p>
      </td>

      <td className={`p-4 text-right font-black ${cor}`}>
        {valor}
      </td>
    </tr>
  );
}

function ResumoCard({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: string;
  cor: string;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
      <p className="text-sm font-semibold text-slate-600">{titulo}</p>
      <p className={`text-2xl font-black mt-2 ${cor}`}>{valor}</p>
    </div>
  );
}
