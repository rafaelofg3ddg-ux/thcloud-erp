"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Edit,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Empresa = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  ativo: boolean | null;
  plano: string | null;
  valor_mensal: number | null;
  data_vencimento_assinatura: string | null;
};

type Cobranca = {
  id: string;
  empresa_id: string | null;
  descricao: string | null;
  valor: number | null;
  vencimento: string | null;
  data_pagamento: string | null;
  status: string | null;
  forma_pagamento: string | null;
  observacoes: string | null;
  created_at: string | null;
  empresas: Empresa | Empresa[] | null;
};

type CobrancaTratada = Omit<Cobranca, "empresas"> & {
  empresas: Empresa | null;
};

type FormCobranca = {
  id: string;
  empresa_id: string;
  descricao: string;
  valor: string;
  vencimento: string;
  data_pagamento: string;
  status: string;
  forma_pagamento: string;
  observacoes: string;
};

const FORM_VAZIO: FormCobranca = {
  id: "",
  empresa_id: "",
  descricao: "Mensalidade THCloud ERP",
  valor: "0",
  vencimento: "",
  data_pagamento: "",
  status: "Aberta",
  forma_pagamento: "",
  observacoes: "",
};

function tratarEmpresaRelacionada(valor: Empresa | Empresa[] | null): Empresa | null {
  if (Array.isArray(valor)) {
    return valor[0] || null;
  }

  return valor || null;
}

