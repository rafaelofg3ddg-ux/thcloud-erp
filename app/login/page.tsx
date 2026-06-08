"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import {
  ArrowRight,
  CheckCircle,
  Cloud,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Rocket,
  Shield,
  ShieldCheck,
} from "lucide-react";

type UsuarioEmpresa = {
  id: string;
  empresa_id: string | null;
  nome: string;
  email: string;
  senha: string | null;
  perfil: string;
  ativo: boolean | null;
  trocar_senha?: boolean | null;
};

type SuperAdmin = {
  id: string;
  nome: string;
  email: string;
  senha: string;
  ativo: boolean | null;
};

type Empresa = {
  id: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  cnpj: string | null;
  ativo: boolean | null;
  plano: string | null;
  valor_mensal: number | null;
  status_assinatura: string | null;
  data_inicio_assinatura: string | null;
  data_vencimento_assinatura: string | null;
  limite_usuarios: number | null;
  limite_produtos: number | null;
  modulo_fiscal?: boolean | null;
  modulo_whatsapp?: boolean | null;
  modulo_crm?: boolean | null;
  modulo_delivery?: boolean | null;
  modulo_multiloja?: boolean | null;
  modulo_relatorios_premium?: boolean | null;
};

export default function LoginPage() {
  const router = useRouter();

  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  function hojeISO() {
    return new Date().toISOString().split("T")[0];
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  function assinaturaVencida(vencimento: string | null) {
    if (!vencimento) return false;
    return vencimento < hojeISO();
  }

  async function buscarSuperAdmin(loginLimpo: string) {
    const consultaEmail = await supabase
      .from("super_admins")
      .select("id,nome,email,senha,ativo")
      .eq("email", loginLimpo)
      .eq("senha", senha)
      .maybeSingle();

    if (consultaEmail.error) {
      throw new Error(consultaEmail.error.message);
    }

    if (consultaEmail.data) {
      return consultaEmail.data as SuperAdmin;
    }

    const consultaNome = await supabase
      .from("super_admins")
      .select("id,nome,email,senha,ativo")
      .ilike("nome", loginLimpo)
      .eq("senha", senha)
      .maybeSingle();

    if (consultaNome.error) {
      throw new Error(consultaNome.error.message);
    }

    return consultaNome.data as SuperAdmin | null;
  }

  async function buscarUsuarioEmpresa(loginLimpo: string) {
    const consultaEmail = await supabase
      .from("usuarios")
      .select("id,empresa_id,nome,email,senha,perfil,ativo,trocar_senha")
      .eq("email", loginLimpo)
      .eq("senha", senha)
      .maybeSingle();

    if (consultaEmail.error) {
      throw new Error(consultaEmail.error.message);
    }

    if (consultaEmail.data) {
      return consultaEmail.data as UsuarioEmpresa;
    }

    const consultaNome = await supabase
      .from("usuarios")
      .select("id,empresa_id,nome,email,senha,perfil,ativo,trocar_senha")
      .ilike("nome", loginLimpo)
      .eq("senha", senha)
      .maybeSingle();

    if (consultaNome.error) {
      throw new Error(consultaNome.error.message);
    }

    return consultaNome.data as UsuarioEmpresa | null;
  }

  async function buscarEmpresa(empresaId: string | null) {
    if (!empresaId) return null;

    const { data, error } = await supabase
      .from("empresas")
      .select(
        "id,razao_social,nome_fantasia,cnpj,ativo,plano,valor_mensal,status_assinatura,data_inicio_assinatura,data_vencimento_assinatura,limite_usuarios,limite_produtos,modulo_fiscal,modulo_whatsapp,modulo_crm,modulo_delivery,modulo_multiloja,modulo_relatorios_premium"
      )
      .eq("id", empresaId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data as Empresa | null;
  }

  async function atualizarUltimoAcessoUsuario(usuarioId: string) {
    await supabase
      .from("usuarios")
      .update({
        ultimo_acesso: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", usuarioId);
  }

  async function atualizarUltimoAcessoSuperAdmin(superAdminId: string) {
    await supabase
      .from("super_admins")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", superAdminId);
  }

  async function entrar() {
    if (!login.trim() || !senha.trim()) {
      alert("Informe e-mail/usuário e senha.");
      return;
    }

    setCarregando(true);

    try {
      const loginLimpo = login.trim().toLowerCase();

      const superAdmin = await buscarSuperAdmin(loginLimpo);

      if (superAdmin) {
        if (superAdmin.ativo === false) {
          alert("Super Admin inativo.");
          setCarregando(false);
          return;
        }

        localStorage.setItem(
          "th_usuario",
          JSON.stringify({
            id: superAdmin.id,
            empresa_id: null,
            nome: superAdmin.nome,
            email: superAdmin.email,
            perfil: "Super Admin",
            empresa_nome: "THCloud",
            plano: "Administração SaaS",
            status_assinatura: "Liberado",
            data_vencimento_assinatura: null,
            tipo_acesso: "super_admin",
          })
        );

        await atualizarUltimoAcessoSuperAdmin(superAdmin.id);

        router.push("/admin");
        setCarregando(false);
        return;
      }

      const usuario = await buscarUsuarioEmpresa(loginLimpo);

      if (!usuario) {
        alert("Usuário ou senha inválidos.");
        setCarregando(false);
        return;
      }

      if (usuario.ativo === false) {
        alert("Este usuário está inativo. Fale com o administrador.");
        setCarregando(false);
        return;
      }

      if (!usuario.empresa_id) {
        alert("Usuário sem empresa vinculada. Verifique o cadastro do usuário.");
        setCarregando(false);
        return;
      }

      const empresa = await buscarEmpresa(usuario.empresa_id);

      if (!empresa) {
        alert("Empresa não encontrada. Verifique o cadastro da empresa.");
        setCarregando(false);
        return;
      }

      if (empresa.ativo === false) {
        alert("Empresa bloqueada. Entre em contato com o suporte THCloud.");
        setCarregando(false);
        return;
      }

      if (
        empresa.status_assinatura === "Bloqueado" ||
        empresa.status_assinatura === "Cancelado" ||
        empresa.status_assinatura === "Suspenso"
      ) {
        alert(
          `Acesso bloqueado. Status da assinatura: ${empresa.status_assinatura}. Entre em contato com o suporte THCloud.`
        );
        setCarregando(false);
        return;
      }

      if (
        empresa.status_assinatura === "Vencido" ||
        assinaturaVencida(empresa.data_vencimento_assinatura)
      ) {
        await supabase
          .from("empresas")
          .update({
            ativo: false,
            status_assinatura: "Vencido",
            updated_at: new Date().toISOString(),
          })
          .eq("id", empresa.id);

        alert(
          `Assinatura vencida em ${formatarData(
            empresa.data_vencimento_assinatura
          )}. Entre em contato com o suporte THCloud.`
        );

        setCarregando(false);
        return;
      }

      localStorage.setItem(
        "th_usuario",
        JSON.stringify({
          id: usuario.id,
          empresa_id: usuario.empresa_id,
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          empresa_nome: empresa.nome_fantasia || empresa.razao_social,
          plano: empresa.plano,
          valor_mensal: empresa.valor_mensal,
          status_assinatura: empresa.status_assinatura,
          data_inicio_assinatura: empresa.data_inicio_assinatura,
          data_vencimento_assinatura: empresa.data_vencimento_assinatura,
          limite_usuarios: empresa.limite_usuarios,
          limite_produtos: empresa.limite_produtos,
          modulo_fiscal: empresa.modulo_fiscal,
          modulo_whatsapp: empresa.modulo_whatsapp,
          modulo_crm: empresa.modulo_crm,
          modulo_delivery: empresa.modulo_delivery,
          modulo_multiloja: empresa.modulo_multiloja,
          modulo_relatorios_premium: empresa.modulo_relatorios_premium,
          tipo_acesso: "empresa",
        })
      );

      await atualizarUltimoAcessoUsuario(usuario.id);

      if (usuario.trocar_senha) {
        alert("Você precisa trocar sua senha.");
      }

      router.push("/dashboard");
    } catch (error: any) {
      alert("Erro ao fazer login: " + error.message);
    }

    setCarregando(false);
  }

  function esqueciSenha() {
    alert("Para recuperar sua senha, entre em contato com o administrador da sua empresa ou com o suporte THCloud.");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020817] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_5%,rgba(37,99,235,0.45),transparent_28%),radial-gradient(circle_at_90%_15%,rgba(29,78,216,0.28),transparent_30%),linear-gradient(135deg,#05256f_0%,#020817_48%,#04163f_100%)]" />
      <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full border border-blue-500/20" />
      <div className="absolute bottom-24 right-12 hidden h-72 w-72 bg-[radial-gradient(circle,rgba(59,130,246,0.28)_1px,transparent_1px)] [background-size:18px_18px] opacity-35 lg:block" />
      <div className="absolute left-1/2 top-1/2 hidden h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/5 blur-3xl lg:block" />

      <main className="relative z-10 min-h-screen px-6 py-8 lg:px-24 lg:py-14">
        <div className="grid min-h-[calc(100vh-7rem)] grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <section className="flex h-full flex-col justify-between">
            <div className="flex items-center gap-5">
              <img
                src="/logo-thcloud-transparente.png"
                alt="THCloud"
                className="h-20 w-20 object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/logo-thcloud.jpeg";
                }}
              />

              <div>
                <h1 className="text-3xl font-black tracking-tight">
                  THCloud ERP
                </h1>

                <p className="mt-1 text-lg text-blue-100">
                  Gestão inteligente para empresas
                </p>
              </div>
            </div>

            <div className="my-16 max-w-2xl lg:my-0">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-5 py-3 text-sm font-black uppercase tracking-wide text-blue-50 ring-1 ring-blue-300/20">
                <Rocket size={18} />
                Plataforma SaaS Multiempresa
              </div>

              <h2 className="max-w-xl text-5xl font-black leading-tight tracking-tight md:text-6xl">
                Controle sua empresa com segurança, velocidade e{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  simplicidade.
                </span>
              </h2>

              <p className="mt-8 max-w-xl text-lg leading-8 text-blue-50">
                Acesse vendas, estoque, clientes, financeiro e relatórios em
                uma plataforma web moderna, integrada e preparada para crescer
                junto com o seu negócio.
              </p>

              <div className="mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
                <Beneficio
                  icone={<Shield size={27} />}
                  titulo="Ambiente seguro"
                  texto="Seus dados protegidos 24/7"
                />

                <Beneficio
                  icone={<Cloud size={27} />}
                  titulo="Dados em nuvem"
                  texto="Acesse de qualquer lugar"
                />

                <Beneficio
                  icone={<Rocket size={27} />}
                  titulo="Gestão completa"
                  texto="Todas as ferramentas que você precisa"
                />
              </div>
            </div>

            <div className="hidden text-sm text-blue-100 lg:block">
              <p className="font-bold">
                © {new Date().getFullYear()} THCloud. Todos os direitos
                reservados.
              </p>
              <p className="mt-2">THCloud ERP v1.0.0 • Sistema de gestão em nuvem</p>
            </div>
          </section>

          <section className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[530px]">
              <div className="rounded-[2rem] bg-white p-8 text-slate-900 shadow-2xl shadow-blue-950/40 ring-1 ring-white/60 md:p-10">
                <div className="text-center">
                  <img
                    src="/logo-thcloud-transparente.png"
                    alt="THCloud"
                    className="mx-auto h-36 w-36 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/logo-thcloud.jpeg";
                    }}
                  />

                  <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
                    THCloud ERP
                  </h2>

                  <h3 className="mt-8 text-2xl font-black text-slate-900">
                    Bem-vindo de volta!
                  </h3>

                  <p className="mt-3 text-base text-slate-500">
                    Entre com seus dados para acessar o sistema.
                  </p>
                </div>

                <div className="mt-8 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-800">
                      E-mail ou usuário
                    </label>

                    <div className="relative">
                      <Mail
                        size={21}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        placeholder="E-mail ou usuário"
                        className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-12 pr-4 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-black text-slate-800">
                        Senha
                      </label>

                      <button
                        type="button"
                        onClick={esqueciSenha}
                        className="text-sm font-bold text-blue-700 hover:text-blue-900"
                      >
                        Esqueci minha senha
                      </button>
                    </div>

                    <div className="relative">
                      <Lock
                        size={21}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type={mostrarSenha ? "text" : "password"}
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Digite sua senha"
                        className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-12 pr-12 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") entrar();
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {mostrarSenha ? <EyeOff size={21} /> : <Eye size={21} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={entrar}
                    disabled={carregando}
                    className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-base font-black text-white shadow-lg transition ${
                      carregando
                        ? "cursor-not-allowed bg-slate-400"
                        : "bg-blue-700 hover:bg-blue-800 hover:shadow-blue-200"
                    }`}
                  >
                    {carregando ? "Verificando credenciais..." : "Acessar sistema"}
                    {!carregando && <ArrowRight size={21} />}
                  </button>
                </div>

                <div className="mt-6 rounded-2xl bg-slate-100 p-5 ring-1 ring-slate-200">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                      <ShieldCheck size={27} />
                    </div>

                    <div>
                      <p className="text-lg font-black text-slate-900">
                        Ambiente seguro
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        O acesso é controlado por empresa, assinatura e
                        permissões de usuário.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-center text-sm text-slate-500">
                  Problemas para acessar? Entre em contato com o suporte
                  THCloud.
                </p>
              </div>

              <p className="mt-6 text-center text-sm text-blue-100">
                THCloud ERP v1.0.0 • Sistema de gestão em nuvem
              </p>
            </div>
          </section>

          <div className="text-center text-sm text-blue-100 lg:hidden">
            <p className="font-bold">
              © {new Date().getFullYear()} THCloud. Todos os direitos
              reservados.
            </p>
            <p className="mt-2">THCloud ERP v1.0.0 • Sistema de gestão em nuvem</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Beneficio({
  icone,
  titulo,
  texto,
}: {
  icone: React.ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-cyan-300 ring-1 ring-cyan-300/30">
          {icone}
        </div>

        <div>
          <p className="font-black text-white">{titulo}</p>
          <p className="mt-1 text-sm leading-5 text-blue-100">{texto}</p>
        </div>
      </div>
    </div>
  );
}
