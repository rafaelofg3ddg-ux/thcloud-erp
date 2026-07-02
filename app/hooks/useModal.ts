"use client";

import { useCallback, useState } from "react";

export function useModal(valorInicial = false) {
  const [aberto, setAberto] = useState(valorInicial);

  const abrir = useCallback(() => setAberto(true), []);
  const fechar = useCallback(() => setAberto(false), []);
  const alternar = useCallback(() => setAberto((atual) => !atual), []);

  return { aberto, abrir, fechar, alternar, setAberto };
}
