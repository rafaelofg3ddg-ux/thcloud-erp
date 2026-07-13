"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle,
  Cloud,
  DatabaseBackup,
  Download,
  FileJson,
  History,
  Save,
  RefreshCcw,
  Upload,
} from "lucide-react";
import {
  baixarBackupDaNuvem,
  baixarBackupJson,
  carregarConfiguracaoBackup,
  gerarBackupEmpresa,
  lerArquivoJson,
  listarHistoricoBackups,
  restaurarBackupEmpresa,
  resumoBackup,
  salvarBackupNoStorage,
  salvarConfiguracaoBackup,
  type BackupCompleto,
  type BackupConfiguracao,
} from "../../../lib/backup";
import { formatarData } from "../../../components/global/THFormat";

type EmpresaLocal = {
  nome: string;
  documento: string;
  usuario_id: string | null;
  usuario_nome: string | null;
};

type BackupHistorico = {
  id: string;
  empresa_id: string;
  usuario_id: string | null;
  usuario_nome: string | null;
  empresa_nome: string | null;
  arquivo_nome: string;
  storage_bucket: string;
  storage_path: string;
  tamanho_bytes: number;
  total_tabelas: number;
  tabelas_com_dados: number;
  total_registros: number;
  tabelas_com_erro: number;
  status: string;
  observacao: string | null;
  created_at: string;
};

