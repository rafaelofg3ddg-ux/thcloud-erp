"use client";

import { useRouter } from "next/navigation";

export default function BloqueadoPage() {
  const router = useRouter();

  function voltarLogin() {
    sessionStorage.removeItem("th_usuario");
    sessionStorage.removeItem("th_empresa");
    sessionStorage.removeItem("th_permissoes");

    localStorage.removeItem("th_usuario");
    localStorage.removeItem("th_empresa");
    localStorage.removeItem("th_permissoes");
    localStorage.removeItem("empresa_id");
    localStorage.removeItem("th_empresa_id");

    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-10 text-center">
        <div className="text-7xl mb-6">🚫</div>

        <h1 className="text-4xl font-black text-red-600 mb-4">
          Empresa Bloqueada
        </h1>

        <p className="text-slate-700 text-lg leading-8 mb-8">
          Sua empresa encontra-se bloqueada por falta de pagamento, assinatura
          cancelada ou inativação administrativa.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
          <p className="font-bold text-red-700">
            Para continuar utilizando o THCloud ERP, entre em contato com o
            suporte e regularize sua assinatura.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={voltarLogin}
            className="bg-slate-700 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold"
          >
            Voltar ao Login
          </button>

          <a
            href="https://wa.me/5598988761840"
            target="_blank"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold"
          >
            Contatar Suporte
          </a>
        </div>
      </div>
    </div>
  );
}