"use client";

type THDocumentoItem = {
  codigo?: string | null;
  nome: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
};

type THPrintDocumento = {
  tipo: "ORDEM DE SERVIÇO" | "ORÇAMENTO" | "PEDIDO" | "VENDA";
  numero?: string | number | null;
  empresaNome?: string;
  empresaDocumento?: string;
  empresaTelefone?: string;
  clienteNome?: string;
  clienteDocumento?: string;
  clienteTelefone?: string;
  equipamento?: string;
  imei?: string;
  garantia?: string;
  observacoes?: string;
  itens: THDocumentoItem[];
  total: number;
};

function moeda(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function imprimirTHDocumento(doc: THPrintDocumento) {
  const linhas = doc.itens
    .map(
      (item) => `
      <tr>
        <td>${item.codigo || "-"}</td>
        <td>${item.nome}</td>
        <td class="right">${item.quantidade}</td>
        <td class="right">${moeda(item.valor_unitario)}</td>
        <td class="right">${moeda(item.subtotal)}</td>
      </tr>
    `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${doc.tipo} ${doc.numero || ""}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 30px auto; max-width: 900px; }
          .center { text-align: center; }
          .top { border: 2px solid #111827; padding: 18px; border-radius: 14px; margin-bottom: 16px; }
          h1 { margin: 0; font-size: 26px; }
          h2 { margin: 5px 0 0; font-size: 20px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .box { border: 1px solid #d1d5db; border-radius: 12px; padding: 12px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #1d4ed8; color: white; text-align: left; padding: 9px; }
          td { border-bottom: 1px solid #e5e7eb; padding: 9px; }
          .right { text-align: right; }
          .total { font-size: 24px; font-weight: bold; text-align: right; margin-top: 15px; }
          .ass { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 70px; }
          .ass div { border-top: 1px solid #111827; text-align: center; padding-top: 8px; }
          @media print { button { display: none; } body { margin: 0; } }
        </style>
      </head>
      <body>
        <button onclick="window.print()" style="padding:12px 18px;background:#1d4ed8;color:#fff;border:0;border-radius:10px;font-weight:bold;margin-bottom:20px;">IMPRIMIR</button>

        <div class="top center">
          <h1>${doc.empresaNome || "TH CLOUD ERP"}</h1>
          <p>${doc.empresaDocumento || ""} ${doc.empresaTelefone ? " • " + doc.empresaTelefone : ""}</p>
          <h2>${doc.tipo} ${doc.numero ? "Nº " + doc.numero : ""}</h2>
        </div>

        <div class="grid">
          <div class="box">
            <strong>CLIENTE</strong>
            <p>${doc.clienteNome || "-"}</p>
            <p>${doc.clienteDocumento || ""} ${doc.clienteTelefone ? " • " + doc.clienteTelefone : ""}</p>
          </div>

          <div class="box">
            <strong>EQUIPAMENTO</strong>
            <p>${doc.equipamento || "-"}</p>
            <p>${doc.imei ? "IMEI: " + doc.imei : ""}</p>
            <p>${doc.garantia || ""}</p>
          </div>
        </div>

        <div class="box">
          <strong>ITENS</strong>
          <table>
            <thead>
              <tr>
                <th>CÓDIGO</th>
                <th>DESCRIÇÃO</th>
                <th class="right">QTD</th>
                <th class="right">UNIT.</th>
                <th class="right">TOTAL</th>
              </tr>
            </thead>
            <tbody>${linhas}</tbody>
          </table>

          <div class="total">TOTAL: ${moeda(doc.total)}</div>
        </div>

        <div class="box">
          <strong>OBSERVAÇÕES</strong>
          <p>${doc.observacoes || "-"}</p>
        </div>

        <div class="ass">
          <div>ASSINATURA DO CLIENTE</div>
          <div>ASSINATURA DA EMPRESA</div>
        </div>
      </body>
    </html>
  `;

  const janela = window.open("", "_blank", "width=900,height=800");

  if (!janela) {
    alert("Libere pop-ups para imprimir.");
    return;
  }

  janela.document.open();
  janela.document.write(html);
  janela.document.close();
}
