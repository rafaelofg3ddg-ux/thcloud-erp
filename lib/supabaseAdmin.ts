import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para uso EXCLUSIVO em rotas de servidor (app/api/**),
 * usando a "secret key" (equivalente ao service_role): ignora o RLS por
 * design, pois é usado por automações internas (verificação de assinatura,
 * cobrança, provisionamento de empresa) que precisam enxergar todas as
 * empresas, não apenas uma.
 *
 * NUNCA importar este arquivo em código que roda no navegador.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
