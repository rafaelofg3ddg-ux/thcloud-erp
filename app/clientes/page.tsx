"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { formatarData, formatarMoeda } from "../../components/global/THFormat";

type Cliente = {
  id: string;
  empresa_id: string;
  tipo_cliente: string | null;
  nome: string;
  cpf_cnpj: string | null;
  razao_social: string | null;
  nome_fantasia: string | null;
  inscricao_estadual: string | null;
  rg_ie: string | null;
  email: string | null;
  telefone: string | null;
  whatsapp: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  limite_credito: number | null;
  data_nascimento: string | null;
  observacao: string | null;
  ativo: boolean | null;
  created_at: string | null;
};

type VendaCliente = {
  id: string;
  numero_venda?: number | null;
  valor_total: number;
  created_at: string | null;
  status: string | null;
};

type ContaCliente = {
  id: string;
  valor: number;
  status: string | null;
  vencimento: string | null;
  descricao: string | null;
};

type CreditoCliente = {
  id: string;
  origem: string | null;
  tipo: string | null;
  valor: number;
  saldo_apos: number;
  descricao: string | null;
  created_at: string | null;
};

const clienteVazio = {
  id: "",
  tipo_cliente: "fisica",
  nome: "",
  cpf_cnpj: "",
  razao_social: "",
  nome_fantasia: "",
  inscricao_estadual: "",
  rg_ie: "",
  email: "",
  telefone: "",
  whatsapp: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  limite_credito: "0",
  data_nascimento: "",
  observacao: "",
  ativo: true,
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [modalCliente, setModalCliente] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [editandoId, setEditandoId] = useState("");
  const [form, setForm] = useState(clienteVazio);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [vendasCliente, setVendasCliente] = useState<VendaCliente[]>([]);
  const [contasCliente, setContasCliente] = useState<ContaCliente[]>([]);
  const [creditosCliente, setCreditosCliente] = useState<CreditoCliente[]>([]);
  const [saldoCreditoCliente, setSaldoCreditoCliente] = useState(0);
  const [saldosCredito, setSaldosCredito] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(false);
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [consultandoCnpj, setConsultandoCnpj] = useState(false);

  function empresaAtualId() {
    try {
      const empresaStorage =
        sessionStorage.getItem("th_empresa") ||
        localStorage.getItem("th_empresa");

      if (empresaStorage) {
        const empresa = JSON.parse(empresaStorage);
        if (empresa.id) return empresa.id;
        if (empresa.empresa_id) return empresa.empresa_id;
      }

      const usuarioStorage =
        sessionStorage.getItem("th_usuario") ||
        localStorage.getItem("th_usuario");

      if (usuarioStorage) {
        const usuario = JSON.parse(usuarioStorage);
        if (usuario.empresa_id) return usuario.empresa_id;
        if (usuario.empresa?.id) return usuario.empresa.id;
      }

      const empresaIdDireto =
        sessionStorage.getItem("empresa_id") ||
        sessionStorage.getItem("th_empresa_id") ||
        localStorage.getItem("empresa_id") ||
        localStorage.getItem("th_empresa_id");

      if (empresaIdDireto) return empresaIdDireto;

      alert("Empresa não identificada. Faça login novamente.");
      return null;
    } catch {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }
  }

  async function carregarSaldoCreditoCliente(clienteId: string) {
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

  async function carregarSaldosCreditoClientes(listaClientes: Cliente[]) {
    const empresaId = empresaAtualId();
    if (!empresaId || listaClientes.length === 0) {
      setSaldosCredito({});
      return;
    }

    const saldos: Record<string, number> = {};

    await Promise.all(
      listaClientes.map(async (cliente) => {
        try {
          const { data, error } = await supabase.rpc("saldo_credito_cliente", {
            p_empresa_id: empresaId,
            p_cliente_id: cliente.id,
          });
          saldos[cliente.id] = error ? 0 : Number(data || 0);
        } catch {
          saldos[cliente.id] = 0;
        }
      })
    );

    setSaldosCredito(saldos);
  }

  function converterNumero(valor: string) {
    return Number(String(valor || "0").replace(",", "."));
  }

  function limparNumero(valor: string) {
    return String(valor || "").replace(/\D/g, "");
  }

  function paraMaiusculo(valor: string) {
    return String(valor || "").toLocaleUpperCase("pt-BR");
  }

  function atualizarForm(campo: keyof typeof clienteVazio, valor: string | boolean) {
    if (typeof valor === "boolean") {
      setForm((atual) => ({ ...atual, [campo]: valor }));
      return;
    }

    const camposSemMaiuscula = new Set([
      "email",
      "limite_credito",
      "data_nascimento",
      "tipo_cliente",
    ]);

    setForm((atual) => ({
      ...atual,
      [campo]: camposSemMaiuscula.has(String(campo))
        ? valor
        : paraMaiusculo(valor),
    }));
  }

  function formatarDocumento(valor: string | null) {
    const numeros = limparNumero(valor || "");

    if (numeros.length === 11) {
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    if (numeros.length === 14) {
      return numeros.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      );
    }

    return valor || "-";
  }

  async function carregarClientes() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setCarregando(true);

    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("nome");

    if (error) {
      alert("Erro ao carregar clientes: " + error.message);
      setCarregando(false);
      return;
    }

    const lista = (data || []) as Cliente[];
    setClientes(lista);
    await carregarSaldosCreditoClientes(lista);
    setCarregando(false);
  }

  function abrirNovoCliente() {
    setEditandoId("");
    setForm(clienteVazio);
    setModalCliente(true);
  }

  function abrirEditarCliente(cliente: Cliente) {
    setEditandoId(cliente.id);

    setForm({
      id: cliente.id,
      tipo_cliente: cliente.tipo_cliente || "fisica",
      nome: cliente.nome || "",
      cpf_cnpj: cliente.cpf_cnpj || "",
      razao_social: cliente.razao_social || "",
      nome_fantasia: cliente.nome_fantasia || "",
      inscricao_estadual: cliente.inscricao_estadual || cliente.rg_ie || "",
      rg_ie: cliente.rg_ie || "",
      email: cliente.email || "",
      telefone: cliente.telefone || "",
      whatsapp: cliente.whatsapp || "",
      cep: cliente.cep || "",
      endereco: cliente.endereco || "",
      numero: cliente.numero || "",
      complemento: cliente.complemento || "",
      bairro: cliente.bairro || "",
      cidade: cliente.cidade || "",
      uf: cliente.uf || "",
      limite_credito: String(cliente.limite_credito || 0).replace(".", ","),
      data_nascimento: cliente.data_nascimento || "",
      observacao: cliente.observacao || "",
      ativo: cliente.ativo !== false,
    });

    setModalCliente(true);
  }

  async function salvarCliente() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!form.nome.trim() && !form.razao_social.trim() && !form.nome_fantasia.trim()) {
      alert("Informe o nome do cliente ou razão social.");
      return;
    }

    const nomePrincipal =
      form.tipo_cliente === "juridica"
        ? form.nome_fantasia.trim() || form.razao_social.trim() || form.nome.trim()
        : form.nome.trim();

    const dados = {
      empresa_id: empresaId,
      tipo_cliente: form.tipo_cliente,
      nome: nomePrincipal,
      cpf_cnpj: form.cpf_cnpj.trim() || null,
      razao_social: form.razao_social.trim() || null,
      nome_fantasia: form.nome_fantasia.trim() || null,
      inscricao_estadual: form.inscricao_estadual.trim() || null,
      rg_ie: form.rg_ie.trim() || form.inscricao_estadual.trim() || null,
      email: form.email.trim() || null,
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      cep: form.cep.trim() || null,
      endereco: form.endereco.trim() || null,
      numero: form.numero.trim() || null,
      complemento: form.complemento.trim() || null,
      bairro: form.bairro.trim() || null,
      cidade: form.cidade.trim() || null,
      uf: form.uf.trim().toUpperCase() || null,
      limite_credito: converterNumero(form.limite_credito),
      data_nascimento: form.data_nascimento || null,
      observacao: form.observacao.trim() || null,
      ativo: form.ativo,
      updated_at: new Date().toISOString(),
    };

    if (editandoId) {
      const { error } = await supabase
        .from("clientes")
        .update(dados)
        .eq("empresa_id", empresaId)
        .eq("id", editandoId);

      if (error) {
        alert("Erro ao alterar cliente: " + error.message);
        return;
      }

      alert("Cliente alterado com sucesso!");
    } else {
      const { error } = await supabase.from("clientes").insert([dados]);

      if (error) {
        alert("Erro ao cadastrar cliente: " + error.message);
        return;
      }

      alert("Cliente cadastrado com sucesso!");
    }

    setModalCliente(false);
    setForm(clienteVazio);
    setEditandoId("");
    await carregarClientes();
  }

  async function alterarStatusCliente(cliente: Cliente) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const novoStatus = cliente.ativo === false;

    const confirmar = confirm(
      novoStatus
        ? `Deseja ativar o cliente ${cliente.nome}?`
        : `Deseja inativar o cliente ${cliente.nome}?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("clientes")
      .update({
        ativo: novoStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("empresa_id", empresaId)
      .eq("id", cliente.id);

    if (error) {
      alert("Erro ao alterar status: " + error.message);
      return;
    }

    await carregarClientes();
  }

  async function consultarCep() {
    const cep = limparNumero(form.cep);

    if (cep.length !== 8) {
      alert("Informe um CEP válido com 8 números.");
      return;
    }

    setConsultandoCep(true);

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const dados = await resposta.json();

      if (dados.erro) {
        alert("CEP não encontrado.");
        setConsultandoCep(false);
        return;
      }

      setForm((atual) => ({
        ...atual,
        endereco: paraMaiusculo(dados.logradouro || atual.endereco),
        bairro: paraMaiusculo(dados.bairro || atual.bairro),
        cidade: paraMaiusculo(dados.localidade || atual.cidade),
        uf: paraMaiusculo(dados.uf || atual.uf),
        complemento: paraMaiusculo(atual.complemento || dados.complemento || ""),
      }));
    } catch {
      alert("Não foi possível consultar o CEP agora.");
    }

    setConsultandoCep(false);
  }

  async function consultarCnpj() {
    const cnpj = limparNumero(form.cpf_cnpj);

    if (cnpj.length !== 14) {
      alert("Informe um CNPJ válido com 14 números.");
      return;
    }

    setConsultandoCnpj(true);

    try {
      const resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      const dados = await resposta.json();

      if (dados.message || dados.type) {
        alert("CNPJ não encontrado ou consulta indisponível.");
        setConsultandoCnpj(false);
        return;
      }

      setForm((atual) => ({
        ...atual,
        tipo_cliente: "juridica",
        razao_social: paraMaiusculo(dados.razao_social || atual.razao_social),
        nome_fantasia: paraMaiusculo(dados.nome_fantasia || atual.nome_fantasia),
        nome: paraMaiusculo(dados.nome_fantasia || dados.razao_social || atual.nome),
        email: dados.email || atual.email,
        telefone: paraMaiusculo(dados.ddd_telefone_1 || atual.telefone),
        cep: dados.cep || atual.cep,
        endereco: paraMaiusculo(dados.logradouro || atual.endereco),
        numero: paraMaiusculo(dados.numero || atual.numero),
        complemento: paraMaiusculo(dados.complemento || atual.complemento),
        bairro: paraMaiusculo(dados.bairro || atual.bairro),
        cidade: paraMaiusculo(dados.municipio || atual.cidade),
        uf: paraMaiusculo(dados.uf || atual.uf),
      }));
    } catch {
      alert("Não foi possível consultar o CNPJ agora.");
    }

    setConsultandoCnpj(false);
  }

  async function abrirDetalhesCliente(cliente: Cliente) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setClienteSelecionado(cliente);
    setModalDetalhes(true);

    const saldoCredito = await carregarSaldoCreditoCliente(cliente.id);
    setSaldoCreditoCliente(saldoCredito);

    const vendasReq = await supabase
      .from("vendas")
      .select("id,numero_venda,valor_total,created_at,status")
      .eq("empresa_id", empresaId)
      .eq("cliente_id", cliente.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setVendasCliente(vendasReq.data || []);

    const contasReq = await supabase
      .from("contas_receber")
      .select("id,valor,status,vencimento,descricao")
      .eq("empresa_id", empresaId)
      .eq("cliente_id", cliente.id)
      .order("vencimento", { ascending: false })
      .limit(20);

    setContasCliente(contasReq.data || []);

    const creditosReq = await supabase
      .from("creditos_cliente")
      .select("id,origem,tipo,valor,saldo_apos,descricao,created_at")
      .eq("empresa_id", empresaId)
      .eq("cliente_id", cliente.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setCreditosCliente((creditosReq.data || []) as CreditoCliente[]);
  }

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return clientes.filter((cliente) => {
      const texto = [
        cliente.nome,
        cliente.razao_social,
        cliente.nome_fantasia,
        cliente.cpf_cnpj,
        cliente.email,
        cliente.telefone,
        cliente.whatsapp,
        cliente.cidade,
        cliente.bairro,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const passaBusca = termo ? texto.includes(termo) : true;
      const passaTipo = filtroTipo ? cliente.tipo_cliente === filtroTipo : true;
      const passaStatus =
        filtroStatus === "ativo"
          ? cliente.ativo !== false
          : filtroStatus === "inativo"
          ? cliente.ativo === false
          : true;

      return passaBusca && passaTipo && passaStatus;
    });
  }, [clientes, busca, filtroTipo, filtroStatus]);

  const totalClientes = clientes.length;
  const clientesAtivos = clientes.filter((cliente) => cliente.ativo !== false).length;
  const clientesInativos = clientes.filter((cliente) => cliente.ativo === false).length;
  const limiteTotal = clientes.reduce(
    (total, cliente) => total + Number(cliente.limite_credito || 0),
    0
  );

  const totalCompradoDetalhes = vendasCliente.reduce(
    (total, venda) => total + Number(venda.valor_total || 0),
    0
  );

  const totalAbertoDetalhes = contasCliente
    .filter((conta) => conta.status !== "pago")
    .reduce((total, conta) => total + Number(conta.valor || 0), 0);

  useEffect(() => {
    carregarClientes();
  }, []);

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm mb-8">
        <p className="text-blue-600 font-bold">Cadastros</p>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mt-2">
              Clientes Premium
            </h1>

            <p className="text-slate-500 mt-2">
              Cadastro completo com endereço, crédito, histórico, vendas, financeiro e consultas automáticas.
            </p>
          </div>

          <button
            onClick={abrirNovoCliente}
            className="bg-blue-700 hover:bg-blue-800 text-white px-7 py-4 rounded-2xl font-black shadow"
          >
            + Novo Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Resumo titulo="Total de Clientes" valor={`${totalClientes}`} cor="text-blue-700" />
        <Resumo titulo="Clientes Ativos" valor={`${clientesAtivos}`} cor="text-green-700" />
        <Resumo titulo="Clientes Inativos" valor={`${clientesInativos}`} cor="text-red-700" />
        <Resumo titulo="Limite Concedido" valor={formatarMoeda(limiteTotal)} cor="text-purple-700" />
        <Resumo
          titulo="Crédito Disponível"
          valor={formatarMoeda(
            Object.values(saldosCredito).reduce((total, valor) => total + Number(valor || 0), 0)
          )}
          cor="text-emerald-700"
        />
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-2xl font-black text-slate-900 mb-5">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-3 flex overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100">
            <div className="flex w-12 items-center justify-center text-slate-500">🔍</div>
            <input
              value={busca}
              onChange={(e) => setBusca(paraMaiusculo(e.target.value))}
              placeholder="PESQUISAR NOME, CPF/CNPJ, TELEFONE, CIDADE..."
              className="w-full p-3 font-medium text-slate-900 outline-none uppercase"
            />
          </div>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium bg-white"
          >
            <option value="">Todos os tipos</option>
            <option value="fisica">Pessoa Física</option>
            <option value="juridica">Pessoa Jurídica</option>
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-slate-300 p-3 rounded-2xl text-slate-900 font-medium bg-white"
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-black text-slate-900">
            Lista de Clientes
          </h2>

          <p className="text-slate-500 font-bold">
            {carregando ? "Carregando..." : `${clientesFiltrados.length} encontrado(s)`}
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-3 text-left">Cliente</th>
                <th className="p-3 text-left">Documento</th>
                <th className="p-3 text-left">Contato</th>
                <th className="p-3 text-left">Cidade/UF</th>
                <th className="p-3 text-right">Limite</th>
                <th className="p-3 text-right">Crédito</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>

            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id} className="border-b hover:bg-slate-50 align-top">
                  <td className="p-3">
                    <p className="font-black text-slate-900">{cliente.nome}</p>
                    <p className="text-xs text-slate-500">
                      {cliente.tipo_cliente === "juridica" ? "Pessoa Jurídica" : "Pessoa Física"}
                    </p>
                    {cliente.razao_social && (
                      <p className="text-xs text-slate-500">
                        Razão: {cliente.razao_social}
                      </p>
                    )}
                  </td>

                  <td className="p-3 text-slate-700">
                    {formatarDocumento(cliente.cpf_cnpj)}
                  </td>

                  <td className="p-3 text-slate-700">
                    <p>{cliente.whatsapp || cliente.telefone || "-"}</p>
                    <p className="text-xs text-slate-500">{cliente.email || ""}</p>
                  </td>

                  <td className="p-3 text-slate-700">
                    {cliente.cidade || "-"} {cliente.uf ? `/${cliente.uf}` : ""}
                    <p className="text-xs text-slate-500">{cliente.bairro || ""}</p>
                  </td>

                  <td className="p-3 text-right text-purple-700 font-black">
                    {formatarMoeda(Number(cliente.limite_credito || 0))}
                  </td>

                  <td className="p-3 text-right text-emerald-700 font-black">
                    {formatarMoeda(Number(saldosCredito[cliente.id] || 0))}
                  </td>

                  <td className="p-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black ${
                        cliente.ativo === false
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {cliente.ativo === false ? "Inativo" : "Ativo"}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => abrirDetalhesCliente(cliente)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl font-bold"
                      >
                        Ver
                      </button>

                      <button
                        onClick={() => abrirEditarCliente(cliente)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-xl font-bold"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => alterarStatusCliente(cliente)}
                        className={`px-3 py-2 rounded-xl font-bold ${
                          cliente.ativo === false
                            ? "bg-green-100 hover:bg-green-200 text-green-800"
                            : "bg-red-100 hover:bg-red-200 text-red-800"
                        }`}
                      >
                        {cliente.ativo === false ? "Ativar" : "Inativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {clientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalCliente && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  {editandoId ? "Alterar Cliente" : "Novo Cliente"}
                </h2>
                <p className="text-slate-500">
                  Preencha as informações principais, endereço e dados comerciais.
                </p>
              </div>

              <button
                onClick={() => setModalCliente(false)}
                className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <h3 className="text-xl font-black text-slate-900 mb-4">
                  Identificação
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Campo titulo="Tipo">
                    <select
                      value={form.tipo_cliente}
                      onChange={(e) => atualizarForm("tipo_cliente", e.target.value)}
                      className="input"
                    >
                      <option value="fisica">Pessoa Física</option>
                      <option value="juridica">Pessoa Jurídica</option>
                    </select>
                  </Campo>

                  <Campo titulo={form.tipo_cliente === "juridica" ? "CNPJ" : "CPF"}>
                    <div className="flex gap-2">
                      <input
                        value={form.cpf_cnpj}
                        onChange={(e) => atualizarForm("cpf_cnpj", e.target.value)}
                        placeholder={form.tipo_cliente === "juridica" ? "CNPJ" : "CPF"}
                        className="input"
                      />

                      {form.tipo_cliente === "juridica" && (
                        <button
                          type="button"
                          onClick={consultarCnpj}
                          className="bg-blue-700 hover:bg-blue-800 text-white px-4 rounded-xl font-black"
                        >
                          {consultandoCnpj ? "..." : "Buscar"}
                        </button>
                      )}
                    </div>
                  </Campo>

                  {form.tipo_cliente === "fisica" && (
                    <>
                      <Campo titulo="Nome completo" className="md:col-span-2">
                        <input
                          value={form.nome}
                          onChange={(e) => atualizarForm("nome", e.target.value)}
                          placeholder="Nome completo"
                          className="input"
                        />
                      </Campo>

                      <Campo titulo="RG">
                        <input
                          value={form.rg_ie}
                          onChange={(e) => atualizarForm("rg_ie", e.target.value)}
                          placeholder="RG"
                          className="input"
                        />
                      </Campo>

                      <Campo titulo="Nascimento">
                        <input
                          type="date"
                          value={form.data_nascimento}
                          onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })}
                          className="input"
                        />
                      </Campo>
                    </>
                  )}

                  {form.tipo_cliente === "juridica" && (
                    <>
                      <Campo titulo="Razão Social" className="md:col-span-2">
                        <input
                          value={form.razao_social}
                          onChange={(e) => atualizarForm("razao_social", e.target.value)}
                          placeholder="Razão social"
                          className="input"
                        />
                      </Campo>

                      <Campo titulo="Nome Fantasia">
                        <input
                          value={form.nome_fantasia}
                          onChange={(e) => atualizarForm("nome_fantasia", e.target.value)}
                          placeholder="Nome fantasia"
                          className="input"
                        />
                      </Campo>

                      <Campo titulo="Inscrição Estadual">
                        <input
                          value={form.inscricao_estadual}
                          onChange={(e) => atualizarForm("inscricao_estadual", e.target.value)}
                          placeholder="Inscrição estadual"
                          className="input"
                        />
                      </Campo>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h3 className="text-xl font-black text-slate-900 mb-4">
                  Contato
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Campo titulo="WhatsApp">
                    <input
                      value={form.whatsapp}
                      onChange={(e) => atualizarForm("whatsapp", e.target.value)}
                      placeholder="WhatsApp"
                      className="input"
                    />
                  </Campo>

                  <Campo titulo="Telefone">
                    <input
                      value={form.telefone}
                      onChange={(e) => atualizarForm("telefone", e.target.value)}
                      placeholder="Telefone"
                      className="input"
                    />
                  </Campo>

                  <Campo titulo="E-mail">
                    <input
                      value={form.email}
                      onChange={(e) => atualizarForm("email", e.target.value)}
                      placeholder="E-mail"
                      className="input"
                    />
                  </Campo>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <h3 className="text-xl font-black text-slate-900 mb-4">
                  Endereço
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <Campo titulo="CEP">
                    <div className="flex gap-2">
                      <input
                        value={form.cep}
                        onChange={(e) => atualizarForm("cep", e.target.value)}
                        placeholder="CEP"
                        className="input"
                      />

                      <button
                        type="button"
                        onClick={consultarCep}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 rounded-xl font-black"
                      >
                        {consultandoCep ? "..." : "Buscar"}
                      </button>
                    </div>
                  </Campo>

                  <Campo titulo="Endereço" className="md:col-span-3">
                    <input
                      value={form.endereco}
                      onChange={(e) => atualizarForm("endereco", e.target.value)}
                      placeholder="Rua, avenida..."
                      className="input"
                    />
                  </Campo>

                  <Campo titulo="Número">
                    <input
                      value={form.numero}
                      onChange={(e) => atualizarForm("numero", e.target.value)}
                      placeholder="Nº"
                      className="input"
                    />
                  </Campo>

                  <Campo titulo="Complemento">
                    <input
                      value={form.complemento}
                      onChange={(e) => atualizarForm("complemento", e.target.value)}
                      placeholder="Complemento"
                      className="input"
                    />
                  </Campo>

                  <Campo titulo="Bairro" className="md:col-span-2">
                    <input
                      value={form.bairro}
                      onChange={(e) => atualizarForm("bairro", e.target.value)}
                      placeholder="Bairro"
                      className="input"
                    />
                  </Campo>

                  <Campo titulo="Cidade" className="md:col-span-3">
                    <input
                      value={form.cidade}
                      onChange={(e) => atualizarForm("cidade", e.target.value)}
                      placeholder="Cidade"
                      className="input"
                    />
                  </Campo>

                  <Campo titulo="UF">
                    <input
                      value={form.uf}
                      onChange={(e) => atualizarForm("uf", e.target.value.slice(0, 2))}
                      placeholder="UF"
                      className="input"
                    />
                  </Campo>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
                <h3 className="text-xl font-black text-slate-900 mb-4">
                  Comercial / Crédito
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Campo titulo="Limite de Crédito">
                    <input
                      value={form.limite_credito}
                      onChange={(e) => atualizarForm("limite_credito", e.target.value)}
                      placeholder="0,00"
                      className="input"
                    />
                  </Campo>

                  <Campo titulo="Status">
                    <select
                      value={form.ativo ? "ativo" : "inativo"}
                      onChange={(e) => atualizarForm("ativo", e.target.value === "ativo")}
                      className="input"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </Campo>

                  <Campo titulo="Observação" className="md:col-span-2">
                    <input
                      value={form.observacao}
                      onChange={(e) => atualizarForm("observacao", e.target.value)}
                      placeholder="Observações comerciais"
                      className="input"
                    />
                  </Campo>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex flex-col md:flex-row justify-end gap-3">
              <button
                onClick={() => setModalCliente(false)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-7 py-3 rounded-2xl font-black"
              >
                Cancelar
              </button>

              <button
                onClick={salvarCliente}
                className="bg-blue-700 hover:bg-blue-800 text-white px-7 py-3 rounded-2xl font-black"
              >
                {editandoId ? "Salvar Alterações" : "Cadastrar Cliente"}
              </button>
            </div>

            <style jsx global>{`
              .input {
                width: 100%;
                text-transform: uppercase;
                border: 1px solid rgb(203 213 225);
                border-radius: 0.75rem;
                padding: 0.75rem;
                color: rgb(15 23 42);
                background: white;
                font-weight: 600;
                outline: none;
              }

              .input:focus {
                border-color: rgb(37 99 235);
                box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
              }
            `}</style>
          </div>
        </div>
      )}

      {modalDetalhes && clienteSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">
                  {clienteSelecionado.nome}
                </h2>
                <p className="text-slate-500">
                  {formatarDocumento(clienteSelecionado.cpf_cnpj)} • {clienteSelecionado.cidade || "-"} {clienteSelecionado.uf ? `/${clienteSelecionado.uf}` : ""}
                </p>
              </div>

              <button
                onClick={() => setModalDetalhes(false)}
                className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"
              >
                ✕
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-1 space-y-4">
                <Resumo titulo="Total Comprado" valor={formatarMoeda(totalCompradoDetalhes)} cor="text-green-700" />
                <Resumo titulo="Em Aberto" valor={formatarMoeda(totalAbertoDetalhes)} cor="text-red-700" />
                <Resumo titulo="Limite Crédito" valor={formatarMoeda(Number(clienteSelecionado.limite_credito || 0))} cor="text-purple-700" />
                <Resumo titulo="Crédito Disponível" valor={formatarMoeda(saldoCreditoCliente)} cor="text-emerald-700" />

                <div className="bg-slate-900 text-white rounded-3xl p-5">
                  <p className="text-slate-300 font-bold">Contato</p>
                  <p className="mt-2"><strong>WhatsApp:</strong> {clienteSelecionado.whatsapp || "-"}</p>
                  <p><strong>Telefone:</strong> {clienteSelecionado.telefone || "-"}</p>
                  <p><strong>E-mail:</strong> {clienteSelecionado.email || "-"}</p>

                  <hr className="border-slate-700 my-4" />

                  <p className="text-slate-300 font-bold">Endereço</p>
                  <p className="mt-2">
                    {clienteSelecionado.endereco || "-"}, {clienteSelecionado.numero || "S/N"}
                  </p>
                  <p>{clienteSelecionado.bairro || "-"} - {clienteSelecionado.cidade || "-"} / {clienteSelecionado.uf || "-"}</p>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-5">
                <div className="border border-slate-200 rounded-3xl p-5">
                  <h3 className="text-xl font-black text-slate-900 mb-4">
                    Últimas Vendas
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="p-3 text-left">Venda</th>
                          <th className="p-3 text-left">Data</th>
                          <th className="p-3 text-left">Status</th>
                          <th className="p-3 text-right">Valor</th>
                        </tr>
                      </thead>

                      <tbody>
                        {vendasCliente.map((venda) => (
                          <tr key={venda.id} className="border-b">
                            <td className="p-3 text-slate-800">
                              {venda.numero_venda
                                ? `Venda nº ${String(venda.numero_venda).padStart(6, "0")}`
                                : venda.id}
                            </td>
                            <td className="p-3 text-slate-800">{formatarData(venda.created_at)}</td>
                            <td className="p-3 text-slate-800">{venda.status || "-"}</td>
                            <td className="p-3 text-right text-green-700 font-black">{formatarMoeda(Number(venda.valor_total || 0))}</td>
                          </tr>
                        ))}

                        {vendasCliente.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-500">
                              Nenhuma venda encontrada.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-3xl p-5">
                  <h3 className="text-xl font-black text-slate-900 mb-4">
                    Financeiro do Cliente
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="p-3 text-left">Descrição</th>
                          <th className="p-3 text-left">Vencimento</th>
                          <th className="p-3 text-left">Status</th>
                          <th className="p-3 text-right">Valor</th>
                        </tr>
                      </thead>

                      <tbody>
                        {contasCliente.map((conta) => (
                          <tr key={conta.id} className="border-b">
                            <td className="p-3 text-slate-800">{conta.descricao || "-"}</td>
                            <td className="p-3 text-slate-800">{formatarData(conta.vencimento)}</td>
                            <td className="p-3 text-slate-800">{conta.status || "-"}</td>
                            <td className="p-3 text-right text-red-700 font-black">{formatarMoeda(Number(conta.valor || 0))}</td>
                          </tr>
                        ))}

                        {contasCliente.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-slate-500">
                              Nenhuma conta encontrada.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>


                <div className="border border-slate-200 rounded-3xl p-5">
                  <h3 className="text-xl font-black text-slate-900 mb-4">
                    Histórico de Crédito
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="p-3 text-left">Data</th>
                          <th className="p-3 text-left">Origem</th>
                          <th className="p-3 text-left">Descrição</th>
                          <th className="p-3 text-right">Valor</th>
                          <th className="p-3 text-right">Saldo</th>
                        </tr>
                      </thead>

                      <tbody>
                        {creditosCliente.map((credito) => (
                          <tr key={credito.id} className="border-b">
                            <td className="p-3 text-slate-800">{formatarData(credito.created_at)}</td>
                            <td className="p-3 text-slate-800">{credito.origem || "-"}</td>
                            <td className="p-3 text-slate-800">{credito.descricao || "-"}</td>
                            <td
                              className={`p-3 text-right font-black ${
                                credito.tipo === "entrada" || credito.tipo === "ajuste"
                                  ? "text-emerald-700"
                                  : "text-red-700"
                              }`}
                            >
                              {credito.tipo === "entrada" || credito.tipo === "ajuste" ? "+" : "-"}
                              {formatarMoeda(Number(credito.valor || 0))}
                            </td>
                            <td className="p-3 text-right text-blue-700 font-black">
                              {formatarMoeda(Number(credito.saldo_apos || 0))}
                            </td>
                          </tr>
                        ))}

                        {creditosCliente.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-500">
                              Nenhuma movimentação de crédito encontrada.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setModalDetalhes(false);
                      abrirEditarCliente(clienteSelecionado);
                    }}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-7 py-3 rounded-2xl font-black"
                  >
                    Editar Cliente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({
  titulo,
  children,
  className = "",
}: {
  titulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-black text-slate-700 mb-2">
        {titulo}
      </label>

      {children}
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
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <p className="text-sm text-slate-500 font-bold">{titulo}</p>
      <p className={`text-3xl font-black mt-2 ${cor}`}>{valor}</p>
    </div>
  );
}
