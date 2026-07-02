"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Edit, Loader2, RefreshCcw, Trash2, Wrench } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getEmpresaId } from "../../lib/empresa";
import { THButton, THInput, THModal, THSearch, THSelect, THStatus, THTextarea } from "../../components/global";

type Cliente = {
  id: string;
  nome: string;
  cpf_cnpj: string | null;
  whatsapp: string | null;
};

type Equipamento = {
  id: string;
  empresa_id: string;
  cliente_id: string | null;
  segmento: string;
  segmento_nome: string | null;
  tipo: string | null;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  imei_1: string | null;
  imei_2: string | null;
  placa: string | null;
  chassi: string | null;
  ano: string | null;
  km_atual: string | null;
  btus: string | null;
  gas: string | null;
  voltagem: string | null;
  dados_segmento: Record<string, any> | null;
  data_compra: string | null;
  garantia_dias: number | null;
  garantia_ate: string | null;
  status: string;
  observacoes: string | null;
  clientes?: Cliente | null;
};

const tiposEquipamento = ["Celular", "Notebook", "Desktop", "Tablet", "Impressora", "Veículo", "Moto", "Ar-condicionado", "Refrigerador", "Televisão", "Eletrônico", "Máquina", "Outro"];
const segmentos = [
  { codigo: "geral", nome: "Geral" },
  { codigo: "loja_celular", nome: "Loja de Celular" },
  { codigo: "informatica", nome: "Informática" },
  { codigo: "oficina_mecanica", nome: "Oficina Mecânica" },
  { codigo: "oficina_moto", nome: "Oficina de Moto" },
  { codigo: "auto_eletrica", nome: "Auto Elétrica" },
  { codigo: "refrigeracao", nome: "Refrigeração" },
  { codigo: "eletronicos", nome: "Eletrônicos" },
];

