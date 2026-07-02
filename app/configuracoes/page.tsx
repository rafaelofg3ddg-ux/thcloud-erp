"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getEmpresaId } from "../../lib/empresa";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  CreditCard,
  DatabaseBackup,
  FileText,
  MessageCircle,
  MonitorCog,
  Palette,
  Printer,
  RefreshCcw,
  Save,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Wallet,
} from "lucide-react";

type ConfiguracoesGerais = {
  id?: string;
  empresa_id: string;
  nome_sistema: string;
  tema_cor: string;
  modo_compacto: boolean;
  permitir_estoque_negativo: boolean;
  alerta_estoque_baixo: boolean;
  imprimir_cupom_automatico: boolean;
  imprimir_romaneio_delivery: boolean;
  mostrar_logo_cupom: boolean;
  mensagem_cupom: string;
  validade_orcamento_dias: number;
  bloquear_venda_sem_caixa: boolean;
  exigir_cliente_crediario: boolean;
  exigir_autorizacao_sangria: boolean;
  exigir_autorizacao_desconto: boolean;
  desconto_maximo_percentual: number;
  chave_pix: string;
  nome_recebedor_pix: string;
  cidade_pix: string;
  whatsapp_padrao: string;
  mensagem_whatsapp_orcamento: string;
  horario_funcionamento: string;
  observacoes_internas: string;
  permitir_arredondamento_operador: boolean;
  intervalo_parcelas_padrao_dias: number;
  gerar_promissoria_crediario: boolean;
};

type EmpresaLocal = {
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  logo_url: string;
};

const configuracaoPadrao = (empresaId: string): ConfiguracoesGerais => ({
  empresa_id: empresaId,
  nome_sistema: "Th Cloud",
  tema_cor: "#1d4ed8",
  modo_compacto: false,
  permitir_estoque_negativo: false,
  alerta_estoque_baixo: true,
  imprimir_cupom_automatico: true,
  imprimir_romaneio_delivery: true,
  mostrar_logo_cupom: true,
  mensagem_cupom: "Obrigado pela preferência!",
  validade_orcamento_dias: 7,
  bloquear_venda_sem_caixa: true,
  exigir_cliente_crediario: true,
  exigir_autorizacao_sangria: true,
  exigir_autorizacao_desconto: false,
  desconto_maximo_percentual: 0,
  chave_pix: "",
  nome_recebedor_pix: "TH GESTAO",
  cidade_pix: "SAO PAULO",
  whatsapp_padrao: "",
  mensagem_whatsapp_orcamento:
    "Olá! Segue seu orçamento. Qualquer dúvida estamos à disposição.",
  horario_funcionamento: "",
  observacoes_internas: "",
  permitir_arredondamento_operador: true,
  intervalo_parcelas_padrao_dias: 30,
  gerar_promissoria_crediario: true,
});

