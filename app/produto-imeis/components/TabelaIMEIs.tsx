"use client";

import { Edit, History, Printer, Trash2 } from "lucide-react";
import type { ProdutoImeisHook, ProdutoImei } from "../hooks/useProdutoImeis";

export function TabelaIMEIs({ imei }: { imei: ProdutoImeisHook }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            IMEIs Cadastrados
          </h2>
          <p className="text-slate-500">
            {imei.imeisFiltrados.length} registro(s)
          </p>
        </div>

        {imei.carregando && (
          <div className="text-blue-700 font-black">Carregando...</div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px]">
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="p-4 text-left">Produto</th>
              <th className="p-4 text-left">IMEI</th>
              <th className="p-4 text-left">Cliente</th>
              <th className="p-4 text-left">Detalhes</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Venda</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>

          <tbody>
            {imei.imeisFiltrados.map((item) => (
              <Linha key={item.id} item={item} imei={imei} />
            ))}

            {imei.imeisFiltrados.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-500">
                  Nenhum IMEI encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Linha({
  item,
  imei,
}: {
  item: ProdutoImei;
  imei: ProdutoImeisHook;
}) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="p-4">
        <p className="font-black text-slate-900">
          {item.produtos?.nome || "Produto"}
        </p>

        <p className="text-xs text-slate-500">
          Código: {item.produtos?.codigo || "-"} • {imei.dinheiro(item.produtos?.preco_venda)}
        </p>
      </td>

      <td className="p-4">
        <p className="font-black text-slate-900">{item.imei}</p>

        <p className="text-xs text-slate-500">
          IMEI 2: {item.imei_2 || "-"}
        </p>
      </td>

      <td className="p-4">
        <p className="font-bold text-slate-800">
          {item.clientes?.nome || "-"}
        </p>

        <p className="text-xs text-slate-500">
          {item.clientes?.whatsapp || item.clientes?.cpf_cnpj || ""}
        </p>
      </td>

      <td className="p-4 text-slate-700">
        <p>Série: {item.numero_serie || "-"}</p>

        <p className="text-xs text-slate-500">
          {item.cor || "-"} {item.capacidade ? `• ${item.capacidade}` : ""}
        </p>
      </td>

      <td className="p-4 text-center">
        <select
          value={item.status}
          onChange={(e) => imei.alterarStatus(item, e.target.value)}
          className={`px-3 py-2 rounded-xl text-xs font-black border-0 ${imei.statusClasse(item.status)}`}
        >
          {imei.statusOpcoes.map((status) => (
            <option key={status.codigo} value={status.codigo}>
              {status.nome}
            </option>
          ))}
        </select>
      </td>

      <td className="p-4 text-center text-slate-700 font-bold">
        {item.data_venda ? new Date(item.data_venda).toLocaleDateString("pt-BR") : "-"}
      </td>

      <td className="p-4">
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => imei.abrirEdicao(item)}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-2 rounded-xl font-black"
            title="Alterar"
          >
            <Edit size={16} />
          </button>

          <button
            type="button"
            onClick={() => imei.abrirHistorico(item)}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-xl font-black"
            title="Histórico"
          >
            <History size={16} />
          </button>

          <button
            type="button"
            onClick={() => imei.imprimirEtiqueta(item)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-black"
            title="Etiqueta"
          >
            <Printer size={16} />
          </button>

          <button
            type="button"
            onClick={() => imei.excluirImei(item)}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-xl font-black"
            title="Excluir"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}
