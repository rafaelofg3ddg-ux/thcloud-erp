"use client";

import type { ReactNode } from "react";

type THTableProps = {
  headers: string[];
  children: ReactNode;
  vazio?: ReactNode;
  temDados?: boolean;
};

export function THTable({ headers, children, vazio, temDados = true }: THTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-blue-700 text-white">
              {headers.map((header) => (
                <th key={header} className="p-4 text-left font-black">
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {temDados ? (
              children
            ) : (
              <tr>
                <td colSpan={headers.length} className="p-10 text-center text-slate-500">
                  {vazio || "Nenhum registro encontrado."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
