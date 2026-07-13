"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Filter,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  Unlock,
  XCircle,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { formatarData } from "../../../components/global/THFormat";

type Empresa = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  cnpj: string | null;
  email: string | null;
  ativo: boolean | null;
  plano: string | null;
  valor_mensal: number | null;
  status_assinatura: string | null;
  data_vencimento_assinatura: string | null;
  bloqueio_nivel: string | null;
  bloqueio_motivo: string | null;
  bloqueada_em: string | null;
  cancelada_em: string | null;
  data_prorrogacao: string | null;
  dias_carencia_manual: number | null;
};

type ConfiguracaoSaas = {
  dias_carencia: number | null;
  bloquear_automaticamente: boolean | null;
};

export default function AdminBloqueiosPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoSaas>({
    dias_carencia: 3,
    bloquear_automaticamente: true,
  });
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  function nomeEmpresa(empresa: Empresa) {
    return empresa.nome_fantasia || empresa.razao_social || "Empresa sem nome";
  }

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function diasAtraso(empresa: Empresa) {
    if (!empresa.data_vencimento_assinatura) return 0;

    const vencimento = new Date(empresa.data_vencimento_assinatura + "T00:00:00");
    const hoje = new Date(hojeISO() + "T00:00:00");
    const diff = hoje.getTime() - vencimento.getTime();

    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  function statusOperacional(empresa: Empresa) {
    const status = String(empresa.status_assinatura || "").toLowerCase();

    if (status === "cancelado" || status === "cancelada") return "Cancelada";
    if (empresa.ativo === false || status === "bloqueado" || status === "bloqueada") {
      return "Bloqueada";
    }
    if (status === "teste") return "Teste";
    if (diasAtraso(empresa) > 0) return "Vencendo";

    return "Ativa";
  }

  function regraSugerida(empresa: Empresa) {
    const atraso = diasAtraso(empresa);

    if (statusOperacional(empresa) === "Cancelada") return "Cancelada";
    if (atraso >= 30) return "Cancelar";
    if (atraso >= 15) return "Bloqueio total";
    if (atraso >= 5) return "Aviso/Restrição";
    if (atraso > 0) return "Atenção";
    return "Normal";
  }

  function usuarioAtual() {
    try {
      const storage =
        sessionStorage.getItem("th_usuario") || localStorage.getItem("th_usuario");
      if (!storage) return "Super Admin";
      const usuario = JSON.parse(storage);
      return usuario?.nome || usuario?.email || "Super Admin";
    } catch {
      return "Super Admin";
    }
  }

  async function carregarDados() {
    setCarregando(true);

    const { data: configData } = await supabase
      .from("configuracoes_saas")
      .select("dias_carencia,bloquear_automaticamente")
      .limit(1)
      .maybeSingle();

    if (configData) setConfiguracao(configData as ConfiguracaoSaas);

    const { data, error } = await supabase
      .from("empresas")
      .select(
        "id,nome_fantasia,razao_social,cnpj,email,ativo,plano,valor_mensal,status_assinatura,data_vencimento_assinatura,bloqueio_nivel,bloqueio_motivo,bloqueada_em,cancelada_em,data_prorrogacao,dias_carencia_manual"
      )
      .order("data_vencimento_assinatura", { ascending: true });

    setCarregando(false);

    if (error) {
      alert("Erro ao carregar bloqueios: " + error.message);
      return;
    }

    setEmpresas((data || []) as Empresa[]);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function registrarBloqueio(
    empresa: Empresa,
    tipo: string,
    statusNovo: string,
    motivo: string
  ) {
    await supabase.from("bloqueios_saas").insert([
      {
        empresa_id: empresa.id,
        tipo,
        status_anterior: statusOperacional(empresa),
        status_novo: statusNovo,
        motivo,
        dias_atraso: diasAtraso(empresa),
        usuario: usuarioAtual(),
      },
    ]);

    await supabase.from("historico_empresas").insert([
      {
        empresa_id: empresa.id,
        acao: tipo,
        descricao: motivo,
        usuario: usuarioAtual(),
      },
    ]);

    await supabase.from("notificacoes_saas").insert([
      {
        tipo: "bloqueio_saas",
        titulo: tipo,
        descricao: `${nomeEmpresa(empresa)}: ${motivo}`,
        empresa_id: empresa.id,
        lida: false,
      },
    ]);
  }

  async function bloquearEmpresa(empresa: Empresa) {
    const motivo =
      prompt("Motivo do bloqueio:", "Bloqueio manual pelo Super Admin") ||
      "Bloqueio manual pelo Super Admin";

    const { error } = await supabase
      .from("empresas")
      .update({
        ativo: false,
        status_assinatura: "Bloqueado",
        bloqueio_nivel: "total",
        bloqueio_motivo: motivo,
        bloqueada_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresa.id);

    if (error) {
      alert("Erro ao bloquear empresa: " + error.message);
      return;
    }

    await registrarBloqueio(empresa, "Empresa bloqueada", "Bloqueada", motivo);
    await carregarDados();
  }

  async function liberarEmpresa(empresa: Empresa) {
    if (!confirm(`Liberar acesso da empresa ${nomeEmpresa(empresa)}?`)) return;

    const { error } = await supabase
      .from("empresas")
      .update({
        ativo: true,
        status_assinatura: "Ativo",
        bloqueio_nivel: "normal",
        bloqueio_motivo: null,
        bloqueada_em: null,
        cancelada_em: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresa.id);

    if (error) {
      alert("Erro ao liberar empresa: " + error.message);
      return;
    }

    await registrarBloqueio(
      empresa,
      "Empresa liberada",
      "Ativa",
      "Acesso liberado manualmente pelo Super Admin."
    );
    await carregarDados();
  }

  async function prorrogarEmpresa(empresa: Empresa) {
    const dias = Number(prompt("Prorrogar por quantos dias?", "7") || 0);

    if (!dias || dias <= 0) return;

    const base = empresa.data_vencimento_assinatura &&
      empresa.data_vencimento_assinatura > hojeISO()
        ? new Date(empresa.data_vencimento_assinatura + "T00:00:00")
        : new Date();

    base.setDate(base.getDate() + dias);
    const novoVencimento = base.toISOString().split("T")[0];

    const { error } = await supabase
      .from("empresas")
      .update({
        ativo: true,
        status_assinatura: "Ativo",
        data_vencimento_assinatura: novoVencimento,
        data_prorrogacao: novoVencimento,
        dias_carencia_manual: dias,
        bloqueio_nivel: "normal",
        bloqueio_motivo: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresa.id);

    if (error) {
      alert("Erro ao prorrogar empresa: " + error.message);
      return;
    }

    await registrarBloqueio(
      empresa,
      "Assinatura prorrogada",
      "Ativa",
      `Assinatura prorrogada por ${dias} dia(s). Novo vencimento: ${formatarData(novoVencimento)}.`
    );
    await carregarDados();
  }

  async function cancelarEmpresa(empresa: Empresa) {
    const motivo =
      prompt("Motivo do cancelamento:", "Cancelamento manual pelo Super Admin") ||
      "Cancelamento manual pelo Super Admin";

    if (!confirm(`Confirmar cancelamento de ${nomeEmpresa(empresa)}?`)) return;

    const { error } = await supabase
      .from("empresas")
      .update({
        ativo: false,
        status_assinatura: "Cancelado",
        bloqueio_nivel: "cancelado",
        bloqueio_motivo: motivo,
        cancelada_em: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresa.id);

    if (error) {
      alert("Erro ao cancelar empresa: " + error.message);
      return;
    }

    await registrarBloqueio(empresa, "Empresa cancelada", "Cancelada", motivo);
    await carregarDados();
  }

  const empresasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return empresas.filter((empresa) => {
      const texto = `${nomeEmpresa(empresa)} ${empresa.cnpj || ""} ${
        empresa.email || ""
      } ${empresa.plano || ""}`.toLowerCase();

      const passaBusca = !termo || texto.includes(termo);
      const passaStatus =
        filtroStatus === "Todos" || statusOperacional(empresa) === filtroStatus;

      return passaBusca && passaStatus;
    });
  }, [empresas, busca, filtroStatus]);

  const ativas = empresas.filter((empresa) => statusOperacional(empresa) === "Ativa").length;
  const vencendo = empresas.filter((empresa) => statusOperacional(empresa) === "Vencendo").length;
  const bloqueadas = empresas.filter((empresa) => statusOperacional(empresa) === "Bloqueada").length;
  const canceladas = empresas.filter((empresa) => statusOperacional(empresa) === "Cancelada").length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 overflow-x-hidden">
      <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 rounded-[30px] p-6 lg:p-8 text-white shadow-xl mb-6 overflow-hidden relative">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <p className="text-blue-200 font-black">Painel Master THCloud</p>
            <h1 className="text-3xl lg:text-4xl font-black mt-2">
              Controle Inteligente de Bloqueios
            </h1>
            <p className="mt-2 text-blue-100 max-w-4xl">
              Controle empresas ativas, vencendo, bloqueadas e canceladas com ações rápidas e histórico automático.
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
        <Card titulo="Ativas" valor={`${ativas}`} detalhe="Acesso normal" cor="text-green-700" icone={<CheckCircle2 size={22} />} />
        <Card titulo="Vencendo" valor={`${vencendo}`} detalhe="Em atraso/atenção" cor="text-orange-700" icone={<ShieldAlert size={22} />} />
        <Card titulo="Bloqueadas" valor={`${bloqueadas}`} detalhe="Acesso suspenso" cor="text-red-700" icone={<Lock size={22} />} />
        <Card titulo="Canceladas" valor={`${canceladas}`} detalhe="Contrato encerrado" cor="text-slate-700" icone={<XCircle size={22} />} />
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-4 lg:p-5 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar empresa, CNPJ, e-mail ou plano..."
              className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option>Todos</option>
            <option>Ativa</option>
            <option>Teste</option>
            <option>Vencendo</option>
            <option>Bloqueada</option>
            <option>Cancelada</option>
          </select>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Filter size={16} />
          {empresasFiltradas.length} empresa(s) encontrada(s)
        </div>
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1200px]">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-4 text-left">Empresa</th>
                <th className="p-4 text-left">Plano</th>
                <th className="p-4 text-left">Mensalidade</th>
                <th className="p-4 text-left">Vencimento</th>
                <th className="p-4 text-left">Dias atraso</th>
                <th className="p-4 text-left">Regra sugerida</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Carregando bloqueios...
                  </td>
                </tr>
              )}

              {!carregando &&
                empresasFiltradas.map((empresa) => (
                  <tr key={empresa.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-black text-slate-950">{nomeEmpresa(empresa)}</p>
                      <p className="text-xs text-slate-500">{empresa.cnpj || empresa.email || "-"}</p>
                      {empresa.bloqueio_motivo && (
                        <p className="text-xs text-red-600 font-bold mt-1">{empresa.bloqueio_motivo}</p>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-black">
                        {empresa.plano || "Básico"}
                      </span>
                    </td>

                    <td className="p-4 font-black text-purple-700">
                      {moeda(Number(empresa.valor_mensal || 0))}
                    </td>

                    <td className="p-4 font-bold text-slate-800">
                      {formatarData(empresa.data_vencimento_assinatura)}
                    </td>

                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${
                        diasAtraso(empresa) > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}>
                        {diasAtraso(empresa)} dia(s)
                      </span>
                    </td>

                    <td className="p-4">
                      <RegraBadge regra={regraSugerida(empresa)} />
                    </td>

                    <td className="p-4">
                      <StatusBadge status={statusOperacional(empresa)} />
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {statusOperacional(empresa) === "Bloqueada" || statusOperacional(empresa) === "Cancelada" ? (
                          <button
                            onClick={() => liberarEmpresa(empresa)}
                            className="px-3 py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-black inline-flex items-center gap-2"
                          >
                            <Unlock size={16} />
                            Liberar
                          </button>
                        ) : (
                          <button
                            onClick={() => bloquearEmpresa(empresa)}
                            className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-black inline-flex items-center gap-2"
                          >
                            <Lock size={16} />
                            Bloquear
                          </button>
                        )}

                        <button
                          onClick={() => prorrogarEmpresa(empresa)}
                          className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-black inline-flex items-center gap-2"
                        >
                          <CalendarClock size={16} />
                          Prorrogar
                        </button>

                        <button
                          onClick={() => cancelarEmpresa(empresa)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black inline-flex items-center gap-2"
                        >
                          <XCircle size={16} />
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!carregando && empresasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 bg-white rounded-[28px] border border-slate-200 shadow-sm p-5">
        <h2 className="text-2xl font-black text-slate-900 mb-2">
          Regras operacionais
        </h2>
        <p className="text-slate-500 mb-4">
          A carência configurada atualmente é de {Number(configuracao.dias_carencia || 0)} dia(s).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <RegraCard titulo="0 a 4 dias" texto="Atenção e acompanhamento." />
          <RegraCard titulo="5 dias" texto="Aviso/restrição sugerida." />
          <RegraCard titulo="15 dias" texto="Bloqueio total sugerido." />
          <RegraCard titulo="30 dias" texto="Cancelamento sugerido." />
        </div>
      </section>
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
    status === "Ativa"
      ? "bg-green-100 text-green-700"
      : status === "Teste"
      ? "bg-cyan-100 text-cyan-700"
      : status === "Vencendo"
      ? "bg-orange-100 text-orange-700"
      : status === "Bloqueada"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700";

  return <span className={`px-3 py-1 rounded-full text-xs font-black ${classe}`}>{status}</span>;
}

function RegraBadge({ regra }: { regra: string }) {
  const classe =
    regra === "Normal"
      ? "bg-green-100 text-green-700"
      : regra === "Atenção"
      ? "bg-yellow-100 text-yellow-700"
      : regra === "Aviso/Restrição"
      ? "bg-orange-100 text-orange-700"
      : "bg-red-100 text-red-700";

  return <span className={`px-3 py-1 rounded-full text-xs font-black ${classe}`}>{regra}</span>;
}

function RegraCard({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
      <p className="font-black text-slate-900">{titulo}</p>
      <p className="text-sm text-slate-500 mt-1">{texto}</p>
    </div>
  );
}
