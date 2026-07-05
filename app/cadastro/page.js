"use client";

import { useState } from "react";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input } from "../components/ui";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const router = useRouter();

  const cadastrar = async () => {
    setErro("");
    if (!nome || !email || !senha) {
      setErro("Preencha todos os campos.");
      return;
    }
    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setEnviando(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "professores", uid), {
        nome,
        email,
        createdAt: Date.now(),
      });

      router.push("/painel");
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        setErro("Este e-mail já está cadastrado. Tente fazer login.");
      } else if (e.code === "auth/invalid-email") {
        setErro("Digite um e-mail válido — verifique se não há espaços ou erros de digitação.");
      } else {
        setErro("Não foi possível concluir o cadastro. Tente novamente.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-8 sm:p-10 shadow-2xl text-center">
        <span className="block text-4xl mb-2">🌱</span>
        <h1 className="text-2xl font-bold text-white">Criar Conta</h1>
        <p className="text-slate-400 text-sm mt-1 mb-8">
          Junte-se à rede de professores sustentáveis
        </p>

        <form
          className="space-y-4 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            cadastrar();
          }}
        >
          <Input
            label="Nome completo"
            placeholder="Ex: Prof. Roberto Silva"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <Input
            label="E-mail"
            type="email"
            placeholder="professor@escola.com"
            hint="Confira com atenção: será usado para recuperar sua senha."
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            autoComplete="username"
          />
          <Input
            label="Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="new-password"
          />

          {erro && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? "Criando conta..." : "Finalizar Cadastro"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700 text-xs text-slate-500 space-y-1">
          <p>Já possui uma conta?</p>
          <Link href="/login" className="text-green-400 font-semibold hover:underline">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}
