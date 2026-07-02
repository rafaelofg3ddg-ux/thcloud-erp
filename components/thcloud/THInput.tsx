"use client";

import type {
  InputHTMLAttributes,
  KeyboardEvent,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type MaskType =
  | "none"
  | "cpf"
  | "cnpj"
  | "cpf_cnpj"
  | "telefone"
  | "cep"
  | "moeda"
  | "numero";

type THInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  erro?: string;
  ajuda?: string;
  upper?: boolean;
  mask?: MaskType;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onValueChange?: (valor: string) => void;
  enterNext?: boolean;
};

type THTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  erro?: string;
  ajuda?: string;
  upper?: boolean;
  onValueChange?: (valor: string) => void;
  enterNext?: boolean;
};

function apenasNumeros(valor: string): string {
  return String(valor || "").replace(/\D/g, "");
}

function devePreservarTipo(type?: string): boolean {
  return [
    "email",
    "password",
    "url",
    "number",
    "date",
    "datetime-local",
    "time",
    "month",
    "week",
  ].includes(String(type || "text").toLowerCase());
}

function aplicarMascara(valor: string, mask: MaskType): string {
  const numeros = apenasNumeros(valor);

  if (mask === "cpf") {
    return numeros
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  if (mask === "cnpj") {
    return numeros
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }

  if (mask === "cpf_cnpj") {
    if (numeros.length <= 11) {
      return aplicarMascara(numeros, "cpf");
    }

    return aplicarMascara(numeros, "cnpj");
  }

  if (mask === "telefone") {
    const n = numeros.slice(0, 11);

    if (n.length <= 10) {
      return n
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return n
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  if (mask === "cep") {
    return numeros.slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
  }

  if (mask === "numero") {
    return numeros;
  }

  if (mask === "moeda") {
    const cents = Number(numeros || 0) / 100;

    return cents.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return valor;
}

function proximoCampo(event: KeyboardEvent<HTMLElement>): void {
  const form = event.currentTarget.closest("form") || document;

  const campos = Array.from(
    form.querySelectorAll<HTMLElement>("input, textarea, select, button")
  ).filter((el) => {
    const disabled = el.getAttribute("disabled") !== null;
    const hidden = el.getAttribute("type") === "hidden";

    return !disabled && !hidden && el.tabIndex !== -1;
  });

  const atual = campos.indexOf(event.currentTarget);
  const proximo = campos[atual + 1];

  if (proximo) {
    event.preventDefault();
    proximo.focus();
  }
}

export function THInput({
  label,
  erro,
  ajuda,
  upper = true,
  mask = "none",
  type = "text",
  className = "",
  leftIcon,
  rightIcon,
  onChange,
  onValueChange,
  onKeyDown,
  enterNext = true,
  ...props
}: THInputProps) {
  const preservar = devePreservarTipo(type) || mask !== "none";

  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-sm font-black text-slate-700">
          {label}
        </span>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {leftIcon}
          </div>
        )}

        <input
          {...props}
          type={type}
          className={[
            "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10",
            leftIcon ? "pl-12" : "",
            rightIcon ? "pr-12" : "",
            upper && !preservar ? "uppercase" : "",
            erro ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          onChange={(event) => {
            let valor = event.target.value;

            if (mask !== "none") {
              valor = aplicarMascara(valor, mask);
            } else if (upper && !preservar) {
              valor = valor.toUpperCase();
            }

            event.target.value = valor;
            onValueChange?.(valor);
            onChange?.(event);
          }}
          onKeyDown={(event) => {
            if (enterNext && event.key === "Enter") {
              proximoCampo(event);
            }

            onKeyDown?.(event);
          }}
        />

        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>

      {erro && <p className="mt-1 text-sm font-bold text-red-600">{erro}</p>}
      {!erro && ajuda && <p className="mt-1 text-xs text-slate-500">{ajuda}</p>}
    </label>
  );
}

export function THTextarea({
  label,
  erro,
  ajuda,
  upper = true,
  className = "",
  onChange,
  onValueChange,
  onKeyDown,
  enterNext = false,
  ...props
}: THTextareaProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-sm font-black text-slate-700">
          {label}
        </span>
      )}

      <textarea
        {...props}
        className={[
          "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10",
          upper ? "uppercase" : "",
          erro ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        onChange={(event) => {
          const valor = upper
            ? event.target.value.toUpperCase()
            : event.target.value;

          event.target.value = valor;
          onValueChange?.(valor);
          onChange?.(event);
        }}
        onKeyDown={(event) => {
          if (enterNext && event.key === "Enter") {
            proximoCampo(event);
          }

          onKeyDown?.(event);
        }}
      />

      {erro && <p className="mt-1 text-sm font-bold text-red-600">{erro}</p>}
      {!erro && ajuda && <p className="mt-1 text-xs text-slate-500">{ajuda}</p>}
    </label>
  );
}
