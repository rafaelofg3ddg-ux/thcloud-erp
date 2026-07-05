"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronRight, ShoppingCart, Stethoscope } from "lucide-react";

export default function AreaClientePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 to-white text-slate-900">
      <div className="pointer-events-none absolute -right-28 -top-20 select-none opacity-[0.05]" aria-hidden="true">
        <Image src="/logo-thclinica.png" alt="" width={560} height={560} className="rotate-12" />
      </div>
      <div className="pointer-events-none absolute -left-28 bottom-0 select-none opacity-[0.05]" aria-hidden="true">
        <Image src="/logo-thclinica.png" alt="" width={560} height={560} className="-rotate-12" />
      </div>

      <header className="relative border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
            <ArrowLeft size={18} /> Voltar para o site
          </Link>
          <p className="text-sm font-black text-slate-400">TH SISTEMAS</p>
        </div>
      </header>

      <section className="relative mx-auto max-w-5xl px-5 py-20">
        <div className="text-center">
          <p className="font-black text-sky-600">ÁREA DO CLIENTE</p>
          <h1 className="mt-3 text-4xl font-black text-slate-900 lg:text-5xl">Qual sistema você quer acessar?</h1>
          <p className="mt-4 text-lg text-slate-600">Escolha abaixo o produto da sua empresa.</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {/* TH CLOUD */}
          <Link
            href="/login"
            className="group relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500 shadow-lg shadow-sky-500/30">
              <ShoppingCart size={30} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Th Cloud</h2>
            <p className="mt-2 text-sm font-bold text-sky-600">Sistema de gestão para varejo</p>
            <p className="mt-4 leading-6 text-slate-500">PDV, estoque, financeiro, clientes e relatórios para empresas de varejo e serviços.</p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 font-black text-white group-hover:bg-sky-600">
              Entrar no Th Cloud <ChevronRight size={18} />
            </div>
          </Link>

          {/* TH CLINICA */}
          <a
            href="/clinica.html"
            className="group relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-100"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500 shadow-lg shadow-teal-500/30">
              <Stethoscope size={30} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Th Clínica</h2>
            <p className="mt-2 text-sm font-bold text-teal-700">Sistema de gestão para clínicas</p>
            <p className="mt-4 leading-6 text-slate-500">Agenda, prontuário eletrônico, financeiro e atendimento para clínicas médicas e odontológicas.</p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 font-black text-white group-hover:bg-teal-600">
              Entrar no Th Clínica <ChevronRight size={18} />
            </div>
          </a>
        </div>

        <p className="mt-14 text-center text-sm text-slate-500">
          Não sabe qual é o sistema da sua empresa?{" "}
          <a href="https://wa.me/5598988761840" target="_blank" className="font-bold text-slate-900 underline">
            Fale com o suporte
          </a>
        </p>
      </section>
    </main>
  );
}
