"use client";

import Link from "next/link";
import Image from "next/image";
import { BarChart3, Boxes, CheckCircle2, ChevronRight, CreditCard, Headphones, Lock, MessageCircle, ShieldCheck, ShoppingCart, Store, Users, Wallet } from "lucide-react";

const WHATSAPP_NUMERO = "5598988761840";
const EMAIL_SUPORTE = "thcloudsistemas@gmail.com";
const WHATSAPP_TEXTO = "Olá, quero conhecer o Plano Básico do Th Cloud para minha empresa.";

const recursos = [
  ["PDV completo", "Venda rápido com código de barras, descontos, PIX, crediário, caixa e comprovantes.", ShoppingCart],
  ["Estoque inteligente", "Controle entradas, saídas, ajustes, inventário, produtos e grupos por empresa.", Boxes],
  ["Financeiro", "Contas a pagar, receber, crédito do cliente, fluxo de caixa e dashboard financeiro.", Wallet],
  ["Clientes", "Histórico de compras, crédito disponível, WhatsApp e acompanhamento comercial.", Users],
  ["Relatórios", "Acompanhe vendas, estoque, clientes, caixa e desempenho da empresa.", BarChart3],
  ["Sistema em nuvem", "Acesse de qualquer lugar com dados separados, segurança e suporte.", ShieldCheck],
];

const planoBasico = [
  "PDV completo",
  "Controle de caixa",
  "Produtos, grupos e etiquetas",
  "Clientes e fornecedores",
  "Controle de estoque",
  "Contas a pagar",
  "Contas a receber",
  "Fluxo de caixa",
  "Crédito do cliente",
  "Delivery com romaneio",
  "Relatórios",
  "Suporte via WhatsApp",
];

