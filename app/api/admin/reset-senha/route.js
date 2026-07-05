import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebaseAdmin";
import { requireAdmin } from "../../_lib/requireAdmin";

// Não existe forma segura (nem no Firebase, nem em nenhum sistema sério)
// de "ver" a senha original de um usuário — ela é armazenada com hash
// irreversível. O equivalente seguro é: o admin gera uma senha temporária
// nova, ela é exibida UMA única vez na tela, e o admin a entrega
// pessoalmente ao professor (que deve trocá-la no primeiro acesso).
function gerarSenhaTemporaria() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let senha = "";
  for (let i = 0; i < 10; i++) {
    senha += chars[Math.floor(Math.random() * chars.length)];
  }
  return senha;
}

export async function POST(request) {
  const verificacao = await requireAdmin(request);
  if (verificacao.error) {
    return NextResponse.json({ erro: verificacao.error }, { status: verificacao.status });
  }

  const { uid } = await request.json();
  if (!uid) {
    return NextResponse.json({ erro: "Campo 'uid' é obrigatório." }, { status: 400 });
  }

  try {
    const senhaTemporaria = gerarSenhaTemporaria();
    await adminAuth().updateUser(uid, { password: senhaTemporaria });

    await adminDb().collection("professores").doc(uid).set(
      {
        senhaResetadaEm: Date.now(),
        senhaResetadaPor: verificacao.decoded.email,
      },
      { merge: true }
    );

    return NextResponse.json({ senhaTemporaria });
  } catch (e) {
    return NextResponse.json(
      { erro: "Falha ao resetar a senha: " + e.message },
      { status: 500 }
    );
  }
}
