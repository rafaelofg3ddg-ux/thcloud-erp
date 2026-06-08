"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getEmpresaId } from "../../lib/empresa";

type Fornecedor = any;

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);

  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [contatoNome, setContatoNome] = useState("");
  const [prazoEntrega, setPrazoEntrega] = useState("");
  const [observacoes, setObservacoes] = useState("");

  function empresaAtualId() {
    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }

    return empresaId;
  }

  async function carregarFornecedores() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { data, error } = await supabase
      .from("fornecedores")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar fornecedores: " + error.message);
      return;
    }

    setFornecedores(data || []);
  }

  function limparFormulario() {
    setEditando(null);
    setRazaoSocial("");
    setNomeFantasia("");
    setCnpj("");
    setTelefone("");
    setWhatsapp("");
    setEmail("");
    setCep("");
    setRua("");
    setNumero("");
    setBairro("");
    setCidade("");
    setEstado("");
    setContatoNome("");
    setPrazoEntrega("");
    setObservacoes("");
  }

  function abrirNovoFornecedor() {
    limparFormulario();
    setModalAberto(true);
  }

  function abrirEditarFornecedor(fornecedor: Fornecedor) {
    setEditando(fornecedor);
    setRazaoSocial(fornecedor.razao_social || "");
    setNomeFantasia(fornecedor.nome_fantasia || "");
    setCnpj(fornecedor.cnpj || "");
    setTelefone(fornecedor.telefone || "");
    setWhatsapp(fornecedor.whatsapp || "");
    setEmail(fornecedor.email || "");
    setCep(fornecedor.cep || "");
    setRua(fornecedor.rua || "");
    setNumero(fornecedor.numero || "");
    setBairro(fornecedor.bairro || "");
    setCidade(fornecedor.cidade || "");
    setEstado(fornecedor.estado || "");
    setContatoNome(fornecedor.contato_nome || "");
    setPrazoEntrega(fornecedor.prazo_entrega || "");
    setObservacoes(fornecedor.observacoes || "");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    limparFormulario();
  }

  async function buscarCnpj() {
    const cnpjLimpo = cnpj.replace(/\D/g, "");

    if (cnpjLimpo.length !== 14) {
      alert("Digite um CNPJ válido com 14 números.");
      return;
    }

    try {
      const resposta = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`
      );

      if (!resposta.ok) {
        alert("CNPJ não encontrado.");
        return;
      }

      const dados = await resposta.json();

      setRazaoSocial(dados.razao_social || "");
      setNomeFantasia(dados.nome_fantasia || "");
      setTelefone(dados.ddd_telefone_1 || "");
      setEmail(dados.email || "");
      setCep(dados.cep || "");
      setRua(dados.logradouro || "");
      setNumero(dados.numero || "");
      setBairro(dados.bairro || "");
      setCidade(dados.municipio || "");
      setEstado(dados.uf || "");

      alert("Dados do CNPJ carregados com sucesso!");
    } catch {
      alert("Erro ao consultar CNPJ.");
    }
  }

  async function buscarCep() {
    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      alert("Digite um CEP válido com 8 números.");
      return;
    }

    try {
      const resposta = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      );

      const dados = await resposta.json();

      if (dados.erro) {
        alert("CEP não encontrado.");
        return;
      }

      setRua(dados.logradouro || "");
      setBairro(dados.bairro || "");
      setCidade(dados.localidade || "");
      setEstado(dados.uf || "");

      alert("Endereço carregado com sucesso!");
    } catch {
      alert("Erro ao consultar CEP.");
    }
  }

  async function salvarFornecedor() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!razaoSocial) {
      alert("Informe a razão social.");
      return;
    }

    const dados = {
      empresa_id: empresaId,
      razao_social: razaoSocial,
      nome_fantasia: nomeFantasia,
      cnpj,
      telefone,
      whatsapp,
      email,
      cep,
      rua,
      numero,
      bairro,
      cidade,
      estado,
      contato_nome: contatoNome,
      prazo_entrega: prazoEntrega,
      observacoes,
      ativo: true,
    };

    if (editando) {
      const { error } = await supabase
        .from("fornecedores")
        .update(dados)
        .eq("id", editando.id)
        .eq("empresa_id", empresaId);

      if (error) {
        alert("Erro ao alterar fornecedor: " + error.message);
        return;
      }

      alert("Fornecedor alterado com sucesso!");
    } else {
      const { error } = await supabase.from("fornecedores").insert([dados]);

      if (error) {
        alert("Erro ao salvar fornecedor: " + error.message);
        return;
      }

      alert("Fornecedor cadastrado com sucesso!");
    }

    fecharModal();
    carregarFornecedores();
  }

  async function excluirFornecedor(id: string) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!confirm("Deseja realmente excluir este fornecedor?")) return;

    const { error } = await supabase
      .from("fornecedores")
      .delete()
      .eq("id", id)
      .eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao excluir fornecedor: " + error.message);
      return;
    }

    alert("Fornecedor excluído com sucesso!");
    carregarFornecedores();
  }

  useEffect(() => {
    carregarFornecedores();
  }, []);

  const fornecedoresFiltrados = fornecedores.filter((fornecedor) =>
    fornecedor.razao_social?.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Fornecedores</h1>

        <button
          onClick={abrirNovoFornecedor}
          className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold"
        >
          + Novo Fornecedor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-900">
            Fornecedores Cadastrados
          </h2>

          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar fornecedor..."
            className="border border-slate-300 p-3 rounded-lg w-80 text-slate-900"
          />
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="p-3 text-left">Fornecedor</th>
              <th className="p-3 text-left">CNPJ</th>
              <th className="p-3 text-left">Telefone</th>
              <th className="p-3 text-left">Cidade</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>

          <tbody>
            {fornecedoresFiltrados.map((fornecedor) => (
              <tr key={fornecedor.id} className="border-b">
                <td className="p-3 font-medium text-slate-900">
                  {fornecedor.razao_social}
                </td>

                <td className="p-3 text-slate-800">{fornecedor.cnpj || "-"}</td>

                <td className="p-3 text-slate-800">
                  {fornecedor.telefone || "-"}
                </td>

                <td className="p-3 text-slate-800">
                  {fornecedor.cidade || "-"}
                </td>

                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => abrirEditarFornecedor(fornecedor)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                    >
                      Alterar
                    </button>

                    <button
                      onClick={() => excluirFornecedor(fornecedor.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {fornecedoresFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-700">
                  Nenhum fornecedor encontrado para esta empresa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-5xl p-6 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {editando ? "Alterar Fornecedor" : "Novo Fornecedor"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} placeholder="Razão Social" className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium" />
              <input value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} placeholder="Nome Fantasia" className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium" />

              <div className="flex gap-2">
                <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="CNPJ" className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 font-medium" />
                <button type="button" onClick={buscarCnpj} className="bg-slate-700 hover:bg-slate-800 text-white px-4 rounded-lg">🔍</button>
              </div>

              <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone" className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium" />
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium" />

              <div className="flex gap-2">
                <input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="CEP" className="w-full border border-slate-300 p-3 rounded-lg text-slate-900 font-medium" />
                <button type="button" onClick={buscarCep} className="bg-slate-700 hover:bg-slate-800 text-white px-4 rounded-lg">🔍</button>
              </div>

              <input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua" className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium" />
              <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Número" className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium" />
              <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium" />
              <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium" />
              <input value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Estado" className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium" />
              <input value={contatoNome} onChange={(e) => setContatoNome(e.target.value)} placeholder="Nome do Contato" className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium" />
              <input value={prazoEntrega} onChange={(e) => setPrazoEntrega(e.target.value)} placeholder="Prazo de Entrega" className="border border-slate-300 p-3 rounded-lg text-slate-900 font-medium" />

              <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações" className="md:col-span-2 border border-slate-300 p-3 rounded-lg text-slate-900 font-medium" />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={fecharModal} className="bg-slate-500 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold">Cancelar</button>
              <button onClick={salvarFornecedor} className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold">
                {editando ? "Salvar Alterações" : "Salvar Fornecedor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
