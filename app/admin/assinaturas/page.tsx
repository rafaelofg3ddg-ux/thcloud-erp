"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
  CalendarDays,
  CheckCircle,
  CircleDollarSign,
  Edit,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

type Empresa = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  status_assinatura: string | null;
  vencimento_assinatura: string | null;
  plano: string | null;
  ativo: boolean | null;
};

type Assinatura = {
  id: string;
  empresa_id: string;
  plano: string | null;
  valor: number | null;
  status: string | null;
  inicio: string | null;
  vencimento: string | null;
  ultima_cobranca: string | null;
  observacoes: string | null;
  created_at: string | null;
  empresas?: Empresa | null;
};

type FormAssinatura = {
  id: string;
  empresa_id: string;
  plano: string;
  valor: string;
  status: string;
  inicio: string;
  vencimento: string;
  ultima_cobranca: string;
  observacoes: string;
};

const planos = ["Teste", "Básico", "Profissional", "Premium", "Enterprise"];
const statusLista = ["Ativo", "Teste", "Vencido", "Bloqueado", "Cancelado", "Pago"];

const formInicial: FormAssinatura = {
  id: "",
  empresa_id: "",
  plano: "Teste",
  valor: "0",
  status: "Teste",
  inicio: "",
  vencimento: "",
  ultima_cobranca: "",
  observacoes: "",
};

