"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Edit,
  Filter,
  Layers3,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Plano = {
  id: string;
  nome: string;
  descricao: string | null;
  valor_mensal: number | null;
  limite_usuarios: number | null;
  limite_produtos: number | null;
  ativo: boolean | null;
  modulo_fiscal: boolean | null;
  modulo_whatsapp: boolean | null;
  modulo_delivery: boolean | null;
  modulo_crm: boolean | null;
  modulo_relatorios_premium: boolean | null;
  modulo_multiloja: boolean | null;
  created_at: string | null;
};

type Empresa = {
  id: string;
  plano: string | null;
};

type FormPlano = {
  id: string;
  nome: string;
  descricao: string;
  valor_mensal: string;
  limite_usuarios: string;
  limite_produtos: string;
  ativo: boolean;
  modulo_fiscal: boolean;
  modulo_whatsapp: boolean;
  modulo_delivery: boolean;
  modulo_crm: boolean;
  modulo_relatorios_premium: boolean;
  modulo_multiloja: boolean;
};

const FORM_VAZIO: FormPlano = {
  id: "",
  nome: "",
  descricao: "",
  valor_mensal: "0",
  limite_usuarios: "1",
  limite_produtos: "100",
  ativo: true,
  modulo_fiscal: false,
  modulo_whatsapp: false,
  modulo_delivery: false,
  modulo_crm: false,
  modulo_relatorios_premium: false,
  modulo_multiloja: false,
};

