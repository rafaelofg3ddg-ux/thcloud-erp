"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Edit,
  Filter,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  Unlock,
  X,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { formatarData } from "../../../components/global/THFormat";

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
  status_assinatura: string | null;
  data_inicio_assinatura: string | null;
  data_vencimento_assinatura: string | null;
  created_at: string | null;
  modulo_fiscal: boolean | null;
  modulo_whatsapp: boolean | null;
  modulo_delivery: boolean | null;
  modulo_crm: boolean | null;
  modulo_relatorios_premium: boolean | null;
  modulo_multiloja: boolean | null;
  modulo_ordem_servico: boolean | null;
};

type FormAssinatura = {
  id: string;
  nome_empresa: string;
  plano: string;
  valor_mensal: string;
  status_assinatura: string;
  data_inicio_assinatura: string;
  data_vencimento_assinatura: string;
  ativo: boolean;
  modulo_fiscal: boolean;
  modulo_whatsapp: boolean;
  modulo_delivery: boolean;
  modulo_crm: boolean;
  modulo_relatorios_premium: boolean;
  modulo_multiloja: boolean;
  modulo_ordem_servico: boolean;
};

const FORM_VAZIO: FormAssinatura = {
  id: "",
  nome_empresa: "",
  plano: "Básico",
  valor_mensal: "0",
  status_assinatura: "Ativo",
  data_inicio_assinatura: "",
  data_vencimento_assinatura: "",
  ativo: true,
  modulo_fiscal: false,
  modulo_whatsapp: false,
  modulo_delivery: false,
  modulo_crm: false,
  modulo_relatorios_premium: false,
  modulo_multiloja: false,
  modulo_ordem_servico: true,
};

