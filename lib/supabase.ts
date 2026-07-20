import { createClient } from "@supabase/supabase-js";
import { getTokenSessao, getUsuarioSessao, salvarTokenSessao } from "./sessao";

// Promise compartilhada para evitar disparar várias renovações de
// token ao mesmo tempo quando várias consultas acontecem juntas.
let renovacaoEmAndamento: Promise<string | null> | null = null;

function tokenParecValido(token: string | null | undefined): token is string {
  return typeof token === "string" && token.split(".").length === 3;
}

async function renovarToken(): Promise<string | null> {
  const usuario = getUsuarioSessao();

  if (!usuario?.id) return null;

  try {
    const resposta = await fetch("/api/auth/refresh-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario_id: usuario.id }),
    });

    const { token } = await resposta.json();

    if (tokenParecValido(token)) {
      salvarTokenSessao(token);
      return token;
    }
  } catch {
    // Sem internet, servidor fora do ar, etc. Não é crítico:
    // simplesmente seguimos sem token (comportamento de hoje).
  }

  return null;
}

// accessToken é chamado pelo supabase-js antes de cada requisição.
// Se não houver token válido, o cliente segue exatamente como hoje
// (só com a chave pública) - nada muda pra quem não tem token ainda.
async function accessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const tokenAtual = getTokenSessao();

  if (tokenParecValido(tokenAtual)) {
    return tokenAtual;
  }

  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = renovarToken().finally(() => {
      renovacaoEmAndamento = null;
    });
  }

  const tokenRenovado = await renovacaoEmAndamento;
  return tokenRenovado || null;
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    accessToken,
  }
);
