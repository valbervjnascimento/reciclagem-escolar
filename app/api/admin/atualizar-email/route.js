import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebaseAdmin";
import { requireAdmin } from "../../_lib/requireAdmin";

export async function POST(request) {
  const verificacao = await requireAdmin(request);
  if (verificacao.error) {
    return NextResponse.json({ erro: verificacao.error }, { status: verificacao.status });
  }

  const { uid, novoEmail } = await request.json();
  if (!uid || !novoEmail) {
    return NextResponse.json(
      { erro: "Campos 'uid' e 'novoEmail' são obrigatórios." },
      { status: 400 }
    );
  }

  try {
    await adminAuth().updateUser(uid, { email: novoEmail, emailVerified: false });
    await adminDb().collection("professores").doc(uid).set(
      {
        email: novoEmail,
        emailCorrigidoEm: Date.now(),
        emailCorrigidoPor: verificacao.decoded.email,
      },
      { merge: true }
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { erro: "Falha ao atualizar o e-mail: " + e.message },
      { status: 500 }
    );
  }
}
