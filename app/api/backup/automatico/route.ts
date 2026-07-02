import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BackupTabela = {
  tabela: string;
  registros: any[];
  erro?: string | null;
};

const TABELAS_BACKUP = [
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

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente."
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function nomeArquivoBackup(empresaNome: string) {
  const dataTexto = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

  const nomeLimpo = String(empresaNome || "empresa")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `backup-thcloud-${nomeLimpo}-${dataTexto}.json`;
}

function resumoBackup(tabelas: BackupTabela[]) {
  const tabelasComDados = tabelas.filter((t) => t.registros.length > 0);
  const totalRegistros = tabelas.reduce(
    (total, tabela) => total + tabela.registros.length,
    0
  );
  const tabelasComErro = tabelas.filter((t) => t.erro);

  return {
    tabelas: tabelas.length,
    tabelasComDados: tabelasComDados.length,
    totalRegistros,
    tabelasComErro: tabelasComErro.length,
  };
}

function calcularProximoBackup({
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

async function gerarBackupEmpresa({
  supabase,
  empresaId,
  empresaNome,
}: {
  supabase: any;
  empresaId: string;
  empresaNome: string;
}) {
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
        tabelas.push({ tabela, registros: [], erro: error.message });
      } else {
        tabelas.push({ tabela, registros: data || [], erro: null });
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
    empresa_nome: empresaNome,
    usuario_id: null,
    usuario_nome: "Backup Automático",
    gerado_em: new Date().toISOString(),
    tabelas,
  };
}

async function salvarBackup({
  supabase,
  backup,
  empresaNome,
}: {
  supabase: any;
  backup: any;
  empresaNome: string;
}) {
  const arquivoNome = nomeArquivoBackup(empresaNome);
  const conteudo = JSON.stringify(backup, null, 2);
  const resumo = resumoBackup(backup.tabelas);
  const storagePath = `${backup.empresa_id}/${arquivoNome}`;

  const upload = await supabase.storage
    .from("backups")
    .upload(storagePath, conteudo, {
      contentType: "application/json",
      upsert: true,
    });

  if (upload.error) {
    throw new Error(upload.error.message);
  }

  const insert = await supabase.from("backup_historico").insert({
    empresa_id: backup.empresa_id,
    usuario_id: null,
    usuario_nome: "Backup Automático",
    empresa_nome: empresaNome,
    arquivo_nome: arquivoNome,
    storage_bucket: "backups",
    storage_path: storagePath,
    tamanho_bytes: Buffer.byteLength(conteudo, "utf8"),
    total_tabelas: resumo.tabelas,
    tabelas_com_dados: resumo.tabelasComDados,
    total_registros: resumo.totalRegistros,
    tabelas_com_erro: resumo.tabelasComErro,
    status: "gerado",
    tipo_backup: "automatico",
    automatico: true,
    observacao:
      resumo.tabelasComErro > 0
        ? "Backup automático gerado com algumas tabelas ignoradas."
        : "Backup automático gerado com sucesso.",
  });

  if (insert.error) {
    throw new Error(insert.error.message);
  }

  return { arquivoNome, storagePath, resumo };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const tokenEnv = process.env.BACKUP_CRON_SECRET;

    if (tokenEnv && token !== tokenEnv) {
      return NextResponse.json(
        { ok: false, erro: "Token inválido." },
        { status: 401 }
      );
    }

    const supabase = supabaseAdmin();
    const agora = new Date().toISOString();

    const { data: configuracoes, error } = await supabase
      .from("backup_configuracoes")
      .select("*")
      .eq("backup_automatico", true)
      .eq("ativo", true)
      .or(`proximo_backup_em.is.null,proximo_backup_em.lte.${agora}`);

    if (error) throw new Error(error.message);

    const resultados: any[] = [];

    for (const config of configuracoes || []) {
      try {
        const empresaNome = config.empresa_nome || "Empresa";

        const backup = await gerarBackupEmpresa({
          supabase,
          empresaId: config.empresa_id,
          empresaNome,
        });

        const salvo = await salvarBackup({
          supabase,
          backup,
          empresaNome,
        });

        const proximo = calcularProximoBackup({
          frequencia: config.frequencia,
          horario: config.horario,
        });

        await supabase
          .from("backup_configuracoes")
          .update({
            ultimo_backup_em: new Date().toISOString(),
            proximo_backup_em: proximo,
          })
          .eq("empresa_id", config.empresa_id);

        resultados.push({
          empresa_id: config.empresa_id,
          empresa_nome: empresaNome,
          ok: true,
          arquivo: salvo.arquivoNome,
          registros: salvo.resumo.totalRegistros,
          proximo_backup_em: proximo,
        });
      } catch (error: any) {
        resultados.push({
          empresa_id: config.empresa_id,
          empresa_nome: config.empresa_nome,
          ok: false,
          erro: error?.message || "Erro desconhecido",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      executado_em: new Date().toISOString(),
      total_empresas: resultados.length,
      resultados,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        erro: error?.message || "Erro ao executar backup automático.",
      },
      { status: 500 }
    );
  }
}
