import type { ReactNode } from "react";

type InfraPageHeaderProps = {
  titulo: string;
  subtitulo: string;
  acoes?: ReactNode;
};

export default function InfraPageHeader({ titulo, subtitulo, acoes }: InfraPageHeaderProps) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-[30px] bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700 p-6 text-white shadow-xl lg:p-8">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="font-black text-blue-200">TH Cloud • Super Admin</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight lg:text-4xl">{titulo}</h1>
          <p className="mt-2 max-w-4xl font-medium text-blue-100">{subtitulo}</p>
        </div>
        {acoes}
      </div>
    </section>
  );
}
