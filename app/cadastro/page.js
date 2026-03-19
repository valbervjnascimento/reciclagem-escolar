"use client"

import { useState } from "react";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const router = useRouter();

  const cadastrar = async () => {
    if (!nome || !email || !senha) return alert("Preencha todos os campos!");
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const uid = userCredential.user.uid;

      // Salva os dados do professor no Firestore
      await setDoc(doc(db, "professores", uid), {
        nome,
        email,
        createdAt: Date.now()
      });

      alert("Conta criada com sucesso! 🎉");
      router.push("/login");
    } catch (e) {
      alert("Erro ao cadastrar: Verifique os dados ou se o e-mail já existe.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.headerSection}>
          <h1 style={styles.emoji}>🌱</h1>
          <h1 style={styles.title}>Criar Conta</h1>
          <p style={styles.subtitle}>Junte-se à rede de professores sustentáveis</p>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>Nome Completo</label>
          <input 
            style={styles.input}
            placeholder="Ex: Prof. Roberto Silva" 
            onChange={(e) => setNome(e.target.value)}
          />

          <label style={styles.label}>E-mail Institucional</label>
          <input 
            style={styles.input}
            type="email"
            placeholder="professor@escola.com" 
            onChange={(e) => setEmail(e.target.value)}
          />

          <label style={styles.label}>Senha</label>
          <input 
            style={styles.input}
            type="password" 
            placeholder="Mínimo 6 caracteres" 
            onChange={(e) => setSenha(e.target.value)}
          />

          <button style={styles.btnPrimary} onClick={cadastrar}>
            Finalizar Cadastro
          </button>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>Já possui uma conta?</p>
          <Link href="/login" style={styles.link}>
            Fazer Login
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#0F172A",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "sans-serif",
    color: "#fff"
  },
  card: {
    background: "#1E293B",
    padding: "40px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.4)",
    textAlign: "center",
    border: "1px solid #334155"
  },
  headerSection: {
    marginBottom: "30px"
  },
  emoji: {
    fontSize: "40px",
    margin: "0 0 10px 0",
    display: "block"
  },
  title: {
    fontSize: "26px",
    fontWeight: "bold",
    margin: "0",
    color: "#fff"
  },
  subtitle: {
    color: "#94A3B8",
    marginTop: "8px",
    fontSize: "14px",
    lineHeight: "1.4"
  },
  form: {
    textAlign: "left"
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    color: "#CBD5F5",
    fontWeight: "500",
    marginLeft: "2px"
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    marginBottom: "18px",
    borderRadius: "10px",
    border: "1px solid #334155",
    background: "#0F172A",
    color: "#fff",
    outline: "none",
    fontSize: "15px",
    boxSizing: "border-box",
    transition: "border-color 0.2s"
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
    width: "100%",
    marginTop: "5px",
    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.2)"
  },
  footer: {
    marginTop: "25px",
    borderTop: "1px solid #334155",
    paddingTop: "20px"
  },
  footerText: {
    fontSize: "14px",
    color: "#64748B",
    margin: "0 0 5px 0"
  },
  link: {
    color: "#22c55e",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "600"
  }
};