"use client";

import { useState } from "react";
import { auth } from "../../firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Modal } from "../components/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);
  const router = useRouter();

  // Estado do modal "Esqueci minha senha"
  const [modalAberto, setModalAberto] = useState(false);
  const [emailRecuperacao, setEmailRecuperacao] = useState("");
  const [statusRecuperacao, setStatusRecuperacao] = useState(null); // "enviando" | "enviado"

  const login = async () => {
    setErro("");
    if (!email || !senha) {
      setErro("Preencha e-mail e senha.");
      return;
    }
    setEntrando(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      router.push("/painel");
    } catch {
      setErro("Não foi possível entrar. Verifique seu e-mail e senha.");
    } finally {
      setEntrando(false);
    }
  };

  const enviarRecuperacao = async () => {
    if (!emailRecuperacao) return;
    setStatusRecuperacao("enviando");
    try {
      await sendPasswordResetEmail(auth, emailRecuperacao);
      setStatusRecuperacao("enviado");
    } catch {
      // Por segurança não revelamos se o e-mail existe ou não: mesma
      // mensagem de sucesso em qualquer caso.
      setStatusRecuperacao("enviado");
    }
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEmailRecuperacao("");
    setStatusRecuperacao(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-8 sm:p-10 shadow-2xl text-center">
        <span className="block text-5xl mb-2">🌎</span>
        <h1 className="text-2xl font-bold text-white">EcoGestão</h1>
        <p className="text-slate-400 text-sm mt-1 mb-8">Portal do Professor</p>

        <form
          className="space-y-4 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            login();
          }}
        >
          <Input
            label="E-mail"
            type="email"
            placeholder="professor@escola.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
          />

          {erro && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={entrando}>
            {entrando ? "Entrando..." : "Entrar no Painel"}
          </Button>
        </form>

        <button
          onClick={() => {
            setEmailRecuperacao(email);
            setModalAberto(true);
          }}
          className="mt-4 text-xs text-green-400 hover:text-green-300 hover:underline"
        >
          Esqueci minha senha
        </button>

        <div className="mt-8 pt-6 border-t border-slate-700 text-xs text-slate-500 space-y-1">
          <p>Ainda não tem conta?</p>
          <Link href="/cadastro" className="text-green-400 font-semibold hover:underline">
            Criar conta de professor
          </Link>
        </div>
      </div>

      <Modal
        open={modalAberto}
        onClose={fecharModal}
        title="Recuperar senha"
        footer={
          statusRecuperacao === "enviado" ? (
            <Button variant="secondary" onClick={fecharModal}>Fechar</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={fecharModal}>Cancelar</Button>
              <Button
                onClick={enviarRecuperacao}
                disabled={!emailRecuperacao || statusRecuperacao === "enviando"}
              >
                {statusRecuperacao === "enviando" ? "Enviando..." : "Enviar link"}
              </Button>
            </>
          )
        }
      >
        {statusRecuperacao === "enviado" ? (
          <p>
            Se <strong className="text-white">{emailRecuperacao}</strong> estiver cadastrado,
            enviamos um link para redefinir a senha. Confira também a caixa de spam.
          </p>
        ) : (
          <div className="space-y-3">
            <p>
              Informe o e-mail usado no cadastro. Enviaremos um link para você criar uma nova
              senha.
            </p>
            <Input
              type="email"
              placeholder="professor@escola.com"
              value={emailRecuperacao}
              onChange={(e) => setEmailRecuperacao(e.target.value)}
            />
            <p className="text-[11px] text-slate-500">
              Cadastrou com um e-mail errado ou não tem mais acesso a ele? Peça para o
              administrador da escola corrigir seu e-mail ou gerar uma senha temporária para
              você no Painel Administrativo.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