export default function ConfiguracoesGeraisPage() {
  const [config, setConfig] = useState<ConfiguracoesGerais | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaLocal>({
    nome: "Empresa",
    documento: "",
    email: "",
    telefone: "",
    logo_url: "/logo-thcloud.jpeg",
  });

  const [aba, setAba] = useState<
    "geral" | "vendas" | "financeiro" | "impressao" | "whatsapp" | "seguranca" | "backup"
  >("geral");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  function empresaAtualId() {
    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }

    return empresaId;
  }

  function carregarEmpresaLocal() {
    try {
      const usuario = JSON.parse(localStorage.getItem("th_usuario") || "{}");
      const empresaStorage = JSON.parse(localStorage.getItem("th_empresa") || "{}");

      setEmpresa({
        nome:
          empresaStorage.nome_fantasia ||
          empresaStorage.nome ||
          usuario.empresa_nome ||
          "Empresa",
        documento:
          empresaStorage.cnpj ||
          empresaStorage.cpf_cnpj ||
          usuario.empresa_cnpj ||
          "",
        email:
          empresaStorage.email ||
          usuario.empresa_email ||
          "",
        telefone:
          empresaStorage.telefone ||
          empresaStorage.whatsapp ||
          usuario.empresa_telefone ||
          "",
        logo_url:
          empresaStorage.logo_url ||
          empresaStorage.logo ||
          "/logo-thcloud.jpeg",
      });
    } catch {
      setEmpresa({
        nome: "Empresa",
        documento: "",
        email: "",
        telefone: "",
        logo_url: "/logo-thcloud.jpeg",
      });
    }
  }

  async function carregarConfiguracoes() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setCarregando(true);
    carregarEmpresaLocal();

    const { data, error } = await supabase
      .from("configuracoes_gerais")
      .select("*")
      .eq("empresa_id", empresaId)
      .maybeSingle();

    if (error) {
      setCarregando(false);
      alert("Erro ao carregar configurações: " + error.message);
      return;
    }

    if (!data) {
      const padrao = configuracaoPadrao(empresaId);

      const insert = await supabase
        .from("configuracoes_gerais")
        .upsert(padrao, { onConflict: "empresa_id" })
        .select("*")
        .single();

      if (insert.error) {
        const tentarBuscar = await supabase
          .from("configuracoes_gerais")
          .select("*")
          .eq("empresa_id", empresaId)
          .maybeSingle();

        setCarregando(false);

        if (tentarBuscar.error || !tentarBuscar.data) {
          alert("Erro ao criar configuração padrão: " + insert.error.message);
          return;
        }

        setConfig(normalizarConfig(tentarBuscar.data));
        return;
      }

      setCarregando(false);
      setConfig(normalizarConfig(insert.data));
      return;
    }

    setConfig(normalizarConfig(data));
    setCarregando(false);
  }

  function normalizarConfig(data: any): ConfiguracoesGerais {
    return {
      id: data.id,
      empresa_id: data.empresa_id,
      nome_sistema: data.nome_sistema || "Th Cloud",
      tema_cor: data.tema_cor || "#1d4ed8",
      modo_compacto: data.modo_compacto === true,
      permitir_estoque_negativo: data.permitir_estoque_negativo === true,
      alerta_estoque_baixo: data.alerta_estoque_baixo !== false,
      imprimir_cupom_automatico: data.imprimir_cupom_automatico !== false,
      imprimir_romaneio_delivery: data.imprimir_romaneio_delivery !== false,
      mostrar_logo_cupom: data.mostrar_logo_cupom !== false,
      mensagem_cupom: data.mensagem_cupom || "Obrigado pela preferência!",
      validade_orcamento_dias: Number(data.validade_orcamento_dias || 7),
      bloquear_venda_sem_caixa: data.bloquear_venda_sem_caixa !== false,
      exigir_cliente_crediario: data.exigir_cliente_crediario !== false,
      exigir_autorizacao_sangria: data.exigir_autorizacao_sangria !== false,
      exigir_autorizacao_desconto: data.exigir_autorizacao_desconto === true,
      desconto_maximo_percentual: Number(data.desconto_maximo_percentual || 0),
      chave_pix: data.chave_pix || "",
      nome_recebedor_pix: data.nome_recebedor_pix || "TH GESTAO",
      cidade_pix: data.cidade_pix || "SAO PAULO",
      whatsapp_padrao: data.whatsapp_padrao || "",
      mensagem_whatsapp_orcamento:
        data.mensagem_whatsapp_orcamento ||
        "Olá! Segue seu orçamento. Qualquer dúvida estamos à disposição.",
      horario_funcionamento: data.horario_funcionamento || "",
      observacoes_internas: data.observacoes_internas || "",
      permitir_arredondamento_operador: data.permitir_arredondamento_operador !== false,
      intervalo_parcelas_padrao_dias: Number(data.intervalo_parcelas_padrao_dias || 30),
      gerar_promissoria_crediario: data.gerar_promissoria_crediario !== false,
    };
  }

  function atualizar<K extends keyof ConfiguracoesGerais>(
    campo: K,
    valor: ConfiguracoesGerais[K]
  ) {
    if (!config) return;
    setConfig({ ...config, [campo]: valor });
  }

  async function salvarConfiguracoes() {
    if (!config) return;

    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!config.nome_sistema.trim()) {
      alert("Informe o nome do sistema.");
      return;
    }

    if (Number(config.validade_orcamento_dias || 0) <= 0) {
      alert("A validade padrão do orçamento precisa ser maior que zero.");
      return;
    }

    setSalvando(true);

    const payload = {
      empresa_id: empresaId,
      nome_sistema: config.nome_sistema,
      tema_cor: config.tema_cor,
      modo_compacto: config.modo_compacto,
      permitir_estoque_negativo: config.permitir_estoque_negativo,
      alerta_estoque_baixo: config.alerta_estoque_baixo,
      imprimir_cupom_automatico: config.imprimir_cupom_automatico,
      imprimir_romaneio_delivery: config.imprimir_romaneio_delivery,
      mostrar_logo_cupom: config.mostrar_logo_cupom,
      mensagem_cupom: config.mensagem_cupom,
      validade_orcamento_dias: Number(config.validade_orcamento_dias || 7),
      bloquear_venda_sem_caixa: config.bloquear_venda_sem_caixa,
      exigir_cliente_crediario: config.exigir_cliente_crediario,
      exigir_autorizacao_sangria: config.exigir_autorizacao_sangria,
      exigir_autorizacao_desconto: config.exigir_autorizacao_desconto,
      desconto_maximo_percentual: Number(config.desconto_maximo_percentual || 0),
      chave_pix: config.chave_pix || null,
      nome_recebedor_pix: config.nome_recebedor_pix || null,
      cidade_pix: config.cidade_pix || null,
      whatsapp_padrao: config.whatsapp_padrao || null,
      mensagem_whatsapp_orcamento: config.mensagem_whatsapp_orcamento || null,
      horario_funcionamento: config.horario_funcionamento || null,
      observacoes_internas: config.observacoes_internas || null,
      permitir_arredondamento_operador: config.permitir_arredondamento_operador,
      intervalo_parcelas_padrao_dias: Number(config.intervalo_parcelas_padrao_dias || 30),
      gerar_promissoria_crediario: config.gerar_promissoria_crediario,
    };

    const { data, error } = await supabase
      .from("configuracoes_gerais")
      .upsert(payload, { onConflict: "empresa_id" })
      .select("*")
      .single();

    setSalvando(false);

    if (error) {
      alert("Erro ao salvar configurações: " + error.message);
      return;
    }

    setConfig(normalizarConfig(data));

    try {
      localStorage.setItem("th_configuracoes_gerais", JSON.stringify(normalizarConfig(data)));
    } catch {}

    alert("Configurações salvas com sucesso!");
  }

  async function restaurarPadrao() {
    const confirmar = confirm(
      "Deseja restaurar as configurações padrão? As alterações atuais serão substituídas."
    );

    if (!confirmar) return;

    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setConfig(configuracaoPadrao(empresaId));
  }

  const resumo = useMemo(() => {
    if (!config) {
      return {
        regrasAtivas: 0,
        integracoes: 0,
        impressao: 0,
        seguranca: 0,
      };
    }

    return {
      regrasAtivas: [
        config.bloquear_venda_sem_caixa,
        config.exigir_cliente_crediario,
        config.alerta_estoque_baixo,
        config.permitir_estoque_negativo,
      ].filter(Boolean).length,
      integracoes: [
        !!config.chave_pix,
        !!config.whatsapp_padrao,
        !!config.mensagem_whatsapp_orcamento,
      ].filter(Boolean).length,
      impressao: [
        config.imprimir_cupom_automatico,
        config.imprimir_romaneio_delivery,
        config.mostrar_logo_cupom,
      ].filter(Boolean).length,
      seguranca: [
        config.exigir_autorizacao_sangria,
        config.exigir_autorizacao_desconto,
      ].filter(Boolean).length,
    };
  }, [config]);

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  if (carregando || !config) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center">
          <RefreshCcw className="mx-auto animate-spin text-blue-700" size={36} />
          <h2 className="text-2xl font-black text-slate-900 mt-4">
            Carregando configurações...
          </h2>
          <p className="text-slate-500 mt-2">
            Aguarde enquanto buscamos as preferências da empresa.
          </p>
        </div>
      </div>
    );
  }

  const abas = [
    { id: "geral", titulo: "Geral", icone: <Settings size={18} /> },
    { id: "vendas", titulo: "Vendas", icone: <ShoppingCart size={18} /> },
    { id: "financeiro", titulo: "Financeiro", icone: <Wallet size={18} /> },
    { id: "impressao", titulo: "Impressão", icone: <Printer size={18} /> },
    { id: "whatsapp", titulo: "WhatsApp", icone: <MessageCircle size={18} /> },
    { id: "seguranca", titulo: "Segurança", icone: <ShieldCheck size={18} /> },
    { id: "backup", titulo: "Backup", icone: <DatabaseBackup size={18} /> },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-8 shadow-lg mb-8 text-white">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-blue-100 font-bold">Th Cloud</p>

            <h1 className="text-4xl font-black mt-2">
              Configurações Gerais
            </h1>

            <p className="text-blue-100 mt-2 max-w-4xl">
              Controle as regras do sistema, impressão, vendas, financeiro, WhatsApp, PIX e segurança da empresa.
            </p>

            <p className="text-blue-50 mt-4 font-bold">
              Empresa atual: {empresa.nome}
            </p>
          </div>

          <div className="bg-white/10 rounded-3xl p-4 border border-white/20 flex items-center gap-4">
            <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center overflow-hidden">
              <img
                src={empresa.logo_url}
                alt={empresa.nome}
                className="max-h-16 max-w-16 object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/logo-thcloud.jpeg";
                }}
              />
            </div>

            <div>
              <p className="text-blue-100 text-sm">Identidade da empresa</p>
              <p className="font-black">{empresa.nome}</p>
              <p className="text-blue-100 text-sm">{empresa.documento || "Sem documento"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <Resumo
          titulo="Regras Ativas"
          valor={`${resumo.regrasAtivas}`}
          detalhe="Vendas, estoque e orçamento"
          icone={<SlidersHorizontal size={24} />}
          cor="text-blue-700"
        />

        <Resumo
          titulo="Integrações"
          valor={`${resumo.integracoes}`}
          detalhe="PIX, WhatsApp e mensagens"
          icone={<MessageCircle size={24} />}
          cor="text-green-700"
        />

        <Resumo
          titulo="Impressão"
          valor={`${resumo.impressao}`}
          detalhe="Cupons e romaneios"
          icone={<Printer size={24} />}
          cor="text-purple-700"
        />

        <Resumo
          titulo="Segurança"
          valor={`${resumo.seguranca}`}
          detalhe="Autorizações exigidas"
          icone={<ShieldCheck size={24} />}
          cor="text-orange-700"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-3">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sticky top-6">
            <p className="text-sm font-black text-slate-500 uppercase px-3 mb-3">
              Módulos
            </p>

            <div className="space-y-2">
              {abas.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setAba(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-black transition ${
                    aba === item.id
                      ? "bg-blue-700 text-white shadow"
                      : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {item.icone}
                  {item.titulo}
                </button>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 space-y-3">
              <button
                onClick={salvarConfiguracoes}
                disabled={salvando}
                className={`w-full px-5 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 ${
                  salvando
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                <Save size={18} />
                {salvando ? "Salvando..." : "Salvar Configurações"}
              </button>

              <button
                onClick={restaurarPadrao}
                className="w-full px-5 py-3 rounded-2xl font-black bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-2"
              >
                <RefreshCcw size={18} />
                Restaurar Padrão
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-9 space-y-6">
          {aba === "geral" && (
            <Card titulo="Configurações do Sistema" descricao="Ajustes principais de identidade, tela e comportamento geral." icone={<MonitorCog size={24} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo titulo="Nome do sistema">
                  <input
                    value={config.nome_sistema}
                    onChange={(e) => atualizar("nome_sistema", e.target.value)}
                    className="input-config"
                    placeholder="Ex.: Th Cloud"
                  />
                </Campo>

                <Campo titulo="Cor principal do sistema">
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={config.tema_cor}
                      onChange={(e) => atualizar("tema_cor", e.target.value)}
                      className="h-12 w-20 rounded-xl border border-slate-300 p-1"
                    />

                    <input
                      value={config.tema_cor}
                      onChange={(e) => atualizar("tema_cor", e.target.value)}
                      className="input-config"
                    />
                  </div>
                </Campo>

                <Campo titulo="Horário de funcionamento">
                  <input
                    value={config.horario_funcionamento}
                    onChange={(e) => atualizar("horario_funcionamento", e.target.value)}
                    className="input-config"
                    placeholder="Ex.: Segunda a sábado, 08h às 18h"
                  />
                </Campo>

                <div className="flex items-end">
                  <Switch
                    titulo="Modo compacto nas telas"
                    descricao="Reduz espaçamentos para caber melhor em monitores menores."
                    checked={config.modo_compacto}
                    onChange={(v) => atualizar("modo_compacto", v)}
                  />
                </div>
              </div>

              <Campo titulo="Observações internas">
                <textarea
                  value={config.observacoes_internas}
                  onChange={(e) => atualizar("observacoes_internas", e.target.value)}
                  className="input-config min-h-32"
                  placeholder="Anotações internas da empresa..."
                />
              </Campo>
            </Card>
          )}

          {aba === "vendas" && (
            <Card titulo="Regras de Vendas e Orçamentos" descricao="Controle o funcionamento do PDV, orçamento, crediário e descontos." icone={<ShoppingCart size={24} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Switch
                  titulo="Bloquear venda sem caixa aberto"
                  descricao="Impede finalizar venda quando não houver caixa aberto."
                  checked={config.bloquear_venda_sem_caixa}
                  onChange={(v) => atualizar("bloquear_venda_sem_caixa", v)}
                />

                <Switch
                  titulo="Exigir cliente no crediário"
                  descricao="Impede venda no crediário sem cliente selecionado."
                  checked={config.exigir_cliente_crediario}
                  onChange={(v) => atualizar("exigir_cliente_crediario", v)}
                />

                <Switch
                  titulo="Permitir arredondamento no PDV"
                  descricao="Libera o operador para arredondar o total da venda para mais ou para menos."
                  checked={config.permitir_arredondamento_operador}
                  onChange={(v) => atualizar("permitir_arredondamento_operador", v)}
                />

                <Switch
                  titulo="Gerar promissória no crediário"
                  descricao="Imprime promissórias/duplicatas para assinatura quando a venda for no crediário."
                  checked={config.gerar_promissoria_crediario}
                  onChange={(v) => atualizar("gerar_promissoria_crediario", v)}
                />

                <Switch
                  titulo="Permitir estoque negativo"
                  descricao="Permite vender mesmo quando o estoque estiver zerado."
                  checked={config.permitir_estoque_negativo}
                  onChange={(v) => atualizar("permitir_estoque_negativo", v)}
                />

                <Switch
                  titulo="Alertar estoque baixo"
                  descricao="Exibe alertas quando produtos estiverem abaixo do mínimo."
                  checked={config.alerta_estoque_baixo}
                  onChange={(v) => atualizar("alerta_estoque_baixo", v)}
                />

                <Campo titulo="Validade padrão do orçamento em dias">
                  <input
                    type="number"
                    value={config.validade_orcamento_dias}
                    onChange={(e) => atualizar("validade_orcamento_dias", Number(e.target.value || 0))}
                    className="input-config"
                  />
                </Campo>

                <Campo titulo="Intervalo padrão das parcelas do crediário em dias">
                  <input
                    type="number"
                    value={config.intervalo_parcelas_padrao_dias}
                    onChange={(e) => atualizar("intervalo_parcelas_padrao_dias", Number(e.target.value || 30))}
                    className="input-config"
                    placeholder="Ex.: 30"
                  />
                </Campo>

                <Campo titulo="Desconto máximo sem autorização (%)">
                  <input
                    type="number"
                    value={config.desconto_maximo_percentual}
                    onChange={(e) => atualizar("desconto_maximo_percentual", Number(e.target.value || 0))}
                    className="input-config"
                  />
                </Campo>
              </div>
            </Card>
          )}

          {aba === "financeiro" && (
            <Card titulo="PIX e Financeiro" descricao="Configure dados padrão para PIX, recebimentos e operações financeiras." icone={<Wallet size={24} />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Campo titulo="Chave PIX padrão">
                  <input
                    value={config.chave_pix}
                    onChange={(e) => atualizar("chave_pix", e.target.value)}
                    className="input-config"
                    placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                  />
                </Campo>

                <Campo titulo="Nome do recebedor PIX">
                  <input
                    value={config.nome_recebedor_pix}
                    onChange={(e) => atualizar("nome_recebedor_pix", e.target.value)}
                    className="input-config"
                    placeholder="Nome que aparecerá no PIX"
                  />
                </Campo>

                <Campo titulo="Cidade do PIX">
                  <input
                    value={config.cidade_pix}
                    onChange={(e) => atualizar("cidade_pix", e.target.value.toUpperCase())}
                    className="input-config"
                    placeholder="SAO PAULO"
                  />
                </Campo>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5">
                <div className="flex items-start gap-3">
                  <CreditCard className="text-blue-700 mt-1" size={22} />
                  <div>
                    <h3 className="font-black text-blue-900">
                      Integração com PDV
                    </h3>
                    <p className="text-blue-700 mt-1">
                      Estes dados poderão ser usados automaticamente na tela de pagamento para gerar PIX copia e cola e QR Code.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {aba === "impressao" && (
            <Card titulo="Impressão, Cupom e Relatórios" descricao="Defina padrões de impressão para cupom, romaneio e documentos emitidos." icone={<Printer size={24} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Switch
                  titulo="Imprimir cupom automaticamente"
                  descricao="Após finalizar venda, abrir a impressão do cupom."
                  checked={config.imprimir_cupom_automatico}
                  onChange={(v) => atualizar("imprimir_cupom_automatico", v)}
                />

                <Switch
                  titulo="Mostrar logo no cupom e relatórios"
                  descricao="Usa a logo cadastrada em Minha Empresa."
                  checked={config.mostrar_logo_cupom}
                  onChange={(v) => atualizar("mostrar_logo_cupom", v)}
                />

                <Switch
                  titulo="Imprimir romaneio no delivery"
                  descricao="Em vendas de entrega, imprime o romaneio junto ao cupom."
                  checked={config.imprimir_romaneio_delivery}
                  onChange={(v) => atualizar("imprimir_romaneio_delivery", v)}
                />
              </div>

              <Campo titulo="Mensagem padrão do cupom">
                <textarea
                  value={config.mensagem_cupom}
                  onChange={(e) => atualizar("mensagem_cupom", e.target.value)}
                  className="input-config min-h-28"
                  placeholder="Mensagem que aparece no rodapé do cupom..."
                />
              </Campo>

              <div className="bg-slate-100 border border-slate-200 rounded-3xl p-5">
                <p className="font-black text-slate-900 mb-2">
                  Prévia do rodapé do cupom
                </p>
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-4 text-center">
                  <p className="font-bold">{config.mensagem_cupom}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Sistema: {config.nome_sistema}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {aba === "whatsapp" && (
            <Card titulo="WhatsApp e Mensagens" descricao="Configure mensagens e número padrão para contato com clientes." icone={<MessageCircle size={24} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Campo titulo="WhatsApp padrão da empresa">
                  <input
                    value={config.whatsapp_padrao}
                    onChange={(e) => atualizar("whatsapp_padrao", e.target.value)}
                    className="input-config"
                    placeholder="Ex.: 5599999999999"
                  />
                </Campo>

                <div className="bg-green-50 border border-green-200 rounded-3xl p-5">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="text-green-700 mt-1" size={22} />
                    <div>
                      <h3 className="font-black text-green-900">
                        Envio de orçamentos
                      </h3>
                      <p className="text-green-700 mt-1">
                        A mensagem abaixo será usada como base ao enviar orçamento pelo WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Campo titulo="Mensagem padrão para orçamento">
                <textarea
                  value={config.mensagem_whatsapp_orcamento}
                  onChange={(e) => atualizar("mensagem_whatsapp_orcamento", e.target.value)}
                  className="input-config min-h-36"
                  placeholder="Mensagem padrão..."
                />
              </Campo>
            </Card>
          )}

          {aba === "seguranca" && (
            <Card titulo="Segurança e Autorizações" descricao="Defina quais operações exigem autorização de usuário responsável." icone={<ShieldCheck size={24} />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Switch
                  titulo="Exigir autorização para sangria"
                  descricao="Solicita usuário e senha para retirar dinheiro do caixa."
                  checked={config.exigir_autorizacao_sangria}
                  onChange={(v) => atualizar("exigir_autorizacao_sangria", v)}
                />

                <Switch
                  titulo="Exigir autorização para desconto"
                  descricao="Solicita senha quando desconto ultrapassar a regra definida."
                  checked={config.exigir_autorizacao_desconto}
                  onChange={(v) => atualizar("exigir_autorizacao_desconto", v)}
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-700 mt-1" size={24} />
                  <div>
                    <h3 className="font-black text-yellow-900">
                      Recomendação
                    </h3>
                    <p className="text-yellow-800 mt-1">
                      Para lojas com operadores de caixa, mantenha autorização em sangria e descontos altos para evitar divergências no fechamento.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}


          {aba === "backup" && (
            <Card
              titulo="Backup e Restauração"
              descricao="Gere uma cópia dos dados da empresa e restaure quando necessário."
              icone={<DatabaseBackup size={24} />}
            >
              <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div>
                    <h3 className="text-xl font-black text-blue-900">
                      Backup completo da empresa
                    </h3>
                    <p className="text-blue-700 mt-2">
                      Esta opção abre a tela de backup, onde será possível baixar um arquivo com clientes, produtos, vendas, financeiro, caixas, configurações e demais dados da empresa.
                    </p>
                  </div>

                  <a
                    href="/configuracoes/backup"
                    className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2"
                  >
                    <DatabaseBackup size={20} />
                    Abrir Backup
                  </a>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-700 mt-1" size={24} />
                  <div>
                    <h3 className="font-black text-yellow-900">
                      Atenção importante
                    </h3>
                    <p className="text-yellow-800 mt-1">
                      Guarde os arquivos de backup em local seguro. Ao restaurar um backup, os dados atuais da empresa podem ser substituídos pelos dados do arquivo escolhido.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 mt-1" size={24} />
              <div>
                <h3 className="font-black text-slate-900">
                  Pronto para salvar
                </h3>
                <p className="text-slate-500">
                  Após salvar, essas configurações ficam gravadas para a empresa atual.
                </p>
              </div>
            </div>

            <button
              onClick={salvarConfiguracoes}
              disabled={salvando}
              className={`px-7 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 ${
                salvando
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              <Save size={18} />
              {salvando ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .input-config {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 1rem;
          padding: 0.8rem 1rem;
          color: rgb(2 6 23);
          background: white;
          font-weight: 800;
          outline: none;
        }

        .input-config::placeholder {
          color: rgb(100 116 139);
        }

        .input-config:focus {
          border-color: rgb(37 99 235);
          box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
        }
      `}</style>
    </div>
  );
}

function Card({
  titulo,
  descricao,
  icone,
  children,
}: {
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-start gap-4">
        <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
          {icone}
        </div>

        <div>
          <h2 className="text-2xl font-black text-slate-900">{titulo}</h2>
          <p className="text-slate-500 mt-1">{descricao}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">{children}</div>
    </section>
  );
}

function Campo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-black text-slate-700 mb-2">
        {titulo}
      </label>

      {children}
    </div>
  );
}

function Switch({
  titulo,
  descricao,
  checked,
  onChange,
}: {
  titulo: string;
  descricao: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full text-left border rounded-3xl p-5 transition ${
        checked
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`font-black ${checked ? "text-blue-900" : "text-slate-900"}`}>
            {titulo}
          </p>
          <p className={`${checked ? "text-blue-700" : "text-slate-500"} text-sm mt-1`}>
            {descricao}
          </p>
        </div>

        <div
          className={`h-7 w-12 rounded-full p-1 transition ${
            checked ? "bg-blue-700" : "bg-slate-300"
          }`}
        >
          <div
            className={`h-5 w-5 bg-white rounded-full transition ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>
      </div>
    </button>
  );
}

function Resumo({
  titulo,
  valor,
  detalhe,
  icone,
  cor,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  icone: React.ReactNode;
  cor: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{titulo}</p>
          <h2 className={`text-3xl font-black mt-2 ${cor}`}>{valor}</h2>
          <p className="text-sm text-slate-500 mt-2">{detalhe}</p>
        </div>

        <div className={`h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center ${cor}`}>
          {icone}
        </div>
      </div>
    </div>
  );
}
