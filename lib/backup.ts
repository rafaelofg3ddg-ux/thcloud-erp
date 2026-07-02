"use client";

export type BackupTabela = {
  tabela: string;
  registros: any[];
  erro?: string | null;
};

export type BackupCompleto = {
  sistema: "Th Cloud";
  tipo: "backup_empresa";
  versao: "1.2";
  empresa_id: string;
  empresa_nome?: string;
  usuario_id?: string | null;
  usuario_nome?: string | null;
  gerado_em: string;
  tabelas: BackupTabela[];
};

export type BackupResumo = {
  tabelas: number;
  tabelasComDados: number;
  totalRegistros: number;
  tabelasComErro: number;
};

export type BackupConfiguracao = {
  id?: string;
  empresa_id: string;
  empresa_nome?: string | null;
  backup_automatico: boolean;
  frequencia: "diario" | "semanal" | "mensal";
  horario: string;
  manter_ultimos: number;
  ultimo_backup_em?: string | null;
  proximo_backup_em?: string | null;
  ativo?: boolean;
};

export const TABELAS_BACKUP = [
  "empresas",
  "usuarios",
  "categorias",
  "produtos",
  "fornecedores",
  "clientes",
  "caixas",
  "vendas",
  "itens_venda",
  "movimentacoes_estoque",
  "contas_receber",
  "contas_pagar",
  "configuracoes_gerais",
  "modelos_etiquetas",
  "orcamentos",
  "itens_orcamento",
  "backup_configuracoes",
  "backup_historico",
];

export const ORDEM_RESTAURACAO = [
  "empresas",
  "usuarios",
  "categorias",
  "fornecedores",
  "clientes",
  "produtos",
  "caixas",
  "vendas",
  "itens_venda",
  "movimentacoes_estoque",
  "contas_receber",
  "contas_pagar",
  "configuracoes_gerais",
  "modelos_etiquetas",
  "orcamentos",
  "itens_orcamento",
  "backup_configuracoes",
];

export const ORDEM_LIMPEZA = [...ORDEM_RESTAURACAO].reverse();

export function nomeArquivoBackup(empresaNome: string) {
  const dataTexto = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  const nomeLimpo = String(empresaNome || "empresa")
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `backup-thcloud-${nomeLimpo}-${dataTexto}.json`;
}

export function gerarConteudoBackup(backup: BackupCompleto) {
  return JSON.stringify(backup, null, 2);
}

export function calcularTamanhoBytes(conteudo: string) {
  return new Blob([conteudo]).size;
}

export function baixarBackupJson(backup: BackupCompleto, empresaNome: string) {
  const conteudo = gerarConteudoBackup(backup);
  const blob = new Blob([conteudo], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivoBackup(empresaNome);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function lerArquivoJson(file: File): Promise<BackupCompleto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const conteudo = String(reader.result || "");
        const json = JSON.parse(conteudo);

        if (json?.sistema !== "Th Cloud" || json?.tipo !== "backup_empresa") {
          reject(new Error("Arquivo inválido. Selecione um backup gerado pelo Th Cloud."));
          return;
        }

        resolve(json as BackupCompleto);
      } catch {
        reject(new Error("Não foi possível ler o arquivo. Verifique se é um JSON de backup válido."));
      }
    };

    reader.onerror = () => reject(new Error("Erro ao ler arquivo."));
    reader.readAsText(file, "utf-8");
  });
}

export async function gerarBackupEmpresa({
  supabase,
  empresaId,
  empresaNome,
  usuarioId,
  usuarioNome,
}: {
  supabase: any;
  empresaId: string;
  empresaNome?: string;
  usuarioId?: string | null;
  usuarioNome?: string | null;
}): Promise<BackupCompleto> {
  const tabelas: BackupTabela[] = [];

  for (const tabela of TABELAS_BACKUP) {
    try {
      let query = supabase.from(tabela).select("*");

      if (tabela === "empresas") {
        query = query.eq("id", empresaId);
      } else {
        query = query.eq("empresa_id", empresaId);
      }

      const { data, error } = await query;

      if (error) {
        tabelas.push({
          tabela,
          registros: [],
          erro: error.message,
        });
      } else {
        tabelas.push({
          tabela,
          registros: data || [],
          erro: null,
        });
      }
    } catch (error: any) {
      tabelas.push({
        tabela,
        registros: [],
        erro: error?.message || "Erro desconhecido",
      });
    }
  }

  return {
    sistema: "Th Cloud",
    tipo: "backup_empresa",
    versao: "1.2",
    empresa_id: empresaId,
    empresa_nome: empresaNome || "Empresa",
    usuario_id: usuarioId || null,
    usuario_nome: usuarioNome || null,
    gerado_em: new Date().toISOString(),
    tabelas,
  };
}

