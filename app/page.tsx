"use client";

import Link from "next/link";
import Image from "next/image";
import {
  BarChart3,
  Calendar,
  ChevronRight,
  FileText,
  Headphones,
  Lock,
  MessageCircle,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  Wallet,
} from "lucide-react";

const WHATSAPP_NUMERO = "5598988761840";
const EMAIL_SUPORTE = "thcloudsistemas@gmail.com";
const WHATSAPP_TEXTO_CLOUD = "Olá, quero conhecer o Th Cloud para minha empresa.";
const WHATSAPP_TEXTO_CLINICA = "Olá, quero conhecer o Th Clínica para minha clínica.";

const recursosCloud: [string, string, any][] = [
  ["PDV completo", "Venda rápido com código de barras, PIX, crediário e caixa.", ShoppingCart],
  ["Estoque e financeiro", "Controle de produtos, contas a pagar/receber e fluxo de caixa.", Wallet],
  ["Relatórios", "Vendas, estoque e desempenho da empresa em tempo real.", BarChart3],
];

const recursosClinica: [string, string, any][] = [
  ["Agenda inteligente", "Calendário por profissional, sem conflito de horário.", Calendar],
  ["Prontuário eletrônico", "Histórico, receitas e atestados assinados digitalmente.", FileText],
  ["Financeiro integrado", "Pagamentos do check-in direto no financeiro da clínica.", Wallet],
];

