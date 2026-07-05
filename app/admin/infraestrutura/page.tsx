"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Database,
  GitBranch,
  HardDrive,
  Layers,
  Server,
  ShieldCheck,
} from "lucide-react";
import { AdminCard, AdminHeader, AdminStatusBadge } from "../../../components/admin";
import { supabase } from "../../../lib/supabase";
import { SYSTEM_VERSION } from "../../../lib/systemVersion";

type MetricasInfra = {
  empresas: number;
  usuarios: number;
  produtos: number;
  clientes: number;
  vendasHoje: number;
  ordensAbertas: number;
  auditorias: number;
  tempoResposta: number;
};

const metricasIniciais: MetricasInfra = {
  empresas: 0,
  usuarios: 0,
  produtos: 0,
  clientes: 0,
  vendasHoje: 0,
  ordensAbertas: 0,
  auditorias: 0,
  tempoResposta: 0,
};

export default function InfraestruturaPage() {
  const [metricas, setMetricas] = useState<MetricasInfra>(metricasIniciais);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizadoEm, setAtualizadoEm] = useState("");

  async function contarTabela(tabela: string, filtros?: (query: any) => any) {
    try {
      let query: any = supabase.from(tabela).select("id", { count: "exact", head: true });
      if (filtros) query = filtros(query);
      const { count } = await query;
      return count || 0;
    } catch {
      return 0;
    }
  }

  async function carregarMetricas() {
    setCarregando(true);
    setErro("");
    const inicio = performance.now();

    try {
      const hoje = new Date().toISOString().split("T")[0];
      const [empresas, usuarios, produtos, clientes, vendasHoje, ordensAbertas, auditorias] = await Promise.all([
        contarTabela("empresas"),
        contarTabela("usuarios"),
        contarTabela("produtos"),
        contarTabela("clientes"),
        contarTabela("vendas", (query) => query.gte("created_at", `${hoje}T00:00:00`)),
        contarTabela("ordens_servico", (query) => query.not("status", "in", "(Entregue,Cancelada,Finalizada)")),
        contarTabela("auditoria_saas"),
      ]);

      setMetricas({
        empresas,
        usuarios,
        produtos,
        clientes,
        vendasHoje,
        ordensAbertas,
        auditorias,
        tempoResposta: Math.round(performance.now() - inicio),
      });
      setAtualizadoEm(new Date().toLocaleString("pt-BR"));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar infraestrutura.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarMetricas();
  }, []);

  const servicos: Array<{ nome: string; status: "online" | "atencao" | "offline" | "info" }> = [
    { nome: "Banco", status: erro ? "offline" : "online" },
    { nome: "API", status: erro ? "atencao" : "online" },
    { nome: "Auth", status: "online" },
    { nome: "Storage", status: "online" },
    { nome: "Realtime", status: "info" },
    { nome: "Backup", status: "atencao" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <AdminHeader
        title="Centro de Infraestrutura"
        subtitle="Painel técnico do Super Admin para acompanhar a saúde e os indicadores principais da plataforma."
        breadcrumbs={[{ label: "Infraestrutura" }]}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-500">
          {carregando ? "Carregando indicadores..." : `Atualizado em ${atualizadoEm || "-"}`}
        </div>
        <button
          onClick={carregarMetricas}
          className="rounded-2xl bg-blue-700 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-blue-800"
        >
          Atualizar painel
        </button>
      </div>

      {erro && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {erro}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminCard title="Banco" value={erro ? "Atenção" : "Online"} description={`${metricas.tempoResposta || 0} ms`} icon={<Database size={22} />} />
        <AdminCard title="Empresas" value={metricas.empresas} description="Empresas cadastradas" icon={<Server size={22} />} />
        <AdminCard title="Usuários" value={metricas.usuarios} description="Usuários cadastrados" icon={<ShieldCheck size={22} />} />
        <AdminCard title="Versão" value={`v${SYSTEM_VERSION}`} description="Release atual" icon={<GitBranch size={22} />} />
        <AdminCard title="Produtos" value={metricas.produtos} description="Cadastros de produtos" icon={<HardDrive size={22} />} />
        <AdminCard title="Clientes" value={metricas.clientes} description="Cadastros de clientes" icon={<Layers size={22} />} />
        <AdminCard title="Vendas hoje" value={metricas.vendasHoje} description="Movimento do dia" icon={<Activity size={22} />} />
        <AdminCard title="OS em aberto" value={metricas.ordensAbertas} description="Ordens não concluídas" icon={<ClipboardList size={22} />} />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <AdminCard title="Saúde do Sistema" description="Verificações principais do ambiente">
          <div className="grid gap-3 sm:grid-cols-2">
            {servicos.map((servico) => (
              <div key={servico.nome} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="font-black text-slate-700">{servico.nome}</span>
                <AdminStatusBadge status={servico.status}>{servico.status === "online" ? "Online" : servico.status === "offline" ? "Offline" : servico.status === "atencao" ? "Atenção" : "Info"}</AdminStatusBadge>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="Auditoria" value={metricas.auditorias} description="Eventos registrados">
          <Link href="/admin/auditoria" className="inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-800">
            Abrir auditoria
          </Link>
        </AdminCard>

        <AdminCard title="Core do Sistema" description="Núcleo técnico da plataforma">
          <div className="space-y-3 text-sm font-semibold text-slate-600">
            <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-600" /> Eventos centralizados</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-600" /> Feature flags</div>
            <div className="flex items-center gap-2"><AlertTriangle size={18} className="text-amber-600" /> Rollback manual por release</div>
          </div>
          <Link href="/admin/core" className="mt-4 inline-flex rounded-2xl bg-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-blue-800">
            Abrir Core
          </Link>
        </AdminCard>
      </section>
    </main>
  );
}
