"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, MessageCircle, UserRound, ShieldCheck, Cloud, TrendingUp, Package } from "lucide-react";
import { supabase } from "../../lib/supabase";

const WHATSAPP_NUMERO = "5598988761840";
const EMAIL_SUPORTE = "thcloudsistemas@gmail.com";

type UsuarioLogin = {
  id: string;
  nome: string | null;
  email: string | null;
  usuario?: string | null;
  perfil: string | null;
  empresa_id: string | null;
  ativo: boolean | null;
};

type EmpresaLogin = {
  id: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  plano: string | null;
  ativo: boolean | null;
  status_assinatura: string | null;
  onboarding_concluido: boolean | null;
};

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrar, setLembrar] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  function normalizarPerfil(perfil?: string | null) {
    return String(perfil || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function ehSuperAdmin(usuario: UsuarioLogin | null) {
    const perfil = normalizarPerfil(usuario?.perfil);
    return perfil === "super admin" || perfil === "superadmin" || perfil === "master";
  }

  function salvarSessao(usuario: UsuarioLogin, empresa?: EmpresaLogin | null) {
    const usuarioNormalizado = {
      id: usuario.id,
      nome: usuario.nome || usuario.email || "Usuário",
      email: usuario.email || "",
      usuario: usuario.usuario || usuario.email || "",
      perfil: usuario.perfil || "Admin",
      empresa_id: usuario.empresa_id,
      empresa_nome: empresa?.nome_fantasia || empresa?.razao_social || "Empresa",
      plano: empresa?.plano || "Básico",
    };

    const empresaNormalizada = empresa
      ? {
          id: empresa.id,
          empresa_id: empresa.id,
          nome: empresa.nome_fantasia || empresa.razao_social || "Empresa",
          nome_fantasia: empresa.nome_fantasia || "",
          razao_social: empresa.razao_social || "",
          plano: empresa.plano || "Básico",
          ativo: empresa.ativo !== false,
          status_assinatura: empresa.status_assinatura || "Ativo",
          onboarding_concluido: empresa.onboarding_concluido === true,
        }
      : null;

    sessionStorage.setItem("th_usuario", JSON.stringify(usuarioNormalizado));

    if (empresaNormalizada) {
      sessionStorage.setItem("th_empresa", JSON.stringify(empresaNormalizada));
      sessionStorage.setItem("empresa_id", empresaNormalizada.id);
      sessionStorage.setItem("th_empresa_id", empresaNormalizada.id);
    }

    if (lembrar) {
      localStorage.setItem("th_usuario", JSON.stringify(usuarioNormalizado));

      if (empresaNormalizada) {
        localStorage.setItem("th_empresa", JSON.stringify(empresaNormalizada));
        localStorage.setItem("empresa_id", empresaNormalizada.id);
        localStorage.setItem("th_empresa_id", empresaNormalizada.id);
      }
    }
  }

  async function entrar() {
    if (!login.trim() || !senha.trim()) {
      alert("Informe usuário/e-mail e senha.");
      return;
    }

    setCarregando(true);
    const loginLimpo = login.trim().toLowerCase();

    try {
      const { data: usuarios, error: erroLogin } = await supabase.rpc("verificar_login", {
        p_login: loginLimpo,
        p_senha: senha,
      });

      if (erroLogin) {
        alert("Erro ao acessar: " + erroLogin.message);
        setCarregando(false);
        return;
      }

      const usuario = (usuarios && usuarios[0]) as UsuarioLogin | null;

      if (!usuario) {
        alert("Usuário ou senha inválidos.");
        setCarregando(false);
        return;
      }

      if (usuario.ativo === false) {
        alert("Usuário inativo. Entre em contato com o suporte.");
        setCarregando(false);
        return;
      }

      if (ehSuperAdmin(usuario)) {
        salvarSessao(usuario, null);
        router.replace("/admin");
        return;
      }

      if (!usuario.empresa_id) {
        alert("Usuário sem empresa vinculada.");
        setCarregando(false);
        return;
      }

      const empresaReq = await supabase
        .from("empresas")
        .select("id,nome_fantasia,razao_social,plano,ativo,status_assinatura,onboarding_concluido")
        .eq("id", usuario.empresa_id)
        .maybeSingle();

      if (empresaReq.error || !empresaReq.data) {
        alert("Empresa não localizada.");
        setCarregando(false);
        return;
      }

      const empresa = empresaReq.data as EmpresaLogin;
      salvarSessao(usuario, empresa);

      if (empresa.ativo === false || empresa.status_assinatura === "Bloqueado" || empresa.status_assinatura === "Cancelado") {
        router.replace("/bloqueado");
        return;
      }

      if (empresa.onboarding_concluido !== true) {
        router.replace("/onboarding");
        return;
      }

      router.replace("/dashboard");
    } catch (error: any) {
      alert("Erro ao acessar: " + error.message);
      setCarregando(false);
    }
  }

  return (
    <main data-no-uppercase="true" className="min-h-screen bg-white grid grid-cols-1 lg:grid-cols-2">
      {/* ---------- LADO ESQUERDO: identidade visual / confiança ---------- */}
      <section className="relative hidden lg:flex min-h-screen overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.5),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.35),_transparent_42%),linear-gradient(160deg,_#020617_0%,_#0b1533_45%,_#0f2a52_100%)]" />
        <div className="absolute inset-0 opacity-25">
          <div className="absolute left-16 top-24 h-72 w-72 rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute bottom-10 right-16 h-96 w-96 rounded-full bg-cyan-400 blur-3xl" />
        </div>
        {/* textura sutil de grade, pra dar profundidade sem poluir */}
        <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:56px_56px]" />

        <div className="relative z-10 flex h-full w-full flex-col justify-between p-16">
          <Link href="/" className="flex items-center gap-4">
            <Image src="/icon.png" alt="Th Cloud" width={56} height={56} className="object-contain drop-shadow-xl" priority />
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Th Cloud</h1>
              <p className="text-sm font-semibold text-blue-200/80">Gestão inteligente para o seu negócio</p>
            </div>
          </Link>

          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-100 backdrop-blur">
              <ShieldCheck size={14} /> Plataforma segura em nuvem
            </div>
            <h2 className="text-5xl font-black leading-[1.05] text-white">
              Tudo o que a sua empresa precisa, em um só lugar.
            </h2>
            <p className="mt-6 text-lg leading-8 text-blue-50/85">
              Vendas, caixa, estoque, clientes e financeiro reunidos numa plataforma
              pensada pra você tomar decisões melhores, todos os dias.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <RecursoCard icone={<TrendingUp size={18} />} titulo="Vendas & PDV" texto="Rápido e completo" />
            <RecursoCard icone={<Package size={18} />} titulo="Estoque" texto="Sempre atualizado" />
            <RecursoCard icone={<Cloud size={18} />} titulo="100% nuvem" texto="Acesse de onde estiver" />
          </div>
        </div>
      </section>

      {/* ---------- LADO DIREITO: formulário de login ---------- */}
      <section className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center">
              <Image src="/icon.png" alt="Th Cloud" width={96} height={96} className="object-contain drop-shadow-lg" priority />
            </div>
            <h1 className="text-3xl font-black text-slate-950">Bem-vindo de volta</h1>
            <p className="mt-2 text-slate-500 font-semibold">Entre com sua conta para continuar</p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">Usuário</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10">
                <UserRound size={20} className="text-slate-400" />
                <input value={login} onChange={(e) => setLogin(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") entrar(); }} className="w-full border-0 bg-transparent font-bold text-slate-900 outline-none th-no-uppercase" placeholder="Digite seu usuário ou e-mail" autoComplete="username" inputMode="email" data-no-uppercase="true" autoFocus />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">Senha</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10">
                <Lock size={20} className="text-slate-400" />
                <input type={mostrarSenha ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") entrar(); }} className="w-full border-0 bg-transparent font-bold text-slate-900 outline-none th-no-uppercase" placeholder="Digite sua senha" autoComplete="current-password" data-no-uppercase="true" />
                <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="text-slate-400 hover:text-slate-700">{mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}</button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 font-bold text-slate-600"><input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} className="h-4 w-4 rounded" />Lembrar de mim</label>
              <a href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("Olá, preciso recuperar meu acesso ao Th Cloud.")}`} target="_blank" className="font-black text-blue-700 hover:text-blue-800">Esqueci minha senha</a>
            </div>

            <button onClick={entrar} disabled={carregando} className={`w-full rounded-2xl px-6 py-4 font-black text-white shadow-xl transition ${carregando ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25"}`}>{carregando ? "Entrando..." : "Entrar"}</button>
          </div>

          <div className="mt-10 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="font-bold uppercase tracking-wider">Precisa de ajuda?</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <a href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("Olá, preciso de ajuda com o Th Cloud.")}`} target="_blank" className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-100 transition">
            <MessageCircle size={18} className="text-green-600" /> Falar com o suporte
          </a>

          <div className="mt-8 text-center text-xs text-slate-400">
            <p>{EMAIL_SUPORTE} · (98) 98876-1840</p>
            <p className="mt-2">© {new Date().getFullYear()} Th Cloud. Todos os direitos reservados.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function RecursoCard({ icone, titulo, texto }: { icone: React.ReactNode; titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-blue-100">{icone}</div>
      <p className="text-sm font-black text-white">{titulo}</p>
      <p className="text-xs font-semibold text-blue-100/70">{texto}</p>
    </div>
  );
}