export default function EquipamentosPage() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroSegmento, setFiltroSegmento] = useState("todos");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Equipamento | null>(null);

  const [clienteId, setClienteId] = useState("");
  const [clienteBusca, setClienteBusca] = useState("");
  const [segmento, setSegmento] = useState("geral");
  const [tipo, setTipo] = useState("Outro");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [imei1, setImei1] = useState("");
  const [imei2, setImei2] = useState("");
  const [cor, setCor] = useState("");
  const [capacidade, setCapacidade] = useState("");
  const [senha, setSenha] = useState("");
  const [contaGoogle, setContaGoogle] = useState("");
  const [contaApple, setContaApple] = useState("");
  const [estadoTela, setEstadoTela] = useState("");
  const [estadoTampa, setEstadoTampa] = useState("");
  const [bateria, setBateria] = useState("");
  const [acessorios, setAcessorios] = useState("");
  const [placa, setPlaca] = useState("");
  const [chassi, setChassi] = useState("");
  const [renavam, setRenavam] = useState("");
  const [ano, setAno] = useState("");
  const [kmAtual, setKmAtual] = useState("");
  const [combustivel, setCombustivel] = useState("");
  const [motor, setMotor] = useState("");
  const [numeroMotor, setNumeroMotor] = useState("");
  const [btus, setBtus] = useState("");
  const [gas, setGas] = useState("");
  const [voltagem, setVoltagem] = useState("");
  const [potencia, setPotencia] = useState("");
  const [localInstalacao, setLocalInstalacao] = useState("");
  const [ultimaManutencao, setUltimaManutencao] = useState("");
  const [processador, setProcessador] = useState("");
  const [memoriaRam, setMemoriaRam] = useState("");
  const [armazenamento, setArmazenamento] = useState("");
  const [sistemaOperacional, setSistemaOperacional] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [dataCompra, setDataCompra] = useState("");
  const [garantiaDias, setGarantiaDias] = useState("90");
  const [status, setStatus] = useState("ativo");
  const [observacoes, setObservacoes] = useState("");

  function empresaAtualId() {
    const empresaId = getEmpresaId();
    if (!empresaId) alert("Empresa não identificada. Faça login novamente.");
    return empresaId;
  }

  function operadorAtual() {
    try {
      const s = sessionStorage.getItem("th_usuario") || localStorage.getItem("th_usuario");
      if (!s) return "Sistema";
      const u = JSON.parse(s);
      return u.nome || u.email || u.usuario || "Sistema";
    } catch {
      return "Sistema";
    }
  }

  function segmentoNome(codigo: string) {
    return segmentos.find((item) => item.codigo === codigo)?.nome || "Geral";
  }

  function nomeEquipamento(e: Equipamento) {
    const base = `${e.tipo || ""} ${e.marca || ""} ${e.modelo || ""}`.trim() || "Equipamento";
    if (e.imei_1) return `${base} - IMEI ${e.imei_1}`;
    if (e.placa) return `${base} - Placa ${e.placa}`;
    if (e.numero_serie) return `${base} - Série ${e.numero_serie}`;
    return base;
  }

  function limparFormulario() {
    setEditando(null);
    setClienteId("");
    setClienteBusca("");
    setSegmento("geral");
    setTipo("Outro");
    setMarca("");
    setModelo("");
    setNumeroSerie("");
    setImei1("");
    setImei2("");
    setCor("");
    setCapacidade("");
    setSenha("");
    setContaGoogle("");
    setContaApple("");
    setEstadoTela("");
    setEstadoTampa("");
    setBateria("");
    setAcessorios("");
    setPlaca("");
    setChassi("");
    setRenavam("");
    setAno("");
    setKmAtual("");
    setCombustivel("");
    setMotor("");
    setNumeroMotor("");
    setBtus("");
    setGas("");
    setVoltagem("");
    setPotencia("");
    setLocalInstalacao("");
    setUltimaManutencao("");
    setProcessador("");
    setMemoriaRam("");
    setArmazenamento("");
    setSistemaOperacional("");
    setPatrimonio("");
    setDataCompra("");
    setGarantiaDias("90");
    setStatus("ativo");
    setObservacoes("");
  }

  async function carregarDados() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;
    setCarregando(true);

    const [eqReq, cliReq] = await Promise.all([
      supabase.from("equipamentos_cliente").select("*, clientes:cliente_id(id,nome,cpf_cnpj,whatsapp)").eq("empresa_id", empresaId).order("created_at", { ascending: false }),
      supabase.from("clientes").select("id,nome,cpf_cnpj,whatsapp").eq("empresa_id", empresaId).order("nome"),
    ]);

    if (eqReq.error) alert("Erro ao carregar equipamentos: " + eqReq.error.message);
    if (cliReq.error) alert("Erro ao carregar clientes: " + cliReq.error.message);

    setEquipamentos((eqReq.data || []) as Equipamento[]);
    setClientes(cliReq.data || []);
    setCarregando(false);
  }

  function abrirNovo() {
    limparFormulario();
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    limparFormulario();
  }

  function abrirEdicao(e: Equipamento) {
    const d = e.dados_segmento || {};
    setEditando(e);
    setClienteId(e.cliente_id || "");
    setClienteBusca(e.clientes?.nome || "");
    setSegmento(e.segmento || "geral");
    setTipo(e.tipo || "Outro");
    setMarca(e.marca || "");
    setModelo(e.modelo || "");
    setNumeroSerie(e.numero_serie || "");
    setImei1(e.imei_1 || d.imei_1 || "");
    setImei2(e.imei_2 || d.imei_2 || "");
    setCor(d.cor || "");
    setCapacidade(d.capacidade || "");
    setSenha(d.senha || "");
    setContaGoogle(d.conta_google || "");
    setContaApple(d.conta_apple || "");
    setEstadoTela(d.estado_tela || "");
    setEstadoTampa(d.estado_tampa || "");
    setBateria(d.bateria || "");
    setAcessorios(d.acessorios || "");
    setPlaca(e.placa || d.placa || "");
    setChassi(e.chassi || d.chassi || "");
    setRenavam(d.renavam || "");
    setAno(e.ano || d.ano || "");
    setKmAtual(e.km_atual || d.km_atual || "");
    setCombustivel(d.combustivel || "");
    setMotor(d.motor || "");
    setNumeroMotor(d.numero_motor || "");
    setBtus(e.btus || d.btus || "");
    setGas(e.gas || d.gas || "");
    setVoltagem(e.voltagem || d.voltagem || "");
    setPotencia(d.potencia || "");
    setLocalInstalacao(d.local_instalacao || "");
    setUltimaManutencao(d.ultima_manutencao || "");
    setProcessador(d.processador || "");
    setMemoriaRam(d.memoria_ram || "");
    setArmazenamento(d.armazenamento || "");
    setSistemaOperacional(d.sistema_operacional || "");
    setPatrimonio(d.patrimonio || "");
    setDataCompra(e.data_compra || "");
    setGarantiaDias(String(e.garantia_dias || 90));
    setStatus(e.status || "ativo");
    setObservacoes(e.observacoes || "");
    setModalAberto(true);
  }

  function montarDadosSegmento() {
    return {
      cor,
      capacidade,
      senha,
      conta_google: contaGoogle,
      conta_apple: contaApple,
      estado_tela: estadoTela,
      estado_tampa: estadoTampa,
      bateria,
      acessorios,
      renavam,
      combustivel,
      motor,
      numero_motor: numeroMotor,
      potencia,
      local_instalacao: localInstalacao,
      ultima_manutencao: ultimaManutencao,
      processador,
      memoria_ram: memoriaRam,
      armazenamento,
      sistema_operacional: sistemaOperacional,
      patrimonio,
    };
  }

  async function salvarEquipamento() {
    const empresaId = empresaAtualId();
    if (!empresaId) return;
    if (!clienteId) {
      alert("Selecione o cliente.");
      return;
    }
    if (!tipo.trim() && !marca.trim() && !modelo.trim() && !imei1.trim() && !placa.trim()) {
      alert("Informe pelo menos tipo, marca, modelo, IMEI ou placa.");
      return;
    }

    setSalvando(true);
    const payload = {
      empresa_id: empresaId,
      cliente_id: clienteId,
      segmento,
      segmento_nome: segmentoNome(segmento),
      tipo: tipo.trim() || null,
      marca: marca.trim() || null,
      modelo: modelo.trim() || null,
      numero_serie: numeroSerie.trim() || null,
      imei_1: imei1.trim() || null,
      imei_2: imei2.trim() || null,
      placa: placa.trim().toUpperCase() || null,
      chassi: chassi.trim() || null,
      ano: ano.trim() || null,
      km_atual: kmAtual.trim() || null,
      btus: btus.trim() || null,
      gas: gas.trim() || null,
      voltagem: voltagem.trim() || null,
      dados_segmento: montarDadosSegmento(),
      data_compra: dataCompra || null,
      garantia_dias: Number(garantiaDias || 90),
      status,
      observacoes: observacoes.trim() || null,
      usuario: operadorAtual(),
    };

    if (editando) {
      const { error } = await supabase.from("equipamentos_cliente").update(payload).eq("empresa_id", empresaId).eq("id", editando.id);
      if (error) {
        alert("Erro ao alterar equipamento: " + error.message);
        setSalvando(false);
        return;
      }
      alert("Equipamento alterado com sucesso.");
    } else {
      const { error } = await supabase.from("equipamentos_cliente").insert([payload]);
      if (error) {
        alert("Erro ao cadastrar equipamento: " + error.message);
        setSalvando(false);
        return;
      }
      alert("Equipamento cadastrado com sucesso.");
    }

    setSalvando(false);
    setModalAberto(false);
    limparFormulario();
    carregarDados();
  }

  async function inativarEquipamento(e: Equipamento) {
    const empresaId = empresaAtualId();
    if (!empresaId) return;
    if (!confirm(`Deseja inativar ${nomeEquipamento(e)}?`)) return;

    const { error } = await supabase.from("equipamentos_cliente").update({ status: "inativo" }).eq("empresa_id", empresaId).eq("id", e.id);
    if (error) {
      alert("Erro ao inativar equipamento: " + error.message);
      return;
    }
    carregarDados();
  }

  const clientesBusca = clientes
    .filter((c) => {
      const t = clienteBusca.toLowerCase();
      return c.nome.toLowerCase().includes(t) || String(c.cpf_cnpj || "").toLowerCase().includes(t) || String(c.whatsapp || "").toLowerCase().includes(t);
    })
    .slice(0, 8);

  const equipamentosFiltrados = useMemo(() => {
    const termo = pesquisa.toLowerCase().trim();
    return equipamentos.filter((e) => {
      const texto = `${nomeEquipamento(e)} ${e.clientes?.nome || ""} ${e.clientes?.cpf_cnpj || ""} ${e.clientes?.whatsapp || ""} ${e.segmento_nome || ""} ${e.imei_1 || ""} ${e.imei_2 || ""} ${e.placa || ""} ${e.chassi || ""} ${JSON.stringify(e.dados_segmento || {})}`.toLowerCase();
      return (!termo || texto.includes(termo)) && (filtroSegmento === "todos" || e.segmento === filtroSegmento);
    });
  }, [equipamentos, pesquisa, filtroSegmento]);

  function mostrarCamposCelular() {
    return tipo === "Celular" || segmento === "loja_celular";
  }
  function mostrarCamposVeiculo() {
    return tipo === "Veículo" || tipo === "Moto" || segmento === "oficina_mecanica" || segmento === "oficina_moto" || segmento === "auto_eletrica";
  }
  function mostrarCamposRefrigeracao() {
    return tipo === "Ar-condicionado" || tipo === "Refrigerador" || segmento === "refrigeracao";
  }
  function mostrarCamposInformatica() {
    return tipo === "Notebook" || tipo === "Desktop" || tipo === "Tablet" || tipo === "Impressora" || segmento === "informatica";
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-8">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white shadow-lg lg:p-8">
        <p className="font-bold text-blue-100">Th Cloud</p>
        <h1 className="mt-2 text-3xl font-black lg:text-4xl">Equipamentos</h1>
        <p className="mt-2 max-w-4xl text-blue-100">Cadastre aparelhos, veículos, máquinas e equipamentos para reutilizar na Ordem de Serviço.</p>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <THSearch value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} placeholder="Pesquisar cliente, equipamento, IMEI, placa ou chassi..." />
          </div>
          <div className="lg:col-span-3">
            <THSelect value={filtroSegmento} onChange={(e) => setFiltroSegmento(e.target.value)}>
              <option value="todos">Todos os segmentos</option>
              {segmentos.map((item) => (
                <option key={item.codigo} value={item.codigo}>
                  {item.nome}
                </option>
              ))}
            </THSelect>
          </div>
          <THButton onClick={carregarDados} variant="ghost" className="lg:col-span-1">
            <RefreshCcw size={18} />
          </THButton>
          <THButton onClick={abrirNovo} className="lg:col-span-2">
            + Novo Equipamento
          </THButton>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Equipamentos Cadastrados</h2>
            <p className="text-slate-500">{equipamentosFiltrados.length} registro(s)</p>
          </div>
          {carregando ? (
            <div className="flex items-center gap-2 font-bold text-blue-700">
              <Loader2 size={18} className="animate-spin" /> Carregando
            </div>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead>
              <tr className="bg-blue-700 text-white">
                <th className="p-4 text-left">Equipamento</th>
                <th className="p-4 text-left">Cliente</th>
                <th className="p-4 text-left">Segmento</th>
                <th className="p-4 text-left">Identificação</th>
                <th className="p-4 text-center">Garantia</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {equipamentosFiltrados.map((e) => (
                <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4">
                    <p className="font-black text-slate-900">{nomeEquipamento(e)}</p>
                    <p className="text-xs text-slate-500">{e.numero_serie ? `Série: ${e.numero_serie}` : "-"}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-black text-slate-900">{e.clientes?.nome || "Cliente"}</p>
                    <p className="text-xs text-slate-500">{e.clientes?.whatsapp || e.clientes?.cpf_cnpj || "-"}</p>
                  </td>
                  <td className="p-4 font-bold text-slate-700">{e.segmento_nome || segmentoNome(e.segmento)}</td>
                  <td className="p-4 text-slate-700">
                    <p>{e.imei_1 ? `IMEI: ${e.imei_1}` : e.placa ? `Placa: ${e.placa}` : "-"}</p>
                    <p className="text-xs text-slate-500">{e.chassi ? `Chassi: ${e.chassi}` : ""}</p>
                  </td>
                  <td className="p-4 text-center font-bold text-slate-700">{e.garantia_ate ? new Date(e.garantia_ate).toLocaleDateString("pt-BR") : `${e.garantia_dias || 0} dias`}</td>
                  <td className="p-4 text-center">
                    <THStatus texto={e.status === "ativo" ? "Ativo" : "Inativo"} tipo={e.status === "ativo" ? "ativo" : "erro"} />
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <THButton onClick={() => abrirEdicao(e)} variant="ghost" className="px-3 py-2 text-yellow-700">
                        <Edit size={16} />
                      </THButton>
                      <THButton onClick={() => inativarEquipamento(e)} variant="ghost" className="px-3 py-2 text-red-700">
                        <Trash2 size={16} />
                      </THButton>
                    </div>
                  </td>
                </tr>
              ))}
              {equipamentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    Nenhum equipamento encontrado.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <THModal
        aberto={modalAberto}
        onFechar={fecharModal}
        largura="xl"
        titulo={editando ? "Alterar Equipamento" : "Novo Equipamento"}
        subtitulo="Cadastro central para Ordem de Serviço, garantia e histórico."
        rodape={
          <>
            <THButton onClick={fecharModal} variant="ghost">
              Cancelar
            </THButton>
            <THButton onClick={salvarEquipamento} disabled={salvando}>
              {salvando ? <Loader2 size={18} className="animate-spin" /> : <Wrench size={18} />}
              {salvando ? "Salvando..." : "Salvar Equipamento"}
            </THButton>
          </>
        }
      >
        <div className="space-y-5">
          <Secao titulo="Cliente">
            <div className="relative">
              <THSearch value={clienteBusca} onChange={(e) => setClienteBusca(e.target.value)} placeholder="Pesquisar cliente" />
              {clienteBusca ? (
                <div className="absolute left-0 right-0 top-14 z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  {clientesBusca.map((cliente) => (
                    <button
                      key={cliente.id}
                      type="button"
                      onClick={() => {
                        setClienteId(cliente.id);
                        setClienteBusca(cliente.nome);
                      }}
                      className="w-full border-b p-3 text-left hover:bg-blue-50"
                    >
                      <p className="font-black text-slate-900">{cliente.nome}</p>
                      <p className="text-xs text-slate-500">{cliente.cpf_cnpj || "-"} • {cliente.whatsapp || "-"}</p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </Secao>

          <Secao titulo="Dados principais">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <THSelect label="Segmento" value={segmento} onChange={(e) => setSegmento(e.target.value)}>
                {segmentos.map((item) => (
                  <option key={item.codigo} value={item.codigo}>
                    {item.nome}
                  </option>
                ))}
              </THSelect>
              <THSelect label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {tiposEquipamento.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </THSelect>
              <THInput label="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} />
              <THInput label="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
              <THInput label="Número de série" value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} upper={false} />
            </div>
          </Secao>

          {mostrarCamposCelular() ? (
            <Secao titulo="Dados de celular">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <THInput label="IMEI 1" value={imei1} onChange={(e) => setImei1(e.target.value)} upper={false} />
                <THInput label="IMEI 2" value={imei2} onChange={(e) => setImei2(e.target.value)} upper={false} />
                <THInput label="Cor" value={cor} onChange={(e) => setCor(e.target.value)} />
                <THInput label="Capacidade" value={capacidade} onChange={(e) => setCapacidade(e.target.value)} />
                <THInput label="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} upper={false} />
                <THInput label="Conta Google" value={contaGoogle} onChange={(e) => setContaGoogle(e.target.value)} upper={false} />
                <THInput label="Conta Apple" value={contaApple} onChange={(e) => setContaApple(e.target.value)} upper={false} />
                <THInput label="Bateria" value={bateria} onChange={(e) => setBateria(e.target.value)} />
                <THInput label="Estado da tela" value={estadoTela} onChange={(e) => setEstadoTela(e.target.value)} />
                <THInput label="Estado da tampa" value={estadoTampa} onChange={(e) => setEstadoTampa(e.target.value)} />
                <THInput label="Acessórios entregues" value={acessorios} onChange={(e) => setAcessorios(e.target.value)} className="md:col-span-2" />
              </div>
            </Secao>
          ) : null}

          {mostrarCamposVeiculo() ? (
            <Secao titulo="Dados de veículo">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <THInput label="Placa" value={placa} onChange={(e) => setPlaca(e.target.value.toUpperCase())} />
                <THInput label="Chassi" value={chassi} onChange={(e) => setChassi(e.target.value)} upper={false} />
                <THInput label="Renavam" value={renavam} onChange={(e) => setRenavam(e.target.value)} upper={false} />
                <THInput label="Ano" value={ano} onChange={(e) => setAno(e.target.value)} upper={false} />
                <THInput label="KM atual" value={kmAtual} onChange={(e) => setKmAtual(e.target.value)} upper={false} />
                <THInput label="Combustível" value={combustivel} onChange={(e) => setCombustivel(e.target.value)} />
                <THInput label="Motor" value={motor} onChange={(e) => setMotor(e.target.value)} upper={false} />
                <THInput label="Número do motor" value={numeroMotor} onChange={(e) => setNumeroMotor(e.target.value)} upper={false} />
              </div>
            </Secao>
          ) : null}

          {mostrarCamposRefrigeracao() ? (
            <Secao titulo="Dados de refrigeração">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <THInput label="BTUs" value={btus} onChange={(e) => setBtus(e.target.value)} upper={false} />
                <THInput label="Tipo de gás" value={gas} onChange={(e) => setGas(e.target.value)} />
                <THInput label="Voltagem" value={voltagem} onChange={(e) => setVoltagem(e.target.value)} upper={false} />
                <THInput label="Potência" value={potencia} onChange={(e) => setPotencia(e.target.value)} upper={false} />
                <THInput label="Local da instalação" value={localInstalacao} onChange={(e) => setLocalInstalacao(e.target.value)} />
                <THInput label="Última manutenção" type="date" value={ultimaManutencao} onChange={(e) => setUltimaManutencao(e.target.value)} upper={false} />
              </div>
            </Secao>
          ) : null}

          {mostrarCamposInformatica() ? (
            <Secao titulo="Dados de informática">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <THInput label="Processador" value={processador} onChange={(e) => setProcessador(e.target.value)} upper={false} />
                <THInput label="Memória RAM" value={memoriaRam} onChange={(e) => setMemoriaRam(e.target.value)} upper={false} />
                <THInput label="SSD / HD" value={armazenamento} onChange={(e) => setArmazenamento(e.target.value)} upper={false} />
                <THInput label="Sistema operacional" value={sistemaOperacional} onChange={(e) => setSistemaOperacional(e.target.value)} />
                <THInput label="Patrimônio" value={patrimonio} onChange={(e) => setPatrimonio(e.target.value)} upper={false} />
              </div>
            </Secao>
          ) : null}

          <Secao titulo="Garantia e observações">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <THInput label="Data da compra" type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} upper={false} />
              <THInput label="Garantia em dias" value={garantiaDias} onChange={(e) => setGarantiaDias(e.target.value)} upper={false} />
              <THSelect label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </THSelect>
            </div>
            <THTextarea label="Observações" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="mt-3" />
          </Secao>
        </div>
      </THModal>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4">
      <h3 className="mb-4 font-black text-slate-900">{titulo}</h3>
      {children}
    </section>
  );
}
