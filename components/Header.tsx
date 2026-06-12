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
import { gerarNotificacoesAutomaticas } from "../lib/notificacoes";

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

type Notificacao = {
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
  { titulo: "Dashboard", descricao: "Resumo geral da empresa", rota: "/dashboard", palavras: "dashboard inicio painel principal faturamento vendas resumo" },
  { titulo: "Produtos", descricao: "Cadastro e consulta de produtos", rota: "/produtos", palavras: "produtos produto mercadoria cadastro preço codigo barras estoque" },
  { titulo: "Clientes", descricao: "Cadastro premium de clientes", rota: "/clientes", palavras: "clientes cliente cpf cnpj whatsapp limite credito cadastro" },
  { titulo: "Fornecedores", descricao: "Cadastro de fornecedores", rota: "/fornecedores", palavras: "fornecedores fornecedor compra caminhão nota fiscal" },
  { titulo: "Grupos", descricao: "Grupos ou categorias de produtos", rota: "/grupos", palavras: "grupos categorias categoria grupo produtos" },
  { titulo: "PDV", descricao: "Tela de venda rápida do caixa", rota: "/caixa/pdv", palavras: "pdv caixa venda cupom pagamento balcão finalizar" },
  { titulo: "Consulta de Vendas", descricao: "Consultar vendas realizadas", rota: "/vendas/consulta", palavras: "consulta vendas venda pesquisar reimprimir cupom" },
  { titulo: "Devoluções", descricao: "Registrar devolução de vendas", rota: "/vendas/devolucoes", palavras: "devolucao devoluções troca estorno retorno produto" },
  { titulo: "Entrada de Estoque", descricao: "Entrada de mercadorias", rota: "/estoque/entrada", palavras: "entrada estoque mercadoria compra nota fornecedor" },
  { titulo: "Ajuste Manual", descricao: "Ajuste manual de estoque", rota: "/estoque/ajuste", palavras: "ajuste estoque manual inventario corrigir quantidade" },
  { titulo: "Inventário", descricao: "Inventário de estoque", rota: "/estoque/inventario", palavras: "inventario estoque contagem produtos conferencia" },
  { titulo: "Financeiro", descricao: "Dashboard financeiro", rota: "/financeiro", palavras: "financeiro dinheiro caixa contas receber pagar fluxo dre" },
  { titulo: "Contas a Receber", descricao: "Títulos e recebimentos", rota: "/financeiro/contas-receber", palavras: "contas receber recebimento cliente crediario boleto" },
  { titulo: "Contas a Pagar", descricao: "Despesas e pagamentos", rota: "/financeiro/contas-pagar", palavras: "contas pagar despesas fornecedor aluguel energia internet" },
  { titulo: "Relatórios", descricao: "Central de relatórios", rota: "/relatorios", palavras: "relatorios relatório vendas financeiro estoque clientes imprimir" },
  { titulo: "Minha Empresa", descricao: "Dados da empresa logada", rota: "/empresas", palavras: "empresa minha empresa configuração cnpj dados loja" },
  { titulo: "Usuários", descricao: "Usuários e permissões", rota: "/usuarios", palavras: "usuarios usuario senha permissao perfil operador gerente" },
  { titulo: "Notificações SaaS", descricao: "Painel do Super Admin para avisos", rota: "/admin/notificacoes", palavras: "notificações notificacao avisos alerta super admin saas" },
];

