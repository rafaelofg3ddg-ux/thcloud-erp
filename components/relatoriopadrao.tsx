"use client";

type Props = {
  empresa: any;
  usuarioNome: string;
  titulo: string;
  subtitulo?: string;
  periodo?: string;
  children: React.ReactNode;
};

export default function RelatorioPadrao({
  empresa,
  usuarioNome,
  titulo,
  subtitulo,
  periodo,
  children,
}: Props) {
  return (
    <div className="documento-relatorio max-w-6xl mx-auto bg-white border border-slate-200 shadow-lg rounded-2xl overflow-hidden">

      <div className="px-8 pt-8 pb-5">
        <div className="flex justify-between border-b-4 border-blue-700 pb-5">

          <div className="flex gap-4 items-center">

            <img
              src={
                empresa?.logo_url ||
                "/logo-thcloud-transparente.png"
              }
              alt="Logo"
              className="h-20 w-20 object-contain"
            />

            <div>
              <h2 className="text-2xl font-black text-blue-800">
                {empresa?.nome_fantasia || "Empresa"}
              </h2>

              <p className="text-sm text-slate-500">
                Th Cloud
              </p>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-black text-slate-900">
              {titulo}
            </h1>

            <p className="text-slate-500">
              {subtitulo}
            </p>
          </div>

          <div className="text-right text-xs">
            <p>
              <strong>Emissão:</strong>
            </p>

            <p>
              {new Date().toLocaleString("pt-BR")}
            </p>

            <p className="mt-2">
              <strong>Período:</strong>
            </p>

            <p>{periodo}</p>
          </div>
        </div>
      </div>

      <div className="px-8 pb-6">

        <div className="grid grid-cols-2 gap-5">

          <div className="border rounded-xl overflow-hidden">
            <div className="bg-blue-950 text-white px-4 py-3 font-black">
              DADOS DA EMPRESA
            </div>

            <table className="w-full text-sm">
              <tbody>

                <Linha
                  titulo="Razão Social"
                  valor={empresa?.razao_social || "-"}
                />

                <Linha
                  titulo="Fantasia"
                  valor={empresa?.nome_fantasia || "-"}
                />

                <Linha
                  titulo="CPF/CNPJ"
                  valor={
                    empresa?.cnpj ||
                    empresa?.cpf ||
                    "-"
                  }
                />

                <Linha
                  titulo="Telefone"
                  valor={empresa?.telefone || "-"}
                />

                <Linha
                  titulo="WhatsApp"
                  valor={empresa?.whatsapp || "-"}
                />

                <Linha
                  titulo="E-mail"
                  valor={empresa?.email || "-"}
                />

                <Linha
                  titulo="Site"
                  valor={empresa?.site || "-"}
                />

              </tbody>
            </table>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <div className="bg-blue-950 text-white px-4 py-3 font-black">
              DADOS DO RELATÓRIO
            </div>

            <table className="w-full text-sm">
              <tbody>

                <Linha
                  titulo="Usuário"
                  valor={usuarioNome}
                />

                <Linha
                  titulo="Sistema"
                  valor="Th Cloud"
                />

                <Linha
                  titulo="Relatório"
                  valor={titulo}
                />

                <Linha
                  titulo="Data"
                  valor={new Date().toLocaleDateString("pt-BR")}
                />

                <Linha
                  titulo="Hora"
                  valor={new Date().toLocaleTimeString("pt-BR")}
                />

              </tbody>
            </table>
          </div>

        </div>
      </div>

      <div className="px-8 pb-8">
        {children}
      </div>

      <div className="border-t p-5 text-center text-xs text-slate-500">
        Th Cloud • www.thcloud.com.br
      </div>
    </div>
  );
}

function Linha({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <tr className="border-b">
      <td className="bg-slate-50 p-3 font-bold w-40">
        {titulo}
      </td>

      <td className="p-3">
        {valor}
      </td>
    </tr>
  );
}