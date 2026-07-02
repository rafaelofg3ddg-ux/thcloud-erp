"use client";

export type DadosSegmentoOS = Record<string, any>;

type Props = {
  segmento: string;
  segmentoNome: string;
  dados: DadosSegmentoOS;
  setDados: (dados: DadosSegmentoOS) => void;
};

export default function CamposSegmentoOS({ segmento, segmentoNome, dados, setDados }: Props) {
  function normalizarCampo(campo: string, valor: any) {
    if (typeof valor !== "string") return valor;

    const camposPreservados = [
      "imei_1",
      "imei_2",
      "senha",
      "senha_aparelho",
    ];

    if (camposPreservados.includes(campo)) return valor;

    return valor.toUpperCase();
  }

  function alterar(campo: string, valor: any) {
    setDados({ ...dados, [campo]: normalizarCampo(campo, valor) });
  }

  function texto(campo: string) {
    return String(dados[campo] || "");
  }

  function marcado(campo: string) {
    return dados[campo] === true;
  }

  if (segmento === "loja_celular") {
    return (
      <Caixa titulo="Campos de Celular" subtitulo="IMEI, senha, conta, estado e checklist do aparelho.">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input label="IMEI 1" value={texto("imei_1")} onChange={(v) => alterar("imei_1", v)} />
          <Input label="IMEI 2" value={texto("imei_2")} onChange={(v) => alterar("imei_2", v)} />
          <Input label="Conta Google / Apple" value={texto("conta_google")} onChange={(v) => alterar("conta_google", v)} />
          <Input label="Senha do aparelho" value={texto("senha_aparelho")} onChange={(v) => alterar("senha_aparelho", v)} />
          <Input label="Operadora" value={texto("operadora")} onChange={(v) => alterar("operadora", v)} />
          <Input label="Cor" value={texto("cor")} onChange={(v) => alterar("cor", v)} />
          <Input label="Capacidade" value={texto("capacidade")} onChange={(v) => alterar("capacidade", v)} />
          <Input label="Chip / Linha" value={texto("chip")} onChange={(v) => alterar("chip", v)} />
          <Check label="Tela quebrada" checked={marcado("tela_quebrada")} onChange={(v) => alterar("tela_quebrada", v)} />
          <Check label="Molhado" checked={marcado("molhado")} onChange={(v) => alterar("molhado", v)} />
          <Check label="Liga" checked={marcado("liga")} onChange={(v) => alterar("liga", v)} />
          <Check label="Carrega" checked={marcado("carrega")} onChange={(v) => alterar("carrega", v)} />
          <Check label="Biometria" checked={marcado("biometria")} onChange={(v) => alterar("biometria", v)} />
          <Check label="Face ID" checked={marcado("face_id")} onChange={(v) => alterar("face_id", v)} />
        </div>
        <Textarea label="Observações estéticas" value={texto("observacoes_esteticas")} onChange={(v) => alterar("observacoes_esteticas", v)} />
      </Caixa>
    );
  }

  if (["oficina_mecanica", "oficina_moto", "auto_eletrica"].includes(segmento)) {
    return (
      <Caixa titulo="Campos de Oficina" subtitulo="Veículo, placa, chassi, KM, combustível e checklist.">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input label="Veículo" value={texto("veiculo")} onChange={(v) => alterar("veiculo", v)} />
          <Input label="Marca" value={texto("marca_veiculo")} onChange={(v) => alterar("marca_veiculo", v)} />
          <Input label="Modelo" value={texto("modelo_veiculo")} onChange={(v) => alterar("modelo_veiculo", v)} />
          <Input label="Ano" value={texto("ano")} onChange={(v) => alterar("ano", v)} />
          <Input label="Placa" value={texto("placa")} onChange={(v) => alterar("placa", v.toUpperCase())} />
          <Input label="Chassi" value={texto("chassi")} onChange={(v) => alterar("chassi", v)} />
          <Input label="KM atual" value={texto("km")} onChange={(v) => alterar("km", v)} />
          <Input label="Combustível" value={texto("combustivel")} onChange={(v) => alterar("combustivel", v)} />
          <Input label="Motor" value={texto("motor")} onChange={(v) => alterar("motor", v)} />
          <Input label="Cor" value={texto("cor")} onChange={(v) => alterar("cor", v)} />
          <Check label="Manual" checked={marcado("manual")} onChange={(v) => alterar("manual", v)} />
          <Check label="Chave reserva" checked={marcado("chave_reserva")} onChange={(v) => alterar("chave_reserva", v)} />
        </div>
        <Textarea label="Itens deixados no veículo" value={texto("itens_deixados")} onChange={(v) => alterar("itens_deixados", v)} />
        <Textarea label="Checklist / estado do veículo" value={texto("checklist_veiculo")} onChange={(v) => alterar("checklist_veiculo", v)} />
      </Caixa>
    );
  }

  if (segmento === "refrigeracao") {
    return (
      <Caixa titulo="Campos de Refrigeração" subtitulo="BTUs, gás, voltagem, ambiente e instalação.">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input label="Equipamento" value={texto("equipamento")} onChange={(v) => alterar("equipamento", v)} />
          <Input label="Marca" value={texto("marca")} onChange={(v) => alterar("marca", v)} />
          <Input label="Modelo" value={texto("modelo")} onChange={(v) => alterar("modelo", v)} />
          <Input label="Número de série" value={texto("numero_serie")} onChange={(v) => alterar("numero_serie", v)} />
          <Input label="BTUs" value={texto("btus")} onChange={(v) => alterar("btus", v)} />
          <Input label="Tipo de gás" value={texto("gas")} onChange={(v) => alterar("gas", v)} />
          <Input label="Voltagem" value={texto("voltagem")} onChange={(v) => alterar("voltagem", v)} />
          <Input label="Local de instalação" value={texto("local_instalacao")} onChange={(v) => alterar("local_instalacao", v)} />
          <Input label="Ambiente" value={texto("ambiente")} onChange={(v) => alterar("ambiente", v)} />
          <Input label="Altura de instalação" value={texto("altura_instalacao")} onChange={(v) => alterar("altura_instalacao", v)} />
          <Check label="Condensadora acessível" checked={marcado("condensadora_acessivel")} onChange={(v) => alterar("condensadora_acessivel", v)} />
          <Check label="Precisa de escada" checked={marcado("precisa_escada")} onChange={(v) => alterar("precisa_escada", v)} />
        </div>
        <Textarea label="Observações do local" value={texto("observacoes_local")} onChange={(v) => alterar("observacoes_local", v)} />
      </Caixa>
    );
  }

  if (segmento === "informatica") {
    return (
      <Caixa titulo="Campos de Informática" subtitulo="Computador, senha, sistema, memória, armazenamento e backup.">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input label="Equipamento" value={texto("equipamento")} onChange={(v) => alterar("equipamento", v)} />
          <Input label="Marca" value={texto("marca")} onChange={(v) => alterar("marca", v)} />
          <Input label="Modelo" value={texto("modelo")} onChange={(v) => alterar("modelo", v)} />
          <Input label="Número de série" value={texto("numero_serie")} onChange={(v) => alterar("numero_serie", v)} />
          <Input label="Sistema operacional" value={texto("sistema_operacional")} onChange={(v) => alterar("sistema_operacional", v)} />
          <Input label="Senha" value={texto("senha")} onChange={(v) => alterar("senha", v)} />
          <Input label="HD / SSD" value={texto("armazenamento")} onChange={(v) => alterar("armazenamento", v)} />
          <Input label="Memória RAM" value={texto("memoria_ram")} onChange={(v) => alterar("memoria_ram", v)} />
          <Input label="Processador" value={texto("processador")} onChange={(v) => alterar("processador", v)} />
          <Check label="Backup autorizado" checked={marcado("backup_autorizado")} onChange={(v) => alterar("backup_autorizado", v)} />
          <Check label="Possui carregador" checked={marcado("carregador")} onChange={(v) => alterar("carregador", v)} />
        </div>
        <Textarea label="Arquivos importantes / observações" value={texto("arquivos_importantes")} onChange={(v) => alterar("arquivos_importantes", v)} />
      </Caixa>
    );
  }

  if (segmento === "eletronicos") {
    return (
      <Caixa titulo="Campos de Eletrônicos" subtitulo="Equipamento, série, voltagem, acessórios e estado físico.">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input label="Equipamento" value={texto("equipamento")} onChange={(v) => alterar("equipamento", v)} />
          <Input label="Marca" value={texto("marca")} onChange={(v) => alterar("marca", v)} />
          <Input label="Modelo" value={texto("modelo")} onChange={(v) => alterar("modelo", v)} />
          <Input label="Número de série" value={texto("numero_serie")} onChange={(v) => alterar("numero_serie", v)} />
          <Input label="Voltagem" value={texto("voltagem")} onChange={(v) => alterar("voltagem", v)} />
          <Input label="Acessórios" value={texto("acessorios")} onChange={(v) => alterar("acessorios", v)} />
          <Check label="Liga" checked={marcado("liga")} onChange={(v) => alterar("liga", v)} />
          <Check label="Controle remoto" checked={marcado("controle_remoto")} onChange={(v) => alterar("controle_remoto", v)} />
        </div>
        <Textarea label="Estado físico / observações" value={texto("estado_fisico")} onChange={(v) => alterar("estado_fisico", v)} />
      </Caixa>
    );
  }

  return (
    <Caixa titulo="Campos Gerais" subtitulo={`Segmento atual: ${segmentoNome || "Geral"}.`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input label="Equipamento / item" value={texto("equipamento")} onChange={(v) => alterar("equipamento", v)} />
        <Input label="Marca" value={texto("marca")} onChange={(v) => alterar("marca", v)} />
        <Input label="Modelo" value={texto("modelo")} onChange={(v) => alterar("modelo", v)} />
        <Input label="Número de série" value={texto("numero_serie")} onChange={(v) => alterar("numero_serie", v)} />
        <Input label="Local do atendimento" value={texto("local_atendimento")} onChange={(v) => alterar("local_atendimento", v)} />
        <Input label="Responsável" value={texto("responsavel")} onChange={(v) => alterar("responsavel", v)} />
      </div>
      <Textarea label="Observações específicas" value={texto("observacoes_especificas")} onChange={(v) => alterar("observacoes_especificas", v)} />
    </Caixa>
  );
}

function Caixa({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: React.ReactNode }) {
  return (
    <section className="border border-blue-200 rounded-3xl p-4 bg-blue-50/50">
      <div className="mb-4">
        <h3 className="font-black text-slate-900 text-lg">{titulo}</h3>
        <p className="text-sm text-slate-600 mt-1">{subtitulo}</p>
      </div>
      {children}
    </section>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (valor: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-700">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 input-os uppercase" />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (valor: string) => void }) {
  return (
    <label className="block mt-3">
      <span className="text-xs font-black text-slate-700">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 input-os min-h-24 uppercase" />
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (valor: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 border border-slate-200 rounded-2xl px-3 py-3 bg-white cursor-pointer mt-5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
      <span className="font-bold text-slate-800 text-sm">{label}</span>
    </label>
  );
}
