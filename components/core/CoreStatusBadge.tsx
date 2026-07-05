import type { CoreHealthStatus } from "../../lib/core";

const estilos: Record<CoreHealthStatus, string> = {
  online: "bg-emerald-50 text-emerald-700 border-emerald-200",
  atencao: "bg-amber-50 text-amber-700 border-amber-200",
  offline: "bg-red-50 text-red-700 border-red-200",
};

const rotulos: Record<CoreHealthStatus, string> = {
  online: "Online",
  atencao: "Atenção",
  offline: "Offline",
};

export function CoreStatusBadge({ status }: { status: CoreHealthStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${estilos[status]}`}>
      {rotulos[status]}
    </span>
  );
}