export function resumoBackup(backup: BackupCompleto): BackupResumo {
  const tabelasComDados = backup.tabelas.filter((t) => t.registros.length > 0);
  const totalRegistros = backup.tabelas.reduce(
    (total, tabela) => total + tabela.registros.length,
    0
  );
  const tabelasComErro = backup.tabelas.filter((t) => t.erro);

  return {
    tabelas: backup.tabelas.length,
    tabelasComDados: tabelasComDados.length,
    totalRegistros,
    tabelasComErro: tabelasComErro.length,
  };
}

export async function salvarBackupNoStorage({
  supabase,
  backup,
  empresaNome,
  automatico = false,
  tipoBackup = "manual",
}: {
  supabase: any;
  backup: BackupCompleto;
  empresaNome: string;
  automatico?: boolean;
  tipoBackup?: "manual" | "automatico";
}) {
  const arquivoNome = nomeArquivoBackup(empresaNome);
  const conteudo = gerarConteudoBackup(backup);
  const blob = new Blob([conteudo], { type: "application/json;charset=utf-8" });
  const storagePath = `${backup.empresa_id}/${arquivoNome}`;
  const resumo = resumoBackup(backup);

  const upload = await supabase.storage
    .from("backups")
    .upload(storagePath, blob, {
      contentType: "application/json",
      upsert: true,
    });

  if (upload.error) {
    throw new Error("Erro ao salvar backup na nuvem: " + upload.error.message);
  }

  const insert = await supabase.from("backup_historico").insert({
    empresa_id: backup.empresa_id,
    usuario_id: backup.usuario_id || null,
    usuario_nome: backup.usuario_nome || null,
    empresa_nome: backup.empresa_nome || empresaNome,
    arquivo_nome: arquivoNome,
    storage_bucket: "backups",
    storage_path: storagePath,
    tamanho_bytes: calcularTamanhoBytes(conteudo),
    total_tabelas: resumo.tabelas,
    tabelas_com_dados: resumo.tabelasComDados,
    total_registros: resumo.totalRegistros,
    tabelas_com_erro: resumo.tabelasComErro,
    status: "gerado",
    tipo_backup: tipoBackup,
    automatico,
    observacao:
      resumo.tabelasComErro > 0
        ? "Backup gerado com algumas tabelas ignoradas."
        : automatico
        ? "Backup automático gerado com sucesso."
        : "Backup gerado com sucesso.",
  });

  if (insert.error) {
    throw new Error("Backup salvo, mas erro ao registrar histórico: " + insert.error.message);
  }

  return {
    arquivoNome,
    storagePath,
    tamanhoBytes: calcularTamanhoBytes(conteudo),
    resumo,
  };
}

export async function listarHistoricoBackups({
  supabase,
  empresaId,
}: {
  supabase: any;
  empresaId: string;
}) {
  const { data, error } = await supabase
    .from("backup_historico")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error("Erro ao carregar histórico: " + error.message);
  }

  return data || [];
}

export async function baixarBackupDaNuvem({
  supabase,
  storagePath,
}: {
  supabase: any;
  storagePath: string;
}) {
  const { data, error } = await supabase.storage
    .from("backups")
    .download(storagePath);

  if (error) {
    throw new Error("Erro ao baixar backup da nuvem: " + error.message);
  }

  const texto = await data.text();
  const backup = JSON.parse(texto) as BackupCompleto;

  if (backup?.sistema !== "Th Cloud" || backup?.tipo !== "backup_empresa") {
    throw new Error("Arquivo da nuvem inválido.");
  }

  return backup;
}


