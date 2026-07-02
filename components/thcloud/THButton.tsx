"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "warning"
  | "dark"
  | "ghost";

type THButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: ReactNode;
  loading?: boolean;
  full?: boolean;
};

const variants: Record<Variant, string> = {
  primary: "bg-blue-700 hover:bg-blue-800 text-white",
  secondary: "bg-slate-200 hover:bg-slate-300 text-slate-900",
  success: "bg-green-600 hover:bg-green-700 text-white",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  warning: "bg-orange-500 hover:bg-orange-600 text-white",
  dark: "bg-slate-900 hover:bg-slate-800 text-white",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-800",
};

export function THButton({
  variant = "primary",
  icon,
  loading = false,
  full = false,
  className = "",
  disabled,
  children,
  ...props
}: THButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-black transition",
        variants[variant],
        full ? "w-full" : "",
        disabled || loading ? "cursor-not-allowed opacity-60" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
