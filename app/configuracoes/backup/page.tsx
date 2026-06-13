"use client";

import { useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { getEmpresaId } from "../../../lib/empresa";
import {
  AlertTriangle,
  CheckCircle,
  DatabaseBackup,
  Download,
  FileJson,
  RefreshCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import {
  baixarBackupJson,
  gerarBackupEmpresa,
  lerArquivoJson,
  restaurarBackupEmpresa,
  resumoBackup,
  type BackupCompleto,
} from "../../../lib/backup";

type EmpresaLocal = {
  nome: string;
  documento: string;
};

export default function BackupPage() {
  const [gerando, setGerando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [status, setStatus] = useState("");
  const [backupGerado, setBackupGerado] = useState<BackupCompleto | null>(null);
  const [backupSelecionado, setBackupSelecionado] = useState<BackupCompleto | null>(null);
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
      const usuario = JSON.parse(localStorage.getItem("th_usuario") || "{}");
      const empresa = JSON.parse(localStorage.getItem("th_empresa") || "{}");

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
      };
    } catch {
      return {
        nome: "Empresa",
        documento: "",
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

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-8 shadow-lg mb-8 text-white">
        <p className="text-blue-100 font-bold">THCloud ERP</p>

        <h1 className="text-4xl font-black mt-2">
          Backup e Restauração
        </h1>

        <p className="text-blue-100 mt-2 max-w-4xl">
          Gere uma cópia dos dados da empresa, baixe o arquivo no computador e restaure quando necessário.
        </p>

        <p className="text-blue-50 mt-4 font-bold">
          Empresa atual: {empresa.nome}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <Resumo
          titulo="Tipo"
          valor="JSON"
          detalhe="Arquivo portátil"
          icone={<FileJson size={24} />}
          cor="text-blue-700"
        />

        <Resumo
          titulo="Segurança"
          valor="Empresa"
          detalhe="Apenas dados logados"
          icone={<ShieldCheck size={24} />}
          cor="text-green-700"
        />

        <Resumo
          titulo="Restauração"
          valor="Manual"
          detalhe="Cliente escolhe arquivo"
          icone={<Upload size={24} />}
          cor="text-purple-700"
        />

        <Resumo
          titulo="Status"
          valor={status ? "Ativo" : "Pronto"}
          detalhe={status || "Aguardando ação"}
          icone={<DatabaseBackup size={24} />}
          cor="text-orange-700"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Download size={24} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Gerar Backup
              </h2>
              <p className="text-slate-500 mt-1">
                Baixe um arquivo com os dados principais da empresa.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5">
              <h3 className="font-black text-blue-900">
                O backup inclui:
              </h3>
              <p className="text-blue-700 mt-2">
                Empresa, usuários, clientes, produtos, grupos, fornecedores, vendas, itens de venda, caixas, financeiro, configurações, orçamentos e modelos de etiquetas.
              </p>
            </div>

            {resumoGerado && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <MiniInfo titulo="Tabelas" valor={`${resumoGerado.tabelas}`} />
                <MiniInfo titulo="Com dados" valor={`${resumoGerado.tabelasComDados}`} />
                <MiniInfo titulo="Registros" valor={`${resumoGerado.totalRegistros}`} />
              </div>
            )}

            <button
              onClick={gerarBackupAgora}
              disabled={gerando}
              className={`w-full px-6 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 ${
                gerando
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-blue-700 hover:bg-blue-800"
              }`}
            >
              {gerando ? <RefreshCcw className="animate-spin" size={20} /> : <Download size={20} />}
              {gerando ? "Gerando backup..." : "Gerar e Baixar Backup Agora"}
            </button>

            {backupGerado && (
              <button
                onClick={() => baixarBackupJson(backupGerado, empresa.nome)}
                className="w-full px-6 py-4 rounded-2xl font-black bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center justify-center gap-2"
              >
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
              <h2 className="text-2xl font-black text-slate-900">
                Restaurar Backup
              </h2>
              <p className="text-slate-500 mt-1">
                Selecione um arquivo de backup salvo anteriormente.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-700 mt-1" size={24} />
                <div>
                  <h3 className="font-black text-yellow-900">
                    Atenção
                  </h3>
                  <p className="text-yellow-800 mt-1">
                    Restaurar backup altera os dados da empresa atual. Faça um backup novo antes de restaurar qualquer arquivo antigo.
                  </p>
                </div>
              </div>
            </div>

            <label className="block">
              <span className="block text-sm font-black text-slate-700 mb-2">
                Arquivo de backup (.json)
              </span>

              <input
                type="file"
                accept="application/json,.json"
                onChange={(e) => selecionarArquivo(e.target.files?.[0] || null)}
                className="w-full border border-slate-300 rounded-2xl p-4 text-slate-900 font-bold bg-white"
              />
            </label>

            {resumoSelecionado && backupSelecionado && (
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5">
                <h3 className="font-black text-slate-900 mb-3">
                  Backup selecionado
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <MiniInfo titulo="Empresa do backup" valor={backupSelecionado.empresa_nome || "-"} />
                  <MiniInfo titulo="Gerado em" valor={new Date(backupSelecionado.gerado_em).toLocaleString("pt-BR")} />
                  <MiniInfo titulo="Tabelas" valor={`${resumoSelecionado.tabelas}`} />
                  <MiniInfo titulo="Registros" valor={`${resumoSelecionado.totalRegistros}`} />
                </div>
              </div>
            )}

            <label className="border border-red-200 bg-red-50 rounded-3xl p-5 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={substituirDadosAtuais}
                onChange={(e) => setSubstituirDadosAtuais(e.target.checked)}
                className="h-5 w-5 mt-1"
              />

              <div>
                <p className="font-black text-red-900">
                  Substituir dados atuais antes de restaurar
                </p>
                <p className="text-red-700 text-sm mt-1">
                  Use esta opção apenas quando quiser voltar exatamente ao estado do backup.
                </p>
              </div>
            </label>

            <button
              onClick={restaurarBackup}
              disabled={restaurando || !backupSelecionado}
              className={`w-full px-6 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 ${
                restaurando || !backupSelecionado
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-purple-700 hover:bg-purple-800"
              }`}
            >
              {restaurando ? <RefreshCcw className="animate-spin" size={20} /> : <Upload size={20} />}
              {restaurando ? "Restaurando..." : "Restaurar Backup Selecionado"}
            </button>
          </div>
        </section>
      </div>

      {status && (
        <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex items-start gap-3">
          <CheckCircle className="text-green-600 mt-1" size={24} />

          <div>
            <h3 className="font-black text-slate-900">
              Status da operação
            </h3>
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