export default function AdminCobrancasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cobrancas, setCobrancas] = useState<CobrancaTratada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [form, setForm] = useState<FormCobranca>(FORM_VAZIO);

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  function nomeEmpresa(empresa?: Empresa | null) {
    return empresa?.nome_fantasia || empresa?.razao_social || "Empresa não informada";
  }

  function statusReal(cobranca: CobrancaTratada) {
    if (cobranca.status === "Pago") return "Pago";
    if (cobranca.status === "Cancelado") return "Cancelado";
    if (cobranca.vencimento && cobranca.vencimento < hojeISO()) return "Vencido";
    return cobranca.status || "Aberta";
  }

  async function carregarDados() {
    setCarregando(true);

    const { data: empresasData, error: empresasError } = await supabase
      .from("empresas")
      .select("id,nome_fantasia,razao_social,cnpj,email,telefone,ativo,plano,valor_mensal,data_vencimento_assinatura")
      .order("nome_fantasia", { ascending: true });

    if (empresasError) {
      setCarregando(false);
      alert("Erro ao carregar empresas: " + empresasError.message);
      return;
    }

    setEmpresas((empresasData || []) as Empresa[]);

    const { data: cobrancasData, error: cobrancasError } = await supabase
      .from("cobrancas_saas")
      .select(`
        id,
        empresa_id,
        descricao,
        valor,
        vencimento,
        data_pagamento,
        status,
        forma_pagamento,
        observacoes,
        created_at,
        empresas:empresa_id (
          id,
          nome_fantasia,
          razao_social,
          cnpj,
          email,
          telefone,
          ativo,
          plano,
          valor_mensal,
          data_vencimento_assinatura
        )
      `)
      .order("vencimento", { ascending: true });

    setCarregando(false);

    if (cobrancasError) {
      alert("Erro ao carregar cobranças: " + cobrancasError.message);
      return;
    }

    const listaTratada = ((cobrancasData || []) as Cobranca[]).map((item) => ({
      ...item,
      empresas: tratarEmpresaRelacionada(item.empresas),
    }));

    setCobrancas(listaTratada);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const cobrancasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return cobrancas.filter((cobranca) => {
      const empresa = cobranca.empresas;
      const texto = `${nomeEmpresa(empresa)} ${empresa?.cnpj || ""} ${empresa?.email || ""} ${cobranca.descricao || ""} ${cobranca.status || ""}`.toLowerCase();

      const passaBusca = !termo || texto.includes(termo);
      const passaStatus = filtroStatus === "Todos" || statusReal(cobranca) === filtroStatus;

      return passaBusca && passaStatus;
    });
  }, [cobrancas, busca, filtroStatus]);

  const totalAberto = cobrancas
    .filter((c) => statusReal(c) === "Aberta")
    .reduce((total, c) => total + Number(c.valor || 0), 0);

  const totalVencido = cobrancas
    .filter((c) => statusReal(c) === "Vencido")
    .reduce((total, c) => total + Number(c.valor || 0), 0);

  const totalRecebido = cobrancas
    .filter((c) => statusReal(c) === "Pago")
    .reduce((total, c) => total + Number(c.valor || 0), 0);

  const quantidadeAbertas = cobrancas.filter((c) => statusReal(c) === "Aberta").length;
  const quantidadeVencidas = cobrancas.filter((c) => statusReal(c) === "Vencido").length;
  const quantidadePagas = cobrancas.filter((c) => statusReal(c) === "Pago").length;

  function abrirNovaCobranca() {
    setForm({
      ...FORM_VAZIO,
      vencimento: hojeISO(),
    });
    setModalAberto(true);
  }

  function editarCobranca(cobranca: CobrancaTratada) {
    setForm({
      id: cobranca.id,
      empresa_id: cobranca.empresa_id || "",
      descricao: cobranca.descricao || "Mensalidade THCloud ERP",
      valor: String(cobranca.valor || 0),
      vencimento: cobranca.vencimento || hojeISO(),
      data_pagamento: cobranca.data_pagamento || "",
      status: cobranca.status || "Aberta",
      forma_pagamento: cobranca.forma_pagamento || "",
      observacoes: cobranca.observacoes || "",
    });

    setModalAberto(true);
  }

  function alterarCampo(campo: keyof FormCobranca, valor: string) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function preencherEmpresa(valorEmpresaId: string) {
    const empresa = empresas.find((item) => item.id === valorEmpresaId);

    setForm((atual) => ({
      ...atual,
      empresa_id: valorEmpresaId,
      valor: empresa?.valor_mensal ? String(empresa.valor_mensal) : atual.valor,
      vencimento: empresa?.data_vencimento_assinatura || atual.vencimento || hojeISO(),
    }));
  }

  async function salvarCobranca() {
    if (!form.empresa_id) {
      alert("Selecione a empresa.");
      return;
    }

    if (!form.vencimento) {
      alert("Informe o vencimento.");
      return;
    }

    setSalvando(true);

    const dados = {
      empresa_id: form.empresa_id,
      descricao: form.descricao.trim() || "Mensalidade THCloud ERP",
      valor: Number(String(form.valor).replace(",", ".") || 0),
      vencimento: form.vencimento,
      data_pagamento: form.data_pagamento || null,
      status: form.status,
      forma_pagamento: form.forma_pagamento.trim() || null,
      observacoes: form.observacoes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    let resultado;

    if (form.id) {
      resultado = await supabase.from("cobrancas_saas").update(dados).eq("id", form.id);
    } else {
      resultado = await supabase.from("cobrancas_saas").insert([dados]);
    }

    setSalvando(false);

    if (resultado.error) {
      alert("Erro ao salvar cobrança: " + resultado.error.message);
      return;
    }

    setModalAberto(false);
    await carregarDados();
  }

  async function marcarComoPago(cobranca: CobrancaTratada) {
    if (!confirm("Confirmar esta cobrança como paga?")) return;

    const { error } = await supabase
      .from("cobrancas_saas")
      .update({
        status: "Pago",
        data_pagamento: hojeISO(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", cobranca.id);

    if (error) {
      alert("Erro ao confirmar pagamento: " + error.message);
      return;
    }

    if (cobranca.empresa_id) {
      const novaData = new Date();
      novaData.setDate(novaData.getDate() + 30);

      await supabase
        .from("empresas")
        .update({
          ativo: true,
          status_assinatura: "Ativo",
          data_vencimento_assinatura: novaData.toISOString().split("T")[0],
          updated_at: new Date().toISOString(),
        })
        .eq("id", cobranca.empresa_id);
    }

    await carregarDados();
  }

  async function excluirCobranca(cobranca: CobrancaTratada) {
    if (!confirm("Deseja excluir esta cobrança?")) return;

    const { error } = await supabase
      .from("cobrancas_saas")
      .delete()
      .eq("id", cobranca.id);

    if (error) {
      alert("Erro ao excluir cobrança: " + error.message);
      return;
    }

    await carregarDados();
  }

  async function gerarCobrancasMensais() {
    if (!confirm("Gerar cobrança mensal para todas as empresas ativas?")) return;

    setSalvando(true);

    const empresasAtivas = empresas.filter((empresa) => empresa.ativo !== false);

    const registros = empresasAtivas.map((empresa) => ({
      empresa_id: empresa.id,
      descricao: `Mensalidade THCloud ERP - ${empresa.plano || "Básico"}`,
      valor: Number(empresa.valor_mensal || 0),
      vencimento: empresa.data_vencimento_assinatura || hojeISO(),
      status: "Aberta",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    if (registros.length === 0) {
      setSalvando(false);
      alert("Nenhuma empresa ativa encontrada.");
      return;
    }

    const { error } = await supabase.from("cobrancas_saas").insert(registros);

    setSalvando(false);

    if (error) {
      alert("Erro ao gerar cobranças: " + error.message);
      return;
    }

    await carregarDados();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 overflow-x-hidden">
      <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 rounded-[30px] p-6 lg:p-8 text-white shadow-xl mb-6 overflow-hidden relative">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <p className="text-blue-200 font-black">Painel Master THCloud</p>

            <h1 className="text-3xl lg:text-4xl font-black mt-2">
              Cobranças SaaS
            </h1>

            <p className="mt-2 text-blue-100 max-w-4xl">
              Controle cobranças, pagamentos, vencimentos e liberação automática das empresas clientes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={carregarDados}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Atualizar
            </button>

            <button
              onClick={gerarCobrancasMensais}
              disabled={salvando}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <CalendarClock size={18} />
              Gerar Mensal
            </button>

            <button
              onClick={abrirNovaCobranca}
              className="bg-white text-blue-800 hover:bg-blue-50 px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Nova Cobrança
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
        <Card titulo="Aberto" valor={moeda(totalAberto)} detalhe={`${quantidadeAbertas} cobrança(s)`} cor="text-blue-700" icone={<CircleDollarSign size={22} />} />
        <Card titulo="Vencido" valor={moeda(totalVencido)} detalhe={`${quantidadeVencidas} cobrança(s)`} cor="text-red-700" icone={<AlertTriangle size={22} />} />
        <Card titulo="Recebido" valor={moeda(totalRecebido)} detalhe={`${quantidadePagas} pagamento(s)`} cor="text-green-700" icone={<CheckCircle2 size={22} />} />
        <Card titulo="Total" valor={`${cobrancas.length}`} detalhe="Cobranças geradas" cor="text-purple-700" icone={<Banknote size={22} />} />
        <Card titulo="Empresas" valor={`${empresas.length}`} detalhe="Clientes SaaS" cor="text-slate-800" icone={<Filter size={22} />} />
        <Card titulo="Inadimplência" valor={moeda(totalVencido)} detalhe="Valor em atraso" cor="text-orange-700" icone={<CalendarClock size={22} />} />
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-4 lg:p-5 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar empresa, CNPJ, e-mail, descrição..."
              className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option>Todos</option>
            <option>Aberta</option>
            <option>Vencido</option>
            <option>Pago</option>
            <option>Cancelado</option>
          </select>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Filter size={16} />
          {cobrancasFiltradas.length} cobrança(s) encontrada(s)
        </div>
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-4 text-left">Empresa</th>
                <th className="p-4 text-left">Descrição</th>
                <th className="p-4 text-left">Valor</th>
                <th className="p-4 text-left">Vencimento</th>
                <th className="p-4 text-left">Pagamento</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Carregando cobranças...
                  </td>
                </tr>
              )}

              {!carregando &&
                cobrancasFiltradas.map((cobranca) => (
                  <tr key={cobranca.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-black text-slate-950">
                        {nomeEmpresa(cobranca.empresas)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {cobranca.empresas?.cnpj || "Sem documento"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {cobranca.empresas?.email || "-"}
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800">{cobranca.descricao || "-"}</p>
                      <p className="text-xs text-slate-500">{cobranca.forma_pagamento || "Sem forma de pagamento"}</p>
                    </td>

                    <td className="p-4 font-black text-purple-700">
                      {moeda(Number(cobranca.valor || 0))}
                    </td>

                    <td className="p-4 font-bold text-slate-800">
                      {formatarData(cobranca.vencimento)}
                    </td>

                    <td className="p-4 text-slate-700">
                      {formatarData(cobranca.data_pagamento)}
                    </td>

                    <td className="p-4">
                      <StatusBadge status={statusReal(cobranca)} />
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {statusReal(cobranca) !== "Pago" && (
                          <button
                            onClick={() => marcarComoPago(cobranca)}
                            className="h-10 px-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 flex items-center justify-center gap-2 font-black"
                          >
                            <CheckCircle2 size={17} />
                            Pago
                          </button>
                        )}

                        <button
                          onClick={() => editarCobranca(cobranca)}
                          className="h-10 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center gap-2 font-black"
                        >
                          <Edit size={17} />
                          Editar
                        </button>

                        <button
                          onClick={() => excluirCobranca(cobranca)}
                          className="h-10 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center gap-2 font-black"
                        >
                          <Trash2 size={17} />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!carregando && cobrancasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhuma cobrança encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalAberto && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between rounded-t-[30px]">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  {form.id ? "Editar Cobrança" : "Nova Cobrança"}
                </h2>
                <p className="text-slate-500">
                  Controle financeiro das mensalidades SaaS.
                </p>
              </div>

              <button
                onClick={() => setModalAberto(false)}
                className="h-11 w-11 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 lg:p-6 space-y-5">
              <label className="block">
                <span className="text-sm font-black text-slate-800">Empresa</span>
                <select
                  value={form.empresa_id}
                  onChange={(e) => preencherEmpresa(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
                >
                  <option value="">Selecione a empresa</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {nomeEmpresa(empresa)} - {empresa.plano || "Básico"}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Descrição" value={form.descricao} onChange={(v) => alterarCampo("descricao", v)} />
                <Input label="Valor" value={form.valor} onChange={(v) => alterarCampo("valor", v)} />
                <Input label="Vencimento" type="date" value={form.vencimento} onChange={(v) => alterarCampo("vencimento", v)} />
                <Input label="Data de pagamento" type="date" value={form.data_pagamento} onChange={(v) => alterarCampo("data_pagamento", v)} />

                <label className="block">
                  <span className="text-sm font-black text-slate-800">Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => alterarCampo("status", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
                  >
                    <option>Aberta</option>
                    <option>Pago</option>
                    <option>Cancelado</option>
                  </select>
                </label>

                <Input label="Forma de pagamento" value={form.forma_pagamento} onChange={(v) => alterarCampo("forma_pagamento", v)} />
              </div>

              <label className="block">
                <span className="text-sm font-black text-slate-800">Observações</span>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => alterarCampo("observacoes", e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
                />
              </label>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-5 flex flex-col sm:flex-row gap-3 justify-end rounded-b-[30px]">
              <button
                onClick={() => setModalAberto(false)}
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black"
              >
                Cancelar
              </button>

              <button
                onClick={salvarCobranca}
                disabled={salvando}
                className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Salvar Cobrança"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({
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
    <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-500">{titulo}</p>

        <div className={`${cor} bg-slate-50 border border-slate-100 rounded-2xl p-2`}>
          {icone}
        </div>
      </div>

      <h2 className={`text-2xl font-black mt-3 ${cor}`}>{valor}</h2>

      <p className="text-xs text-slate-500 mt-1">{detalhe}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classe =
    status === "Pago"
      ? "bg-green-100 text-green-700"
      : status === "Aberta"
      ? "bg-blue-100 text-blue-700"
      : status === "Vencido"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-black ${classe}`}>
      {status}
    </span>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-800">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
      />
    </label>
  );
}
