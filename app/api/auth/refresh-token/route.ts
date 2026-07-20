import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";

// Renova o token de sessão para quem já estava logado antes dessa
// funcionalidade existir (ou cujo token expirou). Não pede senha de
// novo: usa o usuario_id que já estava guardado na sessão do
// navegador (estabelecido em um login legítimo anterior) e busca a
// empresa atual direto no banco - nunca confia no que o cliente
// manda além do id.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export async function POST(request: NextRequest) {
  let body: { usuario_id?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ token: null, error: "Requisição inválida." }, { status: 400 });
  }

  const usuarioId = String(body.usuario_id || "").trim();

  if (!usuarioId) {
    return NextResponse.json({ token: null, error: "usuario_id obrigatório." }, { status: 400 });
  }

  const supabaseServidor = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabaseServidor.rpc("obter_usuario_para_refresh_token", {
    p_usuario_id: usuarioId,
  });

  if (error) {
    return NextResponse.json({ token: null, error: error.message }, { status: 400 });
  }

  const usuario = data && data[0] ? data[0] : null;

  if (!usuario || usuario.ativo === false) {
    return NextResponse.json({ token: null, error: "Usuário não encontrado ou inativo." }, { status: 401 });
  }

  const segredo = process.env.SUPABASE_JWT_SECRET;

  if (!segredo) {
    return NextResponse.json({ token: null, error: null });
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

    return NextResponse.json({ token: jwt, error: null });
  } catch (erroAssinatura) {
    console.error("Falha ao renovar token de sessão:", erroAssinatura);
    return NextResponse.json({ token: null, error: null });
  }
}
