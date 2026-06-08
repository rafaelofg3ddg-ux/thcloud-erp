export function getEmpresaId() {
  if (typeof window === "undefined") return null;

  const usuario = localStorage.getItem("th_usuario");

  if (!usuario) return null;

  const dados = JSON.parse(usuario);

  return dados.empresa_id || null;
}