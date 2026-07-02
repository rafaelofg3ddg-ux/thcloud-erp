"use client";

import THButton from "./THButton";
import THModal from "./THModal";

type THConfirmProps = {
  aberto: boolean;
  titulo?: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
};

export default function THConfirm({
  aberto,
  titulo = "Confirmar ação",
  mensagem,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
}: THConfirmProps) {
  return (
    <THModal
      aberto={aberto}
      titulo={titulo}
      onFechar={onCancelar}
      largura="sm"
      rodape={
        <>
          <THButton variant="ghost" onClick={onCancelar}>{textoCancelar}</THButton>
          <THButton variant="danger" onClick={onConfirmar}>{textoConfirmar}</THButton>
        </>
      }
    >
      <p className="text-sm font-semibold leading-6 text-slate-700">{mensagem}</p>
    </THModal>
  );
}
