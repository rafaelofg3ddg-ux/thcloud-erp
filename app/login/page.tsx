"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Rocket,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type UsuarioBanco = {
  id: string;
  nome: string | null;
  email: string | null;
  senha: string | null;
  perfil: string | null;
  empresa_id: string | null;
  ativo: boolean | null;
};

type EmpresaBanco = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  nome: string | null;
  plano: string | null;
  ativo: boolean | null;
  modulo_fiscal: boolean | null;
  modulo_whatsapp: boolean | null;
  modulo_delivery: boolean | null;
  modulo_crm: boolean | null;
  modulo_relatorios_premium: boolean | null;
  modulo_multiloja: boolean | null;
};

export default function LoginPage() {
  const router = useRouter();

  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  function salvarSessao(usuario: UsuarioBanco, empresa: EmpresaBanco | null) {
    const plano = empresa?.plano || "Básico";

    const empresaNome =
      empresa?.nome_fantasia ||
      empresa?.razao_social ||
      empresa?.nome ||
      "Empresa";

    const usuarioSessao = {
      id: usuario.id,
      nome: usuario.nome || usuario.email || "Usuário",
      email: usuario.email || "",
      usuario: usuario.email || "",
      perfil: usuario.perfil || "Operador",
      empresa_id: usuario.empresa_id || empresa?.id || null,
      empresa_nome: empresaNome,
      plano,
      plano_nome: plano,
      nome_plano: plano,
      modulo_fiscal: empresa?.modulo_fiscal === true,
      modulo_whatsapp: empresa?.modulo_whatsapp === true,
      modulo_delivery: empresa?.modulo_delivery === true,
      modulo_crm: empresa?.modulo_crm === true,
      modulo_relatorios_premium: empresa?.modulo_relatorios_premium === true,
      modulo_multiloja: empresa?.modulo_multiloja === true,
    };

    const empresaSessao = empresa
      ? {
          id: empresa.id,
          empresa_id: empresa.id,
          nome: empresaNome,
          nome_fantasia: empresa.nome_fantasia || empresaNome,
          razao_social: empresa.razao_social || empresaNome,
          plano,
          ativo: empresa.ativo !== false,
        }
      : null;

    sessionStorage.setItem("th_usuario", JSON.stringify(usuarioSessao));
    localStorage.setItem("th_usuario", JSON.stringify(usuarioSessao));

    if (empresaSessao) {
      sessionStorage.setItem("th_empresa", JSON.stringify(empresaSessao));
      localStorage.setItem("th_empresa", JSON.stringify(empresaSessao));
      localStorage.setItem("empresa_id", empresaSessao.id);
      localStorage.setItem("th_empresa_id", empresaSessao.id);
    }
  }

  async function buscarEmpresa(empresaId: string | null) {
    if (!empresaId) return null;

    const { data, error } = await supabase
      .from("empresas")
      .select(
        "id,nome_fantasia,razao_social,nome,plano,ativo,modulo_fiscal,modulo_whatsapp,modulo_delivery,modulo_crm,modulo_relatorios_premium,modulo_multiloja"
      )
      .eq("id", empresaId)
      .maybeSingle();

    if (error) return null;

    return data as EmpresaBanco | null;
  }

  async function entrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const loginLimpo = login.trim();

    if (!loginLimpo || !senha.trim()) {
      alert("Informe o e-mail e a senha.");
      return;
    }

    setCarregando(true);

    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id,nome,email,senha,perfil,empresa_id,ativo")
        .eq("email", loginLimpo)
        .maybeSingle();

      if (error) {
        alert("Erro ao buscar usuário: " + error.message);
        setCarregando(false);
        return;
      }

      const usuario = data as UsuarioBanco | null;

      if (!usuario) {
        alert("Usuário não encontrado.");
        setCarregando(false);
        return;
      }

      if (usuario.ativo === false) {
        alert("Usuário inativo. Fale com o administrador.");
        setCarregando(false);
        return;
      }

      if ((usuario.senha || "") !== senha) {
        alert("Senha incorreta.");
        setCarregando(false);
        return;
      }

      const empresa = await buscarEmpresa(usuario.empresa_id);

      if (empresa && empresa.ativo === false) {
        alert("Empresa inativa. Fale com o suporte.");
        setCarregando(false);
        return;
      }

      salvarSessao(usuario, empresa);

      if (usuario.perfil === "Super Admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (erro) {
      console.error(erro);
      alert("Erro ao entrar no sistema.");
    }

    setCarregando(false);
  }

  return (
    <main className="min-h-screen bg-[#061a4d] overflow-x-hidden">
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-950 to-slate-950 px-10 xl:px-16 py-10 text-white">
          <div className="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-blue-400/30 blur-3xl" />
          <div className="absolute bottom-20 -right-24 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-4">
              <LogoMarca grande />

              <div>
                <h1 className="text-3xl font-black tracking-[-0.04em]">
                  THCloud ERP
                </h1>
                <p className="mt-1 text-blue-100 font-medium">
                  Gestão inteligente para empresas
                </p>
              </div>
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-5 py-3 text-sm font-black uppercase tracking-wide">
              <Rocket size={18} />
              Plataforma SaaS Multiempresa
            </div>

            <h2 className="mt-10 max-w-xl text-5xl xl:text-6xl font-black leading-[1.05] tracking-[-0.06em]">
              Controle sua empresa com segurança, velocidade e{" "}
              <span className="bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
                simplicidade.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-lg text-blue-100 leading-relaxed">
              Acesse vendas, estoque, financeiro, relatórios e configurações em
              uma plataforma moderna, responsiva e pronta para o crescimento.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-4 max-w-2xl">
            <CardInfo icon={<ShieldCheck size={23} />} titulo="Seguro" texto="Dados por empresa" />
            <CardInfo icon={<Store size={23} />} titulo="Varejo" texto="PDV e estoque" />
            <CardInfo icon={<Users size={23} />} titulo="Equipe" texto="Usuários e planos" />
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-10">
          <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-blue-700 via-blue-950 to-slate-950" />
          <div className="absolute lg:hidden -top-20 -left-20 h-72 w-72 rounded-full bg-blue-400/30 blur-3xl" />
          <div className="absolute lg:hidden -bottom-20 -right-20 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative w-full max-w-[480px]">
            <div className="mb-5 flex lg:hidden items-center justify-center gap-3 text-white">
              <LogoMarca />

              <div>
                <h1 className="text-2xl font-black tracking-[-0.04em]">
                  THCloud ERP
                </h1>
                <p className="text-sm text-blue-100">Gestão inteligente</p>
              </div>
            </div>

            <div className="rounded-[32px] bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl p-6 sm:p-8 lg:p-10">
              <div className="hidden lg:flex justify-center mb-6">
                <LogoMarca grande />
              </div>

              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl font-black tracking-[-0.04em] text-slate-950">
                  THCloud ERP
                </h2>

                <p className="mt-3 text-xl sm:text-2xl font-black text-slate-950">
                  Bem-vindo!
                </p>

                <p className="mt-3 text-slate-500">
                  Entre com seus dados para acessar o sistema.
                </p>
              </div>

              <form onSubmit={entrar} className="mt-8 space-y-5">
                <div>
                  <label className="block text-sm font-black text-slate-900 mb-2">
                    E-mail
                  </label>

                  <div className="relative">
                    <Mail
                      size={21}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      type="email"
                      autoComplete="username"
                      placeholder="Digite seu e-mail"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-12 py-4 font-semibold text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <label className="block text-sm font-black text-slate-900">
                      Senha
                    </label>

                    <button
                      type="button"
                      onClick={() => alert("Solicite a redefinição de senha ao administrador.")}
                      className="text-sm font-black text-blue-700 hover:text-blue-900"
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
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      type={mostrarSenha ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Digite sua senha"
                      className="w-full rounded-2xl border border-slate-300 bg-white px-12 py-4 pr-14 font-semibold text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-700"
                      aria-label="Mostrar ou ocultar senha"
                    >
                      {mostrarSenha ? <EyeOff size={21} /> : <Eye size={21} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full rounded-2xl bg-blue-700 hover:bg-blue-800 text-white py-4 font-black shadow-xl shadow-blue-700/25 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {carregando ? "Acessando..." : "Acessar sistema"}
                  {!carregando && <ArrowRight size={20} />}
                </button>
              </form>

              <div className="mt-6 rounded-2xl bg-blue-50 border border-blue-100 p-4 text-center">
                <p className="font-black text-blue-900">Ambiente seguro</p>

                <p className="mt-1 text-sm text-blue-700">
                  Login isolado por empresa, plano e permissões.
                </p>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-blue-100 lg:text-slate-400">
              © {new Date().getFullYear()} THCloud ERP. Todos os direitos reservados.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function LogoMarca({ grande = false }: { grande?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center ${
        grande ? "h-24 w-24" : "h-16 w-16"
      }`}
    >
      <img
        src="/logo-thcloud-original.png"
        alt="THCloud"
        className="h-full w-full object-contain drop-shadow-xl"
        onError={(e) => {
          e.currentTarget.src = "/logo-thcloud-transparente.png";
        }}
      />
    </div>
  );
}

function CardInfo({
  icon,
  titulo,
  texto,
}: {
  icon: React.ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="rounded-3xl bg-white/10 border border-white/15 backdrop-blur-md p-4">
      <div className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center">
        {icon}
      </div>

      <p className="mt-4 font-black">{titulo}</p>
      <p className="text-sm text-blue-100">{texto}</p>
    </div>
  );
}