export default function Header() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaLogada | null>(null);
  const [busca, setBusca] = useState("");
  const [abrirBusca, setAbrirBusca] = useState(false);
  const [abrirNotificacoes, setAbrirNotificacoes] = useState(false);
  const [abrirPerfil, setAbrirPerfil] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregandoNotificacoes, setCarregandoNotificacoes] = useState(false);

  function carregarSessao() {
    try {
      const usuarioStorage = localStorage.getItem("th_usuario");
      const empresaStorage = localStorage.getItem("th_empresa");

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
      const usuarioStorage = localStorage.getItem("th_usuario");
      if (usuarioStorage) {
        const dados = JSON.parse(usuarioStorage);
        if (dados.empresa_id) return dados.empresa_id;
      }
    } catch {}

    return null;
  }

  function nomeEmpresa() {
    return (
      empresa?.nome_fantasia ||
      empresa?.nome ||
      empresa?.razao_social ||
      usuario?.empresa_nome ||
      "Empresa não identificada"
    );
  }

  function planoEmpresa() {
    return empresa?.plano || usuario?.plano || "Plano Premium";
  }

  function iniciaisUsuario() {
    const nome = usuario?.nome || "U";
    return nome.trim().charAt(0).toUpperCase();
  }

  function perfilUsuario() {
    return usuario?.perfil || "Usuário";
  }

  function sair() {
    localStorage.removeItem("th_usuario");
    localStorage.removeItem("th_empresa");
    router.push("/login");
  }

  async function carregarNotificacoes() {
    setCarregandoNotificacoes(true);

    const empresaId = empresaIdAtual();
    const perfil = usuario?.perfil || "";
    const isSuperAdmin = perfil === "Super Admin";

    if (empresaId && !isSuperAdmin) {
      await gerarNotificacoesAutomaticas(empresaId, usuario?.nome || "Sistema");
    }

    let query = supabase
      .from("notificacoes")
      .select("*")
      .eq("ativo", true)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!isSuperAdmin && empresaId) {
      query = query.or(
        `empresa_id.eq.${empresaId},empresa_id.is.null,destino.eq.todos,destino.eq.${perfil}`
      );
    }

    const { data, error } = await query;

    if (error) {
      setNotificacoes([]);
      setCarregandoNotificacoes(false);
      return;
    }

    setNotificacoes((data || []) as Notificacao[]);
    setCarregandoNotificacoes(false);
  }

  async function marcarComoLida(notificacao: Notificacao) {
    if (notificacao.lida !== true) {
      await supabase
        .from("notificacoes")
        .update({ lida: true, updated_at: new Date().toISOString() })
        .eq("id", notificacao.id);

      setNotificacoes((lista) =>
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

  const naoLidas = notificacoes.filter((item) => item.lida !== true).length;

  useEffect(() => {
    carregarSessao();
  }, []);

  useEffect(() => {
    if (usuario) carregarNotificacoes();
  }, [usuario]);

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
      <div>
        <h1 className="text-xl font-black text-slate-900">THCloud ERP</h1>
        <p className="text-sm text-slate-500">Sistema de gestão inteligente para varejo</p>
      </div>

      <div className="relative w-full max-w-xl mx-8">
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
            <button onClick={() => setBusca("")} className="text-slate-400 hover:text-slate-700">
              <X size={17} />
            </button>
          )}
        </div>

        {abrirBusca && (
          <div className="absolute left-0 right-0 top-16 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50">
            <div className="p-3 border-b bg-slate-50 flex items-center justify-between">
              <span className="text-sm font-black text-slate-700">Resultado da busca</span>

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
              <div className="p-5 text-center text-slate-500">Nenhuma tela encontrada.</div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden xl:block text-right">
          <p className="text-sm text-slate-900 font-black">{usuario?.nome || "-"}</p>

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
            <div className="absolute right-0 mt-3 w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-50">
              <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-900">Notificações</p>
                  <p className="text-xs text-slate-500">Avisos manuais e automáticos</p>
                </div>

                {usuario?.perfil === "Super Admin" && (
                  <Link
                    href="/admin/notificacoes"
                    onClick={() => setAbrirNotificacoes(false)}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-xl text-xs font-black"
                  >
                    Gerenciar
                  </Link>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {carregandoNotificacoes && (
                  <div className="p-5 text-center text-slate-500">Carregando...</div>
                )}

                {!carregandoNotificacoes && notificacoes.length === 0 && (
                  <div className="p-5 text-center text-slate-500">Nenhuma notificação encontrada.</div>
                )}

                {!carregandoNotificacoes &&
                  notificacoes.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => marcarComoLida(item)}
                      className={`w-full text-left p-4 border-b last:border-b-0 hover:bg-blue-50 ${
                        item.lida === true ? "bg-white" : "bg-yellow-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900">{item.titulo}</p>
                          <p className="text-sm text-slate-600 mt-1">{item.mensagem}</p>
                          <p className="text-xs text-slate-400 mt-2">
                            {new Date(item.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>

                        {item.lida !== true && <span className="h-3 w-3 rounded-full bg-red-600 mt-1" />}
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
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-50">
              <div className="p-5 bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-blue-700 flex items-center justify-center font-black text-2xl">
                    {iniciaisUsuario()}
                  </div>

                  <div>
                    <p className="font-black text-lg">{usuario?.nome || "Usuário"}</p>
                    <p className="text-slate-300 text-sm">{usuario?.email || perfilUsuario()}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex gap-3">
                  <User className="text-blue-700" />

                  <div>
                    <p className="text-xs text-slate-500 font-bold">Usuário logado</p>
                    <p className="font-black text-slate-900">{usuario?.nome || "-"}</p>
                    <p className="text-sm text-blue-700 font-bold">{perfilUsuario()}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Building2 className="text-green-700" />

                  <div>
                    <p className="text-xs text-slate-500 font-bold">Empresa logada</p>
                    <p className="font-black text-slate-900">{nomeEmpresa()}</p>
                    <p className="text-sm text-blue-700 font-black flex items-center gap-1 mt-1">
                      <Crown size={14} /> {planoEmpresa()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Link
                    href="/empresas"
                    onClick={() => setAbrirPerfil(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-3 rounded-2xl font-black text-center"
                  >
                    Minha Empresa
                  </Link>

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
