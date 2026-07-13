"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";
import { formatarData, formatarMoeda } from "../../../components/global/THFormat";

type Cliente = {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
};

type Produto = {
  id: string;
  codigo: string | null;
  codigo_barras: string | null;
  nome: string;
};

type Venda = {
  id: string;
  numero_venda: number | null;
  empresa_id: string;
  cliente_id: string | null;
  caixa_id: string | null;
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
  empresa_id: string | null;
  produto_nome?: string;
  produto_codigo?: string | null;
  produto_barras?: string | null;
};

type PagamentoVenda = {
  id: string;
  venda_id: string;
  forma_pagamento: string;
  valor: number;
  empresa_id: string | null;
};

type VendaDetalhada = Venda & {
  cliente_nome: string;
  cliente_cpf: string;
  cliente_telefone: string;
  itens: ItemVenda[];
  pagamentos: PagamentoVenda[];
};

type Devolucao = {
  id: string;
  venda_id: string;
  cliente_id: string | null;
  caixa_id: string | null;
  tipo_devolucao: string;
  motivo: string;
  valor_total: number;
  status: string;
  usuario: string | null;
  created_at: string | null;
};

export default function DevolucoesPage() {
  const [vendas, setVendas] = useState<VendaDetalhada[]>([]);
  const [devolucoes, setDevolucoes] = useState<Devolucao[]>([]);
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [vendaSelecionada, setVendaSelecionada] = useState<VendaDetalhada | null>(null);
  const [quantidades, setQuantidades] = useState<Record<string, string>>({});
  const [motivo, setMotivo] = useState("Cliente desistiu");
  const [motivoOutro, setMotivoOutro] = useState("");
  const [tipoDevolucao, setTipoDevolucao] = useState<"estorno" | "credito" | "troca">("estorno");
  const [loginAutorizador, setLoginAutorizador] = useState("");
  const [senhaAutorizador, setSenhaAutorizador] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [processando, setProcessando] = useState(false);

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
      if (!usuario) return "Admin";
      const dados = JSON.parse(usuario);
      return dados.nome || dados.email || "Admin";
    } catch {
      return "Admin";
    }
  }

  function converterNumero(valor: string) {
    return Number(String(valor || "0").replace(",", "."));
  }

  function formatarNumeroVenda(numero: number | null | undefined) {
    if (!numero) return "-";
    return String(numero).padStart(6, "0");
  }

  function identificacaoVenda(venda?: VendaDetalhada | null) {
    if (!venda) return "-";

    if (venda.numero_venda) {
      return `Venda nº ${formatarNumeroVenda(venda.numero_venda)}`;
    }

    return `Venda ${venda.id}`;
  }

  async function saldoCreditoCliente(clienteId: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return 0;

    try {
      const { data, error } = await supabase.rpc("saldo_credito_cliente", {
        p_empresa_id: empresaId,
        p_cliente_id: clienteId,
      });

      if (error) return 0;

      return Number(data || 0);
    } catch {
      return 0;
    }
  }

  async function registrarAuditoria(acao: string, descricao: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    try {
      await supabase.from("auditoria_saas").insert([
        {
          empresa_id: empresaId,
          usuario: operadorAtual(),
          acao,
          descricao,
        },
      ]);
    } catch {
      // Não trava a devolução se auditoria não existir.
    }
  }

  function limparSelecao() {
    setVendaSelecionada(null);
    setQuantidades({});
    setMotivo("Cliente desistiu");
    setMotivoOutro("");
    setTipoDevolucao("estorno");
    setLoginAutorizador("");
    setSenhaAutorizador("");
  }

  async function carregarVendas() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setCarregando(true);

    let vendasQuery = supabase
      .from("vendas")
      .select("id,numero_venda,empresa_id,cliente_id,caixa_id,valor_total,desconto,forma_pagamento,status,created_at")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (dataInicio) {
      vendasQuery = vendasQuery.gte("created_at", `${dataInicio}T00:00:00`);
    }

    if (dataFim) {
      vendasQuery = vendasQuery.lte("created_at", `${dataFim}T23:59:59`);
    }

    const vendasReq = await vendasQuery;

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

      if (!produtosReq.error) {
        produtos = produtosReq.data || [];
      }
    }

    let clientes: Cliente[] = [];

    if (clienteIds.length > 0) {
      const clientesReq = await supabase
        .from("clientes")
        .select("id,nome,cpf_cnpj,telefone")
        .eq("empresa_id", empresaId)
        .in("id", clienteIds);

      if (!clientesReq.error) {
        clientes = clientesReq.data || [];
      }
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
            ...item,
            quantidade: Number(item.quantidade || 0),
            valor_unitario: Number(item.valor_unitario || 0),
            subtotal: Number(item.subtotal || 0),
            produto_nome: produto?.nome || "Produto",
            produto_codigo: produto?.codigo || "-",
            produto_barras: produto?.codigo_barras || "-",
          };
        });

      return {
        ...venda,
        numero_venda: venda.numero_venda ? Number(venda.numero_venda) : null,
        valor_total: Number(venda.valor_total || 0),
        desconto: Number(venda.desconto || 0),
        cliente_nome: cliente?.nome || "Consumidor Final",
        cliente_cpf: cliente?.cpf_cnpj || "",
        cliente_telefone: cliente?.telefone || "",
        itens,
        pagamentos: pagamentos.filter((pag: any) => pag.venda_id === venda.id),
      };
    });

    setVendas(vendasMontadas);
    setCarregando(false);
  }

  async function carregarDevolucoes() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { data, error } = await supabase
      .from("devolucoes")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      // Caso o usuário ainda não tenha executado o SQL
      console.warn("Tabela devolucoes ainda não criada:", error.message);
      setDevolucoes([]);
      return;
    }

    setDevolucoes(data || []);
  }

  async function validarAutorizador() {
    const empresaId = empresaAtualId();
    if (!empresaId) return null;

    if (!loginAutorizador.trim() || !senhaAutorizador.trim()) {
      alert("Informe usuário/e-mail e senha do gerente/autorizador.");
      return null;
    }

    const { data: usuarios, error } = await supabase.rpc("verificar_login", {
      p_login: loginAutorizador.trim().toLowerCase(),
      p_senha: senhaAutorizador.trim(),
      p_empresa_id: empresaId,
    });

    const data = usuarios && usuarios[0];

    if (error || !data) {
      alert("Usuário ou senha do autorizador inválidos.");
      return null;
    }

    const perfil = String(data.perfil || "").toLowerCase();

    if (
      perfil &&
      !perfil.includes("admin") &&
      !perfil.includes("gerente") &&
      !perfil.includes("super")
    ) {
      alert("Usuário sem permissão de gerente/administrador.");
      return null;
    }

    return data;
  }

  function abrirVenda(venda: VendaDetalhada) {
    const qtds: Record<string, string> = {};

    venda.itens.forEach((item) => {
      qtds[item.id] = "0";
    });

    setVendaSelecionada(venda);
    setQuantidades(qtds);
    setMotivo("Cliente desistiu");
    setMotivoOutro("");
    setTipoDevolucao("estorno");
    setLoginAutorizador("");
    setSenhaAutorizador("");
  }

  function selecionarVendaInteira() {
    if (!vendaSelecionada) return;

    const qtds: Record<string, string> = {};

    vendaSelecionada.itens.forEach((item) => {
      qtds[item.id] = String(item.quantidade).replace(".", ",");
    });

    setQuantidades(qtds);
  }

  function itensDevolver() {
    if (!vendaSelecionada) return [];

    return vendaSelecionada.itens
      .map((item) => {
        const quantidadeDevolver = converterNumero(quantidades[item.id] || "0");
        const subtotalDevolver = quantidadeDevolver * Number(item.valor_unitario || 0);

        return {
          ...item,
          quantidade_devolver: quantidadeDevolver,
          subtotal_devolver: subtotalDevolver,
        };
      })
      .filter((item) => item.quantidade_devolver > 0);
  }

  function totalDevolucao() {
    return itensDevolver().reduce(
      (total, item) => total + Number(item.subtotal_devolver || 0),
      0
    );
  }

  function motivoFinal() {
    return motivo === "Outros" ? motivoOutro.trim() : motivo;
  }

  async function confirmarDevolucao() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!vendaSelecionada) {
      alert("Selecione uma venda.");
      return;
    }

    const itens = itensDevolver();

    if (itens.length === 0) {
      alert("Informe a quantidade de pelo menos um item.");
      return;
    }

    for (const item of itens) {
      if (item.quantidade_devolver > Number(item.quantidade || 0)) {
        alert(`Quantidade maior que a vendida para o produto ${item.produto_nome}.`);
        return;
      }
    }

    if (!motivoFinal()) {
      alert("Informe o motivo da devolução.");
      return;
    }

    if (tipoDevolucao === "credito" && !vendaSelecionada.cliente_id) {
      alert("Para gerar crédito, a venda precisa ter cliente cadastrado.");
      return;
    }

    const autorizador = await validarAutorizador();
    if (!autorizador) return;

    const confirmar = confirm(
      `Confirmar devolução?\n\n${identificacaoVenda(vendaSelecionada)}\nValor: ${formatarMoeda(totalDevolucao())}\nTipo: ${
        tipoDevolucao === "estorno"
          ? "Estorno dinheiro"
          : tipoDevolucao === "credito"
          ? "Crédito cliente"
          : "Troca por produto"
      }`
    );

    if (!confirmar) return;

    setProcessando(true);

    try {
      const caixaId = vendaSelecionada.caixa_id;

      const devolucaoReq = await supabase
        .from("devolucoes")
        .insert([
          {
            empresa_id: empresaId,
            venda_id: vendaSelecionada.id,
            cliente_id: vendaSelecionada.cliente_id,
            caixa_id: caixaId,
            tipo_devolucao: tipoDevolucao,
            motivo: motivoFinal(),
            valor_total: totalDevolucao(),
            status: "finalizada",
            usuario: autorizador.nome || operadorAtual(),
          },
        ])
        .select("id")
        .single();

      if (devolucaoReq.error) {
        throw new Error(
          "Erro ao gravar histórico da devolução. Execute o SQL do módulo primeiro. " +
            devolucaoReq.error.message
        );
      }

      const devolucaoId = devolucaoReq.data.id;

      const itensInsert = itens.map((item) => ({
        empresa_id: empresaId,
        devolucao_id: devolucaoId,
        venda_id: vendaSelecionada.id,
        item_venda_id: item.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade_devolver,
        valor_unitario: item.valor_unitario,
        subtotal: item.subtotal_devolver,
      }));

      const itensDevReq = await supabase.from("itens_devolucao").insert(itensInsert);

      if (itensDevReq.error) {
        throw new Error(itensDevReq.error.message);
      }

      for (const item of itens) {
        const estoqueReq = await supabase.from("movimentacoes_estoque").insert([
          {
            empresa_id: empresaId,
            produto_id: item.produto_id,
            tipo: "entrada",
            quantidade: item.quantidade_devolver,
            custo_unitario: 0,
            nota_fiscal: null,
            fornecedor_id: null,
            observacao: `Devolução ${devolucaoId} | ${identificacaoVenda(vendaSelecionada)} | ${motivoFinal()}`,
            usuario: autorizador.nome || operadorAtual(),
          },
        ]);

        if (estoqueReq.error) {
          throw new Error(estoqueReq.error.message);
        }
      }

      if (tipoDevolucao === "estorno") {
        const caixaReq = await supabase.from("movimentacoes_caixa").insert([
          {
            caixa_id: caixaId,
            empresa_id: empresaId,
            tipo: "sangria",
            valor: totalDevolucao(),
            descricao: `Estorno devolução ${devolucaoId} ${identificacaoVenda(vendaSelecionada)}`,
            usuario: autorizador.nome || operadorAtual(),
          },
        ]);

        if (caixaReq.error) {
          throw new Error(caixaReq.error.message);
        }
      }

      if (tipoDevolucao === "credito") {
        if (!vendaSelecionada.cliente_id) {
          throw new Error("Para gerar crédito, a venda precisa ter cliente cadastrado.");
        }

        const valorCredito = totalDevolucao();
        const saldoAtual = await saldoCreditoCliente(vendaSelecionada.cliente_id);
        const saldoApos = Number((saldoAtual + valorCredito).toFixed(2));
        const descricaoCredito = `Crédito de devolução ${devolucaoId} - ${identificacaoVenda(vendaSelecionada)}`;

        const creditoClienteReq = await supabase.from("creditos_cliente").insert([
          {
            empresa_id: empresaId,
            cliente_id: vendaSelecionada.cliente_id,
            venda_id: vendaSelecionada.id,
            devolucao_id: devolucaoId,
            origem: "devolucao",
            tipo: "entrada",
            valor: valorCredito,
            saldo_apos: saldoApos,
            descricao: descricaoCredito,
          },
        ]);

        if (creditoClienteReq.error) {
          throw new Error("Erro ao gerar crédito do cliente: " + creditoClienteReq.error.message);
        }

        const creditoFinanceiroReq = await supabase.from("contas_receber").insert([
          {
            empresa_id: empresaId,
            cliente_id: vendaSelecionada.cliente_id,
            descricao: descricaoCredito,
            valor: valorCredito * -1,
            vencimento: new Date().toISOString().split("T")[0],
            status: "credito",
          },
        ]);

        if (creditoFinanceiroReq.error) {
          throw new Error("Erro ao registrar crédito no financeiro: " + creditoFinanceiroReq.error.message);
        }
      }

      const devolucaoTotal =
        itens.length === vendaSelecionada.itens.length &&
        itens.every((item) => {
          const original = vendaSelecionada.itens.find((vendido) => vendido.id === item.id);
          return Number(item.quantidade_devolver) === Number(original?.quantidade || 0);
        });

      const vendaUpdate = await supabase
        .from("vendas")
        .update({
          status: devolucaoTotal ? "devolvida" : "devolucao_parcial",
        })
        .eq("empresa_id", empresaId)
        .eq("id", vendaSelecionada.id);

      if (vendaUpdate.error) {
        throw new Error(vendaUpdate.error.message);
      }

      await registrarAuditoria(
        "DEVOLUCAO_REGISTRADA",
        `${identificacaoVenda(vendaSelecionada)} | Tipo: ${tipoDevolucao} | Valor: ${formatarMoeda(totalDevolucao())} | Motivo: ${motivoFinal()}`
      );

      imprimirComprovanteDevolucao(devolucaoId, itens);

      alert("Devolução registrada com sucesso!");

      limparSelecao();
      await carregarVendas();
      await carregarDevolucoes();
    } catch (error: any) {
      alert("Erro ao confirmar devolução: " + error.message);
    }

    setProcessando(false);
  }

  function imprimirComprovanteDevolucao(devolucaoId: string, itens: any[]) {
    const janela = window.open("", "_blank", "width=420,height=700");

    if (!janela || !vendaSelecionada) {
      alert("Pop-up bloqueado. Libere pop-ups para imprimir o comprovante.");
      return;
    }

    const linhasItens = itens
      .map(
        (item) => `
          <tr>
            <td>${item.quantidade_devolver}x ${item.produto_nome}</td>
            <td style="text-align:right;">${formatarMoeda(item.subtotal_devolver)}</td>
          </tr>
        `
      )
      .join("");

    janela.document.open();
    janela.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Comprovante de Devolução</title>
          <style>
            body { font-family: Arial, sans-serif; width: 300px; margin: 0 auto; color: #111827; font-size: 12px; }
            .center { text-align: center; }
            h1 { font-size: 16px; margin: 4px 0; }
            p { margin: 3px 0; }
            hr { border: none; border-top: 1px dashed #111827; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 3px 0; vertical-align: top; }
            .total { font-size: 16px; font-weight: bold; }
            .small { font-size: 11px; }
            @media print { body { width: 80mm; } button { display:none; } }
          </style>
        </head>
        <body>
          <div class="center">
            <h1>COMPROVANTE DE DEVOLUÇÃO</h1>
            <p class="small">Th Cloud</p>
          </div>

          <hr />

          <p><strong>Devolução:</strong> ${devolucaoId}</p>
          <p><strong>Venda:</strong> ${identificacaoVenda(vendaSelecionada)}</p>
          <p><strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}</p>
          <p><strong>Cliente:</strong> ${vendaSelecionada.cliente_nome}</p>
          <p><strong>Tipo:</strong> ${
            tipoDevolucao === "estorno"
              ? "Estorno dinheiro"
              : tipoDevolucao === "credito"
              ? "Crédito cliente"
              : "Troca por produto"
          }</p>
          <p><strong>Motivo:</strong> ${motivoFinal()}</p>

          <hr />

          <table>
            <tbody>${linhasItens}</tbody>
          </table>

          <hr />

          <table>
            <tr class="total">
              <td>TOTAL DEVOLVIDO</td>
              <td style="text-align:right;">${formatarMoeda(totalDevolucao())}</td>
            </tr>
          </table>

          <hr />

          <p class="center small">Assinatura Cliente</p>
          <br />
          <p>____________________________</p>

          <br />

          <p class="center small">Autorizado por: ${operadorAtual()}</p>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
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
        venda.id.toLowerCase().includes(termo) ||
        formatarNumeroVenda(venda.numero_venda).toLowerCase().includes(termo) ||
        String(venda.numero_venda || "").toLowerCase().includes(termo) ||
        venda.cliente_nome.toLowerCase().includes(termo) ||
        venda.cliente_cpf.toLowerCase().includes(termo) ||
        venda.cliente_telefone.toLowerCase().includes(termo) ||
        itensTexto.includes(termo) ||
        String(venda.valor_total).includes(termo)
      );
    });
  }, [vendas, busca]);

  useEffect(() => {
    carregarVendas();
    carregarDevolucoes();
  }, []);

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-8">
        <p className="text-blue-600 font-bold">Vendas</p>

        <h1 className="text-4xl font-black text-slate-900 mt-2">
          Devoluções
        </h1>

        <p className="text-slate-500 mt-2">
          Pesquise a venda, selecione os itens devolvidos, devolva ao estoque e registre estorno, crédito ou troca.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-black text-slate-900 mb-5">
            Pesquisar Venda
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nº venda, código de barras, CPF, cliente, produto..."
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
          </div>

          <button
            onClick={carregarVendas}
            className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-2xl font-bold mb-5"
          >
            {carregando ? "Carregando..." : "Pesquisar"}
          </button>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-3 text-left">Venda</th>
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-left">Cliente</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Itens</th>
                  <th className="p-3 text-right">Valor</th>
                  <th className="p-3 text-center">Ação</th>
                </tr>
              </thead>

              <tbody>
                {vendasFiltradas.map((venda) => (
                  <tr key={venda.id} className="border-b hover:bg-slate-50 align-top">
                    <td className="p-3 font-bold text-slate-900">
                      <p>{venda.numero_venda ? `Venda nº ${formatarNumeroVenda(venda.numero_venda)}` : "Venda sem número"}</p>
                      <p className="text-[11px] text-slate-400 font-medium">ID: {venda.id}</p>
                    </td>
                    <td className="p-3 text-slate-700">{formatarData(venda.created_at)}</td>
                    <td className="p-3 text-slate-700">
                      <p className="font-bold">{venda.cliente_nome}</p>
                      <p className="text-xs text-slate-500">{venda.cliente_cpf || "-"}</p>
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
                    <td className="p-3 text-right text-green-700 font-black">
                      {formatarMoeda(venda.valor_total)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => abrirVenda(venda)}
                        disabled={venda.status === "devolvida" || venda.status === "cancelada"}
                        className={`px-4 py-2 rounded-xl font-bold ${
                          venda.status === "devolvida" || venda.status === "cancelada"
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-red-100 hover:bg-red-200 text-red-800"
                        }`}
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}

                {vendasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Nenhuma venda encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm">
          <p className="text-slate-300 font-bold">Resumo da Devolução</p>

          <h3 className="text-2xl font-black mt-2">
            {vendaSelecionada ? identificacaoVenda(vendaSelecionada) : "Nenhuma venda"}
          </h3>

          <div className="mt-5 space-y-3">
            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Cliente</p>
              <p className="font-black">{vendaSelecionada?.cliente_nome || "-"}</p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Total devolução</p>
              <p className="text-3xl font-black text-red-400">
                {formatarMoeda(totalDevolucao())}
              </p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4">
              <p className="text-slate-400 text-sm">Forma</p>
              <p className="font-black">
                {tipoDevolucao === "estorno"
                  ? "Estorno dinheiro"
                  : tipoDevolucao === "credito"
                  ? "Crédito cliente"
                  : "Troca por produto"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {vendaSelecionada && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                {identificacaoVenda(vendaSelecionada)}
              </h2>

              <p className="text-slate-500">
                Selecione os produtos e quantidades que serão devolvidos.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={selecionarVendaInteira}
                className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold"
              >
                Devolver tudo
              </button>

              <button
                onClick={limparSelecao}
                className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-5 py-3 rounded-2xl font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl mb-6">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="bg-blue-700 text-white">
                  <th className="p-3 text-left">Produto</th>
                  <th className="p-3 text-right">Qtd Vendida</th>
                  <th className="p-3 text-right">Qtd Devolver</th>
                  <th className="p-3 text-right">Unitário</th>
                  <th className="p-3 text-right">Subtotal Devolução</th>
                </tr>
              </thead>

              <tbody>
                {vendaSelecionada.itens.map((item) => {
                  const qtdDev = converterNumero(quantidades[item.id] || "0");

                  return (
                    <tr key={item.id} className="border-b">
                      <td className="p-3 text-slate-800 font-medium">
                        <p className="font-black">{item.produto_nome}</p>
                        <p className="text-xs text-slate-500">
                          Código: {item.produto_codigo || "-"} | Barras: {item.produto_barras || "-"}
                        </p>
                      </td>

                      <td className="p-3 text-right text-slate-800">
                        {item.quantidade}
                      </td>

                      <td className="p-3 text-right">
                        <input
                          value={quantidades[item.id] || "0"}
                          onChange={(e) =>
                            setQuantidades({
                              ...quantidades,
                              [item.id]: e.target.value,
                            })
                          }
                          className="w-28 border border-slate-300 rounded-xl p-2 text-right text-slate-900"
                        />
                      </td>

                      <td className="p-3 text-right text-slate-800">
                        {formatarMoeda(item.valor_unitario)}
                      </td>

                      <td className="p-3 text-right text-red-700 font-black">
                        {formatarMoeda(qtdDev * item.valor_unitario)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Motivo
              </label>

              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 bg-white"
              >
                <option>Produto avariado</option>
                <option>Cliente desistiu</option>
                <option>Erro de venda</option>
                <option>Troca</option>
                <option>Outros</option>
              </select>

              {motivo === "Outros" && (
                <input
                  value={motivoOutro}
                  onChange={(e) => setMotivoOutro(e.target.value)}
                  placeholder="Informe o motivo"
                  className="w-full mt-3 border border-slate-300 p-3 rounded-2xl text-slate-900"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Forma de Devolução
              </label>

              <select
                value={tipoDevolucao}
                onChange={(e) => setTipoDevolucao(e.target.value as any)}
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900 bg-white"
              >
                <option value="estorno">Estornar dinheiro</option>
                <option value="credito">Crédito cliente</option>
                <option value="troca">Troca por produto</option>
              </select>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-sm text-slate-500 font-bold">
                Total da Devolução
              </p>

              <p className="text-3xl font-black text-red-700">
                {formatarMoeda(totalDevolucao())}
              </p>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Usuário/E-mail Gerente
              </label>

              <input
                value={loginAutorizador}
                onChange={(e) => setLoginAutorizador(e.target.value)}
                placeholder="Usuário ou e-mail"
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Senha Gerente
              </label>

              <input
                type="password"
                value={senhaAutorizador}
                onChange={(e) => setSenhaAutorizador(e.target.value)}
                placeholder="Senha"
                className="w-full border border-slate-300 p-3 rounded-2xl text-slate-900"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={confirmarDevolucao}
                disabled={processando}
                className={`w-full text-white px-6 py-4 rounded-2xl font-black ${
                  processando
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {processando ? "Processando..." : "Confirmar Devolução"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mt-8">
        <h2 className="text-2xl font-black text-slate-900 mb-5">
          Últimas Devoluções
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Venda</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-left">Motivo</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3 text-left">Usuário</th>
              </tr>
            </thead>

            <tbody>
              {devolucoes.map((dev) => (
                <tr key={dev.id} className="border-b hover:bg-slate-50">
                  <td className="p-3 text-slate-800">{formatarData(dev.created_at)}</td>
                  <td className="p-3 text-slate-800 font-bold">{dev.venda_id}</td>
                  <td className="p-3 text-slate-800">{dev.tipo_devolucao}</td>
                  <td className="p-3 text-slate-800">{dev.motivo}</td>
                  <td className="p-3 text-right text-red-700 font-black">
                    {formatarMoeda(Number(dev.valor_total || 0))}
                  </td>
                  <td className="p-3 text-slate-800">{dev.usuario || "-"}</td>
                </tr>
              ))}

              {devolucoes.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Nenhuma devolução registrada ainda.
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