export default function AdminAssinaturasPage() {
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroPlano, setFiltroPlano] = useState("Todos");

  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<FormAssinatura>(formInicial);

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  function adicionarDias(dias: number) {
    const data = new Date();
    data.setDate(data.getDate() + dias);
    return data.toISOString().split("T")[0];
  }

  function converterNumero(valor: string) {
    return Number(String(valor || "0").replace(",", "."));
  }

  function formatarMoeda(valor: number | null) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  function diasParaVencer(vencimento: string | null) {
    if (!vencimento) return null;

    const hoje = new Date(hojeISO() + "T00:00:00");
    const dataVencimento = new Date(vencimento + "T00:00:00");
    const diferenca = dataVencimento.getTime() - hoje.getTime();

    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  }

  function classeStatus(status: string | null) {
    if (status === "Ativo" || status === "Pago") return "bg-green-100 text-green-700";
    if (status === "Teste") return "bg-blue-100 text-blue-700";
    if (status === "Vencido") return "bg-orange-100 text-orange-700";
    if (status === "Bloqueado") return "bg-red-100 text-red-700";
    if (status === "Cancelado") return "bg-slate-200 text-slate-700";

    return "bg-slate-100 text-slate-700";
  }

  function nomeEmpresa(assinatura: Assinatura) {
    return (
      assinatura.empresas?.nome_fantasia ||
      assinatura.empresas?.razao_social ||
      "Empresa"
    );
  }

  function abrirNovaAssinatura() {
    setForm({
      ...formInicial,
      empresa_id: empresas[0]?.id || "",
      inicio: hojeISO(),
      vencimento: adicionarDias(7),
      ultima_cobranca: hojeISO(),
    });
    setModoEdicao(false);
    setModalAberto(true);
  }

  function abrirEditarAssinatura(assinatura: Assinatura) {
    setForm({
      id: assinatura.id,
      empresa_id: assinatura.empresa_id,
      plano: assinatura.plano || "Teste",
      valor: String(assinatura.valor || 0),
      status: assinatura.status || "Teste",
      inicio: assinatura.inicio || "",
      vencimento: assinatura.vencimento || "",
      ultima_cobranca: assinatura.ultima_cobranca || "",
      observacoes: assinatura.observacoes || "",
    });

    setModoEdicao(true);
    setModalAberto(true);
  }

  async function carregarEmpresas() {
    const { data, error } = await supabase
      .from("empresas")
      .select("id,nome_fantasia,razao_social,status_assinatura,vencimento_assinatura,plano,ativo")
      .order("nome_fantasia", { ascending: true });

    if (error) {
      alert("Erro ao carregar empresas: " + error.message);
      return;
    }

    setEmpresas(data || []);
  }

  async function carregarAssinaturas() {
    const { data, error } = await supabase
      .from("assinaturas")
      .select(
        "id,empresa_id,plano,valor,status,inicio,vencimento,ultima_cobranca,observacoes,created_at,empresas(id,nome_fantasia,razao_social,status_assinatura,vencimento_assinatura,plano,ativo)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar assinaturas: " + error.message);
      return;
    }

    setAssinaturas((data || []) as unknown as Assinatura[]);
  }

  async function carregarDados() {
    await carregarEmpresas();
    await carregarAssinaturas();
  }

  function validarFormulario() {
    if (!form.empresa_id) {
      alert("Selecione a empresa.");
      return false;
    }

    if (!form.inicio) {
      alert("Informe a data de início.");
      return false;
    }

    if (!form.vencimento) {
      alert("Informe a data de vencimento.");
      return false;
    }

    return true;
  }

  async function sincronizarEmpresaAssinatura() {
    const { error } = await supabase
      .from("empresas")
      .update({
        plano: form.plano,
        status_assinatura: form.status,
        vencimento_assinatura: form.vencimento,
        ativo: form.status !== "Bloqueado" && form.status !== "Cancelado" && form.status !== "Vencido",
        updated_at: new Date().toISOString(),
      })
      .eq("id", form.empresa_id);

    if (error) {
      console.log("Aviso ao atualizar empresa:", error.message);
    }
  }

  async function salvarAssinatura() {
    if (!validarFormulario()) return;

    setSalvando(true);

    const dados = {
      empresa_id: form.empresa_id,
      plano: form.plano,
      valor: converterNumero(form.valor),
      status: form.status,
      inicio: form.inicio,
      vencimento: form.vencimento,
      ultima_cobranca: form.ultima_cobranca || null,
      observacoes: form.observacoes.trim() || null,
    };

    if (modoEdicao) {
      const { error } = await supabase
        .from("assinaturas")
        .update(dados)
        .eq("id", form.id);

      if (error) {
        setSalvando(false);
        alert("Erro ao atualizar assinatura: " + error.message);
        return;
      }

      await sincronizarEmpresaAssinatura();

      setSalvando(false);
      alert("Assinatura atualizada com sucesso!");
    } else {
      const { error } = await supabase.from("assinaturas").insert(dados);

      if (error) {
        setSalvando(false);
        alert("Erro ao cadastrar assinatura: " + error.message);
        return;
      }

      await sincronizarEmpresaAssinatura();

      setSalvando(false);
      alert("Assinatura cadastrada com sucesso!");
    }

    setModalAberto(false);
    setForm(formInicial);
    carregarDados();
  }

  async function renovarAssinatura(assinatura: Assinatura, dias: number) {
    const confirmar = confirm(`Deseja renovar ${nomeEmpresa(assinatura)} por ${dias} dias?`);
    if (!confirmar) return;

    const base = assinatura.vencimento
      ? new Date(assinatura.vencimento + "T00:00:00")
      : new Date();

    const hoje = new Date(hojeISO() + "T00:00:00");
    const dataBase = base < hoje ? hoje : base;

    dataBase.setDate(dataBase.getDate() + dias);

    const novoVencimento = dataBase.toISOString().split("T")[0];

    const { error } = await supabase
      .from("assinaturas")
      .update({
        vencimento: novoVencimento,
        status: "Ativo",
        ultima_cobranca: hojeISO(),
      })
      .eq("id", assinatura.id);

    if (error) {
      alert("Erro ao renovar assinatura: " + error.message);
      return;
    }

    const { error: empresaError } = await supabase
      .from("empresas")
      .update({
        vencimento_assinatura: novoVencimento,
        status_assinatura: "Ativo",
        ativo: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assinatura.empresa_id);

    if (empresaError) {
      console.log("Aviso empresa:", empresaError.message);
    }

    alert("Assinatura renovada com sucesso!");
    carregarDados();
  }

  async function bloquearAssinatura(assinatura: Assinatura) {
    const confirmar = confirm(`Deseja bloquear ${nomeEmpresa(assinatura)}?`);
    if (!confirmar) return;

    const { error } = await supabase
      .from("assinaturas")
      .update({ status: "Bloqueado" })
      .eq("id", assinatura.id);

    if (error) {
      alert("Erro ao bloquear assinatura: " + error.message);
      return;
    }

    await supabase
      .from("empresas")
      .update({
        status_assinatura: "Bloqueado",
        ativo: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assinatura.empresa_id);

    carregarDados();
  }

  async function ativarAssinatura(assinatura: Assinatura) {
    const confirmar = confirm(`Deseja ativar ${nomeEmpresa(assinatura)}?`);
    if (!confirmar) return;

    const { error } = await supabase
      .from("assinaturas")
      .update({ status: "Ativo" })
      .eq("id", assinatura.id);

    if (error) {
      alert("Erro ao ativar assinatura: " + error.message);
      return;
    }

    await supabase
      .from("empresas")
      .update({
        status_assinatura: "Ativo",
        ativo: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assinatura.empresa_id);

    carregarDados();
  }

  async function excluirAssinatura(assinatura: Assinatura) {
    const confirmar = confirm(`Deseja excluir a assinatura de ${nomeEmpresa(assinatura)}?`);
    if (!confirmar) return;

    const { error } = await supabase
      .from("assinaturas")
      .delete()
      .eq("id", assinatura.id);

    if (error) {
      alert("Erro ao excluir assinatura: " + error.message);
      return;
    }

    alert("Assinatura excluída com sucesso!");
    carregarDados();
  }

  async function verificarVencidas() {
    const confirmar = confirm("Deseja verificar e marcar assinaturas vencidas?");
    if (!confirmar) return;

    const hoje = hojeISO();

    const { data, error } = await supabase
      .from("assinaturas")
      .select("id,empresa_id,vencimento,status")
      .lt("vencimento", hoje)
      .not("status", "in", '("Cancelado","Bloqueado","Vencido")');

    if (error) {
      alert("Erro ao verificar vencidas: " + error.message);
      return;
    }

    const vencidas = data || [];

    for (const assinatura of vencidas) {
      await supabase
        .from("assinaturas")
        .update({ status: "Vencido" })
        .eq("id", assinatura.id);

      await supabase
        .from("empresas")
        .update({
          status_assinatura: "Vencido",
          ativo: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", assinatura.empresa_id);
    }

    alert(`${vencidas.length} assinatura(s) vencida(s) atualizada(s).`);
    carregarDados();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const assinaturasFiltradas = assinaturas.filter((assinatura) => {
    const termo = busca.trim().toLowerCase();

    const bateBusca =
      termo === "" ||
      nomeEmpresa(assinatura).toLowerCase().includes(termo) ||
      String(assinatura.empresas?.razao_social || "").toLowerCase().includes(termo) ||
      String(assinatura.plano || "").toLowerCase().includes(termo);

    const bateStatus =
      filtroStatus === "Todos" ||
      String(assinatura.status || "").toLowerCase() === filtroStatus.toLowerCase();

    const batePlano =
      filtroPlano === "Todos" ||
      String(assinatura.plano || "").toLowerCase() === filtroPlano.toLowerCase();

    return bateBusca && bateStatus && batePlano;
  });

  const totalMensal = assinaturas
    .filter((item) => item.status === "Ativo" || item.status === "Pago")
    .reduce((total, item) => total + Number(item.valor || 0), 0);

  const totalAtivas = assinaturas.filter((item) => item.status === "Ativo" || item.status === "Pago").length;
  const totalVencidas = assinaturas.filter((item) => item.status === "Vencido" || item.status === "Bloqueado").length;
  const venceSemana = assinaturas.filter((item) => {
    const dias = diasParaVencer(item.vencimento);
    return dias !== null && dias >= 0 && dias <= 7;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-gradient-to-r from-slate-950 to-blue-800 rounded-3xl p-8 shadow-lg mb-8 text-white">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-blue-100 font-bold">Painel Master THCloud</p>
            <h1 className="text-4xl font-black mt-2">Assinaturas SaaS</h1>
            <p className="text-blue-100 mt-2 max-w-3xl">
              Controle mensalidades, vencimentos, renovações e bloqueios das empresas clientes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={verificarVencidas}
              className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black hover:bg-orange-600 flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              Verificar Vencidas
            </button>

            <button
              onClick={abrirNovaAssinatura}
              className="bg-white text-blue-900 px-6 py-3 rounded-2xl font-black hover:bg-blue-50 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Nova Assinatura
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <ResumoCard
          titulo="Receita Mensal"
          valor={formatarMoeda(totalMensal)}
          detalhe="Assinaturas ativas"
          cor="text-green-700"
          icone={<CircleDollarSign size={24} />}
        />

        <ResumoCard
          titulo="Ativas"
          valor={`${totalAtivas}`}
          detalhe="Clientes liberados"
          cor="text-blue-700"
          icone={<CheckCircle size={24} />}
        />

        <ResumoCard
          titulo="Vencidas/Bloqueadas"
          valor={`${totalVencidas}`}
          detalhe="Precisam atenção"
          cor="text-red-700"
          icone={<XCircle size={24} />}
        />

        <ResumoCard
          titulo="Vencem em 7 dias"
          valor={`${venceSemana}`}
          detalhe="Renovar em breve"
          cor="text-orange-700"
          icone={<CalendarDays size={24} />}
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por empresa ou plano..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 text-slate-900"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 bg-white"
          >
            <option value="Todos">Todos os status</option>
            {statusLista.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={filtroPlano}
            onChange={(e) => setFiltroPlano(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 bg-white"
          >
            <option value="Todos">Todos os planos</option>
            {planos.map((plano) => (
              <option key={plano} value={plano}>{plano}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Lista de Assinaturas</h2>
            <p className="text-slate-500">{assinaturasFiltradas.length} assinatura(s) encontrada(s).</p>
          </div>

          <button
            onClick={carregarDados}
            className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-2"
          >
            <RefreshCw size={17} />
            Atualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500 border-b border-slate-100">
                <th className="p-4">Empresa</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Início</th>
                <th className="p-4">Vencimento</th>
                <th className="p-4">Status</th>
                <th className="p-4">Última Cobrança</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {assinaturasFiltradas.map((assinatura) => {
                const dias = diasParaVencer(assinatura.vencimento);

                return (
                  <tr key={assinatura.id} className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-black text-slate-900">{nomeEmpresa(assinatura)}</p>
                      <p className="text-slate-500">{assinatura.empresas?.razao_social || "-"}</p>
                    </td>

                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-700">
                        {assinatura.plano || "-"}
                      </span>
                    </td>

                    <td className="p-4 font-black text-green-700">
                      {formatarMoeda(assinatura.valor)}
                    </td>

                    <td className="p-4 text-slate-700">
                      {formatarData(assinatura.inicio)}
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-900">
                        {formatarData(assinatura.vencimento)}
                      </p>

                      <p
                        className={`text-xs font-bold mt-1 ${
                          dias !== null && dias < 0
                            ? "text-red-700"
                            : dias !== null && dias <= 7
                            ? "text-orange-700"
                            : "text-slate-500"
                        }`}
                      >
                        {dias === null
                          ? "Sem vencimento"
                          : dias < 0
                          ? `${Math.abs(dias)} dia(s) vencido`
                          : `${dias} dia(s) restante(s)`}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${classeStatus(assinatura.status)}`}>
                        {assinatura.status || "-"}
                      </span>
                    </td>

                    <td className="p-4 text-slate-700">
                      {formatarData(assinatura.ultima_cobranca)}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirEditarAssinatura(assinatura)}
                          className="h-10 w-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center"
                          title="Editar"
                        >
                          <Edit size={17} />
                        </button>

                        <button
                          onClick={() => renovarAssinatura(assinatura, 30)}
                          className="h-10 w-10 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 flex items-center justify-center"
                          title="Renovar 30 dias"
                        >
                          <CalendarDays size={17} />
                        </button>

                        <button
                          onClick={() => ativarAssinatura(assinatura)}
                          className="h-10 w-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center"
                          title="Ativar"
                        >
                          <CheckCircle size={17} />
                        </button>

                        <button
                          onClick={() => bloquearAssinatura(assinatura)}
                          className="h-10 w-10 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 flex items-center justify-center"
                          title="Bloquear"
                        >
                          <XCircle size={17} />
                        </button>

                        <button
                          onClick={() => excluirAssinatura(assinatura)}
                          className="h-10 w-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center"
                          title="Excluir"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {assinaturasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Nenhuma assinatura encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {modoEdicao ? "Editar Assinatura" : "Nova Assinatura"}
                </h2>

                <p className="text-slate-500">
                  Defina plano, valor, vencimento e status de acesso.
                </p>
              </div>

              <button
                onClick={() => setModalAberto(false)}
                className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo label="Empresa" className="md:col-span-2">
                <select
                  value={form.empresa_id}
                  onChange={(e) => setForm({ ...form, empresa_id: e.target.value })}
                  className="input bg-white"
                  disabled={modoEdicao}
                >
                  <option value="">Selecione uma empresa</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nome_fantasia || empresa.razao_social}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo label="Plano">
                <select
                  value={form.plano}
                  onChange={(e) => setForm({ ...form, plano: e.target.value })}
                  className="input bg-white"
                >
                  {planos.map((plano) => (
                    <option key={plano} value={plano}>{plano}</option>
                  ))}
                </select>
              </Campo>

              <Campo label="Status">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="input bg-white"
                >
                  {statusLista.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </Campo>

              <Campo label="Valor Mensal">
                <input
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  placeholder="0,00"
                  className="input"
                />
              </Campo>

              <Campo label="Início">
                <input
                  type="date"
                  value={form.inicio}
                  onChange={(e) => setForm({ ...form, inicio: e.target.value })}
                  className="input"
                />
              </Campo>

              <Campo label="Vencimento">
                <input
                  type="date"
                  value={form.vencimento}
                  onChange={(e) => setForm({ ...form, vencimento: e.target.value })}
                  className="input"
                />
              </Campo>

              <Campo label="Última Cobrança">
                <input
                  type="date"
                  value={form.ultima_cobranca}
                  onChange={(e) => setForm({ ...form, ultima_cobranca: e.target.value })}
                  className="input"
                />
              </Campo>

              <Campo label="Observações" className="md:col-span-2">
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  placeholder="Observações internas..."
                  className="input min-h-28"
                />
              </Campo>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalAberto(false)}
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Cancelar
              </button>

              <button
                onClick={salvarAssinatura}
                disabled={salvando}
                className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold disabled:opacity-60"
              >
                {salvando
                  ? "Salvando..."
                  : modoEdicao
                  ? "Salvar Alterações"
                  : "Cadastrar Assinatura"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 1rem;
          padding: 0.75rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .input:focus {
          border-color: rgb(37 99 235);
          box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
        }
      `}</style>
    </div>
  );
}

function Campo({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-bold text-slate-700 mb-2">
        {label}
      </label>

      {children}
    </div>
  );
}

function ResumoCard({
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
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{titulo}</p>

          <h2 className={`text-3xl font-black mt-3 ${cor}`}>{valor}</h2>

          <p className="text-sm text-slate-500 mt-2">{detalhe}</p>
        </div>

        <div
          className={`h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center ${cor}`}
        >
          {icone}
        </div>
      </div>
    </div>
  );
}
