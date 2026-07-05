type AdminStatusBadgeProps = {
  status: "online" | "atencao" | "offline" | "info";
  children: React.ReactNode;
};

const estilos = {
  online: "bg-emerald-50 text-emerald-700 border-emerald-200",
  atencao: "bg-amber-50 text-amber-700 border-amber-200",
  offline: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function AdminStatusBadge({ status, children }: AdminStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${estilos[status]}`}>
      {children}
    </span>
  );
}
