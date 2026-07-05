import Link from "next/link";
import { ReactNode } from "react";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { TH_CLOUD_RELEASE } from "../../lib/systemVersion";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type AdminPageShellProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  children: ReactNode;
};

export default function AdminPageShell({
  title,
  subtitle,
  eyebrow = "Super Admin",
  breadcrumbs = [],
  actions,
  children,
}: AdminPageShellProps) {
  const itens = [{ label: "Super Admin", href: "/admin" }, ...breadcrumbs];

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6 overflow-x-hidden">
      <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 rounded-[30px] p-6 lg:p-8 text-white shadow-xl mb-6 overflow-hidden relative">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-blue-100 text-xs font-black uppercase tracking-[0.18em]">
              <ShieldCheck size={16} />
              <span>{eyebrow}</span>
              <span className="h-1 w-1 rounded-full bg-blue-200" />
              <span>{TH_CLOUD_RELEASE.name} v{TH_CLOUD_RELEASE.version}</span>
              <span className="h-1 w-1 rounded-full bg-blue-200" />
              <span>{TH_CLOUD_RELEASE.environment}</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-black mt-3 tracking-[-0.03em]">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-2 text-blue-100 max-w-4xl font-medium">
                {subtitle}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-blue-100/90">
              {itens.map((item, index) => {
                const ultimo = index === itens.length - 1;
                return (
                  <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                    {index > 0 && <ChevronRight size={15} className="text-blue-200/70" />}
                    {item.href && !ultimo ? (
                      <Link href={item.href} className="hover:text-white font-bold">
                        {item.label}
                      </Link>
                    ) : (
                      <span className={ultimo ? "text-white font-black" : "font-bold"}>{item.label}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </section>

      {children}
    </div>
  );
}