export default function BackupPage() {
  const [gerando, setGerando] = useState(false);
  const [salvandoNuvem, setSalvandoNuvem] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [status, setStatus] = useState("");
  const [backupGerado, setBackupGerado] = useState<BackupCompleto | null>(null);
  const [backupSelecionado, setBackupSelecionado] = useState<BackupCompleto | null>(null);
  const [historico, setHistorico] = useState<BackupHistorico[]>([]);
  const [configBackup, setConfigBackup] = useState<BackupConfiguracao | null>(null);
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [substituirDadosAtuais, setSubstituirDadosAtuais] = useState(false);

  function empresaAtualId() {
    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }

    return empresaId;
  }

  function empresaLocal(): EmpresaLocal {
    try {
      const usuario = JSON.parse(
        sessionStorage.getItem("th_usuario") ||
          localStorage.getItem("th_usuario") ||
          "{}"
      );
      const empresa = JSON.parse(
        sessionStorage.getItem("th_empresa") ||
          localStorage.getItem("th_empresa") ||
          "{}"
      );

      return {
        nome:
          empresa.nome_fantasia ||
          empresa.razao_social ||
          empresa.nome ||
          usuario.empresa_nome ||
          "Empresa",
        documento:
          empresa.cnpj ||
          empresa.cpf_cnpj ||
          usuario.empresa_cnpj ||
          "",
        usuario_id: usuario.id || null,
        usuario_nome: usuario.nome || null,
      };
    } catch {
      return {
        nome: "Empresa",
        documento: "",
        usuario_id: null,
        usuario_nome: null,
      };
    }
  }

  const empresa = empresaLocal();

  const resumoGerado = useMemo(() => {
    if (!backupGerado) return null;
    return resumoBackup(backupGerado);
  }, [backupGerado]);

  const resumoSelecionado = useMemo(() => {
    if (!backupSelecionado) return null;
    return resumoBackup(backupSelecionado);
  }, [backupSelecionado]);

  async function carregarConfigBackup() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    try {
      const config = await carregarConfiguracaoBackup({
        supabase,
        empresaId,
        empresaNome: empresa.nome,
      });

      setConfigBackup(config);
    } catch (error: any) {
      alert(error.message || "Erro ao carregar configuração de backup automático.");
    }
  }

  async function salvarConfigBackup() {
    if (!configBackup) return;

    setSalvandoConfig(true);
    setStatus("Salvando configuração de backup automático...");

    try {
      const salvo = await salvarConfiguracaoBackup({
        supabase,
        configuracao: configBackup,
      });

      setConfigBackup(salvo);
      setStatus("Configuração de backup automático salva.");
      alert("Configuração salva com sucesso!");
    } catch (error: any) {
      alert(error.message || "Erro ao salvar configuração.");
      setStatus("");
    }

    setSalvandoConfig(false);
  }

  async function carregarHistorico() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setCarregandoHistorico(true);

    try {
      const lista = await listarHistoricoBackups({
        supabase,
        empresaId,
      });

      setHistorico(lista);
    } catch (error: any) {
      alert(error.message || "Erro ao carregar histórico.");
    }

    setCarregandoHistorico(false);
  }

  async function gerarBackupAgora() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setGerando(true);
    setStatus("Gerando backup da empresa...");

    try {
      const backup = await gerarBackupEmpresa({
        supabase,
        empresaId,
        empresaNome: empresa.nome,
        usuarioId: empresa.usuario_id,
        usuarioNome: empresa.usuario_nome,
      });

      setBackupGerado(backup);
      setStatus("Backup gerado com sucesso.");

      baixarBackupJson(backup, empresa.nome);
    } catch (error: any) {
      alert(error.message || "Erro ao gerar backup.");
      setStatus("");
    }

    setGerando(false);
  }

  async function gerarBackupNaNuvem() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    setSalvandoNuvem(true);
    setStatus("Gerando e salvando backup na nuvem...");

    try {
      const backup = await gerarBackupEmpresa({
        supabase,
        empresaId,
        empresaNome: empresa.nome,
        usuarioId: empresa.usuario_id,
        usuarioNome: empresa.usuario_nome,
      });

      setBackupGerado(backup);

      await salvarBackupNoStorage({
        supabase,
        backup,
        empresaNome: empresa.nome,
      });

      setStatus("Backup salvo na nuvem e registrado no histórico.");
      await carregarHistorico();

      alert("Backup salvo na nuvem com sucesso!");
    } catch (error: any) {
      alert(error.message || "Erro ao salvar backup na nuvem.");
      setStatus("");
    }

    setSalvandoNuvem(false);
  }

  async function selecionarArquivo(file: File | null) {
    if (!file) return;

    setStatus("Lendo arquivo de backup...");

    try {
      const backup = await lerArquivoJson(file);
      setBackupSelecionado(backup);
      setStatus("Arquivo carregado. Confira as informações antes de restaurar.");
    } catch (error: any) {
      alert(error.message || "Erro ao ler arquivo.");
      setBackupSelecionado(null);
      setStatus("");
    }
  }

  async function restaurarBackup() {
    const empresaId = empresaAtualId();
    if (!empresaId || !backupSelecionado) return;

    const confirmar = confirm(
      substituirDadosAtuais
        ? "ATENÇÃO: os dados atuais desta empresa serão substituídos pelos dados do backup. Deseja continuar?"
        : "Os dados do backup serão importados e atualizados. Deseja continuar?"
    );

    if (!confirmar) return;

    setRestaurando(true);
    setStatus("Iniciando restauração...");

    try {
      await restaurarBackupEmpresa({
        supabase,
        empresaId,
        backup: backupSelecionado,
        substituirDadosAtuais,
        onStatus: setStatus,
      });

      setStatus("Restauração finalizada.");
      alert("Backup restaurado com sucesso!");
    } catch (error: any) {
      alert(error.message || "Erro ao restaurar backup.");
      setStatus("");
    }

    setRestaurando(false);
  }

  async function usarBackupDaNuvem(item: BackupHistorico) {
    setStatus("Baixando backup da nuvem...");

    try {
      const backup = await baixarBackupDaNuvem({
        supabase,
        storagePath: item.storage_path,
      });

      setBackupSelecionado(backup);
      setStatus("Backup da nuvem carregado para restauração.");
      alert("Backup carregado. Confira os dados e clique em Restaurar.");
    } catch (error: any) {
      alert(error.message || "Erro ao carregar backup da nuvem.");
      setStatus("");
    }
  }

  async function baixarHistorico(item: BackupHistorico) {
    setStatus("Baixando backup da nuvem...");

    try {
      const backup = await baixarBackupDaNuvem({
        supabase,
        storagePath: item.storage_path,
      });

      baixarBackupJson(backup, empresa.nome);
      setStatus("Backup baixado com sucesso.");
    } catch (error: any) {
      alert(error.message || "Erro ao baixar backup.");
      setStatus("");
    }
  }

  function formatarTamanho(bytes: number) {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  useEffect(() => {
    carregarHistorico();
    carregarConfigBackup();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-8 shadow-lg mb-8 text-white">
        <p className="text-blue-100 font-bold">Th Cloud</p>

        <h1 className="text-4xl font-black mt-2">
          Backup e Restauração
        </h1>

        <p className="text-blue-100 mt-2 max-w-4xl">
          Gere uma cópia dos dados da empresa, baixe no computador, salve na nuvem e restaure quando necessário.
        </p>

        <p className="text-blue-50 mt-4 font-bold">
          Empresa atual: {empresa.nome}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <Resumo titulo="Tipo" valor="JSON" detalhe="Arquivo portátil" icone={<FileJson size={24} />} cor="text-blue-700" />
        <Resumo titulo="Nuvem" valor="Storage" detalhe="Supabase backups" icone={<Cloud size={24} />} cor="text-green-700" />
        <Resumo titulo="Histórico" valor={`${historico.length}`} detalhe="Backups registrados" icone={<History size={24} />} cor="text-purple-700" />
        <Resumo titulo="Status" valor={status ? "Ativo" : "Pronto"} detalhe={status || "Aguardando ação"} icone={<DatabaseBackup size={24} />} cor="text-orange-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Download size={24} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Gerar Backup</h2>
              <p className="text-slate-500 mt-1">Baixe no computador ou salve uma cópia na nuvem.</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5">
              <h3 className="font-black text-blue-900">O backup inclui:</h3>
              <p className="text-blue-700 mt-2">
                Empresa, usuários, clientes, produtos, grupos, fornecedores, vendas, itens de venda, caixas, financeiro, configurações, orçamentos, etiquetas e histórico.
              </p>
            </div>

            {resumoGerado && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <MiniInfo titulo="Tabelas" valor={`${resumoGerado.tabelas}`} />
                <MiniInfo titulo="Com dados" valor={`${resumoGerado.tabelasComDados}`} />
                <MiniInfo titulo="Registros" valor={`${resumoGerado.totalRegistros}`} />
              </div>
            )}

            <button onClick={gerarBackupAgora} disabled={gerando} className={`w-full px-6 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 ${gerando ? "bg-slate-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800"}`}>
              {gerando ? <RefreshCcw className="animate-spin" size={20} /> : <Download size={20} />}
              {gerando ? "Gerando backup..." : "Gerar e Baixar Backup Agora"}
            </button>

            <button onClick={gerarBackupNaNuvem} disabled={salvandoNuvem} className={`w-full px-6 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 ${salvandoNuvem ? "bg-slate-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}>
              {salvandoNuvem ? <RefreshCcw className="animate-spin" size={20} /> : <Cloud size={20} />}
              {salvandoNuvem ? "Salvando na nuvem..." : "Gerar e Salvar na Nuvem"}
            </button>

            {backupGerado && (
              <button onClick={() => baixarBackupJson(backupGerado, empresa.nome)} className="w-full px-6 py-4 rounded-2xl font-black bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center justify-center gap-2">
                <Download size={20} />
                Baixar Novamente
              </button>
            )}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Upload size={24} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Restaurar Backup</h2>
              <p className="text-slate-500 mt-1">Selecione um arquivo salvo ou carregue do histórico da nuvem.</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-700 mt-1" size={24} />
                <div>
                  <h3 className="font-black text-yellow-900">Atenção</h3>
                  <p className="text-yellow-800 mt-1">
                    Restaurar backup altera os dados da empresa atual. Faça um backup novo antes de restaurar qualquer arquivo antigo.
                  </p>
                </div>
              </div>
            </div>

            <label className="block">
              <span className="block text-sm font-black text-slate-700 mb-2">Arquivo de backup (.json)</span>
              <input type="file" accept="application/json,.json" onChange={(e) => selecionarArquivo(e.target.files?.[0] || null)} className="w-full border border-slate-300 rounded-2xl p-4 text-slate-900 font-bold bg-white" />
            </label>

            {resumoSelecionado && backupSelecionado && (
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5">
                <h3 className="font-black text-slate-900 mb-3">Backup selecionado</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <MiniInfo titulo="Empresa do backup" valor={backupSelecionado.empresa_nome || "-"} />
                  <MiniInfo titulo="Gerado em" valor={new Date(backupSelecionado.gerado_em).toLocaleString("pt-BR")} />
                  <MiniInfo titulo="Tabelas" valor={`${resumoSelecionado.tabelas}`} />
                  <MiniInfo titulo="Registros" valor={`${resumoSelecionado.totalRegistros}`} />
                </div>
              </div>
            )}

            <label className="border border-red-200 bg-red-50 rounded-3xl p-5 flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={substituirDadosAtuais} onChange={(e) => setSubstituirDadosAtuais(e.target.checked)} className="h-5 w-5 mt-1" />
              <div>
                <p className="font-black text-red-900">Substituir dados atuais antes de restaurar</p>
                <p className="text-red-700 text-sm mt-1">Use esta opção apenas quando quiser voltar exatamente ao estado do backup.</p>
              </div>
            </label>

            <button onClick={restaurarBackup} disabled={restaurando || !backupSelecionado} className={`w-full px-6 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 ${restaurando || !backupSelecionado ? "bg-slate-400 cursor-not-allowed" : "bg-purple-700 hover:bg-purple-800"}`}>
              {restaurando ? <RefreshCcw className="animate-spin" size={20} /> : <Upload size={20} />}
              {restaurando ? "Restaurando..." : "Restaurar Backup Selecionado"}
            </button>
          </div>
        </section>
      </div>

      <section className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center">
            <CalendarClock size={24} />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">Backup Automático</h2>
            <p className="text-slate-500 mt-1">Configure o sistema para salvar backups sozinho na nuvem.</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-5">
          <label className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={configBackup?.backup_automatico || false}
              onChange={(e) =>
                setConfigBackup((atual) =>
                  atual
                    ? { ...atual, backup_automatico: e.target.checked }
                    : atual
                )
              }
              className="h-5 w-5 mt-1"
            />
            <div>
              <p className="font-black text-slate-900">Ativar automático</p>
              <p className="text-sm text-slate-500 mt-1">Quando ativo, o Vercel Cron chama a rotina de backup.</p>
            </div>
          </label>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">Frequência</label>
            <select
              value={configBackup?.frequencia || "diario"}
              onChange={(e) =>
                setConfigBackup((atual) =>
                  atual
                    ? { ...atual, frequencia: e.target.value as any }
                    : atual
                )
              }
              className="w-full border border-slate-300 rounded-2xl p-4 font-bold text-slate-900 bg-white"
            >
              <option value="diario">Diário</option>
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">Horário</label>
            <input
              type="time"
              value={configBackup?.horario || "02:00"}
              onChange={(e) =>
                setConfigBackup((atual) =>
                  atual ? { ...atual, horario: e.target.value } : atual
                )
              }
              className="w-full border border-slate-300 rounded-2xl p-4 font-bold text-slate-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">Manter últimos</label>
            <input
              type="number"
              min={5}
              max={365}
              value={configBackup?.manter_ultimos || 30}
              onChange={(e) =>
                setConfigBackup((atual) =>
                  atual
                    ? { ...atual, manter_ultimos: Number(e.target.value) }
                    : atual
                )
              }
              className="w-full border border-slate-300 rounded-2xl p-4 font-bold text-slate-900 bg-white"
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 text-blue-800 flex-1">
            <p className="font-black">Próximo backup:</p>
            <p className="text-sm mt-1">
              {configBackup?.backup_automatico && configBackup?.proximo_backup_em
                ? new Date(configBackup.proximo_backup_em).toLocaleString("pt-BR")
                : "Backup automático desativado."}
            </p>
          </div>

          <button
            onClick={salvarConfigBackup}
            disabled={salvandoConfig || !configBackup}
            className={`px-6 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 ${
              salvandoConfig || !configBackup
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {salvandoConfig ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
            {salvandoConfig ? "Salvando..." : "Salvar Automático"}
          </button>
        </div>
      </section>

      <section className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center">
              <History size={24} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">Histórico de Backups na Nuvem</h2>
              <p className="text-slate-500 mt-1">Últimos backups salvos para esta empresa.</p>
            </div>
          </div>

          <button onClick={carregarHistorico} disabled={carregandoHistorico} className="px-5 py-3 rounded-2xl font-black bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center justify-center gap-2">
            <RefreshCcw size={18} className={carregandoHistorico ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-blue-700 text-white">
              <tr>
                <th className="text-left p-4">Data</th>
                <th className="text-left p-4">Arquivo</th>
                <th className="text-left p-4">Usuário</th>
                <th className="text-left p-4">Registros</th>
                <th className="text-left p-4">Tamanho</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Ações</th>
              </tr>
            </thead>

            <tbody>
              {historico.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Nenhum backup salvo na nuvem ainda.</td>
                </tr>
              )}

              {historico.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4 font-semibold text-slate-700">{formatarData(item.created_at)}</td>
                  <td className="p-4">
                    <p className="font-black text-slate-900">{item.arquivo_nome}</p>
                    <p className="text-xs text-slate-500">{item.storage_path}</p>
                  </td>
                  <td className="p-4 text-slate-700 font-semibold">{item.usuario_nome || "-"}</td>
                  <td className="p-4 text-slate-700 font-semibold">{item.total_registros}</td>
                  <td className="p-4 text-slate-700 font-semibold">{formatarTamanho(item.tamanho_bytes)}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-sm font-black bg-green-100 text-green-700">{item.status}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => baixarHistorico(item)} className="px-4 py-2 rounded-xl font-black bg-blue-50 hover:bg-blue-100 text-blue-700">Baixar</button>
                      <button onClick={() => usarBackupDaNuvem(item)} className="px-4 py-2 rounded-xl font-black bg-purple-50 hover:bg-purple-100 text-purple-700">Usar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {status && (
        <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex items-start gap-3">
          <CheckCircle className="text-green-600 mt-1" size={24} />
          <div>
            <h3 className="font-black text-slate-900">Status da operação</h3>
            <p className="text-slate-600 mt-1">{status}</p>
          </div>
        </div>
      )}
    </div>
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

function MiniInfo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <p className="text-xs font-bold text-slate-500">{titulo}</p>
      <p className="text-slate-900 font-black mt-1 truncate">{valor}</p>
    </div>
  );
}