export default function SiteThCloudPage() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_TEXTO)}`;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <Image src="/logo-thcloud-original.png" alt="Th Cloud" width={34} height={34} className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-xl font-black leading-none">Th Cloud</h1>
              <p className="text-xs font-bold text-blue-200">Sistema de gestão para varejo</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-bold text-slate-300 lg:flex">
            <a href="#recursos" className="hover:text-white">Recursos</a>
            <a href="#plano" className="hover:text-white">Plano</a>
            <a href="#suporte" className="hover:text-white">Suporte</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden items-center gap-2 rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-black hover:bg-white/10 sm:flex">
              <Lock size={16} /> Área do Cliente
            </Link>
            <a href={whatsappUrl} target="_blank" className="rounded-2xl bg-green-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-green-500/20 hover:bg-green-600">WhatsApp</a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden pt-36 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.38),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.22),_transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="mb-6 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-black text-blue-200">Sistema moderno para gestão comercial</div>
            <h2 className="text-5xl font-black leading-[0.95] tracking-tight lg:text-7xl">Gestão em nuvem para vender, controlar e crescer.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">O Th Cloud reúne PDV, estoque, clientes, financeiro, delivery, relatórios e suporte em uma plataforma rápida, moderna e fácil de usar.</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 font-black text-white shadow-xl shadow-blue-600/25 hover:bg-blue-700">Acessar Área do Cliente <ChevronRight size={20} /></Link>
              <a href={whatsappUrl} target="_blank" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-7 py-4 font-black hover:bg-white/10"><MessageCircle size={20} /> Falar no WhatsApp</a>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4"><Metrica numero="100%" texto="Online" /><Metrica numero="Plano" texto="Básico" /><Metrica numero="PDV" texto="Completo" /></div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900">
                <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4"><span className="h-3 w-3 rounded-full bg-red-400" /><span className="h-3 w-3 rounded-full bg-yellow-400" /><span className="h-3 w-3 rounded-full bg-green-400" /><p className="ml-3 text-sm font-bold text-slate-400">Painel Th Cloud</p></div>
                <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                  <PainelCard icon={<Store />} titulo="Vendas Hoje" valor="R$ 8.420,00" />
                  <PainelCard icon={<Boxes />} titulo="Produtos" valor="1.248" />
                  <PainelCard icon={<CreditCard />} titulo="Recebido" valor="R$ 3.190,00" />
                  <PainelCard icon={<BarChart3 />} titulo="Ticket Médio" valor="R$ 86,40" />
                </div>
                <div className="p-5 pt-0"><div className="rounded-3xl bg-blue-600 p-5"><p className="font-bold text-blue-100">Resumo do caixa</p><div className="mt-4 grid grid-cols-3 gap-3 text-center"><ResumoCaixa valor="36" texto="Vendas" /><ResumoCaixa valor="R$ 920" texto="PIX" /><ResumoCaixa valor="R$ 340" texto="Dinheiro" /></div></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section id="recursos" className="border-y border-white/10 bg-slate-900/70 py-20">
        <div className="mx-auto max-w-7xl px-5">
          <p className="font-black text-blue-300">RECURSOS</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-black lg:text-5xl">Tudo que sua empresa precisa em uma única plataforma.</h2>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {recursos.map(([titulo, texto, Icon]: any) => (
              <div key={titulo} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:bg-white/[0.07]">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600"><Icon size={24} /></div>
                <h3 className="text-xl font-black">{titulo}</h3><p className="mt-3 leading-7 text-slate-300">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="plano" className="py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-black text-blue-300">PLANO</p>
            <h2 className="mt-3 text-4xl font-black lg:text-5xl">Plano Básico para começar com controle total.</h2>
            <p className="mt-4 text-slate-300">Um plano simples, completo e acessível para sua empresa vender melhor.</p>
          </div>
          <div className="mx-auto mt-12 max-w-4xl rounded-[2rem] border border-blue-400 bg-blue-600 p-7 shadow-2xl shadow-blue-600/25">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5">
                <div className="mb-5 inline-flex rounded-full bg-white px-4 py-1.5 text-xs font-black text-blue-700">PLANO DISPONÍVEL</div>
                <h3 className="text-3xl font-black">Plano Básico</h3>
                <p className="mt-3 text-blue-50">Recursos essenciais para operar vendas, estoque, financeiro e atendimento.</p>
                <div className="mt-7 flex items-end gap-2"><span className="text-5xl font-black">R$ 69,90</span><span className="mb-1 text-blue-100">/mês</span></div>
                <a href={whatsappUrl} target="_blank" className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-black text-blue-700 hover:bg-blue-50">Contratar pelo WhatsApp <ChevronRight size={18} /></a>
              </div>
              <div className="lg:col-span-7">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {planoBasico.map((item) => <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/10 p-3"><CheckCircle2 size={18} className="mt-0.5 text-white" /><p className="font-bold text-blue-50">{item}</p></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="suporte" className="bg-white py-20 text-slate-950">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-black text-blue-700">SUPORTE</p>
            <h2 className="mt-3 text-4xl font-black lg:text-5xl">Atendimento próximo para sua empresa não parar.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">Suporte via WhatsApp, implantação assistida e orientação para sua equipe usar o sistema com segurança.</p>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3"><SuporteCard icon={<Headphones />} titulo="Suporte" texto="Atendimento rápido." /><SuporteCard icon={<MessageCircle />} titulo="WhatsApp" texto="Contato direto." /><SuporteCard icon={<ShieldCheck />} titulo="Segurança" texto="Dados por empresa." /></div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl">
              <h3 className="text-3xl font-black">Fale com o suporte</h3><p className="mt-3 text-slate-300">Tire dúvidas, peça demonstração ou contrate o Plano Básico.</p>
              <div className="mt-6 space-y-3 text-slate-300"><p><strong className="text-white">WhatsApp:</strong> (98) 98876-1840</p><p><strong className="text-white">E-mail:</strong> {EMAIL_SUPORTE}</p><p><strong className="text-white">Horário:</strong> Segunda a sexta, 08h às 18h</p></div>
              <a href={whatsappUrl} target="_blank" className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-green-500 px-6 py-4 font-black text-white hover:bg-green-600"><MessageCircle size={20} /> Chamar no WhatsApp</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 md:flex-row">
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} Th Cloud. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-sm font-bold text-slate-400"><Link href="/login" className="hover:text-white">Área do Cliente</Link><a href="#plano" className="hover:text-white">Plano Básico</a><a href={whatsappUrl} target="_blank" className="hover:text-white">WhatsApp</a></div>
        </div>
      </footer>
    </main>
  );
}

function Metrica({ numero, texto }: { numero: string; texto: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-2xl font-black">{numero}</p><p className="text-xs font-bold text-slate-400">{texto}</p></div>;
}

function PainelCard({ icon, titulo, valor }: { icon: React.ReactNode; titulo: string; valor: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5"><div className="flex items-center justify-between"><div className="text-blue-300">{icon}</div><span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-black text-green-300">online</span></div><p className="mt-4 text-sm font-bold text-slate-400">{titulo}</p><p className="text-2xl font-black">{valor}</p></div>;
}

function ResumoCaixa({ valor, texto }: { valor: string; texto: string }) {
  return <div className="rounded-2xl bg-white/15 p-3"><p className="text-2xl font-black">{valor}</p><p className="text-xs text-blue-100">{texto}</p></div>;
}

function SuporteCard({ icon, titulo, texto }: { icon: React.ReactNode; titulo: string; texto: string }) {
  return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">{icon}</div><h3 className="text-lg font-black">{titulo}</h3><p className="mt-1 text-sm text-slate-600">{texto}</p></div>;
}
