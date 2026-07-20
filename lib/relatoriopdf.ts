export async function gerarPDFPadrao(
  titulo: string,
  colunas: string[],
  linhas: any[][]
) {
  const empresa = JSON.parse(localStorage.getItem("th_empresa") || "{}");
  const usuario = JSON.parse(localStorage.getItem("th_usuario") || "{}");

  const logo = empresa?.logo_url || "/logo-thcloud-transparente.png";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${titulo}</title>

        <style>
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            font-family: Arial, sans-serif;
            color: #111827;
            font-size: 12px;
            margin: 0;
          }

          .cabecalho {
            display: flex;
            gap: 20px;
            border-bottom: 2px solid #111827;
            padding-bottom: 15px;
            margin-bottom: 20px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .logo {
            width: 85px;
            height: 85px;
            object-fit: contain;
            border: 1px solid #ddd;
            padding: 5px;
          }

          .empresa {
            flex: 1;
          }

          .empresa h1 {
            font-size: 18px;
            margin: 0 0 5px;
          }

          .empresa p {
            margin: 3px 0;
          }

          .emissao {
            text-align: right;
            font-size: 11px;
          }

          .titulo {
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0 10px;
            text-transform: uppercase;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }

          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          th {
            background: #e5e7eb;
            border: 1px solid #cbd5e1;
            padding: 8px;
            text-align: left;
            font-size: 11px;
          }

          td {
            border: 1px solid #e5e7eb;
            padding: 7px;
            font-size: 11px;
            word-break: break-word;
          }

          tr:nth-child(even) {
            background: #f8fafc;
          }

          .rodape {
            margin-top: 30px;
            border-top: 1px solid #cbd5e1;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #64748b;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          @media print {
            body {
              margin: 0;
            }

            thead {
              display: table-header-group;
            }

            tr {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>

      <body>
        <div class="cabecalho">
          <img src="${logo}" class="logo" />

          <div class="empresa">
            <h1>${empresa?.razao_social || empresa?.nome_fantasia || "Th Cloud"}</h1>

            <p><strong>Nome Fantasia:</strong> ${empresa?.nome_fantasia || "-"}</p>
            <p><strong>CNPJ/CPF:</strong> ${empresa?.cnpj || empresa?.cpf || "-"}</p>
            <p><strong>Endereço:</strong> ${empresa?.endereco || ""} ${empresa?.numero || ""}</p>
            <p><strong>Bairro/Cidade:</strong> ${empresa?.bairro || ""} - ${empresa?.cidade || ""}/${empresa?.estado || ""}</p>
            <p><strong>Telefone:</strong> ${empresa?.telefone || empresa?.celular || empresa?.whatsapp || "-"}</p>
            <p><strong>E-mail:</strong> ${empresa?.email || "-"}</p>
          </div>

          <div class="emissao">
            <strong>EMISSÃO</strong>
            <p>${new Date().toLocaleString("pt-BR")}</p>
            <p><strong>Usuário:</strong> ${usuario?.nome || "-"}</p>
          </div>
        </div>

        <div class="titulo">${titulo}</div>

        <table>
          <thead>
            <tr>
              ${colunas.map((c) => `<th>${c}</th>`).join("")}
            </tr>
          </thead>

          <tbody>
            ${
              linhas.length > 0
                ? linhas
                    .map(
                      (linha) => `
                        <tr>
                          ${linha.map((item) => `<td>${item ?? "-"}</td>`).join("")}
                        </tr>
                      `
                    )
                    .join("")
                : `
                  <tr>
                    <td colspan="${colunas.length}" style="text-align:center;padding:25px;">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                `
            }
          </tbody>
        </table>

        <div class="rodape">
          <span>Relatório gerado automaticamente pelo Th Cloud</span>
          <span>${new Date().toLocaleDateString("pt-BR")}</span>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  const janela = window.open("", "_blank", "width=1000,height=800");

  if (!janela) {
    alert("O navegador bloqueou a janela do relatório. Libere pop-ups.");
    return;
  }

  janela.document.open();
  janela.document.write(html);
  janela.document.close();
}