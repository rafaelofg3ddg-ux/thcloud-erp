"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Eye,
  Filter,
  PackagePlus,
  RefreshCw,
  Search,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Empresa = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  ativo: boolean | null;
  plano: string | null;
  status_assinatura: string | null;
  data_vencimento_assinatura: string | null;
  created_at: string | null;
  ultimo_acesso: string | null;
  ultima_venda: string | null;
  onboarding_concluido: boolean | null;
  etapa_onboarding: number | null;
};

type Registro = { id: string; empresa_id: string | null; created_at?: string | null };

type LinhaImplantacao = {
  empresa: Empresa;
  produtos: number;
  clientes: number;
  vendas: number;
  primeiraVenda: string | null;
  progresso: number;
  status: string;
};

export default function AdminImplantacoesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [produtos, setProdutos] = useState<Registro[]>([]);
  const [clientes, setClientes] = useState<Registro[]>([]);
  const [vendas, setVendas] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  function nomeEmpresa(empresa: Empresa) {
    return empresa.nome_fantasia || empresa.razao_social || "Empresa sem nome";
  }

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  function formatarDataHora(data: string | null | undefined) {
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

  function statusEmpresa(empresa: Empresa) {
    if (empresa.ativo === false) return "Bloqueada";
    if (empresa.data_vencimento_assinatura && empresa.data_vencimento_assinatura < hojeISO()) return "Vencida";
    if (empresa.status_assinatura === "Teste") return "Teste";
    if (empresa.status_assinatura === "Cancelado") return "Cancelada";
    if (empresa.status_assinatura === "Suspenso") return "Suspensa";
    return "Ativa";
  }

  async function carregarDados() {
    setCarregando(true);

    const { data: empresasData, error: empresasError } = await supabase
      .from("empresas")
      .select("id,nome_fantasia,razao_social,cnpj,email,telefone,celular,ativo,plano,status_assinatura,data_vencimento_assinatura,created_at,ultimo_acesso,ultima_venda,onboarding_concluido,etapa_onboarding")
      .order("created_at", { ascending: false });

    if (empresasError) {
      setCarregando(false);
      alert("Erro ao carregar implantações: " + empresasError.message);
      return;
    }

    setEmpresas((empresasData || []) as Empresa[]);

    const { data: produtosData } = await supabase.from("produtos").select("id,empresa_id").limit(10000);
    setProdutos((produtosData || []) as Registro[]);

    const { data: clientesData } = await supabase.from("clientes").select("id,empresa_id").limit(10000);
    setClientes((clientesData || []) as Registro[]);

    const { data: vendasData } = await supabase.from("vendas").select("id,empresa_id,created_at").limit(10000);
    setVendas((vendasData || []) as Registro[]);

    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function contar(lista: Registro[], empresaId: string) {
    return lista.filter((item) => item.empresa_id === empresaId).length;
  }

  function primeiraVenda(empresaId: string) {
    const lista = vendas
      .filter((item) => item.empresa_id === empresaId && item.created_at)
      .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
    return lista[0]?.created_at || null;
  }

  function calcularLinha(empresa: Empresa): LinhaImplantacao {
    const totalProdutos = contar(produtos, empresa.id);
    const totalClientes = contar(clientes, empresa.id);
    const totalVendas = contar(vendas, empresa.id);

    let pontos = 0;
    if (empresa.onboarding_concluido) pontos += 25;
    else pontos += Math.min(Number(empresa.etapa_onboarding || 0) * 5, 20);
    if (empresa.ultimo_acesso) pontos += 20;
    if (totalProdutos > 0) pontos += 20;
    if (totalClientes > 0) pontos += 15;
    if (totalVendas > 0) pontos += 20;

    let status = "Não iniciada";
    if (pontos >= 100) status = "Concluída";
    else if (pontos >= 60) status = "Avançada";
    else if (pontos >= 25) status = "Em andamento";
    else status = "Pendente";

    if (statusEmpresa(empresa) === "Bloqueada" || statusEmpresa(empresa) === "Vencida") status = "Bloqueada";

    return {
      empresa,
      produtos: totalProdutos,
      clientes: totalClientes,
      vendas: totalVendas,
      primeiraVenda: primeiraVenda(empresa.id),
      progresso: Math.min(pontos, 100),
      status,
    };
  }

  const linhas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return empresas
      .map((empresa) => calcularLinha(empresa))
      .filter((linha) => {
        const texto = `${nomeEmpresa(linha.empresa)} ${linha.empresa.cnpj || ""} ${linha.empresa.email || ""} ${linha.empresa.plano || ""}`.toLowerCase();
        const passaBusca = !termo || texto.includes(termo);
        const passaStatus = filtroStatus === "Todos" || linha.status === filtroStatus;
        return passaBusca && passaStatus;
      });
  }, [empresas, produtos, clientes, vendas, busca, filtroStatus]);

  const concluidas = linhas.filter((linha) => linha.status === "Concluída").length;
  const andamento = linhas.filter((linha) => linha.status === "Em andamento" || linha.status === "Avançada").length;
  const pendentes = linhas.filter((linha) => linha.status === "Pendente" || linha.status === "Não iniciada").length;
  const bloqueadas = linhas.filter((linha) => linha.status === "Bloqueada").length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 overflow-x-hidden">
      <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 rounded-[30px] p-6 lg:p-8 text-white shadow-xl mb-6 overflow-hidden relative">
        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <p className="text-blue-200 font-black">Painel Master THCloud</p>
            <h1 className="text-3xl lg:text-4xl font-black mt-2">Central de Implantação</h1>
            <p className="mt-2 text-blue-100 max-w-4xl">
              Acompanhe onboarding, primeiro acesso, produtos, clientes, vendas e progresso real de cada empresa.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={carregarDados} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2">
              <RefreshCw size={18} />
              {carregando ? "Atualizando..." : "Atualizar"}
            </button>
            <Link href="/admin/empresas" className="bg-white text-blue-800 hover:bg-blue-50 px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2">
              <Building2 size={18} /> Empresas
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card titulo="Concluídas" valor={`${concluidas}`} detalhe="Implantação completa" cor="text-green-700" icone={<CheckCircle2 size={22} />} />
        <Card titulo="Em andamento" valor={`${andamento}`} detalhe="Clientes evoluindo" cor="text-blue-700" icone={<TrendingUp size={22} />} />
        <Card titulo="Pendentes" valor={`${pendentes}`} detalhe="Precisam iniciar" cor="text-orange-700" icone={<AlertTriangle size={22} />} />
        <Card titulo="Bloqueadas" valor={`${bloqueadas}`} detalhe="Sem implantação ativa" cor="text-red-700" icone={<XCircle size={22} />} />
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-4 lg:p-5 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar empresa, CNPJ, e-mail ou plano..." className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600" />
          </div>
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100">
            <option>Todos</option>
            <option>Concluída</option>
            <option>Avançada</option>
            <option>Em andamento</option>
            <option>Pendente</option>
            <option>Não iniciada</option>
            <option>Bloqueada</option>
          </select>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Filter size={16} /> {linhas.length} implantação(ões) encontrada(s)
        </div>
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1250px]">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-4 text-left">Empresa</th>
                <th className="p-4 text-left">Onboarding</th>
                <th className="p-4 text-left">Primeiro acesso</th>
                <th className="p-4 text-left">Produtos</th>
                <th className="p-4 text-left">Clientes</th>
                <th className="p-4 text-left">Vendas</th>
                <th className="p-4 text-left">Progresso</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr><td colSpan={9} className="p-8 text-center text-slate-500">Carregando implantações...</td></tr>
              )}

              {!carregando && linhas.map((linha) => (
                <tr key={linha.empresa.id} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="p-4">
                    <p className="font-black text-slate-950">{nomeEmpresa(linha.empresa)}</p>
                    <p className="text-xs text-slate-500">{linha.empresa.cnpj || linha.empresa.email || "Sem documento"}</p>
                    <p className="text-xs text-blue-700 font-bold">{linha.empresa.plano || "Básico"}</p>
                  </td>
                  <td className="p-4">
                    {linha.empresa.onboarding_concluido ? <Badge texto="Concluído" cor="green" /> : <Badge texto={`Etapa ${Number(linha.empresa.etapa_onboarding || 0)}/5`} cor="orange" />}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{formatarDataHora(linha.empresa.ultimo_acesso)}</p>
                    <p className="text-xs text-slate-500">{linha.empresa.ultimo_acesso ? `${diasDesde(linha.empresa.ultimo_acesso)} dia(s)` : "Nunca acessou"}</p>
                  </td>
                  <td className="p-4"><Indicador valor={linha.produtos} label="produto(s)" /></td>
                  <td className="p-4"><Indicador valor={linha.clientes} label="cliente(s)" /></td>
                  <td className="p-4"><Indicador valor={linha.vendas} label="venda(s)" /><p className="text-xs text-slate-500 mt-1">1ª venda: {formatarDataHora(linha.primeiraVenda)}</p></td>
                  <td className="p-4">
                    <div className="w-44">
                      <p className="text-xs font-black text-slate-700 mb-2">{linha.progresso}%</p>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${linha.progresso >= 100 ? "bg-green-600" : linha.progresso >= 60 ? "bg-blue-600" : linha.progresso >= 25 ? "bg-orange-500" : "bg-red-500"}`} style={{ width: `${linha.progresso}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="p-4"><StatusBadge status={linha.status} /></td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <Link href="/admin/empresas" className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center" title="Ver empresa"><Eye size={17} /></Link>
                      <Link href="/admin/empresas" className="h-10 w-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center" title="Gerenciar implantação"><PackagePlus size={17} /></Link>
                    </div>
                  </td>
                </tr>
              ))}

              {!carregando && linhas.length === 0 && (
                <tr><td colSpan={9} className="p-8 text-center text-slate-500">Nenhuma implantação encontrada.</td></tr>
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

function Badge({ texto, cor }: { texto: string; cor: "green" | "orange" }) {
  const classe = cor === "green" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700";
  return <span className={`px-3 py-1 rounded-full text-xs font-black ${classe}`}>{cor === "green" ? "✅" : "⚠️"} {texto}</span>;
}

function Indicador({ valor, label }: { valor: number; label: string }) {
  return (
    <div>
      <p className={`font-black ${valor > 0 ? "text-green-700" : "text-red-700"}`}>{valor}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classe = status === "Concluída" ? "bg-green-100 text-green-700" : status === "Avançada" ? "bg-blue-100 text-blue-700" : status === "Em andamento" ? "bg-orange-100 text-orange-700" : status === "Bloqueada" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700";
  return <span className={`px-3 py-1 rounded-full text-xs font-black ${classe}`}>{status}</span>;
}
