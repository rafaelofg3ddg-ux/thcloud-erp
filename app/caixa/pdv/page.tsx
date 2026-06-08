"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";

type Produto = {
  id: string;
  codigo: string;
  codigo_barras: string | null;
  nome: string;
  preco_venda: number;
  qtd_atual: number;
  foto_url: string | null;
};

type Cliente = {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  whatsapp: string | null;
};

type Caixa = {
  id: string;
  empresa_id: string;
  usuario: string | null;
  valor_abertura: number;
  valor_fechamento: number | null;
  status: string | null;
  data_abertura: string | null;
  data_fechamento: string | null;
  observacao: string | null;
};

type MovimentoCaixa = {
  id: string;
  caixa_id: string;
  empresa_id: string;
  tipo: string;
  valor: number;
  descricao: string | null;
  usuario: string | null;
  created_at: string;
};

type VendaCaixa = {
  id: string;
  cliente_id: string | null;
  valor_total: number;
  created_at: string | null;
};

type PagamentoVenda = {
  id: string;
  venda_id: string;
  forma_pagamento: string;
  valor: number;
};

type ItemCarrinho = {
  produto_id: string;
  codigo: string;
  nome: string;
  foto_url: string | null;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
};

export default function PdvPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [caixaAberto, setCaixaAberto] = useState<Caixa | null>(null);
  const [movimentosCaixa, setMovimentosCaixa] = useState<MovimentoCaixa[]>([]);
  const [vendasCaixa, setVendasCaixa] = useState<VendaCaixa[]>([]);
  const [pagamentosCaixa, setPagamentosCaixa] = useState<PagamentoVenda[]>([]);

  const [codigoBusca, setCodigoBusca] = useState("");
  const [pesquisaProduto, setPesquisaProduto] = useState("");
  const [modalProdutos, setModalProdutos] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [pesquisaCliente, setPesquisaCliente] = useState("");
  const [modalPesquisarCliente, setModalPesquisarCliente] = useState(false);
  const [modalNovoCliente, setModalNovoCliente] = useState(false);
  const [novoClienteNome, setNovoClienteNome] = useState("");
  const [novoClienteDocumento, setNovoClienteDocumento] = useState("");
  const [novoClienteWhatsapp, setNovoClienteWhatsapp] = useState("");

  const [modalAbrirCaixa, setModalAbrirCaixa] = useState(false);
  const [modalFecharCaixa, setModalFecharCaixa] = useState(false);
  const [operadorCaixa, setOperadorCaixa] = useState("Admin");
  const [valorAbertura, setValorAbertura] = useState("0,00");
  const [observacaoCaixa, setObservacaoCaixa] = useState("");

  const [fechDinheiro, setFechDinheiro] = useState("0,00");
  const [fechPix, setFechPix] = useState("0,00");
  const [fechDebito, setFechDebito] = useState("0,00");
  const [fechCredito, setFechCredito] = useState("0,00");
  const [fechCrediario, setFechCrediario] = useState("0,00");

  const [modalMovimentoCaixa, setModalMovimentoCaixa] = useState(false);
  const [tipoMovimentoCaixa, setTipoMovimentoCaixa] = useState<
    "sangria" | "suprimento"
  >("sangria");
  const [valorMovimentoCaixa, setValorMovimentoCaixa] = useState("0,00");
  const [descricaoMovimentoCaixa, setDescricaoMovimentoCaixa] = useState("");

  const [descontoValor, setDescontoValor] = useState("0");
  const [descontoPercentual, setDescontoPercentual] = useState("0");

  const [pagDinheiro, setPagDinheiro] = useState("0");
  const [pagPix, setPagPix] = useState("0");
  const [chavePix, setChavePix] = useState("");
  const [nomeRecebedorPix, setNomeRecebedorPix] = useState("TH GESTAO");
  const [cidadePix, setCidadePix] = useState("SAO PAULO");
  const [pixConfirmado, setPixConfirmado] = useState(false);
  const [pagDebito, setPagDebito] = useState("0");
  const [pagCredito, setPagCredito] = useState("0");
  const [pagCrediario, setPagCrediario] = useState("0");

  const [parcelas, setParcelas] = useState("1");
  const [primeiroVencimento, setPrimeiroVencimento] = useState("");

  const [totalCompradoCliente, setTotalCompradoCliente] = useState(0);
  const [totalAbertoCliente, setTotalAbertoCliente] = useState(0);
  const [ultimaCompraCliente, setUltimaCompraCliente] = useState("");

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

  function empresaAtualId() {
    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }

    return empresaId;
  }

  function operadorAtual() {
    try {
      const usuario = localStorage.getItem("th_usuario");
      if (!usuario) return operadorCaixa || "Admin";
      const dados = JSON.parse(usuario);
      return dados.nome || operadorCaixa || "Admin";
    } catch {
      return operadorCaixa || "Admin";
    }
  }

  function converterNumero(valor: string) {
    return Number(String(valor || "0").replace(",", "."));
  }

  function formatarMoeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function totalBruto() {
    return carrinho.reduce((total, item) => total + item.subtotal, 0);
  }

  function valorDescontoPercentual() {
    return (totalBruto() * converterNumero(descontoPercentual)) / 100;
  }

  function valorDescontoTotal() {
    return converterNumero(descontoValor) + valorDescontoPercentual();
  }

  function totalFinal() {
    return Math.max(totalBruto() - valorDescontoTotal(), 0);
  }

  function totalPago() {
    return (
      converterNumero(pagDinheiro) +
      converterNumero(pagPix) +
      converterNumero(pagDebito) +
      converterNumero(pagCredito) +
      converterNumero(pagCrediario)
    );
  }

  function faltaPagar() {
    return Math.max(totalFinal() - totalPago(), 0);
  }

  function troco() {
    return Math.max(totalPago() - totalFinal(), 0);
  }

  function formaPagamentoResumo() {
    const formas = [];

    if (converterNumero(pagDinheiro) > 0) formas.push("dinheiro");
    if (converterNumero(pagPix) > 0) formas.push("pix");
    if (converterNumero(pagDebito) > 0) formas.push("debito");
    if (converterNumero(pagCredito) > 0) formas.push("credito");
    if (converterNumero(pagCrediario) > 0) formas.push("crediario");

    return formas.length > 1 ? "misto" : formas[0] || "nao_informado";
  }

  function clienteSelecionado() {
    const cliente = clientes.find((item) => item.id === clienteId);
    return cliente ? cliente.nome : "Consumidor Final";
  }

  function totalVendasCaixa() {
    return vendasCaixa.reduce(
      (total, venda) => total + Number(venda.valor_total || 0),
      0
    );
  }

  function totalPorForma(forma: string) {
    return pagamentosCaixa
      .filter((pag) => pag.forma_pagamento === forma)
      .reduce((total, pag) => total + Number(pag.valor || 0), 0);
  }

  function totalSuprimentos() {
    return movimentosCaixa
      .filter((mov) => mov.tipo === "suprimento")
      .reduce((total, mov) => total + Number(mov.valor || 0), 0);
  }

  function totalSangrias() {
    return movimentosCaixa
      .filter((mov) => mov.tipo === "sangria")
      .reduce((total, mov) => total + Number(mov.valor || 0), 0);
  }

  function saldoEsperado() {
    return (
      Number(caixaAberto?.valor_abertura || 0) +
      totalPorForma("dinheiro") +
      totalSuprimentos() -
      totalSangrias()
    );
  }

  function totalInformadoFechamento() {
    return (
      converterNumero(fechDinheiro) +
      converterNumero(fechPix) +
      converterNumero(fechDebito) +
      converterNumero(fechCredito) +
      converterNumero(fechCrediario)
    );
  }

  function diferencaFechamento() {
    const dinheiroEsperado =
      Number(caixaAberto?.valor_abertura || 0) +
      totalPorForma("dinheiro") +
      totalSuprimentos() -
      totalSangrias();

    const totalSistema =
      dinheiroEsperado +
      totalPorForma("pix") +
      totalPorForma("debito") +
      totalPorForma("credito") +
      totalPorForma("crediario");

    return totalInformadoFechamento() - totalSistema;
  }

  async function carregarDados() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const produtosReq = await supabase
      .from("produtos")
      .select("id,codigo,codigo_barras,nome,preco_venda,qtd_atual,foto_url")
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .order("nome");

    if (produtosReq.error) {
      alert("Erro ao carregar produtos: " + produtosReq.error.message);
      return;
    }

    setProdutos(produtosReq.data || []);

    const clientesReq = await supabase
      .from("clientes")
      .select("id,nome,cpf_cnpj,whatsapp")
      .eq("empresa_id", empresaId)
      .order("nome");

    if (clientesReq.error) {
      alert("Erro ao carregar clientes: " + clientesReq.error.message);
      return;
    }

    setClientes(clientesReq.data || []);

    const caixaReq = await supabase
      .from("caixas")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("status", "aberto")
      .order("data_abertura", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (caixaReq.error) {
      alert("Erro ao verificar caixa: " + caixaReq.error.message);
      return;
    }

    setCaixaAberto(caixaReq.data || null);

    if (caixaReq.data?.id) {
      await carregarMovimentosCaixa(caixaReq.data.id);
      await carregarVendasCaixa(caixaReq.data.id);
    } else {
      setMovimentosCaixa([]);
      setVendasCaixa([]);
      setPagamentosCaixa([]);
    }
  }

  async function carregarMovimentosCaixa(caixaId: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const req = await supabase
      .from("movimentacoes_caixa")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("caixa_id", caixaId)
      .order("created_at", { ascending: false });

    if (req.error) {
      alert("Erro ao carregar movimentações do caixa: " + req.error.message);
      return;
    }

    setMovimentosCaixa(req.data || []);
  }

  async function carregarVendasCaixa(caixaId: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const vendasReq = await supabase
      .from("vendas")
      .select("id,cliente_id,valor_total,created_at")
      .eq("empresa_id", empresaId)
      .eq("caixa_id", caixaId)
      .eq("status", "finalizada");

    if (vendasReq.error) {
      alert("Erro ao carregar vendas do caixa: " + vendasReq.error.message);
      return;
    }

    const vendas = vendasReq.data || [];
    setVendasCaixa(vendas);

    if (vendas.length === 0) {
      setPagamentosCaixa([]);
      return;
    }

    const vendaIds = vendas.map((venda) => venda.id);

    const pagamentosReq = await supabase
      .from("pagamentos_venda")
      .select("*")
      .eq("empresa_id", empresaId)
      .in("venda_id", vendaIds);

    if (pagamentosReq.error) {
      alert("Erro ao carregar pagamentos: " + pagamentosReq.error.message);
      return;
    }

    setPagamentosCaixa(pagamentosReq.data || []);
  }

  async function carregarHistoricoCliente(idCliente: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!idCliente) {
      setTotalCompradoCliente(0);
      setTotalAbertoCliente(0);
      setUltimaCompraCliente("");
      return;
    }

    const vendasReq = await supabase
      .from("vendas")
      .select("valor_total,created_at")
      .eq("empresa_id", empresaId)
      .eq("cliente_id", idCliente)
      .eq("status", "finalizada")
      .order("created_at", { ascending: false });

    const vendas = vendasReq.data || [];

    setTotalCompradoCliente(
      vendas.reduce((total, venda) => total + Number(venda.valor_total || 0), 0)
    );

    setUltimaCompraCliente(vendas[0]?.created_at || "");

    const contasReq = await supabase
      .from("contas_receber")
      .select("valor,status")
      .eq("empresa_id", empresaId)
      .eq("cliente_id", idCliente);

    const contas = contasReq.data || [];

    setTotalAbertoCliente(
      contas
        .filter((conta) => conta.status !== "pago")
        .reduce((total, conta) => total + Number(conta.valor || 0), 0)
    );
  }

  async function abrirCaixa() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (caixaAberto) {
      alert("Já existe um caixa aberto.");
      return;
    }

    if (!operadorCaixa) {
      alert("Informe o operador do caixa.");
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
        usuario: operadorCaixa || operadorAtual(),
        valor_abertura: valor,
        valor_fechamento: null,
        status: "aberto",
        data_abertura: new Date().toISOString(),
        data_fechamento: null,
        observacao: observacaoCaixa,
      },
    ]);

    if (error) {
      alert("Erro ao abrir caixa: " + error.message);
      return;
    }

    alert("Caixa aberto com sucesso!");

    setValorAbertura("0,00");
    setObservacaoCaixa("");
    setModalAbrirCaixa(false);

    await carregarDados();
  }

  async function fecharCaixa() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!caixaAberto) {
      alert("Nenhum caixa aberto.");
      return;
    }

    const dinheiroSistema =
      Number(caixaAberto.valor_abertura || 0) +
      totalPorForma("dinheiro") +
      totalSuprimentos() -
      totalSangrias();

    const pixSistema = totalPorForma("pix");
    const debitoSistema = totalPorForma("debito");
    const creditoSistema = totalPorForma("credito");
    const crediarioSistema = totalPorForma("crediario");

    const valorInformado = totalInformadoFechamento();
    const saldoSistema =
      dinheiroSistema +
      pixSistema +
      debitoSistema +
      creditoSistema +
      crediarioSistema;

    const diferenca = valorInformado - saldoSistema;

    const { error } = await supabase
      .from("caixas")
      .update({
        valor_fechamento: valorInformado,
        total_dinheiro: dinheiroSistema,
        total_pix: pixSistema,
        total_debito: debitoSistema,
        total_credito: creditoSistema,
        total_crediario: crediarioSistema,
        saldo_esperado: saldoSistema,
        valor_informado: valorInformado,
        diferenca,
        status: "fechado",
        data_fechamento: new Date().toISOString(),
        observacao: observacaoCaixa,
      })
      .eq("id", caixaAberto.id)
      .eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao fechar caixa: " + error.message);
      return;
    }

    alert("Caixa fechado com sucesso!");

    setFechDinheiro("0,00");
    setFechPix("0,00");
    setFechDebito("0,00");
    setFechCredito("0,00");
    setFechCrediario("0,00");
    setObservacaoCaixa("");
    setModalFecharCaixa(false);
    setCaixaAberto(null);

    await carregarDados();
  }

  function abrirMovimentoCaixa(tipo: "sangria" | "suprimento") {
    if (!caixaAberto) {
      alert("Abra o caixa primeiro.");
      return;
    }

    setTipoMovimentoCaixa(tipo);
    setValorMovimentoCaixa("0,00");
    setDescricaoMovimentoCaixa("");
    setModalMovimentoCaixa(true);
  }

  async function registrarMovimentoCaixa() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!caixaAberto) {
      alert("Nenhum caixa aberto.");
      return;
    }

    const valor = converterNumero(valorMovimentoCaixa);

    if (isNaN(valor) || valor <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    const { error } = await supabase.from("movimentacoes_caixa").insert([
      {
        caixa_id: caixaAberto.id,
        empresa_id: empresaId,
        tipo: tipoMovimentoCaixa,
        valor,
        descricao: descricaoMovimentoCaixa,
        usuario: caixaAberto.usuario || operadorAtual(),
      },
    ]);

    if (error) {
      alert("Erro ao registrar movimentação: " + error.message);
      return;
    }

    alert(
      tipoMovimentoCaixa === "sangria"
        ? "Sangria registrada com sucesso!"
        : "Suprimento registrado com sucesso!"
    );

    setValorMovimentoCaixa("0,00");
    setDescricaoMovimentoCaixa("");
    setModalMovimentoCaixa(false);

    await carregarDados();
  }

  function adicionarProduto(produto: Produto) {
    if (!caixaAberto) {
      alert("Abra o caixa antes de iniciar uma venda.");
      setModalAbrirCaixa(true);
      return;
    }

    if (Number(produto.qtd_atual || 0) <= 0) {
      alert("Produto sem estoque.");
      return;
    }

    const existente = carrinho.find((item) => item.produto_id === produto.id);

    if (existente) {
      const novaQuantidade = existente.quantidade + 1;

      if (novaQuantidade > Number(produto.qtd_atual || 0)) {
        alert("Estoque insuficiente.");
        return;
      }

      setCarrinho(
        carrinho.map((item) =>
          item.produto_id === produto.id
            ? {
                ...item,
                quantidade: novaQuantidade,
                subtotal: novaQuantidade * item.valor_unitario,
              }
            : item
        )
      );
    } else {
      setCarrinho([
        ...carrinho,
        {
          produto_id: produto.id,
          codigo: produto.codigo,
          nome: produto.nome,
          foto_url: produto.foto_url,
          quantidade: 1,
          valor_unitario: Number(produto.preco_venda),
          subtotal: Number(produto.preco_venda),
        },
      ]);
    }

    setCodigoBusca("");
    setPesquisaProduto("");
    setModalProdutos(false);
  }

  function buscarProduto() {
    if (!caixaAberto) {
      alert("Abra o caixa antes de vender.");
      setModalAbrirCaixa(true);
      return;
    }

    if (!codigoBusca) {
      alert("Digite ou bipe um código.");
      return;
    }

    const termo = codigoBusca.toLowerCase();

    const produto = produtos.find(
      (item) =>
        item.codigo?.toLowerCase() === termo ||
        item.codigo_barras?.toLowerCase() === termo ||
        item.nome?.toLowerCase().includes(termo)
    );

    if (!produto) {
      alert("Produto não encontrado. Use a lupa para pesquisar.");
      return;
    }

    adicionarProduto(produto);
  }

  function alterarQuantidade(produtoId: string, quantidade: string) {
    const qtd = converterNumero(quantidade);

    if (isNaN(qtd) || qtd <= 0) return;

    const produto = produtos.find((item) => item.id === produtoId);

    if (!produto) return;

    if (qtd > Number(produto.qtd_atual || 0)) {
      alert("Estoque insuficiente.");
      return;
    }

    setCarrinho(
      carrinho.map((item) =>
        item.produto_id === produtoId
          ? {
              ...item,
              quantidade: qtd,
              subtotal: qtd * item.valor_unitario,
            }
          : item
      )
    );
  }

  function removerItem(produtoId: string) {
    setCarrinho(carrinho.filter((item) => item.produto_id !== produtoId));
  }

  function limparVenda() {
    setCarrinho([]);
    setClienteId("");
    setCodigoBusca("");
    setPesquisaProduto("");
    setDescontoValor("0");
    setDescontoPercentual("0");
    setPagDinheiro("0");
    setPagPix("0");
    setPixConfirmado(false);
    setPagDebito("0");
    setPagCredito("0");
    setPagCrediario("0");
    setParcelas("1");
    setPrimeiroVencimento("");
    setTotalCompradoCliente(0);
    setTotalAbertoCliente(0);
    setUltimaCompraCliente("");
  }

  function selecionarCliente(cliente: Cliente) {
    setClienteId(cliente.id);
    setModalPesquisarCliente(false);
    setPesquisaCliente("");
    carregarHistoricoCliente(cliente.id);
  }

  async function salvarNovoCliente() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!novoClienteNome && !novoClienteDocumento) {
      alert("Digite o nome ou CPF/CNPJ do cliente.");
      return;
    }

    const { data, error } = await supabase
      .from("clientes")
      .insert([
        {
          empresa_id: empresaId,
          nome: novoClienteNome || "Cliente sem nome",
          cpf_cnpj: novoClienteDocumento || null,
          whatsapp: novoClienteWhatsapp || null,
          ativo: true,
        },
      ])
      .select("id,nome,cpf_cnpj,whatsapp")
      .single();

    if (error) {
      alert("Erro ao salvar cliente: " + error.message);
      return;
    }

    await carregarDados();

    if (data) {
      setClienteId(data.id);
      carregarHistoricoCliente(data.id);
    }

    setNovoClienteNome("");
    setNovoClienteDocumento("");
    setNovoClienteWhatsapp("");
    setModalNovoCliente(false);
  }

  function gerarVencimento(base: string, meses: number) {
    const data = new Date(base + "T00:00:00");
    data.setMonth(data.getMonth() + meses);
    return data.toISOString().split("T")[0];
  }

  async function baixarEstoque(item: ItemCarrinho) {
    const empresaId = empresaAtualId();
    if (!empresaId) throw new Error("Empresa não identificada.");

    const produto = produtos.find((p) => p.id === item.produto_id);

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    const novaQtdProduto = Number(produto.qtd_atual || 0) - item.quantidade;

    if (novaQtdProduto < 0) {
      throw new Error(`Estoque insuficiente para ${produto.nome}.`);
    }

    const produtoUpdate = await supabase
      .from("produtos")
      .update({
        qtd_atual: novaQtdProduto,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.produto_id)
      .eq("empresa_id", empresaId);

    if (produtoUpdate.error) {
      throw new Error(produtoUpdate.error.message);
    }

    const estoqueAtual = await supabase
      .from("estoque")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("produto_id", item.produto_id)
      .maybeSingle();

    if (estoqueAtual.error) {
      throw new Error(estoqueAtual.error.message);
    }

    if (estoqueAtual.data) {
      const novaQtdEstoque =
        Number(estoqueAtual.data.quantidade || 0) - item.quantidade;

      if (novaQtdEstoque < 0) {
        throw new Error(`Estoque insuficiente para ${produto.nome}.`);
      }

      const estoqueUpdate = await supabase
        .from("estoque")
        .update({
          quantidade: novaQtdEstoque,
          updated_at: new Date().toISOString(),
        })
        .eq("empresa_id", empresaId)
        .eq("produto_id", item.produto_id);

      if (estoqueUpdate.error) {
        throw new Error(estoqueUpdate.error.message);
      }
    }

    const movimento = await supabase.from("movimentacoes_estoque").insert([
      {
        empresa_id: empresaId,
        produto_id: item.produto_id,
        tipo: "saida",
        quantidade: item.quantidade,
        custo_unitario: 0,
        nota_fiscal: null,
        fornecedor_id: null,
        observacao: "Venda PDV",
        usuario: caixaAberto?.usuario || operadorAtual(),
      },
    ]);

    if (movimento.error) {
      throw new Error(movimento.error.message);
    }
  }

  async function gerarContasReceber(vendaId: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) throw new Error("Empresa não identificada.");

    const valorCrediario = converterNumero(pagCrediario);

    if (valorCrediario <= 0) return;

    if (!clienteId) {
      throw new Error("Selecione um cliente para vender no crediário.");
    }

    if (!primeiroVencimento) {
      throw new Error("Informe o primeiro vencimento.");
    }

    const qtdParcelas = Number(parcelas || 1);

    if (qtdParcelas <= 0) {
      throw new Error("Quantidade de parcelas inválida.");
    }

    const valorBase = Math.floor((valorCrediario / qtdParcelas) * 100) / 100;
    let soma = 0;
    const contas = [];

    for (let i = 1; i <= qtdParcelas; i++) {
      let valorParcela = valorBase;

      if (i === qtdParcelas) {
        valorParcela = Number((valorCrediario - soma).toFixed(2));
      }

      soma += valorParcela;

      contas.push({
        empresa_id: empresaId,
        cliente_id: clienteId,
        descricao: `Venda PDV ${vendaId} - Parcela ${i}/${qtdParcelas}`,
        valor: valorParcela,
        vencimento: gerarVencimento(primeiroVencimento, i - 1),
        status: "aberto",
      });
    }

    const contasReq = await supabase.from("contas_receber").insert(contas);

    if (contasReq.error) {
      throw new Error(contasReq.error.message);
    }
  }

  async function salvarPagamentosVenda(vendaId: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) throw new Error("Empresa não identificada.");

    const pagamentos = [
      { forma_pagamento: "dinheiro", valor: converterNumero(pagDinheiro) },
      { forma_pagamento: "pix", valor: converterNumero(pagPix) },
      { forma_pagamento: "debito", valor: converterNumero(pagDebito) },
      { forma_pagamento: "credito", valor: converterNumero(pagCredito) },
      { forma_pagamento: "crediario", valor: converterNumero(pagCrediario) },
    ]
      .filter((pag) => pag.valor > 0)
      .map((pag) => ({
        empresa_id: empresaId,
        venda_id: vendaId,
        forma_pagamento: pag.forma_pagamento,
        valor: pag.valor,
      }));

    if (pagamentos.length === 0) return;

    const { error } = await supabase.from("pagamentos_venda").insert(pagamentos);

    if (error) {
      throw new Error(error.message);
    }
  }

  function removerAcentos(texto: string) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9 ]/g, "")
      .toUpperCase();
  }

  function campoPix(id: string, valor: string) {
    const tamanho = String(valor.length).padStart(2, "0");
    return `${id}${tamanho}${valor}`;
  }

  function crc16(payload: string) {
    let polinomio = 0x1021;
    let resultado = 0xffff;

    for (let offset = 0; offset < payload.length; offset++) {
      resultado ^= payload.charCodeAt(offset) << 8;

      for (let bitwise = 0; bitwise < 8; bitwise++) {
        if ((resultado <<= 1) & 0x10000) {
          resultado ^= polinomio;
        }

        resultado &= 0xffff;
      }
    }

    return resultado.toString(16).toUpperCase().padStart(4, "0");
  }

  function gerarPixCopiaCola() {
    const valorPix = converterNumero(pagPix);

    if (valorPix <= 0 || !chavePix) {
      return "";
    }

    const nome = removerAcentos(nomeRecebedorPix).substring(0, 25);
    const cidade = removerAcentos(cidadePix).substring(0, 15);
    const txid = "TH" + Date.now().toString().slice(-10);

    const gui = campoPix("00", "br.gov.bcb.pix");
    const chave = campoPix("01", chavePix.trim());
    const merchantAccount = campoPix("26", gui + chave);

    const payloadSemCRC =
      campoPix("00", "01") +
      campoPix("01", "12") +
      merchantAccount +
      campoPix("52", "0000") +
      campoPix("53", "986") +
      campoPix("54", valorPix.toFixed(2)) +
      campoPix("58", "BR") +
      campoPix("59", nome || "TH GESTAO") +
      campoPix("60", cidade || "SAO PAULO") +
      campoPix("62", campoPix("05", txid)) +
      "6304";

    return payloadSemCRC + crc16(payloadSemCRC);
  }

  async function copiarPix() {
    const payload = gerarPixCopiaCola();

    if (!payload) {
      alert("Informe a chave PIX e o valor PIX.");
      return;
    }

    await navigator.clipboard.writeText(payload);
    alert("PIX Copia e Cola copiado com sucesso!");
  }

  function montarCupom(vendaId: string) {
    const linhasItens = carrinho
      .map((item) => {
        return `
          <tr>
            <td>${item.quantidade}x ${item.nome}</td>
            <td style="text-align:right;">${formatarMoeda(item.subtotal)}</td>
          </tr>
        `;
      })
      .join("");

    const pagamentos = [
      ["Dinheiro", converterNumero(pagDinheiro)],
      ["PIX", converterNumero(pagPix)],
      ["Débito", converterNumero(pagDebito)],
      ["Crédito", converterNumero(pagCredito)],
      ["Crediário", converterNumero(pagCrediario)],
    ]
      .filter((item) => Number(item[1]) > 0)
      .map(
        ([forma, valor]) => `
          <tr>
            <td>${forma}</td>
            <td style="text-align:right;">${formatarMoeda(Number(valor))}</td>
          </tr>
        `
      )
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Cupom Venda ${vendaId}</title>

          <style>
            body {
              font-family: Arial, sans-serif;
              width: 300px;
              margin: 0 auto;
              color: #111827;
              font-size: 12px;
            }

            .center {
              text-align: center;
            }

            .logo {
              max-width: 120px;
              max-height: 70px;
              object-fit: contain;
              margin-bottom: 6px;
            }

            h1 {
              font-size: 18px;
              margin: 4px 0;
            }

            p {
              margin: 3px 0;
            }

            hr {
              border: none;
              border-top: 1px dashed #111827;
              margin: 10px 0;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            td {
              padding: 3px 0;
              vertical-align: top;
            }

            .total {
              font-size: 18px;
              font-weight: bold;
            }

            .small {
              font-size: 11px;
            }

            @media print {
              body {
                width: 80mm;
              }

              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
          <div class="center">
            <img src="/logo-thcloud.jpeg" class="logo" />
            <h1>TH Gestão</h1>
            <p>ERP Inteligente para Varejo</p>
            <p class="small">Cupom Não Fiscal</p>
          </div>

          <hr />

          <p><strong>Venda:</strong> ${vendaId}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}</p>
          <p><strong>Operador:</strong> ${caixaAberto?.usuario || "Admin"}</p>
          <p><strong>Cliente:</strong> ${clienteSelecionado()}</p>

          <hr />

          <table>
            <tbody>
              ${linhasItens}
            </tbody>
          </table>

          <hr />

          <table>
            <tbody>
              <tr>
                <td>Subtotal</td>
                <td style="text-align:right;">${formatarMoeda(totalBruto())}</td>
              </tr>

              <tr>
                <td>Desconto</td>
                <td style="text-align:right;">${formatarMoeda(valorDescontoTotal())}</td>
              </tr>

              <tr class="total">
                <td>TOTAL</td>
                <td style="text-align:right;">${formatarMoeda(totalFinal())}</td>
              </tr>

              <tr>
                <td>Total Pago</td>
                <td style="text-align:right;">${formatarMoeda(totalPago())}</td>
              </tr>

              <tr>
                <td>Troco</td>
                <td style="text-align:right;">${formatarMoeda(troco())}</td>
              </tr>
            </tbody>
          </table>

          <hr />

          <p><strong>Pagamentos</strong></p>

          <table>
            <tbody>
              ${pagamentos}
            </tbody>
          </table>

          ${
            converterNumero(pagCrediario) > 0
              ? `
                <hr />
                <p><strong>Crediário:</strong> ${parcelas} parcela(s)</p>
                <p><strong>1º vencimento:</strong> ${primeiroVencimento || "-"}</p>
              `
              : ""
          }

          <hr />

          <div class="center">
            <p>Obrigado pela preferência!</p>
            <p class="small">Sistema THCloud ERP</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
  }

  function imprimirCupom(vendaId: string) {
    const janela = window.open("", "_blank", "width=420,height=700");

    if (!janela) {
      alert("O navegador bloqueou a janela de impressão. Libere pop-ups para imprimir o cupom.");
      return;
    }

    janela.document.open();
    janela.document.write(montarCupom(vendaId));
    janela.document.close();
  }

  async function finalizarVenda() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!caixaAberto) {
      alert("Abra o caixa antes de finalizar uma venda.");
      setModalAbrirCaixa(true);
      return;
    }

    if (carrinho.length === 0) {
      alert("Adicione produtos ao carrinho.");
      return;
    }

    if (totalPago() < totalFinal()) {
      alert("O valor pago é menor que o total da venda.");
      return;
    }

    if (converterNumero(pagPix) > 0 && !chavePix) {
      alert("Informe a chave PIX para gerar o QR Code.");
      return;
    }

    if (converterNumero(pagPix) > 0 && !pixConfirmado) {
      const confirmarPix = confirm(
        "O pagamento PIX já foi recebido? Confirme antes de finalizar a venda."
      );

      if (!confirmarPix) {
        return;
      }

      setPixConfirmado(true);
    }

    if (converterNumero(pagCrediario) > 0 && !clienteId) {
      alert("Para crediário, selecione ou cadastre um cliente.");
      return;
    }

    const vendaReq = await supabase
      .from("vendas")
      .insert([
        {
          empresa_id: empresaId,
          cliente_id: clienteId || null,
          caixa_id: caixaAberto.id,
          valor_total: totalFinal(),
          desconto: valorDescontoTotal(),
          forma_pagamento: formaPagamentoResumo(),
          status: "finalizada",
        },
      ])
      .select("id")
      .single();

    if (vendaReq.error) {
      alert("Erro ao criar venda: " + vendaReq.error.message);
      return;
    }

    const vendaId = vendaReq.data.id;

    const itens = carrinho.map((item) => ({
      empresa_id: empresaId,
      venda_id: vendaId,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      subtotal: item.subtotal,
    }));

    const itensReq = await supabase.from("itens_venda").insert(itens);

    if (itensReq.error) {
      alert("Erro ao salvar itens da venda: " + itensReq.error.message);
      return;
    }

    try {
      await salvarPagamentosVenda(vendaId);

      for (const item of carrinho) {
        await baixarEstoque(item);
      }

      await gerarContasReceber(vendaId);
    } catch (error: any) {
      alert("Venda criada, mas ocorreu erro após salvar: " + error.message);
      return;
    }

    alert("Venda finalizada com sucesso!");

    imprimirCupom(vendaId);

    limparVenda();
    await carregarDados();
  }

  useEffect(() => {
    const usuario = localStorage.getItem("th_usuario");

    if (usuario) {
      try {
        const dados = JSON.parse(usuario);
        if (dados.nome) setOperadorCaixa(dados.nome);
      } catch {}
    }

    carregarDados();
  }, []);

  useEffect(() => {
    function atalhos(event: KeyboardEvent) {
      if (event.key === "F2") {
        event.preventDefault();
        setModalNovoCliente(true);
      }

      if (event.key === "F3") {
        event.preventDefault();
        setModalPesquisarCliente(true);
      }

      if (event.key === "F4") {
        event.preventDefault();
        setModalProdutos(true);
      }

      if (event.key === "F5") {
        event.preventDefault();
        if (!caixaAberto) setModalAbrirCaixa(true);
      }

      if (event.key === "F6") {
        event.preventDefault();
        abrirMovimentoCaixa("sangria");
      }

      if (event.key === "F7") {
        event.preventDefault();
        abrirMovimentoCaixa("suprimento");
      }

      if (event.key === "F8") {
        event.preventDefault();
        finalizarVenda();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setModalProdutos(false);
        setModalPesquisarCliente(false);
        setModalNovoCliente(false);
        setModalAbrirCaixa(false);
        setModalFecharCaixa(false);
        setModalMovimentoCaixa(false);
      }
    }

    window.addEventListener("keydown", atalhos);
    return () => window.removeEventListener("keydown", atalhos);
  });

  const produtosFiltrados = produtos.filter((produto) => {
    const termo = pesquisaProduto.toLowerCase();
    return (
      produto.nome.toLowerCase().includes(termo) ||
      produto.codigo.toLowerCase().includes(termo) ||
      produto.codigo_barras?.toLowerCase().includes(termo)
    );
  });

  const produtosInstantaneos = produtos.filter((produto) => {
    const termo = codigoBusca.toLowerCase();

    if (!termo || termo.length < 2) return false;

    return (
      produto.nome.toLowerCase().includes(termo) ||
      produto.codigo.toLowerCase().includes(termo) ||
      produto.codigo_barras?.toLowerCase().includes(termo)
    );
  }).slice(0, 6);

  const clientesFiltrados = clientes.filter((cliente) => {
    const termo = pesquisaCliente.toLowerCase();
    return (
      cliente.nome?.toLowerCase().includes(termo) ||
      cliente.cpf_cnpj?.toLowerCase().includes(termo) ||
      cliente.whatsapp?.toLowerCase().includes(termo)
    );
  });

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      <div className="flex items-center justify-between mb-5 bg-slate-900 rounded-xl p-4 text-white">
        <div className="flex items-center gap-4">
          <div className="w-24 h-16 bg-white border border-slate-300 rounded-lg flex items-center justify-center text-slate-500 text-xs">
            Logo Empresa
          </div>

          <div>
            <h1 className="text-3xl font-bold">PDV Premium - Frente de Caixa</h1>
            <p className="text-slate-300">
              F2 Novo Cliente • F3 Cliente • F4 Produto • F5 Caixa • F8 Finalizar
            </p>
          </div>
        </div>

        <div className="w-24 h-16 bg-white rounded-lg flex items-center justify-center">
          <img
            src="/logo-thcloud.jpeg"
            alt="THCloud"
            className="max-h-14 max-w-20 object-contain"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow p-4 mb-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Status do Caixa</p>

            {caixaAberto ? (
              <div>
                <p className="text-xl font-bold text-green-700">
                  Caixa Aberto
                </p>
                <p className="text-slate-700">
                  Operador: <strong>{caixaAberto.usuario}</strong> | Abertura:{" "}
                  <strong>
                    {formatarMoeda(Number(caixaAberto.valor_abertura || 0))}
                  </strong>{" "}
                  | Desde:{" "}
                  <strong>{formatarData(caixaAberto.data_abertura)}</strong>
                </p>
              </div>
            ) : (
              <p className="text-xl font-bold text-red-600">Caixa Fechado</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setModalAbrirCaixa(true)}
              disabled={!!caixaAberto}
              className={`px-5 py-3 rounded-lg font-semibold text-white ${
                caixaAberto
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Abrir Caixa
            </button>

            <button
              onClick={() => abrirMovimentoCaixa("sangria")}
              disabled={!caixaAberto}
              className={`px-5 py-3 rounded-lg font-semibold text-white ${
                !caixaAberto
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              Sangria
            </button>

            <button
              onClick={() => abrirMovimentoCaixa("suprimento")}
              disabled={!caixaAberto}
              className={`px-5 py-3 rounded-lg font-semibold text-white ${
                !caixaAberto
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Suprimento
            </button>

            <button
              onClick={() => {
                setFechDinheiro(String(saldoEsperado().toFixed(2)).replace(".", ","));
                setFechPix(String(totalPorForma("pix").toFixed(2)).replace(".", ","));
                setFechDebito(String(totalPorForma("debito").toFixed(2)).replace(".", ","));
                setFechCredito(String(totalPorForma("credito").toFixed(2)).replace(".", ","));
                setFechCrediario(String(totalPorForma("crediario").toFixed(2)).replace(".", ","));
                setModalFecharCaixa(true);
              }}
              disabled={!caixaAberto}
              className={`px-5 py-3 rounded-lg font-semibold text-white ${
                !caixaAberto
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Fechar Caixa
            </button>
          </div>
        </div>
      </div>

      {caixaAberto && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <Resumo titulo="Vendas do Caixa" valor={formatarMoeda(totalVendasCaixa())} cor="text-blue-700" />
          <Resumo titulo="Suprimentos" valor={formatarMoeda(totalSuprimentos())} cor="text-green-700" />
          <Resumo titulo="Sangrias" valor={formatarMoeda(totalSangrias())} cor="text-orange-600" />
          <Resumo titulo="Dinheiro Esperado" valor={formatarMoeda(saldoEsperado())} cor="text-slate-900" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white p-5 rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Produtos</h2>

          <div className="relative">
            <div className="flex gap-3 mb-5">
              <input
                value={codigoBusca}
                onChange={(e) => setCodigoBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") buscarProduto();
                }}
                placeholder="Digite ou bipe código interno, barras ou nome"
                className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 font-medium"
                autoFocus
                disabled={!caixaAberto}
              />

              <button
                onClick={buscarProduto}
                disabled={!caixaAberto}
                className={`px-5 rounded-lg font-semibold text-white ${
                  !caixaAberto
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-blue-700 hover:bg-blue-800"
                }`}
              >
                Adicionar
              </button>

              <button
                onClick={() => setModalProdutos(true)}
                disabled={!caixaAberto}
                className={`px-5 rounded-lg font-semibold text-white ${
                  !caixaAberto
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-slate-700 hover:bg-slate-800"
                }`}
              >
                🔍
              </button>
            </div>

            {produtosInstantaneos.length > 0 && caixaAberto && (
              <div className="absolute z-40 top-14 left-0 right-32 bg-white border border-slate-300 rounded-xl shadow-xl overflow-hidden">
                {produtosInstantaneos.map((produto) => (
                  <button
                    key={produto.id}
                    onClick={() => adicionarProduto(produto)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 text-left border-b"
                  >
                    <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {produto.foto_url ? (
                        <img src={produto.foto_url} alt={produto.nome} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-slate-500">Sem foto</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{produto.nome}</p>
                      <p className="text-sm text-slate-600">
                        Código: {produto.codigo} • Estoque: {produto.qtd_atual}
                      </p>
                    </div>

                    <strong className="text-blue-700">
                      {formatarMoeda(Number(produto.preco_venda || 0))}
                    </strong>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-700 text-white">
                  <th className="p-3 text-left">Foto</th>
                  <th className="p-3 text-left">Produto</th>
                  <th className="p-3 text-left">Qtd</th>
                  <th className="p-3 text-left">Unitário</th>
                  <th className="p-3 text-left">Subtotal</th>
                  <th className="p-3 text-center">Ação</th>
                </tr>
              </thead>

              <tbody>
                {carrinho.map((item) => (
                  <tr key={item.produto_id} className="border-b">
                    <td className="p-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {item.foto_url ? (
                          <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-500">Sem</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-slate-900 font-medium">
                      {item.codigo} - {item.nome}
                    </td>

                    <td className="p-3">
                      <input
                        value={item.quantidade}
                        onChange={(e) => alterarQuantidade(item.produto_id, e.target.value)}
                        className="w-20 border border-slate-300 p-2 rounded text-slate-900"
                      />
                    </td>

                    <td className="p-3 text-slate-800">
                      {formatarMoeda(Number(item.valor_unitario))}
                    </td>

                    <td className="p-3 text-slate-800">
                      {formatarMoeda(Number(item.subtotal))}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => removerItem(item.produto_id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}

                {carrinho.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-700">
                      {caixaAberto ? "Nenhum produto no carrinho." : "Abra o caixa para iniciar uma venda."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {caixaAberto && movimentosCaixa.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-xl font-bold text-slate-800 mb-3">Histórico do Caixa</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="p-2 text-left">Data</th>
                      <th className="p-2 text-left">Tipo</th>
                      <th className="p-2 text-left">Descrição</th>
                      <th className="p-2 text-right">Valor</th>
                    </tr>
                  </thead>

                  <tbody>
                    {movimentosCaixa.map((mov) => (
                      <tr key={mov.id} className="border-b">
                        <td className="p-2 text-slate-800">{formatarData(mov.created_at)}</td>
                        <td className="p-2 text-slate-800 uppercase">{mov.tipo}</td>
                        <td className="p-2 text-slate-800">{mov.descricao || "-"}</td>
                        <td className="p-2 text-right font-semibold text-slate-900">{formatarMoeda(Number(mov.valor))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Pagamento</h2>

          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 bg-slate-50">
                {clienteSelecionado()}
              </div>

              <button onClick={() => setModalPesquisarCliente(true)} className="bg-slate-700 hover:bg-slate-800 text-white px-4 rounded-lg font-bold">
                🔍
              </button>

              <button onClick={() => setModalNovoCliente(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 rounded-lg font-bold">
                +
              </button>
            </div>

            {clienteId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-bold text-blue-800">Histórico do Cliente</p>
                <p className="text-slate-700">
                  Última compra: <strong>{ultimaCompraCliente ? formatarData(ultimaCompraCliente) : "-"}</strong>
                </p>
                <p className="text-slate-700">
                  Total comprado: <strong>{formatarMoeda(totalCompradoCliente)}</strong>
                </p>
                <p className="text-slate-700">
                  Em aberto: <strong>{formatarMoeda(totalAbertoCliente)}</strong>
                </p>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <h3 className="font-bold text-slate-800 mb-2">Descontos</h3>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Desconto R$</label>
                  <input value={descontoValor} onChange={(e) => setDescontoValor(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg text-slate-900" />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Desconto %</label>
                  <input value={descontoPercentual} onChange={(e) => setDescontoPercentual(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg text-slate-900" />
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="p-2 text-left">Forma</th>
                    <th className="p-2 text-right w-28">Valor</th>
                  </tr>
                </thead>

                <tbody>
                  {[
                    ["Dinheiro", pagDinheiro, setPagDinheiro],
                    ["PIX", pagPix, setPagPix],
                    ["Débito", pagDebito, setPagDebito],
                    ["Crédito", pagCredito, setPagCredito],
                    ["Crediário", pagCrediario, setPagCrediario],
                  ].map(([label, value, setter]: any) => (
                    <tr key={label} className="border-b">
                      <td className="p-2 text-slate-800">{label}</td>
                      <td className="p-2 text-right">
                        <input value={value} onChange={(e) => setter(e.target.value)} className="w-24 border p-2 rounded text-slate-900 text-right" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {converterNumero(pagPix) > 0 && (
              <div className="space-y-3 border border-emerald-200 rounded-lg p-3 bg-emerald-50">
                <p className="font-bold text-emerald-800">PIX QR Code</p>

                <input value={chavePix} onChange={(e) => setChavePix(e.target.value)} placeholder="Chave PIX da empresa" className="w-full border border-slate-300 p-2 rounded-lg text-slate-900" />

                <div className="grid grid-cols-2 gap-2">
                  <input value={nomeRecebedorPix} onChange={(e) => setNomeRecebedorPix(e.target.value)} placeholder="Nome recebedor" className="w-full border border-slate-300 p-2 rounded-lg text-slate-900" />
                  <input value={cidadePix} onChange={(e) => setCidadePix(e.target.value)} placeholder="Cidade" className="w-full border border-slate-300 p-2 rounded-lg text-slate-900" />
                </div>

                {gerarPixCopiaCola() && (
                  <div className="bg-white rounded-xl border p-3 text-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(gerarPixCopiaCola())}`}
                      alt="QR Code PIX"
                      className="mx-auto w-48 h-48"
                    />

                    <p className="text-sm text-slate-600 mt-2">
                      Valor PIX: <strong>{formatarMoeda(converterNumero(pagPix))}</strong>
                    </p>

                    <button type="button" onClick={copiarPix} className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold">
                      Copiar PIX Copia e Cola
                    </button>

                    <button
                      type="button"
                      onClick={() => setPixConfirmado(true)}
                      className={`mt-3 ml-2 px-4 py-2 rounded-lg font-semibold text-white ${pixConfirmado ? "bg-green-700" : "bg-slate-700 hover:bg-slate-800"}`}
                    >
                      {pixConfirmado ? "PIX Confirmado" : "Confirmar Recebimento PIX"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {converterNumero(pagCrediario) > 0 && (
              <div className="space-y-3 border border-blue-200 rounded-lg p-3 bg-blue-50">
                <p className="font-bold text-blue-800">Crediário da Loja</p>

                <input value={parcelas} onChange={(e) => setParcelas(e.target.value)} placeholder="Quantidade de parcelas" className="w-full border border-slate-300 p-2 rounded-lg text-slate-900" />

                <input type="date" value={primeiroVencimento} onChange={(e) => setPrimeiroVencimento(e.target.value)} className="w-full border border-slate-300 p-2 rounded-lg text-slate-900" />
              </div>
            )}

            <div className="border-t pt-3">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal:</span>
                <strong>{formatarMoeda(totalBruto())}</strong>
              </div>

              <div className="flex justify-between text-slate-700">
                <span>Desconto:</span>
                <strong>{formatarMoeda(valorDescontoTotal())}</strong>
              </div>

              <div className="flex justify-between text-slate-700">
                <span>Total Pago:</span>
                <strong>{formatarMoeda(totalPago())}</strong>
              </div>

              <div className="flex justify-between text-red-700">
                <span>Falta:</span>
                <strong>{formatarMoeda(faltaPagar())}</strong>
              </div>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-5">
              <p className="text-sm text-slate-300">TOTAL DA VENDA</p>
              <p className="text-4xl font-bold">{formatarMoeda(totalFinal())}</p>
            </div>

            <div className="bg-green-600 text-white rounded-xl p-5">
              <p className="text-sm text-green-100">TROCO</p>
              <p className="text-5xl font-bold">{formatarMoeda(troco())}</p>
            </div>

            <button
              onClick={finalizarVenda}
              disabled={!caixaAberto}
              className={`w-full px-6 py-4 rounded-lg font-bold text-lg text-white ${
                !caixaAberto ? "bg-slate-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Finalizar Venda - F8
            </button>

            <button onClick={limparVenda} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-lg font-bold">
              Limpar Venda
            </button>
          </div>
        </div>
      </div>

      {modalProdutos && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-5xl p-6 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Pesquisar Produto</h2>

            <input value={pesquisaProduto} onChange={(e) => setPesquisaProduto(e.target.value)} placeholder="Digite nome, código interno ou código de barras" className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 mb-4" autoFocus />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {produtosFiltrados.map((produto) => (
                <button key={produto.id} onClick={() => adicionarProduto(produto)} className="border rounded-xl p-3 flex items-center gap-3 hover:bg-blue-50 text-left">
                  <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {produto.foto_url ? (
                      <img src={produto.foto_url} alt={produto.nome} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-500">Sem foto</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{produto.codigo} - {produto.nome}</p>
                    <p className="text-sm text-slate-600">Estoque: {produto.qtd_atual}</p>
                    <p className="text-lg font-bold text-blue-700">{formatarMoeda(Number(produto.preco_venda || 0))}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={() => setModalProdutos(false)} className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalPesquisarCliente && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl p-6 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Pesquisar Cliente</h2>

            <input value={pesquisaCliente} onChange={(e) => setPesquisaCliente(e.target.value)} placeholder="Buscar por nome, CPF/CNPJ ou WhatsApp" className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 mb-4" autoFocus />

            <table className="w-full">
              <thead>
                <tr className="bg-blue-700 text-white">
                  <th className="p-3 text-left">Cliente</th>
                  <th className="p-3 text-left">CPF/CNPJ</th>
                  <th className="p-3 text-left">WhatsApp</th>
                  <th className="p-3 text-center">Ação</th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="border-b">
                    <td className="p-3 text-slate-900">{cliente.nome}</td>
                    <td className="p-3 text-slate-800">{cliente.cpf_cnpj || "-"}</td>
                    <td className="p-3 text-slate-800">{cliente.whatsapp || "-"}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => selecionarCliente(cliente)} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded">
                        Selecionar
                      </button>
                    </td>
                  </tr>
                ))}

                {clientesFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-700">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalPesquisarCliente(false)} className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg">
                Fechar
              </button>

              <button
                onClick={() => {
                  setModalPesquisarCliente(false);
                  setNovoClienteDocumento(pesquisaCliente);
                  setModalNovoCliente(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
              >
                + Cadastrar por CPF/CNPJ
              </button>
            </div>
          </div>
        </div>
      )}

      {modalNovoCliente && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Novo Cliente</h2>

            <input value={novoClienteDocumento} onChange={(e) => setNovoClienteDocumento(e.target.value)} placeholder="CPF / CNPJ" className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 mb-3" autoFocus />

            <input value={novoClienteNome} onChange={(e) => setNovoClienteNome(e.target.value)} placeholder="Nome do Cliente" className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 mb-3" />

            <input value={novoClienteWhatsapp} onChange={(e) => setNovoClienteWhatsapp(e.target.value)} placeholder="WhatsApp" className="w-full border border-slate-300 p-3 rounded-lg text-slate-900" />

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalNovoCliente(false)} className="bg-slate-500 hover:bg-slate-600 text-white px-5 py-2 rounded-lg">
                Cancelar
              </button>

              <button onClick={salvarNovoCliente} className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg">
                Salvar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAbrirCaixa && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Abrir Caixa</h2>

            <input value={operadorCaixa} onChange={(e) => setOperadorCaixa(e.target.value)} placeholder="Operador" className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 mb-3" />

            <input value={valorAbertura} onChange={(e) => setValorAbertura(e.target.value)} placeholder="Valor de abertura" className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 mb-3" />

            <input value={observacaoCaixa} onChange={(e) => setObservacaoCaixa(e.target.value)} placeholder="Observação" className="w-full border border-slate-300 p-3 rounded-lg text-slate-900" />

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalAbrirCaixa(false)} className="bg-slate-500 hover:bg-slate-600 text-white px-5 py-2 rounded-lg">
                Cancelar
              </button>

              <button onClick={abrirCaixa} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg">
                Abrir Caixa
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMovimentoCaixa && caixaAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {tipoMovimentoCaixa === "sangria" ? "Registrar Sangria" : "Registrar Suprimento"}
            </h2>

            <input value={valorMovimentoCaixa} onChange={(e) => setValorMovimentoCaixa(e.target.value)} placeholder="Valor" className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 mb-3" />

            <input value={descricaoMovimentoCaixa} onChange={(e) => setDescricaoMovimentoCaixa(e.target.value)} placeholder="Descrição" className="w-full border border-slate-300 p-3 rounded-lg text-slate-900" />

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalMovimentoCaixa(false)} className="bg-slate-500 hover:bg-slate-600 text-white px-5 py-2 rounded-lg">
                Cancelar
              </button>

              <button
                onClick={registrarMovimentoCaixa}
                className={`text-white px-5 py-2 rounded-lg ${tipoMovimentoCaixa === "sangria" ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalFecharCaixa && caixaAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl p-6 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Fechamento Inteligente de Caixa</h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
              {[
                ["Dinheiro", saldoEsperado(), fechDinheiro, setFechDinheiro],
                ["PIX", totalPorForma("pix"), fechPix, setFechPix],
                ["Débito", totalPorForma("debito"), fechDebito, setFechDebito],
                ["Crédito", totalPorForma("credito"), fechCredito, setFechCredito],
                ["Crediário", totalPorForma("crediario"), fechCrediario, setFechCrediario],
              ].map(([label, sistema, informado, setter]: any) => (
                <div key={label} className="border rounded-xl p-3 bg-slate-50">
                  <p className="font-bold text-slate-900">{label}</p>
                  <p className="text-sm text-slate-600">Sistema: {formatarMoeda(Number(sistema))}</p>
                  <input value={informado} onChange={(e) => setter(e.target.value)} className="w-full border p-2 mt-2 rounded text-slate-900" />
                </div>
              ))}
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-5 mb-4">
              <div className="flex justify-between text-lg">
                <span>Total Informado:</span>
                <strong>{formatarMoeda(totalInformadoFechamento())}</strong>
              </div>

              <div
                className={`flex justify-between text-2xl font-bold mt-3 ${
                  diferencaFechamento() === 0
                    ? "text-green-400"
                    : diferencaFechamento() < 0
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                <span>Diferença:</span>
                <span>{formatarMoeda(diferencaFechamento())}</span>
              </div>
            </div>

            <input value={observacaoCaixa} onChange={(e) => setObservacaoCaixa(e.target.value)} placeholder="Observação do fechamento" className="w-full border border-slate-300 p-3 rounded-lg text-slate-900" />

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalFecharCaixa(false)} className="bg-slate-500 hover:bg-slate-600 text-white px-5 py-2 rounded-lg">
                Cancelar
              </button>

              <button onClick={fecharCaixa} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg">
                Confirmar Fechamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Resumo({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: string;
  cor: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4 border">
      <p className="text-sm text-slate-500">{titulo}</p>
      <h3 className={`text-2xl font-bold ${cor}`}>{valor}</h3>
    </div>
  );
}
