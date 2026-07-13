"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { gerarPDFPadrao } from "../../../lib/relatoriopdf";

type ImeiRelatorio = {
  id: string;
  imei: string;
  imei_2: string | null;
  numero_serie: string | null;
  cor: string | null;
  capacidade: string | null;
  status: string;
  data_venda: string | null;
  created_at: string;
  produtos: { nome: string; codigo: string | null } | null;
  clientes: { nome: string } | null;
};

const statusOpcoes = [
  { codigo: "disponivel", nome: "Disponível" },
  { codigo: "reservado", nome: "Reservado" },
  { codigo: "vendido", nome: "Vendido" },
  { codigo: "garantia", nome: "Garantia" },
  { codigo: "assistencia", nome: "Assistência" },
  { codigo: "devolvido", nome: "Devolvido" },
  { codigo: "cancelado", nome: "Cancelado" },
];

export default function RelatorioImeisPage() {
  const [imeis, setImeis] = useState<ImeiRelatorio[]>([]);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [pesquisa, setPesquisa] = useState("");

  const [empresaNome, setEmpresaNome] = useState("Empresa");
  const [usuarioNome, setUsuarioNome] = useState("Administrador");

  function statusNome(codigo: string) {
    return statusOpcoes.find((item) => item.codigo === codigo)?.nome || codigo;
  }

  function statusCor(codigo: string) {
    const mapa: Record<string, string> = {
      disponivel: "text-green-700",
      reservado: "text-yellow-700",
      vendido: "text-blue-700",
      garantia: "text-purple-700",
      assistencia: "text-indigo-700",
      devolvido: "text-slate-500",
      cancelado: "text-red-700",
    };
    return mapa[codigo] || "text-slate-700";
  }

  function dataBR(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  async function carregarRelatorio() {
    const usuario = JSON.parse(localStorage.getItem("th_usuario") || "{}");
    const empresaId = usuario.empresa_id;

    setEmpresaNome(usuario.empresa_nome || "Empresa");
    setUsuarioNome(usuario.nome || "Administrador");

    if (!empresaId) {
      setImeis([]);
      return;
    }

    let consulta = supabase
      .from("produto_imeis")
      .select(
        "id,imei,imei_2,numero_serie,cor,capacidade,status,data_venda,created_at,produtos:produto_id(nome,codigo),clientes:cliente_id(nome)"
      )
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });

    if (filtroStatus !== "todos") consulta = consulta.eq("status", filtroStatus);

    const { data, error } = await consulta;

    if (error) {
      alert("Erro ao carregar IMEIs: " + error.message);
      return;
    }

    setImeis((data || []) as unknown as ImeiRelatorio[]);
  }

  const imeisFiltrados = imeis.filter((item) => {
    const termo = pesquisa.toLowerCase().trim();
    if (!termo) return true;

    const texto = `${item.imei} ${item.imei_2 || ""} ${item.numero_serie || ""} ${item.produtos?.nome || ""} ${item.produtos?.codigo || ""} ${item.clientes?.nome || ""}`.toLowerCase();
    return texto.includes(termo);
  });

  const totalDisponivel = imeis.filter((item) => item.status === "disponivel").length;
  const totalVendido = imeis.filter((item) => item.status === "vendido").length;
  const totalReservado = imeis.filter((item) => item.status === "reservado").length;

  async function imprimirPdf() {
    await gerarPDFPadrao(
      "RELATÓRIO DE IMEI / CELULARES",
      ["Produto", "IMEI", "IMEI 2", "Série", "Cor/Capacidade", "Status", "Cliente", "Data"],
      imeisFiltrados.map((item) => [
        item.produtos?.nome || "-",
        item.imei,
        item.imei_2 || "-",
        item.numero_serie || "-",
        [item.cor, item.capacidade].filter(Boolean).join(" / ") || "-",
        statusNome(item.status),
        item.clientes?.nome || "-",
        dataBR(item.data_venda || item.created_at),
      ])
    );
  }

  useEffect(() => {
    carregarRelatorio();
  }, [filtroStatus]);

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

      <div className="no-print max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Relatório de IMEI / Celulares</h1>
          <p className="text-slate-500">Controle de disponíveis, vendidos e reservados por IMEI/número de série.</p>
        </div>

        <button onClick={imprimirPdf} className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-bold shadow-sm">
          Imprimir / Salvar PDF
        </button>
      </div>

      <div className="no-print max-w-6xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-6">
        <h2 className="text-xl font-black text-slate-900 mb-4">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Status</label>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="w-full border border-slate-300 p-3 rounded-xl text-slate-900 bg-white">
              <option value="todos">Todos</option>
              {statusOpcoes.map((item) => (
                <option key={item.codigo} value={item.codigo}>{item.nome}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-600 mb-2">Buscar (IMEI, produto, cliente...)</label>
            <input value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Digite para buscar..." className="w-full border border-slate-300 p-3 rounded-xl text-slate-900" />
          </div>
        </div>
      </div>

      <div className="documento-relatorio max-w-6xl mx-auto bg-white border border-slate-200 shadow-lg rounded-2xl overflow-hidden">
        <div className="px-8 pt-8 pb-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b-4 border-blue-700 pb-5">
            <div className="flex items-center gap-4">
              <img
                src="/logo-thcloud-transparente.png"
                alt="THCloud"
                className="h-14 w-14 object-contain"
                onError={(e) => { e.currentTarget.src = "/logo-thcloud.jpeg"; }}
              />
              <div>
                <h2 className="text-2xl font-black text-blue-800">THCloud</h2>
                <p className="text-sm text-slate-500 font-semibold">Gestão Inteligente</p>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">RELATÓRIO DE IMEI</h1>
              <p className="text-sm text-slate-500 font-semibold mt-1">Controle de Celulares</p>
            </div>

            <div className="text-right text-xs text-slate-600">
              <p><strong>Filtro:</strong> {filtroStatus === "todos" ? "Todos" : statusNome(filtroStatus)}</p>
              <p className="mt-1"><strong>Emissão:</strong> {new Date().toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </div>

        <div className="px-8 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 text-blue-800 font-black text-sm border-b border-slate-200">DADOS DA EMPRESA</div>
              <table className="w-full text-sm">
                <tbody>
                  <LinhaInfo titulo="Empresa" valor={empresaNome} />
                  <LinhaInfo titulo="Sistema" valor="Th Cloud" />
                  <LinhaInfo titulo="Responsável" valor={usuarioNome} />
                </tbody>
              </table>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 text-blue-800 font-black text-sm border-b border-slate-200">DADOS DO RELATÓRIO</div>
              <table className="w-full text-sm">
                <tbody>
                  <LinhaInfo titulo="Total" valor={`${imeisFiltrados.length} unidade(s)`} />
                  <LinhaInfo titulo="Disponíveis" valor={`${totalDisponivel}`} />
                  <LinhaInfo titulo="Vendidos" valor={`${totalVendido}`} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-8 pb-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ResumoCard titulo="Total" valor={`${imeisFiltrados.length}`} cor="text-slate-800" />
            <ResumoCard titulo="Disponíveis" valor={`${totalDisponivel}`} cor="text-green-700" />
            <ResumoCard titulo="Vendidos" valor={`${totalVendido}`} cor="text-blue-700" />
            <ResumoCard titulo="Reservados" valor={`${totalReservado}`} cor="text-yellow-700" />
          </div>
        </div>

        <div className="px-8 pb-8 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">Unidades cadastradas</h2>

          <table className="w-full border border-slate-300 text-sm">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">PRODUTO</th>
                <th className="p-3 text-left">IMEI</th>
                <th className="p-3 text-left">SÉRIE</th>
                <th className="p-3 text-left">COR/CAPACIDADE</th>
                <th className="p-3 text-left">STATUS</th>
                <th className="p-3 text-left">CLIENTE</th>
                <th className="p-3 text-left">DATA</th>
              </tr>
            </thead>
            <tbody>
              {imeisFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 font-semibold">Nenhum IMEI encontrado para esse filtro.</td>
                </tr>
              ) : (
                imeisFiltrados.map((item) => (
                  <tr key={item.id} className="border-b border-slate-200">
                    <td className="p-3 font-bold text-slate-900">{item.produtos?.codigo ? `${item.produtos.codigo} - ` : ""}{item.produtos?.nome || "-"}</td>
                    <td className="p-3 font-mono">{item.imei}</td>
                    <td className="p-3">{item.numero_serie || "-"}</td>
                    <td className="p-3">{[item.cor, item.capacidade].filter(Boolean).join(" / ") || "-"}</td>
                    <td className={`p-3 font-black ${statusCor(item.status)}`}>{statusNome(item.status)}</td>
                    <td className="p-3">{item.clientes?.nome || "-"}</td>
                    <td className="p-3 text-slate-500">{dataBR(item.data_venda || item.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-5 border-t border-slate-300 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-xs text-slate-700">
            <div><p className="font-bold text-slate-900">Th Cloud - Sistema de Gestão</p></div>
            <div className="text-center"><p className="font-bold text-blue-700">www.thcloud.com.br</p></div>
            <div className="text-right"><p>Página 1 de 1</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinhaInfo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <tr className="border-b last:border-b-0 border-slate-100">
      <td className="bg-slate-50 p-3 font-bold text-slate-800 w-32">{titulo}:</td>
      <td className="p-3 text-slate-800 font-medium">{valor}</td>
    </tr>
  );
}

function ResumoCard({ titulo, valor, cor }: { titulo: string; valor: string; cor: string }) {
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
      <p className="text-sm font-semibold text-slate-600">{titulo}</p>
      <p className={`text-2xl font-black mt-2 ${cor}`}>{valor}</p>
    </div>
  );
}
