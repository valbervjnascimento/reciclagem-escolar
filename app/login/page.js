"use client"

import { useState } from "react";
import { auth } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const router = useRouter();

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      router.push("/painel");
    } catch (e) {
      alert("Erro no login: Verifique suas credenciais.");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.headerSection}>
          <h1 style={styles.emoji}>🌎</h1>
          <h1 style={styles.title}>EcoGestão</h1>
          <p style={styles.subtitle}>Portal do Professor</p>
        </div>

        <div style={styles.form}>
          <label style={styles.label}>E-mail</label>
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
            placeholder="••••••••" 
            onChange={(e) => setSenha(e.target.value)}
          />

          <button style={styles.btnPrimary} onClick={login}>
            Entrar no Painel
          </button>
        </div>

        <p style={styles.footerText}>
          Sistema de monitoramento de reciclagem escolar.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#0F172A", // Fundo azul escuro profundo
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "sans-serif",
    color: "#fff"
  },
  card: {
    background: "#1E293B", // Azul ardósia (mesmo dos cards do painel)
    padding: "40px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
    textAlign: "center"
  },
  headerSection: {
    marginBottom: "30px"
  },
  emoji: {
    fontSize: "48px",
    margin: "0 0 10px 0"
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: "0",
    color: "#fff"
  },
  subtitle: {
    color: "#94A3B8",
    marginTop: "5px",
    fontSize: "16px"
  },
  form: {
    textAlign: "left"
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontSize: "14px",
    color: "#CBD5F5",
    marginLeft: "4px"
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "20px",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0F172A",
    color: "#fff",
    outline: "none",
    fontSize: "16px",
    boxSizing: "border-box" // Garante que o padding não quebre a largura
  },
  btnPrimary: {
    background: "linear-gradient(135deg,#22c55e,#16a34a)", // Gradiente verde
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "16px",
    width: "100%",
    marginTop: "10px",
    transition: "opacity 0.2s"
  },
  footerText: {
    marginTop: "30px",
    fontSize: "12px",
    color: "#64748B"
  }
};