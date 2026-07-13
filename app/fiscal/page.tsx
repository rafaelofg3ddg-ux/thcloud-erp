"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Settings2,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Upload,
  Copy,
  XCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getEmpresaId } from "../../lib/empresa";
import {
  THPage,
  THCard,
  THButton,
  THInput,
  THSelect,
  THStatus,
  THModal,
  formatarData,
} from "../../components/global";

type EmpresaFiscal = {
  id: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  cnpj: string | null;
  inscricao_estadual: string | null;
  regime_tributario: string | null;
  crt: number | null;
  ambiente_fiscal: string | null;
  serie_nfce: number | null;
  proximo_numero_nfce: number | null;
  csc_id: string | null;
  csc_token: string | null;
  provedor_fiscal: string | null;
  fiscal_configurado: boolean | null;
  modulo_fiscal: boolean | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  codigo_municipio_ibge: string | null;
  certificado_arquivo_url: string | null;
  certificado_nome_arquivo: string | null;
  certificado_validade: string | null;
  certificado_status: string | null;
};

type DocumentoFiscal = {
  id: string;
  tipo: string;
  status: string;
  numero: number | null;
  serie: number | null;
  chave_acesso: string | null;
  valor_total: number | null;
  ambiente: string | null;
  motivo_rejeicao: string | null;
  motivo_cancelamento: string | null;
  data_emissao: string | null;
  cancelavel_ate: string | null;
};

const abas = ["Configurações", "Documentos emitidos"] as const;
type Aba = (typeof abas)[number];

const statusInfo: Record<string, { texto: string; tipo: "ativo" | "alerta" | "erro" | "neutro" }> = {
  pendente: { texto: "Pendente", tipo: "alerta" },
  processando: { texto: "Processando", tipo: "alerta" },
  autorizada: { texto: "Autorizada", tipo: "ativo" },
  rejeitada: { texto: "Rejeitada", tipo: "erro" },
  cancelada: { texto: "Cancelada", tipo: "neutro" },
  contingencia: { texto: "Contingência", tipo: "alerta" },
};

const certificadoStatusInfo: Record<string, { texto: string; tipo: "ativo" | "alerta" | "erro" | "neutro" }> = {
  pendente: { texto: "Nenhum certificado enviado", tipo: "neutro" },
  enviado: { texto: "Enviado — aguardando validação", tipo: "alerta" },
  valido: { texto: "Válido", tipo: "ativo" },
  vencido: { texto: "Vencido — envie um novo", tipo: "erro" },
};

