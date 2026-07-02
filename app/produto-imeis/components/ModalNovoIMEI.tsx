"use client";

import { abrirCadastroPopup } from "../../../components/global/THSystemStandards";

import { CheckCircle2, Loader2, PackageSearch, Search, Smartphone, UserPlus, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { Cliente, Produto, ProdutoImeisHook } from "../hooks/useProdutoImeis";

function maiusculo(valor: string) {
  return valor.toLocaleUpperCase("pt-BR");
}

export function ModalNovoIMEI({ imei }: { imei: ProdutoImeisHook }) {
  const [popupProduto, setPopupProduto] = useState(false);
  const [popupCliente, setPopupCliente] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [buscaCliente, setBuscaCliente] = useState("");

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.toLowerCase().trim();
    return imei.produtos
      .filter((produto) => {
        const texto = `${produto.codigo || ""} ${produto.codigo_barras || ""} ${produto.nome || ""}`.toLowerCase();
        return !termo || texto.includes(termo);
      })
      .slice(0, 40);
  }, [imei.produtos, buscaProduto]);

  const clientesFiltrados = useMemo(() => {
    const termo = buscaCliente.toLowerCase().trim();
    return imei.clientes
      .filter((cliente) => {
        const texto = `${cliente.nome || ""} ${cliente.cpf_cnpj || ""} ${cliente.whatsapp || ""}`.toLowerCase();
        return !termo || texto.includes(termo);
      })
      .slice(0, 40);
  }, [imei.clientes, buscaCliente]);

  function selecionarProduto(produto: Produto) {
    imei.setProdutoId(produto.id);
    imei.setProdutoBusca(maiusculo(produto.nome));
    setPopupProduto(false);
    setBuscaProduto("");
  }

  function selecionarCliente(cliente: Cliente) {
    imei.setClienteId(cliente.id);
    imei.setClienteBusca(maiusculo(cliente.nome));
    setPopupCliente(false);
    setBuscaCliente("");
  }

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 p-5 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Smartphone size={24} />
              {imei.editando ? "Alterar IMEI" : "Novo IMEI"}
            </h2>
            <p className="text-slate-500">Vincule o IMEI ao produto/celular do estoque.</p>
          </div>

          <button type="button" onClick={() => { imei.setModalAberto(false); imei.limparFormulario(); }} className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black">
            <X size={20} className="mx-auto" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <section className="border border-slate-200 rounded-3xl p-4">
            <h3 className="font-black text-slate-900 mb-4">Produto / Celular</h3>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-8 relative">
                <input value={imei.produtoBusca} readOnly placeholder="SELECIONE O PRODUTO / CELULAR" className="input-imei pr-12 uppercase" />
                <PackageSearch size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <button type="button" onClick={() => { setPopupProduto(true); setBuscaProduto(imei.produtoBusca || ""); }} className="lg:col-span-2 bg-slate-900 hover:bg-slate-950 text-white rounded-2xl font-black px-4 py-3 flex items-center justify-center gap-2">
                <Search size={18} /> Pesquisar
              </button>
              <button type="button" onClick={() => abrirCadastroPopup("/produtos", "Novo Produto")} className="lg:col-span-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black px-4 py-3">
                + Novo Produto
              </button>
            </div>
          </section>

          <section className="border border-slate-200 rounded-3xl p-4">
            <h3 className="font-black text-slate-900 mb-4">Cliente vinculado</h3>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-8 relative">
                <input value={imei.clienteBusca} readOnly placeholder="SELECIONE UM CLIENTE, SE DESEJAR" className="input-imei pr-12 uppercase" />
                <UserPlus size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <button type="button" onClick={() => { setPopupCliente(true); setBuscaCliente(imei.clienteBusca || ""); }} className="lg:col-span-2 bg-slate-900 hover:bg-slate-950 text-white rounded-2xl font-black px-4 py-3 flex items-center justify-center gap-2">
                <Search size={18} /> Pesquisar
              </button>
              <button type="button" onClick={() => abrirCadastroPopup("/clientes", "Novo Cliente")} className="lg:col-span-2 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black px-4 py-3">
                + Novo Cliente
              </button>
            </div>
          </section>

          <section className="border border-slate-200 rounded-3xl p-4">
            <h3 className="font-black text-slate-900 mb-4">Dados do aparelho</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input value={imei.imei} onChange={(e) => imei.setImei(e.target.value)} placeholder="IMEI PRINCIPAL" className="input-imei" />
              <input value={imei.imei2} onChange={(e) => imei.setImei2(e.target.value)} placeholder="IMEI 2" className="input-imei" />
              <input value={imei.numeroSerie} onChange={(e) => imei.setNumeroSerie(maiusculo(e.target.value))} placeholder="NÚMERO DE SÉRIE" className="input-imei uppercase" />
              <input value={imei.cor} onChange={(e) => imei.setCor(maiusculo(e.target.value))} placeholder="COR" className="input-imei uppercase" />
              <input value={imei.capacidade} onChange={(e) => imei.setCapacidade(maiusculo(e.target.value))} placeholder="CAPACIDADE. EX.: 128GB" className="input-imei uppercase" />
              <select value={imei.status} onChange={(e) => imei.setStatus(e.target.value)} className="input-imei bg-white">
                {imei.statusOpcoes.map((item) => <option key={item.codigo} value={item.codigo}>{item.nome}</option>)}
              </select>
            </div>
            <textarea value={imei.observacoes} onChange={(e) => imei.setObservacoes(maiusculo(e.target.value))} placeholder="OBSERVAÇÕES" className="input-imei min-h-24 mt-3 uppercase" />
          </section>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-5 flex flex-col md:flex-row justify-end gap-3 rounded-b-3xl">
          <button type="button" onClick={() => { imei.setModalAberto(false); imei.limparFormulario(); }} className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-2xl font-black">Cancelar</button>
          <button type="button" onClick={imei.salvarImei} disabled={imei.salvando} className={`px-8 py-3 rounded-2xl font-black text-white flex items-center justify-center gap-2 ${imei.salvando ? "bg-slate-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800"}`}>
            {imei.salvando ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
            {imei.salvando ? "Salvando..." : "Salvar IMEI"}
          </button>
        </div>
      </div>

      {popupProduto && (
        <Popup titulo="Pesquisar Produto" onFechar={() => setPopupProduto(false)}>
          <CampoBusca valor={buscaProduto} setValor={setBuscaProduto} placeholder="PESQUISAR POR CÓDIGO, BARRAS OU NOME" />
          <div className="max-h-[55vh] overflow-y-auto border border-slate-200 rounded-2xl overflow-hidden mt-4">
            {produtosFiltrados.map((produto) => (
              <button key={produto.id} type="button" onClick={() => selecionarProduto(produto)} className="w-full text-left p-4 hover:bg-blue-50 border-b border-slate-100 flex items-center justify-between gap-4">
                <div><p className="font-black text-slate-900 uppercase">{produto.codigo ? `${produto.codigo} - ` : ""}{produto.nome}</p><p className="text-xs text-slate-500 mt-1">Estoque: {Number(produto.qtd_atual || 0)} • {produto.controla_imei ? "Controla IMEI" : ""}</p></div>
                <b className="text-blue-700">{imei.dinheiro(produto.preco_venda)}</b>
              </button>
            ))}
            {produtosFiltrados.length === 0 && <div className="p-8 text-center text-slate-500 font-bold">Nenhum produto encontrado.</div>}
          </div>
          <div className="mt-4 flex justify-end"><button type="button" onClick={() => abrirCadastroPopup("/produtos", "Novo Produto")} className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-black">+ Novo Produto</button></div>
        </Popup>
      )}

      {popupCliente && (
        <Popup titulo="Pesquisar Cliente" onFechar={() => setPopupCliente(false)}>
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
        </Popup>
      )}
    </div>
  );
}

function CampoBusca({ valor, setValor, placeholder }: { valor: string; setValor: (valor: string) => void; placeholder: string }) {
  return <div className="relative"><Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={valor} onChange={(e) => setValor(maiusculo(e.target.value))} placeholder={placeholder} className="input-imei pl-12 uppercase" autoFocus /></div>;
}

function Popup({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-[120] bg-black/50 flex items-center justify-center p-4"><div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden"><div className="p-5 border-b border-slate-200 flex items-center justify-between"><h2 className="text-2xl font-black text-slate-900">{titulo}</h2><button type="button" onClick={onFechar} className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"><X size={20} className="mx-auto" /></button></div><div className="p-5">{children}</div></div></div>;
}