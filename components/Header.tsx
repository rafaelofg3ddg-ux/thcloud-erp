"use client";

import { useEffect, useState } from "react";

type UsuarioLogado = {
  nome: string;
  email: string;
  perfil: string;
};

export default function Header() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [dataHora, setDataHora] = useState("");

  useEffect(() => {
    const salvo = localStorage.getItem("th_usuario");

    if (salvo) {
      setUsuario(JSON.parse(salvo));
    }

    function atualizarRelogio() {
      setDataHora(
        new Date().toLocaleString("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        })
      );
    }

    atualizarRelogio();

    const intervalo = setInterval(atualizarRelogio, 1000);

    return () => clearInterval(intervalo);
  }, []);

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          THCloud ERP
        </h2>

        <p className="text-sm text-slate-500">
          Sistema de gestão inteligente para varejo
        </p>
      </div>

      <div className="hidden lg:flex items-center w-full max-w-xl mx-10">
        <input
          placeholder="Pesquisar no sistema..."
          className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:block text-right">
          <p className="text-sm font-semibold text-slate-900">
            {usuario?.nome || "Usuário"}
          </p>

          <p className="text-xs text-slate-500">
            {usuario?.perfil || "Perfil"} • {dataHora}
          </p>
        </div>

        <button className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xl">
          🔔
        </button>

        <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
          {(usuario?.nome || "U").charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
