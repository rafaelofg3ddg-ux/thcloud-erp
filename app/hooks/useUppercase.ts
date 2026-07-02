"use client";

import { useCallback } from "react";

export function useUppercase() {
  return useCallback((valor: string) => String(valor || "").toUpperCase(), []);
}
