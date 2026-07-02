"use client";

import { Smartphone } from "lucide-react";
import { useProdutoImeis } from "./hooks/useProdutoImeis";
import { FiltroIMEIs } from "./components/FiltroIMEIs";
import { TabelaIMEIs } from "./components/TabelaIMEIs";
import { ModalNovoIMEI } from "./components/ModalNovoIMEI";
import { ModalHistoricoIMEI } from "./components/ModalHistoricoIMEI";

export default function ProdutoImeisPage() {
  const imei = useProdutoImeis();

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-8">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-6 lg:p-8 text-white shadow-lg mb-6">
        <p className="text-blue-100 font-bold">Th Cloud</p>

        <h1 className="text-3xl lg:text-4xl font-black mt-2 flex items-center gap-3">
          <Smartphone size={36} />
          Controle de IMEI
        </h1>

        <p className="text-blue-100 mt-2 max-w-4xl">
          Controle individual de celulares por IMEI, com histórico, status, vínculo com produto, venda e cliente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <CardResumo titulo="Total" valor={imei.imeis.length} />
        <CardResumo titulo="Disponíveis" valor={imei.totalDisponivel} />
        <CardResumo titulo="Vendidos" valor={imei.totalVendido} />
        <CardResumo titulo="Reservados" valor={imei.totalReservado} />
      </div>

      <FiltroIMEIs imei={imei} />

      <TabelaIMEIs imei={imei} />

      {imei.modalAberto && <ModalNovoIMEI imei={imei} />}

      {imei.modalHistoricoAberto && <ModalHistoricoIMEI imei={imei} />}

      <style jsx global>{`
        .input-imei {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          color: rgb(15 23 42);
          background: white;
          font-weight: 700;
          outline: none;
        }

        .input-imei:focus {
          border-color: rgb(37 99 235);
          box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
        }
      `}</style>
    </div>
  );
}

function CardResumo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <p className="text-sm font-black text-slate-500">{titulo}</p>
      <p className="text-3xl font-black text-blue-800 mt-2">{valor}</p>
    </div>
  );
}
