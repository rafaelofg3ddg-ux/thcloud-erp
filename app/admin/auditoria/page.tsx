"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Building2,
  CalendarDays,
  Clock,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Auditoria = {
  id: string;
  empresa_id: string | null;
  usuario: string | null;
  acao: string | null;
  descricao: string | null;
  ip: string | null;
  created_at: string | null;
};

type Empresa = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  cnpj: string | null;
};

export default function AdminAuditoriaPage() {
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroAcao, setFiltroAcao] = useState("Todas");
  const [filtroPeriodo, setFiltroPeriodo] = useState("30");

  function hojeInicio() {
    const data = new Date();
    data.setHours(0, 0, 0, 0);
    return data;
  }

  function diasAtras(dias: number) {
    const data = new Date();
    data.setDate(data.getDate() - dias);
    data.setHours(0, 0, 0, 0);
    return data;
  }

  function formatarDataHora(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function nomeEmpresa(empresaId: string | null) {
    if (!empresaId) return "Sistema";
    const empresa = empresas.find((item) => item.id === empresaId);
    return empresa?.nome_fantasia || empresa?.razao_social || "Empresa não encontrada";
  }

  function documentoEmpresa(empresaId: string | null) {
    if (!empresaId) return "-";
    const empresa = empresas.find((item) => item.id === empresaId);
    return empresa?.cnpj || "-";
  }

  function normalizarAcao(acao: string | null) {
    const valor = String(acao || "").trim();
    if (!valor) return "AÇÃO";
    return valor.toUpperCase();
  }

  async function carregarDados() {
    setCarregando(true);

    const { data: empresasData } = await supabase
      .from("empresas")
      .select("id,nome_fantasia,razao_social,cnpj")
      .order("nome_fantasia", { ascending: true });

    setEmpresas((empresasData || []) as Empresa[]);

    const { data, error } = await supabase
      .from("auditoria_saas")
      .select("id,empresa_id,usuario,acao,descricao,ip,created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    setCarregando(false);

    if (error) {
      alert("Erro ao carregar auditoria SaaS: " + error.message);
      return;
    }

    setAuditorias((data || []) as Auditoria[]);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const auditoriasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const diasPeriodo = Number(filtroPeriodo || 30);
    const dataLimite = filtroPeriodo === "hoje" ? hojeInicio() : diasAtras(diasPeriodo);

    return auditorias.filter((item) => {
      const dataItem = item.created_at ? new Date(item.created_at) : null;

      const texto = `${item.usuario || ""} ${item.acao || ""} ${item.descricao || ""} ${item.ip || ""} ${nomeEmpresa(item.empresa_id)} ${documentoEmpresa(item.empresa_id)}`.toLowerCase();

      const passaBusca = !termo || texto.includes(termo);
      const passaAcao = filtroAcao === "Todas" || normalizarAcao(item.acao) === filtroAcao;
      const passaPeriodo = !dataItem || dataItem >= dataLimite;

      return passaBusca && passaAcao && passaPeriodo;
    });
  }, [auditorias, empresas, busca, filtroAcao, filtroPeriodo]);

  const eventosHoje = auditorias.filter((item) => {
    if (!item.created_at) return false;
    return new Date(item.created_at) >= hojeInicio();
  }).length;

  const eventos7Dias = auditorias.filter((item) => {
    if (!item.created_at) return false;
    return new Date(item.created_at) >= diasAtras(7);
  }).length;

  const eventos30Dias = auditorias.filter((item) => {
    if (!item.created_at) return false;
    return new Date(item.created_at) >= diasAtras(30);
  }).length;

  const empresasImpactadas = new Set(
    auditoriasFiltradas.map((item) => item.empresa_id).filter((item) => item !== null)
  ).size;

  const acoes = Array.from(new Set(auditorias.map((item) => normalizarAcao(item.acao)))).sort();

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 overflow-x-hidden">
      <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 rounded-[30px] p-6 lg:p-8 text-white shadow-xl mb-6 overflow-hidden relative">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <p className="text-blue-200 font-black">Painel Master THCloud</p>
            <h1 className="text-3xl lg:text-4xl font-black mt-2">Auditoria SaaS</h1>
            <p className="mt-2 text-blue-100 max-w-4xl">
              Acompanhe ações administrativas, bloqueios, liberações, suporte, reset de senha, prorrogações e eventos críticos do Super Admin.
            </p>
          </div>
          <button
            onClick={carregarDados}
            className="bg-white text-blue-800 hover:bg-blue-50 px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            {carregando ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card titulo="Eventos Hoje" valor={`${eventosHoje}`} detalhe="Ações registradas hoje" cor="text-blue-700" icone={<Clock size={22} />} />
        <Card titulo="Últimos 7 Dias" valor={`${eventos7Dias}`} detalhe="Movimentações recentes" cor="text-green-700" icone={<CalendarDays size={22} />} />
        <Card titulo="Últimos 30 Dias" valor={`${eventos30Dias}`} detalhe="Visão mensal" cor="text-purple-700" icone={<Activity size={22} />} />
        <Card titulo="Empresas Impactadas" valor={`${empresasImpactadas}`} detalhe="No filtro atual" cor="text-orange-700" icone={<Building2 size={22} />} />
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-4 lg:p-5 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_220px] gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por empresa, usuário, ação, descrição ou IP..."
              className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
            />
          </div>

          <select
            value={filtroAcao}
            onChange={(e) => setFiltroAcao(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option>Todas</option>
            {acoes.map((acao) => (
              <option key={acao}>{acao}</option>
            ))}
          </select>

          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option value="hoje">Hoje</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Filter size={16} />
          {auditoriasFiltradas.length} evento(s) encontrado(s)
        </div>
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-4 text-left">Data/Hora</th>
                <th className="p-4 text-left">Usuário</th>
                <th className="p-4 text-left">Empresa</th>
                <th className="p-4 text-left">Ação</th>
                <th className="p-4 text-left">Descrição</th>
                <th className="p-4 text-left">IP</th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Carregando auditoria...</td>
                </tr>
              )}
              {!carregando && auditoriasFiltradas.map((item) => (
                <tr key={item.id} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="p-4"><p className="font-black text-slate-900">{formatarDataHora(item.created_at)}</p></td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-blue-700" />
                      <p className="font-bold text-slate-800">{item.usuario || "Sistema"}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-black text-slate-900">{nomeEmpresa(item.empresa_id)}</p>
                    <p className="text-xs text-slate-500">{documentoEmpresa(item.empresa_id)}</p>
                  </td>
                  <td className="p-4"><AcaoBadge acao={normalizarAcao(item.acao)} /></td>
                  <td className="p-4"><p className="text-slate-700 font-semibold">{item.descricao || "-"}</p></td>
                  <td className="p-4 text-slate-500">{item.ip || "-"}</td>
                </tr>
              ))}
              {!carregando && auditoriasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">Nenhum evento encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({ titulo, valor, detalhe, cor, icone }: { titulo: string; valor: string; detalhe: string; cor: string; icone: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm min-w-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-500">{titulo}</p>
        <div className={`${cor} bg-slate-50 border border-slate-100 rounded-2xl p-2`}>{icone}</div>
      </div>
      <h2 className={`text-2xl font-black mt-3 ${cor}`}>{valor}</h2>
      <p className="text-xs text-slate-500 mt-1">{detalhe}</p>
    </div>
  );
}

function AcaoBadge({ acao }: { acao: string }) {
  const classe = acao.includes("BLOQUE")
    ? "bg-red-100 text-red-700"
    : acao.includes("LIBER")
    ? "bg-green-100 text-green-700"
    : acao.includes("RESET")
    ? "bg-purple-100 text-purple-700"
    : acao.includes("LOGIN")
    ? "bg-blue-100 text-blue-700"
    : acao.includes("CANCEL")
    ? "bg-slate-200 text-slate-700"
    : "bg-orange-100 text-orange-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-black ${classe}`}>
      <ShieldCheck size={13} className="inline mr-1" />
      {acao}
    </span>
  );
}
