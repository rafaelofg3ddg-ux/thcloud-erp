type InfraStatusBadgeProps = {
  status: "ok" | "atencao" | "erro" | "info";
  children: React.ReactNode;
};

const classes = {
  ok: "bg-emerald-100 text-emerald-700 border-emerald-200",
  atencao: "bg-amber-100 text-amber-700 border-amber-200",
  erro: "bg-red-100 text-red-700 border-red-200",
  info: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function InfraStatusBadge({ status, children }: InfraStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${classes[status]}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {children}
    </span>
  );
}
