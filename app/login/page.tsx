"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, MessageCircle, UserRound } from "lucide-react";
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
      let usuarioReq = await supabase
        .from("usuarios")
        .select("id,nome,email,usuario,perfil,empresa_id,ativo")
        .eq("email", loginLimpo)
        .eq("senha", senha)
        .maybeSingle();

      if (!usuarioReq.data) {
        usuarioReq = await supabase
          .from("usuarios")
          .select("id,nome,email,usuario,perfil,empresa_id,ativo")
          .eq("usuario", loginLimpo)
          .eq("senha", senha)
          .maybeSingle();
      }

      if (!usuarioReq.data) {
        usuarioReq = await supabase
          .from("usuarios")
          .select("id,nome,email,usuario,perfil,empresa_id,ativo")
          .ilike("nome", loginLimpo)
          .eq("senha", senha)
          .maybeSingle();
      }

      if (usuarioReq.error) {
        alert("Erro ao acessar: " + usuarioReq.error.message);
        setCarregando(false);
        return;
      }

      const usuario = usuarioReq.data as UsuarioLogin | null;

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
    <main className="min-h-screen bg-white grid grid-cols-1 lg:grid-cols-2">
      <section className="relative hidden lg:flex min-h-screen overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.55),_transparent_35%),linear-gradient(135deg,_rgba(2,6,23,0.92),_rgba(8,47,73,0.78))]" />
        <div className="absolute inset-0 opacity-20"><div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-blue-500 blur-3xl" /><div className="absolute bottom-16 right-24 h-80 w-80 rounded-full bg-cyan-400 blur-3xl" /></div>

        <div className="relative z-10 flex h-full w-full flex-col justify-between p-16">
          <Link href="/" className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 shadow-2xl shadow-blue-600/40">
              <Image src="/logo-thcloud-original.png" alt="Th Cloud" width={46} height={46} className="object-contain" priority />
            </div>
            <div><h1 className="text-3xl font-black text-white">Th Cloud</h1><p className="font-bold text-blue-100">Sistema de gestão para varejo</p></div>
          </Link>

          <div className="max-w-xl">
            <div className="mb-6 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-blue-100">Gestão simples, moderna e segura</div>
            <h2 className="text-6xl font-black leading-[0.95] text-white">Controle sua empresa em tempo real.</h2>
            <p className="mt-6 text-xl leading-9 text-blue-50">Acesse vendas, caixa, estoque, clientes e financeiro em uma plataforma profissional em nuvem.</p>
            <a href="/#plano" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-4 font-black text-blue-700 hover:bg-blue-50">Conheça o Plano Básico</a>
          </div>

          <div className="grid grid-cols-3 gap-4"><MiniInfo titulo="PDV" texto="Completo" /><MiniInfo titulo="R$ 69,90" texto="Plano básico" /><MiniInfo titulo="Suporte" texto="WhatsApp" /></div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-blue-600 shadow-2xl shadow-blue-600/25">
              <Image src="/logo-thcloud-original.png" alt="Th Cloud" width={70} height={70} className="object-contain" priority />
            </div>
            <h1 className="text-3xl font-black text-slate-950">Th Cloud</h1>
            <p className="mt-2 text-slate-500 font-semibold">Acesse sua área do cliente</p>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">Usuário</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10">
                <UserRound size={20} className="text-slate-400" />
                <input value={login} onChange={(e) => setLogin(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") entrar(); }} className="w-full border-0 bg-transparent font-bold text-slate-900 outline-none" placeholder="Digite seu usuário ou e-mail" autoFocus />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-black text-slate-700">Senha</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10">
                <Lock size={20} className="text-slate-400" />
                <input type={mostrarSenha ? "text" : "password"} value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") entrar(); }} className="w-full border-0 bg-transparent font-bold text-slate-900 outline-none" placeholder="Digite sua senha" />
                <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="text-slate-400 hover:text-slate-700">{mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}</button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 font-bold text-slate-600"><input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} className="h-4 w-4" />Lembrar de mim</label>
              <a href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("Olá, preciso recuperar meu acesso ao Th Cloud.")}`} target="_blank" className="font-black text-blue-700 hover:text-blue-800">Esqueci minha senha</a>
            </div>

            <button onClick={entrar} disabled={carregando} className={`w-full rounded-2xl px-6 py-4 font-black text-white shadow-xl ${carregando ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25"}`}>{carregando ? "Entrando..." : "Entrar"}</button>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
            <p className="font-black text-slate-900">Ainda não é cliente?</p>
            <p className="mt-1 text-sm text-slate-600">Conheça o Plano Básico e fale com nosso suporte.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href="/#plano" className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">Ver Plano</Link>
              <a href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent("Olá, quero contratar o Plano Básico do Th Cloud.")}`} target="_blank" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-500 px-4 py-3 text-sm font-black text-white hover:bg-green-600"><MessageCircle size={18} /> WhatsApp</a>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-slate-500"><p>Suporte: (98) 98876-1840</p><p>{EMAIL_SUPORTE}</p><p className="mt-3">© {new Date().getFullYear()} Th Cloud</p></div>
        </div>
      </section>
    </main>
  );
}

function MiniInfo({ titulo, texto }: { titulo: string; texto: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-2xl font-black text-white">{titulo}</p><p className="text-sm font-bold text-blue-100">{texto}</p></div>;
}