export async function carregarConfiguracaoBackup({
  supabase,
  empresaId,
  empresaNome,
}: {
  supabase: any;
  empresaId: string;
  empresaNome: string;
}): Promise<BackupConfiguracao> {
  const { data, error } = await supabase
    .from("backup_configuracoes")
    .select("*")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (error) {
    throw new Error("Erro ao carregar configuração de backup: " + error.message);
  }

  if (data) return data as BackupConfiguracao;

  const padrao: BackupConfiguracao = {
    empresa_id: empresaId,
    empresa_nome: empresaNome,
    backup_automatico: false,
    frequencia: "diario",
    horario: "02:00",
    manter_ultimos: 30,
    ativo: true,
  };

  const insert = await supabase
    .from("backup_configuracoes")
    .insert(padrao)
    .select("*")
    .single();

  if (insert.error) {
    throw new Error("Erro ao criar configuração de backup: " + insert.error.message);
  }

  return insert.data as BackupConfiguracao;
}

export function calcularProximoBackup({
  frequencia,
  horario,
}: {
  frequencia: "diario" | "semanal" | "mensal";
  horario: string;
}) {
  const agora = new Date();
  const [horaTexto, minutoTexto] = String(horario || "02:00").split(":");
  const hora = Number(horaTexto || 2);
  const minuto = Number(minutoTexto || 0);

  const proximo = new Date(agora);
  proximo.setHours(hora, minuto, 0, 0);

  if (proximo <= agora) {
    if (frequencia === "diario") {
      proximo.setDate(proximo.getDate() + 1);
    } else if (frequencia === "semanal") {
      proximo.setDate(proximo.getDate() + 7);
    } else {
      proximo.setMonth(proximo.getMonth() + 1);
    }
  }

  return proximo.toISOString();
}

export async function salvarConfiguracaoBackup({
  supabase,
  configuracao,
}: {
  supabase: any;
  configuracao: BackupConfiguracao;
}) {
  const proximo_backup_em = configuracao.backup_automatico
    ? calcularProximoBackup({
        frequencia: configuracao.frequencia,
        horario: configuracao.horario,
      })
    : null;

  const payload = {
    empresa_id: configuracao.empresa_id,
    empresa_nome: configuracao.empresa_nome,
    backup_automatico: configuracao.backup_automatico,
    frequencia: configuracao.frequencia,
    horario: configuracao.horario,
    manter_ultimos: Number(configuracao.manter_ultimos || 30),
    proximo_backup_em,
    ativo: true,
  };

  const { data, error } = await supabase
    .from("backup_configuracoes")
    .upsert(payload, { onConflict: "empresa_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error("Erro ao salvar configuração de backup: " + error.message);
  }

  return data as BackupConfiguracao;
}

function prepararRegistrosParaRestaurar(
  tabela: string,
  registros: any[],
  empresaIdAtual: string
) {
  return registros.map((registro) => {
    const novo = { ...registro };

    if (tabela === "empresas") {
      novo.id = empresaIdAtual;
    } else {
      novo.empresa_id = empresaIdAtual;
    }

    return novo;
  });
}

export async function restaurarBackupEmpresa({
  supabase,
  empresaId,
  backup,
  substituirDadosAtuais,
  onStatus,
}: {
  supabase: any;
  empresaId: string;
  backup: BackupCompleto;
  substituirDadosAtuais: boolean;
  onStatus?: (mensagem: string) => void;
}) {
  if (!backup || backup.tipo !== "backup_empresa") {
    throw new Error("Backup inválido.");
  }

  if (substituirDadosAtuais) {
    for (const tabela of ORDEM_LIMPEZA) {
      if (tabela === "empresas") continue;

      onStatus?.(`Limpando ${tabela}...`);

      try {
        const { error } = await supabase
          .from(tabela)
          .delete()
          .eq("empresa_id", empresaId);

        if (error) {
          console.warn(`Não foi possível limpar ${tabela}:`, error.message);
        }
      } catch (error) {
        console.warn(`Tabela ${tabela} ignorada na limpeza.`, error);
      }
    }
  }

  for (const tabela of ORDEM_RESTAURACAO) {
    const dadosTabela = backup.tabelas.find((item) => item.tabela === tabela);

    if (!dadosTabela || dadosTabela.registros.length === 0) continue;

    onStatus?.(`Restaurando ${tabela}...`);

    const registros = prepararRegistrosParaRestaurar(
      tabela,
      dadosTabela.registros,
      empresaId
    );

    try {
      const { error } = await supabase
        .from(tabela)
        .upsert(registros, { onConflict: "id" });

      if (error) {
        console.warn(`Erro ao restaurar ${tabela}:`, error.message);
      }
    } catch (error) {
      console.warn(`Tabela ${tabela} ignorada na restauração.`, error);
    }
  }
}
