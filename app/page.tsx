"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Venda = {
  id: string;
  cliente_id: string | null;
  valor_total: number | null;
  status: string | null;
  forma_pagamento: string | null;
  created_at: string | null;
};

type Cliente = {
  id: string;
  nome: string;
};

type Produto = {
  id: string;
  nome: string;
  codigo: string | null;
  qtd_atual: number | null;
  qtd_minima: number | null;
  preco_custo: number | null;
  preco_venda: number | null;
  ativo: boolean | null;
};

type ContaReceber = {
  id: string;
  valor: number | null;
  vencimento: string | null;
  status: string | null;
};

type ContaPagar = {
  id: string;
  valor: number | null;
  vencimento: string | null;
  status: string | null;
  data_pagamento: string | null;
};

type Caixa = {
  id: string;
  valor_abertura: number | null;
  valor_fechamento: number | null;
  status: string | null;
  data_abertura: string | null;
  data_fechamento: string | null;
  total_dinheiro: number | null;
  total_pix: number | null;
  total_credito: number | null;
  total_debito: number | null;
  saldo_apurado: number | null;
  valor_informado: number | null;
};

type ItemVenda = {
  id: string;
  venda_id: string;
  produto_id: string;
  quantidade: number | null;
  subtotal: number | null;
};

type ProdutoRanking = {
  nome: string;
  quantidade: number;
  valor: number;
};

type ClienteRanking = {
  nome: string;
  compras: number;
  valor: number;
};

