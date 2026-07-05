import { adminAuth } from "../../../lib/firebaseAdmin";

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS || "valbervjnascimento@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Confirma que a requisição vem de um usuário logado E que esse usuário
 * é um dos e-mails administradores. Espera o header:
 *   Authorization: Bearer <idToken do Firebase Auth>
 */
export async function requireAdmin(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return { error: "Token de autenticação ausente.", status: 401 };
  }

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    const email = (decoded.email || "").toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) {
      return { error: "Acesso restrito ao administrador.", status: 403 };
    }
    return { decoded };
  } catch {
    return { error: "Token inválido ou expirado. Faça login novamente.", status: 401 };
  }
}
