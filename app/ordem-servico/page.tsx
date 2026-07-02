"use client";

import { useOrdemServico } from "./hooks/useOrdemServico";
import { OrdemServicoHeader } from "./components/OrdemServicoHeader";
import { OrdemServicoResumo } from "./components/OrdemServicoResumo";
import { OrdemServicoFiltros } from "./components/OrdemServicoFiltros";
import { OrdemServicoLista } from "./components/OrdemServicoLista";
import { ModalNovaOrdemServico } from "./components/ModalNovaOrdemServico";

export default function OrdemServicoPage() {
  const os = useOrdemServico();

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-8">
      <OrdemServicoHeader />

      <OrdemServicoResumo
        totalOrdens={os.ordens.length}
        totalAberto={os.totalAberto}
        totalFiltrado={os.ordensFiltradas.length}
        dinheiro={os.dinheiro}
      />

      <OrdemServicoFiltros
        pesquisa={os.pesquisa}
        setPesquisa={os.setPesquisa}
        filtroStatus={os.filtroStatus}
        setFiltroStatus={os.setFiltroStatus}
        statusOptions={os.statusOptions}
        statusLabel={os.statusLabel}
        carregarDados={os.carregarDados}
        abrirNovaOS={os.abrirNovaOS}
      />

      <OrdemServicoLista
        ordens={os.ordensFiltradas}
        carregando={os.carregando}
        gerandoOrcamento={os.gerandoOrcamento}
        statusOptions={os.statusOptions}
        statusLabel={os.statusLabel}
        statusClasse={os.statusClasse}
        dinheiro={os.dinheiro}
        dataBR={os.dataBR}
        numOS={os.numOS}
        imprimir={os.imprimir}
        gerarOrcamento={os.gerarOrcamento}
        abrirEdicaoOS={os.abrirEdicaoOS}
        alterarStatus={os.alterarStatus}
        enviarWhatsApp={os.enviarWhatsApp}
        enviarWhatsAppAprovacao={os.enviarWhatsAppAprovacao}
        aprovarOrcamentoCliente={os.aprovarOrcamentoCliente}
        recusarOrcamentoCliente={os.recusarOrcamentoCliente}
        notificarEquipamentoPronto={os.notificarEquipamentoPronto}
        registrarEntregaOS={os.registrarEntregaOS}
        imprimirComprovanteEntrega={os.imprimirComprovanteEntrega}
        imprimirTermoGarantia={os.imprimirTermoGarantia}
        copiarLinkOS={os.copiarLinkOS}
        enviarParaPdv={os.enviarParaPdv}
        enviandoPdv={os.enviandoPdv}
        carregarHistoricoOS={os.carregarHistoricoOS}
        modalHistorico={os.modalHistorico}
        ordemHistorico={os.ordemHistorico}
        historicoOS={os.historicoOS}
        carregandoHistorico={os.carregandoHistorico}
        fecharHistoricoOS={os.fecharHistoricoOS}
      />

      {os.modalNova && <ModalNovaOrdemServico os={os} />}
    </div>
  );
}
