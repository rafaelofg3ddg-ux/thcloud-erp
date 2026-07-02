"use client";

import { abrirCadastroPopup } from "../../../components/global/THSystemStandards";

import { CheckCircle2, ClipboardList, Loader2, Search, UserPlus, Wrench, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { Cliente, EquipamentoCliente, OrdemServicoHook } from "../hooks/useOrdemServico";
import CamposSegmentoOS from "./CamposSegmentoOS";
import { ProdutoOS } from "./ProdutoOS";
import { ServicoOS } from "./ServicoOS";

function maiusculo(valor: string) {
  return valor.toLocaleUpperCase("pt-BR");
}

function nomeEquipamento(equipamento: EquipamentoCliente) {
  const nome = `${equipamento.tipo || ""} ${equipamento.marca || ""} ${equipamento.modelo || ""}`.trim() || "EQUIPAMENTO";
  if (equipamento.imei_1) return `${nome} - IMEI ${equipamento.imei_1}`.toLocaleUpperCase("pt-BR");
  if (equipamento.placa) return `${nome} - PLACA ${equipamento.placa}`.toLocaleUpperCase("pt-BR");
  if (equipamento.numero_serie) return `${nome} - SÉRIE ${equipamento.numero_serie}`.toLocaleUpperCase("pt-BR");
  return nome.toLocaleUpperCase("pt-BR");
}

export function ModalNovaOrdemServico({ os }: { os: OrdemServicoHook }) {
  const [popupCliente, setPopupCliente] = useState(false);
  const [popupEquipamento, setPopupEquipamento] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [buscaEquipamento, setBuscaEquipamento] = useState("");
  const [fotoTipo, setFotoTipo] = useState("ANTES");
  const [fotoUrl, setFotoUrl] = useState("");
  const [fotoDescricao, setFotoDescricao] = useState("");

  const clientesFiltrados = useMemo(() => {
    const termo = buscaCliente.toLowerCase().trim();
    return os.clientes
      .filter((cliente) => {
        const texto = `${cliente.nome || ""} ${cliente.cpf_cnpj || ""} ${cliente.whatsapp || ""}`.toLowerCase();
        return !termo || texto.includes(termo);
      })
      .slice(0, 30);
  }, [os.clientes, buscaCliente]);

  const equipamentosFiltrados = useMemo(() => {
    const termo = buscaEquipamento.toLowerCase().trim();
    return os.equipamentosCliente
      .filter((equipamento) => {
        const texto = `${equipamento.tipo || ""} ${equipamento.marca || ""} ${equipamento.modelo || ""} ${equipamento.numero_serie || ""} ${equipamento.imei_1 || ""} ${equipamento.imei_2 || ""} ${equipamento.placa || ""} ${equipamento.chassi || ""}`.toLowerCase();
        return !termo || texto.includes(termo);
      })
      .slice(0, 30);
  }, [os.equipamentosCliente, buscaEquipamento]);

  function selecionarCliente(cliente: Cliente) {
    os.setClienteId(cliente.id);
    os.setClientePesquisa(maiusculo(cliente.nome));
    os.carregarEquipamentosDoCliente(cliente.id);
    setPopupCliente(false);
    setBuscaCliente("");
  }

  function selecionarEquipamento(equipamento: EquipamentoCliente) {
    os.selecionarEquipamento(equipamento);
    os.setEquipamentoBusca(nomeEquipamento(equipamento));
    setPopupEquipamento(false);
    setBuscaEquipamento("");
  }

  function adicionarFoto() {
    os.adicionarFotoOS({
      tipo: fotoTipo,
      url: fotoUrl,
      descricao: maiusculo(fotoDescricao),
    });
    setFotoUrl("");
    setFotoDescricao("");
  }

  const fotos = os.fotosOS();

  return (
    <div data-no-uppercase="true" className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[94vh] overflow-y-auto">
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 p-5 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <ClipboardList size={26} />
              {os.ordemEditando ? "Alterar Ordem de Serviço" : "Nova Ordem de Serviço"}
            </h2>
            <p className="text-slate-500">Selecione o cliente, escolha o equipamento e informe os dados do atendimento.</p>
          </div>
          <button type="button" onClick={() => os.setModalNova(false)} className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black">
            <X size={20} className="mx-auto" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <Secao titulo="Cliente">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-7 relative">
                <input value={os.clientePesquisa} readOnly placeholder="SELECIONE UM CLIENTE" className="input-os pr-12 uppercase" />
                <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <button type="button" onClick={() => { setPopupCliente(true); setBuscaCliente(os.clientePesquisa || ""); }} className="lg:col-span-3 bg-slate-900 hover:bg-slate-950 text-white rounded-2xl font-black px-4 py-3 flex items-center justify-center gap-2">
                <Search size={18} /> Pesquisar
              </button>
              <button type="button" onClick={() => abrirCadastroPopup("/clientes", "Novo Cliente")} className="lg:col-span-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black px-4 py-3 flex items-center justify-center gap-2">
                <UserPlus size={18} /> Novo Cliente
              </button>
            </div>
          </Secao>

          <Secao titulo="Equipamento do cliente">
            {!os.clienteId ? (
              <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-4 text-yellow-800 font-bold">Selecione o cliente para carregar os equipamentos cadastrados.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                  <div className="lg:col-span-9 relative">
                    <input value={os.equipamentoBusca || os.equipamentoNome} readOnly placeholder="SELECIONE UM EQUIPAMENTO" className="input-os pr-12 uppercase" />
                    <Wrench size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <button type="button" onClick={() => { setPopupEquipamento(true); setBuscaEquipamento(""); }} className="lg:col-span-3 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl font-black px-4 py-3 flex items-center justify-center gap-2">
                    <Search size={18} /> Pesquisar Equipamento
                  </button>
                </div>

                {os.equipamentoId && (
                  <div className="mt-3 rounded-2xl bg-blue-50 border border-blue-200 p-4">
                    <p className="font-black text-blue-900">Equipamento selecionado: {os.equipamentoNome}</p>
                    <p className="text-sm text-blue-700 mt-1">Os dados do equipamento foram carregados automaticamente.</p>
                  </div>
                )}

                {os.equipamentosCliente.length === 0 && (
                  <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-slate-600 font-bold">Este cliente ainda não possui equipamentos cadastrados. Cadastre em Cadastros &gt; Equipamentos.</div>
                )}
              </>
            )}
          </Secao>

          <Secao titulo="Dados principais do atendimento">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input value={os.tipoEquipamento} onChange={(e) => os.setTipoEquipamento(maiusculo(e.target.value))} placeholder="TIPO" className="input-os uppercase" />
              <input value={os.marca} onChange={(e) => os.setMarca(maiusculo(e.target.value))} placeholder="MARCA" className="input-os uppercase" />
              <input value={os.modelo} onChange={(e) => os.setModelo(maiusculo(e.target.value))} placeholder="MODELO" className="input-os uppercase" />
              <input value={os.numeroSerie} onChange={(e) => os.setNumeroSerie(maiusculo(e.target.value))} placeholder="NÚMERO DE SÉRIE" className="input-os uppercase" />
            </div>
          </Secao>

          <CamposSegmentoOS segmento={os.segmentoEmpresa} segmentoNome={os.segmentoNome} dados={os.dadosSegmento} setDados={os.setDadosSegmento} />

          <Secao titulo="Checklist do equipamento">
            <p className="text-sm font-bold text-slate-500 mb-3">Marque os itens conferidos na entrada. O checklist será salvo junto com a OS e aparecerá no PDF.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {os.checklistAtual().map((item) => (
                <label key={item.chave} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-800 cursor-pointer hover:bg-blue-50 hover:border-blue-200">
                  <input
                    type="checkbox"
                    checked={os.checklistMarcado(item.chave)}
                    onChange={(e) => os.setChecklistMarcado(item.chave, e.target.checked)}
                    className="h-5 w-5 accent-blue-700"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </Secao>

          <Secao titulo="Fotos da OS">
            <p className="text-sm font-bold text-slate-500 mb-3">Informe links de fotos do equipamento. Use fotos de entrada, andamento e finalização para registrar o atendimento.</p>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <select value={fotoTipo} onChange={(e) => setFotoTipo(e.target.value)} className="input-os lg:col-span-2">
                <option value="ANTES">Antes</option>
                <option value="DURANTE">Durante</option>
                <option value="DEPOIS">Depois</option>
              </select>
              <input value={fotoUrl} onChange={(e) => setFotoUrl(e.target.value)} placeholder="LINK DA FOTO" className="input-os lg:col-span-5" />
              <input value={fotoDescricao} onChange={(e) => setFotoDescricao(maiusculo(e.target.value))} placeholder="DESCRIÇÃO" className="input-os uppercase lg:col-span-3" />
              <button type="button" onClick={adicionarFoto} className="lg:col-span-2 bg-blue-700 hover:bg-blue-800 text-white rounded-2xl font-black px-4 py-3">Adicionar Foto</button>
            </div>

            {fotos.length > 0 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {fotos.map((foto, index) => (
                  <div key={`${foto.url}-${index}`} className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
                    <img src={foto.url} alt="Foto da OS" className="w-full h-36 object-cover bg-slate-200" />
                    <div className="p-3">
                      <p className="font-black text-slate-900">{foto.tipo}</p>
                      {foto.descricao && <p className="text-sm text-slate-600 font-bold mt-1">{foto.descricao}</p>}
                      <button type="button" onClick={() => os.removerFotoOS(index)} className="mt-3 text-red-600 font-black text-sm">Remover</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Secao>

          <Secao titulo="Defeito e diagnóstico">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <textarea value={os.defeitoRelatado} onChange={(e) => os.setDefeitoRelatado(maiusculo(e.target.value))} placeholder="DEFEITO RELATADO PELO CLIENTE" className="input-os min-h-28 uppercase" />
              <textarea value={os.acessoriosDeixados} onChange={(e) => os.setAcessoriosDeixados(maiusculo(e.target.value))} placeholder="ACESSÓRIOS / ITENS DEIXADOS" className="input-os min-h-28 uppercase" />
              <textarea value={os.diagnostico} onChange={(e) => os.setDiagnostico(maiusculo(e.target.value))} placeholder="DIAGNÓSTICO TÉCNICO" className="input-os min-h-28 uppercase" />
              <textarea value={os.solucao} onChange={(e) => os.setSolucao(maiusculo(e.target.value))} placeholder="SOLUÇÃO / SERVIÇO A EXECUTAR" className="input-os min-h-28 uppercase" />
              <textarea value={os.observacoesTecnicas} onChange={(e) => os.setObservacoesTecnicas(maiusculo(e.target.value))} placeholder="OBSERVAÇÕES TÉCNICAS" className="input-os min-h-28 lg:col-span-2 uppercase" />
            </div>
          </Secao>

          <ProdutoOS os={os} />
          <ServicoOS os={os} />

          <Secao titulo="Finalização">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select value={os.status} onChange={(e) => os.setStatus(e.target.value)} className="input-os">
                {os.statusOptions.map((status) => <option key={status} value={status}>{os.statusLabel(status)}</option>)}
              </select>
              <select value={os.prioridade} onChange={(e) => os.setPrioridade(e.target.value)} className="input-os">
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
              <input type="datetime-local" value={os.dataPrevisao} onChange={(e) => os.setDataPrevisao(e.target.value)} className="input-os" />
              <input value={os.garantiaDias} onChange={(e) => os.setGarantiaDias(e.target.value)} placeholder="GARANTIA DIAS" className="input-os" />
              <input value={os.desconto} onChange={(e) => os.setDesconto(e.target.value)} placeholder="DESCONTO R$" className="input-os" />
            </div>
            <textarea value={os.observacao} onChange={(e) => os.setObservacao(maiusculo(e.target.value))} placeholder="OBSERVAÇÃO GERAL" className="input-os mt-3 min-h-24 uppercase" />
            <div className="mt-4 bg-slate-900 text-white rounded-3xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
              <ResumoEscuro titulo="Produtos" valor={os.dinheiro(os.totalProdutos())} />
              <ResumoEscuro titulo="Serviços" valor={os.dinheiro(os.totalServicos())} />
              <ResumoEscuro titulo="Desconto" valor={os.dinheiro(os.numero(os.desconto))} />
              <ResumoEscuro titulo="Total OS" valor={os.dinheiro(os.totalOS())} destaque />
            </div>
          </Secao>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-5 flex flex-col md:flex-row justify-end gap-3 rounded-b-3xl">
          <button type="button" onClick={() => os.setModalNova(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-2xl font-black">Cancelar</button>
          <button type="button" onClick={os.salvarOS} disabled={os.salvando} className={`px-8 py-3 rounded-2xl font-black text-white flex items-center justify-center gap-2 ${os.salvando ? "bg-slate-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800"}`}>
            {os.salvando ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            {os.salvando ? "Salvando..." : os.ordemEditando ? "Salvar Alterações" : "Salvar OS"}
          </button>
        </div>
      </div>

      {popupCliente && (
        <PopupBase titulo="Pesquisar Cliente" onFechar={() => setPopupCliente(false)}>
          <CampoBusca valor={buscaCliente} setValor={setBuscaCliente} placeholder="PESQUISAR POR NOME, CPF/CNPJ OU TELEFONE" />
          <div className="max-h-[55vh] overflow-y-auto border border-slate-200 rounded-2xl overflow-hidden mt-4">
            {clientesFiltrados.map((cliente) => (
              <button key={cliente.id} type="button" onClick={() => selecionarCliente(cliente)} className="w-full text-left p-4 hover:bg-blue-50 border-b border-slate-100">
                <p className="font-black text-slate-900 uppercase">{cliente.nome}</p>
                <p className="text-xs text-slate-500 mt-1">{cliente.cpf_cnpj || "-"} • {cliente.whatsapp || "-"}</p>
              </button>
            ))}
            {clientesFiltrados.length === 0 && <div className="p-8 text-center text-slate-500 font-bold">Nenhum cliente encontrado.</div>}
          </div>
          <div className="mt-4 flex justify-end"><button type="button" onClick={() => abrirCadastroPopup("/clientes", "Novo Cliente")} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-black">+ Novo Cliente</button></div>
        </PopupBase>
      )}

      {popupEquipamento && (
        <PopupBase titulo="Pesquisar Equipamento" onFechar={() => setPopupEquipamento(false)}>
          <CampoBusca valor={buscaEquipamento} setValor={setBuscaEquipamento} placeholder="PESQUISAR POR EQUIPAMENTO, IMEI, PLACA, SÉRIE OU CHASSI" />
          <div className="max-h-[55vh] overflow-y-auto border border-slate-200 rounded-2xl overflow-hidden mt-4">
            {equipamentosFiltrados.map((equipamento) => (
              <button key={equipamento.id} type="button" onClick={() => selecionarEquipamento(equipamento)} className="w-full text-left p-4 hover:bg-blue-50 border-b border-slate-100 flex items-start gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0"><Wrench size={18} /></div>
                <div className="min-w-0"><p className="font-black text-slate-900 uppercase">{nomeEquipamento(equipamento)}</p><p className="text-xs text-slate-500 mt-1">{equipamento.segmento_nome || "Geral"}{equipamento.garantia_ate ? ` • Garantia até ${new Date(equipamento.garantia_ate).toLocaleDateString("pt-BR")}` : ""}</p></div>
              </button>
            ))}
            {equipamentosFiltrados.length === 0 && <div className="p-8 text-center text-slate-500 font-bold">Nenhum equipamento encontrado para este cliente.</div>}
          </div>
          <div className="mt-4 flex justify-end"><button type="button" onClick={() => abrirCadastroPopup("/equipamentos", "Novo Equipamento")} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-black">+ Novo Equipamento</button></div>
        </PopupBase>
      )}

      <style jsx global>{`
        .input-os { width: 100%; border: 1px solid rgb(203 213 225); border-radius: 1rem; padding: 0.75rem 1rem; color: rgb(15 23 42); background: white; font-weight: 700; outline: none; }
        .input-os:focus { border-color: rgb(37 99 235); box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12); }
      `}</style>
    </div>
  );
}

function CampoBusca({ valor, setValor, placeholder }: { valor: string; setValor: (valor: string) => void; placeholder: string }) {
  return <div className="relative"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={valor} onChange={(e) => setValor(maiusculo(e.target.value))} placeholder={placeholder} className="input-os pl-12 uppercase" autoFocus /></div>;
}

function PopupBase({ titulo, children, onFechar }: { titulo: string; children: ReactNode; onFechar: () => void }) {
  return <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4"><div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden"><div className="p-5 border-b border-slate-200 flex items-center justify-between"><h2 className="text-2xl font-black text-slate-900">{titulo}</h2><button type="button" onClick={onFechar} className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"><X size={20} className="mx-auto" /></button></div><div className="p-5">{children}</div></div></div>;
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return <section className="border border-slate-200 rounded-3xl p-4 bg-white"><h3 className="font-black text-slate-900 mb-4 text-lg">{titulo}</h3>{children}</section>;
}

function ResumoEscuro({ titulo, valor, destaque = false }: { titulo: string; valor: string; destaque?: boolean }) {
  return <div><p className="text-slate-300 font-bold text-sm">{titulo}</p><p className={`${destaque ? "text-3xl text-green-400" : "text-2xl text-white"} font-black`}>{valor}</p></div>;
}