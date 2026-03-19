"use client"

import Link from "next/link";

export default function Home() {
  return (
    <div style={styles.container}>
      {/* O overlay aqui ajuda a dar profundidade ao fundo escuro */}
      <div style={styles.overlay}>

        <div style={styles.card}>
          <div style={styles.iconContainer}>
            <span style={styles.emoji}>🌎</span>
          </div>

          <h1 style={styles.logo}>EcoGestão Escolar</h1>

          <p style={styles.subtitle}>
            Transformando a reciclagem em aprendizado e gamificação para sua escola.
          </p>

          <div style={styles.buttons}>
            <Link href="/login" style={styles.loginBtn}>
              Entrar como Professor
            </Link>

            <Link href="/cadastro" style={styles.cadastroBtn}>
              Criar Nova Conta
            </Link>
          </div>

          <div style={styles.footer}>
            v1.0 • Gestão Sustentável
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    // Gradiente sutil do azul profundo para um tom levemente mais claro
    background: "radial-gradient(circle at center, #1E293B 0%, #0F172A 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "sans-serif",
    color: "#fff"
  },

  overlay: {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "rgba(0,0,0,0.2)"
  },

  card: {
    backgroundColor: "#1E293B", // Mesmo azul dos outros componentes
    padding: "50px 40px",
    borderRadius: "24px",
    textAlign: "center",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
    width: "100%",
    maxWidth: "400px",
    border: "1px solid #334155" // Borda sutil para dar acabamento
  },

  iconContainer: {
    marginBottom: "20px"
  },

  emoji: {
    fontSize: "64px",
    display: "block"
  },

  logo: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#fff",
    letterSpacing: "-0.5px"
  },

  subtitle: {
    fontSize: "16px",
    color: "#94A3B8", // Cinza azulado suave
    marginBottom: "40px",
    lineHeight: "1.5"
  },

  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  loginBtn: {
    background: "linear-gradient(135deg, #22c55e, #16a34a)", // Verde vibrante
    color: "white",
    padding: "14px",
    borderRadius: "10px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "16px",
    transition: "transform 0.2s ease",
    display: "block"
  },

  cadastroBtn: {
    backgroundColor: "transparent",
    color: "#22c55e",
    padding: "14px",
    borderRadius: "10px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "16px",
    border: "2px solid #22c55e", // Botão outline para diferenciar
    display: "block",
    transition: "background 0.2s ease"
  },

  footer: {
    marginTop: "30px",
    fontSize: "12px",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "1px"
  }
};