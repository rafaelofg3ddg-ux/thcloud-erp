"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronDown,
  Crown,
  LogOut,
  Search,
  User,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type UsuarioLogado = {
  id: string;
  empresa_id: string | null;
  nome: string;
  email?: string;
  perfil: string;
  empresa_nome?: string;
  plano?: string;
};

type EmpresaLogada = {
  id?: string;
  empresa_id?: string;
  nome?: string;
  nome_fantasia?: string;
  razao_social?: string;
  plano?: string;
};

type NotificacaoSaas = {
  id: string;
  tipo: string | null;
  titulo: string | null;
  descricao: string | null;
  empresa_id: string | null;
  lida: boolean | null;
  created_at: string | null;
};

type NotificacaoCliente = {
  id: string;
  empresa_id: string | null;
  titulo: string;
  mensagem: string;
  tipo: string | null;
  destino: string | null;
  link: string | null;
  lida: boolean | null;
  ativo: boolean | null;
  automatico: boolean | null;
  created_at: string;
};

type ResultadoBusca = {
  titulo: string;
  descricao: string;
  rota: string;
  palavras: string;
};

const rotasBusca: ResultadoBusca[] = [
  {
    titulo: "Dashboard",
    descricao: "Resumo geral da empresa",
    rota: "/dashboard",
    palavras: "dashboard inicio painel principal faturamento vendas resumo",
  },
  {
    titulo: "Produtos",
    descricao: "Cadastro e consulta de produtos",
    rota: "/produtos",
    palavras: "produtos produto mercadoria cadastro preço codigo barras estoque",
  },
  {
    titulo: "Clientes",
    descricao: "Cadastro premium de clientes",
    rota: "/clientes",
    palavras: "clientes cliente cpf cnpj whatsapp limite credito cadastro",
  },
  {
    titulo: "Fornecedores",
    descricao: "Cadastro de fornecedores",
    rota: "/fornecedores",
    palavras: "fornecedores fornecedor compra caminhão nota fiscal",
  },
  {
    titulo: "Grupos",
    descricao: "Grupos ou categorias de produtos",
    rota: "/grupos",
    palavras: "grupos categorias categoria grupo produtos",
  },
  {
    titulo: "PDV",
    descricao: "Tela de venda rápida do caixa",
    rota: "/caixa/pdv",
    palavras: "pdv caixa venda cupom pagamento balcão finalizar",
  },
  {
    titulo: "Devoluções",
    descricao: "Registrar devolução de vendas",
    rota: "/vendas/devolucoes",
    palavras: "devolucao devoluções troca estorno retorno produto",
  },
  {
    titulo: "Entrada de Estoque",
    descricao: "Entrada de mercadorias",
    rota: "/estoque/entrada",
    palavras: "entrada estoque mercadoria compra nota fornecedor",
  },
  {
    titulo: "Financeiro",
    descricao: "Dashboard financeiro",
    rota: "/financeiro",
    palavras: "financeiro dinheiro caixa contas receber pagar fluxo dre",
  },
  {
    titulo: "Contas a Receber",
    descricao: "Títulos e recebimentos",
    rota: "/financeiro/contas-receber",
    palavras: "contas receber recebimento cliente crediario boleto",
  },
  {
    titulo: "Relatórios",
    descricao: "Central de relatórios",
    rota: "/relatorios",
    palavras: "relatorios relatório vendas financeiro estoque clientes imprimir",
  },
  {
    titulo: "Usuários",
    descricao: "Usuários e permissões",
    rota: "/usuarios",
    palavras: "usuarios usuario senha permissao perfil operador gerente",
  },
  {
    titulo: "Dashboard SaaS",
    descricao: "Painel master do Super Admin",
    rota: "/admin",
    palavras: "admin saas master dashboard empresas assinaturas clientes",
  },
  {
    titulo: "Empresas SaaS",
    descricao: "Clientes e empresas do sistema",
    rota: "/admin/empresas",
    palavras: "admin empresas clientes saas cadastro bloquear liberar plano",
  },
  {
    titulo: "Assinaturas SaaS",
    descricao: "Controle de mensalidades e vencimentos",
    rota: "/admin/assinaturas",
    palavras: "admin assinaturas mensalidade vencimento cobrança plano",
  },
  {
    titulo: "Cobranças SaaS",
    descricao: "Cobranças e pagamentos SaaS",
    rota: "/admin/cobrancas",
    palavras: "cobranças cobrancas pagamento mensalidade recebimento saas",
  },
  {
    titulo: "Financeiro SaaS",
    descricao: "MRR, ARR e financeiro do SaaS",
    rota: "/admin/financeiro",
    palavras: "financeiro saas mrr arr receita recorrente inadimplencia",
  },
  {
    titulo: "Planos SaaS",
    descricao: "Planos, preços e módulos",
    rota: "/admin/planos",
    palavras: "planos saas basico profissional premium enterprise modulos",
  },
];