export default function AdminPlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState<FormPlano>(FORM_VAZIO);

  function moeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function quantidadeModulos(plano: Plano) {
    return [
      plano.modulo_fiscal,
      plano.modulo_whatsapp,
      plano.modulo_delivery,
      plano.modulo_crm,
      plano.modulo_relatorios_premium,
      plano.modulo_multiloja,
    ].filter(Boolean).length;
  }

  function clientesNoPlano(nome: string) {
    return empresas.filter((empresa) => empresa.plano === nome).length;
  }

  async function carregarDados() {
    setCarregando(true);

    const { data: planosData, error: planosError } = await supabase
      .from("planos_saas")
      .select(
        "id,nome,descricao,valor_mensal,limite_usuarios,limite_produtos,ativo,modulo_fiscal,modulo_whatsapp,modulo_delivery,modulo_crm,modulo_relatorios_premium,modulo_multiloja,created_at"
      )
      .order("valor_mensal", { ascending: true });

    if (planosError) {
      setCarregando(false);
      alert("Erro ao carregar planos: " + planosError.message);
      return;
    }

    setPlanos((planosData || []) as Plano[]);

    const { data: empresasData } = await supabase
      .from("empresas")
      .select("id,plano");

    setEmpresas((empresasData || []) as Empresa[]);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const planosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return planos.filter((plano) => {
      const texto = `${plano.nome} ${plano.descricao || ""}`.toLowerCase();
      const passaBusca = !termo || texto.includes(termo);
      const passaStatus =
        filtroStatus === "Todos" ||
        (filtroStatus === "Ativos" && plano.ativo !== false) ||
        (filtroStatus === "Inativos" && plano.ativo === false);

      return passaBusca && passaStatus;
    });
  }, [planos, busca, filtroStatus]);

  const planosAtivos = planos.filter((plano) => plano.ativo !== false).length;
  const receitaPrevista = planos.reduce(
    (total, plano) => total + Number(plano.valor_mensal || 0) * clientesNoPlano(plano.nome),
    0
  );

  function abrirNovoPlano() {
    setForm(FORM_VAZIO);
    setModalAberto(true);
  }

  function editarPlano(plano: Plano) {
    setForm({
      id: plano.id,
      nome: plano.nome || "",
      descricao: plano.descricao || "",
      valor_mensal: String(plano.valor_mensal || 0),
      limite_usuarios: String(plano.limite_usuarios || 1),
      limite_produtos: String(plano.limite_produtos || 100),
      ativo: plano.ativo !== false,
      modulo_fiscal: plano.modulo_fiscal === true,
      modulo_whatsapp: plano.modulo_whatsapp === true,
      modulo_delivery: plano.modulo_delivery === true,
      modulo_crm: plano.modulo_crm === true,
      modulo_relatorios_premium: plano.modulo_relatorios_premium === true,
      modulo_multiloja: plano.modulo_multiloja === true,
    });
    setModalAberto(true);
  }

  function alterarCampo(campo: keyof FormPlano, valor: string | boolean) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function salvarPlano() {
    if (!form.nome.trim()) {
      alert("Informe o nome do plano.");
      return;
    }

    setSalvando(true);

    const dados = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      valor_mensal: Number(String(form.valor_mensal).replace(",", ".") || 0),
      limite_usuarios: Number(form.limite_usuarios || 1),
      limite_produtos: Number(form.limite_produtos || 100),
      ativo: form.ativo,
      modulo_fiscal: form.modulo_fiscal,
      modulo_whatsapp: form.modulo_whatsapp,
      modulo_delivery: form.modulo_delivery,
      modulo_crm: form.modulo_crm,
      modulo_relatorios_premium: form.modulo_relatorios_premium,
      modulo_multiloja: form.modulo_multiloja,
      updated_at: new Date().toISOString(),
    };

    const resultado = form.id
      ? await supabase.from("planos_saas").update(dados).eq("id", form.id)
      : await supabase.from("planos_saas").insert([dados]);

    setSalvando(false);

    if (resultado.error) {
      alert("Erro ao salvar plano: " + resultado.error.message);
      return;
    }

    setModalAberto(false);
    await carregarDados();
  }

  async function ativarInativar(plano: Plano) {
    const novoStatus = plano.ativo === false;

    const { error } = await supabase
      .from("planos_saas")
      .update({ ativo: novoStatus, updated_at: new Date().toISOString() })
      .eq("id", plano.id);

    if (error) {
      alert("Erro ao alterar status do plano: " + error.message);
      return;
    }

    await carregarDados();
  }

  async function excluirPlano(plano: Plano) {
    const clientes = clientesNoPlano(plano.nome);

    if (clientes > 0) {
      alert("Este plano possui empresas usando ele. Inative o plano em vez de excluir.");
      return;
    }

    if (!confirm("Deseja excluir este plano?")) return;

    const { error } = await supabase
      .from("planos_saas")
      .delete()
      .eq("id", plano.id);

    if (error) {
      alert("Erro ao excluir plano: " + error.message);
      return;
    }

    await carregarDados();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 overflow-x-hidden">
      <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 rounded-[30px] p-6 lg:p-8 text-white shadow-xl mb-6 overflow-hidden relative">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <p className="text-blue-200 font-black">Painel Master THCloud</p>
            <h1 className="text-3xl lg:text-4xl font-black mt-2">Planos SaaS</h1>
            <p className="mt-2 text-blue-100 max-w-4xl">
              Cadastre e controle os planos vendidos aos clientes, valores, limites e módulos liberados.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={carregarDados}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              {carregando ? "Atualizando..." : "Atualizar"}
            </button>

            <button
              onClick={abrirNovoPlano}
              className="bg-white text-blue-800 hover:bg-blue-50 px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Novo Plano
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card titulo="Planos" valor={`${planos.length}`} detalhe="Cadastrados" cor="text-blue-700" />
        <Card titulo="Ativos" valor={`${planosAtivos}`} detalhe="Disponíveis para venda" cor="text-green-700" />
        <Card titulo="Clientes" valor={`${empresas.length}`} detalhe="Empresas vinculadas" cor="text-purple-700" />
        <Card titulo="Receita prevista" valor={moeda(receitaPrevista)} detalhe="Clientes por plano" cor="text-orange-700" />
      </section>

      <section className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-4 lg:p-5 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar plano ou descrição..."
              className="w-full rounded-2xl border border-slate-300 bg-white pl-11 pr-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black outline-none focus:ring-4 focus:ring-blue-100"
          >
            <option>Todos</option>
            <option>Ativos</option>
            <option>Inativos</option>
          </select>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Filter size={16} />
          {planosFiltrados.length} plano(s) encontrado(s)
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {planosFiltrados.map((plano) => (
          <div key={plano.id} className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Layers3 size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">{plano.nome}</h2>
                    <p className="text-sm text-slate-500">{plano.ativo === false ? "Inativo" : "Ativo"}</p>
                  </div>
                </div>
                <p className="mt-4 text-slate-600">{plano.descricao || "Sem descrição."}</p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-3xl font-black text-blue-700">{moeda(Number(plano.valor_mensal || 0))}</p>
                <p className="text-xs text-slate-500">mensal</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              <MiniInfo label="Clientes" value={`${clientesNoPlano(plano.nome)}`} />
              <MiniInfo label="Usuários" value={`${plano.limite_usuarios || 0}`} />
              <MiniInfo label="Produtos" value={`${plano.limite_produtos || 0}`} />
              <MiniInfo label="Módulos" value={`${quantidadeModulos(plano)}`} />
            </div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-2">
              <ModuloAtivo label="Fiscal" ativo={plano.modulo_fiscal === true} />
              <ModuloAtivo label="WhatsApp" ativo={plano.modulo_whatsapp === true} />
              <ModuloAtivo label="Delivery" ativo={plano.modulo_delivery === true} />
              <ModuloAtivo label="CRM" ativo={plano.modulo_crm === true} />
              <ModuloAtivo label="Relatórios" ativo={plano.modulo_relatorios_premium === true} />
              <ModuloAtivo label="Multiloja" ativo={plano.modulo_multiloja === true} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => editarPlano(plano)} className="px-4 py-3 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-black inline-flex items-center gap-2">
                <Edit size={17} />
                Editar
              </button>

              <button
                onClick={() => ativarInativar(plano)}
                className={`px-4 py-3 rounded-2xl font-black inline-flex items-center gap-2 ${
                  plano.ativo === false
                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                    : "bg-orange-50 text-orange-700 hover:bg-orange-100"
                }`}
              >
                {plano.ativo === false ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                {plano.ativo === false ? "Ativar" : "Inativar"}
              </button>

              <button onClick={() => excluirPlano(plano)} className="px-4 py-3 rounded-2xl bg-red-50 text-red-700 hover:bg-red-100 font-black inline-flex items-center gap-2">
                <Trash2 size={17} />
                Excluir
              </button>
            </div>
          </div>
        ))}

        {!carregando && planosFiltrados.length === 0 && (
          <div className="xl:col-span-2 bg-white rounded-[28px] border border-slate-200 p-8 text-center text-slate-500">
            Nenhum plano encontrado.
          </div>
        )}
      </section>

      {modalAberto && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[30px] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between rounded-t-[30px]">
              <div>
                <h2 className="text-2xl font-black text-slate-950">{form.id ? "Editar Plano" : "Novo Plano"}</h2>
                <p className="text-slate-500">Configure valor, limites e módulos do plano.</p>
              </div>

              <button onClick={() => setModalAberto(false)} className="h-11 w-11 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 lg:p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nome do plano" value={form.nome} onChange={(v) => alterarCampo("nome", v)} />
                <Input label="Valor mensal" value={form.valor_mensal} onChange={(v) => alterarCampo("valor_mensal", v)} />
                <Input label="Limite de usuários" value={form.limite_usuarios} onChange={(v) => alterarCampo("limite_usuarios", v)} />
                <Input label="Limite de produtos" value={form.limite_produtos} onChange={(v) => alterarCampo("limite_produtos", v)} />
              </div>

              <label className="block">
                <span className="text-sm font-black text-slate-800">Descrição</span>
                <textarea
                  value={form.descricao}
                  onChange={(e) => alterarCampo("descricao", e.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 cursor-pointer">
                <input type="checkbox" checked={form.ativo} onChange={(e) => alterarCampo("ativo", e.target.checked)} className="h-5 w-5" />
                <div>
                  <p className="font-black text-slate-900">Plano ativo</p>
                  <p className="text-sm text-slate-500">Planos ativos ficam disponíveis para novos clientes.</p>
                </div>
              </label>

              <div>
                <h3 className="font-black text-slate-900 mb-3">Módulos incluídos</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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
              <button onClick={() => setModalAberto(false)} className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black">
                Cancelar
              </button>

              <button onClick={salvarPlano} disabled={salvando} className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black disabled:opacity-60">
                {salvando ? "Salvando..." : "Salvar Plano"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ titulo, valor, detalhe, cor }: { titulo: string; valor: string; detalhe: string; cor: string }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm min-w-0">
      <p className="text-sm font-bold text-slate-500">{titulo}</p>
      <h2 className={`text-2xl font-black mt-3 ${cor}`}>{valor}</h2>
      <p className="text-xs text-slate-500 mt-1">{detalhe}</p>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
      <p className="text-xs text-slate-500 font-bold">{label}</p>
      <p className="text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}

function ModuloAtivo({ label, ativo }: { label: string; ativo: boolean }) {
  return (
    <div className={`rounded-2xl px-3 py-2 text-sm font-black flex items-center gap-2 ${ativo ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
      <CheckCircle2 size={15} />
      {label}
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (valor: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-800">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600"
      />
    </label>
  );
}

function CheckModulo({ label, checked, onChange }: { label: string; checked: boolean; onChange: (valor: boolean) => void }) {
  return (
    <label className={`flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition ${checked ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5" />
      <div>
        <p className="font-black text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">Incluído no plano</p>
      </div>
    </label>
  );
}
