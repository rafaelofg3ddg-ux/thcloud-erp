"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileText,
  PackageCheck,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

type Empresa = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  cnpj: string | null;
  ativo: boolean | null;
  plano: string | null;
  valor_mensal: number | null;
  status_assinatura: string | null;
  data_inicio_assinatura: string | null;
  data_vencimento_assinatura: string | null;
  created_at: string | null;
  ultimo_acesso: string | null;
  ultima_venda: string | null;
  onboarding_concluido: boolean | null;
  etapa_onboarding: number | null;
  modulo_fiscal: boolean | null;
  modulo_whatsapp: boolean | null;
  modulo_delivery: boolean | null;
  modulo_crm: boolean | null;
  modulo_relatorios_premium: boolean | null;
  modulo_multiloja: boolean | null;
};

type Cobranca = {
  id: string;
  empresa_id: string | null;
  valor: number | null;
  vencimento: string | null;
  data_pagamento: string | null;
  status: string | null;
  created_at: string | null;
};

type Auditoria = {
  id: string;
  empresa_id: string | null;
  usuario: string | null;
  acao: string | null;
  descricao: string | null;
  created_at: string | null;
};

export default function AdminPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizadoEm, setAtualizadoEm] = useState<string>("");

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function percentual(valor: number) {
    return `${Number(valor || 0).toFixed(1).replace(".", ",")}%`;
  }

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  function adicionarDias(dias: number) {
    const data = new Date();
    data.setDate(data.getDate() + dias);
    return data.toISOString().split("T")[0];
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  function formatarDataHora(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function diasDesde(data: string | null) {
    if (!data) return 9999;
    const origem = new Date(data);
    const agora = new Date();
    const diferenca = agora.getTime() - origem.getTime();
    return Math.floor(diferenca / (1000 * 60 * 60 * 24));
  }

  function nomeEmpresa(empresa: Empresa) {
    return empresa.nome_fantasia || empresa.razao_social || "Empresa sem nome";
  }

  function statusNormalizado(status: string | null) {
    const valor = String(status || "").toLowerCase();
    if (valor === "ativo" || valor === "ativa") return "Ativo";
    if (valor === "teste") return "Teste";
    if (valor === "vencido" || valor === "vencida") return "Vencido";
    if (valor === "bloqueado" || valor === "bloqueada") return "Bloqueado";
    if (valor === "cancelado" || valor === "cancelada") return "Cancelado";
    if (valor === "suspenso" || valor === "suspensa") return "Suspenso";
    return status || "Ativo";
  }

  function estaVencida(empresa: Empresa) {
    if (statusNormalizado(empresa.status_assinatura) === "Vencido") return true;
    if (!empresa.data_vencimento_assinatura) return false;
    return empresa.data_vencimento_assinatura < hojeISO();
  }

  function venceEmBreve(empresa: Empresa) {
    if (!empresa.data_vencimento_assinatura) return false;
    if (estaVencida(empresa)) return false;
    const hoje = hojeISO();
    const limite = adicionarDias(7);
    return empresa.data_vencimento_assinatura >= hoje && empresa.data_vencimento_assinatura <= limite;
  }

  function statusEmpresa(empresa: Empresa) {
    if (empresa.ativo === false) return "Bloqueada";
    if (estaVencida(empresa)) return "Vencida";
    if (venceEmBreve(empresa)) return "Vencendo";
    return statusNormalizado(empresa.status_assinatura);
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

  function saudeEmpresa(empresa: Empresa) {
    const status = statusEmpresa(empresa);
    const semAcesso = diasDesde(empresa.ultimo_acesso);
    if (status === "Bloqueada" || status === "Vencida" || semAcesso > 30) return "Crítica";
    if (status === "Vencendo" || !empresa.onboarding_concluido || semAcesso > 15 || !empresa.ultima_venda) return "Atenção";
    return "Saudável";
  }

  function statusCobranca(cobranca: Cobranca) {
    const status = String(cobranca.status || "").toLowerCase();
    if (status === "pago" || status === "paga") return "Pago";
    if (status === "cancelado" || status === "cancelada") return "Cancelado";
    if (cobranca.vencimento && cobranca.vencimento < hojeISO()) return "Vencido";
    return "Aberta";
  }

  async function carregarDashboard() {
    setCarregando(true);
    const { data, error } = await supabase
      .from("empresas")
      .select("id,nome_fantasia,razao_social,cnpj,ativo,plano,valor_mensal,status_assinatura,data_inicio_assinatura,data_vencimento_assinatura,created_at,ultimo_acesso,ultima_venda,onboarding_concluido,etapa_onboarding,modulo_fiscal,modulo_whatsapp,modulo_delivery,modulo_crm,modulo_relatorios_premium,modulo_multiloja")
      .order("created_at", { ascending: false });

    if (error) {
      setCarregando(false);
      alert("Erro ao carregar Dashboard Master: " + error.message);
      return;
    }

    setEmpresas((data || []) as Empresa[]);

    const { data: cobrancasData } = await supabase
      .from("cobrancas_saas")
      .select("id,empresa_id,valor,vencimento,data_pagamento,status,created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    setCobrancas((cobrancasData || []) as Cobranca[]);

    const { data: auditoriaData } = await supabase
      .from("auditoria_saas")
      .select("id,empresa_id,usuario,acao,descricao,created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    setAuditorias((auditoriaData || []) as Auditoria[]);
    setAtualizadoEm(new Date().toLocaleString("pt-BR"));
    setCarregando(false);
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const totalEmpresas = empresas.length;
  const empresasAtivas = empresas.filter((empresa) => empresa.ativo !== false && !estaVencida(empresa)).length;
  const empresasTeste = empresas.filter((empresa) => statusNormalizado(empresa.status_assinatura) === "Teste").length;
  const empresasBloqueadas = empresas.filter((empresa) => empresa.ativo === false || ["Bloqueado", "Cancelado", "Suspenso"].includes(statusNormalizado(empresa.status_assinatura))).length;
  const assinaturasVencidas = empresas.filter((empresa) => estaVencida(empresa)).length;
  const assinaturasVencendo = empresas.filter((empresa) => venceEmBreve(empresa)).length;
  const onboardingConcluido = empresas.filter((empresa) => empresa.onboarding_concluido === true).length;
  const onboardingPendente = empresas.filter((empresa) => empresa.onboarding_concluido !== true).length;
  const semAcesso7Dias = empresas.filter((empresa) => diasDesde(empresa.ultimo_acesso) > 7).length;
  const semAcesso30Dias = empresas.filter((empresa) => diasDesde(empresa.ultimo_acesso) > 30).length;

  const receitaMensal = empresas
    .filter((empresa) => empresa.ativo !== false && !estaVencida(empresa))
    .reduce((total, empresa) => total + Number(empresa.valor_mensal || 0), 0);

  const receitaAnual = receitaMensal * 12;
  const receitaRecebida = cobrancas.filter((cobranca) => statusCobranca(cobranca) === "Pago").reduce((total, cobranca) => total + Number(cobranca.valor || 0), 0);
  const receitaAtrasada = cobrancas.filter((cobranca) => statusCobranca(cobranca) === "Vencido").reduce((total, cobranca) => total + Number(cobranca.valor || 0), 0);
  const receitaAberta = cobrancas.filter((cobranca) => statusCobranca(cobranca) === "Aberta").reduce((total, cobranca) => total + Number(cobranca.valor || 0), 0);
  const ticketMedio = empresasAtivas > 0 ? receitaMensal / empresasAtivas : 0;
  const taxaAtivas = totalEmpresas > 0 ? (empresasAtivas / totalEmpresas) * 100 : 0;
  const taxaBloqueio = totalEmpresas > 0 ? (empresasBloqueadas / totalEmpresas) * 100 : 0;
  const taxaImplantacao = totalEmpresas > 0 ? (onboardingConcluido / totalEmpresas) * 100 : 0;

  const saudeBoa = empresas.filter((empresa) => saudeEmpresa(empresa) === "Saudável").length;
  const saudeAtencao = empresas.filter((empresa) => saudeEmpresa(empresa) === "Atenção").length;
  const saudeCritica = empresas.filter((empresa) => saudeEmpresa(empresa) === "Crítica").length;
  const pontuacaoSaude = totalEmpresas > 0 ? Math.round((saudeBoa * 100 + saudeAtencao * 55 + saudeCritica * 10) / totalEmpresas) : 100;

  const planos = ["Básico", "Profissional", "Master", "Premium", "Enterprise"].map((plano) => ({
    nome: plano,
    total: empresas.filter((empresa) => empresa.plano === plano).length,
    receita: empresas.filter((empresa) => empresa.plano === plano && empresa.ativo !== false).reduce((total, empresa) => total + Number(empresa.valor_mensal || 0), 0),
  }));

  const totalModulosVendidos = empresas.reduce((total, empresa) => total + quantidadeModulos(empresa), 0);
  const empresasVencendoLista = empresas.filter((empresa) => venceEmBreve(empresa)).slice(0, 5);
  const empresasVencidasLista = empresas.filter((empresa) => estaVencida(empresa)).slice(0, 5);
  const implantacoesPendentes = empresas.filter((empresa) => empresa.onboarding_concluido !== true).slice(0, 5);

  const crescimentoClientes = useMemo(() => {
    const meses: Record<string, number> = {};
    empresas.forEach((empresa) => {
      if (!empresa.created_at) return;
      const chave = empresa.created_at.slice(0, 7);
      meses[chave] = (meses[chave] || 0) + 1;
    });
    return Object.entries(meses).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([mes, total]) => ({ mes, total }));
  }, [empresas]);

  const receitaPorMes = useMemo(() => {
    const meses: Record<string, number> = {};
    cobrancas.filter((cobranca) => statusCobranca(cobranca) === "Pago").forEach((cobranca) => {
      const base = cobranca.data_pagamento || cobranca.vencimento || cobranca.created_at?.slice(0, 10);
      if (!base) return;
      const chave = base.slice(0, 7);
      meses[chave] = (meses[chave] || 0) + Number(cobranca.valor || 0);
    });
    return Object.entries(meses).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([mes, total]) => ({ mes, total }));
  }, [cobrancas]);

  const maiorClientes = Math.max(...crescimentoClientes.map((item) => item.total), 1);
  const maiorReceita = Math.max(...receitaPorMes.map((item) => item.total), 1);

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 overflow-x-hidden">
      <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 rounded-[30px] p-6 lg:p-8 text-white shadow-xl mb-6 overflow-hidden relative">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <p className="text-blue-200 font-black">Painel Master THCloud</p>
            <h1 className="text-3xl lg:text-4xl font-black mt-2">Bem vindo, Super Admin! 👋</h1>
            <p className="mt-2 text-blue-100 max-w-4xl">Visão completa do seu SaaS em tempo real. Gerencie empresas, acompanhe métricas e garanta o sucesso dos seus clientes.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={carregarDashboard} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"><RefreshCw size={18} />{carregando ? "Atualizando..." : "Atualizar Dados"}</button>
            <Link href="/admin/empresas" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"><Building2 size={18} />Gerenciar Empresas</Link>
            <Link href="/admin/financeiro" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"><FileText size={18} />Relatório Executivo</Link>
            <Link href="/admin/empresas" className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"><PlusCircle size={18} />Adicionar Empresa</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-6 gap-4 mb-4">
        <Card titulo="Total de Empresas" valor={`${totalEmpresas}`} detalhe="100% do total" cor="text-blue-700" icone={<Building2 size={22} />} />
        <Card titulo="Ativas" valor={`${empresasAtivas}`} detalhe={`${percentual(taxaAtivas)} da base`} cor="text-green-700" icone={<CheckCircle2 size={22} />} />
        <Card titulo="Em Teste" valor={`${empresasTeste}`} detalhe="0,0% do total" cor="text-cyan-700" icone={<Clock size={22} />} />
        <Card titulo="Bloqueadas" valor={`${empresasBloqueadas}`} detalhe={`${percentual(taxaBloqueio)} da base`} cor="text-red-700" icone={<XCircle size={22} />} />
        <Card titulo="Vencendo (7 dias)" valor={`${assinaturasVencendo}`} detalhe="Próximos 7 dias" cor="text-orange-700" icone={<ShieldAlert size={22} />} />
        <Card titulo="Vencidas" valor={`${assinaturasVencidas}`} detalhe="Precisam atenção" cor="text-red-700" icone={<XCircle size={22} />} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1fr_1fr_2fr] gap-4 mb-4">
        <Card titulo="Onboarding OK" valor={`${onboardingConcluido}`} detalhe={`${percentual(taxaImplantacao)} concluído`} cor="text-green-700" icone={<CheckCircle2 size={22} />} />
        <Card titulo="Onboarding Pendente" valor={`${onboardingPendente}`} detalhe="Implantação incompleta" cor="text-orange-700" icone={<AlertTriangle size={22} />} />
        <Card titulo="Sem Acesso 7 Dias" valor={`${semAcesso7Dias}`} detalhe="Baixo engajamento" cor="text-purple-700" icone={<Users size={22} />} />
        <Card titulo="Sem Acesso 30 Dias" valor={`${semAcesso30Dias}`} detalhe="Risco de churn" cor="text-red-700" icone={<TrendingDown size={22} />} />
        <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm min-w-0">
          <p className="text-sm font-bold text-slate-500">Saúde Geral dos Clientes</p>
          <div className="mt-4 flex items-center gap-5">
            <div className="h-24 w-24 rounded-full border-[8px] border-blue-600 flex items-center justify-center"><div className="text-center"><p className="text-2xl font-black text-slate-950">{pontuacaoSaude}</p><p className="text-[10px] text-slate-500">/100</p></div></div>
            <div><p className="text-2xl font-black text-green-700">{pontuacaoSaude >= 70 ? "Saúde Boa" : pontuacaoSaude >= 45 ? "Atenção" : "Crítica"}</p><p className="text-sm text-slate-500 mt-1">{saudeBoa} saudável • {saudeAtencao} atenção • {saudeCritica} crítica</p></div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card titulo="MRR" valor={moeda(receitaMensal)} detalhe="Receita mensal recorrente" cor="text-purple-700" icone={<CircleDollarSign size={22} />} />
        <Card titulo="ARR" valor={moeda(receitaAnual)} detalhe="Receita anual recorrente" cor="text-blue-800" icone={<TrendingUp size={22} />} />
        <Card titulo="Recebido (mês)" valor={moeda(receitaRecebida)} detalhe="Cobranças pagas" cor="text-green-700" icone={<CheckCircle2 size={22} />} />
        <Card titulo="Em Aberto" valor={moeda(receitaAberta)} detalhe="Cobranças pendentes" cor="text-orange-700" icone={<Clock size={22} />} />
        <Card titulo="Atrasado" valor={moeda(receitaAtrasada)} detalhe="Cobranças vencidas" cor="text-red-700" icone={<XCircle size={22} />} />
        <Card titulo="Ticket Médio (mês)" valor={moeda(ticketMedio)} detalhe="Por empresa ativa" cor="text-purple-700" icone={<PackageCheck size={22} />} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        <GraficoBarras titulo="Crescimento de Empresas" subtitulo="Novas empresas cadastradas por mês." dados={crescimentoClientes.map((item) => ({ label: item.mes, texto: `${item.total}`, largura: Math.max(4, (item.total / maiorClientes) * 100) }))} />
        <GraficoBarras titulo="Receita Mensal (MRR)" subtitulo="Receita recorrente mês a mês." dados={receitaPorMes.length > 0 ? receitaPorMes.map((item) => ({ label: item.mes, texto: moeda(item.total), largura: Math.max(4, (item.total / maiorReceita) * 100) })) : [{ label: "Sem dados", texto: moeda(receitaMensal), largura: 8 }]} />
        <PlanoCard titulo="Top Planos" subtitulo="Distribuição de receita por plano." planos={planos} tipo="receita" moeda={moeda} />
        <PlanoCard titulo="Empresas por Plano" subtitulo="Quantidade de empresas por plano." planos={planos} tipo="quantidade" moeda={moeda} />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        <ListaSimples titulo="Empresas Vencendo" subtitulo="Próximos 7 dias" vazio="Nenhuma empresa vencendo nos próximos 7 dias." itens={empresasVencendoLista.map((empresa) => ({ titulo: nomeEmpresa(empresa), detalhe: `Vence em ${formatarData(empresa.data_vencimento_assinatura)}`, cor: "green" }))} />
        <ListaSimples titulo="Empresas Vencidas" subtitulo="Assinaturas em atraso" vazio="Nenhuma empresa vencida." itens={empresasVencidasLista.map((empresa) => ({ titulo: nomeEmpresa(empresa), detalhe: `Vencida em ${formatarData(empresa.data_vencimento_assinatura)}`, cor: "red" }))} />
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-5 lg:p-6">
          <h2 className="text-xl font-black text-slate-900">Implantações Pendentes</h2><p className="text-sm text-slate-500 mb-4">Clientes com onboarding incompleto.</p>
          <div className="space-y-4">
            {implantacoesPendentes.map((empresa) => { const etapa = Number(empresa.etapa_onboarding || 0); const progresso = Math.min(etapa * 20, 100); return <div key={empresa.id}><div className="flex items-center justify-between mb-1"><div><p className="font-black text-slate-900 text-sm">{nomeEmpresa(empresa)}</p><p className="text-xs text-slate-500">Etapa {etapa} de 5 - {etapa === 0 ? "Inicial" : "Configuração"}</p></div><p className="text-xs font-black text-slate-700">{progresso}%</p></div><div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-700 rounded-full" style={{ width: `${Math.max(progresso, 5)}%` }} /></div></div>; })}
            {implantacoesPendentes.length === 0 && <p className="text-center text-slate-500 py-8">Nenhuma implantação pendente.</p>}
          </div>
          <Link href="/admin/implantacoes" className="block text-center text-blue-700 font-black text-sm mt-5">Ver todas implantações</Link>
        </div>
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-5 lg:p-6">
          <div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="text-xl font-black text-slate-900">Últimas Ações</h2><p className="text-sm text-slate-500">Eventos mais recentes.</p></div><Link href="/admin/auditoria" className="text-blue-700 font-black text-sm">Ver todas</Link></div>
          <div className="space-y-3">
            {auditorias.map((item) => { const empresa = empresas.find((e) => e.id === item.empresa_id); return <div key={item.id} className="grid grid-cols-[110px_1fr] gap-3 text-sm"><p className="text-slate-500">{formatarDataHora(item.created_at)}</p><div><p className="font-black text-slate-900">{item.acao || "Ação"}</p><p className="text-xs text-slate-500">{empresa ? nomeEmpresa(empresa) : item.usuario || "Sistema"}</p></div></div>; })}
            {auditorias.length === 0 && <p className="text-center text-slate-500 py-8">Nenhuma ação registrada.</p>}
          </div>
        </div>
      </section>

      <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pb-2"><div className="inline-flex items-center gap-2"><span>Última atualização: {atualizadoEm || "-"}</span><button onClick={carregarDashboard} className="text-blue-700"><RefreshCw size={14} /></button></div><span>THCloud ERP - Painel Master SaaS v1.0.0</span></footer>
    </div>
  );
}

function Card({ titulo, valor, detalhe, cor, icone }: { titulo: string; valor: string; detalhe: string; cor: string; icone: React.ReactNode }) {
  return <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm min-w-0"><div className="flex items-center justify-between gap-2"><p className="text-sm font-black text-slate-600">{titulo}</p><div className={`${cor} bg-slate-50 border border-slate-100 rounded-2xl p-2`}>{icone}</div></div><h2 className={`text-2xl font-black mt-3 ${cor}`}>{valor}</h2><p className="text-xs text-slate-500 mt-1">{detalhe}</p></div>;
}

function GraficoBarras({ titulo, subtitulo, dados }: { titulo: string; subtitulo: string; dados: { label: string; texto: string; largura: number }[] }) {
  return <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-5 lg:p-6"><div className="flex items-start justify-between gap-3 mb-5"><div><h2 className="text-xl font-black text-slate-900">{titulo}</h2><p className="text-sm text-slate-500">{subtitulo}</p></div><span className="text-xs font-black text-slate-500 border border-slate-200 rounded-xl px-3 py-1">Últimos 6 meses</span></div><div className="space-y-4">{dados.map((item) => <div key={item.label}><div className="flex items-center justify-between gap-3 mb-2"><p className="font-black text-slate-800 text-sm">{item.label}</p><p className="font-black text-blue-700 text-sm">{item.texto}</p></div><div className="h-4 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-700 rounded-full" style={{ width: `${item.largura}%` }} /></div></div>)}</div></div>;
}

function PlanoCard({ titulo, subtitulo, planos, tipo, moeda }: { titulo: string; subtitulo: string; planos: { nome: string; total: number; receita: number }[]; tipo: "receita" | "quantidade"; moeda: (valor: number) => string }) {
  const totalReceita = planos.reduce((soma, item) => soma + item.receita, 0);
  const totalQuantidade = planos.reduce((soma, item) => soma + item.total, 0);
  return <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-5 lg:p-6"><div className="flex items-start justify-between gap-3 mb-5"><div><h2 className="text-xl font-black text-slate-900">{titulo}</h2><p className="text-sm text-slate-500">{subtitulo}</p></div><span className="text-xs font-black text-slate-500 border border-slate-200 rounded-xl px-3 py-1">Este mês</span></div><div className="flex items-center gap-5"><div className="h-24 w-24 rounded-full border-[16px] border-blue-600 flex items-center justify-center shrink-0"><div className="h-10 w-10 rounded-full bg-white" /></div><div className="flex-1 space-y-3">{planos.slice(0, 4).map((plano, index) => { const base = tipo === "receita" ? totalReceita : totalQuantidade; const valor = tipo === "receita" ? plano.receita : plano.total; const perc = base > 0 ? (valor / base) * 100 : 0; return <div key={plano.nome} className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-blue-700" : index === 1 ? "bg-orange-500" : index === 2 ? "bg-green-600" : "bg-purple-600"}`} /><span className="text-sm font-bold text-slate-700">{plano.nome}</span></div><span className="text-sm font-black text-slate-900">{tipo === "receita" ? moeda(plano.receita) : plano.total}<span className="text-slate-400 ml-2">{percentualLocal(perc)}</span></span></div>; })}</div></div></div>;
}

function percentualLocal(valor: number) {
  return `${Number(valor || 0).toFixed(1).replace(".", ",")}%`;
}

function ListaSimples({ titulo, subtitulo, vazio, itens }: { titulo: string; subtitulo: string; vazio: string; itens: { titulo: string; detalhe: string; cor: "green" | "red" }[] }) {
  return <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-5 lg:p-6"><h2 className="text-xl font-black text-slate-900">{titulo}</h2><p className="text-sm text-slate-500 mb-5">{subtitulo}</p><div className="space-y-3">{itens.map((item) => <div key={`${item.titulo}-${item.detalhe}`} className="flex items-start gap-3"><div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${item.cor === "green" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{item.cor === "green" ? <CalendarClock size={22} /> : <XCircle size={22} />}</div><div><p className="font-black text-slate-900">{item.titulo}</p><p className="text-sm text-slate-500">{item.detalhe}</p></div></div>)}{itens.length === 0 && <p className="text-center text-slate-500 py-8">{vazio}</p>}</div></div>;
}