function MarcaDagua({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute select-none ${className}`} aria-hidden="true">
      <Image src="/logo-thclinica.png" alt="" width={640} height={640} className="opacity-[0.05]" />
    </div>
  );
}

export default function SiteInstitucionalPage() {
  const whatsappCloud = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_TEXTO_CLOUD)}`;
  const whatsappClinica = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_TEXTO_CLINICA)}`;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-sky-50">
              <Image src="/logo-thcloud-original.png" alt="Th Sistemas" width={30} height={30} className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-lg font-black leading-none text-slate-900">Th Sistemas</h1>
              <p className="text-xs font-bold text-sky-600">Th Cloud · Th Clínica</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-bold text-slate-500 lg:flex">
            <a href="#th-cloud" className="hover:text-slate-900">Th Cloud</a>
            <a href="#th-clinica" className="hover:text-slate-900">Th Clínica</a>
            <a href="#suporte" className="hover:text-slate-900">Suporte</a>
          </nav>

          <Link href="/area-cliente" className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800">
            <Lock size={16} /> <span className="hidden sm:inline">Área do Cliente</span>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 to-white pt-36 pb-20">
        <MarcaDagua className="-right-24 -top-16 rotate-12" />
        <MarcaDagua className="-left-32 bottom-0 -rotate-12" />
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <div className="mb-5 inline-flex rounded-full border border-sky-200 bg-white px-4 py-1.5 text-xs font-black uppercase tracking-wide text-sky-600 shadow-sm">
            Sistemas de gestão em nuvem
          </div>
          <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-900 lg:text-6xl">
            Simplifique a gestão do seu negócio, de qualquer lugar.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 lg:text-lg">
            Duas plataformas feitas sob medida: <strong className="text-slate-900">Th Cloud</strong> para quem vende,
            e <strong className="text-slate-900">Th Clínica</strong> para quem cuida de pacientes.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="#th-cloud" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-6 py-3.5 font-black text-white shadow-lg shadow-sky-500/25 hover:bg-sky-600">
              <ShoppingCart size={18} /> Th Cloud
            </a>
            <a href="#th-clinica" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-6 py-3.5 font-black text-white shadow-lg shadow-teal-500/25 hover:bg-teal-600">
              <Stethoscope size={18} /> Th Clínica
            </a>
          </div>
        </div>

        <div className="relative mx-auto mt-14 max-w-4xl px-5">
          <div className="overflow-hidden rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200">
            <Image src="/marketing/cloud-multidispositivo.jpg" alt="Th Cloud em notebook, tablet e celular" width={1400} height={950} className="w-full" priority />
          </div>
        </div>
      </section>

      {/* TH CLOUD */}
      <section id="th-cloud" className="relative overflow-hidden border-t border-slate-100 py-20">
        <MarcaDagua className="-right-20 top-10 rotate-6" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500"><ShoppingCart size={20} className="text-white" /></div>
              <p className="font-black text-sky-600">TH CLOUD</p>
            </div>
            <h2 className="text-3xl font-black text-slate-900 lg:text-4xl">Gestão completa para o seu varejo.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              PDV, estoque, financeiro e clientes em uma plataforma rápida e fácil de usar.
            </p>
            <div className="mt-6 space-y-4">
              {recursosCloud.map(([titulo, texto, Icon]) => (
                <div key={titulo} className="flex gap-3">
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50"><Icon size={18} className="text-sky-600" /></div>
                  <div>
                    <p className="font-black text-slate-900">{titulo}</p>
                    <p className="text-sm text-slate-500">{texto}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/area-cliente" className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-black text-white hover:bg-sky-600">
                Acessar Área do Cliente <ChevronRight size={16} />
              </Link>
              <a href={whatsappCloud} target="_blank" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-100 shadow-xl shadow-slate-200">
            <Image src="/marketing/cloud-notebook-pessoa.jpg" alt="Pessoa usando o Th Cloud no notebook" width={1200} height={900} className="w-full" />
          </div>
        </div>
      </section>

      {/* TH CLINICA */}
      <section id="th-clinica" className="relative overflow-hidden bg-teal-50/40 py-20">
        <MarcaDagua className="-left-20 bottom-0 -rotate-6" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 lg:grid-cols-2">
          <div className="order-2 overflow-hidden rounded-[1.75rem] border border-slate-100 shadow-xl shadow-slate-200 lg:order-1">
            <Image src="/marketing/clinica-medicos-tela.jpg" alt="Profissionais usando o Th Clínica" width={1200} height={900} className="w-full" />
          </div>
          <div className="order-1 lg:order-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500"><Stethoscope size={20} className="text-white" /></div>
              <p className="font-black text-teal-700">TH CLÍNICA</p>
            </div>
            <h2 className="text-3xl font-black text-slate-900 lg:text-4xl">Sua clínica organizada, do início ao fim.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Agenda, prontuário eletrônico e financeiro integrados em um só sistema.
            </p>
            <div className="mt-6 space-y-4">
              {recursosClinica.map(([titulo, texto, Icon]) => (
                <div key={titulo} className="flex gap-3">
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50"><Icon size={18} className="text-teal-700" /></div>
                  <div>
                    <p className="font-black text-slate-900">{titulo}</p>
                    <p className="text-sm text-slate-500">{texto}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/area-cliente" className="inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 text-sm font-black text-white hover:bg-teal-600">
                Acessar Área do Cliente <ChevronRight size={16} />
              </Link>
              <a href={whatsappClinica} target="_blank" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-white">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SUPORTE */}
      <section id="suporte" className="py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 lg:grid-cols-2">
          <div>
            <p className="font-black text-sky-600">SUPORTE</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900 lg:text-4xl">Atendimento próximo, para os dois sistemas.</h2>
            <p className="mt-4 leading-7 text-slate-600">Suporte via WhatsApp e implantação assistida — seja Th Cloud ou Th Clínica.</p>
            <div className="mt-6 flex gap-6 text-sm">
              <div className="flex items-center gap-2 font-bold text-slate-700"><Headphones size={18} className="text-sky-600" /> Atendimento rápido</div>
              <div className="flex items-center gap-2 font-bold text-slate-700"><ShieldCheck size={18} className="text-sky-600" /> Dados seguros</div>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-7 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900">Fale com o suporte</h3>
            <div className="mt-5 space-y-2.5 text-sm text-slate-600">
              <p><strong className="text-slate-900">WhatsApp:</strong> (98) 98876-1840</p>
              <p><strong className="text-slate-900">E-mail:</strong> {EMAIL_SUPORTE}</p>
              <p><strong className="text-slate-900">Horário:</strong> Segunda a sexta, 08h às 18h</p>
            </div>
            <a href={whatsappCloud} target="_blank" className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-green-500 px-6 py-3.5 font-black text-white hover:bg-green-600">
              <MessageCircle size={18} /> Chamar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-7">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm font-bold text-slate-400 md:flex-row">
          <p>© {new Date().getFullYear()} Th Sistemas.</p>
          <div className="flex items-center gap-4">
            <Link href="/area-cliente" className="hover:text-slate-900">Área do Cliente</Link>
            <a href="#th-cloud" className="hover:text-slate-900">Th Cloud</a>
            <a href="#th-clinica" className="hover:text-slate-900">Th Clínica</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
