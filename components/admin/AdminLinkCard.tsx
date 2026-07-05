import Link from "next/link";
import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type AdminLinkCardProps = {
  href: string;
  title: string;
  description: string;
  icon?: ReactNode;
};

export default function AdminLinkCard({ href, title, description, icon }: AdminLinkCardProps) {
  return (
    <Link href={href} className="group bg-white rounded-[24px] border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all block">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {icon && <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">{icon}</div>}
          <div>
            <h3 className="font-black text-slate-950">{title}</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">{description}</p>
          </div>
        </div>
        <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
      </div>
    </Link>
  );
}
