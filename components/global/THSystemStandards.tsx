"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw, X } from "lucide-react";

type THSystemStandardsProps = {
  children?: ReactNode;
};

type CadastroPopupPayload = {
  url: string;
  titulo?: string;
};

const TIPOS_PRESERVADOS = new Set([
  "email",
  "password",
  "url",
  "number",
  "date",
  "datetime-local",
  "time",
  "month",
  "week",
  "color",
  "file",
  "checkbox",
  "radio",
  "range",
  "hidden",
]);

function deveIgnorarMaiuscula(elemento: EventTarget | Element | null) {
  if (!(elemento instanceof HTMLInputElement) && !(elemento instanceof HTMLTextAreaElement)) {
    return true;
  }

  const campo = elemento as HTMLInputElement | HTMLTextAreaElement;
  const input = campo as HTMLInputElement;
  const type = String(input.type || "text").toLowerCase();
  const nome = String(input.name || input.id || input.placeholder || "").toLowerCase();
  const autocomplete = String(input.autocomplete || "").toLowerCase();

  const campoSensivel =
    nome.includes("login") ||
    nome.includes("email") ||
    nome.includes("e-mail") ||
    nome.includes("usuario") ||
    nome.includes("usuário") ||
    nome.includes("senha") ||
    nome.includes("password") ||
    nome.includes("token") ||
    nome.includes("api") ||
    nome.includes("url") ||
    nome.includes("pix") ||
    nome.includes("codigo_barras") ||
    nome.includes("código de barras") ||
    nome.includes("imei") ||
    nome.includes("serial") ||
    nome.includes("série") ||
    autocomplete.includes("username") ||
    autocomplete.includes("email") ||
    autocomplete.includes("password");

  return (
    campo.readOnly ||
    campo.disabled ||
    TIPOS_PRESERVADOS.has(type) ||
    campoSensivel ||
    campo.dataset.uppercase === "false" ||
    campo.dataset.noUppercase === "true" ||
    campo.closest("[data-no-uppercase='true']") !== null ||
    campo.classList.contains("th-no-uppercase")
  );
}

function aplicarMaiusculasEmCampo(campo: HTMLInputElement | HTMLTextAreaElement) {
  if (deveIgnorarMaiuscula(campo)) return;

  const valorOriginal = campo.value;
  const valorMaiusculo = valorOriginal.toLocaleUpperCase("pt-BR");

  if (valorOriginal === valorMaiusculo) return;

  const inicio = campo.selectionStart;
  const fim = campo.selectionEnd;

  campo.value = valorMaiusculo;

  try {
    if (inicio !== null && fim !== null) {
      campo.setSelectionRange(inicio, fim);
    }
  } catch {
    // Alguns tipos de input não permitem seleção. Não interrompe o formulário.
  }
}

function aplicarMaiusculasReact(event: FormEvent<HTMLDivElement>) {
  const alvo = event.target;

  if (!(alvo instanceof HTMLInputElement) && !(alvo instanceof HTMLTextAreaElement)) {
    return;
  }

  aplicarMaiusculasEmCampo(alvo);
}

function tituloPorUrl(url: string) {
  const primeiraParte = url.replace(/^\//, "").split("/")[0] || "cadastro";
  return `Novo ${primeiraParte.replace(/-/g, " ")}`.toLocaleUpperCase("pt-BR");
}

export function abrirCadastroPopup(url: string, titulo?: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<CadastroPopupPayload>("thcloud:abrir-cadastro-popup", {
      detail: { url, titulo },
    })
  );
}

export default function THSystemStandards({ children }: THSystemStandardsProps) {
  const [modal, setModal] = useState<CadastroPopupPayload | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const titulo = useMemo(() => {
    if (!modal) return "CADASTRO";
    return (modal.titulo || tituloPorUrl(modal.url)).toLocaleUpperCase("pt-BR");
  }, [modal]);

  useEffect(() => {
    const abrir = (evento: Event) => {
      const detalhe = (evento as CustomEvent<CadastroPopupPayload>).detail;
      if (!detalhe?.url) return;

      setIframeKey((valor) => valor + 1);
      setModal({ url: detalhe.url, titulo: detalhe.titulo });
    };

    window.addEventListener("thcloud:abrir-cadastro-popup", abrir as EventListener);

    return () => {
      window.removeEventListener("thcloud:abrir-cadastro-popup", abrir as EventListener);
    };
  }, []);

  function fecharModal() {
    const url = modal?.url || "";
    setModal(null);

    window.dispatchEvent(
      new CustomEvent("thcloud:cadastro-popup-fechado", {
        detail: { url },
      })
    );
  }

  return (
    <div className="th-system-standards" onInputCapture={aplicarMaiusculasReact}>
      {children}

      {modal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm">
          <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
              <div>
                <h2 className="text-xl font-black tracking-tight">{titulo}</h2>
                <p className="text-sm font-semibold text-slate-300">
                  Cadastro rápido em popup, sem sair da tela atual.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIframeKey((valor) => valor + 1)}
                  className="flex h-11 items-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-black hover:bg-white/20"
                  title="Recarregar cadastro"
                >
                  <RefreshCw size={18} />
                  Recarregar
                </button>

                <a
                  href={modal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-11 items-center gap-2 rounded-2xl bg-white/10 px-4 text-sm font-black hover:bg-white/20"
                  title="Abrir em nova aba se precisar"
                >
                  <ExternalLink size={18} />
                  Abrir
                </a>

                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 font-black hover:bg-red-700"
                  title="Fechar"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <iframe
              key={iframeKey}
              src={modal.url}
              className="h-full w-full border-0 bg-slate-50"
              title={titulo}
            />
          </div>
        </div>
      )}
    </div>
  );
}
