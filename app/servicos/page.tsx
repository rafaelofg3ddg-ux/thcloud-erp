"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Edit, Loader2, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getEmpresaId } from "../../lib/empresa";
import {
  THButton,
  THCard,
  THInput,
  THModal,
  THSearch,
  THSelect,
  THStatus,
  THTextarea,
  formatarMoeda,
} from "../../components/global";

type Servico = {
  id: string;
  empresa_id: string;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  tempo_estimado_minutos: number | null;
  valor: number;
  comissao_percentual: number | null;
  garantia_dias: number | null;
  observacoes: string | null;
  ativo: boolean;
};

type FormServico = {
  codigo: string;
  nome: string;
  descricao: string;
  categoria: string;
  tempoEstimado: string;
  valor: string;
  comissao: string;
  garantiaDias: string;
  observacoes: string;
  ativo: boolean;
};

const formInicial: FormServico = {
  codigo: "",
  nome: "",
  descricao: "",
  categoria: "",
  tempoEstimado: "0",
  valor: "0",
  comissao: "0",
  garantiaDias: "90",
  observacoes: "",
  ativo: true,
};

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("ativos");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Servico | null>(null);
  const [form, setForm] = useState<FormServico>(formInicial);

  function empresaAtualId() {
    const empresaId = getEmpresaId();
    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }
    return empresaId;
  }

  function numero(valor: string | number) {
    return Number(String(valor || "0").replace(/\./g, "").replace(",", "."));
  }

  function atualizarCampo<K extends keyof FormServico>(campo: K, valor: FormServico[K]) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function limparFormulario() {
    setEditando(null);
    setForm(formInicial);
  }

  async function carregarServicos() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setCarregando(true);

    const { data, error } = await supabase
      .from("servicos")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("nome");

    if (error) {
      alert("Erro ao carregar serviços: " + error.message);
      setCarregando(false);
      return;
    }

    setServicos((data || []) as Servico[]);
    setCarregando(false);
  }

  async function gerarCodigo() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { data, error } = await supabase.rpc("proximo_codigo_servico", { p_empresa_id: empresaId });

    if (error) {
      atualizarCampo("codigo", String(Math.floor(1000 + Math.random() * 9000)));
      return;
    }

    atualizarCampo("codigo", String(data || ""));
  }

  function abrirNovo() {
    limparFormulario();
    setModalAberto(true);
    setTimeout(() => gerarCodigo(), 100);
  }

  function abrirEdicao(servico: Servico) {
    setEditando(servico);
    setForm({
      codigo: servico.codigo || "",
      nome: servico.nome || "",
      descricao: servico.descricao || "",
      categoria: servico.categoria || "",
      tempoEstimado: String(servico.tempo_estimado_minutos || 0),
      valor: String(Number(servico.valor || 0)).replace(".", ","),
      comissao: String(Number(servico.comissao_percentual || 0)).replace(".", ","),
      garantiaDias: String(servico.garantia_dias || 90),
      observacoes: servico.observacoes || "",
      ativo: servico.ativo !== false,
    });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    limparFormulario();
  }

  async function salvarServico() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!form.nome.trim()) {
      alert("Informe o nome do serviço.");
      return;
    }

    setSalvando(true);

    const payload = {
      empresa_id: empresaId,
      codigo: form.codigo.trim() || null,
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      categoria: form.categoria.trim() || null,
      tempo_estimado_minutos: Number(form.tempoEstimado || 0),
      valor: numero(form.valor),
      comissao_percentual: numero(form.comissao),
      garantia_dias: Number(form.garantiaDias || 0),
      observacoes: form.observacoes.trim() || null,
      ativo: form.ativo,
    };

    if (editando) {
      const { error } = await supabase.from("servicos").update(payload).eq("empresa_id", empresaId).eq("id", editando.id);
      if (error) {
        alert("Erro ao alterar serviço: " + error.message);
        setSalvando(false);
        return;
      }
      alert("Serviço alterado com sucesso.");
    } else {
      const { error } = await supabase.from("servicos").insert([payload]);
      if (error) {
        alert("Erro ao cadastrar serviço: " + error.message);
        setSalvando(false);
        return;
      }
      alert("Serviço cadastrado com sucesso.");
    }

    setSalvando(false);
    fecharModal();
    carregarServicos();
  }

  async function inativarServico(servico: Servico) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;
    if (!confirm(`Deseja inativar o serviço "${servico.nome}"?`)) return;

    const { error } = await supabase.from("servicos").update({ ativo: false }).eq("empresa_id", empresaId).eq("id", servico.id);
    if (error) {
      alert("Erro ao inativar serviço: " + error.message);
      return;
    }
    carregarServicos();
  }

  async function ativarServico(servico: Servico) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { error } = await supabase.from("servicos").update({ ativo: true }).eq("empresa_id", empresaId).eq("id", servico.id);
    if (error) {
      alert("Erro ao ativar serviço: " + error.message);
      return;
    }
    carregarServicos();
  }

  const categorias = useMemo(() => {
    const lista = servicos.map((s) => s.categoria).filter(Boolean).map((s) => String(s));
    return Array.from(new Set(lista)).sort();
  }, [servicos]);

  const servicosFiltrados = useMemo(() => {
    const termo = pesquisa.toLowerCase().trim();
    return servicos.filter((servico) => {
      const texto = `${servico.codigo || ""} ${servico.nome || ""} ${servico.descricao || ""} ${servico.categoria || ""}`.toLowerCase();
      const passouPesquisa = !termo || texto.includes(termo);
      const passouStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "ativos" && servico.ativo !== false) ||
        (filtroStatus === "inativos" && servico.ativo === false);
      return passouPesquisa && passouStatus;
    });
  }, [servicos, pesquisa, filtroStatus]);

  const totalAtivos = servicos.filter((s) => s.ativo !== false).length;
  const valorMedio = totalAtivos > 0 ? servicos.filter((s) => s.ativo !== false).reduce((t, s) => t + Number(s.valor || 0), 0) / totalAtivos : 0;

  useEffect(() => {
    carregarServicos();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-8">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white shadow-lg lg:p-8">
        <p className="font-bold text-blue-100">Th Cloud</p>
        <h1 className="mt-2 text-3xl font-black lg:text-4xl">Cadastro de Serviços</h1>
        <p className="mt-2 max-w-4xl text-blue-100">Cadastre mão de obra, serviços técnicos, garantias e valores padrão para usar na Ordem de Serviço, Orçamentos e PDV.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Resumo titulo="Serviços cadastrados" valor={String(servicos.length)} cor="text-blue-700" />
        <Resumo titulo="Serviços ativos" valor={String(totalAtivos)} cor="text-green-700" />
        <Resumo titulo="Valor médio" valor={formatarMoeda(valorMedio)} cor="text-slate-900" />
      </div>

      <THCard className="mb-6 p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <THSearch
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Pesquisar código, serviço, categoria ou descrição..."
              aria-label="Pesquisar serviços"
            />
          </div>

          <div className="lg:col-span-3">
            <THSelect value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} aria-label="Filtrar status">
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
              <option value="todos">Todos</option>
            </THSelect>
          </div>

          <THButton variant="ghost" onClick={carregarServicos} className="lg:col-span-1">
            <RefreshCcw size={18} />
          </THButton>

          <THButton onClick={abrirNovo} className="lg:col-span-2">
            <Plus size={18} /> Novo Serviço
          </THButton>
        </div>
      </THCard>

      <THCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Serviços Cadastrados</h2>
            <p className="text-slate-500">{servicosFiltrados.length} registro(s)</p>
          </div>
          {carregando && (
            <div className="flex items-center gap-2 font-bold text-blue-700">
              <Loader2 size={18} className="animate-spin" /> Carregando
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-4 text-left">Código</th>
                <th className="p-4 text-left">Serviço</th>
                <th className="p-4 text-left">Categoria</th>
                <th className="p-4 text-center">Tempo</th>
                <th className="p-4 text-right">Valor</th>
                <th className="p-4 text-center">Comissão</th>
                <th className="p-4 text-center">Garantia</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {servicosFiltrados.map((servico) => (
                <tr key={servico.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-black text-blue-700">{servico.codigo || "-"}</td>
                  <td className="p-4">
                    <p className="font-black text-slate-900">{servico.nome}</p>
                    <p className="max-w-md truncate text-xs text-slate-500">{servico.descricao || servico.observacoes || "-"}</p>
                  </td>
                  <td className="p-4 font-bold text-slate-700">{servico.categoria || "-"}</td>
                  <td className="p-4 text-center font-bold text-slate-700">{servico.tempo_estimado_minutos || 0} min</td>
                  <td className="p-4 text-right font-black text-slate-900">{formatarMoeda(servico.valor)}</td>
                  <td className="p-4 text-center font-bold text-slate-700">{Number(servico.comissao_percentual || 0).toFixed(2)}%</td>
                  <td className="p-4 text-center font-bold text-slate-700">{servico.garantia_dias || 0} dias</td>
                  <td className="p-4 text-center">
                    <THStatus texto={servico.ativo !== false ? "Ativo" : "Inativo"} tipo={servico.ativo !== false ? "ativo" : "erro"} />
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => abrirEdicao(servico)} className="rounded-xl bg-yellow-100 px-3 py-2 font-black text-yellow-700 hover:bg-yellow-200" title="Alterar serviço">
                        <Edit size={16} />
                      </button>
                      {servico.ativo !== false ? (
                        <button onClick={() => inativarServico(servico)} className="rounded-xl bg-red-100 px-3 py-2 font-black text-red-700 hover:bg-red-200" title="Inativar serviço">
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <button onClick={() => ativarServico(servico)} className="rounded-xl bg-green-100 px-3 py-2 font-black text-green-700 hover:bg-green-200" title="Ativar serviço">
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {servicosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-500">Nenhum serviço encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </THCard>

      <THModal
        aberto={modalAberto}
        titulo={editando ? "Alterar Serviço" : "Novo Serviço"}
        subtitulo="Defina valor, garantia, comissão e tempo estimado."
        onFechar={fecharModal}
        largura="lg"
        rodape={
          <>
            <THButton variant="ghost" onClick={fecharModal}>Cancelar</THButton>
            <THButton onClick={salvarServico} disabled={salvando}>
              {salvando ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              {salvando ? "Salvando..." : "Salvar Serviço"}
            </THButton>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="md:col-span-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <THInput label="Código" value={form.codigo} onChange={(e) => atualizarCampo("codigo", e.target.value)} placeholder="0001" upper={false} />
                </div>
                <THButton variant="secondary" onClick={gerarCodigo} className="mb-0 px-4">Gerar</THButton>
              </div>
            </div>
            <div className="md:col-span-6">
              <THInput label="Nome do serviço *" value={form.nome} onChange={(e) => atualizarCampo("nome", e.target.value)} placeholder="Ex.: TROCA DE TELA" />
            </div>
            <div className="md:col-span-3">
              <THInput label="Categoria" value={form.categoria} onChange={(e) => atualizarCampo("categoria", e.target.value)} placeholder="Ex.: CELULAR" list="categorias-servicos" />
              <datalist id="categorias-servicos">{categorias.map((item) => <option key={item} value={item} />)}</datalist>
            </div>
          </div>

          <THTextarea label="Descrição" value={form.descricao} onChange={(e) => atualizarCampo("descricao", e.target.value)} placeholder="Descreva quando este serviço deve ser usado..." />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <THInput label="Valor padrão" value={form.valor} onChange={(e) => atualizarCampo("valor", e.target.value)} placeholder="0,00" className="text-right" upper={false} />
            <THInput label="Tempo estimado" value={form.tempoEstimado} onChange={(e) => atualizarCampo("tempoEstimado", e.target.value)} placeholder="Minutos" className="text-center" upper={false} />
            <THInput label="Comissão %" value={form.comissao} onChange={(e) => atualizarCampo("comissao", e.target.value)} placeholder="0" className="text-center" upper={false} />
            <THInput label="Garantia" value={form.garantiaDias} onChange={(e) => atualizarCampo("garantiaDias", e.target.value)} placeholder="Dias" className="text-center" upper={false} />
            <THSelect label="Status" value={form.ativo ? "ativo" : "inativo"} onChange={(e) => atualizarCampo("ativo", e.target.value === "ativo")}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </THSelect>
          </div>

          <THTextarea label="Observações internas" value={form.observacoes} onChange={(e) => atualizarCampo("observacoes", e.target.value)} placeholder="Observações, regras, peças normalmente usadas, cuidados..." />

          <div className="rounded-3xl bg-slate-900 p-5 text-white">
            <p className="font-bold text-slate-300">Resumo</p>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div><p className="text-sm text-slate-400">Serviço</p><p className="text-lg font-black">{form.nome || "Novo serviço"}</p></div>
              <div><p className="text-sm text-slate-400">Valor</p><p className="text-2xl font-black text-green-400">{formatarMoeda(numero(form.valor))}</p></div>
              <div><p className="text-sm text-slate-400">Garantia</p><p className="text-lg font-black">{form.garantiaDias || 0} dias</p></div>
              <div><p className="text-sm text-slate-400">Comissão</p><p className="text-lg font-black">{Number(numero(form.comissao)).toFixed(2)}%</p></div>
            </div>
          </div>
        </div>
      </THModal>
    </div>
  );
}

function Resumo({ titulo, valor, cor }: { titulo: string; valor: string; cor: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{titulo}</p>
      <h3 className={`mt-1 text-2xl font-black ${cor}`}>{valor}</h3>
    </div>
  );
}
