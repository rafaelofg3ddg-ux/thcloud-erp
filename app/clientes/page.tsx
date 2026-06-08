"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getEmpresaId } from "../../lib/empresa";
import {
  CheckCircle,
  Edit,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";

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
  whatsapp: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  observacoes: string | null;
  ativo: boolean | null;
};

type FormCliente = {
  id: string;
  nome: string;
  cpf_cnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  endereco: string;
  limite_credito: string;
  observacoes: string;
  ativo: boolean;
};

const formInicial: FormCliente = {
  id: "",
  nome: "",
  cpf_cnpj: "",
  telefone: "",
  whatsapp: "",
  email: "",
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  endereco: "",
  limite_credito: "0",
  observacoes: "",
  ativo: true,
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const [form, setForm] = useState<FormCliente>(formInicial);

  function empresaAtualId() {
    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }

    return empresaId;
  }

  function converterNumero(valor: string) {
    return Number(String(valor || "0").replace(",", "."));
  }

  function somenteNumeros(valor: string) {
    return valor.replace(/\D/g, "");
  }

  function formatarMoeda(valor: number | null) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function formatarCpfCnpj(valor: string | null) {
    if (!valor) return "-";

    const numeros = somenteNumeros(valor);

    if (numeros.length === 11) {
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    if (numeros.length === 14) {
      return numeros.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        "$1.$2.$3/$4-$5"
      );
    }

    return valor;
  }

  function formatarTelefone(valor: string | null) {
    if (!valor) return "-";

    const numeros = somenteNumeros(valor);

    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }

    if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }

    return valor;
  }

  function validarEmail(email: string) {
    if (!email.trim()) return true;
    return /\S+@\S+\.\S+/.test(email);
  }

  function abrirNovoCliente() {
    setForm(formInicial);
    setModoEdicao(false);
    setModalAberto(true);
  }

  function abrirEditarCliente(cliente: Cliente) {
    setForm({
      id: cliente.id,
      nome: cliente.nome || "",
      cpf_cnpj: cliente.cpf_cnpj || "",
      telefone: cliente.telefone || "",
      whatsapp: cliente.whatsapp || "",
      email: cliente.email || "",
      cep: cliente.cep || "",
      rua: cliente.rua || "",
      numero: cliente.numero || "",
      bairro: cliente.bairro || "",
      cidade: cliente.cidade || "",
      estado: cliente.estado || "",
      endereco: cliente.endereco || "",
      limite_credito: String(cliente.limite_credito || 0),
      observacoes: cliente.observacoes || "",
      ativo: cliente.ativo !== false,
    });

    setModoEdicao(true);
    setModalAberto(true);
  }

  async function carregarClientes() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { data, error } = await supabase
      .from("clientes")
      .select(
        "id,empresa_id,nome,cpf_cnpj,telefone,email,endereco,limite_credito,created_at,whatsapp,cep,rua,numero,bairro,cidade,estado,observacoes,ativo"
      )
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar clientes: " + error.message);
      return;
    }

    setClientes(data || []);
  }

  async function buscarCep() {
    const cepLimpo = somenteNumeros(form.cep);

    if (cepLimpo.length !== 8) {
      alert("Informe um CEP válido com 8 números.");
      return;
    }

    setBuscandoCep(true);

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await resposta.json();

      if (dados.erro) {
        alert("CEP não encontrado.");
        setBuscandoCep(false);
        return;
      }

      setForm((atual) => ({
        ...atual,
        rua: dados.logradouro || atual.rua,
        bairro: dados.bairro || atual.bairro,
        cidade: dados.localidade || atual.cidade,
        estado: dados.uf || atual.estado,
        endereco: dados.logradouro || atual.endereco,
      }));
    } catch {
      alert("Erro ao consultar CEP.");
    }

    setBuscandoCep(false);
  }

  function validarFormulario() {
    if (!form.nome.trim()) {
      alert("Informe o nome do cliente.");
      return false;
    }

    if (!validarEmail(form.email)) {
      alert("Informe um e-mail válido.");
      return false;
    }

    return true;
  }

  async function salvarCliente() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!validarFormulario()) return;

    setSalvando(true);

    const enderecoCompleto =
      form.endereco.trim() ||
      `${form.rua}${form.numero ? ", " + form.numero : ""}${
        form.bairro ? " - " + form.bairro : ""
      }${form.cidade ? " - " + form.cidade : ""}${
        form.estado ? "/" + form.estado : ""
      }`;

    const dados = {
      empresa_id: empresaId,
      nome: form.nome.trim(),
      cpf_cnpj: somenteNumeros(form.cpf_cnpj.trim()) || null,
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim().toLowerCase() || null,
      cep: form.cep.trim() || null,
      rua: form.rua.trim() || null,
      numero: form.numero.trim() || null,
      bairro: form.bairro.trim() || null,
      cidade: form.cidade.trim() || null,
      estado: form.estado.trim().toUpperCase() || null,
      endereco: enderecoCompleto.trim() || null,
      limite_credito: converterNumero(form.limite_credito),
      observacoes: form.observacoes.trim() || null,
      ativo: form.ativo,
    };

    if (modoEdicao) {
      const { error } = await supabase
        .from("clientes")
        .update(dados)
        .eq("id", form.id)
        .eq("empresa_id", empresaId);

      setSalvando(false);

      if (error) {
        alert("Erro ao atualizar cliente: " + error.message);
        return;
      }

      alert("Cliente atualizado com sucesso!");
    } else {
      const { error } = await supabase.from("clientes").insert(dados);

      setSalvando(false);

      if (error) {
        alert("Erro ao cadastrar cliente: " + error.message);
        return;
      }

      alert("Cliente cadastrado com sucesso!");
    }

    setModalAberto(false);
    setForm(formInicial);
    carregarClientes();
  }

  async function alterarStatus(cliente: Cliente) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const acao = cliente.ativo !== false ? "inativar" : "ativar";

    const confirmar = confirm(
      `Deseja realmente ${acao} o cliente ${cliente.nome}?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("clientes")
      .update({
        ativo: cliente.ativo === false,
      })
      .eq("id", cliente.id)
      .eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao alterar status: " + error.message);
      return;
    }

    carregarClientes();
  }

  async function excluirCliente(cliente: Cliente) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const confirmar = confirm(
      `Deseja realmente excluir o cliente ${cliente.nome}? Esta ação não poderá ser desfeita.`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", cliente.id)
      .eq("empresa_id", empresaId);

    if (error) {
      alert(
        "Erro ao excluir cliente. Ele pode estar vinculado a vendas ou financeiro: " +
          error.message
      );
      return;
    }

    alert("Cliente excluído com sucesso!");
    carregarClientes();
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  const clientesFiltrados = clientes.filter((cliente) => {
    const termo = busca.trim().toLowerCase();

    const bateBusca =
      termo === "" ||
      String(cliente.nome || "").toLowerCase().includes(termo) ||
      String(cliente.cpf_cnpj || "").toLowerCase().includes(termo) ||
      String(cliente.telefone || "").toLowerCase().includes(termo) ||
      String(cliente.whatsapp || "").toLowerCase().includes(termo) ||
      String(cliente.email || "").toLowerCase().includes(termo) ||
      String(cliente.cidade || "").toLowerCase().includes(termo);

    const bateStatus =
      filtroStatus === "Todos" ||
      (filtroStatus === "Ativos" && cliente.ativo !== false) ||
      (filtroStatus === "Inativos" && cliente.ativo === false);

    return bateBusca && bateStatus;
  });

  const totalAtivos = clientes.filter((cliente) => cliente.ativo !== false).length;
  const totalInativos = clientes.filter((cliente) => cliente.ativo === false).length;
  const totalComCredito = clientes.filter(
    (cliente) => Number(cliente.limite_credito || 0) > 0
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-8 shadow-lg mb-8 text-white">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-blue-100 font-bold">THCloud ERP</p>

            <h1 className="text-4xl font-black mt-2">
              Clientes
            </h1>

            <p className="text-blue-100 mt-2 max-w-3xl">
              Cadastro comercial de clientes, contatos, endereço, limite de crédito e observações por empresa.
            </p>
          </div>

          <button
            onClick={abrirNovoCliente}
            className="bg-white text-blue-800 px-6 py-3 rounded-2xl font-black hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Novo Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <ResumoCard
          titulo="Total de Clientes"
          valor={`${clientes.length}`}
          detalhe="Clientes cadastrados"
          cor="text-blue-700"
          icone={<Users size={24} />}
        />

        <ResumoCard
          titulo="Ativos"
          valor={`${totalAtivos}`}
          detalhe="Clientes liberados"
          cor="text-green-700"
          icone={<CheckCircle size={24} />}
        />

        <ResumoCard
          titulo="Inativos"
          valor={`${totalInativos}`}
          detalhe="Clientes bloqueados"
          cor="text-red-700"
          icone={<XCircle size={24} />}
        />

        <ResumoCard
          titulo="Com Limite"
          valor={`${totalComCredito}`}
          detalhe="Clientes com crédito"
          cor="text-purple-700"
          icone={<User size={24} />}
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, CPF/CNPJ, telefone, WhatsApp, cidade ou e-mail..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 text-slate-900"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 bg-white"
          >
            <option value="Todos">Todos os status</option>
            <option value="Ativos">Ativos</option>
            <option value="Inativos">Inativos</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Lista de Clientes
            </h2>

            <p className="text-slate-500">
              {clientesFiltrados.length} cliente(s) encontrado(s).
            </p>
          </div>

          <button
            onClick={carregarClientes}
            className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
          >
            Atualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500 border-b border-slate-100">
                <th className="p-4">Cliente</th>
                <th className="p-4">CPF/CNPJ</th>
                <th className="p-4">Contato</th>
                <th className="p-4">Endereço</th>
                <th className="p-4">Limite</th>
                <th className="p-4">Status</th>
                <th className="p-4">Criado em</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr
                  key={cliente.id}
                  className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                        {cliente.nome.substring(0, 1).toUpperCase()}
                      </div>

                      <div>
                        <p className="font-black text-slate-900">
                          {cliente.nome}
                        </p>

                        <p className="text-slate-500">
                          {cliente.email || "-"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-slate-700">
                    {formatarCpfCnpj(cliente.cpf_cnpj)}
                  </td>

                  <td className="p-4 text-slate-700">
                    <p className="flex items-center gap-2">
                      <Phone size={14} />
                      {formatarTelefone(cliente.telefone)}
                    </p>

                    <p className="flex items-center gap-2 mt-1">
                      <Mail size={14} />
                      {formatarTelefone(cliente.whatsapp)}
                    </p>
                  </td>

                  <td className="p-4 text-slate-700">
                    <p className="flex items-center gap-2">
                      <MapPin size={14} />
                      {cliente.cidade || "-"} {cliente.estado ? `/${cliente.estado}` : ""}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {cliente.rua || cliente.endereco || "-"} {cliente.numero || ""}
                    </p>
                  </td>

                  <td className="p-4 font-bold text-blue-700">
                    {formatarMoeda(cliente.limite_credito)}
                  </td>

                  <td className="p-4">
                    {cliente.ativo !== false ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-green-100 text-green-700">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700">
                        Inativo
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-slate-700">
                    {formatarData(cliente.created_at)}
                  </td>

                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => abrirEditarCliente(cliente)}
                        className="h-10 w-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center"
                        title="Editar"
                      >
                        <Edit size={17} />
                      </button>

                      <button
                        onClick={() => alterarStatus(cliente)}
                        className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          cliente.ativo !== false
                            ? "bg-orange-50 hover:bg-orange-100 text-orange-700"
                            : "bg-green-50 hover:bg-green-100 text-green-700"
                        }`}
                        title={cliente.ativo !== false ? "Inativar" : "Ativar"}
                      >
                        <CheckCircle size={17} />
                      </button>

                      <button
                        onClick={() => excluirCliente(cliente)}
                        className="h-10 w-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center"
                        title="Excluir"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {clientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Nenhum cliente encontrado para esta empresa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-5xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {modoEdicao ? "Editar Cliente" : "Novo Cliente"}
                </h2>

                <p className="text-slate-500">
                  Preencha os dados comerciais, contato, endereço e limite de crédito.
                </p>
              </div>

              <button
                onClick={() => setModalAberto(false)}
                className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8 max-h-[75vh] overflow-y-auto">
              <section>
                <h3 className="text-lg font-black text-slate-900 mb-4">
                  Dados do Cliente
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Campo label="Nome / Razão Social" className="md:col-span-2">
                    <input
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Nome do cliente"
                      className="input"
                    />
                  </Campo>

                  <Campo label="CPF/CNPJ">
                    <input
                      value={form.cpf_cnpj}
                      onChange={(e) =>
                        setForm({ ...form, cpf_cnpj: e.target.value })
                      }
                      placeholder="CPF ou CNPJ"
                      className="input"
                    />
                  </Campo>

                  <Campo label="Telefone">
                    <input
                      value={form.telefone}
                      onChange={(e) =>
                        setForm({ ...form, telefone: e.target.value })
                      }
                      placeholder="(99) 9999-9999"
                      className="input"
                    />
                  </Campo>

                  <Campo label="WhatsApp">
                    <input
                      value={form.whatsapp}
                      onChange={(e) =>
                        setForm({ ...form, whatsapp: e.target.value })
                      }
                      placeholder="(99) 99999-9999"
                      className="input"
                    />
                  </Campo>

                  <Campo label="E-mail">
                    <input
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="email@cliente.com"
                      className="input"
                    />
                  </Campo>

                  <Campo label="Limite de Crédito">
                    <input
                      value={form.limite_credito}
                      onChange={(e) =>
                        setForm({ ...form, limite_credito: e.target.value })
                      }
                      placeholder="0,00"
                      className="input"
                    />
                  </Campo>

                  <Campo label="Status">
                    <select
                      value={form.ativo ? "ativo" : "inativo"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          ativo: e.target.value === "ativo",
                        })
                      }
                      className="input bg-white"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </Campo>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-black text-slate-900 mb-4">
                  Endereço
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Campo label="CEP">
                    <div className="flex gap-2">
                      <input
                        value={form.cep}
                        onChange={(e) => setForm({ ...form, cep: e.target.value })}
                        placeholder="00000-000"
                        className="input"
                      />

                      <button
                        type="button"
                        onClick={buscarCep}
                        disabled={buscandoCep}
                        className="px-4 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold disabled:opacity-60"
                      >
                        {buscandoCep ? "..." : "CEP"}
                      </button>
                    </div>
                  </Campo>

                  <Campo label="Rua" className="md:col-span-2">
                    <input
                      value={form.rua}
                      onChange={(e) => setForm({ ...form, rua: e.target.value })}
                      placeholder="Rua / Avenida"
                      className="input"
                    />
                  </Campo>

                  <Campo label="Número">
                    <input
                      value={form.numero}
                      onChange={(e) =>
                        setForm({ ...form, numero: e.target.value })
                      }
                      placeholder="Nº"
                      className="input"
                    />
                  </Campo>

                  <Campo label="Bairro">
                    <input
                      value={form.bairro}
                      onChange={(e) =>
                        setForm({ ...form, bairro: e.target.value })
                      }
                      placeholder="Bairro"
                      className="input"
                    />
                  </Campo>

                  <Campo label="Cidade">
                    <input
                      value={form.cidade}
                      onChange={(e) =>
                        setForm({ ...form, cidade: e.target.value })
                      }
                      placeholder="Cidade"
                      className="input"
                    />
                  </Campo>

                  <Campo label="Estado">
                    <input
                      value={form.estado}
                      onChange={(e) =>
                        setForm({ ...form, estado: e.target.value })
                      }
                      placeholder="UF"
                      maxLength={2}
                      className="input uppercase"
                    />
                  </Campo>

                  <Campo label="Endereço Completo">
                    <input
                      value={form.endereco}
                      onChange={(e) =>
                        setForm({ ...form, endereco: e.target.value })
                      }
                      placeholder="Opcional"
                      className="input"
                    />
                  </Campo>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-black text-slate-900 mb-4">
                  Observações
                </h3>

                <textarea
                  value={form.observacoes}
                  onChange={(e) =>
                    setForm({ ...form, observacoes: e.target.value })
                  }
                  placeholder="Observações internas sobre o cliente..."
                  className="input min-h-28"
                />
              </section>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalAberto(false)}
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Cancelar
              </button>

              <button
                onClick={salvarCliente}
                disabled={salvando}
                className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold disabled:opacity-60"
              >
                {salvando
                  ? "Salvando..."
                  : modoEdicao
                  ? "Salvar Alterações"
                  : "Cadastrar Cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 1rem;
          padding: 0.75rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .input:focus {
          border-color: rgb(37 99 235);
          box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
        }
      `}</style>
    </div>
  );
}

function Campo({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </label>

      {children}
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
  detalhe,
  cor,
  icone,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  cor: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{titulo}</p>

          <h2 className={`text-3xl font-black mt-3 ${cor}`}>{valor}</h2>

          <p className="text-sm text-slate-500 mt-2">{detalhe}</p>
        </div>

        <div
          className={`h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center ${cor}`}
        >
          {icone}
        </div>
      </div>
    </div>
  );
}
