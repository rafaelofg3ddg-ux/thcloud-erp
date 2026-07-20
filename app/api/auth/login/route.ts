import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";

// Rota server-side de login.
//
// Faz exatamente a mesma verificação que já era feita no navegador
// (chama a RPC verificar_login, que confere usuário/senha no banco),
// só que agora a partir do servidor. Isso permite, quando o usuário
// e senha estiverem corretos, assinar um token (JWT) contendo a
// empresa do usuário — token esse que no futuro será usado para
// ativar o RLS (Row Level Security) tabela por tabela.
//
// Importante: enquanto a variável de ambiente SUPABASE_JWT_SECRET
// não estiver configurada, essa rota simplesmente não gera token
// (token vem como null) e o login continua funcionando de forma
// idêntica a antes. Nenhuma tabela depende desse token ainda.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export async function POST(request: NextRequest) {
  let body: { login?: string; senha?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ usuarios: null, token: null, error: "Requisição inválida." }, { status: 400 });
  }

  const login = String(body.login || "").trim().toLowerCase();
  const senha = String(body.senha || "");

  if (!login || !senha) {
    return NextResponse.json({ usuarios: null, token: null, error: "Informe usuário/e-mail e senha." }, { status: 400 });
  }

  const supabaseServidor = createClient(supabaseUrl, supabaseAnonKey);

  const { data: usuarios, error } = await supabaseServidor.rpc("verificar_login", {
    p_login: login,
    p_senha: senha,
  });

  if (error) {
    return NextResponse.json({ usuarios: null, token: null, error: error.message }, { status: 400 });
  }

  const usuario = usuarios && usuarios[0] ? usuarios[0] : null;

  let token: string | null = null;

  if (usuario && usuario.ativo !== false) {
    token = await assinarToken(usuario);
  }

  return NextResponse.json({ usuarios, token, error: null });
}

async function assinarToken(usuario: { id: string; empresa_id: string | null; perfil?: string | null }) {
  const segredo = process.env.SUPABASE_JWT_SECRET;

  // Sem o segredo configurado (ainda não copiado do painel do Supabase),
  // não assinamos nada. O login segue funcionando normalmente sem token.
  if (!segredo) {
    return null;
  }

  try {
    const chave = new TextEncoder().encode(segredo);

    const jwt = await new SignJWT({
      role: "authenticated",
      empresa_id: usuario.empresa_id,
      perfil: usuario.perfil || null,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(usuario.id)
      .setAudience("authenticated")
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(chave);

    return jwt;
  } catch (erroAssinatura) {
    console.error("Falha ao assinar token de sessão:", erroAssinatura);
    return null;
  }
}