export default function DashboardExecutivoPage() {
  const [carregando, setCarregando] = useState(true);

  const [faturamentoMes, setFaturamentoMes] = useState(0);
  const [lucroEstimado, setLucroEstimado] = useState(0);
  const [totalVendas, setTotalVendas] = useState(0);
  const [ticketMedio, setTicketMedio] = useState(0);

  const [totalClientes, setTotalClientes] = useState(0);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [estoqueBaixo, setEstoqueBaixo] = useState(0);
  const [semEstoque, setSemEstoque] = useState(0);

  const [contasReceber, setContasReceber] = useState(0);
  const [contasPagar, setContasPagar] = useState(0);
  const [saldoCaixaAberto, setSaldoCaixaAberto] = useState(0);

  const [produtoMaisVendido, setProdutoMaisVendido] = useState<ProdutoRanking | null>(null);
  const [melhorCliente, setMelhorCliente] = useState<ClienteRanking | null>(null);

  const [ultimasVendas, setUltimasVendas] = useState<Venda[]>([]);
  const [alertasEstoque, setAlertasEstoque] = useState<Produto[]>([]);
  const [rankingProdutos, setRankingProdutos] = useState<ProdutoRanking[]>([]);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function numero(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR");
  }

  function dataHora(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function inicioMesISO() {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
  }

  function fimMesISO() {
    const hoje = new Date();
    return new Date(
      hoje.getFullYear(),
      hoje.getMonth() + 1,
      0,
      23,
      59,
      59
    ).toISOString();
  }

  function hojeBR() {
    return new Date().toLocaleDateString("pt-BR");
  }

  async function carregarDashboard() {
    setCarregando(true);

    const inicio = inicioMesISO();
    const fim = fimMesISO();

    const vendasReq = await supabase
      .from("vendas")
      .select("id,cliente_id,valor_total,status,forma_pagamento,created_at")
      .eq("status", "finalizada")
      .gte("created_at", inicio)
      .lte("created_at", fim)
      .order("created_at", { ascending: false });

    const vendas: Venda[] = vendasReq.data || [];

    const clientesReq = await supabase
      .from("clientes")
      .select("id,nome")
      .order("nome", { ascending: true });

    const clientes: Cliente[] = clientesReq.data || [];

    const produtosReq = await supabase
      .from("produtos")
      .select("id,nome,codigo,qtd_atual,qtd_minima,preco_custo,preco_venda,ativo")
      .order("nome", { ascending: true });

    const produtos: Produto[] = produtosReq.data || [];

    const contasReceberReq = await supabase
      .from("contas_receber")
      .select("id,valor,vencimento,status");

    const receber: ContaReceber[] = contasReceberReq.data || [];

    const contasPagarReq = await supabase
      .from("contas_pagar")
      .select("id,valor,vencimento,status,data_pagamento");

    const pagar: ContaPagar[] = contasPagarReq.data || [];

    const caixasReq = await supabase
      .from("caixas")
      .select("id,valor_abertura,valor_fechamento,status,data_abertura,data_fechamento,total_dinheiro,total_pix,total_credito,total_debito,saldo_apurado,valor_informado")
      .eq("status", "aberto");

    const caixas: Caixa[] = caixasReq.data || [];

    const vendaIds = vendas.map((venda) => venda.id);

    let itensVenda: ItemVenda[] = [];

    if (vendaIds.length > 0) {
      const itensReq = await supabase
        .from("itens_venda")
        .select("id,venda_id,produto_id,quantidade,subtotal")
        .in("venda_id", vendaIds);

      itensVenda = itensReq.data || [];
    }

    const faturamento = vendas.reduce(
      (total, venda) => total + Number(venda.valor_total || 0),
      0
    );

    const despesasPagas = pagar
      .filter((conta) => String(conta.status || "").toLowerCase() === "pago")
      .reduce((total, conta) => total + Number(conta.valor || 0), 0);

    const lucro = faturamento - despesasPagas;

    const contasReceberAberto = receber
      .filter((conta) => {
        const status = String(conta.status || "").toLowerCase();
        return status !== "pago" && status !== "recebido" && status !== "cancelado";
      })
      .reduce((total, conta) => total + Number(conta.valor || 0), 0);

    const contasPagarAberto = pagar
      .filter((conta) => {
        const status = String(conta.status || "").toLowerCase();
        return status !== "pago" && status !== "cancelado";
      })
      .reduce((total, conta) => total + Number(conta.valor || 0), 0);

    const saldoCaixas = caixas.reduce((total, caixa) => {
      const saldo =
        Number(caixa.saldo_apurado || 0) ||
        Number(caixa.valor_abertura || 0) +
          Number(caixa.total_dinheiro || 0) +
          Number(caixa.total_pix || 0) +
          Number(caixa.total_credito || 0) +
          Number(caixa.total_debito || 0);

      return total + saldo;
    }, 0);

    const produtosBaixo = produtos.filter((produto) => {
      const qtdAtual = Number(produto.qtd_atual || 0);
      const qtdMinima = Number(produto.qtd_minima || 0);

      return produto.ativo !== false && qtdMinima > 0 && qtdAtual <= qtdMinima;
    });

    const produtosSem = produtos.filter((produto) => {
      const qtdAtual = Number(produto.qtd_atual || 0);
      return produto.ativo !== false && qtdAtual <= 0;
    });

    const rankingMap = new Map<string, ProdutoRanking>();

    itensVenda.forEach((item) => {
      const produto = produtos.find((prod) => prod.id === item.produto_id);
      const nome = produto?.nome || "Produto não encontrado";

      const atual = rankingMap.get(item.produto_id) || {
        nome,
        quantidade: 0,
        valor: 0,
      };

      atual.quantidade += Number(item.quantidade || 0);
      atual.valor += Number(item.subtotal || 0);

      rankingMap.set(item.produto_id, atual);
    });

    const rankingProd = Array.from(rankingMap.values()).sort(
      (a, b) => b.quantidade - a.quantidade
    );

    const clienteMap = new Map<string, ClienteRanking>();

    vendas.forEach((venda) => {
      const clienteId = venda.cliente_id || "consumidor-final";
      const cliente = clientes.find((cli) => cli.id === clienteId);

      const atual = clienteMap.get(clienteId) || {
        nome: clienteId === "consumidor-final" ? "Consumidor Final" : cliente?.nome || "Cliente não encontrado",
        compras: 0,
        valor: 0,
      };

      atual.compras += 1;
      atual.valor += Number(venda.valor_total || 0);

      clienteMap.set(clienteId, atual);
    });

    const rankingClientes = Array.from(clienteMap.values()).sort(
      (a, b) => b.valor - a.valor
    );

    setFaturamentoMes(faturamento);
    setLucroEstimado(lucro);
    setTotalVendas(vendas.length);
    setTicketMedio(vendas.length > 0 ? faturamento / vendas.length : 0);

    setTotalClientes(clientes.length);
    setTotalProdutos(produtos.length);
    setEstoqueBaixo(produtosBaixo.length);
    setSemEstoque(produtosSem.length);

    setContasReceber(contasReceberAberto);
    setContasPagar(contasPagarAberto);
    setSaldoCaixaAberto(saldoCaixas);

    setProdutoMaisVendido(rankingProd[0] || null);
    setMelhorCliente(rankingClientes[0] || null);

    setUltimasVendas(vendas.slice(0, 8));
    setAlertasEstoque(produtosBaixo.slice(0, 8));
    setRankingProdutos(rankingProd.slice(0, 5));

    setCarregando(false);
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mb-8 bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-8 text-white shadow-lg">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-blue-100 font-bold">
              THCloud ERP
            </p>

            <h1 className="text-4xl font-black mt-2">
              Dashboard Executivo
            </h1>

            <p className="text-blue-100 mt-2">
              Visão geral da empresa com indicadores financeiros, comerciais e operacionais.
            </p>
          </div>

          <div className="text-left xl:text-right">
            <p className="text-blue-100 text-sm">Data de hoje</p>
            <p className="text-2xl font-black">{hojeBR()}</p>

            <button
              onClick={carregarDashboard}
              className="mt-4 bg-white text-blue-800 px-5 py-3 rounded-2xl font-bold hover:bg-blue-50"
            >
              Atualizar Dashboard
            </button>
          </div>
        </div>
      </div>

      {carregando && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-8 shadow-sm">
          <p className="text-slate-500 font-semibold">
            Carregando indicadores...
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <Card titulo="Faturamento do Mês" valor={moeda(faturamentoMes)} detalhe={`${totalVendas} venda(s) finalizada(s)`} cor="text-green-700" />
        <Card titulo="Lucro Estimado" valor={moeda(lucroEstimado)} detalhe="Faturamento - contas pagas" cor={lucroEstimado >= 0 ? "text-blue-700" : "text-red-700"} />
        <Card titulo="Ticket Médio" valor={moeda(ticketMedio)} detalhe="Média por venda" cor="text-purple-700" />
        <Card titulo="Saldo em Caixa" valor={moeda(saldoCaixaAberto)} detalhe="Caixas abertos" cor="text-orange-700" />

        <Card titulo="Clientes" valor={numero(totalClientes)} detalhe="Clientes cadastrados" cor="text-blue-700" />
        <Card titulo="Produtos" valor={numero(totalProdutos)} detalhe="Produtos cadastrados" cor="text-blue-700" />
        <Card titulo="Estoque Baixo" valor={numero(estoqueBaixo)} detalhe={`${semEstoque} produto(s) sem estoque`} cor="text-red-700" />
        <Card titulo="Contas a Receber" valor={moeda(contasReceber)} detalhe={`A pagar: ${moeda(contasPagar)}`} cor="text-green-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-2xl font-black text-slate-900">
            Destaques Comerciais
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
              <p className="text-sm font-bold text-slate-500">
                Produto Mais Vendido
              </p>

              <h3 className="text-xl font-black text-slate-900 mt-2">
                {produtoMaisVendido?.nome || "-"}
              </h3>

              <p className="text-green-700 font-black mt-2">
                {numero(produtoMaisVendido?.quantidade || 0)} unidade(s)
              </p>

              <p className="text-sm text-slate-500">
                {moeda(produtoMaisVendido?.valor || 0)}
              </p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
              <p className="text-sm font-bold text-slate-500">
                Melhor Cliente
              </p>

              <h3 className="text-xl font-black text-slate-900 mt-2">
                {melhorCliente?.nome || "-"}
              </h3>

              <p className="text-purple-700 font-black mt-2">
                {moeda(melhorCliente?.valor || 0)}
              </p>

              <p className="text-sm text-slate-500">
                {numero(melhorCliente?.compras || 0)} compra(s)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-2xl font-black text-slate-900">
            Top 5 Produtos
          </h2>

          <div className="mt-6 space-y-3">
            {rankingProdutos.map((produto, index) => (
              <div
                key={`${produto.nome}-${index}`}
                className="flex items-center justify-between border border-slate-100 rounded-2xl p-4"
              >
                <div>
                  <p className="font-black text-slate-900">
                    {index + 1}º {produto.nome}
                  </p>

                  <p className="text-sm text-slate-500">
                    {numero(produto.quantidade)} unidade(s)
                  </p>
                </div>

                <p className="font-black text-blue-700">
                  {moeda(produto.valor)}
                </p>
              </div>
            ))}

            {rankingProdutos.length === 0 && (
              <p className="text-slate-500">
                Nenhum produto vendido no período.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-2xl font-black text-slate-900 mb-6">
            Últimas Vendas
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="p-3">Data</th>
                  <th className="p-3">Pagamento</th>
                  <th className="p-3 text-right">Valor</th>
                </tr>
              </thead>

              <tbody>
                {ultimasVendas.map((venda) => (
                  <tr key={venda.id} className="border-b last:border-b-0">
                    <td className="p-3 text-slate-700">
                      {dataHora(venda.created_at)}
                    </td>

                    <td className="p-3 text-slate-700">
                      {venda.forma_pagamento || "-"}
                    </td>

                    <td className="p-3 text-right font-black text-green-700">
                      {moeda(Number(venda.valor_total || 0))}
                    </td>
                  </tr>
                ))}

                {ultimasVendas.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-500">
                      Nenhuma venda encontrada no mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-2xl font-black text-slate-900 mb-6">
            Alertas de Estoque
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="p-3">Produto</th>
                  <th className="p-3 text-right">Atual</th>
                  <th className="p-3 text-right">Mínimo</th>
                </tr>
              </thead>

              <tbody>
                {alertasEstoque.map((produto) => (
                  <tr key={produto.id} className="border-b last:border-b-0">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">
                        {produto.nome}
                      </p>

                      <p className="text-xs text-slate-500">
                        Código: {produto.codigo || "-"}
                      </p>
                    </td>

                    <td className="p-3 text-right font-black text-red-700">
                      {numero(Number(produto.qtd_atual || 0))}
                    </td>

                    <td className="p-3 text-right text-slate-700">
                      {numero(Number(produto.qtd_minima || 0))}
                    </td>
                  </tr>
                ))}

                {alertasEstoque.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-500">
                      Nenhum produto com estoque baixo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
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
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
      <p className="text-sm font-bold text-slate-500">{titulo}</p>

      <h2 className={`text-3xl font-black mt-3 ${cor}`}>{valor}</h2>

      <p className="text-sm text-slate-500 mt-2">{detalhe}</p>
    </div>
  );
}
