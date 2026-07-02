"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { gerarPDFPadrao } from "../../../lib/relatoriopdf";
import {
  CheckCircle,
  Download,
  Mail,
  Phone,
  Search,
  User,
  Users,
  XCircle,
} from "lucide-react";

type Cliente = {
  id: string;
  empresa_id: string | null;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  endereco: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  limite_credito: number | null;
  observacoes: string | null;
  ativo: boolean | null;
  created_at: string | null;
};

export default function RelatorioClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [carregando, setCarregando] = useState(false);

  function empresaAtualId() {
    try {
      const usuario = localStorage.getItem("th_usuario");
      if (!usuario) return null;

      const dados = JSON.parse(usuario);
      return dados.empresa_id || null;
    } catch {
      return null;
    }
  }

  function somenteNumeros(valor: string | null) {
    return String(valor || "").replace(/\D/g, "");
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

  function formatarMoeda(valor: number | null | undefined) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function enderecoCliente(cliente: Cliente) {
    const partes = [
      cliente.endereco || cliente.rua,
      cliente.numero,
      cliente.bairro,
      cliente.cidade,
      cliente.estado,
    ].filter(Boolean);

    if (partes.length === 0) return "-";

    return partes.join(", ");
  }

  async function carregarClientes() {
    const empresaId = empresaAtualId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase
      .from("clientes")
      .select(
        "id,empresa_id,nome,cpf_cnpj,telefone,whatsapp,email,endereco,cep,rua,numero,bairro,cidade,estado,limite_credito,observacoes,ativo,created_at"
      )
      .eq("empresa_id", empresaId)
      .order("nome", { ascending: true });

    setCarregando(false);

    if (error) {
      alert("Erro ao carregar clientes: " + error.message);
      return;
    }

    setClientes(data || []);
  }

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return clientes.filter((cliente) => {
      const statusOk =
        statusFiltro === "todos" ||
        (statusFiltro === "ativos" && cliente.ativo !== false) ||
        (statusFiltro === "inativos" && cliente.ativo === false) ||
        (statusFiltro === "com_credito" && Number(cliente.limite_credito || 0) > 0);

      const textoBusca = [
        cliente.nome,
        cliente.cpf_cnpj,
        cliente.telefone,
        cliente.whatsapp,
        cliente.email,
        cliente.cidade,
        cliente.estado,
        cliente.endereco,
        cliente.rua,
        cliente.bairro,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const buscaOk = !termo || textoBusca.includes(termo);

      return statusOk && buscaOk;
    });
  }, [clientes, busca, statusFiltro]);

  const totalClientes = clientesFiltrados.length;
  const totalAtivos = clientesFiltrados.filter((cliente) => cliente.ativo !== false).length;
  const totalInativos = clientesFiltrados.filter((cliente) => cliente.ativo === false).length;
  const totalComCredito = clientesFiltrados.filter(
    (cliente) => Number(cliente.limite_credito || 0) > 0
  ).length;

  const limiteTotal = clientesFiltrados.reduce(
    (total, cliente) => total + Number(cliente.limite_credito || 0),
    0
  );

  async function gerarPDFClientes() {
    await gerarPDFPadrao(
      "Relatório de Clientes",
      [
        "Nome",
        "CPF/CNPJ",
        "Telefone",
        "WhatsApp",
        "E-mail",
        "Cidade",
        "Limite",
        "Status",
      ],
      clientesFiltrados.map((cliente) => [
        cliente.nome || "-",
        formatarCpfCnpj(cliente.cpf_cnpj),
        formatarTelefone(cliente.telefone),
        formatarTelefone(cliente.whatsapp),
        cliente.email || "-",
        cliente.cidade || "-",
        formatarMoeda(cliente.limite_credito),
        cliente.ativo === false ? "Inativo" : "Ativo",
      ])
    );
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-8 shadow-lg mb-8 text-white">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-blue-100 font-bold">
              Th Cloud
            </p>

            <h1 className="text-4xl font-black mt-2">
              Relatório de Clientes
            </h1>

            <p className="text-blue-100 mt-2 max-w-3xl">
              Relatório comercial de clientes cadastrados, contatos, endereço, limite de crédito e situação por empresa.
            </p>
          </div>

          <button
            onClick={gerarPDFClientes}
            className="bg-white text-blue-800 px-6 py-3 rounded-2xl font-black hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Gerar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-8">
        <ResumoCard
          titulo="Clientes"
          valor={`${totalClientes}`}
          detalhe="Clientes encontrados"
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

        <ResumoCard
          titulo="Limite Total"
          valor={formatarMoeda(limiteTotal)}
          detalhe="Crédito liberado"
          cor="text-orange-700"
          icone={<User size={24} />}
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 relative">
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
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900"
          >
            <option value="todos">Todos os status</option>
            <option value="ativos">Somente ativos</option>
            <option value="inativos">Somente inativos</option>
            <option value="com_credito">Com limite de crédito</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-5">
          <p className="text-sm text-slate-500">
            {carregando
              ? "Carregando clientes..."
              : `${clientesFiltrados.length} cliente(s) encontrado(s).`}
          </p>

          <button
            onClick={carregarClientes}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-2 rounded-xl font-bold"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Lista de Clientes
            </h2>

            <p className="text-slate-500">
              Relação de clientes cadastrados na empresa logada.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-4 text-left">Cliente</th>
                <th className="p-4 text-left">CPF/CNPJ</th>
                <th className="p-4 text-left">Contato</th>
                <th className="p-4 text-left">Endereço</th>
                <th className="p-4 text-right">Limite</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-left">Cadastro</th>
              </tr>
            </thead>

            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                        {cliente.nome?.charAt(0)?.toUpperCase() || "C"}
                      </div>

                      <div>
                        <p className="font-black text-slate-900">
                          {cliente.nome || "-"}
                        </p>

                        <p className="text-sm text-slate-500">
                          {cliente.email || "Sem e-mail"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-slate-700">
                    {formatarCpfCnpj(cliente.cpf_cnpj)}
                  </td>

                  <td className="p-4">
                    <div className="space-y-1 text-sm text-slate-700">
                      <p className="flex items-center gap-2">
                        <Phone size={14} />
                        {formatarTelefone(cliente.telefone)}
                      </p>

                      <p className="flex items-center gap-2">
                        <Phone size={14} />
                        {formatarTelefone(cliente.whatsapp)}
                      </p>

                      <p className="flex items-center gap-2">
                        <Mail size={14} />
                        {cliente.email || "-"}
                      </p>
                    </div>
                  </td>

                  <td className="p-4 text-slate-700 max-w-xs">
                    {enderecoCliente(cliente)}
                  </td>

                  <td className="p-4 text-right font-black text-slate-900">
                    {formatarMoeda(cliente.limite_credito)}
                  </td>

                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${
                        cliente.ativo === false
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {cliente.ativo === false ? "Inativo" : "Ativo"}
                    </span>
                  </td>

                  <td className="p-4 text-slate-700">
                    {formatarData(cliente.created_at)}
                  </td>
                </tr>
              ))}

              {clientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    Nenhum cliente encontrado.
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
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">
            {titulo}
          </p>

          <h2 className={`text-3xl font-black mt-2 ${cor}`}>
            {valor}
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            {detalhe}
          </p>
        </div>

        <div className={`h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center ${cor}`}>
          {icone}
        </div>
      </div>
    </div>
  );
}
