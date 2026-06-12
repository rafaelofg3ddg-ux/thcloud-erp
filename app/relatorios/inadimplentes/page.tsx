"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { gerarPDFPadrao } from "../../../lib/relatoriopdf";

type Cliente = {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  email: string | null;
};

type ContaReceber = {
  id: string;
  empresa_id: string | null;
  cliente_id: string | null;
  descricao: string;
  valor: number | null;
  vencimento: string | null;
  status: string | null;
};

type Inadimplente = {
  id: string;
  cliente: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  descricao: string;
  valor: number;
  vencimento: string;
  dias_atraso: number;
  faixa: string;
  status: string;
};

type RankingCliente = {
  cliente: string;
  valor: number;
  quantidade: number;
};

export default function RelatorioInadimplentesPage() {
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [filtroFaixa, setFiltroFaixa] = useState("todos");

  const [empresaNome, setEmpresaNome] = useState("Empresa");
  const [usuarioNome, setUsuarioNome] = useState("Administrador");

  const [inadimplentes, setInadimplentes] = useState<Inadimplente[]>([]);
  const [ranking, setRanking] = useState<RankingCliente[]>([]);

  const [totalVencido, setTotalVencido] = useState(0);
  const [totalAberto, setTotalAberto] = useState(0);
  const [quantidadeVencida, setQuantidadeVencida] = useState(0);
  const [quantidadeAberta, setQuantidadeAberta] = useState(0);
  const [maiorAtraso, setMaiorAtraso] = useState(0);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function numero(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR");
  }

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  function primeiroDiaAnoISO() {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), 0, 1).toISOString().split("T")[0];
  }

  function formatarDataBR(data: string | null) {
    if (!data) return "-";
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  function prepararDatas() {
    const inicio = dataInicial || primeiroDiaAnoISO();
    const fim = dataFinal || hojeISO();
    return { inicio, fim };
  }

  function calcularDiasAtraso(vencimento: string | null) {
    if (!vencimento) return 0;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataVencimento = new Date(vencimento + "T00:00:00");
    dataVencimento.setHours(0, 0, 0, 0);

    const diferenca = hoje.getTime() - dataVencimento.getTime();
    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));

    return dias > 0 ? dias : 0;
  }

  function faixaAtraso(dias: number) {
    if (dias <= 0) return "Não vencido";
    if (dias <= 7) return "Até 7 dias";
    if (dias <= 15) return "8 a 15 dias";
    if (dias <= 30) return "16 a 30 dias";
    if (dias <= 60) return "31 a 60 dias";
    if (dias <= 90) return "61 a 90 dias";
    return "Acima de 90 dias";
  }

  function faixaClasse(faixa: string) {
    if (faixa === "Até 7 dias") return "bg-orange-100 text-orange-700";
    if (faixa === "8 a 15 dias") return "bg-orange-100 text-orange-800";
    if (faixa === "16 a 30 dias") return "bg-red-100 text-red-700";
    if (faixa === "31 a 60 dias") return "bg-red-100 text-red-800";
    if (faixa === "61 a 90 dias") return "bg-purple-100 text-purple-700";
    if (faixa === "Acima de 90 dias") return "bg-slate-900 text-white";
    return "bg-slate-100 text-slate-700";
  }

  function nomeCliente(clienteId: string | null, clientes: Cliente[]) {
    if (!clienteId) return "Cliente não informado";

    const cliente = clientes.find((item) => item.id === clienteId);

    return cliente?.nome || "Cliente não encontrado";
  }

  function clienteInfo(clienteId: string | null, clientes: Cliente[]) {
    const cliente = clientes.find((item) => item.id === clienteId);

    return {
      cpf_cnpj: cliente?.cpf_cnpj || "-",
      telefone: cliente?.telefone || "-",
      email: cliente?.email || "-",
    };
  }

  function statusEmAberto(status: string | null) {
    const texto = String(status || "").toLowerCase();
    return texto !== "pago" && texto !== "recebido" && texto !== "cancelado";
  }

  function gerarRanking(lista: Inadimplente[]) {
    const mapa = new Map<string, { valor: number; quantidade: number }>();

    lista.forEach((item) => {
      const atual = mapa.get(item.cliente) || {
        valor: 0,
        quantidade: 0,
      };

      atual.valor += Number(item.valor || 0);
      atual.quantidade += 1;

      mapa.set(item.cliente, atual);
    });

    const dados = Array.from(mapa.entries()).map(([cliente, valores]) => ({
      cliente,
      valor: valores.valor,
      quantidade: valores.quantidade,
    }));

    dados.sort((a, b) => b.valor - a.valor);

    setRanking(dados.slice(0, 10));
  }

  function zerarResumo() {
    setInadimplentes([]);
    setRanking([]);
    setTotalVencido(0);
    setTotalAberto(0);
    setQuantidadeVencida(0);
    setQuantidadeAberta(0);
    setMaiorAtraso(0);
  }

  async function carregarRelatorio() {
    const usuario = JSON.parse(localStorage.getItem("th_usuario") || "{}");
    const empresaId = usuario.empresa_id;

    setEmpresaNome(usuario.empresa_nome || "Empresa");
    setUsuarioNome(usuario.nome || "Administrador");

    const { inicio, fim } = prepararDatas();

    if (!dataInicial) setDataInicial(inicio);
    if (!dataFinal) setDataFinal(fim);

    if (!empresaId) {
      zerarResumo();
      return;
    }

    const clientesReq = await supabase
      .from("clientes")
      .select("id,nome,cpf_cnpj,telefone,email")
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    if (clientesReq.error) {
      alert("Erro ao carregar clientes: " + clientesReq.error.message);
      return;
    }

    const clientes: Cliente[] = clientesReq.data || [];

    const contasReq = await supabase
      .from("contas_receber")
      .select("id,empresa_id,cliente_id,descricao,valor,vencimento,status")
      .eq("empresa_id", empresaId)
      .gte("vencimento", inicio)
      .lte("vencimento", fim)
      .order("vencimento", { ascending: true });

    if (contasReq.error) {
      alert("Erro ao carregar contas a receber: " + contasReq.error.message);
      return;
    }

    const contas: ContaReceber[] = contasReq.data || [];
    const abertas = contas.filter((conta) => statusEmAberto(conta.status));

    const vencidas = abertas
      .map((conta) => {
        const dias = calcularDiasAtraso(conta.vencimento);
        const faixa = faixaAtraso(dias);
        const info = clienteInfo(conta.cliente_id, clientes);

        return {
          id: conta.id,
          cliente: nomeCliente(conta.cliente_id, clientes),
          cpf_cnpj: info.cpf_cnpj,
          telefone: info.telefone,
          email: info.email,
          descricao: conta.descricao || "Conta a receber",
          valor: Number(conta.valor || 0),
          vencimento: conta.vencimento || "",
          dias_atraso: dias,
          faixa,
          status: conta.status || "aberto",
        };
      })
      .filter((conta) => conta.dias_atraso > 0)
      .filter((conta) => {
        if (filtroFaixa === "todos") return true;
        return conta.faixa === filtroFaixa;
      });

    setInadimplentes(vencidas);

    setTotalVencido(
      vencidas.reduce((total, conta) => total + Number(conta.valor || 0), 0)
    );

    setQuantidadeVencida(vencidas.length);

    setMaiorAtraso(
      vencidas.reduce(
        (maior, conta) =>
          conta.dias_atraso > maior ? conta.dias_atraso : maior,
        0
      )
    );

    setTotalAberto(
      abertas.reduce((total, conta) => total + Number(conta.valor || 0), 0)
    );

    setQuantidadeAberta(abertas.length);

    gerarRanking(vencidas);
  }

  async function imprimirPdf() {
    await gerarPDFPadrao(
      "CLIENTES INADIMPLENTES",
      ["Cliente", "CPF/CNPJ", "Telefone", "Descrição", "Vencimento", "Dias", "Faixa", "Valor"],
      inadimplentes.map((item) => [
        item.cliente,
        item.cpf_cnpj,
        item.telefone,
        item.descricao,
        formatarDataBR(item.vencimento),
        numero(item.dias_atraso),
        item.faixa,
        moeda(item.valor),
      ])
    );
  }

  useEffect(() => {
    setDataInicial(primeiroDiaAnoISO());
    setDataFinal(hojeISO());
  }, []);

  useEffect(() => {
    if (dataInicial && dataFinal) {
      carregarRelatorio();
    }
  }, [dataInicial, dataFinal, filtroFaixa]);

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
            Clientes Inadimplentes
          </h1>

          <p className="text-slate-500">
            Relatório de contas vencidas, dias em atraso e maiores devedores.
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
        <h2 className="text-xl font-black text-slate-900 mb-4">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Vencimento Inicial
            </label>

            <input
              type="date"
              value={dataInicial}
              onChange={(e) => setDataInicial(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Vencimento Final
            </label>

            <input
              type="date"
              value={dataFinal}
              onChange={(e) => setDataFinal(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              Faixa de atraso
            </label>

            <select
              value={filtroFaixa}
              onChange={(e) => setFiltroFaixa(e.target.value)}
              className="w-full border border-slate-300 p-3 rounded-xl text-slate-900 bg-white"
            >
              <option value="todos">Todas</option>
              <option value="Até 7 dias">Até 7 dias</option>
              <option value="8 a 15 dias">8 a 15 dias</option>
              <option value="16 a 30 dias">16 a 30 dias</option>
              <option value="31 a 60 dias">31 a 60 dias</option>
              <option value="61 a 90 dias">61 a 90 dias</option>
              <option value="Acima de 90 dias">Acima de 90 dias</option>
            </select>
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
                <h2 className="text-2xl font-black text-blue-800">THCloud</h2>
                <p className="text-sm text-slate-500 font-semibold">
                  ERP Inteligente
                </p>
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                CLIENTES INADIMPLENTES
              </h1>

              <p className="text-sm text-slate-500 font-semibold mt-1">
                Relatório Financeiro
              </p>
            </div>

            <div className="text-right text-xs text-slate-600">
              <p>
                <strong>Vencimento:</strong> {formatarDataBR(dataInicial)} até{" "}
                {formatarDataBR(dataFinal)}
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
                  <LinhaInfo titulo="Relatório" valor="Clientes Inadimplentes" />
                  <LinhaInfo
                    titulo="Período"
                    valor={`${formatarDataBR(dataInicial)} até ${formatarDataBR(
                      dataFinal
                    )}`}
                  />
                  <LinhaInfo
                    titulo="Faixa"
                    valor={filtroFaixa === "todos" ? "Todas" : filtroFaixa}
                  />
                  <LinhaInfo titulo="Registros" valor={`${quantidadeVencida}`} />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-8 pb-6 no-print">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ResumoCard
              titulo="Total Vencido"
              valor={moeda(totalVencido)}
              cor="text-red-700"
            />
            <ResumoCard
              titulo="Contas Vencidas"
              valor={`${quantidadeVencida}`}
              cor="text-orange-700"
            />
            <ResumoCard
              titulo="Maior Atraso"
              valor={`${maiorAtraso} dia(s)`}
              cor="text-purple-700"
            />
            <ResumoCard
              titulo="Total em Aberto"
              valor={moeda(totalAberto)}
              cor="text-blue-700"
            />
          </div>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Resumo Financeiro
          </h2>

          <table className="w-full border border-slate-300 text-sm">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">DESCRIÇÃO</th>
                <th className="p-3 text-right w-52">TOTAL</th>
              </tr>
            </thead>

            <tbody>
              <LinhaResumo
                titulo="TOTAL VENCIDO"
                detalhe="Contas abertas com vencimento anterior à data atual"
                valor={moeda(totalVencido)}
                cor="text-red-700"
              />
              <LinhaResumo
                titulo="QUANTIDADE VENCIDA"
                detalhe="Número de títulos em atraso"
                valor={`${quantidadeVencida}`}
                cor="text-orange-700"
              />
              <LinhaResumo
                titulo="MAIOR ATRASO"
                detalhe="Maior quantidade de dias vencidos"
                valor={`${maiorAtraso} dia(s)`}
                cor="text-purple-700"
              />
              <LinhaResumo
                titulo="TOTAL EM ABERTO"
                detalhe="Todas as contas ainda não pagas no período"
                valor={moeda(totalAberto)}
                cor="text-blue-700"
              />
              <LinhaResumo
                titulo="CONTAS EM ABERTO"
                detalhe="Quantidade total de contas abertas no período"
                valor={`${quantidadeAberta}`}
                cor="text-blue-950"
              />
            </tbody>
          </table>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Ranking dos Maiores Devedores
          </h2>

          <table className="w-full border border-slate-300 text-xs">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">CLIENTE</th>
                <th className="p-3 text-right">TÍTULOS</th>
                <th className="p-3 text-right">VALOR VENCIDO</th>
              </tr>
            </thead>

            <tbody>
              {ranking.map((item, index) => (
                <tr
                  key={`${item.cliente}-${index}`}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50"
                  } border-b border-slate-200`}
                >
                  <td className="p-3 text-slate-900 font-semibold">
                    {index + 1}º {item.cliente}
                  </td>

                  <td className="p-3 text-right text-slate-700 font-bold">
                    {numero(item.quantidade)}
                  </td>

                  <td className="p-3 text-right font-black text-red-700">
                    {moeda(item.valor)}
                  </td>
                </tr>
              ))}

              {ranking.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-slate-500">
                    Nenhum cliente inadimplente encontrado para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 pb-6 quebra-pagina">
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Títulos Vencidos
          </h2>

          <table className="w-full border border-slate-300 text-xs">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="p-3 text-left">CLIENTE</th>
                <th className="p-3 text-left">DESCRIÇÃO</th>
                <th className="p-3 text-left">VENCIMENTO</th>
                <th className="p-3 text-right">DIAS</th>
                <th className="p-3 text-left">FAIXA</th>
                <th className="p-3 text-right">VALOR</th>
              </tr>
            </thead>

            <tbody>
              {inadimplentes.map((item, index) => (
                <tr
                  key={item.id}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50"
                  } border-b border-slate-200`}
                >
                  <td className="p-3">
                    <p className="font-semibold text-slate-900">
                      {item.cliente}
                    </p>
                    <p className="text-slate-500">Doc: {item.cpf_cnpj}</p>
                    <p className="text-slate-500">Tel: {item.telefone}</p>
                  </td>

                  <td className="p-3 text-slate-700">{item.descricao}</td>

                  <td className="p-3 text-slate-700">
                    {formatarDataBR(item.vencimento)}
                  </td>

                  <td className="p-3 text-right font-black text-red-700">
                    {numero(item.dias_atraso)}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${faixaClasse(
                        item.faixa
                      )}`}
                    >
                      {item.faixa}
                    </span>
                  </td>

                  <td className="p-3 text-right font-black text-blue-950">
                    {moeda(item.valor)}
                  </td>
                </tr>
              ))}

              {inadimplentes.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Nenhum título vencido encontrado no período selecionado para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>

            {inadimplentes.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t border-slate-300">
                  <td
                    colSpan={5}
                    className="p-3 text-right font-black text-slate-900"
                  >
                    TOTAL VENCIDO
                  </td>

                  <td className="p-3 text-right font-black text-red-700">
                    {moeda(totalVencido)}
                  </td>
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
                Relatório gerado automaticamente pelo THCloud ERP. São considerados
                inadimplentes os títulos da empresa logada com status em aberto e
                vencimento anterior à data atual.
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

      <td className={`p-4 text-right font-black ${cor}`}>{valor}</td>
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
