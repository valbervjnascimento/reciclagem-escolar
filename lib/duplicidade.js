// Regras de detecção de possível duplicidade de registros de coleta.
//
// Importante: NUNCA apagamos ou bloqueamos o registro por causa disso.
// A ideia é apenas sinalizar para o professor/administrador que aquele
// lançamento parece repetido, para que uma pessoa decida o que fazer.

/**
 * Normaliza um timestamp (Date, number ou Firestore Timestamp) para o
 * identificador do dia (ano-mes-dia), ignorando hora/minuto/segundo.
 */
export function diaDoRegistro(valor) {
  let data;
  if (!valor) return null;
  if (typeof valor?.toDate === "function") data = valor.toDate(); // Firestore Timestamp
  else data = new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  return `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
}

/**
 * Verifica se um registro (novo ou em edição) é uma possível duplicidade
 * de algum outro já existente na mesma turma.
 *
 * @param {object} registro - { alunoId, data, plastico, aluminio, frasco }
 * @param {object[]} existentes - lista de registros já salvos da turma
 * @param {string|null} ignorarId - id do próprio registro (ao editar)
 * @returns {null | { nivel: "forte"|"fraca", registroSemelhanteId: string, ocorrencias: number }}
 */
export function detectarDuplicidade(registro, existentes, ignorarId = null) {
  const dia = diaDoRegistro(registro.data);
  if (!dia || !registro.alunoId) return null;

  const candidatos = existentes.filter((r) => {
    if (ignorarId && r.id === ignorarId) return false;
    if (r.alunoId !== registro.alunoId) return false;
    return diaDoRegistro(r.data) === dia;
  });

  if (candidatos.length === 0) return null;

  const valoresIguais = (r) =>
    Number(r.plastico || 0) === Number(registro.plastico || 0) &&
    Number(r.aluminio || 0) === Number(registro.aluminio || 0) &&
    Number(r.frasco || 0) === Number(registro.frasco || 0);

  const identico = candidatos.find(valoresIguais);

  return {
    nivel: identico ? "forte" : "fraca",
    registroSemelhanteId: (identico || candidatos[0]).id,
    ocorrencias: candidatos.length,
  };
}
