"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";
import { formatarData, formatarMoeda } from "../../../components/global/THFormat";

type Cliente = {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  whatsapp: string | null;
};

type Produto = {
  id: string;
  codigo: string | null;
  codigo_barras: string | null;
  nome: string;
};

type Venda = {
  id: string;
  empresa_id: string;
  cliente_id: string | null;
  caixa_id: string | null;
  numero_venda: number | null;
  valor_total: number;
  desconto: number | null;
  forma_pagamento: string | null;
  status: string | null;
  created_at: string | null;
};

type ItemVenda = {
  id: string;
  venda_id: string;
  produto_id: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
  produto_nome?: string;
  produto_codigo?: string | null;
  produto_barras?: string | null;
};

type PagamentoVenda = {
  id: string;
  venda_id: string;
  forma_pagamento: string;
  valor: number;
};

type VendaDetalhada = Venda & {
  cliente_nome: string;
  cliente_cpf: string;
  cliente_telefone: string;
  itens: ItemVenda[];
  pagamentos: PagamentoVenda[];
};

export default function ConsultaVendasPage() {
  const [vendas, setVendas] = useState<VendaDetalhada[]>([]);
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [status, setStatus] = useState("");
  const [vendaAberta, setVendaAberta] = useState<VendaDetalhada | null>(null);
  const [carregando, setCarregando] = useState(false);

  function empresaAtualId() {
    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }

    return empresaId;
  }

  function formatarNumeroVenda(numero: number | null | undefined) {
    if (!numero) return "-";
    return String(numero).padStart(6, "0");
  }

  async function carregarVendas() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setCarregando(true);

    let query = supabase
      .from("vendas")
      .select("id,empresa_id,cliente_id,caixa_id,numero_venda,valor_total,desconto,forma_pagamento,status,created_at")
      .eq("empresa_id", empresaId)
      .order("numero_venda", { ascending: false })
      .limit(200);

    if (dataInicio) query = query.gte("created_at", `${dataInicio}T00:00:00`);
    if (dataFim) query = query.lte("created_at", `${dataFim}T23:59:59`);
    if (formaPagamento) query = query.eq("forma_pagamento", formaPagamento);
    if (status) query = query.eq("status", status);

    const vendasReq = await query;

    if (vendasReq.error) {
      alert("Erro ao carregar vendas: " + vendasReq.error.message);
      setCarregando(false);
      return;
    }

    const vendasBase = vendasReq.data || [];

    if (vendasBase.length === 0) {
      setVendas([]);
      setCarregando(false);
      return;
    }

    const vendaIds = vendasBase.map((venda) => venda.id);
    const clienteIds = Array.from(
      new Set(vendasBase.map((venda) => venda.cliente_id).filter(Boolean))
    ) as string[];

    let clientes: Cliente[] = [];

    if (clienteIds.length > 0) {
      const clientesReq = await supabase
        .from("clientes")
        .select("id,nome,cpf_cnpj,telefone,whatsapp")
        .eq("empresa_id", empresaId)
        .in("id", clienteIds);

      if (!clientesReq.error) clientes = clientesReq.data || [];
    }

    const itensReq = await supabase
      .from("itens_venda")
      .select("id,venda_id,produto_id,quantidade,valor_unitario,subtotal,empresa_id")
      .eq("empresa_id", empresaId)
      .in("venda_id", vendaIds);

    if (itensReq.error) {
      alert("Erro ao carregar itens das vendas: " + itensReq.error.message);
      setCarregando(false);
      return;
    }

    const itensBase = itensReq.data || [];
    const produtoIds = Array.from(
      new Set(itensBase.map((item) => item.produto_id).filter(Boolean))
    ) as string[];

    let produtos: Produto[] = [];

    if (produtoIds.length > 0) {
      const produtosReq = await supabase
        .from("produtos")
        .select("id,codigo,codigo_barras,nome")
        .eq("empresa_id", empresaId)
        .in("id", produtoIds);

      if (!produtosReq.error) produtos = produtosReq.data || [];
    }

    const pagamentosReq = await supabase
      .from("pagamentos_venda")
      .select("id,venda_id,forma_pagamento,valor,empresa_id")
      .eq("empresa_id", empresaId)
      .in("venda_id", vendaIds);

    const pagamentos = pagamentosReq.error ? [] : pagamentosReq.data || [];

    const vendasMontadas: VendaDetalhada[] = vendasBase.map((venda: any) => {
      const cliente = clientes.find((item) => item.id === venda.cliente_id);

      const itens = itensBase
        .filter((item: any) => item.venda_id === venda.id)
        .map((item: any) => {
          const produto = produtos.find((prod) => prod.id === item.produto_id);

          return {
            id: item.id,
            venda_id: item.venda_id,
            produto_id: item.produto_id,
            quantidade: Number(item.quantidade || 0),
            valor_unitario: Number(item.valor_unitario || 0),
            subtotal: Number(item.subtotal || 0),
            produto_nome: produto?.nome || "Produto",
            produto_codigo: produto?.codigo || "-",
            produto_barras: produto?.codigo_barras || "-",
          };
        });

      return {
        id: venda.id,
        empresa_id: venda.empresa_id,
        cliente_id: venda.cliente_id,
        caixa_id: venda.caixa_id,
        numero_venda: Number(venda.numero_venda || 0),
        valor_total: Number(venda.valor_total || 0),
        desconto: Number(venda.desconto || 0),
        forma_pagamento: venda.forma_pagamento,
        status: venda.status,
        created_at: venda.created_at,
        cliente_nome: cliente?.nome || "Consumidor Final",
        cliente_cpf: cliente?.cpf_cnpj || "",
        cliente_telefone: cliente?.whatsapp || cliente?.telefone || "",
        itens,
        pagamentos: pagamentos.filter((pag: any) => pag.venda_id === venda.id),
      };
    });

    setVendas(vendasMontadas);
    setCarregando(false);
  }

  function montarCupomConsulta(venda: VendaDetalhada) {
    const linhasItens = venda.itens
      .map(
        (item) => `
          <tr>
            <td>${item.quantidade}x ${item.produto_nome}</td>
            <td style="text-align:right;">${formatarMoeda(item.subtotal)}</td>
          </tr>
        `
      )
      .join("");

    const pagamentos = venda.pagamentos
      .map(
        (pag) => `
          <tr>
            <td>${pag.forma_pagamento}</td>
            <td style="text-align:right;">${formatarMoeda(Number(pag.valor || 0))}</td>
          </tr>
        `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Venda ${formatarNumeroVenda(venda.numero_venda)}</title>
          <style>
            body { font-family: Arial, sans-serif; width: 300px; margin: 0 auto; color: #111827; font-size: 12px; }
            .center { text-align: center; }
            h1 { font-size: 17px; margin: 4px 0; }
            p { margin: 3px 0; }
            hr { border: none; border-top: 1px dashed #111827; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 3px 0; vertical-align: top; }
            .total { font-size: 17px; font-weight: bold; }
            @media print { body { width: 80mm; } button { display:none; } tr { page-break-inside: avoid; break-inside: avoid; } }
          </style>
        </head>
        <body>
          <div class="center">
            <h1>Th Cloud</h1>
            <p>Cupom Não Fiscal - Reimpressão</p>
          </div>
          <hr />
          <p><strong>Nº Venda:</strong> ${formatarNumeroVenda(venda.numero_venda)}</p>
          <p><strong>ID Interno:</strong> ${venda.id}</p>
          <p><strong>Data:</strong> ${formatarData(venda.created_at)}</p>
          <p><strong>Cliente:</strong> ${venda.cliente_nome}</p>
          <p><strong>Status:</strong> ${venda.status || "-"}</p>
          <hr />
          <table><tbody>${linhasItens}</tbody></table>
          <hr />
          <table>
            <tbody>
              <tr class="total">
                <td>TOTAL</td>
                <td style="text-align:right;">${formatarMoeda(venda.valor_total)}</td>
              </tr>
            </tbody>
          </table>
          <hr />
          <p><strong>Pagamentos</strong></p>
          <table><tbody>${pagamentos || "<tr><td>-</td></tr>"}</tbody></table>
          <hr />
          <p class="center">Obrigado pela preferência!</p>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `;
  }

  function reimprimirCupom(venda: VendaDetalhada) {
    const janela = window.open("", "_blank", "width=420,height=700");

    if (!janela) {
      alert("O navegador bloqueou a janela de impressão. Libere pop-ups.");
      return;
    }

    janela.document.open();
    janela.document.write(montarCupomConsulta(venda));
    janela.document.close();
  }

  const vendasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return vendas.filter((venda) => {
      if (!termo) return true;

      const itensTexto = venda.itens
        .map((item) => `${item.produto_nome} ${item.produto_codigo} ${item.produto_barras}`)
        .join(" ")
        .toLowerCase();

      return (
        formatarNumeroVenda(venda.numero_venda).includes(termo) ||
        venda.id.toLowerCase().includes(termo) ||
        venda.cliente_nome.toLowerCase().includes(termo) ||
        venda.cliente_cpf.toLowerCase().includes(termo) ||
        venda.cliente_telefone.toLowerCase().includes(termo) ||
        String(venda.status || "").toLowerCase().includes(termo) ||
        itensTexto.includes(termo)
      );
    });
  }, [vendas, busca]);

  const totalVendido = vendasFiltradas.reduce(
    (total, venda) => total + Number(venda.valor_total || 0),
    0
  );

  const ticketMedio =
    vendasFiltradas.length > 0 ? totalVendido / vendasFiltradas.length : 0;

  const clientesAtendidos = new Set(
    vendasFiltradas.map((venda) => venda.cliente_id || venda.cliente_nome)
  ).size;

  useEffect(() => {
    carregarVendas();
  }, []);

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-8">
        <p className="text-blue-600 font-bold">Vendas</p>

        <h1 className="text-4xl font-black text-slate-900 mt-2">
          Consulta de Vendas
        </h1>

        <p className="text-slate-500 mt-2">
          Consulte vendas por número, cliente, CPF, produto, data, forma de pagamento e status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <ResumoCard titulo="Vendas Encontradas" valor={`${vendasFiltradas.length}`} cor="text-blue-700" />
        <ResumoCard titulo="Total Vendido" valor={formatarMoeda(totalVendido)} cor="text-green-700" />
        <ResumoCard titulo="Ticket Médio" valor={formatarMoeda(ticketMedio)} cor="text-purple-700" />
        <ResumoCard titulo="Clientes Atendidos" valor={`${clientesAtendidos}`} cor="text-orange-700" />
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-2xl font-black text-slate-900 mb-5">
          Filtros
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nº venda, cliente, CPF, produto..."
            className="md:col-span-2 border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
          />

          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
          />

          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium"
          />

          <select
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
            className="border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium bg-white"
          >
            <option value="">Forma pagamento</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">PIX</option>
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
            <option value="crediario">Crediário</option>
            <option value="misto">Misto</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium bg-white"
          >
            <option value="">Status</option>
            <option value="finalizada">Finalizada</option>
            <option value="devolvida">Devolvida</option>
            <option value="devolucao_parcial">Devolução parcial</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={carregarVendas}
            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-bold"
          >
            {carregando ? "Carregando..." : "Pesquisar"}
          </button>

          <button
            onClick={() => {
              setBusca("");
              setDataInicio("");
              setDataFim("");
              setFormaPagamento("");
              setStatus("");
              setTimeout(() => carregarVendas(), 100);
            }}
            className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-2xl font-bold"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black text-slate-900 mb-5">
          Vendas
        </h2>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3 text-left">Nº Venda</th>
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Cliente</th>
                <th className="p-3 text-left">Itens</th>
                <th className="p-3 text-left">Pagamento</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>

            <tbody>
              {vendasFiltradas.map((venda) => (
                <tr key={venda.id} className="border-b hover:bg-slate-50 align-top">
                  <td className="p-3 font-black text-blue-700">
                    {formatarNumeroVenda(venda.numero_venda)}
                  </td>

                  <td className="p-3 text-slate-700">
                    {formatarData(venda.created_at)}
                  </td>

                  <td className="p-3 text-slate-700">
                    <p className="font-bold text-slate-900">{venda.cliente_nome}</p>
                    <p className="text-xs text-slate-500">
                      {venda.cliente_cpf || venda.cliente_telefone || "-"}
                    </p>
                  </td>

                  <td className="p-3 text-slate-700">
                    {venda.itens.slice(0, 3).map((item) => (
                      <p key={item.id}>
                        {item.quantidade}x {item.produto_nome}
                      </p>
                    ))}
                    {venda.itens.length > 3 && (
                      <p className="text-xs text-slate-500">
                        + {venda.itens.length - 3} item(ns)
                      </p>
                    )}
                  </td>

                  <td className="p-3 text-slate-700">
                    {venda.pagamentos.length > 0
                      ? venda.pagamentos.map((pag) => (
                          <p key={pag.id}>
                            {pag.forma_pagamento}: {formatarMoeda(Number(pag.valor || 0))}
                          </p>
                        ))
                      : venda.forma_pagamento || "-"}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black ${
                        venda.status === "devolvida" ||
                        venda.status === "cancelada" ||
                        venda.status === "devolucao_parcial"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {venda.status || "finalizada"}
                    </span>
                  </td>

                  <td className="p-3 text-right text-green-700 font-black">
                    {formatarMoeda(venda.valor_total)}
                  </td>

                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setVendaAberta(venda)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl font-bold"
                      >
                        Visualizar
                      </button>

                      <button
                        onClick={() => reimprimirCupom(venda)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-xl font-bold"
                      >
                        Reimprimir
                      </button>

                      <Link
                        href="/vendas/devolucoes"
                        className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-xl font-bold"
                      >
                        Devolver
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {vendasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {vendaAberta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  Venda Nº {formatarNumeroVenda(vendaAberta.numero_venda)}
                </h2>
                <p className="text-slate-500">
                  ID interno: {vendaAberta.id}
                </p>
              </div>

              <button
                onClick={() => setVendaAberta(null)}
                className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"
              >
                ✕
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                <h3 className="text-xl font-black text-slate-900 mb-4">
                  Itens da Venda
                </h3>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="p-3 text-left">Produto</th>
                        <th className="p-3 text-right">Qtd</th>
                        <th className="p-3 text-right">Unitário</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>

                    <tbody>
                      {vendaAberta.itens.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-3 text-slate-800">
                            {item.produto_codigo || "-"} - {item.produto_nome}
                          </td>
                          <td className="p-3 text-right text-slate-800">{item.quantidade}</td>
                          <td className="p-3 text-right text-slate-800">{formatarMoeda(item.valor_unitario)}</td>
                          <td className="p-3 text-right text-slate-800 font-bold">{formatarMoeda(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-2xl p-5 h-fit">
                <p className="text-slate-300 font-bold">Resumo</p>
                <p className="text-4xl font-black mt-2">
                  {formatarMoeda(vendaAberta.valor_total)}
                </p>

                <div className="mt-5 space-y-2 text-sm">
                  <p><strong>Cliente:</strong> {vendaAberta.cliente_nome}</p>
                  <p><strong>Data:</strong> {formatarData(vendaAberta.created_at)}</p>
                  <p><strong>Status:</strong> {vendaAberta.status || "-"}</p>
                  <p><strong>Forma:</strong> {vendaAberta.forma_pagamento || "-"}</p>
                  <p><strong>Desconto:</strong> {formatarMoeda(Number(vendaAberta.desconto || 0))}</p>
                </div>

                <button
                  onClick={() => reimprimirCupom(vendaAberta)}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black"
                >
                  Reimprimir Cupom
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <p className="text-sm text-slate-500 font-bold">{titulo}</p>
      <p className={`text-3xl font-black mt-2 ${cor}`}>{valor}</p>
    </div>
  );
}
