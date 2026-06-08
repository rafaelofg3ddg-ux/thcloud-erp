"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
  CheckCircle,
  Edit,
  Package,
  Plus,
  Search,
  Shield,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

type PlanoSaas = {
  id: string;
  nome: string;
  descricao: string | null;
  valor_mensal: number | null;
  limite_usuarios: number | null;
  limite_produtos: number | null;
  limite_filiais: number | null;
  modulo_fiscal: boolean | null;
  modulo_whatsapp: boolean | null;
  modulo_crm: boolean | null;
  modulo_delivery: boolean | null;
  modulo_multiloja: boolean | null;
  modulo_relatorios_premium: boolean | null;
  ativo: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type FormPlano = {
  id: string;
  nome: string;
  descricao: string;
  valor_mensal: string;
  limite_usuarios: string;
  limite_produtos: string;
  limite_filiais: string;
  modulo_fiscal: boolean;
  modulo_whatsapp: boolean;
  modulo_crm: boolean;
  modulo_delivery: boolean;
  modulo_multiloja: boolean;
  modulo_relatorios_premium: boolean;
  ativo: boolean;
};

const formInicial: FormPlano = {
  id: "",
  nome: "",
  descricao: "",
  valor_mensal: "0",
  limite_usuarios: "",
  limite_produtos: "",
  limite_filiais: "",
  modulo_fiscal: false,
  modulo_whatsapp: false,
  modulo_crm: false,
  modulo_delivery: false,
  modulo_multiloja: false,
  modulo_relatorios_premium: false,
  ativo: true,
};

export default function AdminPlanosPage() {
  const [planos, setPlanos] = useState<PlanoSaas[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [form, setForm] = useState<FormPlano>(formInicial);

  function moeda(valor: number | null) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function numero(valor: number | null) {
    if (valor === null || valor === undefined) return "Ilimitado";
    return Number(valor || 0).toLocaleString("pt-BR");
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function quantidadeModulos(plano: PlanoSaas) {
    return [
      plano.modulo_fiscal,
      plano.modulo_whatsapp,
      plano.modulo_crm,
      plano.modulo_delivery,
      plano.modulo_multiloja,
      plano.modulo_relatorios_premium,
    ].filter(Boolean).length;
  }

  function abrirNovoPlano() {
    setForm(formInicial);
    setModoEdicao(false);
    setModalAberto(true);
  }

  function abrirEditarPlano(plano: PlanoSaas) {
    setForm({
      id: plano.id,
      nome: plano.nome || "",
      descricao: plano.descricao || "",
      valor_mensal: String(Number(plano.valor_mensal || 0)),
      limite_usuarios:
        plano.limite_usuarios === null || plano.limite_usuarios === undefined
          ? ""
          : String(plano.limite_usuarios),
      limite_produtos:
        plano.limite_produtos === null || plano.limite_produtos === undefined
          ? ""
          : String(plano.limite_produtos),
      limite_filiais:
        plano.limite_filiais === null || plano.limite_filiais === undefined
          ? ""
          : String(plano.limite_filiais),
      modulo_fiscal: plano.modulo_fiscal === true,
      modulo_whatsapp: plano.modulo_whatsapp === true,
      modulo_crm: plano.modulo_crm === true,
      modulo_delivery: plano.modulo_delivery === true,
      modulo_multiloja: plano.modulo_multiloja === true,
      modulo_relatorios_premium: plano.modulo_relatorios_premium === true,
      ativo: plano.ativo !== false,
    });

    setModoEdicao(true);
    setModalAberto(true);
  }

  function validarFormulario() {
    if (!form.nome.trim()) {
      alert("Informe o nome do plano.");
      return false;
    }

    const valor = Number(String(form.valor_mensal).replace(",", "."));

    if (Number.isNaN(valor) || valor < 0) {
      alert("Informe um valor mensal válido.");
      return false;
    }

    return true;
  }

  function valorInteiroOuNull(valor: string) {
    if (!valor.trim()) return null;

    const n = Number(valor);

    if (Number.isNaN(n)) return null;

    return n;
  }

  async function carregarPlanos() {
    setCarregando(true);
    setErroCarregamento("");

    const { data, error } = await supabase
      .from("planos_saas")
      .select(
        "id,nome,descricao,valor_mensal,limite_usuarios,limite_produtos,limite_filiais,modulo_fiscal,modulo_whatsapp,modulo_crm,modulo_delivery,modulo_multiloja,modulo_relatorios_premium,ativo,created_at,updated_at"
      )
      .order("valor_mensal", { ascending: true });

    setCarregando(false);

    if (error) {
      const mensagem = "Erro ao carregar planos: " + error.message;
      setErroCarregamento(mensagem);
      alert(mensagem);
      return;
    }

    setPlanos(data || []);

    if (!data || data.length === 0) {
      setErroCarregamento(
        "Nenhum plano retornou para a tela. Se no Supabase existem planos, desative o RLS da tabela planos_saas ou crie uma policy de leitura."
      );
    }
  }

  async function salvarPlano() {
    if (!validarFormulario()) return;

    setSalvando(true);

    const dados = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      valor_mensal: Number(String(form.valor_mensal).replace(",", ".")),
      limite_usuarios: valorInteiroOuNull(form.limite_usuarios),
      limite_produtos: valorInteiroOuNull(form.limite_produtos),
      limite_filiais: valorInteiroOuNull(form.limite_filiais),
      modulo_fiscal: form.modulo_fiscal,
      modulo_whatsapp: form.modulo_whatsapp,
      modulo_crm: form.modulo_crm,
      modulo_delivery: form.modulo_delivery,
      modulo_multiloja: form.modulo_multiloja,
      modulo_relatorios_premium: form.modulo_relatorios_premium,
      ativo: form.ativo,
      updated_at: new Date().toISOString(),
    };

    if (modoEdicao) {
      const { error } = await supabase
        .from("planos_saas")
        .update(dados)
        .eq("id", form.id);

      setSalvando(false);

      if (error) {
        alert("Erro ao atualizar plano: " + error.message);
        return;
      }

      alert("Plano atualizado com sucesso!");
    } else {
      const { error } = await supabase.from("planos_saas").insert(dados);

      setSalvando(false);

      if (error) {
        alert("Erro ao cadastrar plano: " + error.message);
        return;
      }

      alert("Plano cadastrado com sucesso!");
    }

    setModalAberto(false);
    setForm(formInicial);
    carregarPlanos();
  }

  async function alterarStatus(plano: PlanoSaas) {
    const acao = plano.ativo !== false ? "inativar" : "ativar";

    const confirmar = confirm(
      `Deseja realmente ${acao} o plano ${plano.nome}?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("planos_saas")
      .update({
        ativo: plano.ativo === false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", plano.id);

    if (error) {
      alert("Erro ao alterar status: " + error.message);
      return;
    }

    carregarPlanos();
  }

  async function excluirPlano(plano: PlanoSaas) {
    const confirmar = confirm(
      `Deseja realmente excluir o plano ${plano.nome}? Se ele estiver vinculado a alguma empresa, o Supabase pode bloquear a exclusão.`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("planos_saas")
      .delete()
      .eq("id", plano.id);

    if (error) {
      alert(
        "Erro ao excluir plano. Ele pode estar vinculado a empresas: " +
          error.message
      );
      return;
    }

    alert("Plano excluído com sucesso!");
    carregarPlanos();
  }

  useEffect(() => {
    carregarPlanos();
  }, []);

  const planosFiltrados = planos.filter((plano) => {
    const termo = busca.trim().toLowerCase();

    const bateBusca =
      termo === "" ||
      plano.nome.toLowerCase().includes(termo) ||
      String(plano.descricao || "").toLowerCase().includes(termo);

    const bateStatus =
      filtroStatus === "Todos" ||
      (filtroStatus === "Ativos" && plano.ativo !== false) ||
      (filtroStatus === "Inativos" && plano.ativo === false);

    return bateBusca && bateStatus;
  });

  const totalAtivos = planos.filter((plano) => plano.ativo !== false).length;
  const totalInativos = planos.filter((plano) => plano.ativo === false).length;
  const valorMedio =
    planos.length > 0
      ? planos.reduce(
          (total, plano) => total + Number(plano.valor_mensal || 0),
          0
        ) / planos.length
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="bg-gradient-to-r from-blue-950 to-blue-700 rounded-3xl p-8 shadow-lg mb-8 text-white">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-blue-100 font-bold">THCloud SaaS</p>

            <h1 className="text-4xl font-black mt-2">Planos do Sistema</h1>

            <p className="text-blue-100 mt-2 max-w-3xl">
              Cadastre planos comerciais, valores, limites e módulos liberados
              para empresas clientes.
            </p>
          </div>

          <button
            onClick={abrirNovoPlano}
            className="bg-white text-blue-800 px-6 py-3 rounded-2xl font-black hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Novo Plano
          </button>
        </div>
      </div>

      {erroCarregamento && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-3xl p-5 mb-8">
          <p className="font-black">Atenção</p>
          <p className="text-sm mt-1">{erroCarregamento}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <ResumoCard
          titulo="Total de Planos"
          valor={`${planos.length}`}
          detalhe="Planos cadastrados"
          cor="text-blue-700"
          icone={<Package size={24} />}
        />

        <ResumoCard
          titulo="Ativos"
          valor={`${totalAtivos}`}
          detalhe="Planos disponíveis"
          cor="text-green-700"
          icone={<CheckCircle size={24} />}
        />

        <ResumoCard
          titulo="Inativos"
          valor={`${totalInativos}`}
          detalhe="Planos bloqueados"
          cor="text-red-700"
          icone={<XCircle size={24} />}
        />

        <ResumoCard
          titulo="Valor Médio"
          valor={moeda(valorMedio)}
          detalhe="Média mensal"
          cor="text-purple-700"
          icone={<Shield size={24} />}
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou descrição..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 text-slate-900"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-slate-900 bg-white"
          >
            <option value="Todos">Todos os status</option>
            <option value="Ativos">Ativos</option>
            <option value="Inativos">Inativos</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Lista de Planos
            </h2>

            <p className="text-slate-500">
              {carregando
                ? "Carregando planos..."
                : `${planosFiltrados.length} plano(s) encontrado(s).`}
            </p>
          </div>

          <button
            onClick={carregarPlanos}
            className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
          >
            Atualizar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500 border-b border-slate-100">
                <th className="p-4">Plano</th>
                <th className="p-4">Valor</th>
                <th className="p-4">Limites</th>
                <th className="p-4">Módulos</th>
                <th className="p-4">Status</th>
                <th className="p-4">Criado em</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {planosFiltrados.map((plano) => (
                <tr
                  key={plano.id}
                  className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50"
                >
                  <td className="p-4">
                    <p className="font-black text-slate-900">{plano.nome}</p>
                    <p className="text-slate-500 mt-1">
                      {plano.descricao || "-"}
                    </p>
                  </td>

                  <td className="p-4">
                    <p className="font-black text-green-700 text-lg">
                      {moeda(plano.valor_mensal)}
                    </p>
                    <p className="text-xs text-slate-500">por mês</p>
                  </td>

                  <td className="p-4 text-slate-700">
                    <p>
                      <strong>Usuários:</strong>{" "}
                      {numero(plano.limite_usuarios)}
                    </p>
                    <p>
                      <strong>Produtos:</strong>{" "}
                      {numero(plano.limite_produtos)}
                    </p>
                    <p>
                      <strong>Filiais:</strong> {numero(plano.limite_filiais)}
                    </p>
                  </td>

                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-700">
                      {quantidadeModulos(plano)} módulo(s)
                    </span>

                    <div className="text-xs text-slate-500 mt-2 space-y-1">
                      {plano.modulo_fiscal && <p>Fiscal</p>}
                      {plano.modulo_whatsapp && <p>WhatsApp</p>}
                      {plano.modulo_crm && <p>CRM</p>}
                      {plano.modulo_delivery && <p>Delivery</p>}
                      {plano.modulo_multiloja && <p>Multiloja</p>}
                      {plano.modulo_relatorios_premium && (
                        <p>Relatórios Premium</p>
                      )}
                    </div>
                  </td>

                  <td className="p-4">
                    {plano.ativo !== false ? (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-green-100 text-green-700">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700">
                        Inativo
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-slate-700">
                    {formatarData(plano.created_at)}
                  </td>

                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => abrirEditarPlano(plano)}
                        className="h-10 w-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center"
                        title="Editar"
                      >
                        <Edit size={17} />
                      </button>

                      <button
                        onClick={() => alterarStatus(plano)}
                        className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          plano.ativo !== false
                            ? "bg-orange-50 hover:bg-orange-100 text-orange-700"
                            : "bg-green-50 hover:bg-green-100 text-green-700"
                        }`}
                        title={plano.ativo !== false ? "Inativar" : "Ativar"}
                      >
                        <CheckCircle size={17} />
                      </button>

                      <button
                        onClick={() => excluirPlano(plano)}
                        className="h-10 w-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center"
                        title="Excluir"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {planosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhum plano encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {modoEdicao ? "Editar Plano" : "Novo Plano"}
                </h2>

                <p className="text-slate-500">
                  Defina valor, limites e módulos liberados.
                </p>
              </div>

              <button
                onClick={() => setModalAberto(false)}
                className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-3">
                  Dados do Plano
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Nome do Plano
                    </label>

                    <input
                      value={form.nome}
                      onChange={(e) =>
                        setForm({ ...form, nome: e.target.value })
                      }
                      placeholder="Ex.: Starter"
                      className="input"
                    />
                  </Campo>

                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Valor Mensal
                    </label>

                    <input
                      value={form.valor_mensal}
                      onChange={(e) =>
                        setForm({ ...form, valor_mensal: e.target.value })
                      }
                      placeholder="99.90"
                      className="input"
                    />
                  </Campo>

                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Limite de Usuários
                    </label>

                    <input
                      value={form.limite_usuarios}
                      onChange={(e) =>
                        setForm({ ...form, limite_usuarios: e.target.value })
                      }
                      placeholder="Vazio = ilimitado"
                      className="input"
                    />
                  </Campo>

                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Limite de Produtos
                    </label>

                    <input
                      value={form.limite_produtos}
                      onChange={(e) =>
                        setForm({ ...form, limite_produtos: e.target.value })
                      }
                      placeholder="Vazio = ilimitado"
                      className="input"
                    />
                  </Campo>

                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Limite de Filiais
                    </label>

                    <input
                      value={form.limite_filiais}
                      onChange={(e) =>
                        setForm({ ...form, limite_filiais: e.target.value })
                      }
                      placeholder="Vazio = ilimitado"
                      className="input"
                    />
                  </Campo>

                  <Campo>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Status
                    </label>

                    <select
                      value={form.ativo ? "ativo" : "inativo"}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          ativo: e.target.value === "ativo",
                        })
                      }
                      className="input bg-white"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </Campo>

                  <Campo className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Descrição
                    </label>

                    <textarea
                      value={form.descricao}
                      onChange={(e) =>
                        setForm({ ...form, descricao: e.target.value })
                      }
                      placeholder="Descrição comercial do plano"
                      className="input min-h-24"
                    />
                  </Campo>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 mb-3">
                  Módulos Liberados
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <CheckBoxModulo
                    titulo="Fiscal"
                    descricao="NF-e, NFC-e e rotinas fiscais"
                    marcado={form.modulo_fiscal}
                    onChange={(valor) =>
                      setForm({ ...form, modulo_fiscal: valor })
                    }
                  />

                  <CheckBoxModulo
                    titulo="WhatsApp"
                    descricao="Envios e automações"
                    marcado={form.modulo_whatsapp}
                    onChange={(valor) =>
                      setForm({ ...form, modulo_whatsapp: valor })
                    }
                  />

                  <CheckBoxModulo
                    titulo="CRM"
                    descricao="Relacionamento e oportunidades"
                    marcado={form.modulo_crm}
                    onChange={(valor) => setForm({ ...form, modulo_crm: valor })}
                  />

                  <CheckBoxModulo
                    titulo="Delivery"
                    descricao="Pedidos externos e entregas"
                    marcado={form.modulo_delivery}
                    onChange={(valor) =>
                      setForm({ ...form, modulo_delivery: valor })
                    }
                  />

                  <CheckBoxModulo
                    titulo="Multiloja"
                    descricao="Várias unidades"
                    marcado={form.modulo_multiloja}
                    onChange={(valor) =>
                      setForm({ ...form, modulo_multiloja: valor })
                    }
                  />

                  <CheckBoxModulo
                    titulo="Relatórios Premium"
                    descricao="Indicadores avançados"
                    marcado={form.modulo_relatorios_premium}
                    onChange={(valor) =>
                      setForm({
                        ...form,
                        modulo_relatorios_premium: valor,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalAberto(false)}
                className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Cancelar
              </button>

              <button
                onClick={salvarPlano}
                disabled={salvando}
                className="px-6 py-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold disabled:opacity-60"
              >
                {salvando
                  ? "Salvando..."
                  : modoEdicao
                  ? "Salvar Alterações"
                  : "Cadastrar Plano"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 1rem;
          padding: 0.75rem;
          color: rgb(15 23 42);
          outline: none;
        }

        .input:focus {
          border-color: rgb(37 99 235);
          box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
        }
      `}</style>
    </div>
  );
}

function Campo({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

function CheckBoxModulo({
  titulo,
  descricao,
  marcado,
  onChange,
}: {
  titulo: string;
  descricao: string;
  marcado: boolean;
  onChange: (valor: boolean) => void;
}) {
  return (
    <label
      className={`border rounded-2xl p-4 cursor-pointer transition ${
        marcado
          ? "border-blue-600 bg-blue-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={marcado}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4"
        />

        <div>
          <p className="font-black text-slate-900">{titulo}</p>
          <p className="text-sm text-slate-500 mt-1">{descricao}</p>
        </div>
      </div>
    </label>
  );
}

function ResumoCard({
  titulo,
  valor,
  detalhe,
  cor,
  icone,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  cor: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{titulo}</p>

          <h2 className={`text-3xl font-black mt-3 ${cor}`}>{valor}</h2>

          <p className="text-sm text-slate-500 mt-2">{detalhe}</p>
        </div>

        <div
          className={`h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center ${cor}`}
        >
          {icone}
        </div>
      </div>
    </div>
  );
}
