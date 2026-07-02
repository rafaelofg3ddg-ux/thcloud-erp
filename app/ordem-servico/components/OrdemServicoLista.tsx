"use client";

import { Ban, CheckCircle2, Clock3, Edit, FileText, Link, Loader2, MessageCircle, PackageCheck, Printer, ShieldCheck, ShoppingCart, Smartphone, Truck, X } from "lucide-react";
import type { HistoricoOrdemServico, OrdemServico } from "../hooks/useOrdemServico";

export function OrdemServicoLista({
  ordens,
  carregando,
  gerandoOrcamento,
  statusOptions,
  statusLabel,
  statusClasse,
  dinheiro,
  numOS,
  imprimir,
  gerarOrcamento,
  abrirEdicaoOS,
  alterarStatus,
  enviarWhatsApp,
  enviarWhatsAppAprovacao,
  aprovarOrcamentoCliente,
  recusarOrcamentoCliente,
  notificarEquipamentoPronto,
  registrarEntregaOS,
  imprimirComprovanteEntrega,
  imprimirTermoGarantia,
  copiarLinkOS,
  enviarParaPdv,
  enviandoPdv,
  carregarHistoricoOS,
  modalHistorico,
  ordemHistorico,
  historicoOS,
  carregandoHistorico,
  fecharHistoricoOS,
}: {
  ordens: OrdemServico[];
  carregando: boolean;
  gerandoOrcamento: string | null;
  statusOptions: string[];
  statusLabel: (valor: string) => string;
  statusClasse: (valor: string) => string;
  dinheiro: (valor: unknown) => string;
  dataBR: (valor: string | null | undefined) => string;
  numOS: (valor: number | null | undefined) => string;
  imprimir: (ordem: OrdemServico) => void;
  gerarOrcamento: (ordem: OrdemServico) => void;
  abrirEdicaoOS: (ordem: OrdemServico) => void;
  alterarStatus: (ordem: OrdemServico, status: string) => void;
  enviarWhatsApp: (ordem: OrdemServico) => void;
  enviarWhatsAppAprovacao: (ordem: OrdemServico) => void;
  aprovarOrcamentoCliente: (ordem: OrdemServico) => void;
  recusarOrcamentoCliente: (ordem: OrdemServico) => void;
  notificarEquipamentoPronto: (ordem: OrdemServico) => void;
  registrarEntregaOS: (ordem: OrdemServico) => void;
  imprimirComprovanteEntrega: (ordem: OrdemServico) => void;
  imprimirTermoGarantia: (ordem: OrdemServico) => void;
  copiarLinkOS: (ordem: OrdemServico) => void;
  enviarParaPdv: (ordem: OrdemServico) => void;
  enviandoPdv: string | null;
  carregarHistoricoOS: (ordem: OrdemServico) => void;
  modalHistorico: boolean;
  ordemHistorico: OrdemServico | null;
  historicoOS: HistoricoOrdemServico[];
  carregandoHistorico: boolean;
  fecharHistoricoOS: () => void;
}) {
  return (
    <>
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Ordens Cadastradas</h2>
          <p className="text-slate-500">{ordens.length} registro(s)</p>
        </div>

        {carregando && (
          <div className="flex items-center gap-2 text-blue-700 font-bold">
            <Loader2 size={18} className="animate-spin" /> Carregando
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px]">
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="p-4 text-left">OS</th>
              <th className="p-4 text-left">Cliente</th>
              <th className="p-4 text-left">Equipamento</th>
              <th className="p-4 text-left">Defeito</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>

          <tbody>
            {ordens.map((ordem) => (
              <tr key={ordem.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4">
                  <p className="font-black text-blue-700">#{numOS(ordem.numero_os)}</p>
                  {ordem.assistencia_celular && (
                    <p className="text-xs text-emerald-700 font-black flex items-center gap-1 mt-1">
                      <Smartphone size={13} /> Celular
                    </p>
                  )}
                </td>

                <td className="p-4">
                  <p className="font-black text-slate-900">{ordem.clientes?.nome || "Cliente"}</p>
                  <p className="text-xs text-slate-500">
                    {ordem.clientes?.whatsapp || ordem.clientes?.cpf_cnpj || "-"}
                  </p>
                </td>

                <td className="p-4 text-slate-800">
                  <p className="font-bold">
                    {ordem.tipo_equipamento || "-"} {ordem.marca || ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {ordem.modelo || "-"} {ordem.imei_1 ? `• IMEI: ${ordem.imei_1}` : ""}
                  </p>
                </td>

                <td className="p-4 text-slate-700 max-w-xs truncate">
                  {ordem.defeito_relatado || "-"}
                </td>

                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${statusClasse(ordem.status)}`}>
                    {statusLabel(ordem.status)}
                  </span>
                </td>

                <td className="p-4 text-right font-black text-slate-900">
                  {dinheiro(ordem.valor_total)}
                </td>

                <td className="p-4">
                  <div className="flex justify-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => abrirEdicaoOS(ordem)}
                      className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-2 rounded-xl font-black flex items-center gap-1"
                      title="Alterar OS"
                    >
                      <Edit size={16} />
                      <span className="hidden xl:inline">Alterar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => gerarOrcamento(ordem)}
                      disabled={gerandoOrcamento === ordem.id}
                      className={`px-3 py-2 rounded-xl font-black flex items-center gap-1 ${
                        gerandoOrcamento === ordem.id
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                      }`}
                      title="Gerar orçamento"
                    >
                      {gerandoOrcamento === ordem.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <FileText size={16} />
                      )}
                      <span className="hidden xl:inline">Orçamento</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => enviarParaPdv(ordem)}
                      disabled={enviandoPdv === ordem.id}
                      className={`px-3 py-2 rounded-xl font-black flex items-center gap-1 ${
                        enviandoPdv === ordem.id
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-violet-100 hover:bg-violet-200 text-violet-800"
                      }`}
                      title="Enviar para o PDV"
                    >
                      {enviandoPdv === ordem.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ShoppingCart size={16} />
                      )}
                      <span className="hidden xl:inline">PDV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => carregarHistoricoOS(ordem)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl font-black flex items-center gap-1"
                      title="Histórico da OS"
                    >
                      <Clock3 size={16} />
                      <span className="hidden xl:inline">Histórico</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => imprimir(ordem)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-xl font-black"
                      title="Imprimir OS"
                    >
                      <Printer size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => enviarWhatsAppAprovacao(ordem)}
                      className="bg-lime-100 hover:bg-lime-200 text-lime-800 px-3 py-2 rounded-xl font-black flex items-center gap-1"
                      title="Enviar aprovação pelo WhatsApp"
                    >
                      <MessageCircle size={16} />
                      <span className="hidden 2xl:inline">Aprovação</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => aprovarOrcamentoCliente(ordem)}
                      className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3 py-2 rounded-xl font-black"
                      title="Marcar como aprovado pelo cliente"
                    >
                      <CheckCircle2 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => recusarOrcamentoCliente(ordem)}
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-xl font-black"
                      title="Marcar como recusado pelo cliente"
                    >
                      <Ban size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => notificarEquipamentoPronto(ordem)}
                      className="bg-cyan-100 hover:bg-cyan-200 text-cyan-800 px-3 py-2 rounded-xl font-black"
                      title="Avisar cliente que o equipamento está pronto"
                    >
                      <PackageCheck size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => registrarEntregaOS(ordem)}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl font-black"
                      title="Registrar entrega da OS"
                    >
                      <Truck size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => imprimirComprovanteEntrega(ordem)}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-2 rounded-xl font-black"
                      title="Imprimir comprovante de entrega"
                    >
                      <FileText size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => imprimirTermoGarantia(ordem)}
                      className="bg-pink-100 hover:bg-pink-200 text-pink-800 px-3 py-2 rounded-xl font-black"
                      title="Imprimir termo de garantia"
                    >
                      <ShieldCheck size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => enviarWhatsApp(ordem)}
                      className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-2 rounded-xl font-black"
                      title="Enviar pelo WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => copiarLinkOS(ordem)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-xl font-black"
                      title="Copiar link da OS"
                    >
                      <Link size={16} />
                    </button>

                    <select
                      value={ordem.status}
                      onChange={(e) => alterarStatus(ordem, e.target.value)}
                      className="border border-slate-300 rounded-xl px-2 text-slate-900 font-bold"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}

            {ordens.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-500">
                  Nenhuma ordem encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {modalHistorico && (
      <div className="fixed inset-0 z-[130] bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Timeline da Ordem de Serviço</h2>
              <p className="text-slate-500 font-bold">
                OS Nº {numOS(ordemHistorico?.numero_os)} • {ordemHistorico?.clientes?.nome || "Cliente"}
              </p>
            </div>
            <button
              type="button"
              onClick={fecharHistoricoOS}
              className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"
            >
              <X size={20} className="mx-auto" />
            </button>
          </div>

          <div className="p-5 max-h-[70vh] overflow-y-auto">
            {carregandoHistorico ? (
              <div className="flex items-center gap-2 text-blue-700 font-black">
                <Loader2 size={18} className="animate-spin" /> Carregando histórico
              </div>
            ) : historicoOS.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 text-slate-600 font-bold text-center">
                Nenhum histórico registrado para esta OS.
              </div>
            ) : (
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-blue-100" />
                {historicoOS.map((item) => (
                  <div key={item.id} className="relative mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="absolute -left-[23px] top-5 h-4 w-4 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-slate-900">{item.descricao || item.acao || "Movimentação registrada"}</p>
                        <p className="text-sm text-slate-500 font-bold mt-1">
                          {item.created_at ? new Date(item.created_at).toLocaleString("pt-BR") : "-"}
                          {item.usuario ? ` • ${item.usuario}` : ""}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${statusClasse(item.status_novo || item.status_anterior || "aberta")}`}>
                        {statusLabel(item.status_novo || item.status_anterior || "aberta")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