export default function FiscalPage() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>("Configurações");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoCertificado, setEnviandoCertificado] = useState(false);
  const [empresa, setEmpresa] = useState<EmpresaFiscal | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoFiscal[]>([]);

  const [regimeTributario, setRegimeTributario] = useState("Simples Nacional");
  const [crt, setCrt] = useState("1");
  const [ambienteFiscal, setAmbienteFiscal] = useState("homologacao");
  const [serieNfce, setSerieNfce] = useState("1");
  const [proximoNumeroNfce, setProximoNumeroNfce] = useState("1");
  const [provedorFiscal, setProvedorFiscal] = useState("");
  const [cscId, setCscId] = useState("");
  const [cscToken, setCscToken] = useState("");
  const [codigoMunicipioIbge, setCodigoMunicipioIbge] = useState("");

  const [arquivoCertificado, setArquivoCertificado] = useState<File | null>(null);
  const [senhaCertificado, setSenhaCertificado] = useState("");
  const [validadeCertificado, setValidadeCertificado] = useState("");

  const [documentoCancelando, setDocumentoCancelando] = useState<DocumentoFiscal | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [cancelando, setCancelando] = useState(false);

  const podeVerFiscal = empresa ? empresa.modulo_fiscal === true : true;

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const empresaId = getEmpresaId();
    if (!empresaId) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const [respEmpresa, respDocumentos] = await Promise.all([
      supabase
        .from("empresas")
        .select(
          "id,razao_social,nome_fantasia,cnpj,inscricao_estadual,regime_tributario,crt,ambiente_fiscal,serie_nfce,proximo_numero_nfce,csc_id,csc_token,provedor_fiscal,fiscal_configurado,modulo_fiscal,cep,endereco,numero,bairro,cidade,estado,codigo_municipio_ibge,certificado_arquivo_url,certificado_nome_arquivo,certificado_validade,certificado_status"
        )
        .eq("id", empresaId)
        .maybeSingle(),
      supabase
        .from("documentos_fiscais")
        .select("id,tipo,status,numero,serie,chave_acesso,valor_total,ambiente,motivo_rejeicao,motivo_cancelamento,data_emissao,cancelavel_ate")
        .eq("empresa_id", empresaId)
        .order("data_emissao", { ascending: false })
        .limit(100),
    ]);

    if (respEmpresa.data) {
      const dados = respEmpresa.data as EmpresaFiscal;

      // Confere sozinho se o certificado já venceu, comparando com a data de hoje
      let statusCertificado = dados.certificado_status || "pendente";
      if (dados.certificado_validade && statusCertificado !== "pendente") {
        statusCertificado = new Date(dados.certificado_validade + "T23:59:59") < new Date() ? "vencido" : "valido";
      }
      setEmpresa({ ...dados, certificado_status: statusCertificado });

      setRegimeTributario(dados.regime_tributario || "Simples Nacional");
      setCrt(String(dados.crt ?? 1));
      setAmbienteFiscal(dados.ambiente_fiscal || "homologacao");
      setSerieNfce(String(dados.serie_nfce ?? 1));
      setProximoNumeroNfce(String(dados.proximo_numero_nfce ?? 1));
      setProvedorFiscal(dados.provedor_fiscal || "");
      setCscId(dados.csc_id || "");
      setCscToken(dados.csc_token || "");
      setCodigoMunicipioIbge(dados.codigo_municipio_ibge || "");
      setValidadeCertificado(dados.certificado_validade || "");
    }

    setDocumentos((respDocumentos.data || []) as DocumentoFiscal[]);
    setCarregando(false);
  }

  async function salvarConfiguracoes() {
    const empresaId = getEmpresaId();
    if (!empresaId) return;

    setSalvando(true);

    const configuracaoCompleta = Boolean(
      regimeTributario &&
        ambienteFiscal &&
        serieNfce &&
        cscId.trim() &&
        cscToken.trim() &&
        provedorFiscal.trim() &&
        codigoMunicipioIbge.trim() &&
        empresa?.certificado_status === "valido"
    );

    const { error } = await supabase
      .from("empresas")
      .update({
        regime_tributario: regimeTributario,
        crt: Number(crt),
        ambiente_fiscal: ambienteFiscal,
        serie_nfce: Number(serieNfce || 1),
        proximo_numero_nfce: Number(proximoNumeroNfce || 1),
        provedor_fiscal: provedorFiscal.trim() || null,
        csc_id: cscId.trim() || null,
        csc_token: cscToken.trim() || null,
        codigo_municipio_ibge: codigoMunicipioIbge.trim() || null,
        fiscal_configurado: configuracaoCompleta,
      })
      .eq("id", empresaId);

    setSalvando(false);

    if (error) {
      alert("Erro ao salvar: " + error.message);
      return;
    }

    alert("Configurações fiscais salvas com sucesso!");
    carregarDados();
  }

  async function enviarCertificado() {
    const empresaId = getEmpresaId();
    if (!empresaId) return;

    if (!arquivoCertificado) {
      alert("Escolha o arquivo do certificado (.pfx ou .p12).");
      return;
    }
    if (!senhaCertificado.trim()) {
      alert("Informe a senha do certificado.");
      return;
    }
    if (!validadeCertificado) {
      alert("Informe a data de validade do certificado (está escrita no e-mail ou no próprio certificado).");
      return;
    }

    const extensao = arquivoCertificado.name.split(".").pop();
    if (!["pfx", "p12"].includes(String(extensao).toLowerCase())) {
      alert("O certificado precisa ser um arquivo .pfx ou .p12.");
      return;
    }

    setEnviandoCertificado(true);

    const caminhoArquivo = `${empresaId}/certificado.${extensao}`;
    const { error: erroUpload } = await supabase.storage
      .from("certificados-fiscais")
      .upload(caminhoArquivo, arquivoCertificado, { upsert: true });

    if (erroUpload) {
      setEnviandoCertificado(false);
      alert("Erro ao enviar o certificado: " + erroUpload.message + " (confirme se o bucket \"certificados-fiscais\" já foi criado)");
      return;
    }

    const { error: erroAtualizar } = await supabase
      .from("empresas")
      .update({
        certificado_arquivo_url: caminhoArquivo,
        certificado_nome_arquivo: arquivoCertificado.name,
        certificado_senha: senhaCertificado,
        certificado_validade: validadeCertificado,
        certificado_status: "enviado",
      })
      .eq("id", empresaId);

    setEnviandoCertificado(false);

    if (erroAtualizar) {
      alert("Certificado enviado, mas houve erro ao salvar os dados: " + erroAtualizar.message);
      return;
    }

    setArquivoCertificado(null);
    setSenhaCertificado("");
    alert(
      "Certificado enviado! Assim que um provedor de emissão for conectado, ele confirma automaticamente se o certificado e a senha estão corretos.",
    );
    carregarDados();
  }

  function abrirCancelamento(documento: DocumentoFiscal) {
    setDocumentoCancelando(documento);
    setMotivoCancelamento("");
  }

  async function confirmarCancelamento() {
    if (!documentoCancelando) return;

    if (motivoCancelamento.trim().length < 15) {
      alert("A justificativa de cancelamento precisa ter pelo menos 15 caracteres (exigência da SEFAZ).");
      return;
    }

    setCancelando(true);

    const { error } = await supabase
      .from("documentos_fiscais")
      .update({
        status: "cancelada",
        motivo_cancelamento: motivoCancelamento.trim(),
        data_cancelamento: new Date().toISOString(),
      })
      .eq("id", documentoCancelando.id);

    setCancelando(false);

    if (error) {
      alert("Erro ao cancelar: " + error.message);
      return;
    }

    setDocumentoCancelando(null);
    alert("Documento marcado como cancelado. O cancelamento de verdade junto à SEFAZ acontece quando o provedor de emissão estiver conectado.");
    carregarDados();
  }

  function copiarChaveAcesso(chave: string) {
    navigator.clipboard.writeText(chave);
    alert("Chave de acesso copiada!");
  }

  if (!podeVerFiscal) {
    return (
      <THPage titulo="Fiscal" subtitulo="Emissão de documentos fiscais">
        <THCard>
          <div className="flex items-center gap-3 text-slate-600">
            <AlertTriangle className="text-amber-500" />
            <p className="font-semibold">
              Este módulo não está disponível para o seu usuário ou para o plano atual da empresa. Fale com o suporte para habilitar o módulo fiscal.
            </p>
          </div>
        </THCard>
      </THPage>
    );
  }

  const infoCertificado = certificadoStatusInfo[empresa?.certificado_status || "pendente"];

  return (
    <THPage
      titulo="Fiscal"
      subtitulo="Configure os dados fiscais da empresa e acompanhe os documentos emitidos (NFC-e)."
      acoes={
        <THButton variant="ghost" onClick={carregarDados}>
          <RefreshCcw size={16} /> Atualizar
        </THButton>
      }
    >
      {empresa && (
        <THCard className={empresa.fiscal_configurado ? "border-emerald-200 bg-emerald-50/40" : "border-amber-200 bg-amber-50/40"}>
          <div className="flex items-center gap-3">
            {empresa.fiscal_configurado ? (
              <CheckCircle2 className="text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="text-amber-500 shrink-0" />
            )}
            <p className="font-bold text-slate-800">
              {empresa.fiscal_configurado
                ? "Configuração fiscal completa. Assim que um provedor de emissão for conectado, o sistema já está pronto para emitir NFC-e."
                : "Configuração fiscal incompleta. Preencha os dados, o endereço fiscal e envie o certificado digital abaixo."}
            </p>
          </div>
        </THCard>
      )}

      <div className="flex gap-2">
        {abas.map((aba) => (
          <button
            key={aba}
            onClick={() => setAbaAtiva(aba)}
            className={`rounded-xl px-4 py-2 text-sm font-black uppercase tracking-wide transition ${
              abaAtiva === aba ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
            }`}
          >
            {aba === "Configurações" ? <Settings2 size={15} className="inline mr-1.5 -mt-0.5" /> : <FileText size={15} className="inline mr-1.5 -mt-0.5" />}
            {aba}
          </button>
        ))}
      </div>

      {carregando ? (
        <THCard>
          <p className="text-slate-500 font-semibold">Carregando...</p>
        </THCard>
      ) : abaAtiva === "Configurações" ? (
        <>
          <THCard titulo="Dados fiscais da empresa">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <THSelect label="Regime tributário" value={regimeTributario} onChange={(e) => setRegimeTributario(e.target.value)}>
                <option value="Simples Nacional">Simples Nacional</option>
                <option value="Simples Nacional - Excesso">Simples Nacional (excesso de sublimite)</option>
                <option value="Regime Normal">Regime Normal (Lucro Presumido/Real)</option>
              </THSelect>

              <THSelect label="CRT (Código de Regime Tributário)" value={crt} onChange={(e) => setCrt(e.target.value)}>
                <option value="1">1 - Simples Nacional</option>
                <option value="2">2 - Simples Nacional (excesso de sublimite)</option>
                <option value="3">3 - Regime Normal</option>
              </THSelect>

              <THSelect label="Ambiente fiscal" value={ambienteFiscal} onChange={(e) => setAmbienteFiscal(e.target.value)}>
                <option value="homologacao">Homologação (testes)</option>
                <option value="producao">Produção (documentos reais)</option>
              </THSelect>

              <THInput label="Série da NFC-e" value={serieNfce} onChange={(e) => setSerieNfce(e.target.value.replace(/\D/g, ""))} />
              <THInput label="Próximo número da NFC-e" value={proximoNumeroNfce} onChange={(e) => setProximoNumeroNfce(e.target.value.replace(/\D/g, ""))} />

              <THSelect label="Provedor de emissão" value={provedorFiscal} onChange={(e) => setProvedorFiscal(e.target.value)}>
                <option value="">Ainda não escolhido</option>
                <option value="focus_nfe">Focus NFe</option>
                <option value="enotas">eNotas</option>
                <option value="plugnotas">PlugNotas</option>
                <option value="webmania">WebmaniaBR</option>
                <option value="outro">Outro</option>
              </THSelect>

              <THInput label="CSC ID (Código de Segurança do Contribuinte)" value={cscId} onChange={(e) => setCscId(e.target.value)} upper={false} />
              <THInput label="CSC Token" type="password" value={cscToken} onChange={(e) => setCscToken(e.target.value)} upper={false} />
            </div>
          </THCard>

          <THCard titulo="Endereço fiscal">
            <p className="text-sm text-slate-500 font-semibold mb-4">
              O endereço completo (CEP, rua, número, bairro, cidade, UF) é o mesmo já cadastrado em Empresa. Aqui falta
              só o código do município, que a NFC-e exige num formato específico (código do IBGE, não o nome da cidade).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600 font-semibold">
                {empresa?.endereco ? (
                  <>
                    {empresa.endereco}, {empresa.numero || "s/n"} — {empresa.bairro} <br />
                    {empresa.cidade} / {empresa.estado} — CEP {empresa.cep}
                  </>
                ) : (
                  "Endereço ainda não cadastrado. Preencha em Cadastros → Empresa."
                )}
              </div>
              <THInput
                label="Código do município (IBGE)"
                value={codigoMunicipioIbge}
                onChange={(e) => setCodigoMunicipioIbge(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 2111300"
                upper={false}
              />
            </div>
          </THCard>

          <THCard titulo="Certificado digital A1">
            <div className="flex items-center gap-3 mb-5">
              <ShieldCheck className={infoCertificado.tipo === "ativo" ? "text-emerald-600" : "text-slate-400"} />
              <THStatus texto={infoCertificado.texto} tipo={infoCertificado.tipo} />
              {empresa?.certificado_nome_arquivo && (
                <span className="text-sm text-slate-500 font-semibold">{empresa.certificado_nome_arquivo}</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wide text-slate-600 block mb-1.5">Arquivo do certificado (.pfx ou .p12)</span>
                <input
                  type="file"
                  accept=".pfx,.p12"
                  onChange={(e) => setArquivoCertificado(e.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-blue-700 file:font-bold"
                />
              </div>
              <THInput label="Senha do certificado" type="password" value={senhaCertificado} onChange={(e) => setSenhaCertificado(e.target.value)} upper={false} />
              <THInput label="Validade do certificado" type="date" value={validadeCertificado} onChange={(e) => setValidadeCertificado(e.target.value)} />
            </div>

            <div className="mt-5 flex items-center gap-3">
              <THButton onClick={enviarCertificado} disabled={enviandoCertificado}>
                <Upload size={16} /> {enviandoCertificado ? "Enviando..." : "Enviar certificado"}
              </THButton>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
              <strong>Sobre a segurança:</strong> o arquivo fica guardado num espaço privado, que só o próprio sistema
              acessa. Assim que conectarmos um provedor de emissão de verdade, o certificado (ou a senha) costuma ser
              repassado diretamente pra ele de forma seguíssima — é assim que a maioria das integrações fiscais funciona.
            </div>
          </THCard>

          <div>
            <THButton onClick={salvarConfiguracoes} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar configurações"}
            </THButton>
          </div>
        </>
      ) : (
        <THCard titulo="Documentos fiscais">
          {documentos.length === 0 ? (
            <p className="text-slate-500 font-semibold py-6 text-center">Nenhum documento fiscal registrado ainda.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase text-xs font-black">
                    <th className="p-3 text-left">Tipo</th>
                    <th className="p-3 text-left">Número/Série</th>
                    <th className="p-3 text-left">Chave de acesso</th>
                    <th className="p-3 text-left">Valor</th>
                    <th className="p-3 text-left">Ambiente</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Data</th>
                    <th className="p-3 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.map((doc) => {
                    const info = statusInfo[doc.status] || statusInfo.pendente;
                    const podeCancelar =
                      doc.status === "autorizada" && doc.cancelavel_ate && new Date(doc.cancelavel_ate) > new Date();
                    return (
                      <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 font-bold uppercase">{doc.tipo}</td>
                        <td className="p-3">{doc.numero ? `${doc.numero} / ${doc.serie ?? "-"}` : "-"}</td>
                        <td className="p-3">
                          {doc.chave_acesso ? (
                            <button onClick={() => copiarChaveAcesso(doc.chave_acesso!)} className="flex items-center gap-1.5 text-blue-700 hover:underline font-semibold">
                              <Copy size={13} /> {doc.chave_acesso.slice(0, 10)}...
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3 font-semibold">
                          {doc.valor_total != null
                            ? Number(doc.valor_total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : "-"}
                        </td>
                        <td className="p-3 capitalize">{doc.ambiente || "-"}</td>
                        <td className="p-3">
                          <THStatus texto={info.texto} tipo={info.tipo} />
                          {doc.motivo_rejeicao ? <p className="text-xs text-red-600 mt-1">{doc.motivo_rejeicao}</p> : null}
                          {doc.motivo_cancelamento ? <p className="text-xs text-slate-500 mt-1">{doc.motivo_cancelamento}</p> : null}
                        </td>
                        <td className="p-3 text-slate-500">{formatarData(doc.data_emissao)}</td>
                        <td className="p-3">
                          {podeCancelar && (
                            <button onClick={() => abrirCancelamento(doc)} className="flex items-center gap-1 text-red-600 hover:underline font-bold text-xs">
                              <XCircle size={14} /> Cancelar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </THCard>
      )}

      <THModal
        aberto={!!documentoCancelando}
        titulo="Cancelar documento fiscal"
        subtitulo="Documentos fiscais só podem ser cancelados dentro do prazo legal, com justificativa."
        onFechar={() => setDocumentoCancelando(null)}
        rodape={
          <>
            <THButton variant="ghost" onClick={() => setDocumentoCancelando(null)}>Voltar</THButton>
            <THButton variant="danger" onClick={confirmarCancelamento} disabled={cancelando}>
              {cancelando ? "Cancelando..." : "Confirmar cancelamento"}
            </THButton>
          </>
        }
      >
        <label className="block space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-slate-600">Justificativa (mínimo 15 caracteres)</span>
          <textarea
            value={motivoCancelamento}
            onChange={(e) => setMotivoCancelamento(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Ex: Venda cancelada a pedido do cliente, produto trocado por outro."
          />
        </label>
      </THModal>
    </THPage>
  );
}
