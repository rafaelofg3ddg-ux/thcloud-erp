import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "../../../../lib/supabaseAdmin";

type Body = {
  empresa_id?: string;
  nome_admin?: string;
  email_admin?: string;
  usuario_admin?: string;
  senha_admin?: string;
};

function limparTexto(valor: unknown) {
  return String(valor || "").trim();
}

function gerarSenhaPadrao() {
  const numero = Math.floor(100000 + Math.random() * 900000);
  return `th${numero}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body;

    const empresaId = limparTexto(body.empresa_id);
    const nomeAdmin = limparTexto(body.nome_admin) || "Administrador";
    const emailAdmin = limparTexto(body.email_admin);
    const usuarioAdmin = limparTexto(body.usuario_admin) || emailAdmin;
    const senhaAdmin = limparTexto(body.senha_admin) || gerarSenhaPadrao();

    if (!empresaId) {
      return NextResponse.json(
        { ok: false, erro: "Empresa não informada." },
        { status: 400 }
      );
    }

    if (!usuarioAdmin) {
      return NextResponse.json(
        { ok: false, erro: "Informe o usuário ou e-mail do administrador." },
        { status: 400 }
      );
    }

    const { data: empresa, error: erroEmpresa } = await supabase
      .from("empresas")
      .select("id,nome_fantasia,razao_social,plano,valor_mensal,ativo")
      .eq("id", empresaId)
      .maybeSingle();

    if (erroEmpresa || !empresa) {
      return NextResponse.json(
        { ok: false, erro: erroEmpresa?.message || "Empresa não encontrada." },
        { status: 404 }
      );
    }

    const { data: usuarioExistente } = await supabase
      .from("usuarios")
      .select("id")
      .or(`usuario.eq.${usuarioAdmin},email.eq.${emailAdmin || usuarioAdmin}`)
      .maybeSingle();

    let idUsuarioAdmin: string;

    if (usuarioExistente?.id) {
      idUsuarioAdmin = usuarioExistente.id;
      await supabase
        .from("usuarios")
        .update({
          nome: nomeAdmin,
          email: emailAdmin || usuarioAdmin,
          usuario: usuarioAdmin,
          perfil: "Admin",
          empresa_id: empresaId,
          ativo: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", usuarioExistente.id);
    } else {
      const { data: novoUsuario, error: erroUsuario } = await supabase
        .from("usuarios")
        .insert([
          {
            nome: nomeAdmin,
            email: emailAdmin || usuarioAdmin,
            usuario: usuarioAdmin,
            perfil: "Admin",
            empresa_id: empresaId,
            ativo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select("id")
        .single();

      if (erroUsuario || !novoUsuario) {
        return NextResponse.json(
          { ok: false, erro: erroUsuario?.message || "Erro ao criar usuário." },
          { status: 500 }
        );
      }

      idUsuarioAdmin = novoUsuario.id;
    }

    const { error: erroSenha } = await supabase.rpc("definir_senha", {
      p_usuario_id: idUsuarioAdmin,
      p_senha_nova: senhaAdmin,
    });

    if (erroSenha) {
      return NextResponse.json(
        { ok: false, erro: erroSenha.message },
        { status: 500 }
      );
    }

    await supabase
      .from("empresas")
      .update({
        usuario_admin_nome: nomeAdmin,
        usuario_admin_email: emailAdmin || usuarioAdmin,
        usuario_admin_login: usuarioAdmin,
        provisionada: true,
        ativo: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", empresaId);

    await supabase.from("historico_empresas").insert([
      {
        empresa_id: empresaId,
        acao: "Provisionamento automático",
        descricao: `Usuário administrador criado/atualizado. Login: ${usuarioAdmin}.`,
        usuario: "Sistema THCloud",
      },
    ]);

    await supabase.from("notificacoes_saas").insert([
      {
        tipo: "provisionamento",
        titulo: "Empresa provisionada",
        descricao: `Empresa ${empresa.nome_fantasia || empresa.razao_social || "sem nome"} provisionada com usuário administrador.`,
        empresa_id: empresaId,
        lida: false,
      },
    ]);

    return NextResponse.json({
      ok: true,
      mensagem: "Empresa provisionada com sucesso.",
      login: usuarioAdmin,
      senha: senhaAdmin,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        erro: error?.message || "Erro ao provisionar empresa.",
      },
      { status: 500 }
    );
  }
}
