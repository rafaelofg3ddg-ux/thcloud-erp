"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, Filter, RefreshCw, Search, ShieldCheck, User } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import InfraCard from "../../../../components/infrastructure/InfraCard";
import InfraPageHeader from "../../../../components/infrastructure/InfraPageHeader";
import InfraStatusBadge from "../../../../components/infrastructure/InfraStatusBadge";

type AuditoriaEvento = {
  id: string;
  empresa_id: string | null;
  usuario: string | null;
  acao: string | null;
  descricao: string | null;
  ip: string | null;
  created_at: string | null;
  origem: "auditoria" | "auditoria_saas";
};

type Empresa = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  cnpj: string | null;
};

export default function InfraAuditoriaPage() {
  const [eventos, setEventos] = useState<AuditoriaEvento[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState("Todas");
  const [filtroPeriodo, setFiltroPeriodo] = useState("30");

  function inicioHoje() {
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

  function formatarData(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function nomeEmpresa(empresaId: string | null) {
    if (!empresaId) return "Sistema";
    const empresa = empresas.find((item) => item.id === empresaId);
    return empresa?.nome_fantasia || empresa?.razao_social || "Empresa não localizada";
  }

  function documentoEmpresa(empresaId: string | null) {
    if (!empresaId) return "-";
    const empresa = empresas.find((item) => item.id === empresaId);
    return empresa?.cnpj || "-";
  }

  function normalizar(valor: string | null) {
    return String(valor || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  async function carregarDados() {
    setCarregando(true);

    const { data: empresasData } = await supabase
      .from("empresas")
      .select("id,nome_fantasia,razao_social,cnpj")
      .order("nome_fantasia", { ascending: true });

    setEmpresas((empresasData || []) as Empresa[]);

    const [auditoriaGeral, auditoriaSaas] = await Promise.all([
      supabase
        .from("auditoria")
        .select("id,empresa_id,usuario,acao,descricao,ip,created_at")
        .order("created_at", { ascending: false })
        .limit(800),
      supabase
        .from("auditoria_saas")
        .select("id,empresa_id,usuario,acao,descricao,ip,created_at")
        .order("created_at", { ascending: false })
        .limit(800),
    ]);

    const lista: AuditoriaEvento[] = [
      ...((auditoriaGeral.data || []) as Omit<AuditoriaEvento, "origem">[]).map((item) => ({
        ...item,
        origem: "auditoria" as const,
      })),
      ...((auditoriaSaas.data || []) as Omit<AuditoriaEvento, "origem">[]).map((item) => ({
        ...item,
        origem: "auditoria_saas" as const,
      })),
    ].sort((a, b) => {
      const dataA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dataB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dataB - dataA;
    });

    setEventos(lista);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const eventosFiltrados = useMemo(() => {
    const termo = normalizar(busca);
    const dataLimite = filtroPeriodo === "hoje" ? inicioHoje() : diasAtras(Number(filtroPeriodo || 30));

    return eventos.filter((evento) => {
      const dataEvento = evento.created_at ? new Date(evento.created_at) : null;
      const texto = normalizar(
        `${evento.usuario || ""} ${evento.acao || ""} ${evento.descricao || ""} ${evento.ip || ""} ${evento.origem} ${nomeEmpresa(evento.empresa_id)} ${documentoEmpresa(evento.empresa_id)}`
      );

      const passaBusca = !termo || texto.includes(termo);
      const passaOrigem = filtroOrigem === "Todas" || evento.origem === filtroOrigem;
      const passaPeriodo = !dataEvento || dataEvento >= dataLimite;

      return passaBusca && passaOrigem && passaPeriodo;
    });
  }, [eventos, empresas, busca, filtroOrigem, filtroPeriodo]);

  const eventosHoje = eventos.filter((evento) => evento.created_at && new Date(evento.created_at) >= inicioHoje()).length;
  const empresasImpactadas = new Set(eventosFiltrados.map((evento) => evento.empresa_id).filter(Boolean)).size;
  const usuariosImpactados = new Set(eventosFiltrados.map((evento) => evento.usuario).filter(Boolean)).size;

  function exportarCsv() {
    const linhas = [
      ["data_hora", "origem", "empresa", "usuario", "acao", "descricao", "ip"],
      ...eventosFiltrados.map((evento) => [
        formatarData(evento.created_at),
        evento.origem,
        nomeEmpresa(evento.empresa_id),
        evento.usuario || "Sistema",
        evento.acao || "EVENTO",
        String(evento.descricao || "").replace(/\n/g, " "),
        evento.ip || "-",
      ]),
    ];

    const csv = linhas
      .map((linha) => linha.map((coluna) => `"${String(coluna).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `auditoria-thcloud-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <InfraPageHeader
        titulo="Auditoria e Logs"
        subtitulo="Consulta centralizada dos eventos técnicos, operacionais e administrativos registrados no TH Cloud."
        acoes={
          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={exportarCsv} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 font-black text-white ring-1 ring-white/25 hover:bg-white/20">
              <Download size={18} /> Exportar CSV
            </button>
            <button onClick={carregarDados} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-blue-800 shadow-lg hover:bg-blue-50">
              <RefreshCw size={18} className={carregando ? "animate-spin" : ""} /> Atualizar
            </button>
          </div>
        }
      />

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfraCard titulo="Eventos Hoje" valor={`${eventosHoje}`} detalhe="Registros nas últimas horas" tom="azul" icone={<CalendarDays size={22} />} />
        <InfraCard titulo="Eventos Filtrados" valor={`${eventosFiltrados.length}`} detalhe="Resultado da busca atual" tom="verde" icone={<Filter size={22} />} />
        <InfraCard titulo="Empresas" valor={`${empresasImpactadas}`} detalhe="Impactadas no filtro" tom="roxo" icone={<ShieldCheck size={22} />} />
        <InfraCard titulo="Usuários" valor={`${usuariosImpactados}`} detalhe="Identificados no filtro" tom="amarelo" icone={<User size={22} />} />
      </section>

      <section className="mb-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por empresa, usuário, ação, descrição, IP ou origem..."
              className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <select value={filtroOrigem} onChange={(e) => setFiltroOrigem(e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100">
            <option>Todas</option>
            <option value="auditoria">Auditoria ERP</option>
            <option value="auditoria_saas">Auditoria SaaS</option>
          </select>

          <select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100">
            <option value="hoje">Hoje</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-4 text-left">Data/Hora</th>
                <th className="p-4 text-left">Origem</th>
                <th className="p-4 text-left">Empresa</th>
                <th className="p-4 text-left">Usuário</th>
                <th className="p-4 text-left">Ação</th>
                <th className="p-4 text-left">Descrição</th>
                <th className="p-4 text-left">IP</th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr><td colSpan={7} className="p-8 text-center font-semibold text-slate-500">Carregando auditoria...</td></tr>
              )}
              {!carregando && eventosFiltrados.map((evento) => (
                <tr key={`${evento.origem}-${evento.id}`} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="p-4 font-black text-slate-900">{formatarData(evento.created_at)}</td>
                  <td className="p-4"><InfraStatusBadge status={evento.origem === "auditoria_saas" ? "info" : "ok"}>{evento.origem === "auditoria_saas" ? "SaaS" : "ERP"}</InfraStatusBadge></td>
                  <td className="p-4"><p className="font-black text-slate-900">{nomeEmpresa(evento.empresa_id)}</p><p className="text-xs font-semibold text-slate-500">{documentoEmpresa(evento.empresa_id)}</p></td>
                  <td className="p-4 font-bold text-slate-700">{evento.usuario || "Sistema"}</td>
                  <td className="p-4 font-black text-blue-700">{String(evento.acao || "EVENTO").toUpperCase()}</td>
                  <td className="p-4 font-semibold text-slate-700">{evento.descricao || "-"}</td>
                  <td className="p-4 font-semibold text-slate-500">{evento.ip || "-"}</td>
                </tr>
              ))}
              {!carregando && eventosFiltrados.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center font-semibold text-slate-500">Nenhum evento encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
