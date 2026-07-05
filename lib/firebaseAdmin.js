// ATENÇÃO: este arquivo só deve ser importado por código que roda no
// servidor (rotas em app/api/**). Nunca importe isso em componentes com
// "use client" — a service account não pode ir para o navegador.
//
// A inicialização é "lazy" (só acontece quando alguém de fato chama
// adminAuth()/adminDb()) para que `next build` não falhe caso a variável
// de ambiente ainda não esteja configurada no momento do build.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function carregarServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      "Variável de ambiente FIREBASE_SERVICE_ACCOUNT não configurada. " +
        "Veja o README.md, seção 'Configurando o painel administrativo'."
    );
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT contém um JSON inválido. Copie o conteúdo " +
        "completo do arquivo baixado no Firebase Console (Configurações do " +
        "projeto > Contas de serviço > Gerar nova chave privada)."
    );
  }
}

function obterApp() {
  if (getApps().length) return getApps()[0];
  return initializeApp({ credential: cert(carregarServiceAccount()) });
}

export function adminAuth() {
  return getAuth(obterApp());
}

export function adminDb() {
  return getFirestore(obterApp());
}
