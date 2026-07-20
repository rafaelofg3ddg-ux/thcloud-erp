"use client";

import { useEffect, useState } from "react";
import {
  BellRing,
  CheckCircle2,
  Clock,
  CreditCard,
  RefreshCw,
  Save,
  Settings,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type ConfiguracaoSaas = {
  id: string;
  dias_carencia: number | null;
  gerar_cobranca_automatica: boolean | null;
  bloquear_automaticamente: boolean | null;
  enviar_notificacao_vencimento: boolean | null;
  created_at: string | null;
};

type FormConfiguracao = {
  id: string;
  dias_carencia: string;
  gerar_cobranca_automatica: boolean;
  bloquear_automaticamente: boolean;
  enviar_notificacao_vencimento: boolean;
};

const FORM_PADRAO: FormConfiguracao = {
  id: "",
  dias_carencia: "3",
  gerar_cobranca_automatica: true,
  bloquear_automaticamente: true,
  enviar_notificacao_vencimento: true,
};

export default function AdminConfiguracoesPage() {
  const [configuracao, setConfiguracao] = useState<FormConfiguracao>(FORM_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregarConfiguracao() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("configuracoes_saas")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      setCarregando(false);
      alert("Erro ao carregar configurações SaaS: " + error.message);
      return;
    }

    if (!data) {
      const { data: novaConfig, error: erroInsert } = await supabase
        .from("configuracoes_saas")
        .insert([
          {
            dias_carencia: 3,
            gerar_cobranca_automatica: true,
            bloquear_automaticamente: true,
            enviar_notificacao_vencimento: true,
          },
        ])
        .select("*")
        .single();

      setCarregando(false);

      if (erroInsert) {
        alert("Erro ao criar configuração padrão: " + erroInsert.message);
        return;
      }

      preencherFormulario(novaConfig as ConfiguracaoSaas);
      return;
    }

    preencherFormulario(data as ConfiguracaoSaas);
    setCarregando(false);
  }

  function preencherFormulario(data: ConfiguracaoSaas) {
    setConfiguracao({
      id: data.id,
      dias_carencia: String(data.dias_carencia ?? 3),
      gerar_cobranca_automatica: data.gerar_cobranca_automatica !== false,
      bloquear_automaticamente: data.bloquear_automaticamente !== false,
      enviar_notificacao_vencimento: data.enviar_notificacao_vencimento !== false,
    });
  }

  useEffect(() => {
    carregarConfiguracao();
  }, []);

  function alterarCampo(campo: keyof FormConfiguracao, valor: string | boolean) {
    setConfiguracao((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function salvarConfiguracao() {
    setSalvando(true);

    const dados = {
      dias_carencia: Number(configuracao.dias_carencia || 0),
      gerar_cobranca_automatica: configuracao.gerar_cobranca_automatica,
      bloquear_automaticamente: configuracao.bloquear_automaticamente,
      enviar_notificacao_vencimento: configuracao.enviar_notificacao_vencimento,
    };

    const resultado = configuracao.id
      ? await supabase
          .from("configuracoes_saas")
          .update(dados)
          .eq("id", configuracao.id)
      : await supabase.from("configuracoes_saas").insert([dados]);

    setSalvando(false);

    if (resultado.error) {
      alert("Erro ao salvar configurações: " + resultado.error.message);
      return;
    }

    await carregarConfiguracao();
    alert("Configurações SaaS salvas com sucesso.");
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 overflow-x-hidden">
      <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 rounded-[30px] p-6 lg:p-8 text-white shadow-xl mb-6 overflow-hidden relative">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <p className="text-blue-200 font-black">Painel Master THCloud</p>

            <h1 className="text-3xl lg:text-4xl font-black mt-2">
              Configurações SaaS
            </h1>

            <p className="mt-2 text-blue-100 max-w-4xl">
              Controle regras automáticas de cobrança, vencimento, carência,
              bloqueio e notificações do THCloud.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={carregarConfiguracao}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              {carregando ? "Atualizando..." : "Atualizar"}
            </button>

            <button
              onClick={salvarConfiguracao}
              disabled={salvando}
              className="bg-white text-blue-800 hover:bg-blue-50 px-5 py-3 rounded-2xl font-black inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Save size={18} />
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-6">
        <ResumoCard
          titulo="Cobrança automática"
          descricao="Gera mensalidade automaticamente."
          ativo={configuracao.gerar_cobranca_automatica}
          icone={<CreditCard size={24} />}
        />

        <ResumoCard
          titulo="Bloqueio automático"
          descricao="Bloqueia empresa após vencimento."
          ativo={configuracao.bloquear_automaticamente}
          icone={<ShieldAlert size={24} />}
        />

        <ResumoCard
          titulo="Notificação"
          descricao="Avisa vencimentos e atrasos."
          ativo={configuracao.enviar_notificacao_vencimento}
          icone={<BellRing size={24} />}
        />

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-black text-slate-900">Carência</p>
              <p className="text-sm text-slate-500 mt-1">
                Dias antes do bloqueio.
              </p>
            </div>

            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock size={24} />
            </div>
          </div>

          <h2 className="mt-5 text-3xl font-black text-blue-700">
            {configuracao.dias_carencia || "0"} dia(s)
          </h2>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-[30px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 lg:p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <Settings size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  Regras Automáticas
                </h2>
                <p className="text-slate-500">
                  Configure o comportamento automático do SaaS.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 lg:p-6 space-y-4">
            <CampoNumero
              label="Dias de carência"
              descricao="Quantidade de dias após o vencimento antes do bloqueio automático."
              value={configuracao.dias_carencia}
              onChange={(valor) => alterarCampo("dias_carencia", valor)}
            />

            <SwitchConfig
              titulo="Gerar cobrança automaticamente"
              descricao="Quando ativado, o sistema pode gerar mensalidades SaaS automaticamente para empresas ativas."
              ativo={configuracao.gerar_cobranca_automatica}
              onClick={() =>
                alterarCampo(
                  "gerar_cobranca_automatica",
                  !configuracao.gerar_cobranca_automatica
                )
              }
            />

            <SwitchConfig
              titulo="Bloquear automaticamente por atraso"
              descricao="Quando ativado, empresas vencidas podem ser bloqueadas automaticamente após o período de carência."
              ativo={configuracao.bloquear_automaticamente}
              onClick={() =>
                alterarCampo(
                  "bloquear_automaticamente",
                  !configuracao.bloquear_automaticamente
                )
              }
            />

            <SwitchConfig
              titulo="Enviar notificações de vencimento"
              descricao="Quando ativado, o Super Admin recebe alertas de empresas vencendo, vencidas ou bloqueadas."
              ativo={configuracao.enviar_notificacao_vencimento}
              onClick={() =>
                alterarCampo(
                  "enviar_notificacao_vencimento",
                  !configuracao.enviar_notificacao_vencimento
                )
              }
            />
          </div>

          <div className="p-5 lg:p-6 border-t border-slate-200 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={carregarConfiguracao}
              className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black"
            >
              Cancelar alterações
            </button>

            <button
              onClick={salvarConfiguracao}
              disabled={salvando}
              className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-black disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {salvando ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[30px] border border-slate-200 shadow-sm p-5 lg:p-6">
          <h2 className="text-2xl font-black text-slate-950">
            Como funciona
          </h2>

          <p className="mt-2 text-slate-500">
            Essas regras serão usadas pelas automações SaaS do THCloud.
          </p>

          <div className="mt-6 space-y-4">
            <Passo
              numero="1"
              titulo="Geração de cobrança"
              texto="O sistema identifica empresas ativas e gera mensalidades em aberto."
            />

            <Passo
              numero="2"
              titulo="Aviso de vencimento"
              texto="O Super Admin recebe alerta antes ou depois do vencimento."
            />

            <Passo
              numero="3"
              titulo="Período de carência"
              texto="A empresa ainda pode acessar por alguns dias após vencer."
            />

            <Passo
              numero="4"
              titulo="Bloqueio"
              texto="Se continuar vencida após a carência, o acesso é bloqueado."
            />
          </div>

          <div className="mt-6 rounded-3xl bg-blue-50 border border-blue-100 p-5">
            <p className="font-black text-blue-900">Próxima integração</p>
            <p className="text-sm text-blue-700 mt-1">
              Vamos conectar essas configurações na rota automática do SaaS para
              gerar cobranças e bloquear empresas conforme essas regras.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ResumoCard({
  titulo,
  descricao,
  ativo,
  icone,
}: {
  titulo: string;
  descricao: string;
  ativo: boolean;
  icone: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-black text-slate-900">{titulo}</p>
          <p className="text-sm text-slate-500 mt-1">{descricao}</p>
        </div>

        <div
          className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
            ativo ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
          }`}
        >
          {icone}
        </div>
      </div>

      <div
        className={`mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-black ${
          ativo ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
        }`}
      >
        <CheckCircle2 size={16} />
        {ativo ? "Ativo" : "Inativo"}
      </div>
    </div>
  );
}

function CampoNumero({
  label,
  descricao,
  value,
  onChange,
}: {
  label: string;
  descricao: string;
  value: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 p-5">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4 items-center">
        <div>
          <p className="font-black text-slate-950">{label}</p>
          <p className="text-sm text-slate-500 mt-1">{descricao}</p>
        </div>

        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-black text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        />
      </div>
    </div>
  );
}

function SwitchConfig({
  titulo,
  descricao,
  ativo,
  onClick,
}: {
  titulo: string;
  descricao: string;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-3xl border p-5 transition ${
        ativo
          ? "border-blue-200 bg-blue-50 hover:bg-blue-100"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-black text-slate-950">{titulo}</p>
          <p className="text-sm text-slate-500 mt-1">{descricao}</p>
        </div>

        <div
          className={`shrink-0 ${
            ativo ? "text-blue-700" : "text-slate-400"
          }`}
        >
          {ativo ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
        </div>
      </div>
    </button>
  );
}

function Passo({
  numero,
  titulo,
  texto,
}: {
  numero: string;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="h-9 w-9 shrink-0 rounded-2xl bg-blue-700 text-white flex items-center justify-center font-black">
        {numero}
      </div>

      <div>
        <p className="font-black text-slate-950">{titulo}</p>
        <p className="text-sm text-slate-500">{texto}</p>
      </div>
    </div>
  );
}
