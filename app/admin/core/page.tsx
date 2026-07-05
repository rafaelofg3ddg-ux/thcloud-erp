"use client";

import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Flag,
  GitBranch,
  RotateCcw,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { AdminCard, AdminHeader, AdminStatusBadge } from "../../../components/admin";
import { SYSTEM_VERSION } from "../../../lib/systemVersion";

const featureFlags = [
  { nome: "PDV", status: "Ativo" },
  { nome: "Ordem de Serviço", status: "Ativo" },
  { nome: "Financeiro", status: "Ativo" },
  { nome: "Relatórios", status: "Ativo" },
  { nome: "Infraestrutura", status: "Piloto" },
];

const eventos = [
  "Eventos padronizados do sistema",
  "Auditoria centralizada",
  "Feature flags por empresa",
  "Versionamento da plataforma",
  "Plano de rollback por sprint",
];

export default function AdminCorePage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <AdminHeader
        title="Core do Sistema"
        subtitle="Núcleo técnico da plataforma Th Cloud. Esta área concentra os padrões de eventos, flags, versionamento e rollback."
        breadcrumbs={[{ label: "Infraestrutura", href: "/admin/infraestrutura" }, { label: "Core do Sistema" }]}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminCard title="Core" value="Online" description="Núcleo operacional" icon={<Workflow size={22} />} />
        <AdminCard title="Versão" value={`v${SYSTEM_VERSION}`} description="Release atual" icon={<GitBranch size={22} />} />
        <AdminCard title="Flags" value={featureFlags.length} description="Controles disponíveis" icon={<Flag size={22} />} />
        <AdminCard title="Rollback" value="Manual" description="Retorno por sprint" icon={<RotateCcw size={22} />} />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <AdminCard title="Feature Flags" description="Controle de recursos por cliente ou plano">
          <div className="space-y-3">
            {featureFlags.map((flag) => (
              <div key={flag.nome} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="font-black text-slate-700">{flag.nome}</span>
                <AdminStatusBadge status={flag.status === "Ativo" ? "online" : "atencao"}>{flag.status}</AdminStatusBadge>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="Eventos do Core" description="Padrão de eventos para futuras integrações">
          <div className="space-y-3">
            {eventos.map((evento) => (
              <div key={evento} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
                <CheckCircle2 size={18} className="text-emerald-600" />
                {evento}
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="Guia de Rollback" description="Procedimento padrão para voltar uma sprint">
          <div className="space-y-3 text-sm font-semibold text-slate-600">
            <div className="flex items-start gap-3"><ClipboardList size={18} className="mt-0.5 text-blue-700" /> Identificar a sprint aplicada.</div>
            <div className="flex items-start gap-3"><ShieldCheck size={18} className="mt-0.5 text-blue-700" /> Restaurar o pacote anterior validado.</div>
            <div className="flex items-start gap-3"><Activity size={18} className="mt-0.5 text-blue-700" /> Rodar build e testar módulos principais.</div>
          </div>
          <Link href="/admin/infraestrutura" className="mt-4 inline-flex rounded-2xl bg-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-blue-800">
            Voltar para Infraestrutura
          </Link>
        </AdminCard>
      </section>
    </main>
  );
}
