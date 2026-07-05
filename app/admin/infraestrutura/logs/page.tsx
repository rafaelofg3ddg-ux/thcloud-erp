"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Clock, Database, FileText, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import InfraCard from "../../../../components/infrastructure/InfraCard";
import InfraPageHeader from "../../../../components/infrastructure/InfraPageHeader";
import InfraStatusBadge from "../../../../components/infrastructure/InfraStatusBadge";

type LogEvento = {
  id: string;
  titulo: string;
  descricao: string;
  modulo: string;
  origem: string;
  created_at: string | null;
  status: "ok" | "info" | "atencao" | "erro";
};

export default function InfraLogsPage() {
  const [logs, setLogs] = useState<LogEvento[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [tempoResposta, setTempoResposta] = useState<number | null>(null);

  function classificarStatus(texto: string): LogEvento["status"] {
    const normalizado = texto.toLowerCase();
    if (normalizado.includes("erro") || normalizado.includes("falha") || normalizado.includes("bloque")) return "erro";
    if (normalizado.includes("alerta") || normalizado.includes("atenção") || normalizado.includes("atencao")) return "atencao";
    if (normalizado.includes("login") || normalizado.includes("venda") || normalizado.includes("os")) return "ok";
    return "info";
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  async function carregarLogs() {
    setCarregando(true);
    const inicio = performance.now();

    const [auditoria, auditoriaSaas, vendas, os] = await Promise.all([
      supabase.from("auditoria").select("id,acao,descricao,created_at").order("created_at", { ascending: false }).limit(40),
      supabase.from("auditoria_saas").select("id,acao,descricao,created_at").order("created_at", { ascending: false }).limit(40),
      supabase.from("vendas").select("id,numero_venda,total,created_at").order("created_at", { ascending: false }).limit(20),
      supabase.from("ordens_servico").select("id,numero_os,status,created_at").order("created_at", { ascending: false }).limit(20),
    ]);

    const lista: LogEvento[] = [];

    ((auditoria.data || []) as { id: string; acao: string | null; descricao: string | null; created_at: string | null }[]).forEach((item) => {
      const texto = `${item.acao || "Evento"} ${item.descricao || ""}`;
      lista.push({
        id: `auditoria-${item.id}`,
        titulo: item.acao || "Evento ERP",
        descricao: item.descricao || "Registro operacional do ERP.",
        modulo: "ERP",
        origem: "auditoria",
        created_at: item.created_at,
        status: classificarStatus(texto),
      });
    });

    ((auditoriaSaas.data || []) as { id: string; acao: string | null; descricao: string | null; created_at: string | null }[]).forEach((item) => {
      const texto = `${item.acao || "Evento"} ${item.descricao || ""}`;
      lista.push({
        id: `auditoria-saas-${item.id}`,
        titulo: item.acao || "Evento SaaS",
        descricao: item.descricao || "Registro administrativo do SaaS.",
        modulo: "SaaS",
        origem: "auditoria_saas",
        created_at: item.created_at,
        status: classificarStatus(texto),
      });
    });

    ((vendas.data || []) as { id: string; numero_venda: string | null; total: number | null; created_at: string | null }[]).forEach((item) => {
      lista.push({
        id: `venda-${item.id}`,
        titulo: `Venda ${item.numero_venda || item.id}`,
        descricao: `Venda registrada no PDV. Total: ${Number(item.total || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
        modulo: "PDV",
        origem: "vendas",
        created_at: item.created_at,
        status: "ok",
      });
    });

    ((os.data || []) as { id: string; numero_os: string | null; status: string | null; created_at: string | null }[]).forEach((item) => {
      lista.push({
        id: `os-${item.id}`,
        titulo: `OS ${item.numero_os || item.id}`,
        descricao: `Ordem de Serviço registrada. Status: ${item.status || "-"}`,
        modulo: "Ordem de Serviço",
        origem: "ordens_servico",
        created_at: item.created_at,
        status: "info",
      });
    });

    lista.sort((a, b) => {
      const dataA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dataB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dataB - dataA;
    });

    setLogs(lista.slice(0, 120));
    setTempoResposta(Math.round(performance.now() - inicio));
    setCarregando(false);
  }

  useEffect(() => {
    carregarLogs();
  }, []);

  const logsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return logs;
    return logs.filter((log) => `${log.titulo} ${log.descricao} ${log.modulo} ${log.origem}`.toLowerCase().includes(termo));
  }, [logs, busca]);

  const qtdAlertas = logs.filter((log) => log.status === "erro" || log.status === "atencao").length;
  const qtdOperacionais = logs.filter((log) => log.modulo === "PDV" || log.modulo === "Ordem de Serviço").length;
  const qtdTecnicos = logs.filter((log) => log.modulo === "SaaS" || log.modulo === "ERP").length;

  return (
    <main className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <InfraPageHeader
        titulo="Central de Logs"
        subtitulo="Linha do tempo técnica e operacional com eventos de auditoria, vendas, ordens de serviço e registros do SaaS."
        acoes={
          <button onClick={carregarLogs} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-blue-800 shadow-lg hover:bg-blue-50">
            <RefreshCw size={18} className={carregando ? "animate-spin" : ""} /> Atualizar
          </button>
        }
      />

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfraCard titulo="Logs" valor={`${logsFiltrados.length}`} detalhe="Eventos exibidos" tom="azul" icone={<FileText size={22} />} />
        <InfraCard titulo="Alertas" valor={`${qtdAlertas}`} detalhe="Atenções ou erros" tom={qtdAlertas > 0 ? "amarelo" : "verde"} icone={<ShieldCheck size={22} />} />
        <InfraCard titulo="Operacionais" valor={`${qtdOperacionais}`} detalhe="PDV e OS" tom="verde" icone={<Activity size={22} />} />
        <InfraCard titulo="Resposta" valor={tempoResposta ? `${tempoResposta} ms` : "-"} detalhe="Tempo da última leitura" tom="roxo" icone={<Database size={22} />} />
      </section>

      <section className="mb-6 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm lg:p-5">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar nos logs por módulo, origem, título ou descrição..."
            className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950">Timeline de Eventos</h2>
            <p className="text-sm font-semibold text-slate-500">Eventos recentes ordenados por data/hora.</p>
          </div>
          <InfraStatusBadge status={qtdAlertas > 0 ? "atencao" : "ok"}>{qtdAlertas > 0 ? "Com alertas" : "Sem alertas críticos"}</InfraStatusBadge>
        </div>

        <div className="relative space-y-4">
          <div className="absolute left-[18px] top-2 bottom-2 w-px bg-slate-200" />
          {carregando && <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">Carregando logs...</p>}
          {!carregando && logsFiltrados.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">Nenhum log encontrado.</p>}
          {logsFiltrados.map((log) => (
            <div key={log.id} className="relative flex gap-4">
              <div className={`relative z-10 mt-1 h-9 w-9 rounded-full border-4 border-white shadow-sm ${log.status === "erro" ? "bg-red-500" : log.status === "atencao" ? "bg-amber-500" : log.status === "ok" ? "bg-emerald-500" : "bg-blue-500"}`} />
              <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-950">{log.titulo}</h3>
                      <InfraStatusBadge status={log.status}>{log.modulo}</InfraStatusBadge>
                    </div>
                    <p className="mt-2 font-semibold text-slate-600">{log.descricao}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">Origem: {log.origem}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-black text-slate-500">
                    <Clock size={16} /> {formatarData(log.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