export default function Header() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaLogada | null>(null);
  const [busca, setBusca] = useState("");
  const [abrirBusca, setAbrirBusca] = useState(false);
  const [abrirNotificacoes, setAbrirNotificacoes] = useState(false);
  const [abrirPerfil, setAbrirPerfil] = useState(false);
  const [notificacoesSaas, setNotificacoesSaas] = useState<NotificacaoSaas[]>([]);
  const [notificacoesCliente, setNotificacoesCliente] = useState<NotificacaoCliente[]>([]);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(false);

  const isSuperAdmin = usuario?.perfil === "Super Admin";

  function carregarSessao() {
    try {
      const usuarioStorage =
        sessionStorage.getItem("th_usuario") || localStorage.getItem("th_usuario");
      const empresaStorage =
        sessionStorage.getItem("th_empresa") || localStorage.getItem("th_empresa");

      if (usuarioStorage) setUsuario(JSON.parse(usuarioStorage));
      if (empresaStorage) setEmpresa(JSON.parse(empresaStorage));
    } catch {
      setUsuario(null);
      setEmpresa(null);
    }
  }

  function empresaIdAtual() {
    if (usuario?.empresa_id) return usuario.empresa_id;
    if (empresa?.id) return empresa.id;
    if (empresa?.empresa_id) return empresa.empresa_id;

    try {
      const usuarioStorage =
        sessionStorage.getItem("th_usuario") || localStorage.getItem("th_usuario");

      if (usuarioStorage) {
        const dados = JSON.parse(usuarioStorage);
        if (dados.empresa_id) return dados.empresa_id;
      }
    } catch {}

    return null;
  }

  function nomeEmpresa() {
    if (isSuperAdmin) return "Painel SaaS";

    return (
      empresa?.nome_fantasia ||
      empresa?.nome ||
      empresa?.razao_social ||
      usuario?.empresa_nome ||
      "Empresa não identificada"
    );
  }

  function planoEmpresa() {
    if (isSuperAdmin) return "Master";

    return empresa?.plano || usuario?.plano || "Plano Básico";
  }

  function iniciaisUsuario() {
    const nome = usuario?.nome || "U";
    return nome.trim().charAt(0).toUpperCase();
  }

  function perfilUsuario() {
    return usuario?.perfil || "Usuário";
  }

  function sair() {
    sessionStorage.removeItem("th_usuario");
    sessionStorage.removeItem("th_empresa");
    sessionStorage.removeItem("th_permissoes");

    localStorage.removeItem("th_usuario");
    localStorage.removeItem("th_empresa");
    localStorage.removeItem("th_permissoes");
    localStorage.removeItem("empresa_id");
    localStorage.removeItem("th_empresa_id");

    router.push("/login");
  }

  async function gerarNotificacoesSaasAutomaticas() {
    try {
      const hoje = new Date();
      const hojeISO = hoje.toISOString().split("T")[0];

      const seteDias = new Date();
      seteDias.setDate(seteDias.getDate() + 7);
      const seteDiasISO = seteDias.toISOString().split("T")[0];

      const { data: empresas } = await supabase
        .from("empresas")
        .select("id,nome_fantasia,razao_social,ativo,status_assinatura,data_vencimento_assinatura,created_at")
        .limit(200);

      const { data: cobrancas } = await supabase
        .from("cobrancas_saas")
        .select("id,empresa_id,valor,vencimento,status,empresas:empresa_id(nome_fantasia,razao_social)")
        .limit(200);

      const avisos: {
        tipo: string;
        titulo: string;
        descricao: string;
        empresa_id: string | null;
      }[] = [];

      (empresas || []).forEach((empresa: any) => {
        const nome = empresa.nome_fantasia || empresa.razao_social || "Empresa sem nome";

        if (empresa.ativo === false || empresa.status_assinatura === "Bloqueado") {
          avisos.push({
            tipo: "bloqueio",
            titulo: "Empresa bloqueada",
            descricao: `${nome} está com acesso bloqueado no SaaS.`,
            empresa_id: empresa.id,
          });
        }

        if (
          empresa.data_vencimento_assinatura &&
          empresa.data_vencimento_assinatura < hojeISO
        ) {
          avisos.push({
            tipo: "vencida",
            titulo: "Assinatura vencida",
            descricao: `${nome} está com assinatura vencida desde ${empresa.data_vencimento_assinatura}.`,
            empresa_id: empresa.id,
          });
        }

        if (
          empresa.data_vencimento_assinatura &&
          empresa.data_vencimento_assinatura >= hojeISO &&
          empresa.data_vencimento_assinatura <= seteDiasISO
        ) {
          avisos.push({
            tipo: "vencendo",
            titulo: "Assinatura vencendo",
            descricao: `${nome} vence em breve: ${empresa.data_vencimento_assinatura}.`,
            empresa_id: empresa.id,
          });
        }

        if (empresa.status_assinatura === "Teste") {
          avisos.push({
            tipo: "teste",
            titulo: "Empresa em teste",
            descricao: `${nome} está em período de teste.`,
            empresa_id: empresa.id,
          });
        }
      });

      (cobrancas || []).forEach((cobranca: any) => {
        const empresaRelacionada = Array.isArray(cobranca.empresas)
          ? cobranca.empresas[0]
          : cobranca.empresas;

        const nome =
          empresaRelacionada?.nome_fantasia ||
          empresaRelacionada?.razao_social ||
          "Empresa não informada";

        if (
          cobranca.status !== "Pago" &&
          cobranca.status !== "Cancelado" &&
          cobranca.vencimento &&
          cobranca.vencimento < hojeISO
        ) {
          avisos.push({
            tipo: "cobranca_vencida",
            titulo: "Cobrança SaaS vencida",
            descricao: `${nome} possui cobrança SaaS vencida em ${cobranca.vencimento}.`,
            empresa_id: cobranca.empresa_id,
          });
        }
      });

      for (const aviso of avisos.slice(0, 20)) {
        const { data: existente } = await supabase
          .from("notificacoes_saas")
          .select("id")
          .eq("tipo", aviso.tipo)
          .eq("empresa_id", aviso.empresa_id)
          .eq("titulo", aviso.titulo)
          .eq("descricao", aviso.descricao)
          .gte("created_at", hojeISO)
          .maybeSingle();

        if (!existente) {
          await supabase.from("notificacoes_saas").insert([aviso]);
        }
      }
    } catch {
      // Falha silenciosa para não travar o cabeçalho.
    }
  }

  async function carregarNotificacoes() {
    setCarregandoNotificacoes(true);

    try {
      if (isSuperAdmin) {
        await gerarNotificacoesSaasAutomaticas();

        const { data, error } = await supabase
          .from("notificacoes_saas")
          .select("id,tipo,titulo,descricao,empresa_id,lida,created_at")
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          setNotificacoesSaas([]);
          setCarregandoNotificacoes(false);
          return;
        }

        setNotificacoesSaas((data || []) as NotificacaoSaas[]);
        setNotificacoesCliente([]);
        setCarregandoNotificacoes(false);
        return;
      }

      const empresaId = empresaIdAtual();
      const perfil = usuario?.perfil || "";

      if (!empresaId) {
        setNotificacoesCliente([]);
        setCarregandoNotificacoes(false);
        return;
      }

      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .eq("ativo", true)
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        setNotificacoesCliente([]);
        setCarregandoNotificacoes(false);
        return;
      }

      setNotificacoesCliente((data || []) as NotificacaoCliente[]);
      setNotificacoesSaas([]);
    } catch {
      setNotificacoesSaas([]);
      setNotificacoesCliente([]);
    }

    setCarregandoNotificacoes(false);
  }

  async function marcarSaasComoLida(notificacao: NotificacaoSaas) {
    if (notificacao.lida !== true) {
      await supabase
        .from("notificacoes_saas")
        .update({ lida: true })
        .eq("id", notificacao.id);

      setNotificacoesSaas((lista) =>
        lista.map((item) =>
          item.id === notificacao.id ? { ...item, lida: true } : item
        )
      );
    }

    setAbrirNotificacoes(false);

    if (
      notificacao.tipo === "cobranca_vencida" ||
      notificacao.tipo === "pagamento"
    ) {
      router.push("/admin/cobrancas");
    } else {
      router.push("/admin/empresas");
    }
  }

  async function marcarClienteComoLida(notificacao: NotificacaoCliente) {
    if (notificacao.lida !== true) {
      await supabase
        .from("notificacoes")
        .update({ lida: true, updated_at: new Date().toISOString() })
        .eq("id", notificacao.id);

      setNotificacoesCliente((lista) =>
        lista.map((item) =>
          item.id === notificacao.id ? { ...item, lida: true } : item
        )
      );
    }

    if (notificacao.link) {
      setAbrirNotificacoes(false);
      router.push(notificacao.link);
    }
  }

  function executarBusca(item?: ResultadoBusca) {
    if (item) {
      setBusca("");
      setAbrirBusca(false);
      router.push(item.rota);
      return;
    }

    const termo = busca.trim();

    if (!termo) {
      setAbrirBusca(false);
      return;
    }

    const encontrado = resultadosBusca[0];

    if (encontrado) {
      setBusca("");
      setAbrirBusca(false);
      router.push(encontrado.rota);
      return;
    }

    alert("Nenhuma tela encontrada para: " + busca);
  }

  const resultadosBusca = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return rotasBusca.slice(0, 6);

    return rotasBusca
      .filter((item) => {
        const texto = `${item.titulo} ${item.descricao} ${item.palavras}`.toLowerCase();
        return texto.includes(termo);
      })
      .slice(0, 8);
  }, [busca]);

  const naoLidasSaas = notificacoesSaas.filter((item) => item.lida !== true).length;
  const naoLidasCliente = notificacoesCliente.filter((item) => item.lida !== true).length;
  const naoLidas = isSuperAdmin ? naoLidasSaas : naoLidasCliente;

  useEffect(() => {
    carregarSessao();
  }, []);

  useEffect(() => {
    if (usuario) carregarNotificacoes();
  }, [usuario]);

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-5 lg:px-8 sticky top-0 z-40">
      <div className="min-w-[190px]">
        <h1 className="text-xl font-black text-slate-900">THCloud ERP</h1>
        <p className="text-sm text-slate-500 leading-tight">
          {isSuperAdmin
            ? "Painel Master SaaS"
            : "Sistema de gestão inteligente para varejo"}
        </p>
      </div>

      <div className="relative w-full max-w-xl mx-4 lg:mx-8 hidden md:block">
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
          <Search size={18} className="text-slate-400 mr-3" />

          <input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setAbrirBusca(true);
            }}
            onFocus={() => setAbrirBusca(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") executarBusca();
              if (e.key === "Escape") setAbrirBusca(false);
            }}
            placeholder="Pesquisar no sistema..."
            className="w-full bg-transparent outline-none text-slate-900 font-medium"
          />

          {busca && (
            <button
              onClick={() => setBusca("")}
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {abrirBusca && (
          <div className="absolute left-0 right-0 top-16 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50">
            <div className="p-3 border-b bg-slate-50 flex items-center justify-between">
              <span className="text-sm font-black text-slate-700">
                Resultado da busca
              </span>

              <button
                onClick={() => executarBusca()}
                className="text-xs bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-xl font-bold"
              >
                Abrir primeiro
              </button>
            </div>

            {resultadosBusca.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {resultadosBusca.map((item) => (
                  <button
                    key={item.rota}
                    onClick={() => executarBusca(item)}
                    className="w-full text-left p-4 hover:bg-blue-50 border-b last:border-b-0"
                  >
                    <p className="font-black text-slate-900">{item.titulo}</p>
                    <p className="text-sm text-slate-500">{item.descricao}</p>
                    <p className="text-xs text-blue-700 mt-1">{item.rota}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-5 text-center text-slate-500">
                Nenhuma tela encontrada.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 lg:gap-4">
        <div className="hidden xl:block text-right">
          <p className="text-sm text-slate-900 font-black">
            {usuario?.nome || "-"}
          </p>

          <p className="text-xs text-slate-500">{nomeEmpresa()}</p>

          <p className="text-xs text-blue-700 font-black flex items-center justify-end gap-1">
            <Crown size={12} /> {planoEmpresa()}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setAbrirNotificacoes(!abrirNotificacoes);
              setAbrirPerfil(false);
              carregarNotificacoes();
            }}
            className="relative h-12 w-12 rounded-2xl bg-yellow-50 hover:bg-yellow-100 text-yellow-700 flex items-center justify-center"
          >
            <Bell size={20} />

            {naoLidas > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-black h-5 min-w-5 rounded-full flex items-center justify-center px-1">
                {naoLidas}
              </span>
            )}
          </button>

          {abrirNotificacoes && (
            <div className="absolute right-0 mt-3 w-[94vw] max-w-[430px] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-50">
              <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-900">
                    {isSuperAdmin ? "Notificações SaaS" : "Notificações"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isSuperAdmin
                      ? "Somente alertas do seu negócio SaaS"
                      : "Avisos da empresa logada"}
                  </p>
                </div>

                {isSuperAdmin && (
                  <Link
                    href="/admin/empresas"
                    onClick={() => setAbrirNotificacoes(false)}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-xl text-xs font-black"
                  >
                    Empresas
                  </Link>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {carregandoNotificacoes && (
                  <div className="p-5 text-center text-slate-500">Carregando...</div>
                )}

                {!carregandoNotificacoes &&
                  isSuperAdmin &&
                  notificacoesSaas.length === 0 && (
                    <div className="p-5 text-center text-slate-500">
                      Nenhuma notificação SaaS encontrada.
                    </div>
                  )}

                {!carregandoNotificacoes &&
                  !isSuperAdmin &&
                  notificacoesCliente.length === 0 && (
                    <div className="p-5 text-center text-slate-500">
                      Nenhuma notificação encontrada.
                    </div>
                  )}

                {!carregandoNotificacoes &&
                  isSuperAdmin &&
                  notificacoesSaas.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => marcarSaasComoLida(item)}
                      className={`w-full text-left p-4 border-b last:border-b-0 hover:bg-blue-50 ${
                        item.lida === true ? "bg-white" : "bg-yellow-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900">
                            {item.titulo || "Alerta SaaS"}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            {item.descricao || "-"}
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                            {item.created_at
                              ? new Date(item.created_at).toLocaleString("pt-BR")
                              : "-"}
                          </p>
                        </div>

                        {item.lida !== true && (
                          <span className="h-3 w-3 rounded-full bg-red-600 mt-1 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}

                {!carregandoNotificacoes &&
                  !isSuperAdmin &&
                  notificacoesCliente.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => marcarClienteComoLida(item)}
                      className={`w-full text-left p-4 border-b last:border-b-0 hover:bg-blue-50 ${
                        item.lida === true ? "bg-white" : "bg-yellow-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900">{item.titulo}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            {item.mensagem}
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                            {new Date(item.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>

                        {item.lida !== true && (
                          <span className="h-3 w-3 rounded-full bg-red-600 mt-1 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setAbrirPerfil(!abrirPerfil);
              setAbrirNotificacoes(false);
            }}
            className="h-12 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-3 px-4 font-black"
          >
            <span className="h-8 w-8 bg-white/15 rounded-xl flex items-center justify-center">
              {iniciaisUsuario()}
            </span>

            <ChevronDown size={16} />
          </button>

          {abrirPerfil && (
            <div className="absolute right-0 mt-3 w-[92vw] max-w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-50">
              <div className="p-5 bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-blue-700 flex items-center justify-center font-black text-2xl">
                    {iniciaisUsuario()}
                  </div>

                  <div>
                    <p className="font-black text-lg">{usuario?.nome || "Usuário"}</p>
                    <p className="text-slate-300 text-sm">
                      {usuario?.email || perfilUsuario()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex gap-3">
                  <User className="text-blue-700" />

                  <div>
                    <p className="text-xs text-slate-500 font-bold">
                      Usuário logado
                    </p>
                    <p className="font-black text-slate-900">
                      {usuario?.nome || "-"}
                    </p>
                    <p className="text-sm text-blue-700 font-bold">
                      {perfilUsuario()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Building2 className="text-green-700" />

                  <div>
                    <p className="text-xs text-slate-500 font-bold">
                      Ambiente
                    </p>
                    <p className="font-black text-slate-900">{nomeEmpresa()}</p>
                    <p className="text-sm text-blue-700 font-black flex items-center gap-1 mt-1">
                      <Crown size={14} /> {planoEmpresa()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {isSuperAdmin ? (
                    <>
                      <Link
                        href="/admin/empresas"
                        onClick={() => setAbrirPerfil(false)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-3 rounded-2xl font-black text-center"
                      >
                        Empresas SaaS
                      </Link>

                      <Link
                        href="/admin/financeiro"
                        onClick={() => setAbrirPerfil(false)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-3 rounded-2xl font-black text-center"
                      >
                        Financeiro SaaS
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/empresas"
                      onClick={() => setAbrirPerfil(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-3 rounded-2xl font-black text-center"
                    >
                      Minha Empresa
                    </Link>
                  )}

                  <button
                    onClick={sair}
                    className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-3 rounded-2xl font-black"
                  >
                    <LogOut size={16} className="inline mr-2" />
                    Sair do Sistema
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
