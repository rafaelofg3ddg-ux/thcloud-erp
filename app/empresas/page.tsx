"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Camera,
  CheckCircle,
  Edit,
  FileText,
  ImagePlus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getEmpresaId, salvarEmpresaStorage } from "../../lib/empresa";

type Empresa = {
  id: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  tipo_pessoa: string | null;
  cpf: string | null;
  cnpj: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  cnae: string | null;
  regime_tributario: string | null;
  status: string | null;
  telefone: string | null;
  celular: string | null;
  whatsapp: string | null;
  email: string | null;
  site: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  complemento: string | null;
  logo_url: string | null;
  created_at?: string | null;
};

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null);
  const [modal, setModal] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [salvando, setSalvando] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [form, setForm] = useState<any>({
    razao_social: "",
    nome_fantasia: "",
    tipo_pessoa: "juridica",
    cpf: "",
    cnpj: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    cnae: "",
    regime_tributario: "Simples Nacional",
    status: "Ativa",
    telefone: "",
    celular: "",
    whatsapp: "",
    email: "",
    site: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    complemento: "",
    logo_url: "",
  });

  function empresaAtualId() {
    const empresaId = getEmpresaId();

    if (!empresaId) {
      alert("Empresa não identificada. Faça login novamente.");
      return null;
    }

    return empresaId;
  }

  function alterarCampo(campo: string, valor: string) {
    setForm((atual: any) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function documentoEmpresa(empresa: Empresa | null) {
    if (!empresa) return "-";

    if (empresa.tipo_pessoa === "fisica") {
      return empresa.cpf || "-";
    }

    return empresa.cnpj || "-";
  }

  async function carregarEmpresa() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    const { data, error } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", empresaId)
      .maybeSingle();

    if (error) {
      alert("Erro ao carregar empresa: " + error.message);
      return;
    }

    if (!data) {
      setEmpresas([]);
      return;
    }

    setEmpresas([data as Empresa]);
    salvarEmpresaStorage(data);
  }

  function abrirEditar(empresa: Empresa) {
    setEmpresaEditando(empresa);

    setForm({
      razao_social: empresa.razao_social || "",
      nome_fantasia: empresa.nome_fantasia || "",
      tipo_pessoa: empresa.tipo_pessoa || "juridica",
      cpf: empresa.cpf || "",
      cnpj: empresa.cnpj || "",
      inscricao_estadual: empresa.inscricao_estadual || "",
      inscricao_municipal: empresa.inscricao_municipal || "",
      cnae: empresa.cnae || "",
      regime_tributario: empresa.regime_tributario || "Simples Nacional",
      status: empresa.status || "Ativa",
      telefone: empresa.telefone || "",
      celular: empresa.celular || "",
      whatsapp: empresa.whatsapp || "",
      email: empresa.email || "",
      site: empresa.site || "",
      cep: empresa.cep || "",
      endereco: empresa.endereco || "",
      numero: empresa.numero || "",
      bairro: empresa.bairro || "",
      cidade: empresa.cidade || "",
      estado: empresa.estado || "",
      complemento: empresa.complemento || "",
      logo_url: empresa.logo_url || "",
    });

    setModal(true);
  }

  async function buscarCep() {
    const cepLimpo = String(form.cep || "").replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
      alert("Informe um CEP válido com 8 números.");
      return;
    }

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await resposta.json();

      if (dados.erro) {
        alert("CEP não encontrado.");
        return;
      }

      setForm((atual: any) => ({
        ...atual,
        endereco: dados.logradouro || atual.endereco,
        bairro: dados.bairro || atual.bairro,
        cidade: dados.localidade || atual.cidade,
        estado: dados.uf || atual.estado,
      }));
    } catch {
      alert("Não foi possível consultar o CEP agora.");
    }
  }

  async function uploadLogo(arquivo: File) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;

    if (!arquivo) return;

    const formatosPermitidos = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

    if (!formatosPermitidos.includes(arquivo.type)) {
      alert("Formato inválido. Use PNG, JPG, JPEG ou WEBP.");
      return;
    }

    setUploadingLogo(true);

    const extensao = arquivo.name.split(".").pop() || "png";
    const caminho = `${empresaId}/logo-${Date.now()}.${extensao}`;

    const { error } = await supabase.storage.from("logos").upload(caminho, arquivo, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      alert("Erro ao enviar logo: " + error.message);
      setUploadingLogo(false);
      return;
    }

    const { data } = supabase.storage.from("logos").getPublicUrl(caminho);

    alterarCampo("logo_url", data.publicUrl);

    setUploadingLogo(false);

    alert("Logo carregada com sucesso. Agora clique em Salvar Alterações.");
  }

  async function salvarEmpresa() {
    if (!empresaEditando) return;

    if (!form.nome_fantasia && !form.razao_social) {
      alert("Informe pelo menos Nome Fantasia ou Razão Social.");
      return;
    }

    if (form.tipo_pessoa === "fisica" && !form.cpf) {
      alert("Informe o CPF.");
      return;
    }

    if (form.tipo_pessoa === "juridica" && !form.cnpj) {
      alert("Informe o CNPJ.");
      return;
    }

    setSalvando(true);

    const registro = {
      razao_social: form.razao_social || null,
      nome_fantasia: form.nome_fantasia || null,
      tipo_pessoa: form.tipo_pessoa || "juridica",
      cpf: form.tipo_pessoa === "fisica" ? form.cpf || null : null,
      cnpj: form.tipo_pessoa === "juridica" ? form.cnpj || null : null,
      inscricao_estadual: form.inscricao_estadual || null,
      inscricao_municipal: form.inscricao_municipal || null,
      cnae: form.cnae || null,
      regime_tributario: form.regime_tributario || null,
      status: form.status || "Ativa",
      telefone: form.telefone || null,
      celular: form.celular || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      site: form.site || null,
      cep: form.cep || null,
      endereco: form.endereco || null,
      numero: form.numero || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      complemento: form.complemento || null,
      logo_url: form.logo_url || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("empresas")
      .update(registro)
      .eq("id", empresaEditando.id)
      .select("*")
      .single();

    if (error) {
      alert("Erro ao salvar empresa: " + error.message);
      setSalvando(false);
      return;
    }

    salvarEmpresaStorage(data);

    alert("Empresa atualizada com sucesso! A logo já será usada nos cupons e relatórios.");

    setModal(false);
    setSalvando(false);
    await carregarEmpresa();
  }

  const empresasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase();

    return empresas.filter((empresa) => {
      const bateBusca =
        empresa.razao_social?.toLowerCase().includes(termo) ||
        empresa.nome_fantasia?.toLowerCase().includes(termo) ||
        empresa.cnpj?.toLowerCase().includes(termo) ||
        empresa.cpf?.toLowerCase().includes(termo) ||
        empresa.cidade?.toLowerCase().includes(termo);

      const bateStatus = filtroStatus === "todos" || empresa.status === filtroStatus;

      return bateBusca && bateStatus;
    });
  }, [empresas, busca, filtroStatus]);

  const empresaPrincipal = empresas[0] || null;

  useEffect(() => {
    carregarEmpresa();
  }, []);

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="bg-blue-800 rounded-3xl p-8 text-white mb-8 shadow-lg">
        <p className="font-black text-blue-100">Th Cloud</p>

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <h1 className="text-4xl font-black mt-2">Minha Empresa</h1>
            <p className="text-blue-100 mt-2">
              Cadastre dados fiscais, CPF/CNPJ, contatos, endereço e logo da empresa.
            </p>

            <p className="text-blue-100 mt-2">
              Empresa atual:{" "}
              <strong>
                {empresaPrincipal?.nome_fantasia || empresaPrincipal?.razao_social || "-"}
              </strong>
            </p>
          </div>

          {empresaPrincipal?.logo_url ? (
            <div className="bg-white rounded-3xl p-4 h-28 w-44 flex items-center justify-center">
              <img
                src={empresaPrincipal.logo_url}
                alt="Logo da empresa"
                className="max-h-24 max-w-40 object-contain"
              />
            </div>
          ) : (
            <div className="bg-blue-700 rounded-3xl p-5 h-28 w-44 flex flex-col items-center justify-center">
              <Camera />
              <span className="text-sm mt-2">Sem logo</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <Resumo titulo="Total de Empresas" valor={`${empresas.length}`} subtitulo="Empresas visíveis" icone={<Building2 />} />
        <Resumo titulo="Empresa Ativa" valor={empresaPrincipal?.status || "-"} subtitulo="Status atual" icone={<CheckCircle />} />
        <Resumo titulo="Documento" valor={documentoEmpresa(empresaPrincipal)} subtitulo={empresaPrincipal?.tipo_pessoa === "fisica" ? "CPF cadastrado" : "CNPJ cadastrado"} icone={<FileText />} />
        <Resumo titulo="Logo" valor={empresaPrincipal?.logo_url ? "Sim" : "Não"} subtitulo="Usada em cupons e relatórios" icone={<ImagePlus />} />
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3 relative">
            <Search size={18} className="absolute left-4 top-4 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, razão social, CPF, CNPJ, cidade..."
              className="w-full border border-slate-300 rounded-2xl pl-11 pr-4 py-3 text-slate-900 font-semibold"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border border-slate-300 rounded-2xl px-4 py-3 text-slate-900 font-semibold bg-white"
          >
            <option value="todos">Todos os status</option>
            <option value="Ativa">Ativa</option>
            <option value="Inativa">Inativa</option>
            <option value="Bloqueada">Bloqueada</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Lista de Empresas</h2>
            <p className="text-slate-500">{empresasFiltradas.length} empresa(s) encontrada(s)</p>
          </div>

          <button
            onClick={carregarEmpresa}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-3 rounded-2xl font-black flex items-center gap-2"
          >
            <RefreshCw size={17} /> Atualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th className="p-4 text-left">Empresa</th>
                <th className="p-4 text-left">CPF/CNPJ</th>
                <th className="p-4 text-left">Cidade/UF</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-left">Criado em</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>

            <tbody>
              {empresasFiltradas.map((empresa) => (
                <tr key={empresa.id} className="border-t border-slate-100">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                        {empresa.logo_url ? (
                          <img src={empresa.logo_url} alt="Logo" className="h-full w-full object-contain p-1" />
                        ) : (
                          <span className="bg-orange-700 text-white h-full w-full flex items-center justify-center font-black">
                            {(empresa.nome_fantasia || empresa.razao_social || "E").charAt(0)}
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="font-black text-slate-900">
                          {empresa.nome_fantasia || empresa.razao_social || "-"}
                        </p>

                        <p className="text-sm text-slate-500">{empresa.razao_social || "-"}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-slate-700 font-semibold">{documentoEmpresa(empresa)}</td>

                  <td className="p-4 text-slate-700">
                    {[empresa.cidade, empresa.estado].filter(Boolean).join(" / ") || "-"}
                  </td>

                  <td className="p-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-black ${
                        empresa.status === "Ativa"
                          ? "bg-green-100 text-green-700"
                          : empresa.status === "Bloqueada"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {empresa.status || "Ativa"}
                    </span>
                  </td>

                  <td className="p-4 text-slate-600">{formatarData(empresa.created_at)}</td>

                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => abrirEditar(empresa)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-xl font-black"
                      >
                        <Edit size={17} />
                      </button>

                      <button
                        onClick={() =>
                          alert("Por segurança, empresa só pode ser excluída pelo dono do sistema no painel Super Admin.")
                        }
                        className="bg-red-50 text-red-600 px-3 py-2 rounded-xl font-black"
                        title="Exclusão bloqueada"
                      >
                        <ShieldAlert size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {empresasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && empresaEditando && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl max-h-[94vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-start justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Editar Empresa</h2>
                <p className="text-slate-500">
                  Preencha os dados cadastrais, fiscais, contato, endereço e logo.
                </p>
              </div>

              <button
                onClick={() => setModal(false)}
                className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black"
              >
                <X />
              </button>
            </div>

            <div className="p-6 space-y-8">
              <section>
                <h3 className="text-xl font-black text-slate-900 mb-4">Dados Cadastrais</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Campo titulo="Tipo de Pessoa">
                    <select
                      value={form.tipo_pessoa}
                      onChange={(e) => alterarCampo("tipo_pessoa", e.target.value)}
                      className="input"
                    >
                      <option value="juridica">Pessoa Jurídica / CNPJ</option>
                      <option value="fisica">Pessoa Física / CPF</option>
                    </select>
                  </Campo>

                  <Campo titulo={form.tipo_pessoa === "fisica" ? "CPF" : "CNPJ"}>
                    <input
                      value={form.tipo_pessoa === "fisica" ? form.cpf : form.cnpj}
                      onChange={(e) =>
                        alterarCampo(form.tipo_pessoa === "fisica" ? "cpf" : "cnpj", e.target.value)
                      }
                      placeholder={form.tipo_pessoa === "fisica" ? "000.000.000-00" : "00.000.000/0001-00"}
                      className="input"
                    />
                  </Campo>

                  <Campo titulo="Status">
                    <select
                      value={form.status}
                      onChange={(e) => alterarCampo("status", e.target.value)}
                      className="input"
                    >
                      <option>Ativa</option>
                      <option>Inativa</option>
                      <option>Bloqueada</option>
                    </select>
                  </Campo>

                  <Campo titulo="Razão Social / Nome Completo" className="md:col-span-2">
                    <input
                      value={form.razao_social}
                      onChange={(e) => alterarCampo("razao_social", e.target.value)}
                      placeholder="Razão Social ou Nome Completo"
                      className="input"
                    />
                  </Campo>

                  <Campo titulo="Nome Fantasia">
                    <input
                      value={form.nome_fantasia}
                      onChange={(e) => alterarCampo("nome_fantasia", e.target.value)}
                      placeholder="Nome Fantasia"
                      className="input"
                    />
                  </Campo>

                  <Campo titulo="Inscrição Estadual">
                    <input
                      value={form.inscricao_estadual}
                      onChange={(e) => alterarCampo("inscricao_estadual", e.target.value)}
                      placeholder="Inscrição Estadual"
                      className="input"
                    />
                  </Campo>

                  <Campo titulo="Inscrição Municipal">
                    <input
                      value={form.inscricao_municipal}
                      onChange={(e) => alterarCampo("inscricao_municipal", e.target.value)}
                      placeholder="Inscrição Municipal"
                      className="input"
                    />
                  </Campo>

                  <Campo titulo="CNAE">
                    <input
                      value={form.cnae}
                      onChange={(e) => alterarCampo("cnae", e.target.value)}
                      placeholder="CNAE"
                      className="input"
                    />
                  </Campo>

                  <Campo titulo="Regime Tributário">
                    <select
                      value={form.regime_tributario}
                      onChange={(e) => alterarCampo("regime_tributario", e.target.value)}
                      className="input"
                    >
                      <option>Simples Nacional</option>
                      <option>Lucro Presumido</option>
                      <option>Lucro Real</option>
                      <option>MEI</option>
                      <option>Isento</option>
                    </select>
                  </Campo>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-black text-slate-900 mb-4">Contato</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Campo titulo="Telefone">
                    <input value={form.telefone} onChange={(e) => alterarCampo("telefone", e.target.value)} placeholder="(99) 9999-9999" className="input" />
                  </Campo>

                  <Campo titulo="Celular">
                    <input value={form.celular} onChange={(e) => alterarCampo("celular", e.target.value)} placeholder="(99) 99999-9999" className="input" />
                  </Campo>

                  <Campo titulo="WhatsApp">
                    <input value={form.whatsapp} onChange={(e) => alterarCampo("whatsapp", e.target.value)} placeholder="(99) 99999-9999" className="input" />
                  </Campo>

                  <Campo titulo="E-mail">
                    <input value={form.email} onChange={(e) => alterarCampo("email", e.target.value)} placeholder="empresa@email.com" className="input" />
                  </Campo>

                  <Campo titulo="Site" className="md:col-span-2">
                    <input value={form.site} onChange={(e) => alterarCampo("site", e.target.value)} placeholder="www.empresa.com.br" className="input" />
                  </Campo>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-black text-slate-900 mb-4">Endereço</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Campo titulo="CEP">
                    <div className="flex gap-2">
                      <input value={form.cep} onChange={(e) => alterarCampo("cep", e.target.value)} placeholder="00000-000" className="input" />
                      <button onClick={buscarCep} className="bg-slate-900 hover:bg-slate-800 text-white px-4 rounded-xl font-black">
                        OK
                      </button>
                    </div>
                  </Campo>

                  <Campo titulo="Endereço" className="md:col-span-2">
                    <input value={form.endereco} onChange={(e) => alterarCampo("endereco", e.target.value)} placeholder="Rua / Avenida" className="input" />
                  </Campo>

                  <Campo titulo="Número">
                    <input value={form.numero} onChange={(e) => alterarCampo("numero", e.target.value)} placeholder="Nº" className="input" />
                  </Campo>

                  <Campo titulo="Bairro">
                    <input value={form.bairro} onChange={(e) => alterarCampo("bairro", e.target.value)} placeholder="Bairro" className="input" />
                  </Campo>

                  <Campo titulo="Cidade">
                    <input value={form.cidade} onChange={(e) => alterarCampo("cidade", e.target.value)} placeholder="Cidade" className="input" />
                  </Campo>

                  <Campo titulo="Estado">
                    <input value={form.estado} onChange={(e) => alterarCampo("estado", e.target.value)} placeholder="UF" className="input" />
                  </Campo>

                  <Campo titulo="Complemento">
                    <input value={form.complemento} onChange={(e) => alterarCampo("complemento", e.target.value)} placeholder="Complemento" className="input" />
                  </Campo>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-black text-slate-900 mb-4">Logo da Empresa</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex items-center justify-center min-h-44">
                    {form.logo_url ? (
                      <img src={form.logo_url} alt="Logo" className="max-h-36 max-w-full object-contain" />
                    ) : (
                      <div className="text-center text-slate-500">
                        <ImagePlus className="mx-auto mb-2" />
                        <p className="font-bold">Nenhuma logo enviada</p>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 bg-blue-50 border border-blue-100 rounded-3xl p-5">
                    <p className="font-black text-blue-900">
                      Adicionar logo direto do computador
                    </p>

                    <p className="text-sm text-blue-700 mt-2">
                      Escolha uma imagem em PNG, JPG, JPEG ou WEBP. Depois clique em Salvar Alterações.
                    </p>

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => {
                        const arquivo = e.target.files?.[0];

                        if (arquivo) {
                          uploadLogo(arquivo);
                        }
                      }}
                      className="mt-5 block w-full border border-slate-300 rounded-2xl p-3 text-slate-900 bg-white font-semibold"
                    />

                    {uploadingLogo && (
                      <p className="text-blue-700 font-bold mt-3">Enviando logo...</p>
                    )}

                    {form.logo_url && (
                      <div className="mt-4 bg-white rounded-2xl p-4 border border-blue-100">
                        <p className="font-black text-slate-900 mb-2">Pré-visualização:</p>
                        <img src={form.logo_url} alt="Logo" className="h-24 object-contain" />
                      </div>
                    )}

                    <p className="text-sm text-slate-500 mt-4">
                      Essa logo será usada automaticamente nos cupons, romaneios e relatórios que puxam os dados da empresa.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-slate-200 flex flex-col md:flex-row justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => setModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-6 py-3 rounded-2xl font-black"
              >
                Cancelar
              </button>

              <button
                onClick={salvarEmpresa}
                disabled={salvando}
                className={`px-6 py-3 rounded-2xl font-black text-white flex items-center justify-center gap-2 ${
                  salvando ? "bg-slate-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800"
                }`}
              >
                <Save size={18} />
                {salvando ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>

            <style jsx global>{`
              .input {
                width: 100%;
                border: 1px solid rgb(203 213 225);
                border-radius: 1rem;
                padding: 0.75rem;
                color: rgb(15 23 42);
                background: white;
                font-weight: 600;
                outline: none;
              }

              .input:focus {
                border-color: rgb(37 99 235);
                box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}

function Campo({
  titulo,
  children,
  className = "",
}: {
  titulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-black text-slate-700 mb-2">{titulo}</label>
      {children}
    </div>
  );
}

function Resumo({
  titulo,
  valor,
  subtitulo,
  icone,
}: {
  titulo: string;
  valor: string;
  subtitulo: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 font-bold">{titulo}</p>
          <p className="text-2xl font-black text-blue-700 mt-2 break-words">{valor}</p>
          <p className="text-sm text-slate-500 mt-2">{subtitulo}</p>
        </div>

        <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
          {icone}
        </div>
      </div>
    </div>
  );
}