export default function AdminAssinaturasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroPlano, setFiltroPlano] = useState("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState<FormAssinatura>(FORM_VAZIO);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  function adicionarDias(dias: number, base?: string | null) {
    const data =
      base && base >= hojeISO()
        ? new Date(base + "T00:00:00")
        : new Date();

    data.setDate(data.getDate() + dias);
    return data.toISOString().split("T")[0];
  }

  function nomeEmpresa(empresa: Empresa) {
    return empresa.nome_fantasia || empresa.razao_social || "Empresa sem nome";
  }

  function normalizarStatus(status: string | null) {
    const valor = String(status || "Ativo").toLowerCase();

    if (valor === "ativa") return "Ativo";
    if (valor === "ativo") return "Ativo";
    if (valor === "teste") return "Teste";
    if (valor === "vencido") return "Vencido";
    if (valor === "vencida") return "Vencido";
    if (valor === "bloqueado") return "Bloqueado";
    if (valor === "bloqueada") return "Bloqueado";
    if (valor === "cancelado") return "Cancelado";
    if (valor === "cancelada") return "Cancelado";
    if (valor === "suspenso") return "Suspenso";
    if (valor === "suspensa") return "Suspenso";

    return status || "Ativo";
  }

  function estaVencida(empresa: Empresa) {
    const status = normalizarStatus(empresa.status_assinatura);

    if (status === "Vencido") return true;
    if (!empresa.data_vencimento_assinatura) return false;

    return empresa.data_vencimento_assinatura < hojeISO();
  }

  function venceEmBreve(empresa: Empresa) {
    if (!empresa.data_vencimento_assinatura) return false;
    if (estaVencida(empresa)) return false;

    const hoje = hojeISO();
    const limite = adicionarDias(7, hoje);

    return (
      empresa.data_vencimento_assinatura >= hoje &&
      empresa.data_vencimento_assinatura <= limite
    );
  }

  function statusReal(empresa: Empresa) {
    if (empresa.ativo === false) return "Bloqueado";
    if (estaVencida(empresa)) return "Vencido";
    if (venceEmBreve(empresa)) return "Vencendo";
    return normalizarStatus(empresa.status_assinatura);
  }

  function quantidadeModulos(empresa: Empresa) {
    return [
      empresa.modulo_fiscal,
      empresa.modulo_whatsapp,
      empresa.modulo_delivery,
      empresa.modulo_crm,
      empresa.modulo_relatorios_premium,
      empresa.modulo_multiloja,
    ].filter(Boolean).length;
  }

  async function carregarEmpresas() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("empresas")
      .select(
        "id,nome_fantasia,razao_social,cnpj,email,telefone,ativo,plano,valor_mensal,status_assinatura,data_inicio_assinatura,data_vencimento_assinatura,created_at,modulo_fiscal,modulo_whatsapp,modulo_delivery,modulo_crm,modulo_relatorios_premium,modulo_multiloja,modulo_ordem_servico"
      )
      .order("data_vencimento_assinatura", { ascending: true, nullsFirst: false });

    setCarregando(false);

    if (error) {
      alert("Erro ao carregar assinaturas: " + error.message);
      return;
    }

    setEmpresas((data || []) as Empresa[]);
  }

  useEffect(() => {
    carregarEmpresas();
  }, []);

  const empresasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return empresas.filter((empresa) => {
      const texto = `${nomeEmpresa(empresa)} ${empresa.cnpj || ""} ${empresa.email || ""} ${empresa.telefone || ""} ${empresa.plano || ""} ${empresa.status_assinatura || ""}`.toLowerCase();

      const passaBusca = !termo || texto.includes(termo);
      const passaPlano = filtroPlano === "Todos" || empresa.plano === filtroPlano;
      const passaStatus =
        filtroStatus === "Todos" || statusReal(empresa) === filtroStatus;

      return passaBusca && passaPlano && passaStatus;
    });
  }, [empresas, busca, filtroStatus, filtroPlano]);

  const totalAssinaturas = empresas.length;
  const ativas = empresas.filter(
    (empresa) => empresa.ativo !== false && !estaVencida(empresa)
  ).length;
  const vencendo = empresas.filter((empresa) => venceEmBreve(empresa)).length;
  const vencidas = empresas.filter((empresa) => estaVencida(empresa)).length;
  const bloqueadas = empresas.filter((empresa) => empresa.ativo === false).length;

  const receitaMensal = empresas
    .filter((empresa) => empresa.ativo !== false && !estaVencida(empresa))
    .reduce((total, empresa) => total + Number(empresa.valor_mensal || 0), 0);

  const receitaEmRisco = empresas
    .filter((empresa) => estaVencida(empresa) || empresa.ativo === false)
    .reduce((total, empresa) => total + Number(empresa.valor_mensal || 0), 0);

  function editarAssinatura(empresa: Empresa) {
    setForm({
      id: empresa.id,
      nome_empresa: nomeEmpresa(empresa),
      plano: empresa.plano || "Básico",
      valor_mensal: String(empresa.valor_mensal || 0),
      status_assinatura: normalizarStatus(empresa.status_assinatura),
      data_inicio_assinatura: empresa.data_inicio_assinatura || hojeISO(),
      data_vencimento_assinatura:
        empresa.data_vencimento_assinatura || adicionarDias(30),
      ativo: empresa.ativo !== false,
      modulo_fiscal: empresa.modulo_fiscal === true,
      modulo_whatsapp: empresa.modulo_whatsapp === true,
      modulo_delivery: empresa.modulo_delivery === true,
      modulo_crm: empresa.modulo_crm === true,
      modulo_relatorios_premium: empresa.modulo_relatorios_premium === true,
      modulo_multiloja: empresa.modulo_multiloja === true,
      modulo_ordem_servico: empresa.modulo_ordem_servico !== false,
    });

    setModalAberto(true);
  }

  function alterarCampo(campo: keyof FormAssinatura, valor: string | boolean) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function salvarAssinatura() {
    if (!form.id) {
      alert("Empresa não identificada.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase
      .from("empresas")
      .update({
        plano: form.plano,
        valor_mensal: Number(String(form.valor_mensal).replace(",", ".") || 0),
        status_assinatura: form.status_assinatura,
        data_inicio_assinatura: form.data_inicio_assinatura || null,
        data_vencimento_assinatura: form.data_vencimento_assinatura || null,
        ativo: form.ativo,
        modulo_fiscal: form.modulo_fiscal,
        modulo_whatsapp: form.modulo_whatsapp,
        modulo_delivery: form.modulo_delivery,
        modulo_crm: form.modulo_crm,
        modulo_relatorios_premium: form.modulo_relatorios_premium,
        modulo_multiloja: form.modulo_multiloja,
        modulo_ordem_servico: form.modulo_ordem_servico,
        updated_at: new Date().toISOString(),
      })
      .eq("id", form.id);

    setSalvando(false);

    if (error) {
      alert("Erro ao salvar assinatura: " + error.message);
      return;
    }

    setModalAberto(false);
    await carregarEmpresas();
  }

  async function renovarAssinatura(empresa: Empresa, dias: number) {
    if (
      !confirm(`Renovar assinatura de ${nomeEmpresa(empresa)} por mais ${dias} dias?`)
    ) {
      return;
    }

    const novoVencimento = adicionarDias(
      dias,
      empresa.data_vencimento_assinatura
    );

    const { error } = await supabase
      .from("empresas")
      .update({
        ativo: true,
        status_assinatura: "Ativo",
        data_vencimento_assinatura: novoVencimento,
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresa.id);

    if (error) {
      alert("Erro ao renovar assinatura: " + error.message);
      return;
    }

    await carregarEmpresas();
  }

  async function bloquearLiberar(empresa: Empresa) {
    const liberar = empresa.ativo === false;

    if (
      !confirm(
        liberar
          ? "Deseja liberar esta assinatura?"
          : "Deseja bloquear esta assinatura?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("empresas")
      .update({
        ativo: liberar,
        status_assinatura: liberar ? "Ativo" : "Bloqueado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresa.id);

    if (error) {
      alert("Erro ao alterar assinatura: " + error.message);
      return;
    }

    await carregarEmpresas();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 overflow-x-hidden">
      <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 rounded-[30px] p-6 lg:p-8 text-white shadow-xl mb-6 overflow-hidden relative">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <p className="text-blue-200 font-black">Painel Master THCloud</p>

            <h1 className="text-3xl lg:text-4xl font-black mt-2">
              Assinaturas SaaS
            </h1>

            <p className="mt-2 text-blue-100 max-w-4xl">
              Controle mensalidades, vencimentos, renovações, bloqueios, planos
              e módulos contratados pelos seus clientes.
            </p>
          </div>

          <button
            onClick={carregarEmpresas}
            className="bg-white text-blue-800 hover:bg-blue-50 px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
        <Card titulo="Total" valor={`${totalAssinaturas}`} detalhe="Assinaturas" cor="text-blue-700" icone={<CalendarClock size={22} />} />
        <Card titulo="Ativas" valor={`${ativas}`} detalhe="Clientes liberados" cor="text-green-700" icone={<CheckCircle2 size={22} />} />
        <Card titulo="Vencendo" valor={`${vencendo}`} detalhe="Próximos 7 dias" cor="text-orange-700" icone={<ShieldAlert size={22} />} />
        <Card titulo="Vencidas" valor={`${vencidas}`} detalhe="Cobrança urgente" cor="text-red-700" icone={<Clock size={22} />} />
        <Card titulo="Bloqueadas" valor={`${bloqueadas}`} detalhe="Acesso suspenso" cor="text-red-700" icone={<Lock size={22} />} />
        <Card titulo="MRR" valor={moeda(receitaMensal)} detalhe="Receita mensal ativa" cor="text-purple-700" icone={<CircleDollarSign size={22} />} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-[28px] border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">
            Receita anual prevista
          </p>
          <h2 className="text-3xl font-black text-blue-800 mt-2">
            {moeda(receitaMensal * 12)}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Estimativa com as assinaturas ativas atuais.
          </p>
        </div>

        <div className="bg-white rounded-[28px] border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-500">Receita em risco</p>
          <h2 className="text-3xl font-black text-red-700 mt-2">
            {moeda(receitaEmRisco)}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Empresas vencidas ou bloqueadas.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-4 lg:p-5 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_220px] gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por empresa, CNPJ, e-mail, telefone, plano..."
              className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option>Todos</option>
            <option>Ativo</option>
            <option>Teste</option>
            <option>Vencendo</option>
            <option>Vencido</option>
            <option>Bloqueado</option>
            <option>Cancelado</option>
            <option>Suspenso</option>
          </select>

          <select
            value={filtroPlano}
            onChange={(e) => setFiltroPlano(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option>Todos</option>
            <option>Básico</option>
            <option>Profissional</option>
            <option>Premium</option>
            <option>Enterprise</option>
          </select>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Filter size={16} />
          {empresasFiltradas.length} assinatura(s) encontrada(s)
        </div>
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1150px]">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-4 text-left">Empresa</th>
                <th className="p-4 text-left">Plano</th>
                <th className="p-4 text-left">Mensalidade</th>
                <th className="p-4 text-left">Vencimento</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Módulos</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Carregando assinaturas...
                  </td>
                </tr>
              )}

              {!carregando &&
                empresasFiltradas.map((empresa) => (
                  <tr key={empresa.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-black text-slate-950">
                        {nomeEmpresa(empresa)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {empresa.cnpj || "Sem documento"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {empresa.email || "-"}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black">
                        {empresa.plano || "Básico"}
                      </span>
                    </td>

                    <td className="p-4 font-black text-purple-700">
                      {moeda(Number(empresa.valor_mensal || 0))}
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-800">
                        {formatarData(empresa.data_vencimento_assinatura)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Início: {formatarData(empresa.data_inicio_assinatura)}
                      </p>
                    </td>

                    <td className="p-4">
                      <StatusBadge status={statusReal(empresa)} />
                    </td>

                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full font-black">
                        {quantidadeModulos(empresa)}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => editarAssinatura(empresa)}
                          className="h-10 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center gap-2 font-black"
                        >
                          <Edit size={17} />
                          Editar
                        </button>

                        <button
                          onClick={() => renovarAssinatura(empresa, 30)}
                          className="h-10 px-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 flex items-center justify-center gap-2 font-black"
                        >
                          <CheckCircle2 size={17} />
                          +30 dias
                        </button>

                        <button
                          onClick={() => bloquearLiberar(empresa)}
                          className={`h-10 px-3 rounded-xl flex items-center justify-center gap-2 font-black ${
                            empresa.ativo === false
                              ? "bg-green-50 hover:bg-green-100 text-green-700"
                              : "bg-red-50 hover:bg-red-100 text-red-700"
                          }`}
                        >
                          {empresa.ativo === false ? <Unlock size={17} /> : <Lock size={17} />}
                          {empresa.ativo === false ? "Liberar" : "Bloquear"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!carregando && empresasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhuma assinatura encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalAberto && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between rounded-t-[30px]">
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Editar Assinatura
                </h2>
                <p className="text-slate-500">{form.nome_empresa}</p>
              </div>

              <button
                onClick={() => setModalAberto(false)}
                className="h-11 w-11 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 lg:p-6 space-y-6">
              <div>
                <h3 className="font-black text-slate-900 mb-3">
                  Plano e cobrança
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Select label="Plano" value={form.plano} onChange={(v) => alterarCampo("plano", v)} options={["Básico", "Profissional", "Premium", "Enterprise"]} />
                  <Input label="Valor mensal" value={form.valor_mensal} onChange={(v) => alterarCampo("valor_mensal", v)} />
                  <Select label="Status" value={form.status_assinatura} onChange={(v) => alterarCampo("status_assinatura", v)} options={["Ativo", "Teste", "Vencido", "Bloqueado", "Cancelado", "Suspenso"]} />
                  <Input label="Início" type="date" value={form.data_inicio_assinatura} onChange={(v) => alterarCampo("data_inicio_assinatura", v)} />
                  <Input label="Vencimento" type="date" value={form.data_vencimento_assinatura} onChange={(v) => alterarCampo("data_vencimento_assinatura", v)} />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => alterarCampo("data_vencimento_assinatura", adicionarDias(30, form.data_vencimento_assinatura))}
                    className="px-4 py-2 rounded-xl bg-green-50 text-green-700 font-black hover:bg-green-100"
                  >
                    Renovar +30 dias
                  </button>

                  <button
                    onClick={() => alterarCampo("data_vencimento_assinatura", adicionarDias(90, form.data_vencimento_assinatura))}
                    className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-black hover:bg-blue-100"
                  >
                    Renovar +90 dias
                  </button>

                  <button
                    onClick={() => alterarCampo("data_vencimento_assinatura", adicionarDias(365, form.data_vencimento_assinatura))}
                    className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 font-black hover:bg-purple-100"
                  >
                    Renovar +1 ano
                  </button>
                </div>

                <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(e) => alterarCampo("ativo", e.target.checked)}
                    className="h-5 w-5"
                  />

                  <div>
                    <p className="font-black text-slate-900">Assinatura ativa</p>
                    <p className="text-sm text-slate-500">
                      Se desmarcar, a empresa fica bloqueada no sistema.
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <h3 className="font-black text-slate-900 mb-3">
                  Módulos liberados
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  <CheckModulo label="Ordem de Serviço" checked={form.modulo_ordem_servico} onChange={(v) => alterarCampo("modulo_ordem_servico", v)} />
                  <CheckModulo label="Fiscal" checked={form.modulo_fiscal} onChange={(v) => alterarCampo("modulo_fiscal", v)} />
                  <CheckModulo label="WhatsApp" checked={form.modulo_whatsapp} onChange={(v) => alterarCampo("modulo_whatsapp", v)} />
                  <CheckModulo label="Delivery" checked={form.modulo_delivery} onChange={(v) => alterarCampo("modulo_delivery", v)} />
                  <CheckModulo label="CRM" checked={form.modulo_crm} onChange={(v) => alterarCampo("modulo_crm", v)} />
                  <CheckModulo label="Relatórios Premium" checked={form.modulo_relatorios_premium} onChange={(v) => alterarCampo("modulo_relatorios_premium", v)} />
                  <CheckModulo label="Multiloja" checked={form.modulo_multiloja} onChange={(v) => alterarCampo("modulo_multiloja", v)} />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-5 flex flex-col sm:flex-row gap-3 justify-end rounded-b-[30px]">
              <button
                onClick={() => setModalAberto(false)}
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black"
              >
                Cancelar
              </button>

              <button
                onClick={salvarAssinatura}
                disabled={salvando}
                className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Salvar Assinatura"}
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
    status === "Ativo"
      ? "bg-green-100 text-green-700"
      : status === "Teste"
      ? "bg-cyan-100 text-cyan-700"
      : status === "Vencendo"
      ? "bg-orange-100 text-orange-700"
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

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-800">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
      >
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

function CheckModulo({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (valor: boolean) => void;
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition ${
        checked
          ? "border-blue-300 bg-blue-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5"
      />

      <div>
        <p className="font-black text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">Liberar para esta assinatura</p>
      </div>
    </label>
  );
}
