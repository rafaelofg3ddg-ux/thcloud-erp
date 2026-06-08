"use client";

import Link from "next/link";
import {
  BarChart3,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  FileText,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";

type Relatorio = {
  titulo: string;
  descricao: string;
  href: string;
  cor: string;
  icone: React.ReactNode;
  grupo: string;
};

export default function RelatoriosPage() {
  const relatorios: Relatorio[] = [
    {
      titulo: "DRE",
      descricao: "Demonstrativo de Resultado com receitas, despesas e resultado líquido.",
      href: "/relatorios/dre",
      cor: "text-blue-700",
      icone: <BarChart3 size={28} />,
      grupo: "Financeiro",
    },
    {
      titulo: "Fluxo de Caixa",
      descricao: "Entradas, saídas, saldo e contas em aberto.",
      href: "/relatorios/fluxo-caixa",
      cor: "text-green-700",
      icone: <Wallet size={28} />,
      grupo: "Financeiro",
    },
    {
      titulo: "Contas a Receber",
      descricao: "Clientes, títulos em aberto e valores a receber.",
      href: "/relatorios/contas-receber",
      cor: "text-purple-700",
      icone: <CircleDollarSign size={28} />,
      grupo: "Financeiro",
    },
    {
      titulo: "Contas a Pagar",
      descricao: "Despesas, vencimentos e pagamentos.",
      href: "/relatorios/contas-pagar",
      cor: "text-red-700",
      icone: <FileText size={28} />,
      grupo: "Financeiro",
    },
    {
      titulo: "Clientes Inadimplentes",
      descricao: "Contas vencidas, dias em atraso e maiores devedores.",
      href: "/relatorios/inadimplentes",
      cor: "text-orange-700",
      icone: <Users size={28} />,
      grupo: "Financeiro",
    },
    {
      titulo: "Formas de Pagamento",
      descricao: "Valores recebidos por dinheiro, Pix, cartão e outras formas.",
      href: "/relatorios/formas-pagamento",
      cor: "text-cyan-700",
      icone: <CreditCard size={28} />,
      grupo: "Financeiro",
    },
    {
      titulo: "Vendas por Período",
      descricao: "Faturamento, ticket médio, vendas por dia e vendas detalhadas.",
      href: "/relatorios/vendas",
      cor: "text-emerald-700",
      icone: <ShoppingCart size={28} />,
      grupo: "Vendas",
    },
    {
      titulo: "Produtos Mais Vendidos",
      descricao: "Ranking dos produtos por quantidade vendida e faturamento.",
      href: "/relatorios/produtos-mais-vendidos",
      cor: "text-yellow-700",
      icone: <TrendingUp size={28} />,
      grupo: "Vendas",
    },
    {
      titulo: "Ranking de Clientes",
      descricao: "Clientes que mais compraram, ticket médio e participação.",
      href: "/relatorios/ranking-clientes",
      cor: "text-indigo-700",
      icone: <Users size={28} />,
      grupo: "Vendas",
    },
    {
      titulo: "Lucratividade",
      descricao: "Receita, custo, lucro bruto e margem por produto vendido.",
      href: "/relatorios/lucratividade",
      cor: "text-blue-800",
      icone: <TrendingUp size={28} />,
      grupo: "Vendas",
    },
    {
      titulo: "Produtos",
      descricao: "Cadastro de produtos, preços, estoque e situação.",
      href: "/relatorios/produtos",
      cor: "text-orange-700",
      icone: <Package size={28} />,
      grupo: "Estoque",
    },
    {
      titulo: "Estoque",
      descricao: "Produtos em estoque, estoque baixo e valor de inventário.",
      href: "/relatorios/estoque",
      cor: "text-slate-700",
      icone: <Warehouse size={28} />,
      grupo: "Estoque",
    },
    {
      titulo: "Curva ABC",
      descricao: "Classificação de produtos por participação no faturamento.",
      href: "/relatorios/curva-abc",
      cor: "text-pink-700",
      icone: <Boxes size={28} />,
      grupo: "Estoque",
    },
    {
      titulo: "Compras por Fornecedor",
      descricao: "Fornecedores, produtos vinculados e valor potencial do estoque.",
      href: "/relatorios/compras-fornecedor",
      cor: "text-teal-700",
      icone: <ClipboardList size={28} />,
      grupo: "Compras",
    },
    {
      titulo: "Clientes",
      descricao: "Clientes cadastrados, contatos e limites de crédito.",
      href: "/relatorios/clientes",
      cor: "text-violet-700",
      icone: <Users size={28} />,
      grupo: "Cadastros",
    },
  ];

  const grupos = ["Financeiro", "Vendas", "Estoque", "Compras", "Cadastros"];

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-3xl p-8 shadow-lg mb-8 text-white">
        <p className="text-blue-100 font-bold">
          THCloud ERP
        </p>

        <h1 className="text-4xl font-black mt-2">
          Central de Relatórios
        </h1>

        <p className="text-blue-100 mt-2 max-w-3xl">
          Acesse relatórios financeiros, comerciais, estoque, clientes, fornecedores e indicadores gerenciais do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <Resumo titulo="Relatórios" valor={`${relatorios.length}`} detalhe="Relatórios disponíveis" />
        <Resumo titulo="Financeiro" valor="6" detalhe="Análises financeiras" />
        <Resumo titulo="Vendas" valor="4" detalhe="Indicadores comerciais" />
        <Resumo titulo="Estoque" valor="3" detalhe="Produtos e inventário" />
      </div>

      <div className="space-y-8">
        {grupos.map((grupo) => {
          const lista = relatorios.filter((relatorio) => relatorio.grupo === grupo);

          if (lista.length === 0) return null;

          return (
            <section key={grupo}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">
                    {grupo}
                  </h2>

                  <p className="text-slate-500">
                    Relatórios do módulo {grupo.toLowerCase()}.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {lista.map((relatorio) => (
                  <Link
                    key={relatorio.href}
                    href={relatorio.href}
                    className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center ${relatorio.cor}`}>
                        {relatorio.icone}
                      </div>

                      <div className="flex-1">
                        <h3 className={`text-xl font-black ${relatorio.cor}`}>
                          {relatorio.titulo}
                        </h3>

                        <p className="text-slate-500 mt-2 leading-relaxed">
                          {relatorio.descricao}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Resumo({
  titulo,
  valor,
  detalhe,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
      <p className="text-sm font-bold text-slate-500">
        {titulo}
      </p>

      <h2 className="text-3xl font-black text-blue-700 mt-2">
        {valor}
      </h2>

      <p className="text-sm text-slate-500 mt-2">
        {detalhe}
      </p>
    </div>
  );
}
